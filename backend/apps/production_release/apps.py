from django.apps import AppConfig


class ProductionReleaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.production_release"
