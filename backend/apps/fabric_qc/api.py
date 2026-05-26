import json
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.fabric_qc.models import FabricLot, FabricQCInspection, FabricRoll
from apps.fabric_qc.services.inspection import record_fabric_qc, waive_fabric_qc
from apps.orders.models import ProductionOrder


def serialize_roll(roll: FabricRoll) -> dict[str, object]:
    return {
        "id": str(roll.id),
        "rollNo": roll.roll_no,
        "rollLength": float(roll.roll_length),
        "width": float(roll.width) if roll.width is not None else None,
        "gsm": float(roll.gsm) if roll.gsm is not None else None,
        "shade": roll.shade,
        "qcStatus": roll.qc_status,
    }


def serialize_lot(lot: FabricLot) -> dict[str, object]:
    return {
        "id": str(lot.id),
        "orderId": str(lot.order_id) if lot.order_id else None,
        "orderNo": lot.order.order_no if lot.order else None,
        "lotNo": lot.lot_no,
        "shadeLot": lot.shade_lot,
        "receivedQty": float(lot.received_qty),
        "receivedDate": lot.received_date.isoformat(),
        "status": lot.status,
        "rolls": [serialize_roll(roll) for roll in lot.rolls.all()],
    }


def serialize_inspection(inspection: FabricQCInspection) -> dict[str, object]:
    return {
        "id": str(inspection.id),
        "fabricRollId": str(inspection.fabric_roll_id),
        "rollNo": inspection.fabric_roll.roll_no,
        "lotNo": inspection.fabric_roll.fabric_lot.lot_no,
        "orderNo": inspection.fabric_roll.fabric_lot.order.order_no
        if inspection.fabric_roll.fabric_lot.order
        else None,
        "inspectionDate": inspection.inspection_date.isoformat(),
        "fourPointScore": float(inspection.four_point_score)
        if inspection.four_point_score is not None
        else None,
        "widthResult": float(inspection.width_result)
        if inspection.width_result is not None
        else None,
        "gsmResult": float(inspection.gsm_result) if inspection.gsm_result is not None else None,
        "shrinkagePercent": float(inspection.shrinkage_percent)
        if inspection.shrinkage_percent is not None
        else None,
        "status": inspection.status,
        "remarks": inspection.remarks,
        "waiverReason": inspection.waiver_reason,
    }


@require_GET
@api_permission_required("fabric_qc.view")
def fabric_qc_view(_request):
    lots = (
        FabricLot.objects.filter(is_active=True)
        .select_related("order")
        .prefetch_related("rolls")
        .order_by("-received_date", "lot_no")
    )
    inspections = (
        FabricQCInspection.objects.filter(is_active=True)
        .select_related("fabric_roll", "fabric_roll__fabric_lot", "fabric_roll__fabric_lot__order")
        .order_by("-inspection_date")[:50]
    )
    return api_response(
        {
            "lots": [serialize_lot(lot) for lot in lots],
            "inspections": [serialize_inspection(inspection) for inspection in inspections],
        }
    )


@require_GET
@api_permission_required("fabric_qc.view")
def order_fabric_qc_status_view(_request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    lots = order.fabric_lots.prefetch_related("rolls").order_by("lot_no")
    return api_response(
        {
            "orderId": str(order.id),
            "orderNo": order.order_no,
            "lots": [serialize_lot(lot) for lot in lots],
        }
    )


@require_POST
@api_permission_required("fabric_qc.create_inspection")
def fabric_qc_inspection_create_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        roll = FabricRoll.objects.get(id=payload["fabricRollId"])
        inspection = record_fabric_qc(
            fabric_roll=roll,
            inspection_date=date.fromisoformat(payload["inspectionDate"]),
            inspected_by=request.user,
            remarks=payload.get("remarks", ""),
            four_point_score=_decimal_or_none(payload.get("fourPointScore")),
            width_result=_decimal_or_none(payload.get("widthResult")),
            gsm_result=_decimal_or_none(payload.get("gsmResult")),
            shrinkage_percent=_decimal_or_none(payload.get("shrinkagePercent")),
            skewing_result=payload.get("skewingResult", ""),
            bowing_result=payload.get("bowingResult", ""),
            stretch_recovery_result=payload.get("stretchRecoveryResult", ""),
            colorfastness_result=payload.get("colorfastnessResult", ""),
            crocking_result=payload.get("crockingResult", ""),
        )
    except (json.JSONDecodeError, KeyError, ValueError, FabricRoll.DoesNotExist):
        return api_response(
            None,
            errors=error_response("INVALID_FABRIC_QC_PAYLOAD", "Fabric QC payload is invalid."),
            status=400,
        )
    return api_response(serialize_inspection(inspection), status=201)


@require_POST
@api_permission_required("fabric_qc.waive")
def fabric_qc_inspection_waive_view(request, inspection_id):
    inspection = get_object_or_404(FabricQCInspection, id=inspection_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        updated = waive_fabric_qc(inspection, waived_by=request.user, reason=payload["reason"])
    except (json.JSONDecodeError, KeyError, ValidationError):
        return api_response(
            None,
            errors=error_response("FABRIC_QC_WAIVE_FAILED", "Waiver payload is invalid."),
            status=400,
        )
    return api_response(serialize_inspection(updated))


def _decimal_or_none(value):
    if value in {None, ""}:
        return None
    return Decimal(str(value))
