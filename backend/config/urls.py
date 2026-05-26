from django.contrib import admin
from django.urls import path

from apps.common.views import health_view, ping_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health_view, name="health"),
    path("api/v1/ping", ping_view, name="api-ping"),
]

