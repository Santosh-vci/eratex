from apps.identity_access.models import UserScope


def get_user_scope(user) -> list[UserScope]:
    if not user.is_authenticated:
        return []
    return list(
        UserScope.objects.filter(user=user, is_active=True)
        .select_related("factory", "department", "workcenter", "line")
        .order_by("scope_type")
    )


def user_can_access_factory(user, factory_id) -> bool:
    if user.is_superuser:
        return True
    scopes = get_user_scope(user)
    return any(
        scope.scope_type == UserScope.ScopeType.GLOBAL
        or (scope.factory_id is not None and scope.factory_id == factory_id)
        for scope in scopes
    )
