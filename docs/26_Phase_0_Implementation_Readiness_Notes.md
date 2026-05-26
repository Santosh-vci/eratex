# 26. Phase 0 Implementation Readiness Notes
# Build-Start Readiness and Repository Foundation

**Company:** Eratex  
**Product:** Planning and Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Phase:** Phase 0  
**Branch:** `dev`  
**Status:** Implemented and locally verified  

---

## 1. Purpose

This note records Phase 0 readiness ownership and verification evidence for the repository foundation.

Phase 0 creates the runnable monorepo baseline only:

```text
Django/DRF backend
Next.js frontend
PostgreSQL
Redis
Celery worker and beat
Docker Compose
GitHub Actions CI
health and ping endpoints
placeholder frontend routes
test/lint/build commands
```

Business modules start in later phases.

---

## 2. Gate 0 Ownership

| Readiness Area | Owner Role | Phase 0 Evidence |
|---|---|---|
| MVP scope boundary | Product Owner | Existing docs 23 and 25 define MVP boundary |
| Architecture baseline | Tech Lead | Monorepo, Docker Compose, backend, frontend, and CI structure |
| Backend foundation | Backend Lead | Django project, DRF, health API, ping API, pytest, ruff |
| Frontend foundation | Frontend Lead | Next.js project, placeholder routes, lint/typecheck/test/build scripts |
| DevOps baseline | DevOps Lead | Compose stack and GitHub Actions workflow |
| QA baseline | QA Lead | Backend tests, frontend unit test, Playwright smoke test |

---

## 3. Gate 1 Ownership

| Readiness Area | Owner Role | Phase 0 Evidence |
|---|---|---|
| Local development setup | DevOps Lead | `docker compose up --build` target |
| Backend app starts | Backend Lead | `backend` Compose service and Django health endpoint |
| Frontend app starts | Frontend Lead | `frontend` Compose service and `/` route |
| PostgreSQL starts | DevOps Lead | `postgres` service with healthcheck |
| Redis starts | DevOps Lead | `redis` service with healthcheck |
| Celery worker starts | Backend Lead | `celery_worker` service |
| Celery beat starts | Backend Lead | `celery_beat` service |
| Health endpoint available | Backend Lead | `GET /health` |
| API envelope baseline | Backend Lead | `GET /api/v1/ping` |
| CI baseline | Tech Lead | `.github/workflows/ci.yml` |

---

## 4. Verification Commands

Actual local verification on 2026-05-27:

```text
Backend:
- ruff check . -> passed
- pytest -> 5 passed
- python manage.py makemigrations --check --dry-run -> passed, no changes detected

Frontend:
- npm run lint -> passed
- npm run typecheck -> passed
- npm run test -> passed
- npm run build -> passed
- npm run test:e2e -> passed

Full stack:
- docker compose config -> passed
- docker compose up --build -d -> passed
- GET /health -> passed, database and redis ok
- GET /api/v1/ping -> passed, standard API envelope returned
- GET / on frontend -> passed, HTTP 200
```

---

## 5. Phase 0 Non-Goals

The following are intentionally deferred:

```text
authentication and RBAC
domain models
master data workflows
business dashboards
seed scenarios
real PWA offline behavior
production reverse proxy
backup and restore automation
observability stack
```
