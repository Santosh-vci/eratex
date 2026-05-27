import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.boundary_cases.models import BoundaryCaseEvent
from apps.boundary_cases.services.preview import (
    apply_boundary_action,
    approve_boundary_action,
    create_boundary_case,
    preview_boundary_case,
)
from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response


@api_permission_required("boundary_case.view")
def boundary_cases_view(request):
    if request.method == "GET":
        events = (
            BoundaryCaseEvent.objects.filter(is_active=True)
            .select_related("linked_order", "linked_workcenter", "owner")
            .order_by("-created_at")[:100]
        )
        return api_response([serialize_boundary_event(event) for event in events])
    if request.method == "POST":
        from apps.identity_access.services.permissions import user_has_permission

        if not user_has_permission(request.user, "boundary_case.create"):
            return api_response(
                None,
                errors=error_response("PERMISSION_DENIED", "Permission denied."),
                status=403,
            )
        return boundary_case_create_view(request)
    return api_response(
        None,
        errors=error_response("METHOD_NOT_ALLOWED", "Method is not allowed."),
        status=405,
    )


@require_GET
@api_permission_required("boundary_case.view")
def boundary_case_detail_view(_request, event_id):
    event = get_object_or_404(
        BoundaryCaseEvent.objects.select_related("linked_order", "linked_workcenter", "owner"),
        id=event_id,
    )
    data = serialize_boundary_event(event)
    data["impactPreviews"] = [
        serialize_boundary_preview(preview) for preview in event.impact_previews.all()
    ]
    return api_response(data)


@require_POST
@api_permission_required("boundary_case.create")
def boundary_case_create_view(request):
    try:
        payload = _payload(request)
        event = create_boundary_case(
            event_type=payload["eventType"],
            payload=payload.get("payload", {}),
            created_by=request.user,
            trigger_source=payload.get("triggerSource", "USER"),
        )
    except (json.JSONDecodeError, KeyError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("BOUNDARY_CASE_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_boundary_event(event), status=201)


@require_POST
@api_permission_required("boundary_case.preview_impact")
def boundary_case_impact_preview_view(request):
    try:
        payload = _payload(request)
        impact = preview_boundary_case(
            event_type=payload["eventType"],
            payload=payload.get("payload", {}),
            user=request.user,
        )
    except (json.JSONDecodeError, KeyError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("BOUNDARY_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_impact(impact))


@require_POST
@api_permission_required("boundary_case.approve_recovery")
def boundary_case_approve_action_view(request, event_id):
    event = get_object_or_404(BoundaryCaseEvent, id=event_id)
    try:
        event = approve_boundary_action(event, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("BOUNDARY_APPROVAL_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_boundary_event(event))


@require_POST
@api_permission_required("boundary_case.apply_action")
def boundary_case_apply_action_view(request, event_id):
    event = get_object_or_404(BoundaryCaseEvent, id=event_id)
    try:
        event = apply_boundary_action(event, applied_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("BOUNDARY_APPLY_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_boundary_event(event))


def serialize_boundary_event(event: BoundaryCaseEvent) -> dict[str, object]:
    return {
        "id": str(event.id),
        "eventNo": event.event_no,
        "eventType": event.event_type,
        "status": event.status,
        "severity": event.severity,
        "linkedOrderId": str(event.linked_order_id) if event.linked_order_id else None,
        "linkedOrderNo": event.linked_order.order_no if event.linked_order else None,
        "linkedWorkcenterId": str(event.linked_workcenter_id)
        if event.linked_workcenter_id
        else None,
        "linkedWorkcenterCode": event.linked_workcenter.code if event.linked_workcenter else None,
        "eventStage": event.event_stage,
        "triggerSource": event.trigger_source,
        "affectedQuantity": event.affected_quantity,
        "affectedCapacityMinutes": event.affected_capacity_minutes,
        "affectedShipmentDate": event.affected_shipment_date.isoformat()
        if event.affected_shipment_date
        else None,
        "riskBefore": event.risk_before,
        "riskAfter": event.risk_after,
        "recommendedAction": event.recommended_action,
        "approvalRequired": event.approval_required,
        "ownerId": event.owner_id,
        "ownerName": event.owner.get_full_name() if event.owner else "",
        "metadata": event.metadata_json,
        "createdAt": event.created_at.isoformat(),
    }


def serialize_boundary_preview(preview) -> dict[str, object]:
    return {
        "id": str(preview.id),
        "previewType": preview.preview_type,
        "affectedOrders": preview.affected_orders_json,
        "affectedWorkcenters": preview.affected_workcenters_json,
        "affectedWip": preview.affected_wip_json,
        "affectedShipments": preview.affected_shipments_json,
        "capacityBefore": preview.capacity_before_json,
        "capacityAfter": preview.capacity_after_json,
        "riskBefore": preview.risk_before,
        "riskAfter": preview.risk_after,
        "recommendedActions": preview.recommended_actions_json,
        "warnings": preview.warnings_json,
        "blockingReasons": preview.blocking_reasons_json,
        "approvalRequired": preview.approval_required,
    }


def serialize_impact(impact: dict[str, object]) -> dict[str, object]:
    return {
        "canApply": impact["can_apply"],
        "approvalRequired": impact["approval_required"],
        "riskBefore": impact["risk_before"],
        "riskAfter": impact["risk_after"],
        "affectedOrders": impact["affected_orders"],
        "affectedWorkcenters": impact["affected_workcenters"],
        "affectedWip": impact["affected_wip"],
        "affectedShipments": impact["affected_shipments"],
        "capacityImpact": impact["capacity_impact"],
        "recommendedActions": impact["recommended_actions"],
        "warnings": impact["warnings"],
        "blockingReasons": impact["blocking_reasons"],
    }


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return "Boundary case payload is invalid."
