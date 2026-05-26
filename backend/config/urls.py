from django.contrib import admin
from django.urls import path

from apps.audit_governance.api import entity_audit_view
from apps.common.views import health_view, ping_view
from apps.fabric_qc.api import (
    fabric_qc_inspection_create_view,
    fabric_qc_inspection_waive_view,
    fabric_qc_view,
    order_fabric_qc_status_view,
)
from apps.identity_access.api import csrf_view, login_view, logout_view, me_view, permissions_view
from apps.master_data.api import (
    buyers_view,
    customers_view,
    defect_codes_view,
    materials_view,
    product_types_view,
    thresholds_view,
    vendors_view,
)
from apps.materials_procurement.api import (
    close_material_shortage_view,
    material_readiness_view,
    order_material_readiness_view,
    purchase_order_eta_update_view,
    purchase_orders_view,
)
from apps.orders.api import (
    order_detail_view,
    order_release_to_cutting_view,
    order_timeline_view,
    orders_collection_view,
)
from apps.organization.api import departments_view, factories_view, lines_view, workcenters_view
from apps.pcd_readiness.api import (
    order_pcd_readiness_view,
    pcd_approve_conditional_release_view,
    pcd_item_update_view,
    pcd_readiness_detail_view,
    pcd_readiness_list_view,
    pcd_request_conditional_release_view,
)
from apps.style_technical.api import (
    bom_detail_view,
    boms_view,
    operation_bulletin_approve_view,
    operation_bulletin_clone_view,
    operation_bulletin_detail_view,
    operation_bulletins_collection_view,
    operation_masters_view,
    style_detail_view,
    style_readiness_view,
    styles_view,
    wash_route_approve_view,
    wash_route_detail_view,
    wash_routes_view,
)
from apps.workcenters.api import (
    capacity_days_view,
    line_capability_view,
    machine_types_view,
    machines_view,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health_view, name="health"),
    path("api/v1/ping", ping_view, name="api-ping"),
    path("api/v1/me", me_view, name="api-me"),
    path("api/v1/permissions", permissions_view, name="api-permissions"),
    path("api/v1/auth/csrf", csrf_view, name="api-auth-csrf"),
    path("api/v1/auth/login", login_view, name="api-auth-login"),
    path("api/v1/auth/logout", logout_view, name="api-auth-logout"),
    path("api/v1/organization/factories", factories_view, name="api-organization-factories"),
    path("api/v1/organization/departments", departments_view, name="api-organization-departments"),
    path("api/v1/organization/workcenters", workcenters_view, name="api-organization-workcenters"),
    path("api/v1/organization/lines", lines_view, name="api-organization-lines"),
    path("api/v1/master/customers", customers_view, name="api-master-customers"),
    path("api/v1/master/buyers", buyers_view, name="api-master-buyers"),
    path("api/v1/master/vendors", vendors_view, name="api-master-vendors"),
    path("api/v1/master/materials", materials_view, name="api-master-materials"),
    path("api/v1/master/product-types", product_types_view, name="api-master-product-types"),
    path("api/v1/master/machine-types", machine_types_view, name="api-master-machine-types"),
    path("api/v1/master/machines", machines_view, name="api-master-machines"),
    path("api/v1/master/defect-codes", defect_codes_view, name="api-master-defect-codes"),
    path("api/v1/master/thresholds", thresholds_view, name="api-master-thresholds"),
    path("api/v1/styles", styles_view, name="api-styles"),
    path("api/v1/styles/<uuid:style_id>", style_detail_view, name="api-style-detail"),
    path(
        "api/v1/styles/<uuid:style_id>/planning-readiness",
        style_readiness_view,
        name="api-style-readiness",
    ),
    path("api/v1/boms", boms_view, name="api-boms"),
    path("api/v1/boms/<uuid:bom_id>", bom_detail_view, name="api-bom-detail"),
    path("api/v1/operation-masters", operation_masters_view, name="api-operation-masters"),
    path(
        "api/v1/operation-bulletins",
        operation_bulletins_collection_view,
        name="api-operation-bulletins",
    ),
    path(
        "api/v1/operation-bulletins/<uuid:bulletin_id>",
        operation_bulletin_detail_view,
        name="api-operation-bulletin-detail",
    ),
    path(
        "api/v1/operation-bulletins/<uuid:bulletin_id>/approve",
        operation_bulletin_approve_view,
        name="api-operation-bulletin-approve",
    ),
    path(
        "api/v1/operation-bulletins/<uuid:bulletin_id>/clone",
        operation_bulletin_clone_view,
        name="api-operation-bulletin-clone",
    ),
    path("api/v1/wash-routes", wash_routes_view, name="api-wash-routes"),
    path(
        "api/v1/wash-routes/<uuid:route_id>", wash_route_detail_view, name="api-wash-route-detail"
    ),
    path(
        "api/v1/wash-routes/<uuid:route_id>/approve",
        wash_route_approve_view,
        name="api-wash-route-approve",
    ),
    path(
        "api/v1/workcenters/line-capability",
        line_capability_view,
        name="api-line-capability",
    ),
    path("api/v1/workcenters/capacity-days", capacity_days_view, name="api-capacity-days"),
    path("api/v1/orders", orders_collection_view, name="api-orders"),
    path("api/v1/orders/<uuid:order_id>", order_detail_view, name="api-order-detail"),
    path(
        "api/v1/orders/<uuid:order_id>/timeline",
        order_timeline_view,
        name="api-order-timeline",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/release-to-cutting",
        order_release_to_cutting_view,
        name="api-order-release-to-cutting",
    ),
    path("api/v1/material-readiness", material_readiness_view, name="api-material-readiness"),
    path(
        "api/v1/orders/<uuid:order_id>/material-readiness",
        order_material_readiness_view,
        name="api-order-material-readiness",
    ),
    path(
        "api/v1/procurement/purchase-orders",
        purchase_orders_view,
        name="api-procurement-purchase-orders",
    ),
    path(
        "api/v1/procurement/purchase-orders/<uuid:purchase_order_id>/eta-updates",
        purchase_order_eta_update_view,
        name="api-procurement-eta-update",
    ),
    path(
        "api/v1/material-readiness/<uuid:requirement_id>/close-shortage",
        close_material_shortage_view,
        name="api-material-shortage-close",
    ),
    path("api/v1/fabric-qc", fabric_qc_view, name="api-fabric-qc"),
    path(
        "api/v1/orders/<uuid:order_id>/fabric-qc-status",
        order_fabric_qc_status_view,
        name="api-order-fabric-qc",
    ),
    path(
        "api/v1/fabric-qc/inspections",
        fabric_qc_inspection_create_view,
        name="api-fabric-qc-inspections",
    ),
    path(
        "api/v1/fabric-qc/inspections/<uuid:inspection_id>/waive",
        fabric_qc_inspection_waive_view,
        name="api-fabric-qc-waive",
    ),
    path("api/v1/pcd-readiness", pcd_readiness_list_view, name="api-pcd-readiness"),
    path(
        "api/v1/pcd-readiness/<uuid:readiness_id>",
        pcd_readiness_detail_view,
        name="api-pcd-readiness-detail",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/pcd-readiness",
        order_pcd_readiness_view,
        name="api-order-pcd-readiness",
    ),
    path(
        "api/v1/pcd-readiness/<uuid:readiness_id>/items/<uuid:item_id>",
        pcd_item_update_view,
        name="api-pcd-item-update",
    ),
    path(
        "api/v1/pcd-readiness/<uuid:readiness_id>/request-conditional-release",
        pcd_request_conditional_release_view,
        name="api-pcd-request-conditional",
    ),
    path(
        "api/v1/pcd-readiness/<uuid:readiness_id>/approve-conditional-release",
        pcd_approve_conditional_release_view,
        name="api-pcd-approve-conditional",
    ),
    path(
        "api/v1/audit/<str:entity_type>/<str:entity_id>", entity_audit_view, name="api-audit-entity"
    ),
]
