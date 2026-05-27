import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.cutting.models import CuttingJob, CuttingOutputEntry
from apps.cutting.services.execution import (
    create_cutting_job_from_release,
    handover_cut_panels_to_sewing,
    record_cutting_output,
    start_cutting_job,
)
from apps.production_release.models import ProductionRelease
from apps.sewing.models import SewingLineLoading


@require_GET
@api_permission_required("cutting.view")
def cutting_jobs_view(_request):
    jobs = (
        CuttingJob.objects.filter(is_active=True)
        .select_related("release", "order", "workcenter")
        .prefetch_related("bundles", "output_entries")
        .order_by("-created_at")[:100]
    )
    return api_response([serialize_cutting_job(job) for job in jobs])


@require_GET
@api_permission_required("cutting.view")
def cutting_job_detail_view(_request, job_id):
    job = get_object_or_404(
        CuttingJob.objects.select_related("release", "order", "workcenter").prefetch_related(
            "bundles", "output_entries"
        ),
        id=job_id,
    )
    return api_response(serialize_cutting_job(job, detail=True))


@require_POST
@api_permission_required("cutting.start_job")
def cutting_job_start_view(request, job_id):
    job = get_object_or_404(CuttingJob, id=job_id)
    try:
        job = start_cutting_job(job, started_by=request.user)
    except ValidationError as error:
        return api_response(
            None, errors=error_response("CUTTING_START_INVALID", _error_message(error)), status=400
        )
    return api_response(serialize_cutting_job(job))


@require_POST
@api_permission_required("cutting.record_output")
def cutting_output_create_view(request):
    try:
        payload = _payload(request)
        if payload.get("releaseId"):
            release = ProductionRelease.objects.get(id=payload["releaseId"])
            job = create_cutting_job_from_release(release, created_by=request.user)
        else:
            job = CuttingJob.objects.get(id=payload["jobId"])
        entry = record_cutting_output(
            cutting_job=job,
            client_event_id=payload.get("clientEventId") or f"cut-{timezone.now().timestamp()}",
            output_qty=int(payload["outputQty"]),
            defect_qty=int(payload.get("defectQty", 0)),
            rework_qty=int(payload.get("reworkQty", 0)),
            recorded_at=_parse_datetime(payload.get("recordedAt")),
            remarks=payload.get("remarks", ""),
            recorded_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        CuttingJob.DoesNotExist,
        ProductionRelease.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None, errors=error_response("CUTTING_OUTPUT_INVALID", _error_message(error)), status=400
        )
    return api_response(serialize_cutting_output(entry), status=201)


@require_POST
@api_permission_required("cutting.correct_output")
def cutting_output_correct_view(request, output_id):
    entry = get_object_or_404(CuttingOutputEntry, id=output_id)
    return api_response(serialize_cutting_output(entry))


@require_POST
@api_permission_required("cutting.handover_to_sewing")
def cutting_handover_to_sewing_view(request, job_id):
    job = get_object_or_404(CuttingJob, id=job_id)
    try:
        payload = _payload(request)
        sewing_loading = None
        if payload.get("lineLoadingId"):
            sewing_loading = SewingLineLoading.objects.get(id=payload["lineLoadingId"])
        handover = handover_cut_panels_to_sewing(
            cutting_job=job,
            quantity=int(payload["quantity"]),
            sewing_loading=sewing_loading,
            sender=request.user,
            remarks=payload.get("remarks", ""),
        )
    except (
        json.JSONDecodeError,
        KeyError,
        SewingLineLoading.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None,
            errors=error_response("CUTTING_HANDOVER_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(
        {
            "id": str(handover.id),
            "handoverNo": handover.handover_no,
            "orderNo": handover.order.order_no,
            "quantity": handover.quantity,
            "targetStage": handover.target_stage,
            "status": handover.status,
        },
        status=201,
    )


def serialize_cutting_job(job: CuttingJob, *, detail: bool = False) -> dict[str, object]:
    data = {
        "id": str(job.id),
        "jobNo": job.job_no,
        "releaseId": str(job.release_id),
        "releaseNo": job.release.release_no,
        "orderId": str(job.order_id),
        "orderNo": job.order.order_no,
        "styleCode": job.order.style.style_code,
        "workcenterId": str(job.workcenter_id),
        "workcenterCode": job.workcenter.code,
        "plannedQuantity": job.planned_quantity,
        "markerNo": job.marker_no,
        "colorCode": job.color_code,
        "shadeLot": job.shade_lot,
        "status": job.status,
        "riskStatus": job.risk_status,
        "startedAt": job.started_at.isoformat() if job.started_at else None,
        "completedAt": job.completed_at.isoformat() if job.completed_at else None,
        "handedOverAt": job.handed_over_at.isoformat() if job.handed_over_at else None,
        "outputQty": sum(entry.output_qty for entry in job.output_entries.all()),
        "netCutQty": sum(entry.net_cut_qty for entry in job.output_entries.all()),
        "bundleCount": job.bundles.count(),
    }
    if detail:
        data["outputs"] = [serialize_cutting_output(entry) for entry in job.output_entries.all()]
        data["bundles"] = [
            {
                "id": str(bundle.id),
                "bundleNo": bundle.bundle_no,
                "quantity": bundle.quantity,
                "shadeLot": bundle.shade_lot,
                "status": bundle.status,
            }
            for bundle in job.bundles.all()
        ]
    return data


def serialize_cutting_output(entry: CuttingOutputEntry) -> dict[str, object]:
    return {
        "id": str(entry.id),
        "jobId": str(entry.cutting_job_id),
        "jobNo": entry.cutting_job.job_no,
        "clientEventId": entry.client_event_id,
        "outputQty": entry.output_qty,
        "defectQty": entry.defect_qty,
        "reworkQty": entry.rework_qty,
        "netCutQty": entry.net_cut_qty,
        "recordedAt": entry.recorded_at.isoformat(),
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
