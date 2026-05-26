from django.contrib import admin
from django.urls import path

from apps.audit_governance.api import entity_audit_view
from apps.common.views import health_view, ping_view
from apps.identity_access.api import csrf_view, login_view, logout_view, me_view, permissions_view
from apps.organization.api import departments_view, factories_view, lines_view, workcenters_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health_view, name="health"),
    path("api/v1/ping", ping_view, name="api-ping"),
    path("api/v1/me", me_view, name="api-me"),
    path("api/v1/permissions", permissions_view, name="api-permissions"),
    path("api/v1/auth/csrf", csrf_view, name="api-auth-csrf"),
    path("api/v1/auth/login", login_view, name="api-auth-login"),
    path("api/v1/auth/logout", logout_view, name="api-auth-logout"),
    path("api/v1/organization/factories", factories_view, name="api-organization-factories"),
    path("api/v1/organization/departments", departments_view, name="api-organization-departments"),
    path("api/v1/organization/workcenters", workcenters_view, name="api-organization-workcenters"),
    path("api/v1/organization/lines", lines_view, name="api-organization-lines"),
    path(
        "api/v1/audit/<str:entity_type>/<str:entity_id>", entity_audit_view, name="api-audit-entity"
    ),
]
