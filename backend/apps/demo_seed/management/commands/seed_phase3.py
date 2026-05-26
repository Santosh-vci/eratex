from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.common.models import RiskStatus
from apps.fabric_qc.models import FabricLot, FabricQCInspection, FabricQcStatus, FabricRoll
from apps.identity_access.models import (
    PermissionAction,
    Role,
    RolePermission,
    UserProfile,
    UserRole,
    UserScope,
)
from apps.master_data.models import PlanningThreshold, Vendor
from apps.materials_procurement.models import (
    MaterialPurchaseOrder,
    MaterialPurchaseOrderStatus,
    MaterialRequirement,
    MaterialRequirementStatus,
)
from apps.orders.models import OrderLine, ProductionOrder
from apps.orders.services.lifecycle import initialize_order_lifecycle
from apps.organization.models import Department, Factory
from apps.pcd_readiness.models import PCDItemStatus
from apps.pcd_readiness.services.readiness import (
    calculate_pcd_readiness,
    ensure_default_pcd_template,
    initialize_pcd_readiness,
)
from apps.style_technical.models import BOMHeader, Style

PHASE3_PERMISSIONS = [
    ("orders.view", "Orders", "View orders"),
    ("orders.create", "Orders", "Create orders"),
    ("orders.edit", "Orders", "Edit orders"),
    ("orders.view_timeline", "Orders", "View order timeline"),
    ("orders.release_to_cutting", "Orders", "Release order to cutting"),
    ("procurement.view", "Procurement", "View procurement readiness"),
    ("procurement.update_eta", "Procurement", "Update material ETA"),
    ("procurement.close_shortage", "Procurement", "Close material shortage"),
    ("fabric_qc.view", "Fabric QC", "View fabric QC"),
    ("fabric_qc.create_inspection", "Fabric QC", "Create fabric QC inspection"),
    ("fabric_qc.waive", "Fabric QC", "Waive fabric QC inspection"),
    ("pcd.view", "PCD", "View PCD readiness"),
    ("pcd.update_item", "PCD", "Update PCD readiness item"),
    ("pcd.request_conditional_release", "PCD", "Request PCD conditional release"),
    ("pcd.approve_conditional_release", "PCD", "Approve PCD conditional release"),
    ("pcd.release_to_cutting", "PCD", "Release to cutting"),
    ("pcd.view_audit", "PCD", "View PCD audit"),
]


class Command(BaseCommand):
    help = "Seed deterministic Phase 3 order, procurement, fabric QC, and PCD readiness data."

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_phase2", verbosity=0)
        ensure_default_pcd_template()
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

        User = get_user_model()
        factory = Factory.objects.get(code="UNIT-04")
        planning_dept = Department.objects.get(factory=factory, code="PLAN")
        quality_dept, _ = Department.objects.update_or_create(
            factory=factory,
            code="QA",
            defaults={"name": "Quality Assurance", "department_type": "QUALITY", "is_active": True},
        )
        permissions = self._seed_permissions()
        self._assign_phase3_permissions(permissions)

        planner = User.objects.get(username="planner")
        merchandiser = self._upsert_seed_user(
            User,
            username="merchandiser",
            first_name="Merchandise",
            last_name="Owner",
            email="merchandiser@example.com",
            role_code="MERCHANDISER",
            role_name="Merchandiser",
            factory=factory,
            department=planning_dept,
        )
        procurement_user = self._upsert_seed_user(
            User,
            username="procurement_user",
            first_name="Procurement",
            last_name="Owner",
            email="procurement@example.com",
            role_code="PROCUREMENT_USER",
            role_name="Procurement User",
            factory=factory,
            department=planning_dept,
        )
        fabric_qc_user = self._upsert_seed_user(
            User,
            username="fabric_qc_user",
            first_name="Fabric",
            last_name="QC",
            email="fabric.qc@example.com",
            role_code="FABRIC_QC_USER",
            role_name="Fabric QC User",
            factory=factory,
            department=quality_dept,
        )
        self._upsert_seed_user(
            User,
            username="planning_head",
            first_name="Planning",
            last_name="Head",
            email="planning.head@example.com",
            role_code="PLANNING_HEAD",
            role_name="Planning Head",
            factory=factory,
            department=planning_dept,
        )

        today = date.today()
        scenarios = [
            (
                "ORD-HP-001",
                "PO-HP-001",
                "STY-DEN-BASIC",
                10000,
                today + timedelta(days=7),
                today + timedelta(days=20),
                "READY",
            ),
            (
                "ORD-PCD-001",
                "PO-PCD-001",
                "STY-DEN-BASIC",
                8000,
                today + timedelta(days=2),
                today + timedelta(days=18),
                "TRIMS_PENDING",
            ),
            (
                "ORD-FABQC-001",
                "PO-FABQC-001",
                "STY-DEN-HEAVY",
                12000,
                today + timedelta(days=2),
                today + timedelta(days=16),
                "FABRIC_FAILED",
            ),
            (
                "ORD-MAT-001",
                "PO-MAT-001",
                "STY-CHINO-BASIC",
                15000,
                today + timedelta(days=4),
                today + timedelta(days=24),
                "MATERIAL_DELAY",
            ),
            (
                "ORD-MDATA-001",
                "PO-MDATA-001",
                "STY-DEN-NO-BULLETIN",
                5000,
                today + timedelta(days=5),
                today + timedelta(days=22),
                "MASTER_BLOCKED",
            ),
        ]
        for order_no, po, style_code, qty, pcd_date, ship_date, scenario in scenarios:
            style = Style.objects.select_related("customer", "buyer", "product_type").get(
                style_code=style_code
            )
            order = self._upsert_order(
                order_no=order_no,
                po_number=po,
                style=style,
                qty=qty,
                planned_pcd_date=pcd_date,
                committed_ship_date=ship_date,
                factory=factory,
                owner=planner,
            )
            self._seed_order_lines(order)
            self._seed_materials(order, scenario, procurement_user)
            self._seed_fabric(order, scenario, fabric_qc_user)
            self._seed_pcd(order, scenario, merchandiser)
            calculate_pcd_readiness(order.pcd_readiness)
            if scenario == "MASTER_BLOCKED":
                order.risk_status = RiskStatus.CRITICAL
                order.save(update_fields=["risk_status", "updated_at"])

        self.stdout.write(self.style.SUCCESS("Phase 3 seed data loaded."))

    def _seed_permissions(self):
        permission_objects = {}
        for code, module, name in PHASE3_PERMISSIONS:
            permission, _ = PermissionAction.objects.update_or_create(
                code=code,
                defaults={"module": module, "name": name, "is_active": True},
            )
            permission_objects[code] = permission
        return permission_objects

    def _assign_phase3_permissions(self, permissions):
        role_permissions = {
            "PLANNER": [
                "orders.view",
                "orders.create",
                "orders.view_timeline",
                "procurement.view",
                "fabric_qc.view",
                "pcd.view",
                "pcd.request_conditional_release",
                "pcd.release_to_cutting",
            ],
            "BUSINESS_ADMIN": list(permissions),
            "MERCHANDISER": [
                "orders.view",
                "orders.edit",
                "orders.view_timeline",
                "pcd.view",
                "pcd.update_item",
            ],
            "PROCUREMENT_USER": [
                "orders.view",
                "procurement.view",
                "procurement.update_eta",
                "procurement.close_shortage",
                "pcd.view",
            ],
            "FABRIC_QC_USER": [
                "orders.view",
                "fabric_qc.view",
                "fabric_qc.create_inspection",
                "fabric_qc.waive",
                "pcd.view",
                "pcd.update_item",
            ],
            "PLANNING_HEAD": list(permissions),
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

    def _upsert_order(
        self,
        *,
        order_no,
        po_number,
        style,
        qty,
        planned_pcd_date,
        committed_ship_date,
        factory,
        owner,
    ):
        order, _ = ProductionOrder.objects.update_or_create(
            order_no=order_no,
            defaults={
                "po_number": po_number,
                "customer": style.customer,
                "buyer": style.buyer,
                "style": style,
                "factory": factory,
                "product_type": style.product_type,
                "order_qty": qty,
                "planned_pcd_date": planned_pcd_date,
                "committed_ship_date": committed_ship_date,
                "planned_ship_date": committed_ship_date,
                "owner": owner,
                "order_status": "ACTIVE",
            },
        )
        initialize_order_lifecycle(order, performed_by=owner)
        initialize_pcd_readiness(order, performed_by=owner)
        return order

    def _seed_order_lines(self, order):
        for size, ratio in [("30", 2), ("32", 3), ("34", 3), ("36", 2)]:
            OrderLine.objects.update_or_create(
                order=order,
                size=size,
                color="INDIGO" if "DEN" in order.style.style_code else "KHAKI",
                defaults={"quantity": int(order.order_qty * ratio / 10), "is_active": True},
            )

    def _seed_materials(self, order, scenario, procurement_user):
        bom = BOMHeader.objects.filter(style=order.style, status="APPROVED", is_active=True).first()
        if not bom:
            return
        for line in bom.lines.select_related("material", "material__default_vendor"):
            required_qty = Decimal(order.order_qty) * line.consumption_per_piece
            shortage = Decimal("0.000")
            status = MaterialRequirementStatus.READY
            if scenario == "TRIMS_PENDING" and line.material.material_type in {
                "BUTTON",
                "ZIPPER",
                "RIVET",
            }:
                shortage = Decimal("100.000")
                status = MaterialRequirementStatus.SHORT
            if scenario == "MATERIAL_DELAY" and line.material.material_type in {"BUTTON", "ZIPPER"}:
                shortage = Decimal("250.000")
                status = MaterialRequirementStatus.DELAYED
            requirement, _ = MaterialRequirement.objects.update_or_create(
                order=order,
                material=line.material,
                required_stage=line.required_stage,
                defaults={
                    "required_qty": required_qty,
                    "required_date": order.planned_pcd_date,
                    "status": status,
                    "shortage_qty": shortage,
                    "owner": procurement_user,
                    "is_active": True,
                },
            )
            vendor = line.material.default_vendor or Vendor.objects.first()
            expected = order.planned_pcd_date - timedelta(days=1)
            revised = None
            po_status = MaterialPurchaseOrderStatus.ACKNOWLEDGED
            if requirement.status == MaterialRequirementStatus.DELAYED:
                revised = order.planned_pcd_date + timedelta(days=5)
                po_status = MaterialPurchaseOrderStatus.DELAYED
            MaterialPurchaseOrder.objects.update_or_create(
                po_no=f"MPO-{order.order_no}-{line.material.code}",
                defaults={
                    "vendor": vendor,
                    "order": order,
                    "material": line.material,
                    "ordered_qty": required_qty,
                    "acknowledged_qty": required_qty - shortage,
                    "expected_arrival_date": expected,
                    "revised_eta": revised,
                    "actual_arrival_date": expected
                    if requirement.status == MaterialRequirementStatus.READY
                    else None,
                    "status": po_status,
                    "is_active": True,
                },
            )

    def _seed_fabric(self, order, scenario, fabric_qc_user):
        if order.style.style_code == "STY-DEN-NO-BULLETIN":
            return
        lot, _ = FabricLot.objects.update_or_create(
            order=order,
            lot_no=f"LOT-{order.order_no}",
            defaults={
                "shade_lot": "SHADE-A",
                "received_qty": Decimal(order.order_qty) * Decimal("1.35"),
                "received_date": order.planned_pcd_date - timedelta(days=2),
                "status": "RECEIVED",
                "is_active": True,
            },
        )
        for index in range(1, 5):
            status = FabricQcStatus.PASSED
            score = Decimal("18.00")
            if scenario == "FABRIC_FAILED" and index == 4:
                status = FabricQcStatus.FAILED
                score = Decimal("55.00")
            roll, _ = FabricRoll.objects.update_or_create(
                fabric_lot=lot,
                roll_no=f"R{index:03d}",
                defaults={
                    "roll_length": Decimal("100.000"),
                    "width": Decimal("44.00"),
                    "gsm": Decimal("310.00"),
                    "shade": "A",
                    "qc_status": status,
                    "is_active": True,
                },
            )
            FabricQCInspection.objects.update_or_create(
                fabric_roll=roll,
                inspection_date=order.planned_pcd_date - timedelta(days=1),
                defaults={
                    "four_point_score": score,
                    "width_result": Decimal("44.00"),
                    "gsm_result": Decimal("310.00"),
                    "shrinkage_percent": Decimal("3.00"),
                    "status": status,
                    "inspected_by": fabric_qc_user,
                    "remarks": "Seed inspection",
                    "is_active": True,
                },
            )

    def _seed_pcd(self, order, scenario, merchandiser):
        readiness = order.pcd_readiness
        default_status = PCDItemStatus.PASSED
        for item in readiness.items.all():
            status = default_status
            remarks = "Seed passed"
            if scenario == "TRIMS_PENDING" and item.item_code == "TRIMS_AVAILABLE":
                status = PCDItemStatus.PENDING
                remarks = "Button trim pending"
            if scenario == "FABRIC_FAILED" and item.item_code == "FABRIC_QC_PASSED":
                status = PCDItemStatus.FAILED
                remarks = "Fabric roll failed QC"
            if scenario == "MATERIAL_DELAY" and item.item_code == "TRIMS_AVAILABLE":
                status = PCDItemStatus.PENDING
                remarks = "Vendor ETA is after PCD"
            if scenario == "MASTER_BLOCKED" and item.item_code in {
                "BOM_FROZEN",
                "WASH_STANDARD_APPROVED",
                "LINE_ALLOCATED",
            }:
                status = PCDItemStatus.FAILED
                remarks = "Missing approved technical master"
            item.status = status
            item.remarks = remarks
            item.owner = merchandiser
            item.due_date = order.planned_pcd_date
            item.updated_at = timezone.now()
            item.save(update_fields=["status", "remarks", "owner", "due_date", "updated_at"])
