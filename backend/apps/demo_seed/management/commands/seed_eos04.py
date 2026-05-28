from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.common.models import RiskStatus
from apps.identity_access.models import (
    PermissionAction,
    Role,
    RolePermission,
    UserProfile,
    UserRole,
    UserScope,
)
from apps.orders.models import ProductionOrder
from apps.orders.services.lifecycle import initialize_order_lifecycle
from apps.organization.models import Department, Factory, Workcenter
from apps.pcd_readiness.models import PCDItemStatus
from apps.pcd_readiness.services.readiness import calculate_pcd_readiness, initialize_pcd_readiness
from apps.planning.models import (
    PlannedWorkItem,
    PlannedWorkItemStatus,
    PlanningHorizon,
    PlanningHorizonStatus,
    PlanVersion,
    PlanVersionStatus,
)
from apps.planning.services.planning import assign_work_item, default_plan_dates
from apps.production_release.models import ProductionRelease, ProductionReleaseStatus
from apps.production_release.services.release import validate_release
from apps.style_technical.models import Style
from apps.workcenters.models import (
    CapacityAdjustment,
    ConstraintStatus,
    WorkcenterCapacityDay,
    WorkcenterLoadSnapshot,
    WorkcenterQueueSnapshot,
)
from apps.workcenters.services.load import calculate_load

EOS04_PERMISSIONS = [
    ("planning.view", "Planning", "View planning"),
    ("planning.create", "Planning", "Create planning versions"),
    ("planning.assign", "Planning", "Assign work items"),
    ("planning.impact_preview", "Planning", "Preview plan impact"),
    ("planning.freeze", "Planning", "Freeze plans"),
    ("planning.request_change", "Planning", "Request plan change"),
    ("planning.approve_change", "Planning", "Approve plan change"),
    ("workcenters.view", "Workcenters", "View workcenters"),
    ("workcenters.view_load", "Workcenters", "View workcenter load"),
    ("workcenters.view_queue", "Workcenters", "View workcenter queue"),
    ("workcenters.adjust_capacity", "Workcenters", "Adjust capacity"),
    ("release.view", "Daily Release", "View daily release"),
    ("release.validate", "Daily Release", "Validate release"),
    ("release.create", "Daily Release", "Create release"),
    ("release.request_override", "Daily Release", "Request release override"),
    ("release.approve_override", "Daily Release", "Approve release override"),
    ("release.complete", "Daily Release", "Complete release"),
]


class Command(BaseCommand):
    help = "Seed deterministic Phase 4 planning, capacity, load, and release data."

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_phase3", verbosity=0)
        permissions = self._seed_permissions()
        factory = Factory.objects.get(code="UNIT-04")
        planning_dept = Department.objects.get(factory=factory, code="PLAN")
        User = get_user_model()
        planner = User.objects.get(username="planner")
        planning_head = User.objects.get(username="planning_head")
        self._assign_eos04_permissions(permissions)
        capacity_manager = self._upsert_seed_user(
            User,
            username="capacity_manager",
            first_name="Capacity",
            last_name="Manager",
            email="capacity.manager@example.com",
            role_code="CAPACITY_MANAGER",
            role_name="Capacity Manager",
            factory=factory,
            department=planning_dept,
        )
        release_coordinator = self._upsert_seed_user(
            User,
            username="release_coordinator",
            first_name="Release",
            last_name="Coordinator",
            email="release.coordinator@example.com",
            role_code="RELEASE_COORDINATOR",
            role_name="Release Coordinator",
            factory=factory,
            department=planning_dept,
        )

        start, end = default_plan_dates()
        today = timezone.localdate()
        horizon, _ = PlanningHorizon.objects.update_or_create(
            code=f"WEEK-{start:%Y%m%d}",
            defaults={
                "name": f"Weekly plan {start:%d %b}",
                "start_date": start,
                "end_date": end,
                "factory": factory,
                "status": PlanningHorizonStatus.ACTIVE,
                "is_current": True,
                "is_active": True,
            },
        )
        PlanningHorizon.objects.exclude(id=horizon.id).update(is_current=False)

        cutting = Workcenter.objects.get(factory=factory, code="CUTTING")
        sewing = Workcenter.objects.get(factory=factory, code="SEW-WC")
        wash = Workcenter.objects.get(factory=factory, code="WASH-WC")
        self._seed_capacity(start, end, cutting, sewing, wash, capacity_manager)

        frozen = self._upsert_plan_version(horizon, 1, PlanVersionStatus.FROZEN, planner)
        draft = self._upsert_plan_version(horizon, 2, PlanVersionStatus.DRAFT, planner)
        PlanVersion.objects.filter(horizon=horizon, version_no__gt=2).delete()

        ready_order = ProductionOrder.objects.get(order_no="ORD-HP-001")
        self._seed_ready_backlog_order(factory, planner)
        pcd_blocked_order = ProductionOrder.objects.get(order_no="ORD-PCD-001")
        fabric_blocked_order = ProductionOrder.objects.get(order_no="ORD-FABQC-001")
        material_blocked_order = ProductionOrder.objects.get(order_no="ORD-MAT-001")

        self._direct_work_item(
            frozen,
            ready_order,
            sewing,
            start,
            150,
            PlannedWorkItemStatus.RELEASE_READY,
            RiskStatus.ON_TRACK,
        )
        ready_item = assign_work_item(
            plan_version=draft,
            order=ready_order,
            workcenter=cutting,
            planned_quantity=600,
            planned_start_date=start,
            planned_end_date=start + timedelta(days=1),
            assigned_by=planner,
        )
        self._direct_work_item(
            draft,
            pcd_blocked_order,
            sewing,
            start + timedelta(days=1),
            800,
            PlannedWorkItemStatus.BLOCKED,
            RiskStatus.ACTION,
        )
        overloaded_item = self._direct_work_item(
            draft,
            fabric_blocked_order,
            wash,
            today,
            7000,
            PlannedWorkItemStatus.BLOCKED,
            RiskStatus.CRITICAL,
        )
        self._direct_work_item(
            draft,
            material_blocked_order,
            cutting,
            start + timedelta(days=3),
            500,
            PlannedWorkItemStatus.BLOCKED,
            RiskStatus.ACTION,
        )

        for workcenter in [cutting, sewing, wash]:
            calculate_load(workcenter, start_date=start, end_date=end, horizon=horizon)
        self._force_overload_snapshot(wash, horizon, start, fabric_blocked_order)
        self._seed_queue(
            start,
            cutting,
            sewing,
            wash,
            ready_order,
            pcd_blocked_order,
            fabric_blocked_order,
        )
        self._seed_releases(start, ready_item, overloaded_item, release_coordinator, planning_head)
        call_command("seed_scheduling_rulebook", verbosity=0)
        self.stdout.write(self.style.SUCCESS("EOS-04 planning release seed data loaded."))

    def _seed_permissions(self):
        permission_objects = {}
        for code, module, name in EOS04_PERMISSIONS:
            permission, _ = PermissionAction.objects.update_or_create(
                code=code,
                defaults={"module": module, "name": name, "is_active": True},
            )
            permission_objects[code] = permission
        return permission_objects

    def _assign_eos04_permissions(self, permissions):
        role_permissions = {
            "PLANNER": [
                "planning.view",
                "planning.create",
                "planning.assign",
                "planning.impact_preview",
                "planning.freeze",
                "planning.request_change",
                "workcenters.view",
                "workcenters.view_load",
                "workcenters.view_queue",
                "release.view",
                "release.validate",
                "release.create",
                "release.request_override",
            ],
            "PLANNING_HEAD": list(permissions),
            "BUSINESS_ADMIN": list(permissions),
            "CAPACITY_MANAGER": [
                "planning.view",
                "workcenters.view",
                "workcenters.view_load",
                "workcenters.view_queue",
                "workcenters.adjust_capacity",
                "release.view",
            ],
            "RELEASE_COORDINATOR": [
                "planning.view",
                "workcenters.view_load",
                "workcenters.view_queue",
                "release.view",
                "release.validate",
                "release.create",
                "release.request_override",
                "release.complete",
            ],
        }
        for role_code, codes in role_permissions.items():
            role, _ = Role.objects.update_or_create(
                code=role_code,
                defaults={"name": role_code.replace("_", " ").title(), "is_system": True},
            )
            for code in codes:
                RolePermission.objects.get_or_create(role=role, permission=permissions[code])

    def _upsert_seed_user(
        self,
        User,
        *,
        username,
        first_name,
        last_name,
        email,
        role_code,
        role_name,
        factory,
        department,
    ):
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password("planning123")
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.is_staff = True
        user.is_active = True
        user.save()
        role = Role.objects.get(code=role_code)
        role.name = role_name
        role.save(update_fields=["name", "updated_at"])
        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                "display_name": user.get_full_name() or user.username,
                "employee_code": user.username.upper(),
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

    def _seed_capacity(self, start, end, cutting, sewing, wash, approved_by):
        for offset in range((end - start).days + 1):
            capacity_date = start + timedelta(days=offset)
            for workcenter, minutes in [(cutting, 90000), (sewing, 80000), (wash, 25000)]:
                WorkcenterCapacityDay.objects.update_or_create(
                    workcenter=workcenter,
                    capacity_date=capacity_date,
                    defaults={
                        "available_minutes": minutes,
                        "capacity_unit": workcenter.capacity_unit,
                        "capacity_value": Decimal(minutes),
                        "source": "EOS04_SEED",
                        "is_active": True,
                    },
                )
        CapacityAdjustment.objects.update_or_create(
            workcenter=wash,
            adjustment_date=start + timedelta(days=2),
            adjustment_type=CapacityAdjustment.AdjustmentType.MAINTENANCE,
            defaults={
                "minutes_delta": -5000,
                "reason": "Wet wash planned maintenance window.",
                "status": "APPROVED",
                "approved_by": approved_by,
                "is_active": True,
            },
        )

    def _upsert_plan_version(self, horizon, version_no, status, user):
        plan, _ = PlanVersion.objects.update_or_create(
            horizon=horizon,
            version_no=version_no,
            defaults={
                "status": status,
                "risk_status": RiskStatus.ON_TRACK,
                "notes": "Seeded Phase 4 plan.",
                "frozen_at": timezone.now() if status == PlanVersionStatus.FROZEN else None,
                "frozen_by": user if status == PlanVersionStatus.FROZEN else None,
                "created_by": user,
                "updated_by": user,
                "is_active": True,
            },
        )
        return plan

    def _seed_ready_backlog_order(self, factory, owner):
        today = timezone.localdate()
        style = Style.objects.select_related("customer", "buyer", "product_type").get(
            style_code="STY-DEN-RUSH"
        )
        order, _ = ProductionOrder.objects.update_or_create(
            order_no="ORD-PLAN-001",
            defaults={
                "po_number": "PO-PLAN-001",
                "customer": style.customer,
                "buyer": style.buyer,
                "style": style,
                "factory": factory,
                "product_type": style.product_type,
                "order_qty": 6500,
                "planned_pcd_date": today + timedelta(days=5),
                "planned_ship_date": today + timedelta(days=21),
                "committed_ship_date": today + timedelta(days=21),
                "owner": owner,
                "order_status": "ACTIVE",
                "risk_status": RiskStatus.ON_TRACK,
                "is_active": True,
            },
        )
        initialize_order_lifecycle(order, performed_by=owner)
        initialize_pcd_readiness(order, performed_by=owner)
        order.pcd_readiness.items.update(
            status=PCDItemStatus.PASSED,
            remarks="EOS-04 ready backlog seed.",
            updated_at=timezone.now(),
        )
        calculate_pcd_readiness(order.pcd_readiness)
        PlannedWorkItem.objects.filter(order=order).delete()
        return order

    def _direct_work_item(self, plan, order, workcenter, plan_date, quantity, status, risk):
        item, _ = PlannedWorkItem.objects.update_or_create(
            plan_version=plan,
            order=order,
            workcenter=workcenter,
            defaults={
                "planned_start_date": plan_date,
                "planned_end_date": plan_date,
                "planned_quantity": quantity,
                "load_minutes": int(quantity * 6),
                "status": status,
                "risk_status": risk,
                "locked": plan.status == PlanVersionStatus.FROZEN,
                "is_active": True,
            },
        )
        return item

    def _force_overload_snapshot(self, workcenter, horizon, start, order):
        WorkcenterLoadSnapshot.objects.update_or_create(
            workcenter=workcenter,
            snapshot_date=start,
            defaults={
                "horizon": horizon,
                "available_minutes": 25000,
                "planned_load_minutes": 42000,
                "utilization_percent": Decimal("168.00"),
                "queue_quantity": 7000,
                "oldest_queue_age_hours": 28,
                "constraint_status": ConstraintStatus.CRITICAL,
                "risk_status": RiskStatus.CRITICAL,
                "top_affected_order": order,
                "suggested_action": "Approve capacity action before daily release.",
                "is_active": True,
            },
        )

    def _seed_queue(
        self,
        start,
        cutting,
        sewing,
        wash,
        ready_order,
        pcd_blocked_order,
        fabric_order,
    ):
        rows = [
            (cutting, ready_order, "READY_FOR_RELEASE", 600, 4, RiskStatus.ON_TRACK, "Planning"),
            (sewing, pcd_blocked_order, "PCD_BLOCKED", 800, 14, RiskStatus.ACTION, "Planning"),
            (wash, fabric_order, "WASH_QUEUE", 7000, 28, RiskStatus.CRITICAL, "Wash"),
        ]
        for workcenter, order, stage, qty, age, risk, owner in rows:
            WorkcenterQueueSnapshot.objects.update_or_create(
                workcenter=workcenter,
                snapshot_date=start,
                order=order,
                queue_stage=stage,
                defaults={
                    "queue_quantity": qty,
                    "age_hours": age,
                    "risk_status": risk,
                    "owner_label": owner,
                    "next_action": "Release" if risk == RiskStatus.ON_TRACK else "Resolve blocker",
                    "is_active": True,
                },
            )

    def _seed_releases(self, start, ready_item, blocked_item, release_user, planning_head):
        blocked_date = blocked_item.planned_start_date
        ready_release, _ = ProductionRelease.objects.update_or_create(
            release_no=f"REL-{ready_item.order.order_no}-{start:%Y%m%d}",
            defaults={
                "planned_work_item": ready_item,
                "order": ready_item.order,
                "workcenter": ready_item.workcenter,
                "release_date": start,
                "status": ProductionReleaseStatus.READY,
                "risk_status": RiskStatus.ON_TRACK,
                "released_by": release_user,
                "created_by": release_user,
                "updated_by": release_user,
                "is_active": True,
            },
        )
        blocked_release, _ = ProductionRelease.objects.update_or_create(
            release_no=f"REL-{blocked_item.order.order_no}-{blocked_date:%Y%m%d}",
            defaults={
                "planned_work_item": blocked_item,
                "order": blocked_item.order,
                "workcenter": blocked_item.workcenter,
                "release_date": blocked_date,
                "status": ProductionReleaseStatus.OVERRIDE_REQUESTED,
                "risk_status": RiskStatus.CRITICAL,
                "override_requested_by": release_user,
                "override_reason": "Fabric QC blocker requires planning head decision.",
                "created_by": release_user,
                "updated_by": planning_head,
                "is_active": True,
            },
        )
        validate_release(release=ready_release, checked_by=release_user)
        validate_release(release=blocked_release, checked_by=release_user)
