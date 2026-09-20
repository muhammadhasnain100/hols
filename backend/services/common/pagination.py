"""Shared pagination helpers for list endpoints."""

from __future__ import annotations

import base64
import json
from collections.abc import Callable
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


def exclusive_start_key(item: dict[str, Any], *, gsi2: bool = False) -> Optional[dict[str, Any]]:
    """Build ExclusiveStartKey from the last returned item (not the DynamoDB page LEK)."""
    pk, sk = item.get("PK"), item.get("SK")
    if not pk or not sk:
        return None
    if gsi2:
        gsi2pk, gsi2sk = item.get("GSI2PK"), item.get("GSI2SK")
        if not gsi2pk or not gsi2sk:
            return None
        return {"PK": pk, "SK": sk, "GSI2PK": gsi2pk, "GSI2SK": gsi2sk}
    return {"PK": pk, "SK": sk}


def consume_query_page(
    items: list[dict[str, Any]],
    *,
    start_index: int,
    skipped: int,
    collected: list[Any],
    limit: int,
    last_key: Optional[dict[str, Any]],
    map_item: Optional[Callable[[dict[str, Any]], Any]] = None,
    include_item: Optional[Callable[[dict[str, Any]], bool]] = None,
) -> tuple[int, bool, bool]:
    """Fold one DynamoDB Query response into `collected`.

    Returns (skipped, page_full, has_next). `has_next` is only meaningful when
    `page_full` is True: more items remain in this response, or DynamoDB has
    another page (`LastEvaluatedKey`).
    """
    consumed = 0
    for item in items:
        consumed += 1
        if include_item is not None and not include_item(item):
            continue
        if skipped < start_index:
            skipped += 1
            continue
        collected.append(map_item(item) if map_item else item)
        if len(collected) >= limit:
            has_next = consumed < len(items) or last_key is not None
            return skipped, True, has_next
    return skipped, False, False


def resolve_has_next(
    *,
    page: int,
    limit: int,
    total: int,
    collected: int,
    dynamo_has_next: bool,
) -> bool:
    if collected < limit:
        return False
    if dynamo_has_next:
        return True
    return page * limit < total


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
