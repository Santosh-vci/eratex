# Front-End UI Addendum 2  
# Line Routing, Operation Bulletin, Line Realignment, Efficiency Review, and Holistic WIP Inventory  
# Eratex Planning & Scheduling Tool

**Company:** Eratex  
**Product:** End-to-End Planning & Scheduling Tool  
**Document Type:** Front-End UI Addendum + Handoff-Level Specification  
**Related Documents:**  
1. Eratex Front-End UI Thesis & Implementation Specification  
2. Front-End UI Addendum: Handheld Shopfloor Input Screens and Live Planning Workbenches  

**Manufacturing Scope:** Denim Bottoms + Chinos  
**Version:** 1.0  
**Date:** 2026-05-26  

---

## 1. Purpose of This Addendum

This second addendum addresses two important gaps:

```text
1. Line routing and operation bulletin planning system
2. Holistic WIP inventory across the complete manufacturing pipeline
```

The earlier documents covered:

- order lifecycle
- PCD readiness
- weekly planning
- daily release
- workcenter load
- sewing line loading
- wash planning
- WIP and queue monitoring
- exceptions
- shipment readiness
- handheld shopfloor live capture

However, the earlier specification did not sufficiently define:

```text
How a new production line is created.
How an existing line is realigned for a new style.
How operation bulletins drive routing and balancing.
How line efficiency is reviewed against planned routing.
How WIP inventory is seen holistically across the entire manufacturing pipeline.
```

These capabilities are critical because denim/chinos production is not only about assigning orders to lines. It requires correct operation routing, machine allocation, skill mapping, standard minute values, balance loss visibility, and continuous performance review.

---

## 2. Core Addendum Thesis

A garment production planning system must not only decide **which line gets which order**. It must also define and validate **how the line is expected to produce the order**.

This requires a closed loop:

```text
Style technical file
→ operation bulletin
→ routing
→ machine and skill requirement
→ line design / realignment
→ planned capacity
→ actual performance
→ efficiency review
→ routing and master data correction
```

Without this loop, the system can show a line loading plan but cannot explain whether the line is actually capable of producing the order as planned.

Similarly, WIP should not only be seen as ageing between selected departments. It should be available as a full pipeline inventory map:

```text
Raw material
→ fabric QC
→ cutting
→ cut panels
→ sewing WIP
→ sewn goods
→ wash queue
→ wash WIP
→ finishing WIP
→ packed goods
→ shipment-ready goods
```

The user should be able to answer:

```text
Where is the inventory?
How much is stuck?
What is usable?
What is blocked?
What is ageing?
What is waiting for the current constraint?
What is affecting shipment?
```

---

# Part A: Line Routing and Operation Bulletin Planning

---

## 3. Surface 1: Operation Bulletin Master Dashboard

### 3.1 Purpose

To manage operation bulletins for each style and make them usable for production planning, line routing, line balancing, and efficiency review.

### 3.2 Primary Users

- IE team
- production planner
- sewing manager
- production head
- costing team
- QA / technical team

### 3.3 Route

```text
/technical/operation-bulletins
/technical/operation-bulletins/:bulletinId
```

### 3.4 Key Business Need

Every style should have an approved operation bulletin before it is loaded into production.

The operation bulletin should define:

```text
Operation sequence
Operation description
Machine type
Attachment / folder requirement
Skill requirement
SMV / SAM
Quality checkpoint
Predecessor operation
Parallel operation possibility
Critical operation flag
```

### 3.5 Dashboard Header Cards

```text
Approved bulletins
Draft bulletins
Bulletins pending IE approval
Styles without bulletin
Bulletins used in active production
Bulletins with performance deviation
```

### 3.6 Grid Columns

```text
Bulletin ID
Style Code
Product Type
Customer
Version
Total SMV
No. of Operations
Critical Operations
Machine Types Required
Skill Level Required
Approval Status
Used in Active Order
Last Updated
```

### 3.7 User Actions

```text
Create bulletin
Clone from similar style
Upload bulletin
Edit operation sequence
Submit for approval
Approve bulletin
Version bulletin
Compare versions
Mark obsolete
Link to active order
```

### 3.8 Acceptance Criteria

- No style should be production-loadable without approved bulletin or approved exception.
- Bulletin version used for planning must be visible.
- Total SMV must be calculated from operation-level SMV.
- Any change in bulletin version must show impact on planned capacity.

---

## 4. Surface 2: Operation Bulletin Detail and Routing Builder

### 4.1 Purpose

To create and maintain the operation sequence and routing logic for a style.

### 4.2 Route

```text
/technical/operation-bulletins/:bulletinId/routing
```

### 4.3 Layout

Recommended layout:

```text
Left: operation list
Center: routing sequence / flow
Right: operation detail drawer
Bottom: total SMV and machine summary
```

### 4.4 Operation Fields

```text
Operation number
Operation name
Operation group
Machine type
Attachment required
Skill level
SMV / SAM
Target pieces per hour
QC checkpoint flag
Critical operation flag
Predecessor operation
Can run parallel: yes/no
Rework-sensitive: yes/no
Operator grade required
```

### 4.5 Operation Groups

For denim/chinos bottoms:

```text
Front preparation
Pocket preparation
Fly preparation
Back preparation
Yoke / rise
Panel joining
Waistband
Belt loop
Buttonhole / button
Bartack / rivet
Hem
Thread trimming
End-line check
```

### 4.6 Routing Visualization

The UI should visually show:

```text
Linear operations
Parallel prep operations
Merge points
Critical operations
QC checkpoints
Potential bottleneck operations
```

### 4.7 Machine Summary

Auto-calculate:

```text
Lockstitch count
Overlock count
Chainstitch count
Bartack count
Buttonhole machine count
Button attach machine count
Waistband machine count
Special attachment requirement
```

### 4.8 Acceptance Criteria

- User can build operation routing visually or through grid entry.
- Total SMV updates automatically.
- Machine and skill requirements are summarized.
- Routing can be versioned and approved.

---

## 5. Surface 3: Line Creation and Line Master Configuration

### 5.1 Purpose

To create a new production line or configure an existing line with machines, manpower, skills, shifts, and capacity assumptions.

### 5.2 Primary Users

- production head
- IE team
- planner
- sewing manager
- admin

### 5.3 Route

```text
/master-data/lines
/master-data/lines/:lineId
```

### 5.4 Key Business Need

The factory must be able to define:

```text
Line identity
Factory/unit
Line type
Available machines
Operator strength
Supervisor
Shift pattern
Skill profile
Efficiency baseline
Historical performance
```

### 5.5 Line Master Fields

```text
Line ID
Line name
Factory / unit
Department
Line type: denim / chino / mixed / sample / special
Active status
Shift calendar
Supervisor
Standard manpower
Current manpower
Machine list
Special capability
Average efficiency
Net-good output baseline
Quality performance baseline
```

### 5.6 User Actions

```text
Create line
Edit line
Deactivate line
Clone line configuration
Assign supervisor
Assign machines
Assign operators
Set shift calendar
Set baseline efficiency
Set allowed product types
```

### 5.7 Acceptance Criteria

- New line can be created with machine and manpower configuration.
- Line capacity must be calculated from configured working minutes and efficiency.
- Line capability must be searchable during line loading.
- Inactive lines cannot be used in new planning unless reactivated.

---

## 6. Surface 4: Line Realignment Workbench

### 6.1 Purpose

To realign an existing line for a new style or changed order mix.

### 6.2 Primary Users

- IE team
- sewing manager
- production planner
- production head

### 6.3 Route

```text
/sewing/line-realignment
/sewing/lines/:lineId/realign
```

### 6.4 Business Need

When a new style is loaded, the existing line setup may not match the operation bulletin. The system must help identify the gap and propose realignment.

### 6.5 Inputs

```text
Line
Current line configuration
Target style
Approved operation bulletin
Order quantity
Target output
Available operators
Available machines
Skill matrix
Shift plan
```

### 6.6 Realignment Analysis

The UI should show:

```text
Required machines vs available machines
Required skills vs available skills
Expected bottleneck operations
Estimated line balance loss
Expected output at current configuration
Expected output after proposed realignment
Changeover time required
Training requirement
Machine movement requirement
```

### 6.7 Realignment Actions

```text
Add machine
Remove machine
Move machine from another line
Move operator
Assign trainee
Change operation split
Add helper
Change target efficiency
Approve realignment
Save as line setup version
```

### 6.8 Layout

Recommended layout:

```text
Top: selected line and style
Left: current line setup
Center: required setup from bulletin
Right: gap and recommendation
Bottom: proposed new line balance
```

### 6.9 Acceptance Criteria

- User can compare current line setup against required style routing.
- Machine and skill gaps are visible.
- Realignment proposal can be saved and approved.
- Approved realignment updates line loading capacity.

---

## 7. Surface 5: Line Balance Board

### 7.1 Purpose

To visually balance the line based on operation SMV, manpower, target output, and bottleneck operations.

### 7.2 Route

```text
/sewing/line-balance
/sewing/lines/:lineId/balance
```

### 7.3 Key Metrics

```text
Takt time
Operation SMV
Operator allocation
Workstation load
Balance efficiency
Bottleneck operation
Expected output
Balance loss
WIP build-up risk
```

### 7.4 UI Visualization

The UI should show a station-wise bar chart or load board:

```text
Station 1: 85% loaded
Station 2: 122% loaded → bottleneck
Station 3: 74% loaded
Station 4: 96% loaded
```

### 7.5 User Actions

```text
Split operation
Combine operation
Add operator
Move operator
Change machine
Mark critical operation
Save balance
Submit for approval
```

### 7.6 Acceptance Criteria

- Bottleneck operation is visible.
- Line balance efficiency is calculated.
- User can test balancing changes before approving.
- Approved balance links to daily production target.

---

## 8. Surface 6: Operation Bulletin Performance Dashboard

### 8.1 Purpose

To compare planned operation bulletin assumptions against actual performance.

### 8.2 Primary Users

- IE team
- production head
- sewing manager
- planner

### 8.3 Route

```text
/analytics/operation-bulletin-performance
```

### 8.4 Key Questions

```text
Is the planned SMV realistic?
Which operations are underperforming?
Which style repeatedly misses planned efficiency?
Which line is better suited to this style?
Which operation needs retraining or method improvement?
```

### 8.5 Dashboard Metrics

```text
Planned SMV
Actual achieved SMV equivalent
Planned target output
Actual output
Efficiency %
Net-good output
Defect-adjusted efficiency
Balance loss
Bottleneck operations
Learning curve days
Rework impact
```

### 8.6 Views

```text
By style
By operation
By line
By operator group
By customer
By product type
By wash complexity
```

### 8.7 Acceptance Criteria

- IE can see which bulletin assumptions are unrealistic.
- Performance deviations can trigger bulletin review.
- Historical performance informs future line loading.

---

## 9. Surface 7: Efficiency Review Workbench

### 9.1 Purpose

To review production efficiency by line, style, operation, day, shift, and order.

### 9.2 Route

```text
/analytics/efficiency-review
```

### 9.3 Primary Users

- production head
- IE team
- line managers
- planners
- management

### 9.4 Key Metrics

```text
Planned output
Actual gross output
Actual net-good output
Defect rate
Rework rate
Efficiency %
Utilization %
Absenteeism impact
Downtime impact
Changeover loss
Wash/rework impact
```

### 9.5 Views

```text
Line-wise
Style-wise
Order-wise
Operation-wise
Shift-wise
Supervisor-wise
Factory-wise
```

### 9.6 Diagnostic Panels

```text
Low efficiency due to low output
Low efficiency due to high defect
Low efficiency due to downtime
Low efficiency due to absenteeism
Low efficiency due to line imbalance
Low efficiency due to style learning curve
```

### 9.7 Acceptance Criteria

- Efficiency review explains why efficiency is low.
- User can separate utilization, efficiency, and quality loss.
- Review output feeds planning assumptions.

---

# Part B: Holistic WIP Inventory

---

## 10. Surface 8: Manufacturing Pipeline WIP Inventory Dashboard

### 10.1 Purpose

To provide one holistic view of all inventory and WIP across the manufacturing pipeline.

### 10.2 Primary Users

- production planner
- production head
- department managers
- management
- shipment team
- finance / inventory control

### 10.3 Route

```text
/inventory/pipeline-wip
```

### 10.4 Business Need

Earlier WIP screens covered queue ageing at selected stages. This surface expands WIP into a complete pipeline inventory map.

It should answer:

```text
How much inventory is in each stage?
How much is moving?
How much is waiting?
How much is blocked?
How much is rework?
How much is shipment-ready?
How much belongs to at-risk shipments?
```

### 10.5 Pipeline Stages

```text
Fabric on order
Fabric in transit
Fabric received not QC checked
Fabric QC hold
Fabric cleared for cutting
Fabric allocated to order
Cutting WIP
Cut panels waiting for sewing
Sewing WIP
Sewn goods waiting for wash
Dry process WIP
Wet wash WIP
Rewash WIP
Washed goods waiting for finishing
Finishing WIP
Finished goods waiting for final QC
Final QC hold
Packed goods
Packed goods waiting for inspection
Shipment-ready goods
Dispatched goods
```

### 10.6 Dashboard Header Cards

```text
Total pipeline WIP
Blocked WIP
Ageing WIP
WIP before current constraint
Shipment-risk WIP
Rework WIP
Shipment-ready quantity
```

### 10.7 Visual Model

Recommended visual representation:

```text
Horizontal pipeline map
Stage-wise inventory bars
Risk overlay
Ageing overlay
Blocked quantity indicator
Shipment-risk indicator
```

Example:

```text
Fabric QC: 18,000 pcs equivalent
Cut panels: 9,500 pcs
Sewing WIP: 22,000 pcs
Waiting for wash: 14,000 pcs → Red
Rewash WIP: 2,800 pcs → Black
Packing: 11,000 pcs
Shipment-ready: 7,500 pcs
```

### 10.8 Grid Columns

```text
Stage
Order
Style
Customer
Quantity
Equivalent garment quantity
Ageing
Status
Hold reason
Next process
Owner
Shipment date
Shipment risk
```

### 10.9 Filters

```text
Factory
Customer
Order
Style
Product type
Stage
Ageing bucket
Risk status
Owner
Shipment week
Blocked only
Rework only
Current constraint only
```

### 10.10 User Actions

```text
Open order
Open stage detail
Assign owner
Create exception
Move WIP
Hold WIP
Release WIP
View shipment impact
View ageing reason
```

### 10.11 Acceptance Criteria

- User can see total WIP across the full pipeline.
- User can identify where most WIP is trapped.
- WIP before current constraint is highlighted.
- Shipment-risk WIP is visible.
- Rework WIP is separated from normal WIP.

---

## 11. Surface 9: WIP Ageing and Inventory Drilldown

### 11.1 Purpose

To drill from pipeline WIP into detailed order/style/stage inventory.

### 11.2 Route

```text
/inventory/pipeline-wip/:stage
```

### 11.3 Ageing Buckets

```text
0–1 day
1–2 days
2–3 days
3–5 days
5+ days
```

For fabric procurement stages, ageing may be week-based:

```text
0–7 days
8–15 days
16–30 days
30+ days
```

### 11.4 Drilldown Views

```text
By order
By style
By customer
By stage
By owner
By risk
By hold reason
```

### 11.5 Acceptance Criteria

- User can move from summary WIP to exact affected orders.
- WIP ageing threshold can vary by stage.
- Drilldown supports exception creation.

---

## 12. Surface 10: Inventory Reconciliation and Quantity Integrity Screen

### 12.1 Purpose

To ensure that quantities remain consistent across stages.

### 12.2 Route

```text
/inventory/reconciliation
```

### 12.3 Business Need

In garment manufacturing, quantity mismatches happen due to:

```text
cutting loss
sewing rejection
wash rejection
rewash segregation
finishing rejection
packing shortage
short shipment
manual entry errors
bundle mismatch
```

The system must provide quantity integrity checks.

### 12.4 Reconciliation Logic

The UI should show:

```text
Order quantity
Fabric equivalent available
Cut quantity
Issued to sewing
Sewn quantity
Sent to wash
Washed quantity
Sent to finishing
Finished quantity
Packed quantity
Shipment-ready quantity
Dispatched quantity
Short / excess quantity
```

### 12.5 Exceptions

Auto-detect:

```text
Cut quantity greater than fabric allocation
Sewn quantity greater than cut issue
Wash received less than sewing sent
Finished quantity less than washed output
Packed quantity greater than finished quantity
Shipment-ready quantity greater than packed quantity
Unexplained loss above threshold
```

### 12.6 Acceptance Criteria

- Quantity gaps are visible by order.
- Unexplained loss creates exception.
- Pipeline WIP values reconcile with order lifecycle quantities.

---

# Part C: Master Data Dependencies

---

## 13. Required Master Data for Line Routing

```text
Style master
Operation bulletin master
Operation master
Machine master
Attachment / folder master
Skill master
Operator skill matrix
Line master
Shift calendar
Efficiency baseline
Quality baseline
Workstation master
```

---

## 14. Required Master Data for Holistic WIP

```text
Order master
Style master
BOM
Fabric lot master
Shade lot master
Bundle master
Wash batch master
Workcenter master
Inventory stage master
WIP status master
Hold reason master
Shipment calendar
```

---

# Part D: API and Data Contract Recommendations

---

## 15. Operation Bulletin Payload

```json
{
  "bulletinId": "OB-1001",
  "styleCode": "STY-5001",
  "version": "v2",
  "status": "APPROVED",
  "totalSmv": 32.5,
  "operations": [
    {
      "sequence": 10,
      "operationName": "Front pocket attach",
      "operationGroup": "FRONT_PREP",
      "machineType": "LOCKSTITCH",
      "skillLevel": "MEDIUM",
      "smv": 0.85,
      "qcCheckpoint": false,
      "critical": false,
      "predecessor": null
    }
  ]
}
```

---

## 16. Line Master Payload

```json
{
  "lineId": "LINE-05",
  "factoryId": "F01",
  "lineType": "DENIM",
  "status": "ACTIVE",
  "standardManpower": 42,
  "currentManpower": 39,
  "shiftCalendar": "SHIFT-A",
  "baselineEfficiency": 0.68,
  "netGoodOutputBaseline": 560,
  "machines": [
    {
      "machineType": "LOCKSTITCH",
      "count": 18
    },
    {
      "machineType": "BARTACK",
      "count": 2
    }
  ]
}
```

---

## 17. Line Realignment Payload

```json
{
  "realignmentId": "REALIGN-1001",
  "lineId": "LINE-05",
  "styleCode": "STY-5001",
  "bulletinId": "OB-1001",
  "requiredMachines": {
    "LOCKSTITCH": 20,
    "BARTACK": 3
  },
  "availableMachines": {
    "LOCKSTITCH": 18,
    "BARTACK": 2
  },
  "skillGap": [
    {
      "operation": "Waistband attach",
      "requiredSkill": "HIGH",
      "availableOperators": 1,
      "requiredOperators": 2
    }
  ],
  "expectedOutputBefore": 480,
  "expectedOutputAfter": 620,
  "status": "PROPOSED"
}
```

---

## 18. Pipeline WIP Payload

```json
{
  "stage": "SEWN_WAITING_FOR_WASH",
  "orderId": "ORD-1001",
  "styleCode": "STY-5001",
  "customer": "Customer A",
  "quantity": 14000,
  "ageingHours": 36,
  "status": "WAITING",
  "holdReason": null,
  "nextProcess": "WET_WASH",
  "owner": "Washing Manager",
  "shipmentDate": "2026-07-15",
  "shipmentRisk": "RED"
}
```

---

# Part E: Updated Scope Recommendation

---

## 19. Revised MVP / MVP-Adjacent Recommendation

The original MVP surfaces remain valid. However, the following should be added as MVP-adjacent or early Phase 2 scope:

```text
1. Operation Bulletin Master Dashboard
2. Line Master Configuration
3. Line Realignment Workbench
4. Operation Bulletin Performance Dashboard
5. Manufacturing Pipeline WIP Inventory Dashboard
6. Inventory Reconciliation Screen
```

Reason:

```text
Without operation bulletin and routing logic,
line loading will remain shallow.

Without holistic WIP inventory,
the system will show queues but not the true manufacturing inventory position.
```

---

## 20. Build Sequencing Recommendation

### Phase 1: Add Data Foundation

```text
Operation bulletin master
Line master
Machine master
Pipeline WIP stage master
Bundle / batch identity model
```

### Phase 2: Add UI Surfaces

```text
Operation bulletin dashboard
Line master screen
Pipeline WIP dashboard
WIP drilldown
```

### Phase 3: Add Planning Intelligence

```text
Line realignment workbench
Line balance board
Efficiency review
Inventory reconciliation
```

### Phase 4: Add Closed-Loop Learning

```text
Bulletin performance review
SMV variance analytics
Line capability recommendation
Future planning capacity recalibration
```

---

# 21. Final Addendum Summary

Yes, these elements were under-specified earlier.

The tool needs a line routing and operation bulletin planning layer because sewing line loading cannot be reliable unless the system understands:

```text
style operations
operation sequence
SMV
machine needs
skill needs
line setup
balance loss
actual performance
```

The tool also needs a holistic WIP inventory layer because queue monitoring alone does not show the full manufacturing inventory position.

This addendum should be treated as a necessary extension to the frontend handoff specification. It adds the missing bridge between:

```text
technical method design
→ line planning
→ live execution
→ efficiency review
→ planning recalibration
```

and the missing inventory bridge between:

```text
material
→ WIP
→ rework
→ finished goods
→ shipment-ready stock
```

Together, these additions make the planning tool more complete, more executable, and more suitable for Eratex-scale operations.
