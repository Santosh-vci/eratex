import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.organization.models import Line
from apps.production_release.models import ProductionRelease
from apps.sewing.models import LineRealignmentRequest, SewingLineLoading, SewingOutputEntry
from apps.sewing.services.line_loading import (
    activate_line_loading,
    close_line_loading,
    load_line,
    preview_line_loading,
)
from apps.sewing.services.line_loading_board import get_line_loading_board
from apps.sewing.services.output import (
    calculate_line_efficiency,
    correct_sewing_output,
    record_sewing_output,
)
from apps.sewing.services.realignment import (
    apply_line_realignment,
    approve_line_realignment,
    preview_line_realignment,
    reject_line_realignment,
    request_line_realignment,
)
from apps.style_technical.models import OperationBulletin


@api_permission_required("sewing.view")
def sewing_line_loadings_view(request):
    if request.method == "POST":
        return sewing_line_loading_create_view(request)
    if request.method != "GET":
        return api_response(
            None, errors=error_response("METHOD_NOT_ALLOWED", "Method is not allowed."), status=405
        )
    loadings = (
        SewingLineLoading.objects.filter(is_active=True)
        .select_related("release", "order", "line", "workcenter", "bulletin", "bulletin__style")
        .order_by("-created_at")[:100]
    )
    return api_response([serialize_line_loading(loading) for loading in loadings])


@require_GET
@api_permission_required("sewing.view")
def sewing_line_loading_board_view(_request):
    return api_response(get_line_loading_board())


@require_GET
@api_permission_required("sewing.view")
def sewing_line_loading_detail_view(_request, loading_id):
    loading = get_object_or_404(
        SewingLineLoading.objects.select_related(
            "release", "order", "line", "workcenter", "bulletin", "bulletin__style"
        ).prefetch_related("output_entries", "realignment_requests"),
        id=loading_id,
    )
    return api_response(serialize_line_loading(loading, detail=True))


@require_POST
@api_permission_required("sewing.load_line")
def sewing_line_loading_preview_view(request):
    try:
        payload = _payload(request)
        release = ProductionRelease.objects.get(id=payload["releaseId"])
        line = Line.objects.get(id=payload["lineId"])
        bulletin = OperationBulletin.objects.select_related("style").get(id=payload["bulletinId"])
        preview = preview_line_loading(
            release=release,
            line=line,
            bulletin=bulletin,
            planned_quantity=int(payload["plannedQuantity"])
            if payload.get("plannedQuantity")
            else None,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        ProductionRelease.DoesNotExist,
        Line.DoesNotExist,
        OperationBulletin.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None,
            errors=error_response("LINE_LOADING_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(preview)


@require_POST
@api_permission_required("sewing.load_line")
def sewing_line_loading_create_view(request):
    try:
        payload = _payload(request)
        release = ProductionRelease.objects.get(id=payload["releaseId"])
        line = Line.objects.get(id=payload["lineId"])
        bulletin = OperationBulletin.objects.get(id=payload["bulletinId"])
        loading = load_line(
            release=release,
            line=line,
            bulletin=bulletin,
            planned_quantity=int(payload["plannedQuantity"])
            if payload.get("plannedQuantity")
            else None,
            loaded_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        ProductionRelease.DoesNotExist,
        Line.DoesNotExist,
        OperationBulletin.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None, errors=error_response("LINE_LOADING_INVALID", _error_message(error)), status=400
        )
    return api_response(serialize_line_loading(loading), status=201)


@require_POST
@api_permission_required("sewing.load_line")
def sewing_line_loading_activate_view(request, loading_id):
    loading = get_object_or_404(SewingLineLoading, id=loading_id)
    try:
        loading = activate_line_loading(loading, activated_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("LINE_LOADING_ACTIVATE_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_line_loading(loading))


@require_POST
@api_permission_required("sewing.load_line")
def sewing_line_loading_close_view(request, loading_id):
    loading = get_object_or_404(SewingLineLoading, id=loading_id)
    return api_response(serialize_line_loading(close_line_loading(loading, closed_by=request.user)))


@require_POST
@api_permission_required("sewing.realign_line")
def line_realignment_preview_view(request):
    try:
        payload = _payload(request)
        line = Line.objects.get(id=payload["lineId"])
        bulletin = OperationBulletin.objects.get(id=payload["bulletinId"])
        loading = None
        if payload.get("lineLoadingId"):
            loading = SewingLineLoading.objects.get(id=payload["lineLoadingId"])
        preview = preview_line_realignment(
            line=line,
            bulletin=bulletin,
            target_output=int(payload["targetOutput"]),
            line_loading=loading,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        Line.DoesNotExist,
        OperationBulletin.DoesNotExist,
        SewingLineLoading.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None,
            errors=error_response("REALIGNMENT_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(preview)


@require_POST
@api_permission_required("sewing.realign_line")
def line_realignment_create_view(request):
    try:
        payload = _payload(request)
        loading = SewingLineLoading.objects.get(id=payload["lineLoadingId"])
        realignment = request_line_realignment(
            line=loading.line,
            bulletin=loading.bulletin,
            target_output=int(payload.get("targetOutput") or loading.target_output_per_day),
            line_loading=loading,
            requested_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        SewingLineLoading.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None, errors=error_response("REALIGNMENT_INVALID", _error_message(error)), status=400
        )
    return api_response(serialize_realignment(realignment), status=201)


@require_GET
@api_permission_required("sewing.view")
def line_realignment_detail_view(_request, realignment_id):
    realignment = get_object_or_404(
        LineRealignmentRequest.objects.select_related(
            "line", "order", "bulletin", "line_loading"
        ).prefetch_related("gaps"),
        id=realignment_id,
    )
    return api_response(serialize_realignment(realignment))


@require_POST
@api_permission_required("sewing.approve_realignment")
def line_realignment_approve_view(request, realignment_id):
    realignment = get_object_or_404(LineRealignmentRequest, id=realignment_id)
    try:
        realignment = approve_line_realignment(realignment, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("REALIGNMENT_APPROVAL_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_realignment(realignment))


@require_POST
@api_permission_required("sewing.apply_realignment")
def line_realignment_apply_view(request, realignment_id):
    realignment = get_object_or_404(LineRealignmentRequest, id=realignment_id)
    try:
        realignment = apply_line_realignment(realignment, applied_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("REALIGNMENT_APPLY_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_realignment(realignment))


@require_POST
@api_permission_required("sewing.approve_realignment")
def line_realignment_reject_view(request, realignment_id):
    realignment = get_object_or_404(LineRealignmentRequest, id=realignment_id)
    return api_response(
        serialize_realignment(reject_line_realignment(realignment, rejected_by=request.user))
    )


@api_permission_required("sewing.view")
def sewing_output_view(request):
    if request.method == "POST":
        return sewing_output_create_view(request)
    if request.method != "GET":
        return api_response(
            None, errors=error_response("METHOD_NOT_ALLOWED", "Method is not allowed."), status=405
        )
    entries = (
        SewingOutputEntry.objects.filter(is_active=True)
        .select_related("line_loading", "order", "line")
        .order_by("-entry_time")[:100]
    )
    return api_response([serialize_sewing_output(entry) for entry in entries])


@require_POST
@api_permission_required("sewing.record_output")
def sewing_output_create_view(request):
    try:
        payload = _payload(request)
        loading = SewingLineLoading.objects.get(id=payload["lineLoadingId"])
        entry = record_sewing_output(
            line_loading=loading,
            client_event_id=payload.get("clientEventId") or f"sew-{timezone.now().timestamp()}",
            entry_time=_parse_datetime(payload.get("entryTime")),
            time_slot=payload.get("timeSlot", "CURRENT"),
            gross_qty=int(payload["grossQty"]),
            defect_qty=int(payload.get("defectQty", 0)),
            rework_qty=int(payload.get("reworkQty", 0)),
            source=payload.get("source", "DESKTOP"),
            remarks=payload.get("remarks", ""),
            recorded_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        SewingLineLoading.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None, errors=error_response("SEWING_OUTPUT_INVALID", _error_message(error)), status=400
        )
    return api_response(serialize_sewing_output(entry), status=201)


@require_POST
@api_permission_required("sewing.correct_output")
def sewing_output_correct_view(request, output_id):
    entry = get_object_or_404(SewingOutputEntry, id=output_id)
    try:
        payload = _payload(request)
        correction = correct_sewing_output(
            output_entry=entry,
            gross_qty=int(payload["grossQty"]),
            defect_qty=int(payload.get("defectQty", 0)),
            rework_qty=int(payload.get("reworkQty", 0)),
            reason=payload.get("reason", ""),
            corrected_by=request.user,
        )
    except (json.JSONDecodeError, KeyError, ValidationError, ValueError) as error:
        return api_response(
            None,
            errors=error_response("SEWING_OUTPUT_CORRECTION_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(
        {
            "id": str(correction.id),
            "outputId": str(entry.id),
            "oldValue": correction.old_value_json,
            "newValue": correction.new_value_json,
            "reason": correction.reason,
        }
    )


@require_GET
@api_permission_required("sewing.view_efficiency")
def sewing_line_efficiency_view(_request):
    loadings = SewingLineLoading.objects.filter(is_active=True).select_related("order", "line")
    return api_response([calculate_line_efficiency(loading) for loading in loadings])


@require_GET
@api_permission_required("sewing.view_efficiency")
def line_style_fit_view(_request):
    loadings = SewingLineLoading.objects.filter(is_active=True).select_related(
        "order", "line", "bulletin"
    )
    return api_response(
        [
            {
                "lineLoadingId": str(loading.id),
                "loadingNo": loading.loading_no,
                "lineCode": loading.line.code,
                "styleCode": loading.bulletin.style.style_code,
                "fitStatus": loading.fit_status,
                "riskStatus": loading.risk_status,
                "targetOutput": loading.target_output_per_day,
            }
            for loading in loadings
        ]
    )


def serialize_line_loading(
    loading: SewingLineLoading, *, detail: bool = False
) -> dict[str, object]:
    data = {
        "id": str(loading.id),
        "loadingNo": loading.loading_no,
        "releaseId": str(loading.release_id),
        "releaseNo": loading.release.release_no,
        "orderId": str(loading.order_id),
        "orderNo": loading.order.order_no,
        "styleCode": loading.bulletin.style.style_code,
        "lineId": str(loading.line_id),
        "lineCode": loading.line.code,
        "lineName": loading.line.name,
        "workcenterId": str(loading.workcenter_id),
        "workcenterCode": loading.workcenter.code,
        "bulletinId": str(loading.bulletin_id),
        "bulletinVersion": loading.bulletin.version,
        "plannedQuantity": loading.planned_quantity,
        "targetOutputPerDay": loading.target_output_per_day,
        "targetEfficiency": float(loading.target_efficiency),
        "expectedDefectRate": float(loading.expected_defect_rate),
        "planningZone": loading.planning_zone,
        "plannedShift": loading.planned_shift,
        "colorCode": loading.color_code,
        "shadeLot": loading.shade_lot,
        "fitStatus": loading.fit_status,
        "status": loading.status,
        "riskStatus": loading.risk_status,
        "activatedAt": loading.activated_at.isoformat() if loading.activated_at else None,
        "closedAt": loading.closed_at.isoformat() if loading.closed_at else None,
    }
    if detail:
        data["outputs"] = [serialize_sewing_output(entry) for entry in loading.output_entries.all()]
        data["realignments"] = [
            serialize_realignment(realignment) for realignment in loading.realignment_requests.all()
        ]
    return data


def serialize_realignment(realignment: LineRealignmentRequest) -> dict[str, object]:
    return {
        "id": str(realignment.id),
        "requestNo": realignment.request_no,
        "lineLoadingId": str(realignment.line_loading_id) if realignment.line_loading_id else None,
        "lineId": str(realignment.line_id),
        "lineCode": realignment.line.code,
        "orderId": str(realignment.order_id),
        "orderNo": realignment.order.order_no,
        "bulletinId": str(realignment.bulletin_id),
        "styleCode": realignment.bulletin.style.style_code,
        "status": realignment.status,
        "fitStatus": realignment.fit_status,
        "targetOutput": realignment.target_output,
        "expectedOutputBefore": realignment.expected_output_before,
        "expectedOutputAfter": realignment.expected_output_after,
        "changeoverMinutes": realignment.changeover_minutes,
        "approvalRequired": realignment.approval_required,
        "riskStatus": realignment.risk_status,
        "recommendations": realignment.recommendations_json,
        "gaps": [
            {
                "id": str(gap.id),
                "gapType": gap.gap_type,
                "label": gap.label,
                "required": gap.required,
                "available": gap.available,
                "gap": gap.gap,
                "recommendation": gap.recommendation,
            }
            for gap in realignment.gaps.all()
        ],
    }


def serialize_sewing_output(entry: SewingOutputEntry) -> dict[str, object]:
    return {
        "id": str(entry.id),
        "lineLoadingId": str(entry.line_loading_id),
        "loadingNo": entry.line_loading.loading_no,
        "clientEventId": entry.client_event_id,
        "orderId": str(entry.order_id),
        "orderNo": entry.order.order_no,
        "lineId": str(entry.line_id),
        "lineCode": entry.line.code,
        "entryTime": entry.entry_time.isoformat(),
        "timeSlot": entry.time_slot,
        "grossQty": entry.gross_qty,
        "defectQty": entry.defect_qty,
        "reworkQty": entry.rework_qty,
        "netGoodQty": entry.net_good_qty,
        "source": entry.source,
        "remarks": entry.remarks,
    }


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _parse_datetime(value: str | None):
    if not value:
        return timezone.now()
    return parse_datetime(value) or timezone.now()


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return str(error) or "Request payload is invalid."
