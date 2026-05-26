import json
from datetime import date

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.materials_procurement.models import MaterialPurchaseOrder, MaterialRequirement
from apps.materials_procurement.services.readiness import (
    calculate_material_readiness,
    close_shortage,
    update_material_eta,
)
from apps.orders.models import ProductionOrder


def serialize_purchase_order(po: MaterialPurchaseOrder) -> dict[str, object]:
    return {
        "id": str(po.id),
        "poNo": po.po_no,
        "orderId": str(po.order_id) if po.order_id else None,
        "orderNo": po.order.order_no if po.order else None,
        "vendorCode": po.vendor.code,
        "vendorName": po.vendor.name,
        "materialCode": po.material.code,
        "materialName": po.material.name,
        "orderedQty": float(po.ordered_qty),
        "acknowledgedQty": float(po.acknowledged_qty) if po.acknowledged_qty is not None else None,
        "expectedArrivalDate": po.expected_arrival_date.isoformat()
        if po.expected_arrival_date
        else None,
        "revisedEta": po.revised_eta.isoformat() if po.revised_eta else None,
        "actualArrivalDate": po.actual_arrival_date.isoformat() if po.actual_arrival_date else None,
        "status": po.status,
    }


@require_GET
@api_permission_required("procurement.view")
def material_readiness_view(_request):
    orders = ProductionOrder.objects.filter(is_active=True).prefetch_related(
        "material_requirements__material",
        "material_purchase_orders",
    )
    return api_response([calculate_material_readiness(order) for order in orders])


@require_GET
@api_permission_required("procurement.view")
def order_material_readiness_view(_request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    return api_response(calculate_material_readiness(order))


@require_GET
@api_permission_required("procurement.view")
def purchase_orders_view(_request):
    purchase_orders = (
        MaterialPurchaseOrder.objects.filter(is_active=True)
        .select_related("order", "vendor", "material")
        .order_by("expected_arrival_date", "po_no")
    )
    return api_response([serialize_purchase_order(po) for po in purchase_orders])


@require_POST
@api_permission_required("procurement.update_eta")
def purchase_order_eta_update_view(request, purchase_order_id):
    purchase_order = get_object_or_404(MaterialPurchaseOrder, id=purchase_order_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        revised_eta = date.fromisoformat(payload["revisedEta"])
        update_material_eta(
            purchase_order,
            revised_eta=revised_eta,
            reason=payload.get("reason", ""),
            updated_by=request.user,
        )
    except (json.JSONDecodeError, KeyError, ValueError):
        return api_response(
            None,
            errors=error_response("INVALID_ETA_PAYLOAD", "ETA update payload is invalid."),
            status=400,
        )
    return api_response(serialize_purchase_order(purchase_order))


@require_POST
@api_permission_required("procurement.close_shortage")
def close_material_shortage_view(request, requirement_id):
    requirement = get_object_or_404(MaterialRequirement, id=requirement_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        updated = close_shortage(
            requirement, closed_by=request.user, reason=payload.get("reason", "")
        )
    except (json.JSONDecodeError, ValidationError) as error:
        message = (
            "; ".join(error.messages) if isinstance(error, ValidationError) else "Invalid JSON."
        )
        return api_response(
            None,
            errors=error_response("SHORTAGE_CLOSE_FAILED", message),
            status=400,
        )
    return api_response(
        {
            "id": str(updated.id),
            "status": updated.status,
            "shortageQty": float(updated.shortage_qty),
        }
    )
