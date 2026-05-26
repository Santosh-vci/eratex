from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import RiskStatus
from apps.master_data.models import ChecklistTemplate, ChecklistTemplateItem, PlanningThreshold
from apps.orders.models import OrderStage
from apps.orders.services.lifecycle import record_lifecycle_event
from apps.pcd_readiness.models import (
    ConditionalRelease,
    ConditionalReleaseStatus,
    PCDItemStatus,
    PCDReadiness,
    PCDReadinessItem,
    PCDReadinessStatus,
)

DEFAULT_PCD_ITEMS = [
    ("PO_CONFIRMED", "PO confirmed", "MERCHANDISER", True),
    ("BOM_FROZEN", "BOM frozen", "TECHNICAL", True),
    ("FABRIC_RECEIVED", "Fabric received", "PROCUREMENT", True),
    ("FABRIC_QC_PASSED", "Fabric QC passed", "FABRIC_QC", True),
    ("SHADE_LOTS_MAPPED", "Shade lots mapped", "FABRIC_QC", True),
    ("SHRINKAGE_AVAILABLE", "Shrinkage available", "FABRIC_QC", True),
    ("TRIMS_AVAILABLE", "Trims available", "PROCUREMENT", True),
    ("PATTERN_APPROVED", "Pattern approved", "TECHNICAL", True),
    ("MARKER_READY", "Marker ready", "CUTTING", True),
    ("PP_SAMPLE_APPROVED", "PP sample approved", "MERCHANDISER", True),
    ("WASH_STANDARD_APPROVED", "Wash standard approved", "WASH", True),
    ("LINE_ALLOCATED", "Line allocated", "PLANNING", True),
    ("WASH_CAPACITY_BOOKED", "Wash capacity booked", "WASH", True),
    ("QC_FILE_READY", "QC file ready", "QUALITY", True),
]


def ensure_default_pcd_template() -> ChecklistTemplate:
    template, _ = ChecklistTemplate.objects.update_or_create(
        code="PCD-DEFAULT",
        defaults={
            "name": "Default PCD Checklist",
            "template_type": ChecklistTemplate.TemplateType.PCD,
            "status": "APPROVED",
            "is_active": True,
        },
    )
    default_codes = {code for code, _label, _owner_role, _mandatory in DEFAULT_PCD_ITEMS}
    for index, stale_item in enumerate(template.items.exclude(code__in=default_codes), start=1):
        stale_item.sequence_no = 9000 + index
        stale_item.is_active = False
        stale_item.save(update_fields=["sequence_no", "is_active", "updated_at"])
    for sequence, (code, label, owner_role, mandatory) in enumerate(DEFAULT_PCD_ITEMS, start=1):
        ChecklistTemplateItem.objects.update_or_create(
            template=template,
            code=code,
            defaults={
                "sequence_no": sequence * 10,
                "label": label,
                "owner_role": owner_role,
                "mandatory": mandatory,
                "is_active": True,
            },
        )
    return template


@transaction.atomic
def initialize_pcd_readiness(order, *, performed_by=None) -> PCDReadiness:
    template = ensure_default_pcd_template()
    readiness, _ = PCDReadiness.objects.get_or_create(
        order=order,
        defaults={
            "planned_pcd_date": order.planned_pcd_date,
            "readiness_status": PCDReadinessStatus.IN_REVIEW,
            "created_by": performed_by,
            "updated_by": performed_by,
        },
    )
    for template_item in template.items.filter(is_active=True).order_by("sequence_no"):
        PCDReadinessItem.objects.get_or_create(
            pcd_readiness=readiness,
            item_code=template_item.code,
            defaults={
                "item_label": template_item.label,
                "is_mandatory": template_item.mandatory,
                "status": PCDItemStatus.PENDING,
                "due_date": order.planned_pcd_date,
                "created_by": performed_by,
                "updated_by": performed_by,
            },
        )
    calculate_pcd_readiness(readiness)
    write_audit_event(
        event_code="pcd.checklist_initialized",
        entity_type="PCDReadiness",
        entity_id=str(readiness.id),
        entity_display_code=order.order_no,
        action="initialize",
        performed_by=performed_by,
        source="WEB" if performed_by else "SEED",
    )
    return readiness


def _escalation_days() -> int:
    threshold = PlanningThreshold.objects.filter(code="PCD_BLOCKER_DAYS", is_active=True).first()
    return int(threshold.value) if threshold else 3


def expire_conditional_release(readiness: PCDReadiness):
    today = timezone.localdate()
    expired = readiness.conditional_releases.filter(
        status=ConditionalReleaseStatus.APPROVED,
        expiry_date__lt=today,
    )
    count = expired.update(status=ConditionalReleaseStatus.EXPIRED)
    if count:
        readiness.conditional_release = False
        readiness.conditional_release_expiry = None
        readiness.conditional_release_reason = ""
        readiness.approved_by = None
        readiness.approved_at = None
        readiness.save(
            update_fields=[
                "conditional_release",
                "conditional_release_expiry",
                "conditional_release_reason",
                "approved_by",
                "approved_at",
                "updated_at",
            ]
        )
    return count


@transaction.atomic
def calculate_pcd_readiness(readiness: PCDReadiness) -> PCDReadiness:
    expire_conditional_release(readiness)
    readiness.refresh_from_db()
    if readiness.released_to_cutting_at:
        status = PCDReadinessStatus.RELEASED
    else:
        mandatory = readiness.items.filter(is_mandatory=True, is_active=True)
        failed = mandatory.filter(status=PCDItemStatus.FAILED).exists()
        pending = mandatory.filter(status=PCDItemStatus.PENDING).exists()
        waived = mandatory.filter(status=PCDItemStatus.WAIVED).exists()
        valid_conditional = readiness.conditional_releases.filter(
            status=ConditionalReleaseStatus.APPROVED,
            expiry_date__gte=timezone.localdate(),
        ).exists()
        if not failed and not pending and not waived:
            status = PCDReadinessStatus.READY
        elif valid_conditional:
            status = PCDReadinessStatus.CONDITIONALLY_READY
        elif failed or pending or waived:
            days_to_pcd = (readiness.planned_pcd_date - timezone.localdate()).days
            status = (
                PCDReadinessStatus.ESCALATED
                if days_to_pcd <= _escalation_days()
                else PCDReadinessStatus.BLOCKED
            )
        else:
            status = PCDReadinessStatus.IN_REVIEW
    old_status = readiness.readiness_status
    readiness.readiness_status = status
    readiness.updated_at = timezone.now()
    readiness.save(update_fields=["readiness_status", "updated_at"])
    order = readiness.order
    if status == PCDReadinessStatus.READY:
        order.lifecycle_status = OrderStage.PCD_READY
        order.current_stage = OrderStage.PCD_READY
        order.risk_status = RiskStatus.ON_TRACK
    elif status == PCDReadinessStatus.CONDITIONALLY_READY:
        order.lifecycle_status = OrderStage.PCD_READY
        order.current_stage = OrderStage.PCD_READY
        order.risk_status = RiskStatus.WATCH
    elif status in {PCDReadinessStatus.BLOCKED, PCDReadinessStatus.ESCALATED}:
        order.lifecycle_status = OrderStage.PCD_PENDING
        order.current_stage = OrderStage.PCD_PENDING
        order.risk_status = (
            RiskStatus.ACTION if status == PCDReadinessStatus.BLOCKED else RiskStatus.CRITICAL
        )
    elif status == PCDReadinessStatus.RELEASED:
        order.lifecycle_status = OrderStage.CUTTING
        order.current_stage = OrderStage.CUTTING
        order.risk_status = (
            RiskStatus.WATCH if order.risk_status == RiskStatus.WATCH else RiskStatus.ON_TRACK
        )
    order.save(update_fields=["lifecycle_status", "current_stage", "risk_status", "updated_at"])
    if old_status != status:
        write_audit_event(
            event_code=f"pcd.{status.lower()}",
            entity_type="PCDReadiness",
            entity_id=str(readiness.id),
            entity_display_code=order.order_no,
            action="recalculate",
            old_value_json={"status": old_status},
            new_value_json={"status": status},
            source="SYSTEM",
        )
    return readiness


@transaction.atomic
def update_pcd_item(
    item: PCDReadinessItem,
    *,
    status: str,
    remarks: str = "",
    waiver_reason: str = "",
    evidence_url: str = "",
    updated_by=None,
) -> PCDReadiness:
    if status not in PCDItemStatus.values:
        raise ValidationError("Invalid PCD item status.")
    old = {
        "status": item.status,
        "remarks": item.remarks,
        "waiverReason": item.waiver_reason,
    }
    item.status = status
    item.remarks = remarks
    item.waiver_reason = waiver_reason
    item.evidence_url = evidence_url
    item.updated_by = updated_by
    item.save(
        update_fields=[
            "status",
            "remarks",
            "waiver_reason",
            "evidence_url",
            "updated_by",
            "updated_at",
        ]
    )
    write_audit_event(
        event_code="PCD_ITEM_UPDATED",
        entity_type="PCDReadinessItem",
        entity_id=str(item.id),
        entity_display_code=f"{item.pcd_readiness.order.order_no}:{item.item_code}",
        action="update",
        performed_by=updated_by,
        old_value_json=old,
        new_value_json={"status": item.status, "remarks": item.remarks},
        source="WEB" if updated_by else "SEED",
    )
    return calculate_pcd_readiness(item.pcd_readiness)


@transaction.atomic
def request_conditional_release(
    readiness: PCDReadiness,
    *,
    reason: str,
    expiry_date,
    risk_note: str = "",
    requested_by=None,
) -> ConditionalRelease:
    open_items = list(
        readiness.items.filter(
            is_mandatory=True,
            status__in=[PCDItemStatus.PENDING, PCDItemStatus.FAILED, PCDItemStatus.WAIVED],
        ).values_list("item_code", flat=True)
    )
    if not open_items:
        raise ValidationError("Conditional release requires open mandatory items.")
    conditional = ConditionalRelease.objects.create(
        pcd_readiness=readiness,
        open_item_codes=open_items,
        reason=reason,
        risk_note=risk_note,
        expiry_date=expiry_date,
        requested_by=requested_by,
        created_by=requested_by,
        updated_by=requested_by,
    )
    write_audit_event(
        event_code="pcd.conditional_release_requested",
        entity_type="PCDReadiness",
        entity_id=str(readiness.id),
        entity_display_code=readiness.order.order_no,
        action="request_conditional_release",
        performed_by=requested_by,
        new_value_json={"openItems": open_items, "expiryDate": expiry_date.isoformat()},
        reason=reason,
        source="WEB" if requested_by else "SEED",
    )
    return conditional


@transaction.atomic
def approve_conditional_release(
    readiness: PCDReadiness,
    *,
    approved_by,
    reason: str = "",
    expiry_date=None,
    risk_note: str = "",
) -> PCDReadiness:
    conditional = readiness.conditional_releases.filter(
        status=ConditionalReleaseStatus.REQUESTED
    ).first()
    if conditional is None:
        if expiry_date is None:
            raise ValidationError("Expiry date is required.")
        conditional = request_conditional_release(
            readiness,
            reason=reason,
            expiry_date=expiry_date,
            risk_note=risk_note,
            requested_by=approved_by,
        )
    if conditional.expiry_date < timezone.localdate():
        raise ValidationError("Conditional release expiry cannot be in the past.")
    conditional.status = ConditionalReleaseStatus.APPROVED
    conditional.approved_by = approved_by
    conditional.approved_at = timezone.now()
    conditional.updated_by = approved_by
    conditional.save(
        update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"]
    )
    readiness.conditional_release = True
    readiness.conditional_release_reason = conditional.reason
    readiness.conditional_release_expiry = conditional.expiry_date
    readiness.approved_by = approved_by
    readiness.approved_at = conditional.approved_at
    readiness.updated_by = approved_by
    readiness.save(
        update_fields=[
            "conditional_release",
            "conditional_release_reason",
            "conditional_release_expiry",
            "approved_by",
            "approved_at",
            "updated_by",
            "updated_at",
        ]
    )
    write_audit_event(
        event_code="PCD_CONDITIONAL_RELEASE_APPROVED",
        entity_type="PCDReadiness",
        entity_id=str(readiness.id),
        entity_display_code=readiness.order.order_no,
        action="approve_conditional_release",
        performed_by=approved_by,
        new_value_json={
            "openItems": conditional.open_item_codes,
            "expiryDate": conditional.expiry_date.isoformat(),
            "riskNote": conditional.risk_note,
        },
        reason=conditional.reason,
        source="WEB",
    )
    return calculate_pcd_readiness(readiness)


def validate_release_to_cutting(readiness: PCDReadiness) -> dict[str, object]:
    calculate_pcd_readiness(readiness)
    readiness.refresh_from_db()
    blockers = []
    if readiness.readiness_status == PCDReadinessStatus.RELEASED:
        return {"allowed": False, "blockers": ["Already released to cutting."]}
    if readiness.readiness_status == PCDReadinessStatus.READY:
        return {"allowed": True, "blockers": []}
    if readiness.readiness_status == PCDReadinessStatus.CONDITIONALLY_READY:
        valid = readiness.conditional_releases.filter(
            status=ConditionalReleaseStatus.APPROVED,
            expiry_date__gte=timezone.localdate(),
        ).exists()
        if valid:
            return {"allowed": True, "blockers": []}
        blockers.append("Conditional release is expired or missing.")
    for item in readiness.items.filter(is_mandatory=True).exclude(
        status__in=[PCDItemStatus.PASSED, PCDItemStatus.NOT_APPLICABLE]
    ):
        blockers.append(f"{item.item_code}: {item.status}")
    return {"allowed": False, "blockers": blockers or [f"PCD is {readiness.readiness_status}."]}


@transaction.atomic
def release_to_cutting(readiness: PCDReadiness, *, released_by=None) -> PCDReadiness:
    validation = validate_release_to_cutting(readiness)
    if not validation["allowed"]:
        raise ValidationError("; ".join(validation["blockers"]))
    readiness.released_to_cutting_at = timezone.now()
    readiness.readiness_status = PCDReadinessStatus.RELEASED
    readiness.updated_by = released_by
    readiness.save(
        update_fields=["released_to_cutting_at", "readiness_status", "updated_by", "updated_at"]
    )
    record_lifecycle_event(
        readiness.order,
        event_code="pcd.released_to_cutting",
        to_stage=OrderStage.CUTTING,
        message="PCD released to cutting.",
        performed_by=released_by,
        metadata={"pcdReadinessId": str(readiness.id)},
    )
    write_audit_event(
        event_code="PCD_RELEASED_TO_CUTTING",
        entity_type="PCDReadiness",
        entity_id=str(readiness.id),
        entity_display_code=readiness.order.order_no,
        action="release_to_cutting",
        performed_by=released_by,
        new_value_json={"status": PCDReadinessStatus.RELEASED},
        source="WEB" if released_by else "SEED",
    )
    return readiness
