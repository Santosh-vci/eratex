# BlueKaktus Capability Crosswalk

This matrix summarizes the modules documented in this folder. "Logic" includes official logic where stated and apparel-system interpretation where the public site does not disclose implementation detail.

## 1. Manufacturer ERP and MES

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement |
|---|---|---|---|---|---|
| Merchandising | Buyer enquiry, sampling, costing, TNA, order conversion, BOM | Enquiry-to-sample/order workflow, costing versions, milestone calendars, BOM generation | Faster order conversion, shorter sampling timelines, margin visibility | Merchandisers operate style/order readiness in one system | Configure enquiry, costing, sample, TNA, BOM, approval roles |
| Procurement | PO, job work, GRN, inspection, stock, valuation | BOM/order-to-PO, GRN validation, QC gate, stock valuation, traceability | Faster PO processing, GRN accuracy, material traceability | Procurement readiness becomes visible to planners | Material/vendor masters, PO/GRN rules, QC parameters, inventory/finance integration |
| Production Planning | Routing, SAM, lot/cut planning, output, consumption, WIP | Route/SAM baseline, dye-lot/cut optimization, daily output, raw-material consumption, WIP valuation | Faster execution, lower wastage, WIP visibility | Production plan is linked to material, route, cost, and WIP | Configure routes, SAM, cut logic, WIP valuation, production reports |
| Shipping Documentation | Invoice, packing list, dispatch, carrier, tracking, incentive claims | Document generation from order data, shipment tracking, claim status, audit versions | Faster docs, fewer invoice errors, shipment traceability | Export docs are generated from controlled operational data | Document templates, export fields, carrier/status integrations |
| Finance Accounting | Operational accounting, bill passing, vouchers, P&L, balance sheet | Operational-event posting, PO/GRN invoice validation, debit/credit notes, ledger reporting | Faster bill approvals, real-time reporting, audit readiness | Finance records are tied to procurement, job work, production, and inventory | Chart of accounts, vouchers, taxes, approvals, ledger integration |
| MES | Daily targets, live monitoring, display boards, analytics | Target vs actual, real-time process tracking, KPI dashboards | Faster target achievement, productivity, floor transparency | Shop-floor status is captured during execution | Lines, shifts, output capture, dashboards, display-board sync |
| Planning Board | Real-time line management, daily goals, bottlenecks | Line-wise targets, T&A/material readiness alerts, workload balancing, historical analytics | Less idle time, better planning efficiency, line visibility | Planner uses a visual board rather than spreadsheets | Capacity setup, TNA/material signals, MES feedback, cost context |
| Line/Day Planning | Daily line and shift scheduling, manpower, capacity | Drag/drop allocation, style-line-shift fit, manpower skills, planned vs actual | Less idle time, daily target visibility, manpower efficiency | Factory managers schedule lines with live capacity context | Line/shift/manpower/skill masters, HR/MES integration |
| Quality | Incoming/WIP/final inspection, alerts, defect visibility | Inspection status, pass/fail, defect trends, recurring defect alerts, planning feedback | Earlier issue detection, zero-defect orientation, accountability | QC results become planning and execution signals | Defect library, inspection checkpoints, dashboards, alerts |

## 2. Brand, Buying-House, and Retailer Platform

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement |
|---|---|---|---|---|---|
| Concept-to-Shelf Planning | Season/drop/month calendars and launch progress | Calendar configuration, milestone progress, cross-functional ownership | Faster decisions and speed to market | Product teams operate launch calendars centrally | Calendar hierarchy, owners, milestone templates, dashboards |
| Pre-Production | Product development before sampling/order execution | Product library, design updates, tech pack generation, BOM updates, graded specs | Faster development, less manual entry, better collaboration | Early product data is governed before sourcing execution | Product libraries, design integrations, BOM/spec templates |
| Design Collaboration | Design/fabric upload, sharing, enquiry, feedback | Product metadata, catalog sharing, enquiry tracking, approval/negotiation status | Reduced coordination, faster development | Design and sourcing decisions live in shared repository | Design library, user roles, catalog metadata, sharing workflows |
| Sampling TNA and Costing | Sample orders, TNA, approvals, vendor costing | AI TNA library, auto-assignment, cost comparison, alerts, multi-stage costing | Faster sampling approvals, less manual tracking, cost transparency | Sample and costing status is shared across teams | TNA templates, costing fields, mobile/web update workflows |
| Auto Capacity Allocation | Vendor capacity and order allocation | Real-time capacity, merit-based ranking, business rules, auto T&A | Better vendor workload, fewer bottlenecks, OTIF support | Allocation decisions become data-backed | Vendor capacity model, scorecards, allocation rules, T&A templates |
| Demand Forecasting and Replenishment | Inventory planning, NOOS, replenishment orders | AI forecast, sales velocity, seasonality, inventory norms, multi-echelon stock | Fewer stockouts, less overstock, higher turns | Replenishment becomes forecast and rule driven | Sales/inventory feeds, forecast model, stock norms, order generation |
| Production Tracking | Vendor production TNA and order lifecycle | Milestone status, automated upload/tracking, lead-time/fill-rate analysis, alerts | Fewer delays, better fulfillment | Brands track vendor execution centrally | Vendor access, mobile/web updates, TNA libraries, alerts |
| Quality and Technical | Inspection scheduling, AQL, defects, PP/proto approval | Inspection calendar, AQL charts, defect/CAPA, risk checks | Reduced defects, QA efficiency, consistent quality | QA works in mobile/web inspection workflows | Inspection types, AQL rules, defect library, dashboards |
| Compliance QMS and Sustainability | Vendor onboarding, audits, CAPA, compliance scorecards | Compliance screening, audit scoring, CAPA tracking, document repository | Lower risk, audit accuracy, ethical sourcing | Vendor eligibility is governed by compliance state | Audit templates, compliance documents, scorecards, CAPA workflow |

## 3. Product Data, Collaboration, and AI/Automation Layer

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement |
|---|---|---|---|---|---|
| Vendor Portal | Vendor approvals, invoices, ledgers, debit notes | Role-based vendor access, one-click approvals, invoice tracking, ledger visibility | Faster PO confirmation, fewer follow-ups | Vendors self-serve controlled actions | Vendor onboarding, permissions, document upload, finance/procurement links |
| Advanced Product Catalog | Product discovery and buyer sharing | Voice, fuzzy, image/reverse search, AI attribute recognition, export generation | Faster search, fewer buyer follow-ups | Users search/share product data from one catalog | Image ingestion, taxonomy, AI search, export templates |
| Tech Pack | Product specification, versions, approvals, BOM/cost links | Version control, sample tracking, approval logs, BOM/costing integration | Faster design-to-production, fewer handoff errors | Current product spec is controlled in system | Spec templates, measurement libraries, approval gates, BOM sync |
| Warehouse and POS | Receiving, putaway, pick/pack/ship, transfers, retail billing | Barcode receiving, bin management, stock transfer, POS, omnichannel sync | Fewer stockouts, faster replenishment, sales visibility | Inventory and sales share a unified stock view | Warehouse/bin/store masters, barcode, POS, channel integrations |
| RoboSheet | Data onboarding and standardization | Spreadsheet-to-system field mapping and validation | Less manual entry, faster onboarding, cleaner data | Legacy records are normalized for system import | Data mapping, validation, cleansing, import governance |
| IVA | Natural language and predictive data assistance | AI co-pilot, natural language, predictive recommendations | Real-time insights, faster procurement decisions | Users query or act on operations through assisted workflows | Domain metrics, access control, AI governance, integration with data layer |
| WhatsApp Automation | Vendor confirmations, alerts, tracking | WhatsApp Business API messages, secure action links, alerts | Faster confirmations, fewer manual follow-ups | WhatsApp becomes a governed workflow channel | API setup, message templates, consent, audit logging |
| Excel Builder | Dynamic reporting and documentation | Data mapping to templates, report/document generation | Faster document creation, consistent outputs | Excel outputs are generated from system data | Template design, field mapping, export controls |

## 4. Overall Pattern

Across the public offering, BlueKaktus repeats the same operating pattern:

1. Centralize operational records.
2. Configure workflows and approval stages.
3. Use TNA, capacity, quality, cost, and inventory logic to make risks visible.
4. Push actions through dashboards, mobile apps, portals, WhatsApp, and generated documents.
5. Feed actual execution, quality, and finance data back into planning.

The implementation lesson is that BlueKaktus sells connected operating visibility as much as it sells planning algorithms. The planning promise depends on data continuity across product specs, BOM, TNA, vendor capacity, material readiness, production output, quality status, WIP, inventory, shipment, and finance.
