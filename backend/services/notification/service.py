"""Store, list, mark, websocket-push, and clean up in-app notifications."""

from __future__ import annotations

import json
import logging
import re
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Optional

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from fastapi import WebSocket

from core.async_io import run_sync
from database import get_table
from database_entities import UserNotification, UserRole, now_iso
from services.common.pagination import build_pagination, consume_query_page, normalize_value

logger = logging.getLogger(__name__)

READ_TTL_DAYS = 30
CLEANUP_INTERVAL_SECONDS = 6 * 3600
_PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")
_TEMPLATES = json.loads(
    (Path(__file__).resolve().parent / "templates.json").read_text(encoding="utf-8")
)
PLAN_LABELS = {
    "monthly": "Monthly",
    "biannual": "Biannual",
    "annual": "Annual",
}
SUMMARY_LABELS = (
    ("payout_requests", "payout request"),
    ("orders", "order"),
    ("payment_failures", "failed payment"),
    ("new_students", "new student"),
    ("new_affiliates", "new affiliate"),
    ("quizzes", "quiz"),
    ("patients", "patient"),
    ("recommendations", "recommendation"),
    ("chats", "chat session"),
    ("invites", "invite"),
    ("payout_reviews", "payout review"),
    ("lock_releases", "lock release"),
    ("webinars", "webinar"),
    ("webinar_bookings", "webinar booking"),
)
EMAIL_ROLES = {UserRole.STUDENT.value, UserRole.AFFILIATE.value}


class NotificationHub:
    def __init__(self) -> None:
        self._sockets: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        self._sockets[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        sockets = self._sockets.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._sockets.pop(user_id, None)

    async def push(self, user_id: str, payload: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for websocket in list(self._sockets.get(user_id, ())):
            try:
                await websocket.send_json(payload)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(user_id, websocket)


hub = NotificationHub()


def _table():
    return get_table()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> str:
    return _utcnow().date().isoformat()


def _fill(text: str, values: dict[str, Any]) -> str:
    return _PLACEHOLDER.sub(lambda match: str(values.get(match.group(1), "") or ""), text)


def plan_label(plan_type: str | None) -> str:
    if not plan_type:
        return "membership"
    return PLAN_LABELS.get(str(plan_type), str(plan_type).replace("_", " ").title())


def money(amount: Any, currency: str = "USD") -> str:
    try:
        value = float(amount or 0)
    except (TypeError, ValueError):
        value = 0.0
    if (currency or "USD").upper() == "USD":
        return f"${value:,.2f}"
    return f"{value:,.2f} {currency}"


def display_name(user: Optional[dict[str, Any]], fallback: str = "there") -> str:
    if not user:
        return fallback
    name = " ".join(
        part for part in (str(user.get("first_name") or "").strip(), str(user.get("last_name") or "").strip()) if part
    )
    return name or str(user.get("email") or fallback)


def login_path(role: str | None) -> str:
    if role == UserRole.ADMIN.value:
        return "/login/admin"
    if role == UserRole.AFFILIATE.value:
        return "/login/affiliate"
    return "/login"


def public_notification(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "notification_id": item.get("notification_id"),
        "action": item.get("action"),
        "title": item.get("title"),
        "body": item.get("body"),
        "href": item.get("href"),
        "read": bool(item.get("read")),
        "summary": bool(item.get("summary")),
        "created_at": item.get("created_at"),
        "read_at": item.get("read_at"),
    }


def _as_int(value: Any, default: int = 0) -> int:
    try:
        return int(normalize_value(value) or 0)
    except (TypeError, ValueError):
        return default


async def _get_user(user_id: str) -> Optional[dict[str, Any]]:
    from services.routes.auth.service import get_user_by_id

    return await get_user_by_id(user_id)


async def unread_count(user_id: str) -> int:
    def _fetch():
        return _table().get_item(
            Key={"PK": UserNotification.pk(user_id), "SK": UserNotification.meta_sk()}
        ).get("Item")

    item = await run_sync(_fetch)
    return max(0, _as_int((item or {}).get("unread_count")))


async def _adjust_meta(user_id: str, *, unread_delta: int = 0, total_delta: int = 0) -> int:
    expr = ["SET entity = if_not_exists(entity, :entity), updated_at = :now"]
    values: dict[str, Any] = {":entity": "NOTIFICATION_META", ":now": now_iso()}
    if unread_delta:
        expr.insert(0, "ADD unread_count :unread")
        values[":unread"] = Decimal(str(unread_delta))
    if total_delta:
        if "ADD" in expr[0]:
            expr[0] = expr[0] + ", total_count :total"
            values[":total"] = Decimal(str(total_delta))
        else:
            expr.insert(0, "ADD total_count :total")
            values[":total"] = Decimal(str(total_delta))

    def _update():
        return _table().update_item(
            Key={"PK": UserNotification.pk(user_id), "SK": UserNotification.meta_sk()},
            UpdateExpression=" ".join(expr),
            ExpressionAttributeValues=values,
            ReturnValues="ALL_NEW",
        )

    response = await run_sync(_update)
    return max(0, _as_int((response.get("Attributes") or {}).get("unread_count")))


async def _set_unread(user_id: str, count: int) -> None:
    def _update():
        return _table().update_item(
            Key={"PK": UserNotification.pk(user_id), "SK": UserNotification.meta_sk()},
            UpdateExpression="SET unread_count = :count, entity = if_not_exists(entity, :entity), updated_at = :now",
            ExpressionAttributeValues={
                ":count": max(0, count),
                ":entity": "NOTIFICATION_META",
                ":now": now_iso(),
            },
        )

    await run_sync(_update)


def render_template(action: str, data: dict[str, Any]) -> dict[str, Any]:
    template = _TEMPLATES.get(action)
    if not template:
        raise KeyError(f"Unknown notification action: {action}")
    values = {key: ("" if value is None else value) for key, value in data.items()}
    href = _fill(str(template.get("href") or ""), values).strip() or None
    return {
        "title": _fill(str(template.get("title") or "Notification"), values),
        "body": _fill(str(template.get("body") or ""), values),
        "href": href,
        "email": template.get("email"),
    }


async def emit_user(
    *,
    user_id: str,
    role: str,
    action: str,
    data: Optional[dict[str, Any]] = None,
    email_to: Optional[str] = None,
    send_email: bool = True,
) -> Optional[dict[str, Any]]:
    payload = dict(data or {})
    rendered = render_template(action, payload)
    created_at = now_iso()
    notification_id = uuid.uuid4().hex
    item = UserNotification(
        user_id=user_id,
        notification_id=notification_id,
        action=action,
        role=role,
        title=rendered["title"],
        body=rendered["body"],
        href=rendered["href"],
        created_at=created_at,
        updated_at=created_at,
    ).to_item()

    await run_sync(_table().put_item, Item=item)
    unread = await _adjust_meta(user_id, unread_delta=1, total_delta=1)
    public = public_notification(item)
    await hub.push(user_id, {"type": "notification", "item": public, "unread_count": unread})

    email_action = rendered.get("email")
    if send_email and email_action and role in EMAIL_ROLES:
        from services.common import email as email_service

        recipient = email_to or payload.get("account_email")
        await email_service.send_template_email(
            email_action,
            recipient,
            cta_path=payload.get("cta_path"),
            **payload,
        )
    return public


async def emit_role(
    *,
    role: str,
    action: str,
    data: Optional[dict[str, Any]] = None,
    send_email: bool = False,
) -> None:
    for user_id in await _list_role_ids(role):
        try:
            await emit_user(
                user_id=user_id,
                role=role,
                action=action,
                data=data,
                send_email=send_email,
            )
        except Exception:
            logger.exception(
                "Failed to emit role notification action=%s role=%s user_id=%s",
                action,
                role,
                user_id,
            )


async def emit_admins(*, action: str, data: Optional[dict[str, Any]] = None) -> None:
    await emit_role(role=UserRole.ADMIN.value, action=action, data=data, send_email=False)


def _summary_line(counts: dict[str, Any]) -> str:
    parts: list[str] = []
    for key, label in SUMMARY_LABELS:
        count = _as_int(counts.get(key))
        if count <= 0:
            continue
        suffix = "" if count == 1 else "s"
        parts.append(f"{count} {label}{suffix}")
    return " · ".join(parts) or "No new activity yet"


def _summary_href(counts: dict[str, Any]) -> str:
    if _as_int(counts.get("payout_requests")) > 0:
        return "/admin/payout"
    if _as_int(counts.get("orders")) > 0:
        return "/admin/reports"
    if _as_int(counts.get("webinar_bookings")) > 0 or _as_int(counts.get("webinars")) > 0:
        return "/admin/webinars"
    return "/admin"


async def bump_admin_summary(kind: str, *, extra: Optional[str] = None) -> None:
    _ = extra
    admin_ids = await _list_admin_ids()
    if not admin_ids:
        return
    day = _today()
    for admin_id in admin_ids:
        try:
            await _upsert_admin_summary(admin_id, day, kind)
        except Exception:
            logger.exception("Failed to bump admin summary admin_id=%s kind=%s", admin_id, kind)


async def _list_role_ids(role: str) -> list[str]:
    ids: list[str] = []
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(f"ROLE#{role}") & Key("SK").begins_with("USER#"),
        "ProjectionExpression": "user_id",
    }
    while True:
        response = await run_sync(lambda: _table().query(**kwargs))
        for item in response.get("Items") or []:
            user_id = item.get("user_id")
            if user_id:
                ids.append(str(user_id))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return ids


async def _list_admin_ids() -> list[str]:
    return await _list_role_ids(UserRole.ADMIN.value)


async def _upsert_admin_summary(admin_id: str, day: str, kind: str) -> None:
    def _fetch():
        return _table().get_item(
            Key={"PK": UserNotification.pk(admin_id), "SK": UserNotification.summary_sk(day)}
        ).get("Item")

    existing = await run_sync(_fetch)
    now = now_iso()
    counts = dict((existing or {}).get("counts") or {})
    counts[kind] = _as_int(counts.get(kind)) + 1
    line = _summary_line(counts)
    href = _summary_href(counts)
    was_read = bool((existing or {}).get("read"))
    notification_id = str((existing or {}).get("notification_id") or f"summary-{day}")
    created_at = str((existing or {}).get("created_at") or now)
    item = UserNotification(
        user_id=admin_id,
        notification_id=notification_id,
        action="admin.daily_summary",
        role=UserRole.ADMIN.value,
        title="Today's activity",
        body=line,
        href=href,
        read=False,
        read_at=None,
        summary=True,
        summary_date=day,
        counts=counts,
        created_at=created_at,
        updated_at=now,
    ).to_item()
    await run_sync(_table().put_item, Item=item)

    unread_delta = 0
    total_delta = 0
    if existing is None:
        unread_delta = 1
        total_delta = 1
    elif was_read:
        unread_delta = 1
        await _delete_read_index(admin_id, notification_id, str((existing or {}).get("read_at") or created_at))
    unread = await _adjust_meta(admin_id, unread_delta=unread_delta, total_delta=total_delta) if unread_delta or total_delta else await unread_count(admin_id)
    if unread_delta == 0 and total_delta == 0:
        unread = await unread_count(admin_id)
    await hub.push(
        admin_id,
        {"type": "notification", "item": public_notification(item), "unread_count": unread},
    )


async def list_notifications(
    user_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    unread_only: bool = False,
) -> dict[str, Any]:
    if page < 1:
        page = 1
    if limit < 1:
        limit = 20
    start_index = (page - 1) * limit
    collected: list[dict[str, Any]] = []
    skipped = 0
    has_next = False
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(UserNotification.pk(user_id))
        & Key("SK").begins_with("NOTIFY#EVT#"),
        "ScanIndexForward": False,
    }
    while True:
        response = await run_sync(lambda: _table().query(**kwargs))
        items = response.get("Items") or []
        last_key = response.get("LastEvaluatedKey")
        skipped, page_full, has_next = consume_query_page(
            items,
            start_index=start_index,
            skipped=skipped,
            collected=collected,
            limit=limit,
            last_key=last_key,
            map_item=lambda row: row,
            include_item=lambda row: row.get("entity") == UserNotification.ENTITY
            and (not unread_only or not row.get("read")),
        )
        if page_full or not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key

    if page == 1:
        summary = await _get_summary(user_id, _today())
        if summary and (not unread_only or not summary.get("read")):
            summary_id = str(summary.get("notification_id") or "")
            collected = [summary] + [
                row for row in collected if str(row.get("notification_id") or "") != summary_id
            ]
            if len(collected) > limit:
                collected = collected[:limit]
                has_next = True

    unread = await unread_count(user_id)
    total = unread if unread_only else await _meta_total(user_id)
    return {
        "items": [public_notification(item) for item in collected],
        "unread_count": unread,
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
        ),
    }


async def _get_summary(user_id: str, day: str) -> Optional[dict[str, Any]]:
    def _fetch():
        return _table().get_item(
            Key={"PK": UserNotification.pk(user_id), "SK": UserNotification.summary_sk(day)}
        ).get("Item")

    item = await run_sync(_fetch)
    if item and item.get("entity") == UserNotification.ENTITY:
        return item
    return None


async def _meta_total(user_id: str) -> int:
    def _fetch():
        return _table().get_item(
            Key={"PK": UserNotification.pk(user_id), "SK": UserNotification.meta_sk()}
        ).get("Item")

    item = await run_sync(_fetch)
    return max(0, _as_int((item or {}).get("total_count")))


async def _load_notification(user_id: str, notification_id: str) -> Optional[dict[str, Any]]:
    today = await _get_summary(user_id, _today())
    if today and str(today.get("notification_id")) == notification_id:
        return today

    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(UserNotification.pk(user_id))
        & Key("SK").begins_with("NOTIFY#EVT#"),
        "ScanIndexForward": False,
    }
    while True:
        response = await run_sync(lambda: _table().query(**kwargs))
        for item in response.get("Items") or []:
            if str(item.get("notification_id")) == notification_id:
                return item
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return None


async def mark_read(user_id: str, notification_id: str) -> dict[str, Any]:
    item = await _load_notification(user_id, notification_id)
    if not item:
        from fastapi import HTTPException, status

        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    if item.get("read"):
        return {"item": public_notification(item), "unread_count": await unread_count(user_id)}

    read_at = now_iso()
    item["read"] = True
    item["read_at"] = read_at
    item["updated_at"] = read_at
    await run_sync(_table().put_item, Item=item)
    await _put_read_index(item)
    unread = await _adjust_meta(user_id, unread_delta=-1)
    public = public_notification(item)
    await hub.push(
        user_id,
        {"type": "read", "notification_id": notification_id, "item": public, "unread_count": unread},
    )
    return {"item": public, "unread_count": unread}


async def mark_all_read(user_id: str) -> dict[str, Any]:
    summary = await _get_summary(user_id, _today())
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(UserNotification.pk(user_id))
        & Key("SK").begins_with("NOTIFY#EVT#"),
        "ScanIndexForward": False,
    }
    unread_items: list[dict[str, Any]] = []
    if summary and not summary.get("read"):
        unread_items.append(summary)
    while True:
        response = await run_sync(lambda: _table().query(**kwargs))
        for item in response.get("Items") or []:
            if item.get("entity") == UserNotification.ENTITY and not item.get("read"):
                unread_items.append(item)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key

    read_at = now_iso()
    for item in unread_items:
        item["read"] = True
        item["read_at"] = read_at
        item["updated_at"] = read_at
        await run_sync(_table().put_item, Item=item)
        await _put_read_index(item)

    await _set_unread(user_id, 0)
    await hub.push(user_id, {"type": "read_all", "unread_count": 0})
    return {"unread_count": 0, "marked": len(unread_items)}


async def _put_read_index(item: dict[str, Any]) -> None:
    read_at = str(item.get("read_at") or now_iso())
    user_id = str(item.get("user_id") or "")
    notification_id = str(item.get("notification_id") or "")
    if not user_id or not notification_id:
        return
    await run_sync(
        _table().put_item,
        Item={
            "PK": UserNotification.read_pk(),
            "SK": UserNotification.read_sk(read_at, user_id, notification_id),
            "entity": "NOTIFICATION_READ",
            "user_id": user_id,
            "notification_id": notification_id,
            "notification_sk": item.get("SK"),
            "created_at": item.get("created_at"),
            "read_at": read_at,
        },
    )


async def _delete_read_index(user_id: str, notification_id: str, read_at: str) -> None:
    try:
        await run_sync(
            _table().delete_item,
            Key={
                "PK": UserNotification.read_pk(),
                "SK": UserNotification.read_sk(read_at, user_id, notification_id),
            },
        )
    except ClientError:
        logger.exception("Failed to drop read index user_id=%s notification_id=%s", user_id, notification_id)


async def delete_expired_read() -> int:
    cutoff = (_utcnow() - timedelta(days=READ_TTL_DAYS)).isoformat()
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(UserNotification.read_pk()) & Key("SK").lt(cutoff),
    }
    deleted = 0
    while True:
        response = await run_sync(lambda: _table().query(**kwargs))
        items = response.get("Items") or []
        for item in items:
            user_id = str(item.get("user_id") or "")
            notification_sk = item.get("notification_sk")
            if user_id and notification_sk:
                try:
                    await run_sync(
                        _table().delete_item,
                        Key={"PK": UserNotification.pk(user_id), "SK": notification_sk},
                    )
                    await _adjust_meta(user_id, total_delta=-1)
                except Exception:
                    logger.exception(
                        "Failed to delete expired notification user_id=%s sk=%s",
                        user_id,
                        notification_sk,
                    )
            try:
                await run_sync(
                    _table().delete_item,
                    Key={"PK": item["PK"], "SK": item["SK"]},
                )
                deleted += 1
            except Exception:
                logger.exception("Failed to delete read index SK=%s", item.get("SK"))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    if deleted:
        logger.info("Deleted %s read notification(s) older than %s days", deleted, READ_TTL_DAYS)
    return deleted


async def run_cleanup_loop(stop_event) -> None:
    import asyncio

    await asyncio.sleep(20)
    while not stop_event.is_set():
        try:
            await delete_expired_read()
        except Exception:
            logger.exception("Notification cleanup failed")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=CLEANUP_INTERVAL_SECONDS)
        except asyncio.TimeoutError:
            continue
