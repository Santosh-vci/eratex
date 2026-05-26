from django.contrib import admin

from .models import (
    LineMachineAssignment,
    LineProfile,
    Machine,
    MachineType,
    Operator,
    OperatorSkill,
    WorkcenterCapacityDay,
)


class OperatorSkillInline(admin.TabularInline):
    model = OperatorSkill
    extra = 0


@admin.register(MachineType)
class MachineTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "is_active")
    search_fields = ("code", "name")
    list_filter = ("category", "is_active")


@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "machine_type", "factory", "status", "current_line")
    search_fields = ("code", "name", "machine_type__code")
    list_filter = ("machine_type", "status", "factory", "is_active")


@admin.register(LineProfile)
class LineProfileAdmin(admin.ModelAdmin):
    list_display = (
        "line",
        "standard_manpower",
        "current_manpower",
        "baseline_efficiency",
        "shift_calendar",
    )
    search_fields = ("line__code", "line__name")
    list_filter = ("line__factory", "is_active")
    filter_horizontal = ("allowed_product_types",)


@admin.register(LineMachineAssignment)
class LineMachineAssignmentAdmin(admin.ModelAdmin):
    list_display = ("line", "machine", "assigned_from", "assigned_to", "is_active")
    search_fields = ("line__code", "machine__code")
    list_filter = ("line__factory", "machine__machine_type", "is_active")


@admin.register(WorkcenterCapacityDay)
class WorkcenterCapacityDayAdmin(admin.ModelAdmin):
    list_display = ("workcenter", "capacity_date", "available_minutes", "capacity_value", "source")
    search_fields = ("workcenter__code",)
    list_filter = ("workcenter", "source", "is_active")


@admin.register(Operator)
class OperatorAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "display_name", "factory", "line", "is_active")
    search_fields = ("employee_code", "display_name")
    list_filter = ("factory", "line", "is_active")
    inlines = [OperatorSkillInline]
