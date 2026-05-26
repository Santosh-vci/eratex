import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.audit_governance.admin import AuditEventAdmin
from apps.audit_governance.models import AuditEvent
from apps.audit_governance.services.audit import write_audit_event


@pytest.mark.django_db
def test_write_audit_event_service():
    user = get_user_model().objects.create_user(username="auditor", password="secret")

    event = write_audit_event(
        event_code="test.created",
        entity_type="TestEntity",
        entity_id="T-1",
        entity_display_code="T-1",
        action="created",
        performed_by=user,
        new_value_json={"status": "READY"},
        reason="Unit test",
        metadata={"source": "pytest"},
    )

    assert event.id
    assert event.performed_by == user
    assert event.new_value_json["status"] == "READY"


@pytest.mark.django_db
def test_audit_lookup_api(client):
    call_command("seed_phase1")
    client.post(
        "/api/v1/auth/login",
        data='{"username": "planner", "password": "planning123"}',
        content_type="application/json",
    )
    write_audit_event(
        event_code="entity.changed",
        entity_type="Order",
        entity_id="ORD-1",
        action="changed",
    )

    response = client.get("/api/v1/audit/Order/ORD-1")

    assert response.status_code == 200
    assert response.json()["data"][0]["eventCode"] == "entity.changed"


def test_audit_event_admin_is_read_only(rf):
    request = rf.get("/")
    model_admin = AuditEventAdmin(AuditEvent, admin.site)

    assert not model_admin.has_add_permission(request)
    assert not model_admin.has_change_permission(request)
    assert not model_admin.has_delete_permission(request)
