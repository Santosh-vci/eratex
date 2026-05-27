from django.contrib import admin

from .models import (
    LineRealignmentGap,
    LineRealignmentRequest,
    SewingLineAssignment,
    SewingLineLoading,
    SewingOutputCorrection,
    SewingOutputEntry,
)


class SewingLineAssignmentInline(admin.TabularInline):
    model = SewingLineAssignment
    extra = 0


class LineRealignmentGapInline(admin.TabularInline):
    model = LineRealignmentGap
    extra = 0


@admin.register(SewingLineLoading)
class SewingLineLoadingAdmin(admin.ModelAdmin):
    list_display = (
        "loading_no",
        "order",
        "line",
        "bulletin",
        "planned_quantity",
        "status",
        "risk_status",
    )
    list_filter = ("status", "risk_status", "planning_zone", "line", "is_active")
    search_fields = ("loading_no", "order__order_no", "line__code", "bulletin__style__style_code")
    inlines = [SewingLineAssignmentInline]


@admin.register(LineRealignmentRequest)
class LineRealignmentRequestAdmin(admin.ModelAdmin):
    list_display = (
        "request_no",
        "line",
        "order",
        "status",
        "expected_output_before",
        "expected_output_after",
    )
    list_filter = ("status", "fit_status", "risk_status", "approval_required", "is_active")
    search_fields = ("request_no", "order__order_no", "line__code", "bulletin__style__style_code")
    inlines = [LineRealignmentGapInline]


@admin.register(SewingOutputEntry)
class SewingOutputEntryAdmin(admin.ModelAdmin):
    list_display = (
        "client_event_id",
        "line_loading",
        "line",
        "time_slot",
        "gross_qty",
        "net_good_qty",
    )
    list_filter = ("line", "source", "entry_time", "is_active")
    search_fields = ("client_event_id", "line_loading__loading_no", "order__order_no")


@admin.register(SewingOutputCorrection)
class SewingOutputCorrectionAdmin(admin.ModelAdmin):
    list_display = ("output_entry", "corrected_by", "created_at")
    search_fields = ("output_entry__client_event_id", "reason")
