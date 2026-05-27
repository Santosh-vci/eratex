# Diff: Eratex BRD Refinement from Rajesh Inputs

**Baseline BRD:** `Eratex_Planning_Scheduling_Tool_BRD.md`  
**Input reading order:**  
1. `01_Consultant_Rajesh_Inamdaar_presentation_on_challenges_&_solution_direction.md`  
2. `02_Rajesh_Eratex_Challenges_Solution_Direction_Synthesis.md`  
3. `03_Reconciliation_Rajesh_Feedback_vs_Eratex_BRD_EOS_Direction.md`  
**Prepared date:** 2026-05-27  
**Purpose:** Define the changes needed in the latest BRD so the business team has a clearer, wider-consensus understanding of the Eratex planning and scheduling problem, solution direction, and implementation implications.

---

## 1. Executive Summary of the Diff

The current BRD direction remains valid. The inputs do not invalidate the end-to-end planning and scheduling platform direction. They strengthen it.

The main refinement is that the BRD should stop describing the problem mainly as "FastReact exists but Excel is still used" and should frame the deeper business issue:

```text
Eratex needs a live, denim-aware, wash-aware, capacity-aware, WIP-trusted,
exception-owned operating spine that can react when factory reality changes.
```

The new inputs add five consensus-building improvements:

1. Denim wash/laundry must be described as a value-creation, quality-risk, and capacity-constraining domain, not only as a bottleneck.
2. The BRD must formally define scheduling boundary cases: cancellation, capacity change, rewash, quality failure, shipment pull-in, and other "what happens when..." events.
3. The BRD must state the MVP scheduling grain so business and build teams do not assume different levels of detail.
4. The BRD must include a pre-build Scheduling Behaviour Rulebook / validation phase before deep planning-engine implementation.
5. Pre-order enquiry, quotation, sampling, and approval should be visible as upstream milestones, but full quotation-costing should remain outside MVP until confirmed.

---

## 2. Synthesized Business Position

### Current BRD position

The BRD currently says Eratex has a complex denim bottoms and chinos manufacturing flow, may already use FastReact, but still depends on Excel/manual coordination. It correctly identifies PCD readiness, weekly planning, daily release, workcenter load, sewing line loading, wash planning, WIP, exceptions, and shipment readiness.

### Refined position from the three inputs

Rajesh's input adds the operating reason why generic scheduling can fail:

```text
Denim manufacturing is not a simple cut-and-sew flow. Product value is often
created through dry processing, wet washing, fading, distressing, tearing,
touch-up, repeated laundry cycles, shade/effect approval, and rework.
```

Therefore, the BRD should frame the solution as a governed production-control spine that:

- supports export-oriented order commitments,
- models denim wash/laundry as a first-class planning domain,
- supports chinos as a simpler product variant within the same operating spine,
- defines capacity in business-operational terms,
- makes WIP and exceptions owned and auditable,
- and specifies how the system reacts to real operating changes.

---

## 3. Diff Control Summary

| BRD Area | Change Type | Priority | Summary |
|---|---:|---:|---|
| Executive Summary | Replace / strengthen | High | Add export-oriented context and denim-specific root cause. |
| Business Context | Add section | High | Add dedicated denim complexity and wash value-creation section. |
| Problem Statement | Replace | High | Use reconciled problem statement focused on operating spine gap. |
| Business Need | Strengthen | High | Make "system reaction rules" explicit, not only visibility. |
| Business Objectives | Add objectives | High | Add boundary-case handling, scheduling grain, and rulebook readiness. |
| Product Scope | Clarify | High | Keep ten MVP surfaces, add upstream milestones, defer full costing. |
| MVP Surfaces | Enrich | High | Strengthen wash, capacity, weekly planning, daily release, exceptions. |
| Functional Requirements | Add FRs | High | Add scheduling boundary cases, planning grain, capacity definitions. |
| Business Rules | Add new subsections | High | Add cancellation, capacity change, rewash, automation-boundary rules. |
| Implementation Roadmap | Add Phase 0A | High | Add Scheduling Behaviour Rulebook before full build. |
| Risks | Add risks | Medium | Add risks around under-specified grain and premature automation. |
| Open Decisions | Expand | Medium | Add workshop question sets for business validation. |

---

## 4. Detailed Diff by Current BRD Section

## 4.1 Title and Document Metadata

### Current

```md
# Eratex End-to-End Planning & Scheduling Tool for Denim Bottoms and Chinos Manufacturing
```

### Change

Keep the title, but add a subtitle or scope note:

```md
**Scope Note:** The platform is denim-aware and supports chinos as a lower-complexity product variant within the same planning spine.
```

### Rationale

The consultant feedback is denim-led. Chinos remain in scope, but the BRD should avoid implying that chinos and denim have equal wash/complexity behavior.

---

## 4.2 Section 1: Executive Summary

### Change type

Replace the first three narrative paragraphs with a stronger business-facing summary.

### Proposed replacement language

```md
Eratex operates as an export-oriented garment manufacturer serving international customers, primarily across denim bottoms and chinos. The production environment is not a simple cut-and-sew flow. For denim, commercial value is often created through dry processing, wet washing, fading, distressing, tearing, touch-up, repeat wash cycles, and buyer-specific shade/effect outcomes.

Although a planning tool such as FastReact may exist in the operating environment, planning still appears to depend heavily on Excel and manual coordination. The deeper issue is not only tool adoption. The deeper issue is that the real operating complexity of denim production - especially wash/laundry, rework, WIP movement, capacity changes, order changes, and shipment-risk recovery - is not governed by one trusted, live operating spine.

The proposed solution should therefore be an end-to-end, denim-aware planning and scheduling platform that converts customer demand into executable production control. It must support order visibility, PCD readiness, capacity-aware planning, daily release, sewing line loading, wash and rewash planning, WIP ageing, exceptions, recovery actions, and shipment readiness.
```

### Why this improves consensus

Business stakeholders will better understand why the issue is operationally specific to Eratex and denim, not merely a generic "replace Excel" problem.

---

## 4.3 Section 2: Business Context

### Change type

Add two subsections after `2.1 Nature of Eratex Operations`.

### New subsection: `2.2 Export-Oriented Operating Context`

```md
Eratex should be described as an export-oriented garmenting operation where customer delivery commitments, buyer approvals, inspection readiness, documentation, packing, and dispatch reliability are central to business performance.

Orders are expected to be driven by international customers, with US and Europe being the primary markets referenced in the consultant input. This means OTIF protection, shipment risk visibility, and readiness discipline must be treated as business controls, not only factory metrics.
```

### New subsection: `2.3 Denim-Specific Manufacturing Complexity`

```md
Denim manufacturing has a different complexity profile from basic garmenting. In denim, visible effects such as fading, distressing, tearing, whiskering, scraping, grinding, uneven shade, hand feel, and fashion-wash outcomes may be intentional value-add features rather than defects.

This makes wash/laundry a value-creation, quality-risk, and capacity-constraining production domain. Dry process, wet wash, repeat wash cycles, post-wash shade/effect checks, and rewash loops must be planned explicitly because they affect capacity, WIP ageing, recovery cost, and shipment risk.

Chinos should be supported through the same operating spine, but with simpler route and wash complexity unless business evidence proves otherwise.
```

### Current section impact

The current bullets under Business Context are useful. Keep them, but move them below the new denim complexity framing and add:

- wash complexity class,
- fashion-effect requirement,
- post-wash approval,
- repeat-cycle probability,
- route-specific capacity impact.

---

## 4.4 Section 3: Problem Statement

### Change type

Replace the current problem statement with the reconciled problem statement.

### Proposed replacement language

```md
Eratex is a large export-oriented denim and chinos garment manufacturer where production complexity extends beyond cutting and sewing into customer approvals, nominated material procurement, fabric QC, PCD readiness, sewing line loading, dry/wet wash processing, repeat wash cycles, quality holds, WIP movement, finishing, packing, and shipment readiness.

Although a formal planning tool may exist, the factory appears to rely heavily on Excel and manual coordination because the real operating complexity - especially denim wash/rework, shifting capacity constraints, order changes, and exception recovery - is not fully governed by one trusted system.

The factory is able to maintain OTIF above 95%, but this may be achieved through extra operating expense, overtime, expediting, resequencing, and manual firefighting, while resource utilization remains around 70%. The core problem is therefore not the absence of software, but the absence of a live, capacity-aware, wash-aware, WIP-trusted, exception-owned operating spine that converts customer demand into executable production control.
```

### Current content to retain

Keep the existing bullets on Excel dependency, WIP ageing, PCD readiness, workcenter constraints, wash rework, and shipment readiness, but place them under a renamed subsection:

```md
### 3.1 Symptoms Observed in Current Planning
```

### New subsection to add

```md
### 3.2 Root Cause Behind the Symptoms

The planning issue is not only that planners use Excel. Excel remains active because the formal planning environment may not yet represent the real production states, wash/rework behaviour, capacity-change reactions, and exception ownership required by daily operations.
```

---

## 4.5 Section 4: Business Need

### Change type

Strengthen language around operating reaction, not only visibility.

### Add after the existing "The product must help Eratex answer..." list

```md
The product must also define how the system reacts when operating reality changes:

- What happens if an order is cancelled?
- What happens if capacity is lost or added?
- What happens if wash must repeat?
- What happens if quality fails after wash?
- What happens if shipment date is pulled in?
- What happens if a frozen weekly plan needs to change?
- What is recommended, what is blocked, and what requires approval?
```

### Rationale

This directly incorporates the "border cases" discussion from Rajesh and makes the BRD more implementation-grade.

---

## 4.6 Section 5: Business Objectives

### Change type

Add and refine objectives.

### Replace objective 6

Current:

```md
Treat washing as a core production constraint for denim and chinos.
```

Recommended:

```md
Treat denim wash/laundry as a value-creation, quality-risk, and capacity-constraining production domain, while supporting chinos as a simpler configured route variant where applicable.
```

### Add new objectives

```md
11. Define scheduling boundary-case behaviour for cancellation, capacity change, rewash, quality failure, shipment pull-in, and plan change.
12. Establish the MVP planning grain so business users, planners, and builders share the same level of scheduling detail.
13. Produce a Scheduling Behaviour Rulebook before deep planning-engine implementation.
```

---

## 4.7 Section 6: Product Scope

### Change type

Clarify MVP scope and upstream scope boundary.

### Add

```md
The ten MVP surfaces remain valid. However, MVP scope should also capture upstream milestone visibility for customer enquiry, quotation status, sample submission, sample approval, technical file receipt, and order confirmation. Full quotation costing and commercial feasibility workflow should remain outside MVP unless confirmed by the business team.
```

### Add product complexity configuration

```md
The product should support configurable product complexity classes, for example:

| Complexity Class | Planning Implication |
|---|---|
| DENIM_HEAVY_WASH | Dry/wet route, fashion effects, higher rewash risk, shade/effect QC mandatory |
| DENIM_BASIC_WASH | Standard wash route, lower rewash probability |
| CHINO_BASIC_WASH | Simpler route, lower wash complexity |
| CHINO_NO_COMPLEX_WASH | Standard garmenting route without denim-style wash complexity |
```

---

## 5. Diff for MVP Surfaces

## 5.1 Surface 1: Order Lifecycle Surface

### Add capabilities

- Upstream milestone visibility: enquiry, quotation, sample request, sample submitted, sample approved, order confirmed.
- Order change status: quantity change, delivery date change, cancellation request, split shipment request.
- Product complexity class and wash complexity class.
- Link to scheduling boundary-case events.

### Add data elements

| Data Element | Description |
|---|---|
| Enquiry / quotation status | Upstream commercial milestone before confirmed order |
| Sample approval status | Proto/fit/wash/PP approval stage |
| Product complexity class | Denim/chino route and wash complexity indicator |
| Order change status | Cancellation, quantity change, delivery change, or hold |
| Boundary-case flag | Indicates whether a special scheduling rule is active |

---

## 5.2 Surface 2: PCD Readiness Surface

### Add readiness checks

```text
product complexity class confirmed
wash route confirmed
dry/wet process requirement confirmed
fashion-effect standard available
post-wash QC criteria available
rewash handling rule available
capacity impact reviewed
```

### Add success criteria

- No order is released to cutting unless wash route and complexity class are visible.
- Conditional release includes reason, owner, expiry, and recovery action.
- PCD readiness distinguishes true readiness from commercial pressure.

---

## 5.3 Surface 3: Weekly Planning Workbench

### Add scheduling grain decision

```md
MVP scheduling grain should be order x style x color/shade-lot x production stage x workcenter/line x date/shift, with wash handled at wash-batch grain.

Operation-level detail should exist in master data and line-balance review, but the first scheduling engine should not attempt full operation-by-operation finite scheduling unless validated as necessary.
```

### Add capabilities

- Frozen-zone and firm-zone plan controls.
- Impact preview for order change, cancellation, capacity loss, and shipment pull-in.
- Rule-based recovery recommendation.
- Plan version comparison.

---

## 5.4 Surface 4: Daily Production Release Surface

### Add capabilities

- Release impact check against wash capacity, not only current workcenter readiness.
- Conditional release approval with reason and expiry.
- Capacity-change reaction when manpower/machine/shift availability changes.
- Release hold if upstream boundary-case event is unresolved.

### Add success criteria

- Daily release does not create downstream wash overload without explicit warning.
- Users can see why a release is blocked and who can approve an exception.

---

## 5.5 Surface 5: Workcenter Load Monitor

### Add capacity definition matrix

For each workcenter, define:

| Field | Meaning |
|---|---|
| Capacity unit | Pieces/day, batches/day, minutes/day, operator-hours, line-days, etc. |
| Planning bucket | Shift, day, week, or batch |
| Primary constraint resource | Main limiting factor |
| Secondary constraint resource | Supporting bottleneck |
| Normal shift capacity | Baseline available capacity |
| Overtime capacity | Approved additional capacity |
| Capacity loss triggers | Absenteeism, breakdown, quality hold, rework, etc. |
| Recovery levers | Overtime, resequencing, split batch, alternate line, outsource, defer |

### Example to include

| Workcenter | Capacity Unit | Primary Constraint | Secondary Constraint | Recovery Levers |
|---|---|---|---|---|
| Wet Wash | Batch minutes and pieces/day | Washer machine time | Dryer/post-wash QC | Overtime, resequence, split batch, defer low-risk batch |
| Sewing Line | SMV minutes and pieces/day | Manpower and line balance | Skill mix, machines, absenteeism | Add helpers, split order, change line, overtime |

---

## 5.6 Surface 6: Sewing Line Loading Surface

### Add refinements

- Link line loading to product complexity class and operation bulletin.
- Distinguish gross target, quality-adjusted target, and net-good output.
- Treat skill mix and learning curve as capacity modifiers.
- Add boundary-case handling for absenteeism, machine breakdown, and style complexity change.

---

## 5.7 Surface 7: Wash Planning Surface

### Change type

Substantially strengthen. This is the most important content enrichment from the new inputs.

### Replace purpose

Current:

```md
To plan washing as a core production constraint.
```

Recommended:

```md
To plan wash/laundry as a denim value-creation, quality-risk, and capacity-constraining domain that directly affects WIP flow, shipment risk, and customer acceptance.
```

### Add capabilities

- Wash complexity class.
- Fashion-effect requirement.
- Dry process and wet wash route.
- Repeat-cycle possibility.
- Rewash reason.
- Cycle count.
- Post-wash shade/effect QC outcome.
- Capacity impact of rewash.
- Wash route performance analytics.
- Link from wash outcome to finishing release and shipment risk.

### Add success criteria

- Rewash is visible as capacity-consuming work, not informal rework.
- Post-wash quality outcomes update WIP, capacity, and shipment risk.
- Wash queue overload triggers exception and recovery recommendation.

---

## 5.8 Surface 8: WIP and Queue Monitoring Surface

### Add refinements

- Track shade-lot and batch identity where relevant.
- Distinguish normal queue from quality hold, rework hold, and capacity hold.
- Add owner and next-system-reaction to each ageing WIP event.
- Add escalation from WIP threshold breach into Exception and Alert Surface.

---

## 5.9 Surface 9: Exception and Alert Surface

### Add alert examples

```text
order cancellation after cutting
capacity loss in wash
capacity addition through overtime
wash repeat cycle beyond threshold
post-wash shade/effect rejection
shipment pull-in creates overload
frozen plan change requested
partial shipment required due to short quantity
```

### Add capability

Exception recommendations should be rule-based and auditable:

| Event | Suggested Recovery Options |
|---|---|
| Wash overload | Resequence, split batch, overtime, defer low-risk batch |
| Sewing capacity loss | Reassign line, add helpers, approve overtime, split order |
| Order cancellation | Release capacity, freeze WIP, reclassify material, management decision |
| Shipment pull-in | Prioritize WIP, expedite QC, approve overtime, split shipment |

---

## 5.10 Surface 10: Shipment Readiness Surface

### Add refinements

- Link shipment readiness to boundary-case events.
- Track split shipment decision reason and approval.
- Track short quantity impact and customer communication status.
- Track premium freight or extra cost where applicable.

---

## 6. Diff for Mature-State Scope

## 6.1 Enquiry and Costing Surface

### Current

Listed as a mature-state surface.

### Recommended

Keep full costing as mature-state, but add MVP milestone visibility:

```md
MVP should capture enquiry, quotation status, sample milestones, and order confirmation as upstream lifecycle milestones. Full costing simulation and commercial feasibility remain mature-state unless business confirms this as immediate pain.
```

## 6.2 Sampling and Approval Tracker

### Recommended

Move minimal sample approval status into MVP order lifecycle/PCD readiness:

- sample requested,
- sample submitted,
- sample approved,
- wash standard approved,
- PP sample approved.

Keep full sampling workflow as mature-state.

## 6.3 Style Master and Technical File

### Recommended additions

- wash complexity class,
- fashion-effect requirement,
- route family,
- repeat-cycle probability,
- quality checkpoints by route,
- operation bulletin as line-loading input.

## 6.4 Wash Recipe and Batch Execution

### Recommended

Make route and batch planning MVP. Keep detailed chemical/process recipe execution mature-state unless the business confirms recipe control is needed immediately.

---

## 7. Diff for Functional Requirements

Add the following new functional requirements after FR-020.

| Requirement ID | Requirement |
|---|---|
| FR-021 | System shall maintain product complexity class for denim and chino route planning. |
| FR-022 | System shall define MVP scheduling grain across order, style, color/shade-lot, stage, workcenter/line, date/shift, and wash batch. |
| FR-023 | System shall support rule-based impact preview for order cancellation, quantity change, shipment date change, and capacity change. |
| FR-024 | System shall treat wash route, dry/wet step, post-wash QC, and rewash cycle as first-class planning events. |
| FR-025 | System shall capture rewash reason, affected quantity, expected time, capacity impact, and approval status. |
| FR-026 | System shall maintain business-operational capacity definitions by workcenter. |
| FR-027 | System shall distinguish planner-controlled recommendations from automatic system changes. |
| FR-028 | System shall capture upstream milestones for enquiry, quotation, sampling, technical file receipt, and order confirmation. |
| FR-029 | System shall maintain audit trail for boundary-case events and scheduling reaction decisions. |
| FR-030 | System shall support seed scenarios or simulations for cancellation, capacity loss, rewash, and shipment pull-in before full planning-engine rollout. |

---

## 8. Diff for Key Business Rules

Add the following new subsections under Section 38.

## 8.1 Scheduling Grain Rules

```md
- MVP scheduling shall operate at order x style x color/shade-lot x stage x workcenter/line x date/shift grain.
- Wash shall be planned at wash-batch grain.
- Operation-level data shall support SMV, line balance, and technical validation, but full operation-by-operation finite scheduling is outside MVP unless later validated.
```

## 8.2 Boundary-Case Rules

```md
- Order cancellation, quantity change, delivery-date change, capacity change, rewash, QC failure, and shipment pull-in must create a visible system event.
- Each event must show impacted orders, affected capacity, shipment risk, suggested recovery, owner, and approval requirement.
- MVP should recommend and preview impact; it should not automatically reschedule frozen plans without approval.
```

## 8.3 Order Cancellation Rules

| Cancellation Stage | Required System Reaction |
|---|---|
| Before procurement | Release planned capacity, cancel open procurement intent, audit decision |
| After procurement | Flag material liability, review reallocation, update capacity and cost exposure |
| After cutting | Freeze/reclassify cut WIP, require management decision |
| During sewing | Update WIP, capacity, and shipment plan; require planner action |
| During/after wash | Flag finished/semi-finished goods disposition and customer impact |

## 8.4 Capacity Change Rules

```md
- Capacity loss must recalculate available capacity, planned load, bottleneck status, affected orders, and shipment risk.
- Capacity addition through overtime or extra shift must require approval before becoming committed capacity.
- Capacity changes should generate recommended recovery actions, not silently change plan commitments.
```

## 8.5 Rewash / Repeat Cycle Rules

```md
- Rewash must consume planned capacity.
- Rewash must carry reason, affected quantity, approval owner, expected duration, and shipment impact.
- Repeated wash beyond threshold must trigger exception.
- Post-wash QC result must control release to finishing.
```

## 8.6 Automation Boundary Rules

```md
- MVP shall use rule-based impact preview and recommendations.
- Planner or authorized approver shall control plan changes in frozen or firm zones.
- Fully autonomous rescheduling is outside MVP unless validated by the business.
```

---

## 9. Diff for Non-Functional Requirements

Add these NFR rows:

| Category | Requirement |
|---|---|
| Explainability | Planning recommendations must show why the system is recommending a recovery action. |
| Data Freshness | Planning-critical screens must show data source and last update status. |
| Scenario Traceability | Boundary-case outcomes must be traceable to the rule or user decision that caused them. |
| Configurable Complexity | Product route complexity, wash complexity, thresholds, and capacity units must be configurable. |
| Change Governance | Frozen-plan changes, overrides, and conditional releases must require controlled approval and audit. |

---

## 10. Diff for Integration Requirements

Add integration rows:

| Integration Area | Purpose |
|---|---|
| FastReact / Existing Planning Tool | Define replacement, coexistence, import, or export role clearly. |
| Sampling / Approval Records | Upstream milestone visibility and PCD readiness dependency. |
| Wash Route / Recipe Master | Route family, standard cycle, repeat-cycle rules, quality checkpoints. |
| Order Change / Cancellation Source | Capture cancellation, quantity change, and delivery-date change events. |
| Capacity Calendar | Shift, overtime, downtime, absenteeism, and approved capacity changes. |

---

## 11. Diff for Reporting Requirements

Add reports:

| Report | Purpose |
|---|---|
| Scheduling Boundary Case Report | Shows cancellation, capacity change, rewash, and shipment-pull events with system reaction. |
| Wash/Rewash Performance Report | Shows wash queue, route performance, rewash count, rewash reason, and capacity impact. |
| Capacity Change Log | Shows approved and unapproved capacity changes by workcenter. |
| Order Change Impact Report | Shows impact of cancellation, quantity change, and delivery-date change. |
| Planning Rulebook Compliance Report | Shows whether critical releases followed defined scheduling rules. |

---

## 12. Diff for Success Metrics

Add metrics:

| Metric | Target Direction |
|---|---|
| Rewash visibility | 100% of rewash cycles captured with reason, quantity, and capacity impact |
| Boundary-case response | Cancellation, capacity change, and shipment pull-in events have visible owner and action |
| Wash route adherence | Improve adherence to planned wash route and batch sequence |
| Capacity definition completeness | 100% of MVP workcenters have agreed capacity unit, bucket, and recovery levers |
| Rulebook completion | Scheduling Behaviour Rulebook approved before full planning-engine build |
| Recommendation adoption | Track accepted vs rejected recovery recommendations |

---

## 13. Diff for Implementation Roadmap

### Change type

Add a new Phase 0A before current Phase 1.

### New phase

```md
### Phase 0A: Scheduling Behaviour Rulebook and Simulation Validation

Before deep implementation, conduct a focused business workshop and produce:

1. Capacity definition matrix
2. MVP planning grain decision
3. Order cancellation matrix
4. Capacity change matrix
5. Wash/rewash behaviour matrix
6. Shipment risk reaction matrix
7. Planner-control vs system-control boundary
8. Boundary-case seed scenario pack
9. BRD-to-build traceability matrix
```

### Change to Phase 1

Current Phase 1 should remain the ten MVP surfaces, but add a gate:

```md
Do not finalize daily release, workcenter load, or wash planning logic until Phase 0A confirms capacity definitions, wash/rework behaviour, and boundary-case reaction rules.
```

---

## 14. Diff for Risks and Mitigation

Add risk rows:

| Risk | Mitigation |
|---|---|
| Scheduling grain remains ambiguous | Add MVP scheduling grain decision before build. |
| Wash treated only as bottleneck | Reframe wash as value-creation, quality-risk, and capacity domain. |
| Boundary cases are discovered too late | Add Scheduling Behaviour Rulebook and boundary-case test pack. |
| Premature automation creates user distrust | Use rule-based recommendation and planner approval in MVP. |
| Pre-order/quotation scope expands MVP too far | Capture upstream milestones in MVP; defer full costing unless confirmed. |
| Chinos over-modeled as denim | Use product complexity classes and route configuration. |

---

## 15. Diff for Open Decisions

Replace the current ten open decisions with a grouped question set. The existing questions are still useful, but they are too narrow after the new inputs.

### 15.1 Scope and Trigger Questions

1. Was the original business trigger quotation/costing, production scheduling, delivery reliability, FastReact underuse, or all of these?
2. Is the immediate pain before order confirmation, after order confirmation, or both?
3. Are chinos handled in the same flow or a simpler production route?

### 15.2 Current Planning Questions

1. What planning is done in FastReact today?
2. What planning is still done in Excel?
3. Who owns the weekly plan and daily release?
4. What is the current planning grain: order, PO, style/color, batch, line, operation, or shipment?

### 15.3 Wash and Denim Questions

1. What are the main wash route families?
2. How is dry process planned separately from wet wash?
3. How often does rewash occur?
4. What are the main rewash reasons?
5. Who approves rewash?
6. Is drying or post-wash QC a separate bottleneck?

### 15.4 Capacity Questions

1. How is sewing capacity measured?
2. How is wash capacity measured?
3. How is absenteeism reflected?
4. How is overtime approved?
5. How are machine breakdowns captured?
6. Which recovery levers are acceptable by workcenter?

### 15.5 Boundary-Case Questions

1. What happens when an order is cancelled before procurement?
2. What happens after fabric receipt?
3. What happens after cutting?
4. What happens during wash?
5. Should the system automatically reschedule or recommend actions?
6. Who can approve frozen plan changes?

### 15.6 Prototype Confidence Questions

1. What minimum prototype will give the business confidence?
2. Which real orders should be used as seed simulations?
3. Which process should be simulated first: sewing, wash, or shipment risk?
4. Which boundary cases must be proven before committed build?

---

## 16. Recommended Updated BRD Structure

The revised BRD should follow this structure:

```text
1. Executive Summary
2. Business Context
   2.1 Export-Oriented Operating Context
   2.2 End-to-End Garment Flow
   2.3 Denim-Specific Manufacturing Complexity
   2.4 Chinos as Lower-Complexity Variant
3. Reconciled Problem Statement
   3.1 Symptoms Observed
   3.2 Root Cause Behind Symptoms
4. Business Need and Operating Spine
5. Business Objectives and Success Metrics
6. Product Scope and MVP Boundaries
   6.1 Ten MVP Surfaces
   6.2 Upstream Milestone Visibility
   6.3 Out-of-Scope for MVP
7. MVP Scheduling Grain Decision
8. Scheduling Boundary Cases and System Reaction Rules
9. MVP Surface Requirements
10. Mature-State Scope
11. Functional Requirements
12. Business Rules
13. Non-Functional Requirements
14. Integration Requirements
15. Roles and Users
16. Reporting Requirements
17. Implementation Roadmap
   17.1 Phase 0A Scheduling Behaviour Rulebook
   17.2 MVP Foundation
   17.3 Expansion Phases
18. Risks and Mitigation
19. Open Decisions and Workshop Questions
20. Final BRD Summary
```

---

## 17. Highest-Impact Replacement Snippets

These are the snippets most important to copy into the next BRD revision.

### 17.1 Reframed Core Problem

```md
The core problem is not the absence of software. It is the absence of a live, capacity-aware, wash-aware, WIP-trusted, exception-owned operating spine that converts customer demand into executable production control and reacts when factory reality changes.
```

### 17.2 Wash Reframing

```md
Wash/laundry is not a downstream finishing activity. In denim, it is a value-creation, quality-risk, and capacity-constraining production domain where product effect, customer acceptance, WIP ageing, rework, and shipment risk converge.
```

### 17.3 Boundary-Case Requirement

```md
The system must define what happens when orders are cancelled, quantities change, capacity is lost or added, wash repeats, quality fails, shipment dates move, or frozen plans need to change. MVP should provide rule-based impact preview and recommended recovery actions, with planner approval for committed schedule changes.
```

### 17.4 MVP Scheduling Grain

```md
MVP scheduling grain should be order x style x color/shade-lot x production stage x workcenter/line x date/shift, with wash handled at wash-batch grain. Operation-level detail should support technical validation and line balance, but full operation-by-operation finite scheduling is outside MVP unless validated as necessary.
```

### 17.5 Phase 0A Gate

```md
Before deep planning-engine implementation, the business and solution team must produce a Scheduling Behaviour Rulebook covering capacity definitions, planning grain, cancellation handling, capacity-change handling, wash/rewash behaviour, shipment-risk reaction, recovery actions, and approval boundaries.
```

---

## 18. Final Recommendation

Do not rewrite the BRD as a completely new product. The current BRD is directionally strong.

The correct action is to refine it into a more business-consensus-ready BRD by:

1. strengthening the business narrative,
2. making denim wash complexity explicit,
3. defining scheduling grain,
4. adding boundary-case system behavior,
5. adding Phase 0A Scheduling Behaviour Rulebook,
6. clarifying pre-order milestone visibility vs full costing scope,
7. and expanding open questions for Rajesh/business validation.

The refined BRD should communicate one clear position:

```text
Build a governed denim-aware operating spine, not just a scheduling screen.
```
