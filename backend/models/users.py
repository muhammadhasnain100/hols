"""API schemas for user listing endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from models.common import ApiSuccessResponse


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
    next_page: Optional[int] = None
    previous_page: Optional[int] = None
    next_cursor: Optional[str] = None


class AffiliateSummary(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    invite_code: Optional[str] = None
    margin_percent: Optional[float] = None
    invitation_quota: Optional[int] = None
    student_count: int = 0
    total_earned: float = 0
    order_count: int = 0
    earnings_currency: str = "USD"
    created_at: Optional[str] = None


class StudentAffiliateInfo(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    invite_code: Optional[str] = None
    margin_percent: Optional[float] = None
    invitation_quota: Optional[int] = None
    student_count: int = 0
    created_at: Optional[str] = None


class StudentSummary(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    marketing_pref: bool = False
    referred_by_affiliate_id: Optional[str] = None
    affiliate: Optional[StudentAffiliateInfo] = None
    total_spent: float = 0
    order_count: int = 0
    paid_order_count: int = 0
    spend_currency: str = "USD"
    current_plan: Optional[str] = None
    membership_status: Optional[str] = None
    last_purchase_at: Optional[str] = None
    last_purchase_amount: Optional[float] = None
    created_at: Optional[str] = None


class AffiliateListData(BaseModel):
    items: list[AffiliateSummary]
    pagination: PaginationMeta


class StudentListData(BaseModel):
    items: list[StudentSummary]
    pagination: PaginationMeta


# Standard wrapped API responses
AffiliateListResponse = ApiSuccessResponse[AffiliateListData]
StudentListResponse = ApiSuccessResponse[StudentListData]
