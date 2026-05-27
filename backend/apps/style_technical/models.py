from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.common.models import ApprovalStatus, BaseModel


class ComplexityLevel(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    VERY_HIGH = "VERY_HIGH", "Very high"


class StyleComplexity(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    rating = models.CharField(max_length=32, choices=ComplexityLevel.choices)
    buffer_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class Style(BaseModel):
    style_code = models.CharField(max_length=120, unique=True)
    customer = models.ForeignKey(
        "master_data.Customer", on_delete=models.PROTECT, related_name="styles"
    )
    buyer = models.ForeignKey(
        "master_data.Buyer",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="styles",
    )
    product_type = models.ForeignKey(
        "master_data.ProductType",
        on_delete=models.PROTECT,
        related_name="styles",
    )
    description = models.CharField(max_length=240)
    fit_type = models.CharField(max_length=80, blank=True)
    fabric_category = models.CharField(max_length=80, blank=True)
    wash_complexity = models.CharField(
        max_length=32,
        choices=ComplexityLevel.choices,
        default=ComplexityLevel.MEDIUM,
    )
    sewing_complexity = models.CharField(
        max_length=32,
        choices=ComplexityLevel.choices,
        default=ComplexityLevel.MEDIUM,
    )
    overall_complexity = models.CharField(
        max_length=32,
        choices=ComplexityLevel.choices,
        default=ComplexityLevel.MEDIUM,
    )
    status = models.CharField(
        max_length=32,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
    )
    season = models.CharField(max_length=64, blank=True)
    reference_sample_no = models.CharField(max_length=80, blank=True)
    default_wash_route = models.ForeignKey(
        "style_technical.WashRoute",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="default_styles",
    )
    wash_complexity_class = models.CharField(max_length=32, blank=True)
    fashion_effect_required = models.BooleanField(default=False)
    approved_wash_standard_reference = models.CharField(max_length=160, blank=True)
    dry_process_required = models.BooleanField(default=False)
    wet_process_required = models.BooleanField(default=True)
    repeat_cycle_allowed = models.BooleanField(default=True)
    repeat_cycle_probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    max_repeat_cycles = models.PositiveIntegerField(default=1)
    post_wash_qc_criteria = models.JSONField(default=dict, blank=True)
    shade_effect_tolerance = models.CharField(max_length=120, blank=True)
    customer_effect_approval_status = models.CharField(max_length=32, default="PENDING")

    class Meta:
        ordering = ["style_code"]

    def __str__(self) -> str:
        return self.style_code


class BOMHeader(BaseModel):
    style = models.ForeignKey(Style, on_delete=models.PROTECT, related_name="boms")
    version = models.CharField(max_length=32)
    status = models.CharField(
        max_length=32,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_boms",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["style__style_code", "version"]
        constraints = [
            models.UniqueConstraint(fields=["style", "version"], name="unique_bom_style_version")
        ]

    def __str__(self) -> str:
        return f"{self.style.style_code}:{self.version}"


class BOMLine(BaseModel):
    bom = models.ForeignKey(BOMHeader, on_delete=models.CASCADE, related_name="lines")
    material = models.ForeignKey(
        "master_data.Material",
        on_delete=models.PROTECT,
        related_name="bom_lines",
    )
    consumption_per_piece = models.DecimalField(max_digits=12, decimal_places=4)
    wastage_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    uom = models.CharField(max_length=32)
    required_stage = models.CharField(max_length=64)
    nominated_vendor_required = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["bom__style__style_code", "material__code"]
        constraints = [
            models.UniqueConstraint(fields=["bom", "material"], name="unique_bom_line_material")
        ]

    def __str__(self) -> str:
        return f"{self.bom}:{self.material.code}"


class OperationMaster(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=180)
    operation_group = models.CharField(max_length=80)
    default_machine_type = models.ForeignKey(
        "workcenters.MachineType",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="default_operations",
    )
    default_skill_level = models.CharField(max_length=32, default="MEDIUM")

    class Meta:
        ordering = ["operation_group", "code"]

    def __str__(self) -> str:
        return self.code


class OperationBulletin(BaseModel):
    style = models.ForeignKey(Style, on_delete=models.PROTECT, related_name="operation_bulletins")
    version = models.CharField(max_length=32)
    status = models.CharField(
        max_length=32,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
    )
    total_smv = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    effective_date = models.DateField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_operation_bulletins",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["style__style_code", "version"]
        constraints = [
            models.UniqueConstraint(
                fields=["style", "version"],
                name="unique_operation_bulletin_style_version",
            )
        ]

    def __str__(self) -> str:
        return f"{self.style.style_code}:{self.version}"


class OperationBulletinLine(BaseModel):
    bulletin = models.ForeignKey(OperationBulletin, on_delete=models.CASCADE, related_name="lines")
    sequence_no = models.PositiveIntegerField()
    operation = models.ForeignKey(
        OperationMaster, on_delete=models.PROTECT, related_name="bulletin_lines"
    )
    operation_name = models.CharField(max_length=180)
    operation_group = models.CharField(max_length=80)
    machine_type = models.ForeignKey(
        "workcenters.MachineType",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="bulletin_lines",
    )
    attachment_required = models.CharField(max_length=120, blank=True)
    skill_level = models.CharField(max_length=32, default="MEDIUM")
    smv = models.DecimalField(max_digits=8, decimal_places=3)
    target_pph = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    qc_checkpoint = models.BooleanField(default=False)
    critical_operation = models.BooleanField(default=False)
    predecessor = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="successors",
    )
    parallel_allowed = models.BooleanField(default=False)
    rework_sensitive = models.BooleanField(default=False)

    class Meta:
        ordering = ["bulletin__style__style_code", "sequence_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["bulletin", "sequence_no"],
                name="unique_bulletin_sequence",
            )
        ]

    def __str__(self) -> str:
        return f"{self.bulletin}:{self.sequence_no}"


class WashRoute(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=180)
    product_type = models.ForeignKey(
        "master_data.ProductType",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="wash_routes",
    )
    complexity = models.CharField(
        max_length=32,
        choices=ComplexityLevel.choices,
        default=ComplexityLevel.MEDIUM,
    )
    status = models.CharField(
        max_length=32,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_wash_routes",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    wash_complexity_class = models.CharField(max_length=32, blank=True)
    fashion_effect_required = models.BooleanField(default=False)
    approved_wash_standard_reference = models.CharField(max_length=160, blank=True)
    dry_process_required = models.BooleanField(default=False)
    wet_process_required = models.BooleanField(default=True)
    repeat_cycle_allowed = models.BooleanField(default=True)
    repeat_cycle_probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    max_repeat_cycles = models.PositiveIntegerField(default=1)
    post_wash_qc_criteria = models.JSONField(default=dict, blank=True)
    shade_effect_tolerance = models.CharField(max_length=120, blank=True)
    customer_effect_approval_status = models.CharField(max_length=32, default="PENDING")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class WashRouteStep(BaseModel):
    route = models.ForeignKey(WashRoute, on_delete=models.CASCADE, related_name="steps")
    sequence_no = models.PositiveIntegerField()
    name = models.CharField(max_length=180)
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="wash_route_steps",
    )
    machine_type = models.ForeignKey(
        "workcenters.MachineType",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="wash_route_steps",
    )
    standard_minutes = models.PositiveIntegerField(default=0)
    qc_step = models.BooleanField(default=False)
    required = models.BooleanField(default=True)

    class Meta:
        ordering = ["route__code", "sequence_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["route", "sequence_no"],
                name="unique_wash_route_step_sequence",
            )
        ]

    def __str__(self) -> str:
        return f"{self.route.code}:{self.sequence_no}"
