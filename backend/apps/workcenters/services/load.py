from datetime import date
from decimal import Decimal

from django.db.models import Sum

from apps.common.models import ApprovalStatus, RiskStatus
from apps.organization.models import Workcenter
from apps.workcenters.models import (
    CapacityAdjustment,
    ConstraintStatus,
    WorkcenterCapacityDay,
    WorkcenterLoadSnapshot,
    WorkcenterQueueSnapshot,
)


def calculate_constraint_status(utilization_percent: Decimal | float | int) -> tuple[str, str]:
    utilization = Decimal(str(utilization_percent))
    if utilization > Decimal("120.00"):
        return ConstraintStatus.CRITICAL, RiskStatus.CRITICAL
    if utilization > Decimal("100.00"):
        return ConstraintStatus.OVERLOADED, RiskStatus.ACTION
    if utilization > Decimal("85.00"):
        return ConstraintStatus.WATCH, RiskStatus.WATCH
    return ConstraintStatus.NORMAL, RiskStatus.ON_TRACK


def calculate_load(
    workcenter: Workcenter,
    *,
    start_date: date,
    end_date: date,
    horizon=None,
    persist: bool = True,
) -> dict[str, object]:
    from apps.planning.models import PlannedWorkItem

    capacity = (
        WorkcenterCapacityDay.objects.filter(
            workcenter=workcenter,
            capacity_date__gte=start_date,
            capacity_date__lte=end_date,
            is_active=True,
        ).aggregate(total=Sum("available_minutes"))["total"]
        or 0
    )
    adjustments = (
        CapacityAdjustment.objects.filter(
            workcenter=workcenter,
            adjustment_date__gte=start_date,
            adjustment_date__lte=end_date,
            status=ApprovalStatus.APPROVED,
            is_active=True,
        ).aggregate(total=Sum("minutes_delta"))["total"]
        or 0
    )
    available_minutes = max(int(capacity) + int(adjustments), 0)
    work_items = PlannedWorkItem.objects.filter(
        workcenter=workcenter,
        planned_start_date__lte=end_date,
        planned_end_date__gte=start_date,
        is_active=True,
    ).select_related("order")
    planned_minutes = work_items.aggregate(total=Sum("load_minutes"))["total"] or 0
    utilization = Decimal("0.00")
    if available_minutes:
        utilization = (
            Decimal(planned_minutes) / Decimal(available_minutes) * Decimal("100")
        ).quantize(Decimal("0.01"))
    constraint_status, risk_status = calculate_constraint_status(utilization)
    top_item = work_items.order_by("-load_minutes").first()
    queue_quantity = sum(item.planned_quantity for item in work_items)
    oldest_age = (
        WorkcenterQueueSnapshot.objects.filter(
            workcenter=workcenter,
            snapshot_date__gte=start_date,
            snapshot_date__lte=end_date,
            is_active=True,
        ).aggregate(max_age=Sum("age_hours"))["max_age"]
        or 0
    )
    action = _suggested_action(constraint_status)
    snapshot = None
    if persist:
        snapshot, _ = WorkcenterLoadSnapshot.objects.update_or_create(
            workcenter=workcenter,
            snapshot_date=start_date,
            defaults={
                "horizon": horizon,
                "available_minutes": available_minutes,
                "planned_load_minutes": int(planned_minutes),
                "utilization_percent": utilization,
                "queue_quantity": queue_quantity,
                "oldest_queue_age_hours": int(oldest_age),
                "constraint_status": constraint_status,
                "risk_status": risk_status,
                "top_affected_order": top_item.order if top_item else None,
                "suggested_action": action,
                "is_active": True,
            },
        )
    return {
        "snapshot": snapshot,
        "workcenter": workcenter,
        "availableMinutes": available_minutes,
        "plannedLoadMinutes": int(planned_minutes),
        "utilizationPercent": float(utilization),
        "queueQuantity": queue_quantity,
        "oldestQueueAgeHours": int(oldest_age),
        "constraintStatus": constraint_status,
        "riskStatus": risk_status,
        "topAffectedOrder": top_item.order if top_item else None,
        "suggestedAction": action,
    }


def get_current_constraint() -> WorkcenterLoadSnapshot | None:
    return (
        WorkcenterLoadSnapshot.objects.filter(is_active=True)
        .select_related("workcenter", "workcenter__factory", "top_affected_order")
        .order_by("-utilization_percent", "-snapshot_date")
        .first()
    )


def get_workcenter_queue(workcenter: Workcenter):
    return (
        WorkcenterQueueSnapshot.objects.filter(workcenter=workcenter, is_active=True)
        .select_related("order", "workcenter")
        .order_by("-snapshot_date", "-age_hours", "order__order_no")
    )


def _suggested_action(constraint_status: str) -> str:
    if constraint_status == ConstraintStatus.CRITICAL:
        return "Approve capacity action before release."
    if constraint_status == ConstraintStatus.OVERLOADED:
        return "Move load or add approved capacity."
    if constraint_status == ConstraintStatus.WATCH:
        return "Monitor queue before next release."
    return "Keep plan."
