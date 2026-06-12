# Eratex Planning Zones, Due-Date Promising, and CCR Allocation Implementation Plan

**Purpose:** Extend the due-date quotation evaluation with the planning-zone concept from the Eratex deck, and define how zone visibility, order lifecycle impact, product-route scenarios, and capacity-constrained resource priority logic should be implemented.  
**Date:** 2026-06-11  
**Scope:** Current repo state through EOS-05, plus proposed roadmap for delivery promising and later wash-heavy planning.  

---

## 1. Executive Position

The current codebase has a simple planning-zone model, but it is not yet the zone-governed operating model described in the Eratex deck.

Current code:

- Has `FROZEN_ZONE`, `FIRM_ZONE`, and `FLEXIBLE_ZONE`.
- Assigns a zone from the **planned work item date** relative to today.
- Uses the zone mainly to decide whether approval is required for changes.
- Shows the zone on planned work items and impact preview.

Deck/research concept:

- Uses horizon-based zones before ex-factory date:
  - Future/free zone.
  - Volatile zone.
  - Firm zone.
  - Frozen/execution control, implied by freeze governance.
- Uses zones to control:
  - Due-date quotation.
  - Projection capacity blocking.
  - Confirmation follow-up.
  - Capacity reservation hardness.
  - Plan lock.
  - T&A milestone lock.
  - Line/sub-CCR allocation.
  - Change governance.
  - Priority and rescheduling rights.

The current implementation is therefore a useful seed, not the finished concept.

The structural change required is to separate:

```text
order lifecycle stage = where the order physically/process-wise is
planning zone = how close the order is to ex-factory and how governed changes are
capacity reservation state = whether capacity is tentative, soft, firm, or released
```

Today, only the first part is partially represented on `ProductionOrder`, and zone is represented only on `PlannedWorkItem`.

---

## 2. Planning-Zone Concept From The Deck

The Eratex presentation and synthesis describe a horizon before ex-factory date, not just a weekly production board.

### 2.1 Future / Free Zone

Purpose:

- Predict a reliable delivery week before final order commitment.
- Avoid quoting dates that overload critical resources.
- Block tentative capacity for projections or enquiries.

Expected operations:

- Run due-date quotation.
- Check load across critical resources and sub-CCRs.
- Suggest feasible delivery week/date.
- Hold provisional capacity when needed.
- Track projection expiry.
- Trigger merchandising follow-up for confirmation.

Governance:

- Exact line and machine assignments are not locked.
- Capacity block is tentative or projection-based.
- Projection capacity must expire or be converted to confirmed.
- Missing SMV, route, wash route, or critical planning attributes should block reliable quotation.

### 2.2 Volatile Zone

Purpose:

- Convert uncertain demand into confirmed orders.
- Allow controlled changes before firm lock.

Expected operations:

- Projection confirmation.
- Order date/quantity revisions.
- Strategic customer prioritization.
- Procurement trigger review.
- T&A/TMS/WAS workflow start.
- Recalculate capacity after every confirmed change.
- Compare revised load against previous load.

Governance:

- Changes are allowed but must be reason-coded.
- Capacity reservations are stronger than future-zone projections but still movable.
- Strategic pull-ins require impact preview.
- Projection expiry or non-confirmation releases capacity.

### 2.3 Firm Zone

Purpose:

- Stop routine replanning.
- Convert the order into a protected execution commitment.

Locked objects:

- Committed ex-factory or delivery date.
- Planned Cut Date.
- Full Kit Date.
- Sewing start and end date.
- Sewing line/sub-CCR allocation.
- Critical route.
- Laundry route and machine group.
- Capacity reservation.
- Standard production lead-time buffer.
- T&A/TMS/WAS milestone obligations.

Governance:

- Changes require impact preview, reason, and approval.
- Missing readiness data blocks firm release.
- The order should have fixed due dates before entering execution.

### 2.4 Frozen / Execution Zone

The deck emphasizes frozen-plan behavior even when it does not always name it as a separate zone.

Purpose:

- Protect near-term execution.
- Prevent every delay from triggering replanning.
- Absorb minor delays through execution control and recovery actions.

Governance:

- Routine manual reshuffling is blocked.
- Change requires approved boundary-case control.
- Released production and active execution should not be displaced by future or volatile demand.

---

## 3. Current Codebase Evaluation

### 3.1 Implemented Today

Relevant files:

- `backend/apps/planning/models.py`
- `backend/apps/planning/services/zones.py`
- `backend/apps/planning/services/planning.py`
- `backend/apps/planning/api.py`
- `frontend/src/features/operations/Eos04Pages.tsx`
- `frontend/src/types/domain.ts`

Current zone codes:

```text
FROZEN_ZONE
FIRM_ZONE
FLEXIBLE_ZONE
```

Default windows:

```text
FROZEN_ZONE: 0 to 1 days from today
FIRM_ZONE: 2 to 6 days from today
FLEXIBLE_ZONE: 7 to 365 days from today
```

Current behavior:

- `assign_planning_zone(planned_date)` calculates a zone from the planned start date.
- `assign_work_item` stores `planning_zone` on `PlannedWorkItem`.
- `calculate_plan_impact` returns the zone plus approval requirement.
- Weekly planning UI shows the zone for a planned item.
- Frozen and firm zone changes require stronger governance.
- External plan validation detects frozen-zone conflicts.

### 3.2 Gap Against Deck Concept

| Deck expectation | Current implementation | Gap |
|---|---|---|
| Future/free zone for due quotation | No explicit future/free zone. `FLEXIBLE_ZONE` is generic. | Needs distinct quote/projection zone. |
| Volatile zone for confirmation and controlled reshuffling | Missing. | Needs own zone and governance policy. |
| Firm zone based on days to ex-factory | Zone is based on planned work item date. | Need order-level zone anchored to ex-factory date. |
| Zone visibility on order lifecycle | Zone is not on `ProductionOrder`. | Need order-level planning zone or derived zone view. |
| Capacity reservation hardness by zone | Missing. | Need tentative/soft/firm/locked capacity reservation states. |
| Projection expiry | Missing. | Need expiry and release logic for future/free zone reservations. |
| Route/sub-CCR based load | Partially through workcenter and line, but no sub-CCR route allocation. | Need route-stage resource requirements and sub-CCR capability. |
| Due-date quote by zone | Missing. | Delivery promising module must assign zone and reservation type. |
| Zone transition events | Missing. | Need audit trail and automatic trigger hooks. |
| T&A lock by zone | Partially in research, not code. | Need milestone baseline/lock policy. |

### 3.3 The Key Design Gap

The current code asks:

```text
What zone is this planned work item date in?
```

The deck requires:

```text
What operating zone is this order in relative to ex-factory, and what does that permit?
```

Those are not the same question.

---

## 4. Structural Changes Required

### 4.1 Add Order-Level Planning Zone

`ProductionOrder` currently has lifecycle stage, risk, status, planned ship date, committed ship date, and PCD date. It does not have an order-level planning zone.

Recommended model:

```text
OrderPlanningState
```

Suggested fields:

- `order`
- `zone_code`
- `zone_entered_at`
- `zone_anchor_date`
- `days_to_anchor`
- `anchor_type`: ex_factory, committed_ship, planned_ship, sewing_start, custom
- `commitment_state`: projection, quoted, confirmed, firm_locked, released, completed
- `capacity_reservation_state`: none, tentative, soft_reserved, firm_reserved, locked, released
- `quote_reference`
- `current_promise_date`
- `latest_recalculated_date`
- `zone_policy_snapshot`
- `created_by`, `updated_by`

Why a separate model:

- Avoid bloating `ProductionOrder`.
- Preserve Datatex as canonical order source.
- Keep planning-specific derived status separate from commercial truth.
- Allow audit of zone transitions.

### 4.2 Expand Zone Codes

The existing enum is too narrow.

Recommended zone codes:

```text
FUTURE_ZONE
VOLATILE_ZONE
FIRM_ZONE
FROZEN_ZONE
EXECUTION_ZONE
```

If the product team wants the deck vocabulary exactly, `FUTURE_ZONE` can be displayed as "Free Zone" or "Future / Free Zone". Avoid overloading the current `FLEXIBLE_ZONE`, because volatile and future/free have different governance.

### 4.3 Make Zone Configuration Policy-Rich

Current `PlanningZoneConfiguration` has:

- start/end days
- approval required
- auto reschedule allowed

Needed additions:

- `anchor_type`
- `display_sequence`
- `capacity_reservation_policy`
- `line_lock_required`
- `sub_ccr_lock_required`
- `tna_baseline_lock_required`
- `date_change_approval_required`
- `quantity_change_approval_required`
- `projection_expiry_days`
- `quote_confidence_required`
- `allow_capacity_displacement`
- `allow_priority_override`
- `requires_reason_code`
- `visible_on_order_board`

This turns zone configuration from a date label into a governance engine.

### 4.4 Create Zone Transition Service

Recommended service:

```text
apps.planning.services.zone_transitions
```

Responsibilities:

- Recalculate order zone daily or on order date change.
- Detect zone entry and exit.
- Create `ZoneTransitionEvent`.
- Apply lock policy when entering firm/frozen.
- Release or renew projection capacity when future/free reservation expires.
- Trigger T&A/TMS/WAS milestone baseline locks.
- Notify relevant owners.

Example transitions:

```text
FUTURE_ZONE -> VOLATILE_ZONE
VOLATILE_ZONE -> FIRM_ZONE
FIRM_ZONE -> FROZEN_ZONE
FROZEN_ZONE -> EXECUTION_ZONE
```

### 4.5 Add Capacity Reservation State

The due-date quotation document already identified the missing allocation ledger. Zone logic makes it more important.

Recommended model:

```text
CapacityReservation
```

Suggested fields:

- `reservation_no`
- `source_type`: quote, projection, confirmed_order, firm_plan, release
- `source_id`
- `order`
- `workcenter`
- `line`
- `resource_group`
- `sub_ccr`
- `capacity_date`
- `shift`
- `reserved_minutes`
- `reserved_quantity`
- `reservation_state`: tentative, soft_reserved, firm_reserved, locked, consumed, released, expired
- `zone_code`
- `expiry_at`
- `priority_score`
- `displaceable`
- `reason_code`

This model should sit beside the proposed `CapacityAllocationBucket`.

The distinction:

- `CapacityAllocationBucket` tells how much capacity exists and is consumed.
- `CapacityReservation` tells who is holding capacity and how hard that hold is.

### 4.6 Add Route-Based Resource Requirements

Due-date promising and CCR allocation cannot rely only on workcenter-level planning.

Recommended model:

```text
ProductionRouteVersion
RouteStageRequirement
RouteResourceRequirement
```

For sewing:

- Link route requirement to style operation bulletin.
- Use total SMV and line/sub-CCR compatibility.
- Map product tech pack/style to sewing sub-CCR groups such as AMEO Basic, GU Basic, Chino, Cargo, Jacket.

For wash later:

- Link route requirement to wash route version.
- Use dry/wet process steps.
- Map to machine groups such as Tonello, Tolkar, Brongo, Yilmax, Ramson, Laser, Vaportech, Dryer, QC.

This supports the deck's principle:

```text
Do not load the order against generic department capacity if it can run only on specific sub-resources.
```

### 4.7 Add Sub-CCR Capability Master

Current code has workcenters and lines, but not the deck's sub-CCR concept as a formal planning dimension.

Recommended model:

```text
CriticalResourceGroup
CriticalResourceCapability
```

Suggested fields:

- Resource group code.
- Resource group type: sewing, wash, finishing, packing.
- Product group applicability.
- Customer/buyer applicability.
- Style family applicability.
- Machine/line membership.
- Efficiency profile.
- Planning capacity unit.
- Changeover family.
- Active status.

Examples:

- `SEW_AMEO_BASIC`
- `SEW_GU_BASIC`
- `SEW_CHINO`
- `WASH_TONELLO_125`
- `WASH_TOLKAR_100`
- `WASH_LASER`
- `WASH_VAPORTECH`

---

## 5. Visibility Changes Required In UI

### 5.1 Order Lifecycle Explorer

Add a planning-zone panel:

- Current lifecycle stage.
- Current planning zone.
- Days to ex-factory.
- Commitment state.
- Promise date.
- Reservation state.
- Zone entry date.
- Next zone transition date.
- Locked objects.
- Allowed actions.

Important distinction:

```text
Lifecycle stage = PCD pending, cutting, sewing, washing, finishing.
Planning zone = future/free, volatile, firm, frozen/execution.
```

An order can be in `PCD_PENDING` and `FIRM_ZONE`. That is a problem signal, not a contradiction.

### 5.2 Due-Date Quotation Workbench

Add zone output to every quote:

- Requested delivery week.
- Recommended delivery week/date.
- Resulting zone.
- Capacity block type.
- Expiry date if projection.
- Resources loaded by sub-CCR.
- Confidence.
- Missing data blockers.

### 5.3 Weekly Planning Workbench

Enhance current impact preview:

- Show order-level zone, not only work-item zone.
- Show reservation hardness.
- Show whether the order can be displaced.
- Show if assignment conflicts with zone lock.
- Show zone transition alerts.

### 5.4 Workcenter Load Monitor

Split load by reservation state:

- Released/execution load.
- Firm reserved load.
- Confirmed volatile load.
- Future/free projection load.
- Available capacity.
- Overload and underload by sub-CCR.

### 5.5 Zone Control Board

New UI surface:

```text
/planning/zones
```

Purpose:

- See all orders by zone.
- Show upcoming zone transitions.
- Show projection expiries.
- Show firm-zone entry blockers.
- Show T&A locks due.
- Show capacity reservations by hardness.

---

## 6. Impact On Order Lifecycle Thinking

The current order lifecycle is mostly process-state based:

```text
CREATED
PRE_PRODUCTION
PCD_PENDING
PCD_READY
CUTTING
SEWING
WASHING
FINISHING
PACKING
SHIPMENT_READY
SHIPPED
```

This remains valid, but it is not enough for planning governance.

### 6.1 New Mental Model

Every order should carry three independent dimensions:

| Dimension | Meaning | Example |
|---|---|---|
| Lifecycle stage | Physical/process progress | `PCD_PENDING`, `SEWING`, `WASHING` |
| Planning zone | Time/governance distance from ex-factory | `VOLATILE_ZONE`, `FIRM_ZONE` |
| Capacity reservation state | How hard capacity is committed | `TENTATIVE`, `SOFT_RESERVED`, `FIRM_RESERVED`, `LOCKED` |

### 6.2 Why This Matters

An order in the current system can look acceptable because its lifecycle is not delayed. But if it is in the firm zone with missing readiness, it is already a risk.

Examples:

| Lifecycle stage | Planning zone | Meaning |
|---|---|---|
| `CREATED` | `FUTURE_ZONE` | Enquiry/projection can be quoted and tentatively reserved. |
| `PRE_PRODUCTION` | `VOLATILE_ZONE` | Confirmation and T&A follow-up need active control. |
| `PCD_PENDING` | `FIRM_ZONE` | High risk: firm-zone lock is near but readiness is incomplete. |
| `PCD_READY` | `FIRM_ZONE` | Good: ready to convert to protected plan. |
| `CUTTING` | `FROZEN_ZONE` | Execution control, not routine replanning. |
| `SEWING` | `EXECUTION_ZONE` | Live output drives ETA and recovery. |
| `SEWN_WAITING_WASH` | `FROZEN_ZONE` | Wash bottleneck risk must be visible when wash module exists. |

### 6.3 Governance Effects

When zone is added, order actions change:

- Future/free:
  - Quote date.
  - Create tentative reservation.
  - Expire projection.
  - No firm line lock.
- Volatile:
  - Confirm/revise order.
  - Recalculate capacity.
  - Reason-code changes.
  - Start workflow/T&A.
- Firm:
  - Lock PCD/FKD/sewing start/end.
  - Lock sub-CCR and route.
  - Require approval for date/quantity/route changes.
  - Block release if readiness is missing.
- Frozen/execution:
  - Protect released work.
  - Route exceptions through boundary-case governance.
  - Use recovery actions rather than routine rescheduling.

---

## 7. Due-Date Promising With Product Tech Pack Routes

Once due-date quotation is built, scenario testing should absolutely include product tech packs with route-specific sewing and later wash requirements.

### 7.1 What A Tech Pack Must Contribute

For promising, a tech pack or style technical record must provide:

- Product group.
- Style/customer/buyer.
- Garment SAM/SMV.
- Approved operation bulletin.
- Sewing route.
- Required machine types.
- Critical operations.
- Line/sub-CCR compatibility.
- Wash code and wash route, when available.
- Special processes: embroidery, print, dry process, wet process, finishing.
- Quality or buyer restrictions.

### 7.2 Sewing Route Scenario

Example:

```text
Style: AMEO Basic denim bottom
Quantity: 7,353 pieces
Garment SAM: 27.2 minutes
Eligible sub-CCR: AMEO Basic
Capacity: 3 lines x 16 hours x 48 people x 72% efficiency
```

The quote engine should:

- Identify eligible sub-CCR.
- Calculate total sewing load.
- Find free capacity across eligible lines.
- Allocate load across days.
- Return possible sewing start and sewing end.
- Return sewn handoff date.
- Show whether the requested week is feasible.

### 7.3 Wash Route Scenario Later

Example:

```text
Route: Laser DP1 -> Wash 1 -> Wash 2 -> Laser DP2 -> Drying -> QC
Resources: Laser machine, Tonello 125 kg, dryer/QC
Load basis: piece-based for laser, lot-based for wet wash
```

The quote engine should:

- Convert pieces to lots where applicable.
- Calculate dry process minutes.
- Calculate wet wash machine hours.
- Calculate drying and QC load.
- Validate machine compatibility.
- Apply rewash reserve.
- Return wash completion date and risk.

This matches the deck's point that laundry has both piece-based dry processes and lot-based wet processes, causing shifting bottlenecks.

---

## 8. Capacity Allocation Priority Logic

Capacity allocation should be based on capacity-constrained resource planning principles.

### 8.1 Core Principles

1. Identify the constraint resource.
2. Load the bottleneck first.
3. Do not allow the bottleneck to starve.
4. Minimize changeover at the bottleneck.
5. Protect committed ex-factory dates.
6. Use buffers to absorb variability.
7. Let non-bottleneck resources subordinate to the constraint.
8. Escalate only when buffer penetration or zone policy requires it.

### 8.2 Priority Stack By Zone

Recommended default priority:

| Priority | Demand type | Capacity behavior |
|---:|---|---|
| 1 | Released/execution work | Cannot be displaced except approved emergency. |
| 2 | Firm-zone locked orders | Hard reservation; change requires approval. |
| 3 | Confirmed volatile-zone orders | Soft/hard hybrid; can be re-optimized with reason. |
| 4 | Strategic future/free projections | Tentative reservation with expiry and priority flag. |
| 5 | Normal future/free projections | Tentative reservation; displaced first. |
| 6 | Unconfirmed low-confidence demand | No capacity hold or only simulated hold. |

### 8.3 Priority Score

Start with deterministic scoring, not black-box optimization.

Suggested scoring factors:

```text
priority_score =
  zone_weight
+ commitment_weight
+ customer_priority_weight
+ due_date_urgency_weight
+ buffer_penetration_weight
+ readiness_weight
+ constraint_route_weight
+ setup_family_bonus
- missing_data_penalty
- displacement_penalty
```

Practical examples:

- A firm-zone order with PCD ready and high buffer penetration outranks a future projection.
- A volatile strategic customer can displace normal future/free projection capacity, but not firm locked capacity.
- A future/free order with missing route or SMV gets a low-confidence quote and no hard reservation.
- A wash-heavy order should not be promised if the sewing sub-CCR is free but the wash CCR is overloaded.

### 8.4 Setup And Changeover Logic

For bottleneck resources, priority should not be only due-date order. The scheduler should also consider setup families.

Examples:

- Same CMT or wash family on the same machine group.
- Same wash route or compatible wash recipe.
- Same customer/product family on a sewing sub-CCR.
- Same color/shade lot for wash grouping, where allowed.

This supports the deck's principles:

- Bottlenecks should not starve.
- CMT changes within a shift should be minimized.
- Ex-factory priorities must still be adhered to.

### 8.5 Buffer Logic

Each quote should maintain:

- Time buffer to ex-factory.
- CCR capacity buffer.
- Rework/rewash reserve.
- Execution recovery buffer.

Risk should be driven by buffer penetration:

| Buffer state | Interpretation |
|---|---|
| Green | Promise can absorb normal variation. |
| Yellow | Promise feasible but needs monitoring. |
| Red | Promise feasible only with recovery action. |
| Black | Promise is not reliable or already breached. |

---

## 9. Scenario Test Design

The due-date promising module should include scenario tests using product routes, pipeline load percentages, and zone priority behavior.

### 9.1 Sewing-Only MVP Scenarios

| Scenario | Existing load | Zone | Expected result |
|---|---:|---|---|
| Basic future quote | 60% | Future/free | Requested week feasible; tentative capacity block created. |
| Future quote near constraint | 85% | Future/free | Requested week feasible with watch risk; alternate week shown. |
| Overloaded requested week | 110% | Future/free | Requested week infeasible; suggested alternate week. |
| Volatile quantity increase | 90% | Volatile | Recalculate; reason code required; may consume remaining soft capacity. |
| Strategic pull-in | 95% | Volatile | Impact preview shows displaced future/free capacity. |
| Firm order date change | 95% | Firm | Approval required; impact on other firm orders visible. |
| Frozen capacity loss | 100% | Frozen/execution | Boundary-case workflow; no automatic displacement. |
| Active sewing shortfall | 90% | Execution | Promise recalculated from net-good output trend. |

### 9.2 Route Compatibility Scenarios

| Scenario | Purpose |
|---|---|
| AMEO Basic route | Prove order loads only AMEO Basic sub-CCR lines. |
| GU Basic route | Prove different sub-CCR and capacity pool. |
| Chino route | Prove product group changes resource eligibility. |
| High-SMV style | Prove load expands and quote date moves. |
| Machine-gap style | Prove line compatibility can block a quote. |
| Missing operation bulletin | Prove low-confidence or blocked quote. |
| Same requested date, different routes | Prove CCR-specific capacity impact differs. |

### 9.3 Wash-Later Scenarios

| Scenario | Purpose |
|---|---|
| Laser + Tonello route | Piece-based dry process plus wet batch process. |
| Acid/moon wash route | Specialized machine group and route risk. |
| Dryer bottleneck | Wet wash feasible but drying delays completion. |
| Rewash reserve high | Promise shifts because expected repeat wash consumes capacity. |
| Machine incompatibility | Quote blocked for wrong machine group. |
| Wash route missing | Sewing handoff quote possible, full ex-factory quote blocked. |

### 9.4 Priority And Displacement Scenarios

| Scenario | Expected behavior |
|---|---|
| Firm order vs future projection | Firm order keeps capacity; future projection displaced or re-quoted. |
| Strategic volatile vs normal future | Strategic order can take tentative future capacity with audit. |
| Two firm orders same CCR | Earliest due date and buffer penetration decide priority. |
| Future projection expires | Capacity released automatically. |
| Confirmed projection enters volatile | Capacity changes from tentative to soft/confirmed. |
| Firm-zone entry with missing readiness | Lock blocked; exception created. |

---

## 10. Implementation Roadmap

### ZP-0 - Specification Alignment

Add explicit requirements:

- Order-level zone.
- Future/free and volatile zones.
- Capacity reservation state.
- Zone transition events.
- Due-date quotation governed by zone.
- CCR/sub-CCR resource loading.

### ZP-1 - Zone Model Expansion

Backend:

- Add `OrderPlanningState`.
- Add richer zone codes.
- Extend `PlanningZoneConfiguration`.
- Add `ZoneTransitionEvent`.
- Add zone recalculation service.

Frontend:

- Extend domain types.
- Show order zone on order cards, order detail, weekly planning, and workcenter load.

### ZP-2 - Capacity Reservation Ledger

Backend:

- Add `CapacityAllocationBucket`.
- Add `CapacityReservation`.
- Split committed, reserved, tentative, and available capacity.
- Connect reservations to quote scenarios and planned work items.

Frontend:

- Workcenter load monitor splits load by reservation state.
- Due-date quotation result shows capacity block type and expiry.

### ZP-3 - Sewing Route Promising

Backend:

- Add delivery promising app/service.
- Resolve sewing route from operation bulletin.
- Resolve eligible lines/sub-CCR.
- Search capacity forward.
- Return sewn handoff promise.

Frontend:

- Build due-date quotation UI using the enquiry/costing prototype as source.

### ZP-4 - Priority And Scenario Tests

Backend:

- Implement deterministic priority score.
- Add displacement rules.
- Add route compatibility tests.
- Add zone transition and reservation expiry tests.

Frontend:

- Add scenario comparison panel.
- Show why a quote moved or why a requested week failed.

### ZP-5 - Wash And Full Ex-Factory Promise

After wash and finishing execution are built:

- Add wash route requirements to promising.
- Add wash machine group constraints.
- Add dryer/hydro/QC constraints.
- Add finishing and packing readiness constraints.
- Extend quote scope from sewing handoff to full ex-factory.

---

## 11. Recommended First Implementation Slice

The first build should not try to solve full ex-factory promising. It should implement:

1. Order-level planning zone state.
2. Future/free, volatile, firm, frozen zone codes.
3. Capacity reservation states.
4. Sewing handoff quote using operation bulletin SMV and eligible sewing sub-CCR.
5. Zone-aware priority rules.
6. Scenario tests for 60%, 85%, 100%, and 110% load conditions.

This gives Eratex visible value:

- Orders are not just "PCD pending" or "sewing"; they are also "future", "volatile", "firm", or "frozen".
- Quoted dates are connected to capacity reality.
- Projection capacity can expire.
- Firm-zone changes become governed.
- Sewing handoff can be promised with clear confidence.
- Wash can be added later using the same route/resource/reservation architecture.

---

## 12. Final Assessment

Zone visibility should not be implemented as a cosmetic chip on the weekly board. It should become a planning governance layer.

The current code already has the start of this idea, but it is too narrow:

- It has three zones only.
- It calculates zone from planned work item date.
- It does not track order-level zone.
- It does not manage capacity reservation hardness.
- It does not drive due-date quotation.

The correct direction is to make zones govern how orders move from projection to confirmation to firm lock to execution, while the due-date promising engine uses product routes and current load to decide what date can be safely promised.

Capacity allocation should follow CCR principles: load the bottleneck first, protect firm commitments, avoid starving constraints, minimize setup churn, and make displacement rules explicit. Product tech pack routes are essential because a style can only consume the capacity it is actually eligible to run on. The same architecture can support sewing first and wash later.

