from django.conf import settings
from django.db import models

from apps.common.models import BaseModel, RiskStatus


class WipStage(models.TextChoices):
    CUTTING = "CUTTING", "Cutting"
    CUT_PANEL = "CUT_PANEL", "Cut panel"
    SEWING_ACTIVE = "SEWING_ACTIVE", "Sewing active"
    SEWN_WAITING_WASH = "SEWN_WAITING_WASH", "Sewn waiting wash"


class WipLotStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Available"
    HELD = "HELD", "Held"
    CONSUMED = "CONSUMED", "Consumed"


class WipMovementType(models.TextChoices):
    RELEASE_TO_CUTTING = "RELEASE_TO_CUTTING", "Release to cutting"
    CUTTING_OUTPUT = "CUTTING_OUTPUT", "Cutting output"
    HANDOVER_TO_SEWING = "HANDOVER_TO_SEWING", "Handover to sewing"
    SEWING_OUTPUT = "SEWING_OUTPUT", "Sewing output"
    CORRECTION = "CORRECTION", "Correction"


class WipLot(BaseModel):
    lot_no = models.CharField(max_length=120, unique=True)
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="wip_lots",
    )
    release = models.ForeignKey(
        "production_release.ProductionRelease",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_lots",
    )
    cutting_job = models.ForeignKey(
        "cutting.CuttingJob",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_lots",
    )
    sewing_loading = models.ForeignKey(
        "sewing.SewingLineLoading",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_lots",
    )
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_lots",
    )
    line = models.ForeignKey(
        "organization.Line",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_lots",
    )
    stage = models.CharField(max_length=32, choices=WipStage.choices)
    quantity = models.PositiveIntegerField()
    available_quantity = models.PositiveIntegerField()
    held_quantity = models.PositiveIntegerField(default=0)
    color_code = models.CharField(max_length=80, blank=True)
    shade_lot = models.CharField(max_length=80, blank=True)
    status = models.CharField(
        max_length=24,
        choices=WipLotStatus.choices,
        default=WipLotStatus.AVAILABLE,
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RiskStatus.choices,
        default=RiskStatus.ON_TRACK,
    )

    class Meta:
        ordering = ["order__order_no", "stage", "lot_no"]
        indexes = [models.Index(fields=["order", "stage", "status"])]

    def __str__(self) -> str:
        return self.lot_no


class WipMovement(BaseModel):
    movement_no = models.CharField(max_length=120, unique=True)
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="wip_movements",
    )
    source_lot = models.ForeignKey(
        WipLot,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="outbound_movements",
    )
    target_lot = models.ForeignKey(
        WipLot,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="inbound_movements",
    )
    from_stage = models.CharField(max_length=32, choices=WipStage.choices, blank=True)
    to_stage = models.CharField(max_length=32, choices=WipStage.choices)
    quantity = models.PositiveIntegerField()
    movement_type = models.CharField(max_length=32, choices=WipMovementType.choices)
    reason = models.TextField(blank=True)
    boundary_case = models.ForeignKey(
        "boundary_cases.BoundaryCaseEvent",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_movements",
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wip_movements",
    )

    class Meta:
        ordering = ["-created_at", "movement_no"]

    def __str__(self) -> str:
        return self.movement_no


class WipHandover(BaseModel):
    handover_no = models.CharField(max_length=120, unique=True)
    order = models.ForeignKey(
        "orders.ProductionOrder",
        on_delete=models.PROTECT,
        related_name="wip_handovers",
    )
    source_lot = models.ForeignKey(
        WipLot,
        on_delete=models.PROTECT,
        related_name="source_handovers",
    )
    target_stage = models.CharField(max_length=32, choices=WipStage.choices)
    quantity = models.PositiveIntegerField()
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sent_wip_handovers",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="received_wip_handovers",
    )
    status = models.CharField(max_length=24, default="CONFIRMED")
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at", "handover_no"]

    def __str__(self) -> str:
        return self.handover_no
