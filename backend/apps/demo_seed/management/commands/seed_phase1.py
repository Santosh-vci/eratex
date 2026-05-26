from datetime import time

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.identity_access.models import (
    PermissionAction,
    Role,
    RolePermission,
    UserProfile,
    UserRole,
    UserScope,
)
from apps.organization.models import Department, Factory, Line, ShiftCalendar, Workcenter

PERMISSIONS = [
    ("foundation.view", "Foundation", "View platform foundation"),
    ("orders.view", "Orders", "View order surfaces"),
    ("pcd.view", "PCD Readiness", "View PCD readiness"),
    ("planning.view", "Planning", "View planning workbench"),
    ("release.view", "Daily Release", "View daily release"),
    ("workcenters.view", "Workcenters", "View capacity surfaces"),
    ("sewing.view", "Sewing", "View sewing line loading"),
    ("wash.view", "Wash", "View wash planning"),
    ("wip.view", "WIP", "View WIP pipeline"),
    ("exceptions.view", "Exceptions", "View exception control"),
    ("shipment.view", "Shipment", "View shipment readiness"),
    ("mobile.view", "Mobile", "View mobile shell"),
    ("audit.view", "Audit", "View audit trail"),
    ("admin.view", "Admin", "View admin support"),
]


class Command(BaseCommand):
    help = "Seed deterministic Phase 1 roles, permissions, organization, and demo users."

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()

        factory, _ = Factory.objects.update_or_create(
            code="UNIT-04",
            defaults={"name": "Unit 04 Denim", "timezone": "Asia/Jakarta", "is_active": True},
        )
        planning_dept, _ = Department.objects.update_or_create(
            factory=factory,
            code="PLAN",
            defaults={
                "name": "Planning",
                "department_type": Department.DepartmentType.PLANNING,
                "is_active": True,
            },
        )
        sewing_dept, _ = Department.objects.update_or_create(
            factory=factory,
            code="SEW",
            defaults={
                "name": "Sewing",
                "department_type": Department.DepartmentType.PRODUCTION,
                "is_active": True,
            },
        )
        wash_dept, _ = Department.objects.update_or_create(
            factory=factory,
            code="WASH",
            defaults={
                "name": "Washing",
                "department_type": Department.DepartmentType.WASH,
                "is_active": True,
            },
        )
        sewing_wc, _ = Workcenter.objects.update_or_create(
            factory=factory,
            code="SEW-WC",
            defaults={
                "department": sewing_dept,
                "name": "Sewing Workcenter",
                "workcenter_type": Workcenter.WorkcenterType.SEWING,
                "capacity_unit": "MINUTES",
                "is_active": True,
            },
        )
        wash_wc, _ = Workcenter.objects.update_or_create(
            factory=factory,
            code="WASH-WC",
            defaults={
                "department": wash_dept,
                "name": "Wash Workcenter",
                "workcenter_type": Workcenter.WorkcenterType.WASH,
                "capacity_unit": "MINUTES",
                "is_active": True,
            },
        )
        Line.objects.update_or_create(
            factory=factory,
            code="LINE-05",
            defaults={
                "department": sewing_dept,
                "workcenter": sewing_wc,
                "name": "Sewing Line 05",
                "line_type": "SEWING",
                "is_active": True,
            },
        )
        ShiftCalendar.objects.update_or_create(
            factory=factory,
            name="Default Shift",
            defaults={
                "start_time": time(8, 0),
                "end_time": time(17, 0),
                "working_minutes": 480,
                "is_default": True,
                "is_active": True,
            },
        )

        permission_objects = {}
        for code, module, name in PERMISSIONS:
            permission, _ = PermissionAction.objects.update_or_create(
                code=code,
                defaults={"module": module, "name": name, "is_active": True},
            )
            permission_objects[code] = permission

        planner_role, _ = Role.objects.update_or_create(
            code="PLANNER",
            defaults={
                "name": "Production Planner",
                "description": "Phase 1 planner role",
                "is_system": True,
            },
        )
        manager_role, _ = Role.objects.update_or_create(
            code="MANAGEMENT",
            defaults={
                "name": "Management",
                "description": "Phase 1 management role",
                "is_system": True,
            },
        )
        supervisor_role, _ = Role.objects.update_or_create(
            code="LINE_SUPERVISOR",
            defaults={
                "name": "Line Supervisor",
                "description": "Phase 1 shopfloor role",
                "is_system": True,
            },
        )

        for permission in permission_objects.values():
            RolePermission.objects.get_or_create(role=planner_role, permission=permission)
        for permission in permission_objects.values():
            RolePermission.objects.get_or_create(role=manager_role, permission=permission)
        for code in [
            "foundation.view",
            "sewing.view",
            "wip.view",
            "exceptions.view",
            "mobile.view",
        ]:
            RolePermission.objects.get_or_create(
                role=supervisor_role, permission=permission_objects[code]
            )

        planner = self._upsert_user(
            User,
            username="planner",
            password="planning123",
            email="planner@example.com",
            first_name="Production",
            last_name="Planner",
            is_staff=True,
        )
        self._assign_user(planner, planner_role, factory, planning_dept)

        supervisor = self._upsert_user(
            User,
            username="supervisor",
            password="planning123",
            email="supervisor@example.com",
            first_name="Line",
            last_name="Supervisor",
            is_staff=False,
        )
        self._assign_user(supervisor, supervisor_role, factory, sewing_dept)

        self.stdout.write(self.style.SUCCESS("Phase 1 seed data loaded."))

    def _upsert_user(self, User, *, username, password, email, first_name, last_name, is_staff):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "is_staff": is_staff,
                "is_active": True,
            },
        )
        if created:
            user.set_password(password)
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.is_staff = is_staff
        user.is_active = True
        user.save()
        return user

    def _assign_user(self, user, role, factory, department):
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
