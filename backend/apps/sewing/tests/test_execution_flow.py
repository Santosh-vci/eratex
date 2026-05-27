import json

import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command

from apps.audit_governance.models import AuditEvent
from apps.cutting.models import CutBundle, CuttingJob, CuttingOutputEntry
from apps.cutting.services.execution import record_cutting_output
from apps.production_release.models import ProductionRelease
from apps.sewing.models import (
    LineRealignmentRequest,
    SewingLineBoardSnapshot,
    SewingLineLoading,
    SewingOutputCorrection,
    SewingOutputEntry,
)
from apps.sewing.services.line_loading import preview_line_loading
from apps.sewing.services.line_loading_board import get_line_loading_board
from apps.sewing.services.output import calculate_net_good, record_sewing_output
from apps.wip_inventory.models import WipLot, WipMovement, WipStage


@pytest.fixture
def execution_data(db):
    call_command("seed_execution_flow", verbosity=0)


@pytest.mark.django_db
def test_execution_seed_is_idempotent_and_validates_scenarios(execution_data):
    call_command("seed_execution_flow", verbosity=0)
    call_command("validate_seed_scenarios", verbosity=0)

    assert CuttingJob.objects.exists()
    assert CuttingOutputEntry.objects.exists()
    assert CutBundle.objects.exists()
    assert SewingLineLoading.objects.filter(status="ACTIVE").exists()
    assert LineRealignmentRequest.objects.filter(status="APPLIED").exists()
    assert SewingOutputEntry.objects.exists()
    assert SewingOutputCorrection.objects.exists()
    assert WipLot.objects.filter(stage=WipStage.SEWN_WAITING_WASH).exists()
    assert SewingLineBoardSnapshot.objects.count() >= 12
    board = get_line_loading_board()
    assert len(board["lines"]) >= 12
    assert {"DOWN", "RUNNING", "CHANGEOVER"}.issubset(
        {row["status"] for row in board["lines"]}
    )
    assert board["summary"]["highestRisk"]["lineCode"] == "LINE 08"


@pytest.mark.django_db
def test_cutting_and_sewing_services_preserve_wip_and_net_good(execution_data):
    user = get_user_model().objects.get(username="line_supervisor")
    job = CuttingJob.objects.first()
    loading = SewingLineLoading.objects.get(status="ACTIVE", line__code="LINE-01")

    duplicate = record_cutting_output(
        cutting_job=job,
        client_event_id="SCN-025-CUT-OUTPUT",
        output_qty=10,
        recorded_by=user,
    )
    assert duplicate.client_event_id == "SCN-025-CUT-OUTPUT"

    assert calculate_net_good(100, 3, 7) == 90
    with pytest.raises(ValidationError):
        calculate_net_good(10, 8, 8)

    before = SewingOutputEntry.objects.count()
    entry = record_sewing_output(
        line_loading=loading,
        client_event_id="UNIT-SEW-OUTPUT-001",
        time_slot="11:00-12:00",
        gross_qty=40,
        defect_qty=3,
        rework_qty=2,
        recorded_by=user,
    )
    assert entry.net_good_qty == 35
    again = record_sewing_output(
        line_loading=loading,
        client_event_id="UNIT-SEW-OUTPUT-001",
        time_slot="11:00-12:00",
        gross_qty=50,
        recorded_by=user,
    )
    assert again.id == entry.id
    assert SewingOutputEntry.objects.count() == before + 1
    assert WipMovement.objects.filter(to_stage=WipStage.SEWN_WAITING_WASH).exists()
    assert AuditEvent.objects.filter(event_code="SEWING_OUTPUT_RECORDED").exists()


@pytest.mark.django_db
def test_line_loading_preview_uses_ob_and_line_fit(execution_data):
    release = ProductionRelease.objects.filter(status="READY").first()
    loading = SewingLineLoading.objects.first()
    preview = preview_line_loading(
        release=release,
        line=loading.line,
        bulletin=loading.bulletin,
        planned_quantity=100,
    )
    assert preview["bulletinId"] == str(loading.bulletin_id)
    assert preview["styleSmv"] > 0
    assert "machineGaps" in preview
    assert "skillGaps" in preview


@pytest.mark.django_db
def test_execution_api_envelope_and_rbac(client, execution_data):
    User = get_user_model()
    client.force_login(User.objects.get(username="line_supervisor"))

    loadings = client.get("/api/v1/sewing/line-loadings")
    assert loadings.status_code == 200
    loading = loadings.json()["data"][0]

    board = client.get("/api/v1/sewing/line-loading-board")
    assert board.status_code == 200
    board_data = board.json()["data"]
    assert len(board_data["lines"]) >= 12
    assert board_data["summary"]["highestRisk"]["lineCode"] == "LINE 08"
    assert board_data["lines"][0]["analysis"]["bottleneckOperation"]["operationName"]

    output_response = client.post(
        "/api/v1/sewing/output",
        data=json.dumps(
            {
                "lineLoadingId": loading["id"],
                "clientEventId": "API-SEW-OUTPUT-001",
                "timeSlot": "12:00-13:00",
                "grossQty": 30,
                "defectQty": 2,
                "reworkQty": 3,
            }
        ),
        content_type="application/json",
    )
    assert output_response.status_code == 201
    assert output_response.json()["data"]["netGoodQty"] == 25

    preview_response = client.post(
        "/api/v1/sewing/line-realignment/preview",
        data=json.dumps(
            {
                "lineLoadingId": loading["id"],
                "lineId": loading["lineId"],
                "bulletinId": loading["bulletinId"],
                "targetOutput": loading["targetOutputPerDay"],
            }
        ),
        content_type="application/json",
    )
    assert preview_response.status_code == 200
    assert "expectedOutputAfter" in preview_response.json()["data"]

    client.force_login(User.objects.get(username="planner"))
    denied = client.post(
        "/api/v1/sewing/output",
        data=json.dumps(
            {
                "lineLoadingId": loading["id"],
                "clientEventId": "API-SEW-OUTPUT-DENIED",
                "timeSlot": "13:00-14:00",
                "grossQty": 10,
            }
        ),
        content_type="application/json",
    )
    assert denied.status_code == 403


@pytest.mark.django_db
def test_execution_admin_models_registered(execution_data):
    assert CuttingJob in admin.site._registry
    assert SewingLineLoading in admin.site._registry
    assert WipLot in admin.site._registry
