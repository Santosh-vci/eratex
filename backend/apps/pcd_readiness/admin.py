from django.contrib import admin

from apps.pcd_readiness.models import ConditionalRelease, PCDReadiness, PCDReadinessItem


class PCDReadinessItemInline(admin.TabularInline):
    model = PCDReadinessItem
    extra = 0


class ConditionalReleaseInline(admin.TabularInline):
    model = ConditionalRelease
    extra = 0


@admin.register(PCDReadiness)
class PCDReadinessAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "planned_pcd_date",
        "readiness_status",
        "conditional_release",
        "conditional_release_expiry",
        "released_to_cutting_at",
    )
    list_filter = ("readiness_status", "conditional_release", "planned_pcd_date")
    search_fields = ("order__order_no",)
    inlines = [PCDReadinessItemInline, ConditionalReleaseInline]


@admin.register(PCDReadinessItem)
class PCDReadinessItemAdmin(admin.ModelAdmin):
    list_display = ("pcd_readiness", "item_code", "is_mandatory", "status", "due_date")
    list_filter = ("status", "is_mandatory", "item_code")
    search_fields = ("pcd_readiness__order__order_no", "item_code", "item_label")


@admin.register(ConditionalRelease)
class ConditionalReleaseAdmin(admin.ModelAdmin):
    list_display = (
        "pcd_readiness",
        "status",
        "expiry_date",
        "requested_by",
        "approved_by",
        "approved_at",
    )
    list_filter = ("status", "expiry_date")
    search_fields = ("pcd_readiness__order__order_no", "reason", "risk_note")
