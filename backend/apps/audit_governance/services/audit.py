from typing import Any

from apps.audit_governance.models import AuditEvent


def write_audit_event(
    *,
    event_code: str,
    entity_type: str,
    entity_id: str,
    action: str,
    performed_by=None,
    entity_display_code: str = "",
    old_value_json: dict[str, Any] | None = None,
    new_value_json: dict[str, Any] | None = None,
    reason: str = "",
    metadata: dict[str, Any] | None = None,
    source: str = "SYSTEM",
) -> AuditEvent:
    return AuditEvent.objects.create(
        event_code=event_code,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_display_code=entity_display_code,
        action=action,
        old_value_json=old_value_json or {},
        new_value_json=new_value_json or {},
        reason=reason,
        metadata=metadata or {},
        performed_by=performed_by,
        source=source,
    )
