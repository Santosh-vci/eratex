import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.responses import api_response
from apps.external_plans.models import ExternalPlanImportBatch
from apps.external_plans.services.validation import (
    create_draft_plan_from_import,
    import_external_plan,
    reject_external_plan,
    validate_external_plan,
)
from apps.planning.api import serialize_plan


@require_POST
@api_permission_required("external_plan.import")
def external_plan_import_view(request):
    try:
        payload = _payload(request)
        batch = import_external_plan(
            source_type=payload.get("sourceType", "external_plan"),
            rows=payload.get("rows", []),
            source_reference=payload.get("sourceReference", ""),
            imported_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        return api_response(
            None,
            errors=error_response("EXTERNAL_PLAN_IMPORT_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(serialize_external_plan_import(batch), status=201)


@require_GET
@api_permission_required("external_plan.validate")
def external_plan_validation_view(request, import_id):
    batch = get_object_or_404(ExternalPlanImportBatch, id=import_id)
    validate_external_plan(batch, validated_by=request.user)
    return api_response(serialize_external_plan_import(batch))


@require_POST
@api_permission_required("external_plan.create_draft_plan")
def external_plan_create_draft_view(request, import_id):
    batch = get_object_or_404(ExternalPlanImportBatch, id=import_id)
    try:
        plan = create_draft_plan_from_import(batch, created_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("EXTERNAL_PLAN_DRAFT_INVALID", _error_message(error)),
            status=400,
        )
    return api_response(
        {"import": serialize_external_plan_import(batch), "plan": serialize_plan(plan)}
    )


@require_POST
@api_permission_required("external_plan.validate")
def external_plan_reject_view(request, import_id):
    batch = get_object_or_404(ExternalPlanImportBatch, id=import_id)
    batch = reject_external_plan(batch, rejected_by=request.user)
    return api_response(serialize_external_plan_import(batch))


def serialize_external_plan_import(batch: ExternalPlanImportBatch) -> dict[str, object]:
    return {
        "id": str(batch.id),
        "importNo": batch.import_no,
        "sourceType": batch.source_type,
        "status": batch.status,
        "sourceReference": batch.source_reference,
        "rowCount": len(batch.raw_rows_json),
        "validationSummary": batch.validation_summary_json,
        "createdDraftPlanId": str(batch.created_draft_plan_id)
        if batch.created_draft_plan_id
        else None,
        "validationResults": [
            {
                "id": str(result.id),
                "conflictType": result.conflict_type,
                "severity": result.severity,
                "rowNumber": result.row_number,
                "orderNo": result.order_no,
                "message": result.message,
                "metadata": result.metadata_json,
            }
            for result in batch.validation_results.all()
        ],
        "createdAt": batch.created_at.isoformat(),
    }


def _payload(request) -> dict:
    return json.loads(request.body.decode("utf-8") or "{}")


def _error_message(error: Exception) -> str:
    if isinstance(error, ValidationError):
        return "; ".join(error.messages)
    return "External plan payload is invalid."
