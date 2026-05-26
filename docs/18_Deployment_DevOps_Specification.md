# 18. Deployment and DevOps Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Deployment and DevOps Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Preferred Backend Stack:** Django + Django REST Framework + PostgreSQL + Redis + Celery  
**Preferred Frontend Stack:** Next.js / React + TypeScript + PWA  
**Deployment Baseline:** Dockerized stack  
**Related Documents:**  
- 01 Technical Architecture Spine  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 13 Frontend Implementation Specification  
- 15 Integration Specification  
- 16 Security, Roles, and Permissions Specification  
- 17 Audit, Compliance, and Traceability Specification  

---

## 1. Purpose

This document defines the deployment and DevOps specification for the Eratex Planning & Scheduling Platform.

The platform is expected to support a mission-critical planning and execution workflow for garment manufacturing. It must be deployable, maintainable, observable, secure, recoverable, and scalable.

This document covers:

```text
deployment architecture
Docker setup
environment strategy
repository structure
configuration management
CI/CD
database migration
static/media handling
background workers
scheduled jobs
logging
monitoring
backups
disaster recovery
security hardening
release governance
rollback
operational runbooks
```

---

## 2. DevOps Thesis

The platform should be built as an operationally reliable product, not as a local-only application.

The DevOps principle is:

```text
Every environment should be reproducible, observable, secure, and recoverable.
```

The deployment setup must support:

```text
fast local development
safe staging validation
controlled production release
clear rollback path
database backup and restore
traceable deployments
environment-specific configuration
```

---

## 3. Deployment Scope

The deployment scope includes:

```text
Django backend API
Django Admin
PostgreSQL database
Redis
Celery workers
Celery beat scheduler
Next.js frontend
PWA static assets
Nginx/Caddy reverse proxy
media/file storage
logs
monitoring
backup jobs
CI/CD pipeline
```

Optional future components:

```text
analytics warehouse
object storage
message broker beyond Redis
Kubernetes
managed PostgreSQL
managed Redis
CDN
centralized observability stack
```

---

# Part A: Target Deployment Architecture

---

## 4. Recommended MVP Architecture

For MVP, use a Docker Compose-based deployment.

```text
reverse proxy
→ frontend container
→ backend API container
→ PostgreSQL
→ Redis
→ Celery worker
→ Celery beat
```

### 4.1 Container List

```text
eratex_frontend
eratex_backend
eratex_postgres
eratex_redis
eratex_celery_worker
eratex_celery_beat
eratex_reverse_proxy
```

Optional:

```text
eratex_flower, for Celery monitoring
eratex_prometheus
eratex_grafana
eratex_loki
```

---

## 5. Logical Architecture

```text
User browser / PWA
    ↓
HTTPS reverse proxy
    ↓
Frontend Next.js app
    ↓
Django REST API
    ↓
PostgreSQL
    ↓
Redis / Celery for background jobs
```

Celery handles:

```text
daily snapshots
exception scans
integration runs
import apply jobs
data freshness checks
notification jobs
backup triggers if configured
```

---

## 6. Environment Types

Recommended environments:

```text
local
development
staging
production
```

### 6.1 Local

Purpose:

```text
developer machine
fast iteration
seed data
debugging
```

### 6.2 Development

Purpose:

```text
shared internal dev validation
integration testing
early QA
```

### 6.3 Staging

Purpose:

```text
production-like validation
UAT
release rehearsal
migration testing
performance testing
```

### 6.4 Production

Purpose:

```text
live operational use
controlled access
backups
monitoring
strict change control
```

---

## 7. Environment Parity

The environments should be as similar as practical.

Same core stack:

```text
Docker
Django
PostgreSQL
Redis
Celery
Frontend
Reverse proxy
```

Differences should be controlled through:

```text
environment variables
secrets
resource sizing
debug flags
allowed hosts
logging level
backup schedules
```

---

# Part B: Docker Specification

---

## 8. Docker Compose Files

Recommended compose file structure:

```text
docker-compose.yml
docker-compose.override.yml
docker-compose.dev.yml
docker-compose.staging.yml
docker-compose.prod.yml
```

Alternative simpler MVP structure:

```text
docker-compose.yml
.env.local
.env.staging
.env.production
```

---

## 9. Backend Dockerfile

Backend image should include:

```text
Python runtime
system dependencies
Python dependencies
Django project
entrypoint script
gunicorn
```

Recommended production server:

```text
gunicorn
```

Example runtime command:

```text
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

ASGI can be considered if real-time websockets are introduced later.

---

## 10. Frontend Dockerfile

Frontend image should include:

```text
Node.js runtime
package install
Next.js build
production server
```

Recommended:

```text
next build
next start
```

or static export if the frontend is fully static and backend API is separate.

---

## 11. Celery Worker Container

Worker command:

```text
celery -A config worker -l INFO
```

Worker queues may be separated later:

```text
default
integrations
analytics
notifications
imports
```

---

## 12. Celery Beat Container

Beat command:

```text
celery -A config beat -l INFO
```

Beat should schedule:

```text
snapshot jobs
exception scans
data freshness scans
integration syncs
notification digests
```

---

## 13. Redis Container

Redis is used for:

```text
Celery broker
cache
short-lived coordination
```

For MVP:

```text
single Redis container
```

For production hardening:

```text
managed Redis or persistent Redis with security
```

---

## 14. PostgreSQL Container

PostgreSQL is the main system of record.

For MVP/prototype:

```text
containerized PostgreSQL with persistent volume
```

For production:

```text
managed PostgreSQL preferred if available
or hardened self-hosted PostgreSQL with backups and monitoring
```

---

## 15. Reverse Proxy

Recommended options:

```text
Nginx
Caddy
Traefik
```

Caddy is simpler for automatic HTTPS if internet-facing.

Nginx is widely used and predictable.

Reverse proxy responsibilities:

```text
TLS termination
route frontend traffic
route API traffic
serve media if configured
request size limits
compression
security headers
```

---

# Part C: Repository Structure

---

## 16. Recommended Monorepo Structure

```text
eratex-platform/
  backend/
    manage.py
    config/
    apps/
    requirements/
    Dockerfile
    entrypoint.sh
  frontend/
    package.json
    next.config.js
    src/
    Dockerfile
  infra/
    docker/
    nginx/
    caddy/
    scripts/
  docs/
  docker-compose.yml
  docker-compose.dev.yml
  docker-compose.prod.yml
  .env.example
  README.md
```

---

## 17. Backend App Structure

Backend should follow domain modules as defined earlier.

```text
backend/apps/
  identity_access/
  organization/
  master_data/
  orders/
  style_technical/
  materials_procurement/
  fabric_qc/
  pcd_readiness/
  planning/
  production_release/
  workcenters/
  sewing/
  washing/
  wip_inventory/
  quality/
  exceptions/
  shipment/
  analytics/
  integrations/
  audit_governance/
  common/
```

---

## 18. Frontend Structure

```text
frontend/src/
  app/
  modules/
  components/
  services/
  types/
  hooks/
  utils/
```

---

# Part D: Configuration Management

---

## 19. Environment Variables

All environment-specific configuration must come from environment variables.

Do not hardcode:

```text
database credentials
secret key
API base URL
allowed hosts
CORS origins
SMTP credentials
object storage credentials
integration tokens
```

---

## 20. Backend Environment Variables

Recommended:

```text
DJANGO_SETTINGS_MODULE
DJANGO_SECRET_KEY
DJANGO_DEBUG
DJANGO_ALLOWED_HOSTS
DATABASE_URL
REDIS_URL
CELERY_BROKER_URL
CELERY_RESULT_BACKEND
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
TIME_ZONE
MEDIA_ROOT
STATIC_ROOT
EMAIL_HOST
EMAIL_PORT
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
DEFAULT_FROM_EMAIL
```

---

## 21. Frontend Environment Variables

Recommended:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_APP_ENV
NEXT_PUBLIC_APP_VERSION
NEXT_PUBLIC_ENABLE_PWA
NEXT_PUBLIC_SENTRY_DSN, if used
```

---

## 22. .env Files

Use:

```text
.env.example
.env.local
.env.staging
.env.production
```

Rules:

```text
.env.example may be committed
real .env files must not be committed
secrets must be managed securely
```

---

## 23. Secret Management

MVP:

```text
server-side .env files with restricted access
```

Mature:

```text
Docker secrets
cloud secret manager
Vault
Kubernetes secrets
```

---

# Part E: Database Migration and Data Management

---

## 24. Django Migrations

Rules:

```text
all model changes must create migrations
migrations must be committed
migrations must be tested on staging
production migrations must be part of release checklist
```

---

## 25. Migration Safety

Before production migration:

```text
backup database
run migration in staging
check migration duration
review destructive changes
prepare rollback plan
```

---

## 26. Seed Data

Seed data required for:

```text
roles
permission actions
planning thresholds
WIP stages
exception categories
severity definitions
workcenter types
wash route sample data
defect codes
status lookups
```

Use Django management commands:

```text
python manage.py seed_core_master_data
python manage.py seed_permissions
python manage.py seed_demo_factory
```

---

## 27. Data Migration Scripts

For one-time go-live imports:

```text
opening WIP
order backlog
style master
operation bulletins
line/machine master
```

Scripts should be:

```text
idempotent
logged
dry-run capable where practical
```

---

# Part F: Static, Media, and File Storage

---

## 28. Static Files

Django static files:

```text
collectstatic
```

Serve via:

```text
reverse proxy
or static files volume
```

Frontend static assets served by Next.js or reverse proxy.

---

## 29. Media Files

Media includes:

```text
QC images
evidence attachments
import files
export files
audit evidence
```

MVP storage:

```text
mounted Docker volume
```

Production recommended:

```text
object storage such as S3-compatible storage
```

---

## 30. File Retention

Define retention for:

```text
import files
export files
QC images
audit evidence
temporary files
```

No file should be stored without linked entity metadata.

---

# Part G: CI/CD Pipeline

---

## 31. CI Pipeline Goals

CI should ensure:

```text
code builds
tests pass
linting passes
migrations are valid
frontend compiles
Docker images build
```

---

## 32. Backend CI Steps

```text
checkout code
set up Python
install dependencies
run formatting/lint checks
run unit tests
run API tests
check migrations
build backend Docker image
```

Recommended commands:

```text
python manage.py check
python manage.py makemigrations --check --dry-run
pytest
```

---

## 33. Frontend CI Steps

```text
checkout code
set up Node
install dependencies
type check
lint
unit tests
build Next.js app
build frontend Docker image
```

Recommended commands:

```text
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

---

## 34. Docker Image Tagging

Image tags should include:

```text
git commit SHA
environment
semantic version, if used
build timestamp
```

Example:

```text
eratex-backend:staging-2026-06-05-ab12cd3
eratex-frontend:prod-v1.3.0
```

---

## 35. CD Pipeline

For staging:

```text
build image
push image
deploy to staging
run migrations
run smoke tests
notify team
```

For production:

```text
manual approval
backup database
pull images
run migrations
restart services
run smoke tests
monitor logs
```

---

# Part H: Release Governance

---

## 36. Release Types

```text
feature release
bugfix release
hotfix release
data migration release
configuration-only release
```

---

## 37. Release Checklist

Before production release:

```text
code merged to release branch
CI passed
staging deployed
UAT sign-off
migration reviewed
backup completed
rollback plan prepared
release notes prepared
monitoring active
```

---

## 38. Release Notes

Release notes should include:

```text
version
date
features
bug fixes
database migrations
configuration changes
known issues
rollback notes
```

---

## 39. Rollback Strategy

Rollback may include:

```text
revert Docker image
restore previous frontend build
rollback database migration, if safe
restore database backup, if required
disable feature flag
```

Important:

```text
database rollback is the hardest part
```

Use forward-fix if rollback would risk data loss.

---

## 40. Feature Flags

Use feature flags for:

```text
new module rollout
mobile screens
offline sync
integration sync
advanced analytics
```

MVP can implement simple DB/config-based flags.

---

# Part I: Monitoring and Observability

---

## 41. Logging

Log categories:

```text
application logs
API access logs
Celery job logs
integration logs
import logs
security/auth logs
audit events
error logs
```

---

## 42. Log Standards

Logs should include:

```text
timestamp
level
service
request ID
user ID if available
correlation ID
message
exception stack if error
```

Do not log:

```text
passwords
secret keys
tokens
sensitive credentials
```

---

## 43. Monitoring Metrics

Monitor:

```text
API error rate
API latency
database CPU/memory/disk
database connection count
Redis health
Celery queue length
Celery task failures
container CPU/memory
disk usage
frontend availability
background job completion
integration failures
backup success
```

---

## 44. Health Check Endpoints

Backend:

```text
GET /health
GET /health/db
GET /health/redis
```

Frontend:

```text
GET /
```

Reverse proxy health checks should route accordingly.

---

## 45. Alerting

Create alerts for:

```text
backend down
frontend down
database down
Redis down
Celery worker down
Celery queue backlog high
daily snapshot failed
integration failed
backup failed
disk usage high
error rate high
```

---

## 46. Suggested Monitoring Stack

MVP simple:

```text
Docker logs
server monitoring
cron backup logs
manual health checks
```

Better:

```text
Prometheus
Grafana
Loki
Sentry
Uptime Kuma
```

---

# Part J: Background Jobs

---

## 47. Celery Job Types

```text
analytics snapshots
exception scans
data freshness scans
integration syncs
import apply
export generation
notification digest
cleanup jobs
```

---

## 48. Celery Queue Separation

MVP:

```text
single default queue
```

Mature:

```text
default
analytics
integrations
imports
notifications
exports
```

---

## 49. Scheduled Jobs

Recommended schedules:

| Job | Frequency |
|---|---|
| WIP ageing recalculation | hourly |
| exception rule scan | hourly |
| exception escalation scan | hourly |
| data freshness scan | hourly |
| daily analytics snapshots | daily after shift close |
| integration sync | configured per source |
| backup verification | daily |
| export cleanup | daily |

---

## 50. Job Failure Handling

If job fails:

```text
log failure
retry if safe
mark job status failed
create system exception if business-critical
notify admin if repeated
```

---

# Part K: Backup and Disaster Recovery

---

## 51. Backup Scope

Backup:

```text
PostgreSQL database
media files
import files if retained
configuration files
deployment compose files
```

---

## 52. Database Backup

Recommended:

```text
daily full backup
point-in-time recovery if possible
backup before production release
backup before major migration
```

For containerized PostgreSQL:

```text
pg_dump
```

Example:

```text
pg_dump -Fc $DATABASE_URL > backup.dump
```

---

## 53. Media Backup

If media stored on volume:

```text
scheduled archive and copy to backup location
```

If object storage:

```text
bucket versioning/lifecycle policy
```

---

## 54. Backup Retention

Example policy:

```text
daily backups retained 14 days
weekly backups retained 8 weeks
monthly backups retained 12 months
```

Final policy should be confirmed by Eratex.

---

## 55. Restore Testing

A backup that is never restored is not reliable.

Restore test should be done:

```text
before go-live
after major schema changes
periodically
```

---

## 56. Recovery Objectives

Define:

```text
RPO = acceptable data loss
RTO = acceptable recovery time
```

Suggested starting targets:

```text
RPO: 24 hours for MVP, lower later
RTO: 4–8 hours for MVP, lower later
```

If shopfloor live capture is mission-critical, stricter RPO/RTO may be needed.

---

# Part L: Security Hardening

---

## 57. HTTPS

Production must use HTTPS.

Reverse proxy should handle TLS.

---

## 58. Allowed Hosts and CORS

Django must configure:

```text
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
```

Do not allow wildcard CORS in production.

---

## 59. Database Credentials

Rules:

```text
strong password
not committed to repo
restricted access
least privilege where possible
```

---

## 60. Container Security

Rules:

```text
do not run unnecessary services
keep base images updated
avoid running as root where practical
limit exposed ports
scan images if tooling available
```

---

## 61. Network Exposure

Only expose:

```text
reverse proxy port 80/443
```

Do not publicly expose:

```text
PostgreSQL
Redis
Celery
internal backend port, unless required behind proxy
```

---

## 62. Admin Security

Django Admin should be protected by:

```text
strong authentication
limited users
HTTPS
optional IP restriction if feasible
audit for critical changes
```

---

# Part M: Performance and Scaling

---

## 63. Initial Production Sizing

Actual sizing depends on users, factories, WIP volume, and transaction frequency.

Starting MVP server may include:

```text
4–8 vCPU
16–32 GB RAM
200–500 GB SSD
PostgreSQL on same or separate host
daily backups
```

For serious production usage:

```text
separate DB server or managed DB
separate app workers
monitoring
backup storage
```

---

## 64. Scaling Levers

Backend:

```text
increase gunicorn workers
add backend replicas behind proxy
optimize DB queries
add indexes
cache read-heavy lookups
```

Celery:

```text
increase workers
split queues
schedule heavy jobs off-peak
```

Database:

```text
indexes
query tuning
connection pooling
read replica later
partition snapshots if needed
```

Frontend:

```text
CDN/static caching
bundle optimization
route-level splitting
```

---

## 65. Database Indexing

Critical indexed fields:

```text
order_no
customer_id
style_id
current_stage
risk_status
shipment_date
workcenter_id
line_id
stage
status
created_at
updated_at
owner_id
exception severity/status
wip stage/status
wash batch status
```

---

## 66. Large Table Strategy

Potential large tables:

```text
audit_event
wip_movement
sewing_output_entry
wash_batch_event
exception_record
daily snapshots
shopfloor offline sync logs
```

Use:

```text
indexes
archival
partitioning later if needed
```

---

# Part N: Data Refresh and Operational Readiness

---

## 67. Data Freshness Monitoring

Monitor freshness for:

```text
shopfloor output
wash execution
WIP movement
integration sync
shipment updates
attendance import
daily snapshots
```

Stale data should create:

```text
system/data exception
```

---

## 68. Go-Live Readiness Checklist

Before go-live:

```text
users created
roles assigned
master data loaded
orders imported
operation bulletins loaded
line/machine data loaded
opening WIP loaded and verified
PCD rules configured
WIP thresholds configured
backup tested
restore tested
mobile devices tested
staging UAT completed
monitoring active
support process ready
```

---

## 69. Pilot Strategy

Recommended:

```text
start with one factory or selected lines
start with selected product category
enable planning, WIP, sewing output, wash, exceptions
validate data discipline
then scale
```

Avoid big-bang rollout unless data and process maturity are high.

---

# Part O: Operational Runbooks

---

## 70. Required Runbooks

Create runbooks for:

```text
deployment
rollback
database backup
database restore
migration failure
Celery worker down
Redis down
PostgreSQL down
frontend down
backend API down
integration failed
import file failed
disk full
SSL certificate issue
user lockout
```

---

## 71. Example: Celery Worker Down

Checklist:

```text
check container status
check logs
restart worker
check Redis connectivity
check queue backlog
rerun failed task if safe
create incident note if recurring
```

---

## 72. Example: Database Restore

Checklist:

```text
stop application writes
identify backup
restore to staging first if possible
verify integrity
restore production
run migrations if needed
restart services
run smoke tests
notify users
```

---

# Part P: Developer Workflow

---

## 73. Local Development Setup

Developer should run:

```text
docker compose up --build
```

Then:

```text
backend at http://localhost:8000
frontend at http://localhost:3000
Django Admin at http://localhost:8000/admin
```

---

## 74. Local Commands

Backend:

```text
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_permissions
python manage.py runserver
pytest
```

Frontend:

```text
npm install
npm run dev
npm run build
npm run test
```

Docker:

```text
docker compose logs -f backend
docker compose exec backend python manage.py migrate
docker compose exec backend pytest
```

---

## 75. Coding Standards

Backend:

```text
formatting
linting
type hints where practical
service-layer business logic
tests for critical calculations
```

Frontend:

```text
TypeScript strictness
component reuse
API types
query hooks
test critical flows
```

---

# Part Q: Testing Across Environments

---

## 76. Test Types

```text
unit tests
service tests
API tests
frontend component tests
E2E tests
integration tests
migration tests
performance smoke tests
security permission tests
```

---

## 77. Smoke Tests After Deployment

Minimum:

```text
frontend loads
login works
/api/v1/me works
orders list loads
PCD screen loads
WIP pipeline loads
exception screen loads
Django Admin accessible to admin
Celery worker running
daily job can execute manually
```

---

## 78. Performance Smoke Tests

Check:

```text
order list response time
WIP pipeline response time
exception list response time
wash board response time
dashboard response time
```

Set initial target:

```text
common list APIs under 2 seconds for typical filters
critical action APIs under 3 seconds unless background job
```

---

# Part R: Documentation Requirements

---

## 79. Deployment Documentation

Maintain:

```text
README
environment setup guide
Docker compose guide
migration guide
release checklist
rollback guide
backup/restore guide
integration setup guide
monitoring guide
```

---

## 80. Configuration Register

Maintain a document or admin view for:

```text
environment variables
scheduled jobs
external integrations
backup schedules
feature flags
thresholds
```

---

# Part S: Implementation Phasing

---

## 81. Phase 1: Local Docker Foundation

Build:

```text
backend Dockerfile
frontend Dockerfile
PostgreSQL
Redis
Celery worker
Celery beat
docker-compose local setup
.env.example
README
```

---

## 82. Phase 2: Staging Deployment

Build:

```text
staging compose
reverse proxy
HTTPS
environment config
database volume
media volume
CI deployment
smoke tests
```

---

## 83. Phase 3: Production Baseline

Build:

```text
production compose
backup jobs
monitoring
log strategy
release checklist
rollback runbook
security hardening
```

---

## 84. Phase 4: CI/CD Automation

Build:

```text
backend CI
frontend CI
Docker image build
automated staging deploy
manual production approval
release tagging
```

---

## 85. Phase 5: Observability and Reliability

Build:

```text
central logs
metrics dashboard
alerts
backup restore drills
job monitoring
integration monitoring
```

---

## 86. Phase 6: Scale Hardening

Build as required:

```text
separate DB server
managed DB/Redis
load balancer
multiple backend replicas
queue separation
read replicas
object storage
Kubernetes, if justified
```

---

# Part T: Open Decisions

---

## 87. Decisions Required

Before implementation, confirm:

1. Deployment target: on-prem, VPS, private cloud, or managed cloud?
2. Is Docker Compose sufficient for initial production?
3. Who will operate the server?
4. What RPO/RTO is required?
5. Is managed PostgreSQL available?
6. Is object storage available for attachments?
7. Is HTTPS certificate automated or manually managed?
8. What CI/CD platform will be used?
9. Are internet access and package registries available from server?
10. What monitoring stack is acceptable?
11. Is PWA offline use mission-critical from go-live?
12. How many concurrent users are expected?
13. How many shopfloor devices are expected?
14. What is the backup retention policy?
15. Are there enterprise IT security requirements to follow?

---

## 88. Non-Negotiable Rules

```text
1. Production must run with DEBUG disabled.
2. Secrets must not be committed to repository.
3. Production must use HTTPS.
4. Database and Redis must not be publicly exposed.
5. Database backups must be automated and tested.
6. Migrations must be tested in staging before production.
7. Celery worker and beat must be monitored.
8. Import and snapshot job failures must be visible.
9. Release must have rollback plan.
10. Critical environment differences must be documented.
```

---

## 89. Summary

This document defines the deployment and DevOps spine for the Eratex Planning & Scheduling Platform.

The platform should be deployed as a Dockerized stack with:

```text
Django backend
Next.js frontend
PostgreSQL
Redis
Celery worker
Celery beat
reverse proxy
persistent media
backups
monitoring
CI/CD
```

The operational success of the product depends not only on features but also on:

```text
reliable deployment
safe migrations
observability
backup and restore
controlled releases
security hardening
support runbooks
```

The guiding DevOps principle is:

```text
The production system must be reproducible, observable, secure, recoverable, and safely changeable.
```
