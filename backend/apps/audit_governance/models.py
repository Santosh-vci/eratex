from django.conf import settings
from django.db import models

from apps.common.models import ApprovalStatus, BaseModel


class AuditEvent(BaseModel):
    event_code = models.CharField(max_length=120)
    entity_type = models.CharField(max_length=120)
    entity_id = models.CharField(max_length=120)
    entity_display_code = models.CharField(max_length=160, blank=True)
    action = models.CharField(max_length=120)
    old_value_json = models.JSONField(default=dict, blank=True)
    new_value_json = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )
    source = models.CharField(max_length=32, default="SYSTEM")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["event_code"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_code}:{self.entity_type}:{self.entity_id}"


class ApprovalRequest(BaseModel):
    entity_type = models.CharField(max_length=120)
    entity_id = models.CharField(max_length=120)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approval_requests",
    )
    status = models.CharField(
        max_length=32,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
    )
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.entity_type}:{self.entity_id}:{self.status}"
