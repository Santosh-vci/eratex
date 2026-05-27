from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class BoundaryEventStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IMPACT_PREVIEWED = "IMPACT_PREVIEWED", "Impact previewed"
    ACTION_PROPOSED = "ACTION_PROPOSED", "Action proposed"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED", "Approval required"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    APPLIED = "APPLIED", "Applied"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"
    CANCELLED = "CANCELLED", "Cancelled"


class BoundaryEventType(models.TextChoices):
    ORDER_CANCELLED = "ORDER_CANCELLED", "Order cancelled"
    ORDER_QTY_CHANGED = "ORDER_QTY_CHANGED", "Order quantity changed"
    DELIVERY_DATE_CHANGED = "DELIVERY_DATE_CHANGED", "Delivery date changed"
    SHIPMENT_PULL_IN = "SHIPMENT_PULL_IN", "Shipment pull-in"
    CAPACITY_LOSS = "CAPACITY_LOSS", "Capacity loss"
    CAPACITY_ADDITION = "CAPACITY_ADDITION", "Capacity addition"
    MACHINE_BREAKDOWN = "MACHINE_BREAKDOWN", "Machine breakdown"
    ABSENTEEISM_SPIKE = "ABSENTEEISM_SPIKE", "Absenteeism spike"
    QC_FAILURE = "QC_FAILURE", "QC failure"
    REWASH_REQUIRED = "REWASH_REQUIRED", "Rewash required"
    REWASH_REPEAT_EXCEEDED = "REWASH_REPEAT_EXCEEDED", "Rewash repeat exceeded"
    FROZEN_PLAN_CHANGE_REQUESTED = (
        "FROZEN_PLAN_CHANGE_REQUESTED",
        "Frozen plan change requested",
    )
    EXTERNAL_PLAN_CONFLICT = "EXTERNAL_PLAN_CONFLICT", "External plan conflict"


class BoundarySeverity(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class BoundaryTriggerSource(models.TextChoices):
    USER = "USER", "User"
    SYSTEM = "SYSTEM", "System"
    SHOPFLOOR = "SHOPFLOOR", "Shopfloor"
    IMPORT = "IMPORT", "Import"
    INTEGRATION = "INTEGRATION", "Integration"
    FASTREACT_IMPORT = "FASTREACT_IMPORT", "FastReact import"
    EXCEL_IMPORT = "EXCEL_IMPORT", "Excel import"


class BoundaryCaseEvent(BaseModel):
    event_no = models.CharField(max_length=100, unique=True)
    event_type = models.CharField(max_length=48, choices=BoundaryEventType.choices)
    status = models.CharField(
        max_length=32,
        choices=BoundaryEventStatus.choices,
        default=BoundaryEventStatus.OPEN,
    )
    severity = models.CharField(
        max_length=16,
        choices=BoundarySeverity.choices,
        default=BoundarySeverity.MEDIUM,
    )
    linked_order = models.ForeignKey(
        "orders.ProductionOrder",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="boundary_events",
    )
    linked_plan = models.ForeignKey(
        "planning.PlanVersion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="boundary_events",
    )
    linked_work_item = models.ForeignKey(
        "planning.PlannedWorkItem",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="boundary_events",
    )
    linked_workcenter = models.ForeignKey(
        "organization.Workcenter",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="boundary_events",
    )
    linked_line = models.ForeignKey(
        "organization.Line",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="boundary_events",
    )
    linked_wash_batch_id = models.UUIDField(null=True, blank=True)
    event_stage = models.CharField(max_length=80, blank=True)
    trigger_source = models.CharField(
        max_length=32,
        choices=BoundaryTriggerSource.choices,
        default=BoundaryTriggerSource.USER,
    )
    old_value_json = models.JSONField(default=dict, blank=True)
    new_value_json = models.JSONField(default=dict, blank=True)
    affected_quantity = models.IntegerField(default=0)
    affected_capacity_minutes = models.IntegerField(default=0)
    affected_shipment_date = models.DateField(null=True, blank=True)
    risk_before = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    risk_after = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.WATCH,
    )
    recommended_action = models.TextField(blank=True)
    approval_required = models.BooleanField(default=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_boundary_events",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_boundary_events",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    applied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="applied_boundary_events",
    )
    applied_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    metadata_json = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at", "event_no"]

    def __str__(self) -> str:
        return self.event_no


class BoundaryImpactPreview(BaseModel):
    boundary_case_event = models.ForeignKey(
        BoundaryCaseEvent,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="impact_previews",
    )
    preview_type = models.CharField(max_length=80)
    affected_orders_json = models.JSONField(default=list, blank=True)
    affected_workcenters_json = models.JSONField(default=list, blank=True)
    affected_wip_json = models.JSONField(default=list, blank=True)
    affected_shipments_json = models.JSONField(default=list, blank=True)
    capacity_before_json = models.JSONField(default=dict, blank=True)
    capacity_after_json = models.JSONField(default=dict, blank=True)
    risk_before = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    risk_after = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.WATCH,
    )
    recommended_actions_json = models.JSONField(default=list, blank=True)
    warnings_json = models.JSONField(default=list, blank=True)
    blocking_reasons_json = models.JSONField(default=list, blank=True)
    approval_required = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.preview_type}:{self.created_at:%Y%m%d%H%M%S}"
