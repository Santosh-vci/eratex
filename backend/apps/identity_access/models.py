from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class UserProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    display_name = models.CharField(max_length=160)
    employee_code = models.CharField(max_length=64, blank=True)
    current_factory = models.ForeignKey(
        "organization.Factory",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="user_profiles",
    )
    department = models.ForeignKey(
        "organization.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="user_profiles",
    )

    def __str__(self) -> str:
        return self.display_name


class Role(BaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


class PermissionAction(BaseModel):
    code = models.CharField(max_length=120, unique=True)
    name = models.CharField(max_length=160)
    module = models.CharField(max_length=80)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["module", "code"]

    def __str__(self) -> str:
        return self.code


class UserRole(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_roles"
    )
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")
    factory = models.ForeignKey(
        "organization.Factory",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="user_roles",
    )

    class Meta:
        ordering = ["user__username", "role__code"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "role", "factory"], name="unique_user_role_factory"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user.username}:{self.role.code}"


class RolePermission(BaseModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(
        PermissionAction,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    class Meta:
        ordering = ["role__code", "permission__code"]
        constraints = [
            models.UniqueConstraint(fields=["role", "permission"], name="unique_role_permission")
        ]

    def __str__(self) -> str:
        return f"{self.role.code}:{self.permission.code}"


class UserScope(BaseModel):
    class ScopeType(models.TextChoices):
        GLOBAL = "GLOBAL", "Global"
        FACTORY = "FACTORY", "Factory"
        DEPARTMENT = "DEPARTMENT", "Department"
        WORKCENTER = "WORKCENTER", "Workcenter"
        LINE = "LINE", "Line"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_scopes"
    )
    scope_type = models.CharField(max_length=32, choices=ScopeType.choices)
    factory = models.ForeignKey(
        "organization.Factory",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="user_scopes",
    )
    department = models.ForeignKey(
        "organization.Department",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="user_scopes",
    )
    workcenter = models.ForeignKey(
        "organization.Workcenter",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="user_scopes",
    )
    line = models.ForeignKey(
        "organization.Line",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="user_scopes",
    )

    class Meta:
        ordering = ["user__username", "scope_type"]

    def __str__(self) -> str:
        return f"{self.user.username}:{self.scope_type}"
