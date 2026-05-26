import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.common.decorators import api_permission_required
from apps.common.errors import error_response
from apps.common.models import ApprovalStatus
from apps.common.responses import api_response
from apps.master_data.api import serialize_material
from apps.style_technical.models import (
    BOMHeader,
    OperationBulletin,
    OperationBulletinLine,
    OperationMaster,
    Style,
    WashRoute,
)
from apps.style_technical.services.operation_bulletins import (
    approve_bulletin,
    clone_bulletin,
)
from apps.style_technical.services.readiness import get_style_planning_readiness
from apps.style_technical.services.wash_routes import approve_wash_route


def serialize_style_list_item(style: Style) -> dict[str, object]:
    readiness = get_style_planning_readiness(style)
    return {
        "id": str(style.id),
        "styleCode": style.style_code,
        "customerName": style.customer.name,
        "customerCode": style.customer.code,
        "buyerName": style.buyer.name if style.buyer else None,
        "productType": style.product_type.code,
        "washComplexity": style.wash_complexity,
        "sewingComplexity": style.sewing_complexity,
        "overallComplexity": style.overall_complexity,
        "status": style.status,
        "planningReady": readiness["planningReady"],
        "missingItems": readiness["missingItems"],
    }


def serialize_style_detail(style: Style) -> dict[str, object]:
    data = serialize_style_list_item(style)
    data.update(
        {
            "description": style.description,
            "fitType": style.fit_type,
            "fabricCategory": style.fabric_category,
            "season": style.season,
            "referenceSampleNo": style.reference_sample_no,
            "defaultWashRouteId": (
                str(style.default_wash_route_id) if style.default_wash_route_id else None
            ),
            "readiness": get_style_planning_readiness(style),
        }
    )
    return data


def serialize_bom_header(bom: BOMHeader, include_lines: bool = False) -> dict[str, object]:
    data = {
        "id": str(bom.id),
        "styleId": str(bom.style_id),
        "styleCode": bom.style.style_code,
        "version": bom.version,
        "status": bom.status,
        "effectiveDate": bom.effective_date.isoformat() if bom.effective_date else None,
        "approvedAt": bom.approved_at.isoformat() if bom.approved_at else None,
        "lineCount": bom.lines.count(),
    }
    if include_lines:
        data["lines"] = [
            {
                "id": str(line.id),
                "material": serialize_material(line.material),
                "consumptionPerPiece": float(line.consumption_per_piece),
                "wastagePercent": float(line.wastage_percent),
                "uom": line.uom,
                "requiredStage": line.required_stage,
                "nominatedVendorRequired": line.nominated_vendor_required,
            }
            for line in bom.lines.select_related("material", "material__default_vendor")
        ]
    return data


def serialize_operation_master(operation: OperationMaster) -> dict[str, object]:
    return {
        "id": str(operation.id),
        "code": operation.code,
        "name": operation.name,
        "operationGroup": operation.operation_group,
        "defaultMachineTypeId": (
            str(operation.default_machine_type_id) if operation.default_machine_type_id else None
        ),
        "defaultMachineTypeCode": (
            operation.default_machine_type.code if operation.default_machine_type else None
        ),
        "defaultSkillLevel": operation.default_skill_level,
        "isActive": operation.is_active,
    }


def serialize_bulletin_line(line: OperationBulletinLine) -> dict[str, object]:
    return {
        "id": str(line.id),
        "sequenceNo": line.sequence_no,
        "operationMasterId": str(line.operation_id),
        "operationCode": line.operation.code,
        "operationName": line.operation_name,
        "operationGroup": line.operation_group,
        "machineTypeId": str(line.machine_type_id) if line.machine_type_id else None,
        "machineType": line.machine_type.code if line.machine_type else None,
        "attachmentRequired": line.attachment_required,
        "skillLevel": line.skill_level,
        "smv": float(line.smv),
        "targetPph": float(line.target_pph),
        "qcCheckpoint": line.qc_checkpoint,
        "criticalOperation": line.critical_operation,
        "parallelAllowed": line.parallel_allowed,
        "reworkSensitive": line.rework_sensitive,
    }


def serialize_bulletin(
    bulletin: OperationBulletin, include_lines: bool = False
) -> dict[str, object]:
    lines = bulletin.lines.all()
    data = {
        "id": str(bulletin.id),
        "styleId": str(bulletin.style_id),
        "styleCode": bulletin.style.style_code,
        "customerName": bulletin.style.customer.name,
        "productType": bulletin.style.product_type.code,
        "version": bulletin.version,
        "status": bulletin.status,
        "totalSmv": float(bulletin.total_smv),
        "operationCount": lines.count(),
        "criticalOperationCount": lines.filter(critical_operation=True).count(),
        "approvedAt": bulletin.approved_at.isoformat() if bulletin.approved_at else None,
    }
    if include_lines:
        data["operations"] = [
            serialize_bulletin_line(line)
            for line in lines.select_related("operation", "machine_type").order_by("sequence_no")
        ]
    return data


def serialize_wash_route(route: WashRoute, include_steps: bool = False) -> dict[str, object]:
    data = {
        "id": str(route.id),
        "code": route.code,
        "name": route.name,
        "productType": route.product_type.code if route.product_type else None,
        "complexity": route.complexity,
        "status": route.status,
        "approvedAt": route.approved_at.isoformat() if route.approved_at else None,
        "stepCount": route.steps.count(),
    }
    if include_steps:
        data["steps"] = [
            {
                "id": str(step.id),
                "sequenceNo": step.sequence_no,
                "name": step.name,
                "workcenterId": str(step.workcenter_id) if step.workcenter_id else None,
                "workcenterCode": step.workcenter.code if step.workcenter else None,
                "machineTypeId": str(step.machine_type_id) if step.machine_type_id else None,
                "machineType": step.machine_type.code if step.machine_type else None,
                "standardMinutes": step.standard_minutes,
                "qcStep": step.qc_step,
                "required": step.required,
            }
            for step in route.steps.select_related("workcenter", "machine_type").order_by(
                "sequence_no"
            )
        ]
    return data


@require_GET
@api_permission_required("master_data.view")
def styles_view(request):
    styles = Style.objects.filter(is_active=True).select_related(
        "customer",
        "buyer",
        "product_type",
        "default_wash_route",
    )
    status = request.GET.get("status")
    search = request.GET.get("search")
    if status:
        styles = styles.filter(status=status)
    if search:
        styles = styles.filter(style_code__icontains=search)
    return api_response(
        [serialize_style_list_item(style) for style in styles.order_by("style_code")]
    )


@require_GET
@api_permission_required("master_data.view")
def style_detail_view(_request, style_id):
    style = get_object_or_404(
        Style.objects.select_related("customer", "buyer", "product_type", "default_wash_route"),
        id=style_id,
    )
    return api_response(serialize_style_detail(style))


@require_GET
@api_permission_required("master_data.view")
def style_readiness_view(_request, style_id):
    style = get_object_or_404(Style.objects.select_related("default_wash_route"), id=style_id)
    return api_response(get_style_planning_readiness(style))


@require_GET
@api_permission_required("master_data.view")
def boms_view(_request):
    boms = (
        BOMHeader.objects.filter(is_active=True)
        .select_related("style")
        .prefetch_related("lines")
        .order_by("style__style_code", "version")
    )
    return api_response([serialize_bom_header(bom) for bom in boms])


@require_GET
@api_permission_required("master_data.view")
def bom_detail_view(_request, bom_id):
    bom = get_object_or_404(
        BOMHeader.objects.select_related("style").prefetch_related("lines__material"),
        id=bom_id,
    )
    return api_response(serialize_bom_header(bom, include_lines=True))


@require_GET
@api_permission_required("bulletin.view")
def operation_masters_view(_request):
    operations = (
        OperationMaster.objects.filter(is_active=True)
        .select_related("default_machine_type")
        .order_by("operation_group", "code")
    )
    return api_response([serialize_operation_master(operation) for operation in operations])


@require_GET
@api_permission_required("bulletin.view")
def operation_bulletins_view(_request):
    bulletins = (
        OperationBulletin.objects.filter(is_active=True)
        .select_related("style", "style__customer", "style__product_type")
        .prefetch_related("lines")
        .order_by("style__style_code", "version")
    )
    return api_response([serialize_bulletin(bulletin) for bulletin in bulletins])


@api_permission_required("bulletin.view")
def operation_bulletins_collection_view(request):
    if request.method == "GET":
        return operation_bulletins_view.__wrapped__(request)
    if request.method == "POST":
        from apps.identity_access.services.permissions import user_has_permission

        if not user_has_permission(request.user, "bulletin.create"):
            return api_response(
                None,
                errors=error_response("PERMISSION_DENIED", "Permission denied."),
                status=403,
            )
        return operation_bulletin_create_view.__wrapped__(request)
    return api_response(
        None,
        errors=error_response("METHOD_NOT_ALLOWED", "Method is not allowed."),
        status=405,
    )


@require_POST
@api_permission_required("bulletin.create")
def operation_bulletin_create_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        style = Style.objects.get(id=payload["styleId"])
        version = payload["version"]
    except (json.JSONDecodeError, KeyError, Style.DoesNotExist):
        return api_response(
            None,
            errors=error_response("INVALID_BULLETIN_PAYLOAD", "Bulletin payload is invalid."),
            status=400,
        )

    bulletin = OperationBulletin.objects.create(
        style=style,
        version=version,
        status=ApprovalStatus.DRAFT,
        created_by=request.user,
        updated_by=request.user,
    )
    return api_response(serialize_bulletin(bulletin, include_lines=True), status=201)


@require_GET
@api_permission_required("bulletin.view")
def operation_bulletin_detail_view(_request, bulletin_id):
    bulletin = get_object_or_404(
        OperationBulletin.objects.select_related(
            "style", "style__customer", "style__product_type"
        ).prefetch_related("lines__operation", "lines__machine_type"),
        id=bulletin_id,
    )
    return api_response(serialize_bulletin(bulletin, include_lines=True))


@require_POST
@api_permission_required("bulletin.approve")
def operation_bulletin_approve_view(request, bulletin_id):
    bulletin = get_object_or_404(OperationBulletin, id=bulletin_id)
    try:
        approved = approve_bulletin(bulletin, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("BULLETIN_APPROVAL_FAILED", "; ".join(error.messages)),
            status=400,
        )
    return api_response(serialize_bulletin(approved))


@require_POST
@api_permission_required("bulletin.clone")
def operation_bulletin_clone_view(request, bulletin_id):
    bulletin = get_object_or_404(OperationBulletin, id=bulletin_id)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        cloned = clone_bulletin(
            bulletin,
            new_version=payload.get("version", f"{bulletin.version}-COPY"),
            created_by=request.user,
        )
    except (json.JSONDecodeError, ValidationError) as error:
        message = (
            "; ".join(error.messages) if isinstance(error, ValidationError) else "Invalid JSON."
        )
        return api_response(
            None,
            errors=error_response("BULLETIN_CLONE_FAILED", message),
            status=400,
        )
    return api_response(serialize_bulletin(cloned, include_lines=True), status=201)


@require_GET
@api_permission_required("master_data.view")
def wash_routes_view(_request):
    routes = (
        WashRoute.objects.filter(is_active=True)
        .select_related("product_type")
        .prefetch_related("steps")
        .order_by("code")
    )
    return api_response([serialize_wash_route(route) for route in routes])


@require_GET
@api_permission_required("master_data.view")
def wash_route_detail_view(_request, route_id):
    route = get_object_or_404(
        WashRoute.objects.select_related("product_type").prefetch_related(
            "steps__workcenter",
            "steps__machine_type",
        ),
        id=route_id,
    )
    return api_response(serialize_wash_route(route, include_steps=True))


@require_POST
@api_permission_required("master_data.approve")
def wash_route_approve_view(request, route_id):
    route = get_object_or_404(WashRoute, id=route_id)
    try:
        approved = approve_wash_route(route, approved_by=request.user)
    except ValidationError as error:
        return api_response(
            None,
            errors=error_response("WASH_ROUTE_APPROVAL_FAILED", "; ".join(error.messages)),
            status=400,
        )
    return api_response(serialize_wash_route(approved))
