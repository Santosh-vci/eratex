from django.contrib import admin

from .models import (
    CapacityAdjustment,
    LineMachineAssignment,
    LineProfile,
    Machine,
    MachineType,
    Operator,
    OperatorSkill,
    WorkcenterCapacityDay,
    WorkcenterCapacityDefinition,
    WorkcenterLoadSnapshot,
    WorkcenterQueueSnapshot,
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


@admin.register(WorkcenterCapacityDefinition)
class WorkcenterCapacityDefinitionAdmin(admin.ModelAdmin):
    list_display = (
        "workcenter_type",
        "capacity_unit",
        "planning_bucket",
        "primary_constraint_resource",
        "normal_capacity_value",
        "overtime_allowed",
        "active_status",
    )
    search_fields = ("workcenter_type", "primary_constraint_resource")
    list_filter = (
        "capacity_unit",
        "planning_bucket",
        "primary_constraint_resource",
        "active_status",
    )


@admin.register(WorkcenterLoadSnapshot)
class WorkcenterLoadSnapshotAdmin(admin.ModelAdmin):
    list_display = (
        "workcenter",
        "snapshot_date",
        "utilization_percent",
        "constraint_status",
        "risk_status",
    )
    search_fields = ("workcenter__code", "top_affected_order__order_no")
    list_filter = ("constraint_status", "risk_status", "snapshot_date")


@admin.register(WorkcenterQueueSnapshot)
class WorkcenterQueueSnapshotAdmin(admin.ModelAdmin):
    list_display = ("workcenter", "snapshot_date", "order", "queue_stage", "queue_quantity")
    search_fields = ("workcenter__code", "order__order_no", "queue_stage")
    list_filter = ("queue_stage", "risk_status", "snapshot_date")


@admin.register(CapacityAdjustment)
class CapacityAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("workcenter", "adjustment_date", "adjustment_type", "minutes_delta", "status")
    search_fields = ("workcenter__code", "reason")
    list_filter = ("adjustment_type", "status", "adjustment_date")


@admin.register(Operator)
class OperatorAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "display_name", "factory", "line", "is_active")
    search_fields = ("employee_code", "display_name")
    list_filter = ("factory", "line", "is_active")
    inlines = [OperatorSkillInline]
