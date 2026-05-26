from django.views.decorators.http import require_GET

from apps.common.decorators import api_login_required
from apps.common.responses import api_response

from .models import AuditEvent


def serialize_audit_event(event: AuditEvent) -> dict[str, object]:
    return {
        "id": str(event.id),
        "eventCode": event.event_code,
        "entityType": event.entity_type,
        "entityId": event.entity_id,
        "entityDisplayCode": event.entity_display_code,
        "action": event.action,
        "oldValueJson": event.old_value_json,
        "newValueJson": event.new_value_json,
        "reason": event.reason,
        "metadata": event.metadata,
        "performedBy": event.performed_by_id,
        "source": event.source,
        "createdAt": event.created_at.isoformat(),
    }


@require_GET
@api_login_required
def entity_audit_view(_request, entity_type: str, entity_id: str):
    events = AuditEvent.objects.filter(entity_type=entity_type, entity_id=entity_id).order_by(
        "-created_at"
    )
    return api_response([serialize_audit_event(event) for event in events])
