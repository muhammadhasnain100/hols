"""User listing services — affiliates and students with pagination."""

from __future__ import annotations

import asyncio
import logging
import time
from decimal import Decimal
from typing import Any, Optional

from boto3.dynamodb.conditions import Attr, Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import UserRole
from services.common.pagination import (
    build_pagination,
    consume_query_page,
    decode_cursor,
    encode_cursor,
    exclusive_start_key,
    normalize_value,
    resolve_has_next,
)
from services.routes.auth.service import get_user_by_id, public_profile, user_role_count_key
from services.routes.finance.service import student_commerce_from_item
from services.routes.payout.service import get_wallet, wallet_reporting_fields

logger = logging.getLogger(__name__)
LIST_CACHE_TTL_SECONDS = 10
LIST_SCAN_CAP = 500
_list_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _table():
    return get_table()


def clear_user_list_cache() -> None:
    _list_cache.clear()


def _cache_key(
    role: str,
    page: int,
    limit: int,
    cursor: Optional[str],
    *,
    sort: str = "newest",
    empty_referrals: bool = False,
    empty_orders: bool = False,
) -> str:
    return (
        f"{role}:{page}:{limit}:{cursor or ''}:{sort}:"
        f"ref{int(empty_referrals)}:ord{int(empty_orders)}"
    )


def _get_cached(key: str) -> Optional[dict[str, Any]]:
    cached = _list_cache.get(key)
    if not cached:
        return None
    cached_at, value = cached
    if time.monotonic() - cached_at > LIST_CACHE_TTL_SECONDS:
        _list_cache.pop(key, None)
        return None
    return value


def _set_cached(key: str, value: dict[str, Any]) -> dict[str, Any]:
    _list_cache[key] = (time.monotonic(), value)
    return value


def _role_index_pk(role: str) -> str:
    return f"ROLE#{role}"


async def _count_by_role(role: str) -> int:
    def _get():
        return _table().get_item(Key=user_role_count_key(role))

    response = await run_sync(_get)
    total = response.get("Item", {}).get("total", 0)
    if isinstance(total, Decimal):
        return int(total)
    return int(total or 0)


async def _collect_page(
    *,
    role: str,
    page: int,
    limit: int,
    cursor: Optional[str],
    newest_first: bool = True,
    filter_expression: Any = None,
) -> tuple[list[dict[str, Any]], bool, Optional[str], Optional[int]]:
    """Return (items, has_next, next_cursor, total_from_complete_query)."""
    if page < 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "page must be >= 1")
    if limit < 1 or limit > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "limit must be between 1 and 100")

    start_index = (page - 1) * limit
    collected: list[dict[str, Any]] = []
    skipped = 0
    exclusive_start_key_value = decode_cursor(cursor) if cursor else None
    has_next = False
    next_cursor: Optional[str] = None
    total_from_query: Optional[int] = None

    query_kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(_role_index_pk(role)) & Key("SK").begins_with("USER#"),
        "ScanIndexForward": not newest_first,
    }
    if filter_expression is not None:
        query_kwargs["FilterExpression"] = filter_expression
    if exclusive_start_key_value:
        query_kwargs["ExclusiveStartKey"] = exclusive_start_key_value

    while len(collected) < limit:
        def _query(kw=query_kwargs):
            return _table().query(**kw)

        response = await run_sync(_query)
        items = response.get("Items", []) or []
        last_key = response.get("LastEvaluatedKey")
        seen_before = skipped + len(collected)
        if not last_key:
            total_from_query = seen_before + len(items)

        skipped, page_full, page_has_next = consume_query_page(
            items,
            start_index=start_index,
            skipped=skipped,
            collected=collected,
            limit=limit,
            last_key=last_key,
        )
        if page_full:
            has_next = page_has_next
            next_cursor = encode_cursor(exclusive_start_key(collected[-1]))
            break
        if not last_key:
            break
        query_kwargs["ExclusiveStartKey"] = last_key

    return collected, has_next, next_cursor, total_from_query


async def _list_role_items(
    role: str,
    *,
    newest_first: bool = True,
    filter_expression: Any = None,
    max_items: int = LIST_SCAN_CAP,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    query_kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(_role_index_pk(role)) & Key("SK").begins_with("USER#"),
        "ScanIndexForward": not newest_first,
    }
    if filter_expression is not None:
        query_kwargs["FilterExpression"] = filter_expression

    while len(items) < max_items:
        def _query(kw=dict(query_kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        batch = response.get("Items", []) or []
        items.extend(batch)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        query_kwargs["ExclusiveStartKey"] = last_key

    return items[:max_items]


async def _gather_chunked(items: list[dict[str, Any]], mapper, chunk: int = 20):
    out: list[Any] = []
    for index in range(0, len(items), chunk):
        batch = items[index : index + chunk]
        out.extend(await asyncio.gather(*[mapper(item) for item in batch]))
    return out


def _empty_referrals_filter():
    return Attr("student_count").not_exists() | Attr("student_count").eq(0)


def _empty_orders_filter():
    return Attr("order_count").not_exists() | Attr("order_count").eq(0)


def _slice_page(items: list[Any], *, page: int, limit: int) -> tuple[list[Any], bool, int]:
    total = len(items)
    start = (page - 1) * limit
    page_items = items[start : start + limit]
    has_next = start + limit < total
    return page_items, has_next, total


def _affiliate_summary(user: dict[str, Any]) -> dict[str, Any]:
    clean = public_profile(user)
    student_count = clean.get("student_count", 0)
    if isinstance(student_count, Decimal):
        student_count = int(student_count)
    invitation_quota = clean.get("invitation_quota")
    if isinstance(invitation_quota, Decimal):
        invitation_quota = int(invitation_quota)
    return {
        "user_id": clean.get("user_id"),
        "email": clean.get("email"),
        "first_name": clean.get("first_name"),
        "last_name": clean.get("last_name"),
        "invite_code": clean.get("invite_code"),
        "margin_percent": normalize_value(clean.get("margin_percent")),
        "invitation_quota": invitation_quota,
        "student_count": student_count or 0,
        "total_earned": 0.0,
        "lock_amount": 0.0,
        "available": 0.0,
        "pending": 0.0,
        "paid_out": 0.0,
        "admin_earned": 0.0,
        "total_order_amount": 0.0,
        "order_count": 0,
        "earnings_currency": "USD",
        "created_at": clean.get("created_at"),
    }


async def _affiliate_summary_with_earnings(user: dict[str, Any]) -> dict[str, Any]:
    # Prefer live profile for student_count — role-index rows can lag after referrals.
    user_id = user.get("user_id")
    profile = await get_user_by_id(str(user_id)) if user_id else None
    summary = _affiliate_summary(profile or user)
    if not summary.get("user_id"):
        return summary
    try:
        wallet = await get_wallet(str(summary["user_id"]))
        summary.update(wallet_reporting_fields(wallet))
    except Exception:
        logger.exception("Failed to read wallet for affiliate_id=%s", summary.get("user_id"))
    return summary


async def _student_summary(user: dict[str, Any]) -> dict[str, Any]:
    clean = public_profile(user)
    affiliate_id = clean.get("referred_by_affiliate_id")
    affiliate: Optional[dict[str, Any]] = None
    if affiliate_id:
        affiliate_user = await get_user_by_id(affiliate_id)
        if affiliate_user and affiliate_user.get("role") == UserRole.AFFILIATE.value:
            affiliate = _affiliate_summary(affiliate_user)

    commerce = student_commerce_from_item(user, user_id=clean.get("user_id"))
    return {
        "user_id": clean.get("user_id"),
        "email": clean.get("email"),
        "first_name": clean.get("first_name"),
        "last_name": clean.get("last_name"),
        "marketing_pref": clean.get("marketing_pref", False),
        "referred_by_affiliate_id": affiliate_id,
        "affiliate": affiliate,
        "total_spent": commerce["total_spent"],
        "admin_earned": commerce["admin_earned"],
        "affiliate_earned": commerce["affiliate_earned"],
        "order_count": commerce["order_count"],
        "paid_order_count": commerce["paid_order_count"],
        "spend_currency": commerce["currency"],
        "current_plan": commerce.get("current_plan"),
        "membership_status": commerce.get("membership_status"),
        "last_purchase_at": commerce.get("last_purchase_at"),
        "last_purchase_amount": commerce.get("last_purchase_amount"),
        "created_at": clean.get("created_at"),
    }


async def _student_summary_with_spend(user: dict[str, Any]) -> dict[str, Any]:
    return await _student_summary(user)


async def list_affiliates(
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
    *,
    sort: str = "newest",
    empty_referrals: bool = False,
) -> dict[str, Any]:
    newest_first = sort != "oldest"
    key = _cache_key(
        UserRole.AFFILIATE.value,
        page,
        limit,
        cursor,
        sort=sort,
        empty_referrals=empty_referrals,
    )
    if cached := _get_cached(key):
        return cached

    if empty_referrals:
        raw_items = await _list_role_items(
            UserRole.AFFILIATE.value,
            newest_first=newest_first,
            filter_expression=_empty_referrals_filter(),
        )
        summaries = await _gather_chunked(raw_items, _affiliate_summary_with_earnings)
        matching = [item for item in summaries if int(item.get("student_count") or 0) == 0]
        page_items, has_next, total = _slice_page(matching, page=page, limit=limit)
        logger.info(
            "Listed affiliates page=%s limit=%s count=%s empty_referrals=1 sort=%s",
            page,
            limit,
            len(page_items),
            sort,
        )
        return _set_cached(key, {
            "items": list(page_items),
            "pagination": build_pagination(
                page=page,
                limit=limit,
                total=total,
                has_next=has_next,
            ),
        })

    items, dynamo_has_next, next_cursor, total_from_query = await _collect_page(
        role=UserRole.AFFILIATE.value,
        page=page,
        limit=limit,
        cursor=cursor,
        newest_first=newest_first,
    )
    total = total_from_query if total_from_query is not None else await _count_by_role(UserRole.AFFILIATE.value)
    has_next = resolve_has_next(
        page=page,
        limit=limit,
        total=total,
        collected=len(items),
        dynamo_has_next=dynamo_has_next,
    )
    summaries = await asyncio.gather(*[_affiliate_summary_with_earnings(item) for item in items])
    logger.info("Listed affiliates page=%s limit=%s count=%s sort=%s", page, limit, len(items), sort)
    return _set_cached(key, {
        "items": list(summaries),
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    })


async def list_students(
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
    *,
    sort: str = "newest",
    empty_orders: bool = False,
) -> dict[str, Any]:
    newest_first = sort != "oldest"
    key = _cache_key(
        UserRole.STUDENT.value,
        page,
        limit,
        cursor,
        sort=sort,
        empty_orders=empty_orders,
    )
    if cached := _get_cached(key):
        return cached

    if empty_orders:
        raw_items = await _list_role_items(
            UserRole.STUDENT.value,
            newest_first=newest_first,
            filter_expression=_empty_orders_filter(),
        )
        summaries = await _gather_chunked(raw_items, _student_summary_with_spend)
        matching = [item for item in summaries if int(item.get("order_count") or 0) == 0]
        page_items, has_next, total = _slice_page(matching, page=page, limit=limit)
        logger.info(
            "Listed students page=%s limit=%s count=%s empty_orders=1 sort=%s",
            page,
            limit,
            len(page_items),
            sort,
        )
        return _set_cached(key, {
            "items": list(page_items),
            "pagination": build_pagination(
                page=page,
                limit=limit,
                total=total,
                has_next=has_next,
            ),
        })

    items, dynamo_has_next, next_cursor, total_from_query = await _collect_page(
        role=UserRole.STUDENT.value,
        page=page,
        limit=limit,
        cursor=cursor,
        newest_first=newest_first,
    )
    total = total_from_query if total_from_query is not None else await _count_by_role(UserRole.STUDENT.value)
    has_next = resolve_has_next(
        page=page,
        limit=limit,
        total=total,
        collected=len(items),
        dynamo_has_next=dynamo_has_next,
    )
    summaries = await asyncio.gather(*[_student_summary_with_spend(item) for item in items])
    logger.info("Listed students page=%s limit=%s count=%s sort=%s", page, limit, len(items), sort)
    return _set_cached(key, {
        "items": list(summaries),
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    })
