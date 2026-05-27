import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.boundary_cases.api import serialize_boundary_event, serialize_impact
from apps.boundary_cases.models import BoundaryCaseEvent, BoundaryEventType
from apps.boundary_cases.services.preview import (
    apply_boundary_action,
    approve_boundary_action,
    create_boundary_case,
    preview_boundary_case,
)
from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.organization.models import Workcenter
from apps.workcenters.models import (
    LineProfile,
    Machine,
    MachineType,
    WorkcenterCapacityDay,
    WorkcenterLoadSnapshot,
)
from apps.workcenters.services.capacity import (
    calculate_available_capacity,
    get_capacity_definition,
    serialize_capacity_definition,
)
from apps.workcenters.services.load import get_current_constraint, get_workcenter_queue


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


@require_GET
@api_permission_required("workcenters.view_load")
def workcenter_load_view(_request):
    snapshots = (
        WorkcenterLoadSnapshot.objects.filter(is_active=True)
        .select_related("workcenter", "workcenter__factory", "top_affected_order")
        .order_by("-snapshot_date", "-utilization_percent", "workcenter__code")[:100]
    )
    return api_response([serialize_workcenter_load(snapshot) for snapshot in snapshots])


@require_GET
@api_permission_required("workcenters.view_queue")
def workcenter_queue_view(_request, workcenter_id):
    workcenter = get_object_or_404(Workcenter, id=workcenter_id)
    rows = get_workcenter_queue(workcenter)
    return api_response(
        [
            {
                "id": str(row.id),
                "workcenterId": str(row.workcenter_id),
                "workcenterCode": row.workcenter.code,
                "snapshotDate": row.snapshot_date.isoformat(),
                "orderId": str(row.order_id) if row.order_id else None,
                "orderNo": row.order.order_no if row.order else None,
                "queueStage": row.queue_stage,
                "queueQuantity": row.queue_quantity,
                "ageHours": row.age_hours,
                "riskStatus": row.risk_status,
                "ownerLabel": row.owner_label,
                "nextAction": row.next_action,
            }
            for row in rows
        ]
    )


@require_GET
@api_permission_required("workcenters.view_load")
def current_constraint_view(_request):
    snapshot = get_current_constraint()
    return api_response(serialize_workcenter_load(snapshot) if snapshot else None)


@require_POST
@api_permission_required("capacity.view_events")
def capacity_event_impact_preview_view(request):
    try:
        payload = _payload(request)
        impact = preview_boundary_case(
            event_type=payload.get("eventType", BoundaryEventType.CAPACITY_LOSS),
            payload=payload.get("payload", payload),
            user=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("CAPACITY_EVENT_PREVIEW_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_impact(impact))


@require_POST
@api_permission_required("capacity.create_loss_event")
def capacity_event_create_view(request):
    try:
        payload = _payload(request)
        event_type = payload.get("eventType", BoundaryEventType.CAPACITY_LOSS)
        event = create_boundary_case(
            event_type=event_type,
            payload=payload.get("payload", payload),
            created_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("CAPACITY_EVENT_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_boundary_event(event), status=201)


@require_POST
@api_permission_required("capacity.approve_addition")
def capacity_event_approve_view(request, event_id):
    event = get_object_or_404(BoundaryCaseEvent, id=event_id)
    try:
        event = approve_boundary_action(event, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("CAPACITY_EVENT_APPROVAL_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_boundary_event(event))


@require_POST
@api_permission_required("capacity.apply_event")
def capacity_event_apply_view(request, event_id):
    event = get_object_or_404(BoundaryCaseEvent, id=event_id)
    try:
        event = apply_boundary_action(event, applied_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("CAPACITY_EVENT_APPLY_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_boundary_event(event))


def serialize_workcenter_load(snapshot: WorkcenterLoadSnapshot) -> dict[str, object]:
    capacity_definition = get_capacity_definition(snapshot.workcenter)
    return {
        "id": str(snapshot.id),
        "workcenterId": str(snapshot.workcenter_id),
        "workcenterCode": snapshot.workcenter.code,
        "workcenterName": snapshot.workcenter.name,
        "workcenterType": snapshot.workcenter.workcenter_type,
        "factoryCode": snapshot.workcenter.factory.code,
        "snapshotDate": snapshot.snapshot_date.isoformat(),
        "availableMinutes": snapshot.available_minutes,
        "plannedLoadMinutes": snapshot.planned_load_minutes,
        "actualLoadMinutes": snapshot.actual_load_minutes,
        "utilizationPercent": float(snapshot.utilization_percent),
        "queueQuantity": snapshot.queue_quantity,
        "oldestQueueAgeHours": snapshot.oldest_queue_age_hours,
        "constraintStatus": snapshot.constraint_status,
        "riskStatus": snapshot.risk_status,
        "topAffectedOrderId": str(snapshot.top_affected_order_id)
        if snapshot.top_affected_order_id
        else None,
        "topAffectedOrderNo": snapshot.top_affected_order.order_no
        if snapshot.top_affected_order
        else None,
        "suggestedAction": snapshot.suggested_action,
        "capacityDefinition": serialize_capacity_definition(capacity_definition),
    }


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return "Capacity event payload is invalid."
