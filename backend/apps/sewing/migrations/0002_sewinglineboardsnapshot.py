import django.db.models.deletion
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sewing", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SewingLineBoardSnapshot",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        editable=False,
                        default=uuid.uuid4,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_active", models.BooleanField(default=True)),
                ("board_sequence", models.PositiveIntegerField(default=999)),
                ("production_po_no", models.CharField(blank=True, max_length=120)),
                ("production_style_code", models.CharField(blank=True, max_length=120)),
                (
                    "style_smv",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        max_digits=8,
                    ),
                ),
                ("display_status", models.CharField(default="RUNNING", max_length=40)),
                ("actual_output", models.PositiveIntegerField(default=0)),
                ("net_good_output", models.PositiveIntegerField(default=0)),
                (
                    "defect_percent",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        max_digits=5,
                    ),
                ),
                ("planned_manpower", models.PositiveIntegerField(default=0)),
                ("actual_manpower", models.PositiveIntegerField(default=0)),
                ("bottleneck_operation_name", models.CharField(blank=True, max_length=160)),
                (
                    "bottleneck_smv",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        max_digits=8,
                    ),
                ),
                ("bottleneck_station", models.CharField(blank=True, max_length=40)),
                ("wip_accumulation", models.PositiveIntegerField(default=0)),
                ("hourly_output_json", models.JSONField(blank=True, default=list)),
                ("operator_allocation_json", models.JSONField(blank=True, default=list)),
                ("absence_impact", models.TextField(blank=True)),
                ("recovery_action_text", models.TextField(blank=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "line_loading",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_snapshot",
                        to="sewing.sewinglineloading",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_updated",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["board_sequence", "line_loading__line__code"],
            },
        ),
    ]
