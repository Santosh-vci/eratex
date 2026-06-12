# Eratex Due-Date Quotation Capability Evaluation

**Purpose:** Evaluate whether the current repo can predict or quote a future due date from current sewing and laundry load, and define the missing module and UI needed to make that capability reliable.  
**Date:** 2026-06-11  
**Scope:** Current implementation through EOS-05, with attention to sewing handoff and the future wash/finishing path.  

---

## 1. Direct Verdict

The current codebase does **not** achieve reliable future due-date quotation.

It can:

- Store planned and committed shipment dates on an order.
- Manually place a PCD-ready order into a workcenter/date bucket.
- Calculate load minutes for that manually chosen placement.
- Preview whether the manually chosen workcenter/date becomes overloaded.
- Show workcenter load, queue risk, production release readiness, and sewing line loading fit.
- Capture sewing output and move net-good output to `SEWN_WAITING_WASH`.

It cannot:

- Take a new order/enquiry and search forward through available capacity to propose a feasible delivery date.
- Predict an earliest sewing completion or sewn handoff date from current order load.
- Reserve finite future capacity in a date/line/resource ledger.
- Sequence the order across cutting, sewing, wash, finishing, packing, and shipment.
- Model wash and finishing as executable downstream constraints.
- Recalculate a promised date from live output shortfall, absenteeism, rework, machine breakdown, rewash, or WIP aging.
- Produce a confidence-rated delivery promise with alternatives and explainable blockers.

Even if the target is narrowed to **sewing handoff only**, the current codebase is not yet reliable enough to quote a future due date. It has useful primitives, but no capable-to-promise/date-promising engine.

---

## 2. Where The Capability Exists In Business Context

The due-quotation capability is under-expressed in the main business specification and build plan, but it is visible in research and deck context.

The pre-blueprinting research names this explicitly:

- Capacity-constrained due quotation.
- Quote or recommend feasible delivery week/date based on real load and constraints.
- Datatex remains the canonical order feed.
- The planning tool should use current operational load and constraints to support quotation, zone governance, release control, laundry scheduling, and dashboards.

The extracted presentation context also contains the concept:

- Ex-factory quotation process aligned with plant reality.
- System-suggested delivery week quotation.
- System suggests the best possible delivery date considering prevailing load across critical resources.
- Final committed due date is derived from production completion plus laundry, finishing, and buffer logic.

This means the capability is not an optional reporting feature. It is one of the highest-value planning promises: "Can we take this order, and if yes, when can we realistically promise it?"

---

## 3. Current Codebase Capability Map

### 3.1 Order Date Storage

Relevant implementation:

- `backend/apps/orders/models.py`

`ProductionOrder` stores:

- `planned_ship_date`
- `committed_ship_date`
- `planned_pcd_date`
- `current_stage`
- `lifecycle_status`
- `risk_status`

Assessment:

- This stores the date that has already been planned or committed.
- It does not calculate or recommend the date.
- There is no quote object, quotation scenario, promise confidence, or accepted/rejected delivery promise workflow.

### 3.2 Weekly Planning And Manual Placement

Relevant implementation:

- `backend/apps/planning/models.py`
- `backend/apps/planning/services/planning.py`
- `backend/apps/planning/api.py`
- `frontend/src/features/operations/Eos04Pages.tsx`

Current behavior:

- `PlanVersion` represents a plan for a horizon.
- `PlannedWorkItem` represents an order assigned to a workcenter and planned date range.
- `assign_work_item` accepts an order, workcenter, planned quantity, planned start, and planned end.
- `_calculate_order_load_minutes` computes load as `quantity * operation bulletin total_smv`.
- `calculate_plan_impact` shows before/after utilization for the selected date range.
- The weekly planning UI lets the user place an order in a day/workcenter context and preview the impact.

Assessment:

- This is a **date validation and impact preview** capability.
- It is not a **date-finding** capability.
- The user or external plan must choose the date first.
- The system then says whether that placement is acceptable or risky.

### 3.3 Workcenter Load Visibility

Relevant implementation:

- `backend/apps/workcenters/services/load.py`
- `backend/apps/workcenters/services/capacity.py`
- `backend/apps/workcenters/models.py`

Current behavior:

- `WorkcenterCapacityDay` stores available minutes by workcenter/date.
- `CapacityAdjustment` can add or reduce available capacity.
- `calculate_load` sums available minutes and planned load minutes over a date range.
- It returns utilization, queue quantity, risk status, constraint status, and suggested action.
- `WorkcenterCapacityDefinition` supports capacity units such as SMV minutes, batch minutes, machine hours, and pieces per day.

Assessment:

- This is a good base for load visibility.
- It is not yet a finite-capacity allocation ledger.
- It does not allocate an order's load day-by-day or line-by-line.
- It does not search for the earliest feasible slot.
- It does not create soft/hard reservations for quoted capacity.

Important precision gap:

- `PlannedWorkItem` has a start and end date plus one `load_minutes` value.
- `calculate_load` includes the whole `load_minutes` value if the item overlaps the queried date range.
- That is acceptable for coarse horizon load views, but not reliable for due-date prediction.
- A date-promising engine needs daily/shift/line allocation buckets so partial load is consumed on the correct dates.

### 3.4 Sewing Line Loading

Relevant implementation:

- `backend/apps/sewing/services/line_loading.py`
- `backend/apps/sewing/models.py`
- `backend/apps/sewing/services/line_loading_board.py`

Current behavior:

- `preview_line_loading` validates the operation bulletin and line fit.
- It calculates line available minutes from current manpower, shift calendar, and baseline efficiency.
- It calculates `target_output_per_day = available_minutes / total_smv`.
- It checks machine gaps and skill gaps.
- `SewingLineLoading` stores planned quantity, target output per day, target efficiency, expected defect rate, planning zone, line, and status.
- The sewing output service captures gross, defect, rework, and net-good output.
- Net-good output updates WIP to `SEWN_WAITING_WASH`.

Assessment:

- This is the strongest current primitive for sewing handoff projection.
- But it is not wired into a date-promise engine.
- It does not search across alternative lines.
- It does not calculate an earliest completion date across multiple days.
- It does not subtract already loaded work from the same line/day.
- It does not update a projected completion date from live output.

At best, a rough internal estimate could be derived after a line is selected:

```text
rough sewing days = remaining quantity / target output per day
rough sewn handoff date = planned start date + rough sewing days
```

But this is not implemented as a backend service or UI promise, and it would still be unreliable without a capacity allocation ledger and live actual-output recalculation.

### 3.5 Boundary Cases And Shipment Pull-In

Relevant implementation:

- `backend/apps/boundary_cases/services/preview.py`

Current behavior:

- A shipment pull-in preview checks whether the new requested shipment date is earlier than the committed ship date.
- It reviews existing planned work items for the order.
- It calculates capacity gaps for those already-planned workcenter placements.

Assessment:

- This is a risk preview for a date change.
- It is not a quote generator.
- It cannot answer "what is the earliest feasible date?"
- It only evaluates the known plan rows already attached to the order.

### 3.6 External Plan Validation

Relevant implementation:

- `backend/apps/external_plans/services/validation.py`

Current behavior:

- Imports rows from FastReact or external plans.
- Validates order, workcenter, PCD readiness, frozen-zone conflicts, and capacity overload for the imported planned date.
- Can create a draft plan from valid rows.

Assessment:

- This validates external dates.
- It does not generate dates.
- It does not become committed schedule truth directly, which aligns with the repo rulebook.

### 3.7 Wash And Finishing

Relevant current state:

- Wash route metadata exists in `style_technical`.
- Sewing output can create `SEWN_WAITING_WASH` WIP.
- `/wash/planning` is currently a placeholder page.
- There is no dedicated `washing` backend app.
- There is no finishing execution workflow.
- Shipment readiness route is a placeholder.

Assessment:

- Full due-date quotation to shipment cannot be achieved because wash and finishing are not executable constraints yet.
- Even a sewing-only promise must clearly state that it stops at sewn handoff, not ex-factory readiness.

---

## 4. Capability Verdict By Target

| Target capability | Achieved today? | Evaluation |
|---|---:|---|
| Validate a manually selected workcenter/date | Partially yes | `calculate_plan_impact` and `calculate_load` can show whether a chosen placement overloads capacity. |
| Quote future delivery date for a new enquiry/order | No | No quote model, no forward-search scheduler, no capacity reservation, no date-promise UI. |
| Predict sewing handoff date from current load | No, not reliably | Sewing target output exists, but no line/date allocation search or ETA service. |
| Predict wash completion | No | Wash execution and batch planning are not implemented. |
| Predict finishing completion | No | Finishing execution and capacity model are not implemented beyond workcenter definitions/seeds. |
| Predict final ex-factory/shipment readiness | No | Packing, documentation, final QC, shipment readiness are not implemented as executable constraints. |
| Recalculate promise from actual output | No | Sewing output is captured, but no promise recalculation service consumes it. |
| Evaluate pull-in feasibility | Partially | Shipment pull-in preview checks capacity gaps on existing planned work items, not earliest feasible date. |

---

## 5. Can The Current Code Predict A Reliable Future Due Date Up To Sewing Handoff?

Short answer: **No.**

Longer answer: it can support a rough manual approximation, but not a reliable system-generated quotation.

### 5.1 What It Can Use

The current code has enough data to start a sewing-only projection:

- Order quantity.
- Committed ship date and planned PCD date.
- Approved operation bulletin and total SMV.
- Workcenter capacity days.
- Line profile: current manpower, shift calendar, baseline efficiency.
- Sewing line loading target output per day.
- Sewing output actuals and net-good quantity.
- WIP stage `SEWN_WAITING_WASH`.

### 5.2 Why It Is Still Not Reliable

Reliability fails because the system lacks:

- Forward-search across future dates.
- Alternative line selection.
- Line-level capacity consumption by day/shift.
- Capacity reservation ledger.
- Partial load allocation across multiple days.
- Remaining quantity calculation tied to active line loadings and output.
- Calendar-aware earliest start after PCD/material/fabric readiness.
- Sequence-aware cutting-to-sewing handoff.
- Learning curve and style changeover assumptions.
- Real-time adjustment for absenteeism, downtime, quality loss, and rework.
- Wash/finishing downstream visibility, if the promise is meant to be customer-facing.

### 5.3 The Narrowest Possible Reliable Claim

The current system can answer:

```text
"If I place this order quantity on this workcenter/date, what is the load impact?"
```

It cannot answer:

```text
"Given current load and constraints, what is the earliest reliable date I can promise?"
```

That distinction is critical.

---

## 6. Missing Backend Module

The missing capability should be implemented as a distinct **Delivery Promise / Due-Date Quotation** module. A practical app name could be:

- `delivery_promising`
- `date_promising`
- `capacity_quotation`

Recommended name: `delivery_promising`, because it can later cover sewing handoff, wash completion, finishing completion, and shipment readiness without sounding like only a costing function.

### 6.1 Module Purpose

The module should provide capable-to-promise logic:

```text
order/enquiry demand
-> technical readiness and route assumptions
-> current committed load
-> available capacity by workcenter/line/date
-> forward finite-capacity search
-> candidate completion dates
-> risk/confidence explanation
-> quote acceptance or rejection
-> optional draft plan/reservation
```

### 6.2 Core Data Models

#### DeliveryPromiseRequest

Captures the demand to be quoted.

Fields:

- Request number.
- Source: enquiry, confirmed order, order change, pull-in, planner simulation.
- Order, if confirmed.
- Customer, buyer, style, product type.
- Quantity.
- Target delivery/shipment date, if provided.
- Earliest material/PCD readiness date.
- Required quote scope: sewing handoff, wash completion, finishing completion, shipment readiness.
- Requested by.
- Status.

#### DeliveryPromiseScenario

Represents one calculation run.

Fields:

- Request.
- Scenario type: baseline, overtime, alternate line, split line, outsource, priority pull.
- Planning horizon.
- Assumptions JSON.
- Result status: feasible, feasible with risk, infeasible, data incomplete.
- Recommended promise date.
- Confidence level.
- Explanation.

#### DeliveryPromiseStage

Stores the stage-by-stage calculation.

Fields:

- Scenario.
- Stage: PCD, cutting, sewing, sewn handoff, wash, finishing, packing, shipment.
- Workcenter/resource.
- Required load minutes or quantity.
- Earliest start.
- Planned start.
- Planned end.
- Bottleneck reason.
- Risk status.

#### CapacityAllocationBucket

This is the most important support model. It may live under `planning` or `workcenters`, but the due-date module needs it.

Fields:

- Workcenter.
- Line or machine, optional.
- Capacity date.
- Shift.
- Available minutes.
- Committed minutes.
- Reserved quote minutes.
- Free minutes.
- Source plan/version.
- Lock status.

Purpose:

- Convert coarse workcenter load into finite daily/shift allocation.
- Prevent a multi-day work item from being counted incorrectly.
- Allow quotations to be soft-reserved without becoming committed production plans.

#### DeliveryPromiseAlternative

Stores alternative dates and recovery levers.

Examples:

- Baseline earliest date.
- With overtime.
- With alternate line.
- With split-line loading.
- With delayed PCD.
- With wash bottleneck excluded.
- With wash bottleneck included.

#### DeliveryPromiseDecision

Captures business decision.

Fields:

- Scenario accepted/rejected.
- Accepted promised date.
- Accepted scope.
- Whether capacity was reserved.
- Whether draft plan was generated.
- Approver.
- Reason.

### 6.3 Core Services

#### `quote_delivery_date`

Main orchestration service.

Responsibilities:

- Validate request data.
- Resolve style technical data.
- Resolve routing assumptions.
- Build current capacity ledger.
- Search for feasible dates.
- Return recommended date, alternatives, risk, and blockers.

#### `quote_sewing_handoff`

MVP service for the narrowed scope.

Responsibilities:

- Calculate required sewing minutes from approved operation bulletin.
- Determine earliest possible sewing start from PCD/material/cutting readiness.
- Search available line/workcenter capacity day by day.
- Optionally test alternate lines.
- Return earliest sewn handoff date.

#### `find_earliest_capacity_slot`

Low-level finite capacity search.

Responsibilities:

- Walk calendar days/shifts.
- Skip holidays and zero-capacity days.
- Subtract committed planned load and approved capacity losses.
- Include soft reservations if configured.
- Allocate remaining load across dates.
- Return allocation buckets and completion date.

#### `score_promise_confidence`

Rules:

- High confidence when technical master, PCD readiness, capacity days, line profiles, current plan, and actual output are complete and recent.
- Medium confidence when some actuals are stale or only workcenter-level capacity is available.
- Low confidence when wash/finishing is excluded from a customer-facing promise, master data is incomplete, or current load is not trusted.

#### `accept_delivery_promise`

Responsibilities:

- Accept one scenario.
- Optionally reserve capacity.
- Optionally create a draft plan version or planned work items.
- Write audit events.

### 6.4 APIs

Recommended endpoints:

- `POST /api/v1/delivery-promises/quote`
- `GET /api/v1/delivery-promises/{requestId}`
- `POST /api/v1/delivery-promises/{scenarioId}/accept`
- `POST /api/v1/delivery-promises/{scenarioId}/reserve-capacity`
- `POST /api/v1/delivery-promises/{scenarioId}/create-draft-plan`
- `GET /api/v1/delivery-promises/capacity-calendar`
- `GET /api/v1/orders/{orderId}/promise-status`

### 6.5 Audit Events

Suggested events:

- `DELIVERY_PROMISE_REQUESTED`
- `DELIVERY_PROMISE_SCENARIO_CALCULATED`
- `DELIVERY_PROMISE_INFEASIBLE`
- `DELIVERY_PROMISE_ACCEPTED`
- `DELIVERY_PROMISE_CAPACITY_RESERVED`
- `DELIVERY_PROMISE_DRAFT_PLAN_CREATED`
- `DELIVERY_PROMISE_RELEASED`
- `DELIVERY_PROMISE_RECALCULATED`

---

## 7. Required UI

Yes, this capability needs a specific UI.

The existing weekly planning UI cannot carry this fully because it starts after the planner already has dates. The due-quotation UI must start before the date is known.

### 7.1 Primary UI: Due Date Quotation Workbench

Suggested route:

- `/delivery-promising/quote`

Alternative route if aligned to the prototype:

- `/enquiry/costing`

The repo already has a prototype source:

- `docs/frontend_ui/enquiry_costing_dashboard`

That prototype includes:

- Enquiry detail.
- Costing estimate.
- Promise date risk.
- Generate quote action.

It is the closest UI source for the due-date quotation surface. The implementation should focus first on delivery promise rather than full costing.

### 7.2 UI Inputs

Minimum fields:

- Customer.
- Buyer.
- Style or reference style.
- Product type.
- Quantity.
- Color/wash code, if known.
- Target delivery/shipment date.
- Earliest material/PCD readiness date.
- Quote scope:
  - Sewing handoff only.
  - Wash completion.
  - Finishing completion.
  - Shipment readiness.
- Allow alternatives:
  - Overtime.
  - Alternate line.
  - Split line.
  - Priority pull.
  - Exclude/infer wash.

### 7.3 UI Output

The result must be explainable:

- Recommended promise date.
- Promise scope.
- Confidence level.
- Earliest start.
- Stage completion dates.
- Capacity consumed by stage.
- Bottleneck workcenter/line/machine.
- Overloaded dates.
- Missing data blockers.
- Alternatives with date and operational cost/risk.
- Option to accept, reserve capacity, or create draft plan.

### 7.4 Supporting UI Locations

The promise result should also appear in:

- Order lifecycle detail.
- Weekly planning workbench.
- Workcenter load monitor.
- Boundary-case and shipment pull-in preview.
- Management dashboard once analytics mature.

---

## 8. MVP: Sewing Handoff Quotation

The first practical slice should stop at sewn handoff.

### 8.1 Why Start There

Reasons:

- Sewing is the strongest implemented production area.
- Operation bulletin and line loading already exist.
- Net-good output already moves to `SEWN_WAITING_WASH`.
- Wash and finishing are not yet executable enough for customer-facing due date prediction.

### 8.2 MVP Inputs

- Confirmed order or quotation request.
- Quantity.
- Product type and style.
- Approved operation bulletin with total SMV.
- Eligible sewing lines.
- Line profile and shift calendar.
- Current workcenter/line load.
- Capacity days and capacity adjustments.
- PCD/material readiness date.
- Existing production releases and line loadings.
- Actual sewing output for partially produced orders.

### 8.3 MVP Output

- Earliest feasible sewing start date.
- Earliest feasible sewn handoff date.
- Suggested line or workcenter.
- Daily allocation.
- Capacity utilization by day.
- Risk/confidence.
- Missing data.
- Draft planned work item or reservation option.

### 8.4 MVP Limitations To Display Clearly

The UI must label the result as:

```text
Projected sewn handoff date, not final shipment date.
```

It should show downstream exclusions:

- Wash not included unless wash planning module is active.
- Finishing not included unless finishing capacity model is active.
- Packing/shipment not included unless shipment readiness module is active.

---

## 9. Mature Scope: Full Ex-Factory Promise

A full customer-facing promise needs the complete chain:

```text
enquiry/order
-> PCD/material readiness
-> cutting
-> sewing
-> sewn waiting wash
-> wash route/batch execution
-> post-wash QC
-> finishing
-> packing
-> final QC/buyer inspection
-> documents/forwarder
-> shipment readiness
```

The current repo does not yet have executable wash, finishing, packing, or shipment modules. These must be built or integrated before final ex-factory promise can be reliable.

### 9.1 Wash Dependency

The wash-heavy architecture should provide:

- Wash demand.
- Route and recipe.
- Machine compatibility.
- Batch planning.
- Wet/dry process capacity.
- Dryer/hydro/QC constraints.
- Rewash probability and actual rewash.
- Release to finishing.

### 9.2 Finishing Dependency

A finishing module should provide:

- Finishing workcenter capacity.
- Finishing operation route.
- Ironing, trimming, measurement, final QC, tagging, packing readiness.
- Actual output and hold reasons.

### 9.3 Shipment Readiness Dependency

Shipment readiness should provide:

- Packed quantity.
- Final inspection status.
- AQL/buyer inspection.
- Carton count.
- Label/document readiness.
- Booking/forwarder status.
- Split shipment decision.

Without these, the system can only quote internal production milestones, not final delivery.

---

## 10. Data Reliability Requirements

For a due-date quote to be trusted, the system needs:

| Data area | Required condition |
|---|---|
| Order data | Canonical order/style/quantity/date from Datatex or confirmed local order. |
| Technical data | Approved operation bulletin, wash route, and route assumptions. |
| PCD/material | Earliest feasible production start date derived from readiness, not guessed. |
| Capacity | Calendar-backed capacity by line/workcenter/day/shift. |
| Current load | Committed load from active plans, external plans validated as draft, and active releases. |
| Actual output | Recent sewing output and WIP status. |
| Exceptions | Capacity loss, absenteeism, breakdown, QC failures, and rework applied to capacity. |
| Wash | Route, batch, machine compatibility, rewash reserve, and current queue. |
| Finishing/shipment | Finishing capacity and dispatch-readiness blockers. |

If these are incomplete, the system can still produce a quote, but the confidence must be lowered and missing assumptions must be visible.

---

## 11. Recommended Build Sequence

### DP-0 - Formalize Capability In Specs

Add the delivery promising capability explicitly to the business/build specification:

- Capacity-constrained due-date quotation.
- Sewing handoff promise.
- Full ex-factory promise as mature scope.
- Promise confidence and explainability.
- Integration with Datatex order feed.
- Link to FastReact/external plan validation as input, not committed truth.

### DP-1 - Capacity Allocation Ledger

Add finite capacity allocation by workcenter/line/date/shift:

- Available minutes.
- Committed minutes.
- Reserved quote minutes.
- Free minutes.
- Source plan/version.
- Lock status.

This is the core technical requirement. Without it, due-date quotation remains a rough load report.

### DP-2 - Sewing Handoff Quote Engine

Build backend service and API:

- `quote_sewing_handoff`
- `find_earliest_capacity_slot`
- `score_promise_confidence`
- `accept_delivery_promise`

Support only cutting/sewing assumptions and sewn handoff output in the first slice.

### DP-3 - Due Date Quotation UI

Implement the workbench using the existing `enquiry_costing_dashboard` prototype as the UI source, but limit the first release to delivery promise.

Required UI behavior:

- Enter quote request.
- Generate promise.
- Compare alternatives.
- See stage-by-stage load.
- See capacity calendar.
- Accept or reject quote.
- Create draft plan/reservation.

### DP-4 - Recalculate From Actuals

Integrate active sewing line loading and output:

- Remaining quantity.
- Net-good output rate.
- Efficiency trend.
- Defect/rework trend.
- Updated projected sewing handoff.
- Alert if accepted promise is at risk.

### DP-5 - Add Wash And Finishing To Promise Chain

After wash and finishing execution are built:

- Add wash route/batch capacity.
- Add rewash reserve and actual rewash.
- Add finishing capacity.
- Add shipment readiness buffers.
- Output full ex-factory promise.

### DP-6 - Mature Scenario Planning

Later-stage expansion:

- What-if with overtime, split line, alternate line, outsourcing, sequence changes.
- Cost/risk scoring by scenario.
- Promise hit-rate analytics.
- Buyer/style historical performance.
- Auto-escalation when accepted promise becomes unsafe.

---

## 12. Final Assessment

The repo has the foundations for capacity visibility and release governance, but it does not yet have due-date quotation.

The current implementation answers:

```text
Can this manually proposed placement fit without overloading a workcenter?
```

The required business capability is:

```text
Given current and expected load, what date can we safely promise?
```

Those are different capabilities.

For the narrowed target of sewing handoff, the codebase is close enough to build the first version because sewing line loading, SMV, line capacity, and net-good output already exist. But reliability requires a new delivery-promising module, a finite capacity allocation ledger, and a UI that starts from the quote request rather than from a manually selected planning date.

For full customer-facing ex-factory quotation, the codebase is not ready until wash, finishing, packing, and shipment readiness become executable or reliably integrated data domains.

