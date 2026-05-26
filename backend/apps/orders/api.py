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
from apps.orders.models import OrderLifecycleEvent, ProductionOrder
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
