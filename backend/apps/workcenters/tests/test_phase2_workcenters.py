from datetime import date, timedelta

import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command

from apps.workcenters.models import LineMachineAssignment, LineProfile
from apps.workcenters.services.capacity import (
    calculate_available_capacity,
    validate_line_machine_assignment,
)


@pytest.fixture
def phase2_data(db):
    call_command("seed_phase2", verbosity=0)


@pytest.mark.django_db
def test_line_capacity_uses_manpower_shift_and_efficiency(phase2_data):
    profile = LineProfile.objects.select_related("line", "shift_calendar").get(line__code="LINE-01")

    capacity = calculate_available_capacity(profile)

    assert capacity["availableMinutes"] == int(42 * 480 * 0.68)


@pytest.mark.django_db
def test_machine_assignment_overlap_is_invalid(phase2_data):
    existing = LineMachineAssignment.objects.select_related("machine", "line").first()
    other_assignment = LineMachineAssignment(
        line=existing.line,
        machine=existing.machine,
        assigned_from=date.today() - timedelta(days=1),
    )

    with pytest.raises(ValidationError):
        validate_line_machine_assignment(other_assignment)
