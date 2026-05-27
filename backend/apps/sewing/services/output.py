from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.boundary_cases.models import (
    BoundaryCaseEvent,
    BoundaryEventStatus,
    BoundaryEventType,
    BoundarySeverity,
    BoundaryTriggerSource,
)
from apps.common.models import RiskStatus
from apps.sewing.models import LineLoadingStatus, SewingOutputCorrection, SewingOutputEntry
from apps.wip_inventory.models import WipMovementType, WipStage
from apps.wip_inventory.services.movement import get_available_lot, move_wip


def calculate_net_good(gross_qty: int, defect_qty: int, rework_qty: int) -> int:
    if gross_qty < 0 or defect_qty < 0 or rework_qty < 0:
        raise ValidationError("Output quantities cannot be negative.")
    if defect_qty + rework_qty > gross_qty:
        raise ValidationError("Defect and rework cannot exceed gross output.")
    return gross_qty - defect_qty - rework_qty


@transaction.atomic
def record_sewing_output(
    *,
    line_loading,
    client_event_id: str,
    entry_time=None,
    time_slot: str,
    gross_qty: int,
    defect_qty: int = 0,
    rework_qty: int = 0,
    source: str = "DESKTOP",
    remarks: str = "",
    recorded_by=None,
) -> SewingOutputEntry:
    existing = SewingOutputEntry.objects.filter(client_event_id=client_event_id).first()
    if existing:
        return existing
    if line_loading.status != LineLoadingStatus.ACTIVE:
        raise ValidationError("Sewing output requires an active line loading.")
    net_good = calculate_net_good(gross_qty, defect_qty, rework_qty)
    source_lot = get_available_lot(line_loading.order, WipStage.SEWING_ACTIVE)
    if source_lot is None:
        raise ValidationError("No sewing-active WIP is available for output capture.")
    movement = move_wip(
        order=line_loading.order,
        source_lot=source_lot,
        quantity=net_good,
        to_stage=WipStage.SEWN_WAITING_WASH,
        movement_type=WipMovementType.SEWING_OUTPUT,
        sewing_loading=line_loading,
        workcenter=line_loading.workcenter,
        line=line_loading.line,
        reason="Sewing net-good output recorded.",
        performed_by=recorded_by,
    )
    entry = SewingOutputEntry.objects.create(
        line_loading=line_loading,
        client_event_id=client_event_id,
        order=line_loading.order,
        line=line_loading.line,
        entry_time=entry_time or timezone.now(),
        time_slot=time_slot,
        gross_qty=gross_qty,
        defect_qty=defect_qty,
        rework_qty=rework_qty,
        net_good_qty=net_good,
        source=source,
        remarks=remarks,
        recorded_by=recorded_by,
        created_by=recorded_by,
        updated_by=recorded_by,
    )
    shortfall_event = detect_line_shortfall(line_loading=line_loading, recorded_by=recorded_by)
    write_audit_event(
        event_code="SEWING_OUTPUT_RECORDED",
        entity_type="SewingOutputEntry",
        entity_id=str(entry.id),
        entity_display_code=entry.client_event_id,
        action="record_sewing_output",
        performed_by=recorded_by,
        new_value_json={
            "loadingNo": line_loading.loading_no,
            "grossQty": gross_qty,
            "defectQty": defect_qty,
            "reworkQty": rework_qty,
            "netGoodQty": net_good,
            "movementNo": movement.movement_no,
            "shortfallEventNo": shortfall_event.event_no if shortfall_event else None,
        },
        reason=remarks,
    )
    return entry


@transaction.atomic
def correct_sewing_output(
    *,
    output_entry: SewingOutputEntry,
    gross_qty: int,
    defect_qty: int,
    rework_qty: int,
    reason: str,
    corrected_by=None,
) -> SewingOutputCorrection:
    old = {
        "grossQty": output_entry.gross_qty,
        "defectQty": output_entry.defect_qty,
        "reworkQty": output_entry.rework_qty,
        "netGoodQty": output_entry.net_good_qty,
    }
    new_net = calculate_net_good(gross_qty, defect_qty, rework_qty)
    delta = new_net - output_entry.net_good_qty
    if delta > 0:
        source_lot = get_available_lot(output_entry.order, WipStage.SEWING_ACTIVE)
        if source_lot is None:
            raise ValidationError("No sewing-active WIP is available for correction delta.")
        move_wip(
            order=output_entry.order,
            source_lot=source_lot,
            quantity=delta,
            to_stage=WipStage.SEWN_WAITING_WASH,
            movement_type=WipMovementType.CORRECTION,
            sewing_loading=output_entry.line_loading,
            workcenter=output_entry.line_loading.workcenter,
            line=output_entry.line,
            reason=reason,
            performed_by=corrected_by,
        )
    output_entry.gross_qty = gross_qty
    output_entry.defect_qty = defect_qty
    output_entry.rework_qty = rework_qty
    output_entry.net_good_qty = new_net
    output_entry.updated_by = corrected_by
    output_entry.save(
        update_fields=[
            "gross_qty",
            "defect_qty",
            "rework_qty",
            "net_good_qty",
            "updated_by",
            "updated_at",
        ]
    )
    new = {
        "grossQty": gross_qty,
        "defectQty": defect_qty,
        "reworkQty": rework_qty,
        "netGoodQty": new_net,
    }
    correction = SewingOutputCorrection.objects.create(
        output_entry=output_entry,
        reason=reason,
        old_value_json=old,
        new_value_json=new,
        corrected_by=corrected_by,
        created_by=corrected_by,
        updated_by=corrected_by,
    )
    write_audit_event(
        event_code="SEWING_OUTPUT_CORRECTED",
        entity_type="SewingOutputEntry",
        entity_id=str(output_entry.id),
        entity_display_code=output_entry.client_event_id,
        action="correct_sewing_output",
        performed_by=corrected_by,
        old_value_json=old,
        new_value_json=new,
        reason=reason,
    )
    return correction


def calculate_line_efficiency(line_loading, *, date=None) -> dict[str, object]:
    output = line_loading.output_entries.filter(is_active=True)
    if date:
        output = output.filter(entry_time__date=date)
    totals = output.aggregate(
        gross=Sum("gross_qty"),
        defect=Sum("defect_qty"),
        rework=Sum("rework_qty"),
        net=Sum("net_good_qty"),
    )
    net = int(totals["net"] or 0)
    target = max(line_loading.target_output_per_day, 1)
    efficiency = Decimal(net) / Decimal(target) * Decimal("100.00")
    return {
        "lineLoadingId": str(line_loading.id),
        "loadingNo": line_loading.loading_no,
        "orderNo": line_loading.order.order_no,
        "lineCode": line_loading.line.code,
        "targetOutput": line_loading.target_output_per_day,
        "grossQty": int(totals["gross"] or 0),
        "defectQty": int(totals["defect"] or 0),
        "reworkQty": int(totals["rework"] or 0),
        "netGoodQty": net,
        "efficiencyPercent": round(float(efficiency), 2),
        "riskStatus": RiskStatus.ACTION if efficiency < 75 else RiskStatus.ON_TRACK,
    }


def detect_line_shortfall(line_loading, *, recorded_by=None) -> BoundaryCaseEvent | None:
    efficiency = calculate_line_efficiency(line_loading)
    if efficiency["efficiencyPercent"] >= 75:
        return None
    event_no = f"SHORT-{line_loading.loading_no}"
    event, created = BoundaryCaseEvent.objects.get_or_create(
        event_no=event_no,
        defaults={
            "event_type": BoundaryEventType.CAPACITY_LOSS,
            "status": BoundaryEventStatus.OPEN,
            "severity": BoundarySeverity.HIGH,
            "linked_order": line_loading.order,
            "linked_workcenter": line_loading.workcenter,
            "linked_line": line_loading.line,
            "event_stage": "SEWING",
            "trigger_source": BoundaryTriggerSource.SHOPFLOOR,
            "affected_quantity": max(
                line_loading.target_output_per_day - efficiency["netGoodQty"], 0
            ),
            "affected_capacity_minutes": 0,
            "risk_before": RiskStatus.WATCH,
            "risk_after": RiskStatus.ACTION,
            "recommended_action": "Review line balance and approve realignment or recovery action.",
            "approval_required": True,
            "owner": recorded_by,
            "metadata_json": {"lineEfficiency": efficiency},
            "created_by": recorded_by,
            "updated_by": recorded_by,
        },
    )
    if created:
        write_audit_event(
            event_code="LINE_SHORTFALL_DETECTED",
            entity_type="BoundaryCaseEvent",
            entity_id=str(event.id),
            entity_display_code=event.event_no,
            action="detect_line_shortfall",
            performed_by=recorded_by,
            new_value_json=efficiency,
        )
    return event
