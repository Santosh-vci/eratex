import json

import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command

from apps.audit_governance.models import AuditEvent
from apps.orders.models import ProductionOrder
from apps.organization.models import Workcenter
from apps.planning.models import PlannedWorkItem, PlanningHorizon, PlanVersion
from apps.planning.services.planning import (
    assign_work_item,
    calculate_plan_impact,
    create_plan_version,
    freeze_plan,
)
from apps.production_release.models import ProductionRelease
from apps.production_release.services.release import validate_release
from apps.workcenters.models import WorkcenterLoadSnapshot


@pytest.fixture
def eos04_data(db):
    call_command("seed_eos04", verbosity=0)


@pytest.mark.django_db
def test_eos04_seed_is_idempotent_and_creates_planning_release_scenarios(eos04_data):
    call_command("seed_eos04", verbosity=0)

    assert PlanningHorizon.objects.filter(is_current=True).count() == 1
    assert PlanVersion.objects.filter(status="FROZEN").exists()
    assert PlannedWorkItem.objects.filter(status="BLOCKED").exists()
    assert WorkcenterLoadSnapshot.objects.filter(constraint_status="CRITICAL").exists()
    assert ProductionRelease.objects.filter(release_no__startswith="REL-").count() >= 2


@pytest.mark.django_db
def test_planning_services_calculate_impact_freeze_and_audit(eos04_data):
    user = get_user_model().objects.get(username="planner")
    horizon = PlanningHorizon.objects.get(is_current=True)
    plan = create_plan_version(horizon=horizon, created_by=user)
    order = ProductionOrder.objects.get(order_no="ORD-HP-001")
    workcenter = Workcenter.objects.get(code="CUTTING")

    before_count = PlannedWorkItem.objects.count()
    impact = calculate_plan_impact(
        plan_version=plan,
        order=order,
        workcenter=workcenter,
        planned_quantity=120,
        planned_start_date=horizon.start_date,
    )
    assert impact["writeApplied"] is False
    assert PlannedWorkItem.objects.count() == before_count

    assign_work_item(
        plan_version=plan,
        order=order,
        workcenter=workcenter,
        planned_quantity=120,
        planned_start_date=horizon.start_date,
        assigned_by=user,
    )
    frozen = freeze_plan(plan, frozen_by=user)
    assert frozen.status == "FROZEN"
    assert AuditEvent.objects.filter(event_code="PLAN_VERSION_FROZEN").exists()

    with pytest.raises(ValidationError):
        assign_work_item(
            plan_version=frozen,
            order=order,
            workcenter=workcenter,
            planned_quantity=100,
            planned_start_date=horizon.start_date,
            assigned_by=user,
        )


@pytest.mark.django_db
def test_release_validation_blocks_fabric_qc_and_load_constraints(eos04_data):
    blocked_release = ProductionRelease.objects.get(order__order_no="ORD-FABQC-001")
    result = validate_release(release=blocked_release)

    assert result.is_valid is False
    blocker_codes = {blocker["code"] for blocker in result.blockers}
    assert "FABRIC_QC_CLEAR" in blocker_codes
    assert "CONSTRAINT_ACCEPTABLE" in blocker_codes


@pytest.mark.django_db
def test_eos04_api_envelope_and_rbac(client, eos04_data):
    User = get_user_model()
    client.force_login(User.objects.get(username="planner"))

    weekly_response = client.get("/api/v1/planning/weekly")
    assert weekly_response.status_code == 200
    assert weekly_response.json()["errors"] == []
    plan_id = weekly_response.json()["data"]["plan"]["id"]
    backlog = weekly_response.json()["data"]["backlog"]
    assert weekly_response.json()["data"]["workItems"]

    load_response = client.get("/api/v1/workcenters/load")
    assert load_response.status_code == 200
    assert load_response.json()["data"]

    release_response = client.get("/api/v1/releases/daily")
    assert release_response.status_code == 200
    release = release_response.json()["data"][0]
    validation_response = client.post(
        "/api/v1/releases/validate",
        data=json.dumps({"releaseId": release["id"]}),
        content_type="application/json",
    )
    assert validation_response.status_code == 200
    assert "checks" in validation_response.json()["data"]

    if backlog:
        impact_response = client.post(
            f"/api/v1/planning/weekly/{plan_id}/impact-preview",
            data=json.dumps(
                {
                    "orderId": backlog[0]["id"],
                    "workcenterId": load_response.json()["data"][0]["workcenterId"],
                    "plannedQuantity": 25,
                }
            ),
            content_type="application/json",
        )
        assert impact_response.status_code == 200
        assert impact_response.json()["data"]["writeApplied"] is False

    client.force_login(User.objects.get(username="supervisor"))
    denied_response = client.get("/api/v1/planning/weekly")
    assert denied_response.status_code == 403
    assert denied_response.json()["errors"][0]["code"] == "PERMISSION_DENIED"


@pytest.mark.django_db
def test_eos04_admin_models_registered(eos04_data):
    assert PlanningHorizon in admin.site._registry
    assert PlanVersion in admin.site._registry
    assert ProductionRelease in admin.site._registry
