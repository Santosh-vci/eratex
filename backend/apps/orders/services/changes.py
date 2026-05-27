from datetime import date

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.boundary_cases.models import BoundaryEventType
from apps.boundary_cases.services.preview import calculate_boundary_impact, create_boundary_case
from apps.orders.models import (
    OrderChangeRequest,
    OrderChangeStatus,
    OrderChangeType,
    OrderLifecycleEvent,
    OrderStage,
    OrderStatus,
    ProductionOrder,
)


def preview_order_change(order: ProductionOrder, *, payload: dict, user=None) -> dict[str, object]:
    event_type = (
        BoundaryEventType.ORDER_QTY_CHANGED
        if "newQuantity" in payload
        else BoundaryEventType.DELIVERY_DATE_CHANGED
    )
    impact = calculate_boundary_impact(event_type, {"orderId": str(order.id), **payload}, user)
    write_audit_event(
        event_code="ORDER_CHANGE_PREVIEWED",
        entity_type="ProductionOrder",
        entity_id=str(order.id),
        entity_display_code=order.order_no,
        action="preview_change",
        performed_by=user,
        new_value_json=payload,
        metadata={"impact": impact},
        source="WEB" if user else "SYSTEM",
    )
    return impact


def preview_order_cancellation(
    order: ProductionOrder, *, payload: dict | None = None, user=None
) -> dict[str, object]:
    impact = calculate_boundary_impact(
        BoundaryEventType.ORDER_CANCELLED,
        {"orderId": str(order.id), **(payload or {})},
        user,
    )
    write_audit_event(
        event_code="ORDER_CANCELLATION_PREVIEWED",
        entity_type="ProductionOrder",
        entity_id=str(order.id),
        entity_display_code=order.order_no,
        action="preview_cancellation",
        performed_by=user,
        metadata={"impact": impact},
        source="WEB" if user else "SYSTEM",
    )
    return impact


def preview_shipment_pull_in(
    order: ProductionOrder, *, payload: dict, user=None
) -> dict[str, object]:
    impact = calculate_boundary_impact(
        BoundaryEventType.SHIPMENT_PULL_IN,
        {"orderId": str(order.id), **payload},
        user,
    )
    write_audit_event(
        event_code="SHIPMENT_PULL_IN_PREVIEWED",
        entity_type="ProductionOrder",
        entity_id=str(order.id),
        entity_display_code=order.order_no,
        action="preview_shipment_pull_in",
        performed_by=user,
        new_value_json=payload,
        metadata={"impact": impact},
        source="WEB" if user else "SYSTEM",
    )
    return impact


@transaction.atomic
def request_order_change(
    order: ProductionOrder,
    *,
    change_type: str,
    payload: dict,
    reason: str,
    requested_by=None,
) -> OrderChangeRequest:
    if not reason:
        raise ValidationError("A change reason is required.")
    impact = _preview_for_change_type(order, change_type, payload, requested_by)
    request = OrderChangeRequest.objects.create(
        request_no=_next_request_no(order, change_type),
        order=order,
        change_type=change_type,
        status=OrderChangeStatus.REQUESTED,
        old_value_json=_current_order_values(order),
        new_value_json=payload,
        impact_preview=impact,
        reason=reason,
        disposition_required=bool(impact["blocking_reasons"]),
        requested_by=requested_by,
        created_by=requested_by,
        updated_by=requested_by,
    )
    boundary_type = _boundary_type_for_change(change_type)
    create_boundary_case(
        event_type=boundary_type,
        payload={
            "orderId": str(order.id),
            **payload,
            "metadata": {"orderChangeRequestId": str(request.id)},
        },
        created_by=requested_by,
    )
    write_audit_event(
        event_code=_audit_requested_code(change_type),
        entity_type="OrderChangeRequest",
        entity_id=str(request.id),
        entity_display_code=request.request_no,
        action="request",
        performed_by=requested_by,
        old_value_json=request.old_value_json,
        new_value_json=payload,
        reason=reason,
        source="WEB" if requested_by else "SYSTEM",
    )
    return request


@transaction.atomic
def approve_order_change(request: OrderChangeRequest, *, approved_by=None) -> OrderChangeRequest:
    if request.status != OrderChangeStatus.REQUESTED:
        raise ValidationError("Only requested order changes can be approved.")
    request.status = OrderChangeStatus.APPROVED
    request.approved_by = approved_by
    request.approved_at = timezone.now()
    request.updated_by = approved_by
    request.save(update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"])
    write_audit_event(
        event_code=_audit_approved_code(request.change_type),
        entity_type="OrderChangeRequest",
        entity_id=str(request.id),
        entity_display_code=request.request_no,
        action="approve",
        performed_by=approved_by,
        new_value_json={"status": request.status},
        reason=request.reason,
        source="WEB" if approved_by else "SYSTEM",
    )
    return request


@transaction.atomic
def apply_order_change(request: OrderChangeRequest, *, applied_by=None) -> OrderChangeRequest:
    if request.status != OrderChangeStatus.APPROVED:
        raise ValidationError("Only approved order changes can be applied.")
    order = request.order
    payload = request.new_value_json
    if request.change_type == OrderChangeType.QUANTITY_CHANGE and payload.get("newQuantity"):
        new_qty = int(payload["newQuantity"])
        if new_qty <= 0:
            raise ValidationError("New order quantity must be positive.")
        order.order_qty = new_qty
    if request.change_type in {
        OrderChangeType.DELIVERY_DATE_CHANGE,
        OrderChangeType.SHIPMENT_PULL_IN,
    }:
        new_date = _parse_date(
            payload.get("newCommittedShipDate") or payload.get("newShipmentDate")
        )
        if new_date:
            order.committed_ship_date = new_date
            order.planned_ship_date = new_date
    if request.change_type == OrderChangeType.CANCELLATION:
        if request.disposition_required:
            raise ValidationError("Cancellation requires WIP or material disposition before apply.")
        order.order_status = OrderStatus.CANCELLED
        order.current_stage = OrderStage.CANCELLED
        order.lifecycle_status = OrderStage.CANCELLED
    order.updated_by = applied_by
    order.save()
    request.status = OrderChangeStatus.APPLIED
    request.applied_by = applied_by
    request.applied_at = timezone.now()
    request.updated_by = applied_by
    request.save(update_fields=["status", "applied_by", "applied_at", "updated_by", "updated_at"])
    OrderLifecycleEvent.objects.create(
        order=order,
        event_code=f"ORDER_{request.change_type}_APPLIED",
        from_stage=request.old_value_json.get("currentStage", ""),
        to_stage=order.current_stage,
        message=f"{request.change_type.replace('_', ' ').title()} applied.",
        metadata={"requestId": str(request.id)},
        performed_by=applied_by,
    )
    write_audit_event(
        event_code=_audit_applied_code(request.change_type),
        entity_type="OrderChangeRequest",
        entity_id=str(request.id),
        entity_display_code=request.request_no,
        action="apply",
        performed_by=applied_by,
        new_value_json={"status": request.status},
        reason=request.reason,
        source="WEB" if applied_by else "SYSTEM",
    )
    return request


def _preview_for_change_type(order, change_type, payload, user):
    if change_type == OrderChangeType.CANCELLATION:
        return preview_order_cancellation(order, payload=payload, user=user)
    if change_type == OrderChangeType.SHIPMENT_PULL_IN:
        return preview_shipment_pull_in(order, payload=payload, user=user)
    return preview_order_change(order, payload=payload, user=user)


def _boundary_type_for_change(change_type: str) -> str:
    return {
        OrderChangeType.CANCELLATION: BoundaryEventType.ORDER_CANCELLED,
        OrderChangeType.SHIPMENT_PULL_IN: BoundaryEventType.SHIPMENT_PULL_IN,
        OrderChangeType.QUANTITY_CHANGE: BoundaryEventType.ORDER_QTY_CHANGED,
        OrderChangeType.DELIVERY_DATE_CHANGE: BoundaryEventType.DELIVERY_DATE_CHANGED,
    }[change_type]


def _current_order_values(order):
    return {
        "orderQty": order.order_qty,
        "committedShipDate": order.committed_ship_date.isoformat(),
        "currentStage": order.current_stage,
        "orderStatus": order.order_status,
    }


def _next_request_no(order, change_type):
    return f"OCR-{order.order_no}-{change_type}-{timezone.now():%Y%m%d%H%M%S%f}"


def _parse_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def _audit_requested_code(change_type: str) -> str:
    if change_type == OrderChangeType.CANCELLATION:
        return "ORDER_CANCELLATION_REQUESTED"
    if change_type == OrderChangeType.SHIPMENT_PULL_IN:
        return "SHIPMENT_PULL_IN_REQUESTED"
    return "ORDER_CHANGE_REQUESTED"


def _audit_approved_code(change_type: str) -> str:
    if change_type == OrderChangeType.CANCELLATION:
        return "ORDER_CANCELLATION_APPROVED"
    if change_type == OrderChangeType.SHIPMENT_PULL_IN:
        return "SHIPMENT_PULL_IN_APPROVED"
    return "ORDER_CHANGE_APPROVED"


def _audit_applied_code(change_type: str) -> str:
    if change_type == OrderChangeType.CANCELLATION:
        return "ORDER_CANCELLATION_APPLIED"
    if change_type == OrderChangeType.SHIPMENT_PULL_IN:
        return "SHIPMENT_PULL_IN_APPLIED"
    return "ORDER_CHANGE_APPLIED"
