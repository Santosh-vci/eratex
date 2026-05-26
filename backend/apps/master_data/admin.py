from django.contrib import admin

from .models import (
    Buyer,
    ChecklistTemplate,
    ChecklistTemplateItem,
    Customer,
    DefectCode,
    ExceptionCategory,
    FabricQcParameter,
    HoldReason,
    Material,
    PlanningThreshold,
    ProductType,
    Vendor,
)


class ChecklistTemplateItemInline(admin.TabularInline):
    model = ChecklistTemplateItem
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "priority_level", "is_active")
    search_fields = ("code", "name")
    list_filter = ("priority_level", "is_active")


@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "customer", "is_active")
    search_fields = ("code", "name", "customer__code")
    list_filter = ("customer", "is_active")


@admin.register(ProductType)
class ProductTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active")
    search_fields = ("code", "name")
    list_filter = ("is_active",)


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "vendor_type", "nominated", "standard_lead_time_days")
    search_fields = ("code", "name")
    list_filter = ("vendor_type", "nominated", "is_active")


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "material_type", "uom", "inspection_required", "is_active")
    search_fields = ("code", "name")
    list_filter = ("material_type", "inspection_required", "is_active")


@admin.register(FabricQcParameter)
class FabricQcParameterAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "material_type", "severity", "is_active")
    search_fields = ("code", "name")
    list_filter = ("severity", "is_active")


@admin.register(DefectCode)
class DefectCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "department_type", "severity", "is_active")
    search_fields = ("code", "name")
    list_filter = ("department_type", "severity", "is_active")


@admin.register(HoldReason)
class HoldReasonAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "severity", "is_active")
    search_fields = ("code", "name")
    list_filter = ("severity", "is_active")


@admin.register(ExceptionCategory)
class ExceptionCategoryAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "severity", "owner_role", "is_active")
    search_fields = ("code", "name", "owner_role")
    list_filter = ("severity", "is_active")


@admin.register(PlanningThreshold)
class PlanningThresholdAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "threshold_type", "value", "unit", "is_active")
    search_fields = ("code", "name")
    list_filter = ("threshold_type", "is_active")


@admin.register(ChecklistTemplate)
class ChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "template_type", "status", "is_active")
    search_fields = ("code", "name")
    list_filter = ("template_type", "status", "is_active")
    inlines = [ChecklistTemplateItemInline]
