import json

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.audit_governance.models import AuditEvent
from apps.identity_access.models import PermissionAction, Role, RolePermission, UserRole
from apps.identity_access.services.permissions import get_user_permission_codes, user_has_permission
from apps.identity_access.services.scopes import user_can_access_factory
from apps.organization.models import Factory


@pytest.fixture
def phase1_seed(db):
    call_command("seed_phase1")


@pytest.mark.django_db
def test_permission_check_uses_active_roles_and_permissions(phase1_seed):
    user = get_user_model().objects.get(username="planner")

    assert user_has_permission(user, "planning.view")
    assert "orders.view" in get_user_permission_codes(user)


@pytest.mark.django_db
def test_permission_check_blocks_inactive_user(phase1_seed):
    user = get_user_model().objects.get(username="planner")
    user.is_active = False
    user.save()

    assert not user_has_permission(user, "planning.view")


@pytest.mark.django_db
def test_factory_scope_check(phase1_seed):
    user = get_user_model().objects.get(username="planner")
    factory = Factory.objects.get(code="UNIT-04")
    other_factory = Factory.objects.create(code="UNIT-99", name="Other Factory")

    assert user_can_access_factory(user, factory.id)
    assert not user_can_access_factory(user, other_factory.id)


@pytest.mark.django_db
def test_me_requires_authentication(client):
    response = client.get("/api/v1/me")

    assert response.status_code == 401
    assert response.json()["errors"][0]["code"] == "AUTH_REQUIRED"


@pytest.mark.django_db
def test_login_me_permissions_and_logout_flow(client, phase1_seed):
    response = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"username": "planner", "password": "planning123"}),
        content_type="application/json",
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["username"] == "planner"
    assert "planning.view" in payload["permissions"]
    assert payload["roles"][0]["code"] == "PLANNER"
    assert AuditEvent.objects.filter(event_code="auth.login", entity_type="User").exists()

    me_response = client.get("/api/v1/me")
    assert me_response.status_code == 200
    assert me_response.json()["data"]["username"] == "planner"

    permissions_response = client.get("/api/v1/permissions")
    assert permissions_response.status_code == 200
    assert "foundation.view" in permissions_response.json()["data"]

    logout_response = client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 200
    assert AuditEvent.objects.filter(event_code="auth.logout", entity_type="User").exists()


@pytest.mark.django_db
def test_login_rejects_invalid_credentials(client, phase1_seed):
    response = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"username": "planner", "password": "bad"}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["errors"][0]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.django_db
def test_role_permission_models_can_be_configured():
    User = get_user_model()
    user = User.objects.create_user(username="rbac-user", password="secret")
    role = Role.objects.create(code="TEST_ROLE", name="Test Role")
    permission = PermissionAction.objects.create(
        code="test.view",
        name="View Test",
        module="Test",
    )
    RolePermission.objects.create(role=role, permission=permission)
    UserRole.objects.create(user=user, role=role)

    assert user_has_permission(user, "test.view")
