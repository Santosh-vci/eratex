# Eratex T&A Additive Feature Implementation Plan

## 1. Executive Position

This document extends the Eratex planning and scheduling probe into a full Time and Action Calendar implementation plan.

The recommendation is to build a pure T&A additive feature, not a ticket-heavy TMS implementation.

The feature should inherit the useful operating logic from the TMS/WAS concept in the Eratex solution deck:

- Dependency-driven release of work.
- Owner-based action visibility.
- Mandatory closure criteria.
- Baseline versus revised date governance.
- SLA and milestone health priority.
- FKD, PCD, release, and shipment readiness interpretation.
- Alerts and escalations when work is late, blocked, stale, or critical.

But it should not use a ticket as the main business object for every activity. A garment factory does not need thousands of miniature tickets to manage a T&A calendar. It needs a clean order-level milestone graph that tells teams:

- What must be done.
- Who owns it.
- When it is due.
- Whether it is ready to start.
- What it blocks.
- What evidence is required to complete it.
- Whether it is endangering FKD, PCD, production release, sewing start, laundry start, finishing, packing, or shipment.

The core object should therefore be an order T&A plan with dependent action items, not a ticket project.

---

## 2. Source Basis

This plan is based on the current repository state and the research documents already created under `docs/research`.

Key source documents:

- `docs/research/Eratex_Solution_Deck_Synthesis.md`
- `docs/research/pre_blueprinting/01_scenario_tool_owned_factory_event_capture.md`
- `docs/research/pre_blueprinting/02_scenario_external_factory_event_consumption.md`
- `docs/research/Eratex_Due_Date_Quotation_Capability_Evaluation.md`
- `docs/research/Eratex_Planning_Zones_Due_Date_Promising_CCR_Implementation_Plan.md`
- `docs/research/Eratex_Wash_Feature_Implementation_Evaluation_And_Plan.md`
- `docs/research/Eratex_Laundry_Washes_Finishes_Process_Document.md`

The pre-blueprinting documents already establish that T&A must connect customer commitment to FKD, PCD, production release, laundry, finishing, packing, and shipment readiness. They also state that T&A must preserve baseline dates, show revised dates separately, maintain predecessor dependencies, and feed release blockers and daily flow priorities.

This document converts that research direction into an implementation plan for the current codebase.

---

## 3. Why T&A Is Needed

The current application has planning, release, PCD readiness, cutting execution, sewing line loading, and sewing output capture capabilities within the implemented boundary. It does not yet have the upstream dependency-control layer needed to manage pre-production and readiness flow before production execution.

Without T&A, the system can show that an order is PCD blocked, but it cannot fully explain:

- Which upstream action caused the block.
- Whether that action was ready to start.
- Whether the accountable team had already been alerted.
- Whether the planned date moved from the original baseline.
- Whether the delay is still recoverable.
- Whether a missed action will affect FKD, PCD, cutting release, sewing loading, laundry start, or shipment.
- Whether the delay is caused by Datatex data, material availability, approval delay, wash standard delay, sample delay, lab issue, or internal handoff.

For Eratex, T&A should become the connective layer between order commitment and production feasibility.

It should not replace ERP, PCD readiness, scheduling, or production execution. It should orchestrate the pre-production and readiness actions that make those later steps feasible.

---

## 4. Current Repo State

### 4.1 Relevant Existing Backend Apps

The current backend apps include:

- `orders`
- `pcd_readiness`
- `planning`
- `production_release`
- `boundary_cases`
- `external_plans`
- `materials_procurement`
- `fabric_qc`
- `style_technical`
- `cutting`
- `sewing`
- `wip_inventory`
- `workcenters`
- `audit_governance`
- `master_data`

There is no dedicated T&A, TNA, workflow, alert, notification, or task-dependency app.

### 4.2 Current Order Milestones

The `orders` app has `OrderMilestone`.

Current behavior:

- Milestones are generated from fixed offsets around `planned_pcd_date`.
- Milestone examples include order confirmation, fabric PO, fabric receipt, PCD, cutting start, sewing start, wash start, finishing start, packing, final QC, and shipment.
- Each milestone has a planned date, actual date, status, owner, and delay reason.

This is a useful seed, but it is not T&A.

Current gaps:

- No baseline versus current target versus revised date separation.
- No dependency graph.
- No role-based action readiness.
- No closure criteria.
- No evidence requirements.
- No alert generation.
- No milestone criticality by FKD, PCD, release, laundry, packing, or shipment.
- No zone-based date governance.
- No link to PCD readiness item satisfaction.
- No integration event model for Datatex, PLM, FastReact, or external workflow feeds.

### 4.3 Current PCD Readiness

The `pcd_readiness` app has `PCDReadiness` and `PCDReadinessItem`.

The default PCD checklist includes items such as:

- PO confirmed.
- BOM frozen.
- Fabric received.
- Fabric QC passed.
- Shade lots mapped.
- Shrinkage available.
- Trims available.
- Pattern approved.
- Marker ready.
- PP sample approved.
- Wash standard approved.
- Line allocated.
- Wash capacity booked.
- QC file ready.

This is close to T&A in spirit, but it is a release-gate checklist, not a full T&A calendar.

Current gaps:

- PCD items are all due on planned PCD by default.
- Dependencies are not modeled.
- The path to reach each item is not represented.
- Alerts are not generated from due dates or predecessor completion.
- Completion does not differentiate whether it came from internal action capture, Datatex, fabric QC, procurement, wash approval, or manual update.
- There is no action plan across the full order lifecycle.

PCD readiness should remain the release gate. T&A should feed it.

### 4.4 Current Planning Zones

The `planning` app has `PlanningZoneConfiguration` with:

- Frozen zone.
- Firm zone.
- Flexible zone.

The research documents also discuss future/free, volatile, firm, frozen, and execution zones.

Current gaps:

- Orders do not yet have a full planning-zone state that controls T&A governance.
- T&A date locks do not exist.
- Milestone baselines are not locked on zone transitions.
- Revision approvals are not tied to planning zone.

Planning zones should become a governance input to T&A.

### 4.5 Current Boundary Case Governance

The `boundary_cases` app has a strong exception object with:

- Severity.
- Linked order.
- Linked plan.
- Linked work item.
- Linked workcenter or line.
- Trigger source.
- Impact preview.
- Approval and application fields.
- Recommended actions.

This should not be reused as the base T&A object.

Boundary cases should be created only when a T&A miss creates a material operational exception, such as:

- Firm-zone PCD blocker.
- Release blocker.
- Critical FKD miss.
- Sewing start impact.
- Shipment risk.
- External data conflict that prevents release decision.

Routine T&A actions should remain in the T&A module.

---

## 5. Design Principle: T&A, Not Ticketing

### 5.1 What To Keep From TMS/WAS

The deck's TMS/WAS logic contains useful operating principles:

- Do not expose an action to a user until its prerequisites are complete or its start trigger is active.
- Use mandatory closure fields instead of informal yes/no completion.
- Use touch time, queue time, buffer, and milestone health to prioritize work.
- Preserve baseline dates.
- Govern revised dates.
- Use APIs to avoid re-entry of data that already exists in Datatex or other systems.
- Feed FKD, PCD, release blockers, and Daily Flow Meeting priorities.

These should be retained.

### 5.2 What To Avoid

The implementation should avoid:

- A ticket object for every milestone.
- Open-close ticket ceremony for simple date capture.
- Separate ticket dashboards that duplicate PCD readiness, planning, or execution boards.
- Workflow bureaucracy where the factory needs quick milestone control.
- Reopening previous tickets as the primary correction mechanism.
- Treating document uploads as the main value proposition.
- Overbuilding chat, comments, assignments, watchers, or ticket history in the first version.

The value should come from dependency visibility, due-date discipline, alerting, and readiness governance.

### 5.3 Correct Object Model

Use this mental model:

```text
Order
  -> T&A Plan
       -> T&A Action Items
            -> Dependencies
            -> Closure Requirements
            -> Alerts
            -> Revision History
            -> Source Events
```

Do not use this as the primary model:

```text
Order
  -> Project
       -> Tickets
            -> Ticket comments
            -> Ticket reopen cycles
            -> Ticket queues
```

---

## 6. Target Business Capability

The T&A feature should support the following business capability:

For every order or projected order, the system can generate and monitor a dependency-based calendar of actions from customer order entry through procurement, approvals, PCD, production initiation, sewing, laundry, finishing, packing, and shipment readiness.

The calendar should show:

- Baseline planned date.
- Current target date.
- Revised target date where allowed.
- Actual start date.
- Actual completion date.
- Owner role.
- Owner user where assigned.
- Predecessor and successor dependencies.
- Mandatory evidence or data requirements.
- Source system.
- Criticality to FKD, PCD, release, laundry, packing, or shipment.
- Health status.
- Delay reason.
- Revision reason and approval status.
- Whether the action blocks a downstream gate.

The feature should make the order's readiness path visible before the scheduling system is forced to react late.

---

## 7. Functional Scope

### 7.1 In Scope

The first full T&A design should cover:

- T&A template master.
- Template selection by buyer, customer, product type, fabric type, wash route, and order type.
- Order T&A plan generation.
- Milestone and action-item dependencies.
- Baseline and target date calculation.
- Closure requirements.
- Owner role assignment.
- Action readiness calculation.
- Health and risk calculation.
- Alerts and notifications.
- PCD readiness integration.
- FKD interpretation.
- Release blocker interpretation.
- Planning-zone based date lock and revision governance.
- External source event ingestion.
- Manual capture where external events do not exist.
- Audit history.
- UI for order T&A, action worklist, template master, and alerts.

### 7.2 Explicitly Out Of Scope For The First Build

The first build should not include:

- Full ticketing system.
- Chat/comment thread per action.
- Complex Kanban board for every activity.
- Enterprise document management.
- Offline mobile behavior.
- Full workflow BPMN designer.
- Advanced AI-based auto-expediting.
- Production execution beyond existing phase boundary.
- Wash execution transactions before the wash module exists.
- Full shipment workflow if shipment systems remain external.

---

## 8. Core Concepts

### 8.1 T&A Template

A T&A template defines the standard action sequence for a class of order.

Template selection dimensions:

- Customer.
- Buyer.
- Product type.
- Garment type.
- Fabric type.
- Denim/non-denim.
- Wash requirement.
- Order type.
- Development versus repeat order.
- Lead-time band.
- Factory.

Template item examples:

- Order confirmation.
- Style technical file approval.
- BOM freeze.
- Fabric PO creation.
- Trims PO creation.
- Lab dip approval.
- Shade approval.
- Wash standard approval.
- Fit approval.
- PP sample approval.
- Garment test sample approval.
- Fabric ex-mill.
- Fabric receipt.
- Fabric inspection.
- Shrinkage availability.
- Marker ready.
- Full Kit Date.
- Planned Cut Date.
- Cutting release.
- Sewing line allocation.
- Sewing start.
- Sewing end.
- Laundry in.
- Laundry out.
- Finishing complete.
- Packing complete.
- Shipment readiness.

### 8.2 Order T&A Plan

An order T&A plan is the generated, order-specific instance of a template.

It should be generated when:

- A projected order is created for quotation.
- A customer order is confirmed.
- A Datatex order is received.
- An order enters the volatile zone and needs active pre-production control.

It should be regenerated or revised only through governed rules.

### 8.3 T&A Action Item

A T&A action item is the atomic managed step.

It is not a ticket. It is a dated, owned, dependency-aware action.

Required fields:

- Plan.
- Action code.
- Action name.
- Sequence.
- Owner role.
- Owner user where assigned.
- Department.
- Baseline planned date.
- Current target date.
- Revised target date.
- Actual start date.
- Actual completion date.
- Earliest start date.
- Latest acceptable completion date.
- SLA days or hours.
- Queue allowance.
- Buffer days.
- Status.
- Health.
- Criticality type.
- Blocker flag.
- Source system.
- Source reference.
- Closure rule.
- Required evidence.
- Delay reason.
- Revision reason.
- Approval status for revision.

### 8.4 Dependency

Dependencies control readiness and downstream impact.

Dependency types:

- Finish to start.
- Start to start.
- Finish to finish.
- Date-triggered.
- External event-triggered.
- Gate-triggered.

Dependency strength:

- Blocking.
- Advisory.
- Informational.

Example:

```text
Fabric receipt completed
  -> Fabric QC ready
  -> Fabric QC passed
  -> Shrinkage available
  -> Marker ready
  -> PCD ready
```

Example:

```text
Wash standard approved
  -> PCD readiness item WASH_STANDARD_APPROVED
  -> Wash capacity booking
  -> Laundry start confidence
```

### 8.5 Closure Requirement

Closure requirements replace ticket closure ceremony.

An action can only be completed when required fields or evidence are present.

Closure requirement examples:

- PO number must be captured.
- Ex-mill date must be captured.
- Fabric inspection result must be passed.
- Shrinkage value must be available.
- Wash approval status must be approved.
- PP sample status must be approved.
- Required file URL must be present.
- External source event must be accepted.
- Approver must be recorded.

### 8.6 Alert

An alert is a system-generated attention signal.

Alert types:

- Action became ready.
- Action due soon.
- Action overdue.
- Critical action overdue.
- Dependency blocked.
- Required closure data missing.
- External event stale.
- External event conflict.
- Date revision requested.
- Date revision approved.
- Firm-zone change attempted.
- PCD blocker.
- FKD blocker.
- Release blocker.
- Shipment risk.

Alerts should be deduplicated and actionable. They should not become a parallel ticket system.

### 8.7 Exception

An exception is a higher-level governance event created only when an alert materially affects operational commitments.

Exception examples:

- Firm-zone PCD action is late and blocks release.
- A mandatory FKD item is missed.
- A critical wash approval delay threatens sewing start or laundry start.
- A missing external event prevents production release.
- A revised T&A date moves PCD inside the frozen zone.

Use `boundary_cases` for these exceptions.

---

## 9. T&A Status Model

Recommended action item statuses:

| Status | Meaning |
|---|---|
| `NOT_READY` | Predecessor or start trigger is incomplete. |
| `READY` | Work can begin now. |
| `IN_PROGRESS` | Owner has started work or external event indicates work is active. |
| `COMPLETED` | Closure requirements are met and actual completion is recorded. |
| `BLOCKED` | Owner cannot proceed due to missing input or failed predecessor. |
| `OVERDUE` | Current target date or latest completion date has passed. |
| `WAIVED` | Governed waiver approved for a non-critical or conditionally acceptable action. |
| `CANCELLED` | Action no longer applies due to order cancellation or template revision. |
| `REVISION_PENDING` | Date or scope change requested but not approved. |

Recommended health states:

| Health | Meaning |
|---|---|
| `GREEN` | On track. |
| `YELLOW` | Watch item, due soon, low buffer. |
| `RED` | Late or blocking a near-term milestone. |
| `BLACK` | Critical miss affecting FKD, PCD, release, shipment, or protected production flow. |

The health model should align with the Daily Flow Meeting language in the Eratex deck.

---

## 10. Date Model

The date model is critical. A single due date is not sufficient.

Recommended fields:

| Field | Purpose |
|---|---|
| `baseline_planned_date` | Original committed plan date generated or locked from the template. |
| `current_target_date` | Current operational target date. |
| `revised_target_date` | Proposed or approved revised date, separate from baseline. |
| `actual_start_date` | Actual start or first work signal. |
| `actual_completion_date` | Actual completion date accepted by closure rule. |
| `earliest_start_date` | Date before which the action should not be exposed as ready. |
| `latest_completion_date` | Date after which downstream milestone is endangered. |
| `date_source` | Template, Datatex, user, API, system calculation, or external event. |

Rules:

- Baseline date must not be overwritten.
- Current target can change only through allowed governance.
- Revised date must be visible separately.
- Actual date must come from closure, integration, or authorized capture.
- Late status should compare actual/current date against target and criticality.
- Delay measurement should preserve whether the order really improved or whether the target was simply revised.

---

## 11. Planning Zone Governance

T&A should be governed differently across planning zones.

### 11.1 Future / Free Zone

Typical state:

- Enquiry.
- Projection.
- Quotation.
- Early order possibility.

T&A behavior:

- Generate indicative T&A only if needed for due-date quotation.
- Allow template switching.
- Allow target date simulation.
- Do not lock dates.
- Do not create operational alerts except quote risks.
- Do not create boundary cases.

### 11.2 Volatile Zone

Typical state:

- Order confirmed.
- Pre-production activity active.
- Materials and approvals still moving.

T&A behavior:

- Generate active T&A plan.
- Start dependency monitoring.
- Alert owners when actions become ready.
- Track due soon and overdue actions.
- Allow revisions with reason codes.
- Preserve baseline.
- Feed FKD and PCD risk.

### 11.3 Firm Zone

Typical state:

- PCD, FKD, sewing start, route, and capacity commitment are expected to stabilize.

T&A behavior:

- Lock baseline dates.
- Require approval for critical date revisions.
- Treat missing mandatory actions as blockers.
- Escalate critical late items.
- Feed release validation.
- Create boundary-case events only for material misses.

### 11.4 Frozen / Execution Zone

Typical state:

- Cutting or sewing execution is protected.
- Routine replanning should reduce.

T&A behavior:

- No routine date revision for upstream actions that should already be complete.
- Missed readiness item becomes exception or release blocker.
- Use recovery action, not routine rescheduling.
- Connect to live execution status where applicable.
- Keep audit trail for all late completion and waivers.

---

## 12. Integration With PCD Readiness

PCD readiness should remain the formal release gate. T&A should become the upstream plan and evidence source.

Recommended approach:

- Keep `PCDReadiness` and `PCDReadinessItem`.
- Add mapping from T&A action items to PCD readiness item codes.
- When a mapped T&A item is completed, update or propose update to the corresponding PCD item.
- When a mapped T&A item is blocked or overdue, reflect blocker status in PCD readiness.
- Do not allow T&A to bypass existing release validation.
- Keep waiver and conditional release governance in PCD readiness.

Example mappings:

| T&A action | PCD readiness item |
|---|---|
| PO confirmation accepted | `PO_CONFIRMED` |
| BOM approved and frozen | `BOM_FROZEN` |
| Fabric receipt completed | `FABRIC_RECEIVED` |
| Fabric inspection passed | `FABRIC_QC_PASSED` |
| Shrinkage result available | `SHRINKAGE_AVAILABLE` |
| PP sample approved | `PP_SAMPLE_APPROVED` |
| Wash standard approved | `WASH_STANDARD_APPROVED` |
| Line allocation confirmed | `LINE_ALLOCATED` |
| Wash slot or route capacity confirmed | `WASH_CAPACITY_BOOKED` |
| QC file approved | `QC_FILE_READY` |

T&A should answer "how do we get ready." PCD readiness should answer "can we release."

---

## 13. Integration With FKD

FKD should be treated as a derived readiness milestone, not just a manually entered date.

FKD depends on:

- Fabric readiness.
- Trim readiness.
- Key approvals.
- Wash standard readiness where applicable.
- Technical file readiness.
- Production file readiness.

T&A should:

- Mark which actions are FKD-critical.
- Calculate FKD health from completion state and remaining buffer.
- Show the blocking action responsible for FKD risk.
- Preserve baseline FKD and revised FKD.
- Feed FKD risk into Daily Flow Meeting priorities.

---

## 14. Integration With Due-Date Quotation

The due-date quotation evaluation already identifies a missing capability: reliable future due-date prediction needs readiness dates, capacity, route, current load, and execution status.

T&A provides the readiness side of that equation.

Due-date promising should consume:

- Earliest PCD readiness date from T&A and PCD readiness.
- Material readiness confidence.
- Approval readiness confidence.
- Wash approval readiness.
- Planned sewing start constraints.
- Planned laundry entry constraints where wash feature exists.
- Risk confidence based on stale or incomplete T&A actions.

Quotation should not simply assume planned PCD. It should use the earliest credible readiness date.

Example:

```text
Earliest feasible sewing start
  = max(
      production release earliest date,
      PCD readiness date from T&A,
      cutting readiness date,
      available sewing capacity date
    )
```

When wash routing is implemented:

```text
Earliest feasible shipment readiness
  = sewing completion
  + wash route capacity time
  + finishing and packing time
  + buffer
```

T&A should provide confidence for the non-capacity prerequisites.

---

## 15. Integration With Wash-Heavy Architecture

The wash research makes it clear that wash is not a simple post-sewing step. It has:

- Route types.
- Enzyme, bleach, tint, resin, ozone, laser, hand effects, neutralization, drying, finishing, and QC operations.
- Recipe parameters.
- Sample approvals.
- Shade and hand-feel sensitivity.
- Rework risk.
- Capacity constraints by machine and process type.

T&A should not execute wash processing, but it should represent wash readiness.

Recommended T&A wash-related actions:

- Wash development required.
- Wash standard submitted.
- Wash sample made.
- Wash standard approved.
- Recipe frozen.
- Bulk wash route approved.
- Shade band approved.
- Chemical availability confirmed.
- Laundry capacity booked.
- Laundry entry target.
- Laundry exit target.
- Wash first-bulk approval.

Once the wash module exists, T&A should link to:

- Wash route version.
- Approved wash recipe.
- Laundry capacity reservation.
- Laundry batch readiness.
- Wash QC status.

Until then, T&A should at least protect `WASH_STANDARD_APPROVED` and `WASH_CAPACITY_BOOKED` as critical PCD/release dependencies.

---

## 16. Integration With Datatex And External Systems

Datatex remains the primary canonical ERP transaction source.

T&A should not duplicate ERP ownership of:

- Customer order.
- Purchase order.
- Style number where ERP owns it.
- Material purchase transaction.
- Inventory receipt transaction.
- Shipment invoice transaction.

T&A should consume ERP and external system data for:

- Order confirmation.
- PO numbers.
- Material PO creation.
- Ex-mill dates.
- Fabric receipt.
- Trim receipt.
- External approval statuses if available.
- Shipment dates.

There are two supported data modes.

### 16.1 Tool-Owned Capture Mode

Use this mode when no reliable external event exists.

The planning tool captures:

- Action completion.
- Required dates.
- Evidence URL.
- Delay reason.
- Manual notes.
- Approval or waiver.

This is closest to scenario 1 in the pre-blueprinting work.

### 16.2 External Consumer Mode

Use this mode when Datatex, PLM, fabric QC, procurement, or another system exposes reliable events.

The planning tool consumes:

- Planned date.
- Revised date.
- Actual completion.
- Approval status.
- Reason code if available.
- Source timestamp.
- Source record reference.

This is closest to scenario 2 in the pre-blueprinting work.

In both modes, T&A remains the interpretation layer:

- It maps external events to milestones.
- It detects stale events.
- It detects missing required evidence.
- It calculates FKD, PCD, and release risk.
- It highlights blockers.

---

## 17. Proposed Backend Architecture

### 17.1 New App

Create a dedicated Django app:

```text
backend/apps/time_action
```

Use the domain name `time_action`, not phase nomenclature.

### 17.2 Models

Recommended model set:

| Model | Purpose |
|---|---|
| `TimeActionTemplate` | Approved reusable T&A template. |
| `TimeActionTemplateItem` | Template-level action definition. |
| `TimeActionTemplateDependency` | Template-level dependency graph. |
| `TimeActionClosureRequirement` | Required fields, evidence, or source events for closure. |
| `OrderTimeActionPlan` | Order-specific generated T&A plan. |
| `OrderTimeActionItem` | Order-specific action instance. |
| `OrderTimeActionDependency` | Order-specific dependency graph. |
| `TimeActionRevisionRequest` | Governed date or scope revision. |
| `TimeActionAlert` | Deduplicated alert/notification signal. |
| `TimeActionSourceEvent` | External event consumed by T&A. |
| `TimeActionPcdMapping` | Mapping between T&A action codes and PCD readiness item codes. |

### 17.3 Template Fields

`TimeActionTemplate`:

- Code.
- Name.
- Customer.
- Buyer.
- Product type.
- Garment type.
- Fabric type.
- Wash required flag.
- Order type.
- Factory.
- Lead time days.
- Status.
- Effective from.
- Effective to.
- Version.
- Is active.

`TimeActionTemplateItem`:

- Template.
- Action code.
- Action name.
- Sequence.
- Owner role.
- Department.
- Anchor type.
- Offset days.
- SLA hours.
- Queue allowance hours.
- Buffer days.
- Criticality.
- Blocks FKD flag.
- Blocks PCD flag.
- Blocks release flag.
- Blocks sewing loading flag.
- Blocks laundry flag.
- Blocks packing flag.
- Blocks shipment flag.
- Closure mode.
- Source mode.
- Is mandatory.
- Is active.

Anchor types:

- Order confirmation.
- Committed shipment date.
- Planned PCD.
- FKD.
- Production release.
- Sewing start.
- Sewing end.
- Laundry in.
- Laundry out.
- Shipment readiness.
- Previous action completion.

### 17.4 Order Plan Fields

`OrderTimeActionPlan`:

- Order.
- Template.
- Plan status.
- Planning zone at generation.
- Baseline locked flag.
- Baseline locked at.
- Baseline locked by.
- FKD baseline date.
- FKD current target date.
- PCD baseline date.
- PCD current target date.
- Overall health.
- Completion percent.
- Critical blocker count.
- Source mode.
- Last recalculated at.

`OrderTimeActionItem`:

- Plan.
- Order.
- Template item reference.
- Action code.
- Action name.
- Owner role.
- Owner user.
- Department.
- Baseline planned date.
- Current target date.
- Revised target date.
- Actual start date.
- Actual completion date.
- Earliest start date.
- Latest completion date.
- Status.
- Health.
- Criticality.
- Is mandatory.
- Closure status.
- Closure payload JSON.
- Evidence URL.
- Delay reason code.
- Delay note.
- Date source.
- Source system.
- Source reference.
- Last source event at.
- Blocks FKD.
- Blocks PCD.
- Blocks release.
- Blocks sewing loading.
- Blocks laundry.
- Blocks packing.
- Blocks shipment.

### 17.5 Alert Fields

`TimeActionAlert`:

- Alert code.
- Plan.
- Action item.
- Order.
- Alert type.
- Severity.
- Status.
- Owner role.
- Owner user.
- Message.
- Triggered at.
- Due at.
- Acknowledged at.
- Resolved at.
- Deduplication key.
- Escalated to boundary event.

Alert status:

- Open.
- Acknowledged.
- Resolved.
- Superseded.

### 17.6 Source Event Fields

`TimeActionSourceEvent`:

- Source system.
- Source event id.
- Source record type.
- Source record id.
- Order number.
- Action code.
- Event type.
- Event timestamp.
- Planned date.
- Revised date.
- Actual date.
- Status.
- Payload JSON.
- Accepted flag.
- Rejection reason.
- Processed at.

This allows Datatex or other tools to feed T&A without making T&A a duplicate ERP.

---

## 18. Service Layer

Keep business logic in services, consistent with repo rules.

Recommended service modules:

```text
backend/apps/time_action/services/templates.py
backend/apps/time_action/services/plan_generation.py
backend/apps/time_action/services/dependencies.py
backend/apps/time_action/services/status.py
backend/apps/time_action/services/alerts.py
backend/apps/time_action/services/revisions.py
backend/apps/time_action/services/pcd_integration.py
backend/apps/time_action/services/source_events.py
backend/apps/time_action/services/zone_governance.py
```

### 18.1 Plan Generation Service

Responsibilities:

- Select best matching template.
- Generate order T&A plan.
- Calculate baseline dates from anchor dates and offsets.
- Copy template dependencies into order dependencies.
- Set initial status and health.
- Write audit event.

Inputs:

- Order.
- Template selection override if needed.
- Generation mode.
- Performed by.

Outputs:

- Order T&A plan.
- Generated action items.
- Initial health.

### 18.2 Dependency Service

Responsibilities:

- Determine whether an item is ready.
- Calculate blocked successors.
- Apply lead/lag rules.
- Prevent downstream completion if blocking predecessor is incomplete.
- Recalculate downstream earliest start dates when actuals change.

### 18.3 Status Service

Responsibilities:

- Calculate item status.
- Calculate item health.
- Calculate plan health.
- Calculate FKD and PCD risk.
- Calculate blocker counts.
- Detect stale external data.

### 18.4 Alert Service

Responsibilities:

- Generate alerts when items become ready.
- Generate due-soon and overdue alerts.
- Deduplicate alerts.
- Resolve alerts when action is complete or no longer risky.
- Escalate critical alerts to boundary cases where configured.

### 18.5 Revision Service

Responsibilities:

- Validate whether a date can be revised.
- Apply zone-specific governance.
- Capture reason codes.
- Require approval in firm/frozen zones.
- Preserve baseline.
- Recalculate downstream target dates after approved revisions.

### 18.6 PCD Integration Service

Responsibilities:

- Map completed T&A actions to PCD readiness items.
- Mark PCD blockers when critical mapped actions are late.
- Keep release validation unchanged.
- Write audit trail when T&A changes PCD readiness.
- Prevent circular logic where PCD directly completes T&A without a source event or user action.

### 18.7 Source Event Service

Responsibilities:

- Accept events from Datatex or other systems.
- Validate event schema.
- Map source events to T&A action items.
- Apply actual or revised dates.
- Mark stale, duplicate, or conflicting data.
- Generate alerts for bad data.

---

## 19. API Surface

Use explicit API endpoints and the standard response envelope:

```json
{ "data": {}, "meta": {}, "errors": [] }
```

Recommended endpoints:

### 19.1 Templates

```text
GET    /api/time-action/templates/
POST   /api/time-action/templates/
GET    /api/time-action/templates/{id}/
POST   /api/time-action/templates/{id}/clone/
POST   /api/time-action/templates/{id}/submit/
POST   /api/time-action/templates/{id}/approve/
POST   /api/time-action/templates/{id}/retire/
```

### 19.2 Order Plans

```text
GET    /api/time-action/plans/
POST   /api/time-action/plans/generate/
GET    /api/time-action/plans/{id}/
POST   /api/time-action/plans/{id}/recalculate/
POST   /api/time-action/plans/{id}/lock-baseline/
```

### 19.3 Action Items

```text
GET    /api/time-action/items/
GET    /api/time-action/items/{id}/
POST   /api/time-action/items/{id}/start/
POST   /api/time-action/items/{id}/complete/
POST   /api/time-action/items/{id}/block/
POST   /api/time-action/items/{id}/waive/
POST   /api/time-action/items/{id}/assign/
```

### 19.4 Revisions

```text
POST   /api/time-action/items/{id}/request-revision/
POST   /api/time-action/revisions/{id}/approve/
POST   /api/time-action/revisions/{id}/reject/
```

### 19.5 Alerts

```text
GET    /api/time-action/alerts/
POST   /api/time-action/alerts/{id}/acknowledge/
POST   /api/time-action/alerts/{id}/resolve/
POST   /api/time-action/alerts/{id}/escalate/
```

### 19.6 Source Events

```text
POST   /api/time-action/source-events/
GET    /api/time-action/source-events/
GET    /api/time-action/source-events/{id}/
POST   /api/time-action/source-events/{id}/reprocess/
```

---

## 20. UI Surface Plan

The UI should be operational and dense. It should not look like a project-management product bolted onto the planner.

### 20.1 Order T&A Tab

Add an order-level T&A view.

Primary sections:

- Header with order, customer, style, PCD, FKD, ship date, planning zone, and health.
- Critical blockers strip.
- Milestone timeline.
- Action item table.
- Dependency drawer.
- Revision history drawer.
- Source event panel.

Table columns:

- Action.
- Owner.
- Status.
- Health.
- Baseline date.
- Current target.
- Actual date.
- Blocks.
- Source.
- Alert.
- Action command.

### 20.2 T&A Worklist

Role-based user worklist.

Filters:

- My role.
- My assigned actions.
- Ready actions.
- Due today.
- Due this week.
- Overdue.
- FKD blockers.
- PCD blockers.
- Release blockers.
- Buyer.
- Customer.
- Factory.

Purpose:

- Replace the need for a ticket inbox.
- Show only actions that can be worked on or require attention.

### 20.3 T&A Calendar / Timeline

Calendar view by:

- Order.
- Buyer.
- Customer.
- Owner role.
- Department.
- Critical milestone.

Views:

- Week view.
- Month view.
- Milestone timeline.
- Critical path list.

### 20.4 T&A Template Master

Admin/master UI for:

- Template list.
- Template detail.
- Action item rows.
- Dependencies.
- Closure requirements.
- Criticality flags.
- Approval workflow.
- Clone version.

This should follow master-data patterns and be controlled by authorized users.

### 20.5 Alert Center

Lightweight alert center.

It should show:

- Open alerts.
- Severity.
- Order.
- Action.
- Owner.
- Due date.
- Impact.
- Suggested action.
- Acknowledge/resolve.

It should not become a ticket board.

### 20.6 PCD Readiness Enhancement

Add T&A context to PCD readiness:

- Show whether a PCD item is manually updated, T&A-derived, or external-source derived.
- Show linked T&A action.
- Show blocker reason.
- Show stale source event warning where relevant.

Do not replace the existing PCD release flow.

---

## 21. Notification And Alert Logic

The notification engine should be rule-driven and event-driven.

### 21.1 Alert Triggers

Generate alerts when:

- An action becomes ready after all blocking predecessors complete.
- An action is due within configured threshold.
- An action becomes overdue.
- A critical FKD/PCD/release action becomes overdue.
- A closure requirement is missing at completion attempt.
- An external event expected by a target date is stale.
- An external event conflicts with current T&A state.
- A date revision is requested.
- A date revision is approved or rejected.
- An order enters firm zone with open critical actions.
- An order enters frozen zone with unresolved mandatory actions.

### 21.2 Alert Priority

Priority should consider:

- SLA breach.
- Buffer penetration.
- Criticality to FKD, PCD, release, or shipment.
- Planning zone.
- Downstream capacity impact.
- Customer/buyer priority where configured.
- Whether the action blocks production release.

### 21.3 Alert Deduplication

Use a deduplication key, for example:

```text
order_id + action_item_id + alert_type + target_date
```

Avoid generating a new alert every time the recalculation job runs.

### 21.4 Notification Channels

Initial channels:

- In-app alert list.
- Role-based worklist count.
- Optional email digest later.

Avoid mobile push or WhatsApp integration until the basic T&A behavior is stable.

---

## 22. Data Governance

### 22.1 Baseline Locking

Baseline dates should be locked when:

- Order is confirmed.
- T&A plan is approved.
- Order enters firm zone.
- Production release is created.

The exact lock point can be configured by order type and buyer.

### 22.2 Date Revision

Date revision should require:

- Revised date.
- Reason code.
- Free-text note where required.
- Impact preview for critical actions.
- Approval when inside firm or frozen zones.

Reason code examples:

- Buyer approval delay.
- Fabric delay.
- Trim delay.
- Lab dip delay.
- Wash development delay.
- Sample rejection.
- Fit rejection.
- Datatex data correction.
- Capacity change.
- Customer date change.
- Internal handoff delay.

### 22.3 Waiver

Waiver should be allowed only when:

- Action is not mandatory, or
- Conditional release policy allows it, or
- Authorized role approves it with reason and expiry.

Waiver should not delete the action. It should preserve the audit trail.

---

## 23. Relationship With Existing Apps

| Existing app | T&A relationship |
|---|---|
| `orders` | T&A plan belongs to an order. Current `OrderMilestone` may become summary milestones or be superseded by T&A-derived milestone views. |
| `pcd_readiness` | T&A feeds readiness items and blockers. PCD remains release gate. |
| `planning` | Planning zone controls T&A lock and revision rules. |
| `production_release` | Release validation consumes PCD readiness and critical T&A blockers. |
| `boundary_cases` | Critical T&A misses can create exception events. Routine actions stay in T&A. |
| `materials_procurement` | Material readiness events can feed T&A actions. |
| `fabric_qc` | Fabric inspection and shrinkage events can complete T&A actions. |
| `style_technical` | BOM, operation bulletin, and wash route approval can satisfy technical T&A actions. |
| `cutting` | Cutting release and actual cutting start can update execution-side T&A milestones. |
| `sewing` | Sewing line loading and output can update sewing start/end milestones where appropriate. |
| `wip_inventory` | Later can feed sewn waiting wash and laundry readiness milestones. |
| `audit_governance` | Every generated plan, completion, revision, waiver, and escalation should write business-readable audit. |

---

## 24. Implementation Phases

### Phase TNA-0: Blueprint Finalization

Goal:

Confirm the T&A operating design before code build.

Activities:

- Confirm whether the module is called T&A, TNA, or Time Action in UI.
- Confirm milestone taxonomy.
- Confirm FKD definition.
- Confirm PCD-critical actions.
- Confirm buyer/customer template variations.
- Confirm Datatex data availability.
- Confirm which actions are manual versus external.
- Confirm approval roles for firm-zone date revisions.

Deliverables:

- T&A milestone catalog.
- Template selection matrix.
- PCD mapping table.
- Criticality matrix.
- Datatex event mapping.
- Role ownership matrix.

### Phase TNA-1: Backend Foundation

Goal:

Build the base T&A data model and template generation engine.

Build:

- `time_action` Django app.
- Template models.
- Order plan models.
- Action item models.
- Dependency models.
- Closure requirement models.
- Admin registration.
- Initial seed command.
- Unit tests for model constraints.

Acceptance:

- Approved template can be created.
- Order T&A plan can be generated.
- Baseline dates are calculated from anchors.
- Dependencies are copied from template to order plan.
- Audit event is written.

### Phase TNA-2: Dependency And Status Engine

Goal:

Make T&A operational, not a passive list.

Build:

- Dependency readiness calculation.
- Status recalculation.
- Health calculation.
- Blocking successor detection.
- Critical path indicator.
- Plan-level completion and health.

Acceptance:

- Successor does not become ready until predecessor completes.
- Date-triggered action becomes ready on expected date.
- Overdue item becomes red or black based on criticality.
- Completion recalculates downstream readiness.

### Phase TNA-3: Action Capture And Closure Rules

Goal:

Allow users to complete actions without building a ticketing system.

Build:

- Start action endpoint.
- Complete action endpoint.
- Block action endpoint.
- Waive action endpoint.
- Closure requirement validation.
- Evidence URL capture.
- Delay reason capture.

Acceptance:

- User cannot complete action without mandatory closure data.
- Completion records actual date.
- Completion updates dependent items.
- Waiver requires reason and role permission.

### Phase TNA-4: Alerts And Worklist

Goal:

Make T&A actionable through alerts and role worklists.

Build:

- Alert model.
- Alert generation service.
- Deduplication rules.
- My actions API.
- Open alerts API.
- Alert acknowledge/resolve endpoints.
- Scheduled recalculation command.

Acceptance:

- Action-ready alert appears when predecessors are complete.
- Due-soon alert appears by threshold.
- Overdue alert appears after target date.
- Critical overdue alert can escalate to boundary case.
- Duplicate alerts are not created on repeated recalculation.

### Phase TNA-5: PCD And FKD Integration

Goal:

Connect T&A to release readiness.

Build:

- T&A to PCD mapping.
- Completion-to-PCD update service.
- T&A blocker feed into PCD readiness.
- FKD health calculation.
- PCD readiness UI additions for linked T&A context.

Acceptance:

- Completed mapped T&A item can satisfy PCD item.
- Late mandatory T&A item can make PCD blocked.
- FKD risk shows blocking action.
- Release validation sees unresolved critical T&A blockers through PCD readiness.

### Phase TNA-6: Planning Zone Governance

Goal:

Enforce date governance based on horizon zone.

Build:

- Zone-aware baseline lock.
- Date revision request.
- Date revision approval.
- Impact preview for critical revisions.
- Audit trail.

Acceptance:

- Volatile-zone date revision requires reason.
- Firm-zone critical date revision requires approval.
- Frozen-zone revision routes through exception governance.
- Baseline date remains unchanged.

### Phase TNA-7: External Event Integration

Goal:

Allow Datatex and other systems to feed T&A without duplicate entry.

Build:

- Source event ingest API.
- Source mapping service.
- Accepted/rejected event status.
- Staleness detection.
- Conflict detection.
- Reprocess endpoint.

Acceptance:

- Datatex-like event can complete mapped action.
- Conflicting event is rejected or flagged.
- Stale expected event creates alert.
- Source reference is visible in T&A UI.

### Phase TNA-8: UI Implementation

Goal:

Give operating users a practical surface.

Build:

- Order T&A tab.
- T&A worklist.
- T&A calendar/timeline.
- Template master.
- Alert center.
- PCD readiness T&A linkage.

Acceptance:

- User can see all actions for an order.
- User can filter ready, due, overdue, blocker actions.
- User can complete an action with required evidence.
- Planner can see FKD/PCD blockers.
- Admin can clone and approve a template.

### Phase TNA-9: Due-Date Quotation And Wash Readiness Extension

Goal:

Use T&A readiness in due-date promising and future wash routing.

Build:

- Earliest readiness date service.
- Readiness confidence score.
- Wash readiness action set.
- Link to wash route when available.
- Due-date quotation integration.

Acceptance:

- Due-date quotation uses T&A readiness instead of raw planned PCD only.
- Quote warns when approval or wash readiness is uncertain.
- Wash-heavy order has wash approval and wash capacity actions in T&A.

---

## 25. Seed Data Plan

Initial seed templates should include at least:

### 25.1 Basic Garment Order Template

Actions:

- Order confirmation.
- BOM freeze.
- Fabric PO creation.
- Trims PO creation.
- Fabric receipt.
- Fabric QC passed.
- PP sample approved.
- Full kit date.
- PCD.
- Cutting release.
- Sewing start.
- Sewing end.
- Packing complete.
- Shipment readiness.

### 25.2 Denim Wash Order Template

Additional actions:

- Wash development required.
- Wash sample submission.
- Wash standard approval.
- Recipe freeze.
- Shade band approval.
- Chemical availability.
- Wash capacity booking.
- Laundry in.
- Laundry out.
- Wash QC pass.

### 25.3 Repeat Order Template

Reduced actions:

- Reuse approved technical file.
- Confirm fabric availability.
- Confirm trims.
- Confirm wash standard still valid.
- Confirm line allocation.
- Confirm PCD.
- Production release.

Seed scenarios:

- Fully on-track order.
- FKD risk order.
- PCD blocked by wash approval.
- PCD blocked by fabric QC.
- Firm-zone date revision request.
- External Datatex event completion.
- Stale external event.

---

## 26. Testing Strategy

### 26.1 Backend Unit Tests

Test:

- Template creation constraints.
- Plan generation from template.
- Date calculation from anchors.
- Dependency readiness.
- Closure requirement validation.
- Status recalculation.
- Alert deduplication.
- PCD mapping update.
- Revision governance by zone.
- Source event ingestion.

### 26.2 Service Tests

Scenarios:

- Order created, T&A generated, all items pending/not ready.
- Predecessor completed, successor becomes ready.
- Action due soon generates alert.
- Overdue PCD-critical action becomes black.
- Completion of wash approval updates PCD readiness.
- Firm-zone date change requires approval.
- Stale external event creates risk alert.
- Critical blocker escalates to boundary case only once.

### 26.3 API Tests

Test:

- Endpoint envelope consistency.
- Permission enforcement.
- Complete action with missing closure data fails.
- Complete action with required closure data succeeds.
- Revision request/approval flow.
- Source event idempotency.

### 26.4 Frontend Tests

Test:

- Order T&A tab renders key landmarks.
- Worklist filters ready/due/overdue actions.
- Completion drawer enforces required fields.
- Alert center shows deduplicated alerts.
- Template master displays actions and dependencies.
- PCD readiness shows linked T&A blocker.

### 26.5 End-to-End Tests

End-to-end scenario:

1. Seed order with denim wash template.
2. Generate T&A plan.
3. Complete fabric PO.
4. Complete fabric receipt.
5. Complete fabric QC.
6. Leave wash approval incomplete.
7. Verify PCD remains blocked by wash approval.
8. Complete wash approval with required evidence.
9. Verify PCD readiness updates.
10. Release to cutting remains governed by existing release validation.

---

## 27. Reporting And Dashboards

T&A should feed operational reports:

- FKD adherence.
- PCD adherence.
- Baseline versus revised date movement.
- Open critical blockers.
- Overdue actions by department.
- Delay reason Pareto.
- Buyer/customer delay profile.
- Wash approval delay profile.
- External event staleness.
- Firm-zone readiness risk.
- Daily Flow Meeting priority list.

Key principle:

Reports should show whether the factory is genuinely improving or merely revising dates.

---

## 28. Blueprint Questions Before Build

The following questions should be answered before implementation starts:

1. What is the official name in Eratex language: T&A, TNA, Time Action, or Time and Action Calendar?
2. Which Datatex entities and APIs are available for order, PO, material, approval, and shipment data?
3. Which events are already reliably captured in Datatex?
4. Which events require planning-tool-owned capture?
5. What is the precise FKD definition used by Eratex?
6. Which T&A actions are mandatory for FKD?
7. Which T&A actions are mandatory for PCD?
8. Which T&A actions must block release to cutting?
9. Which actions affect sewing line loading?
10. Which wash-related actions are mandatory for denim and garment-dyed products?
11. What are the buyer-specific T&A template variants?
12. What are the standard offsets and buffers for each template?
13. Which roles own each action?
14. Which roles can revise dates?
15. Which roles can approve firm-zone revisions?
16. What delay reason code list should be used?
17. What alerts should be daily digest versus immediate in-app alerts?
18. Should source-event staleness block release or only warn?
19. Should T&A completion automatically update PCD item status, or should it propose updates for confirmation?
20. How should historic revised FKD/PCD behavior be migrated or interpreted?

---

## 29. Recommended First Release Scope

The first release should be deliberately tight:

- Build T&A template and order plan generation.
- Support dependencies.
- Support action completion with closure requirements.
- Support alerts for ready, due soon, overdue, and critical blocker.
- Integrate with PCD readiness for mapped items.
- Support firm-zone revision request and approval for critical dates.
- Provide order T&A tab and role worklist.
- Seed denim wash and basic garment templates.

Do not build full ticket management.

This release would already solve the key problem:

The factory can see which actions must happen to protect FKD, PCD, release, sewing start, laundry readiness, and shipment, and the right teams are alerted when dependent actions become ready or risky.

---

## 30. Recommended Build Order

Recommended implementation sequence:

1. Create `time_action` backend app and models.
2. Add admin and seed command for templates.
3. Build plan generation service.
4. Build dependency/status engine.
5. Build action completion and closure validation.
6. Build alert generation and worklist API.
7. Build PCD mapping integration.
8. Build zone-governed revision flow.
9. Build order T&A frontend tab.
10. Build role worklist.
11. Build template master.
12. Build alert center.
13. Add external event ingestion.
14. Add due-date quotation readiness integration.
15. Extend wash-specific readiness once wash route planning is implemented.

---

## 31. Architectural Decision Summary

| Decision | Recommendation |
|---|---|
| Primary feature type | Pure T&A additive feature. |
| Primary object | Order T&A plan and action items. |
| Ticketing | Avoid as primary pattern. |
| Dependencies | First-class model. |
| Alerts | First-class lightweight model. |
| PCD readiness | Keep as gate, feed from T&A. |
| Boundary cases | Use only for material exceptions. |
| Datatex | Canonical transaction feed, not replaced. |
| Wash | Model readiness actions now, integrate execution later. |
| Due-date quotation | Consume T&A readiness confidence. |
| Planning zones | Govern baseline lock and revisions. |

---

## 32. Final Assessment

The current repo has enough foundation to absorb T&A cleanly, but it does not yet have the feature.

The most reusable existing pieces are:

- `ProductionOrder`.
- `OrderMilestone` as a possible summary or migration source.
- `PCDReadiness` and `PCDReadinessItem`.
- `PlanningZoneConfiguration`.
- `BoundaryCaseEvent`.
- `audit_governance`.
- Technical master data and wash-route foundations.

The missing core is a dependency-aware T&A layer.

The right implementation is not a TMS clone. It is a smarter T&A calendar that acts like an operating control layer:

- It generates the calendar.
- It knows dependencies.
- It tells owners when work is ready.
- It protects baseline dates.
- It governs revisions.
- It feeds PCD and FKD health.
- It escalates only true exceptions.
- It strengthens due-date promising and production release confidence.

This is the most pragmatic way to inherit the value of the TMS concept without importing ticketing overhead into the planning platform.
