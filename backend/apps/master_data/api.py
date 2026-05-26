from django.views.decorators.http import require_GET

from apps.common.decorators import api_permission_required
from apps.common.responses import api_response

from .models import (
    Buyer,
    Customer,
    DefectCode,
    Material,
    PlanningThreshold,
    ProductType,
    Vendor,
)


def ref(item) -> dict[str, object]:
    return {"id": str(item.id), "code": item.code, "name": item.name, "isActive": item.is_active}


def serialize_customer(customer: Customer) -> dict[str, object]:
    data = ref(customer)
    data["priorityLevel"] = customer.priority_level
    data["defaultAqlLevel"] = customer.default_aql_level
    return data


def serialize_buyer(buyer: Buyer) -> dict[str, object]:
    data = ref(buyer)
    data["customerId"] = str(buyer.customer_id)
    data["customerCode"] = buyer.customer.code
    return data


def serialize_vendor(vendor: Vendor) -> dict[str, object]:
    data = ref(vendor)
    data.update(
        {
            "vendorType": vendor.vendor_type,
            "nominated": vendor.nominated,
            "standardLeadTimeDays": vendor.standard_lead_time_days,
        }
    )
    return data


def serialize_material(material: Material) -> dict[str, object]:
    data = ref(material)
    data.update(
        {
            "materialType": material.material_type,
            "uom": material.uom,
            "standardLeadTimeDays": material.standard_lead_time_days,
            "defaultVendorId": str(material.default_vendor_id)
            if material.default_vendor_id
            else None,
            "nominatedVendorRequired": material.nominated_vendor_required,
            "inspectionRequired": material.inspection_required,
        }
    )
    return data


def serialize_threshold(threshold: PlanningThreshold) -> dict[str, object]:
    data = ref(threshold)
    data.update(
        {
            "thresholdType": threshold.threshold_type,
            "value": float(threshold.value),
            "unit": threshold.unit,
        }
    )
    return data


@require_GET
@api_permission_required("master_data.view")
def customers_view(_request):
    customers = Customer.objects.filter(is_active=True).order_by("code")
    return api_response([serialize_customer(customer) for customer in customers])


@require_GET
@api_permission_required("master_data.view")
def buyers_view(_request):
    buyers = Buyer.objects.filter(is_active=True).select_related("customer").order_by("code")
    return api_response([serialize_buyer(buyer) for buyer in buyers])


@require_GET
@api_permission_required("master_data.view")
def vendors_view(_request):
    vendors = Vendor.objects.filter(is_active=True).order_by("code")
    return api_response([serialize_vendor(vendor) for vendor in vendors])


@require_GET
@api_permission_required("master_data.view")
def materials_view(_request):
    materials = (
        Material.objects.filter(is_active=True).select_related("default_vendor").order_by("code")
    )
    return api_response([serialize_material(material) for material in materials])


@require_GET
@api_permission_required("master_data.view")
def product_types_view(_request):
    product_types = ProductType.objects.filter(is_active=True).order_by("code")
    return api_response([ref(product_type) for product_type in product_types])


@require_GET
@api_permission_required("master_data.view")
def defect_codes_view(_request):
    defect_codes = DefectCode.objects.filter(is_active=True).order_by("code")
    return api_response([ref(defect_code) for defect_code in defect_codes])


@require_GET
@api_permission_required("master_data.view")
def thresholds_view(_request):
    thresholds = PlanningThreshold.objects.filter(is_active=True).order_by("code")
    return api_response([serialize_threshold(threshold) for threshold in thresholds])
