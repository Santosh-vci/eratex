from django.contrib import admin

from apps.external_plans.models import ExternalPlanImportBatch, ExternalPlanValidationResult


class ExternalPlanValidationResultInline(admin.TabularInline):
    model = ExternalPlanValidationResult
    extra = 0
    readonly_fields = ("conflict_type", "severity", "row_number", "order_no", "message")
    can_delete = False


@admin.register(ExternalPlanImportBatch)
class ExternalPlanImportBatchAdmin(admin.ModelAdmin):
    list_display = ("import_no", "source_type", "status", "source_reference", "created_at")
    list_filter = ("source_type", "status")
    search_fields = ("import_no", "source_reference")
    readonly_fields = ("import_no", "created_at", "updated_at")
    inlines = [ExternalPlanValidationResultInline]


@admin.register(ExternalPlanValidationResult)
class ExternalPlanValidationResultAdmin(admin.ModelAdmin):
    list_display = ("import_batch", "conflict_type", "severity", "row_number", "order_no")
    list_filter = ("conflict_type", "severity")
    search_fields = ("import_batch__import_no", "order_no", "message")
