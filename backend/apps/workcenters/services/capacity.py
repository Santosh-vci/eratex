from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db.models import Q

from apps.workcenters.models import LineMachineAssignment, LineProfile, Machine


def calculate_available_capacity(line_profile: LineProfile) -> dict[str, object]:
    working_minutes = (
        line_profile.shift_calendar.working_minutes if line_profile.shift_calendar else 0
    )
    efficiency = line_profile.baseline_efficiency / Decimal("100.00")
    available_minutes = int(line_profile.current_manpower * working_minutes * efficiency)
    return {
        "lineId": str(line_profile.line_id),
        "lineCode": line_profile.line.code,
        "workingMinutes": working_minutes,
        "currentManpower": line_profile.current_manpower,
        "baselineEfficiency": float(line_profile.baseline_efficiency),
        "availableMinutes": available_minutes,
    }


def validate_line_machine_assignment(assignment: LineMachineAssignment) -> None:
    if assignment.machine.status in {
        Machine.MachineStatus.UNDER_MAINTENANCE,
        Machine.MachineStatus.BREAKDOWN,
        Machine.MachineStatus.INACTIVE,
    }:
        raise ValidationError("Machine is not available for assignment.")

    conflicting = LineMachineAssignment.objects.filter(machine=assignment.machine).exclude(
        id=assignment.id
    )
    if assignment.assigned_to:
        conflicting = conflicting.filter(
            Q(assigned_to__isnull=True) | Q(assigned_to__gte=assignment.assigned_from),
            assigned_from__lte=assignment.assigned_to,
        )
    else:
        conflicting = conflicting.filter(
            Q(assigned_to__isnull=True) | Q(assigned_to__gte=assignment.assigned_from)
        )

    if conflicting.exists():
        raise ValidationError("Machine has an overlapping active line assignment.")
