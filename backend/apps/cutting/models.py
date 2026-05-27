from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class CuttingJobStatus(models.TextChoices):
    RELEASED = "RELEASED", "Released"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    HANDED_OVER = "HANDED_OVER", "Handed over"
    CANCELLED = "CANCELLED", "Cancelled"


class CutBundleStatus(models.TextChoices):
    CREATED = "CREATED", "Created"
    ISSUED_TO_SEWING = "ISSUED_TO_SEWING", "Issued to sewing"


class CuttingJob(BaseModel):
    job_no = models.CharField(max_length=120, unique=True)
    release = models.OneToOneField(
        "production_release.ProductionRelease",
        on_delete=models.PROTECT,
        related_name="cutting_job",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="cutting_jobs",
    )
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        on_delete=models.PROTECT,
        related_name="cutting_jobs",
    )
    planned_quantity = models.PositiveIntegerField()
    marker_no = models.CharField(max_length=120, blank=True)
    color_code = models.CharField(max_length=80, blank=True)
    shade_lot = models.CharField(max_length=80, blank=True)
    status = models.CharField(
        max_length=24,
        choices=CuttingJobStatus.choices,
        default=CuttingJobStatus.RELEASED,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    handed_over_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "job_no"]

    def __str__(self) -> str:
        return self.job_no


class CuttingOutputEntry(BaseModel):
    cutting_job = models.ForeignKey(
        CuttingJob,
        on_delete=models.PROTECT,
        related_name="output_entries",
    )
    client_event_id = models.CharField(max_length=120, unique=True)
    output_qty = models.PositiveIntegerField()
    defect_qty = models.PositiveIntegerField(default=0)
    rework_qty = models.PositiveIntegerField(default=0)
    net_cut_qty = models.PositiveIntegerField()
    recorded_at = models.DateTimeField()
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cutting_output_entries",
    )

    class Meta:
        ordering = ["-recorded_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.cutting_job.job_no}:{self.client_event_id}"


class CutBundle(BaseModel):
    cutting_job = models.ForeignKey(
        CuttingJob,
        on_delete=models.PROTECT,
        related_name="bundles",
    )
    bundle_no = models.CharField(max_length=120, unique=True)
    quantity = models.PositiveIntegerField()
    color_code = models.CharField(max_length=80, blank=True)
    shade_lot = models.CharField(max_length=80, blank=True)
    status = models.CharField(
        max_length=24,
        choices=CutBundleStatus.choices,
        default=CutBundleStatus.CREATED,
    )

    class Meta:
        ordering = ["cutting_job__job_no", "bundle_no"]

    def __str__(self) -> str:
        return self.bundle_no
