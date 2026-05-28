from django.core.management import call_command

from apps.master_data.models import Customer, Material, Vendor
from apps.orders.models import OrderStage, ProductionOrder
from apps.sewing.models import SewingOutputEntry
from apps.sewing.services.line_loading_board import get_line_loading_board
from apps.wip_inventory.models import WipLot, WipStage


def test_operational_factory_seed_builds_busy_phase5_state(db):
    call_command("seed_operational_factory", verbosity=0)
    call_command("seed_operational_factory", verbosity=0)
    call_command("validate_operational_factory_seed", verbosity=0)

    assert Customer.objects.count() >= 8
    assert Vendor.objects.count() >= 8
    assert Material.objects.count() >= 16
    assert ProductionOrder.objects.count() >= 40
    assert ProductionOrder.objects.filter(current_stage=OrderStage.SEWING).exists()
    assert ProductionOrder.objects.filter(current_stage=OrderStage.WASHING).exists()

    board = get_line_loading_board()
    assert len(board["lines"]) >= 20
    assert {"DOWN", "RUNNING", "CHANGEOVER"}.issubset(
        {row["status"] for row in board["lines"]}
    )

    for entry in SewingOutputEntry.objects.all():
        assert entry.net_good_qty == entry.gross_qty - entry.defect_qty - entry.rework_qty
    assert not WipLot.objects.exclude(stage__in=WipStage.values).exists()
