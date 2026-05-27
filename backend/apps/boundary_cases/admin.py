from django.contrib import admin

from apps.boundary_cases.models import BoundaryCaseEvent, BoundaryImpactPreview


class BoundaryImpactPreviewInline(admin.TabularInline):
    model = BoundaryImpactPreview
    extra = 0
    readonly_fields = (
        "preview_type",
        "risk_before",
        "risk_after",
        "approval_required",
        "created_at",
    )
    can_delete = False


@admin.register(BoundaryCaseEvent)
class BoundaryCaseEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_no",
        "event_type",
        "status",
        "severity",
        "linked_order",
        "linked_workcenter",
        "approval_required",
        "created_at",
    )
    list_filter = ("event_type", "status", "severity", "approval_required")
    search_fields = ("event_no", "linked_order__order_no", "linked_workcenter__code")
    readonly_fields = ("event_no", "created_at", "updated_at")
    inlines = [BoundaryImpactPreviewInline]


@admin.register(BoundaryImpactPreview)
class BoundaryImpactPreviewAdmin(admin.ModelAdmin):
    list_display = (
        "preview_type",
        "boundary_case_event",
        "risk_before",
        "risk_after",
        "approval_required",
    )
    list_filter = ("preview_type", "risk_after", "approval_required")
    readonly_fields = ("created_at", "updated_at")
