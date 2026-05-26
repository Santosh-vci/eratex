from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import ApprovalStatus, RiskStatus
from apps.orders.models import OrderLifecycleEvent, OrderMilestone, OrderStage, ProductionOrder
from apps.style_technical.models import BOMHeader, OperationBulletin, Style, WashRoute

MILESTONE_OFFSETS = {
    "ORDER_CONFIRMED": -14,
    "FABRIC_PO_PLACED": -12,
    "FABRIC_RECEIVED": -2,
    "FABRIC_QC_COMPLETE": -1,
    "PCD": 0,
    "CUTTING_START": 1,
    "SEWING_START": 3,
    "WASH_START": 8,
    "FINISHING_START": 11,
    "PACKING_COMPLETE": 14,
    "FINAL_QC": 15,
    "SHIPMENT": 18,
}


def style_has_approved_technical_data(style: Style) -> bool:
    has_bom = BOMHeader.objects.filter(
        style=style,
        status=ApprovalStatus.APPROVED,
        is_active=True,
    ).exists()
    has_bulletin = OperationBulletin.objects.filter(
        style=style,
        status=ApprovalStatus.APPROVED,
        is_active=True,
    ).exists()
    has_route = bool(
        style.default_wash_route
        and WashRoute.objects.filter(
            id=style.default_wash_route_id,
            status=ApprovalStatus.APPROVED,
            is_active=True,
        ).exists()
    )
    return style.status == ApprovalStatus.APPROVED and has_bom and has_bulletin and has_route


@transaction.atomic
def create_order(
    *,
    order_no: str,
    po_number: str,
    style: Style,
    order_qty: int,
    committed_ship_date,
    planned_pcd_date,
    factory=None,
    owner=None,
    buyer=None,
    planned_ship_date=None,
    created_by=None,
) -> ProductionOrder:
    if order_qty <= 0:
        raise ValidationError("Order quantity must be greater than zero.")
    if committed_ship_date < planned_pcd_date:
        raise ValidationError("Committed ship date cannot be before planned PCD date.")

    order = ProductionOrder.objects.create(
        order_no=order_no,
        po_number=po_number,
        customer=style.customer,
        buyer=buyer or style.buyer,
        style=style,
        factory=factory,
        product_type=style.product_type,
        order_qty=order_qty,
        planned_ship_date=planned_ship_date,
        committed_ship_date=committed_ship_date,
        planned_pcd_date=planned_pcd_date,
        owner=owner,
        created_by=created_by,
        updated_by=created_by,
    )
    initialize_order_lifecycle(order, performed_by=created_by)

    from apps.pcd_readiness.services.readiness import initialize_pcd_readiness

    initialize_pcd_readiness(order, performed_by=created_by)
    order.risk_status = (
        RiskStatus.ON_TRACK if style_has_approved_technical_data(style) else RiskStatus.CRITICAL
    )
    order.save(update_fields=["risk_status", "updated_at"])
    write_audit_event(
        event_code="ORDER_CREATED",
        entity_type="ProductionOrder",
        entity_id=str(order.id),
        entity_display_code=order.order_no,
        action="create",
        performed_by=created_by,
        new_value_json={"orderNo": order.order_no, "orderQty": order.order_qty},
        source="WEB" if created_by else "SEED",
    )
    return order


def initialize_order_lifecycle(order: ProductionOrder, *, performed_by=None) -> None:
    if order.current_stage == OrderStage.CREATED:
        order.current_stage = OrderStage.PRE_PRODUCTION
        order.lifecycle_status = OrderStage.PRE_PRODUCTION
        order.save(update_fields=["current_stage", "lifecycle_status", "updated_at"])
    OrderLifecycleEvent.objects.get_or_create(
        order=order,
        event_code="order.created",
        defaults={
            "from_stage": "",
            "to_stage": order.current_stage,
            "message": "Order initialized for pre-production readiness.",
            "performed_by": performed_by,
        },
    )
    for milestone_type, offset in MILESTONE_OFFSETS.items():
        planned_date = order.planned_pcd_date + timedelta(days=offset)
        OrderMilestone.objects.get_or_create(
            order=order,
            milestone_type=milestone_type,
            defaults={"planned_date": planned_date, "owner": order.owner},
        )


def derive_order_lifecycle_status(order: ProductionOrder) -> str:
    if order.order_status == "CANCELLED":
        return OrderStage.CANCELLED
    if order.order_status == "ON_HOLD":
        return OrderStage.ON_HOLD
    if hasattr(order, "pcd_readiness"):
        pcd_status = order.pcd_readiness.readiness_status
        if pcd_status == "RELEASED":
            return OrderStage.CUTTING
        if pcd_status in {"READY", "CONDITIONALLY_READY"}:
            return OrderStage.PCD_READY
        return OrderStage.PCD_PENDING
    return order.current_stage


def record_lifecycle_event(
    order: ProductionOrder,
    *,
    event_code: str,
    to_stage: str,
    message: str,
    performed_by=None,
    metadata: dict[str, object] | None = None,
) -> OrderLifecycleEvent:
    event = OrderLifecycleEvent.objects.create(
        order=order,
        event_code=event_code,
        from_stage=order.current_stage,
        to_stage=to_stage,
        message=message,
        metadata=metadata or {},
        performed_by=performed_by,
    )
    order.current_stage = to_stage
    order.lifecycle_status = derive_order_lifecycle_status(order)
    order.save(update_fields=["current_stage", "lifecycle_status", "updated_at"])
    return event
