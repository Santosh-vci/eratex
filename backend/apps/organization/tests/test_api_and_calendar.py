from datetime import date, time

import pytest
from django.core.management import call_command

from apps.organization.models import Factory, HolidayCalendar, ShiftCalendar
from apps.organization.services.calendar import get_working_minutes


@pytest.fixture
def authenticated_client(client, db):
    call_command("seed_phase1")
    client.post(
        "/api/v1/auth/login",
        data='{"username": "planner", "password": "planning123"}',
        content_type="application/json",
    )
    return client


@pytest.mark.django_db
def test_organization_lists_return_seeded_scope(authenticated_client):
    assert (
        authenticated_client.get("/api/v1/organization/factories").json()["data"][0]["code"]
        == "UNIT-04"
    )
    assert authenticated_client.get("/api/v1/organization/departments").status_code == 200
    assert authenticated_client.get("/api/v1/organization/workcenters").status_code == 200
    assert authenticated_client.get("/api/v1/organization/lines").status_code == 200


@pytest.mark.django_db
def test_organization_lists_require_authentication(client):
    response = client.get("/api/v1/organization/factories")

    assert response.status_code == 401
    assert response.json()["errors"][0]["code"] == "AUTH_REQUIRED"


@pytest.mark.django_db
def test_get_working_minutes_uses_default_shift_and_holiday():
    factory = Factory.objects.create(code="CAL", name="Calendar Factory")
    ShiftCalendar.objects.create(
        factory=factory,
        name="Default",
        start_time=time(8, 0),
        end_time=time(17, 0),
        working_minutes=480,
        is_default=True,
    )

    assert get_working_minutes(factory, date(2026, 5, 27)) == 480

    HolidayCalendar.objects.create(
        factory=factory,
        holiday_date=date(2026, 5, 27),
        name="Factory Holiday",
    )
    assert get_working_minutes(factory, date(2026, 5, 27)) == 0
