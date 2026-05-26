from django.contrib import admin

from apps.materials_procurement.models import (
    MaterialETAUpdate,
    MaterialPurchaseOrder,
    MaterialRequirement,
)


@admin.register(MaterialRequirement)
class MaterialRequirementAdmin(admin.ModelAdmin):
    list_display = ("order", "material", "required_stage", "required_qty", "shortage_qty", "status")
    list_filter = ("status", "required_stage", "material__material_type")
    search_fields = ("order__order_no", "material__code")


@admin.register(MaterialPurchaseOrder)
class MaterialPurchaseOrderAdmin(admin.ModelAdmin):
    list_display = (
        "po_no",
        "vendor",
        "order",
        "material",
        "expected_arrival_date",
        "revised_eta",
        "status",
    )
    list_filter = ("status", "vendor", "material__material_type")
    search_fields = ("po_no", "order__order_no", "material__code", "vendor__code")


@admin.register(MaterialETAUpdate)
class MaterialETAUpdateAdmin(admin.ModelAdmin):
    list_display = (
        "purchase_order",
        "previous_eta",
        "revised_eta",
        "updated_by_user",
        "created_at",
    )
    search_fields = ("purchase_order__po_no", "reason")
    readonly_fields = ("created_at", "updated_at")
