from collections.abc import Sequence
from typing import Any


def paginate_items(
    items: Sequence[Any],
    *,
    page: int = 1,
    page_size: int = 50,
) -> tuple[Sequence[Any], dict[str, int]]:
    safe_page = max(page, 1)
    safe_page_size = min(max(page_size, 1), 250)
    total = len(items)
    start = (safe_page - 1) * safe_page_size
    end = start + safe_page_size
    total_pages = (total + safe_page_size - 1) // safe_page_size if total else 0
    return items[start:end], {
        "page": safe_page,
        "pageSize": safe_page_size,
        "total": total,
        "totalPages": total_pages,
    }
