"""Admin affiliate management routes."""

import asyncio
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.affiliates import (
    AffiliateCreateData,
    AffiliateCreateRequest,
    AffiliateCreateResponse,
    AffiliateDetailData,
    AffiliateDetailResponse,
    AffiliateListResponse,
    AffiliateQuotaUpdateData,
    AffiliateQuotaUpdateRequest,
    AffiliateQuotaUpdateResponse,
)
from models.common import success_response
from models.users import AffiliateListData
from services.routes.affiliates import service as affiliates_service

router = APIRouter(prefix="/admin/affiliates", tags=["admin-affiliates"])


@router.post(
    "",
    response_model=AffiliateCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
@handle_route_errors("create affiliate account", log_prefix="Affiliates")
async def create_affiliate(
    body: AffiliateCreateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> AffiliateCreateResponse:
    """Admin - create an affiliate account and email login credentials."""
    _ = current_user
    result = await affiliates_service.create_affiliate(
        email=str(body.email),
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
        margin_percent=body.margin_percent,
        invitation_quota=body.invitation_quota,
    )
    email_payload = result.pop("_credential_email")
    asyncio.create_task(
        affiliates_service.send_affiliate_credentials_email(
            email_payload["user"],
            email_payload["password"],
        ),
    )
    profile = result["profile"]
    return success_response(
        AffiliateCreateData(
            user_id=profile["user_id"],
            profile=profile,
            credential_email_queued=True,
        ),
    )


@router.get("", response_model=AffiliateListResponse)
@handle_route_errors("list affiliates", log_prefix="Affiliates")
async def list_affiliates(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> AffiliateListResponse:
    """Admin - list affiliates with total affiliated students."""
    _ = current_user
    result = await affiliates_service.list_affiliates(page=page, limit=limit, cursor=cursor)
    return success_response(AffiliateListData(**result))


@router.get("/{affiliate_id}", response_model=AffiliateDetailResponse)
@handle_route_errors("get affiliate", log_prefix="Affiliates")
async def get_affiliate(
    affiliate_id: str,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> AffiliateDetailResponse:
    """Admin - view one affiliate and their total affiliated students."""
    _ = current_user
    affiliate = await affiliates_service.get_affiliate(affiliate_id)
    return success_response(AffiliateDetailData(affiliate=affiliate))


@router.patch(
    "/{affiliate_id}/invitation-quota",
    response_model=AffiliateQuotaUpdateResponse,
)
@handle_route_errors("update affiliate invitation quota", log_prefix="Affiliates")
async def update_affiliate_invitation_quota(
    affiliate_id: str,
    body: AffiliateQuotaUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> AffiliateQuotaUpdateResponse:
    """Admin - change how many student invitations an affiliate can use."""
    _ = current_user
    affiliate = await affiliates_service.update_invitation_quota(
        affiliate_id,
        body.invitation_quota,
    )
    return success_response(AffiliateQuotaUpdateData(affiliate=affiliate))
