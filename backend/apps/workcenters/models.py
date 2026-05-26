from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class MachineType(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=64, default="SEWING")

    class Meta:
        ordering = ["category", "code"]

    def __str__(self) -> str:
        return self.code


class Machine(BaseModel):
    class MachineStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        ASSIGNED = "ASSIGNED", "Assigned"
        UNDER_MAINTENANCE = "UNDER_MAINTENANCE", "Under maintenance"
        BREAKDOWN = "BREAKDOWN", "Breakdown"
        INACTIVE = "INACTIVE", "Inactive"

    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=160)
    machine_type = models.ForeignKey(MachineType, on_delete=models.PROTECT, related_name="machines")
    factory = models.ForeignKey(
        "organization.Factory", on_delete=models.PROTECT, related_name="machines"
    )
    status = models.CharField(
        max_length=32,
        choices=MachineStatus.choices,
        default=MachineStatus.AVAILABLE,
    )
    brand = models.CharField(max_length=80, blank=True)
    model = models.CharField(max_length=80, blank=True)
    current_line = models.ForeignKey(
        "organization.Line",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="current_machines",
    )
    maintenance_status = models.CharField(max_length=80, blank=True)
    last_service_date = models.DateField(null=True, blank=True)
    next_service_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class LineProfile(BaseModel):
    line = models.OneToOneField(
        "organization.Line", on_delete=models.CASCADE, related_name="profile"
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="supervised_line_profiles",
    )
    standard_manpower = models.PositiveIntegerField(default=0)
    current_manpower = models.PositiveIntegerField(default=0)
    shift_calendar = models.ForeignKey(
        "organization.ShiftCalendar",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="line_profiles",
    )
    baseline_efficiency = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    net_good_output_baseline = models.PositiveIntegerField(default=0)
    allowed_product_types = models.ManyToManyField(
        "master_data.ProductType",
        blank=True,
        related_name="line_profiles",
    )
    special_capability = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ["line__code"]

    def __str__(self) -> str:
        return self.line.code


class LineMachineAssignment(BaseModel):
    line = models.ForeignKey(
        "organization.Line",
        on_delete=models.PROTECT,
        related_name="machine_assignments",
    )
    machine = models.ForeignKey(Machine, on_delete=models.PROTECT, related_name="line_assignments")
    assigned_from = models.DateField()
    assigned_to = models.DateField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="machine_assignments",
    )
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["line__code", "machine__code"]

    def __str__(self) -> str:
        return f"{self.line.code}:{self.machine.code}"


class WorkcenterCapacityDay(BaseModel):
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        on_delete=models.PROTECT,
        related_name="capacity_days",
    )
    capacity_date = models.DateField()
    available_minutes = models.PositiveIntegerField(default=0)
    capacity_unit = models.CharField(max_length=32, default="MINUTES")
    capacity_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    source = models.CharField(max_length=64, default="SEED")

    class Meta:
        ordering = ["workcenter__code", "capacity_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["workcenter", "capacity_date"],
                name="unique_workcenter_capacity_day",
            )
        ]

    def __str__(self) -> str:
        return f"{self.workcenter.code}:{self.capacity_date}"


class Operator(BaseModel):
    employee_code = models.CharField(max_length=64, unique=True)
    display_name = models.CharField(max_length=160)
    factory = models.ForeignKey(
        "organization.Factory", on_delete=models.PROTECT, related_name="operators"
    )
    line = models.ForeignKey(
        "organization.Line",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="operators",
    )

    class Meta:
        ordering = ["employee_code"]

    def __str__(self) -> str:
        return self.employee_code


class OperatorSkill(BaseModel):
    class SkillLevel(models.TextChoices):
        NOT_TRAINED = "NOT_TRAINED", "Not trained"
        TRAINEE = "TRAINEE", "Trainee"
        BASIC = "BASIC", "Basic"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        EXPERT = "EXPERT", "Expert"

    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name="skills")
    operation = models.ForeignKey(
        "style_technical.OperationMaster",
        on_delete=models.PROTECT,
        related_name="operator_skills",
    )
    skill_level = models.CharField(max_length=32, choices=SkillLevel.choices)
    efficiency_rating = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    quality_rating = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    last_reviewed_date = models.DateField(null=True, blank=True)
    training_required = models.BooleanField(default=False)

    class Meta:
        ordering = ["operator__employee_code", "operation__code"]
        constraints = [
            models.UniqueConstraint(
                fields=["operator", "operation"],
                name="unique_operator_operation_skill",
            )
        ]

    def __str__(self) -> str:
        return f"{self.operator.employee_code}:{self.operation.code}"
