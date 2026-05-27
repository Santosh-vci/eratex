from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class PlanningHorizonStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    CLOSED = "CLOSED", "Closed"


class PlanVersionStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    FROZEN = "FROZEN", "Frozen"
    ARCHIVED = "ARCHIVED", "Archived"


class PlannedWorkItemStatus(models.TextChoices):
    PLANNED = "PLANNED", "Planned"
    RELEASE_READY = "RELEASE_READY", "Release ready"
    BLOCKED = "BLOCKED", "Blocked"
    RELEASED = "RELEASED", "Released"


class PlanChangeStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Requested"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    APPLIED = "APPLIED", "Applied"


class PlanChangeType(models.TextChoices):
    ASSIGN = "ASSIGN", "Assign"
    MOVE = "MOVE", "Move"
    CAPACITY = "CAPACITY", "Capacity"
    RELEASE = "RELEASE", "Release"
    BOUNDARY_REPLAN = "BOUNDARY_REPLAN", "Boundary replan"


class PlanningZoneCode(models.TextChoices):
    FROZEN_ZONE = "FROZEN_ZONE", "Frozen zone"
    FIRM_ZONE = "FIRM_ZONE", "Firm zone"
    FLEXIBLE_ZONE = "FLEXIBLE_ZONE", "Flexible zone"


class PlanningZoneConfiguration(BaseModel):
    zone_code = models.CharField(max_length=32, choices=PlanningZoneCode.choices, unique=True)
    zone_name = models.CharField(max_length=120)
    horizon_start_days = models.PositiveIntegerField(default=0)
    horizon_end_days = models.PositiveIntegerField(default=0)
    requires_approval_for_change = models.BooleanField(default=False)
    auto_reschedule_allowed = models.BooleanField(default=False)
    active_status = models.BooleanField(default=True)

    class Meta:
        ordering = ["horizon_start_days", "zone_code"]

    def __str__(self) -> str:
        return self.zone_code


class PlanningHorizon(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=180)
    start_date = models.DateField()
    end_date = models.DateField()
    factory = models.ForeignKey(
        "organization.Factory",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="planning_horizons",
    )
    status = models.CharField(
        max_length=20,
        choices=PlanningHorizonStatus.choices,
        default=PlanningHorizonStatus.DRAFT,
    )
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-start_date", "code"]

    def __str__(self) -> str:
        return self.code


class PlanVersion(BaseModel):
    horizon = models.ForeignKey(
        PlanningHorizon,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_no = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=PlanVersionStatus.choices,
        default=PlanVersionStatus.DRAFT,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    notes = models.TextField(blank=True)
    frozen_at = models.DateTimeField(null=True, blank=True)
    frozen_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="frozen_plan_versions",
    )

    class Meta:
        ordering = ["horizon__start_date", "version_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["horizon", "version_no"],
                name="unique_plan_version_per_horizon",
            )
        ]

    def __str__(self) -> str:
        return f"{self.horizon.code}:v{self.version_no}"


class PlannedWorkItem(BaseModel):
    plan_version = models.ForeignKey(
        PlanVersion,
        on_delete=models.CASCADE,
        related_name="work_items",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="planned_work_items",
    )
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        on_delete=models.PROTECT,
        related_name="planned_work_items",
    )
    line = models.ForeignKey(
        "organization.Line",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="planned_work_items",
    )
    planned_start_date = models.DateField()
    planned_end_date = models.DateField()
    planned_shift = models.CharField(max_length=40, default="DAY")
    planning_zone = models.CharField(
        max_length=32,
        choices=PlanningZoneCode.choices,
        default=PlanningZoneCode.FLEXIBLE_ZONE,
    )
    production_stage = models.CharField(max_length=40, default="PLANNING")
    color_code = models.CharField(max_length=80, blank=True)
    shade_lot = models.CharField(max_length=80, blank=True)
    planned_quantity = models.PositiveIntegerField()
    load_minutes = models.PositiveIntegerField(default=0)
    sequence_no = models.PositiveIntegerField(default=10)
    status = models.CharField(
        max_length=24,
        choices=PlannedWorkItemStatus.choices,
        default=PlannedWorkItemStatus.PLANNED,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    locked = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["planned_start_date", "sequence_no", "order__order_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["plan_version", "order", "workcenter"],
                name="unique_work_item_plan_order_workcenter",
            )
        ]

    def __str__(self) -> str:
        return f"{self.plan_version}:{self.order.order_no}:{self.workcenter.code}"


class PlanChangeRequest(BaseModel):
    plan_version = models.ForeignKey(
        PlanVersion,
        on_delete=models.CASCADE,
        related_name="change_requests",
    )
    work_item = models.ForeignKey(
        PlannedWorkItem,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="change_requests",
    )
    change_type = models.CharField(
        max_length=24,
        choices=PlanChangeType.choices,
        default=PlanChangeType.MOVE,
    )
    status = models.CharField(
        max_length=20,
        choices=PlanChangeStatus.choices,
        default=PlanChangeStatus.REQUESTED,
    )
    reason = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    impact_preview = models.JSONField(default=dict, blank=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requested_plan_changes",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_plan_changes",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.plan_version}:{self.change_type}:{self.status}"
