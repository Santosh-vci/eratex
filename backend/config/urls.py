from django.contrib import admin
from django.urls import path

from apps.audit_governance.api import entity_audit_view
from apps.boundary_cases.api import (
    boundary_case_apply_action_view,
    boundary_case_approve_action_view,
    boundary_case_create_view,
    boundary_case_detail_view,
    boundary_case_impact_preview_view,
    boundary_cases_view,
)
from apps.common.views import health_view, ping_view
from apps.cutting.api import (
    cutting_handover_to_sewing_view,
    cutting_job_detail_view,
    cutting_job_start_view,
    cutting_jobs_view,
    cutting_output_correct_view,
    cutting_output_create_view,
)
from apps.external_plans.api import (
    external_plan_create_draft_view,
    external_plan_import_view,
    external_plan_reject_view,
    external_plan_validation_view,
)
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
    order_cancel_impact_preview_view,
    order_cancel_request_view,
    order_change_apply_view,
    order_change_approve_view,
    order_change_impact_preview_view,
    order_change_request_view,
    order_detail_view,
    order_release_to_cutting_view,
    order_shipment_pull_in_apply_view,
    order_shipment_pull_in_approve_view,
    order_shipment_pull_in_preview_view,
    order_shipment_pull_in_request_view,
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
from apps.planning.api import (
    plan_change_approve_view,
    plan_change_request_view,
    weekly_plan_assign_item_view,
    weekly_plan_freeze_view,
    weekly_plan_impact_preview_view,
    weekly_planning_view,
)
from apps.production_release.api import (
    daily_releases_view,
    release_approve_override_view,
    release_complete_view,
    release_create_view,
    release_request_override_view,
    release_validate_view,
)
from apps.sewing.api import (
    line_realignment_apply_view,
    line_realignment_approve_view,
    line_realignment_create_view,
    line_realignment_detail_view,
    line_realignment_preview_view,
    line_realignment_reject_view,
    line_style_fit_view,
    sewing_line_efficiency_view,
    sewing_line_loading_activate_view,
    sewing_line_loading_board_view,
    sewing_line_loading_close_view,
    sewing_line_loading_create_view,
    sewing_line_loading_detail_view,
    sewing_line_loading_preview_view,
    sewing_line_loadings_view,
    sewing_output_correct_view,
    sewing_output_create_view,
    sewing_output_view,
)
from apps.style_technical.api import (
    bom_detail_view,
    boms_view,
    operation_bulletin_approve_view,
    operation_bulletin_clone_view,
    operation_bulletin_detail_view,
    operation_bulletin_performance_view,
    operation_bulletins_collection_view,
    operation_masters_view,
    style_detail_view,
    style_readiness_view,
    styles_view,
    wash_route_approve_view,
    wash_route_detail_view,
    wash_routes_view,
)
from apps.wip_inventory.api import order_wip_summary_view, wip_movements_view
from apps.workcenters.api import (
    capacity_days_view,
    capacity_event_apply_view,
    capacity_event_approve_view,
    capacity_event_create_view,
    capacity_event_impact_preview_view,
    current_constraint_view,
    line_capability_view,
    machine_types_view,
    machines_view,
    workcenter_load_view,
    workcenter_queue_view,
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
    path(
        "api/v1/operation-bulletins/<uuid:bulletin_id>/performance",
        operation_bulletin_performance_view,
        name="api-operation-bulletin-performance",
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
    path("api/v1/planning/weekly", weekly_planning_view, name="api-planning-weekly"),
    path(
        "api/v1/planning/weekly/<uuid:plan_id>/assign-item",
        weekly_plan_assign_item_view,
        name="api-planning-weekly-assign",
    ),
    path(
        "api/v1/planning/weekly/<uuid:plan_id>/impact-preview",
        weekly_plan_impact_preview_view,
        name="api-planning-weekly-impact",
    ),
    path(
        "api/v1/planning/weekly/<uuid:plan_id>/freeze",
        weekly_plan_freeze_view,
        name="api-planning-weekly-freeze",
    ),
    path(
        "api/v1/planning/change-requests",
        plan_change_request_view,
        name="api-planning-change-request",
    ),
    path(
        "api/v1/planning/change-requests/<uuid:change_id>/approve",
        plan_change_approve_view,
        name="api-planning-change-approve",
    ),
    path("api/v1/workcenters/load", workcenter_load_view, name="api-workcenters-load"),
    path(
        "api/v1/workcenters/<uuid:workcenter_id>/queue",
        workcenter_queue_view,
        name="api-workcenters-queue",
    ),
    path(
        "api/v1/workcenters/current-constraint",
        current_constraint_view,
        name="api-workcenters-current-constraint",
    ),
    path(
        "api/v1/capacity-events/impact-preview",
        capacity_event_impact_preview_view,
        name="api-capacity-event-impact-preview",
    ),
    path("api/v1/capacity-events", capacity_event_create_view, name="api-capacity-event-create"),
    path(
        "api/v1/capacity-events/<uuid:event_id>/approve",
        capacity_event_approve_view,
        name="api-capacity-event-approve",
    ),
    path(
        "api/v1/capacity-events/<uuid:event_id>/apply",
        capacity_event_apply_view,
        name="api-capacity-event-apply",
    ),
    path("api/v1/releases/daily", daily_releases_view, name="api-releases-daily"),
    path("api/v1/releases/validate", release_validate_view, name="api-releases-validate"),
    path("api/v1/releases", release_create_view, name="api-releases-create"),
    path(
        "api/v1/releases/<uuid:release_id>/request-override",
        release_request_override_view,
        name="api-releases-request-override",
    ),
    path(
        "api/v1/releases/<uuid:release_id>/approve-override",
        release_approve_override_view,
        name="api-releases-approve-override",
    ),
    path(
        "api/v1/releases/<uuid:release_id>/complete",
        release_complete_view,
        name="api-releases-complete",
    ),
    path("api/v1/orders", orders_collection_view, name="api-orders"),
    path("api/v1/orders/<uuid:order_id>", order_detail_view, name="api-order-detail"),
    path(
        "api/v1/orders/<uuid:order_id>/change-impact-preview",
        order_change_impact_preview_view,
        name="api-order-change-impact-preview",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/change-request",
        order_change_request_view,
        name="api-order-change-request",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/cancel-impact-preview",
        order_cancel_impact_preview_view,
        name="api-order-cancel-impact-preview",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/cancel-request",
        order_cancel_request_view,
        name="api-order-cancel-request",
    ),
    path(
        "api/v1/orders/change-requests/<uuid:request_id>/approve",
        order_change_approve_view,
        name="api-order-change-approve",
    ),
    path(
        "api/v1/orders/change-requests/<uuid:request_id>/apply",
        order_change_apply_view,
        name="api-order-change-apply",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/shipment-pull-in-preview",
        order_shipment_pull_in_preview_view,
        name="api-shipment-pull-in-preview",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/shipment-pull-in-request",
        order_shipment_pull_in_request_view,
        name="api-shipment-pull-in-request",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/shipment-pull-in-approve",
        order_shipment_pull_in_approve_view,
        name="api-shipment-pull-in-approve",
    ),
    path(
        "api/v1/orders/<uuid:order_id>/shipment-pull-in-apply",
        order_shipment_pull_in_apply_view,
        name="api-shipment-pull-in-apply",
    ),
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
    path("api/v1/cutting/jobs", cutting_jobs_view, name="api-cutting-jobs"),
    path("api/v1/cutting/jobs/<uuid:job_id>", cutting_job_detail_view, name="api-cutting-job"),
    path(
        "api/v1/cutting/jobs/<uuid:job_id>/start",
        cutting_job_start_view,
        name="api-cutting-job-start",
    ),
    path("api/v1/cutting/output", cutting_output_create_view, name="api-cutting-output"),
    path(
        "api/v1/cutting/output/<uuid:output_id>/correct",
        cutting_output_correct_view,
        name="api-cutting-output-correct",
    ),
    path(
        "api/v1/cutting/jobs/<uuid:job_id>/handover-to-sewing",
        cutting_handover_to_sewing_view,
        name="api-cutting-handover-to-sewing",
    ),
    path(
        "api/v1/wip/orders/<uuid:order_id>/summary",
        order_wip_summary_view,
        name="api-wip-order-summary",
    ),
    path("api/v1/wip/movements", wip_movements_view, name="api-wip-movements"),
    path("api/v1/sewing/line-loadings", sewing_line_loadings_view, name="api-sewing-line-loadings"),
    path(
        "api/v1/sewing/line-loading-board",
        sewing_line_loading_board_view,
        name="api-sewing-line-loading-board",
    ),
    path(
        "api/v1/sewing/line-loadings/<uuid:loading_id>",
        sewing_line_loading_detail_view,
        name="api-sewing-line-loading-detail",
    ),
    path(
        "api/v1/sewing/line-loadings/preview",
        sewing_line_loading_preview_view,
        name="api-sewing-line-loading-preview",
    ),
    path(
        "api/v1/sewing/line-loadings/create",
        sewing_line_loading_create_view,
        name="api-sewing-line-loading-create",
    ),
    path(
        "api/v1/sewing/line-loadings/<uuid:loading_id>/activate",
        sewing_line_loading_activate_view,
        name="api-sewing-line-loading-activate",
    ),
    path(
        "api/v1/sewing/line-loadings/<uuid:loading_id>/close",
        sewing_line_loading_close_view,
        name="api-sewing-line-loading-close",
    ),
    path(
        "api/v1/sewing/line-realignment/preview",
        line_realignment_preview_view,
        name="api-line-realignment-preview",
    ),
    path(
        "api/v1/sewing/line-realignment",
        line_realignment_create_view,
        name="api-line-realignment-create",
    ),
    path(
        "api/v1/sewing/line-realignment/<uuid:realignment_id>",
        line_realignment_detail_view,
        name="api-line-realignment-detail",
    ),
    path(
        "api/v1/sewing/line-realignment/<uuid:realignment_id>/approve",
        line_realignment_approve_view,
        name="api-line-realignment-approve",
    ),
    path(
        "api/v1/sewing/line-realignment/<uuid:realignment_id>/apply",
        line_realignment_apply_view,
        name="api-line-realignment-apply",
    ),
    path(
        "api/v1/sewing/line-realignment/<uuid:realignment_id>/reject",
        line_realignment_reject_view,
        name="api-line-realignment-reject",
    ),
    path("api/v1/sewing/output", sewing_output_view, name="api-sewing-output"),
    path("api/v1/sewing/output/create", sewing_output_create_view, name="api-sewing-output-create"),
    path(
        "api/v1/sewing/output/<uuid:output_id>/correct",
        sewing_output_correct_view,
        name="api-sewing-output-correct",
    ),
    path(
        "api/v1/sewing/line-efficiency",
        sewing_line_efficiency_view,
        name="api-sewing-line-efficiency",
    ),
    path("api/v1/sewing/line-style-fit", line_style_fit_view, name="api-sewing-line-style-fit"),
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
    path("api/v1/boundary-cases", boundary_cases_view, name="api-boundary-cases"),
    path(
        "api/v1/boundary-cases/<uuid:event_id>",
        boundary_case_detail_view,
        name="api-boundary-case-detail",
    ),
    path(
        "api/v1/boundary-cases/create",
        boundary_case_create_view,
        name="api-boundary-case-create",
    ),
    path(
        "api/v1/boundary-cases/impact-preview",
        boundary_case_impact_preview_view,
        name="api-boundary-case-impact-preview",
    ),
    path(
        "api/v1/boundary-cases/<uuid:event_id>/approve-action",
        boundary_case_approve_action_view,
        name="api-boundary-case-approve-action",
    ),
    path(
        "api/v1/boundary-cases/<uuid:event_id>/apply-action",
        boundary_case_apply_action_view,
        name="api-boundary-case-apply-action",
    ),
    path(
        "api/v1/external-plans/import", external_plan_import_view, name="api-external-plan-import"
    ),
    path(
        "api/v1/external-plans/<uuid:import_id>/validation",
        external_plan_validation_view,
        name="api-external-plan-validation",
    ),
    path(
        "api/v1/external-plans/<uuid:import_id>/create-draft-plan",
        external_plan_create_draft_view,
        name="api-external-plan-create-draft",
    ),
    path(
        "api/v1/external-plans/<uuid:import_id>/reject",
        external_plan_reject_view,
        name="api-external-plan-reject",
    ),
    path(
        "api/v1/audit/<str:entity_type>/<str:entity_id>", entity_audit_view, name="api-audit-entity"
    ),
]
