"""User listing services — affiliates and students with pagination."""

from __future__ import annotations

import asyncio
import logging
import time
from decimal import Decimal
from typing import Any, Optional

from boto3.dynamodb.conditions import Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import UserRole
from services.common.pagination import build_pagination, decode_cursor, encode_cursor, normalize_value
from services.routes.auth.service import get_user_by_id, public_profile, user_role_count_key
from services.routes.affiliate_portal.service import sum_affiliate_commission
from services.routes.payment.service import get_membership, sum_student_spend

logger = logging.getLogger(__name__)
LIST_CACHE_TTL_SECONDS = 10
_list_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _table():
    return get_table()


def clear_user_list_cache() -> None:
    _list_cache.clear()


def _cache_key(role: str, page: int, limit: int, cursor: Optional[str]) -> str:
    return f"{role}:{page}:{limit}:{cursor or ''}"


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
) -> tuple[list[dict[str, Any]], bool, Optional[str], Optional[int]]:
    """Return (items, has_next, next_cursor) for the requested page."""
    if page < 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "page must be >= 1")
    if limit < 1 or limit > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "limit must be between 1 and 100")

    start_index = (page - 1) * limit
    collected: list[dict[str, Any]] = []
    skipped = 0
    exclusive_start_key = decode_cursor(cursor) if cursor else None
    has_next = False
    next_cursor: Optional[str] = None
    total_from_query: Optional[int] = None

    query_kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(_role_index_pk(role)) & Key("SK").begins_with("USER#"),
        "ScanIndexForward": False,
    }
    if exclusive_start_key:
        query_kwargs["ExclusiveStartKey"] = exclusive_start_key

    while len(collected) < limit:
        def _query(kw=query_kwargs):
            return _table().query(**kw)

        response = await run_sync(_query)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            total_from_query = skipped + response.get("Count", 0)
        for item in response.get("Items", []):
            if skipped < start_index:
                skipped += 1
                continue
            collected.append(item)
            if len(collected) == limit:
                break

        if len(collected) >= limit:
            has_next = last_key is not None
            next_cursor = encode_cursor(last_key)
            break
        if not last_key:
            break
        query_kwargs["ExclusiveStartKey"] = last_key

    return collected, has_next, next_cursor, total_from_query


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
        summed = await sum_affiliate_commission(str(summary["user_id"]))
        summary["total_earned"] = summed["total_earned"]
        summary["admin_earned"] = summed["admin_earned"]
        summary["total_order_amount"] = summed["total_order_amount"]
        summary["order_count"] = summed["order_count"]
        summary["earnings_currency"] = summed["currency"]
    except Exception:
        logger.exception("Failed to sum commission for affiliate_id=%s", summary.get("user_id"))
    return summary


async def _student_summary(user: dict[str, Any]) -> dict[str, Any]:
    clean = public_profile(user)
    affiliate_id = clean.get("referred_by_affiliate_id")
    affiliate: Optional[dict[str, Any]] = None
    if affiliate_id:
        affiliate_user = await get_user_by_id(affiliate_id)
        if affiliate_user and affiliate_user.get("role") == UserRole.AFFILIATE.value:
            affiliate = _affiliate_summary(affiliate_user)

    return {
        "user_id": clean.get("user_id"),
        "email": clean.get("email"),
        "first_name": clean.get("first_name"),
        "last_name": clean.get("last_name"),
        "marketing_pref": clean.get("marketing_pref", False),
        "referred_by_affiliate_id": affiliate_id,
        "affiliate": affiliate,
        "total_spent": 0.0,
        "admin_earned": 0.0,
        "order_count": 0,
        "paid_order_count": 0,
        "spend_currency": "USD",
        "current_plan": None,
        "membership_status": None,
        "last_purchase_at": None,
        "last_purchase_amount": None,
        "created_at": clean.get("created_at"),
    }


async def _student_summary_with_spend(user: dict[str, Any]) -> dict[str, Any]:
    summary = await _student_summary(user)
    user_id = summary.get("user_id")
    if not user_id:
        return summary
    try:
        spend, membership = await asyncio.gather(
            sum_student_spend(str(user_id)),
            get_membership(str(user_id)),
        )
        summary["total_spent"] = spend["total_spent"]
        summary["admin_earned"] = spend["admin_earned"]
        summary["order_count"] = spend["order_count"]
        summary["paid_order_count"] = spend["paid_order_count"]
        summary["spend_currency"] = spend["currency"]
        summary["last_purchase_at"] = spend["last_purchase_at"]
        summary["last_purchase_amount"] = spend["last_purchase_amount"]
        if membership:
            summary["current_plan"] = membership.get("plan_type")
            summary["membership_status"] = membership.get("status")
    except Exception:
        logger.exception("Failed to sum spend for student_id=%s", user_id)
    return summary


async def list_affiliates(page: int = 1, limit: int = 20, cursor: Optional[str] = None) -> dict[str, Any]:
    key = _cache_key(UserRole.AFFILIATE.value, page, limit, cursor)
    if cached := _get_cached(key):
        return cached

    items, has_next, next_cursor, total_from_query = await _collect_page(
        role=UserRole.AFFILIATE.value,
        page=page,
        limit=limit,
        cursor=cursor,
    )
    total = total_from_query if total_from_query is not None else await _count_by_role(UserRole.AFFILIATE.value)
    summaries = await asyncio.gather(*[_affiliate_summary_with_earnings(item) for item in items])
    logger.info("Listed affiliates page=%s limit=%s count=%s", page, limit, len(items))
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


async def list_students(page: int = 1, limit: int = 20, cursor: Optional[str] = None) -> dict[str, Any]:
    key = _cache_key(UserRole.STUDENT.value, page, limit, cursor)
    if cached := _get_cached(key):
        return cached

    items, has_next, next_cursor, total_from_query = await _collect_page(
        role=UserRole.STUDENT.value,
        page=page,
        limit=limit,
        cursor=cursor,
    )
    total = total_from_query if total_from_query is not None else await _count_by_role(UserRole.STUDENT.value)
    summaries = await asyncio.gather(*[_student_summary_with_spend(item) for item in items])
    logger.info("Listed students page=%s limit=%s count=%s", page, limit, len(items))
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
