import json
from datetime import date

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.materials_procurement.services.readiness import calculate_material_readiness
from apps.orders.models import (
    OrderChangeRequest,
    OrderChangeType,
    OrderLifecycleEvent,
    ProductionOrder,
)
from apps.orders.services.changes import (
    apply_order_change,
    approve_order_change,
    preview_order_cancellation,
    preview_order_change,
    preview_shipment_pull_in,
    request_order_change,
)
from apps.orders.services.lifecycle import create_order
from apps.pcd_readiness.api import serialize_pcd_readiness
from apps.pcd_readiness.services.readiness import release_to_cutting, validate_release_to_cutting
from apps.style_technical.models import Style


def parse_date(value: str | None, field: str) -> date:
    if not value:
        raise ValidationError(f"{field} is required.")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError(f"{field} must be YYYY-MM-DD.") from exc


def serialize_user(user) -> dict[str, object] | None:
    if not user:
        return None
    profile = getattr(user, "profile", None)
    return {
        "id": user.id,
        "displayName": profile.display_name if profile else user.get_full_name() or user.username,
    }


def serialize_order(order: ProductionOrder, *, include_detail: bool = False) -> dict[str, object]:
    pcd = getattr(order, "pcd_readiness", None)
    material = calculate_material_readiness(order)
    validation = validate_release_to_cutting(pcd) if pcd else {"allowed": False, "blockers": []}
    data = {
        "id": str(order.id),
        "orderNo": order.order_no,
        "poNumber": order.po_number,
        "customer": {
            "id": str(order.customer_id),
            "code": order.customer.code,
            "name": order.customer.name,
        },
        "buyer": {
            "id": str(order.buyer_id),
            "code": order.buyer.code,
            "name": order.buyer.name,
        }
        if order.buyer
        else None,
        "style": {
            "id": str(order.style_id),
            "styleCode": order.style.style_code,
            "productType": order.style.product_type.code,
            "washComplexity": order.style.wash_complexity,
            "sewingComplexity": order.style.sewing_complexity,
        },
        "productType": order.product_type.code,
        "orderQty": order.order_qty,
        "plannedPcdDate": order.planned_pcd_date.isoformat(),
        "plannedShipDate": order.planned_ship_date.isoformat() if order.planned_ship_date else None,
        "committedShipDate": order.committed_ship_date.isoformat(),
        "currentStage": order.current_stage,
        "lifecycleStatus": order.lifecycle_status,
        "riskStatus": order.risk_status,
        "pcdStatus": pcd.readiness_status if pcd else "NOT_STARTED",
        "materialReadinessStatus": material["readinessStatus"],
        "fabricQcStatus": _fabric_qc_status(order),
        "shipmentReadinessStatus": "NOT_STARTED",
        "owner": serialize_user(order.owner),
        "nextAction": _next_action(order, validation),
        "openExceptionCount": 0,
        "releaseAllowed": validation["allowed"],
        "releaseBlockers": validation["blockers"],
        "lastUpdatedAt": order.updated_at.isoformat(),
    }
    if include_detail:
        data["lines"] = [
            {"id": str(line.id), "size": line.size, "color": line.color, "quantity": line.quantity}
            for line in order.lines.all().order_by("color", "size")
        ]
        data["summary"] = {
            "cutQty": 0,
            "sewnQty": 0,
            "washedQty": 0,
            "finishedQty": 0,
            "packedQty": 0,
            "shipmentReadyQty": 0,
        }
        data["pcdReadiness"] = serialize_pcd_readiness(pcd) if pcd else None
        data["materialReadiness"] = material
        data["openBlockers"] = [
            {"category": "PCD", "severity": "ACTION", "message": blocker}
            for blocker in validation["blockers"]
        ]
    return data


def _fabric_qc_status(order: ProductionOrder) -> str:
    rolls = order.fabric_lots.values_list("rolls__qc_status", flat=True)
    statuses = {status for status in rolls if status}
    if not statuses:
        return "PENDING"
    if "FAILED" in statuses:
        return "FAILED"
    if "HOLD" in statuses:
        return "HOLD"
    if "PENDING" in statuses:
        return "PENDING"
    if "WAIVED" in statuses:
        return "WAIVED"
    return "PASSED"


def _next_action(order: ProductionOrder, validation: dict[str, object]) -> str:
    if validation["allowed"]:
        return "Release to cutting"
    if validation["blockers"]:
        return str(validation["blockers"][0])
    if order.lifecycle_status == "PCD_READY":
        return "Review release gate"
    return "Complete PCD readiness"


@api_permission_required("orders.view")
def orders_collection_view(request):
    if request.method == "GET":
        orders = (
            ProductionOrder.objects.filter(is_active=True)
            .select_related(
                "customer", "buyer", "style", "style__product_type", "product_type", "owner"
            )
            .prefetch_related("lines", "fabric_lots__rolls", "material_requirements")
        )
        search = request.GET.get("search")
        pcd_status = request.GET.get("pcdStatus")
        risk_status = request.GET.get("riskStatus")
        if search:
            orders = orders.filter(order_no__icontains=search)
        if risk_status:
            orders = orders.filter(risk_status=risk_status)
        if pcd_status:
            orders = orders.filter(pcd_readiness__readiness_status=pcd_status)
        return api_response(
            [serialize_order(order) for order in orders.order_by("committed_ship_date")]
        )
    if request.method == "POST":
        from apps.identity_access.services.permissions import user_has_permission

        if not user_has_permission(request.user, "orders.create"):
            return api_response(
                None,
                errors=error_response("PERMISSION_DENIED", "Permission denied."),
                status=403,
            )
        return _create_order_view(request)
    return api_response(
        None,
        errors=error_response("METHOD_NOT_ALLOWED", "Method is not allowed."),
        status=405,
    )


def _create_order_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        style = Style.objects.select_related("customer", "buyer", "product_type").get(
            id=payload["styleId"]
        )
        owner = None
        if payload.get("ownerId"):
            owner = get_user_model().objects.get(id=payload["ownerId"])
        order = create_order(
            order_no=payload["orderNo"],
            po_number=payload.get("poNumber", ""),
            style=style,
            order_qty=int(payload["orderQty"]),
            committed_ship_date=parse_date(payload.get("committedShipDate"), "committedShipDate"),
            planned_pcd_date=parse_date(payload.get("plannedPcdDate"), "plannedPcdDate"),
            owner=owner,
            created_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        Style.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        message = (
            "; ".join(error.messages)
            if isinstance(error, ValidationError)
            else "Order payload is invalid."
        )
        return api_response(
            None,
            errors=error_response("INVALID_ORDER_PAYLOAD", message),
            status=400,
        )
    return api_response(serialize_order(order, include_detail=True), status=201)


@require_GET
@api_permission_required("orders.view")
def order_detail_view(_request, order_id):
    order = get_object_or_404(
        ProductionOrder.objects.select_related(
            "customer",
            "buyer",
            "style",
            "style__product_type",
            "product_type",
            "owner",
        ).prefetch_related("lines", "fabric_lots__rolls", "material_requirements"),
        id=order_id,
    )
    return api_response(serialize_order(order, include_detail=True))


@require_GET
@api_permission_required("orders.view_timeline")
def order_timeline_view(_request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    events = OrderLifecycleEvent.objects.filter(order=order).select_related("performed_by")
    return api_response(
        [
            {
                "id": str(event.id),
                "eventCode": event.event_code,
                "fromStage": event.from_stage,
                "toStage": event.to_stage,
                "message": event.message,
                "metadata": event.metadata,
                "performedBy": serialize_user(event.performed_by),
                "createdAt": event.created_at.isoformat(),
            }
            for event in events
        ]
    )


@require_POST
@api_permission_required("pcd.release_to_cutting")
def order_release_to_cutting_view(request, order_id):
    order = get_object_or_404(ProductionOrder.objects.select_related("pcd_readiness"), id=order_id)
    try:
        readiness = release_to_cutting(order.pcd_readiness, released_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("PCD_NOT_READY", "; ".join(error.messages)),
            status=400,
        )
    return api_response(serialize_pcd_readiness(readiness))


@require_POST
@api_permission_required("orders.request_change")
def order_change_impact_preview_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    try:
        impact = preview_order_change(order, payload=_payload(request), user=request.user)
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("ORDER_CHANGE_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(_serialize_impact(impact))


@require_POST
@api_permission_required("orders.request_change")
def order_change_request_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    try:
        payload = _payload(request)
        change = request_order_change(
            order,
            change_type=payload.get("changeType", OrderChangeType.QUANTITY_CHANGE),
            payload=payload.get("payload", payload),
            reason=payload.get("reason", ""),
            requested_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("ORDER_CHANGE_REQUEST_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_order_change(change), status=201)


@require_POST
@api_permission_required("orders.cancel_preview")
def order_cancel_impact_preview_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    try:
        impact = preview_order_cancellation(order, payload=_payload(request), user=request.user)
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("ORDER_CANCEL_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(_serialize_impact(impact))


@require_POST
@api_permission_required("orders.request_cancellation")
def order_cancel_request_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    try:
        payload = _payload(request)
        change = request_order_change(
            order,
            change_type=OrderChangeType.CANCELLATION,
            payload=payload.get("payload", payload),
            reason=payload.get("reason", ""),
            requested_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("ORDER_CANCEL_REQUEST_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_order_change(change), status=201)


@require_POST
@api_permission_required("orders.approve_change")
def order_change_approve_view(request, request_id):
    change = get_object_or_404(OrderChangeRequest, id=request_id)
    try:
        change = approve_order_change(change, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("ORDER_CHANGE_APPROVAL_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_order_change(change))


@require_POST
@api_permission_required("orders.approve_change")
def order_change_apply_view(request, request_id):
    change = get_object_or_404(OrderChangeRequest, id=request_id)
    try:
        change = apply_order_change(change, applied_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("ORDER_CHANGE_APPLY_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_order_change(change))


@require_POST
@api_permission_required("orders.request_change")
def order_shipment_pull_in_preview_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    try:
        impact = preview_shipment_pull_in(order, payload=_payload(request), user=request.user)
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("SHIPMENT_PULL_IN_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(_serialize_impact(impact))


@require_POST
@api_permission_required("orders.request_change")
def order_shipment_pull_in_request_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    try:
        payload = _payload(request)
        change = request_order_change(
            order,
            change_type=OrderChangeType.SHIPMENT_PULL_IN,
            payload=payload.get("payload", payload),
            reason=payload.get("reason", ""),
            requested_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("SHIPMENT_PULL_IN_REQUEST_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_order_change(change), status=201)


@require_POST
@api_permission_required("orders.approve_change")
def order_shipment_pull_in_approve_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    change = get_object_or_404(
        OrderChangeRequest,
        order=order,
        change_type=OrderChangeType.SHIPMENT_PULL_IN,
        status="REQUESTED",
    )
    change = approve_order_change(change, approved_by=request.user)
    return api_response(serialize_order_change(change))


@require_POST
@api_permission_required("orders.approve_change")
def order_shipment_pull_in_apply_view(request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    change = get_object_or_404(
        OrderChangeRequest,
        order=order,
        change_type=OrderChangeType.SHIPMENT_PULL_IN,
        status="APPROVED",
    )
    try:
        change = apply_order_change(change, applied_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("SHIPMENT_PULL_IN_APPLY_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_order_change(change))


def serialize_order_change(change: OrderChangeRequest) -> dict[str, object]:
    return {
        "id": str(change.id),
        "requestNo": change.request_no,
        "orderId": str(change.order_id),
        "orderNo": change.order.order_no,
        "changeType": change.change_type,
        "status": change.status,
        "oldValue": change.old_value_json,
        "newValue": change.new_value_json,
        "impactPreview": _serialize_impact(change.impact_preview) if change.impact_preview else {},
        "reason": change.reason,
        "dispositionRequired": change.disposition_required,
        "createdAt": change.created_at.isoformat(),
    }


def _serialize_impact(impact: dict[str, object]) -> dict[str, object]:
    if "canApply" in impact:
        return impact
    return {
        "canApply": impact.get("can_apply"),
        "approvalRequired": impact.get("approval_required"),
        "riskBefore": impact.get("risk_before"),
        "riskAfter": impact.get("risk_after"),
        "affectedOrders": impact.get("affected_orders", []),
        "affectedWorkcenters": impact.get("affected_workcenters", []),
        "affectedWip": impact.get("affected_wip", []),
        "affectedShipments": impact.get("affected_shipments", []),
        "capacityImpact": impact.get("capacity_impact", {}),
        "recommendedActions": impact.get("recommended_actions", []),
        "warnings": impact.get("warnings", []),
        "blockingReasons": impact.get("blocking_reasons", []),
    }


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return "Order change payload is invalid."
