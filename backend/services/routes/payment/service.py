"""Payment service — plans, purchases, orders, cards."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional

from boto3.dynamodb.conditions import Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import (
    DEFAULT_PLAN_PRICES,
    Membership,
    MembershipStatus,
    Order,
    OrderStatus,
    PaymentMethod,
    Plan,
    PlanType,
    PLAN_DURATIONS,
    UserRole,
    now_iso,
)
from models.common import ErrorCodes
from services.common.pagination import build_pagination, decode_cursor, encode_cursor, normalize_value
from services.common.payment_crypto import (
    detect_card_brand,
    encrypt_value,
    mask_card_number,
    normalize_card_number,
)
from services.routes.auth.service import get_user_by_id

logger = logging.getLogger(__name__)


def _table():
    return get_table()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _public_card(item: dict[str, Any]) -> dict[str, Any]:
    last4 = item.get("card_last4") or "0000"
    return {
        "payment_method_id": item.get("payment_method_id"),
        "card_holder_name": item.get("card_holder_name"),
        "card_number_masked": mask_card_number(last4),
        "card_last4": last4,
        "exp_month": item.get("exp_month"),
        "exp_year": item.get("exp_year"),
        "brand": item.get("brand"),
        "is_default": item.get("is_default", False),
        "has_cvc": bool(item.get("cvc_encrypted")),
        "has_pin": bool(item.get("pin_encrypted")),
        "billing_address": item.get("billing_address"),
        "created_at": item.get("created_at"),
    }


async def ensure_default_plans() -> None:
    for plan_type in PlanType:
        existing = await get_plan(plan_type)
        if existing:
            continue
        plan = Plan(
            plan_type=plan_type,
            price=DEFAULT_PLAN_PRICES[plan_type.value],
            currency="USD",
            duration_days=PLAN_DURATIONS[plan_type.value],
        )
        item = plan.to_item()
        await run_sync(_table().put_item, Item=item)


async def get_plan(plan_type: PlanType) -> Optional[dict[str, Any]]:
    def _fetch():
        response = _table().get_item(
            Key={"PK": Plan.pk(plan_type.value), "SK": Plan.sk()},
        )
        return response.get("Item")

    return await run_sync(_fetch)


async def list_plans() -> list[dict[str, Any]]:
    await ensure_default_plans()
    plans: list[dict[str, Any]] = []
    for plan_type in PlanType:
        item = await get_plan(plan_type)
        if not item:
            continue
        plans.append(
            {
                "plan_type": item.get("plan_type"),
                "price": normalize_value(item.get("price")),
                "currency": item.get("currency", "USD"),
                "duration_days": int(item.get("duration_days", 0)),
                "updated_by": item.get("updated_by"),
                "updated_at": item.get("updated_at"),
            }
        )
    return plans


async def update_plan_price(
    plan_type: PlanType,
    price: float,
    admin_user_id: str,
) -> dict[str, Any]:
    await ensure_default_plans()
    plan = await get_plan(plan_type)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan not found")

    def _update():
        response = _table().update_item(
            Key={"PK": Plan.pk(plan_type.value), "SK": Plan.sk()},
            UpdateExpression="SET price = :price, updated_by = :updated_by, updated_at = :updated_at",
            ExpressionAttributeValues={
                ":price": Decimal(str(price)),
                ":updated_by": admin_user_id,
                ":updated_at": now_iso(),
            },
            ReturnValues="ALL_NEW",
        )
        return response["Attributes"]

    item = await run_sync(_update)
    logger.info("Plan %s price updated by admin=%s", plan_type.value, admin_user_id)
    return {
        "plan_type": item.get("plan_type"),
        "price": normalize_value(item.get("price")),
        "currency": item.get("currency", "USD"),
        "duration_days": int(item.get("duration_days", 0)),
        "updated_by": item.get("updated_by"),
        "updated_at": item.get("updated_at"),
    }


async def _get_payment_method(user_id: str, payment_method_id: str) -> Optional[dict[str, Any]]:
    def _fetch():
        response = _table().get_item(
            Key={
                "PK": PaymentMethod.pk(user_id),
                "SK": PaymentMethod.sk(payment_method_id),
            },
        )
        return response.get("Item")

    return await run_sync(_fetch)


async def _list_payment_methods(user_id: str) -> list[dict[str, Any]]:
    def _fetch():
        response = _table().query(
            KeyConditionExpression=Key("PK").eq(PaymentMethod.pk(user_id))
            & Key("SK").begins_with("PAYMENT#"),
        )
        return response.get("Items", [])

    return await run_sync(_fetch)


async def _clear_default_cards(user_id: str) -> None:
    for item in await _list_payment_methods(user_id):
        if item.get("is_default"):
            await run_sync(
                _table().update_item,
                Key={"PK": item["PK"], "SK": item["SK"]},
                UpdateExpression="SET is_default = :false",
                ExpressionAttributeValues={":false": False},
            )


async def add_card(
    user_id: str,
    *,
    card_number: str,
    exp_month: int,
    exp_year: int,
    cvc: str,
    pin: Optional[str] = None,
    card_holder_name: Optional[str] = None,
    is_default: bool = False,
    billing_address: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    existing_cards = await _list_payment_methods(user_id)
    if existing_cards:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "You already have a saved card. Use edit card to update your card details.",
                "error_code": ErrorCodes.CONFLICT,
            },
        )

    digits = normalize_card_number(card_number)
    if len(cvc) not in (3, 4):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "CVC must be 3 or 4 digits")
    if pin is not None and (len(pin) < 4 or len(pin) > 6 or not pin.isdigit()):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "PIN must be 4 to 6 digits")

    payment_method_id = uuid.uuid4().hex

    record = PaymentMethod(
        user_id=user_id,
        payment_method_id=payment_method_id,
        card_holder_name=card_holder_name,
        card_last4=digits[-4:],
        card_number_encrypted=encrypt_value(digits),
        exp_month=exp_month,
        exp_year=exp_year,
        cvc_encrypted=encrypt_value(cvc),
        pin_encrypted=encrypt_value(pin) if pin else None,
        brand=detect_card_brand(digits),
        is_default=True,
        billing_address=billing_address,
    )
    item = record.to_item()
    await run_sync(_table().put_item, Item=item)
    logger.info("Payment card added for user_id=%s", user_id)
    return _public_card(item)


async def edit_card(
    user_id: str,
    payment_method_id: str,
    *,
    card_number: Optional[str] = None,
    exp_month: Optional[int] = None,
    exp_year: Optional[int] = None,
    cvc: Optional[str] = None,
    pin: Optional[str] = None,
    card_holder_name: Optional[str] = None,
    is_default: Optional[bool] = None,
    billing_address: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    item = await _get_payment_method(user_id, payment_method_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")

    fields: dict[str, Any] = {}
    if card_number is not None:
        digits = normalize_card_number(card_number)
        fields["card_last4"] = digits[-4:]
        fields["card_number_encrypted"] = encrypt_value(digits)
        fields["brand"] = detect_card_brand(digits)
    if exp_month is not None:
        fields["exp_month"] = exp_month
    if exp_year is not None:
        fields["exp_year"] = exp_year
    if cvc is not None:
        if len(cvc) not in (3, 4):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "CVC must be 3 or 4 digits")
        fields["cvc_encrypted"] = encrypt_value(cvc)
    if pin is not None:
        if len(pin) < 4 or len(pin) > 6 or not pin.isdigit():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "PIN must be 4 to 6 digits")
        fields["pin_encrypted"] = encrypt_value(pin)
    if card_holder_name is not None:
        fields["card_holder_name"] = card_holder_name
    if billing_address is not None:
        fields["billing_address"] = billing_address
    if is_default is True:
        await _clear_default_cards(user_id)
        fields["is_default"] = True
    elif is_default is False:
        fields["is_default"] = False

    if not fields:
        return _public_card(item)

    expr_names = {f"#k{i}": key for i, key in enumerate(fields)}
    expr_values = {f":v{i}": value for i, value in enumerate(fields.values())}
    update_parts = [f"{name} = {value}" for name, value in zip(expr_names, expr_values)]

    def _update():
        response = _table().update_item(
            Key={"PK": item["PK"], "SK": item["SK"]},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return response["Attributes"]

    updated = await run_sync(_update)
    return _public_card(updated)


async def _get_student_card_item(user_id: str) -> Optional[dict[str, Any]]:
    """Return the student's saved card record (one card per account)."""
    cards = await _list_payment_methods(user_id)
    return cards[0] if cards else None


async def get_student_card(user_id: str) -> dict[str, Any]:
    """Get the authenticated student's saved card (resolved from token/user id)."""
    item = await _get_student_card_item(user_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No saved card found")
    return _public_card(item)


async def get_student_payment_method_id(user_id: str) -> str:
    item = await _get_student_card_item(user_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No saved card found")
    return item["payment_method_id"]


async def edit_student_card(
    user_id: str,
    *,
    card_number: Optional[str] = None,
    exp_month: Optional[int] = None,
    exp_year: Optional[int] = None,
    cvc: Optional[str] = None,
    pin: Optional[str] = None,
    card_holder_name: Optional[str] = None,
    billing_address: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Edit the authenticated student's saved card (resolved from token/user id)."""
    payment_method_id = await get_student_payment_method_id(user_id)
    return await edit_card(
        user_id,
        payment_method_id,
        card_number=card_number,
        exp_month=exp_month,
        exp_year=exp_year,
        cvc=cvc,
        pin=pin,
        card_holder_name=card_holder_name,
        is_default=True,
        billing_address=billing_address,
    )


async def get_card(user_id: str, payment_method_id: str) -> dict[str, Any]:
    item = await _get_payment_method(user_id, payment_method_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")
    return _public_card(item)


async def list_cards(user_id: str) -> list[dict[str, Any]]:
    return [_public_card(item) for item in await _list_payment_methods(user_id)]


async def get_membership(user_id: str) -> Optional[dict[str, Any]]:
    def _fetch():
        response = _table().get_item(
            Key={"PK": Membership.pk(user_id), "SK": Membership.sk()},
        )
        return response.get("Item")

    item = await run_sync(_fetch)
    if not item:
        return None
    plan = await get_plan(PlanType(item["plan_type"]))
    return {
        "plan_type": item.get("plan_type"),
        "status": item.get("status"),
        "start_date": item.get("start_date"),
        "end_date": item.get("end_date"),
        "order_id": item.get("order_id"),
        "plan_price": normalize_value(plan.get("price")) if plan else None,
        "currency": plan.get("currency", "USD") if plan else "USD",
        "duration_days": int(plan.get("duration_days", 0)) if plan else 0,
    }


async def _count_orders(user_id: str) -> int:
    total = 0
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(Membership.pk(user_id))
        & Key("SK").begins_with("ORDER#"),
        "Select": "COUNT",
    }
    while True:
        def _count(kw=kwargs):
            return _table().query(**kw)

        response = await run_sync(_count)
        total += response.get("Count", 0)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return total


async def list_orders(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    if page < 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "page must be >= 1")
    if limit < 1 or limit > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "limit must be between 1 and 100")

    total = await _count_orders(user_id)
    start_index = (page - 1) * limit
    collected: list[dict[str, Any]] = []
    skipped = 0
    has_next = False
    next_cursor: Optional[str] = None

    query_kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(Membership.pk(user_id))
        & Key("SK").begins_with("ORDER#"),
        "ScanIndexForward": False,
    }
    exclusive_start_key = decode_cursor(cursor)
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
            collected.append(
                {
                    "order_id": item.get("order_id"),
                    "plan_type": item.get("plan_type"),
                    "amount": normalize_value(item.get("amount")),
                    "currency": item.get("currency", "USD"),
                    "status": item.get("status"),
                    "payment_method_id": item.get("payment_method_id"),
                    "created_at": item.get("created_at"),
                }
            )
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

    return {
        "items": collected,
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


async def purchase_plan(
    user_id: str,
    plan_type: PlanType,
    payment_method_id: Optional[str] = None,
) -> dict[str, Any]:
    user = await get_user_by_id(user_id)
    if not user or user.get("role") != UserRole.STUDENT.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only students can purchase plans")

    resolved_payment_method_id = payment_method_id or await get_student_payment_method_id(user_id)
    card = await _get_payment_method(user_id, resolved_payment_method_id)
    if not card:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment method not found")

    await ensure_default_plans()
    plan = await get_plan(plan_type)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan not found")

    amount = normalize_value(plan.get("price"))
    order_id = uuid.uuid4().hex
    created_at = now_iso()
    affiliate_id = user.get("referred_by_affiliate_id")
    affiliate_commission = None

    if affiliate_id:
        affiliate = await get_user_by_id(affiliate_id)
        margin = affiliate.get("margin_percent") if affiliate else None
        if margin is not None:
            affiliate_commission = round(float(amount) * float(margin) / 100, 2)

    order = Order(
        user_id=user_id,
        order_id=order_id,
        plan_type=plan_type,
        amount=float(amount),
        currency=plan.get("currency", "USD"),
        status=OrderStatus.PAID,
        payment_method_id=resolved_payment_method_id,
        affiliate_id=affiliate_id,
        affiliate_commission=affiliate_commission,
        created_at=created_at,
    )
    membership = Membership(
        user_id=user_id,
        plan_type=plan_type,
        status=MembershipStatus.ACTIVE,
        start_date=created_at,
        end_date=(_utcnow() + timedelta(days=int(plan.get("duration_days", PLAN_DURATIONS[plan_type.value])))).isoformat(),
        order_id=order_id,
    )
    await run_sync(_table().put_item, Item=order.to_item())
    await run_sync(_table().put_item, Item=membership.to_item())
    logger.info("Plan purchase completed user_id=%s order_id=%s plan=%s", user_id, order_id, plan_type.value)

    return {
        "order": {
            "order_id": order_id,
            "plan_type": plan_type.value,
            "amount": amount,
            "currency": plan.get("currency", "USD"),
            "status": OrderStatus.PAID.value,
            "payment_method_id": resolved_payment_method_id,
            "created_at": created_at,
        },
        "membership": await get_membership(user_id),
    }
