from django.core.exceptions import ValidationError
from django.db import transaction

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import RiskStatus
from apps.wip_inventory.models import WipLot, WipLotStatus, WipMovement, WipStage


def next_wip_no(prefix: str, model) -> str:
    return f"{prefix}-{model.objects.count() + 1:05d}"


@transaction.atomic
def create_wip_lot(
    *,
    order,
    stage: str,
    quantity: int,
    release=None,
    cutting_job=None,
    sewing_loading=None,
    workcenter=None,
    line=None,
    color_code: str = "",
    shade_lot: str = "",
    performed_by=None,
    lot_no: str | None = None,
) -> WipLot:
    if quantity <= 0:
        raise ValidationError("WIP quantity must be positive.")
    lot = WipLot.objects.create(
        lot_no=lot_no or next_wip_no("WIP", WipLot),
        order=order,
        release=release,
        cutting_job=cutting_job,
        sewing_loading=sewing_loading,
        workcenter=workcenter,
        line=line,
        stage=stage,
        quantity=quantity,
        available_quantity=quantity,
        color_code=color_code,
        shade_lot=shade_lot,
        created_by=performed_by,
        updated_by=performed_by,
    )
    return lot


@transaction.atomic
def move_wip(
    *,
    order,
    quantity: int,
    to_stage: str,
    movement_type: str,
    source_lot: WipLot | None = None,
    release=None,
    cutting_job=None,
    sewing_loading=None,
    workcenter=None,
    line=None,
    reason: str = "",
    boundary_case=None,
    performed_by=None,
) -> WipMovement:
    if quantity <= 0:
        raise ValidationError("WIP movement quantity must be positive.")
    from_stage = ""
    if source_lot:
        source_lot = WipLot.objects.select_for_update().get(id=source_lot.id)
        from_stage = source_lot.stage
        if source_lot.status == WipLotStatus.HELD:
            raise ValidationError("Held WIP cannot be moved.")
        if quantity > source_lot.available_quantity:
            raise ValidationError("WIP movement cannot exceed available source quantity.")
        source_lot.available_quantity -= quantity
        if source_lot.available_quantity == 0:
            source_lot.status = WipLotStatus.CONSUMED
        source_lot.updated_by = performed_by
        source_lot.save(update_fields=["available_quantity", "status", "updated_by", "updated_at"])
        release = release or source_lot.release
        cutting_job = cutting_job or source_lot.cutting_job
        sewing_loading = sewing_loading or source_lot.sewing_loading
        workcenter = workcenter or source_lot.workcenter
        line = line or source_lot.line
        color_code = source_lot.color_code
        shade_lot = source_lot.shade_lot
    else:
        color_code = ""
        shade_lot = ""
    target_lot = create_wip_lot(
        order=order,
        stage=to_stage,
        quantity=quantity,
        release=release,
        cutting_job=cutting_job,
        sewing_loading=sewing_loading,
        workcenter=workcenter,
        line=line,
        color_code=color_code,
        shade_lot=shade_lot,
        performed_by=performed_by,
    )
    movement = WipMovement.objects.create(
        movement_no=next_wip_no("MOV", WipMovement),
        order=order,
        source_lot=source_lot,
        target_lot=target_lot,
        from_stage=from_stage,
        to_stage=to_stage,
        quantity=quantity,
        movement_type=movement_type,
        reason=reason,
        boundary_case=boundary_case,
        performed_by=performed_by,
        created_by=performed_by,
        updated_by=performed_by,
    )
    write_audit_event(
        event_code="WIP_MOVED",
        entity_type="WipMovement",
        entity_id=str(movement.id),
        entity_display_code=movement.movement_no,
        action="move_wip",
        performed_by=performed_by,
        new_value_json={
            "orderNo": order.order_no,
            "fromStage": from_stage,
            "toStage": to_stage,
            "quantity": quantity,
            "movementType": movement_type,
        },
        reason=reason,
    )
    return movement


def get_order_wip_summary(order) -> dict[str, object]:
    lots = WipLot.objects.filter(order=order, is_active=True)
    stage_totals = {
        stage: {
            "quantity": 0,
            "availableQuantity": 0,
            "heldQuantity": 0,
            "riskStatus": RiskStatus.ON_TRACK,
        }
        for stage in WipStage.values
    }
    for lot in lots:
        row = stage_totals[lot.stage]
        row["quantity"] += lot.quantity
        row["availableQuantity"] += lot.available_quantity
        row["heldQuantity"] += lot.held_quantity
        if lot.risk_status != RiskStatus.ON_TRACK:
            row["riskStatus"] = lot.risk_status
    return {
        "orderId": str(order.id),
        "orderNo": order.order_no,
        "stages": stage_totals,
        "totalAvailable": sum(row["availableQuantity"] for row in stage_totals.values()),
    }


def get_available_lot(order, stage: str) -> WipLot | None:
    return (
        WipLot.objects.filter(
            order=order,
            stage=stage,
            status=WipLotStatus.AVAILABLE,
            available_quantity__gt=0,
            is_active=True,
        )
        .order_by("created_at")
        .first()
    )
