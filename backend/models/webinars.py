"""API schemas for webinar admin + student booking routes."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from models.common import ApiSuccessResponse
from models.users import PaginationMeta


class WebinarCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    starts_at: str = Field(min_length=1)
    ends_at: Optional[str] = None
    price: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    capacity: int = Field(default=100, ge=1, le=10000)
    join_url: Optional[str] = Field(default=None, max_length=1000)
    status: str = Field(default="draft")


class WebinarUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    capacity: Optional[int] = Field(default=None, ge=1, le=10000)
    join_url: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[str] = None


class WebinarBookRequest(BaseModel):
    payment_method_id: Optional[str] = None


class WebinarSummary(BaseModel):
    webinar_id: str
    title: str
    description: Optional[str] = None
    starts_at: str
    ends_at: Optional[str] = None
    price: float = 0
    currency: str = "USD"
    capacity: int = 100
    seats_taken: int = 0
    seats_remaining: int = 0
    status: str
    join_url: Optional[str] = None
    is_booked: bool = False
    created_at: Optional[str] = None


class WebinarListData(BaseModel):
    items: list[WebinarSummary]
    pagination: PaginationMeta


class WebinarDetailData(BaseModel):
    webinar: WebinarSummary


class WebinarRegistrationSummary(BaseModel):
    webinar_id: str
    user_id: str
    order_id: Optional[str] = None
    amount: float = 0
    currency: str = "USD"
    status: str
    created_at: Optional[str] = None
    webinar_title: Optional[str] = None
    starts_at: Optional[str] = None
    join_url: Optional[str] = None


class WebinarBookData(BaseModel):
    registration: WebinarRegistrationSummary
    webinar: WebinarSummary


class WebinarNotificationItem(BaseModel):
    webinar_id: str
    title: str
    starts_at: str
    price: float = 0
    currency: str = "USD"
    is_booked: bool = False
    body: str


class WebinarNotificationsData(BaseModel):
    items: list[WebinarNotificationItem]


class WebinarRegistrantListData(BaseModel):
    items: list[WebinarRegistrationSummary]
    pagination: PaginationMeta


WebinarListResponse = ApiSuccessResponse[WebinarListData]
WebinarDetailResponse = ApiSuccessResponse[WebinarDetailData]
WebinarBookResponse = ApiSuccessResponse[WebinarBookData]
WebinarNotificationsResponse = ApiSuccessResponse[WebinarNotificationsData]
WebinarRegistrantListResponse = ApiSuccessResponse[WebinarRegistrantListData]
