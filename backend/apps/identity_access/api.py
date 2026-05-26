import json

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from apps.audit_governance.services.audit import write_audit_event
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.identity_access.models import PermissionAction
from apps.identity_access.services.permissions import get_user_permission_codes, get_user_roles
from apps.identity_access.services.scopes import get_user_scope


def serialize_scope(scope) -> dict[str, object]:
    return {
        "id": str(scope.id),
        "scopeType": scope.scope_type,
        "factoryId": str(scope.factory_id) if scope.factory_id else None,
        "departmentId": str(scope.department_id) if scope.department_id else None,
        "workcenterId": str(scope.workcenter_id) if scope.workcenter_id else None,
        "lineId": str(scope.line_id) if scope.line_id else None,
    }


def serialize_current_user(user) -> dict[str, object]:
    profile = getattr(user, "profile", None)
    roles = get_user_roles(user)
    permissions = sorted(get_user_permission_codes(user))
    scopes = get_user_scope(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "displayName": profile.display_name if profile else user.get_full_name() or user.username,
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
        "roles": [
            {
                "id": str(user_role.role_id),
                "code": user_role.role.code,
                "name": user_role.role.name,
                "factoryId": str(user_role.factory_id) if user_role.factory_id else None,
            }
            for user_role in roles
        ],
        "permissions": permissions,
        "scopes": [serialize_scope(scope) for scope in scopes],
        "featureFlags": {},
    }


@require_GET
def me_view(request):
    if not request.user.is_authenticated:
        return api_response(
            None,
            errors=error_response("AUTH_REQUIRED", "Authentication is required."),
            status=401,
        )
    return api_response(serialize_current_user(request.user))


@require_GET
def permissions_view(request):
    if not request.user.is_authenticated:
        return api_response(
            None,
            errors=error_response("AUTH_REQUIRED", "Authentication is required."),
            status=401,
        )
    if request.user.is_superuser:
        permissions = PermissionAction.objects.filter(is_active=True)
        return api_response(
            [
                {
                    "id": str(permission.id),
                    "code": permission.code,
                    "name": permission.name,
                    "module": permission.module,
                }
                for permission in permissions
            ]
        )
    return api_response(sorted(get_user_permission_codes(request.user)))


@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    return api_response({"csrfToken": get_token(request)})


@require_POST
def login_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return api_response(
            None,
            errors=error_response("INVALID_JSON", "Request body must be valid JSON."),
            status=400,
        )

    username = payload.get("username")
    password = payload.get("password")
    user = authenticate(request, username=username, password=password)
    if user is None or not user.is_active:
        return api_response(
            None,
            errors=error_response("INVALID_CREDENTIALS", "Username or password is invalid."),
            status=400,
        )

    login(request, user)
    write_audit_event(
        event_code="auth.login",
        entity_type="User",
        entity_id=str(user.id),
        action="login",
        performed_by=user,
        source="WEB",
    )
    return api_response(serialize_current_user(user))


@require_POST
def logout_view(request):
    user = request.user if request.user.is_authenticated else None
    if user:
        write_audit_event(
            event_code="auth.logout",
            entity_type="User",
            entity_id=str(user.id),
            action="logout",
            performed_by=user,
            source="WEB",
        )
    logout(request)
    return api_response({"status": "ok"})
