from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class ProductionReleaseStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    READY = "READY", "Ready"
    BLOCKED = "BLOCKED", "Blocked"
    OVERRIDE_REQUESTED = "OVERRIDE_REQUESTED", "Override requested"
    OVERRIDE_APPROVED = "OVERRIDE_APPROVED", "Override approved"
    RELEASED = "RELEASED", "Released"
    COMPLETED = "COMPLETED", "Completed"


class ProductionReleaseType(models.TextChoices):
    CUTTING = "CUTTING", "Cutting"
    SEWING = "SEWING", "Sewing"
    WASH = "WASH", "Wash"
    FINISHING = "FINISHING", "Finishing"


class ReleaseBlockerSeverity(models.TextChoices):
    WATCH = "WATCH", "Watch"
    ACTION = "ACTION", "Action"
    CRITICAL = "CRITICAL", "Critical"


class ProductionRelease(BaseModel):
    release_no = models.CharField(max_length=100, unique=True)
    planned_work_item = models.ForeignKey(
        "planning.PlannedWorkItem",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="production_releases",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="production_releases",
    )
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        on_delete=models.PROTECT,
        related_name="production_releases",
    )
    release_date = models.DateField()
    release_type = models.CharField(
        max_length=24,
        choices=ProductionReleaseType.choices,
        default=ProductionReleaseType.CUTTING,
    )
    status = models.CharField(
        max_length=32,
        choices=ProductionReleaseStatus.choices,
        default=ProductionReleaseStatus.DRAFT,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    released_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="issued_production_releases",
    )
    released_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    override_requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requested_release_overrides",
    )
    override_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_release_overrides",
    )
    override_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["release_date", "release_no"]

    def __str__(self) -> str:
        return self.release_no


class ReleaseValidationResult(BaseModel):
    release = models.ForeignKey(
        ProductionRelease,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="validation_results",
    )
    planned_work_item = models.ForeignKey(
        "planning.PlannedWorkItem",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="release_validation_results",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="release_validation_results",
    )
    is_valid = models.BooleanField(default=False)
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    checked_at = models.DateTimeField(auto_now_add=True)
    checks = models.JSONField(default=list, blank=True)
    blockers = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-checked_at"]

    def __str__(self) -> str:
        return f"{self.order.order_no}:{self.is_valid}"


class ReleaseBlocker(BaseModel):
    release = models.ForeignKey(
        ProductionRelease,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="blockers",
    )
    validation_result = models.ForeignKey(
        ReleaseValidationResult,
        on_delete=models.CASCADE,
        related_name="blocker_rows",
    )
    blocker_code = models.CharField(max_length=100)
    message = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=ReleaseBlockerSeverity.choices,
        default=ReleaseBlockerSeverity.ACTION,
    )
    owner_role = models.CharField(max_length=80, blank=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["resolved", "severity", "blocker_code"]

    def __str__(self) -> str:
        return f"{self.blocker_code}:{self.severity}"
