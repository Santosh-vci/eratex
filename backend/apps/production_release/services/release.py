from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.boundary_cases.models import BoundaryCaseEvent, BoundaryEventStatus
from apps.common.models import RiskStatus
from apps.fabric_qc.models import FabricQcStatus, FabricRoll
from apps.materials_procurement.services.readiness import calculate_material_readiness
from apps.orders.models import OrderStage, ProductionOrder
from apps.orders.services.lifecycle import record_lifecycle_event
from apps.pcd_readiness.models import PCDReadinessStatus
from apps.production_release.models import (
    ProductionRelease,
    ProductionReleaseStatus,
    ReleaseBlocker,
    ReleaseValidationResult,
)
from apps.workcenters.models import ConstraintStatus
from apps.workcenters.services.load import calculate_load


def validate_release(
    *,
    planned_work_item=None,
    order: ProductionOrder | None = None,
    release: ProductionRelease | None = None,
    checked_by=None,
) -> ReleaseValidationResult:
    if planned_work_item is None and order is None and release is None:
        raise ValidationError("A planned work item, order, or release is required.")
    if release and planned_work_item is None:
        planned_work_item = release.planned_work_item
    if order is None:
        order = release.order if release else planned_work_item.order
    workcenter = release.workcenter if release else planned_work_item.workcenter
    start_date = release.release_date if release else planned_work_item.planned_start_date
    end_date = release.release_date if release else planned_work_item.planned_end_date
    checks: list[dict[str, object]] = []
    blockers: list[dict[str, object]] = []

    _append_check(
        checks,
        blockers,
        code="PCD_READY",
        passed=_pcd_ready(order),
        owner="Planning",
        fail_message="PCD readiness is not ready or conditionally ready.",
    )
    material = calculate_material_readiness(order)
    _append_check(
        checks,
        blockers,
        code="MATERIAL_READY",
        passed=material["readinessStatus"] != "BLOCKED",
        owner="Procurement",
        fail_message="Material readiness has blockers.",
    )
    fabric_status = _fabric_status(order)
    _append_check(
        checks,
        blockers,
        code="FABRIC_QC_CLEAR",
        passed=fabric_status not in {FabricQcStatus.FAILED, FabricQcStatus.HOLD},
        owner="Fabric QC",
        fail_message=f"Fabric QC is {fabric_status}.",
    )
    load = calculate_load(
        workcenter,
        start_date=start_date,
        end_date=end_date,
        persist=True,
    )
    _append_check(
        checks,
        blockers,
        code="CAPACITY_VISIBLE",
        passed=load["availableMinutes"] > 0,
        owner="Capacity",
        fail_message="Capacity is missing for this workcenter.",
    )
    _append_check(
        checks,
        blockers,
        code="CONSTRAINT_ACCEPTABLE",
        passed=load["constraintStatus"] != ConstraintStatus.CRITICAL,
        owner="Capacity",
        fail_message="Current constraint is critical.",
    )
    unresolved_boundary_events = BoundaryCaseEvent.objects.filter(
        is_active=True,
        status__in=[
            BoundaryEventStatus.OPEN,
            BoundaryEventStatus.IMPACT_PREVIEWED,
            BoundaryEventStatus.ACTION_PROPOSED,
            BoundaryEventStatus.APPROVAL_REQUIRED,
            BoundaryEventStatus.APPROVED,
        ],
    ).filter(linked_order=order)
    if workcenter:
        unresolved_boundary_events = unresolved_boundary_events | BoundaryCaseEvent.objects.filter(
            is_active=True,
            linked_workcenter=workcenter,
            status__in=[
                BoundaryEventStatus.OPEN,
                BoundaryEventStatus.IMPACT_PREVIEWED,
                BoundaryEventStatus.ACTION_PROPOSED,
                BoundaryEventStatus.APPROVAL_REQUIRED,
                BoundaryEventStatus.APPROVED,
            ],
        )
    _append_check(
        checks,
        blockers,
        code="BOUNDARY_CASES_CLEARED",
        passed=not unresolved_boundary_events.exists(),
        owner="Planning",
        fail_message="Unresolved scheduling boundary case blocks release.",
    )
    _append_check(
        checks,
        blockers,
        code="PREVIOUS_GATE_CLEAR",
        passed=True,
        owner="Planning",
        fail_message="Previous gate is not clear.",
    )

    is_valid = not blockers
    risk = RiskStatus.ON_TRACK
    if blockers:
        has_critical = any(row["severity"] == "CRITICAL" for row in blockers)
        risk = RiskStatus.CRITICAL if has_critical else RiskStatus.ACTION
    elif load["constraintStatus"] == ConstraintStatus.OVERLOADED:
        risk = RiskStatus.WATCH
    result = ReleaseValidationResult.objects.create(
        release=release,
        planned_work_item=planned_work_item,
        order=order,
        is_valid=is_valid,
        risk_status=risk,
        checks=checks,
        blockers=blockers,
        created_by=checked_by,
        updated_by=checked_by,
    )
    for blocker in blockers:
        ReleaseBlocker.objects.create(
            release=release,
            validation_result=result,
            blocker_code=blocker["code"],
            message=blocker["message"],
            severity=blocker["severity"],
            owner_role=blocker["owner"],
            created_by=checked_by,
            updated_by=checked_by,
        )
    return result


@transaction.atomic
def create_release(*, planned_work_item, release_date=None, created_by=None) -> ProductionRelease:
    release_date = release_date or timezone.localdate()
    validation = validate_release(
        planned_work_item=planned_work_item,
        checked_by=created_by,
    )
    if not validation.is_valid:
        raise ValidationError("Release is blocked. Request an override before issuing release.")
    release, _ = ProductionRelease.objects.update_or_create(
        release_no=f"REL-{planned_work_item.order.order_no}-{release_date:%Y%m%d}",
        defaults={
            "planned_work_item": planned_work_item,
            "order": planned_work_item.order,
            "workcenter": planned_work_item.workcenter,
            "release_date": release_date,
            "status": ProductionReleaseStatus.RELEASED,
            "risk_status": validation.risk_status,
            "released_by": created_by,
            "released_at": timezone.now(),
            "created_by": created_by,
            "updated_by": created_by,
            "is_active": True,
        },
    )
    validation.release = release
    validation.save(update_fields=["release", "updated_at"])
    planned_work_item.status = "RELEASED"
    planned_work_item.updated_by = created_by
    planned_work_item.save(update_fields=["status", "updated_by", "updated_at"])
    record_lifecycle_event(
        planned_work_item.order,
        event_code="production_release.created",
        to_stage=OrderStage.CUTTING,
        message="Daily production release issued.",
        performed_by=created_by,
        metadata={"releaseId": str(release.id), "releaseNo": release.release_no},
    )
    _audit_release(release, "RELEASE_CREATED", "create", created_by)
    return release


@transaction.atomic
def request_release_override(release: ProductionRelease, *, reason: str, requested_by=None):
    if not reason:
        raise ValidationError("Override reason is required.")
    release.status = ProductionReleaseStatus.OVERRIDE_REQUESTED
    release.override_reason = reason
    release.override_requested_by = requested_by
    release.updated_by = requested_by
    release.save(
        update_fields=[
            "status",
            "override_reason",
            "override_requested_by",
            "updated_by",
            "updated_at",
        ]
    )
    _audit_release(release, "RELEASE_OVERRIDE_REQUESTED", "request_override", requested_by, reason)
    return release


@transaction.atomic
def approve_release_override(release: ProductionRelease, *, approved_by=None, reason: str = ""):
    if release.status != ProductionReleaseStatus.OVERRIDE_REQUESTED:
        raise ValidationError("Only requested overrides can be approved.")
    release.status = ProductionReleaseStatus.OVERRIDE_APPROVED
    release.override_approved_by = approved_by
    release.updated_by = approved_by
    if reason:
        release.override_reason = reason
    release.save(
        update_fields=[
            "status",
            "override_approved_by",
            "override_reason",
            "updated_by",
            "updated_at",
        ]
    )
    _audit_release(release, "RELEASE_OVERRIDE_APPROVED", "approve_override", approved_by, reason)
    return release


@transaction.atomic
def complete_release(release: ProductionRelease, *, completed_by=None) -> ProductionRelease:
    if release.status not in {
        ProductionReleaseStatus.RELEASED,
        ProductionReleaseStatus.OVERRIDE_APPROVED,
    }:
        raise ValidationError("Only released or override-approved releases can be completed.")
    release.status = ProductionReleaseStatus.COMPLETED
    release.completed_at = timezone.now()
    release.updated_by = completed_by
    release.save(update_fields=["status", "completed_at", "updated_by", "updated_at"])
    _audit_release(release, "RELEASE_COMPLETED", "complete", completed_by)
    return release


def _append_check(checks, blockers, *, code, passed, owner, fail_message):
    check = {"code": code, "passed": bool(passed), "owner": owner}
    checks.append(check)
    if not passed:
        blockers.append(
            {
                "code": code,
                "message": fail_message,
                "severity": "CRITICAL" if code in {"PCD_READY", "FABRIC_QC_CLEAR"} else "ACTION",
                "owner": owner,
            }
        )


def _pcd_ready(order: ProductionOrder) -> bool:
    readiness = getattr(order, "pcd_readiness", None)
    if not readiness:
        return False
    return readiness.readiness_status in {
        PCDReadinessStatus.READY,
        PCDReadinessStatus.CONDITIONALLY_READY,
        PCDReadinessStatus.RELEASED,
    }


def _fabric_status(order: ProductionOrder) -> str:
    statuses = set(
        FabricRoll.objects.filter(fabric_lot__order=order, is_active=True).values_list(
            "qc_status",
            flat=True,
        )
    )
    if not statuses:
        return FabricQcStatus.PENDING
    if FabricQcStatus.FAILED in statuses:
        return FabricQcStatus.FAILED
    if FabricQcStatus.HOLD in statuses:
        return FabricQcStatus.HOLD
    if FabricQcStatus.PENDING in statuses:
        return FabricQcStatus.PENDING
    if FabricQcStatus.WAIVED in statuses:
        return FabricQcStatus.WAIVED
    return FabricQcStatus.PASSED


def _audit_release(release, event_code, action, user, reason: str = "") -> None:
    write_audit_event(
        event_code=event_code,
        entity_type="ProductionRelease",
        entity_id=str(release.id),
        entity_display_code=release.release_no,
        action=action,
        performed_by=user,
        new_value_json={"status": release.status},
        reason=reason,
        source="WEB" if user else "SEED",
    )
