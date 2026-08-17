"""Affiliate self-service business logic."""

from __future__ import annotations

import html
import logging
from decimal import Decimal
from typing import Any, Optional
from urllib.parse import urlencode

from boto3.dynamodb.conditions import Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import UserRole
from models.users import StudentAffiliateInfo
from services.common import email as email_service
from services.common.pagination import build_pagination, decode_cursor, encode_cursor, normalize_value
from services.routes.auth import service as auth_service

logger = logging.getLogger(__name__)


def _table():
    return get_table()


def _as_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return int(value)
    return int(value)


def _normalize_invite_code(invite_code: str) -> str:
    return invite_code.strip().upper()


async def _get_affiliate(affiliate_id: str) -> dict[str, Any]:
    affiliate = await auth_service.get_user_by_id(affiliate_id)
    if not affiliate or affiliate.get("role") != UserRole.AFFILIATE.value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Affiliate not found")
    return affiliate


async def resolve_invite_code(invite_code: str) -> dict[str, Any]:
    normalized = _normalize_invite_code(invite_code)
    if not normalized:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite code not found")

    def _get():
        return _table().get_item(Key={"PK": f"INVITE#{normalized}", "SK": "AFFILIATE"})

    response = await run_sync(_get)
    invite_item = response.get("Item")
    if not invite_item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite code not found")

    affiliate = await _get_affiliate(invite_item["affiliate_id"])
    return {
        "affiliate_id": affiliate["user_id"],
        "invite_code": normalized,
        "first_name": affiliate.get("first_name"),
        "last_name": affiliate.get("last_name"),
        "student_count": _as_int(affiliate.get("student_count")) or 0,
        "invitation_quota": _as_int(affiliate.get("invitation_quota")),
    }


def _signup_path(affiliate: dict[str, Any]) -> str:
    invite_code = affiliate.get("invite_code")
    query = {"affiliate_id": affiliate["user_id"]}
    if invite_code:
        query["ref"] = invite_code
    return f"/signup?{urlencode(query)}"


def build_invite_url(affiliate: dict[str, Any], public_origin: str) -> dict[str, Any]:
    signup_path = _signup_path(affiliate)
    return {
        "affiliate_id": affiliate["user_id"],
        "invite_code": affiliate.get("invite_code"),
        "signup_path": signup_path,
        "public_url": f"{public_origin.rstrip('/')}{signup_path}",
        "student_count": _as_int(affiliate.get("student_count")) or 0,
        "invitation_quota": _as_int(affiliate.get("invitation_quota")),
    }


async def get_invite_url(affiliate_id: str, public_origin: str) -> dict[str, Any]:
    affiliate = await _get_affiliate(affiliate_id)
    return build_invite_url(affiliate, public_origin)


async def send_student_invites(
    *,
    affiliate_id: str,
    recipients: list[str],
    public_origin: str,
    message: Optional[str] = None,
) -> dict[str, Any]:
    affiliate = await _get_affiliate(affiliate_id)
    if not affiliate.get("invite_code"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Affiliate invite code is not assigned")

    invite_url = build_invite_url(affiliate, public_origin)
    first_name = affiliate.get("first_name") or "Your HOLS affiliate"
    personal_message = (message or "").strip()
    extra_text = f"\n\nMessage from {first_name}:\n{personal_message}" if personal_message else ""
    extra_html = (
        f"<p><strong>Message from {html.escape(str(first_name))}:</strong><br>"
        f"{html.escape(personal_message)}</p>"
        if personal_message
        else ""
    )

    for recipient in recipients:
        try:
            await email_service.send_email_async(
                to=recipient,
                subject="You are invited to join HOLS",
                text_body=(
                    f"Hi,\n\n{first_name} invited you to join House of Life Sciences.\n"
                    f"Use this link to sign up:\n{invite_url['public_url']}"
                    f"{extra_text}\n\n"
                    "If you were not expecting this invite, you can ignore this email.\n"
                ),
                html_body=(
                    "<p>Hi,</p>"
                    f"<p>{html.escape(str(first_name))} invited you to join House of Life Sciences.</p>"
                    f"<p><a href=\"{html.escape(invite_url['public_url'])}\">Create your HOLS account</a></p>"
                    f"<p>Invite link: {html.escape(invite_url['public_url'])}</p>"
                    f"{extra_html}"
                    "<p>If you were not expecting this invite, you can ignore this email.</p>"
                ),
            )
        except Exception:
            logger.exception("Failed to send affiliate student invite to %s", recipient)

    logger.info("Affiliate %s queued %s student invite emails", affiliate_id, len(recipients))
    return {
        "queued": True,
        "public_url": invite_url["public_url"],
        "recipients": recipients,
        "recipient_count": len(recipients),
    }


def _affiliate_info(affiliate: dict[str, Any]) -> dict[str, Any]:
    clean = auth_service.public_profile(affiliate)
    return StudentAffiliateInfo(
        user_id=clean["user_id"],
        email=clean["email"],
        first_name=clean["first_name"],
        last_name=clean["last_name"],
        invite_code=clean.get("invite_code"),
        margin_percent=normalize_value(clean.get("margin_percent")),
        invitation_quota=_as_int(clean.get("invitation_quota")),
        student_count=_as_int(clean.get("student_count")) or 0,
        created_at=clean.get("created_at"),
    ).model_dump()


def _student_summary(student: dict[str, Any], affiliate: dict[str, Any]) -> dict[str, Any]:
    clean = auth_service.public_profile(student)
    return {
        "user_id": clean["user_id"],
        "email": clean["email"],
        "first_name": clean["first_name"],
        "last_name": clean["last_name"],
        "marketing_pref": clean.get("marketing_pref", False),
        "referred_by_affiliate_id": clean.get("referred_by_affiliate_id"),
        "affiliate": _affiliate_info(affiliate),
        "created_at": clean.get("created_at"),
    }


async def list_referred_students(
    *,
    affiliate_id: str,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    if page < 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "page must be >= 1")
    if limit < 1 or limit > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "limit must be between 1 and 100")

    affiliate = await _get_affiliate(affiliate_id)
    total = _as_int(affiliate.get("student_count")) or 0
    start_index = (page - 1) * limit
    skipped = 0
    collected: list[dict[str, Any]] = []
    exclusive_start_key = decode_cursor(cursor) if cursor else None
    next_cursor: Optional[str] = None
    has_next = False

    query_kwargs: dict[str, Any] = {
        "IndexName": "GSI2",
        "KeyConditionExpression": (
            Key("GSI2PK").eq(f"AFFILIATE#{affiliate_id}") & Key("GSI2SK").begins_with("USER#")
        ),
        "ScanIndexForward": False,
    }
    if exclusive_start_key:
        query_kwargs["ExclusiveStartKey"] = exclusive_start_key

    while len(collected) < limit:
        def _query(kw=query_kwargs):
            return _table().query(**kw)

        response = await run_sync(_query)
        last_key = response.get("LastEvaluatedKey")
        for item in response.get("Items", []):
            if item.get("role") != UserRole.STUDENT.value:
                continue
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

    return {
        "items": [_student_summary(student, affiliate) for student in collected],
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


def _as_money(value: Any) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _next_milestone(total_earned: float) -> float:
    """Pick the next round target above earned for the UI meter."""
    steps = (50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000)
    for step in steps:
        if total_earned < step:
            return float(step)
    # Beyond the table — keep a headroom of ~20% rounded up to the next thousand.
    return float(((int(total_earned) // 1000) + 2) * 1000)


async def sum_affiliate_commission(
    affiliate_id: str,
    *,
    history_limit: int = 0,
) -> dict[str, Any]:
    """Sum paid commission for an affiliate. Optionally collect recent order rows."""
    query_kwargs: dict[str, Any] = {
        "IndexName": "GSI2",
        "KeyConditionExpression": (
            Key("GSI2PK").eq(f"AFFILIATE#{affiliate_id}") & Key("GSI2SK").begins_with("ORDER#")
        ),
        "ScanIndexForward": False,
    }

    total_earned = 0.0
    total_order_amount = 0.0
    order_count = 0
    currency = "USD"
    items: list[dict[str, Any]] = []

    while True:
        def _query(kw=query_kwargs):
            return _table().query(**kw)

        response = await run_sync(_query)
        for item in response.get("Items", []):
            entity = item.get("entity")
            if entity is not None and entity != "ORDER":
                continue
            status_value = str(item.get("status") or "").lower()
            if status_value and status_value != "paid":
                continue

            amount = _as_money(item.get("amount"))
            commission = _as_money(item.get("affiliate_commission"))
            total_order_amount += amount
            if commission > 0:
                total_earned += commission
            order_count += 1
            currency = str(item.get("currency") or currency)

            if history_limit and commission > 0 and len(items) < history_limit:
                pk = str(item.get("PK") or "")
                student_user_id = pk.removeprefix("USER#") if pk.startswith("USER#") else None
                items.append(
                    {
                        "order_id": item.get("order_id") or "",
                        "student_user_id": student_user_id,
                        "plan_type": item.get("plan_type"),
                        "amount": amount,
                        "commission": commission,
                        "currency": str(item.get("currency") or "USD"),
                        "status": status_value or "paid",
                        "created_at": item.get("created_at"),
                    }
                )

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        query_kwargs["ExclusiveStartKey"] = last_key

    total_earned_rounded = round(total_earned, 2)
    total_order_rounded = round(total_order_amount, 2)
    return {
        "total_earned": total_earned_rounded,
        "total_order_amount": total_order_rounded,
        "admin_earned": round(total_order_rounded - total_earned_rounded, 2),
        "order_count": order_count,
        "currency": currency,
        "items": items,
    }


async def get_earnings(*, affiliate_id: str, history_limit: int = 25) -> dict[str, Any]:
    """Sum commissionable paid orders indexed under this affiliate."""
    affiliate = await _get_affiliate(affiliate_id)
    margin = normalize_value(affiliate.get("margin_percent"))
    summed = await sum_affiliate_commission(affiliate_id, history_limit=history_limit)
    total_earned = summed["total_earned"]
    # Payout ledger is not implemented yet — treat all earned commission as pending.
    return {
        "total_earned": total_earned,
        "pending_payout": total_earned,
        "paid_out": 0.0,
        "currency": summed["currency"],
        "order_count": summed["order_count"],
        "margin_percent": float(margin) if margin is not None else None,
        "next_milestone": _next_milestone(total_earned),
        "items": summed["items"],
    }
