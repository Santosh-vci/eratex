# Eratex Consulting Team Validation Questionnaire

**Document purpose:** Structured question set for validating the consulting team's solution deck, field-visit findings, and expected application flow against the Eratex product build direction.  
**Audience:** Eratex business team, consulting team, plant leadership, product/build team.  
**Context:** The solution presentation was considered directionally acceptable but still too high-level for planning, laundry, software flow, FastReact interfaces, and plant-user conviction.  
**Use:** Run this as a business validation workshop before exposing the plant and top management to the product flow.

---

## 1. Workshop Objective

The objective is to convert the consulting team's concept, field observations, and presentation narrative into implementation-grade answers that can validate or refine the Eratex product build.

The discussion should clarify:

- what the application flow will be,
- how planning will be visible to users,
- how due-date quotation, planning, sewing, laundry, cutting, finishing, and dispatch will work in software,
- where existing systems such as Datatex, FastReact, Excel, TMS/WAS, and manual trackers fit,
- which performance numbers are validated,
- which parts of the solution are already plant-validated,
- and what gaps must be closed before presenting to top management.

---

## 2. Required Answer Format

For every discussion area, the consulting team should answer in the following structure:

| Answer Area | Required Detail |
|---|---|
| Current observed process | What was actually seen during field visit and process walk-through. |
| Current tools and files | Systems, Excel trackers, registers, WhatsApp/email flows, and manual reports used today. |
| Proposed software behavior | How the future application should behave screen by screen or action by action. |
| Data source | Where each required field comes from and who owns it. |
| User role | Which user creates, approves, updates, views, or acts on the information. |
| Exception behavior | What happens when data is missing, late, wrong, changed, or disputed. |
| Validation evidence | Whether this is confirmed by plant users, inferred by consultants, or still to be validated. |
| Product implication | Whether this confirms the current Eratex build direction or requires a change. |

---

## 3. Discussion Topic 1: Overall Technology Landscape

### 3.1 Current System Map

1. Which systems are currently used across customer inquiry, projection, order confirmation, planning, production, laundry, finishing, shipment, and management reporting?
2. What is Datatex currently used for, and which business objects does it own?
3. What is FastReact currently used for: planning truth, visualization, manual planner workspace, capacity engine, or reporting layer?
4. Which Excel files still carry operational truth despite the existence of formal systems?
5. Which processes still rely on WhatsApp, email, manual registers, verbal follow-up, or personal planner judgment?
6. Which current reports are considered trusted by plant users?
7. Which current reports are used only for management presentation but not for daily action?
8. Which systems are updated daily, shift-wise, weekly, or only after escalation?
9. Which current system has the highest user adoption, and why?
10. Which current system has the lowest trust among plant users, and why?

### 3.2 Existing Technology Pain Points

1. Where do users enter the same data more than once?
2. Where does data get copied manually between systems or Excel files?
3. Which data is available too late to support daily planning decisions?
4. Which system outputs are ignored because users maintain a parallel tracker?
5. Which interfaces are considered unreliable today?
6. Which parts of the current landscape create planning blind spots?
7. Which systems are difficult to change because of licensing, vendor dependency, or lack of internal ownership?
8. Which tools are expected to remain during the transition period?
9. Which tools are expected to be replaced eventually?
10. Which existing tools must be integrated before any pilot can be credible?

---

## 4. Discussion Topic 2: Source Of Truth And Interface Design

### 4.1 Source-Of-Truth Matrix

1. What is the authoritative source for customer master data?
2. What is the authoritative source for buyer master data?
3. What is the authoritative source for confirmed customer orders?
4. What is the authoritative source for projection orders or inquiries?
5. What is the authoritative source for style master, article, product family, and buyer style reference?
6. What is the authoritative source for BOM and material requirements?
7. What is the authoritative source for SMV/SAM?
8. What is the authoritative source for operation bulletin and line routing?
9. What is the authoritative source for wash route, wash code, wash recipe, and machine compatibility?
10. What is the authoritative source for sewing line capacity and efficiency?
11. What is the authoritative source for cutting capacity?
12. What is the authoritative source for laundry capacity?
13. What is the authoritative source for finishing and packing capacity?
14. What is the authoritative source for WIP at each stage?
15. What is the authoritative source for dispatch confirmation?

### 4.2 Interface Inventory

1. Which interfaces exist today: API, database view, scheduled file export, manual Excel export, email attachment, or no interface?
2. Which systems can provide automated data feeds without vendor customization?
3. Which systems require file-based integration?
4. Which systems require manual upload during the pilot?
5. What is the current FastReact export format?
6. What is the current Datatex export or API capability?
7. Can FastReact provide line allocation, sewing start date, sewing end date, load, efficiency assumptions, and actual plan changes?
8. Can Datatex provide order quantity, shipment split, delivery date, PO status, material status, and dispatch status?
9. Which fields are missing from existing exports but required for planning?
10. Which data sources are currently not digital at all?

### 4.3 Integration Governance

1. What happens when an import fails?
2. Who approves corrected import data?
3. Which imports must be all-or-nothing?
4. Which imports can allow partial apply?
5. What is the acceptable sync frequency for orders, materials, WIP, sewing plan, laundry status, and shipment data?
6. Which stale data conditions should create operational exceptions?
7. Which data should never be overwritten automatically?
8. Which system has final authority if Datatex, FastReact, Excel, and plant actuals disagree?
9. What audit trail is required for imported and corrected data?
10. What is the fallback process if an interface is unavailable during production use?

---

## 5. Discussion Topic 3: FastReact Coexistence Or Replacement

### 5.1 Current FastReact Usage

1. What exact planning activities are currently performed in FastReact?
2. Which users update FastReact?
3. Which users only view FastReact output?
4. Which planning decisions are taken outside FastReact even if FastReact contains a plan?
5. What data enters FastReact, from where, and how frequently?
6. What data leaves FastReact, to where, and how frequently?
7. Which FastReact screens or reports are used daily?
8. Which FastReact outputs are trusted by planners?
9. Which FastReact outputs are manually corrected in Excel?
10. What are the known gaps in FastReact for Eratex planning?

### 5.2 Replacement Readiness

1. If Eratex wants to replace FastReact, which functions must be replicated first?
2. Which FastReact functions are mission-critical for sewing scheduling?
3. Which FastReact functions are only convenience or visualization features?
4. Which FastReact data structures must be migrated or mapped?
5. How will historic plans and plan changes be handled?
6. What is the acceptable transition mode: import from FastReact, export to FastReact, dual-run, or full replacement?
7. What proof will convince users that the new platform can replace FastReact?
8. Which plant risks arise if FastReact is removed too early?
9. Which current FastReact limitations should the new product not repeat?
10. What is the target source of planning truth after the transition?

---

## 6. Discussion Topic 4: End-To-End Application Flow

### 6.1 Inquiry To Dispatch Flow

1. Walk one real order from customer inquiry or projection to final dispatch.
2. At what point does an inquiry become a projection?
3. At what point does a projection become a quoted order?
4. At what point does a quoted order become a confirmed order?
5. At what point does a confirmed order become a firm plan?
6. At what point does a firm plan become a daily production release?
7. At what point does released production become cutting execution?
8. At what point does cutting hand over to sewing?
9. At what point does sewing hand over to laundry?
10. At what point does laundry hand over to finishing?
11. At what point does finishing become shipment-ready?
12. At what point is dispatch confirmed?

### 6.2 User Flow Expectations

1. What should merchandising see for a projected or confirmed order?
2. What should planning see before committing a date?
3. What should the planning head see before freezing a plan?
4. What should the cutting team see before starting execution?
5. What should the sewing line supervisor see before loading an order?
6. What should the laundry supervisor see before creating a wash schedule?
7. What should finishing see before prioritizing work?
8. What should shipment/logistics see before dispatch?
9. What should plant management see every morning?
10. What should top management see weekly or monthly?

### 6.3 Screen-Level Validation

1. Which screens are needed for the first plant demonstration?
2. Which screens are required for planning users to understand the flow?
3. Which screens are required for laundry users to believe the solution handles real complexity?
4. Which screens are required to demonstrate due-date quotation?
5. Which screens are required to demonstrate FastReact replacement or coexistence?
6. Which screens are required to show end-to-end order traceability?
7. Which screens should not be shown yet because the underlying process is not validated?
8. Which screen should become the daily operating cockpit for each role?

---

## 7. Discussion Topic 5: Due-Date Quotation And Customer Commitment

### 7.1 Current Quotation Logic

1. How is the delivery date currently promised to a customer?
2. Is the promised date based on capacity, customer pressure, historical lead time, FastReact, Datatex, Excel, or management judgment?
3. Who has authority to commit a date?
4. What checks are mandatory before committing a date?
5. Are sewing, laundry, cutting, finishing, materials, and approvals checked before commitment?
6. How is customer priority considered?
7. How is buyer-specific lead-time expectation considered?
8. What happens if a customer asks for a pull-in?
9. What happens if the requested delivery week is overloaded?
10. How is the first committed date protected after confirmation?

### 7.2 Future Software Behavior

1. Should the software suggest a feasible delivery week or exact delivery date?
2. Should the software return alternate dates when the requested date is infeasible?
3. Should the software show confidence levels such as feasible, feasible with risk, or infeasible?
4. Which capacity pools should be checked for quotation?
5. Should projection orders reserve tentative capacity?
6. Should tentative capacity expire automatically?
7. Who can override a system-suggested date?
8. What reason codes are required for override?
9. How should the software show impact on existing orders before accepting a new order?
10. What should be shown to merchandising versus planning versus management?

---

## 8. Discussion Topic 6: Planning Visibility And Planning Zones

### 8.1 Planning Zone Definition

1. What are the proposed boundaries for future, volatile, firm, and frozen zones?
2. Are these boundaries fixed or buyer/product dependent?
3. Which date anchors the zone: ex-factory date, committed ship date, PCD, sewing start, or another date?
4. What actions are allowed in the future zone?
5. What actions are allowed in the volatile zone?
6. What actions are allowed in the firm zone?
7. What actions are allowed in the frozen or execution zone?
8. What changes require approval in each zone?
9. What changes are blocked completely in each zone?
10. How should zone movement be audited?

### 8.2 Planning Visibility

1. What should the weekly planning workbench show?
2. What should the workcenter load monitor show?
3. What should the calendar/Gantt planning dashboard show?
4. What should the daily production release dashboard show?
5. Should planning visibility be by buyer, PO, style, line, department, machine group, shipment week, or constraint?
6. What is the minimum level of drill-down needed from management view to order-level action?
7. How should overloaded resources be highlighted?
8. How should underloaded resources be highlighted?
9. How should tentative, soft-reserved, firm-reserved, and locked capacity be shown?
10. How should the system show plan quality before freeze?

### 8.3 Freeze And Change Governance

1. What exactly is frozen when a plan is frozen?
2. Are PCD, FKD, sewing start, sewing end, laundry route, machine group, and dispatch date all locked?
3. Who can request a plan change?
4. Who can approve a plan change?
5. What impact preview is required before approval?
6. Should the system show affected orders before applying a change?
7. Should the system prevent direct manual changes after freeze?
8. How should cancellations release capacity?
9. How should pull-ins displace lower-priority work?
10. How should postponed orders release or retain capacity?

---

## 9. Discussion Topic 7: Sewing Scheduling And Line Loading

### 9.1 Sewing Planning Logic

1. What is the current sewing planning grain: order, PO, color, style, shipment split, line, or day?
2. How are eligible lines selected for a style?
3. Are eligible lines based on buyer, product type, machine mix, operator skill, past efficiency, or management preference?
4. How are SMV, efficiency, learning curve, and absenteeism considered?
5. How are line changes controlled?
6. How are multi-line orders handled?
7. How are order splits handled?
8. How are changeovers planned?
9. What is the acceptable level of schedule churn?
10. Which sewing plan changes currently cause measurable efficiency loss?

### 9.2 Line Loading And Execution

1. What readiness checks must pass before a sewing line can be loaded?
2. Does line loading require approved operation bulletin?
3. Does line loading require confirmed cutting output availability?
4. Does line loading require material, trims, machine, and operator readiness?
5. What should block line loading?
6. What should only warn the planner?
7. What daily actuals must be captured from sewing?
8. Should net-good output be gross output minus defect and rework?
9. How should defects and rework affect remaining plan?
10. How should active line shortfall trigger recovery planning?

---

## 10. Discussion Topic 8: Cutting Planning And Execution

### 10.1 Cutting Planning Scope

1. Is cutting currently planned as a finite-capacity process or only released by PCD priority?
2. Which cutting stages must be represented: fabric relaxation, marker, spreading, cutting, numbering, bundling, panel issue, or cut-panel QC?
3. How is cutting capacity defined?
4. How are cutting tables, machines, manpower, fabric width, and marker efficiency considered?
5. How are fabric delays reflected in cutting readiness?
6. How are fabric QC holds reflected in cutting release?
7. How is cutting priority decided?
8. How are partial cutting and split lots handled?
9. What output must cutting capture for sewing readiness?
10. What cutting exceptions affect shipment risk?

### 10.2 Cutting User Flow

1. What does the cutting manager need to see each morning?
2. What does the cutting supervisor need to capture during execution?
3. What should trigger a cutting delay alert?
4. What should trigger a cutting output shortfall alert?
5. What should be visible to sewing when cutting is delayed?
6. What should be visible to planning when cutting output is partial?
7. What should be visible to management when PCD is missed?

---

## 11. Discussion Topic 9: Laundry / Wash Planning

### 11.1 Laundry Process Understanding

1. What are the actual wash route families used at Eratex?
2. Which routes include dry process before wet process?
3. Which routes include laser, whiskering, scraping, grinding, PP spray, resin, tint, enzyme, bleach, stone, ozone, hydro extraction, drying, or curing?
4. Which routes require post-wash QC before finishing release?
5. Which routes have high rewash or touch-up probability?
6. Which wash processes are buyer restricted?
7. Which machines are buyer preferred or buyer restricted?
8. Which wash processes require special safety or sustainability governance?
9. Which wash processes are most difficult to schedule today?
10. Which wash processes create the highest shipment risk?

### 11.2 Laundry Master Data

1. Are wash routes standardized by buyer, style, wash code, CMT, or order?
2. Are wash recipes stored digitally today?
3. Are recipe versions approved and locked?
4. Is there a machine compatibility matrix?
5. Is dryer capacity modeled separately from wet-process capacity?
6. Are hydro extractors modeled as capacity constraints?
7. Are laser files version-controlled and linked to style or wash code?
8. Are EIM, ZDHC, chemical, water, or sustainability parameters linked to wash recipes?
9. Who approves a wash route?
10. Who can change a wash route after order confirmation?

### 11.3 Laundry Scheduling Logic

1. How are wash batches created: by order, PO, shade lot, style, color, wash code, CMT, or machine capacity?
2. Can different orders be batched together?
3. What combinations are prohibited?
4. How is shade lot preserved from cutting/sewing into laundry batching?
5. How is lot availability confirmed before scheduling?
6. How is machine downtime handled?
7. How are changeovers calculated?
8. How are underloaded or overloaded batches handled?
9. How are dryers sequenced after wet wash?
10. How should the scheduler prioritize between due-date urgency and setup efficiency?

### 11.4 Laundry Execution And Rewash

1. What events must be captured in real time: batch start, step completion, machine used, quantity, hold reason, QC result, rewash requirement, release to finishing?
2. Who captures laundry actuals today?
3. What is the current rewash rate by buyer, style, wash type, and machine group?
4. Who can approve rewash?
5. How is rewash capacity reserved or recalculated?
6. Does rewash create a child batch?
7. How is shade correction handled?
8. How is post-wash QC failure handled?
9. How is release to finishing controlled?
10. Which laundry actuals must update the planning board immediately?

---

## 12. Discussion Topic 10: Finishing, Shipment Readiness, And Dispatch

### 12.1 Finishing Planning

1. Which finishing processes are capacity constraints?
2. How are post-wash QC, trimming, repair, ironing, measurement, packing, metal detection, carton, and FG movement planned?
3. How is finishing priority decided?
4. How does finishing know which shipment is at risk?
5. How are short quantities handled after sewing or wash?
6. How are rework quantities handled before packing?
7. What finishing data must be visible to planning?
8. What finishing data must be visible to shipment/logistics?

### 12.2 Shipment Readiness

1. What defines shipment-ready?
2. Which checklist items block dispatch?
3. Which checklist items only warn users?
4. Who owns shipment readiness?
5. Who owns final dispatch confirmation?
6. Is dispatch confirmation owned by ERP, shipment team, or the planning platform?
7. How is short shipment approved?
8. How is actual dispatch date captured?
9. How is customer OTIF measured against first commitment?
10. What shipment risks should be visible before ex-factory date?

---

## 13. Discussion Topic 11: TMS / Workflow Automation

### 13.1 Workflow Scope

1. Which merchandising activities become workflow tickets?
2. Which pre-production activities become workflow tickets?
3. Which procurement activities become workflow tickets?
4. Which approval activities become workflow tickets?
5. Which activities should not become tickets because they do not require action?
6. What opens each ticket?
7. What closes each ticket?
8. What evidence is mandatory for closure?
9. Which tickets block FKD?
10. Which tickets block PCD?

### 13.2 Priority And Escalation

1. How is ticket priority calculated?
2. Is priority based on SLA only, project health only, or both?
3. How does the priority mechanism connect to buffer status?
4. Who sees black, red, yellow, and green priorities?
5. What action is expected when a ticket turns red?
6. What escalation path exists for unresolved tickets?
7. Which ticket delays should trigger planning impact recalculation?
8. Which ticket delays should trigger customer communication?
9. How are closure reasons standardized?
10. How are recurring delay reasons converted into improvement actions?

---

## 14. Discussion Topic 12: Performance Numbers And Baseline Validation

### 14.1 Baseline Evidence

1. What source data supports the claimed OTD level?
2. What source data supports the claimed OTIF drop when in-full is considered?
3. What source data supports the claimed short-shipment percentage?
4. What source data supports the claimed first-commitment reliability range?
5. What source data supports the claimed lead-time distribution?
6. What source data supports FKD adherence?
7. What source data supports PCD adherence and PCD movement?
8. What source data supports sewing schedule churn and efficiency loss?
9. What source data supports laundry idle time?
10. What source data supports laundry shift-plan adherence?

### 14.2 Measurement Definition

1. Is OTD measured against original customer commitment or revised ex-factory date?
2. Is OTIF measured at order level, PO level, shipment level, or line-item level?
3. How is in-full measured for partial shipments?
4. How are customer-approved date changes treated?
5. How are internal date changes treated?
6. What exclusions were applied to the analysis?
7. What period was used for baseline calculation?
8. Which buyers and product families were included?
9. Which numbers are plant-validated?
10. Which numbers are consultant estimates or sample-based extrapolations?

### 14.3 Benefit Validation

1. What is the agreed target for OTIF against originally committed date?
2. What is the agreed target for FKD adherence?
3. What is the agreed target for PCD adherence?
4. What is the agreed target for laundry schedule adherence?
5. What is the agreed target for line stability?
6. What is the agreed target for short-shipment reduction?
7. What is the agreed target for lead-time reduction?
8. What is the agreed target for WIP reduction?
9. What is the agreed target for working-capital reduction?
10. Which benefits can be measured during pilot versus only after full rollout?

---

## 15. Discussion Topic 13: Exception, Recovery, And Boundary Cases

### 15.1 Boundary Cases

1. What happens when a confirmed order is cancelled?
2. What happens when a confirmed order quantity increases?
3. What happens when a confirmed order quantity decreases?
4. What happens when a customer pulls in the due date?
5. What happens when a customer postpones the due date?
6. What happens when material arrives late?
7. What happens when fabric QC fails?
8. What happens when PCD is missed?
9. What happens when sewing output is below plan?
10. What happens when laundry requires rewash?
11. What happens when a machine breaks down?
12. What happens when manpower capacity drops?
13. What happens when an order is short before shipment?
14. What happens when dispatch is blocked by documentation?
15. What happens when system data and physical WIP disagree?

### 15.2 Recovery Logic

1. Which boundary cases require impact preview before action?
2. Which boundary cases require approval?
3. Which boundary cases can be auto-applied?
4. Which boundary cases only create alerts?
5. Who owns recovery action by exception type?
6. What recovery options should the software suggest?
7. How should the system rank recovery options?
8. How should recovery decisions be audited?
9. How should unresolved exceptions be escalated?
10. How should recurring exception causes feed POOGI or continuous improvement?

---

## 16. Discussion Topic 14: Plant User Buy-In And Demonstration Readiness

### 16.1 Plant Validation

1. Which plant users have validated the proposed planning flow?
2. Which plant users have validated the proposed laundry flow?
3. Which plant users have validated the proposed FastReact interface or replacement direction?
4. Which plant users have validated the proposed due-date quotation logic?
5. Which plant users have validated the proposed TMS/WAS workflow?
6. Which users still need to be convinced before top-management presentation?
7. What are the strongest objections from plant users?
8. What are the strongest acceptance signals from plant users?
9. Which process owners must sign off the product flow?
10. What level of evidence will make the plant comfortable presenting to top management?

### 16.2 Demonstration Scenarios

1. Which 5-10 real orders should be used for product-flow demonstration?
2. Which scenario should prove due-date quotation?
3. Which scenario should prove overloaded week handling?
4. Which scenario should prove FastReact coexistence or replacement?
5. Which scenario should prove sewing line loading?
6. Which scenario should prove laundry bottleneck scheduling?
7. Which scenario should prove rewash and capacity recalculation?
8. Which scenario should prove cutting and finishing planning visibility?
9. Which scenario should prove short-shipment risk?
10. Which scenario should prove plan freeze and governed change?

---

## 17. Discussion Topic 15: Product Build Alignment

### 17.1 Fit Against Current Eratex Build Direction

1. Does the current product build cover the application flow expected by the consulting team?
2. Does the current product build cover the planning visibility expected by plant users?
3. Does the current product build cover source-of-truth and interface governance adequately?
4. Does the current product build cover FastReact coexistence or replacement adequately?
5. Does the current product build cover due-date quotation adequately?
6. Does the current product build cover sewing scheduling and line loading adequately?
7. Does the current product build cover cutting planning adequately?
8. Does the current product build cover finishing planning adequately?
9. Does the current product build cover laundry planning adequately?
10. Does the current product build cover TMS/WAS workflow integration adequately?

### 17.2 Product Gaps To Record

1. Which consulting-team expectations are already covered by the Eratex Operating Spine?
2. Which expectations require enhancement to current product scope?
3. Which expectations are out of current build phase but important for mature production-grade rollout?
4. Which expectations conflict with current product boundary decisions?
5. Which expectations are not yet validated enough to build?
6. Which expectations require prototype updates?
7. Which expectations require backend data-model updates?
8. Which expectations require integration build-out?
9. Which expectations require seed/demo scenario updates?
10. Which expectations should be deferred until after plant pilot?

---

## 18. Required Outputs From Consulting Team

The workshop should not close with verbal agreement only. The consulting team should provide the following artifacts:

| Output | Purpose |
|---|---|
| Current technology landscape map | Shows current tools, users, and data movement. |
| Source-of-truth matrix | Confirms ownership of order, style, BOM, SMV, wash, plan, WIP, and dispatch data. |
| Interface inventory | Clarifies Datatex, FastReact, Excel, and other data-source feasibility. |
| FastReact coexistence/replacement note | Defines whether FastReact remains, feeds, receives, or gets replaced. |
| End-to-end application flow | Shows inquiry -> quotation -> planning -> release -> execution -> dispatch. |
| User-role journey map | Defines what each business role sees and does in the application. |
| Planning-zone governance note | Defines future, volatile, firm, frozen zones and change rules. |
| Laundry scheduling logic note | Details route, batch, machine, dryer, QC, rewash, and capacity behavior. |
| Validated performance baseline | Confirms all quantified problem numbers and measurement definitions. |
| Pilot scenario pack | Provides real orders and edge cases for product demonstration and UAT. |
| Product gap register | Shows what should be changed, added, deferred, or rejected in the build approach. |

---

## 19. Decision Gates Before Top-Management Presentation

Before presenting the solution to top management, the business team should confirm:

1. Plant users agree that the proposed application flow reflects operational reality.
2. Planning users understand how weekly planning, workcenter load, daily release, and plan freeze will be visible.
3. Laundry users agree that route, batch, machine, dryer, QC, and rewash complexity is understood.
4. FastReact coexistence or replacement strategy is explicit.
5. Datatex and other data-source assumptions are validated.
6. Performance numbers are backed by accepted source data.
7. The software demonstration uses real order scenarios, not abstract mock data only.
8. Interfaces and manual fallback paths are documented.
9. Open product gaps are classified as must-have, pilot-phase, mature-phase, or out-of-scope.
10. The business team can explain exactly how the product will move from inquiry to dispatch and how users will act daily.

---

## 20. Recommended Workshop Sequence

| Session | Topic | Primary Participants |
|---|---|---|
| 1 | Technology landscape and source of truth | IT, planning, merchandising, consulting team, product team |
| 2 | Inquiry to due-date quotation flow | Merchandising, planning, sales/customer coordination |
| 3 | Planning zones, weekly planning, freeze governance | Planning head, PPIC, production leadership |
| 4 | Sewing scheduling and line loading | Planning, IE, sewing managers, line supervisors |
| 5 | Cutting and finishing planning | Cutting, finishing, packing, planning |
| 6 | Laundry deep dive | Laundry head, wash technicians, QC, planning |
| 7 | Interfaces and FastReact replacement/coexistence | IT, planning, FastReact users, product team |
| 8 | Performance baseline validation | Business excellence, finance/control, plant leadership |
| 9 | Pilot scenario selection | Plant users, business team, product team |
| 10 | Product gap review and top-management readiness | Vivek, Pradeep, Punit, consulting leads, product/build team |

---

## 21. Closing Note

The main purpose of this questionnaire is to move the discussion from "solution concept accepted" to "solution behavior validated." The business team should use the answers to decide whether the current Eratex product build can be shown to the client as-is, whether selected flows need refinement, and which scenarios must be demonstrated first to build plant confidence before top-management exposure.
