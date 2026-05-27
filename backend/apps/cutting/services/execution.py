from math import ceil

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import RiskStatus
from apps.cutting.models import (
    CutBundle,
    CutBundleStatus,
    CuttingJob,
    CuttingJobStatus,
    CuttingOutputEntry,
)
from apps.orders.models import OrderStage
from apps.production_release.models import ProductionReleaseStatus, ProductionReleaseType
from apps.wip_inventory.models import WipHandover, WipMovementType, WipStage
from apps.wip_inventory.services.movement import (
    create_wip_lot,
    get_available_lot,
    move_wip,
    next_wip_no,
)


def _next_no(prefix: str, model) -> str:
    return f"{prefix}-{model.objects.count() + 1:05d}"


@transaction.atomic
def create_cutting_job_from_release(release, *, created_by=None) -> CuttingJob:
    if release.release_type != ProductionReleaseType.CUTTING:
        raise ValidationError("Only cutting releases can create cutting jobs.")
    if release.status not in {
        ProductionReleaseStatus.READY,
        ProductionReleaseStatus.RELEASED,
        ProductionReleaseStatus.COMPLETED,
    }:
        raise ValidationError("Cutting job requires a ready or released production release.")
    planned_quantity = (
        release.planned_work_item.planned_quantity
        if release.planned_work_item
        else release.order.order_qty
    )
    job, created = CuttingJob.objects.get_or_create(
        release=release,
        defaults={
            "job_no": f"CUT-{release.release_no}",
            "order": release.order,
            "workcenter": release.workcenter,
            "planned_quantity": planned_quantity,
            "marker_no": f"MRK-{release.order.order_no}",
            "color_code": getattr(release.planned_work_item, "color_code", "") or "INDIGO",
            "shade_lot": getattr(release.planned_work_item, "shade_lot", "") or "SHADE-A",
            "created_by": created_by,
            "updated_by": created_by,
        },
    )
    if created and not job.wip_lots.exists():
        create_wip_lot(
            order=release.order,
            release=release,
            cutting_job=job,
            workcenter=release.workcenter,
            stage=WipStage.CUTTING,
            quantity=planned_quantity,
            color_code=job.color_code,
            shade_lot=job.shade_lot,
            performed_by=created_by,
            lot_no=f"WIP-CUT-{release.release_no}",
        )
        write_audit_event(
            event_code="CUTTING_JOB_CREATED",
            entity_type="CuttingJob",
            entity_id=str(job.id),
            entity_display_code=job.job_no,
            action="create_cutting_job",
            performed_by=created_by,
            new_value_json={"releaseNo": release.release_no, "plannedQuantity": planned_quantity},
        )
    return job


@transaction.atomic
def start_cutting_job(job: CuttingJob, *, started_by=None) -> CuttingJob:
    if job.status not in {CuttingJobStatus.RELEASED, CuttingJobStatus.IN_PROGRESS}:
        raise ValidationError("Only released cutting jobs can be started.")
    job.status = CuttingJobStatus.IN_PROGRESS
    job.started_at = job.started_at or timezone.now()
    job.updated_by = started_by
    job.order.current_stage = OrderStage.CUTTING
    job.order.lifecycle_status = OrderStage.CUTTING
    job.order.save(update_fields=["current_stage", "lifecycle_status", "updated_at"])
    job.save(update_fields=["status", "started_at", "updated_by", "updated_at"])
    return job


@transaction.atomic
def record_cutting_output(
    *,
    cutting_job: CuttingJob,
    client_event_id: str,
    output_qty: int,
    defect_qty: int = 0,
    rework_qty: int = 0,
    recorded_at=None,
    remarks: str = "",
    recorded_by=None,
) -> CuttingOutputEntry:
    existing = CuttingOutputEntry.objects.filter(client_event_id=client_event_id).first()
    if existing:
        return existing
    if output_qty <= 0:
        raise ValidationError("Cutting output quantity must be positive.")
    if defect_qty + rework_qty > output_qty:
        raise ValidationError("Cutting defect and rework cannot exceed gross output.")
    source_lot = get_available_lot(cutting_job.order, WipStage.CUTTING)
    if source_lot is None:
        raise ValidationError("No available cutting WIP exists for this job.")
    net_qty = output_qty - defect_qty - rework_qty
    movement = move_wip(
        order=cutting_job.order,
        source_lot=source_lot,
        quantity=net_qty,
        to_stage=WipStage.CUT_PANEL,
        movement_type=WipMovementType.CUTTING_OUTPUT,
        cutting_job=cutting_job,
        workcenter=cutting_job.workcenter,
        reason="Cutting output recorded.",
        performed_by=recorded_by,
    )
    entry = CuttingOutputEntry.objects.create(
        cutting_job=cutting_job,
        client_event_id=client_event_id,
        output_qty=output_qty,
        defect_qty=defect_qty,
        rework_qty=rework_qty,
        net_cut_qty=net_qty,
        recorded_at=recorded_at or timezone.now(),
        remarks=remarks,
        recorded_by=recorded_by,
        created_by=recorded_by,
        updated_by=recorded_by,
    )
    create_cut_bundles(cutting_job, quantity=net_qty, created_by=recorded_by)
    cutting_job.status = CuttingJobStatus.COMPLETED
    cutting_job.completed_at = cutting_job.completed_at or timezone.now()
    cutting_job.risk_status = RiskStatus.ON_TRACK
    cutting_job.updated_by = recorded_by
    cutting_job.save(
        update_fields=["status", "completed_at", "risk_status", "updated_by", "updated_at"]
    )
    write_audit_event(
        event_code="CUTTING_OUTPUT_RECORDED",
        entity_type="CuttingOutputEntry",
        entity_id=str(entry.id),
        entity_display_code=entry.client_event_id,
        action="record_cutting_output",
        performed_by=recorded_by,
        new_value_json={
            "jobNo": cutting_job.job_no,
            "grossQty": output_qty,
            "netCutQty": net_qty,
            "movementNo": movement.movement_no,
        },
        reason=remarks,
    )
    return entry


def create_cut_bundles(
    cutting_job: CuttingJob,
    *,
    quantity: int,
    bundle_size: int = 100,
    created_by=None,
) -> list[CutBundle]:
    existing_qty = sum(bundle.quantity for bundle in cutting_job.bundles.all())
    remaining = max(quantity - existing_qty, 0)
    if remaining == 0:
        return list(cutting_job.bundles.all())
    bundles = []
    bundle_count = ceil(remaining / bundle_size)
    start_index = cutting_job.bundles.count() + 1
    for index in range(bundle_count):
        qty = min(bundle_size, remaining - (index * bundle_size))
        bundle = CutBundle.objects.create(
            cutting_job=cutting_job,
            bundle_no=f"{cutting_job.job_no}-B{start_index + index:03d}",
            quantity=qty,
            color_code=cutting_job.color_code,
            shade_lot=cutting_job.shade_lot,
            created_by=created_by,
            updated_by=created_by,
        )
        bundles.append(bundle)
    if bundles:
        write_audit_event(
            event_code="CUT_BUNDLES_CREATED",
            entity_type="CuttingJob",
            entity_id=str(cutting_job.id),
            entity_display_code=cutting_job.job_no,
            action="create_cut_bundles",
            performed_by=created_by,
            new_value_json={"bundleCount": len(bundles), "quantity": remaining},
        )
    return bundles


@transaction.atomic
def handover_cut_panels_to_sewing(
    *,
    cutting_job: CuttingJob,
    quantity: int,
    sewing_loading=None,
    receiver=None,
    sender=None,
    remarks: str = "",
) -> WipHandover:
    if quantity <= 0:
        raise ValidationError("Handover quantity must be positive.")
    source_lot = get_available_lot(cutting_job.order, WipStage.CUT_PANEL)
    if source_lot is None:
        raise ValidationError("No cut-panel WIP is available for sewing handover.")
    movement = move_wip(
        order=cutting_job.order,
        source_lot=source_lot,
        quantity=quantity,
        to_stage=WipStage.SEWING_ACTIVE,
        movement_type=WipMovementType.HANDOVER_TO_SEWING,
        cutting_job=cutting_job,
        sewing_loading=sewing_loading,
        workcenter=sewing_loading.workcenter if sewing_loading else cutting_job.workcenter,
        line=sewing_loading.line if sewing_loading else None,
        reason=remarks or "Cut panels handed over to sewing.",
        performed_by=sender,
    )
    handover = WipHandover.objects.create(
        handover_no=next_wip_no("HND", WipHandover),
        order=cutting_job.order,
        source_lot=source_lot,
        target_stage=WipStage.SEWING_ACTIVE,
        quantity=quantity,
        sender=sender,
        receiver=receiver,
        remarks=remarks,
        created_by=sender,
        updated_by=sender,
    )
    cutting_job.status = CuttingJobStatus.HANDED_OVER
    cutting_job.handed_over_at = timezone.now()
    cutting_job.updated_by = sender
    cutting_job.save(update_fields=["status", "handed_over_at", "updated_by", "updated_at"])
    cutting_job.bundles.filter(status=CutBundleStatus.CREATED).update(
        status=CutBundleStatus.ISSUED_TO_SEWING,
        updated_by=sender,
    )
    write_audit_event(
        event_code="CUTTING_HANDOVER_TO_SEWING",
        entity_type="WipHandover",
        entity_id=str(handover.id),
        entity_display_code=handover.handover_no,
        action="handover_to_sewing",
        performed_by=sender,
        new_value_json={"quantity": quantity, "movementNo": movement.movement_no},
        reason=remarks,
    )
    return handover
