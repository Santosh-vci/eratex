from typing import Any

from django.http import JsonResponse

from .errors import ApiError


def api_response(
    data: Any = None,
    *,
    meta: dict[str, Any] | None = None,
    errors: list[dict[str, Any] | ApiError] | None = None,
    status: int = 200,
) -> JsonResponse:
    normalized_errors = [
        error.as_dict() if isinstance(error, ApiError) else error for error in (errors or [])
    ]
    return JsonResponse(
        {
            "data": data,
            "meta": meta or {},
            "errors": normalized_errors,
        },
        status=status,
    )
