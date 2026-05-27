import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.planning.models import PlannedWorkItem
from apps.production_release.models import ProductionRelease, ReleaseValidationResult
from apps.production_release.services.release import (
    approve_release_override,
    complete_release,
    create_release,
    request_release_override,
    validate_release,
)


@require_GET
@api_permission_required("release.view")
def daily_releases_view(_request):
    releases = (
        ProductionRelease.objects.filter(is_active=True)
        .select_related("order", "workcenter", "planned_work_item")
        .prefetch_related("blockers")
        .order_by("-release_date", "release_no")[:100]
    )
    return api_response([serialize_release(release) for release in releases])


@require_POST
@api_permission_required("release.validate")
def release_validate_view(request):
    try:
        payload = _payload(request)
        if payload.get("releaseId"):
            release = ProductionRelease.objects.get(id=payload["releaseId"])
            result = validate_release(release=release, checked_by=request.user)
        else:
            work_item = PlannedWorkItem.objects.get(id=payload["workItemId"])
            result = validate_release(planned_work_item=work_item, checked_by=request.user)
    except (
        json.JSONDecodeError,
        KeyError,
        ProductionRelease.DoesNotExist,
        PlannedWorkItem.DoesNotExist,
        ValidationError,
    ) as error:
        return api_response(
            None,
            errors=error_response("RELEASE_VALIDATION_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_validation(result))


@require_POST
@api_permission_required("release.create")
def release_create_view(request):
    try:
        payload = _payload(request)
        work_item = PlannedWorkItem.objects.select_related("order", "workcenter").get(
            id=payload["workItemId"]
        )
        release = create_release(planned_work_item=work_item, created_by=request.user)
    except (
        json.JSONDecodeError,
        KeyError,
        PlannedWorkItem.DoesNotExist,
        ValidationError,
    ) as error:
        return api_response(
            None,
            errors=error_response("RELEASE_CREATE_BLOCKED", _error_message(error)),
            status=400,
        )
    return api_response(serialize_release(release), status=201)


@require_POST
@api_permission_required("release.request_override")
def release_request_override_view(request, release_id):
    release = get_object_or_404(ProductionRelease, id=release_id)
    try:
        payload = _payload(request)
        release = request_release_override(
            release,
            reason=payload.get("reason", ""),
            requested_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("RELEASE_OVERRIDE_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_release(release))


@require_POST
@api_permission_required("release.approve_override")
def release_approve_override_view(request, release_id):
    release = get_object_or_404(ProductionRelease, id=release_id)
    try:
        payload = _payload(request)
        release = approve_release_override(
            release,
            approved_by=request.user,
            reason=payload.get("reason", ""),
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("RELEASE_OVERRIDE_APPROVAL_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_release(release))


@require_POST
@api_permission_required("release.complete")
def release_complete_view(request, release_id):
    release = get_object_or_404(ProductionRelease, id=release_id)
    try:
        release = complete_release(release, completed_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("RELEASE_COMPLETE_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_release(release))


def serialize_release(release: ProductionRelease) -> dict[str, object]:
    latest_validation = release.validation_results.order_by("-checked_at").first()
    return {
        "id": str(release.id),
        "releaseNo": release.release_no,
        "plannedWorkItemId": str(release.planned_work_item_id)
        if release.planned_work_item_id
        else None,
        "orderId": str(release.order_id),
        "orderNo": release.order.order_no,
        "workcenterId": str(release.workcenter_id),
        "workcenterCode": release.workcenter.code,
        "workcenterName": release.workcenter.name,
        "releaseDate": release.release_date.isoformat(),
        "releaseType": release.release_type,
        "status": release.status,
        "riskStatus": release.risk_status,
        "releasedAt": release.released_at.isoformat() if release.released_at else None,
        "completedAt": release.completed_at.isoformat() if release.completed_at else None,
        "overrideReason": release.override_reason,
        "validation": serialize_validation(latest_validation) if latest_validation else None,
    }


def serialize_validation(result: ReleaseValidationResult) -> dict[str, object]:
    return {
        "id": str(result.id),
        "releaseId": str(result.release_id) if result.release_id else None,
        "plannedWorkItemId": str(result.planned_work_item_id)
        if result.planned_work_item_id
        else None,
        "orderId": str(result.order_id),
        "orderNo": result.order.order_no,
        "isValid": result.is_valid,
        "riskStatus": result.risk_status,
        "checkedAt": result.checked_at.isoformat(),
        "checks": result.checks,
        "blockers": result.blockers,
    }


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return str(error) or "Request payload is invalid."
