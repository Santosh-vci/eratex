from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class PCDReadinessStatus(models.TextChoices):
    IN_REVIEW = "IN_REVIEW", "In review"
    READY = "READY", "Ready"
    CONDITIONALLY_READY = "CONDITIONALLY_READY", "Conditionally ready"
    BLOCKED = "BLOCKED", "Blocked"
    ESCALATED = "ESCALATED", "Escalated"
    RELEASED = "RELEASED", "Released"


class PCDItemStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PASSED = "PASSED", "Passed"
    FAILED = "FAILED", "Failed"
    WAIVED = "WAIVED", "Waived"
    NOT_APPLICABLE = "NOT_APPLICABLE", "Not applicable"


class ConditionalReleaseStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Requested"
    APPROVED = "APPROVED", "Approved"
    EXPIRED = "EXPIRED", "Expired"
    REJECTED = "REJECTED", "Rejected"


class PCDReadiness(BaseModel):
    order = models.OneToOneField(
        "orders.ProductionOrder",
        on_delete=models.CASCADE,
        related_name="pcd_readiness",
    )
    planned_pcd_date = models.DateField()
    readiness_status = models.CharField(
        max_length=32,
        choices=PCDReadinessStatus.choices,
        default=PCDReadinessStatus.IN_REVIEW,
    )
    conditional_release = models.BooleanField(default=False)
    conditional_release_reason = models.TextField(blank=True)
    conditional_release_expiry = models.DateField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_pcd_readiness",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    released_to_cutting_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["planned_pcd_date", "order__order_no"]

    def __str__(self) -> str:
        return self.order.order_no


class PCDReadinessItem(BaseModel):
    pcd_readiness = models.ForeignKey(PCDReadiness, on_delete=models.CASCADE, related_name="items")
    item_code = models.CharField(max_length=120)
    item_label = models.CharField(max_length=250)
    is_mandatory = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=PCDItemStatus.choices,
        default=PCDItemStatus.PENDING,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="pcd_readiness_items",
    )
    due_date = models.DateField(null=True, blank=True)
    waiver_reason = models.TextField(blank=True)
    evidence_url = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["pcd_readiness__order__order_no", "item_code"]
        constraints = [
            models.UniqueConstraint(
                fields=["pcd_readiness", "item_code"],
                name="unique_pcd_readiness_item_code",
            )
        ]

    def __str__(self) -> str:
        return f"{self.pcd_readiness.order.order_no}:{self.item_code}"


class ConditionalRelease(BaseModel):
    pcd_readiness = models.ForeignKey(
        PCDReadiness,
        on_delete=models.CASCADE,
        related_name="conditional_releases",
    )
    status = models.CharField(
        max_length=20,
        choices=ConditionalReleaseStatus.choices,
        default=ConditionalReleaseStatus.REQUESTED,
    )
    open_item_codes = models.JSONField(default=list, blank=True)
    reason = models.TextField()
    risk_note = models.TextField(blank=True)
    expiry_date = models.DateField()
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requested_conditional_releases",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_conditional_releases",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.pcd_readiness.order.order_no}:{self.status}"
