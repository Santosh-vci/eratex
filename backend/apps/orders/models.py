from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class OrderStage(models.TextChoices):
    CREATED = "CREATED", "Created"
    PRE_PRODUCTION = "PRE_PRODUCTION", "Pre-production"
    PCD_PENDING = "PCD_PENDING", "PCD pending"
    PCD_READY = "PCD_READY", "PCD ready"
    CUTTING = "CUTTING", "Cutting"
    SEWING = "SEWING", "Sewing"
    WASHING = "WASHING", "Washing"
    FINISHING = "FINISHING", "Finishing"
    PACKING = "PACKING", "Packing"
    SHIPMENT_READY = "SHIPMENT_READY", "Shipment ready"
    SHIPPED = "SHIPPED", "Shipped"
    ON_HOLD = "ON_HOLD", "On hold"
    CANCELLED = "CANCELLED", "Cancelled"


class OrderStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    ON_HOLD = "ON_HOLD", "On hold"
    CANCELLED = "CANCELLED", "Cancelled"
    CLOSED = "CLOSED", "Closed"


class ProductionOrder(BaseModel):
    order_no = models.CharField(max_length=120, unique=True)
    po_number = models.CharField(max_length=120, blank=True)
    customer = models.ForeignKey(
        "master_data.Customer", on_delete=models.PROTECT, related_name="orders"
    )
    buyer = models.ForeignKey(
        "master_data.Buyer",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    style = models.ForeignKey(
        "style_technical.Style", on_delete=models.PROTECT, related_name="orders"
    )
    factory = models.ForeignKey(
        "organization.Factory",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    product_type = models.ForeignKey(
        "master_data.ProductType",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    order_qty = models.PositiveIntegerField()
    planned_ship_date = models.DateField(null=True, blank=True)
    committed_ship_date = models.DateField()
    planned_pcd_date = models.DateField()
    current_stage = models.CharField(
        max_length=40,
        choices=OrderStage.choices,
        default=OrderStage.CREATED,
    )
    lifecycle_status = models.CharField(
        max_length=40,
        choices=OrderStage.choices,
        default=OrderStage.CREATED,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_orders",
    )
    order_status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.ACTIVE,
    )

    class Meta:
        ordering = ["committed_ship_date", "order_no"]

    def __str__(self) -> str:
        return self.order_no


class OrderLine(BaseModel):
    order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name="lines")
    size = models.CharField(max_length=50)
    color = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()

    class Meta:
        ordering = ["order__order_no", "color", "size"]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "size", "color"],
                name="unique_order_line_size_color",
            )
        ]

    def __str__(self) -> str:
        return f"{self.order.order_no}:{self.color}/{self.size}"


class OrderMilestone(BaseModel):
    class MilestoneStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        DONE = "DONE", "Done"
        DELAYED = "DELAYED", "Delayed"
        BLOCKED = "BLOCKED", "Blocked"

    order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name="milestones")
    milestone_type = models.CharField(max_length=80)
    planned_date = models.DateField(null=True, blank=True)
    actual_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=MilestoneStatus.choices,
        default=MilestoneStatus.PENDING,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="order_milestones",
    )
    delay_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["order__order_no", "planned_date", "milestone_type"]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "milestone_type"],
                name="unique_order_milestone_type",
            )
        ]

    def __str__(self) -> str:
        return f"{self.order.order_no}:{self.milestone_type}"


class OrderLifecycleEvent(BaseModel):
    order = models.ForeignKey(
        ProductionOrder, on_delete=models.CASCADE, related_name="lifecycle_events"
    )
    event_code = models.CharField(max_length=100)
    from_stage = models.CharField(max_length=40, blank=True)
    to_stage = models.CharField(max_length=40)
    message = models.CharField(max_length=240)
    metadata = models.JSONField(default=dict, blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="order_lifecycle_events",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.order.order_no}:{self.event_code}"
