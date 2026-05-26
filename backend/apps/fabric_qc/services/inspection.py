from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.fabric_qc.models import FabricQCInspection, FabricQcStatus, FabricRoll


def _text_result_status(value: str) -> str | None:
    normalized = (value or "").strip().upper()
    if normalized in {"FAIL", "FAILED", "REJECT"}:
        return FabricQcStatus.FAILED
    if normalized in {"HOLD", "REVIEW"}:
        return FabricQcStatus.HOLD
    return None


def calculate_fabric_qc_status(
    *, four_point_score, width_result, gsm_result, shrinkage_percent, **text_results
):
    mandatory_values = [four_point_score, width_result, gsm_result, shrinkage_percent]
    if any(value in {None, ""} for value in mandatory_values):
        return FabricQcStatus.PENDING
    if Decimal(str(four_point_score)) > Decimal("40.00"):
        return FabricQcStatus.FAILED
    if Decimal(str(width_result)) < Decimal("42.00"):
        return FabricQcStatus.FAILED
    if Decimal(str(gsm_result)) < Decimal("250.00"):
        return FabricQcStatus.FAILED
    if Decimal(str(shrinkage_percent)) > Decimal("5.00"):
        return FabricQcStatus.FAILED
    for value in text_results.values():
        status = _text_result_status(str(value))
        if status:
            return status
    return FabricQcStatus.PASSED


@transaction.atomic
def record_fabric_qc(
    *,
    fabric_roll: FabricRoll,
    inspection_date,
    inspected_by=None,
    remarks: str = "",
    **results,
) -> FabricQCInspection:
    status = calculate_fabric_qc_status(**results)
    inspection = FabricQCInspection.objects.create(
        fabric_roll=fabric_roll,
        inspection_date=inspection_date,
        status=status,
        inspected_by=inspected_by,
        remarks=remarks,
        created_by=inspected_by,
        updated_by=inspected_by,
        **results,
    )
    fabric_roll.qc_status = status
    fabric_roll.save(update_fields=["qc_status", "updated_at"])
    _sync_pcd_fabric_item(fabric_roll)
    write_audit_event(
        event_code="FABRIC_QC_INSPECTION_CREATED",
        entity_type="FabricQCInspection",
        entity_id=str(inspection.id),
        entity_display_code=f"{fabric_roll.fabric_lot.lot_no}:{fabric_roll.roll_no}",
        action="create",
        performed_by=inspected_by,
        new_value_json={"status": status},
        source="WEB" if inspected_by else "SEED",
    )
    if status == FabricQcStatus.FAILED:
        write_audit_event(
            event_code="FABRIC_QC_FAILED",
            entity_type="ProductionOrder",
            entity_id=str(fabric_roll.fabric_lot.order_id),
            entity_display_code=fabric_roll.fabric_lot.order.order_no
            if fabric_roll.fabric_lot.order
            else "",
            action="block_pcd",
            performed_by=inspected_by,
            new_value_json={"rollNo": fabric_roll.roll_no, "status": status},
            source="WEB" if inspected_by else "SEED",
        )
    return inspection


@transaction.atomic
def waive_fabric_qc(inspection: FabricQCInspection, *, waived_by, reason: str):
    inspection.status = FabricQcStatus.WAIVED
    inspection.waived_by = waived_by
    inspection.waived_at = timezone.now()
    inspection.waiver_reason = reason
    inspection.updated_by = waived_by
    inspection.save(
        update_fields=[
            "status",
            "waived_by",
            "waived_at",
            "waiver_reason",
            "updated_by",
            "updated_at",
        ]
    )
    inspection.fabric_roll.qc_status = FabricQcStatus.WAIVED
    inspection.fabric_roll.save(update_fields=["qc_status", "updated_at"])
    _sync_pcd_fabric_item(inspection.fabric_roll)
    write_audit_event(
        event_code="FABRIC_QC_WAIVED",
        entity_type="FabricQCInspection",
        entity_id=str(inspection.id),
        entity_display_code=f"{inspection.fabric_roll.fabric_lot.lot_no}:{inspection.fabric_roll.roll_no}",
        action="waive",
        performed_by=waived_by,
        reason=reason,
        new_value_json={"status": inspection.status},
        source="WEB",
    )
    return inspection


def _sync_pcd_fabric_item(fabric_roll: FabricRoll) -> None:
    order = fabric_roll.fabric_lot.order
    if not order or not hasattr(order, "pcd_readiness"):
        return
    from apps.pcd_readiness.models import PCDItemStatus
    from apps.pcd_readiness.services.readiness import calculate_pcd_readiness

    rolls = FabricRoll.objects.filter(fabric_lot__order=order, is_active=True)
    if rolls.filter(qc_status__in=[FabricQcStatus.FAILED, FabricQcStatus.HOLD]).exists():
        item_status = PCDItemStatus.FAILED
    elif rolls.filter(qc_status=FabricQcStatus.PENDING).exists():
        item_status = PCDItemStatus.PENDING
    elif rolls.filter(qc_status=FabricQcStatus.WAIVED).exists():
        item_status = PCDItemStatus.WAIVED
    else:
        item_status = PCDItemStatus.PASSED
    order.pcd_readiness.items.filter(item_code="FABRIC_QC_PASSED").update(status=item_status)
    calculate_pcd_readiness(order.pcd_readiness)
