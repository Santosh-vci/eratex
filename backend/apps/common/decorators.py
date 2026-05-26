from collections.abc import Callable
from functools import wraps

from django.http import HttpRequest, JsonResponse

from .errors import error_response
from .responses import api_response


def api_login_required(view_func: Callable[..., JsonResponse]) -> Callable[..., JsonResponse]:
    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        if not request.user.is_authenticated:
            return api_response(
                None,
                errors=error_response("AUTH_REQUIRED", "Authentication is required."),
                status=401,
            )
        return view_func(request, *args, **kwargs)

    return wrapper


def api_permission_required(
    permission_code: str,
) -> Callable[[Callable[..., JsonResponse]], Callable[..., JsonResponse]]:
    def decorator(view_func: Callable[..., JsonResponse]) -> Callable[..., JsonResponse]:
        @wraps(view_func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            if not request.user.is_authenticated:
                return api_response(
                    None,
                    errors=error_response("AUTH_REQUIRED", "Authentication is required."),
                    status=401,
                )
            from apps.identity_access.services.permissions import user_has_permission

            if not user_has_permission(request.user, permission_code):
                return api_response(
                    None,
                    errors=error_response("PERMISSION_DENIED", "Permission denied."),
                    status=403,
                )
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
