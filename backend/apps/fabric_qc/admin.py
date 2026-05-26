from django.contrib import admin

from apps.fabric_qc.models import (
    FabricLot,
    FabricQCInspection,
    FabricQCParameterResult,
    FabricRoll,
)


class FabricRollInline(admin.TabularInline):
    model = FabricRoll
    extra = 0


class FabricQCParameterResultInline(admin.TabularInline):
    model = FabricQCParameterResult
    extra = 0


@admin.register(FabricLot)
class FabricLotAdmin(admin.ModelAdmin):
    list_display = ("lot_no", "order", "received_qty", "received_date", "status")
    list_filter = ("status", "received_date")
    search_fields = ("lot_no", "order__order_no")
    inlines = [FabricRollInline]


@admin.register(FabricRoll)
class FabricRollAdmin(admin.ModelAdmin):
    list_display = ("fabric_lot", "roll_no", "roll_length", "qc_status")
    list_filter = ("qc_status",)
    search_fields = ("fabric_lot__lot_no", "roll_no", "fabric_lot__order__order_no")


@admin.register(FabricQCInspection)
class FabricQCInspectionAdmin(admin.ModelAdmin):
    list_display = ("fabric_roll", "inspection_date", "status", "inspected_by")
    list_filter = ("status", "inspection_date")
    search_fields = ("fabric_roll__roll_no", "fabric_roll__fabric_lot__lot_no")
    inlines = [FabricQCParameterResultInline]


admin.site.register(FabricQCParameterResult)
