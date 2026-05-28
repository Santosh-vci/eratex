from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.common.models import ApprovalStatus, RiskStatus
from apps.cutting.services.execution import (
    create_cutting_job_from_release,
    handover_cut_panels_to_sewing,
    record_cutting_output,
    start_cutting_job,
)
from apps.fabric_qc.models import FabricLot, FabricQCInspection, FabricQcStatus, FabricRoll
from apps.master_data.models import Buyer, Customer, Material, ProductType, Vendor
from apps.materials_procurement.models import (
    MaterialPurchaseOrder,
    MaterialPurchaseOrderStatus,
    MaterialRequirement,
    MaterialRequirementStatus,
)
from apps.orders.models import OrderLifecycleEvent, OrderLine, OrderStage, ProductionOrder
from apps.orders.services.lifecycle import initialize_order_lifecycle
from apps.organization.models import Department, Factory, Line, ShiftCalendar, Workcenter
from apps.pcd_readiness.models import PCDItemStatus
from apps.pcd_readiness.services.readiness import (
    approve_conditional_release,
    calculate_pcd_readiness,
    initialize_pcd_readiness,
)
from apps.planning.models import PlannedWorkItem, PlannedWorkItemStatus, PlanVersion
from apps.production_release.models import ProductionRelease, ProductionReleaseStatus
from apps.production_release.services.release import validate_release
from apps.sewing.models import (
    LineRealignmentRequest,
    SewingLineBoardSnapshot,
    SewingOutputEntry,
)
from apps.sewing.services.line_loading import activate_line_loading, load_line
from apps.sewing.services.output import correct_sewing_output, record_sewing_output
from apps.sewing.services.realignment import (
    apply_line_realignment,
    approve_line_realignment,
    request_line_realignment,
)
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
from apps.wip_inventory.models import WipMovement, WipMovementType
from apps.workcenters.models import LineProfile, MachineType


class Command(BaseCommand):
    help = (
        "Seed a busy operational garment-factory state on top of the deterministic "
        "Phase 5 execution seed."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_execution_flow", verbosity=0)

        context = self._context()
        materials = self._seed_operational_masters(context)
        styles = self._seed_operational_styles(context, materials)
        orders = self._seed_operational_orders(context, styles, materials)
        releases = self._seed_operational_plan_and_releases(context, orders)
        self._seed_operational_execution(context, releases)
        self._seed_future_stage_references(context, orders)

        self.stdout.write(
            self.style.SUCCESS(
                "Operational factory seed data loaded: "
                f"{ProductionOrder.objects.count()} orders, "
                f"{ProductionRelease.objects.count()} releases, "
                f"{SewingOutputEntry.objects.count()} sewing output entries."
            )
        )

    def _context(self):
        User = get_user_model()
        factory = Factory.objects.get(code="UNIT-04")
        planning_department = Department.objects.get(factory=factory, code="PLAN")
        sewing_department = Department.objects.get(factory=factory, code="SEW")
        return {
            "today": timezone.localdate(),
            "factory": factory,
            "planning_department": planning_department,
            "sewing_department": sewing_department,
            "planner": User.objects.get(username="planner"),
            "planning_head": User.objects.get(username="planning_head"),
            "procurement_user": User.objects.get(username="procurement_user"),
            "fabric_qc_user": User.objects.get(username="fabric_qc_user"),
            "business_admin": User.objects.get(username="business_admin"),
            "line_supervisor": User.objects.get(username="line_supervisor"),
            "cutting_user": User.objects.get(username="cutting_user"),
            "sewing_mgr": User.objects.get(username="sewing_mgr"),
            "cutting": Workcenter.objects.get(factory=factory, code="CUTTING"),
            "sewing": Workcenter.objects.get(factory=factory, code="SEW-WC"),
            "wash": Workcenter.objects.get(factory=factory, code="WASH-WC"),
            "shift": ShiftCalendar.objects.filter(factory=factory, is_default=True).first(),
        }

    def _seed_operational_masters(self, context):
        customer_rows = [
            ("CUST-E", "European Denim Programs", "HIGH", "BUYER-E1", "EU Core Buyer"),
            ("CUST-F", "Outdoor Workwear Group", "MEDIUM", "BUYER-F1", "Workwear Buyer"),
            ("CUST-G", "Marketplace Private Label", "MEDIUM", "BUYER-G1", "Marketplace Buyer"),
            ("CUST-H", "Premium Chino House", "HIGH", "BUYER-H1", "Premium Buyer"),
        ]
        for code, name, priority, buyer_code, buyer_name in customer_rows:
            customer, _ = Customer.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "priority_level": priority,
                    "default_aql_level": "2.5",
                    "payment_terms": "Net 45",
                    "is_active": True,
                },
            )
            Buyer.objects.update_or_create(
                customer=customer,
                code=buyer_code,
                defaults={"name": buyer_name, "is_active": True},
            )

        vendor_rows = [
            ("VEN-FAB-03", "Stretch Denim Mill 03", Vendor.VendorType.FABRIC, True, 28),
            ("VEN-FAB-04", "Canvas and Twill Mill 04", Vendor.VendorType.FABRIC, True, 32),
            ("VEN-TRIM-02", "Metal Trims Vendor 02", Vendor.VendorType.TRIMS, True, 18),
            ("VEN-LABEL-01", "Label and Ticket Vendor 01", Vendor.VendorType.TRIMS, False, 12),
            ("VEN-CHEM-01", "Laundry Chemical Supplier 01", Vendor.VendorType.SERVICE, True, 14),
        ]
        vendors = {vendor.code: vendor for vendor in Vendor.objects.all()}
        for code, name, vendor_type, nominated, lead_time in vendor_rows:
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

        material_rows = [
            (
                "FAB-DEN-BLK-STRETCH",
                "Black Stretch Denim",
                Material.MaterialType.MAIN_FABRIC,
                "meter",
                "VEN-FAB-03",
                True,
            ),
            (
                "FAB-CARGO-RIPSTOP",
                "Cotton Ripstop Cargo Fabric",
                Material.MaterialType.MAIN_FABRIC,
                "meter",
                "VEN-FAB-04",
                True,
            ),
            (
                "FAB-JOG-FLEECE",
                "Jogger Knit Fleece",
                Material.MaterialType.MAIN_FABRIC,
                "kg",
                "VEN-FAB-04",
                True,
            ),
            (
                "POCKET-COTTON-110",
                "Cotton Pocketing 110 GSM",
                Material.MaterialType.POCKETING,
                "meter",
                "VEN-FAB-04",
                False,
            ),
            (
                "TRIM-METAL-SNAP",
                "Antique Metal Snap",
                Material.MaterialType.BUTTON,
                "pcs",
                "VEN-TRIM-02",
                True,
            ),
            (
                "TRIM-LEATHER-PATCH",
                "Leather Waist Patch",
                Material.MaterialType.PATCH,
                "pcs",
                "VEN-LABEL-01",
                False,
            ),
            (
                "LABEL-BRAND-WOVEN",
                "Woven Brand Label",
                Material.MaterialType.LABEL,
                "pcs",
                "VEN-LABEL-01",
                False,
            ),
            (
                "HANGTAG-SEASONAL",
                "Seasonal Hangtag",
                Material.MaterialType.HANGTAG,
                "pcs",
                "VEN-LABEL-01",
                False,
            ),
            (
                "CHEM-ENZYME-LIQ",
                "Enzyme Chemical Liquid",
                Material.MaterialType.CHEMICAL,
                "liter",
                "VEN-CHEM-01",
                True,
            ),
        ]
        materials = {material.code: material for material in Material.objects.all()}
        for code, name, material_type, uom, vendor_code, nominated_required in material_rows:
            vendor = vendors[vendor_code]
            materials[code], _ = Material.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "material_type": material_type,
                    "uom": uom,
                    "standard_lead_time_days": vendor.standard_lead_time_days,
                    "default_vendor": vendor,
                    "nominated_vendor_required": nominated_required,
                    "inspection_required": material_type == Material.MaterialType.MAIN_FABRIC,
                    "is_active": True,
                },
            )
        self._seed_operational_operations()
        return materials

    def _seed_operational_operations(self):
        machine_types = {item.code: item for item in MachineType.objects.all()}
        operation_rows = [
            ("OP-CARGO-POCKET", "Cargo pocket attach", "CARGO_DETAIL", "LOCKSTITCH", "HIGH"),
            ("OP-ELASTIC-WAIST", "Elastic waistband tunnel", "WAISTBAND", "WAISTBAND", "MEDIUM"),
            ("OP-DRAWCORD", "Drawcord insert", "WAISTBAND", "LOCKSTITCH", "MEDIUM"),
        ]
        for code, name, group, machine_type_code, skill in operation_rows:
            OperationMaster.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "operation_group": group,
                    "default_machine_type": machine_types[machine_type_code],
                    "default_skill_level": skill,
                    "is_active": True,
                },
            )

    def _seed_operational_styles(self, context, materials):
        product_types = {item.code: item for item in ProductType.objects.all()}
        customers = {item.code: item for item in Customer.objects.prefetch_related("buyers")}
        buyers = {item.code: item for item in Buyer.objects.select_related("customer")}
        wash_routes = self._seed_operational_wash_routes(context, product_types)
        styles = {}
        rows = [
            (
                "STY-DEN-BLK-SKINNY",
                "CUST-E",
                "BUYER-E1",
                "DENIM_BOTTOM",
                "Black skinny stretch denim",
                "WASH-ENZYME",
                "FAB-DEN-BLK-STRETCH",
                "HIGH",
            ),
            (
                "STY-CARGO-TAPER",
                "CUST-F",
                "BUYER-F1",
                "CARGO",
                "Tapered ripstop cargo",
                "WASH-CARGO-RINSE",
                "FAB-CARGO-RIPSTOP",
                "HIGH",
            ),
            (
                "STY-JOG-FLEECE",
                "CUST-G",
                "BUYER-G1",
                "JOGGER",
                "Fleece jogger",
                "WASH-JOG-SOFT",
                "FAB-JOG-FLEECE",
                "MEDIUM",
            ),
            (
                "STY-CHINO-PREMIUM",
                "CUST-H",
                "BUYER-H1",
                "CHINO",
                "Premium garment-dyed chino",
                "WASH-CHINO",
                "FAB-CHINO-TWL",
                "MEDIUM",
            ),
            (
                "STY-DEN-ECO-WASH",
                "CUST-E",
                "BUYER-E1",
                "DENIM_BOTTOM",
                "Eco enzyme denim",
                "WASH-ECO-ENZYME",
                "FAB-DEN-12OZ",
                "VERY_HIGH",
            ),
        ]
        for (
            style_code,
            customer_code,
            buyer_code,
            product_code,
            description,
            route_code,
            fabric_code,
            complexity,
        ) in rows:
            style, _ = Style.objects.update_or_create(
                style_code=style_code,
                defaults={
                    "customer": customers[customer_code],
                    "buyer": buyers[buyer_code],
                    "product_type": product_types[product_code],
                    "description": description,
                    "fit_type": "Regular",
                    "fabric_category": "Denim" if "DEN" in style_code else "Twill",
                    "wash_complexity": complexity,
                    "sewing_complexity": complexity,
                    "overall_complexity": complexity,
                    "status": ApprovalStatus.APPROVED,
                    "season": "CORE-2026",
                    "reference_sample_no": f"SMP-{style_code}",
                    "default_wash_route": wash_routes[route_code],
                    "is_active": True,
                },
            )
            self._seed_bom(context, style, materials, fabric_code)
            self._seed_bulletin(context, style)
            styles[style_code] = style
        for style in Style.objects.filter(
            style_code__in=[
                "STY-DEN-BASIC",
                "STY-DEN-HEAVY",
                "STY-DEN-FASHION",
                "STY-CHINO-BASIC",
                "STY-DEN-RUSH",
                *styles.keys(),
            ]
        ):
            styles[style.style_code] = style
        return styles

    def _seed_operational_wash_routes(self, context, product_types):
        machine_types = {item.code: item for item in MachineType.objects.all()}
        route_rows = [
            (
                "WASH-CARGO-RINSE",
                "Cargo rinse wash",
                "CARGO",
                "MEDIUM",
                ["Garment rinse", "Softener", "Drying", "QC"],
            ),
            (
                "WASH-JOG-SOFT",
                "Jogger soft wash",
                "JOGGER",
                "LOW",
                ["Soft wash", "Drying", "QC"],
            ),
            (
                "WASH-ECO-ENZYME",
                "Eco enzyme wash",
                "DENIM_BOTTOM",
                "HIGH",
                ["Enzyme", "Ozone", "Drying", "QC"],
            ),
        ]
        routes = {item.code: item for item in WashRoute.objects.all()}
        for code, name, product_code, complexity, steps in route_rows:
            route, _ = WashRoute.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "product_type": product_types[product_code],
                    "complexity": complexity,
                    "status": ApprovalStatus.APPROVED,
                    "approved_by": context["business_admin"],
                    "approved_at": timezone.now(),
                    "effective_date": context["today"],
                    "wash_complexity_class": complexity,
                    "approved_wash_standard_reference": f"STD-{code}",
                    "customer_effect_approval_status": "APPROVED",
                    "is_active": True,
                },
            )
            for index, step in enumerate(steps, start=1):
                WashRouteStep.objects.update_or_create(
                    route=route,
                    sequence_no=index * 10,
                    defaults={
                        "name": step,
                        "workcenter": context["wash"],
                        "machine_type": machine_types["DRYER"]
                        if step == "Drying"
                        else machine_types["WASHER"],
                        "standard_minutes": 35 if step != "QC" else 20,
                        "qc_step": step == "QC",
                        "required": True,
                        "is_active": True,
                    },
                )
            routes[code] = route
        return routes

    def _seed_bom(self, context, style, materials, fabric_code):
        bom, _ = BOMHeader.objects.update_or_create(
            style=style,
            version="v1",
            defaults={
                "status": ApprovalStatus.APPROVED,
                "approved_by": context["business_admin"],
                "approved_at": timezone.now(),
                "effective_date": context["today"],
                "remarks": "Operational seed approved BOM.",
                "is_active": True,
            },
        )
        rows = [
            (materials[fabric_code], Decimal("1.4200"), Decimal("3.00"), "CUTTING"),
            (materials["POCKET-COTTON-110"], Decimal("0.2400"), Decimal("2.00"), "SEWING"),
            (materials["TRIM-BUTTON-STD"], Decimal("1.0000"), Decimal("1.00"), "SEWING"),
            (materials["TRIM-ZIP-STD"], Decimal("1.0000"), Decimal("1.00"), "SEWING"),
            (materials["TRIM-LEATHER-PATCH"], Decimal("1.0000"), Decimal("0.00"), "FINISHING"),
            (materials["LABEL-BRAND-WOVEN"], Decimal("2.0000"), Decimal("0.00"), "PACKING"),
            (materials["HANGTAG-SEASONAL"], Decimal("1.0000"), Decimal("0.00"), "PACKING"),
            (materials["CHEM-ENZYME-LIQ"], Decimal("0.0120"), Decimal("0.00"), "WASH"),
        ]
        for material, consumption, wastage, stage in rows:
            BOMLine.objects.update_or_create(
                bom=bom,
                material=material,
                defaults={
                    "consumption_per_piece": consumption,
                    "wastage_percent": wastage,
                    "uom": material.uom,
                    "required_stage": stage,
                    "nominated_vendor_required": material.nominated_vendor_required,
                    "remarks": "Operational seed consumption.",
                    "is_active": True,
                },
            )

    def _seed_bulletin(self, context, style):
        operations = {item.code: item for item in OperationMaster.objects.all()}
        bulletin, _ = OperationBulletin.objects.update_or_create(
            style=style,
            version="v1",
            defaults={
                "status": ApprovalStatus.APPROVED,
                "approved_by": context["business_admin"],
                "approved_at": timezone.now(),
                "effective_date": context["today"],
                "remarks": "Operational seed approved operation bulletin.",
                "is_active": True,
            },
        )
        line_specs = [
            ("OP-FRONT-POCKET", 10, Decimal("0.900"), False),
            ("OP-FLY-JOIN", 20, Decimal("1.150"), True),
            ("OP-WAISTBAND", 30, Decimal("1.300"), True),
            ("OP-CARGO-POCKET", 40, Decimal("1.050"), "CARGO" in style.style_code),
            ("OP-ELASTIC-WAIST", 50, Decimal("0.780"), "JOG" in style.style_code),
            ("OP-BARTACK", 60, Decimal("0.700"), True),
            ("OP-HEM", 70, Decimal("0.760"), False),
            ("OP-END-QC", 80, Decimal("0.520"), True),
        ]
        total_smv = Decimal("0.000")
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
                    "machine_type": operation.default_machine_type,
                    "skill_level": operation.default_skill_level,
                    "smv": smv,
                    "target_pph": Decimal("60.00") / smv,
                    "qc_checkpoint": operation_code == "OP-END-QC",
                    "critical_operation": bool(critical),
                    "parallel_allowed": False,
                    "rework_sensitive": bool(critical),
                    "is_active": True,
                },
            )
        bulletin.total_smv = total_smv
        bulletin.save(update_fields=["total_smv", "updated_at"])

    def _seed_operational_orders(self, context, styles, materials):
        today = context["today"]
        style_cycle = [
            "STY-DEN-BASIC",
            "STY-DEN-HEAVY",
            "STY-DEN-FASHION",
            "STY-CHINO-BASIC",
            "STY-DEN-RUSH",
            "STY-DEN-BLK-SKINNY",
            "STY-CARGO-TAPER",
            "STY-JOG-FLEECE",
            "STY-CHINO-PREMIUM",
            "STY-DEN-ECO-WASH",
        ]
        scenario_cycle = [
            "READY",
            "READY",
            "CONDITIONAL",
            "BLOCKED_TRIMS",
            "FABRIC_HOLD",
            "MATERIAL_DELAY",
            "READY",
            "READY",
            "CONDITIONAL",
            "READY",
        ]
        orders = []
        for index in range(1, 37):
            style = styles[style_cycle[(index - 1) % len(style_cycle)]]
            scenario = scenario_cycle[(index - 1) % len(scenario_cycle)]
            pcd_offset = 2 + (index % 10)
            if scenario in {"BLOCKED_TRIMS", "FABRIC_HOLD"}:
                pcd_offset = index % 3
            order = self._upsert_order(
                context=context,
                style=style,
                order_no=f"OPS-ORD-{index:03d}",
                po_number=f"OPS-PO-{88000 + index}",
                quantity=4200 + (index * 375),
                planned_pcd_date=today + timedelta(days=pcd_offset),
                committed_ship_date=today + timedelta(days=22 + (index % 18)),
                scenario=scenario,
            )
            orders.append(order)
        return orders

    def _upsert_order(
        self,
        *,
        context,
        style,
        order_no,
        po_number,
        quantity,
        planned_pcd_date,
        committed_ship_date,
        scenario,
    ):
        order, _ = ProductionOrder.objects.update_or_create(
            order_no=order_no,
            defaults={
                "po_number": po_number,
                "customer": style.customer,
                "buyer": style.buyer,
                "style": style,
                "factory": context["factory"],
                "product_type": style.product_type,
                "order_qty": quantity,
                "planned_pcd_date": planned_pcd_date,
                "planned_ship_date": committed_ship_date,
                "committed_ship_date": committed_ship_date,
                "owner": context["planner"],
                "order_status": "ACTIVE",
                "is_active": True,
            },
        )
        initialize_order_lifecycle(order, performed_by=context["planner"])
        initialize_pcd_readiness(order, performed_by=context["planner"])
        self._seed_order_lines(order)
        self._seed_order_materials(context, order, scenario)
        self._seed_order_fabric(context, order, scenario)
        self._seed_order_pcd(context, order, scenario)
        return order

    def _seed_order_lines(self, order):
        color = "BLACK" if "BLK" in order.style.style_code else "INDIGO"
        if order.product_type.code == "CHINO":
            color = "KHAKI"
        if order.product_type.code == "CARGO":
            color = "OLIVE"
        if order.product_type.code == "JOGGER":
            color = "CHARCOAL"
        for size, ratio in [("30", 1), ("32", 3), ("34", 3), ("36", 2), ("38", 1)]:
            OrderLine.objects.update_or_create(
                order=order,
                size=size,
                color=color,
                defaults={"quantity": int(order.order_qty * ratio / 10), "is_active": True},
            )

    def _seed_order_materials(self, context, order, scenario):
        bom = BOMHeader.objects.filter(style=order.style, status=ApprovalStatus.APPROVED).first()
        if not bom:
            return
        for line in bom.lines.select_related("material", "material__default_vendor"):
            required_qty = Decimal(order.order_qty) * line.consumption_per_piece
            shortage = Decimal("0.000")
            requirement_status = MaterialRequirementStatus.READY
            po_status = MaterialPurchaseOrderStatus.RECEIVED
            expected = order.planned_pcd_date - timedelta(days=2)
            revised = None
            actual = expected
            if scenario == "BLOCKED_TRIMS" and line.material.material_type in {
                Material.MaterialType.BUTTON,
                Material.MaterialType.ZIPPER,
                Material.MaterialType.LABEL,
                Material.MaterialType.HANGTAG,
            }:
                shortage = Decimal("180.000")
                requirement_status = MaterialRequirementStatus.SHORT
                po_status = MaterialPurchaseOrderStatus.ACKNOWLEDGED
                actual = None
            if scenario == "MATERIAL_DELAY" and line.material.material_type in {
                Material.MaterialType.MAIN_FABRIC,
                Material.MaterialType.CHEMICAL,
            }:
                shortage = Decimal("320.000")
                requirement_status = MaterialRequirementStatus.DELAYED
                po_status = MaterialPurchaseOrderStatus.DELAYED
                revised = order.planned_pcd_date + timedelta(days=4)
                actual = None
            requirement, _ = MaterialRequirement.objects.update_or_create(
                order=order,
                material=line.material,
                required_stage=line.required_stage,
                defaults={
                    "required_qty": required_qty,
                    "required_date": order.planned_pcd_date,
                    "status": requirement_status,
                    "shortage_qty": shortage,
                    "owner": context["procurement_user"],
                    "is_active": True,
                },
            )
            MaterialPurchaseOrder.objects.update_or_create(
                po_no=f"OPS-MPO-{order.order_no}-{line.material.code}",
                defaults={
                    "vendor": line.material.default_vendor or Vendor.objects.first(),
                    "order": order,
                    "material": line.material,
                    "ordered_qty": required_qty,
                    "acknowledged_qty": required_qty - shortage,
                    "expected_arrival_date": expected,
                    "revised_eta": revised,
                    "actual_arrival_date": actual,
                    "status": po_status,
                    "is_active": True,
                },
            )
            if requirement.status == MaterialRequirementStatus.READY:
                requirement.shortage_qty = Decimal("0.000")
                requirement.save(update_fields=["shortage_qty", "updated_at"])

    def _seed_order_fabric(self, context, order, scenario):
        lot, _ = FabricLot.objects.update_or_create(
            order=order,
            lot_no=f"OPS-LOT-{order.order_no}",
            defaults={
                "shade_lot": "SHADE-B" if "BLACK" in order.lines.first().color else "SHADE-A",
                "received_qty": Decimal(order.order_qty) * Decimal("1.42"),
                "received_date": order.planned_pcd_date - timedelta(days=3),
                "status": "RECEIVED",
                "is_active": True,
            },
        )
        for roll_index in range(1, 7):
            qc_status = FabricQcStatus.PASSED
            score = Decimal("16.00")
            remarks = "Operational seed passed inspection."
            if scenario == "FABRIC_HOLD" and roll_index in {5, 6}:
                qc_status = FabricQcStatus.HOLD if roll_index == 5 else FabricQcStatus.FAILED
                score = Decimal("48.00")
                remarks = "Operational seed fabric blocker."
            roll, _ = FabricRoll.objects.update_or_create(
                fabric_lot=lot,
                roll_no=f"R{roll_index:03d}",
                defaults={
                    "roll_length": Decimal("110.000"),
                    "width": Decimal("44.00"),
                    "gsm": Decimal("315.00"),
                    "shade": lot.shade_lot,
                    "qc_status": qc_status,
                    "is_active": True,
                },
            )
            FabricQCInspection.objects.update_or_create(
                fabric_roll=roll,
                inspection_date=order.planned_pcd_date - timedelta(days=2),
                defaults={
                    "four_point_score": score,
                    "width_result": Decimal("44.00"),
                    "gsm_result": Decimal("315.00"),
                    "shrinkage_percent": Decimal("3.20"),
                    "status": qc_status,
                    "inspected_by": context["fabric_qc_user"],
                    "remarks": remarks,
                    "is_active": True,
                },
            )

    def _seed_order_pcd(self, context, order, scenario):
        readiness = order.pcd_readiness
        for item in readiness.items.all():
            status = PCDItemStatus.PASSED
            remarks = "Operational seed passed."
            if scenario == "BLOCKED_TRIMS" and item.item_code == "TRIMS_AVAILABLE":
                status = PCDItemStatus.PENDING
                remarks = "Trims shortage blocks PCD."
            if scenario == "FABRIC_HOLD" and item.item_code in {
                "FABRIC_QC_PASSED",
                "SHADE_LOTS_MAPPED",
            }:
                status = PCDItemStatus.FAILED
                remarks = "Fabric QC hold/failure blocks PCD."
            if scenario == "MATERIAL_DELAY" and item.item_code in {
                "FABRIC_RECEIVED",
                "WASH_CAPACITY_BOOKED",
            }:
                status = PCDItemStatus.PENDING
                remarks = "Material ETA is after PCD."
            if scenario == "CONDITIONAL" and item.item_code == "TRIMS_AVAILABLE":
                status = PCDItemStatus.PENDING
                remarks = "Approved for cutting only; trims due before sewing."
            item.status = status
            item.remarks = remarks
            item.owner = context["planner"]
            item.due_date = order.planned_pcd_date
            item.save(update_fields=["status", "remarks", "owner", "due_date", "updated_at"])
        calculate_pcd_readiness(readiness)
        readiness.refresh_from_db()
        if scenario == "CONDITIONAL":
            approve_conditional_release(
                readiness,
                approved_by=context["planning_head"],
                reason="Operational seed: cut panels can start while trims arrive before sewing.",
                expiry_date=context["today"] + timedelta(days=6),
                risk_note="Cutting only; sewing load checks remain controlled.",
            )

    def _seed_operational_plan_and_releases(self, context, orders):
        plan = (
            PlanVersion.objects.filter(horizon__is_current=True, status="DRAFT", is_active=True)
            .select_related("horizon")
            .order_by("-version_no")
            .first()
        )
        if not plan:
            plan = (
                PlanVersion.objects.filter(horizon__is_current=True)
                .order_by("-version_no")
                .first()
            )
        start = plan.horizon.start_date
        ready_orders = [
            order
            for order in orders
            if order.pcd_readiness.readiness_status in {"READY", "CONDITIONALLY_READY"}
        ]
        workcenters = [context["cutting"], context["sewing"], context["wash"]]
        work_items = []
        for index, order in enumerate(ready_orders[:24], start=1):
            workcenter = workcenters[(index - 1) % len(workcenters)]
            plan_day_offset = ((index - 1) // len(workcenters)) % 6
            status = PlannedWorkItemStatus.RELEASE_READY
            risk = RiskStatus.WATCH if index in {7, 14, 21} else RiskStatus.ON_TRACK
            item, _ = PlannedWorkItem.objects.update_or_create(
                plan_version=plan,
                order=order,
                workcenter=workcenter,
                defaults={
                    "planned_start_date": start + timedelta(days=plan_day_offset),
                    "planned_end_date": start + timedelta(days=plan_day_offset + 1),
                    "planned_shift": "DAY",
                    "planning_zone": "FIRM_ZONE" if index <= 12 else "FLEXIBLE_ZONE",
                    "production_stage": workcenter.workcenter_type,
                    "color_code": order.lines.order_by("color").first().color,
                    "shade_lot": "SHADE-A",
                    "planned_quantity": min(order.order_qty, 1800 + index * 80),
                    "load_minutes": (1800 + index * 80) * 5,
                    "sequence_no": index * 10,
                    "status": status,
                    "risk_status": risk,
                    "locked": False,
                    "notes": "Operational seed active planning board item.",
                    "is_active": True,
                },
            )
            work_items.append(item)
        plan.work_items.filter(
            is_active=True,
            notes="Operational seed active planning board item.",
        ).exclude(id__in=[item.id for item in work_items]).update(is_active=False)
        plan.work_items.filter(
            is_active=True,
            risk_status__in=[RiskStatus.ACTION, RiskStatus.CRITICAL],
        ).update(
            status=PlannedWorkItemStatus.RELEASE_READY,
            risk_status=RiskStatus.WATCH,
            updated_by=context["planner"],
        )
        release_statuses = [
            ProductionReleaseStatus.READY,
            ProductionReleaseStatus.RELEASED,
            ProductionReleaseStatus.COMPLETED,
            ProductionReleaseStatus.OVERRIDE_REQUESTED,
            ProductionReleaseStatus.OVERRIDE_APPROVED,
            ProductionReleaseStatus.BLOCKED,
        ]
        releases = []
        for index, item in enumerate(
            [item for item in work_items if item.workcenter_id == context["cutting"].id][:12],
            start=1,
        ):
            status = release_statuses[(index - 1) % len(release_statuses)]
            release, _ = ProductionRelease.objects.update_or_create(
                release_no=f"OPS-REL-{item.order.order_no}-{item.planned_start_date:%Y%m%d}",
                defaults={
                    "planned_work_item": item,
                    "order": item.order,
                    "workcenter": item.workcenter,
                    "release_date": item.planned_start_date,
                    "release_type": "CUTTING",
                    "status": status,
                    "risk_status": RiskStatus.ACTION
                    if status
                    in {ProductionReleaseStatus.BLOCKED, ProductionReleaseStatus.OVERRIDE_REQUESTED}
                    else RiskStatus.ON_TRACK,
                    "released_by": context["planner"],
                    "override_requested_by": context["planner"]
                    if status == ProductionReleaseStatus.OVERRIDE_REQUESTED
                    else None,
                    "override_approved_by": context["planning_head"]
                    if status == ProductionReleaseStatus.OVERRIDE_APPROVED
                    else None,
                    "override_reason": "Operational seed release governance scenario."
                    if status
                    in {
                        ProductionReleaseStatus.OVERRIDE_REQUESTED,
                        ProductionReleaseStatus.OVERRIDE_APPROVED,
                    }
                    else "",
                    "created_by": context["planner"],
                    "updated_by": context["planner"],
                    "is_active": True,
                },
            )
            try:
                validate_release(release=release, checked_by=context["planner"])
            except Exception:
                pass
            releases.append(release)
        return releases

    def _seed_operational_execution(self, context, releases):
        runnable = [
            release
            for release in releases
            if release.status
            in {
                ProductionReleaseStatus.READY,
                ProductionReleaseStatus.RELEASED,
                ProductionReleaseStatus.COMPLETED,
            }
        ]
        job_modes = [
            "RELEASED",
            "IN_PROGRESS",
            "HANDED_OVER",
            "SEWING_ACTIVE",
            "SEWING_ACTIVE",
        ]
        for index, release in enumerate(runnable[:8], start=1):
            job = create_cutting_job_from_release(release, created_by=context["cutting_user"])
            mode = job_modes[(index - 1) % len(job_modes)]
            if (
                mode in {"IN_PROGRESS", "COMPLETED", "HANDED_OVER", "SEWING_ACTIVE"}
                and job.status in {"RELEASED", "IN_PROGRESS"}
            ):
                start_cutting_job(job, started_by=context["cutting_user"])
            cutting_entry = None
            if mode in {"COMPLETED", "HANDED_OVER", "SEWING_ACTIVE"}:
                cutting_entry = record_cutting_output(
                    cutting_job=job,
                    client_event_id=f"OPS-CUT-{release.release_no}",
                    output_qty=min(job.planned_quantity, 520 + index * 35),
                    defect_qty=4 + index,
                    rework_qty=3 + index,
                    remarks="Operational seed cutting output.",
                    recorded_by=context["cutting_user"],
                )
            if mode in {"HANDED_OVER", "SEWING_ACTIVE"} and cutting_entry:
                loading = self._seed_line_loading_for_release(
                    context,
                    release,
                    index,
                    cutting_entry,
                )
                if not WipMovement.objects.filter(
                    order=release.order,
                    movement_type=WipMovementType.HANDOVER_TO_SEWING,
                    target_lot__sewing_loading=loading,
                ).exists():
                    handover_cut_panels_to_sewing(
                        cutting_job=job,
                        quantity=cutting_entry.net_cut_qty,
                        sewing_loading=loading,
                        sender=context["cutting_user"],
                        receiver=context["line_supervisor"],
                        remarks="Operational seed cutting-to-sewing handover.",
                    )
                if mode == "SEWING_ACTIVE":
                    self._seed_sewing_output_for_loading(context, loading, index)
                    self._seed_realignment_for_loading(context, loading)

    def _seed_line_loading_for_release(self, context, release, index, cutting_entry):
        line_number = 17 + index
        line = self._upsert_line(context, line_number)
        bulletin = OperationBulletin.objects.filter(
            style=release.order.style,
            status=ApprovalStatus.APPROVED,
            is_active=True,
        ).first()
        loading = load_line(
            release=release,
            line=line,
            bulletin=bulletin,
            planned_quantity=cutting_entry.net_cut_qty,
            loaded_by=context["line_supervisor"],
        )
        activate_line_loading(loading, activated_by=context["line_supervisor"])
        target = 950 + index * 90
        loading.target_output_per_day = target
        loading.risk_status = RiskStatus.WATCH if index % 2 else RiskStatus.ON_TRACK
        loading.save(update_fields=["target_output_per_day", "risk_status", "updated_at"])
        self._seed_line_board_snapshot(loading, line_number, index)
        return loading

    def _upsert_line(self, context, line_number):
        line, _ = Line.objects.update_or_create(
            factory=context["factory"],
            code=f"LINE-{line_number:02d}",
            defaults={
                "department": context["sewing_department"],
                "workcenter": context["sewing"],
                "name": f"Sewing Line {line_number:02d}",
                "line_type": "DENIM" if line_number % 3 else "MIXED",
                "is_active": True,
            },
        )
        LineProfile.objects.update_or_create(
            line=line,
            defaults={
                "supervisor": context["line_supervisor"],
                "standard_manpower": 30 + (line_number % 8),
                "current_manpower": 28 + (line_number % 7),
                "shift_calendar": context["shift"],
                "baseline_efficiency": Decimal(str(62 + (line_number % 16))),
                "net_good_output_baseline": 1000 + line_number * 20,
                "special_capability": "Operational seed mixed capability",
                "is_active": True,
            },
        )
        return line

    def _seed_line_board_snapshot(self, loading, line_number, index):
        target = loading.target_output_per_day
        status = "RUNNING"
        if index % 5 == 0:
            status = "DOWN"
        elif index % 3 == 0:
            status = "CHANGEOVER"
        actual = int(target * (Decimal("0.52") if status == "DOWN" else Decimal("0.72")))
        defect_percent = Decimal("4.60") if status == "DOWN" else Decimal("1.80")
        net_good = max(actual - int(actual * defect_percent / Decimal("100.00")), 0)
        SewingLineBoardSnapshot.objects.update_or_create(
            line_loading=loading,
            defaults={
                "board_sequence": line_number,
                "production_po_no": loading.order.po_number,
                "production_style_code": loading.order.style.style_code,
                "style_smv": loading.bulletin.total_smv,
                "display_status": status,
                "actual_output": actual,
                "net_good_output": net_good,
                "defect_percent": defect_percent,
                "planned_manpower": loading.line.profile.standard_manpower,
                "actual_manpower": loading.line.profile.current_manpower,
                "bottleneck_operation_name": "Waistband Attach"
                if index % 2
                else "Bartack Reinforcement",
                "bottleneck_smv": Decimal("1.30"),
                "bottleneck_station": f"#{10 + index}",
                "wip_accumulation": max(target - actual, 0),
                "hourly_output_json": self._hourly_rows(target, status),
                "operator_allocation_json": [
                    {
                        "code": f"L{line_number}",
                        "name": f"Line {line_number} Lead",
                        "role": "Lead Sewer",
                        "status": "PRESENT",
                    },
                    {
                        "code": f"F{index}",
                        "name": f"Floater {index}",
                        "role": "Relief Operator",
                        "status": "ABSENT" if status == "DOWN" else "PRESENT",
                    },
                ],
                "absence_impact": "One absent floater creates shortfall risk."
                if status == "DOWN"
                else "No critical absenteeism impact recorded.",
                "recovery_action_text": "Approve floater reassignment before next hourly review."
                if status == "DOWN"
                else "Hold allocation and keep monitoring hourly net-good output.",
                "is_active": True,
            },
        )

    def _hourly_rows(self, target, status):
        factors = {
            "DOWN": [0.42, 0.36, 0.41, 0.35, 0.30],
            "CHANGEOVER": [0.58, 0.62, 0.66, 0.70, 0.74],
            "RUNNING": [0.72, 0.76, 0.78, 0.75, 0.74],
        }[status]
        bucket = max(round(target / 8), 1)
        return [
            {"time": label, "target": bucket, "actual": round(bucket * factors[offset])}
            for offset, label in enumerate(["08:00", "09:00", "10:00", "11:00", "12:00"])
        ]

    def _seed_sewing_output_for_loading(self, context, loading, index):
        output = record_sewing_output(
            line_loading=loading,
            client_event_id=f"OPS-SEW-{loading.loading_no}-H1",
            time_slot="11:00-12:00",
            gross_qty=130 + index * 8,
            defect_qty=5 + (index % 3),
            rework_qty=4 + (index % 2),
            remarks="Operational seed sewing output.",
            recorded_by=context["line_supervisor"],
        )
        if not output.corrections.exists():
            correct_sewing_output(
                output_entry=output,
                gross_qty=output.gross_qty + 3,
                defect_qty=output.defect_qty,
                rework_qty=output.rework_qty,
                reason="Operational seed correction proof.",
                corrected_by=context["line_supervisor"],
            )

    def _seed_realignment_for_loading(self, context, loading):
        if LineRealignmentRequest.objects.filter(line_loading=loading).exists():
            return
        realignment = request_line_realignment(
            line=loading.line,
            bulletin=loading.bulletin,
            target_output=loading.target_output_per_day,
            line_loading=loading,
            requested_by=context["line_supervisor"],
        )
        approve_line_realignment(realignment, approved_by=context["sewing_mgr"])
        apply_line_realignment(realignment, applied_by=context["sewing_mgr"])

    def _seed_future_stage_references(self, context, orders):
        stage_rows = [
            (OrderStage.WASHING, RiskStatus.WATCH),
            (OrderStage.FINISHING, RiskStatus.ON_TRACK),
            (OrderStage.PACKING, RiskStatus.ON_TRACK),
            (OrderStage.SHIPMENT_READY, RiskStatus.WATCH),
        ]
        for index, (stage, risk) in enumerate(stage_rows, start=1):
            order = orders[-index]
            OrderLifecycleEvent.objects.update_or_create(
                order=order,
                event_code=f"operational_seed.{stage.lower()}",
                defaults={
                    "from_stage": order.current_stage,
                    "to_stage": stage,
                    "message": (
                        "Future-phase lifecycle reference only; no wash, packing, "
                        "or shipment execution records are created in Phase 5."
                    ),
                    "metadata": {"scope": "lifecycle_reference"},
                    "performed_by": context["planner"],
                    "is_active": True,
                },
            )
            order.current_stage = stage
            order.lifecycle_status = stage
            order.risk_status = risk
            order.save(
                update_fields=[
                    "current_stage",
                    "lifecycle_status",
                    "risk_status",
                    "updated_at",
                ]
            )
