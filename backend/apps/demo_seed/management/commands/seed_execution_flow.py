from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.boundary_cases.models import (
    BoundaryCaseEvent,
    BoundaryEventStatus,
    BoundaryEventType,
    BoundarySeverity,
    BoundaryTriggerSource,
)
from apps.cutting.services.execution import (
    create_cutting_job_from_release,
    handover_cut_panels_to_sewing,
    record_cutting_output,
    start_cutting_job,
)
from apps.identity_access.models import (
    PermissionAction,
    Role,
    RolePermission,
    UserProfile,
    UserRole,
    UserScope,
)
from apps.organization.models import Department, Factory, Line, ShiftCalendar, Workcenter
from apps.production_release.models import ProductionRelease, ProductionReleaseStatus
from apps.sewing.models import SewingLineBoardSnapshot
from apps.sewing.services.line_loading import activate_line_loading, load_line
from apps.sewing.services.output import correct_sewing_output, record_sewing_output
from apps.sewing.services.realignment import (
    apply_line_realignment,
    approve_line_realignment,
    request_line_realignment,
)
from apps.style_technical.models import OperationBulletin
from apps.wip_inventory.models import WipMovement, WipMovementType
from apps.workcenters.models import LineProfile

EXECUTION_PERMISSIONS = [
    ("cutting.view", "Cutting", "View cutting jobs"),
    ("cutting.start_job", "Cutting", "Start cutting jobs"),
    ("cutting.record_output", "Cutting", "Record cutting output"),
    ("cutting.correct_output", "Cutting", "Correct cutting output"),
    ("cutting.handover_to_sewing", "Cutting", "Handover cutting output to sewing"),
    ("wip.view", "WIP", "View execution WIP"),
    ("wip.move_execution", "WIP", "Move execution WIP"),
    ("sewing.view", "Sewing", "View sewing execution"),
    ("sewing.load_line", "Sewing", "Load sewing line"),
    ("sewing.record_output", "Sewing", "Record sewing output"),
    ("sewing.correct_output", "Sewing", "Correct sewing output"),
    ("sewing.realign_line", "Sewing", "Request line realignment"),
    ("sewing.approve_realignment", "Sewing", "Approve line realignment"),
    ("sewing.apply_realignment", "Sewing", "Apply line realignment"),
    ("sewing.view_efficiency", "Sewing", "View line efficiency"),
    ("boundary_case.create_line_shortfall", "Boundary Cases", "Create line shortfall event"),
]


class Command(BaseCommand):
    help = "Seed deterministic cutting, WIP, sewing line loading, and output scenarios."

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_eos04", verbosity=0)
        permissions = self._seed_permissions()
        factory = Factory.objects.get(code="UNIT-04")
        department = Department.objects.get(factory=factory, code="SEW")
        cutting_user = self._upsert_user(
            username="cutting_user",
            first_name="Cutting",
            last_name="Operator",
            role_code="CUTTING_OPERATOR",
            role_name="Cutting Operator",
            factory=factory,
            department=department,
        )
        supervisor = self._upsert_user(
            username="line_supervisor",
            first_name="Line",
            last_name="Supervisor",
            role_code="LINE_SUPERVISOR",
            role_name="Line Supervisor",
            factory=factory,
            department=department,
        )
        sewing_mgr = self._upsert_user(
            username="sewing_mgr",
            first_name="Sewing",
            last_name="Manager",
            role_code="SEWING_MANAGER",
            role_name="Sewing Manager",
            factory=factory,
            department=department,
        )
        self._assign_permissions(permissions)

        release = (
            ProductionRelease.objects.filter(
                status=ProductionReleaseStatus.READY,
                order__order_no="ORD-HP-001",
            )
            .select_related("order", "planned_work_item", "workcenter")
            .order_by("release_date", "release_no")
            .first()
        )
        if not release:
            raise RuntimeError("No ready production release exists for execution seeding.")
        line = Line.objects.select_related("workcenter").get(factory=factory, code="LINE-01")
        bulletin = OperationBulletin.objects.filter(
            style=release.order.style,
            status="APPROVED",
            is_active=True,
        ).first()
        if not bulletin:
            raise RuntimeError("No approved operation bulletin exists for execution seeding.")

        job = create_cutting_job_from_release(release, created_by=cutting_user)
        if job.status in {"RELEASED", "IN_PROGRESS"}:
            start_cutting_job(job, started_by=cutting_user)
        cutting_entry = record_cutting_output(
            cutting_job=job,
            client_event_id="SCN-025-CUT-OUTPUT",
            output_qty=min(300, job.planned_quantity),
            defect_qty=4,
            rework_qty=6,
            remarks="Execution seed cutting output.",
            recorded_by=cutting_user,
        )
        loading = load_line(
            release=release,
            line=line,
            bulletin=bulletin,
            planned_quantity=cutting_entry.net_cut_qty,
            loaded_by=supervisor,
        )
        activate_line_loading(loading, activated_by=supervisor)
        if not WipMovement.objects.filter(
            order=release.order,
            movement_type=WipMovementType.HANDOVER_TO_SEWING,
        ).exists():
            handover_cut_panels_to_sewing(
                cutting_job=job,
                quantity=cutting_entry.net_cut_qty,
                sewing_loading=loading,
                sender=cutting_user,
                receiver=supervisor,
                remarks="Execution seed handover.",
            )
        output = record_sewing_output(
            line_loading=loading,
            client_event_id="SCN-030-SEW-OUTPUT",
            time_slot="10:00-11:00",
            gross_qty=120,
            defect_qty=6,
            rework_qty=9,
            remarks="Execution seed sewing output.",
            recorded_by=supervisor,
        )
        if not output.corrections.exists():
            correct_sewing_output(
                output_entry=output,
                gross_qty=125,
                defect_qty=6,
                rework_qty=9,
                reason="Seed correction to prove audit and idempotency.",
                corrected_by=supervisor,
            )
        realignment = request_line_realignment(
            line=line,
            bulletin=bulletin,
            target_output=max(loading.target_output_per_day, 500),
            line_loading=loading,
            requested_by=supervisor,
        )
        approve_line_realignment(realignment, approved_by=sewing_mgr)
        apply_line_realignment(realignment, applied_by=sewing_mgr)
        self._seed_board_line_loadings(
            release=release,
            bulletin=bulletin,
            supervisor=supervisor,
            factory=factory,
            department=department,
        )
        self._seed_scenario_events(release, loading, job)
        self.stdout.write(self.style.SUCCESS("Execution flow seed data loaded."))

    def _seed_permissions(self):
        permission_objects = {}
        for code, module, name in EXECUTION_PERMISSIONS:
            permission, _ = PermissionAction.objects.update_or_create(
                code=code,
                defaults={"module": module, "name": name, "is_active": True},
            )
            permission_objects[code] = permission
        return permission_objects

    def _assign_permissions(self, permissions):
        role_map = {
            "CUTTING_OPERATOR": [
                "cutting.view",
                "cutting.start_job",
                "cutting.record_output",
                "cutting.handover_to_sewing",
                "wip.view",
            ],
            "LINE_SUPERVISOR": [
                "sewing.view",
                "sewing.load_line",
                "sewing.record_output",
                "sewing.correct_output",
                "sewing.realign_line",
                "sewing.view_efficiency",
                "wip.view",
                "boundary_case.create_line_shortfall",
            ],
            "SEWING_MANAGER": list(permissions),
            "PLANNER": [
                "cutting.view",
                "wip.view",
                "sewing.view",
                "sewing.view_efficiency",
            ],
            "PLANNING_HEAD": list(permissions),
            "BUSINESS_ADMIN": list(permissions),
        }
        for role_code, codes in role_map.items():
            role, _ = Role.objects.update_or_create(
                code=role_code,
                defaults={"name": role_code.replace("_", " ").title(), "is_system": True},
            )
            for code in codes:
                RolePermission.objects.get_or_create(role=role, permission=permissions[code])

    def _upsert_user(
        self,
        *,
        username,
        first_name,
        last_name,
        role_code,
        role_name,
        factory,
        department,
    ):
        User = get_user_model()
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password("planning123")
        user.first_name = first_name
        user.last_name = last_name
        user.email = f"{username}@example.com"
        user.is_staff = True
        user.is_active = True
        user.save()
        role, _ = Role.objects.update_or_create(
            code=role_code,
            defaults={"name": role_name, "is_system": True},
        )
        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                "display_name": user.get_full_name() or username,
                "employee_code": username.upper(),
                "current_factory": factory,
                "department": department,
                "is_active": True,
            },
        )
        UserRole.objects.get_or_create(user=user, role=role, factory=factory)
        UserScope.objects.update_or_create(
            user=user,
            scope_type=UserScope.ScopeType.FACTORY,
            factory=factory,
            defaults={"is_active": True},
        )
        return user

    def _seed_board_line_loadings(self, *, release, bulletin, supervisor, factory, department):
        sewing_wc = Workcenter.objects.get(factory=factory, code="SEW-WC")
        shift = ShiftCalendar.objects.filter(factory=factory, is_default=True).first()
        for number in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]:
            code = f"LINE-{number:02d}"
            line, _ = Line.objects.update_or_create(
                factory=factory,
                code=code,
                defaults={
                    "department": department,
                    "workcenter": sewing_wc,
                    "name": f"Sewing Line {number:02d}",
                    "line_type": "DENIM",
                    "is_active": True,
                },
            )
            planned_manpower = 32 if number == 8 else 38 if number == 14 else 28
            current_manpower = 29 if number == 8 else planned_manpower
            if number == 8:
                baseline = Decimal("48.00")
            elif number == 14:
                baseline = Decimal("64.00")
            else:
                baseline = Decimal("74.00")
            LineProfile.objects.update_or_create(
                line=line,
                defaults={
                    "supervisor": supervisor,
                    "standard_manpower": planned_manpower,
                    "current_manpower": current_manpower,
                    "shift_calendar": shift,
                    "baseline_efficiency": baseline,
                    "net_good_output_baseline": 1111,
                    "is_active": True,
                },
            )
            seeded_loading = load_line(
                release=release,
                line=line,
                bulletin=bulletin,
                planned_quantity=900 if number == 14 else 1200 if number == 8 else 1500,
                loaded_by=supervisor,
            )
            activate_line_loading(seeded_loading, activated_by=supervisor)
            seeded_loading.target_output_per_day = (
                900 if number == 14 else 1200 if number == 8 else 1500
            )
            seeded_loading.risk_status = (
                "ACTION" if number == 8 else "WATCH" if number == 14 else "ON_TRACK"
            )
            seeded_loading.save(
                update_fields=["target_output_per_day", "risk_status", "updated_at"]
            )
            self._seed_board_snapshot(seeded_loading, number)

    def _seed_board_snapshot(self, loading, line_number):
        snapshot_rows = {
            8: {
                "production_po_no": "PO-88291",
                "production_style_code": "DENIM-S24",
                "style_smv": Decimal("22.40"),
                "display_status": "DOWN",
                "actual_output": 580,
                "net_good_output": 555,
                "defect_percent": Decimal("4.20"),
                "planned_manpower": 32,
                "actual_manpower": 29,
                "bottleneck_operation_name": "Front Pocket Attachment",
                "bottleneck_smv": Decimal("1.40"),
                "bottleneck_station": "#14",
                "wip_accumulation": 450,
                "operator_allocation_json": [
                    {"code": "A1", "name": "M. Rahim", "role": "Lead Sewer", "status": "PRESENT"},
                    {"code": "S2", "name": "S. Khatun", "role": "Overlock Op", "status": "ABSENT"},
                ],
                "absence_impact": "+ 2 more absences today. Total Capacity Impact: -18%",
                "recovery_action_text": (
                    "Reassign 2 floaters from Line 22 (High Inventory) to Line 08 "
                    "Station #14 and #15."
                ),
                "hourly_output_json": self._hourly_board_rows(1200, "DOWN"),
            },
            1: {
                "production_po_no": "PO-91023",
                "production_style_code": "SHIRT-A1",
                "style_smv": Decimal("14.80"),
                "display_status": "RUNNING",
                "actual_output": 1540,
                "net_good_output": 1521,
                "defect_percent": Decimal("0.80"),
                "planned_manpower": 28,
                "actual_manpower": 28,
                "hourly_output_json": self._hourly_board_rows(2000, "RUNNING"),
            },
            14: {
                "production_po_no": "PO-77312",
                "production_style_code": "JEAN-SLIM",
                "style_smv": Decimal("26.10"),
                "display_status": "CHANGEOVER",
                "actual_output": 580,
                "net_good_output": 563,
                "defect_percent": Decimal("2.80"),
                "planned_manpower": 38,
                "actual_manpower": 38,
                "hourly_output_json": self._hourly_board_rows(900, "CHANGEOVER"),
            },
        }
        defaults = snapshot_rows.get(
            line_number,
            {
                "production_po_no": f"PO-9200{line_number:02d}",
                "production_style_code": "SKU-MODERN",
                "style_smv": Decimal("18.50"),
                "display_status": "RUNNING",
                "actual_output": 1120,
                "net_good_output": 1111,
                "defect_percent": Decimal("0.80"),
                "planned_manpower": 28,
                "actual_manpower": 28,
                "hourly_output_json": self._hourly_board_rows(1500, "RUNNING"),
            },
        )
        if "bottleneck_operation_name" not in defaults:
            defaults |= {
                "bottleneck_operation_name": "Waistband Attach",
                "bottleneck_smv": Decimal("1.20"),
                "bottleneck_station": "#08",
                "wip_accumulation": max(
                    loading.target_output_per_day - defaults["actual_output"],
                    0,
                ),
                "operator_allocation_json": [
                    {"code": "A1", "name": "M. Rahim", "role": "Lead Sewer", "status": "PRESENT"},
                    {"code": "B4", "name": "T. Akter", "role": "Inline Op", "status": "PRESENT"},
                ],
                "absence_impact": "No critical absenteeism impact recorded.",
                "recovery_action_text": (
                    "Hold current operator allocation and keep monitoring hourly net-good output."
                ),
            }
        defaults["board_sequence"] = 1 if line_number == 8 else line_number + 10
        SewingLineBoardSnapshot.objects.update_or_create(
            line_loading=loading,
            defaults=defaults,
        )

    def _hourly_board_rows(self, target, status):
        factors = {
            "DOWN": [0.4, 0.35, 0.5, 0.42, 0.1],
            "CHANGEOVER": [0.55, 0.58, 0.65, 0.68, 0.7],
            "RUNNING": [0.76, 0.78, 0.75, 0.74, 0.72],
        }[status]
        bucket = max(round(target / 8), 1)
        return [
            {"time": label, "target": bucket, "actual": round(bucket * factors[index])}
            for index, label in enumerate(["08:00", "09:00", "10:00", "11:00", "12:00"])
        ]

    def _seed_scenario_events(self, release, loading, job):
        scenario_rows = [
            ("SCN-024", "Cutting job created from governed daily release."),
            ("SCN-025", "Cutting output creates cut-panel WIP and bundles."),
            ("SCN-026", "Line loading requires approved operation bulletin."),
            ("SCN-027", "Approved exception can govern line loading deviation."),
            ("SCN-028", "Line capability mismatch produces machine and skill gap."),
            ("SCN-029", "Line realignment approval and application."),
            ("SCN-030", "Net-good sewing output updates WIP."),
            ("SCN-031", "Sewing output correction is audited."),
            ("SCN-032", "Line shortfall creates boundary event."),
            ("SCN-033", "Sewing-to-wash queue WIP is available."),
        ]
        for code, message in scenario_rows:
            BoundaryCaseEvent.objects.update_or_create(
                event_no=code,
                defaults={
                    "event_type": BoundaryEventType.CAPACITY_LOSS,
                    "status": BoundaryEventStatus.IMPACT_PREVIEWED,
                    "severity": BoundarySeverity.MEDIUM,
                    "linked_order": release.order,
                    "linked_workcenter": loading.workcenter,
                    "linked_line": loading.line,
                    "event_stage": "SEWING",
                    "trigger_source": BoundaryTriggerSource.SYSTEM,
                    "affected_quantity": loading.planned_quantity,
                    "risk_before": "ON_TRACK",
                    "risk_after": "WATCH",
                    "recommended_action": message,
                    "approval_required": code in {"SCN-027", "SCN-029", "SCN-032"},
                    "metadata_json": {
                        "releaseNo": release.release_no,
                        "loadingNo": loading.loading_no,
                        "cuttingJobNo": job.job_no,
                        "scenarioCode": code,
                        "seededAt": timezone.now().isoformat(),
                    },
                    "is_active": True,
                },
            )
