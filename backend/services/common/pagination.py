"""Shared pagination helpers for list endpoints."""

from __future__ import annotations

import base64
import json
from decimal import Decimal
from typing import Any, Optional


def encode_cursor(last_key: Optional[dict[str, Any]]) -> Optional[str]:
    if not last_key:
        return None
    payload = json.dumps(last_key, default=str).encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("utf-8")


def decode_cursor(cursor: Optional[str]) -> Optional[dict[str, Any]]:
    if not cursor:
        return None
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("utf-8"))
        return json.loads(raw.decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return None


def normalize_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)
    if isinstance(value, dict):
        return {k: normalize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalize_value(v) for v in value]
    return value


def build_pagination(
    *,
    page: int,
    limit: int,
    total: int,
    has_next: bool,
    next_cursor: Optional[str] = None,
) -> dict[str, Any]:
    total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 0
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": page > 1,
        "next_page": page + 1 if has_next else None,
        "previous_page": page - 1 if page > 1 else None,
        "next_cursor": next_cursor,
    }
