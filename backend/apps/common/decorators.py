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
