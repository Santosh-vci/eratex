from django.core.exceptions import ValidationError

from apps.common.models import ApprovalStatus
from apps.master_data.models import Material
from apps.style_technical.models import BOMHeader


def ensure_not_approved(record) -> None:
    if record.status == ApprovalStatus.APPROVED:
        raise ValidationError("Approved records cannot be edited directly. Clone a new version.")


def validate_bom(bom: BOMHeader) -> list[str]:
    messages: list[str] = []
    lines = list(bom.lines.select_related("material"))
    if not lines:
        messages.append("BOM must have at least one material line.")
    if not any(line.material.material_type == Material.MaterialType.MAIN_FABRIC for line in lines):
        messages.append("BOM must include a main fabric line.")
    for line in lines:
        if line.consumption_per_piece <= 0:
            messages.append(f"{line.material.code} consumption must be greater than zero.")
        if not line.required_stage:
            messages.append(f"{line.material.code} required stage is missing.")
    return messages
