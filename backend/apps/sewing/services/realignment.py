from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import RiskStatus
from apps.sewing.models import (
    LineRealignmentGap,
    LineRealignmentGapType,
    LineRealignmentRequest,
    LineRealignmentStatus,
)
from apps.sewing.services.line_loading import calculate_machine_gaps, calculate_skill_gaps


def _next_no(prefix: str, model) -> str:
    return f"{prefix}-{model.objects.count() + 1:05d}"


def preview_line_realignment(
    *,
    line,
    bulletin,
    target_output: int,
    line_loading=None,
) -> dict[str, object]:
    machine_gaps = calculate_machine_gaps(line, bulletin, target_output)
    skill_gaps = calculate_skill_gaps(line, bulletin)
    total_gap = sum(gap["gap"] for gap in machine_gaps) + sum(gap["gap"] for gap in skill_gaps)
    expected_before = max(target_output - (total_gap * 80), 0)
    expected_after = max(target_output - (len(skill_gaps) * 20), expected_before)
    bottlenecks = [
        {"operationName": line_gap["operationName"], "loadPercent": 128}
        for line_gap in skill_gaps[:3]
    ]
    recommendations = [gap["recommendation"] for gap in machine_gaps] + [
        gap["recommendation"] for gap in skill_gaps
    ]
    if not recommendations:
        recommendations = ["No realignment required for this target."]
    return {
        "lineId": str(line.id),
        "lineCode": line.code,
        "lineLoadingId": str(line_loading.id) if line_loading else None,
        "orderId": str(line_loading.order_id) if line_loading else None,
        "orderNo": line_loading.order.order_no if line_loading else "",
        "styleCode": bulletin.style.style_code,
        "bulletinId": str(bulletin.id),
        "bulletinVersion": bulletin.version,
        "fitStatus": "FIT" if total_gap == 0 else "ACCEPTABLE_WITH_REALIGNMENT",
        "expectedOutputBefore": expected_before,
        "expectedOutputAfter": expected_after,
        "changeoverMinutes": 45 + total_gap * 30,
        "machineGaps": machine_gaps,
        "skillGaps": skill_gaps,
        "bottleneckOperations": bottlenecks,
        "recommendations": recommendations,
        "approvalRequired": total_gap > 0,
        "riskStatus": RiskStatus.ON_TRACK if total_gap == 0 else RiskStatus.WATCH,
    }


@transaction.atomic
def request_line_realignment(
    *,
    line,
    bulletin,
    target_output: int,
    line_loading=None,
    requested_by=None,
) -> LineRealignmentRequest:
    if not line_loading:
        raise ValidationError("Line realignment requires a line loading context.")
    preview = preview_line_realignment(
        line=line,
        bulletin=bulletin,
        target_output=target_output,
        line_loading=line_loading,
    )
    request = LineRealignmentRequest.objects.create(
        request_no=_next_no("REALIGN", LineRealignmentRequest),
        line_loading=line_loading,
        line=line,
        order=line_loading.order,
        bulletin=bulletin,
        status=LineRealignmentStatus.UNDER_REVIEW,
        fit_status=preview["fitStatus"],
        target_output=target_output,
        expected_output_before=preview["expectedOutputBefore"],
        expected_output_after=preview["expectedOutputAfter"],
        changeover_minutes=preview["changeoverMinutes"],
        approval_required=preview["approvalRequired"],
        risk_status=preview["riskStatus"],
        recommendations_json=preview["recommendations"],
        requested_by=requested_by,
        created_by=requested_by,
        updated_by=requested_by,
    )
    for gap in preview["machineGaps"]:
        LineRealignmentGap.objects.create(
            realignment=request,
            gap_type=LineRealignmentGapType.MACHINE,
            label=gap["machineType"],
            required=gap["required"],
            available=gap["available"],
            gap=gap["gap"],
            recommendation=gap["recommendation"],
        )
    for gap in preview["skillGaps"]:
        LineRealignmentGap.objects.create(
            realignment=request,
            gap_type=LineRealignmentGapType.SKILL,
            label=gap["operationName"],
            required=gap["requiredOperators"],
            available=gap["availableOperators"],
            gap=gap["gap"],
            recommendation=gap["recommendation"],
        )
    write_audit_event(
        event_code="LINE_REALIGNMENT_REQUESTED",
        entity_type="LineRealignmentRequest",
        entity_id=str(request.id),
        entity_display_code=request.request_no,
        action="request_line_realignment",
        performed_by=requested_by,
        new_value_json=preview,
    )
    return request


@transaction.atomic
def approve_line_realignment(
    realignment: LineRealignmentRequest, *, approved_by=None
) -> LineRealignmentRequest:
    if realignment.status not in {
        LineRealignmentStatus.UNDER_REVIEW,
        LineRealignmentStatus.PROPOSED,
    }:
        raise ValidationError("Only proposed realignment can be approved.")
    realignment.status = LineRealignmentStatus.APPROVED
    realignment.approved_by = approved_by
    realignment.approved_at = timezone.now()
    realignment.updated_by = approved_by
    realignment.save(
        update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"]
    )
    write_audit_event(
        event_code="LINE_REALIGNMENT_APPROVED",
        entity_type="LineRealignmentRequest",
        entity_id=str(realignment.id),
        entity_display_code=realignment.request_no,
        action="approve_line_realignment",
        performed_by=approved_by,
    )
    return realignment


@transaction.atomic
def apply_line_realignment(
    realignment: LineRealignmentRequest, *, applied_by=None
) -> LineRealignmentRequest:
    if realignment.approval_required and realignment.status != LineRealignmentStatus.APPROVED:
        raise ValidationError("Realignment must be approved before application.")
    realignment.status = LineRealignmentStatus.APPLIED
    realignment.applied_by = applied_by
    realignment.applied_at = timezone.now()
    realignment.updated_by = applied_by
    realignment.save(
        update_fields=["status", "applied_by", "applied_at", "updated_by", "updated_at"]
    )
    if realignment.line_loading:
        realignment.line_loading.target_output_per_day = realignment.expected_output_after
        realignment.line_loading.risk_status = RiskStatus.ON_TRACK
        realignment.line_loading.updated_by = applied_by
        realignment.line_loading.save(
            update_fields=["target_output_per_day", "risk_status", "updated_by", "updated_at"]
        )
    write_audit_event(
        event_code="LINE_REALIGNMENT_APPLIED",
        entity_type="LineRealignmentRequest",
        entity_id=str(realignment.id),
        entity_display_code=realignment.request_no,
        action="apply_line_realignment",
        performed_by=applied_by,
    )
    return realignment


@transaction.atomic
def reject_line_realignment(
    realignment: LineRealignmentRequest, *, rejected_by=None
) -> LineRealignmentRequest:
    realignment.status = LineRealignmentStatus.REJECTED
    realignment.updated_by = rejected_by
    realignment.save(update_fields=["status", "updated_by", "updated_at"])
    write_audit_event(
        event_code="LINE_REALIGNMENT_REJECTED",
        entity_type="LineRealignmentRequest",
        entity_id=str(realignment.id),
        entity_display_code=realignment.request_no,
        action="reject_line_realignment",
        performed_by=rejected_by,
    )
    return realignment
