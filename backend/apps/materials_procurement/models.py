from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class MaterialRequirementStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    ORDERED = "ORDERED", "Ordered"
    READY = "READY", "Ready"
    SHORT = "SHORT", "Short"
    DELAYED = "DELAYED", "Delayed"
    CLOSED = "CLOSED", "Closed"


class MaterialPurchaseOrderStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
    DELAYED = "DELAYED", "Delayed"
    RECEIVED = "RECEIVED", "Received"
    CLOSED = "CLOSED", "Closed"
    CANCELLED = "CANCELLED", "Cancelled"


class MaterialRequirement(BaseModel):
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.CASCADE,
        related_name="material_requirements",
    )
    material = models.ForeignKey(
        "master_data.Material",
        on_delete=models.PROTECT,
        related_name="order_requirements",
    )
    required_qty = models.DecimalField(max_digits=14, decimal_places=3)
    required_date = models.DateField(null=True, blank=True)
    required_stage = models.CharField(max_length=80)
    status = models.CharField(
        max_length=20,
        choices=MaterialRequirementStatus.choices,
        default=MaterialRequirementStatus.OPEN,
    )
    shortage_qty = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0.000"))
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="material_requirements",
    )

    class Meta:
        ordering = ["order__order_no", "required_stage", "material__code"]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "material", "required_stage"],
                name="unique_material_requirement_stage",
            )
        ]

    def __str__(self) -> str:
        return f"{self.order.order_no}:{self.material.code}:{self.required_stage}"


class MaterialPurchaseOrder(BaseModel):
    po_no = models.CharField(max_length=120, unique=True)
    vendor = models.ForeignKey(
        "master_data.Vendor",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    order = models.ForeignKey(
        "orders.ProductionOrder",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="material_purchase_orders",
    )
    material = models.ForeignKey(
        "master_data.Material",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    ordered_qty = models.DecimalField(max_digits=14, decimal_places=3)
    acknowledged_qty = models.DecimalField(
        max_digits=14,
        decimal_places=3,
        null=True,
        blank=True,
    )
    expected_arrival_date = models.DateField(null=True, blank=True)
    revised_eta = models.DateField(null=True, blank=True)
    actual_arrival_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=MaterialPurchaseOrderStatus.choices,
        default=MaterialPurchaseOrderStatus.OPEN,
    )

    class Meta:
        ordering = ["expected_arrival_date", "po_no"]

    def __str__(self) -> str:
        return self.po_no


class MaterialETAUpdate(BaseModel):
    purchase_order = models.ForeignKey(
        MaterialPurchaseOrder,
        on_delete=models.CASCADE,
        related_name="eta_updates",
    )
    previous_eta = models.DateField(null=True, blank=True)
    revised_eta = models.DateField()
    reason = models.TextField(blank=True)
    updated_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="material_eta_updates",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.purchase_order.po_no}:{self.revised_eta}"
