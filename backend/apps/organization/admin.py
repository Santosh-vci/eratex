from django.contrib import admin

from .models import Department, Factory, HolidayCalendar, Line, ShiftCalendar, Workcenter


@admin.register(Factory)
class FactoryAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "timezone", "is_active")
    search_fields = ("code", "name")
    list_filter = ("is_active",)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "factory", "department_type", "is_active")
    search_fields = ("code", "name", "factory__code")
    list_filter = ("factory", "department_type", "is_active")


@admin.register(Workcenter)
class WorkcenterAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "factory", "department", "workcenter_type", "capacity_unit")
    search_fields = ("code", "name", "factory__code")
    list_filter = ("factory", "workcenter_type", "is_active")


@admin.register(Line)
class LineAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "factory", "department", "workcenter", "line_type", "is_active")
    search_fields = ("code", "name", "factory__code")
    list_filter = ("factory", "line_type", "is_active")


@admin.register(ShiftCalendar)
class ShiftCalendarAdmin(admin.ModelAdmin):
    list_display = ("name", "factory", "start_time", "end_time", "working_minutes", "is_default")
    search_fields = ("name", "factory__code")
    list_filter = ("factory", "is_default", "is_active")


@admin.register(HolidayCalendar)
class HolidayCalendarAdmin(admin.ModelAdmin):
    list_display = ("holiday_date", "name", "factory", "is_active")
    search_fields = ("name", "factory__code")
    list_filter = ("factory", "holiday_date", "is_active")
