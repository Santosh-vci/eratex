from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import RiskStatus
from apps.materials_procurement.models import (
    MaterialETAUpdate,
    MaterialPurchaseOrder,
    MaterialPurchaseOrderStatus,
    MaterialRequirement,
    MaterialRequirementStatus,
)


def calculate_material_readiness(order) -> dict[str, object]:
    requirements = order.material_requirements.select_related(
        "material", "material__default_vendor"
    )
    blocked = False
    delayed = False
    rows = []
    for requirement in requirements:
        purchase_orders = MaterialPurchaseOrder.objects.filter(
            order=order,
            material=requirement.material,
            is_active=True,
        )
        latest_eta = None
        if purchase_orders.exists():
            latest_po = purchase_orders.order_by("-revised_eta", "-expected_arrival_date").first()
            latest_eta = latest_po.revised_eta or latest_po.expected_arrival_date
        eta_after_required = bool(
            latest_eta and requirement.required_date and latest_eta > requirement.required_date
        )
        eta_after_pcd = bool(latest_eta and latest_eta > order.planned_pcd_date)
        has_shortage = requirement.shortage_qty > Decimal("0.000")
        is_blocked = (
            requirement.status
            in {
                MaterialRequirementStatus.SHORT,
                MaterialRequirementStatus.DELAYED,
            }
            or has_shortage
            or eta_after_pcd
        )
        blocked = blocked or is_blocked
        delayed = delayed or eta_after_required or eta_after_pcd
        rows.append(
            {
                "id": str(requirement.id),
                "orderId": str(order.id),
                "orderNo": order.order_no,
                "materialId": str(requirement.material_id),
                "materialCode": requirement.material.code,
                "materialName": requirement.material.name,
                "requiredQty": float(requirement.required_qty),
                "shortageQty": float(requirement.shortage_qty),
                "requiredDate": requirement.required_date.isoformat()
                if requirement.required_date
                else None,
                "requiredStage": requirement.required_stage,
                "status": requirement.status,
                "latestEta": latest_eta.isoformat() if latest_eta else None,
                "etaAfterPcd": eta_after_pcd,
                "vendorCode": requirement.material.default_vendor.code
                if requirement.material.default_vendor
                else None,
            }
        )
    if blocked:
        risk = RiskStatus.ACTION
        status = "BLOCKED"
    elif delayed:
        risk = RiskStatus.WATCH
        status = "WATCH"
    else:
        risk = RiskStatus.ON_TRACK
        status = "READY"
    return {
        "orderId": str(order.id),
        "orderNo": order.order_no,
        "readinessStatus": status,
        "riskStatus": risk,
        "items": rows,
        "blockedCount": sum(1 for row in rows if row["status"] in {"SHORT", "DELAYED"}),
    }


@transaction.atomic
def update_material_eta(
    purchase_order: MaterialPurchaseOrder,
    *,
    revised_eta,
    reason: str = "",
    updated_by=None,
) -> MaterialETAUpdate:
    previous_eta = purchase_order.revised_eta or purchase_order.expected_arrival_date
    update = MaterialETAUpdate.objects.create(
        purchase_order=purchase_order,
        previous_eta=previous_eta,
        revised_eta=revised_eta,
        reason=reason,
        updated_by_user=updated_by,
        created_by=updated_by,
        updated_by=updated_by,
    )
    purchase_order.revised_eta = revised_eta
    if purchase_order.order and revised_eta > purchase_order.order.planned_pcd_date:
        purchase_order.status = MaterialPurchaseOrderStatus.DELAYED
        MaterialRequirement.objects.filter(
            order=purchase_order.order,
            material=purchase_order.material,
        ).update(status=MaterialRequirementStatus.DELAYED)
    purchase_order.save(update_fields=["revised_eta", "status", "updated_at"])
    write_audit_event(
        event_code="MATERIAL_ETA_UPDATED",
        entity_type="MaterialPurchaseOrder",
        entity_id=str(purchase_order.id),
        entity_display_code=purchase_order.po_no,
        action="update_eta",
        performed_by=updated_by,
        old_value_json={"eta": previous_eta.isoformat() if previous_eta else None},
        new_value_json={"eta": revised_eta.isoformat()},
        reason=reason,
        source="WEB" if updated_by else "SEED",
    )
    return update


@transaction.atomic
def close_shortage(requirement: MaterialRequirement, *, closed_by=None, reason: str = ""):
    if requirement.shortage_qty <= Decimal("0.000") and requirement.status in {
        MaterialRequirementStatus.READY,
        MaterialRequirementStatus.CLOSED,
    }:
        return requirement
    if not reason:
        raise ValidationError("A shortage closure reason is required.")
    old = {"status": requirement.status, "shortageQty": float(requirement.shortage_qty)}
    requirement.shortage_qty = Decimal("0.000")
    requirement.status = MaterialRequirementStatus.READY
    requirement.updated_by = closed_by
    requirement.save(update_fields=["shortage_qty", "status", "updated_by", "updated_at"])
    write_audit_event(
        event_code="MATERIAL_SHORTAGE_CLOSED",
        entity_type="MaterialRequirement",
        entity_id=str(requirement.id),
        entity_display_code=f"{requirement.order.order_no}:{requirement.material.code}",
        action="close_shortage",
        performed_by=closed_by,
        old_value_json=old,
        new_value_json={"status": requirement.status, "shortageQty": 0},
        reason=reason,
        source="WEB" if closed_by else "SEED",
    )
    return requirement
