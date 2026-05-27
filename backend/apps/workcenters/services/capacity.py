from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db.models import Q, Sum
from django.utils import timezone

from apps.common.models import ApprovalStatus
from apps.organization.models import Workcenter
from apps.workcenters.models import (
    CapacityAdjustment,
    LineMachineAssignment,
    LineProfile,
    Machine,
    WorkcenterCapacityDay,
    WorkcenterCapacityDefinition,
)


def get_capacity_definition(workcenter: Workcenter) -> WorkcenterCapacityDefinition | None:
    return (
        WorkcenterCapacityDefinition.objects.filter(
            workcenter_type=workcenter.workcenter_type,
            active_status=True,
            is_active=True,
        )
        .order_by("planning_bucket")
        .first()
    )


def calculate_available_capacity(target, date=None, shift: str | None = None) -> dict[str, object]:
    if isinstance(target, Workcenter):
        return _calculate_workcenter_available_capacity(target, date=date, shift=shift)
    return _calculate_line_available_capacity(target)


def _calculate_line_available_capacity(line_profile: LineProfile) -> dict[str, object]:
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


def _calculate_workcenter_available_capacity(
    workcenter: Workcenter,
    *,
    date=None,
    shift: str | None = None,
) -> dict[str, object]:
    capacity_date = date or timezone.localdate()
    capacity = (
        WorkcenterCapacityDay.objects.filter(
            workcenter=workcenter,
            capacity_date=capacity_date,
            is_active=True,
        ).aggregate(total=Sum("available_minutes"))["total"]
        or 0
    )
    adjustments = (
        CapacityAdjustment.objects.filter(
            workcenter=workcenter,
            adjustment_date=capacity_date,
            status=ApprovalStatus.APPROVED,
            is_active=True,
        ).aggregate(total=Sum("minutes_delta"))["total"]
        or 0
    )
    definition = get_capacity_definition(workcenter)
    return {
        "workcenterId": str(workcenter.id),
        "workcenterCode": workcenter.code,
        "workcenterType": workcenter.workcenter_type,
        "capacityDate": capacity_date.isoformat(),
        "shift": shift,
        "availableMinutes": max(int(capacity) + int(adjustments), 0),
        "baseAvailableMinutes": int(capacity),
        "adjustmentMinutes": int(adjustments),
        "capacityDefinition": serialize_capacity_definition(definition),
    }


def serialize_capacity_definition(
    definition: WorkcenterCapacityDefinition | None,
) -> dict[str, object] | None:
    if not definition:
        return None
    return {
        "id": str(definition.id),
        "workcenterType": definition.workcenter_type,
        "capacityUnit": definition.capacity_unit,
        "planningBucket": definition.planning_bucket,
        "primaryConstraintResource": definition.primary_constraint_resource,
        "secondaryConstraintResource": definition.secondary_constraint_resource,
        "normalCapacityValue": float(definition.normal_capacity_value),
        "normalCapacityUnit": definition.normal_capacity_unit,
        "overtimeAllowed": definition.overtime_allowed,
        "approvedOvertimeCapacityValue": float(definition.approved_overtime_capacity_value),
        "capacityLossTriggers": definition.capacity_loss_triggers_json,
        "recoveryLevers": definition.recovery_levers_json,
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
