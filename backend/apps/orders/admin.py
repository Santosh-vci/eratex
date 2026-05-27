from django.contrib import admin

from apps.orders.models import (
    OrderChangeRequest,
    OrderLifecycleEvent,
    OrderLine,
    OrderMilestone,
    ProductionOrder,
)


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0


class OrderMilestoneInline(admin.TabularInline):
    model = OrderMilestone
    extra = 0


@admin.register(ProductionOrder)
class ProductionOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_no",
        "po_number",
        "customer",
        "style",
        "order_qty",
        "planned_pcd_date",
        "committed_ship_date",
        "current_stage",
        "risk_status",
    )
    list_filter = ("current_stage", "risk_status", "order_status", "customer")
    search_fields = ("order_no", "po_number", "style__style_code")
    inlines = [OrderLineInline, OrderMilestoneInline]


@admin.register(OrderLifecycleEvent)
class OrderLifecycleEventAdmin(admin.ModelAdmin):
    list_display = ("order", "event_code", "from_stage", "to_stage", "performed_by", "created_at")
    list_filter = ("event_code", "to_stage")
    search_fields = ("order__order_no", "event_code", "message")
    readonly_fields = ("created_at", "updated_at")


@admin.register(OrderChangeRequest)
class OrderChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("request_no", "order", "change_type", "status", "requested_by", "approved_by")
    list_filter = ("change_type", "status", "disposition_required")
    search_fields = ("request_no", "order__order_no", "reason")
    readonly_fields = ("request_no", "created_at", "updated_at")


admin.site.register(OrderLine)
admin.site.register(OrderMilestone)
