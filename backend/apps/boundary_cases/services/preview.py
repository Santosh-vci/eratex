from datetime import date
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.boundary_cases.models import (
    BoundaryCaseEvent,
    BoundaryEventStatus,
    BoundaryEventType,
    BoundaryImpactPreview,
    BoundarySeverity,
    BoundaryTriggerSource,
)
from apps.common.models import RiskStatus
from apps.orders.models import OrderStage, ProductionOrder
from apps.organization.models import Workcenter
from apps.planning.models import PlannedWorkItem
from apps.workcenters.models import CapacityAdjustment
from apps.workcenters.services.load import calculate_constraint_status, calculate_load

IRREVERSIBLE_CANCELLATION_STAGES = {
    OrderStage.CUTTING,
    OrderStage.SEWING,
    OrderStage.WASHING,
    OrderStage.FINISHING,
    OrderStage.PACKING,
    OrderStage.SHIPMENT_READY,
    OrderStage.SHIPPED,
}


def calculate_boundary_impact(
    event_type: str, payload: dict[str, Any], user=None
) -> dict[str, Any]:
    if event_type in {
        BoundaryEventType.CAPACITY_LOSS,
        BoundaryEventType.CAPACITY_ADDITION,
        BoundaryEventType.MACHINE_BREAKDOWN,
        BoundaryEventType.ABSENTEEISM_SPIKE,
    }:
        return _capacity_impact(event_type, payload)
    if event_type == BoundaryEventType.ORDER_CANCELLED:
        return _order_cancellation_impact(payload)
    if event_type in {BoundaryEventType.ORDER_QTY_CHANGED, BoundaryEventType.DELIVERY_DATE_CHANGED}:
        return _order_change_impact(event_type, payload)
    if event_type == BoundaryEventType.SHIPMENT_PULL_IN:
        return _shipment_pull_in_impact(payload)
    if event_type in {BoundaryEventType.REWASH_REQUIRED, BoundaryEventType.REWASH_REPEAT_EXCEEDED}:
        return _rewash_impact(event_type, payload)
    return _generic_impact(event_type, payload)


@transaction.atomic
def create_boundary_case(
    *,
    event_type: str,
    payload: dict[str, Any],
    created_by=None,
    trigger_source: str = BoundaryTriggerSource.USER,
) -> BoundaryCaseEvent:
    impact = calculate_boundary_impact(event_type, payload, created_by)
    event = BoundaryCaseEvent.objects.create(
        event_no=_next_event_no(),
        event_type=event_type,
        status=BoundaryEventStatus.IMPACT_PREVIEWED,
        severity=_severity_from_risk(impact["risk_after"]),
        linked_order=_resolve_order(payload),
        linked_workcenter=_resolve_workcenter(payload),
        event_stage=str(payload.get("eventStage", "")),
        trigger_source=trigger_source,
        old_value_json=payload.get("oldValue", {}),
        new_value_json=payload.get("newValue", payload),
        affected_quantity=int(payload.get("affectedQuantity") or payload.get("quantityDelta") or 0),
        affected_capacity_minutes=int(impact["capacity_impact"].get("minutesDelta", 0)),
        affected_shipment_date=_parse_date(payload.get("newShipmentDate")),
        risk_before=impact["risk_before"],
        risk_after=impact["risk_after"],
        recommended_action="; ".join(impact["recommended_actions"]),
        approval_required=impact["approval_required"],
        owner=created_by,
        created_by=created_by,
        updated_by=created_by,
        metadata_json={**payload.get("metadata", {}), "impact": impact},
    )
    _persist_preview(event, event_type, impact, created_by)
    write_audit_event(
        event_code="BOUNDARY_CASE_CREATED",
        entity_type="BoundaryCaseEvent",
        entity_id=str(event.id),
        entity_display_code=event.event_no,
        action="create",
        performed_by=created_by,
        new_value_json={"eventType": event.event_type, "riskAfter": event.risk_after},
        source="WEB" if created_by else "SEED",
    )
    return event


@transaction.atomic
def preview_boundary_case(*, event_type: str, payload: dict[str, Any], user=None) -> dict[str, Any]:
    impact = calculate_boundary_impact(event_type, payload, user)
    BoundaryImpactPreview.objects.create(
        preview_type=event_type,
        affected_orders_json=impact["affected_orders"],
        affected_workcenters_json=impact["affected_workcenters"],
        affected_wip_json=impact["affected_wip"],
        affected_shipments_json=impact["affected_shipments"],
        capacity_before_json=impact["capacity_impact"].get("before", {}),
        capacity_after_json=impact["capacity_impact"].get("after", {}),
        risk_before=impact["risk_before"],
        risk_after=impact["risk_after"],
        recommended_actions_json=impact["recommended_actions"],
        warnings_json=impact["warnings"],
        blocking_reasons_json=impact["blocking_reasons"],
        approval_required=impact["approval_required"],
        created_by=user,
        updated_by=user,
    )
    write_audit_event(
        event_code="BOUNDARY_IMPACT_PREVIEWED",
        entity_type="BoundaryImpactPreview",
        entity_id="preview",
        action="preview",
        performed_by=user,
        new_value_json={"eventType": event_type, "riskAfter": impact["risk_after"]},
        source="WEB" if user else "SYSTEM",
    )
    return impact


@transaction.atomic
def approve_boundary_action(event: BoundaryCaseEvent, *, approved_by=None) -> BoundaryCaseEvent:
    if event.status not in {
        BoundaryEventStatus.IMPACT_PREVIEWED,
        BoundaryEventStatus.ACTION_PROPOSED,
        BoundaryEventStatus.APPROVAL_REQUIRED,
        BoundaryEventStatus.OPEN,
    }:
        raise ValidationError("Only open or previewed boundary actions can be approved.")
    event.status = BoundaryEventStatus.APPROVED
    event.approved_by = approved_by
    event.approved_at = timezone.now()
    event.updated_by = approved_by
    event.save(update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"])
    write_audit_event(
        event_code="BOUNDARY_ACTION_APPROVED",
        entity_type="BoundaryCaseEvent",
        entity_id=str(event.id),
        entity_display_code=event.event_no,
        action="approve",
        performed_by=approved_by,
        new_value_json={"status": event.status},
        source="WEB" if approved_by else "SYSTEM",
    )
    return event


@transaction.atomic
def apply_boundary_action(event: BoundaryCaseEvent, *, applied_by=None) -> BoundaryCaseEvent:
    if event.approval_required and event.status != BoundaryEventStatus.APPROVED:
        raise ValidationError("Approval is required before applying this boundary action.")
    if event.event_type in {BoundaryEventType.CAPACITY_LOSS, BoundaryEventType.CAPACITY_ADDITION}:
        _apply_capacity_adjustment(event, applied_by)
    event.status = BoundaryEventStatus.APPLIED
    event.applied_by = applied_by
    event.applied_at = timezone.now()
    event.updated_by = applied_by
    event.save(update_fields=["status", "applied_by", "applied_at", "updated_by", "updated_at"])
    write_audit_event(
        event_code="BOUNDARY_ACTION_APPLIED",
        entity_type="BoundaryCaseEvent",
        entity_id=str(event.id),
        entity_display_code=event.event_no,
        action="apply",
        performed_by=applied_by,
        new_value_json={"status": event.status},
        source="WEB" if applied_by else "SYSTEM",
    )
    return event


def _capacity_impact(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    workcenter = _require_workcenter(payload)
    start = _parse_date(payload.get("eventDate")) or timezone.localdate()
    minutes = abs(int(payload.get("minutesDelta") or payload.get("affectedCapacityMinutes") or 0))
    if event_type in {
        BoundaryEventType.CAPACITY_LOSS,
        BoundaryEventType.MACHINE_BREAKDOWN,
        BoundaryEventType.ABSENTEEISM_SPIKE,
    }:
        minutes_delta = -minutes
    else:
        minutes_delta = minutes
    before = calculate_load(workcenter, start_date=start, end_date=start, persist=False)
    after_available = max(before["availableMinutes"] + minutes_delta, 0)
    planned = before["plannedLoadMinutes"]
    utilization = Decimal("0.00")
    if after_available:
        utilization = (Decimal(planned) / Decimal(after_available) * Decimal("100")).quantize(
            Decimal("0.01")
        )
    constraint, risk_after = calculate_constraint_status(utilization)
    blockers = (
        ["Capacity drops below active planned load."]
        if risk_after in {RiskStatus.ACTION, RiskStatus.CRITICAL}
        else []
    )
    return _impact_payload(
        can_apply=not blockers,
        approval_required=bool(minutes_delta > 0 or blockers),
        risk_before=before["riskStatus"],
        risk_after=risk_after,
        affected_orders=_affected_orders_for_workcenter(workcenter, start, start),
        affected_workcenters=[_workcenter_ref(workcenter)],
        affected_shipments=[],
        capacity_impact={
            "minutesDelta": minutes_delta,
            "before": {
                "availableMinutes": before["availableMinutes"],
                "plannedLoadMinutes": planned,
                "riskStatus": before["riskStatus"],
            },
            "after": {
                "availableMinutes": after_available,
                "plannedLoadMinutes": planned,
                "utilizationPercent": float(utilization),
                "constraintStatus": constraint,
                "riskStatus": risk_after,
            },
        },
        recommended_actions=[
            "Approve overtime/recovery"
            if minutes_delta > 0
            else "Move load or approve recovery capacity"
        ],
        warnings=[],
        blocking_reasons=blockers,
    )


def _order_cancellation_impact(payload: dict[str, Any]) -> dict[str, Any]:
    order = _require_order(payload)
    work_items = PlannedWorkItem.objects.filter(order=order, is_active=True).select_related(
        "workcenter"
    )
    released_minutes = work_items.aggregate(total=Sum("load_minutes"))["total"] or 0
    blockers = []
    if order.current_stage in IRREVERSIBLE_CANCELLATION_STAGES:
        blockers.append(
            f"Cancellation in {order.current_stage} requires WIP or disposition decision."
        )
    risk_after = RiskStatus.CRITICAL if blockers else RiskStatus.WATCH
    return _impact_payload(
        can_apply=not blockers,
        approval_required=True,
        risk_before=order.risk_status,
        risk_after=risk_after,
        affected_orders=[_order_ref(order)],
        affected_workcenters=[_workcenter_ref(item.workcenter) for item in work_items],
        affected_wip=[{"stage": order.current_stage, "dispositionRequired": bool(blockers)}],
        affected_shipments=[
            {"orderNo": order.order_no, "shipDate": order.committed_ship_date.isoformat()}
        ],
        capacity_impact={"minutesDelta": -int(released_minutes)},
        recommended_actions=["Preview material liability and release future capacity"],
        warnings=["Material liability may remain after procurement or fabric receipt."],
        blocking_reasons=blockers,
    )


def _order_change_impact(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    order = _require_order(payload)
    new_qty = int(payload.get("newQuantity") or order.order_qty)
    blockers = []
    if new_qty <= 0:
        blockers.append("New order quantity must be positive.")
    if new_qty < 0:
        blockers.append("Quantity cannot be reduced below shipped quantity.")
    quantity_delta = new_qty - order.order_qty
    risk_after = RiskStatus.WATCH if quantity_delta else order.risk_status
    return _impact_payload(
        can_apply=not blockers,
        approval_required=True,
        risk_before=order.risk_status,
        risk_after=risk_after,
        affected_orders=[_order_ref(order)],
        affected_workcenters=[],
        affected_shipments=[
            {
                "oldDate": order.committed_ship_date.isoformat(),
                "newDate": payload.get("newCommittedShipDate"),
            }
        ],
        capacity_impact={"quantityDelta": quantity_delta},
        recommended_actions=["Approve request after reviewing capacity and material impact"],
        warnings=[],
        blocking_reasons=blockers,
    )


def _shipment_pull_in_impact(payload: dict[str, Any]) -> dict[str, Any]:
    order = _require_order(payload)
    new_date = _parse_date(payload.get("newShipmentDate"))
    if not new_date:
        raise ValidationError("newShipmentDate is required.")
    days_lost = (order.committed_ship_date - new_date).days
    blockers = []
    if days_lost <= 0:
        blockers.append("Shipment pull-in date must be earlier than committed ship date.")
    work_items = PlannedWorkItem.objects.filter(order=order, is_active=True).select_related(
        "workcenter"
    )
    gaps = []
    for item in work_items:
        load = calculate_load(
            item.workcenter,
            start_date=item.planned_start_date,
            end_date=item.planned_end_date,
            persist=False,
        )
        gaps.append(
            {
                "workcenterCode": item.workcenter.code,
                "capacityGapMinutes": max(load["plannedLoadMinutes"] - load["availableMinutes"], 0),
                "riskStatus": load["riskStatus"],
            }
        )
    if any(gap["capacityGapMinutes"] > 0 for gap in gaps):
        blockers.append("One or more workcenters have no spare capacity for pull-in.")
    return _impact_payload(
        can_apply=not blockers,
        approval_required=True,
        risk_before=order.risk_status,
        risk_after=RiskStatus.ACTION if blockers else RiskStatus.WATCH,
        affected_orders=[_order_ref(order)],
        affected_workcenters=[_workcenter_ref(item.workcenter) for item in work_items],
        affected_shipments=[
            {
                "oldShipmentDate": order.committed_ship_date.isoformat(),
                "newRequestedShipmentDate": new_date.isoformat(),
                "daysLost": max(days_lost, 0),
                "capacityGapByWorkcenter": gaps,
            }
        ],
        capacity_impact={"capacityGapByWorkcenter": gaps},
        recommended_actions=["Review overtime, workcenter load, wash risk, and release priority"],
        warnings=["Pull-in can increase wash, sewing, packing, and shipment readiness risk."],
        blocking_reasons=blockers,
    )


def _rewash_impact(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    cycles = int(payload.get("washCycleNo") or 1)
    max_cycles = int(payload.get("maxRepeatCycles") or 1)
    minutes = int(payload.get("capacityMinutesConsumed") or 0)
    approval = cycles > max_cycles or event_type == BoundaryEventType.REWASH_REPEAT_EXCEEDED
    return _impact_payload(
        can_apply=not approval,
        approval_required=approval,
        risk_before=payload.get("riskBefore", RiskStatus.WATCH),
        risk_after=RiskStatus.ACTION if approval else RiskStatus.WATCH,
        affected_orders=[],
        affected_workcenters=[],
        affected_wip=[{"washCycleNo": cycles, "maxRepeatCycles": max_cycles}],
        affected_shipments=[],
        capacity_impact={"minutesDelta": minutes},
        recommended_actions=["Approve repeat wash before consuming additional wash capacity"],
        warnings=["Repeat wash consumes capacity and can increase shipment risk."],
        blocking_reasons=["Repeat wash exceeds approved max cycles."] if approval else [],
    )


def _generic_impact(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    return _impact_payload(
        can_apply=True,
        approval_required=True,
        risk_before=payload.get("riskBefore", RiskStatus.ON_TRACK),
        risk_after=payload.get("riskAfter", RiskStatus.WATCH),
        affected_orders=[],
        affected_workcenters=[],
        affected_shipments=[],
        capacity_impact={},
        recommended_actions=["Review and approve before applying schedule change"],
        warnings=[],
        blocking_reasons=[],
    )


def _impact_payload(
    *,
    can_apply: bool,
    approval_required: bool,
    risk_before: str,
    risk_after: str,
    affected_orders: list[dict[str, Any]],
    affected_workcenters: list[dict[str, Any]],
    affected_shipments: list[dict[str, Any]],
    capacity_impact: dict[str, Any],
    recommended_actions: list[str],
    warnings: list[str],
    blocking_reasons: list[str],
    affected_wip: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "can_apply": can_apply,
        "approval_required": approval_required,
        "risk_before": risk_before,
        "risk_after": risk_after,
        "affected_orders": affected_orders,
        "affected_workcenters": affected_workcenters,
        "affected_wip": affected_wip or [],
        "affected_shipments": affected_shipments,
        "capacity_impact": capacity_impact,
        "recommended_actions": recommended_actions,
        "warnings": warnings,
        "blocking_reasons": blocking_reasons,
    }


def _persist_preview(event, preview_type, impact, user) -> BoundaryImpactPreview:
    return BoundaryImpactPreview.objects.create(
        boundary_case_event=event,
        preview_type=preview_type,
        affected_orders_json=impact["affected_orders"],
        affected_workcenters_json=impact["affected_workcenters"],
        affected_wip_json=impact["affected_wip"],
        affected_shipments_json=impact["affected_shipments"],
        capacity_before_json=impact["capacity_impact"].get("before", {}),
        capacity_after_json=impact["capacity_impact"].get("after", {}),
        risk_before=impact["risk_before"],
        risk_after=impact["risk_after"],
        recommended_actions_json=impact["recommended_actions"],
        warnings_json=impact["warnings"],
        blocking_reasons_json=impact["blocking_reasons"],
        approval_required=impact["approval_required"],
        created_by=user,
        updated_by=user,
    )


def _apply_capacity_adjustment(event, user) -> None:
    if not event.linked_workcenter:
        raise ValidationError("Capacity events require a linked workcenter.")
    event_date = event.affected_shipment_date or timezone.localdate()
    CapacityAdjustment.objects.update_or_create(
        workcenter=event.linked_workcenter,
        adjustment_date=event_date,
        adjustment_type=CapacityAdjustment.AdjustmentType.OVERTIME
        if event.affected_capacity_minutes > 0
        else CapacityAdjustment.AdjustmentType.DOWNTIME,
        reason=f"{event.event_no}: {event.recommended_action}",
        defaults={
            "minutes_delta": event.affected_capacity_minutes,
            "status": "APPROVED",
            "approved_by": event.approved_by or user,
            "is_active": True,
        },
    )


def _affected_orders_for_workcenter(workcenter, start, end):
    return [
        _order_ref(item.order)
        for item in PlannedWorkItem.objects.filter(
            workcenter=workcenter,
            planned_start_date__lte=end,
            planned_end_date__gte=start,
            is_active=True,
        ).select_related("order")
    ]


def _next_event_no() -> str:
    return f"BCE-{timezone.now():%Y%m%d%H%M%S%f}"


def _resolve_order(payload):
    order_id = payload.get("orderId")
    if not order_id and payload.get("orderNo"):
        return ProductionOrder.objects.filter(order_no=payload["orderNo"]).first()
    return ProductionOrder.objects.filter(id=order_id).first() if order_id else None


def _require_order(payload):
    order = _resolve_order(payload)
    if not order:
        raise ValidationError("A valid orderId or orderNo is required.")
    return order


def _resolve_workcenter(payload):
    workcenter_id = payload.get("workcenterId")
    if not workcenter_id and payload.get("workcenterCode"):
        return Workcenter.objects.filter(code=payload["workcenterCode"]).first()
    return Workcenter.objects.filter(id=workcenter_id).first() if workcenter_id else None


def _require_workcenter(payload):
    workcenter = _resolve_workcenter(payload)
    if not workcenter:
        raise ValidationError("A valid workcenterId or workcenterCode is required.")
    return workcenter


def _order_ref(order):
    return {
        "orderId": str(order.id),
        "orderNo": order.order_no,
        "stage": order.current_stage,
        "quantity": order.order_qty,
        "shipDate": order.committed_ship_date.isoformat(),
    }


def _workcenter_ref(workcenter):
    return {
        "workcenterId": str(workcenter.id),
        "workcenterCode": workcenter.code,
        "workcenterType": workcenter.workcenter_type,
    }


def _parse_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def _severity_from_risk(risk: str) -> str:
    if risk == RiskStatus.CRITICAL:
        return BoundarySeverity.CRITICAL
    if risk == RiskStatus.ACTION:
        return BoundarySeverity.HIGH
    if risk == RiskStatus.WATCH:
        return BoundarySeverity.MEDIUM
    return BoundarySeverity.LOW
