# Eratex Process Flow Synthesis

**Source workbook:** `docs/research/Process flows.xlsx`  
**Prepared:** 2026-06-14  
**Extraction method:** workbook cell extraction, native Excel drawing/shape text extraction, and rendered-sheet review.

## 1. Executive Synthesis

The workbook defines the operating flow from customer order and technical inputs through pre-production readiness, full-kit readiness, planned cut readiness, and laundry route execution. It is not a single linear flow. It is a set of parallel control lanes that converge at key production gates:

1. **Order / customer commitment:** Actual customer PO, tech pack, order date, customer-specific accessories, and buyer-specific sample rules start the workflow.
2. **Material readiness:** Fabric, sewing trims, finishing trims, and packing trims progress independently, each with its own PO-release, vendor, in-house, and timing rules.
3. **Sample and approval readiness:** Fit, wash, PP sample, garment test sample, pre-shipment sample, pilot, chemical, jungle, shade, and fabric tests create approval gates. Failed gates trigger rework or additional checks.
4. **Fabric QC, shrinkage, and shade control:** Fabric in-house is not enough for cutting. Warehouse, shrinkage, shade grouping, inspection, washing/shrinkage checks, FIR release, and trial decisions determine whether fabric can be released to cutting.
5. **Production release:** Full Kit Date, Planned Cut Date, Work Order Release, pilot approval, shade-group work orders, and cutting planner handoff are the production-control convergence points.
6. **Laundry execution:** Laundry is represented as a route with receiving, barcode scan, dry process, lot making, washing, hydro, drying, process controls, QC, and dispatch. This supports the Eratex design principle that wash/laundry is a first-class operating constraint, not a simple downstream status.

The main design implication is that Eratex needs a readiness workflow that can track many small prerequisite events, approval loops, and buyer-specific variants before a production plan can be treated as feasible. FKD and PCD should therefore be derived from live gate status, not manually treated as standalone dates.

## 2. Workbook Views

| Sheet | Role in the process model | Main lanes / controls |
|---|---|---|
| `Merchandising (AMEO)` | AMEO-specific merchandising and readiness flow, version 1. | Fabric, sample, sewing trims, finishing trims, packing trims, full kit date. |
| `Merchandising (GU&UNQ)` | GU/UNQ-specific merchandising and readiness flow, version 2. | More detailed sample, test, accessories, and buyer-specific bulk-test logic. |
| `Pre Production Activity Flow V3` | Fabric in-house to shrinkage, shade, fabric QC, pilot, work order, and cutting-planner readiness. | Warehouse, shrinkage team, fabric QC, sample washing, pilot production, MD, sampling. |
| `Laundry Pradeep` | Laundry route-level execution sequence. | Barcode receipt, DP, wash, hydro, drying, ozone, process controls, QC, dispatch. |

## 3. End-To-End Flow

### 3.1 Customer Order And Technical Trigger

The flow starts from actual customer PO and, for the GU/UNQ variant, the tech pack. These create the demand signal that drives fabric, trims, sample, and approval work. The AMEO sheet also records that fabric is platformed at the fabric mill and that bulk fabric is expected to be close to sample yardage.

Key source objects:

- Actual Customer PO.
- Order Date.
- Tech Pack.
- Customer PO-linked accessories.
- Folding instruction / customer approval.
- Full Kit Date.
- Planned Cut Date.

### 3.2 Fabric Readiness

Fabric readiness has a planned vendor path and a physical readiness path.

The planned path is:

```text
PO Release to Vendor
-> Fabric Ex-mill Date
-> Ex-mill on-time decision
-> Fabric ETD
-> ETD on-time decision
-> Fabric ETA
-> Fabric In House
```

If the ex-mill or ETD decision is delayed, the workbook points to reworking the TnA rather than treating the date miss as a passive exception.

Additional fabric controls vary by customer:

- AMEO notes that fabric is platformed at the mill and bulk fabric should be close to sample yardage.
- GU/UNQ adds a bulk fabric test requirement: fabric test for every 30,000 yards, with sample for bulk.
- The pre-production flow adds warehouse unloading, head-end cutting for rolls, shrinkage, shade grouping, and cutting-planner handoff after fabric is physically received.

### 3.3 Sample And Approval Readiness

Sample readiness is a parallel lane that proves fit, wash, construction, shade, and customer acceptance before production is released.

AMEO version 1 includes:

```text
Book Sample Yardage
-> Fit Sample
-> Fit sample approval
-> Wash range approval
-> Wash sample approval
-> Preproduction sample (PP Sample)
-> PP sample approval
-> Garment Test Sample
-> Garment sample approval
-> Pilot Production
-> TOP / Shipment Sample
-> Production Sample (JSS)
```

GU/UNQ version 2 is more detailed:

```text
Tech Pack
-> Book PSS / Sample Yardage
-> Each Color Sample for wash and fit
-> EC sample approval
-> Pre APP / 2nd Fit sample if fit fails
-> Fabric Test
-> Chemical Test
-> Preproduction sample (PP Sample)
-> PP sample approval
-> Garment Test Sample
-> Garment sample approval
-> Production Sample decision
```

The important pattern is that sample approvals are not a single milestone. Fit, wash, fabric, chemical, PP, garment, and production sample approvals are separate gates, and failed gates must loop to corrective activity.

### 3.4 Trims And Packing Readiness

The merchandising maps treat trims as separate readiness lanes, not as one generic material status.

Sewing trims:

- PO release to vendor when SBD is not required.
- PO release to vendor for items requiring SBD.
- Sewing trims in house.
- Work Order Release.

GU/UNQ adds a nominated-vendor decision and sample trim testing:

```text
Book Sample Trims
-> Nominated vendor?
-> Get chemical / jungle test results from vendor
-> Chemical test
-> Jungle test
-> Chemical / jungle approval
-> Sewing trims in house
```

Finishing trims:

- Hang tag / size seal PO release.
- Hang tags / size seal in house.

Packing trims:

- Folding instruction sheet from customer.
- Packing PO release.
- Packing in house.

Timing notes in the workbook:

- Tags: 3 weeks before ex-factory.
- Packing: 2 weeks before ex-factory.
- AMEO note: packing material can be ordered after pilot is complete.
- Hang tags and packing need to arrive based on agreed timelines.

### 3.5 Full Kit And Release Convergence

The workbook shows Full Kit Date as the convergence of fabric, samples, trims, finishing trims, and packing trims. It also shows Work Order Release near sewing trim readiness, which means production cannot be released only because fabric has arrived.

Full kit should be interpreted as the point where the following are simultaneously true:

- Fabric is in house and cleared through required QC, shrinkage, and shade gates.
- Required samples and approvals have passed.
- Sewing trims are in house or governed as ready.
- Finishing trims and packing trims are released and timed to ex-factory need.
- Customer-specific documents, such as folding instructions, are available.
- Work order can be released without unresolved readiness blockers.

## 4. Pre-Production Fabric Control

The `Pre Production Activity Flow V3` sheet expands the fabric-in-house stage into operational controls before planned cutting.

### 4.1 Warehouse And Shrinkage Preparation

```text
Fabric Inhouse Date
-> WH unloading process
-> Cut head end for all rolls
-> 1 yard cut into two parts
-> Relax shrinkage
-> Marking shrinkage by machine
-> Shrinkage measuring
-> Shrinkage grouping
-> Number of cutting patterns by shrinkage group
-> Shared to cutting planner
```

If shrinkage grouping fails, the flow calls for additional fabric per shade group for the leg panel. This is a production-risk signal because it can change marker, cut planning, and material availability.

### 4.2 Fabric QC And Shade Logic

The fabric QC lane includes progressive inspection escalation:

```text
10% inspection
-> additional 10% inspection if failed
-> 100% inspection if still failed
```

The sheet then moves into blanket and shade controls:

- 0.3 yard received.
- Making blanket.
- Blanket shade grouping.
- Shade approval.
- Washing blanket / leg panel.
- Washing shrinkage.
- Compare shade blanket with shrinkage washed using revised recipe.
- Garment dye decision.
- Other color shade grouping.
- Identify groups outside range.
- QA Review and FIR Release.

The workbook notes a decision around whether a trial is required and whether a trial is doable. The right owner appears to be PPIC for trial requirement and trial feasibility, with QA owning approval for bulk cutting.

### 4.3 Pilot And Work Order

Pilot production is a formal readiness proof, not just a sample activity.

```text
Pilot Marker
-> Pilot Cut Plan
-> MD Approval
-> MR
-> Pilot relaxation
-> Pilot cut
-> Pilot sewing
-> Pilot laundry
-> Pilot measuring and checks before and after ironing
-> Pilot Approval
-> OK for production from pilot
-> Raise Work Order per shade group
```

If the pilot is not approved, the process remains blocked or must loop for correction. Once approved, work orders are raised by shade group, which implies that shade and shrinkage grouping must be explicit production attributes.

## 5. Laundry Execution Flow

The `Laundry Pradeep` sheet defines a route-style laundry process:

```text
Receiving and Scan Barcode
-> DP 1
-> Lot Making
-> Wash 1
-> Tag removal
-> Hydro
-> Dry Mactec
-> Drying
-> Process Control 1
-> DP 2
-> Process Control 2
-> Wash 2
-> Hydro
-> Dry Mactec
-> Drying
-> QC
-> Dispatch
```

The sheet also includes ozone points, acid wash, and process-control markers. The exact meaning of labels such as `A`, `B`, `C`, `D`, `E`, `F1`, `F2`, `G`, `H`, `I`, `J1`, `J2`, `Z1`, `Z2`, `Z3`, `PC1`, `PC2`, and `T` is not documented in the workbook, but visually they appear to identify route variants, control points, or reusable branch connectors.

Design implication: laundry needs a configurable route-step model with wet/dry process steps, machine/workcenter compatibility, process-control gates, barcode lot traceability, QC release, and dispatch handoff. A single `wash complete` field would lose the operational structure shown in the workbook.

## 6. Control Gates And Failure Loops

| Gate | Workbook evidence | System meaning |
|---|---|---|
| Ex-mill on time | Fabric lane decision | Delay requires TnA rework and ETA risk update. |
| ETD on time | Fabric lane decision | Delay requires shipment and production readiness impact review. |
| Fit / wash / EC sample approval | Sample lane decisions | Failed wash and failed fit must branch differently. |
| Fabric / chemical / jungle test approval | GU/UNQ sample and trim lanes | Test result capture must be structured and vendor-linked. |
| PP sample approval | Sample lane decision | Blocks downstream production sample and release readiness. |
| Garment sample approval | Sample lane decision | Blocks or enables bulk garment test/sample readiness. |
| Pre-shipment fabric available | Shipment sample decision | If unavailable, wait for bulk fabric. |
| Shrinkage grouping | Shrinkage team decision | Failed grouping changes fabric issue, patterns, and cut planning. |
| Inspection escalation | Fabric QC lane | Failed 10% inspection escalates to additional 10% or 100%. |
| Shade approval / comparison | Fabric QC lane | Not-matched shade groups require grouping or recipe actions. |
| Trial required / doable | Side notes in pre-production flow | PPIC decision before production release. |
| Pilot approval | Pilot lane decision | Production can proceed only after pilot approval. |
| QA Review and FIR Release | Fabric QC lane | Required evidence before bulk cutting approval. |

## 7. Required Data Objects

The workbook implies the following data model concepts:

- Customer PO.
- Tech pack.
- Style / color / wash / shade group.
- Sample yardage / PSS.
- Fabric PO, fabric ex-mill date, ETD, ETA, in-house date.
- Fabric tests, chemical tests, jungle tests, garment tests.
- Fit sample, EC sample, PP sample, garment test sample, TOP / shipment sample, JSS production sample.
- Sample approvals with pass/fail, date, owner, and rework reason.
- Trims categories: sewing, finishing, packing.
- Vendor type: nominated vs non-nominated, SBD-required vs not required.
- Folding instruction / customer document status.
- Full Kit Date.
- Shrinkage measurement, shrinkage group, shade group, blanket, FIR.
- Trial requirement and trial feasibility.
- Pilot marker, pilot cut plan, pilot cut, pilot sewing, pilot laundry, pilot measurement, pilot approval.
- Work order by shade group.
- Laundry lot, barcode, route step, process control, QC, dispatch.

## 8. Product And Implementation Implications

1. **PCD readiness must be a multi-gate workflow.** The workbook confirms that PCD readiness depends on material, sample, fabric QC, shrinkage, shade, pilot, customer document, and trim gates.
2. **Customer-specific variants must be configurable.** AMEO and GU/UNQ use different assumptions, tests, and material-release logic. These should be buyer/customer rules, not hard-coded process branches.
3. **Failures should update TnA and release risk.** The workbook repeatedly routes failed decisions to rework or escalation. The platform should preserve pass/fail history, owner, due date, and downstream impact.
4. **Full kit must be computed from dependencies.** FKD should not be manually trusted unless the underlying fabric, trims, samples, documents, and approval gates are complete or governed as exceptions.
5. **Shade and shrinkage groups are production planning dimensions.** They affect pattern revision, cutting planner handoff, trial decisions, work order creation, and laundry readiness.
6. **Pilot is a controlled release proof.** Pilot approval is a formal gate before production, and production work orders can be raised per shade group only after the pilot path is cleared.
7. **Laundry should be route-based.** The laundry flow includes multiple wet/dry/process-control steps and QC dispatch. This aligns with a future wash/WIP truth layer rather than the current minimal sewing-to-wash queue boundary.
8. **The workbook is a strong source for workflow discovery, not an implementation status record.** It should be used to refine requirements, payloads, readiness gates, seed scenarios, and stakeholder validation questions.

## 9. Open Clarifications Needed

The workbook should be reviewed with Eratex process owners to clarify:

1. Meaning of route connector labels in the laundry sheet: `A` through `J`, `Z1` through `Z3`, `PC1`, `PC2`, and `T`.
2. Exact owner and SLA for each approval gate, especially fit, wash, PP, garment, shade, FIR, pilot, and trial decisions.
3. Whether AMEO and GU/UNQ are customer-specific flows, buyer family flows, or examples of version evolution.
4. Meaning of workbook note `7 cust 5 flow 15 SLAs`.
5. Whether `FBO/CBD`, `SBD`, `ACC`, `TBO`, `PSS`, `EC`, `Pre APP`, `JSS`, and `FIR` are standardized internal codes and where their master definitions live.
6. Whether work order release should always be by shade group or only for specific customer/style/wash families.
7. Which system is source of truth for each event: Datatex transaction data, planning platform workflow event, manual approval, laboratory result, laundry system event, or scanned shopfloor event.

## 10. Recommended Next Use

Use this workbook synthesis as input for:

- PCD readiness gate payloads and lifecycle states.
- Full Kit Date dependency model.
- Sample and approval workflow definition.
- Fabric QC and shrinkage/shade-group model.
- Pilot-production release gate.
- Work order release by shade group.
- Laundry route and process-control blueprint for the future wash execution scope.
- Stakeholder workshop questions for merchandising, PPIC, QA, shrinkage team, sampling, laundry, and MD approval owners.
