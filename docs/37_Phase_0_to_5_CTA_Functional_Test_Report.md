# Phase 0 to Phase 5 CTA Functional Test Report

Date: 2026-05-27

Scope: all visible CTA actions exercised across the landed Phase 0-5 surfaces, using the live Docker stack at `http://localhost:3000` and the backend API at `http://localhost:8000/api/v1`.

Probe script: `frontend/scripts/phase0_5_cta_probe.mjs`

Evidence directory: `docs/audit_evidence/phase5_cta_validation`

## Result Summary

| Status | Count | Meaning |
|---|---:|---|
| PASS | 31 | CTA reached the expected API endpoint and the endpoint returned a non-error status. |
| INERT_CONFIRMED | 20 | Prototype-visible control exists but has no implemented handler/API call in the current phase. |
| RBAC_GATED | 2 | CTA is now disabled for the lower-permission role; the same operation passes with the authorized role where in scope. |
| Console/runtime issues | 0 | No React duplicate-key or Next runtime overlay errors were observed in the final pass. |

No `API_FAILED`, `MISSING_ENDPOINT`, or `UI_ERROR` results remain in the final CTA probe.

## PCD to Cutting Proof Addendum

The earlier CTA audit was incomplete because it proved the endpoint call but did not prove downstream cutting-room propagation. A focused live UI proof now covers the missing business assertion:

- Flow order: `OPS-ORD-015`
- Request conditional release: `POST /pcd-readiness/{id}/request-conditional-release` returned `201`
- Approve conditional release: `POST /pcd-readiness/{id}/approve-conditional-release` returned `200`
- Release to cutting: `POST /orders/{id}/release-to-cutting` returned `200`
- Cutting room result: `/cutting/room` displayed `CUT-REL-OPS-ORD-015-20260528`

Evidence: `docs/audit_evidence/pcd_cta_proof/pcd_cta_proof_summary.txt` and `docs/audit_evidence/pcd_cta_proof/06_cutting_grid_contains_released_order.png`.

## Fixes Made From CTA Testing

- Fixed duplicate React keys on workcenter load snapshots by using snapshot identity instead of workcenter identity.
- Fixed the same duplicate-key risk in weekly planning load strips and load profile rows.
- Fixed duplicate React keys in shared timeline rows when repeated lifecycle events have the same title and displayed date.
- Wired the order detail `Release to Cutting` CTA to the same governed release flow used by the order drawer.
- Corrected the PCD release-to-cutting implementation so the CTA creates the downstream `ProductionRelease`, `CuttingJob`, and initial cutting WIP lot required by the business specifications.
- Made daily release actions permission-aware so users cannot click endpoints their role cannot call.
- Made line realignment approve/apply permission-aware; `line_supervisor` can request, while `sewing_mgr` approves/applies.
- Made operation bulletin clone versions unique so repeat CTA runs do not collide with an existing draft version.
- Adjusted the operational planning seed so the current draft plan stays freezeable while boundary cases and releases still carry exception scenarios.
- Added a reusable CTA probe that records endpoint reachability, failures, RBAC gating, inert controls, and screenshots.

## Operator Journey Coverage

1. Login: planner signs in, `/auth/csrf` and `/auth/login` succeed.
2. Technical foundation: business admin opens style detail, clones and approves operation bulletins, opens routing, and confirms current placeholder CTAs.
3. Order lifecycle: planning head opens order detail, trace, and releases a PCD-ready order to cutting.
4. Procurement: procurement user opens vendor follow-up, reviews a PO, and saves ETA updates.
5. Fabric QC: fabric QC user opens roll detail; current release/exception buttons are confirmed inert.
6. PCD readiness: planning head requests conditional release, approves it, releases to cutting, then confirms the same order is visible in the cutting room grid as a released cutting job.
7. Weekly planning: planner previews backlog impact, assigns selected backlog, freezes the plan, and submits a governed change request.
8. Workcenter load: planner opens queue detail from the load monitor; export/reevaluate are confirmed inert.
9. Daily release: planner creates release, validates, requests override; planning head approves override and releases to floor.
10. Boundary cases: planning head searches client-side, opens impact preview, approves, and applies the boundary action.
11. Cutting room: cutting user opens the room; current `Record Output` button is confirmed inert because cutting output capture is not wired to the UI yet.
12. Sewing line loading: line supervisor opens a line and creates a realignment request from the recovery CTA.
13. Line realignment: line supervisor previews/requests; sewing manager approves/applies.
14. Sewing output: line supervisor submits gross/defect/rework output and the API records net-good output.

## API-Backed CTA Results

| Surface | CTA | Role | Endpoint Result |
|---|---|---|---|
| Login | Sign in | planner | `GET /auth/csrf`, `POST /auth/login` passed |
| Technical Styles | Open technical file | business_admin | `GET /styles/{id}` passed |
| Operation Bulletins | Clone | business_admin | `POST /operation-bulletins/{id}/clone` passed |
| Operation Bulletins | Approve Bulletin | business_admin | `POST /operation-bulletins/{id}/approve` passed |
| Operation Bulletins | Open routing | business_admin | `GET /operation-bulletins/{id}` passed |
| Orders | Open order detail | planning_head | `GET /orders/{id}` passed |
| Orders | Open Trace | planning_head | `GET /orders/{id}/timeline` passed |
| Orders | Release to Cutting | planning_head | `POST /orders/{id}/release-to-cutting` passed |
| Procurement | Save Updates | procurement_user | `POST /procurement/purchase-orders/{id}/eta-updates` passed |
| PCD Readiness | Request Conditional Release | planning_head | `POST /pcd-readiness/{id}/request-conditional-release` passed |
| PCD Readiness | Approve Conditional Release | planning_head | `POST /pcd-readiness/{id}/approve-conditional-release` passed |
| PCD Readiness | Release to Cutting | planning_head | `POST /orders/{id}/release-to-cutting` passed and now creates the governed cutting release/job |
| Weekly Planning | Backlog order preview | planner | `POST /planning/weekly/{id}/impact-preview` passed |
| Weekly Planning | Assign Selected | planner | `POST /planning/weekly/{id}/assign-item` passed |
| Weekly Planning | Freeze Plan | planner | `POST /planning/weekly/{id}/freeze` passed |
| Weekly Planning | Request Change | planner | `POST /planning/change-requests` passed |
| Workcenter Load | Open Queue | planner | `GET /workcenters/{id}/queue` passed |
| Daily Release | Bulk Release | planner | `POST /releases` passed |
| Daily Release | Validate | planner | `POST /releases/validate` passed |
| Daily Release | Request Override | planner | `POST /releases/{id}/request-override` passed |
| Daily Release | Approve Override | planning_head | `POST /releases/{id}/approve-override` passed |
| Daily Release | Release to Floor | planning_head | `POST /releases/{id}/complete` passed |
| Boundary Cases | Impact preview | planning_head | `POST /boundary-cases/impact-preview` passed |
| Boundary Cases | Approve | planning_head | `POST /boundary-cases/{id}/approve-action` passed |
| Boundary Cases | Apply | planning_head | `POST /boundary-cases/{id}/apply-action` passed |
| Sewing Line Loading | Approve Reassignment | line_supervisor | `POST /sewing/line-realignment` passed |
| Line Realignment | Preview | line_supervisor | `POST /sewing/line-realignment/preview` passed |
| Line Realignment | Request | line_supervisor | `POST /sewing/line-realignment` passed |
| Line Realignment | Approve | sewing_mgr | `POST /sewing/line-realignment/{id}/approve` passed |
| Line Realignment | Apply | sewing_mgr | `POST /sewing/line-realignment/{id}/apply` passed |
| Sewing Output | Submit Output | line_supervisor | `POST /sewing/output` passed |

## Confirmed Inert Controls

These controls are visible in the current UI but do not call an API in Phase 0-5. They should remain on the hardening backlog unless the product decision is to remove or hide them until implemented.

| Surface | Inert CTA |
|---|---|
| Master Data Governance | Audit Log |
| BOM | Export |
| BOM | Filter |
| Operation Bulletins | Create New Bulletin |
| Routing Builder | Release Routing |
| Operator Skill | Add Operator |
| Operator Skill | Export Report |
| Procurement | Export Report |
| Procurement | Log Follow-Up |
| Procurement | Escalate |
| Procurement | Expedite |
| Fabric QC | Release to Cutting |
| Fabric QC | QC Exception |
| PCD Readiness | Filter |
| Weekly Planning | By Style segmented control |
| Workcenter Load | Export Logs |
| Workcenter Load | Reevaluate All Loads |
| Daily Release | Export |
| Boundary Cases | Search boundary cases |
| Cutting Room | Record Output |

## RBAC-Gated Controls

| Surface | CTA | Lower Role | Expected Owner | Result |
|---|---|---|---|---|
| Line Realignment | Approve | line_supervisor | sewing_mgr | Disabled for supervisor; API pass as sewing manager |
| Line Realignment | Apply | line_supervisor | sewing_mgr | Disabled for supervisor; API pass as sewing manager |

## Screenshot Evidence

| Evidence | File |
|---|---|
| Technical style detail | `docs/audit_evidence/phase5_cta_validation/cta_technical_style_detail.png` |
| Routing builder | `docs/audit_evidence/phase5_cta_validation/cta_routing_builder.png` |
| Order detail | `docs/audit_evidence/phase5_cta_validation/cta_order_detail.png` |
| Weekly impact preview | `docs/audit_evidence/phase5_cta_validation/cta_weekly_impact_preview.png` |
| Workcenter queue | `docs/audit_evidence/phase5_cta_validation/cta_workcenter_load_queue.png` |
| Daily release validation | `docs/audit_evidence/phase5_cta_validation/cta_daily_release_validation.png` |
| Boundary impact preview | `docs/audit_evidence/phase5_cta_validation/cta_boundary_impact_preview.png` |
| Line realignment preview | `docs/audit_evidence/phase5_cta_validation/cta_line_realignment_preview.png` |
| Sewing output submit | `docs/audit_evidence/phase5_cta_validation/cta_sewing_output_submit.png` |

Raw evidence:

- `docs/audit_evidence/phase5_cta_validation/cta_results.json`
- `docs/audit_evidence/phase5_cta_validation/cta_summary.txt`
