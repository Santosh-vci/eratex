from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class ExternalPlanSourceType(models.TextChoices):
    FASTREACT_PLAN = "fastreact_plan", "FastReact plan"
    EXTERNAL_PLAN = "external_plan", "External plan"


class ExternalPlanImportStatus(models.TextChoices):
    IMPORTED = "IMPORTED", "Imported"
    VALIDATED = "VALIDATED", "Validated"
    DRAFT_CREATED = "DRAFT_CREATED", "Draft created"
    REJECTED = "REJECTED", "Rejected"


class ExternalPlanConflictType(models.TextChoices):
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND", "Order not found"
    STYLE_NOT_READY = "STYLE_NOT_READY", "Style not ready"
    LINE_NOT_FOUND = "LINE_NOT_FOUND", "Line not found"
    WORKCENTER_NOT_FOUND = "WORKCENTER_NOT_FOUND", "Workcenter not found"
    CAPACITY_OVERLOAD = "CAPACITY_OVERLOAD", "Capacity overload"
    PCD_NOT_READY = "PCD_NOT_READY", "PCD not ready"
    WIP_NOT_AVAILABLE = "WIP_NOT_AVAILABLE", "WIP not available"
    WASH_ROUTE_MISSING = "WASH_ROUTE_MISSING", "Wash route missing"
    SHIPMENT_RISK = "SHIPMENT_RISK", "Shipment risk"
    FROZEN_ZONE_CONFLICT = "FROZEN_ZONE_CONFLICT", "Frozen zone conflict"


class ExternalPlanImportBatch(BaseModel):
    import_no = models.CharField(max_length=100, unique=True)
    source_type = models.CharField(
        max_length=40,
        choices=ExternalPlanSourceType.choices,
        default=ExternalPlanSourceType.EXTERNAL_PLAN,
    )
    status = models.CharField(
        max_length=32,
        choices=ExternalPlanImportStatus.choices,
        default=ExternalPlanImportStatus.IMPORTED,
    )
    source_reference = models.CharField(max_length=160, blank=True)
    raw_rows_json = models.JSONField(default=list, blank=True)
    validation_summary_json = models.JSONField(default=dict, blank=True)
    created_draft_plan = models.ForeignKey(
        "planning.PlanVersion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="external_plan_imports",
    )
    imported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="external_plan_imports",
    )

    class Meta:
        ordering = ["-created_at", "import_no"]

    def __str__(self) -> str:
        return self.import_no


class ExternalPlanValidationResult(BaseModel):
    import_batch = models.ForeignKey(
        ExternalPlanImportBatch,
        on_delete=models.CASCADE,
        related_name="validation_results",
    )
    conflict_type = models.CharField(max_length=40, choices=ExternalPlanConflictType.choices)
    severity = models.CharField(max_length=16, default="ACTION")
    row_number = models.PositiveIntegerField(default=0)
    order_no = models.CharField(max_length=120, blank=True)
    message = models.TextField()
    metadata_json = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["row_number", "conflict_type"]

    def __str__(self) -> str:
        return f"{self.import_batch.import_no}:{self.conflict_type}:{self.row_number}"
