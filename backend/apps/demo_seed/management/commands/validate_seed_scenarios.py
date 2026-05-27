from django.core.management.base import BaseCommand, CommandError

from apps.boundary_cases.models import BoundaryCaseEvent
from apps.cutting.models import CutBundle, CuttingJob, CuttingOutputEntry
from apps.external_plans.models import ExternalPlanImportBatch
from apps.planning.models import PlanningZoneConfiguration
from apps.sewing.models import (
    LineRealignmentRequest,
    SewingLineBoardSnapshot,
    SewingLineLoading,
    SewingOutputCorrection,
    SewingOutputEntry,
)
from apps.sewing.services.line_loading_board import get_line_loading_board
from apps.wip_inventory.models import WipLot, WipMovement, WipStage
from apps.workcenters.models import WorkcenterCapacityDefinition

RULEBOOK_SCENARIOS = [f"SCN-{number:03d}" for number in range(14, 24)]
EXECUTION_SCENARIOS = [f"SCN-{number:03d}" for number in range(24, 34)]


class Command(BaseCommand):
    help = "Validate deterministic scheduling rulebook seed scenarios."

    def handle(self, *args, **options):
        missing = []
        execution_expected = BoundaryCaseEvent.objects.filter(
            event_no__in=EXECUTION_SCENARIOS
        ).exists()
        required_scenarios = RULEBOOK_SCENARIOS + (
            EXECUTION_SCENARIOS if execution_expected else []
        )
        for scenario_code in required_scenarios:
            if scenario_code == "SCN-022":
                if not ExternalPlanImportBatch.objects.filter(import_no=scenario_code).exists():
                    missing.append(scenario_code)
            elif not BoundaryCaseEvent.objects.filter(event_no=scenario_code).exists():
                missing.append(scenario_code)
        if PlanningZoneConfiguration.objects.filter(active_status=True).count() < 3:
            missing.append("planning-zone-configurations")
        if WorkcenterCapacityDefinition.objects.filter(active_status=True).count() < 6:
            missing.append("capacity-definition-matrix")
        conflict_batch = ExternalPlanImportBatch.objects.filter(import_no="SCN-022").first()
        if conflict_batch and not conflict_batch.validation_results.exists():
            missing.append("SCN-022-conflicts")
        if execution_expected:
            if not CuttingJob.objects.exists():
                missing.append("execution-cutting-job")
            if not CuttingOutputEntry.objects.exists():
                missing.append("execution-cutting-output")
            if not CutBundle.objects.exists():
                missing.append("execution-cut-bundles")
            if not SewingLineLoading.objects.exists():
                missing.append("execution-line-loading")
            if SewingLineBoardSnapshot.objects.count() < 12:
                missing.append("execution-line-loading-board-snapshots")
            if not LineRealignmentRequest.objects.exists():
                missing.append("execution-line-realignment")
            if not SewingOutputEntry.objects.exists():
                missing.append("execution-sewing-output")
            if not SewingOutputCorrection.objects.exists():
                missing.append("execution-output-correction")
            if not WipMovement.objects.exists():
                missing.append("execution-wip-movement")
            if not WipLot.objects.filter(stage=WipStage.SEWN_WAITING_WASH).exists():
                missing.append("execution-sewn-waiting-wash")
            board = get_line_loading_board()
            board_rows = board["lines"]
            board_statuses = {row["status"] for row in board_rows}
            if len(board_rows) < 12:
                missing.append("execution-line-loading-board-density")
            for status in ["DOWN", "RUNNING", "CHANGEOVER"]:
                if status not in board_statuses:
                    missing.append(f"execution-line-loading-board-{status.lower()}")
            if not board["summary"]["highestRisk"]["lineCode"]:
                missing.append("execution-line-loading-board-highest-risk")
        if missing:
            raise CommandError(f"Missing or invalid seed scenarios: {', '.join(missing)}")
        self.stdout.write(self.style.SUCCESS("Scheduling rulebook seed scenarios validated."))
