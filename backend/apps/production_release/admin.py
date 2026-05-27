from django.contrib import admin

from .models import ProductionRelease, ReleaseBlocker, ReleaseValidationResult


class ReleaseBlockerInline(admin.TabularInline):
    model = ReleaseBlocker
    extra = 0


@admin.register(ProductionRelease)
class ProductionReleaseAdmin(admin.ModelAdmin):
    list_display = ("release_no", "order", "workcenter", "release_date", "status", "risk_status")
    search_fields = ("release_no", "order__order_no", "workcenter__code")
    list_filter = ("status", "risk_status", "release_type", "release_date")
    inlines = [ReleaseBlockerInline]


@admin.register(ReleaseValidationResult)
class ReleaseValidationResultAdmin(admin.ModelAdmin):
    list_display = ("order", "release", "is_valid", "risk_status", "checked_at")
    search_fields = ("order__order_no", "release__release_no")
    list_filter = ("is_valid", "risk_status")
    readonly_fields = ("checks", "blockers", "checked_at")
    inlines = [ReleaseBlockerInline]


@admin.register(ReleaseBlocker)
class ReleaseBlockerAdmin(admin.ModelAdmin):
    list_display = ("blocker_code", "release", "severity", "owner_role", "resolved")
    search_fields = ("blocker_code", "message", "release__release_no")
    list_filter = ("severity", "owner_role", "resolved")
