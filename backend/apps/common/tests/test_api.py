from unittest.mock import Mock

import pytest
from django.db import connection


def test_ping_response_envelope(client):
    response = client.get("/api/v1/ping")

    assert response.status_code == 200
    assert response.json() == {"data": {"status": "ok"}, "meta": {}, "errors": []}


@pytest.mark.django_db
def test_database_connection_works():
    connection.ensure_connection()
    assert connection.connection is not None


@pytest.mark.django_db
def test_health_response_ok(monkeypatch, client):
    redis_client = Mock()
    redis_client.ping.return_value = True
    monkeypatch.setattr("apps.common.views.Redis.from_url", Mock(return_value=redis_client))

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["status"] == "ok"
    assert payload["data"]["checks"]["database"]["status"] == "ok"
    assert payload["data"]["checks"]["redis"]["status"] == "ok"
    assert payload["errors"] == []
    redis_client.close.assert_called_once()


@pytest.mark.django_db
def test_health_response_degraded_when_redis_is_unavailable(monkeypatch, client):
    monkeypatch.setattr(
        "apps.common.views.Redis.from_url",
        Mock(side_effect=ConnectionError("redis unavailable")),
    )

    response = client.get("/health")

    assert response.status_code == 503
    payload = response.json()
    assert payload["data"]["status"] == "degraded"
    assert payload["data"]["checks"]["database"]["status"] == "ok"
    assert payload["data"]["checks"]["redis"]["status"] == "error"
    assert payload["errors"][0]["code"] == "REDIS_UNAVAILABLE"
