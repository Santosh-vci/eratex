# Eratex Wash Feature Implementation Evaluation and Architecture Plan

**Purpose:** Evaluate the current repo implementation against the Eratex business specification and research references, with a focused plan for a wash-heavy route planning and execution capability.  
**Primary local references:**  
- `docs/10_Wash_Planning_Execution_Specification_Eratex.md`
- `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`
- `docs/21_Phasewise_Backend_Build_Plan.md`
- `docs/22_Phasewise_Frontend_Build_Plan.md`
- `docs/02_Data_Model_Table_Schemas_Eratex.md`
- `docs/03_Master_Data_Specification_Eratex.md`
- `docs/research/Eratex_Laundry_Washes_Finishes_Process_Document.md`
- `docs/research/Eratex_Solution_Deck_Synthesis.md`
- `docs/research/Eratex_Solution_Deck_visible_slide_context.md`
- `docs/research/pre_blueprinting/01_scenario_tool_owned_factory_event_capture.md`
- `docs/research/pre_blueprinting/02_scenario_external_factory_event_consumption.md`

---

## 1. Executive Assessment

The current implementation has the first technical hooks for wash, but it does not yet implement the wash domain as Eratex appears to need it.

The repo currently supports:

- Approved wash route metadata as part of the technical/style foundation.
- Style-level default wash route assignment.
- Wash route steps with workcenter and machine type references.
- Readiness checks that prevent a style from being technically ready without an approved wash route.
- A sewing-to-wash WIP handoff stage: `SEWN_WAITING_WASH`.
- Workcenter capacity concepts that can represent wash resources at a high level.
- Boundary-case event types for rewash required and repeat wash exceeded.
- A placeholder wash planning frontend route.
- UI prototype references for wash planning and wash batch execution.

The repo does not yet support:

- Wash demand generation from sewn WIP.
- Wash batch creation.
- Dry-process and wet-process execution steps.
- Batch-wise machine assignment.
- Machine compatibility validation by wash type, recipe, buyer, or style.
- Recipe parameters such as temperature, time, pH, chemical family, load ratio, liquor ratio, drying time, laser file, ozone exposure, or PP/neutralization controls.
- Shade-lot aware wash batching.
- Post-wash QC, rewash, touch-up, or release to finishing.
- Wash WIP stages beyond sewn waiting wash.
- Daily laundry scheduling, board sequencing, or adherence capture.
- Wash route planning that reflects actual Eratex laundry complexity.
- Sustainability controls such as EIM reference, ZDHC/MRSL indicators, water/energy/chemical metrics, wastewater reuse relevance, or restricted-process governance.

The business specification already recognizes wash as a later-phase core production domain. The research document makes that case stronger. For Eratex, laundry is not a finishing note after sewing; it is a route-driven, batch-constrained, quality-gated, machine-constrained, and sustainability-sensitive production area. A sewing plan can appear feasible while laundry is overloaded or unsequenceable.

The recommended next move is to treat the wash build as an EOS-06 feature family, not as a small extension of the current Phase 5 implementation. The target architecture should be feature-agnostic: it should not hardcode "stone wash", "acid wash", "laser", or "Tonello" as special cases. Instead, it should model wash process types, effect families, recipe parameters, route steps, machine capabilities, QC gates, and repeat/rework rules as configurable data.

---

## 2. Current Phase Boundary

The current implemented boundary, based on the repository guidance, stops at EOS-05:

- Cutting execution bridge.
- Sewing line loading.
- Governed line realignment.
- Desktop/tablet sewing output capture.
- Minimal WIP movement from cutting through sewing-to-wash queue.

Within EOS-05, WIP is limited to execution lots and movements needed for cutting, sewing active work, and sewn waiting wash. Full wash execution, full WIP reconciliation, shipment workflow, analytics/control tower maturity, and multi-unit simulation are outside the current implementation boundary.

This means the wash feature should be planned as an extension and future build slice. Implementing the full wash domain directly in the current phase would cross the repo's operating boundary.

---

## 3. Current Implementation Snapshot

### 3.1 Backend Modules Present

| Area | Current repo state | Wash implication |
|---|---|---|
| `style_technical` | Contains `WashRoute` and `WashRouteStep`. | Wash route is treated as an approved technical master. |
| `style_technical.services.wash_routes` | Approves wash routes after validating route steps and positive standard minutes. | Basic approval governance exists. |
| `orders.services.lifecycle` and technical readiness | Checks approved default wash route for style readiness. | Wash route readiness is a pre-production gate. |
| `wip_inventory` | Contains stages up to `SEWN_WAITING_WASH`. | Sewing can create WIP waiting for wash, but wash does not consume it. |
| `sewing.services.output` | Sewing output moves net-good quantity to `SEWN_WAITING_WASH`. | Wash is the next logical production stage. |
| `workcenters` | Supports workcenter capacity, machine types, and resource constraints such as washer/dryer/QC capacity. | Useful foundation for wash planning, but not yet connected to wash batches. |
| `boundary_cases` | Contains `REWASH_REQUIRED`, `REWASH_REPEAT_EXCEEDED`, `linked_wash_batch_id`, and generic rewash preview logic. | Wash exceptions are anticipated, but not backed by real wash batch data. |
| `demo_seed` | Seeds wash routes, wash workcenter, basic machine types, and some scheduling rulebook data. | Useful demo data, but too simplified for Eratex laundry reality. |

### 3.2 Backend Modules Missing

There is no dedicated `washing` backend app. Missing entities include:

- `WashDemand`
- `WashBatch`
- `WashBatchLine`
- `WashBatchStep`
- `WashBatchEvent`
- `WashBatchQCResult`
- `RewashCycle`
- `WashHold`
- `WashCapacityReservation`
- `WashMachineCapability`
- `WashRecipe`
- `WashRecipeParameter`
- `WashSustainabilityMetric`
- `WashRestrictedProcessPolicy`

The build plan and schema documents already describe several of these concepts in future-state form, especially `WashBatch`, `WashBatchEvent`, `RewashCycle`, wash board endpoints, and release-to-finishing flow.

### 3.3 Frontend State

The current frontend wash route is a placeholder at:

- `frontend/src/app/wash/planning/page.tsx`

The placeholder names the intended scope:

- Wash queue.
- Route step.
- Machine load.
- Rewash flag.
- Finishing release pattern.

Approved UI prototype sources exist under:

- `docs/frontend_ui/wash_planning_dashboard`
- `docs/frontend_ui/wash_recipe_batch_execution`

These prototypes show a richer operating model:

- Wash flow control board.
- Batch cards by stage.
- At-risk and critical rewash indicators.
- Machine/process visibility.
- QC gate and shade checks.
- Planned versus actual load.
- Recipe/batch execution detail.

The frontend implementation has not yet been built against those prototypes.

---

## 4. Gap Assessment Against Business Specification

The wash specification defines the target thesis:

```text
Sewn goods availability
-> pre-wash QC
-> wash route selection
-> batch creation
-> dry process, if applicable
-> wet wash
-> drying
-> post-wash QC
-> rewash/touch-up if needed
-> release to finishing
```

The current repo reaches only the first handoff:

```text
Sewing output
-> sewn waiting wash
```

### 4.1 Functional Gap Matrix

| Capability expected by specification and research | Current implementation | Gap severity | Operational implication |
|---|---|---:|---|
| Approved wash route master | Basic `WashRoute` and `WashRouteStep` exist. | Medium | Route exists but lacks recipe depth, process taxonomy, batch rules, and compatibility rules. |
| Wash route versioning | Route has approval status, but no explicit versioned recipe/workflow lifecycle. | High | Buyer/style wash standard changes cannot be governed as controlled route versions. |
| Dry process planning | Route step names can say "Dry process", but there is no process type or dry-process-specific logic. | High | Laser, whisker, scraping, PP spray, and manual dry processes cannot be planned accurately. |
| Wet process planning | Route step names can say "Wet wash", but no recipe or machine program logic exists. | High | Washer load, liquor ratio, cycle duration, chemical route, and machine eligibility are invisible. |
| Wash demand from sewn WIP | Missing. | High | The system cannot convert sewing output into actionable wash queues. |
| Wash batch creation | Missing. | High | Laundry cannot group garments by order, style, wash code, shade lot, or machine capacity. |
| Batch sequencing | Missing. | High | Daily laundry scheduling cannot be optimized or governed. |
| Machine compatibility | Machine type can be linked to a route step, but no compatibility matrix exists. | High | The system cannot prevent the wrong wash from being planned on the wrong machine group. |
| Batch capacity calculation | Missing. | High | Wash load cannot be calculated by process minutes, batch size, dryer constraint, hydro constraint, QC load, or rewash allowance. |
| Shade-lot handling | Missing. | High | Denim shade continuity risk is not controlled in wash batching. |
| Post-wash QC | Route has `post_wash_qc_criteria` JSON, but no transaction capture. | High | QC cannot block finishing or trigger governed rewash. |
| Rewash/touch-up | Boundary-case stubs exist. No batch, WIP, approval, or capacity recalculation. | High | Repeat wash remains a theoretical event, not a controlled production loop. |
| Release to finishing | Missing. | High | Washed goods cannot become finishing-ready WIP in the system. |
| Sustainability controls | Some master fields can hold references, but no structured controls exist. | Medium/High | EIM, ZDHC, water/energy/chemical and restricted-process governance are not schedulable or reportable. |
| Mobile/tablet wash capture | Missing. | Medium/High | Laundry event truth would need to come from external systems or manual updates. |
| Integration from Datatex/laundry automation | Not implemented. | Medium/High | Canonical order and route data may exist externally but is not consumed for wash execution truth. |

### 4.2 Main Risk

The current system may make sewing completion look like the main production milestone. For Eratex, this would be misleading. The local deck and wash research both show that laundry can consume major lead time, introduce rework, create machine-specific bottlenecks, and affect shipment readiness after sewing is complete.

The highest risk is therefore not only missing screens or models. It is the false operational confidence created by a plan that can show garments as sewn while hiding wash queue aging, dry-process backlog, washer/dryer bottlenecks, shade-lot constraints, and rewash load.

---

## 5. Evaluation Of Research Reference

The research document `Eratex_Laundry_Washes_Finishes_Process_Document.md` materially upgrades the wash scope beyond a generic wash route.

### 5.1 What The Research Adds

| Research area | Planning-system meaning |
|---|---|
| In-house washing is a customer-facing capability | Wash is part of value creation, not just internal finishing. |
| Denim/chino focus | Wash behavior differs by product, fabric, buyer, and finish. |
| Basic stone bleach to garment dye development | The system must support varied wash families and experimental/development routes. |
| Manual effects: sand blasting, scraping, whiskering | Dry processes need their own steps, capacity, safety, and QC controls. |
| Laser machines | Laser files, machine programs, and repeatable dry effects need version control. |
| Front-loading machines, hydro extractors, conveyor dryers | Wash planning needs resource groups beyond generic washer capacity. |
| Wastewater, ZDHC, chemical inventory, EIM | Recipes need sustainability/compliance metadata. |
| Local deck machine groups: Tonello, Brongo, Yilmax, Tolkar, Ramson, PP Spray Booth, Mannequin, Vaportech | The machine compatibility matrix must be a first-class planning object. |
| Wet process, acid wash, moon wash, laser dry process, manual dry process | Process categories should be structured, not stored as free-text step names. |
| Rewash and touch-up controls | Failed wash is a production and capacity event, not just a QC note. |
| Batch/shade-lot logic | Planning must preserve shade, wash code, and route compatibility. |

### 5.2 Strongest Design Principle From The Research

The research makes one core design point clear:

```text
Laundry load should be calculated using route-specific and machine-specific minutes,
not only garment quantity.
```

This is crucial because one wash order can consume:

- Dry process minutes.
- Wet process washer minutes.
- Hydro extraction minutes.
- Dryer or conveyor dryer minutes.
- QC/shade booth time.
- Touch-up or rewash reserve.
- Setup/changeover time.
- Sustainability or compliance-specific constraints.

### 5.3 What Must Be Validated During Blueprinting

The research intentionally mixes public Eratex claims, deck context, and generic denim laundry knowledge. Before implementation, the team should confirm:

- Current official wash families used by Eratex.
- Which processes are in-house and which are outsourced.
- Current machine list and machine group taxonomy.
- Which machines can run which wash families and buyer styles.
- Actual batch sizing rules by wash type, machine, shade lot, and customer.
- Whether Datatex contains wash codes, wash routes, recipes, or only high-level product data.
- Whether laundry already uses machine automation systems with API/file output.
- Whether EIM is used for development, production approval, or reporting only.
- Which process families are restricted, buyer-prohibited, or safety-controlled.
- Actual rewash rates by buyer, style, wash type, machine group, and operator/line.

---

## 6. Feature-Agnostic Wash Architecture

The architecture should avoid hardcoded special behavior for each wash. It should model wash as configurable production logic:

```text
Wash family
-> route version
-> route steps
-> recipe parameters
-> machine compatibility
-> batch planning rules
-> execution events
-> QC gates
-> rewash/touch-up governance
-> WIP movement
-> finishing release
```

### 6.1 Domain Ownership

| Domain | Responsibility |
|---|---|
| `style_technical` | Style-level approved wash standards, default route reference, technical route approval. |
| `washing` | Wash demand, wash planning, batch creation, execution, QC, rewash, release to finishing. |
| `workcenters` | Machine/workcenter calendars, capacity definitions, resource availability, machine group constraints. |
| `wip_inventory` | Stage-wise inventory movement through wash and finishing handoff. |
| `boundary_cases` | Rewash, machine breakdown, capacity loss, shipment pull-in, and wash-related exceptions. |
| `planning` | Demand impact, capacity load, risk visibility, plan governance, and schedule alignment. |
| `audit_governance` | Business-readable event trail for route approval, batch changes, QC holds, rewash approvals, and release. |

### 6.2 Master Data Layer

The master layer should define what is allowed and how wash should be interpreted.

#### WashProcessType

Generic process category for scheduling and execution.

Suggested values:

- `PRE_WASH_QC`
- `DRY_PROCESS`
- `WET_PROCESS`
- `HYDRO_EXTRACTION`
- `DRYING`
- `POST_WASH_QC`
- `TOUCH_UP`
- `REWASH`
- `FINISHING_RELEASE`

#### WashEffectFamily

Configurable business family. These are not hardcoded process engines; they are planning and governance categories.

Initial values from research and deck context:

- `RINSE`
- `DESIZE`
- `ENZYME`
- `STONE`
- `STONE_ENZYME`
- `BLEACH`
- `ACID`
- `MOON`
- `SNOW`
- `OZONE`
- `GARMENT_DYE`
- `OVERDYE`
- `TINT`
- `SOFTENER`
- `LASER`
- `WHISKER`
- `HAND_SCRAPE`
- `GRINDING`
- `DESTROY_REPAIR`
- `PP_SPRAY`
- `THREE_D_RESIN`
- `CHINO_GARMENT_WASH`

#### WashRouteTemplate

Defines reusable route logic before buyer/style-specific approval.

Key fields:

- Code and name.
- Product type.
- Buyer/customer applicability.
- Wash family.
- Complexity class.
- Default standard lead time.
- Default batch size rule.
- Sustainability/compliance classification.
- Active/inactive status.

#### WashRouteVersion

Approved route used for production.

Key fields:

- Route template.
- Version number.
- Buyer/style/color/wash code applicability.
- Effective date range.
- Approval status.
- Approved wash standard reference.
- Repeat cycle allowance.
- Maximum repeat cycles.
- QC criteria reference.
- Sustainability reference such as EIM score or internal score.
- Restricted process flags.

#### WashRouteStep

Route step should become richer than the current step name and standard minutes.

Key fields:

- Route version.
- Sequence number.
- Process type.
- Effect family.
- Required or optional.
- Can run in parallel.
- Primary resource group.
- Alternate resource groups.
- Machine type required.
- Standard minutes per batch.
- Standard minutes per piece, when applicable.
- Minimum and maximum batch quantity.
- Setup/changeover minutes.
- Required parameter schema.
- QC gate indicator.
- Hold/release authority.
- Repeat/touch-up allowed.

#### WashRecipe

Route version and recipe should be separate. A route says the flow; a recipe says the controlled process parameters.

Key fields:

- Style, buyer, color, wash code.
- Route version.
- Recipe version.
- Approved sample/reference.
- Parameter set.
- Machine program reference.
- Laser file reference, if applicable.
- Chemical family references.
- Sustainability score/reference.
- Approval and effective date.

#### WashRecipeParameter

Feature-agnostic parameter definitions. The same data structure can support pH, temperature, time, load ratio, laser intensity, ozone exposure, or dryer temperature.

Key fields:

- Recipe.
- Route step.
- Parameter code.
- Parameter label.
- Data type: number, text, boolean, enum, file reference, range.
- Unit of measure.
- Target value.
- Minimum value.
- Maximum value.
- Required flag.
- Capture required at execution flag.
- QC relevance flag.

Examples:

| Parameter | Applies to |
|---|---|
| Temperature | Wet process, dryer |
| pH | Wet process, neutralization |
| Time | Wet process, drying, ozone |
| Chemical family | Wet process, bleach, enzyme, softener |
| Load ratio | Wet process |
| Liquor ratio | Wet process |
| Stone quantity | Stone wash |
| Laser file reference | Laser dry process |
| Ozone exposure | Ozone/sustainable wash |
| PP spray setting | PP spray |
| Dryer temperature | Drying |

#### WashMachineCapability

Machine compatibility must be explicit. Machine family names in the deck, such as Tonello, Brongo, Yilmax, Tolkar, Ramson, PP Spray Booth, Mannequin, Vaportech, laser, hydro, and dryer, should be configured through machine capability data.

Key fields:

- Machine or machine group.
- Supported process type.
- Supported effect families.
- Minimum and maximum load.
- Standard load.
- Capacity unit: pieces, kg, batch minutes, machine hours.
- Buyer/style restrictions.
- Sustainability capability.
- Restricted process approval requirement.
- Setup/changeover group.
- Active status and maintenance status.

#### WashQCStandard

Post-wash quality must be structured.

Key fields:

- Buyer/style/color/wash code.
- Shade standard/reference.
- Hand-feel standard.
- Measurement tolerance.
- Visual effect checklist.
- Rubbing/fastness requirement.
- Damage allowance.
- Rewash decision rules.
- Touch-up decision rules.
- Finishing release criteria.

---

## 7. Transaction Layer

The transaction layer should represent actual factory flow.

### 7.1 WashDemand

Created when sewn net-good WIP becomes available for wash.

Key fields:

- Production order.
- Style/color/size ratio context.
- Buyer/customer.
- Wash route version.
- Wash recipe.
- Shade lot.
- Quantity waiting.
- Sewn completion source.
- Required ship date.
- Priority/risk status.
- Earliest wash start.
- Latest safe wash completion.
- Current demand state.

### 7.2 WashBatch

Created from one or more compatible wash demands.

Key fields:

- Batch number.
- Production order(s).
- Route version.
- Recipe version.
- Machine group.
- Planned machine.
- Planned start/end.
- Actual start/end.
- Batch quantity.
- Shade lot.
- Current step.
- Batch status.
- QC status.
- Rewash count.
- Parent batch and root batch, for rewash.
- Release-to-finishing status.

### 7.3 WashBatchLine

Allows a batch to contain multiple compatible demand lines while preserving traceability.

Key fields:

- Batch.
- Demand.
- Order.
- Shade lot.
- Quantity.
- Size breakdown, if needed.
- Original sewn WIP lot.
- Current WIP lot.

### 7.4 WashBatchStep

Instantiation of route steps for a batch.

Key fields:

- Batch.
- Route step.
- Planned machine.
- Actual machine.
- Planned start/end.
- Actual start/end.
- Planned quantity.
- Actual good quantity.
- Defect/rework quantity.
- Status.
- Captured parameter values.
- Operator/team.
- Hold reason.

### 7.5 WashBatchEvent

Append-only event stream.

Event examples:

- Batch planned.
- Batch released.
- Step started.
- Step paused.
- Step completed.
- Machine changed.
- Parameter captured.
- QC hold.
- QC passed.
- Rewash required.
- Rewash approved.
- Touch-up required.
- Released to finishing.
- Batch cancelled.

### 7.6 WashBatchQCResult

Captures post-wash and in-process QC outcomes.

Key fields:

- Batch.
- Step, where relevant.
- QC gate type.
- Shade result.
- Hand-feel result.
- Measurement result.
- Visual effect result.
- Defect reason.
- Accepted quantity.
- Rewash quantity.
- Touch-up quantity.
- Reject quantity.
- Inspector.
- Decision timestamp.

### 7.7 RewashCycle

Controls repeat wash as a production loop.

Key fields:

- Root batch.
- Parent batch.
- Rewash batch.
- Cycle number.
- Reason code.
- Approved by.
- Quantity.
- Route/recipe for rewash.
- Capacity impact.
- Shipment risk impact.
- Final outcome.

---

## 8. WIP Stages Needed For Wash

The current `WipStage` stops at `SEWN_WAITING_WASH`. A wash-heavy implementation should add wash and finishing handoff stages.

Recommended stages:

- `SEWN_WAITING_WASH`
- `WAITING_PRE_WASH_QC`
- `PRE_WASH_QC_WIP`
- `WAITING_DRY_PROCESS`
- `DRY_PROCESS_WIP`
- `WAITING_WET_WASH`
- `WET_WASH_WIP`
- `WAITING_HYDRO_EXTRACTION`
- `HYDRO_EXTRACTION_WIP`
- `WAITING_DRYING`
- `DRYING_WIP`
- `WAITING_POST_WASH_QC`
- `POST_WASH_QC_WIP`
- `REWASH_WIP`
- `TOUCH_UP_WIP`
- `WASHED_WAITING_FINISHING`

These stages should be introduced only when the wash execution slice is approved. In a planning-only slice, the system can keep WIP unchanged and create planned wash batches without production movement.

---

## 9. End-To-End Flow

### 9.1 Order And Technical Readiness

1. Datatex or the canonical ERP source provides customer order, style, color, quantity, shipment date, buyer, and wash code.
2. The platform checks whether a style has an approved wash route and approved recipe.
3. The platform validates that the wash route has steps, resource groups, batch rules, and QC gates.
4. If wash route/recipe is missing, the order cannot be considered production-ready for wash planning.

### 9.2 Sewing-To-Wash Demand Creation

1. Sewing output records net-good quantity.
2. Net-good quantity creates or updates WIP at `SEWN_WAITING_WASH`.
3. A wash demand service reads available sewn WIP.
4. It resolves route version, recipe, shade lot, and priority.
5. It creates `WashDemand` records for planning.

### 9.3 Wash Planning

1. Planner sees the wash queue grouped by order, ship week, style, buyer, wash code, shade lot, and route.
2. The system suggests possible batch groupings based on:
   - Same route.
   - Compatible recipe.
   - Same or compatible shade lot.
   - Same buyer/customer rules.
   - Machine capacity range.
   - Minimum run size.
   - Latest safe completion date.
3. Planner assigns batch to machine group or specific machine.
4. The scheduler calculates:
   - Dry-process load.
   - Wet-wash load.
   - Hydro load.
   - Dryer load.
   - QC load.
   - Expected rewash reserve.
   - Changeover/setup load.
5. The board highlights conflicts:
   - Machine incompatibility.
   - Batch underload/overload.
   - Dryer bottleneck.
   - Missing recipe parameter.
   - Missing shade lot.
   - Rewash reserve exceeded.
   - Shipment risk.

### 9.4 Wash Execution

1. Supervisor releases a planned batch.
2. Operator starts each route step.
3. Actual machine, time, quantity, and required parameters are captured.
4. The system updates batch status and WIP stage.
5. If a breakdown or capacity loss occurs, boundary-case preview shows order, batch, capacity, and shipment impact.
6. Step completion moves the batch to the next step or next queue.

### 9.5 Post-Wash QC And Rewash

1. QC captures shade, hand-feel, visual effect, measurement, damage, and fastness checks as configured.
2. Pass quantity moves toward release to finishing.
3. Failed quantity is assigned to:
   - Touch-up.
   - Rewash.
   - Reject.
   - Hold for decision.
4. Rewash requires approval when configured.
5. Rewash creates a child batch and consumes capacity.
6. Repeat cycle limit is enforced.
7. Shipment risk and plan impact are recalculated.

### 9.6 Release To Finishing

1. Batch can release to finishing only after required QC gates pass.
2. The system moves accepted quantity to `WASHED_WAITING_FINISHING`.
3. Finishing receives quantity, style, order, shade lot, and QC status.
4. Remaining failed quantity stays traceable as rewash, touch-up, or reject.

---

## 10. Planning Logic

The wash planning engine should be deterministic and explainable before any optimization layer is introduced.

### 10.1 Load Calculation

Use route-specific and machine-specific load:

```text
wash load
= dry process minutes
+ wet process machine minutes
+ hydro extraction minutes
+ drying minutes
+ QC minutes
+ setup/changeover minutes
+ expected rewash reserve
```

### 10.2 Batch Compatibility Rules

Do not batch together unless rules allow:

- Same wash route or approved compatible route.
- Same recipe or approved compatible recipe.
- Same shade lot or approved shade grouping.
- Compatible fabric/fiber behavior.
- Compatible buyer/customer standard.
- Machine can run the process.
- Batch size falls within min/max.
- Restricted process approvals are in place.

### 10.3 Priority Rules

Priority should consider:

- Shipment date and latest safe wash completion.
- Frozen/firm/volatile planning zone.
- Customer priority.
- Order risk.
- Existing queue age.
- Rewash priority.
- Dryer/hydro downstream availability.
- Finishing and packing readiness.

### 10.4 Machine Selection Rules

Machine assignment should validate:

- Process type.
- Effect family.
- Machine group capability.
- Load capacity.
- Buyer/customer preference or restriction.
- Sustainability process eligibility.
- Maintenance status.
- Setup/changeover sequence.
- Current queue.

### 10.5 Rewash Reserve Logic

Expected rewash reserve can be calculated by:

```text
expected rewash load
= planned wash quantity
x route rewash probability
x average rewash route minutes
```

This should start as a configurable route-level value and later be recalculated from actual historical results by buyer, style, wash family, machine group, and route.

---

## 11. API Plan

The build plan already names several wash endpoints. The following grouped API surface keeps technical master data separate from wash execution.

### 11.1 Technical Route APIs

Existing:

- `GET /api/v1/wash-routes`
- `GET /api/v1/wash-routes/{routeId}`
- `POST /api/v1/wash-routes/{routeId}/approve`

Recommended additions:

- `GET /api/v1/wash-route-templates`
- `POST /api/v1/wash-route-templates`
- `GET /api/v1/wash-route-versions/{id}`
- `POST /api/v1/wash-route-versions/{id}/clone`
- `POST /api/v1/wash-route-versions/{id}/approve`
- `GET /api/v1/wash-recipes`
- `GET /api/v1/wash-recipes/{id}`
- `POST /api/v1/wash-recipes/{id}/approve`
- `GET /api/v1/wash-machine-capabilities`

### 11.2 Planning APIs

- `GET /api/v1/wash/queue`
- `GET /api/v1/wash/board`
- `GET /api/v1/wash/capacity`
- `POST /api/v1/wash/demands/rebuild`
- `POST /api/v1/wash/batches/preview`
- `POST /api/v1/wash/batches`
- `POST /api/v1/wash/batches/{batchId}/schedule`
- `POST /api/v1/wash/batches/{batchId}/reschedule`
- `POST /api/v1/wash/batches/{batchId}/release`

### 11.3 Execution APIs

- `GET /api/v1/wash/batches/{batchId}`
- `POST /api/v1/wash/batches/{batchId}/events`
- `POST /api/v1/wash/batches/{batchId}/steps/{stepId}/start`
- `POST /api/v1/wash/batches/{batchId}/steps/{stepId}/complete`
- `POST /api/v1/wash/batches/{batchId}/qc`
- `POST /api/v1/wash/batches/{batchId}/hold`
- `POST /api/v1/wash/batches/{batchId}/release-hold`
- `POST /api/v1/wash/batches/{batchId}/rewash`
- `POST /api/v1/wash/batches/{batchId}/release-to-finishing`

### 11.4 Analytics APIs

These should be later-phase APIs, not the first slice:

- `GET /api/v1/wash/kpis`
- `GET /api/v1/wash/adherence`
- `GET /api/v1/wash/rewash-analysis`
- `GET /api/v1/wash/machine-utilization`
- `GET /api/v1/wash/sustainability-summary`

---

## 12. Frontend Plan

The frontend must follow the approved UI prototype sources and the Industrial Logic design system. It should not invent a new dashboard style.

### 12.1 Primary Screens

| Route | Purpose | Prototype source |
|---|---|---|
| `/wash/planning` | Daily/weekly wash board, queue, capacity, at-risk batches, machine grouping. | `docs/frontend_ui/wash_planning_dashboard` |
| `/wash/batches/[batchId]` | Batch recipe, route steps, execution timeline, QC gate, parameter capture. | `docs/frontend_ui/wash_recipe_batch_execution` |
| `/wash/capacity` | Machine group load, dryer/hydro/QC bottlenecks, downtime, reserved capacity. | Could extend wash planning prototype. |
| `/wash/master/routes` | Route templates, approved versions, recipe references, parameter schema. | Use existing technical master UI patterns. |
| `/wash/master/machine-capability` | Machine compatibility matrix. | Use dense admin/grid pattern. |

### 12.2 Planning Board Behavior

The wash planning board should show:

- Queue by available sewn WIP.
- Columns by stage: queue, dry process, wet wash, drying, post-wash QC, rewash/touch-up, ready for finishing.
- Batch cards with order, buyer, style, wash family, quantity, shade lot, route, target date, and risk.
- Machine/group swimlanes when in schedule mode.
- Capacity bars by machine group and day/shift.
- Alerts for missing route, missing recipe, machine incompatibility, batch overload, and shipment risk.

### 12.3 Execution Screen Behavior

The wash batch execution screen should show:

- Batch identity and production order traceability.
- Route steps and current step.
- Planned versus actual time.
- Machine assignment and change history.
- Recipe parameters required for the current step.
- QC gate checklist.
- Rewash/touch-up decisions.
- Release-to-finishing action.

### 12.4 Mobile/Tablet Capture

Mobile/tablet capture can be a later slice, but the data model should be ready for it.

Minimum operator actions:

- Start step.
- Pause/hold step.
- Complete step.
- Capture actual quantity.
- Capture parameter values.
- Record machine issue.
- Submit QC result.
- Flag rewash/touch-up.

---

## 13. Integration Architecture

The pre-blueprinting research already defines two viable scenarios.

### 13.1 Scenario A: Tool-Owned Factory Event Capture

Datatex remains the canonical transaction source for order/style/material data. The planning tool owns wash event capture through desktop/tablet interfaces.

Implication for wash:

- The platform becomes the source of wash execution truth.
- Wash batch events are entered directly in the platform.
- Machine breakdown, queue aging, QC hold, rewash, and release-to-finishing are captured inside the tool.
- This is heavier to implement but gives the scheduler direct data control.

### 13.2 Scenario B: External Event Consumption

Datatex, MES, laundry automation, or another factory system provides wash events through APIs, files, events, or database integration.

Implication for wash:

- The platform becomes a consumer and interpreter of wash truth.
- The same internal model is still needed.
- Integration adapters populate `WashDemand`, `WashBatch`, `WashBatchEvent`, WIP movement, machine status, and QC outcomes.
- If external laundry data is incomplete or late, daily laundry scheduling should be marked unreliable.

### 13.3 Recommended Architecture Choice

Use the same internal wash domain model for both scenarios:

```text
Canonical ERP data
-> internal wash demand model
-> wash route and recipe model
-> wash planning board
-> wash batch/event model
-> WIP and planning impact
```

Only the event source changes:

- Tool-owned capture writes events directly.
- External integration writes events through ingestion/adapters.

This prevents a future rewrite if Eratex chooses one model during blueprinting and later shifts to another.

---

## 14. Phased Build Plan

### W0 - Documentation And Blueprint Readiness

Objective:

- Align wash scope with business specification, research, and current phase boundary.

Deliverables:

- This evaluation and architecture plan.
- Confirmed list of blueprinting questions.
- Decision whether wash is implemented as EOS-06.
- UI source mapping for wash prototypes.

Acceptance:

- Product owner confirms whether route planning is planning-only first or execution-inclusive.
- Data ownership decision is made for Datatex, FastReact, laundry automation, and tool-owned capture.

### W1 - Wash Master Data Foundation

Objective:

- Make the master model capable of representing Eratex wash complexity without starting execution.

Backend:

- Extend or version `WashRoute` into route templates and route versions.
- Add process type and effect family catalogs.
- Add route step metadata for process type, effect family, batch rules, resource group, and parameter schema.
- Add machine capability matrix.
- Add recipe and recipe parameter model.
- Add QC standard master.

Frontend:

- Technical/master views for routes, recipes, and machine compatibility.

Seeds:

- Realistic route families: rinse, enzyme, stone, stone-enzyme, bleach, acid/moon, laser dry process, manual dry process, garment dye, chino wash.
- Machine groups: Tonello 125/150, Brongo, Yilmax, Tolkar, Ramson, PP Spray Booth, Mannequin, Vaportech, laser, hydro, dryer/conveyor dryer, QC.

Acceptance:

- A style can point to an approved route version and recipe.
- The system can explain which machines can run a route step.
- Route approval fails if required process, resource, batch, or QC data is missing.

### W2 - Wash Demand And Planning Board

Objective:

- Convert sewn waiting wash WIP into planned wash demand and board-level schedules.

Backend:

- Add `washing` app.
- Add `WashDemand`, `WashBatch`, `WashBatchLine`, and planned `WashBatchStep`.
- Add queue, board, capacity, preview, create batch, schedule, and reschedule APIs.
- No production WIP movement beyond `SEWN_WAITING_WASH` in this slice unless execution is approved.

Frontend:

- Implement `/wash/planning` from the approved prototype.
- Show wash queue, grouped batches, machine load, and risk.
- Support batch preview and schedule action.

Acceptance:

- Sewn WIP appears in wash queue.
- Planner can create a planned batch from compatible demand.
- System rejects incompatible batch/machine combinations.
- Capacity board shows dry/wet/hydro/dryer/QC load.

### W3 - Wash Execution And WIP Movement

Objective:

- Move from planned wash batches to actual production execution.

Backend:

- Add event APIs.
- Add `WashBatchEvent`.
- Add start/complete route step services.
- Extend WIP stages for wash.
- Move WIP through wash stages based on route step completion.
- Maintain audit events.

Frontend:

- Implement `/wash/batches/[batchId]`.
- Capture start/complete, actual machine, actual time, quantity, and parameters.

Acceptance:

- Batch can move from released to in-process to completed steps.
- WIP stage updates are traceable and quantity-safe.
- Actuals are visible against planned time and quantity.

### W4 - Post-Wash QC, Rewash, And Touch-Up

Objective:

- Make wash quality failures visible and capacity-consuming.

Backend:

- Add `WashBatchQCResult`.
- Add `RewashCycle`.
- Add governed rewash approval.
- Connect rewash with boundary-case preview.
- Create child wash batch for rewash.
- Release passed quantity to finishing.

Frontend:

- QC gate checklist.
- Rewash/touch-up decision panel.
- Rewash approval and capacity impact view.

Acceptance:

- QC can split quantity into pass, rewash, touch-up, reject, and hold.
- Rewash consumes capacity and preserves parent/root batch traceability.
- Repeat cycle limits are enforced.

### W5 - Sustainability And Restricted Process Governance

Objective:

- Support Eratex sustainability and compliance claims in operational planning.

Backend:

- Add EIM/internal sustainability references to recipe and batch.
- Add restricted process policy flags.
- Add chemical family/MRSL references where needed.
- Add water/energy/chemical metric placeholders.

Frontend:

- Show sustainability and restricted-process indicators on recipe, batch, and planning board.

Acceptance:

- Planner can see whether a route is sustainability-sensitive or restricted.
- Restricted route/batch execution requires configured approval.
- Sustainability references are available for reporting and audit.

### W6 - Automation And Mobile Expansion

Objective:

- Improve capture fidelity and reduce manual entry.

Backend:

- Add integration adapters for laundry machines or external systems.
- Add event ingestion and reconciliation.
- Add idempotency controls.

Frontend:

- Tablet/operator capture.
- Supervisor board for exceptions.

Acceptance:

- External machine/MES data can update wash events.
- Tool-owned and externally sourced events use the same domain model.
- Event freshness is visible to planners.

---

## 15. Seed And Test Plan

### 15.1 Seed Scenarios

Minimum scenarios for a credible wash-heavy build:

| Scenario | Purpose |
|---|---|
| Basic rinse route | Prove simple wet process. |
| Heavy stone-enzyme route | Prove multi-step wet process and dryer bottleneck. |
| Laser plus wet wash route | Prove dry process before wet process. |
| Manual dry process plus wash | Prove piece-based dry work before batch wet work. |
| Acid/moon wash route | Prove restricted/special handling. |
| Garment dye route | Prove recipe-specific and high-risk route. |
| Chino soft wash | Prove non-denim route. |
| Shade-lot split | Prove one order becomes multiple batches. |
| Machine incompatibility | Prove validation rejects wrong machine. |
| Rewash cycle | Prove child batch, capacity impact, and shipment risk. |
| Dryer bottleneck | Prove wet-wash completion does not imply wash completion. |
| Machine breakdown | Prove boundary-case impact preview. |
| External event stale | Prove Scenario B integration reliability warning. |

### 15.2 Backend Tests

Tests should cover:

- Route approval validation.
- Recipe parameter validation.
- Machine compatibility.
- Batch compatibility.
- Capacity calculation.
- Demand generation from sewn WIP.
- Batch creation and scheduling.
- Step start/complete state transition.
- WIP movement.
- QC split quantities.
- Rewash cycle limit.
- Boundary-case preview integration.
- Audit event creation.

### 15.3 Frontend Tests

Tests should assert prototype landmarks:

- Wash planning board columns.
- KPI names and counts.
- Batch card fields.
- Machine/resource swimlanes.
- Drawer or detail panel sections.
- Action labels.
- QC gate sections.
- Rewash action and warnings.
- Capacity/risk indicators.

---

## 16. Blueprinting Questions

These questions should be answered before implementation.

### 16.1 Data Ownership

1. Does Datatex hold wash route, wash code, recipe, machine group, or only order/style data?
2. Does FastReact currently model laundry as a finite-capacity supporting process?
3. Does any laundry automation system hold machine start/end, program, or cycle data?
4. Which system is the current source of truth for wash batch creation?
5. Which system is the current source of truth for post-wash QC?

### 16.2 Route And Recipe

1. What is the official current wash family list?
2. Are routes standardized by buyer/style/color/wash code?
3. Are recipe versions approved and locked before bulk?
4. Are route changes allowed after production release?
5. Are laser files version-controlled?
6. Are manual effect templates controlled?

### 16.3 Machine And Capacity

1. What is the current machine list by machine group?
2. What is the min/max load by machine and wash family?
3. Which machines are interchangeable?
4. Which machines are customer-preferred or customer-restricted?
5. How are setup/changeover times calculated?
6. Is dryer capacity the real bottleneck for some weeks?

### 16.4 Batch And WIP

1. Are wash batches created by order, PO, style, color, shade lot, CMT, machine capacity, or a combination?
2. How is shade lot preserved from cutting/sewing into wash?
3. What is the smallest traceable unit in wash: piece, bundle, lot, batch, or order?
4. Can one batch contain multiple orders?
5. Can one order split across multiple wash batches?
6. How are missing/extra pieces reconciled?

### 16.5 QC And Rewash

1. Who can approve rewash?
2. What is the maximum allowed rewash cycle by wash family/buyer?
3. How is touch-up different from rewash operationally?
4. What QC checks block finishing release?
5. How are shade failures classified?
6. What is the current rewash rate by buyer, style, route, and machine?

### 16.6 Sustainability And Compliance

1. Is EIM used for development, production approval, reporting, or all three?
2. Are ZDHC/MRSL controls tied to recipes or only compliance records?
3. Which processes are restricted by buyer or safety policy?
4. Is recycled water used for all routes or selected routes?
5. Are water/energy/chemical metrics captured per batch or per recipe?

---

## 17. Recommended Implementation Stance

The repo should not treat wash as a simple downstream status after sewing. It should be built as a distinct but integrated production domain.

The best architecture is:

```text
Style technical route and recipe master
-> sewn WIP creates wash demand
-> planner creates compatible wash batches
-> machine/resource schedule validates capacity
-> execution captures step actuals and parameters
-> post-wash QC decides pass, rewash, touch-up, reject
-> accepted WIP releases to finishing
-> exceptions feed boundary-case governance and shipment risk
```

The first implementation slice should avoid overreach. Build route/recipe/machine capability and planning board first, then add execution and WIP movement. This keeps the system aligned with the current phase boundary while preparing for the actual Eratex laundry environment.

The critical design decision is to model wash as configurable process data, not as code paths per wash type. If the architecture can represent route steps, effect families, recipe parameters, machine compatibility, QC gates, and rewash rules generically, it can support basic rinse, heavy stone, acid/moon, garment dye, laser dry process, manual scraping/whiskering, sustainable ozone/front-loader processes, and future wash families without repeated redesign.

