from datetime import date

from apps.organization.models import Factory, HolidayCalendar, ShiftCalendar


def get_working_minutes(factory: Factory, working_date: date) -> int:
    if HolidayCalendar.objects.filter(
        factory=factory,
        holiday_date=working_date,
        is_active=True,
    ).exists():
        return 0

    shift = (
        ShiftCalendar.objects.filter(factory=factory, is_active=True, is_default=True)
        .order_by("name")
        .first()
    )
    return shift.working_minutes if shift else 0
