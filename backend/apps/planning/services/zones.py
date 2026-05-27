from datetime import date

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.planning.models import PlannedWorkItem, PlanningZoneCode, PlanningZoneConfiguration

DEFAULT_ZONE_WINDOWS = [
    (PlanningZoneCode.FROZEN_ZONE, 0, 1, True, False),
    (PlanningZoneCode.FIRM_ZONE, 2, 6, True, False),
    (PlanningZoneCode.FLEXIBLE_ZONE, 7, 365, False, True),
]


def ensure_default_planning_zones() -> None:
    names = {
        PlanningZoneCode.FROZEN_ZONE: "Frozen Zone",
        PlanningZoneCode.FIRM_ZONE: "Firm Zone",
        PlanningZoneCode.FLEXIBLE_ZONE: "Flexible Zone",
    }
    for zone_code, start, end, approval, auto in DEFAULT_ZONE_WINDOWS:
        PlanningZoneConfiguration.objects.update_or_create(
            zone_code=zone_code,
            defaults={
                "zone_name": names[zone_code],
                "horizon_start_days": start,
                "horizon_end_days": end,
                "requires_approval_for_change": approval,
                "auto_reschedule_allowed": auto,
                "active_status": True,
                "is_active": True,
            },
        )


def assign_planning_zone(planned_date: date) -> str:
    if isinstance(planned_date, str):
        planned_date = date.fromisoformat(planned_date)
    ensure_default_planning_zones()
    days_from_today = (planned_date - timezone.localdate()).days
    if days_from_today < 0:
        return PlanningZoneCode.FROZEN_ZONE
    config = (
        PlanningZoneConfiguration.objects.filter(
            active_status=True,
            is_active=True,
            horizon_start_days__lte=days_from_today,
            horizon_end_days__gte=days_from_today,
        )
        .order_by("horizon_start_days")
        .first()
    )
    return config.zone_code if config else PlanningZoneCode.FLEXIBLE_ZONE


def get_zone_configuration(zone_code: str) -> PlanningZoneConfiguration:
    ensure_default_planning_zones()
    return PlanningZoneConfiguration.objects.get(zone_code=zone_code, active_status=True)


def direct_change_allowed(zone_code: str) -> bool:
    config = get_zone_configuration(zone_code)
    return config.auto_reschedule_allowed and not config.requires_approval_for_change


def ensure_direct_work_item_change_allowed(work_item: PlannedWorkItem) -> None:
    if work_item.planning_zone == PlanningZoneCode.FROZEN_ZONE:
        raise ValidationError("Frozen-zone work items require approved boundary change control.")
    if not direct_change_allowed(work_item.planning_zone):
        raise ValidationError("Firm-zone work items require impact preview and approval.")
