"""API schemas for payment routes."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

from database_entities import PlanType
from models.common import ApiSuccessResponse
from models.users import PaginationMeta


class PlanUpdateRequest(BaseModel):
    price: float = Field(gt=0)


class PurchasePlanRequest(BaseModel):
    plan_type: PlanType
    payment_method_id: Optional[str] = None


class CardCreateRequest(BaseModel):
    card_number: str = Field(min_length=12, max_length=19)
    exp_month: int = Field(ge=1, le=12)
    exp_year: int = Field(ge=2024, le=2100)
    cvc: str = Field(min_length=3, max_length=4, pattern=r"^\d{3,4}$")
    pin: Optional[str] = Field(default=None, min_length=4, max_length=6, pattern=r"^\d{4,6}$")
    card_holder_name: Optional[str] = None
    is_default: bool = False
    billing_address: Optional[dict[str, Any]] = None


class CardUpdateRequest(BaseModel):
    card_number: Optional[str] = Field(default=None, min_length=12, max_length=19)
    exp_month: Optional[int] = Field(default=None, ge=1, le=12)
    exp_year: Optional[int] = Field(default=None, ge=2024, le=2100)
    cvc: Optional[str] = Field(default=None, min_length=3, max_length=4, pattern=r"^\d{3,4}$")
    pin: Optional[str] = Field(default=None, min_length=4, max_length=6, pattern=r"^\d{4,6}$")
    card_holder_name: Optional[str] = None
    is_default: Optional[bool] = None
    billing_address: Optional[dict[str, Any]] = None


class PlanListData(BaseModel):
    items: list[dict[str, Any]]


class PlanUpdateData(BaseModel):
    plan: dict[str, Any]


class PurchasePlanData(BaseModel):
    order: dict[str, Any]
    membership: Optional[dict[str, Any]] = None


class MembershipData(BaseModel):
    membership: Optional[dict[str, Any]] = None


class OrderHistoryData(BaseModel):
    items: list[dict[str, Any]]
    pagination: PaginationMeta


class StudentCommerceData(BaseModel):
    user_id: str
    total_spent: float = 0
    admin_earned: float = 0
    order_count: int = 0
    paid_order_count: int = 0
    currency: str = "USD"
    last_purchase_at: Optional[str] = None
    last_purchase_amount: Optional[float] = None
    last_plan_type: Optional[str] = None
    current_plan: Optional[str] = None
    membership_status: Optional[str] = None
    membership_end_date: Optional[str] = None


class CardData(BaseModel):
    card: dict[str, Any]


class CardListData(BaseModel):
    items: list[dict[str, Any]]


PlanListResponse = ApiSuccessResponse[PlanListData]
PlanUpdateResponse = ApiSuccessResponse[PlanUpdateData]
PurchasePlanResponse = ApiSuccessResponse[PurchasePlanData]
MembershipResponse = ApiSuccessResponse[MembershipData]
OrderHistoryResponse = ApiSuccessResponse[OrderHistoryData]
StudentCommerceResponse = ApiSuccessResponse[StudentCommerceData]
CardResponse = ApiSuccessResponse[CardData]
CardListResponse = ApiSuccessResponse[CardListData]
