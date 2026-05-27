from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class LineLoadingStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    READY = "READY", "Ready"
    ACTIVE = "ACTIVE", "Active"
    CLOSED = "CLOSED", "Closed"
    BLOCKED = "BLOCKED", "Blocked"
    CANCELLED = "CANCELLED", "Cancelled"


class LineFitStatus(models.TextChoices):
    FIT = "FIT", "Fit"
    ACCEPTABLE_WITH_REALIGNMENT = (
        "ACCEPTABLE_WITH_REALIGNMENT",
        "Acceptable with realignment",
    )
    BLOCKED = "BLOCKED", "Blocked"


class LineRealignmentStatus(models.TextChoices):
    PROPOSED = "PROPOSED", "Proposed"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    APPROVED = "APPROVED", "Approved"
    APPLIED = "APPLIED", "Applied"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"


class LineRealignmentGapType(models.TextChoices):
    MACHINE = "MACHINE", "Machine"
    SKILL = "SKILL", "Skill"
    BOTTLENECK = "BOTTLENECK", "Bottleneck"


class SewingLineLoading(BaseModel):
    loading_no = models.CharField(max_length=120, unique=True)
    release = models.ForeignKey(
        "production_release.ProductionRelease",
        on_delete=models.PROTECT,
        related_name="sewing_line_loadings",
    )
    planned_work_item = models.ForeignKey(
        "planning.PlannedWorkItem",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sewing_line_loadings",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="sewing_line_loadings",
    )
    line = models.ForeignKey(
        "organization.Line",
        on_delete=models.PROTECT,
        related_name="sewing_line_loadings",
    )
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        on_delete=models.PROTECT,
        related_name="sewing_line_loadings",
    )
    bulletin = models.ForeignKey(
        "style_technical.OperationBulletin",
        on_delete=models.PROTECT,
        related_name="sewing_line_loadings",
    )
    approved_exception = models.ForeignKey(
        "boundary_cases.BoundaryCaseEvent",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_line_loadings",
    )
    planned_quantity = models.PositiveIntegerField()
    target_output_per_day = models.PositiveIntegerField(default=0)
    target_efficiency = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    expected_defect_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    planning_zone = models.CharField(max_length=32, default="FLEXIBLE_ZONE")
    planned_shift = models.CharField(max_length=40, default="DAY")
    color_code = models.CharField(max_length=80, blank=True)
    shade_lot = models.CharField(max_length=80, blank=True)
    fit_status = models.CharField(
        max_length=40,
        choices=LineFitStatus.choices,
        default=LineFitStatus.FIT,
    )
    status = models.CharField(
        max_length=24,
        choices=LineLoadingStatus.choices,
        default=LineLoadingStatus.DRAFT,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    activated_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "loading_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["release", "line"],
                name="unique_release_line_loading",
            )
        ]

    def __str__(self) -> str:
        return self.loading_no


class SewingLineAssignment(BaseModel):
    line_loading = models.ForeignKey(
        SewingLineLoading,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    line = models.ForeignKey(
        "organization.Line",
        on_delete=models.PROTECT,
        related_name="sewing_assignments",
    )
    operator_count = models.PositiveIntegerField(default=0)
    machine_count = models.PositiveIntegerField(default=0)
    effective_from = models.DateTimeField(null=True, blank=True)
    effective_to = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["line__code", "-created_at"]

    def __str__(self) -> str:
        return f"{self.line_loading.loading_no}:{self.line.code}"


class SewingLineBoardSnapshot(BaseModel):
    line_loading = models.OneToOneField(
        SewingLineLoading,
        on_delete=models.CASCADE,
        related_name="board_snapshot",
    )
    board_sequence = models.PositiveIntegerField(default=999)
    production_po_no = models.CharField(max_length=120, blank=True)
    production_style_code = models.CharField(max_length=120, blank=True)
    style_smv = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    display_status = models.CharField(max_length=40, default="RUNNING")
    actual_output = models.PositiveIntegerField(default=0)
    net_good_output = models.PositiveIntegerField(default=0)
    defect_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    planned_manpower = models.PositiveIntegerField(default=0)
    actual_manpower = models.PositiveIntegerField(default=0)
    bottleneck_operation_name = models.CharField(max_length=160, blank=True)
    bottleneck_smv = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    bottleneck_station = models.CharField(max_length=40, blank=True)
    wip_accumulation = models.PositiveIntegerField(default=0)
    hourly_output_json = models.JSONField(default=list, blank=True)
    operator_allocation_json = models.JSONField(default=list, blank=True)
    absence_impact = models.TextField(blank=True)
    recovery_action_text = models.TextField(blank=True)

    class Meta:
        ordering = ["board_sequence", "line_loading__line__code"]

    def __str__(self) -> str:
        return f"{self.line_loading.loading_no}:board"


class LineRealignmentRequest(BaseModel):
    request_no = models.CharField(max_length=120, unique=True)
    line_loading = models.ForeignKey(
        SewingLineLoading,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="realignment_requests",
    )
    line = models.ForeignKey(
        "organization.Line",
        on_delete=models.PROTECT,
        related_name="realignment_requests",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="line_realignment_requests",
    )
    bulletin = models.ForeignKey(
        "style_technical.OperationBulletin",
        on_delete=models.PROTECT,
        related_name="line_realignment_requests",
    )
    status = models.CharField(
        max_length=24,
        choices=LineRealignmentStatus.choices,
        default=LineRealignmentStatus.PROPOSED,
    )
    fit_status = models.CharField(
        max_length=40,
        choices=LineFitStatus.choices,
        default=LineFitStatus.ACCEPTABLE_WITH_REALIGNMENT,
    )
    target_output = models.PositiveIntegerField()
    expected_output_before = models.PositiveIntegerField(default=0)
    expected_output_after = models.PositiveIntegerField(default=0)
    changeover_minutes = models.PositiveIntegerField(default=0)
    approval_required = models.BooleanField(default=True)
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.WATCH,
    )
    recommendations_json = models.JSONField(default=list, blank=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requested_line_realignments",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_line_realignments",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    applied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="applied_line_realignments",
    )
    applied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "request_no"]

    def __str__(self) -> str:
        return self.request_no


class LineRealignmentGap(BaseModel):
    realignment = models.ForeignKey(
        LineRealignmentRequest,
        on_delete=models.CASCADE,
        related_name="gaps",
    )
    gap_type = models.CharField(max_length=24, choices=LineRealignmentGapType.choices)
    label = models.CharField(max_length=160)
    required = models.PositiveIntegerField(default=0)
    available = models.PositiveIntegerField(default=0)
    gap = models.IntegerField(default=0)
    recommendation = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ["gap_type", "label"]

    def __str__(self) -> str:
        return f"{self.realignment.request_no}:{self.gap_type}:{self.label}"


class SewingOutputEntry(BaseModel):
    line_loading = models.ForeignKey(
        SewingLineLoading,
        on_delete=models.PROTECT,
        related_name="output_entries",
    )
    client_event_id = models.CharField(max_length=120, unique=True)
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="sewing_output_entries",
    )
    line = models.ForeignKey(
        "organization.Line",
        on_delete=models.PROTECT,
        related_name="sewing_output_entries",
    )
    entry_time = models.DateTimeField()
    time_slot = models.CharField(max_length=40)
    gross_qty = models.PositiveIntegerField()
    defect_qty = models.PositiveIntegerField(default=0)
    rework_qty = models.PositiveIntegerField(default=0)
    net_good_qty = models.PositiveIntegerField()
    source = models.CharField(max_length=32, default="DESKTOP")
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sewing_output_entries",
    )

    class Meta:
        ordering = ["-entry_time", "-created_at"]
        indexes = [models.Index(fields=["order", "line", "time_slot"])]

    def __str__(self) -> str:
        return f"{self.line_loading.loading_no}:{self.time_slot}"


class SewingOutputCorrection(BaseModel):
    output_entry = models.ForeignKey(
        SewingOutputEntry,
        on_delete=models.PROTECT,
        related_name="corrections",
    )
    reason = models.TextField()
    old_value_json = models.JSONField(default=dict, blank=True)
    new_value_json = models.JSONField(default=dict, blank=True)
    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sewing_output_corrections",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.output_entry.client_event_id}:correction"
