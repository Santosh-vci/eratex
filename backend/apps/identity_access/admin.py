from django.contrib import admin

from .models import PermissionAction, Role, RolePermission, UserProfile, UserRole, UserScope


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "user",
        "employee_code",
        "current_factory",
        "department",
        "is_active",
    )
    search_fields = ("display_name", "employee_code", "user__username", "user__email")
    list_filter = ("current_factory", "department", "is_active")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_system", "is_active")
    search_fields = ("code", "name")
    list_filter = ("is_system", "is_active")


@admin.register(PermissionAction)
class PermissionActionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "module", "is_active")
    search_fields = ("code", "name", "module")
    list_filter = ("module", "is_active")


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "factory", "is_active")
    search_fields = ("user__username", "role__code", "factory__code")
    list_filter = ("role", "factory", "is_active")


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "permission", "is_active")
    search_fields = ("role__code", "permission__code")
    list_filter = ("role", "permission__module", "is_active")


@admin.register(UserScope)
class UserScopeAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "scope_type",
        "factory",
        "department",
        "workcenter",
        "line",
        "is_active",
    )
    search_fields = (
        "user__username",
        "factory__code",
        "department__code",
        "workcenter__code",
        "line__code",
    )
    list_filter = ("scope_type", "factory", "is_active")
