import json
from datetime import date

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.orders.api import serialize_order
from apps.orders.models import ProductionOrder
from apps.organization.models import Workcenter
from apps.planning.models import PlanChangeRequest, PlannedWorkItem, PlanningHorizon, PlanVersion
from apps.planning.services.planning import (
    approve_plan_change,
    assign_work_item,
    calculate_plan_impact,
    create_plan_version,
    default_plan_dates,
    freeze_plan,
    get_eligible_backlog,
    request_plan_change,
)
from apps.workcenters.services.load import calculate_load


@api_permission_required("planning.view")
def weekly_planning_view(request):
    if request.method == "GET":
        plan = _current_plan()
        if plan is None:
            return api_response(
                {
                    "horizon": None,
                    "plan": None,
                    "backlog": [],
                    "workItems": [],
                    "workcenterLoads": [],
                    "changeRequests": [],
                }
            )
        loads = [
            serialize_load(
                calculate_load(
                    item.workcenter,
                    start_date=plan.horizon.start_date,
                    end_date=plan.horizon.end_date,
                    horizon=plan.horizon,
                )
            )
            for item in plan.work_items.filter(is_active=True).select_related(
                "workcenter", "workcenter__factory"
            )
        ]
        return api_response(
            {
                "horizon": serialize_horizon(plan.horizon),
                "plan": serialize_plan(plan),
                "backlog": [
                    serialize_backlog_order(order) for order in get_eligible_backlog(plan)
                ],
                "workItems": [
                    serialize_work_item(item)
                    for item in plan.work_items.filter(is_active=True).select_related(
                        "order",
                        "order__customer",
                        "order__style",
                        "workcenter",
                        "line",
                    )
                ],
                "workcenterLoads": loads,
                "changeRequests": [
                    serialize_change_request(change)
                    for change in plan.change_requests.select_related("work_item").all()[:20]
                ],
            }
        )
    if request.method == "POST":
        from apps.identity_access.services.permissions import user_has_permission

        if not user_has_permission(request.user, "planning.create"):
            return api_response(
                None,
                errors=error_response("PERMISSION_DENIED", "Permission denied."),
                status=403,
            )
        horizon = _current_horizon()
        plan = create_plan_version(horizon=horizon, created_by=request.user)
        return api_response(
            {"horizon": serialize_horizon(horizon), "plan": serialize_plan(plan)},
            status=201,
        )
    return api_response(
        None,
        errors=error_response("METHOD_NOT_ALLOWED", "Method is not allowed."),
        status=405,
    )


@require_POST
@api_permission_required("planning.assign")
def weekly_plan_assign_item_view(request, plan_id):
    plan = get_object_or_404(PlanVersion, id=plan_id)
    try:
        payload = _payload(request)
        order = ProductionOrder.objects.get(id=payload["orderId"])
        workcenter = Workcenter.objects.get(id=payload["workcenterId"])
        item = assign_work_item(
            plan_version=plan,
            order=order,
            workcenter=workcenter,
            planned_quantity=int(payload.get("plannedQuantity") or order.order_qty),
            planned_start_date=_parse_date(
                payload.get("plannedStartDate"),
                plan.horizon.start_date,
            ),
            planned_end_date=_parse_date(payload.get("plannedEndDate"), plan.horizon.end_date),
            assigned_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        ProductionOrder.DoesNotExist,
        Workcenter.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None,
            errors=error_response("PLAN_ASSIGNMENT_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_work_item(item), status=201)


@require_POST
@api_permission_required("planning.impact_preview")
def weekly_plan_impact_preview_view(request, plan_id):
    plan = get_object_or_404(PlanVersion, id=plan_id)
    try:
        payload = _payload(request)
        order = ProductionOrder.objects.get(id=payload["orderId"])
        workcenter = Workcenter.objects.get(id=payload["workcenterId"])
        impact = calculate_plan_impact(
            plan_version=plan,
            order=order,
            workcenter=workcenter,
            planned_quantity=int(payload.get("plannedQuantity") or order.order_qty),
            planned_start_date=_parse_date(
                payload.get("plannedStartDate"),
                plan.horizon.start_date,
            ),
            planned_end_date=_parse_date(payload.get("plannedEndDate"), plan.horizon.end_date),
        )
    except (
        json.JSONDecodeError,
        KeyError,
        ProductionOrder.DoesNotExist,
        Workcenter.DoesNotExist,
        ValidationError,
        ValueError,
    ) as error:
        return api_response(
            None,
            errors=error_response("PLAN_IMPACT_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(impact)


@require_POST
@api_permission_required("planning.freeze")
def weekly_plan_freeze_view(request, plan_id):
    plan = get_object_or_404(PlanVersion, id=plan_id)
    try:
        plan = freeze_plan(plan, frozen_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("PLAN_FREEZE_BLOCKED", _error_message(error)),
            status=400,
        )
    return api_response(serialize_plan(plan))


@require_POST
@api_permission_required("planning.request_change")
def plan_change_request_view(request):
    try:
        payload = _payload(request)
        plan = PlanVersion.objects.get(id=payload["planId"])
        work_item = None
        if payload.get("workItemId"):
            work_item = PlannedWorkItem.objects.get(id=payload["workItemId"])
        change = request_plan_change(
            plan_version=plan,
            work_item=work_item,
            reason=payload.get("reason", ""),
            payload=payload.get("payload", {}),
            change_type=payload.get("changeType", "MOVE"),
            requested_by=request.user,
        )
    except (
        json.JSONDecodeError,
        KeyError,
        PlanVersion.DoesNotExist,
        PlannedWorkItem.DoesNotExist,
        ValidationError,
    ) as error:
        return api_response(
            None,
            errors=error_response("PLAN_CHANGE_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_change_request(change), status=201)


@require_POST
@api_permission_required("planning.approve_change")
def plan_change_approve_view(request, change_id):
    change = get_object_or_404(PlanChangeRequest, id=change_id)
    try:
        change = approve_plan_change(change, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("PLAN_CHANGE_APPROVAL_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_change_request(change))


def serialize_horizon(horizon: PlanningHorizon) -> dict[str, object]:
    return {
        "id": str(horizon.id),
        "code": horizon.code,
        "name": horizon.name,
        "startDate": horizon.start_date.isoformat(),
        "endDate": horizon.end_date.isoformat(),
        "status": horizon.status,
        "isCurrent": horizon.is_current,
    }


def serialize_plan(plan: PlanVersion) -> dict[str, object]:
    return {
        "id": str(plan.id),
        "horizonId": str(plan.horizon_id),
        "versionNo": plan.version_no,
        "status": plan.status,
        "riskStatus": plan.risk_status,
        "frozenAt": plan.frozen_at.isoformat() if plan.frozen_at else None,
        "notes": plan.notes,
    }


def serialize_backlog_order(order: ProductionOrder) -> dict[str, object]:
    data = serialize_order(order)
    data["readyReason"] = getattr(order, "pcd_readiness", None).readiness_status
    return data


def serialize_work_item(item: PlannedWorkItem) -> dict[str, object]:
    return {
        "id": str(item.id),
        "planVersionId": str(item.plan_version_id),
        "orderId": str(item.order_id),
        "orderNo": item.order.order_no,
        "styleCode": item.order.style.style_code,
        "customerName": item.order.customer.name,
        "workcenterId": str(item.workcenter_id),
        "workcenterCode": item.workcenter.code,
        "workcenterName": item.workcenter.name,
        "lineId": str(item.line_id) if item.line_id else None,
        "lineCode": item.line.code if item.line else None,
        "plannedStartDate": item.planned_start_date.isoformat(),
        "plannedEndDate": item.planned_end_date.isoformat(),
        "plannedQuantity": item.planned_quantity,
        "loadMinutes": item.load_minutes,
        "sequenceNo": item.sequence_no,
        "status": item.status,
        "riskStatus": item.risk_status,
        "locked": item.locked,
    }


def serialize_change_request(change: PlanChangeRequest) -> dict[str, object]:
    return {
        "id": str(change.id),
        "planVersionId": str(change.plan_version_id),
        "workItemId": str(change.work_item_id) if change.work_item_id else None,
        "changeType": change.change_type,
        "status": change.status,
        "reason": change.reason,
        "payload": change.payload,
        "impactPreview": change.impact_preview,
        "createdAt": change.created_at.isoformat(),
    }


def serialize_load(load: dict[str, object]) -> dict[str, object]:
    workcenter = load["workcenter"]
    top_order = load["topAffectedOrder"]
    return {
        "workcenterId": str(workcenter.id),
        "workcenterCode": workcenter.code,
        "workcenterName": workcenter.name,
        "availableMinutes": load["availableMinutes"],
        "plannedLoadMinutes": load["plannedLoadMinutes"],
        "utilizationPercent": load["utilizationPercent"],
        "queueQuantity": load["queueQuantity"],
        "constraintStatus": load["constraintStatus"],
        "riskStatus": load["riskStatus"],
        "topAffectedOrderNo": top_order.order_no if top_order else None,
        "suggestedAction": load["suggestedAction"],
    }


def _current_plan() -> PlanVersion | None:
    return (
        PlanVersion.objects.filter(horizon__is_current=True, is_active=True)
        .select_related("horizon")
        .order_by("-version_no")
        .first()
    )


def _current_horizon() -> PlanningHorizon:
    horizon = PlanningHorizon.objects.filter(is_current=True, is_active=True).first()
    if horizon:
        return horizon
    start, end = default_plan_dates()
    return PlanningHorizon.objects.create(
        code=f"WEEK-{start:%Y%m%d}",
        name=f"Week {start:%d %b}",
        start_date=start,
        end_date=end,
        status="ACTIVE",
        is_current=True,
    )


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _parse_date(value: str | None, default: date) -> date:
    return date.fromisoformat(value) if value else default


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return str(error) or "Request payload is invalid."
