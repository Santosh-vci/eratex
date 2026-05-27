from django.contrib import admin

from .models import CutBundle, CuttingJob, CuttingOutputEntry


class CutBundleInline(admin.TabularInline):
    model = CutBundle
    extra = 0


class CuttingOutputEntryInline(admin.TabularInline):
    model = CuttingOutputEntry
    extra = 0
    readonly_fields = ("net_cut_qty",)


@admin.register(CuttingJob)
class CuttingJobAdmin(admin.ModelAdmin):
    list_display = ("job_no", "order", "workcenter", "planned_quantity", "status", "risk_status")
    list_filter = ("status", "risk_status", "workcenter", "is_active")
    search_fields = ("job_no", "order__order_no", "release__release_no", "marker_no")
    inlines = [CuttingOutputEntryInline, CutBundleInline]


@admin.register(CuttingOutputEntry)
class CuttingOutputEntryAdmin(admin.ModelAdmin):
    list_display = ("client_event_id", "cutting_job", "output_qty", "net_cut_qty", "recorded_at")
    list_filter = ("recorded_at", "is_active")
    search_fields = ("client_event_id", "cutting_job__job_no")


@admin.register(CutBundle)
class CutBundleAdmin(admin.ModelAdmin):
    list_display = ("bundle_no", "cutting_job", "quantity", "shade_lot", "status")
    list_filter = ("status", "shade_lot", "is_active")
    search_fields = ("bundle_no", "cutting_job__job_no")
