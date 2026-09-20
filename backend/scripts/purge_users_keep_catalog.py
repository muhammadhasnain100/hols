"""Delete users and commerce data. Keep lecture, webinar, plan, and settings rows."""

from __future__ import annotations

import logging
from typing import Any, Optional

from boto3.dynamodb.conditions import Key

from database import get_table
from database_entities import (
    AdminFinance,
    AffiliatePayout,
    CommissionLock,
    PayoutSettings,
    SalesSnapshot,
    UserProfile,
    UserRole,
)

logger = logging.getLogger(__name__)


def _table():
    return get_table()


def _query_all(pk: str, sk_prefix: Optional[str] = None) -> list[dict[str, Any]]:
    table = _table()
    kwargs: dict[str, Any] = {"KeyConditionExpression": Key("PK").eq(pk)}
    if sk_prefix:
        kwargs["KeyConditionExpression"] = Key("PK").eq(pk) & Key("SK").begins_with(sk_prefix)
    items: list[dict[str, Any]] = []
    while True:
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return items


def _delete_keys(keys: list[dict[str, str]]) -> int:
    if not keys:
        return 0
    table = _table()
    deleted = 0
    for index in range(0, len(keys), 25):
        chunk = keys[index : index + 25]
        with table.batch_writer() as batch:
            for key in chunk:
                batch.delete_item(Key=key)
        deleted += len(chunk)
    return deleted


def _delete_items(items: list[dict[str, Any]]) -> int:
    return _delete_keys([{"PK": str(item["PK"]), "SK": str(item["SK"])} for item in items if item.get("PK") and item.get("SK")])


def _delete_pk(pk: str, sk_prefix: Optional[str] = None) -> int:
    return _delete_items(_query_all(pk, sk_prefix=sk_prefix))


def purge_users_and_commerce() -> dict[str, int]:
    """Remove every user and money row. Do not touch COURSE/WEBINAR/PLAN/SETTINGS/GLOSSARY/DOSING."""
    deleted = 0
    user_ids: list[str] = []
    affiliate_ids: list[str] = []
    invite_codes: list[str] = []

    for role in (UserRole.STUDENT.value, UserRole.AFFILIATE.value, UserRole.ADMIN.value):
        rows = _query_all(f"ROLE#{role}", sk_prefix="USER#")
        for row in rows:
            user_id = str(row.get("user_id") or "")
            if user_id:
                user_ids.append(user_id)
            if role == UserRole.AFFILIATE.value:
                if user_id:
                    affiliate_ids.append(user_id)
                code = str(row.get("invite_code") or "").strip()
                if code:
                    invite_codes.append(code)
        deleted += _delete_items(rows)
        deleted += _delete_pk(f"ROLE#{role}", sk_prefix="COUNT")

    for user_id in dict.fromkeys(user_ids):
        profile = _table().get_item(Key={"PK": UserProfile.pk(user_id), "SK": UserProfile.sk()}).get("Item") or {}
        code = str(profile.get("invite_code") or "").strip()
        if code:
            invite_codes.append(code)
        if profile.get("role") == UserRole.AFFILIATE.value:
            affiliate_ids.append(user_id)
        deleted += _delete_pk(UserProfile.pk(user_id))

    payout_rows = _query_all(AffiliatePayout.all_pk())
    payout_ids = [str(row.get("payout_id") or "") for row in payout_rows if row.get("payout_id")]
    deleted += _delete_items(payout_rows)
    deleted += _delete_pk(AffiliatePayout.pending_pk())
    for payout_id in dict.fromkeys(payout_ids):
        deleted += _delete_pk(AffiliatePayout.lookup_pk(payout_id))

    deleted += _delete_pk(CommissionLock.pending_pk())
    deleted += _delete_pk(SalesSnapshot.admin_pk())
    for affiliate_id in dict.fromkeys(affiliate_ids):
        deleted += _delete_pk(SalesSnapshot.affiliate_pk(affiliate_id))
    deleted += _delete_pk(AdminFinance.pk())

    for invite_code in dict.fromkeys(invite_codes):
        deleted += _delete_pk(f"INVITE#{invite_code}")

    logger.info("Purged users/commerce deleted=%s users=%s", deleted, len(dict.fromkeys(user_ids)))
    return {
        "deleted": deleted,
        "users": len(dict.fromkeys(user_ids)),
        "affiliates": len(dict.fromkeys(affiliate_ids)),
        "settings_kept": True,
        "payout_settings_pk": PayoutSettings.pk(),
    }


if __name__ == "__main__":
    from core.logging_config import setup_logging
    from config import settings

    setup_logging(level=settings.log_level, log_format=settings.log_format)
    print(purge_users_and_commerce())
