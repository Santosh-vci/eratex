from datetime import timedelta
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
    BoundaryImpactPreview,
)
from apps.boundary_cases.services.preview import calculate_boundary_impact
from apps.external_plans.models import ExternalPlanImportBatch
from apps.external_plans.services.validation import import_external_plan
from apps.identity_access.models import PermissionAction, Role, RolePermission
from apps.orders.models import OrderStage, ProductionOrder
from apps.organization.models import Workcenter
from apps.planning.services.zones import ensure_default_planning_zones
from apps.style_technical.models import Style, WashRoute
from apps.workcenters.models import (
    CapacityUnit,
    ConstraintResource,
    PlanningBucket,
    WorkcenterCapacityDefinition,
)

RULEBOOK_PERMISSIONS = [
    ("boundary_case.view", "Boundary Cases", "View boundary cases"),
    ("boundary_case.create", "Boundary Cases", "Create boundary cases"),
    ("boundary_case.preview_impact", "Boundary Cases", "Preview boundary impact"),
    ("boundary_case.approve_recovery", "Boundary Cases", "Approve recovery action"),
    ("boundary_case.apply_action", "Boundary Cases", "Apply boundary action"),
    ("planning.apply_boundary_replan", "Planning", "Apply boundary replan"),
    ("planning.override_frozen_zone", "Planning", "Override frozen zone"),
    ("planning.approve_firm_zone_change", "Planning", "Approve firm-zone change"),
    ("capacity.view_events", "Capacity", "View capacity events"),
    ("capacity.create_loss_event", "Capacity", "Create capacity loss event"),
    ("capacity.create_addition_event", "Capacity", "Create capacity addition event"),
    ("capacity.approve_addition", "Capacity", "Approve capacity addition"),
    ("capacity.apply_event", "Capacity", "Apply capacity event"),
    ("orders.request_change", "Orders", "Request order change"),
    ("orders.approve_change", "Orders", "Approve order change"),
    ("orders.cancel_preview", "Orders", "Preview cancellation"),
    ("orders.request_cancellation", "Orders", "Request cancellation"),
    ("orders.approve_cancellation_disposition", "Orders", "Approve cancellation disposition"),
    ("wash.approve_repeat_cycle", "Wash", "Approve repeat wash cycle"),
    ("wash.approve_effect_waiver", "Wash", "Approve effect waiver"),
    ("external_plan.import", "External Plan", "Import external plan"),
    ("external_plan.validate", "External Plan", "Validate external plan"),
    ("external_plan.create_draft_plan", "External Plan", "Create draft plan"),
]

CAPACITY_DEFINITIONS = [
    (
        "SEWING",
        CapacityUnit.SMV_MINUTES,
        PlanningBucket.SHIFT,
        ConstraintResource.MANPOWER,
        "LINE_BALANCE",
        80000,
        "minutes",
    ),
    (
        "SEWING",
        CapacityUnit.SMV_MINUTES,
        PlanningBucket.DAY,
        ConstraintResource.MANPOWER,
        "LINE_BALANCE",
        80000,
        "minutes",
    ),
    (
        "WET_WASH",
        CapacityUnit.BATCH_MINUTES,
        PlanningBucket.BATCH,
        ConstraintResource.WASHER_TIME,
        "",
        25000,
        "minutes",
    ),
    (
        "WET_WASH",
        CapacityUnit.BATCH_MINUTES,
        PlanningBucket.DAY,
        ConstraintResource.WASHER_TIME,
        "",
        25000,
        "minutes",
    ),
    (
        "WASH",
        CapacityUnit.BATCH_MINUTES,
        PlanningBucket.DAY,
        ConstraintResource.WASHER_TIME,
        "",
        25000,
        "minutes",
    ),
    (
        "DRY_PROCESS",
        CapacityUnit.OPERATOR_HOURS,
        PlanningBucket.SHIFT,
        ConstraintResource.SKILLED_OPERATOR,
        "",
        3600,
        "hours",
    ),
    (
        "DRY_PROCESS",
        CapacityUnit.OPERATOR_HOURS,
        PlanningBucket.DAY,
        ConstraintResource.SKILLED_OPERATOR,
        "",
        7200,
        "hours",
    ),
    (
        "DRYING",
        CapacityUnit.BATCH_MINUTES,
        PlanningBucket.BATCH,
        ConstraintResource.DRYER_TIME,
        "",
        18000,
        "minutes",
    ),
    (
        "DRYING",
        CapacityUnit.BATCH_MINUTES,
        PlanningBucket.DAY,
        ConstraintResource.DRYER_TIME,
        "",
        18000,
        "minutes",
    ),
    (
        "FINISHING",
        CapacityUnit.PIECES_PER_DAY,
        PlanningBucket.DAY,
        ConstraintResource.MANPOWER,
        "",
        12000,
        "pieces",
    ),
    (
        "PACKING",
        CapacityUnit.CARTONS_PER_DAY,
        PlanningBucket.DAY,
        ConstraintResource.PACKING_MANPOWER,
        "",
        900,
        "cartons",
    ),
]

SCENARIO_DEFINITIONS = [
    (
        "SCN-014",
        BoundaryEventType.ORDER_CANCELLED,
        "ORD-HP-001",
        None,
        {"eventStage": OrderStage.PRE_PRODUCTION},
    ),
    (
        "SCN-015",
        BoundaryEventType.ORDER_CANCELLED,
        "ORD-PCD-001",
        None,
        {"eventStage": OrderStage.CUTTING},
    ),
    (
        "SCN-016",
        BoundaryEventType.ORDER_CANCELLED,
        "ORD-FABQC-001",
        None,
        {"eventStage": OrderStage.WASHING},
    ),
    ("SCN-017", BoundaryEventType.CAPACITY_LOSS, None, "SEW-WC", {"minutesDelta": -2400}),
    ("SCN-018", BoundaryEventType.CAPACITY_LOSS, None, "WASH-WC", {"minutesDelta": -3600}),
    ("SCN-019", BoundaryEventType.CAPACITY_ADDITION, None, "WASH-WC", {"minutesDelta": 1800}),
    ("SCN-020", BoundaryEventType.SHIPMENT_PULL_IN, "ORD-MAT-001", None, {"pullInDays": 4}),
    ("SCN-021", BoundaryEventType.FROZEN_PLAN_CHANGE_REQUESTED, "ORD-HP-001", "SEW-WC", {}),
    (
        "SCN-023",
        BoundaryEventType.REWASH_REPEAT_EXCEEDED,
        "ORD-FABQC-001",
        "WASH-WC",
        {"washCycleNo": 3, "maxRepeatCycles": 1, "capacityMinutesConsumed": 720},
    ),
]


class Command(BaseCommand):
    help = "Seed scheduling behaviour rulebook controls and boundary scenarios."

    @transaction.atomic
    def handle(self, *args, **options):
        if not ProductionOrder.objects.filter(order_no="ORD-HP-001").exists():
            call_command("seed_phase3", verbosity=0)
        ensure_default_planning_zones()
        permissions = self._seed_permissions()
        self._assign_permissions(permissions)
        self._seed_capacity_definitions()
        self._seed_wash_governance()
        self._seed_boundary_scenarios()
        self._seed_external_plan_conflict()
        self.stdout.write(self.style.SUCCESS("Scheduling rulebook seed data loaded."))

    def _seed_permissions(self):
        permission_objects = {}
        for code, module, name in RULEBOOK_PERMISSIONS:
            permission, _ = PermissionAction.objects.update_or_create(
                code=code,
                defaults={"module": module, "name": name, "is_active": True},
            )
            permission_objects[code] = permission
        return permission_objects

    def _assign_permissions(self, permissions):
        role_map = {
            "PLANNER": [
                "boundary_case.view",
                "boundary_case.create",
                "boundary_case.preview_impact",
                "capacity.view_events",
                "orders.request_change",
                "orders.cancel_preview",
                "orders.request_cancellation",
                "external_plan.validate",
            ],
            "PLANNING_HEAD": list(permissions),
            "BUSINESS_ADMIN": list(permissions),
            "CAPACITY_MANAGER": [
                "boundary_case.view",
                "boundary_case.preview_impact",
                "capacity.view_events",
                "capacity.create_loss_event",
                "capacity.create_addition_event",
                "capacity.approve_addition",
                "capacity.apply_event",
            ],
            "RELEASE_COORDINATOR": ["boundary_case.view", "capacity.view_events"],
        }
        for role_code, codes in role_map.items():
            role, _ = Role.objects.update_or_create(
                code=role_code,
                defaults={"name": role_code.replace("_", " ").title(), "is_system": True},
            )
            for code in codes:
                RolePermission.objects.get_or_create(role=role, permission=permissions[code])

    def _seed_capacity_definitions(self):
        for (
            workcenter_type,
            unit,
            bucket,
            primary,
            secondary,
            value,
            value_unit,
        ) in CAPACITY_DEFINITIONS:
            WorkcenterCapacityDefinition.objects.update_or_create(
                workcenter_type=workcenter_type,
                planning_bucket=bucket,
                defaults={
                    "capacity_unit": unit,
                    "primary_constraint_resource": primary,
                    "secondary_constraint_resource": secondary,
                    "normal_capacity_value": Decimal(str(value)),
                    "normal_capacity_unit": value_unit,
                    "overtime_allowed": workcenter_type
                    in {"SEWING", "WASH", "WET_WASH", "FINISHING", "PACKING"},
                    "approved_overtime_capacity_value": Decimal(str(value)) * Decimal("0.15"),
                    "capacity_loss_triggers_json": [
                        "machine_breakdown",
                        "absenteeism",
                        "quality_hold",
                    ],
                    "recovery_levers_json": ["overtime", "load_move", "priority_review"],
                    "active_status": True,
                    "is_active": True,
                },
            )

    def _seed_wash_governance(self):
        Style.objects.update(
            wash_complexity_class="VALUE_CREATION",
            fashion_effect_required=True,
            approved_wash_standard_reference="BUYER-WASH-STD-001",
            dry_process_required=True,
            wet_process_required=True,
            repeat_cycle_allowed=True,
            repeat_cycle_probability=Decimal("12.50"),
            max_repeat_cycles=1,
            post_wash_qc_criteria={"shade": "within tolerance", "handfeel": "buyer standard"},
            shade_effect_tolerance="Delta E <= 1.5",
            customer_effect_approval_status="APPROVED",
        )
        WashRoute.objects.update(
            wash_complexity_class="VALUE_CREATION",
            fashion_effect_required=True,
            approved_wash_standard_reference="BUYER-WASH-STD-001",
            dry_process_required=True,
            wet_process_required=True,
            repeat_cycle_allowed=True,
            repeat_cycle_probability=Decimal("12.50"),
            max_repeat_cycles=1,
            post_wash_qc_criteria={"shade": "within tolerance", "effect": "buyer approved"},
            shade_effect_tolerance="Delta E <= 1.5",
            customer_effect_approval_status="APPROVED",
        )

    def _seed_boundary_scenarios(self):
        for scenario_code, event_type, order_no, workcenter_code, extra in SCENARIO_DEFINITIONS:
            order = ProductionOrder.objects.filter(order_no=order_no).first() if order_no else None
            workcenter = (
                Workcenter.objects.filter(code=workcenter_code).first() if workcenter_code else None
            )
            payload = dict(extra)
            if order:
                payload["orderId"] = str(order.id)
                if event_type == BoundaryEventType.SHIPMENT_PULL_IN:
                    payload["newShipmentDate"] = (
                        order.committed_ship_date - timedelta(days=extra.get("pullInDays", 3))
                    ).isoformat()
            if workcenter:
                payload["workcenterId"] = str(workcenter.id)
                payload["eventDate"] = timezone.localdate().isoformat()
            impact = calculate_boundary_impact(event_type, payload)
            event, _ = BoundaryCaseEvent.objects.update_or_create(
                event_no=scenario_code,
                defaults={
                    "event_type": event_type,
                    "status": BoundaryEventStatus.IMPACT_PREVIEWED,
                    "linked_order": order,
                    "linked_workcenter": workcenter,
                    "event_stage": payload.get("eventStage", ""),
                    "old_value_json": {},
                    "new_value_json": payload,
                    "affected_quantity": order.order_qty if order else 0,
                    "affected_capacity_minutes": int(
                        impact["capacity_impact"].get("minutesDelta", 0) or 0
                    ),
                    "affected_shipment_date": order.committed_ship_date if order else None,
                    "risk_before": impact["risk_before"],
                    "risk_after": impact["risk_after"],
                    "recommended_action": "; ".join(impact["recommended_actions"]),
                    "approval_required": impact["approval_required"],
                    "metadata_json": {"scenarioCode": scenario_code, "impact": impact},
                    "is_active": True,
                },
            )
            BoundaryImpactPreview.objects.update_or_create(
                boundary_case_event=event,
                preview_type=event_type,
                defaults={
                    "affected_orders_json": impact["affected_orders"],
                    "affected_workcenters_json": impact["affected_workcenters"],
                    "affected_wip_json": impact["affected_wip"],
                    "affected_shipments_json": impact["affected_shipments"],
                    "capacity_before_json": impact["capacity_impact"].get("before", {}),
                    "capacity_after_json": impact["capacity_impact"].get("after", {}),
                    "risk_before": impact["risk_before"],
                    "risk_after": impact["risk_after"],
                    "recommended_actions_json": impact["recommended_actions"],
                    "warnings_json": impact["warnings"],
                    "blocking_reasons_json": impact["blocking_reasons"],
                    "approval_required": impact["approval_required"],
                    "is_active": True,
                },
            )

    def _seed_external_plan_conflict(self):
        User = get_user_model()
        user = User.objects.filter(username="planner").first()
        future_date = (timezone.localdate() + timedelta(days=1)).isoformat()
        ExternalPlanImportBatch.objects.filter(import_no="SCN-022").delete()
        batch = import_external_plan(
            source_type="fastreact_plan",
            source_reference="SCN-022",
            rows=[
                {
                    "orderNo": "ORD-UNKNOWN",
                    "workcenterCode": "SEW-WC",
                    "plannedDate": future_date,
                    "quantity": 1200,
                    "shift": "DAY",
                },
                {
                    "orderNo": "ORD-PCD-001",
                    "workcenterCode": "NO-WC",
                    "plannedDate": future_date,
                    "quantity": 800,
                    "shift": "DAY",
                },
            ],
            imported_by=user,
        )
        batch.import_no = "SCN-022"
        batch.save(update_fields=["import_no", "updated_at"])
