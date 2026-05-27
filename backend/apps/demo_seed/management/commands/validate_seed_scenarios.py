from django.core.management.base import BaseCommand, CommandError

from apps.boundary_cases.models import BoundaryCaseEvent
from apps.external_plans.models import ExternalPlanImportBatch
from apps.planning.models import PlanningZoneConfiguration
from apps.workcenters.models import WorkcenterCapacityDefinition

REQUIRED_SCENARIOS = [f"SCN-{number:03d}" for number in range(14, 24)]


class Command(BaseCommand):
    help = "Validate deterministic scheduling rulebook seed scenarios."

    def handle(self, *args, **options):
        missing = []
        for scenario_code in REQUIRED_SCENARIOS:
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
        if missing:
            raise CommandError(f"Missing or invalid seed scenarios: {', '.join(missing)}")
        self.stdout.write(self.style.SUCCESS("Scheduling rulebook seed scenarios validated."))
