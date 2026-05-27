import json

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command

from apps.audit_governance.models import AuditEvent
from apps.common.models import ApprovalStatus
from apps.style_technical.models import OperationBulletin, Style, WashRoute
from apps.style_technical.services.operation_bulletins import approve_bulletin, clone_bulletin
from apps.style_technical.services.readiness import get_style_planning_readiness
from apps.style_technical.services.wash_routes import approve_wash_route


@pytest.fixture
def phase2_data(db):
    call_command("seed_phase2", verbosity=0)


@pytest.mark.django_db
def test_seed_phase2_is_idempotent_and_keeps_blocker_style_incomplete(phase2_data):
    call_command("seed_phase2", verbosity=0)

    assert Style.objects.filter(style_code__startswith="STY-").count() == 6
    blocker = Style.objects.get(style_code="STY-DEN-NO-BULLETIN")
    readiness = get_style_planning_readiness(blocker)

    assert readiness["planningReady"] is False
    assert "APPROVED_BOM" in readiness["missingItems"]
    assert "APPROVED_OPERATION_BULLETIN" in readiness["missingItems"]
    assert "APPROVED_WASH_ROUTE" in readiness["missingItems"]


@pytest.mark.django_db
def test_bulletin_clone_and_approval_writes_audit(phase2_data):
    User = get_user_model()
    user = User.objects.get(username="ie_user")
    bulletin = OperationBulletin.objects.get(style__style_code="STY-DEN-BASIC", version="v1")

    cloned = clone_bulletin(bulletin, new_version="v2", created_by=user)
    approved = approve_bulletin(cloned, approved_by=user)

    assert approved.status == ApprovalStatus.APPROVED
    assert approved.lines.count() == bulletin.lines.count()
    assert AuditEvent.objects.filter(
        entity_type="OperationBulletin",
        action="approve",
        performed_by=user,
    ).exists()


@pytest.mark.django_db
def test_wash_route_cannot_approve_without_steps(phase2_data):
    route = WashRoute.objects.create(code="WASH-EMPTY", name="Empty Route")
    user = get_user_model().objects.get(username="business_admin")

    with pytest.raises(ValidationError):
        approve_wash_route(route, approved_by=user)


@pytest.mark.django_db
def test_phase2_api_readiness_and_rbac(client, phase2_data):
    User = get_user_model()
    client.force_login(User.objects.get(username="ie_user"))

    styles_response = client.get("/api/v1/styles")
    assert styles_response.status_code == 200
    styles = styles_response.json()["data"]
    blocker = next(item for item in styles if item["styleCode"] == "STY-DEN-NO-BULLETIN")
    readiness_response = client.get(f"/api/v1/styles/{blocker['id']}/planning-readiness")
    assert readiness_response.json()["data"]["planningReady"] is False

    bulletins_response = client.get("/api/v1/operation-bulletins")
    bulletin_id = bulletins_response.json()["data"][0]["id"]
    detail_response = client.get(f"/api/v1/operation-bulletins/{bulletin_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["operations"]

    clone_response = client.post(
        f"/api/v1/operation-bulletins/{bulletin_id}/clone",
        data=json.dumps({"version": "api-v2"}),
        content_type="application/json",
    )
    assert clone_response.status_code == 201

    client.force_login(User.objects.get(username="supervisor"))
    denied_response = client.get("/api/v1/master/customers")
    assert denied_response.status_code == 403
    assert denied_response.json()["errors"][0]["code"] == "PERMISSION_DENIED"
