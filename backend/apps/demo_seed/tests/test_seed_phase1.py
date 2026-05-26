import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.identity_access.models import PermissionAction, Role
from apps.organization.models import Factory


@pytest.mark.django_db
def test_seed_phase1_is_idempotent():
    call_command("seed_phase1")
    call_command("seed_phase1")

    assert Factory.objects.filter(code="UNIT-04").count() == 1
    assert Role.objects.filter(code="PLANNER").count() == 1
    assert PermissionAction.objects.filter(code="planning.view").count() == 1
    assert get_user_model().objects.filter(username="planner").count() == 1
