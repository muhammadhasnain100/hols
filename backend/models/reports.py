"""API schemas for admin order reports."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from models.common import ApiSuccessResponse
from models.users import PaginationMeta


class ReportOrderItem(BaseModel):
    order_id: str
    created_at: Optional[str] = None
    status: Optional[str] = None
    plan_type: Optional[str] = None
    amount: float = 0
    currency: str = "USD"
    student_user_id: Optional[str] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    affiliate_id: Optional[str] = None
    affiliate_name: Optional[str] = None
    affiliate_email: Optional[str] = None
    affiliate_commission: Optional[float] = None
    platform_profit: Optional[float] = None
    gateway_transaction_id: Optional[str] = None
    payment_processor: Optional[str] = None
    payment_method_id: Optional[str] = None


class ReportTotals(BaseModel):
    order_count: int = 0
    revenue: float = 0
    commission: float = 0
    profit: float = 0
    currency: str = "USD"


class ReportOrderListData(BaseModel):
    items: list[ReportOrderItem]
    pagination: PaginationMeta
    totals: ReportTotals
    date_from: Optional[str] = None
    date_to: Optional[str] = None


ReportOrderListResponse = ApiSuccessResponse[ReportOrderListData]
