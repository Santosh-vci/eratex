from django.contrib import admin

from .models import PlanChangeRequest, PlannedWorkItem, PlanningHorizon, PlanVersion


class PlannedWorkItemInline(admin.TabularInline):
    model = PlannedWorkItem
    extra = 0
    fields = (
        "order",
        "workcenter",
        "planned_start_date",
        "planned_end_date",
        "planned_quantity",
        "load_minutes",
        "status",
        "risk_status",
        "locked",
    )


@admin.register(PlanningHorizon)
class PlanningHorizonAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "start_date", "end_date", "status", "is_current")
    search_fields = ("code", "name")
    list_filter = ("status", "is_current", "factory")


@admin.register(PlanVersion)
class PlanVersionAdmin(admin.ModelAdmin):
    list_display = ("horizon", "version_no", "status", "risk_status", "frozen_at", "frozen_by")
    search_fields = ("horizon__code",)
    list_filter = ("status", "risk_status", "horizon__factory")
    inlines = [PlannedWorkItemInline]


@admin.register(PlannedWorkItem)
class PlannedWorkItemAdmin(admin.ModelAdmin):
    list_display = (
        "plan_version",
        "order",
        "workcenter",
        "planned_start_date",
        "planned_quantity",
        "status",
        "risk_status",
        "locked",
    )
    search_fields = ("order__order_no", "workcenter__code")
    list_filter = ("status", "risk_status", "workcenter", "locked")


@admin.register(PlanChangeRequest)
class PlanChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("plan_version", "change_type", "status", "requested_by", "approved_by")
    search_fields = ("plan_version__horizon__code", "reason")
    list_filter = ("change_type", "status")
