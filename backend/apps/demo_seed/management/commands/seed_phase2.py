from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.common.models import ApprovalStatus
from apps.identity_access.models import (
    PermissionAction,
    Role,
    RolePermission,
    UserProfile,
    UserRole,
    UserScope,
)
from apps.master_data.models import (
    Buyer,
    ChecklistTemplate,
    ChecklistTemplateItem,
    Customer,
    DefectCode,
    ExceptionCategory,
    FabricQcParameter,
    HoldReason,
    Material,
    PlanningThreshold,
    ProductType,
    Vendor,
)
from apps.organization.models import Department, Factory, Line, ShiftCalendar, Workcenter
from apps.style_technical.models import (
    BOMHeader,
    BOMLine,
    OperationBulletin,
    OperationBulletinLine,
    OperationMaster,
    Style,
    WashRoute,
    WashRouteStep,
)
from apps.workcenters.models import (
    LineMachineAssignment,
    LineProfile,
    Machine,
    MachineType,
    Operator,
    OperatorSkill,
    WorkcenterCapacityDay,
)

PHASE2_PERMISSIONS = [
    ("master_data.view", "Master Data", "View master data"),
    ("master_data.create", "Master Data", "Create master data"),
    ("master_data.edit", "Master Data", "Edit master data"),
    ("master_data.approve", "Master Data", "Approve master data"),
    ("master_data.obsolete", "Master Data", "Obsolete master data"),
    ("master_data.import", "Master Data", "Import master data"),
    ("master_data.export", "Master Data", "Export master data"),
    ("bulletin.view", "Operation Bulletin", "View operation bulletins"),
    ("bulletin.create", "Operation Bulletin", "Create operation bulletins"),
    ("bulletin.edit", "Operation Bulletin", "Edit operation bulletins"),
    ("bulletin.clone", "Operation Bulletin", "Clone operation bulletins"),
    ("bulletin.submit_for_approval", "Operation Bulletin", "Submit operation bulletins"),
    ("bulletin.approve", "Operation Bulletin", "Approve operation bulletins"),
    ("bulletin.obsolete", "Operation Bulletin", "Obsolete operation bulletins"),
    ("skill_matrix.view", "Skill Matrix", "View skill matrix"),
    ("skill_matrix.edit", "Skill Matrix", "Edit skill matrix"),
]


class Command(BaseCommand):
    help = "Seed deterministic Phase 2 master data and technical product foundation."

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_phase1", verbosity=0)
        User = get_user_model()

        factory = Factory.objects.get(code="UNIT-04")
        planning_dept = Department.objects.get(factory=factory, code="PLAN")
        sewing_dept = Department.objects.get(factory=factory, code="SEW")
        ie_dept, _ = Department.objects.update_or_create(
            factory=factory,
            code="IE",
            defaults={
                "name": "Industrial Engineering",
                "department_type": Department.DepartmentType.TECHNICAL,
                "is_active": True,
            },
        )
        sewing_wc = Workcenter.objects.get(factory=factory, code="SEW-WC")
        wash_wc = Workcenter.objects.get(factory=factory, code="WASH-WC")
        cutting_wc, _ = Workcenter.objects.update_or_create(
            factory=factory,
            code="CUTTING",
            defaults={
                "department": sewing_dept,
                "name": "Cutting",
                "workcenter_type": Workcenter.WorkcenterType.CUTTING,
                "capacity_unit": "PIECES",
                "is_active": True,
            },
        )
        shift, _ = ShiftCalendar.objects.update_or_create(
            factory=factory,
            name="A Shift",
            defaults={
                "start_time": time(8, 0),
                "end_time": time(17, 0),
                "working_minutes": 480,
                "is_default": True,
                "is_active": True,
            },
        )

        permissions = self._seed_permissions()
        planner_role = Role.objects.get(code="PLANNER")
        supervisor_role = Role.objects.get(code="LINE_SUPERVISOR")
        business_role, _ = Role.objects.update_or_create(
            code="BUSINESS_ADMIN",
            defaults={
                "name": "Business Admin",
                "description": "Master data owner",
                "is_system": True,
            },
        )
        ie_role, _ = Role.objects.update_or_create(
            code="IE_USER",
            defaults={
                "name": "IE User",
                "description": "Operation bulletin owner",
                "is_system": True,
            },
        )

        for code in ["master_data.view", "bulletin.view", "skill_matrix.view"]:
            RolePermission.objects.get_or_create(role=planner_role, permission=permissions[code])
        for code in ["skill_matrix.view"]:
            RolePermission.objects.get_or_create(role=supervisor_role, permission=permissions[code])
        for permission in permissions.values():
            RolePermission.objects.get_or_create(role=business_role, permission=permission)
        for code, permission in permissions.items():
            if code.startswith("bulletin.") or code in {
                "master_data.view",
                "skill_matrix.view",
                "skill_matrix.edit",
            }:
                RolePermission.objects.get_or_create(role=ie_role, permission=permission)

        business_admin = self._upsert_user(
            User,
            username="business_admin",
            password="planning123",
            email="business.admin@example.com",
            first_name="Business",
            last_name="Admin",
            is_staff=True,
        )
        ie_user = self._upsert_user(
            User,
            username="ie_user",
            password="planning123",
            email="ie.user@example.com",
            first_name="Industrial",
            last_name="Engineer",
            is_staff=True,
        )
        self._assign_user(business_admin, business_role, factory, planning_dept)
        self._assign_user(ie_user, ie_role, factory, ie_dept)

        product_types = self._seed_product_types()
        customers, buyers = self._seed_customers()
        vendors = self._seed_vendors()
        materials = self._seed_materials(vendors)
        machine_types = self._seed_machine_types()
        lines = self._seed_lines(factory, sewing_dept, sewing_wc, shift)
        machines = self._seed_machines(factory, lines, machine_types)
        self._seed_line_profiles(lines, shift, product_types)
        self._seed_machine_assignments(lines, machines, business_admin)
        self._seed_capacity_days(cutting_wc, sewing_wc, wash_wc)
        self._seed_quality_and_thresholds()
        operations = self._seed_operation_masters(machine_types)
        wash_routes = self._seed_wash_routes(product_types, wash_wc, machine_types, business_admin)
        styles = self._seed_styles(customers, buyers, product_types, wash_routes)
        self._seed_boms(styles, materials, business_admin)
        self._seed_bulletins(styles, operations, machine_types, business_admin)
        self._seed_operators(factory, lines, operations)
        self._seed_checklists()

        self.stdout.write(self.style.SUCCESS("Phase 2 seed data loaded."))

    def _seed_permissions(self):
        permission_objects = {}
        for code, module, name in PHASE2_PERMISSIONS:
            permission, _ = PermissionAction.objects.update_or_create(
                code=code,
                defaults={"module": module, "name": name, "is_active": True},
            )
            permission_objects[code] = permission
        return permission_objects

    def _upsert_user(self, User, *, username, password, email, first_name, last_name, is_staff):
        user, created = User.objects.get_or_create(username=username)
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

    def _seed_product_types(self):
        product_types = {}
        for code, name in [
            ("DENIM_BOTTOM", "Denim Bottom"),
            ("CHINO", "Chino"),
            ("CARGO", "Cargo"),
            ("JOGGER", "Jogger"),
        ]:
            product_types[code], _ = ProductType.objects.update_or_create(
                code=code,
                defaults={"name": name, "is_active": True},
            )
        return product_types

    def _seed_customers(self):
        customers = {}
        buyers = {}
        for code, name, priority, buyer_code in [
            ("CUST-A", "Global Denim Buyer A", "HIGH", "BUYER-A1"),
            ("CUST-B", "Mid-Market Buyer B", "MEDIUM", "BUYER-B1"),
            ("CUST-C", "Chino Retailer C", "MEDIUM", "BUYER-C1"),
            ("CUST-D", "Fashion Wash Buyer D", "HIGH", "BUYER-D1"),
        ]:
            customer, _ = Customer.objects.update_or_create(
                code=code,
                defaults={"name": name, "priority_level": priority, "is_active": True},
            )
            buyer, _ = Buyer.objects.update_or_create(
                customer=customer,
                code=buyer_code,
                defaults={"name": buyer_code.replace("-", " "), "is_active": True},
            )
            customers[code] = customer
            buyers[buyer_code] = buyer
        return customers, buyers

    def _seed_vendors(self):
        vendors = {}
        for code, name, vendor_type, nominated, lead_time in [
            ("VEN-FAB-01", "Nominated Fabric Vendor 01", Vendor.VendorType.FABRIC, True, 25),
            ("VEN-FAB-02", "Nominated Fabric Vendor 02", Vendor.VendorType.FABRIC, True, 30),
            ("VEN-TRIM-01", "Trims Vendor 01", Vendor.VendorType.TRIMS, True, 20),
            ("VEN-PACK-01", "Packing Vendor 01", Vendor.VendorType.PACKING, False, 10),
        ]:
            vendors[code], _ = Vendor.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "vendor_type": vendor_type,
                    "nominated": nominated,
                    "standard_lead_time_days": lead_time,
                    "is_active": True,
                },
            )
        return vendors

    def _seed_materials(self, vendors):
        materials = {}
        data = [
            (
                "FAB-DEN-12OZ",
                "12 oz Stretch Denim",
                Material.MaterialType.MAIN_FABRIC,
                "meter",
                "VEN-FAB-01",
            ),
            (
                "FAB-DEN-14OZ",
                "14 oz Heavy Denim",
                Material.MaterialType.MAIN_FABRIC,
                "meter",
                "VEN-FAB-02",
            ),
            (
                "FAB-CHINO-TWL",
                "Chino Twill Fabric",
                Material.MaterialType.MAIN_FABRIC,
                "meter",
                "VEN-FAB-01",
            ),
            ("TRIM-RIVET-STD", "Standard Rivet", Material.MaterialType.RIVET, "pcs", "VEN-TRIM-01"),
            ("TRIM-BUTTON-STD", "Denim Button", Material.MaterialType.BUTTON, "pcs", "VEN-TRIM-01"),
            ("TRIM-ZIP-STD", "Zipper", Material.MaterialType.ZIPPER, "pcs", "VEN-TRIM-01"),
            (
                "THREAD-CORE-120",
                "Core Thread",
                Material.MaterialType.THREAD,
                "meter",
                "VEN-TRIM-01",
            ),
            (
                "PACK-CARTON-30",
                "Carton 30 pcs",
                Material.MaterialType.CARTON,
                "carton",
                "VEN-PACK-01",
            ),
        ]
        for code, name, material_type, uom, vendor_code in data:
            materials[code], _ = Material.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "material_type": material_type,
                    "uom": uom,
                    "default_vendor": vendors[vendor_code],
                    "standard_lead_time_days": vendors[vendor_code].standard_lead_time_days,
                    "nominated_vendor_required": vendor_code != "VEN-PACK-01",
                    "inspection_required": material_type == Material.MaterialType.MAIN_FABRIC,
                    "is_active": True,
                },
            )
        return materials

    def _seed_machine_types(self):
        machine_types = {}
        for code, category in [
            ("LOCKSTITCH", "SEWING"),
            ("OVERLOCK", "SEWING"),
            ("CHAINSTITCH", "SEWING"),
            ("DOUBLE_NEEDLE", "SEWING"),
            ("WAISTBAND", "SEWING"),
            ("BARTACK", "SEWING"),
            ("BUTTONHOLE", "SEWING"),
            ("BUTTON_ATTACH", "SEWING"),
            ("RIVET", "SEWING"),
            ("WASHER", "WASH"),
            ("DRYER", "WASH"),
            ("OZONE", "WASH"),
        ]:
            machine_types[code], _ = MachineType.objects.update_or_create(
                code=code,
                defaults={
                    "name": code.replace("_", " ").title(),
                    "category": category,
                    "is_active": True,
                },
            )
        return machine_types

    def _seed_lines(self, factory, department, workcenter, shift):
        lines = {}
        for code, name, line_type in [
            ("LINE-01", "Sewing Line 01", "DENIM"),
            ("LINE-02", "Sewing Line 02", "DENIM"),
            ("LINE-03", "Sewing Line 03", "CHINO"),
            ("LINE-04", "Sewing Line 04", "MIXED"),
        ]:
            lines[code], _ = Line.objects.update_or_create(
                factory=factory,
                code=code,
                defaults={
                    "department": department,
                    "workcenter": workcenter,
                    "name": name,
                    "line_type": line_type,
                    "is_active": True,
                },
            )
        return lines

    def _seed_machines(self, factory, lines, machine_types):
        machines = {}
        for index, (machine_type_code, line_code) in enumerate(
            [
                ("LOCKSTITCH", "LINE-01"),
                ("OVERLOCK", "LINE-01"),
                ("BARTACK", "LINE-01"),
                ("WAISTBAND", "LINE-02"),
                ("CHAINSTITCH", "LINE-02"),
                ("DOUBLE_NEEDLE", "LINE-03"),
                ("BUTTONHOLE", "LINE-03"),
                ("BARTACK", "LINE-04"),
                ("WASHER", "LINE-04"),
                ("DRYER", "LINE-04"),
            ],
            start=1,
        ):
            code = f"MC-{machine_type_code[:3]}-{index:03d}"
            machines[code], _ = Machine.objects.update_or_create(
                code=code,
                defaults={
                    "name": f"{machine_type_code} {index:03d}",
                    "machine_type": machine_types[machine_type_code],
                    "factory": factory,
                    "status": Machine.MachineStatus.ASSIGNED,
                    "current_line": lines[line_code],
                    "is_active": True,
                },
            )
        return machines

    def _seed_line_profiles(self, lines, shift, product_types):
        profile_data = {
            "LINE-01": (42, Decimal("68.00"), ["DENIM_BOTTOM"]),
            "LINE-02": (40, Decimal("72.00"), ["DENIM_BOTTOM"]),
            "LINE-03": (38, Decimal("70.00"), ["CHINO"]),
            "LINE-04": (36, Decimal("62.00"), ["DENIM_BOTTOM", "CHINO"]),
        }
        for code, (manpower, efficiency, product_codes) in profile_data.items():
            profile, _ = LineProfile.objects.update_or_create(
                line=lines[code],
                defaults={
                    "standard_manpower": manpower,
                    "current_manpower": manpower,
                    "shift_calendar": shift,
                    "baseline_efficiency": efficiency,
                    "net_good_output_baseline": 800,
                    "is_active": True,
                },
            )
            profile.allowed_product_types.set([product_types[item] for item in product_codes])

    def _seed_machine_assignments(self, lines, machines, user):
        today = date.today()
        for machine in machines.values():
            LineMachineAssignment.objects.update_or_create(
                line=machine.current_line,
                machine=machine,
                assigned_from=today - timedelta(days=30),
                defaults={"assigned_by": user, "assigned_to": None, "is_active": True},
            )

    def _seed_capacity_days(self, *workcenters):
        today = date.today()
        for offset in range(0, 7):
            for workcenter in workcenters:
                WorkcenterCapacityDay.objects.update_or_create(
                    workcenter=workcenter,
                    capacity_date=today + timedelta(days=offset),
                    defaults={
                        "available_minutes": 480,
                        "capacity_unit": workcenter.capacity_unit,
                        "capacity_value": Decimal("480.00"),
                        "source": "SEED",
                        "is_active": True,
                    },
                )

    def _seed_quality_and_thresholds(self):
        for code, name in [("FAB_SHADE", "Fabric shade variation"), ("SEAM_PUCKER", "Seam pucker")]:
            DefectCode.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "department_type": "QUALITY",
                    "severity": "MEDIUM",
                    "is_active": True,
                },
            )
        FabricQcParameter.objects.update_or_create(
            code="GSM",
            defaults={"name": "Fabric GSM", "severity": "HIGH", "is_active": True},
        )
        HoldReason.objects.update_or_create(
            code="MATERIAL_SHORT",
            defaults={"name": "Material shortage", "severity": "HIGH", "is_active": True},
        )
        ExceptionCategory.objects.update_or_create(
            code="MASTER_DATA_INCOMPLETE",
            defaults={"name": "Master data incomplete", "severity": "HIGH", "is_active": True},
        )
        PlanningThreshold.objects.update_or_create(
            code="PCD_BLOCKER_DAYS",
            defaults={
                "name": "PCD blocker days",
                "threshold_type": "DAYS",
                "value": Decimal("3.00"),
                "unit": "days",
                "is_active": True,
            },
        )

    def _seed_operation_masters(self, machine_types):
        operations = {}
        data = [
            ("OP-FRONT-POCKET", "Front pocket attach", "FRONT_PREP", "LOCKSTITCH", "MEDIUM"),
            ("OP-FLY-JOIN", "Fly join", "FLY_PREP", "LOCKSTITCH", "HIGH"),
            ("OP-BACK-RISE", "Back rise join", "PANEL_JOINING", "OVERLOCK", "MEDIUM"),
            ("OP-WAISTBAND", "Waistband attach", "WAISTBAND", "WAISTBAND", "HIGH"),
            ("OP-BARTACK", "Bartack reinforcement", "BARTACK_RIVET", "BARTACK", "HIGH"),
            ("OP-BUTTONHOLE", "Buttonhole", "BUTTONHOLE_BUTTON", "BUTTONHOLE", "MEDIUM"),
            ("OP-HEM", "Bottom hem", "HEM", "CHAINSTITCH", "MEDIUM"),
            ("OP-END-QC", "End line check", "END_LINE_CHECK", "LOCKSTITCH", "MEDIUM"),
        ]
        for code, name, group, machine_type_code, skill in data:
            operations[code], _ = OperationMaster.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "operation_group": group,
                    "default_machine_type": machine_types[machine_type_code],
                    "default_skill_level": skill,
                    "is_active": True,
                },
            )
        return operations

    def _seed_wash_routes(self, product_types, wash_wc, machine_types, approved_by):
        routes = {}
        route_data = [
            ("WASH-RINSE", "Rinse Wash", "LOW", "DENIM_BOTTOM", ["Wet wash", "Drying", "QC"]),
            (
                "WASH-ENZYME",
                "Enzyme Wash",
                "MEDIUM",
                "DENIM_BOTTOM",
                ["Enzyme", "Softener", "Drying", "QC"],
            ),
            (
                "WASH-HEAVY",
                "Heavy Denim Wash",
                "HIGH",
                "DENIM_BOTTOM",
                ["Dry process", "Stone", "Drying", "QC"],
            ),
            (
                "WASH-FASHION",
                "Fashion Wash",
                "VERY_HIGH",
                "DENIM_BOTTOM",
                ["Whisker", "Tint", "Drying", "QC"],
            ),
            (
                "WASH-CHINO",
                "Chino Garment Wash",
                "LOW",
                "CHINO",
                ["Garment wash", "Softener", "Drying", "QC"],
            ),
        ]
        for code, name, complexity, product_code, steps in route_data:
            route, _ = WashRoute.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "product_type": product_types[product_code],
                    "complexity": complexity,
                    "status": ApprovalStatus.APPROVED,
                    "approved_by": approved_by,
                    "approved_at": timezone.now(),
                    "is_active": True,
                },
            )
            for index, step_name in enumerate(steps, start=1):
                WashRouteStep.objects.update_or_create(
                    route=route,
                    sequence_no=index * 10,
                    defaults={
                        "name": step_name,
                        "workcenter": wash_wc,
                        "machine_type": machine_types["DRYER"]
                        if step_name == "Drying"
                        else machine_types["WASHER"],
                        "standard_minutes": 45 if step_name != "QC" else 20,
                        "qc_step": step_name == "QC",
                        "required": True,
                        "is_active": True,
                    },
                )
            routes[code] = route
        return routes

    def _seed_styles(self, customers, buyers, product_types, wash_routes):
        style_data = [
            ("STY-DEN-BASIC", "CUST-A", "BUYER-A1", "DENIM_BOTTOM", "MEDIUM", "WASH-RINSE"),
            ("STY-DEN-HEAVY", "CUST-A", "BUYER-A1", "DENIM_BOTTOM", "HIGH", "WASH-HEAVY"),
            ("STY-DEN-FASHION", "CUST-D", "BUYER-D1", "DENIM_BOTTOM", "HIGH", "WASH-FASHION"),
            ("STY-CHINO-BASIC", "CUST-C", "BUYER-C1", "CHINO", "MEDIUM", "WASH-CHINO"),
            ("STY-DEN-RUSH", "CUST-B", "BUYER-B1", "DENIM_BOTTOM", "HIGH", "WASH-ENZYME"),
            ("STY-DEN-NO-BULLETIN", "CUST-B", "BUYER-B1", "DENIM_BOTTOM", "MEDIUM", None),
        ]
        styles = {}
        for code, customer_code, buyer_code, product_code, complexity, route_code in style_data:
            styles[code], _ = Style.objects.update_or_create(
                style_code=code,
                defaults={
                    "customer": customers[customer_code],
                    "buyer": buyers[buyer_code],
                    "product_type": product_types[product_code],
                    "description": code.replace("-", " ").title(),
                    "fit_type": "Regular",
                    "fabric_category": "Denim" if "DEN" in code else "Chino",
                    "wash_complexity": complexity,
                    "sewing_complexity": complexity,
                    "overall_complexity": complexity,
                    "status": ApprovalStatus.APPROVED,
                    "default_wash_route": wash_routes[route_code] if route_code else None,
                    "is_active": True,
                },
            )
        return styles

    def _seed_boms(self, styles, materials, approved_by):
        for style_code, style in styles.items():
            if style_code == "STY-DEN-NO-BULLETIN":
                continue
            bom, _ = BOMHeader.objects.update_or_create(
                style=style,
                version="v1",
                defaults={
                    "status": ApprovalStatus.APPROVED,
                    "approved_by": approved_by,
                    "approved_at": timezone.now(),
                    "effective_date": date.today(),
                    "is_active": True,
                },
            )
            fabric = (
                materials["FAB-CHINO-TWL"] if "CHINO" in style_code else materials["FAB-DEN-12OZ"]
            )
            line_data = [
                (fabric, Decimal("1.3500"), Decimal("3.00"), "CUTTING"),
                (materials["TRIM-BUTTON-STD"], Decimal("1.0000"), Decimal("1.00"), "SEWING"),
                (materials["TRIM-ZIP-STD"], Decimal("1.0000"), Decimal("1.00"), "SEWING"),
                (materials["THREAD-CORE-120"], Decimal("120.0000"), Decimal("2.00"), "SEWING"),
                (materials["PACK-CARTON-30"], Decimal("0.0334"), Decimal("0.00"), "PACKING"),
            ]
            for material, consumption, wastage, stage in line_data:
                BOMLine.objects.update_or_create(
                    bom=bom,
                    material=material,
                    defaults={
                        "consumption_per_piece": consumption,
                        "wastage_percent": wastage,
                        "uom": material.uom,
                        "required_stage": stage,
                        "nominated_vendor_required": material.nominated_vendor_required,
                        "is_active": True,
                    },
                )

    def _seed_bulletins(self, styles, operations, machine_types, approved_by):
        for style_code, style in styles.items():
            if style_code == "STY-DEN-NO-BULLETIN":
                continue
            bulletin, _ = OperationBulletin.objects.update_or_create(
                style=style,
                version="v1",
                defaults={
                    "status": ApprovalStatus.APPROVED,
                    "approved_by": approved_by,
                    "approved_at": timezone.now(),
                    "effective_date": date.today(),
                    "is_active": True,
                },
            )
            line_specs = [
                ("OP-FRONT-POCKET", 10, Decimal("0.850"), False),
                ("OP-FLY-JOIN", 20, Decimal("1.100"), True),
                ("OP-WAISTBAND", 30, Decimal("1.250"), True),
                ("OP-BARTACK", 40, Decimal("0.650"), True),
                ("OP-HEM", 50, Decimal("0.700"), False),
                ("OP-END-QC", 60, Decimal("0.500"), True),
            ]
            total_smv = Decimal("0.00")
            for operation_code, sequence, smv, critical in line_specs:
                operation = operations[operation_code]
                total_smv += smv
                OperationBulletinLine.objects.update_or_create(
                    bulletin=bulletin,
                    sequence_no=sequence,
                    defaults={
                        "operation": operation,
                        "operation_name": operation.name,
                        "operation_group": operation.operation_group,
                        "machine_type": operation.default_machine_type
                        or machine_types["LOCKSTITCH"],
                        "skill_level": operation.default_skill_level,
                        "smv": smv,
                        "target_pph": Decimal("60.00") / smv,
                        "qc_checkpoint": operation_code == "OP-END-QC",
                        "critical_operation": critical,
                        "parallel_allowed": False,
                        "rework_sensitive": critical,
                        "is_active": True,
                    },
                )
            bulletin.total_smv = total_smv
            bulletin.save(update_fields=["total_smv", "updated_at"])

    def _seed_operators(self, factory, lines, operations):
        op_index = list(operations.values())[:4]
        for index, line in enumerate(lines.values(), start=1):
            operator, _ = Operator.objects.update_or_create(
                employee_code=f"OP-{index:03d}",
                defaults={
                    "display_name": f"Operator {index:03d}",
                    "factory": factory,
                    "line": line,
                    "is_active": True,
                },
            )
            for operation in op_index:
                OperatorSkill.objects.update_or_create(
                    operator=operator,
                    operation=operation,
                    defaults={
                        "skill_level": OperatorSkill.SkillLevel.HIGH,
                        "efficiency_rating": Decimal("75.00"),
                        "quality_rating": Decimal("92.00"),
                        "last_reviewed_date": date.today(),
                        "training_required": False,
                        "is_active": True,
                    },
                )

    def _seed_checklists(self):
        template, _ = ChecklistTemplate.objects.update_or_create(
            code="PCD-DEFAULT",
            defaults={
                "name": "Default PCD Checklist",
                "template_type": ChecklistTemplate.TemplateType.PCD,
                "status": ApprovalStatus.APPROVED,
                "is_active": True,
            },
        )
        for sequence, code, label, owner in [
            (10, "STYLE_APPROVED", "Style approved", "MERCHANDISER"),
            (20, "BOM_APPROVED", "BOM approved", "TECHNICAL"),
            (30, "BULLETIN_APPROVED", "Operation bulletin approved", "IE"),
            (40, "WASH_ROUTE_APPROVED", "Wash route approved", "WASH"),
        ]:
            ChecklistTemplateItem.objects.update_or_create(
                template=template,
                code=code,
                defaults={
                    "sequence_no": sequence,
                    "label": label,
                    "owner_role": owner,
                    "mandatory": True,
                    "is_active": True,
                },
            )
