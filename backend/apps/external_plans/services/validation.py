from datetime import date

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.external_plans.models import (
    ExternalPlanConflictType,
    ExternalPlanImportBatch,
    ExternalPlanImportStatus,
    ExternalPlanSourceType,
    ExternalPlanValidationResult,
)
from apps.orders.models import ProductionOrder
from apps.organization.models import Workcenter
from apps.pcd_readiness.models import PCDReadinessStatus
from apps.planning.models import PlanVersion, PlanVersionStatus
from apps.planning.services.planning import _calculate_order_load_minutes
from apps.planning.services.zones import assign_planning_zone
from apps.workcenters.services.load import calculate_load


@transaction.atomic
def import_external_plan(
    *,
    source_type: str,
    rows: list[dict],
    source_reference: str = "",
    imported_by=None,
) -> ExternalPlanImportBatch:
    if source_type not in {
        ExternalPlanSourceType.FASTREACT_PLAN,
        ExternalPlanSourceType.EXTERNAL_PLAN,
    }:
        raise ValidationError("Unsupported external plan source type.")
    if not isinstance(rows, list):
        raise ValidationError("External plan import rows must be a list.")
    batch = ExternalPlanImportBatch.objects.create(
        import_no=f"EXTPLAN-{timezone.now():%Y%m%d%H%M%S%f}",
        source_type=source_type,
        source_reference=source_reference,
        raw_rows_json=rows,
        imported_by=imported_by,
        created_by=imported_by,
        updated_by=imported_by,
    )
    validate_external_plan(batch, validated_by=imported_by)
    write_audit_event(
        event_code="EXTERNAL_PLAN_IMPORTED",
        entity_type="ExternalPlanImportBatch",
        entity_id=str(batch.id),
        entity_display_code=batch.import_no,
        action="import",
        performed_by=imported_by,
        new_value_json={"sourceType": source_type, "rowCount": len(rows)},
        source="WEB" if imported_by else "IMPORT",
    )
    return batch


@transaction.atomic
def validate_external_plan(
    batch: ExternalPlanImportBatch, *, validated_by=None
) -> ExternalPlanImportBatch:
    batch.validation_results.all().delete()
    conflicts = []
    for index, row in enumerate(batch.raw_rows_json, start=1):
        conflicts.extend(_validate_row(batch, index, row))
    summary = {
        "rowCount": len(batch.raw_rows_json),
        "conflictCount": len(conflicts),
        "validRowCount": max(
            len(batch.raw_rows_json) - len({conflict.row_number for conflict in conflicts}), 0
        ),
    }
    batch.status = ExternalPlanImportStatus.VALIDATED
    batch.validation_summary_json = summary
    batch.updated_by = validated_by
    batch.save(update_fields=["status", "validation_summary_json", "updated_by", "updated_at"])
    write_audit_event(
        event_code="EXTERNAL_PLAN_VALIDATED",
        entity_type="ExternalPlanImportBatch",
        entity_id=str(batch.id),
        entity_display_code=batch.import_no,
        action="validate",
        performed_by=validated_by,
        new_value_json=summary,
        source="WEB" if validated_by else "SYSTEM",
    )
    for conflict in conflicts:
        write_audit_event(
            event_code="EXTERNAL_PLAN_CONFLICT_FOUND",
            entity_type="ExternalPlanValidationResult",
            entity_id=str(conflict.id),
            entity_display_code=batch.import_no,
            action="conflict",
            performed_by=validated_by,
            new_value_json={"conflictType": conflict.conflict_type, "orderNo": conflict.order_no},
            source="WEB" if validated_by else "SYSTEM",
        )
    return batch


@transaction.atomic
def create_draft_plan_from_import(
    batch: ExternalPlanImportBatch, *, created_by=None
) -> PlanVersion:
    if batch.status == ExternalPlanImportStatus.REJECTED:
        raise ValidationError("Rejected external plan imports cannot create draft plans.")
    if batch.validation_results.filter(severity="CRITICAL").exists():
        raise ValidationError(
            "Resolve critical external plan conflicts before creating a draft plan."
        )
    from apps.planning.models import PlannedWorkItem, PlanningHorizon, PlanningHorizonStatus
    from apps.planning.services.planning import default_plan_dates

    start, end = default_plan_dates()
    horizon, _ = PlanningHorizon.objects.update_or_create(
        code=f"EXT-{batch.import_no[-14:]}",
        defaults={
            "name": f"External draft {batch.import_no}",
            "start_date": start,
            "end_date": end,
            "status": PlanningHorizonStatus.DRAFT,
            "is_current": False,
            "is_active": True,
        },
    )
    latest = horizon.versions.aggregate(max_version=Max("version_no"))["max_version"] or 0
    plan = PlanVersion.objects.create(
        horizon=horizon,
        version_no=latest + 1,
        status=PlanVersionStatus.DRAFT,
        notes=f"Draft created from {batch.source_type}; not committed schedule truth.",
        created_by=created_by,
        updated_by=created_by,
    )
    invalid_rows = set(batch.validation_results.values_list("row_number", flat=True))
    for index, row in enumerate(batch.raw_rows_json, start=1):
        if index in invalid_rows:
            continue
        order = ProductionOrder.objects.filter(order_no=row.get("orderNo")).first()
        workcenter = Workcenter.objects.filter(code=row.get("workcenterCode")).first()
        if not order or not workcenter:
            continue
        plan_date = date.fromisoformat(row.get("plannedDate") or start.isoformat())
        PlannedWorkItem.objects.create(
            plan_version=plan,
            order=order,
            workcenter=workcenter,
            planned_start_date=plan_date,
            planned_end_date=plan_date,
            planned_quantity=int(row.get("quantity") or order.order_qty),
            load_minutes=_calculate_order_load_minutes(
                order, int(row.get("quantity") or order.order_qty)
            ),
            production_stage=workcenter.workcenter_type,
            planned_shift=row.get("shift") or "DAY",
            color_code=row.get("colorCode", ""),
            shade_lot=row.get("shadeLot", ""),
            planning_zone=assign_planning_zone(plan_date),
            created_by=created_by,
            updated_by=created_by,
        )
    batch.status = ExternalPlanImportStatus.DRAFT_CREATED
    batch.created_draft_plan = plan
    batch.updated_by = created_by
    batch.save(update_fields=["status", "created_draft_plan", "updated_by", "updated_at"])
    write_audit_event(
        event_code="EXTERNAL_PLAN_DRAFT_CREATED",
        entity_type="ExternalPlanImportBatch",
        entity_id=str(batch.id),
        entity_display_code=batch.import_no,
        action="create_draft_plan",
        performed_by=created_by,
        new_value_json={"planId": str(plan.id)},
        source="WEB" if created_by else "SYSTEM",
    )
    return plan


@transaction.atomic
def reject_external_plan(
    batch: ExternalPlanImportBatch, *, rejected_by=None
) -> ExternalPlanImportBatch:
    batch.status = ExternalPlanImportStatus.REJECTED
    batch.updated_by = rejected_by
    batch.save(update_fields=["status", "updated_by", "updated_at"])
    return batch


def _validate_row(batch, row_number, row):
    conflicts = []
    order = ProductionOrder.objects.filter(order_no=row.get("orderNo")).first()
    workcenter = Workcenter.objects.filter(code=row.get("workcenterCode")).first()
    if not order:
        conflicts.append(
            _conflict(
                batch,
                row_number,
                row,
                ExternalPlanConflictType.ORDER_NOT_FOUND,
                "Order does not exist.",
                "CRITICAL",
            )
        )
        return conflicts
    if not workcenter:
        conflicts.append(
            _conflict(
                batch,
                row_number,
                row,
                ExternalPlanConflictType.WORKCENTER_NOT_FOUND,
                "Workcenter does not exist.",
                "CRITICAL",
            )
        )
    if getattr(order, "pcd_readiness", None) and order.pcd_readiness.readiness_status not in {
        PCDReadinessStatus.READY,
        PCDReadinessStatus.CONDITIONALLY_READY,
        PCDReadinessStatus.RELEASED,
    }:
        conflicts.append(
            _conflict(
                batch,
                row_number,
                row,
                ExternalPlanConflictType.PCD_NOT_READY,
                "Order is not PCD ready.",
                "ACTION",
            )
        )
    plan_date = date.fromisoformat(row["plannedDate"]) if row.get("plannedDate") else None
    if plan_date and assign_planning_zone(plan_date) == "FROZEN_ZONE":
        conflicts.append(
            _conflict(
                batch,
                row_number,
                row,
                ExternalPlanConflictType.FROZEN_ZONE_CONFLICT,
                "External plan targets frozen zone.",
                "ACTION",
            )
        )
    if workcenter and plan_date:
        load = calculate_load(workcenter, start_date=plan_date, end_date=plan_date, persist=False)
        if load["riskStatus"] in {"ACTION", "CRITICAL"}:
            conflicts.append(
                _conflict(
                    batch,
                    row_number,
                    row,
                    ExternalPlanConflictType.CAPACITY_OVERLOAD,
                    "Workcenter is already overloaded.",
                    "ACTION",
                )
            )
    return conflicts


def _conflict(batch, row_number, row, conflict_type, message, severity):
    return ExternalPlanValidationResult.objects.create(
        import_batch=batch,
        conflict_type=conflict_type,
        severity=severity,
        row_number=row_number,
        order_no=row.get("orderNo", ""),
        message=message,
        metadata_json=row,
    )
