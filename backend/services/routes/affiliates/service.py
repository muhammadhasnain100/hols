"""Admin affiliate management service."""

from __future__ import annotations

import html
import logging
import secrets
import string
import uuid
from decimal import Decimal
from typing import Any, Optional

from botocore.exceptions import ClientError
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import UserProfile, UserRole
from services.common import email as email_service
from services.common.pagination import normalize_value
from services.routes.affiliate_portal.service import sum_affiliate_commission
from services.routes.auth import service as auth_service
from services.routes.users import service as users_service

logger = logging.getLogger(__name__)


def _table():
    return get_table()


def _generate_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _normalize_invite_code(invite_code: str) -> str:
    return invite_code.strip().upper()


def _generate_invite_code(length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _invite_index_key(invite_code: str) -> dict[str, str]:
    return {"PK": f"INVITE#{invite_code}", "SK": "AFFILIATE"}


def _invite_index_item(invite_code: str, affiliate_id: str) -> dict[str, Any]:
    return {
        **_invite_index_key(invite_code),
        "entity": "AFFILIATE_INVITE",
        "invite_code": invite_code,
        "affiliate_id": affiliate_id,
    }


def _decimal_to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return int(value)
    return int(value)


async def _invite_code_exists(invite_code: str) -> bool:
    def _get():
        return _table().get_item(Key=_invite_index_key(invite_code))

    response = await run_sync(_get)
    return "Item" in response


async def _reserve_invite_code(invite_code: str, affiliate_id: str) -> None:
    def _put():
        try:
            _table().put_item(
                Item=_invite_index_item(invite_code, affiliate_id),
                ConditionExpression="attribute_not_exists(PK)",
            )
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise HTTPException(status.HTTP_409_CONFLICT, "Invite code already exists") from exc
            raise

    await run_sync(_put)


async def _unique_invite_code(invite_code: Optional[str] = None) -> str:
    if invite_code:
        normalized = _normalize_invite_code(invite_code)
        if await _invite_code_exists(normalized):
            raise HTTPException(status.HTTP_409_CONFLICT, "Invite code already exists")
        return normalized

    for _ in range(8):
        generated = _generate_invite_code()
        if not await _invite_code_exists(generated):
            return generated

    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not generate invite code")


def affiliate_summary(user: dict[str, Any]) -> dict[str, Any]:
    clean = auth_service.public_profile(user)
    return {
        "user_id": clean.get("user_id"),
        "email": clean.get("email"),
        "first_name": clean.get("first_name"),
        "last_name": clean.get("last_name"),
        "invite_code": clean.get("invite_code"),
        "margin_percent": normalize_value(clean.get("margin_percent")),
        "invitation_quota": _decimal_to_int(clean.get("invitation_quota")),
        "student_count": _decimal_to_int(clean.get("student_count")) or 0,
        "total_earned": 0.0,
        "admin_earned": 0.0,
        "total_order_amount": 0.0,
        "order_count": 0,
        "earnings_currency": "USD",
        "created_at": clean.get("created_at"),
    }


async def affiliate_summary_with_earnings(user: dict[str, Any]) -> dict[str, Any]:
    summary = affiliate_summary(user)
    user_id = summary.get("user_id")
    if not user_id:
        return summary
    try:
        summed = await sum_affiliate_commission(str(user_id))
        summary["total_earned"] = summed["total_earned"]
        summary["admin_earned"] = summed["admin_earned"]
        summary["total_order_amount"] = summed["total_order_amount"]
        summary["order_count"] = summed["order_count"]
        summary["earnings_currency"] = summed["currency"]
    except Exception:
        logger.exception("Failed to sum commission for affiliate_id=%s", user_id)
    return summary


async def create_affiliate(
    *,
    email: str,
    first_name: str,
    last_name: str,
    password: Optional[str] = None,
    margin_percent: Optional[float] = None,
    invite_code: Optional[str] = None,
    invitation_quota: Optional[int] = None,
) -> dict[str, Any]:
    if await auth_service.get_user_by_email(email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    plain_password = password or _generate_password()
    user_id = uuid.uuid4().hex
    normalized_invite_code = await _unique_invite_code(invite_code)
    await _reserve_invite_code(normalized_invite_code, user_id)
    profile = UserProfile(
        user_id=user_id,
        role=UserRole.AFFILIATE,
        email=email,
        first_name=first_name,
        last_name=last_name,
        password_hash=auth_service.hash_password(plain_password),
        email_verified=True,
        margin_percent=margin_percent,
        invite_code=normalized_invite_code,
        invitation_quota=invitation_quota,
    )
    user = await auth_service.save_user(profile)
    summary = affiliate_summary(user)
    logger.info("Affiliate account created for user_id=%s", user_id)
    return {
        "profile": summary,
        "_credential_email": {
            "user": summary,
            "password": plain_password,
        },
    }


async def send_affiliate_credentials_email(user: dict[str, Any], password: str) -> bool:
    """Send the admin-created affiliate's credentials in the background."""
    first_name = user.get("first_name") or "there"
    email = user.get("email")
    invite_code = user.get("invite_code") or "Not set"
    try:
        await email_service.send_email_async(
            to=email,
            subject="Your HOLS affiliate account",
            text_body=(
                f"Hi {first_name},\n\n"
                "Your HOLS affiliate account has been created.\n\n"
                f"Email: {email}\n"
                f"Password: {password}\n"
                f"Invite code: {invite_code}\n\n"
                "Please log in and change your password if required by your account policy.\n"
            ),
            html_body=(
                f"<p>Hi {html.escape(str(first_name))},</p>"
                "<p>Your HOLS affiliate account has been created.</p>"
                "<p>"
                f"<strong>Email:</strong> {html.escape(str(email))}<br>"
                f"<strong>Password:</strong> {html.escape(password)}<br>"
                f"<strong>Invite code:</strong> {html.escape(str(invite_code))}"
                "</p>"
                "<p>Please log in and change your password if required by your account policy.</p>"
            ),
        )
        return True
    except Exception:
        logger.exception("Failed to send affiliate credential email to %s", email)
        return False


async def list_affiliates(
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    return await users_service.list_affiliates(page=page, limit=limit, cursor=cursor)


async def get_affiliate(affiliate_id: str) -> dict[str, Any]:
    user = await auth_service.get_user_by_id(affiliate_id)
    if not user or user.get("role") != UserRole.AFFILIATE.value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Affiliate not found")
    return await affiliate_summary_with_earnings(user)


async def update_invitation_quota(affiliate_id: str, invitation_quota: int) -> dict[str, Any]:
    user = await auth_service.get_user_by_id(affiliate_id)
    if not user or user.get("role") != UserRole.AFFILIATE.value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Affiliate not found")

    updated = await auth_service.update_user_fields(
        affiliate_id,
        {"invitation_quota": invitation_quota},
    )
    logger.info("Affiliate invitation quota updated user_id=%s quota=%s", affiliate_id, invitation_quota)
    return await affiliate_summary_with_earnings(updated)
