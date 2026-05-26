from django.contrib import admin

from apps.common.models import ApprovalStatus

from .models import (
    BOMHeader,
    BOMLine,
    OperationBulletin,
    OperationBulletinLine,
    OperationMaster,
    Style,
    StyleComplexity,
    WashRoute,
    WashRouteStep,
)


class ApprovedReadOnlyMixin:
    protected_fields = ("status",)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.status == ApprovalStatus.APPROVED:
            model_fields = [field.name for field in obj._meta.fields]
            readonly.extend(field for field in model_fields if field not in readonly)
        return readonly


class BOMLineInline(admin.TabularInline):
    model = BOMLine
    extra = 0


class OperationBulletinLineInline(admin.TabularInline):
    model = OperationBulletinLine
    extra = 0


class WashRouteStepInline(admin.TabularInline):
    model = WashRouteStep
    extra = 0


@admin.register(StyleComplexity)
class StyleComplexityAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "rating", "buffer_percent", "is_active")
    search_fields = ("code", "name")
    list_filter = ("rating", "is_active")


@admin.register(Style)
class StyleAdmin(admin.ModelAdmin):
    list_display = ("style_code", "customer", "product_type", "overall_complexity", "status")
    search_fields = ("style_code", "description", "customer__code")
    list_filter = ("status", "product_type", "overall_complexity", "is_active")


@admin.register(BOMHeader)
class BOMHeaderAdmin(ApprovedReadOnlyMixin, admin.ModelAdmin):
    list_display = ("style", "version", "status", "effective_date", "approved_at")
    search_fields = ("style__style_code", "version")
    list_filter = ("status", "style__product_type", "is_active")
    inlines = [BOMLineInline]


@admin.register(OperationMaster)
class OperationMasterAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "operation_group", "default_machine_type", "is_active")
    search_fields = ("code", "name", "operation_group")
    list_filter = ("operation_group", "default_machine_type", "is_active")


@admin.register(OperationBulletin)
class OperationBulletinAdmin(ApprovedReadOnlyMixin, admin.ModelAdmin):
    list_display = ("style", "version", "status", "total_smv", "approved_at")
    search_fields = ("style__style_code", "version")
    list_filter = ("status", "style__product_type", "is_active")
    inlines = [OperationBulletinLineInline]


@admin.register(WashRoute)
class WashRouteAdmin(ApprovedReadOnlyMixin, admin.ModelAdmin):
    list_display = ("code", "name", "complexity", "status", "approved_at")
    search_fields = ("code", "name")
    list_filter = ("complexity", "status", "is_active")
    inlines = [WashRouteStepInline]
