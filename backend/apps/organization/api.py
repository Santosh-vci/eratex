from django.views.decorators.http import require_GET

from apps.common.decorators import api_login_required
from apps.common.responses import api_response

from .models import Department, Factory, Line, Workcenter


def serialize_factory(factory: Factory) -> dict[str, object]:
    return {
        "id": str(factory.id),
        "code": factory.code,
        "name": factory.name,
        "timezone": factory.timezone,
        "isActive": factory.is_active,
    }


def serialize_department(department: Department) -> dict[str, object]:
    return {
        "id": str(department.id),
        "factoryId": str(department.factory_id),
        "code": department.code,
        "name": department.name,
        "departmentType": department.department_type,
        "isActive": department.is_active,
    }


def serialize_workcenter(workcenter: Workcenter) -> dict[str, object]:
    return {
        "id": str(workcenter.id),
        "factoryId": str(workcenter.factory_id),
        "departmentId": str(workcenter.department_id),
        "code": workcenter.code,
        "name": workcenter.name,
        "workcenterType": workcenter.workcenter_type,
        "capacityUnit": workcenter.capacity_unit,
        "isActive": workcenter.is_active,
    }


def serialize_line(line: Line) -> dict[str, object]:
    return {
        "id": str(line.id),
        "factoryId": str(line.factory_id),
        "departmentId": str(line.department_id),
        "workcenterId": str(line.workcenter_id) if line.workcenter_id else None,
        "code": line.code,
        "name": line.name,
        "lineType": line.line_type,
        "isActive": line.is_active,
    }


@require_GET
@api_login_required
def factories_view(_request):
    factories = Factory.objects.filter(is_active=True).order_by("code")
    return api_response([serialize_factory(factory) for factory in factories])


@require_GET
@api_login_required
def departments_view(_request):
    departments = (
        Department.objects.filter(is_active=True).select_related("factory").order_by("code")
    )
    return api_response([serialize_department(department) for department in departments])


@require_GET
@api_login_required
def workcenters_view(_request):
    workcenters = (
        Workcenter.objects.filter(is_active=True)
        .select_related("factory", "department")
        .order_by("code")
    )
    return api_response([serialize_workcenter(workcenter) for workcenter in workcenters])


@require_GET
@api_login_required
def lines_view(_request):
    lines = (
        Line.objects.filter(is_active=True)
        .select_related("factory", "department", "workcenter")
        .order_by("code")
    )
    return api_response([serialize_line(line) for line in lines])
