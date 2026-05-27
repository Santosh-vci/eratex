from django.contrib import admin

from .models import WipHandover, WipLot, WipMovement


@admin.register(WipLot)
class WipLotAdmin(admin.ModelAdmin):
    list_display = ("lot_no", "order", "stage", "quantity", "available_quantity", "status")
    list_filter = ("stage", "status", "risk_status", "is_active")
    search_fields = ("lot_no", "order__order_no", "color_code", "shade_lot")


@admin.register(WipMovement)
class WipMovementAdmin(admin.ModelAdmin):
    list_display = ("movement_no", "order", "from_stage", "to_stage", "quantity", "movement_type")
    list_filter = ("movement_type", "from_stage", "to_stage", "is_active")
    search_fields = ("movement_no", "order__order_no")


@admin.register(WipHandover)
class WipHandoverAdmin(admin.ModelAdmin):
    list_display = ("handover_no", "order", "target_stage", "quantity", "status")
    list_filter = ("target_stage", "status", "is_active")
    search_fields = ("handover_no", "order__order_no")
