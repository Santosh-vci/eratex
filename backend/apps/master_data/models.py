from decimal import Decimal

from django.db import models

from apps.common.models import ApprovalStatus, BaseModel


class Customer(BaseModel):
    class PriorityLevel(models.TextChoices):
        HIGH = "HIGH", "High"
        MEDIUM = "MEDIUM", "Medium"
        LOW = "LOW", "Low"

    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=180)
    priority_level = models.CharField(
        max_length=16,
        choices=PriorityLevel.choices,
        default=PriorityLevel.MEDIUM,
    )
    default_aql_level = models.CharField(max_length=32, blank=True)
    payment_terms = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class Buyer(BaseModel):
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="buyers")
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=180)

    class Meta:
        ordering = ["customer__code", "code"]
        constraints = [
            models.UniqueConstraint(fields=["customer", "code"], name="unique_buyer_code_customer")
        ]

    def __str__(self) -> str:
        return f"{self.customer.code}/{self.code}"


class ProductType(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class Vendor(BaseModel):
    class VendorType(models.TextChoices):
        FABRIC = "FABRIC", "Fabric"
        TRIMS = "TRIMS", "Trims"
        PACKING = "PACKING", "Packing"
        SERVICE = "SERVICE", "Service"

    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=180)
    vendor_type = models.CharField(max_length=32, choices=VendorType.choices)
    nominated = models.BooleanField(default=False)
    standard_lead_time_days = models.PositiveIntegerField(default=0)
    contact_details = models.TextField(blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class Material(BaseModel):
    class MaterialType(models.TextChoices):
        MAIN_FABRIC = "MAIN_FABRIC", "Main fabric"
        POCKETING = "POCKETING", "Pocketing"
        LINING = "LINING", "Lining"
        THREAD = "THREAD", "Thread"
        ZIPPER = "ZIPPER", "Zipper"
        BUTTON = "BUTTON", "Button"
        RIVET = "RIVET", "Rivet"
        PATCH = "PATCH", "Patch"
        LABEL = "LABEL", "Label"
        HANGTAG = "HANGTAG", "Hangtag"
        POLYBAG = "POLYBAG", "Polybag"
        CARTON = "CARTON", "Carton"
        STICKER = "STICKER", "Sticker"
        CHEMICAL = "CHEMICAL", "Chemical"
        OTHER = "OTHER", "Other"

    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=180)
    material_type = models.CharField(max_length=32, choices=MaterialType.choices)
    uom = models.CharField(max_length=32)
    standard_lead_time_days = models.PositiveIntegerField(default=0)
    default_vendor = models.ForeignKey(
        Vendor,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="default_materials",
    )
    nominated_vendor_required = models.BooleanField(default=False)
    inspection_required = models.BooleanField(default=False)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class FabricQcParameter(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    material_type = models.CharField(max_length=32, default=Material.MaterialType.MAIN_FABRIC)
    severity = models.CharField(max_length=32, default="MEDIUM")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class DefectCode(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    department_type = models.CharField(max_length=64, blank=True)
    severity = models.CharField(max_length=32, default="MEDIUM")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class HoldReason(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    severity = models.CharField(max_length=32, default="MEDIUM")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class ExceptionCategory(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    severity = models.CharField(max_length=32, default="MEDIUM")
    owner_role = models.CharField(max_length=80, blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class PlanningThreshold(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=180)
    threshold_type = models.CharField(max_length=64)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    unit = models.CharField(max_length=32)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class ChecklistTemplate(BaseModel):
    class TemplateType(models.TextChoices):
        PCD = "PCD", "PCD"
        SHIPMENT = "SHIPMENT", "Shipment"

    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=180)
    template_type = models.CharField(max_length=32, choices=TemplateType.choices)
    status = models.CharField(
        max_length=32,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
    )

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class ChecklistTemplateItem(BaseModel):
    template = models.ForeignKey(ChecklistTemplate, on_delete=models.CASCADE, related_name="items")
    sequence_no = models.PositiveIntegerField()
    code = models.CharField(max_length=80)
    label = models.CharField(max_length=180)
    owner_role = models.CharField(max_length=80)
    mandatory = models.BooleanField(default=True)

    class Meta:
        ordering = ["template__code", "sequence_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["template", "sequence_no"],
                name="unique_checklist_item_sequence",
            ),
            models.UniqueConstraint(
                fields=["template", "code"],
                name="unique_checklist_item_code",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.template.code}:{self.code}"
