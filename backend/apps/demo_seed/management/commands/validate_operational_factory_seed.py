from django.core.management.base import BaseCommand, CommandError

from apps.cutting.models import CuttingJob, CuttingOutputEntry
from apps.master_data.models import Customer, Material, Vendor
from apps.orders.models import OrderStage, ProductionOrder
from apps.pcd_readiness.models import ConditionalRelease
from apps.production_release.models import ProductionRelease
from apps.sewing.models import (
    LineRealignmentRequest,
    SewingLineBoardSnapshot,
    SewingLineLoading,
    SewingOutputCorrection,
    SewingOutputEntry,
)
from apps.sewing.services.line_loading_board import get_line_loading_board
from apps.wip_inventory.models import WipLot, WipMovement, WipStage


class Command(BaseCommand):
    help = "Validate that the operational factory seed is dense enough for Phase 5 walkthroughs."

    def handle(self, *args, **options):
        missing = []
        if Customer.objects.count() < 8:
            missing.append("customer-density")
        if Vendor.objects.count() < 8:
            missing.append("vendor-density")
        if Material.objects.count() < 16:
            missing.append("material-density")
        if ProductionOrder.objects.count() < 40:
            missing.append("order-density")
        if ProductionRelease.objects.count() < 8:
            missing.append("release-density")
        if CuttingJob.objects.count() < 4:
            missing.append("cutting-job-density")
        if CuttingOutputEntry.objects.count() < 3:
            missing.append("cutting-output-density")
        if SewingLineLoading.objects.count() < 20:
            missing.append("sewing-line-loading-density")
        if SewingLineBoardSnapshot.objects.count() < 20:
            missing.append("line-board-density")
        if SewingOutputEntry.objects.count() < 2:
            missing.append("sewing-output-density")
        if SewingOutputCorrection.objects.count() < 1:
            missing.append("output-correction-proof")
        if LineRealignmentRequest.objects.count() < 2:
            missing.append("line-realignment-density")
        if WipMovement.objects.count() < 5:
            missing.append("wip-movement-density")
        if not WipLot.objects.filter(stage=WipStage.SEWN_WAITING_WASH).exists():
            missing.append("sewn-waiting-wash-lot")
        if ConditionalRelease.objects.filter(status="APPROVED").count() < 2:
            missing.append("conditional-release-coverage")

        stage_counts = {
            stage: ProductionOrder.objects.filter(current_stage=stage).count()
            for stage in OrderStage.values
        }
        for stage in [
            OrderStage.PCD_PENDING,
            OrderStage.PCD_READY,
            OrderStage.CUTTING,
            OrderStage.SEWING,
            OrderStage.WASHING,
            OrderStage.FINISHING,
            OrderStage.PACKING,
            OrderStage.SHIPMENT_READY,
        ]:
            if stage_counts.get(stage, 0) == 0:
                missing.append(f"order-stage-{stage.lower()}")

        bad_output = [
            entry.client_event_id
            for entry in SewingOutputEntry.objects.all()
            if entry.net_good_qty != entry.gross_qty - entry.defect_qty - entry.rework_qty
        ]
        if bad_output:
            missing.append(f"net-good-mismatch:{','.join(bad_output[:5])}")

        board = get_line_loading_board()
        statuses = {row["status"] for row in board["lines"]}
        if len(board["lines"]) < 20:
            missing.append("line-board-row-count")
        for status in ["DOWN", "RUNNING", "CHANGEOVER"]:
            if status not in statuses:
                missing.append(f"line-board-status-{status.lower()}")

        invalid_wip_stage_count = WipLot.objects.exclude(stage__in=WipStage.values).count()
        if invalid_wip_stage_count:
            missing.append("wip-stage-beyond-phase5")

        if missing:
            raise CommandError(f"Operational factory seed validation failed: {', '.join(missing)}")

        self.stdout.write(
            self.style.SUCCESS(
                "Operational factory seed validated: "
                f"{ProductionOrder.objects.count()} orders, "
                f"{ProductionRelease.objects.count()} releases, "
                f"{len(board['lines'])} line-board rows, "
                f"{WipMovement.objects.count()} WIP movements."
            )
        )
