# Frontend UI Prototype Drift Audit And Fix Plan

This audit treats `docs/frontend_ui` as the canonical UI contract for implemented Phase 2 through Phase 4 surfaces. The shared Eratex shell, collapsed left rail, topbar, and navigable breadcrumb are the only allowed app-level normalization.

## Drift Findings

| Phase / EOS | Route | Prototype source | Prior drift | Fix applied | Evidence target |
| --- | --- | --- | --- | --- | --- |
| Phase 2 | `/master-data/governance` | `docs/frontend_ui/master_data_governance` | Generic readiness table; missing tabs, parameter detail, governance audit | Added prototype tabs, KPI strip, style master grid, parameter detail, readiness checklist, audit timeline | `frontend/test-results/ui-parity/master-data-governance.png` |
| Phase 2 | `/technical/styles` | `docs/frontend_ui/style_technical_file` | Generic style list; missing technical spec inspector | Added style register with technical summary, readiness checklist, and open-file action | `frontend/test-results/ui-parity/technical-styles.png` |
| Phase 2 | `/technical/styles/[styleId]` | `docs/frontend_ui/style_technical_file` | Generic reference cards; missing OB grid and technical sections | Added operation bulletin grid, machine requirements, critical ops, version history | `frontend/test-results/ui-parity/technical-style-detail.png` |
| Phase 2 | `/technical/bom` | `docs/frontend_ui/bom_material_planning_dashboard` | BOM version grid only; missing material readiness explorer and impact drawer | Added material readiness explorer, shortage/PCD KPIs, material detail panel | `frontend/test-results/ui-parity/technical-bom.png` |
| Phase 2 | `/technical/operation-bulletins` | `docs/frontend_ui/operation_bulletin_master_dashboard` | Generic bulletin table; missing styles-without-OB, impact simulation, bottleneck drawer | Added OB KPI set, bulletin register, readiness checklist, impact simulation, bottleneck section | `frontend/test-results/ui-parity/technical-operation-bulletins.png` |
| Phase 2 | `/technical/operation-bulletins/[bulletinId]/routing` | `docs/frontend_ui/operation_bulletin_detail_routing_builder` | Flat operation grid; missing sequence list, routing flow, operation detail | Added left operation list, center routing flow, bottom SMV bar, operation detail panel | `frontend/test-results/ui-parity/routing-builder.png` |
| Phase 2 | `/technical/operator-skill-capacity` | `docs/frontend_ui/operator_skill_capacity_dashboard` | Line/machine grids only; missing operator detail and skill matrix | Added operator register, KPI strip, detail inspector, allocation management, skill matrix | `frontend/test-results/ui-parity/operator-skill-capacity.png` |
| Phase 3 | `/orders` | `docs/frontend_ui/order_lifecycle_explorer` | Generic order grid and drawer | Added lifecycle KPI set, dense order lifecycle grid, timeline/checklist/impact drawer | `frontend/test-results/ui-parity/orders.png` |
| Phase 3 | `/orders/[orderId]` | `docs/frontend_ui/order_lifecycle_explorer` | Separate detail layout not aligned to drawer pattern | Added lifecycle timeline and gate detail sections using prototype content model | `frontend/test-results/ui-parity/order-detail.png` |
| Phase 3 | `/orders/[orderId]/trace` | `docs/frontend_ui/order_lifecycle_explorer` | Acceptable read-only trace; kept dense grid | Kept trace as governed detail view, aligned header and grid density | `frontend/test-results/ui-parity/order-trace.png` |
| Phase 3 | `/pcd-readiness` | `docs/frontend_ui/pcd_readiness_gate` | Generic PCD grid; missing priority order cards and gate workspace | Added priority order card rail, checklist workspace, conditional/release actions | `frontend/test-results/ui-parity/pcd-readiness.png` |
| Phase 3 | `/procurement/vendor-follow-up` | `docs/frontend_ui/procurement_vendor_follow_up` | PO grid only; missing filters, affected orders, timeline drawer | Added procurement KPIs, vendor/category/PCD filters, ETA grid, timeline and affected-orders drawer | `frontend/test-results/ui-parity/procurement-vendor-follow-up.png` |
| Phase 3 | `/fabric/qc` | `docs/frontend_ui/fabric_inward_fabric_qc_dashboard` | Split lot/inspection grids; missing roll detail map and shade/spec panels | Added roll-level monitor, QC KPIs, technical specs, 4-point map, shade check, affected order drawer | `frontend/test-results/ui-parity/fabric-qc.png` |
| Phase 4 / EOS-04 | `/planning/weekly` | `docs/frontend_ui/weekly_planning_workbench` | Earlier table/card drift corrected before this pass | Preserved backlog, day swimlanes, drag/drop target, capacity strip, fixed impact preview | `frontend/test-results/ui-parity/planning-weekly.png` |
| Phase 4 / EOS-04 | `/workcenters/load` | `docs/frontend_ui/workcenter_load_monitor` | Table-first load view; missing workcenter constraint cards | Added highest-overload KPIs, current constraint strip, workcenter card grid, queue drawer | `frontend/test-results/ui-parity/workcenters-load.png` |
| Phase 4 / EOS-04 | `/workcenters/[workcenterId]/queue` | `docs/frontend_ui/workcenter_load_monitor` | Separate route did not echo drawer model | Retained deep-link route but aligned it to the same queue detail content | `frontend/test-results/ui-parity/workcenter-queue.png` |
| Phase 4 / EOS-04 | `/releases/daily` | `docs/frontend_ui/daily_production_release_dashboard` | Generic metric strip/table/drawer | Added planned/ready/blocked/released KPIs, release table actions, readiness gate drawer, impact panel | `frontend/test-results/ui-parity/releases-daily.png` |

## Acceptance Rules

- `code.html` in the matching prototype folder is authoritative over invented layout patterns.
- Implemented route bodies must preserve the source prototype's primary layout, density, action placement, drawer behavior, and operational copy.
- Do not add phase labels, implementation commentary, duplicate breadcrumbs, explanatory banners, decorative dashboard mosaics, or UI text that is absent from the prototype intent.
- Use semantic risk colors only for operational state.
- When a route has no prototype, record a governance gap before implementing a new UI.
- Screenshot evidence from the running app is required before git handoff.

## Known Clarity Gaps

- Phase 1 shell/login/me/component sandbox has no dedicated prototype folder; those surfaces remain governed by `DESIGN.md` and the shared app shell.
- `calendar_gantt_planning_dashboard` overlaps mature planning concepts. Phase 4 uses only compact time/day planning semantics and does not implement mature simulation or multi-unit capacity workbenches.
- Prototype-local topbars and rails are normalized into the shared Eratex shell. Parity applies to the route body beneath that shell.

## Validation Commands

Run checks in Docker only:

```powershell
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run typecheck
docker compose run --rm --no-deps frontend npm run test
docker compose run --rm --no-deps frontend npm run build
docker compose --profile test run --rm frontend_e2e
```

Leave the Docker stack running after validation.
