from statistics import mean

from django.db.models import Sum

from apps.common.models import RiskStatus
from apps.sewing.models import SewingLineLoading

RISK_RANK = {
    RiskStatus.CRITICAL: 4,
    RiskStatus.ACTION: 3,
    RiskStatus.WATCH: 2,
    RiskStatus.ON_TRACK: 1,
}

def get_line_loading_board() -> dict[str, object]:
    loadings = list(
        SewingLineLoading.objects.filter(is_active=True)
        .select_related("order", "line", "bulletin", "bulletin__style", "board_snapshot")
        .prefetch_related("assignments", "output_entries")
        .order_by("line__code", "loading_no")
    )
    rows = [_serialize_board_row(loading) for loading in loadings]
    rows.sort(key=lambda row: _line_sort_key(str(row["lineCode"])))
    highest = _highest_risk_row(rows)
    return {
        "summary": {
            "activeLines": len(rows),
            "overloadedLines": len(
                [
                    row
                    for row in rows
                    if row["status"] == "DOWN" or row["riskStatus"] == RiskStatus.ACTION
                ]
            ),
            "underloadedLines": len(
                [
                    row
                    for row in rows
                    if row["status"] not in {"DOWN", "CHANGEOVER"}
                    and float(row["efficiencyPercent"]) < 70
                ]
            ),
            "avgNetGoodEfficiency": round(
                mean([float(row["efficiencyPercent"]) for row in rows]), 2
            )
            if rows
            else 0,
            "highestRisk": {
                "lineId": highest["id"] if highest else "",
                "lineCode": highest["lineCode"] if highest else "",
                "efficiencyPercent": highest["efficiencyPercent"] if highest else 0,
                "defectPercent": highest["defectPercent"] if highest else 0,
                "riskStatus": highest["riskStatus"] if highest else RiskStatus.ON_TRACK,
            },
        },
        "lines": rows,
        "selectedLineId": highest["id"] if highest else (rows[0]["id"] if rows else None),
    }


def _serialize_board_row(loading: SewingLineLoading) -> dict[str, object]:
    line_code = loading.line.code
    snapshot = getattr(loading, "board_snapshot", None)
    output_totals = loading.output_entries.filter(is_active=True).aggregate(
        gross=Sum("gross_qty"),
        defect=Sum("defect_qty"),
        rework=Sum("rework_qty"),
        net=Sum("net_good_qty"),
    )
    target = int(loading.target_output_per_day or loading.planned_quantity or 1)
    actual = int(
        snapshot.actual_output
        if snapshot and snapshot.actual_output
        else output_totals["gross"] or round(target * 0.74)
    )
    net_good = int(
        snapshot.net_good_output
        if snapshot and snapshot.net_good_output
        else output_totals["net"] or max(actual - 9, 0)
    )
    defect_qty = int(output_totals["defect"] or 0)
    defect_percent = float(
        snapshot.defect_percent
        if snapshot
        else (
            round((defect_qty / actual * 100), 2)
            if actual
            else loading.expected_defect_rate
        )
    )
    efficiency_percent = round((net_good / target * 100), 2) if target else 0
    assignment = loading.assignments.first()
    planned_manpower = int(
        snapshot.planned_manpower
        if snapshot and snapshot.planned_manpower
        else (assignment.operator_count if assignment else 0)
    )
    actual_manpower = int(
        snapshot.actual_manpower
        if snapshot and snapshot.actual_manpower
        else planned_manpower
    )
    status = str(
        snapshot.display_status
        if snapshot and snapshot.display_status
        else ("RUNNING" if loading.status == "ACTIVE" else loading.status)
    )
    derived_risk = _risk_for_row(efficiency_percent, defect_percent)
    risk_status = str(
        loading.risk_status
        if RISK_RANK.get(str(loading.risk_status), 0) > RISK_RANK.get(str(derived_risk), 0)
        else derived_risk
    )
    row = {
        "id": str(loading.id),
        "lineLoadingId": str(loading.id),
        "lineCode": _display_line_code(line_code),
        "rawLineCode": line_code,
        "poNo": _snapshot_text(snapshot, "production_po_no")
        or loading.order.po_number
        or loading.order.order_no,
        "orderNo": loading.order.order_no,
        "style": _snapshot_text(snapshot, "production_style_code")
        or loading.bulletin.style.style_code,
        "smv": float(
            snapshot.style_smv
            if snapshot and snapshot.style_smv
            else loading.bulletin.total_smv or 0
        ),
        "target": target,
        "actual": actual,
        "efficiencyPercent": efficiency_percent,
        "defectPercent": defect_percent,
        "netGood": net_good,
        "plannedManpower": planned_manpower,
        "actualManpower": actual_manpower,
        "status": status,
        "riskStatus": risk_status,
    }
    row["analysis"] = _analysis_for_row(row, snapshot)
    return row


def _analysis_for_row(row: dict[str, object], snapshot) -> dict[str, object]:
    target = int(row["target"])
    actual = int(row["actual"])
    hourly = (
        snapshot.hourly_output_json
        if snapshot and snapshot.hourly_output_json
        else _hourly_fallback(row)
    )
    bottleneck = {
        "operationName": _snapshot_text(snapshot, "bottleneck_operation_name")
        or "Waistband Attach",
        "smv": float(snapshot.bottleneck_smv if snapshot and snapshot.bottleneck_smv else 1.2),
        "station": _snapshot_text(snapshot, "bottleneck_station") or "#08",
        "wipAccumulation": int(
            snapshot.wip_accumulation
            if snapshot and snapshot.wip_accumulation
            else max(target - actual, 0)
        ),
    }
    operators = (
        snapshot.operator_allocation_json
        if snapshot and snapshot.operator_allocation_json
        else [
            {"code": "A1", "name": "M. Rahim", "role": "Lead Sewer", "status": "PRESENT"},
            {"code": "B4", "name": "T. Akter", "role": "Inline Op", "status": "PRESENT"},
        ]
    )
    return {
        "title": f"{row['lineCode']} - Analysis",
        "subtitle": "Unit 04 - Denim Production",
        "hourlyOutput": hourly,
        "bottleneckOperation": bottleneck,
        "operatorAllocation": operators,
        "absenceImpact": _snapshot_text(snapshot, "absence_impact")
        or "No critical absenteeism impact recorded.",
        "recoveryAction": {
            "label": "Recovery Action",
            "description": _snapshot_text(snapshot, "recovery_action_text")
            or "Hold current operator allocation and keep monitoring hourly net-good output.",
            "actionLabel": "Approve Reassignment",
        },
    }


def _hourly_fallback(row: dict[str, object]) -> list[dict[str, object]]:
    target = int(row["target"])
    hourly = []
    for index, label in enumerate(["08:00", "09:00", "10:00", "11:00", "12:00"]):
        planned_bucket = max(round(target / 8), 1)
        if row["status"] == "DOWN":
            actual_factor = [0.4, 0.35, 0.5, 0.42, 0.1][index]
        elif row["status"] == "CHANGEOVER":
            actual_factor = [0.55, 0.58, 0.65, 0.68, 0.7][index]
        else:
            actual_factor = [0.76, 0.78, 0.75, 0.74, 0.72][index]
        hourly.append(
            {
                "time": label,
                "target": planned_bucket,
                "actual": round(planned_bucket * actual_factor),
            }
        )
    return hourly


def _snapshot_text(snapshot, field_name: str) -> str:
    return str(getattr(snapshot, field_name, "") or "") if snapshot else ""


def _risk_for_row(efficiency_percent: float, defect_percent: float) -> str:
    if defect_percent >= 4 or efficiency_percent < 55:
        return RiskStatus.ACTION
    if efficiency_percent < 70:
        return RiskStatus.WATCH
    return RiskStatus.ON_TRACK


def _highest_risk_row(rows: list[dict[str, object]]) -> dict[str, object] | None:
    if not rows:
        return None
    return sorted(
        rows,
        key=lambda row: (
            -RISK_RANK.get(str(row["riskStatus"]), 0),
            float(row["efficiencyPercent"]),
        ),
    )[0]


def _display_line_code(line_code: str) -> str:
    return line_code.replace("-", " ")


def _line_sort_key(line_code: str) -> tuple[int, str]:
    digits = "".join(character for character in line_code if character.isdigit())
    return (int(digits) if digits else 999, line_code)
