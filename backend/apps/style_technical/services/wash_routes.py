from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit_governance.services.audit import write_audit_event
from apps.common.models import ApprovalStatus
from apps.style_technical.models import WashRoute
from apps.style_technical.services.bom import ensure_not_approved


@transaction.atomic
def approve_wash_route(route: WashRoute, *, approved_by) -> WashRoute:
    ensure_not_approved(route)
    if not route.steps.exists():
        raise ValidationError("Wash route must have at least one step before approval.")
    if route.steps.filter(standard_minutes=0).exists():
        raise ValidationError("Wash route steps must define standard minutes before approval.")

    old_status = route.status
    route.status = ApprovalStatus.APPROVED
    route.approved_by = approved_by
    route.approved_at = timezone.now()
    route.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
    write_audit_event(
        event_code="wash_route.approved",
        entity_type="WashRoute",
        entity_id=str(route.id),
        entity_display_code=route.code,
        action="approve",
        performed_by=approved_by,
        old_value_json={"status": old_status},
        new_value_json={"status": route.status},
        source="WEB",
    )
    return route
