import json
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.utils import timezone

from apps.boundary_cases.models import BoundaryCaseEvent
from apps.boundary_cases.services.preview import calculate_boundary_impact
from apps.external_plans.models import ExternalPlanImportBatch
from apps.orders.models import ProductionOrder
from apps.organization.models import Workcenter
from apps.planning.models import PlannedWorkItem, PlanningZoneConfiguration
from apps.planning.services.zones import ensure_direct_work_item_change_allowed
from apps.workcenters.services.capacity import get_capacity_definition


@pytest.fixture
def rulebook_data(db):
    call_command("seed_eos04", verbosity=0)


@pytest.mark.django_db
def test_rulebook_seed_is_idempotent_and_validates_scenarios(rulebook_data):
    call_command("seed_scheduling_rulebook", verbosity=0)
    call_command("validate_seed_scenarios", verbosity=0)

    assert (
        BoundaryCaseEvent.objects.filter(event_no__gte="SCN-014", event_no__lte="SCN-023").count()
        >= 9
    )
    assert ExternalPlanImportBatch.objects.filter(import_no="SCN-022").exists()
    assert PlanningZoneConfiguration.objects.filter(active_status=True).count() == 3


@pytest.mark.django_db
def test_planning_zone_and_capacity_definition_are_available(rulebook_data):
    work_item = PlannedWorkItem.objects.filter(planning_zone="FROZEN_ZONE").first()
    assert work_item is not None
    with pytest.raises(ValidationError):
        ensure_direct_work_item_change_allowed(work_item)

    sewing = Workcenter.objects.get(code="SEW-WC")
    definition = get_capacity_definition(sewing)
    assert definition is not None
    assert definition.primary_constraint_resource == "MANPOWER"


@pytest.mark.django_db
def test_boundary_impact_preview_for_capacity_loss_and_order_cancellation(rulebook_data):
    wash = Workcenter.objects.get(code="WASH-WC")
    capacity_impact = calculate_boundary_impact(
        "CAPACITY_LOSS",
        {
            "workcenterId": str(wash.id),
            "eventDate": timezone.localdate().isoformat(),
            "minutesDelta": -3600,
        },
    )
    assert capacity_impact["capacity_impact"]["minutesDelta"] == -3600
    assert capacity_impact["approval_required"] is True

    order = ProductionOrder.objects.get(order_no="ORD-FABQC-001")
    order.current_stage = "WASHING"
    order.save(update_fields=["current_stage", "updated_at"])
    cancel_impact = calculate_boundary_impact("ORDER_CANCELLED", {"orderId": str(order.id)})
    assert cancel_impact["approval_required"] is True
    assert cancel_impact["blocking_reasons"]


@pytest.mark.django_db
def test_rulebook_apis_and_rbac(client, rulebook_data):
    User = get_user_model()
    client.force_login(User.objects.get(username="planner"))
    response = client.get("/api/v1/boundary-cases")
    assert response.status_code == 200
    assert response.json()["errors"] == []

    wash = Workcenter.objects.get(code="WASH-WC")
    preview_response = client.post(
        "/api/v1/boundary-cases/impact-preview",
        data=json.dumps(
            {
                "eventType": "CAPACITY_LOSS",
                "payload": {
                    "workcenterId": str(wash.id),
                    "eventDate": timezone.localdate().isoformat(),
                    "minutesDelta": -1200,
                },
            }
        ),
        content_type="application/json",
    )
    assert preview_response.status_code == 200
    assert preview_response.json()["data"]["approvalRequired"] is True

    client.force_login(User.objects.get(username="supervisor"))
    denied = client.post(
        "/api/v1/capacity-events",
        data=json.dumps(
            {"eventType": "CAPACITY_ADDITION", "payload": {"workcenterId": str(wash.id)}}
        ),
        content_type="application/json",
    )
    assert denied.status_code == 403


@pytest.mark.django_db
def test_order_pull_in_and_external_plan_conflict_validation(client, rulebook_data):
    User = get_user_model()
    client.force_login(User.objects.get(username="planning_head"))
    order = ProductionOrder.objects.get(order_no="ORD-MAT-001")
    pull_in = client.post(
        f"/api/v1/orders/{order.id}/shipment-pull-in-preview",
        data=json.dumps(
            {"newShipmentDate": (order.committed_ship_date - timedelta(days=3)).isoformat()}
        ),
        content_type="application/json",
    )
    assert pull_in.status_code == 200
    assert pull_in.json()["data"]["approvalRequired"] is True

    external = client.post(
        "/api/v1/external-plans/import",
        data=json.dumps(
            {
                "sourceType": "fastreact_plan",
                "sourceReference": "pytest",
                "rows": [
                    {
                        "orderNo": "ORD-UNKNOWN",
                        "workcenterCode": "SEW-WC",
                        "plannedDate": timezone.localdate().isoformat(),
                        "quantity": 100,
                    }
                ],
            }
        ),
        content_type="application/json",
    )
    assert external.status_code == 201
    assert external.json()["data"]["validationResults"][0]["conflictType"] == "ORDER_NOT_FOUND"
