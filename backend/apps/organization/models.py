from django.db import models

from apps.common.models import BaseModel


class Factory(BaseModel):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=160)
    timezone = models.CharField(max_length=64, default="Asia/Jakarta")

    class Meta:
        ordering = ["code"]
        verbose_name_plural = "factories"

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class Department(BaseModel):
    class DepartmentType(models.TextChoices):
        PLANNING = "PLANNING", "Planning"
        PRODUCTION = "PRODUCTION", "Production"
        QUALITY = "QUALITY", "Quality"
        WASH = "WASH", "Wash"
        WAREHOUSE = "WAREHOUSE", "Warehouse"
        SHIPMENT = "SHIPMENT", "Shipment"
        TECHNICAL = "TECHNICAL", "Technical"
        ADMIN = "ADMIN", "Admin"

    factory = models.ForeignKey(Factory, on_delete=models.PROTECT, related_name="departments")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=160)
    department_type = models.CharField(max_length=32, choices=DepartmentType.choices)

    class Meta:
        ordering = ["factory__code", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["factory", "code"], name="unique_department_code_factory"
            )
        ]

    def __str__(self) -> str:
        return f"{self.factory.code}/{self.code}"


class Workcenter(BaseModel):
    class WorkcenterType(models.TextChoices):
        CUTTING = "CUTTING", "Cutting"
        SEWING = "SEWING", "Sewing"
        WASH = "WASH", "Wash"
        FINISHING = "FINISHING", "Finishing"
        PACKING = "PACKING", "Packing"
        QUALITY = "QUALITY", "Quality"

    factory = models.ForeignKey(Factory, on_delete=models.PROTECT, related_name="workcenters")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="workcenters")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=160)
    workcenter_type = models.CharField(max_length=32, choices=WorkcenterType.choices)
    capacity_unit = models.CharField(max_length=32, default="MINUTES")

    class Meta:
        ordering = ["factory__code", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["factory", "code"], name="unique_workcenter_code_factory"
            )
        ]

    def __str__(self) -> str:
        return f"{self.factory.code}/{self.code}"


class Line(BaseModel):
    factory = models.ForeignKey(Factory, on_delete=models.PROTECT, related_name="lines")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="lines")
    workcenter = models.ForeignKey(
        Workcenter,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="lines",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=160)
    line_type = models.CharField(max_length=64, default="SEWING")

    class Meta:
        ordering = ["factory__code", "code"]
        constraints = [
            models.UniqueConstraint(fields=["factory", "code"], name="unique_line_code_factory")
        ]

    def __str__(self) -> str:
        return f"{self.factory.code}/{self.code}"


class ShiftCalendar(BaseModel):
    factory = models.ForeignKey(Factory, on_delete=models.PROTECT, related_name="shift_calendars")
    name = models.CharField(max_length=120)
    start_time = models.TimeField()
    end_time = models.TimeField()
    working_minutes = models.PositiveIntegerField(default=480)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["factory__code", "name"]
        constraints = [
            models.UniqueConstraint(fields=["factory", "name"], name="unique_shift_name_factory")
        ]

    def __str__(self) -> str:
        return f"{self.factory.code}/{self.name}"


class HolidayCalendar(BaseModel):
    factory = models.ForeignKey(Factory, on_delete=models.PROTECT, related_name="holidays")
    holiday_date = models.DateField()
    name = models.CharField(max_length=160)

    class Meta:
        ordering = ["factory__code", "holiday_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["factory", "holiday_date"],
                name="unique_holiday_date_factory",
            )
        ]

    def __str__(self) -> str:
        return f"{self.factory.code}/{self.holiday_date}"
