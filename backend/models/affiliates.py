"""API schemas for admin affiliate management endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from models.common import ApiSuccessResponse
from models.users import AffiliateListData, AffiliateSummary


class AffiliateCreateRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    margin_percent: Optional[float] = Field(default=None, gt=0, lt=100)
    invitation_quota: Optional[int] = Field(default=None, ge=0)


class AffiliateQuotaUpdateRequest(BaseModel):
    invitation_quota: int = Field(ge=0)


class AffiliateCreateData(BaseModel):
    message: str = "Affiliate account created."
    user_id: str
    profile: AffiliateSummary
    credential_email_queued: bool = True


class AffiliateDetailData(BaseModel):
    affiliate: AffiliateSummary


class AffiliateQuotaUpdateData(BaseModel):
    affiliate: AffiliateSummary


AffiliateCreateResponse = ApiSuccessResponse[AffiliateCreateData]
AffiliateDetailResponse = ApiSuccessResponse[AffiliateDetailData]
AffiliateListResponse = ApiSuccessResponse[AffiliateListData]
AffiliateQuotaUpdateResponse = ApiSuccessResponse[AffiliateQuotaUpdateData]
