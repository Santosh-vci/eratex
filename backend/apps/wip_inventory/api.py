from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET

from apps.common.decorators import api_permission_required
from apps.common.responses import api_response
from apps.orders.models import ProductionOrder
from apps.wip_inventory.models import WipLot, WipMovement
from apps.wip_inventory.services.movement import get_order_wip_summary


@require_GET
@api_permission_required("wip.view")
def order_wip_summary_view(_request, order_id):
    order = get_object_or_404(ProductionOrder, id=order_id)
    return api_response(get_order_wip_summary(order))


@require_GET
@api_permission_required("wip.view")
def wip_movements_view(_request):
    movements = (
        WipMovement.objects.filter(is_active=True)
        .select_related("order", "source_lot", "target_lot")
        .order_by("-created_at")[:100]
    )
    return api_response([serialize_wip_movement(movement) for movement in movements])


def serialize_wip_lot(lot: WipLot) -> dict[str, object]:
    return {
        "id": str(lot.id),
        "lotNo": lot.lot_no,
        "orderId": str(lot.order_id),
        "orderNo": lot.order.order_no,
        "stage": lot.stage,
        "quantity": lot.quantity,
        "availableQuantity": lot.available_quantity,
        "heldQuantity": lot.held_quantity,
        "status": lot.status,
        "riskStatus": lot.risk_status,
        "colorCode": lot.color_code,
        "shadeLot": lot.shade_lot,
    }


def serialize_wip_movement(movement: WipMovement) -> dict[str, object]:
    return {
        "id": str(movement.id),
        "movementNo": movement.movement_no,
        "orderId": str(movement.order_id),
        "orderNo": movement.order.order_no,
        "sourceLotId": str(movement.source_lot_id) if movement.source_lot_id else None,
        "targetLotId": str(movement.target_lot_id) if movement.target_lot_id else None,
        "fromStage": movement.from_stage,
        "toStage": movement.to_stage,
        "quantity": movement.quantity,
        "movementType": movement.movement_type,
        "reason": movement.reason,
        "createdAt": movement.created_at.isoformat(),
    }
