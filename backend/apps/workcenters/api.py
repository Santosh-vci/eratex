from django.views.decorators.http import require_GET

from apps.common.decorators import api_permission_required
from apps.common.responses import api_response
from apps.workcenters.models import LineProfile, Machine, MachineType, WorkcenterCapacityDay
from apps.workcenters.services.capacity import calculate_available_capacity


def serialize_machine_type(machine_type: MachineType) -> dict[str, object]:
    return {
        "id": str(machine_type.id),
        "code": machine_type.code,
        "name": machine_type.name,
        "category": machine_type.category,
        "isActive": machine_type.is_active,
    }


def serialize_machine(machine: Machine) -> dict[str, object]:
    return {
        "id": str(machine.id),
        "code": machine.code,
        "name": machine.name,
        "machineTypeId": str(machine.machine_type_id),
        "machineTypeCode": machine.machine_type.code,
        "factoryId": str(machine.factory_id),
        "status": machine.status,
        "currentLineId": str(machine.current_line_id) if machine.current_line_id else None,
        "isActive": machine.is_active,
    }


@require_GET
@api_permission_required("master_data.view")
def machine_types_view(_request):
    machine_types = MachineType.objects.filter(is_active=True).order_by("code")
    return api_response([serialize_machine_type(machine_type) for machine_type in machine_types])


@require_GET
@api_permission_required("master_data.view")
def machines_view(_request):
    machines = (
        Machine.objects.filter(is_active=True)
        .select_related("machine_type", "factory", "current_line")
        .order_by("code")
    )
    return api_response([serialize_machine(machine) for machine in machines])


@require_GET
@api_permission_required("skill_matrix.view")
def line_capability_view(_request):
    profiles = (
        LineProfile.objects.filter(is_active=True)
        .select_related("line", "shift_calendar")
        .prefetch_related("allowed_product_types")
        .order_by("line__code")
    )
    payload = []
    for profile in profiles:
        machine_assignments = profile.line.machine_assignments.filter(
            is_active=True
        ).select_related("machine__machine_type")
        payload.append(
            {
                **calculate_available_capacity(profile),
                "lineName": profile.line.name,
                "allowedProductTypes": [
                    product_type.code for product_type in profile.allowed_product_types.all()
                ],
                "machineCount": machine_assignments.count(),
                "machineTypes": sorted(
                    {assignment.machine.machine_type.code for assignment in machine_assignments}
                ),
            }
        )
    return api_response(payload)


@require_GET
@api_permission_required("workcenters.view")
def capacity_days_view(_request):
    capacity_days = (
        WorkcenterCapacityDay.objects.filter(is_active=True)
        .select_related("workcenter")
        .order_by("capacity_date", "workcenter__code")[:200]
    )
    return api_response(
        [
            {
                "id": str(day.id),
                "workcenterId": str(day.workcenter_id),
                "workcenterCode": day.workcenter.code,
                "capacityDate": day.capacity_date.isoformat(),
                "availableMinutes": day.available_minutes,
                "capacityUnit": day.capacity_unit,
                "capacityValue": float(day.capacity_value),
                "source": day.source,
            }
            for day in capacity_days
        ]
    )
