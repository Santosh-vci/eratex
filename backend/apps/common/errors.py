from dataclasses import dataclass
from dataclasses import field as dataclass_field
from typing import Any


@dataclass
class ApiError:
    code: str
    message: str
    field: str | None = None
    details: dict[str, Any] = dataclass_field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "field": self.field,
            "details": self.details,
        }


def error_response(
    code: str,
    message: str,
    *,
    field: str | None = None,
    details: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    return [ApiError(code, message, field, details or {}).as_dict()]
