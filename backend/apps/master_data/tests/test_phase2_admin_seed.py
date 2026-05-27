import pytest
from django.contrib.admin.sites import AdminSite
from django.core.management import call_command

from apps.common.models import ApprovalStatus
from apps.master_data.models import Customer, ProductType
from apps.style_technical.admin import BOMHeaderAdmin
from apps.style_technical.models import BOMHeader


@pytest.fixture
def phase2_data(db):
    call_command("seed_phase2", verbosity=0)


@pytest.mark.django_db
def test_core_master_seed_records_are_available(phase2_data):
    assert Customer.objects.filter(code="CUST-A").exists()
    assert ProductType.objects.filter(code="DENIM_BOTTOM").exists()


@pytest.mark.django_db
def test_approved_bom_admin_is_read_only(phase2_data):
    bom = BOMHeader.objects.get(style__style_code="STY-DEN-BASIC", version="v1")
    assert bom.status == ApprovalStatus.APPROVED

    model_admin = BOMHeaderAdmin(BOMHeader, AdminSite())
    readonly_fields = model_admin.get_readonly_fields(request=None, obj=bom)

    assert "version" in readonly_fields
    assert "status" in readonly_fields
