from django.contrib import admin

from .models import ApprovalRequest, AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_code",
        "entity_type",
        "entity_id",
        "action",
        "performed_by",
        "created_at",
    )
    search_fields = ("event_code", "entity_type", "entity_id", "entity_display_code", "action")
    list_filter = ("event_code", "entity_type", "source", "created_at")
    readonly_fields = [field.name for field in AuditEvent._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ("entity_type", "entity_id", "status", "requested_by", "created_at")
    search_fields = ("entity_type", "entity_id", "reason")
    list_filter = ("status", "created_at")
