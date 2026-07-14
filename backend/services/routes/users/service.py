"""User listing services — affiliates and students with pagination."""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any, Optional

from boto3.dynamodb.conditions import Attr, Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import UserRole
from services.common.pagination import build_pagination, decode_cursor, encode_cursor, normalize_value
from services.routes.auth.service import get_user_by_id, public_profile

logger = logging.getLogger(__name__)


def _table():
    return get_table()


def _profile_filter(role: str):
    return Attr("SK").eq("PROFILE") & Attr("role").eq(role) & Attr("entity").eq("USER")


async def _count_by_role(role: str) -> int:
    total = 0
    kwargs: dict[str, Any] = {
        "FilterExpression": _profile_filter(role),
        "Select": "COUNT",
    }
    while True:
        def _scan(kw=kwargs):
            return _table().scan(**kw)

        response = await run_sync(_scan)
        total += response.get("Count", 0)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return total


async def _collect_page(
    *,
    role: str,
    page: int,
    limit: int,
    cursor: Optional[str],
    use_gsi: bool = False,
) -> tuple[list[dict[str, Any]], bool, Optional[str]]:
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

    if use_gsi and role == UserRole.AFFILIATE.value:
        query_kwargs: dict[str, Any] = {
            "IndexName": "GSI2",
            "KeyConditionExpression": Key("GSI2PK").eq(f"ROLE#{role}"),
            "ScanIndexForward": False,
        }
        if exclusive_start_key:
            query_kwargs["ExclusiveStartKey"] = exclusive_start_key

        while len(collected) < limit:
            def _query(kw=query_kwargs):
                return _table().query(**kw)

            response = await run_sync(_query)
            for item in response.get("Items", []):
                if skipped < start_index:
                    skipped += 1
                    continue
                collected.append(item)
                if len(collected) == limit:
                    break

            last_key = response.get("LastEvaluatedKey")
            if len(collected) >= limit:
                has_next = last_key is not None
                next_cursor = encode_cursor(last_key)
                break
            if not last_key:
                break
            query_kwargs["ExclusiveStartKey"] = last_key
    else:
        scan_kwargs: dict[str, Any] = {
            "FilterExpression": _profile_filter(role),
        }
        if exclusive_start_key:
            scan_kwargs["ExclusiveStartKey"] = exclusive_start_key

        while len(collected) < limit:
            def _scan(kw=scan_kwargs):
                return _table().scan(**kw)

            response = await run_sync(_scan)
            for item in response.get("Items", []):
                if skipped < start_index:
                    skipped += 1
                    continue
                collected.append(item)
                if len(collected) == limit:
                    break

            last_key = response.get("LastEvaluatedKey")
            if len(collected) >= limit:
                has_next = last_key is not None
                next_cursor = encode_cursor(last_key)
                break
            if not last_key:
                break
            scan_kwargs["ExclusiveStartKey"] = last_key

    return collected, has_next, next_cursor


def _affiliate_summary(user: dict[str, Any]) -> dict[str, Any]:
    clean = public_profile(user)
    student_count = clean.get("student_count", 0)
    if isinstance(student_count, Decimal):
        student_count = int(student_count)
    return {
        "user_id": clean.get("user_id"),
        "email": clean.get("email"),
        "first_name": clean.get("first_name"),
        "last_name": clean.get("last_name"),
        "invite_code": clean.get("invite_code"),
        "margin_percent": normalize_value(clean.get("margin_percent")),
        "student_count": student_count or 0,
        "created_at": clean.get("created_at"),
    }


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
        "created_at": clean.get("created_at"),
    }


async def list_affiliates(page: int = 1, limit: int = 20, cursor: Optional[str] = None) -> dict[str, Any]:
    total = await _count_by_role(UserRole.AFFILIATE.value)
    items, has_next, next_cursor = await _collect_page(
        role=UserRole.AFFILIATE.value,
        page=page,
        limit=limit,
        cursor=cursor,
        use_gsi=True,
    )
    logger.info("Listed affiliates page=%s limit=%s count=%s", page, limit, len(items))
    return {
        "items": [_affiliate_summary(item) for item in items],
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


async def list_students(page: int = 1, limit: int = 20, cursor: Optional[str] = None) -> dict[str, Any]:
    total = await _count_by_role(UserRole.STUDENT.value)
    items, has_next, next_cursor = await _collect_page(
        role=UserRole.STUDENT.value,
        page=page,
        limit=limit,
        cursor=cursor,
        use_gsi=False,
    )
    summaries = [await _student_summary(item) for item in items]
    logger.info("Listed students page=%s limit=%s count=%s", page, limit, len(items))
    return {
        "items": summaries,
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }
