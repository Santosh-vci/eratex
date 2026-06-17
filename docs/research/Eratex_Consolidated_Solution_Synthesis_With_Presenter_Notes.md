# Eratex Consolidated Solution Synthesis With Presenter Notes

**Prepared:** 2026-06-14  
**Purpose:** Consolidate the Eratex solution-deck synthesis, direct PPTX presenter-note inspection, and related Eratex research/BRD resources into one source-of-truth interpretation for planning and product scoping.

---

## 1. Source Audit Verdict

### 1.1 Existing deck synthesis

The existing file `docs/research/Eratex_Solution_Deck_Synthesis.md` is a synthesis of visible deck content only.

Evidence:

- It identifies its source extraction as `docs/research/Eratex_Solution_Deck_visible_slide_context.md`.
- The visible-slide extraction states that speaker notes are not included because the request was limited to visible slides.
- The synthesis does not cite presenter notes, speaker notes, notes XML, hidden slides, or note-derived source calculations.

Verdict:

```text
Presenter notes were not intentionally factored into the existing synthesis document.
```

Some presenter-note themes overlap with visible slide content and therefore appear indirectly in the synthesis. However, note-only details such as data-owner names, calculation methods, source Excel file names, presentation caveats, hidden-slide explanations, and several flow notes were not explicitly captured.

### 1.2 Presenter notes in the PowerPoint deck

Direct PPTX package inspection of `docs/research/Eratex Solution Deck.pptx` found:

| Item | Count |
|---|---:|
| Total slides | 299 |
| Hidden slides | 54 |
| Visible slides in existing extraction | 245 |
| PowerPoint notes parts | 145 |
| Notes with substantive text after stripping slide-number residue | 113 |
| Visible slides with substantive notes | 92 |
| Hidden slides with substantive notes | 21 |

Verdict:

```text
Presenter notes exist independently inside the PowerPoint file, but no separate presenter-note extraction file was found in the repository.
```

Repository-wide searches for note-only markers such as `Yulia`, `Yudi`, `Virzha`, `Chozin`, `Inunk`, `Julius`, `SAM_Sewing`, `SAM_Laundry`, `Plan vs Actual Machine April`, `Vector OTIF working`, and `Pre production monitoring report` did not find a standalone notes export. The notes are therefore an embedded deck source, not an already-maintained local Markdown or DOCX source.

### 1.3 Related resources checked

The following local resources were used to consolidate and cross-check the deck interpretation:

| Resource | Role in this synthesis |
|---|---|
| `docs/research/Eratex_Solution_Deck_visible_slide_context.md` | Visible-slide extraction from the 299-slide deck. |
| `docs/research/Eratex_Solution_Deck_Synthesis.md` | Existing visible-slide synthesis. |
| `docs/research/Eratex_Solution_Crux.docx` | Deck distillation. It does not mention speaker/presenter notes and appears to be a deck-level crux, not a note extraction. |
| `docs/brd/01_Consultant_Rajesh_Inamdaar_presentation_on_challenges_&_solution_direction.md` | Independent Rajesh transcript source. |
| `docs/brd/02_Rajesh_Eratex_Challenges_Solution_Direction_Synthesis.md` | Independent synthesis of Rajesh inputs. |
| `docs/research/Eratex_Due_Date_Quotation_Capability_Evaluation.md` | Confirms current due-date promising gaps against the deck concept. |
| `docs/research/Eratex_Planning_Zones_Due_Date_Promising_CCR_Implementation_Plan.md` | Converts deck zone and sub-CCR concepts into implementation direction. |
| `docs/research/Eratex_Wash_Feature_Implementation_Evaluation_And_Plan.md` | Confirms wash/laundry as a later production-grade domain, not current EOS-05 execution scope. |
| `docs/research/Eratex_TNA_Time_Action_Additive_Feature_Implementation_Plan.md` | Translates TMS/WAS deck logic into a lighter T&A implementation direction. |
| `docs/research/Eratex_Laundry_Washes_Finishes_Process_Document.md` | Adds public Eratex wash capability evidence and generic denim wash process framing. |
| `docs/research/Eratex_Production_Grade_EOS_Feature_Roadmap.md` | Aligns the deck concept to the current repo boundary and target FastReact-independent product stance. |

---

## 2. Consolidated Executive Thesis

The Eratex solution is not a narrow planning-board proposal. It is a manufacturing flow-control operating model intended to make Eratex a more reliable preferred supplier.

The core problem is unreliable flow against the customer's real expectation:

```text
Deliver on the originally committed date,
in full quantity,
within the customer-accepted lead-time window,
without firefighting, overtime, avoidable inventory, or management chasing.
```

The visible deck already establishes this thesis. The presenter notes sharpen it by making the adoption logic explicit:

- A tool succeeds only if it solves the core business problem and the user's daily firefighting problem.
- Adoption will not sustain if the system becomes another tracker layered on top of emails, WhatsApp, Excel, FastReact, and manual follow-up.
- The target is a win-win: organization-level OTIF and working-capital improvement plus user-level clarity of priorities, reduced chasing, and stable execution.

---

## 3. Current Reality Synthesized From Deck And Notes

### 3.1 Reliability is overstated by internal measurement

The visible deck says Eratex appears to have high OTD when measured against revised ex-factory dates with a 1-2 day leeway. It also says reliability drops when in-full performance and original commitments are considered.

Presenter notes add the measurement logic behind this claim:

- Customers experience the first committed date, not the latest revised internal date.
- Internal files and OOH files appear to carry different ex-factory references.
- OTIF calculations in the appendix compare Eratex's plan ex-factory date, actual ex-factory date, shipment quantity, order quantity, and OOH ex-factory references.
- Some note text flags unresolved questions such as customer acceptance tolerance, whether short shipment is due to quality or material shortage, and how rejection should be tied into the measurement.

Consolidated implication:

```text
The product must store original commitment, revised commitment, actual shipment, order quantity, shipped quantity, tolerance, and revision history separately.
```

Without that separation, the platform will reproduce the current measurement ambiguity.

### 3.2 FKD misses are multi-causal and visibility-driven

The visible deck identifies FKD misses due to fabric, trims, and PPS/garment test sample approval delays.

Presenter notes add:

- No single dominant FKD miss reason is obvious from the deck analysis.
- Merchandising and pre-production activities are spread across multiple teams with dependencies.
- Sampling is iterative and can share capacity with other sample types.
- Delays cascade when handoffs, priorities, and information completeness are not visible.

Consolidated implication:

```text
FKD control needs dependency-aware readiness, not a flat checklist alone.
```

This supports the later T&A plan: use order-level action dependencies, closure evidence, owner visibility, and milestone health rather than a heavy ticket object for every activity.

### 3.3 PCD instability is more important than simple PCD misses

The visible deck says only 5-10% of orders may appear to miss PCD, but repeated PCD revisions hide the real instability.

Presenter notes add:

- PCD change includes both pull-ahead and postponement.
- Notes cite examples where week-to-week PCD movement shows significant postponement, and hidden-slide notes refer to week 1 to week 4 shifts being much higher.
- Uncertainty causes teams to start work as soon as fabric arrives because they do not know which order will become urgent.
- This creates preparatory WIP, priority conflict, peaks and troughs in pre-production load, and PCD misses even after multiple revisions.

Consolidated implication:

```text
The product must distinguish baseline PCD, revised PCD, actual PCD, PCD movement, and PCD miss.
```

The system should treat repeated date movement as a risk signal, not only final PCD failure.

### 3.4 Current planning checks the wrong level of capacity

The visible deck says planning may level-load one department while unknowingly overloading another.

Presenter notes add the operating detail:

- Current planning looks at laundry loading in a month, feeds that into FastReact for sewing start/end dates, and quotes ex-factory dates based on lead times across other operations.
- A month can look level-loaded while individual weeks are underloaded or overloaded.
- A single-resource view fails because the constraint can shift by order mix. Sewing SMV can look even while heavy-wash orders overload laundry.
- Critical resource categories must be split into sub-CCRs. For sewing, this is related to customer/product/style-line fit and star-rated lines. For laundry, it is related to machine make, load capacity, process family, laser machines, and machine groups.
- Load must be divided only across the relevant sub-CCR, not across all nominal capacity.

Consolidated implication:

```text
Capacity promising and planning must be route-aware, week/date-bucketed, and sub-CCR constrained.
```

Department-level capacity is not reliable enough for due-date quotation or frozen-plan creation.

### 3.5 Execution instability turns planning misses into business cost

The visible deck identifies frequent sewing line changes, start-date changes, split loading, efficiency loss, backlog, and capacity loss.

Presenter notes add:

- Some line-split data was not available, which should be treated as a data caveat.
- Cut-panel WIP below a threshold can create line starvation risk.
- Hidden slide notes connect PCD misses to uneven line feeding and sewing capacity losses.
- Fabric and trim inventory may be physically available, yet line feeding can still fail because readiness and sequencing are not synchronized.

Consolidated implication:

```text
Execution control must measure whether the right input is available at the right line, not only whether material exists somewhere in inventory.
```

This supports the existing EOS-05 direction for cutting output, sewing line loading, realignment governance, and sewing output capture, but it also shows why later WIP and wash truth are required.

### 3.6 Laundry is the hidden bottleneck domain

The visible deck and research both treat laundry as a critical operation, especially for denim.

Presenter notes add source and calculation context for the appendix:

- Laundry idle-time analysis used machine downtime/run-time data for 2-9 April, excluding a public holiday.
- Plan-versus-actual laundry machine adherence used `Plan vs Actual Machine April 2026`.
- Customer preferred-machine adherence used `Washing Machine Plan April 2026`, customer names, preferred-machine mapping, and exception filtering.
- Laundry SAM and kg-hour charts used `SAM_Laundry.xlsm` and OOH master references.
- Shift-plan non-adherence is tied to lot availability, WIP estimation, machine sequencing, and plan-versus-actual machine usage.

The Rajesh transcript independently reinforces that denim wash is not a generic finishing step. Dry and wet processes, repeated cycles, rewash, and capacity changes must be explicit scheduling objects.

Consolidated implication:

```text
Laundry must be treated as a route-driven, machine-constrained, batch-constrained, quality-gated production domain.
```

The current repo boundary stops at `SEWN_WAITING_WASH`; full wash execution belongs to a future EOS-06-style feature family.

---

## 4. Consolidated Solution Direction

### 4.1 Govern the horizon through zones

The visible deck proposes future, volatile, and firm zones, with frozen-plan behavior implied.

Presenter notes make the operational flow clearer:

- In the far future, Eratex blocks or evaluates capacity before confirming delivery promises.
- In the 90-110 day range, merchandising follows up for customer confirmation against projections.
- Around the firm horizon, customer confirmation and ex-factory commitment become more governed.
- Future-zone commitments should use a load chart across critical resources, not blind capacity blocking.
- Volatile-zone shuffling should be visible, reasoned, and then stabilized.
- Firm/frozen-zone dates should not keep moving routinely.

The current implementation has useful seeds, but the planning-zone plan correctly identifies that the deck requires order-level zones anchored to ex-factory timing, not only work-item dates.

### 4.2 Build a capable-to-promise engine, not only a date validator

The due-date evaluation document confirms the current code can preview manually selected placements but cannot search for feasible dates.

The target capability should:

- Accept enquiry/projection/confirmed-order inputs.
- Read style, route, SAM/SMV, quantity, customer, wash category, and critical-resource requirements.
- Search future capacity by route stage and sub-CCR.
- Propose feasible delivery week/date alternatives.
- Create tentative, soft, firm, or locked capacity reservations.
- Explain infeasibility by constraint, week, sub-CCR, missing master data, or readiness blocker.
- Preserve original promise, revised promise, and commitment approval.

### 4.3 Separate ERP truth, planning truth, and draft external plans

The original visible deck describes a Vector Flow and FastReact interaction where FastReact operates in auto mode and Vector Flow drives logic.

The current repository guidance and production-grade roadmap update the product stance:

```text
Datatex is the canonical ERP transaction truth.
The Eratex platform should own planning and scheduling logic.
FastReact or Excel can be optional legacy draft inputs, not committed schedule truth.
```

Consolidated implication:

- Do not copy the original deck's FastReact dependency as a target architecture requirement.
- Use the deck's logic requirement: avoid manual plan drift and keep one governed planning truth.
- Implement neutral external-plan ingestion and validation as draft input only.

### 4.4 Use sub-CCR based resource modeling

The combined deck, notes, and planning-zone research converge on this rule:

```text
An order must load only the resource subset that can realistically run it.
```

Examples:

- Sewing lines by customer/product/style fit, skill, star rating, learning curve, and line suitability.
- Laundry machines by wet/dry process, machine make, load capacity, buyer/customer preference, wash type, and process compatibility.
- Route steps across cutting, relaxation, embroidery/printing, sewing, laundry, finishing, RM store, and FG warehouse.

This requires masters for capability, not only generic workcenter names.

### 4.5 Use T&A as readiness control, not a ticket-heavy clone of TMS

The visible deck's TMS/WAS section is useful but should be translated into a cleaner Eratex implementation:

- Dependency-driven action release.
- Owner worklists.
- Mandatory closure evidence.
- Baseline/current/revised/actual dates.
- FKD, PCD, release, laundry, finishing, packing, and shipment criticality.
- Alerts for overdue, blocked, stale, or milestone-critical work.
- API reuse from Datatex and other systems where data already exists.

The T&A research document correctly argues against making every activity a heavy ticket. The more scalable model is an order-level T&A plan with dependent action items.

### 4.6 Control execution through one priority mechanism

The deck's Black/Red/Yellow/Green priority logic should become a cross-functional execution language:

- Pre-production actions should use milestone health and buffer penetration.
- Production workcenters should use elapsed-time and shipment-risk priority.
- Daily flow meetings should focus on Black/Red recovery and reason capture.
- POOGI should use standardized reason codes and Pareto analysis.

The priority mechanism should not become department-local. It must remain order/project-health based.

### 4.7 Treat laundry scheduler as a later specialized module

The deck proposes a daily laundry scheduler with route, constraint machine, CMT, changeover, WIP, batch, and capacity inputs.

The current implementation does not support full wash execution. The wash implementation plan correctly positions this as a future feature family with:

- Wash demand from sewn WIP.
- Batch creation.
- Dry/wet step execution.
- Machine compatibility.
- Recipe/version controls.
- Shade-lot batching.
- Post-wash QC.
- Rewash/touch-up.
- Release to finishing.
- Sustainability and compliance metadata where required.

---

## 5. What Presenter Notes Add Beyond Visible Slides

The presenter notes do not overturn the visible deck thesis. They add four useful layers:

### 5.1 Adoption and change-management intent

The notes emphasize that tool adoption depends on solving both the organizational problem and the user problem. This is stronger than the visible slide text and should shape UI/workflow priorities.

Product implication:

```text
Do not build passive dashboards only. Build operational surfaces that reduce chasing, clarify next action, and enforce one priority mechanism.
```

### 5.2 Evidence provenance and calculation method

The notes identify data owners, source files, transformation steps, formulas, and caveats behind multiple charts.

Examples:

- FKD delays from Yudi/MD data.
- Fabric stock and dead-stock analysis from Chozin fabric stock data.
- Fabric PO ex-factory spread from Virzha summary/planner data.
- Laundry plan adherence from Inunk plan-versus-actual machine data.
- OTIF comparison from Julius/PPIC, Vector OTIF working, Eratex on-time files, and OOH ex-factory references.
- Sewing/laundry/finishing SAM analysis from SAM workbooks and OOH master references.

Product implication:

```text
Every KPI and dashboard needs a data lineage field: source system/file, extraction date, calculation version, excluded records, and owner.
```

### 5.3 Hidden-slide causality and validation caveats

Some hidden slides contain substantive notes. They should not be treated as approved visible-deck claims, but they are useful validation prompts.

Examples:

- Pre-production delay analysis and SLA framing.
- Pull-ahead and postponement percentages.
- Fabric arrives early partly because of MOQ, shade, and shrinkage batching.
- Priority conflict proof still needs stronger evidence.
- Full-kit/line-starvation questions need careful validation.
- Some line-split data was not available.

Product implication:

```text
Classify note-only items as validation prompts unless the same claim is visible in the deck or supported by another local research source.
```

### 5.4 Implementation-grade planning nuance

The notes give details that are highly relevant for system design:

- Customer-style-wise sub-CCR mapping for sewing.
- Highest star-rated lines should be preferred.
- Load should not be spread across all eligible lines if that damages efficiency.
- Laundry sub-CCRs should group machines by make/load capacity and process.
- Future-order load charts should be filtered to relevant resources.
- Low future-order-load cases still need minimum standard lead-time logic.
- Capacity buffer logic must absorb "murphys" rather than make the promise brittle.

Product implication:

```text
The planning engine must combine finite capacity with policy rules for line spread, preferred resources, minimum lead time, buffers, and feasibility explanation.
```

---

## 6. Consolidated Product Scope Implications

### 6.1 Current implemented boundary

Within the current Phase 5 / EOS-05 boundary, the product should remain limited to:

- Controlled master and technical product foundation.
- Orders, procurement readiness, fabric QC, PCD readiness.
- Planning, workcenter load, plan freeze/change governance.
- Daily production release control.
- Cutting execution bridge.
- Sewing line loading.
- Governed line realignment.
- Sewing output capture.
- Minimal WIP movement through sewn waiting wash.

Do not pull full wash execution, full WIP reconciliation, shipment workflow, what-if simulation, or mature control-tower analytics into the current boundary.

### 6.2 Production-grade target

The production-grade platform should eventually support:

- Capacity-constrained due-date quotation.
- Order-level planning zones.
- Capacity reservation hardness.
- Route and sub-CCR capability masters.
- Dynamic capacity calendars and buffers.
- T&A action dependencies and milestone health.
- Governed plan freeze/change/recovery.
- Plan-versus-actual ledger.
- Wash batch execution and rewash governance.
- Finishing, packing, shipment readiness, and dispatch reconciliation.
- KPI lineage and POOGI reason-code analysis.

### 6.3 Architectural stance

The target architecture should be:

```text
Datatex transaction truth
-> staging/import validation
-> platform planning and scheduling logic
-> governed plan/release/execution truth
-> audit and analytics
```

External plans from FastReact, Excel, or other tools should be validated as draft inputs only.

---

## 7. Open Validation Questions

These questions should be answered before treating the deck-plus-notes synthesis as implementation-complete:

1. Which deck note claims are acceptable to treat as client-validated evidence, and which are only consultant working notes?
2. What are the authoritative files or systems behind OOH ex-factory date, Eratex plan ex-factory date, order quantity, shipped quantity, and customer tolerance?
3. How should original commitment, revised commitment, and actual dispatch be defined in Datatex and in the planning platform?
4. What is the final agreed planning-zone calendar: future/free, volatile, firm, frozen, and execution windows?
5. What are the exact sub-CCR definitions for sewing and laundry, including customer/style exceptions?
6. What is the policy for limiting line spread to preserve efficiency?
7. Which capacity buffers are fixed policy and which are calculated from historical performance?
8. What is the minimum standard lead time when future-order load is low or zero?
9. Which pre-production actions must be dependency-driven T&A actions versus release-gate checklist items?
10. Which wash process facts are currently maintained in Datatex, buyer manuals, laundry Excel files, or machine-level systems?
11. Which note-derived calculations have raw data available for repeatable dashboard implementation?
12. Which hidden-slide claims should be discarded, retained as validation prompts, or promoted into approved product requirements?

---

## 8. Final Consolidated Synthesis

The existing Eratex solution-deck synthesis remains valid as a visible-slide interpretation, but it is incomplete as a full source audit because the PowerPoint contains substantive presenter notes that were excluded from the visible-slide extraction.

Those presenter notes do not change the main thesis. They make the thesis more actionable:

- The system must solve user firefighting, not only management reporting.
- Customer reliability must be measured against original commitment and in-full delivery.
- FKD and PCD failures are driven by dependency, visibility, and priority conflicts, not one isolated department.
- Planning must be sub-CCR and route constrained, not department-level.
- Laundry is a first-class denim constraint with machine, batch, route, quality, and rewash complexity.
- Appendix KPIs require explicit data lineage and validation because the notes reveal manual source files and calculation steps.
- Hidden-slide notes are useful but should be classified as validation prompts unless independently supported.

The consolidated product direction is therefore:

```text
Build Eratex as a governed planning and execution-control platform,
independent of FastReact as runtime truth,
fed by Datatex transaction truth,
capable of capacity-constrained due-date promising,
zone-governed plan stability,
dependency-driven T&A readiness,
sub-CCR resource loading,
controlled cutting and sewing execution,
and future wash-to-shipment closed-loop execution.
```

This consolidated synthesis should be used alongside the existing visible-slide synthesis. The existing synthesis should be treated as deck-visible evidence; this document should be treated as the consolidated deck-plus-presenter-note-plus-local-research interpretation.
