# 29. Phase 3 Implementation Readiness Notes
# Orders, Procurement, Fabric QC, and PCD Readiness

**Company:** Eratex
**Product:** Planning and Scheduling Tool for Denim Bottoms + Chinos Manufacturing
**Phase:** Phase 3
**Branch:** `dev`
**Status:** Implemented and locally verified

---

## 1. Purpose

This note records Phase 3 readiness ownership and verification evidence for the EOS-03 pre-production control layer.

Phase 3 adds:

```text
confirmed production orders
order lifecycle trace
material requirement and procurement ETA readiness
fabric lot, roll, and QC inspection state
PCD readiness checklist execution
conditional release governance
release-to-cutting gate validation
Phase 3 permissions and deterministic seed users/orders
pre-production frontend workbenches
```

---

## 2. Ownership

| Readiness Area | Owner Role | Phase 3 Evidence |
|---|---|---|
| Phase boundary and EOS-03 scope | Product Owner | Phase 3 non-goals recorded in `AGENTS.md`, `README.md`, and this note |
| App boundaries and API envelope | Tech Lead | `orders`, `materials_procurement`, `fabric_qc`, and `pcd_readiness` apps with `/api/v1` APIs |
| Order and lifecycle controls | Backend Lead | `ProductionOrder`, order lines, milestones, lifecycle events, and release-to-cutting services |
| Procurement and fabric readiness | Backend Lead | Material requirements, purchase-order ETA updates, fabric lots/rolls, QC inspections, waivers, and PCD sync services |
| PCD gate governance | Backend Lead | PCD checklist state, conditional release, expiry recalculation, blocker validation, and audit events |
| Pre-production workbench UI | Frontend Lead | Orders, order detail/trace, procurement follow-up, fabric QC, and PCD readiness routes |
| Dev stack and seed repeatability | DevOps Lead | Docker Compose stack plus `seed_phase3` command |
| Test and readiness evidence | QA Lead | Backend, frontend, Playwright, and full-stack verification listed below |

---

## 3. Verification Commands

Actual local verification on 2026-05-27:

```text
Backend:
- ..\.venv\Scripts\python -m ruff check . -> passed
- ..\.venv\Scripts\python manage.py makemigrations --check --dry-run -> passed, no changes detected
- ..\.venv\Scripts\python manage.py check -> passed, no issues
- ..\.venv\Scripts\python -m pytest -> passed, 33 tests

Frontend:
- npm run lint -> passed
- npm run typecheck -> passed
- npm run test -> passed, 8 files / 14 tests
- npm run build -> passed
- npm run test:e2e -> passed, 4 Chromium smoke tests

Full stack:
- docker compose config -> passed
- docker compose up --build -d -> passed
- docker compose exec -T backend python manage.py seed_phase3 -> Phase 1, Phase 2, and Phase 3 seed data loaded
- GET /health -> status ok, database ok, redis ok
- Authenticated GET /api/v1/orders as planner -> 5 orders returned
- Authenticated GET /api/v1/pcd-readiness as planner -> 5 readiness records returned
- Authenticated GET /api/v1/material-readiness as planner -> 5 readiness records returned
- Authenticated GET /api/v1/fabric-qc as planner -> lots and inspections payload returned
- Frontend /orders, /pcd-readiness, /procurement/vendor-follow-up, /fabric/qc -> HTTP 200
- docker compose down -> passed
```

---

## 4. Seed Scenarios

`seed_phase3` includes these pre-production order scenarios:

```text
ORD-HP-001
ORD-PCD-001
ORD-FABQC-001
ORD-MAT-001
ORD-MDATA-001
```

The scenarios cover ready orders, PCD blockers, fabric QC blockers, material ETA/shortage blockers, and master-data readiness blockers.

---

## 5. Phase 3 Non-Goals

The following remain deferred:

```text
planning algorithms
daily release execution
cutting output and bundles
WIP movement and reconciliation
sewing production execution
wash production execution
shipment workflow
full exception lifecycle
imports and exports beyond deterministic seed commands
offline/mobile behavior
```
