from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import RiskStatus
from apps.orders.models import OrderStatus, ProductionOrder
from apps.pcd_readiness.models import PCDReadinessStatus
from apps.planning.models import (
    PlanChangeRequest,
    PlanChangeStatus,
    PlanChangeType,
    PlannedWorkItem,
    PlannedWorkItemStatus,
    PlanningHorizon,
    PlanVersion,
    PlanVersionStatus,
)
from apps.style_technical.models import OperationBulletin
from apps.workcenters.services.load import calculate_load


def eligible_order_queryset():
    return (
        ProductionOrder.objects.filter(
            is_active=True,
            order_status=OrderStatus.ACTIVE,
            pcd_readiness__readiness_status__in=[
                PCDReadinessStatus.READY,
                PCDReadinessStatus.CONDITIONALLY_READY,
                PCDReadinessStatus.RELEASED,
            ],
        )
        .select_related("customer", "buyer", "style", "product_type", "pcd_readiness")
        .order_by("committed_ship_date", "order_no")
    )


def get_eligible_backlog(plan_version: PlanVersion | None = None):
    orders = eligible_order_queryset()
    if plan_version:
        planned_ids = plan_version.work_items.filter(is_active=True).values_list(
            "order_id",
            flat=True,
        )
        orders = orders.exclude(id__in=planned_ids)
    return orders


@transaction.atomic
def create_plan_version(
    *,
    horizon: PlanningHorizon,
    created_by=None,
    notes: str = "",
) -> PlanVersion:
    latest = horizon.versions.aggregate(max_version=Max("version_no"))["max_version"] or 0
    plan = PlanVersion.objects.create(
        horizon=horizon,
        version_no=latest + 1,
        notes=notes,
        created_by=created_by,
        updated_by=created_by,
    )
    write_audit_event(
        event_code="PLAN_VERSION_CREATED",
        entity_type="PlanVersion",
        entity_id=str(plan.id),
        entity_display_code=str(plan),
        action="create",
        performed_by=created_by,
        new_value_json={"status": plan.status},
        source="WEB" if created_by else "SEED",
    )
    return plan


@transaction.atomic
def assign_work_item(
    *,
    plan_version: PlanVersion,
    order: ProductionOrder,
    workcenter,
    planned_quantity: int,
    planned_start_date,
    planned_end_date=None,
    line=None,
    sequence_no: int = 10,
    assigned_by=None,
) -> PlannedWorkItem:
    _ensure_plan_editable(plan_version)
    if not eligible_order_queryset().filter(id=order.id).exists():
        raise ValidationError("Only PCD-ready Phase 3 orders can be planned.")
    if planned_quantity <= 0:
        raise ValidationError("Planned quantity must be positive.")
    planned_end_date = planned_end_date or planned_start_date
    if planned_end_date < planned_start_date:
        raise ValidationError("Plan end date cannot be before start date.")
    load_minutes = _calculate_order_load_minutes(order, planned_quantity)
    impact = calculate_plan_impact(
        plan_version=plan_version,
        order=order,
        workcenter=workcenter,
        planned_quantity=planned_quantity,
        planned_start_date=planned_start_date,
        planned_end_date=planned_end_date,
    )
    work_item, created = PlannedWorkItem.objects.update_or_create(
        plan_version=plan_version,
        order=order,
        workcenter=workcenter,
        defaults={
            "line": line,
            "planned_start_date": planned_start_date,
            "planned_end_date": planned_end_date,
            "planned_quantity": planned_quantity,
            "load_minutes": load_minutes,
            "sequence_no": sequence_no,
            "status": PlannedWorkItemStatus.RELEASE_READY
            if impact["after"]["riskStatus"] in {RiskStatus.ON_TRACK, RiskStatus.WATCH}
            else PlannedWorkItemStatus.BLOCKED,
            "risk_status": impact["after"]["riskStatus"],
            "updated_by": assigned_by,
            "is_active": True,
        },
    )
    if created:
        work_item.created_by = assigned_by
        work_item.save(update_fields=["created_by", "updated_at"])
    calculate_load(
        workcenter,
        start_date=planned_start_date,
        end_date=planned_end_date,
        horizon=plan_version.horizon,
    )
    write_audit_event(
        event_code="PLAN_WORK_ITEM_ASSIGNED",
        entity_type="PlannedWorkItem",
        entity_id=str(work_item.id),
        entity_display_code=f"{plan_version}:{order.order_no}",
        action="assign",
        performed_by=assigned_by,
        new_value_json={
            "orderNo": order.order_no,
            "workcenter": workcenter.code,
            "plannedQuantity": planned_quantity,
            "loadMinutes": load_minutes,
        },
        source="WEB" if assigned_by else "SEED",
    )
    return work_item


def calculate_plan_impact(
    *,
    plan_version: PlanVersion,
    order: ProductionOrder,
    workcenter,
    planned_quantity: int,
    planned_start_date,
    planned_end_date=None,
) -> dict[str, object]:
    planned_end_date = planned_end_date or planned_start_date
    before = calculate_load(
        workcenter,
        start_date=planned_start_date,
        end_date=planned_end_date,
        horizon=plan_version.horizon,
        persist=False,
    )
    added_minutes = _calculate_order_load_minutes(order, planned_quantity)
    after_available = before["availableMinutes"]
    after_load = before["plannedLoadMinutes"] + added_minutes
    utilization = Decimal("0.00")
    if after_available:
        utilization = (Decimal(after_load) / Decimal(after_available) * Decimal("100")).quantize(
            Decimal("0.01")
        )
    from apps.workcenters.services.load import calculate_constraint_status

    constraint_status, risk_status = calculate_constraint_status(utilization)
    return {
        "planVersionId": str(plan_version.id),
        "orderId": str(order.id),
        "workcenterId": str(workcenter.id),
        "addedMinutes": added_minutes,
        "before": {
            "availableMinutes": before["availableMinutes"],
            "plannedLoadMinutes": before["plannedLoadMinutes"],
            "utilizationPercent": before["utilizationPercent"],
            "constraintStatus": before["constraintStatus"],
            "riskStatus": before["riskStatus"],
        },
        "after": {
            "availableMinutes": after_available,
            "plannedLoadMinutes": after_load,
            "utilizationPercent": float(utilization),
            "constraintStatus": constraint_status,
            "riskStatus": risk_status,
        },
        "writeApplied": False,
    }


@transaction.atomic
def freeze_plan(plan_version: PlanVersion, *, frozen_by=None) -> PlanVersion:
    _ensure_plan_editable(plan_version)
    if not plan_version.work_items.filter(is_active=True).exists():
        raise ValidationError("Plan cannot be frozen without work items.")
    blocked = plan_version.work_items.filter(
        is_active=True,
        risk_status__in=[RiskStatus.ACTION, RiskStatus.CRITICAL],
    )
    if blocked.exists():
        raise ValidationError("Resolve overloaded or blocked work items before freeze.")
    plan_version.status = PlanVersionStatus.FROZEN
    plan_version.frozen_at = timezone.now()
    plan_version.frozen_by = frozen_by
    plan_version.updated_by = frozen_by
    plan_version.save(
        update_fields=["status", "frozen_at", "frozen_by", "updated_by", "updated_at"]
    )
    plan_version.work_items.update(locked=True, updated_at=timezone.now())
    write_audit_event(
        event_code="PLAN_VERSION_FROZEN",
        entity_type="PlanVersion",
        entity_id=str(plan_version.id),
        entity_display_code=str(plan_version),
        action="freeze",
        performed_by=frozen_by,
        new_value_json={"status": plan_version.status},
        source="WEB" if frozen_by else "SEED",
    )
    return plan_version


@transaction.atomic
def request_plan_change(
    *,
    plan_version: PlanVersion,
    reason: str,
    payload: dict,
    change_type: str = PlanChangeType.MOVE,
    work_item: PlannedWorkItem | None = None,
    requested_by=None,
) -> PlanChangeRequest:
    if plan_version.status != PlanVersionStatus.FROZEN:
        raise ValidationError("Plan change requests are required only after freeze.")
    if not reason:
        raise ValidationError("A change reason is required.")
    request = PlanChangeRequest.objects.create(
        plan_version=plan_version,
        work_item=work_item,
        change_type=change_type,
        reason=reason,
        payload=payload,
        requested_by=requested_by,
        created_by=requested_by,
        updated_by=requested_by,
    )
    write_audit_event(
        event_code="PLAN_CHANGE_REQUESTED",
        entity_type="PlanChangeRequest",
        entity_id=str(request.id),
        entity_display_code=str(plan_version),
        action="request_change",
        performed_by=requested_by,
        new_value_json=payload,
        reason=reason,
        source="WEB" if requested_by else "SEED",
    )
    return request


@transaction.atomic
def approve_plan_change(
    change_request: PlanChangeRequest,
    *,
    approved_by=None,
) -> PlanChangeRequest:
    if change_request.status != PlanChangeStatus.REQUESTED:
        raise ValidationError("Only requested plan changes can be approved.")
    change_request.status = PlanChangeStatus.APPROVED
    change_request.approved_by = approved_by
    change_request.approved_at = timezone.now()
    change_request.updated_by = approved_by
    change_request.save(
        update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"]
    )
    write_audit_event(
        event_code="PLAN_CHANGE_APPROVED",
        entity_type="PlanChangeRequest",
        entity_id=str(change_request.id),
        entity_display_code=str(change_request.plan_version),
        action="approve_change",
        performed_by=approved_by,
        new_value_json={"status": change_request.status},
        reason=change_request.reason,
        source="WEB" if approved_by else "SEED",
    )
    return change_request


def _ensure_plan_editable(plan_version: PlanVersion) -> None:
    if plan_version.status == PlanVersionStatus.FROZEN:
        raise ValidationError("Frozen plans cannot be edited directly.")


def _calculate_order_load_minutes(order: ProductionOrder, quantity: int) -> int:
    bulletin = (
        OperationBulletin.objects.filter(style=order.style, status="APPROVED", is_active=True)
        .order_by("-effective_date", "-created_at")
        .first()
    )
    smv = bulletin.total_smv if bulletin else Decimal("1.00")
    return max(int((Decimal(quantity) * smv).quantize(Decimal("1"))), 1)


def default_plan_dates():
    today = timezone.localdate()
    start = today - timedelta(days=today.weekday())
    return start, start + timedelta(days=6)
