from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class FabricQcStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PASSED = "PASSED", "Passed"
    FAILED = "FAILED", "Failed"
    HOLD = "HOLD", "Hold"
    WAIVED = "WAIVED", "Waived"


class FabricLot(BaseModel):
    order = models.ForeignKey(
        "orders.ProductionOrder",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="fabric_lots",
    )
    material_purchase_order = models.ForeignKey(
        "materials_procurement.MaterialPurchaseOrder",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="fabric_lots",
    )
    lot_no = models.CharField(max_length=120)
    shade_lot = models.CharField(max_length=120, blank=True)
    received_qty = models.DecimalField(max_digits=14, decimal_places=3)
    received_date = models.DateField()
    status = models.CharField(max_length=40, default="RECEIVED")

    class Meta:
        ordering = ["order__order_no", "lot_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "lot_no"],
                name="unique_fabric_lot_order",
            )
        ]

    def __str__(self) -> str:
        return self.lot_no


class FabricRoll(BaseModel):
    fabric_lot = models.ForeignKey(FabricLot, on_delete=models.CASCADE, related_name="rolls")
    roll_no = models.CharField(max_length=120)
    roll_length = models.DecimalField(max_digits=14, decimal_places=3)
    width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    gsm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    shade = models.CharField(max_length=120, blank=True)
    qc_status = models.CharField(
        max_length=20,
        choices=FabricQcStatus.choices,
        default=FabricQcStatus.PENDING,
    )

    class Meta:
        ordering = ["fabric_lot__lot_no", "roll_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["fabric_lot", "roll_no"],
                name="unique_fabric_roll_lot",
            )
        ]

    def __str__(self) -> str:
        return f"{self.fabric_lot.lot_no}:{self.roll_no}"


class FabricQCInspection(BaseModel):
    fabric_roll = models.ForeignKey(
        FabricRoll,
        on_delete=models.CASCADE,
        related_name="inspections",
    )
    inspection_date = models.DateField()
    four_point_score = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )
    width_result = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    gsm_result = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    shrinkage_percent = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )
    skewing_result = models.CharField(max_length=80, blank=True)
    bowing_result = models.CharField(max_length=80, blank=True)
    stretch_recovery_result = models.CharField(max_length=80, blank=True)
    colorfastness_result = models.CharField(max_length=80, blank=True)
    crocking_result = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=FabricQcStatus.choices)
    inspected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="fabric_qc_inspections",
    )
    waived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="waived_fabric_qc_inspections",
    )
    waived_at = models.DateTimeField(null=True, blank=True)
    waiver_reason = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-inspection_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.fabric_roll}:{self.inspection_date}"


class FabricQCParameterResult(BaseModel):
    inspection = models.ForeignKey(
        FabricQCInspection,
        on_delete=models.CASCADE,
        related_name="parameter_results",
    )
    parameter = models.ForeignKey(
        "master_data.FabricQcParameter",
        on_delete=models.PROTECT,
        related_name="inspection_results",
    )
    measured_value = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
    )
    text_value = models.CharField(max_length=120, blank=True)
    status = models.CharField(
        max_length=20,
        choices=FabricQcStatus.choices,
        default=FabricQcStatus.PENDING,
    )
    tolerance_min = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
    )
    tolerance_max = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["inspection", "parameter__code"]
        constraints = [
            models.UniqueConstraint(
                fields=["inspection", "parameter"],
                name="unique_fabric_qc_parameter_result",
            )
        ]

    def __str__(self) -> str:
        return f"{self.inspection}:{self.parameter.code}"
