# Eratex Production-Grade EOS Feature Roadmap

## 1. Purpose

This document takes stock of:

1. The four newly explored feature tracks:
   - T&A governance capability.
   - Due-date quotation and capable-to-promise capability.
   - Sewing operating surface and line-loading intelligence.
   - Wash-heavy route planning and execution capability.
2. The already planned but deferred EOS surfaces beyond the current implementation boundary.
3. The current repo state through Phase 5 / EOS-05.

The goal is to move the product roadmap away from a narrow MVP view and toward a full production-grade operating system for Eratex garment manufacturing planning, scheduling, execution, recovery, and management control.

This is a roadmap consolidation document. It does not replace the existing canonical build spine. It extends it with the additional planning-intelligence capabilities recently researched.

---

## 2. Current Baseline

The current implementation boundary is Phase 5 / EOS-05.

Implemented or substantially present:

- Platform foundation.
- Identity, roles, permissions, audit foundation.
- Controlled master and technical product foundation.
- Style, BOM, operation bulletin, and wash route metadata.
- Order lifecycle.
- Procurement and fabric QC readiness.
- PCD readiness and conditional release.
- Planning horizon, plan version, planned work item, freeze/change governance.
- Workcenter load visibility.
- Daily production release control.
- External plan validation as draft input.
- Cutting jobs from governed releases.
- Cutting output and cut bundles.
- Sewing line loading.
- Governed line realignment.
- Sewing output capture.
- Net-good output calculation.
- Minimal WIP movement through:
  - `CUTTING`
  - `CUT_PANEL`
  - `SEWING_ACTIVE`
  - `SEWN_WAITING_WASH`

Explicitly deferred in the current boundary:

- Full WIP reconciliation and ageing control.
- Wash batch execution.
- Wash route planning beyond technical metadata.
- Finishing and packing execution.
- Shipment workflow.
- Full exception recovery lifecycle.
- Mature analytics snapshots.
- Mobile/offline shopfloor capture.
- Full integration/import framework.
- Optimizer behavior.
- What-if simulation and multi-unit capacity simulation.
- Production-grade hardening and rollout operations.

The current product has a strong foundation, but it is not yet a full production-grade factory operating system. It controls the path up to sewing-to-wash queue. The remaining roadmap must convert that into complete order-to-shipment operational truth.

Sewing deserves a specific production-grade clarification. The current Phase 5 / EOS-05 implementation has an operating board, line loading, realignment, output capture, and net-good efficiency primitives. It does not yet have the full planning intelligence required to convert route, SMV/SAM, line capability, line efficiency, learning curve, manpower, machine/skill fit, and line-spread policy into a generated daily or weekly sewing plan. The roadmap therefore must treat sewing line planning and execution control as a production-grade feature family, not only as an already-complete Phase 5 surface.

---

## 3. Product Intent Clarification

### 3.1 FastReact Independence

The target product intent is that the Eratex planning and scheduling platform is fully independent of FastReact.

FastReact must not be treated as:

- The scheduling brain.
- The finite-capacity planning engine.
- The source of committed plan truth.
- A required runtime system.
- A required integration dependency.
- The owner of sewing schedule, line allocation, wash load, WIP, exceptions, recovery, or due-date quotation.

The only mandatory external dependency for canonical transaction truth is Datatex ERP.

Datatex is expected to provide or reconcile commercial and ERP transaction data such as:

- Customer order or projection.
- Confirmed order.
- Buyer/customer/style/order attributes where ERP-owned.
- Procurement and material transaction references.
- Inventory or receipt status where ERP-owned.
- Shipment or dispatch transaction references where ERP-owned.
- ERP lifecycle identifiers and transaction keys.

The planning platform must own the planning and scheduling capability itself:

- Readiness interpretation.
- T&A governance.
- Capacity-constrained due-date quotation.
- Plan creation and plan governance.
- Workcenter and line load.
- Sewing line loading.
- Wash planning and execution once built.
- WIP truth once built.
- Plan-versus-actual interpretation.
- Exceptions and recovery.
- Shipment readiness interpretation.
- Analytics and simulation.

If legacy FastReact data is ever consumed, it should be treated only as an optional transitional draft-plan import or historical comparison input. It should not be part of the production operating dependency chain. In code and future docs, the preferred neutral language is `legacy external draft plan`, not `FastReact coexistence`.

### 3.2 Plan-Versus-Actual Closed Loop

The production-grade platform must support a closed loop:

```text
plan
-> release
-> execute
-> capture actual
-> compare plan versus actual
-> detect deviation
-> classify exception
-> evaluate recovery options
-> apply governed recovery
-> update plan health, T&A health, WIP, capacity, and due-date confidence
```

This is aligned with the current direction, but only partially implemented today.

Current implementation already supports fragments of the loop:

- Plan versions and frozen plan status.
- Planned work items by workcenter/date/stage.
- Planning zones.
- Workcenter load impact previews.
- Boundary case impact previews.
- Capacity loss/addition events.
- Machine breakdown and absenteeism event categories.
- Sewing output actuals.
- Net-good output calculation.
- Line efficiency and shortfall detection.
- Minimal WIP movement to sewn waiting wash.

Missing production-grade capabilities:

- Full plan-versus-actual ledger by date, shift, line, workcenter, batch, and stage.
- Automatic deviation classification across cutting, sewing, wash, finishing, packing, and shipment.
- Recovery option evaluation using available capacity, route, WIP, skill, machine, and material constraints.
- Governed recovery application into frozen/firm/volatile plans.
- Due-date promise recalculation from actual output, WIP ageing, rework, rewash, breakdown, absenteeism, and recovery actions.
- T&A health updates from actual factory progress.
- Daily execution control board showing plan impact and recommended recovery.

The roadmap therefore treats plan-versus-actual and recovery as cross-cutting production-grade behavior, not as a reporting-only feature.

---

## 4. Newly Explored Feature Inventory

### 4.1 T&A Governance Capability

Research source:

- `docs/research/Eratex_TNA_Time_Action_Additive_Feature_Implementation_Plan.md`
- `docs/research/pre_blueprinting/01_scenario_tool_owned_factory_event_capture.md`
- `docs/research/pre_blueprinting/02_scenario_external_factory_event_consumption.md`
- `docs/research/Eratex_Solution_Deck_Synthesis.md`

Current repo status:

- No dedicated T&A/TNA/time-action app exists.
- `OrderMilestone` exists, but it is static and offset-based.
- `PCDReadinessItem` exists, but it is a release-gate checklist, not a dependency-based T&A calendar.
- Planning zones exist, but they do not yet lock T&A baselines or govern T&A revisions.
- There is no alert or notification model for task readiness, due-soon, overdue, stale data, or dependency blockers.

Production-grade capability needed:

- T&A template master.
- Order-level generated T&A plan.
- Dependency graph across T&A actions.
- Baseline/current/revised/actual date model.
- Role ownership.
- Mandatory closure requirements.
- Alert generation.
- FKD and PCD criticality mapping.
- Production-release, laundry, finishing, packing, and shipment criticality mapping.
- PCD readiness integration.
- Shipment readiness integration once EOS-07 is built.
- Planning-zone based governance.
- External event consumption from Datatex/PLM/TMS-style systems where available.

Scope clarification:

- T&A is not intended to stop at FKD, PCD, or release-to-cutting.
- The first implementation wave emphasizes FKD, PCD, and release blockers because those objects exist in the current Phase 0-5 codebase.
- The target production-grade T&A scope is order-to-dispatch readiness: order confirmation, procurement, approvals, PCD, cutting release, sewing start/end, laundry in/out, finishing, packing, shipment readiness, and dispatch reconciliation.
- Shipment-side T&A actions should become active when EOS-06 and EOS-07 provide wash, WIP, quality, finishing, packing, and shipment readiness objects to attach to.

Architectural stance:

- Build a pure T&A additive feature.
- Do not build ticket-heavy TMS.
- Use action items, dependencies, alerts, and revision governance.
- Escalate only material exceptions into boundary-case governance.

Recommended app:

```text
backend/apps/time_action
```

Primary UI surfaces to add:

- Order T&A tab.
- T&A worklist.
- T&A calendar/timeline.
- T&A template master.
- Lightweight alert center.
- PCD readiness T&A linkage.

### 4.2 Due-Date Quotation And Capable-To-Promise

Research source:

- `docs/research/Eratex_Due_Date_Quotation_Capability_Evaluation.md`
- `docs/research/Eratex_Planning_Zones_Due_Date_Promising_CCR_Implementation_Plan.md`
- Eratex solution deck synthesis and pre-blueprinting documents.

Current repo status:

- The repo stores planned and committed shipment dates.
- It can manually place planned work items into a workcenter/date range.
- It can preview load impact for a user-selected placement.
- It can validate imported external plan dates.
- It has sewing line loading calculations for selected line/loading scenarios.
- It does not search forward through capacity to propose a feasible promise date.
- It does not create finite daily/shift/line reservations.
- It does not route an order through cutting, sewing, wash, finishing, packing, and shipment as a capacity chain.
- It cannot reliably quote even a sewing-handoff date without additional capacity ledger and route search logic.

Production-grade capability needed:

- Quote/enquiry object.
- Product route explosion for promise simulation.
- Capacity ledger by workcenter, line, machine, date, and shift.
- Forward scheduling search.
- Reservation model:
  - tentative
  - soft
  - firm
  - expired
- Earliest feasible date calculation.
- Confidence score.
- Alternative promise options.
- Explanation of bottlenecks and blockers.
- Integration with T&A readiness and PCD/material readiness.
- Integration with wash route capacity when wash module is built.
- Planning-zone aware reservation governance.

Recommended app or module:

```text
backend/apps/capacity_promising
```

Alternative if team wants fewer apps:

```text
backend/apps/planning/services/promising.py
backend/apps/planning/models.py additions
```

But production-grade separation favors a dedicated `capacity_promising` app because quotation is a distinct workflow from weekly planning.

Primary UI surfaces to add or extend:

- Enquiry and costing / promise date surface.
- Quote scenario drawer inside order/projection.
- Promise alternatives panel.
- Capacity consumption explanation.
- Planning-zone capacity reservation view.

### 4.3 Sewing Operating Surface And Line-Loading Intelligence

Research source:

- `docs/research/Eratex_Consolidated_Solution_Synthesis_With_Presenter_Notes.md`
- `docs/research/Eratex_Due_Date_Quotation_Capability_Evaluation.md`
- `docs/research/Eratex_Planning_Zones_Due_Date_Promising_CCR_Implementation_Plan.md`
- `docs/research/pre_blueprinting/01_scenario_tool_owned_factory_event_capture.md`
- `docs/research/pre_blueprinting/02_scenario_external_factory_event_consumption.md`
- `docs/09_Line_Routing_Operation_Bulletin_Specification_Eratex.md`
- `docs/frontend_ui/sewing_line_loading_dashboard`
- `docs/frontend_ui/line_realignment_workbench`
- `docs/frontend_ui/operation_bulletin_detail_routing_builder`

Current repo status:

- `OperationBulletin` and operation bulletin lines exist as approved technical masters.
- Sewing line loading requires an approved operation bulletin or approved governed exception.
- `SewingLineLoading` stores order, release, line, workcenter, bulletin, planned quantity, target output per day, target efficiency, expected defect rate, planning zone, shift, fit status, and risk.
- `preview_line_loading` calculates line available minutes, total SMV, target output per day, machine gaps, skill gaps, fit status, and risk for a selected release-line-bulletin combination.
- `LineRealignmentRequest` and gap records support governed machine/skill/bottleneck realignment.
- Sewing output capture records gross, defect, rework, and net-good output; net-good updates execution WIP and line efficiency.
- `/sewing/line-loading` has a dense operating board with line, PO, style, SMV, target, actual, efficiency, defect, net-good, planned/actual manpower, status, risk, hourly output, bottleneck operation, operator allocation, and recovery action.

Current gaps:

- Weekly planning can assign an order to a workcenter/date range, but it does not generate a line-by-line sewing plan.
- The system does not yet search across eligible sewing lines and dates to recommend the best line allocation.
- The system does not yet maintain a finite line/day/shift allocation ledger that subtracts already committed load by line.
- The system does not yet apply customer/style-line fit, star-rated line preference, line-spread limits, learning curve, changeover penalty, absenteeism, machine availability, and historical efficiency together as planning policy.
- Sewing completion projection is not recalculated continuously from live net-good output, absenteeism, downtime, defects, rework, and recovery actions.
- Current operating board fallback values and snapshots are useful for operational visibility, but they are not a full plan-generation engine.

Production-grade capability needed:

- Sewing route explosion from approved operation bulletin.
- Sewing line capability master:
  - product/category fit
  - customer/style fit
  - machine type availability
  - attachment/folder availability
  - operator skill coverage
  - baseline efficiency
  - historical style/customer performance
- Line fit scoring and candidate ranking.
- Line spread policy:
  - preferred line count
  - maximum line count
  - exception approval for excess split
  - efficiency penalty for over-splitting
- Finite line capacity ledger by line, date, shift, and planning zone.
- Daily and weekly sewing allocation generation.
- Target output calculation using SMV/SAM, manpower, working minutes, target efficiency, learning curve, absenteeism, machine availability, and expected defect rate.
- Changeover and realignment impact preview.
- Plan-versus-actual sewing control loop:
  - hourly/shift target versus actual
  - net-good efficiency
  - shortfall detection
  - bottleneck operation
  - operator absence impact
  - recovery recommendation
  - projected sewing completion date
- Feedback of actual efficiency into future planning assumptions.

Recommended implementation location:

```text
backend/apps/sewing
backend/apps/planning
backend/apps/capacity_promising
backend/apps/workcenters
backend/apps/style_technical
```

Additive services:

```text
sewing.services.line_fit
sewing.services.line_scheduling
sewing.services.completion_projection
sewing.services.efficiency_feedback
planning.services.line_allocation
capacity_promising.services.sewing_capacity_search
```

Possible new or extended models:

- `SewingLineCapabilityProfile`
- `SewingLineFitRule`
- `SewingLineScheduleBucket`
- `SewingLineAllocationCandidate`
- `SewingCompletionProjection`
- `SewingEfficiencyAssumption`
- `SewingPlanDeviation`

Primary UI surfaces:

- Weekly Planning Workbench line-allocation mode.
- Sewing Line Loading Dashboard.
- Sewing line detail and action drawer.
- Line Realignment Workbench.
- Operation Bulletin Detail Routing Builder.
- Sewing Output Capture.
- Future daily sewing plan board if the existing line-loading board cannot carry both planning and execution control cleanly.

Scope boundary:

- This wave should not attempt an opaque optimizer first.
- First build an explainable planner-assist engine: candidate lines, capacity fit, expected completion, risk, and recommendation.
- Automated allocation can come only after planners trust the candidate ranking, line-spread policy, and actual-output feedback loop.
- Wash should remain a separate downstream constraint; sewing allocation must expose sewn handoff confidence but must not claim shipment promise without wash/finishing/shipment truth.

### 4.4 Wash-Heavy Route Planning And Execution

Research source:

- `docs/research/Eratex_Wash_Feature_Implementation_Evaluation_And_Plan.md`
- `docs/research/Eratex_Laundry_Washes_Finishes_Process_Document.md`
- `docs/10_Wash_Planning_Execution_Specification_Eratex.md`
- `docs/frontend_ui/wash_planning_dashboard`
- `docs/frontend_ui/wash_recipe_batch_execution`

Current repo status:

- `WashRoute` and `WashRouteStep` exist as technical master metadata.
- Style readiness checks require approved wash route.
- Sewing output can create WIP at `SEWN_WAITING_WASH`.
- Workcenter capacity can represent wash resources at a broad level.
- Boundary-case types anticipate rewash.
- There is no `washing` app.
- Wash planning route is a placeholder.
- No wash demand generation, batch creation, batch sequencing, dry/wet execution, recipe parameter capture, post-wash QC, rewash loop, or release to finishing exists.

Production-grade capability needed:

- Wash process taxonomy.
- Wash route versioning.
- Wash recipe and recipe parameters.
- Machine compatibility matrix.
- Wash demand from sewn WIP.
- Wash batch creation.
- Batch step execution.
- Dry-process and wet-process stage handling.
- Shade-lot and wash-code batching logic.
- Post-wash QC.
- Rewash/touch-up loop.
- Capacity consumption for wash and rewash.
- Release to finishing-ready WIP.
- Sustainability and compliance metadata where required.
- Tablet/mobile wash capture.

Recommended app:

```text
backend/apps/washing
```

Primary UI surfaces:

- Wash Planning Dashboard.
- Wash Recipe and Batch Execution.
- WIP Queue Monitoring.
- Manufacturing Pipeline WIP Inventory.
- Inventory Reconciliation and Quantity Integrity.

---

## 5. Deferred EOS Feature Inventory

The common EOS spine already defines the deferred production-grade surfaces. The inventory below restates them in implementation terms.

### 4.1 EOS-06: Wash And WIP Truth

Already planned surfaces:

- `wash_planning_dashboard`
- `wash_recipe_batch_execution`
- `wip_queue_monitoring_dashboard`
- `manufacturing_pipeline_wip_inventory_dashboard`
- `inventory_reconciliation_quantity_integrity`

Backend domains:

- `washing`
- `wip_inventory` expansion
- `quality` integration
- `boundary_cases` integration
- `workcenters` capacity integration

Deferred capabilities:

- Wash queue.
- Wash demand.
- Wash batch.
- Wash batch steps.
- Batch-level QC.
- Rewash.
- Touch-up.
- WIP ageing.
- WIP reconciliation.
- Quantity adjustments.
- Release to finishing.

### 4.2 EOS-07: Quality, Exceptions, Recovery, Shipment

Already planned surfaces:

- `quality_management_dashboard`
- `qc_defect_hold_capture`
- `exceptions_alerts_management`
- `rework_recovery_dashboard`
- `shipment_readiness_dashboard`

Backend domains:

- `quality`
- expanded `boundary_cases`
- `shipment`
- `recovery`
- alert/notification services

Deferred capabilities:

- Inline/endline/final QC.
- QC hold and release.
- Defect and root-cause capture.
- Rework and recovery action tracking.
- Exception lifecycle with owner, due date, SLA, escalation, duplicate detection.
- Shipment readiness checklist.
- Packed quantity and AQL/document blockers.
- Shipment risk calculation.

### 4.3 EOS-08: Shopfloor Live Capture

Already planned surfaces:

- `handheld_shopfloor_home`
- `sewing_output_capture`
- `department_handover_capture`
- `qc_defect_hold_capture`
- `shopfloor_andon_issue_capture`
- `supervisor_shift_closure`
- `mobile_shopfloor_update`

Backend domains:

- `shopfloor`
- mobile event capture services
- offline sync services
- device/session model if required
- idempotent event processing

Deferred capabilities:

- Mobile output capture.
- Mobile wash execution capture.
- Mobile handover capture.
- Mobile defect/hold capture.
- Downtime capture.
- Andon issue capture.
- Shift closure.
- Offline queue and sync.
- Stale/unsynced data visibility.

### 4.4 EOS-09: Analytics And Management Control

Already planned surfaces:

- `executive_control_tower`
- `performance_analytics_dashboard`
- `what_if_simulation_workbench`
- `multi_unit_capacity_simulation`
- expanded calendar/Gantt planning

Backend domains:

- `analytics`
- snapshot jobs
- simulation services
- KPI formula services

Deferred capabilities:

- Daily planning health snapshots.
- Workcenter load snapshots.
- Line efficiency snapshots.
- WIP pipeline snapshots.
- Exception and recovery snapshots.
- Shipment readiness and OTIF snapshots.
- Cost-protected OTIF.
- What-if simulations for plan moves, overtime, line split, shipment pull-in, wash recovery, and multi-unit load.

### 4.5 EOS-10: Integration And Migration

Already planned surfaces:

- Integration status view.
- Import upload/dry-run/apply screens.
- Master data governance extensions.
- Audit trace/search support.

Backend domains:

- `integrations`
- existing `external_plans` expansion
- staging tables
- source registry
- source-of-truth matrix

Deferred capabilities:

- Datatex ERP integration.
- Optional legacy draft-plan import, if historic transition data is required.
- Excel transitional import framework.
- Opening WIP import.
- Master-data import governance.
- Import dry-run validation.
- Apply/rollback.
- Stale-sync alerting.
- External T&A and production event ingestion.

### 4.6 EOS-11 And EOS-12: Production Hardening And Rollout

Already planned work areas:

- Security coverage.
- Audit coverage.
- Performance tuning.
- Observability.
- Backup and restore.
- UAT.
- Pilot.
- Parallel run.
- Cutover.
- Stabilization.

Deferred capabilities:

- Permission coverage for every write/action API.
- Audit coverage for every governed transition.
- Dense-grid performance.
- Celery idempotency and monitoring.
- Production environment hardening.
- Backup/restore drills.
- Full E2E regression suite.
- UAT seed and real-factory scenario pack.
- Pilot readiness metrics.

---

## 6. Roadmap Principle

Moving from MVP to production-grade should not mean building all deferred screens immediately.

The right sequencing is:

```text
1. Stabilize the existing operating chain.
2. Add planning intelligence that prevents bad commitments.
3. Build wash and WIP truth because sewing-only truth is insufficient for Eratex.
4. Close quality, recovery, and shipment readiness.
5. Make actuals live through mobile capture.
6. Integrate Datatex as canonical ERP transaction truth, with optional non-operational legacy/event adapters only where required.
7. Add analytics and simulation only after operational truth is trustworthy.
8. Harden for pilot and production.
```

This means T&A and due-date quotation should not be treated as late analytics features. They are planning-intelligence foundations and should be inserted before, or in parallel with, full EOS-06 wash/WIP execution.

---

## 7. Production-Grade Roadmap Overview

| Roadmap wave | Theme | Main EOS coverage | Why it comes here |
|---|---|---|---|
| Wave 0 | Baseline consolidation | EOS-00 to EOS-05, EOS-11, EOS-12 | Protect what is already built before adding new domain load. |
| Wave 1 | T&A and planning-zone governance | EOS-03, EOS-04, EOS-10, EOS-11 | Creates dependency-based readiness truth before promising and production expansion. |
| Wave 2 | Due-date quotation and capacity promising foundation | EOS-03, EOS-04, EOS-09, EOS-10 | Adds date-finding, not only date-validation. |
| Wave 2A | Sewing operating surface and finite line planning | EOS-04, EOS-05, EOS-09, EOS-11 | Converts route, SMV/SAM, line efficiency, and line capability into an explainable daily/weekly sewing plan and execution-control surface. |
| Wave 3 | Wash-heavy planning and WIP truth | EOS-06, EOS-08, EOS-11 | Converts sewn waiting wash into a real production constraint. |
| Wave 4 | Quality, exceptions, recovery, shipment | EOS-07, EOS-09, EOS-11 | Closes the order-to-shipment control loop. |
| Wave 5 | Shopfloor live capture and offline sync | EOS-08, EOS-05, EOS-06, EOS-07 | Makes actuals live enough for planning to stay trusted. |
| Wave 6 | Datatex integration and source-of-truth control | EOS-10, EOS-11 | Connects Datatex ERP transaction truth and optional non-operational legacy/event feeds without duplicate truth. |
| Wave 7 | Analytics, control tower, simulation | EOS-09 | Uses reliable operational data for management and what-if control. |
| Wave 8 | Production hardening, UAT, pilot, rollout | EOS-11, EOS-12 | Moves from built feature set to adopted production system. |

Some workstreams overlap. Datatex integration discovery, security, audit, and seed-data expansion should run continuously.

---

## 8. Wave 0: Baseline Consolidation

### Objective

Turn the current Phase 0-5 implementation into a dependable base before adding new production-grade surface area.

### Scope

- Reconfirm current Phase 5 boundary.
- Keep the Docker validation sequence green.
- Confirm route status by implemented, partial, placeholder, not-started.
- Keep seed data dense and resettable.
- Preserve prototype-first UI governance.
- Review current permission/action coverage.
- Review audit coverage for critical writes.
- Convert research artifacts into backlog tags.

### Current surfaces to classify

Implemented or active:

- Order lifecycle explorer.
- Procurement vendor follow-up.
- Fabric inward/fabric QC.
- PCD readiness gate.
- Weekly planning workbench.
- Workcenter load monitor.
- Daily production release.
- Cutting room management.
- Sewing line loading.
- Line realignment.
- Sewing output capture.
- Operation bulletin master and routing builder.

Placeholder or partial:

- Wash planning.
- WIP pipeline.
- Exceptions control tower.
- Shipment readiness.
- Mobile home.

Missing production-grade modules:

- T&A/time action.
- Capacity promising.
- Washing.
- Full quality.
- Shipment.
- Shopfloor mobile/offline.
- Analytics.
- Integrations.

### Exit Criteria

- Current Phase 0-5 tests pass.
- Current route inventory is documented.
- Deferred route backlog is traceable to EOS nodes.
- No new roadmap work is allowed to weaken PCD/release/sewing output governance.

---

## 9. Wave 1: T&A And Planning-Zone Governance

### Objective

Build the dependency-based readiness and action-control layer that the current PCD checklist cannot provide.

### Why This Comes Before Full Expansion

Wash execution and due-date promising both need trustworthy readiness dates. Without T&A, the system only knows planned PCD and checklist status. It does not know the dependency path, ownership, baseline movement, or blockers that create readiness risk.

This wave is sequenced early because the existing code already has order, PCD readiness, planning zone, release, cutting, sewing, and minimal WIP primitives. That does not define the final T&A boundary. It defines the safest first implementation boundary.

The end-state T&A plan should continue beyond production release into production execution, wash, finishing, packing, shipment readiness, and dispatch reconciliation. Those later action groups should be activated as EOS-06 and EOS-07 domain objects become available.

### Backend Scope

New app:

```text
backend/apps/time_action
```

Core models:

- `TimeActionTemplate`
- `TimeActionTemplateItem`
- `TimeActionTemplateDependency`
- `TimeActionClosureRequirement`
- `OrderTimeActionPlan`
- `OrderTimeActionItem`
- `OrderTimeActionDependency`
- `TimeActionRevisionRequest`
- `TimeActionAlert`
- `TimeActionSourceEvent`
- `TimeActionPcdMapping`

Services:

- Template selection.
- Plan generation.
- Dependency readiness.
- Status and health calculation.
- Alert generation.
- PCD/FKD integration.
- Release, laundry, finishing, packing, and shipment milestone integration as later domain modules mature.
- Planning-zone revision governance.
- Source-event processing.

### Frontend Scope

New surfaces:

- Order T&A tab.
- T&A role worklist.
- T&A calendar/timeline.
- T&A template master.
- Lightweight alert center.

Enhance:

- PCD readiness gate with linked T&A blockers.
- Order lifecycle with T&A health.
- Planning workbench with readiness confidence.
- Shipment readiness with linked T&A blockers once EOS-07 is implemented.

### Production-Grade Rules

- T&A is not ticket-heavy TMS.
- Action items are the primary object, not tickets.
- Alerts are deduplicated signals, not tickets.
- Boundary cases are created only for material operational exceptions.
- Baseline dates are never overwritten.
- Firm-zone revisions require approval for critical milestones.

### Exit Criteria

- Order can generate a T&A plan from template.
- Dependencies control action readiness.
- Mandatory closure rules prevent false completion.
- Due-soon and overdue alerts are generated.
- Critical T&A blocker can feed PCD readiness.
- T&A template supports downstream milestones even if shipment-side completion remains inactive until EOS-07.
- Firm-zone date revision requires reason and approval.
- T&A can accept a Datatex/external event in a controlled way.

---

## 10. Wave 2: Due-Date Quotation And Capacity Promising

### Objective

Move from validating user-selected dates to finding feasible promise dates from real load, route, readiness, and capacity.

### Why This Comes Here

Due-date quotation is a planning-intelligence capability. It depends on:

- Product technical route.
- PCD/material/T&A readiness.
- Existing planned load.
- Sewing capacity.
- Wash capacity once EOS-06 exists.
- Finishing/packing/shipment buffers once EOS-07 exists.

The first release can promise to sewing handoff. Later releases extend promise to shipment readiness.

### Backend Scope

Recommended app:

```text
backend/apps/capacity_promising
```

Core models:

- `PromiseRequest`
- `PromiseScenario`
- `PromiseScenarioRouteStep`
- `CapacityReservation`
- `PromiseAlternative`
- `PromiseDecision`
- `PromiseConfidenceFactor`

Services:

- Route explosion.
- Readiness date derivation.
- Daily/shift/line capacity ledger.
- Earliest feasible slot search.
- Reservation creation and expiry.
- Alternative scenario generation.
- Confidence scoring.
- Bottleneck explanation.

Initial promise stages:

1. Sewing handoff promise.
2. Sewing plus wash readiness once Wave 3 starts.
3. Full shipment readiness once Wave 4 starts.

### Frontend Scope

New or enhanced surfaces:

- Enquiry/costing/promise date screen.
- Order quote drawer.
- Capacity promise alternatives.
- Promise explanation panel.
- Reservation state indicator in planning.

### Production-Grade Rules

- Do not claim shipment promise until wash, finishing, packing, and shipment readiness are modeled.
- Do not consume capacity without explicit reservation state.
- Soft reservations must expire.
- Firm reservations must be governed by planning zone.
- Promise output must include confidence and reasons, not just a date.

### Exit Criteria

- User can request promise for an order/enquiry.
- System can derive earliest sewing handoff date from readiness plus finite sewing capacity.
- System can show at least two alternatives where capacity exists.
- System records reservation status.
- System explains the main constraint.
- Promise confidence reflects missing or stale readiness data.

---

## 10A. Wave 2A: Sewing Operating Surface And Finite Line Planning

### Objective

Turn the current sewing execution board into a production-grade sewing planning and execution-control system that can translate approved route, SMV/SAM, line capability, line efficiency, manpower, machine/skill fit, and planning-zone rules into daily and weekly sewing line allocations.

This wave closes the gap between:

```text
"this order can be loaded on this selected line"
```

and:

```text
"these are the best candidate lines and dates, with expected output, completion date, risk, and recovery path."
```

### Why This Comes After Capacity Promising

Wave 2 creates the capacity ledger and promise foundation. Wave 2A turns the sewing portion of that promise into a real operating surface.

It should come before full wash/WIP expansion because wash demand quality depends on realistic sewing output and sewn handoff timing. If the sewing plan is only a manually selected line date, downstream wash planning will inherit weak assumptions.

### Implementation Phases

| Phase | Theme | Main outcome |
|---|---|---|
| 2A.1 | Line capability and fit foundation | Approved operation bulletin can be matched against line machines, skills, attachments, baseline efficiency, and customer/style fit. |
| 2A.2 | Finite sewing line allocation | System can recommend candidate lines/dates and calculate target output, completion, load, risk, and line-spread impact. |
| 2A.3 | Daily sewing operating board | Existing board becomes plan-versus-actual control with hourly target/actual, net-good efficiency, bottleneck, operator allocation, and recovery action. |
| 2A.4 | Efficiency feedback loop | Actual output, shortfall, downtime, defects, rework, and recovery actions update future planning assumptions and promise confidence. |

### Backend Scope

Extend existing apps rather than creating a parallel sewing domain:

```text
backend/apps/sewing
backend/apps/planning
backend/apps/capacity_promising
backend/apps/workcenters
backend/apps/style_technical
```

Core model additions or extensions:

- `SewingLineCapabilityProfile`
- `SewingLineFitRule`
- `SewingLineScheduleBucket`
- `SewingLineAllocationCandidate`
- `SewingCompletionProjection`
- `SewingEfficiencyAssumption`
- `SewingPlanDeviation`

Core services:

- `sewing.services.line_fit`
  - Compare approved operation bulletin to line capability.
  - Score machine availability, attachment/folder availability, skill availability, historical performance, product specialization, and quality risk.
  - Return fit status: good fit, acceptable with realignment, risky, blocked.
- `sewing.services.line_scheduling`
  - Search eligible lines and date/shift buckets.
  - Apply line-spread policy.
  - Calculate expected daily output and completion date.
  - Penalize changeover and excessive line splits.
  - Generate candidate allocations for planner approval.
- `capacity_promising.services.sewing_capacity_search`
  - Use the same finite line buckets for promise scenarios.
  - Return sewing handoff date and confidence.
- `sewing.services.completion_projection`
  - Recalculate projected sewing completion from live net-good output, remaining quantity, shift capacity, absenteeism, downtime, rework, and recovery action.
- `sewing.services.efficiency_feedback`
  - Capture actual line efficiency by style/customer/line.
  - Propose updated planning assumptions without silently changing approved masters.

Required calculations:

```text
gross_capacity =
(line_manpower x working_minutes x target_efficiency) / style_smv

adjusted_capacity =
gross_capacity
x learning_curve_factor
x absenteeism_factor
x machine_availability_factor

net_good_capacity =
adjusted_capacity x (1 - expected_defect_rate)

remaining_sewing_days =
remaining_quantity / expected_net_good_capacity_per_day
```

Line fit scoring should consider:

- product type fit
- customer/style historical fit
- required machine match
- required attachment/folder match
- critical operation skill match
- line baseline efficiency
- learning curve state
- changeover penalty
- quality risk
- wash-sensitive construction risk where relevant

Line spread policy should define:

- preferred number of lines for the order
- maximum allowed lines without approval
- minimum run length by line
- efficiency penalty for split loading
- exception approval path when shipment pressure requires extra lines

### Frontend Scope

Enhance or add these surfaces:

- `/planning/weekly`
  - line-allocation mode in addition to workcenter/date placement
  - candidate line panel
  - sewing handoff date preview
  - line-spread warning
  - before/after line bucket utilization
- `/sewing/line-loading`
  - current dense operating board remains the main execution surface
  - rows continue to show line, PO, style, SMV, target, actual, efficiency, defect, net-good, manpower, status, and risk
  - drawer shows hourly target versus actual, bottleneck operation, operator allocation, absence impact, and recommended recovery
  - add planned completion and projected completion where backend projection is available
- `/sewing/line-realignment`
  - use line-fit gaps and schedule impact from the same services used by planning
  - show expected output before/after realignment
- `/technical/operation-bulletins/{id}/routing`
  - keep approved bulletin read-only
  - expose route, SMV, critical operation, machine, attachment, and skill details that feed line fit

If a separate daily sewing plan board is needed, prototype it before implementation. Do not overload `/sewing/line-loading` with planning controls if it weakens the execution-control workflow.

### Production-Grade Rules

- No line loading without approved operation bulletin or approved governed exception.
- A recommended line allocation is not committed until the planner confirms it.
- Candidate ranking must be explainable; do not introduce an opaque optimizer before planner-assist trust is established.
- Firm/frozen-zone line changes require impact preview, reason, and approval.
- Net-good output, not gross output, is the execution quantity that updates WIP and efficiency.
- Efficiency feedback should propose planning-assumption updates; it should not mutate approved technical masters silently.
- Sewing handoff confidence must be labeled as sewing-only until wash, finishing, packing, and shipment truth are modeled.

### Exit Criteria

- Planner can request candidate sewing line allocations for a PCD-ready order.
- System returns ranked line/date candidates with fit score, target output, projected completion, line-spread warning, and main constraint.
- Planner can commit an allocation into finite line/date/shift buckets.
- Existing `/sewing/line-loading` board shows committed plan versus actual execution state.
- Board projection updates from net-good output and open shortfall/downtime signals.
- Line realignment uses the same machine/skill/bottleneck gap logic as candidate planning.
- Seed data includes at least one good-fit line, one realignment-required line, one split-line case, one underperforming line, and one recovery-action case.
- E2E assertions prove board density, candidate allocation, line-spread warning, row-click drawer, recovery action, and projected completion display.

---

## 11. Wave 3: Wash-Heavy Planning And WIP Truth

### Objective

Make wash a first-class production constraint and make WIP truth reliable after sewing.

### Why This Comes Here

Eratex is denim/chino heavy. A plan that stops at sewing can mislead the factory. Wash can be the binding constraint through dry process, wet process, drying, shade QC, rewash, touch-up, and release to finishing.

### Backend Scope

New app:

```text
backend/apps/washing
```

Expand:

```text
backend/apps/wip_inventory
backend/apps/workcenters
backend/apps/boundary_cases
backend/apps/style_technical
```

Core models:

- `WashProcessFamily`
- `WashRecipe`
- `WashRecipeParameter`
- `WashMachineCapability`
- `WashDemand`
- `WashBatch`
- `WashBatchLine`
- `WashBatchStep`
- `WashBatchEvent`
- `WashBatchQCResult`
- `RewashCycle`
- `WashHold`
- `WashCapacityReservation`
- expanded `WipStage`

New WIP stages should include:

- `SEWN_WAITING_WASH`
- `WASH_QUEUE`
- `DRY_PROCESS`
- `WET_WASH`
- `DRYING`
- `POST_WASH_QC`
- `REWASH`
- `WASH_COMPLETE`
- `FINISHING_READY`

Services:

- Wash demand generation from sewn WIP.
- Batch creation.
- Machine compatibility validation.
- Route-step scheduling.
- Batch capacity calculation.
- Rewash capacity consumption.
- Wash QC gate.
- Release to finishing.
- WIP reconciliation.
- Ageing and mismatch detection.

### Frontend Scope

Implement:

- `wash_planning_dashboard`
- `wash_recipe_batch_execution`
- `wip_queue_monitoring_dashboard`
- `manufacturing_pipeline_wip_inventory_dashboard`
- `inventory_reconciliation_quantity_integrity`

### Production-Grade Rules

- No wash batch without available sewn WIP.
- No wash batch without approved wash route/recipe.
- Machine assignment must satisfy compatibility.
- Rewash consumes visible capacity.
- Post-wash QC controls release to finishing.
- WIP movement must preserve quantity integrity.
- Wash queue ageing must be visible.

### Exit Criteria

- Sewn waiting wash lot can become wash demand.
- Wash manager can create a batch from eligible demand.
- Batch route steps consume workcenter/machine capacity.
- Rewash creates additional load and WIP movement.
- Post-wash QC can hold or release goods.
- WIP pipeline reconciles quantity through wash stages.
- Due-date promising can consume wash capacity for extended promise scenarios.

---

## 12. Wave 4: Quality, Exceptions, Recovery, And Shipment

### Objective

Close the order-to-shipment operating loop.

### Backend Scope

New or expanded apps:

```text
backend/apps/quality
backend/apps/recovery
backend/apps/shipment
backend/apps/notifications
```

Expand:

```text
backend/apps/boundary_cases
backend/apps/wip_inventory
backend/apps/audit_governance
```

Core capabilities:

- QC inspection and defect capture.
- QC hold and release.
- Inline/endline/pre-wash/post-wash/final QC support.
- Defect taxonomy and root cause.
- Recovery action with owner, due date, expected impact, actual impact.
- Exception lifecycle with duplicate detection and SLA.
- Shipment readiness checklist.
- Packed quantity and finished goods readiness.
- Documentation and AQL blockers.
- Shipment risk calculation.

### Frontend Scope

Implement:

- `quality_management_dashboard`
- `qc_defect_hold_capture`
- `exceptions_alerts_management`
- `rework_recovery_dashboard`
- `shipment_readiness_dashboard`

### Production-Grade Rules

- RED/BLACK exception cannot exist without owner and due date.
- QC hold blocks movement unless released or waived.
- Critical exception closure requires evidence or note.
- Shipment readiness cannot be completed with mandatory blockers open.
- Recovery action should update expected completion and shipment risk.

### Exit Criteria

- Defect or hold can block WIP movement.
- Recovery action has owner, due date, status, and closure.
- Shipment readiness shows packed quantity, checklist, blockers, and risk.
- Final readiness can feed OTIF and due-date confidence.

---

## 13. Wave 5: Shopfloor Live Capture And Offline Sync

### Objective

Make actuals live or near-live so planning, wash, WIP, recovery, and shipment views do not drift back into manual truth.

### Backend Scope

New app:

```text
backend/apps/shopfloor
```

Core models:

- `ShopfloorDevice`
- `ShopfloorSession`
- `MobileCaptureEvent`
- `OfflineSyncBatch`
- `OfflineSyncResult`
- `DowntimeEvent`
- `HandoverEvent`
- `ShiftClosure`

Services:

- Idempotent event ingest.
- Offline sync.
- Conflict detection.
- Original timestamp preservation.
- Scope validation by role/department/line/workcenter.
- Sync status and stale data signals.

### Frontend Scope

Implement:

- `handheld_shopfloor_home`
- mobile/tablet sewing output capture refinement.
- mobile wash execution capture.
- `department_handover_capture`
- `qc_defect_hold_capture`
- `shopfloor_andon_issue_capture`
- `supervisor_shift_closure`
- `mobile_shopfloor_update`

### Production-Grade Rules

- Duplicate sync cannot double-count output.
- Original capture time must be preserved.
- Stale/unsynced data must be visible.
- Mobile user cannot act outside assigned scope.
- Offline behavior must be tested with replay and conflict scenarios.

### Exit Criteria

- Supervisor can capture output in a few taps.
- Wash step and QC capture can update WIP.
- Handover creates accountable WIP movement.
- Downtime can reduce capacity and trigger exception/recovery.
- Offline sync is idempotent.

---

## 14. Wave 6: Datatex Integration And Source-Of-Truth Control

### Objective

Connect Datatex ERP transaction truth to the platform without creating duplicate truth.

Optional legacy files or historical external planning extracts may be supported as one-time or transitional draft inputs, but they are not product dependencies.

### Why This Runs In Parallel

Integration discovery should start early, especially for Datatex. But broad import/apply mechanics should be productionized after the core domain models are ready enough to receive the data.

### Backend Scope

New app:

```text
backend/apps/integrations
```

Expand:

```text
backend/apps/external_plans
backend/apps/time_action
backend/apps/capacity_promising
```

Core models:

- `IntegrationSource`
- `SourceOfTruthRule`
- `IntegrationSyncRun`
- `ImportBatch`
- `ImportStagingRow`
- `ImportValidationResult`
- `ImportApplyRun`
- `ExternalEventMapping`
- `ExternalRecordLink`

Integration domains:

- Datatex order feed.
- Datatex procurement/material feed.
- Datatex shipment/feed where available.
- Optional legacy draft-plan import for migration or comparison only.
- Excel transition imports.
- External T&A event feed.
- Opening WIP import.
- Machine/laundry automation feed if available.

### Datatex Transaction Integration Detail

Datatex should not feed the platform with a schedule. Datatex should feed the commercial and ERP transaction facts from which the planning tool creates its own planning, scheduling, release, execution, recovery, and due-date logic.

Datatex owns:

- Order/projection transaction truth.
- Customer PO, sales order, or work order references.
- Commercial quantity and shipment splits.
- ERP order status.
- Procurement/material transaction references.
- Inventory and receipt status where ERP-owned.
- Shipment and dispatch transaction truth.

The planning tool owns:

- Capacity promise.
- T&A/TNA governance.
- FKD and PCD interpretation.
- Planning zones.
- Schedule creation.
- Release control.
- Plan-versus-actual interpretation.
- Execution event ledger where built.
- WIP truth where built.
- Exceptions and recovery.
- Due-date prediction.

#### Inbound: Datatex To Planning Tool

| Stage | Datatex pushes | Planning tool uses it for |
|---|---|---|
| Projection / enquiry | Projected order, buyer, customer, style/article, quantity, requested date, order type. | Due-date quotation, future/free-zone capacity check. |
| Order confirmation | Confirmed SO/WO/PO references, order quantity, color/size split, shipment split, committed/requested date. | Internal planning order, T&A generation, zone entry, readiness path. |
| Order change | Quantity change, delivery date change, cancellation, split change, ERP status change. | Impact preview, re-plan governance, frozen/firm-zone exception handling. |
| Style/product attributes | Style code, product group, fabric type, wash code if ERP-owned. | Route selection, SMV lookup, wash readiness, planning constraints. |
| Procurement | Material PO, supplier, ETA, acknowledgement, ex-mill, revised ETA. | FKD readiness, material risk, T&A milestone update. |
| Material receipt/inventory | GRN, fabric/trims receipt, available or allocated quantity, shortage, hold. | PCD readiness, release validation, material blocker detection. |
| Shipment/dispatch | Packed, dispatch, invoice, or shipment status where Datatex owns it. | OTIF reconciliation, shipment closure, short-shipment validation. |

Recommended frequency:

- Order, projection, and order-change feeds should be near-real-time or frequent scheduled sync.
- Material and procurement feeds should be event-based or several times daily.
- Shipment and dispatch feeds should be event-based.
- Master/reference data feeds should run on change or nightly.

#### Outbound: Planning Tool To Datatex

Only push fields that Datatex needs to store or expose commercially. Do not push internal planning noise unless Datatex is configured to consume it.

| Stage | Planning tool pushes | Why |
|---|---|---|
| Due quotation | Suggested delivery week/date, confidence, constraint note. | If Datatex stores quotation promise or customer commitment proposal. |
| Commitment | Final committed due date after approval. | To align ERP commercial date with capacity-backed promise. |
| Pre-production | FKD, PCD, revised FKD/PCD, reason and approval where required. | If Datatex stores these dates or needs them for order status. |
| T&A/TNA | Baseline/current/actual milestone dates, blocker status. | Only if Datatex consumes milestone status. |
| Release | Release-to-cutting or production release status. | ERP visibility that order moved into controlled production. |
| Execution milestones | Cutting complete, sewing complete, laundry in/out, finishing complete, packing ready. | Only if Datatex tracks production milestone status. |
| Shipment readiness | Ready-to-ship quantity, short-shipment risk, exception/approval status. | To support dispatch decision before Datatex shipment closure. |
| Closure | Final production completion milestone, shipment readiness closure. | If Datatex needs operational completion before dispatch or invoice. |

#### Integration Pattern

Inbound Datatex data should follow this controlled path:

```text
Datatex feed/API
-> staging/import event
-> validation
-> source-key mapping
-> apply service
-> audit
-> downstream recalculation
```

Outbound platform updates to Datatex should follow this controlled path:

```text
planning event
-> outbound event queue
-> Datatex API/file adapter
-> delivery status
-> retry/error handling
-> audit
```

Every inbound record should carry:

- Datatex source key.
- Order, work-order, or PO reference.
- Event timestamp.
- Source update timestamp.
- Revision or version where available.
- Source status.
- Payload hash or event ID for idempotency.

The planning tool must not create an independent commercial order that bypasses Datatex. It should create an internal planning order only after receiving or mapping a Datatex projection/order reference. Likewise, Datatex should not be expected to calculate the schedule. Datatex gives transaction truth; the planning tool converts that truth into capacity-backed operational decisions.

### Frontend Scope

Implement:

- Integration status view.
- Import dry-run results.
- Apply/reject workflow.
- Error report view.
- Source-of-truth matrix view.
- Audit trace/search extension.

### Production-Grade Rules

- No import applies directly without validation.
- Optional legacy external plan files remain draft inputs until validated into a platform draft plan.
- Datatex remains canonical for ERP transaction truth.
- FastReact is not a required source, target, or runtime dependency.
- The platform remains the planning and scheduling system of record.
- Platform owns planning, T&A interpretation, release governance, WIP truth, and operational exceptions where built.
- Every imported row must be traceable to source.

### Exit Criteria

- Import can dry-run, validate, show errors, and apply with audit.
- Datatex order/material feeds can update mapped domain records or source events.
- External T&A event can update T&A action item through source-event model.
- Legacy external draft-plan input remains draft until platform validation.
- Stale integration status can trigger alerts.

---

## 15. Wave 7: Analytics, Control Tower, And Simulation

### Objective

Turn operational truth into management control and planning learning.

### Backend Scope

New app:

```text
backend/apps/analytics
```

Core models:

- `PlanningHealthSnapshot`
- `WorkcenterLoadSnapshot`
- `LineEfficiencySnapshot`
- `WipPipelineSnapshot`
- `ExceptionRecoverySnapshot`
- `ShipmentReadinessSnapshot`
- `OtifSnapshot`
- `SimulationScenario`
- `SimulationResult`

Services:

- Snapshot generation.
- KPI formula services.
- Drilldown selectors.
- What-if previews.
- Multi-unit capacity simulation.
- Recovery-cost and cost-protected OTIF calculation.

### Frontend Scope

Implement:

- `executive_control_tower`
- `performance_analytics_dashboard`
- `what_if_simulation_workbench`
- `multi_unit_capacity_simulation`
- full `calendar_gantt_planning_dashboard`

### Production-Grade Rules

- Analytics must reconcile to operational records.
- Backend owns KPI formulas.
- Simulation previews must not commit writes until governed action is confirmed.
- Management dashboards must show stale data warnings.
- OTIF should distinguish normal OTIF from recovery-protected OTIF where recovery effort/cost exists.

### Exit Criteria

- Control tower shows shipment risk, current constraint, OTIF exposure, and top exceptions.
- Analytics drilldown links to order/workcenter/line/WIP records.
- What-if scenario can preview capacity and shipment impact without committing changes.
- Multi-unit simulation can compare constrained resources across units.

---

## 16. Wave 8: Production Hardening, UAT, Pilot, Rollout

### Objective

Move from feature-complete software to an adopted production operating system.

### Scope

- Permission coverage review.
- Audit coverage review.
- Performance tuning.
- Dense grid and mobile performance testing.
- Celery scheduled job monitoring.
- Backup and restore drill.
- Security hardening.
- Observability.
- UAT scenario pack.
- Pilot data migration.
- Parallel run against legacy/Excel process.
- User training.
- Cutover.
- Stabilization dashboard.

### Production-Grade Gates

- Every critical write has permission, validation, audit, and recalculation.
- Every operational dashboard has stale-data visibility.
- Every major workflow has at least one seed scenario and one E2E path.
- Backup/restore is proven.
- Import rollback is proven.
- UAT sign-off is scenario-based, not screen-based.
- Pilot scope has named process owners.

### Exit Criteria

- Pilot users operate selected process scope in the system.
- Excel is reduced to transition evidence, not the control source.
- WIP, output, exceptions, shipment readiness, and planning truth are trusted in pilot scope.
- Production rollback/runbook exists and has been tested.

---

## 17. Cross-Wave Technical Enablers

These should not wait for their final wave. They must be strengthened continuously.

### 16.1 Audit And Traceability

Every new feature must write business-readable audit for:

- Generated T&A plan.
- T&A completion/revision/waiver.
- Promise request and decision.
- Capacity reservation.
- Sewing line candidate allocation and planner decision.
- Sewing line spread exception and realignment decision.
- Wash batch creation and rewash.
- WIP adjustment.
- QC hold/release.
- Exception escalation/closure.
- Shipment readiness approval.
- Import apply/reject.

### 16.2 Permissions

Every action API needs permission coverage.

Examples:

- `time_action.complete`
- `time_action.revise_firm_date`
- `capacity_promising.reserve`
- `sewing.recommend_line_allocation`
- `sewing.commit_line_allocation`
- `sewing.approve_line_spread_exception`
- `sewing.apply_realignment`
- `wash.create_batch`
- `wash.mark_rewash`
- `quality.release_hold`
- `shipment.approve_readiness`
- `shopfloor.sync_offline`
- `integration.apply_import`

### 16.3 Seed Data

Seed data must evolve from demo data to production-like scenarios:

- T&A blocked by wash approval.
- T&A blocked by fabric QC.
- Quote scenario with sewing bottleneck.
- Sewing line candidate ranking with one good fit and one risky fit.
- Sewing line split requiring approval because it exceeds the preferred line-spread policy.
- Sewing line completion projection changing after hourly net-good shortfall.
- Quote scenario with wash bottleneck.
- Rewash consuming capacity.
- WIP ageing.
- QC hold blocking shipment.
- External feed stale.
- Datatex order update.
- Legacy draft-plan conflict.
- Offline sync duplicate.

### 16.4 API Envelope And Service Layer

All new APIs must keep:

```json
{ "data": {}, "meta": {}, "errors": [] }
```

Critical actions must remain explicit POST actions through services. No generic status patch should update governed business state.

### 16.5 Prototype Governance

Each UI surface should map to approved prototypes under `docs/frontend_ui`. If a new T&A or promise surface has no prototype, record a UI governance gap and either:

- create a prototype first, or
- formally approve a derivative surface based on the closest existing workbench pattern.

---

## 18. Recommended Sequencing Detail

The production-grade roadmap should be executed as vertical slices, not as large backend-only or frontend-only phases.

### Slice A: T&A Foundation

Build:

- T&A template.
- Order T&A plan.
- Dependency calculation.
- Action completion.
- Alerts.
- PCD mapping.
- Order T&A UI.

Why first:

- Adds missing readiness intelligence.
- Feeds PCD and promise engine.

### Slice B: Capacity Promise To Sewing Handoff

Build:

- Promise request.
- Capacity ledger.
- Sewing handoff promise using finite line capacity assumptions.
- Promise alternatives.
- Reservation state.
- Promise UI.

Why second:

- Gives immediate value for order acceptance without waiting for full wash.
- Clearly labels scope as "to sewing handoff" until downstream modules mature.

### Slice B2: Sewing Line Planning And Operating Surface

Build:

- Line capability and fit scoring.
- Candidate line/date allocation.
- Line-spread policy and warnings.
- Daily/weekly finite line buckets.
- Sewing operating board plan-versus-actual projection.
- Realignment preview tied to planning impact.
- Efficiency feedback into planning assumptions.

Why immediately after Slice B:

- Turns the sewing handoff promise into a planner-operable daily and weekly sewing plan.
- Gives wash planning a more reliable sewn-handoff signal.
- Uses existing Phase 5 sewing surfaces instead of waiting for downstream wash or shipment modules.

### Slice C: Wash Demand And Batch Planning

Build:

- Wash demand from sewn WIP.
- Wash batch.
- Machine compatibility.
- Wash planning board.
- WIP movement into wash queue.

Why third:

- Converts the biggest current downstream blind spot into operational truth.

### Slice D: Wash Execution And Rewash

Build:

- Batch step execution.
- Dry/wet process capture.
- Post-wash QC.
- Rewash/touch-up.
- Release to finishing-ready WIP.

Why fourth:

- Makes wash not just planned, but controlled.

### Slice E: Quality And Shipment Closure

Build:

- QC holds.
- Recovery action.
- Shipment readiness.
- Final blockers.

Why fifth:

- Completes order-to-shipment flow.

### Slice F: Mobile Actuals

Build:

- Mobile home.
- Output capture.
- Handover.
- Defect/hold.
- Downtime.
- Offline sync.

Why sixth:

- Keeps operational data current after execution domains exist.

### Slice G: Datatex And Optional Legacy/Event Feeds

Build:

- Source registry.
- Datatex order/material feed.
- External T&A event feed.
- Import dry-run/apply.
- Optional legacy draft-plan import for transition or comparison only.

Why parallel:

- Some feed work can start earlier, but robust apply needs domain targets.

### Slice H: Analytics And Simulation

Build:

- Snapshots.
- Control tower.
- Performance analytics.
- What-if.
- Multi-unit simulation.

Why later:

- Analytics is only trustworthy after WIP, wash, QC, exceptions, and shipment truth are stable.

---

## 19. Dependency Map

| Capability | Depends on | Feeds |
|---|---|---|
| T&A governance | Orders, PCD, planning zones, audit | PCD, FKD, due-date promise, release blockers |
| Due-date promise | T&A readiness, route, capacity, current plan | order acceptance, planning, customer commitment |
| Sewing line planning | Operation bulletin, SMV/SAM, line capability, capacity ledger, manpower, machine/skill fit | sewing handoff promise, line loading, realignment, sewn WIP timing, wash demand |
| Wash planning | sewn WIP, wash route, workcenter/machine capacity | due-date promise, WIP truth, shipment risk |
| WIP reconciliation | WIP movements, handovers, holds | wash, quality, shipment, analytics |
| Quality control | WIP stages, defect masters, process checkpoints | recovery, shipment readiness, analytics |
| Exception recovery | alerts, QC holds, delays, capacity misses | control tower, daily flow, shipment protection |
| Shipment readiness | packed/finished WIP, QC, documents, AQL | OTIF, customer commitment |
| Mobile capture | execution domains, idempotent event APIs | live WIP, output, downtime, quality |
| Integrations | Datatex source-of-truth rules, staging, domain models | T&A, PCD, planning, WIP, shipment |
| Analytics/simulation | operational truth, snapshots | management control, continuous improvement |

---

## 20. Roadmap Backlog Table

| Backlog family | Priority | Roadmap wave | Main deliverable |
|---|---:|---|---|
| Current Phase 0-5 stabilization | P0 | Wave 0 | Keep existing flow reliable. |
| T&A templates and order T&A plan | P0 | Wave 1 | Dependency-based calendar. |
| T&A alerts and PCD/FKD mapping | P0 | Wave 1 | Readiness control and blockers. |
| Planning-zone T&A revision governance | P0 | Wave 1 | Firm/frozen date control. |
| Capacity ledger for promise | P0 | Wave 2 | Date-finding foundation. |
| Sewing handoff promise | P0 | Wave 2 | First due-date quote scope. |
| Promise alternatives and confidence | P1 | Wave 2 | Explainable customer commitment. |
| Sewing line capability and fit scoring | P0 | Wave 2A | Approved route and SMV/SAM become line-fit logic. |
| Finite sewing line allocation | P0 | Wave 2A | Candidate line/date plan with target output and completion. |
| Sewing operating board projection | P0 | Wave 2A | Daily plan-versus-actual control for line loading. |
| Line-spread and realignment governance | P1 | Wave 2A | Efficiency-aware split loading and governed line changes. |
| Sewing efficiency feedback loop | P1 | Wave 2A | Actual net-good output improves future planning assumptions. |
| Wash demand and batch planning | P0 | Wave 3 | Sewn WIP becomes wash load. |
| Wash machine compatibility | P0 | Wave 3 | Prevent infeasible laundry scheduling. |
| Wash execution and post-wash QC | P0 | Wave 3 | Laundry truth. |
| Rewash and touch-up loop | P0 | Wave 3 | Capacity and shipment risk accuracy. |
| WIP pipeline and reconciliation | P0 | Wave 3 | Quantity truth. |
| Quality holds and defect capture | P1 | Wave 4 | Movement control and quality visibility. |
| Recovery action lifecycle | P1 | Wave 4 | Owner-based recovery. |
| Shipment readiness | P1 | Wave 4 | Full order closure. |
| Mobile output/handover/wash capture | P1 | Wave 5 | Live actuals. |
| Offline sync | P2 | Wave 5 | Shopfloor resilience. |
| Datatex feeds | P0 | Wave 6 | Canonical transaction integration. |
| Legacy external draft-plan inputs | P2 | Wave 6 | Optional transition/migration support only; not a runtime dependency. |
| Analytics snapshots | P1 | Wave 7 | Reliable KPI layer. |
| Executive control tower | P2 | Wave 7 | Management control. |
| What-if and multi-unit simulation | P2 | Wave 7 | Advanced planning. |
| Production hardening | P0 | Wave 8 | Pilot readiness. |

---

## 21. Roadmap Risks

### 20.1 Risk: Building Wash UI Before Wash Domain Truth

Avoid implementing only cards and boards for wash. The hard part is batch logic, WIP movement, machine compatibility, QC, rewash, and capacity consumption.

### 20.2 Risk: Due-Date Promise Becomes A Guess

Do not expose promised shipment dates until capacity ledger, readiness, wash, finishing, and packing assumptions are explicit. If only sewing is modeled, label the output as sewing handoff promise.

### 20.3 Risk: Sewing Board Becomes A Dashboard, Not A Planning Surface

Do not stop at showing target, actual, efficiency, and risk. The production-grade build must connect the board to route, SMV/SAM, line capability, finite line buckets, candidate allocation, line-spread policy, realignment impact, and projected completion. Otherwise the tool will still rely on manual sewing planning outside the platform.

### 20.4 Risk: T&A Becomes Ticketing Overhead

Keep T&A as action plan plus dependencies plus alerts. Do not make every milestone a ticket with unnecessary ceremony.

### 20.5 Risk: Analytics Before Operational Truth

Control tower and simulation should not outrun WIP, wash, QC, and shipment truth. Otherwise the dashboards will amplify stale assumptions.

### 20.6 Risk: Integration Creates Duplicate Truth

Datatex and the planning platform must have explicit source-of-truth rules. Any optional legacy file or external event input needs source, timestamp, and confidence. FastReact should not be represented as a dependency in the production operating model.

---

## 22. Recommended Immediate Next Steps

### Step 1: Approve Roadmap Reframing

Confirm that production-grade build order is:

```text
T&A + promise foundation
-> sewing line planning and operating surface
-> wash/WIP truth
-> quality/recovery/shipment
-> mobile actuals
-> integration
-> analytics/simulation
-> hardening/rollout
```

### Step 2: Create Canonical Backlog Epics

Create epics:

- `EOS-13 / time-action-governance`
- `EOS-14 / capacity-promising`
- `EOS-05A / sewing-line-planning-operating-surface`
- `EOS-06 / wash-wip-truth`
- `EOS-07 / quality-recovery-shipment`
- `EOS-08 / shopfloor-live-capture`
- `EOS-10 / datatex-integration-source-truth`
- `EOS-09 / analytics-simulation`
- `EOS-11-12 / production-hardening-rollout`

The numbering `EOS-13` and `EOS-14` can be used only as planning labels for the new research tracks. If the team wants to avoid adding EOS node numbers, treat them as cross-cutting feature families under EOS-03/EOS-04/EOS-10.

### Step 3: Blueprint T&A And Due-Date Promise First

These two affect the upstream operating model and should be blueprinted before adding more execution screens.

Blueprint outputs:

- T&A milestone catalog.
- T&A template selection matrix.
- PCD/FKD mapping.
- Date revision governance.
- Promise route assumptions.
- Capacity ledger design.
- Reservation rules.
- Datatex feed requirements.

### Step 4: Build Wash Domain Blueprint In Parallel

Wash blueprint outputs:

- Actual wash process taxonomy.
- Machine list and capability matrix.
- Batch sizing rules.
- Recipe parameter model.
- Shade-lot rules.
- Rewash/touch-up rules.
- Post-wash QC rules.
- WIP movement map.

### Step 5: Update Canonical Build Spine

After approval, update:

- `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`
- `docs/21_Phasewise_Backend_Build_Plan.md`
- `docs/22_Phasewise_Frontend_Build_Plan.md`
- `docs/20_Seed_Data_Simulation_Scenarios.md`
- `docs/19_Testing_QA_Strategy.md`

The update should insert T&A and capacity promising as explicit production-grade feature families, not hidden sub-items under existing phases.

It should also insert sewing line planning and the sewing operating surface as an explicit EOS-05A-style production-grade extension. The current Phase 5 implementation should be treated as the base execution bridge; the EOS-05A extension should own finite line allocation, candidate ranking, line-spread policy, projected sewing completion, and feedback from net-good actuals into future planning assumptions.

---

## 23. Final Roadmap Position

The product has crossed the point where an MVP-style roadmap is enough. The next build should be framed as a production-grade operating spine.

The critical insight is that the new research tracks are not peripheral enhancements:

- T&A makes readiness governable.
- Due-date quotation makes customer commitment capacity-aware.
- Sewing line planning turns route, SMV/SAM, line capability, and actual output into a daily/weekly operating surface.
- Wash-heavy architecture makes Eratex's actual production constraint visible.

Together, they should be treated as the bridge between the current Phase 5 implementation and the deferred EOS-06 to EOS-12 roadmap.

The recommended roadmap is therefore:

```text
Current Phase 0-5 foundation
-> T&A readiness governance
-> Capacity promise and due-date quotation
-> Sewing line planning and operating surface
-> Wash and WIP truth
-> Quality, recovery, and shipment readiness
-> Shopfloor live capture
-> Datatex/source-of-truth integration, with optional non-operational legacy adapters
-> Analytics, simulation, and control tower
-> Production hardening, UAT, pilot, rollout
```

This sequence gives Eratex the best path from a useful planning/scheduling tool to a full factory operating system.
