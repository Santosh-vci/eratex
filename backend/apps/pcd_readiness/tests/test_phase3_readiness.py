from datetime import timedelta

import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.utils import timezone

from apps.audit_governance.models import AuditEvent
from apps.fabric_qc.models import FabricQCInspection, FabricQcStatus
from apps.materials_procurement.models import MaterialPurchaseOrder, MaterialRequirementStatus
from apps.materials_procurement.services.readiness import (
    calculate_material_readiness,
    update_material_eta,
)
from apps.orders.models import ProductionOrder
from apps.pcd_readiness.models import PCDItemStatus, PCDReadiness, PCDReadinessItem
from apps.pcd_readiness.services.readiness import (
    approve_conditional_release,
    calculate_pcd_readiness,
    release_to_cutting,
    request_conditional_release,
    validate_release_to_cutting,
)


@pytest.fixture
def phase3_data(db):
    call_command("seed_phase3", verbosity=0)


@pytest.mark.django_db
def test_seed_phase3_is_idempotent_and_creates_order_scenarios(phase3_data):
    call_command("seed_phase3", verbosity=0)

    assert ProductionOrder.objects.filter(order_no__startswith="ORD-").count() == 5
    assert (
        ProductionOrder.objects.get(order_no="ORD-PCD-001")
        .pcd_readiness.items.filter(
            item_code="TRIMS_AVAILABLE",
            status=PCDItemStatus.PENDING,
        )
        .exists()
    )
    assert (
        ProductionOrder.objects.get(order_no="ORD-FABQC-001")
        .pcd_readiness.items.filter(
            item_code="FABRIC_QC_PASSED",
            status=PCDItemStatus.FAILED,
        )
        .exists()
    )


@pytest.mark.django_db
def test_unique_constraints_and_admin_registration(phase3_data):
    order = ProductionOrder.objects.get(order_no="ORD-HP-001")
    readiness = order.pcd_readiness

    assert ProductionOrder in admin.site._registry
    assert PCDReadiness in admin.site._registry
    assert (
        PCDReadinessItem.objects.filter(
            pcd_readiness=readiness,
            item_code="PO_CONFIRMED",
        ).count()
        == 1
    )


@pytest.mark.django_db
def test_conditional_release_allows_release_to_cutting_and_writes_audit(phase3_data):
    User = get_user_model()
    planner = User.objects.get(username="planner")
    planning_head = User.objects.get(username="planning_head")
    readiness = ProductionOrder.objects.get(order_no="ORD-PCD-001").pcd_readiness

    validation = validate_release_to_cutting(readiness)
    assert validation["allowed"] is False
    assert any("TRIMS_AVAILABLE" in item for item in validation["blockers"])

    request_conditional_release(
        readiness,
        reason="Trim arrival confirmed before sewing start.",
        expiry_date=timezone.localdate() + timedelta(days=2),
        risk_note="Cutting only; sewing waits for trims.",
        requested_by=planner,
    )
    approve_conditional_release(readiness, approved_by=planning_head)
    readiness.refresh_from_db()
    assert readiness.readiness_status == "CONDITIONALLY_READY"

    released = release_to_cutting(readiness, released_by=planner)
    assert released.readiness_status == "RELEASED"
    assert released.order.current_stage == "CUTTING"
    assert AuditEvent.objects.filter(event_code="PCD_RELEASED_TO_CUTTING").exists()


@pytest.mark.django_db
def test_expired_conditional_release_blocks_release(phase3_data):
    planning_head = get_user_model().objects.get(username="planning_head")
    readiness = ProductionOrder.objects.get(order_no="ORD-PCD-001").pcd_readiness

    request_conditional_release(
        readiness,
        reason="Short approval",
        expiry_date=timezone.localdate() + timedelta(days=1),
        requested_by=planning_head,
    )
    approve_conditional_release(readiness, approved_by=planning_head)
    conditional = readiness.conditional_releases.get(status="APPROVED")
    conditional.expiry_date = timezone.localdate() - timedelta(days=1)
    conditional.save(update_fields=["expiry_date", "updated_at"])

    calculate_pcd_readiness(readiness)
    readiness.refresh_from_db()
    assert readiness.readiness_status in {"BLOCKED", "ESCALATED"}
    with pytest.raises(ValidationError):
        release_to_cutting(readiness, released_by=planning_head)


@pytest.mark.django_db
def test_material_eta_delay_and_fabric_qc_failure_affect_readiness(phase3_data):
    procurement_user = get_user_model().objects.get(username="procurement_user")
    material_order = ProductionOrder.objects.get(order_no="ORD-MAT-001")
    readiness = calculate_material_readiness(material_order)
    assert readiness["readinessStatus"] == "BLOCKED"

    po = MaterialPurchaseOrder.objects.filter(order=material_order, status="DELAYED").first()
    update_material_eta(
        po,
        revised_eta=material_order.planned_pcd_date + timedelta(days=7),
        reason="Vendor revised lead time.",
        updated_by=procurement_user,
    )
    assert material_order.material_requirements.filter(
        status=MaterialRequirementStatus.DELAYED
    ).exists()

    fabric_order = ProductionOrder.objects.get(order_no="ORD-FABQC-001")
    failed = FabricQCInspection.objects.filter(
        fabric_roll__fabric_lot__order=fabric_order,
        status=FabricQcStatus.FAILED,
    )
    assert failed.exists()
    assert fabric_order.pcd_readiness.readiness_status in {"BLOCKED", "ESCALATED"}


@pytest.mark.django_db
def test_phase3_api_envelope_and_rbac(client, phase3_data):
    User = get_user_model()
    client.force_login(User.objects.get(username="planner"))

    orders_response = client.get("/api/v1/orders")
    assert orders_response.status_code == 200
    assert orders_response.json()["errors"] == []
    order = next(
        item for item in orders_response.json()["data"] if item["orderNo"] == "ORD-PCD-001"
    )
    assert order["releaseAllowed"] is False

    pcd_response = client.get("/api/v1/pcd-readiness")
    assert pcd_response.status_code == 200
    readiness = next(
        item for item in pcd_response.json()["data"] if item["orderNo"] == "ORD-PCD-001"
    )
    assert readiness["readinessStatus"] in {"BLOCKED", "ESCALATED"}

    client.force_login(User.objects.get(username="planning_head"))
    approve_response = client.post(
        f"/api/v1/pcd-readiness/{readiness['id']}/approve-conditional-release",
        data=(
            '{"reason":"Approved for cutting only",'
            '"expiryDate":"2099-01-01",'
            '"riskNote":"Sewing waits."}'
        ),
        content_type="application/json",
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["data"]["readinessStatus"] == "CONDITIONALLY_READY"

    client.force_login(User.objects.get(username="supervisor"))
    denied_response = client.get("/api/v1/orders")
    assert denied_response.status_code == 403
    assert denied_response.json()["errors"][0]["code"] == "PERMISSION_DENIED"
