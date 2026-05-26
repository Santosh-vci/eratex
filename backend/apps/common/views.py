from django.conf import settings
from django.db import connection
from django.views.decorators.http import require_GET
from redis import Redis

from .responses import api_response


@require_GET
def ping_view(_request):
    return api_response({"status": "ok"})


@require_GET
def health_view(_request):
    checks = {
        "database": {"status": "ok"},
        "redis": {"status": "ok"},
    }
    errors = []

    try:
        connection.ensure_connection()
    except Exception as exc:  # pragma: no cover - driver-specific message
        checks["database"] = {"status": "error"}
        errors.append(
            {
                "code": "DATABASE_UNAVAILABLE",
                "message": "Database connection failed.",
                "field": None,
                "details": {"error": str(exc)},
            }
        )

    redis_client = None
    try:
        redis_client = Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        redis_client.ping()
    except Exception as exc:
        checks["redis"] = {"status": "error"}
        errors.append(
            {
                "code": "REDIS_UNAVAILABLE",
                "message": "Redis connection failed.",
                "field": None,
                "details": {"error": str(exc)},
            }
        )
    finally:
        if redis_client is not None:
            redis_client.close()

    status_code = 200 if not errors else 503
    overall = "ok" if not errors else "degraded"
    return api_response({"status": overall, "checks": checks}, errors=errors, status=status_code)
