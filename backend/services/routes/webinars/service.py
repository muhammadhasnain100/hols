"""Webinar catalog, admin management, and student booking."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from boto3.dynamodb.conditions import Attr, Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import (
    UserRole,
    Webinar,
    WebinarRegistration,
    WebinarRegistrationStatus,
    WebinarStatus,
    now_iso,
)
from services.common.pagination import build_pagination, normalize_value
from services.routes.auth.service import get_user_by_id
from services.routes.payment import service as payment_service

logger = logging.getLogger(__name__)

VALID_STATUSES = {item.value for item in WebinarStatus}


def _table():
    return get_table()


def _parse_iso(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid datetime format") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _public_webinar(
    item: dict[str, Any],
    *,
    is_booked: bool = False,
    reveal_join_url: bool = False,
) -> dict[str, Any]:
    capacity = int(item.get("capacity") or 0)
    seats_taken = int(item.get("seats_taken") or 0)
    join_url = item.get("join_url") if reveal_join_url else None
    return {
        "webinar_id": item.get("webinar_id"),
        "title": item.get("title"),
        "description": item.get("description"),
        "starts_at": item.get("starts_at"),
        "ends_at": item.get("ends_at"),
        "price": float(normalize_value(item.get("price")) or 0),
        "currency": item.get("currency") or "USD",
        "capacity": capacity,
        "seats_taken": seats_taken,
        "seats_remaining": max(capacity - seats_taken, 0),
        "status": item.get("status"),
        "join_url": join_url,
        "is_booked": is_booked,
        "created_at": item.get("created_at"),
    }


def _public_registration(
    item: dict[str, Any],
    *,
    webinar: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    return {
        "webinar_id": item.get("webinar_id"),
        "user_id": item.get("user_id"),
        "order_id": item.get("order_id"),
        "amount": float(normalize_value(item.get("amount")) or 0),
        "currency": item.get("currency") or "USD",
        "status": item.get("status"),
        "created_at": item.get("created_at"),
        "webinar_title": webinar.get("title") if webinar else None,
        "starts_at": webinar.get("starts_at") if webinar else None,
        "join_url": webinar.get("join_url") if webinar else None,
    }


async def _get_webinar_item(webinar_id: str) -> dict[str, Any]:
    def _fetch():
        return _table().get_item(Key={"PK": Webinar.pk(webinar_id), "SK": Webinar.sk()})

    response = await run_sync(_fetch)
    item = response.get("Item")
    if not item or item.get("entity") != Webinar.ENTITY:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Webinar not found")
    return item


async def _get_registration(user_id: str, webinar_id: str) -> Optional[dict[str, Any]]:
    def _fetch():
        return _table().get_item(
            Key={"PK": WebinarRegistration.pk(user_id), "SK": WebinarRegistration.sk(webinar_id)}
        )

    response = await run_sync(_fetch)
    item = response.get("Item")
    if not item or item.get("entity") != WebinarRegistration.ENTITY:
        return None
    return item


async def _list_webinar_items(*, published_only: bool = False) -> list[dict[str, Any]]:
    kwargs: dict[str, Any] = {
        "IndexName": "GSI1",
        "KeyConditionExpression": Key("GSI1PK").eq("SECTION#webinars"),
        "ScanIndexForward": True,
    }
    if published_only:
        kwargs["FilterExpression"] = Attr("status").eq(WebinarStatus.PUBLISHED.value)

    items: list[dict[str, Any]] = []
    while True:
        def _query(kw=dict(kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        for item in response.get("Items") or []:
            if item.get("entity") != Webinar.ENTITY:
                continue
            items.append(item)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return items


def _paginate(items: list[dict[str, Any]], *, page: int, limit: int) -> dict[str, Any]:
    if page < 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "page must be >= 1")
    if limit < 1 or limit > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "limit must be between 1 and 100")
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    page_items = items[start:end]
    return {
        "items": page_items,
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=end < total,
            next_cursor=None,
        ),
    }


async def create_webinar(
    *,
    admin_user_id: str,
    title: str,
    description: Optional[str],
    starts_at: str,
    ends_at: Optional[str],
    price: float,
    currency: str,
    capacity: int,
    join_url: Optional[str],
    status_value: str,
) -> dict[str, Any]:
    if status_value not in VALID_STATUSES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webinar status")
    _parse_iso(starts_at)
    if ends_at:
        _parse_iso(ends_at)

    webinar_id = uuid.uuid4().hex
    created_at = now_iso()
    webinar = Webinar(
        webinar_id=webinar_id,
        title=title.strip(),
        description=(description or "").strip() or None,
        starts_at=starts_at,
        ends_at=ends_at,
        price=price,
        currency=currency.upper(),
        capacity=capacity,
        seats_taken=0,
        join_url=(join_url or "").strip() or None,
        status=WebinarStatus(status_value),
        created_by=admin_user_id,
        created_at=created_at,
        updated_at=created_at,
    )
    item = webinar.to_item()
    await run_sync(_table().put_item, Item=item)
    logger.info("Webinar created webinar_id=%s by=%s", webinar_id, admin_user_id)
    return _public_webinar(item, reveal_join_url=True)


async def update_webinar(webinar_id: str, **fields: Any) -> dict[str, Any]:
    item = await _get_webinar_item(webinar_id)
    updates = {key: value for key, value in fields.items() if value is not None}
    if "status" in updates and updates["status"] not in VALID_STATUSES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webinar status")
    if "starts_at" in updates:
        _parse_iso(str(updates["starts_at"]))
    if "ends_at" in updates and updates["ends_at"]:
        _parse_iso(str(updates["ends_at"]))
    if "title" in updates:
        updates["title"] = str(updates["title"]).strip()
    if "description" in updates:
        text = str(updates["description"]).strip()
        updates["description"] = text or None
    if "join_url" in updates:
        url = str(updates["join_url"]).strip()
        updates["join_url"] = url or None
    if "currency" in updates:
        updates["currency"] = str(updates["currency"]).upper()
    if "capacity" in updates:
        capacity = int(updates["capacity"])
        if capacity < int(item.get("seats_taken") or 0):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Capacity cannot be below seats already taken",
            )
        updates["capacity"] = capacity

    item.update(updates)
    item["updated_at"] = now_iso()
    webinar = Webinar(
        webinar_id=item["webinar_id"],
        title=item["title"],
        description=item.get("description"),
        starts_at=item["starts_at"],
        ends_at=item.get("ends_at"),
        price=float(normalize_value(item.get("price")) or 0),
        currency=item.get("currency") or "USD",
        capacity=int(item.get("capacity") or 100),
        seats_taken=int(item.get("seats_taken") or 0),
        join_url=item.get("join_url"),
        status=WebinarStatus(item.get("status") or WebinarStatus.DRAFT.value),
        created_by=item.get("created_by"),
        created_at=item.get("created_at") or now_iso(),
        updated_at=item["updated_at"],
    )
    saved = webinar.to_item()
    await run_sync(_table().put_item, Item=saved)
    return _public_webinar(saved, reveal_join_url=True)


async def list_webinars_admin(*, page: int = 1, limit: int = 20) -> dict[str, Any]:
    items = await _list_webinar_items(published_only=False)
    page_data = _paginate(items, page=page, limit=limit)
    return {
        "items": [_public_webinar(item, reveal_join_url=True) for item in page_data["items"]],
        "pagination": page_data["pagination"],
    }


async def list_webinars_student(
    *,
    user_id: str,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    items = await _list_webinar_items(published_only=True)
    now = datetime.now(timezone.utc)
    upcoming = [
        item
        for item in items
        if _parse_iso(str(item.get("starts_at") or now.isoformat())) >= now
        or str(item.get("status")) == WebinarStatus.PUBLISHED.value
    ]
    # Prefer soonest first; include recently started published sessions too.
    upcoming.sort(key=lambda item: str(item.get("starts_at") or ""))
    page_data = _paginate(upcoming, page=page, limit=limit)
    public_items = []
    for item in page_data["items"]:
        registration = await _get_registration(user_id, str(item["webinar_id"]))
        booked = bool(
            registration and registration.get("status") == WebinarRegistrationStatus.BOOKED.value
        )
        public_items.append(
            _public_webinar(item, is_booked=booked, reveal_join_url=booked),
        )
    return {"items": public_items, "pagination": page_data["pagination"]}


async def get_webinar_for_student(user_id: str, webinar_id: str) -> dict[str, Any]:
    item = await _get_webinar_item(webinar_id)
    if item.get("status") != WebinarStatus.PUBLISHED.value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Webinar not found")
    registration = await _get_registration(user_id, webinar_id)
    booked = bool(
        registration and registration.get("status") == WebinarRegistrationStatus.BOOKED.value
    )
    return _public_webinar(item, is_booked=booked, reveal_join_url=booked)


async def get_webinar_for_admin(webinar_id: str) -> dict[str, Any]:
    item = await _get_webinar_item(webinar_id)
    return _public_webinar(item, reveal_join_url=True)


async def list_registrants(
    webinar_id: str,
    *,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    await _get_webinar_item(webinar_id)
    kwargs: dict[str, Any] = {
        "IndexName": "GSI1",
        "KeyConditionExpression": Key("GSI1PK").eq(f"WEBINAR#{webinar_id}")
        & Key("GSI1SK").begins_with("REG#"),
        "ScanIndexForward": False,
    }
    items: list[dict[str, Any]] = []
    while True:
        def _query(kw=dict(kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        for item in response.get("Items") or []:
            if item.get("entity") != WebinarRegistration.ENTITY:
                continue
            if item.get("status") != WebinarRegistrationStatus.BOOKED.value:
                continue
            items.append(item)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key

    page_data = _paginate(items, page=page, limit=limit)
    return {
        "items": [_public_registration(item) for item in page_data["items"]],
        "pagination": page_data["pagination"],
    }


async def book_webinar(
    *,
    user_id: str,
    webinar_id: str,
    payment_method_id: Optional[str] = None,
) -> dict[str, Any]:
    user = await get_user_by_id(user_id)
    if not user or user.get("role") != UserRole.STUDENT.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only students can book webinars")

    webinar = await _get_webinar_item(webinar_id)
    if webinar.get("status") != WebinarStatus.PUBLISHED.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Webinar is not open for booking")

    starts_at = _parse_iso(str(webinar.get("starts_at")))
    if starts_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This webinar has already started")

    existing = await _get_registration(user_id, webinar_id)
    if existing and existing.get("status") == WebinarRegistrationStatus.BOOKED.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "You are already booked for this webinar")

    capacity = int(webinar.get("capacity") or 0)
    seats_taken = int(webinar.get("seats_taken") or 0)
    if seats_taken >= capacity:
        raise HTTPException(status.HTTP_409_CONFLICT, "This webinar is full")

    price = float(normalize_value(webinar.get("price")) or 0)
    currency = str(webinar.get("currency") or "USD")
    resolved_payment_method_id: Optional[str] = None
    order_id: Optional[str] = None

    if price > 0:
        try:
            resolved_payment_method_id = (
                payment_method_id or await payment_service.get_student_payment_method_id(user_id)
            )
            await payment_service.get_card(user_id, resolved_payment_method_id)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_404_NOT_FOUND:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND,
                    "Payment method not found. Save a card before booking a paid webinar.",
                ) from exc
            raise
        order_id = uuid.uuid4().hex

    created_at = now_iso()
    registration = WebinarRegistration(
        user_id=user_id,
        webinar_id=webinar_id,
        order_id=order_id,
        amount=price,
        currency=currency,
        status=WebinarRegistrationStatus.BOOKED,
        payment_method_id=resolved_payment_method_id,
        created_at=created_at,
    )
    webinar["seats_taken"] = seats_taken + 1
    webinar["updated_at"] = created_at
    saved_webinar = Webinar(
        webinar_id=webinar["webinar_id"],
        title=webinar["title"],
        description=webinar.get("description"),
        starts_at=webinar["starts_at"],
        ends_at=webinar.get("ends_at"),
        price=price,
        currency=currency,
        capacity=capacity,
        seats_taken=seats_taken + 1,
        join_url=webinar.get("join_url"),
        status=WebinarStatus(webinar.get("status")),
        created_by=webinar.get("created_by"),
        created_at=webinar.get("created_at") or created_at,
        updated_at=created_at,
    ).to_item()

    await run_sync(_table().put_item, Item=registration.to_item())
    await run_sync(_table().put_item, Item=saved_webinar)
    logger.info(
        "Webinar booked user_id=%s webinar_id=%s amount=%s",
        user_id,
        webinar_id,
        price,
    )

    public_webinar = _public_webinar(saved_webinar, is_booked=True, reveal_join_url=True)
    return {
        "registration": _public_registration(registration.to_item(), webinar=public_webinar),
        "webinar": public_webinar,
    }


async def list_my_registrations(user_id: str) -> list[dict[str, Any]]:
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(WebinarRegistration.pk(user_id))
        & Key("SK").begins_with("WEBINAR_REG#"),
        "ScanIndexForward": False,
    }
    items: list[dict[str, Any]] = []
    while True:
        def _query(kw=dict(kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        for item in response.get("Items") or []:
            if item.get("entity") != WebinarRegistration.ENTITY:
                continue
            if item.get("status") != WebinarRegistrationStatus.BOOKED.value:
                continue
            items.append(item)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key

    results: list[dict[str, Any]] = []
    for item in items:
        try:
            webinar = await _get_webinar_item(str(item["webinar_id"]))
        except HTTPException:
            webinar = None
        public = _public_webinar(webinar, is_booked=True, reveal_join_url=True) if webinar else None
        results.append(_public_registration(item, webinar=public))
    return results


async def list_notifications(user_id: str) -> list[dict[str, Any]]:
    """Upcoming published webinars for the student notification bell."""
    catalog = await list_webinars_student(user_id=user_id, page=1, limit=20)
    notifications: list[dict[str, Any]] = []
    for webinar in catalog["items"]:
        starts = webinar.get("starts_at")
        booked = bool(webinar.get("is_booked"))
        title = webinar.get("title") or "Upcoming webinar"
        price = float(webinar.get("price") or 0)
        if booked:
            body = f"You're booked · starts {starts}"
        else:
            body = (
                f"Upcoming · {starts}"
                if price <= 0
                else f"Book a seat · {webinar.get('currency')} {price:.2f} · {starts}"
            )
        notifications.append(
            {
                "webinar_id": webinar.get("webinar_id"),
                "title": title,
                "starts_at": starts,
                "price": price,
                "currency": webinar.get("currency") or "USD",
                "is_booked": booked,
                "body": body,
            }
        )
    return notifications
