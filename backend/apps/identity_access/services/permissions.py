from django.contrib.auth.models import AnonymousUser

from apps.identity_access.models import PermissionAction, UserRole


def get_user_permission_codes(user) -> set[str]:
    if isinstance(user, AnonymousUser) or not user.is_authenticated or not user.is_active:
        return set()

    return set(
        PermissionAction.objects.filter(
            role_permissions__role__user_roles__user=user,
            role_permissions__is_active=True,
            role_permissions__role__user_roles__is_active=True,
            is_active=True,
        )
        .values_list("code", flat=True)
        .distinct()
    )


def user_has_permission(user, permission_code: str) -> bool:
    if user.is_superuser:
        return True
    return permission_code in get_user_permission_codes(user)


def get_user_roles(user) -> list[UserRole]:
    if isinstance(user, AnonymousUser) or not user.is_authenticated:
        return []
    return list(
        UserRole.objects.filter(user=user, is_active=True, role__is_active=True)
        .select_related("role", "factory")
        .order_by("role__code")
    )
