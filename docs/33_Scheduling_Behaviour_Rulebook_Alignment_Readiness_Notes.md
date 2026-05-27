# Scheduling Behaviour Rulebook Alignment Readiness Notes

## Purpose

This readiness note records implementation ownership for the scheduling behaviour rulebook alignment described in `docs/25_Phase_4A_Scheduling_Behaviour_Rulebook_Alignment_Patch.md`.

The alignment is additive to the Phase 1-4 foundation and uses domain names in code. It does not introduce full WIP, sewing execution, wash execution, shipment workflow, mature simulation, or bidirectional FastReact integration.

## Ownership

| Role | Ownership |
|---|---|
| Product Owner | Confirms boundary-case scenarios SCN-014 to SCN-023 represent real factory disruption cases. |
| Tech Lead | Owns service-layer boundaries, no phase-named backend artifacts, and future-phase consumption rules. |
| Backend Lead | Owns `boundary_cases`, `external_plans`, planning zones, capacity definitions, order-change preview, RBAC, audit, and seed validation. |
| Frontend Lead | Owns `/boundary-cases`, `BoundaryImpactPreviewDrawer`, planning-zone badges, capacity-definition visibility, and boundary blockers in release control. |
| DevOps Lead | Owns Docker-first validation and keeping the local stack running after handoff. |
| QA Lead | Owns rulebook tests for scheduling grain, frozen/firm/flexible governance, capacity events, order cancellation, shipment pull-in, repeat wash approval, external plan conflicts, and seed scenario validation. |

## Verification Gate

Readiness items may be marked verified only after the Docker checks pass:

```powershell
docker compose build backend
docker compose run --rm backend python -m ruff check .
docker compose run --rm backend python manage.py makemigrations --check --dry-run
docker compose run --rm backend python manage.py check
docker compose run --rm backend python -m pytest
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run typecheck
docker compose run --rm --no-deps frontend npm run test
docker compose run --rm --no-deps frontend npm run build
docker compose up --build -d backend frontend
docker compose exec -T backend python manage.py seed_eos04
docker compose exec -T backend python manage.py validate_seed_scenarios
docker compose --profile test run --rm frontend_e2e
```

## UI Governance Gap

`/boundary-cases` has no dedicated `docs/frontend_ui` prototype folder at implementation time. The approved default is to reuse the existing operational shell, dense table, risk/status badges, and right-drawer interaction pattern from the Phase 4 workcenter load and daily release prototypes until a route-specific prototype is supplied.
