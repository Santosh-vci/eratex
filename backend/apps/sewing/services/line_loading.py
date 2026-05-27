from decimal import Decimal
from math import ceil

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import ApprovalStatus, RiskStatus
from apps.organization.models import Line
from apps.production_release.models import ProductionReleaseStatus, ProductionReleaseType
from apps.sewing.models import (
    LineFitStatus,
    LineLoadingStatus,
    SewingLineAssignment,
    SewingLineLoading,
)
from apps.style_technical.models import OperationBulletin
from apps.workcenters.models import LineMachineAssignment, LineProfile, Operator, OperatorSkill
from apps.workcenters.services.capacity import calculate_available_capacity, get_capacity_definition


def _next_no(prefix: str, model) -> str:
    return f"{prefix}-{model.objects.count() + 1:05d}"


def validate_operation_bulletin_for_loading(
    bulletin: OperationBulletin | None,
    *,
    approved_exception=None,
) -> None:
    if bulletin and bulletin.status == ApprovalStatus.APPROVED:
        return
    if approved_exception and approved_exception.status == "APPROVED":
        return
    raise ValidationError(
        "Line loading requires an approved operation bulletin or approved exception."
    )


def _line_profile(line: Line) -> LineProfile | None:
    return getattr(line, "profile", None)


def _line_available_machine_types(line: Line) -> dict[str, int]:
    assignments = LineMachineAssignment.objects.filter(
        line=line,
        assigned_to__isnull=True,
        machine__status__in=["AVAILABLE", "ASSIGNED"],
        is_active=True,
    ).select_related("machine__machine_type")
    counts: dict[str, int] = {}
    for assignment in assignments:
        code = assignment.machine.machine_type.code
        counts[code] = counts.get(code, 0) + 1
    return counts


def _line_available_skills(line: Line) -> dict[str, int]:
    operators = Operator.objects.filter(line=line, is_active=True)
    skills = OperatorSkill.objects.filter(operator__in=operators, is_active=True).select_related(
        "operation"
    )
    counts: dict[str, int] = {}
    for skill in skills:
        if skill.skill_level in {"HIGH", "EXPERT"}:
            counts[skill.operation.name] = counts.get(skill.operation.name, 0) + 1
    return counts


def preview_line_loading(
    *,
    release,
    line: Line,
    bulletin: OperationBulletin,
    planned_quantity: int | None = None,
    approved_exception=None,
) -> dict[str, object]:
    validate_operation_bulletin_for_loading(bulletin, approved_exception=approved_exception)
    if release.release_type not in {ProductionReleaseType.CUTTING, ProductionReleaseType.SEWING}:
        raise ValidationError("Line loading requires a cutting or sewing production release.")
    if release.status not in {
        ProductionReleaseStatus.READY,
        ProductionReleaseStatus.RELEASED,
        ProductionReleaseStatus.COMPLETED,
    }:
        raise ValidationError(
            "Line loading requires a ready, released, or completed production release."
        )
    if bulletin.style_id != release.order.style_id:
        raise ValidationError("Operation bulletin style does not match release order style.")

    quantity = planned_quantity or (
        release.planned_work_item.planned_quantity
        if release.planned_work_item
        else release.order.order_qty
    )
    profile = _line_profile(line)
    capacity = calculate_available_capacity(profile) if profile else {"availableMinutes": 0}
    available_minutes = int(capacity["availableMinutes"])
    total_smv = Decimal(bulletin.total_smv or 0)
    target_output = int(Decimal(available_minutes) / total_smv) if total_smv else 0
    target_efficiency = Decimal(str(profile.baseline_efficiency if profile else 0))
    machine_gaps = calculate_machine_gaps(line, bulletin, target_output)
    skill_gaps = calculate_skill_gaps(line, bulletin)
    fit_status = (
        LineFitStatus.FIT
        if not machine_gaps and not skill_gaps
        else LineFitStatus.ACCEPTABLE_WITH_REALIGNMENT
    )
    risk = RiskStatus.ON_TRACK if fit_status == LineFitStatus.FIT else RiskStatus.WATCH
    definition = get_capacity_definition(line.workcenter) if line.workcenter else None
    return {
        "releaseId": str(release.id),
        "releaseNo": release.release_no,
        "orderId": str(release.order_id),
        "orderNo": release.order.order_no,
        "lineId": str(line.id),
        "lineCode": line.code,
        "bulletinId": str(bulletin.id),
        "bulletinVersion": bulletin.version,
        "styleCode": bulletin.style.style_code,
        "styleSmv": float(total_smv),
        "plannedQuantity": quantity,
        "dailyTarget": target_output,
        "targetEfficiency": float(target_efficiency),
        "expectedDefectRate": 4.5,
        "availableMinutes": available_minutes,
        "fitStatus": fit_status,
        "riskStatus": risk,
        "machineGaps": machine_gaps,
        "skillGaps": skill_gaps,
        "capacityDefinition": {
            "workcenterType": definition.workcenter_type,
            "capacityUnit": definition.capacity_unit,
            "planningBucket": definition.planning_bucket,
        }
        if definition
        else None,
        "approvalRequired": bool(machine_gaps or skill_gaps),
        "warnings": ["Line realignment recommended before activation"]
        if machine_gaps or skill_gaps
        else [],
    }


def calculate_machine_gaps(
    line: Line, bulletin: OperationBulletin, target_output: int
) -> list[dict[str, object]]:
    available = _line_available_machine_types(line)
    required: dict[str, int] = {}
    for operation in bulletin.lines.select_related("machine_type").all():
        if not operation.machine_type:
            continue
        count = max(1, ceil(float(operation.smv or 0) * max(target_output, 1) / 480))
        required[operation.machine_type.code] = max(
            required.get(operation.machine_type.code, 0), count
        )
    gaps = []
    for machine_type, required_count in required.items():
        available_count = available.get(machine_type, 0)
        gap = required_count - available_count
        if gap > 0:
            gaps.append(
                {
                    "machineType": machine_type,
                    "required": required_count,
                    "available": available_count,
                    "gap": gap,
                    "recommendation": f"Add {gap} {machine_type} machine(s) before line start.",
                }
            )
    return gaps


def calculate_skill_gaps(line: Line, bulletin: OperationBulletin) -> list[dict[str, object]]:
    available = _line_available_skills(line)
    gaps = []
    for operation in bulletin.lines.filter(critical_operation=True):
        required = 1
        available_count = available.get(operation.operation_name, 0)
        gap = required - available_count
        if gap > 0:
            gaps.append(
                {
                    "operationName": operation.operation_name,
                    "requiredSkill": operation.skill_level,
                    "requiredOperators": required,
                    "availableOperators": available_count,
                    "gap": gap,
                    "recommendation": (
                        f"Assign one {operation.skill_level.lower()} operator for "
                        f"{operation.operation_name}."
                    ),
                }
            )
    return gaps


@transaction.atomic
def load_line(
    *,
    release,
    line: Line,
    bulletin: OperationBulletin,
    planned_quantity: int | None = None,
    approved_exception=None,
    loaded_by=None,
) -> SewingLineLoading:
    preview = preview_line_loading(
        release=release,
        line=line,
        bulletin=bulletin,
        planned_quantity=planned_quantity,
        approved_exception=approved_exception,
    )
    item = release.planned_work_item
    loading, _ = SewingLineLoading.objects.update_or_create(
        release=release,
        line=line,
        defaults={
            "loading_no": f"LOAD-{release.release_no}-{line.code}",
            "planned_work_item": item,
            "order": release.order,
            "workcenter": line.workcenter or release.workcenter,
            "bulletin": bulletin,
            "approved_exception": approved_exception,
            "planned_quantity": int(preview["plannedQuantity"]),
            "target_output_per_day": int(preview["dailyTarget"]),
            "target_efficiency": Decimal(str(preview["targetEfficiency"])),
            "expected_defect_rate": Decimal(str(preview["expectedDefectRate"])),
            "planning_zone": item.planning_zone if item else "FLEXIBLE_ZONE",
            "planned_shift": item.planned_shift if item else "DAY",
            "color_code": item.color_code if item else "",
            "shade_lot": item.shade_lot if item else "",
            "fit_status": preview["fitStatus"],
            "status": LineLoadingStatus.READY
            if preview["fitStatus"] != LineFitStatus.BLOCKED
            else LineLoadingStatus.BLOCKED,
            "risk_status": preview["riskStatus"],
            "created_by": loaded_by,
            "updated_by": loaded_by,
        },
    )
    profile = _line_profile(line)
    SewingLineAssignment.objects.update_or_create(
        line_loading=loading,
        line=line,
        defaults={
            "operator_count": profile.current_manpower if profile else 0,
            "machine_count": line.machine_assignments.filter(assigned_to__isnull=True).count(),
            "effective_from": timezone.now(),
            "created_by": loaded_by,
            "updated_by": loaded_by,
        },
    )
    write_audit_event(
        event_code="LINE_LOADED",
        entity_type="SewingLineLoading",
        entity_id=str(loading.id),
        entity_display_code=loading.loading_no,
        action="load_line",
        performed_by=loaded_by,
        new_value_json=preview,
    )
    return loading


@transaction.atomic
def activate_line_loading(loading: SewingLineLoading, *, activated_by=None) -> SewingLineLoading:
    if loading.status not in {LineLoadingStatus.READY, LineLoadingStatus.ACTIVE}:
        raise ValidationError("Only ready line loading can be activated.")
    loading.status = LineLoadingStatus.ACTIVE
    loading.activated_at = loading.activated_at or timezone.now()
    loading.updated_by = activated_by
    loading.order.current_stage = "SEWING"
    loading.order.lifecycle_status = "SEWING"
    loading.order.save(update_fields=["current_stage", "lifecycle_status", "updated_at"])
    loading.save(update_fields=["status", "activated_at", "updated_by", "updated_at"])
    write_audit_event(
        event_code="LINE_LOADING_ACTIVATED",
        entity_type="SewingLineLoading",
        entity_id=str(loading.id),
        entity_display_code=loading.loading_no,
        action="activate_line_loading",
        performed_by=activated_by,
    )
    return loading


@transaction.atomic
def close_line_loading(loading: SewingLineLoading, *, closed_by=None) -> SewingLineLoading:
    loading.status = LineLoadingStatus.CLOSED
    loading.closed_at = timezone.now()
    loading.updated_by = closed_by
    loading.save(update_fields=["status", "closed_at", "updated_by", "updated_at"])
    write_audit_event(
        event_code="LINE_LOADING_CLOSED",
        entity_type="SewingLineLoading",
        entity_id=str(loading.id),
        entity_display_code=loading.loading_no,
        action="close_line_loading",
        performed_by=closed_by,
    )
    return loading
