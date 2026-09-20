"""API schemas for stored sales, revenue, and profit snapshots."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from models.common import ApiSuccessResponse


class SalesSnapshotData(BaseModel):
    period: str
    period_key: str
    label: str
    starts_at: Optional[str] = None
    sales_count: int = 0
    revenue: float = 0
    profit: float = 0
    affiliate_earnings: float = 0
    earnings: float = 0
    referred_count: int = 0
    referred_revenue: float = 0
    direct_count: int = 0
    direct_revenue: float = 0
    plan_monthly_count: int = 0
    plan_monthly_revenue: float = 0
    plan_biannual_count: int = 0
    plan_biannual_revenue: float = 0
    plan_annual_count: int = 0
    plan_annual_revenue: float = 0
    currency: str = "USD"
    updated_at: Optional[str] = None
    last_order_id: Optional[str] = None


class AdminFinanceData(BaseModel):
    revenue: float = 0
    profit: float = 0
    affiliate_earned: float = 0
    affiliate_paid_out: float = 0
    affiliate_pending: float = 0
    affiliate_available: float = 0
    affiliate_lock: float = 0
    student_count: int = 0
    affiliate_count: int = 0
    order_count: int = 0
    currency: str = "USD"
    updated_at: Optional[str] = None


class SalesOverviewData(BaseModel):
    currency: str = "USD"
    totals: SalesSnapshotData
    weeks: list[SalesSnapshotData]
    months: list[SalesSnapshotData]
    years: list[SalesSnapshotData]
    finance: AdminFinanceData = Field(default_factory=AdminFinanceData)


SalesOverviewResponse = ApiSuccessResponse[SalesOverviewData]
