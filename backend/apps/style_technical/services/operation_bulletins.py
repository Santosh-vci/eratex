from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import ApprovalStatus
from apps.style_technical.models import OperationBulletin, OperationBulletinLine
from apps.style_technical.services.bom import ensure_not_approved


def calculate_total_smv(bulletin: OperationBulletin) -> Decimal:
    return sum((line.smv for line in bulletin.lines.all()), Decimal("0.00"))


def validate_bulletin_for_approval(bulletin: OperationBulletin) -> list[str]:
    messages: list[str] = []
    lines = list(bulletin.lines.all())
    if not lines:
        messages.append("Operation bulletin must contain operation lines.")
    sequence_numbers = [line.sequence_no for line in lines]
    if len(sequence_numbers) != len(set(sequence_numbers)):
        messages.append("Operation sequence numbers must be unique.")
    for line in lines:
        if line.smv <= 0:
            messages.append(f"Operation {line.sequence_no} SMV must be greater than zero.")
    return messages


@transaction.atomic
def approve_bulletin(bulletin: OperationBulletin, *, approved_by) -> OperationBulletin:
    ensure_not_approved(bulletin)
    messages = validate_bulletin_for_approval(bulletin)
    if messages:
        raise ValidationError(messages)

    old_status = bulletin.status
    bulletin.total_smv = calculate_total_smv(bulletin)
    bulletin.status = ApprovalStatus.APPROVED
    bulletin.approved_by = approved_by
    bulletin.approved_at = timezone.now()
    bulletin.save(update_fields=["total_smv", "status", "approved_by", "approved_at", "updated_at"])
    write_audit_event(
        event_code="operation_bulletin.approved",
        entity_type="OperationBulletin",
        entity_id=str(bulletin.id),
        entity_display_code=str(bulletin),
        action="approve",
        performed_by=approved_by,
        old_value_json={"status": old_status},
        new_value_json={"status": bulletin.status, "totalSmv": float(bulletin.total_smv)},
        source="WEB",
    )
    return bulletin


@transaction.atomic
def clone_bulletin(
    bulletin: OperationBulletin,
    *,
    new_version: str,
    created_by=None,
) -> OperationBulletin:
    if OperationBulletin.objects.filter(style=bulletin.style, version=new_version).exists():
        raise ValidationError("Operation bulletin version already exists for this style.")

    cloned = OperationBulletin.objects.create(
        style=bulletin.style,
        version=new_version,
        status=ApprovalStatus.DRAFT,
        total_smv=bulletin.total_smv,
        effective_date=bulletin.effective_date,
        remarks=f"Cloned from {bulletin.version}",
        created_by=created_by,
        updated_by=created_by,
    )
    for line in bulletin.lines.select_related("operation", "machine_type").order_by("sequence_no"):
        OperationBulletinLine.objects.create(
            bulletin=cloned,
            sequence_no=line.sequence_no,
            operation=line.operation,
            operation_name=line.operation_name,
            operation_group=line.operation_group,
            machine_type=line.machine_type,
            attachment_required=line.attachment_required,
            skill_level=line.skill_level,
            smv=line.smv,
            target_pph=line.target_pph,
            qc_checkpoint=line.qc_checkpoint,
            critical_operation=line.critical_operation,
            parallel_allowed=line.parallel_allowed,
            rework_sensitive=line.rework_sensitive,
            created_by=created_by,
            updated_by=created_by,
        )
    write_audit_event(
        event_code="operation_bulletin.cloned",
        entity_type="OperationBulletin",
        entity_id=str(cloned.id),
        entity_display_code=str(cloned),
        action="clone",
        performed_by=created_by,
        old_value_json={"sourceId": str(bulletin.id), "sourceVersion": bulletin.version},
        new_value_json={"version": cloned.version, "status": cloned.status},
        source="WEB",
    )
    return cloned
