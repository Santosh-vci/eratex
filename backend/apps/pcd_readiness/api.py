import json
from datetime import date

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.orders.models import ProductionOrder
from apps.pcd_readiness.models import ConditionalRelease, PCDReadiness, PCDReadinessItem
from apps.pcd_readiness.services.readiness import (
    approve_conditional_release,
    request_conditional_release,
    update_pcd_item,
    validate_release_to_cutting,
)


def serialize_pcd_item(item: PCDReadinessItem) -> dict[str, object]:
    return {
        "id": str(item.id),
        "itemCode": item.item_code,
        "itemLabel": item.item_label,
        "isMandatory": item.is_mandatory,
        "status": item.status,
        "ownerId": item.owner_id,
        "dueDate": item.due_date.isoformat() if item.due_date else None,
        "waiverReason": item.waiver_reason,
        "evidenceUrl": item.evidence_url,
        "remarks": item.remarks,
    }


def serialize_conditional_release(conditional: ConditionalRelease) -> dict[str, object]:
    return {
        "id": str(conditional.id),
        "status": conditional.status,
        "openItemCodes": conditional.open_item_codes,
        "reason": conditional.reason,
        "riskNote": conditional.risk_note,
        "expiryDate": conditional.expiry_date.isoformat(),
        "requestedBy": conditional.requested_by_id,
        "approvedBy": conditional.approved_by_id,
        "approvedAt": conditional.approved_at.isoformat() if conditional.approved_at else None,
    }


def serialize_pcd_readiness(readiness: PCDReadiness) -> dict[str, object]:
    release_validation = validate_release_to_cutting(readiness)
    return {
        "id": str(readiness.id),
        "orderId": str(readiness.order_id),
        "orderNo": readiness.order.order_no,
        "styleCode": readiness.order.style.style_code,
        "customerName": readiness.order.customer.name,
        "plannedPcdDate": readiness.planned_pcd_date.isoformat(),
        "readinessStatus": readiness.readiness_status,
        "conditionalRelease": readiness.conditional_release,
        "conditionalReleaseReason": readiness.conditional_release_reason,
        "conditionalReleaseExpiry": readiness.conditional_release_expiry.isoformat()
        if readiness.conditional_release_expiry
        else None,
        "approvedBy": readiness.approved_by_id,
        "approvedAt": readiness.approved_at.isoformat() if readiness.approved_at else None,
        "releasedToCuttingAt": readiness.released_to_cutting_at.isoformat()
        if readiness.released_to_cutting_at
        else None,
        "releaseAllowed": release_validation["allowed"],
        "releaseBlockers": release_validation["blockers"],
        "items": [serialize_pcd_item(item) for item in readiness.items.all().order_by("item_code")],
        "conditionalReleases": [
            serialize_conditional_release(conditional)
            for conditional in readiness.conditional_releases.all().order_by("-created_at")
        ],
    }


@require_GET
@api_permission_required("pcd.view")
def pcd_readiness_list_view(_request):
    readiness = (
        PCDReadiness.objects.filter(is_active=True)
        .select_related("order", "order__style", "order__customer")
        .prefetch_related("items", "conditional_releases")
        .order_by("planned_pcd_date", "order__order_no")
    )
    return api_response([serialize_pcd_readiness(item) for item in readiness])


@require_GET
@api_permission_required("pcd.view")
def pcd_readiness_detail_view(_request, readiness_id):
    readiness = get_object_or_404(
        PCDReadiness.objects.select_related(
            "order", "order__style", "order__customer"
        ).prefetch_related(
            "items",
            "conditional_releases",
        ),
        id=readiness_id,
    )
    return api_response(serialize_pcd_readiness(readiness))


@require_GET
@api_permission_required("pcd.view")
def order_pcd_readiness_view(_request, order_id):
    order = get_object_or_404(ProductionOrder.objects.select_related("pcd_readiness"), id=order_id)
    return api_response(serialize_pcd_readiness(order.pcd_readiness))


@require_http_methods(["PATCH"])
@api_permission_required("pcd.update_item")
def pcd_item_update_view(request, readiness_id, item_id):
    item = get_object_or_404(PCDReadinessItem, id=item_id, pcd_readiness_id=readiness_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        readiness = update_pcd_item(
            item,
            status=payload["status"],
            remarks=payload.get("remarks", ""),
            waiver_reason=payload.get("waiverReason", ""),
            evidence_url=payload.get("evidenceUrl", ""),
            updated_by=request.user,
        )
    except (json.JSONDecodeError, KeyError, ValidationError) as error:
        message = (
            "; ".join(error.messages)
            if isinstance(error, ValidationError)
            else "PCD item payload is invalid."
        )
        return api_response(
            None,
            errors=error_response("PCD_ITEM_UPDATE_FAILED", message),
            status=400,
        )
    return api_response(serialize_pcd_readiness(readiness))


@require_POST
@api_permission_required("pcd.request_conditional_release")
def pcd_request_conditional_release_view(request, readiness_id):
    readiness = get_object_or_404(PCDReadiness, id=readiness_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        conditional = request_conditional_release(
            readiness,
            reason=payload["reason"],
            expiry_date=date.fromisoformat(payload["expiryDate"]),
            risk_note=payload.get("riskNote", ""),
            requested_by=request.user,
        )
    except (json.JSONDecodeError, KeyError, ValueError, ValidationError) as error:
        message = (
            "; ".join(error.messages)
            if isinstance(error, ValidationError)
            else "Conditional release payload is invalid."
        )
        return api_response(
            None,
            errors=error_response("PCD_CONDITIONAL_REQUEST_FAILED", message),
            status=400,
        )
    return api_response(serialize_conditional_release(conditional), status=201)


@require_POST
@api_permission_required("pcd.approve_conditional_release")
def pcd_approve_conditional_release_view(request, readiness_id):
    readiness = get_object_or_404(PCDReadiness, id=readiness_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        expiry_date = (
            date.fromisoformat(payload["expiryDate"]) if payload.get("expiryDate") else None
        )
        updated = approve_conditional_release(
            readiness,
            approved_by=request.user,
            reason=payload.get("reason", ""),
            expiry_date=expiry_date,
            risk_note=payload.get("riskNote", ""),
        )
    except (json.JSONDecodeError, ValueError, ValidationError) as error:
        message = (
            "; ".join(error.messages)
            if isinstance(error, ValidationError)
            else "Conditional approval payload is invalid."
        )
        return api_response(
            None,
            errors=error_response("PCD_CONDITIONAL_APPROVAL_FAILED", message),
            status=400,
        )
    return api_response(serialize_pcd_readiness(updated))
