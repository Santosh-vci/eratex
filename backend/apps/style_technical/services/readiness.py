from apps.common.models import ApprovalStatus
from apps.style_technical.models import BOMHeader, OperationBulletin, Style


def get_style_planning_readiness(style: Style) -> dict[str, object]:
    missing_items: list[str] = []
    approved_bom = BOMHeader.objects.filter(style=style, status=ApprovalStatus.APPROVED).first()
    approved_bulletin = OperationBulletin.objects.filter(
        style=style,
        status=ApprovalStatus.APPROVED,
    ).first()

    if style.status != ApprovalStatus.APPROVED:
        missing_items.append("APPROVED_STYLE")
    if not approved_bom:
        missing_items.append("APPROVED_BOM")
    if not approved_bulletin:
        missing_items.append("APPROVED_OPERATION_BULLETIN")
    if not style.default_wash_route or style.default_wash_route.status != ApprovalStatus.APPROVED:
        missing_items.append("APPROVED_WASH_ROUTE")

    return {
        "styleId": str(style.id),
        "styleCode": style.style_code,
        "planningReady": not missing_items,
        "missingItems": missing_items,
        "approvedBomId": str(approved_bom.id) if approved_bom else None,
        "approvedOperationBulletinId": str(approved_bulletin.id) if approved_bulletin else None,
        "approvedWashRouteId": (
            str(style.default_wash_route_id)
            if style.default_wash_route
            and style.default_wash_route.status == ApprovalStatus.APPROVED
            else None
        ),
    }
