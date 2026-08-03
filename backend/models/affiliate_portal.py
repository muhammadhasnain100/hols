"""API schemas for affiliate self-service routes."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator

from models.common import ApiSuccessResponse
from models.users import PaginationMeta, StudentSummary


class AffiliateInviteUrlData(BaseModel):
    affiliate_id: str
    invite_code: Optional[str] = None
    signup_path: str
    public_url: str
    student_count: int = 0
    invitation_quota: Optional[int] = None


class AffiliateInviteResolveData(BaseModel):
    affiliate_id: str
    invite_code: str
    first_name: str
    last_name: str
    student_count: int = 0
    invitation_quota: Optional[int] = None


class AffiliateInviteRequest(BaseModel):
    email: Optional[EmailStr] = None
    emails: Optional[list[EmailStr]] = Field(default=None, min_length=1, max_length=50)
    message: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def require_email_or_emails(self) -> "AffiliateInviteRequest":
        if self.email is None and not self.emails:
            raise ValueError("Provide email or emails")
        return self

    def normalized_emails(self) -> list[str]:
        values: list[str] = []
        if self.email is not None:
            values.append(str(self.email).lower())
        if self.emails:
            values.extend(str(email).lower() for email in self.emails)
        return list(dict.fromkeys(values))


class AffiliateInviteEmailData(BaseModel):
    queued: bool = True
    public_url: str
    recipients: list[str]
    recipient_count: int


class AffiliateReferralStudentListData(BaseModel):
    items: list[StudentSummary]
    pagination: PaginationMeta


class AffiliateCommissionItem(BaseModel):
    order_id: str
    plan_type: Optional[str] = None
    amount: float = 0
    commission: float = 0
    currency: str = "USD"
    status: str
    created_at: Optional[str] = None


class AffiliateEarningsData(BaseModel):
    """Aggregated commission earnings for the authenticated affiliate."""

    total_earned: float = 0
    pending_payout: float = 0
    paid_out: float = 0
    currency: str = "USD"
    order_count: int = 0
    margin_percent: Optional[float] = None
    # Soft visual target for the earnings meter (next milestone).
    next_milestone: float = 100
    items: list[AffiliateCommissionItem] = Field(default_factory=list)


AffiliateInviteUrlResponse = ApiSuccessResponse[AffiliateInviteUrlData]
AffiliateInviteResolveResponse = ApiSuccessResponse[AffiliateInviteResolveData]
AffiliateInviteEmailResponse = ApiSuccessResponse[AffiliateInviteEmailData]
AffiliateReferralStudentListResponse = ApiSuccessResponse[AffiliateReferralStudentListData]
AffiliateEarningsResponse = ApiSuccessResponse[AffiliateEarningsData]
