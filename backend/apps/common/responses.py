from typing import Any

from django.http import JsonResponse


def api_response(
    data: Any = None,
    *,
    meta: dict[str, Any] | None = None,
    errors: list[dict[str, Any]] | None = None,
    status: int = 200,
) -> JsonResponse:
    return JsonResponse(
        {
            "data": data,
            "meta": meta or {},
            "errors": errors or [],
        },
        status=status,
    )

