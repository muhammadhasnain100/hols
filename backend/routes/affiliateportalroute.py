"""Affiliate self-service routes."""

import asyncio
from typing import Annotated, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.affiliate_portal import (
    AffiliateInviteEmailData,
    AffiliateInviteEmailResponse,
    AffiliateInviteRequest,
    AffiliateInviteResolveData,
    AffiliateInviteResolveResponse,
    AffiliateInviteUrlData,
    AffiliateInviteUrlResponse,
    AffiliateReferralStudentListData,
    AffiliateReferralStudentListResponse,
)
from models.common import success_response
from services.routes.affiliate_portal import service as affiliate_portal_service

router = APIRouter(prefix="/affiliate", tags=["affiliate"])


def _public_origin(request: Request) -> str:
    origin = request.headers.get("origin")
    if origin:
        return origin.rstrip("/")

    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"

    return str(request.base_url).rstrip("/")


@router.get("/invite-url", response_model=AffiliateInviteUrlResponse)
@handle_route_errors("get affiliate invite url", log_prefix="Affiliate")
async def get_invite_url(
    request: Request,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> AffiliateInviteUrlResponse:
    """Affiliate - return public signup URL for this affiliate's invite code."""
    result = await affiliate_portal_service.get_invite_url(
        affiliate_id=current_user.user_id,
        public_origin=_public_origin(request),
    )
    return success_response(AffiliateInviteUrlData(**result))


@router.get("/invite/{invite_code}", response_model=AffiliateInviteResolveResponse)
@handle_route_errors("resolve affiliate invite code", log_prefix="Affiliate")
async def resolve_invite_code(invite_code: str) -> AffiliateInviteResolveResponse:
    """Public - resolve an affiliate invite code for signup referral attribution."""
    result = await affiliate_portal_service.resolve_invite_code(invite_code)
    return success_response(AffiliateInviteResolveData(**result))


@router.post(
    "/invites",
    response_model=AffiliateInviteEmailResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
@handle_route_errors("send affiliate student invites", log_prefix="Affiliate")
async def send_invites(
    request: Request,
    body: AffiliateInviteRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> AffiliateInviteEmailResponse:
    """Affiliate - email the public signup URL to one or many students."""
    recipients = body.normalized_emails()
    invite_url = await affiliate_portal_service.get_invite_url(
        affiliate_id=current_user.user_id,
        public_origin=_public_origin(request),
    )
    if not invite_url.get("invite_code"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Affiliate invite code is not assigned")

    task = affiliate_portal_service.send_student_invites(
        affiliate_id=current_user.user_id,
        recipients=recipients,
        public_origin=_public_origin(request),
        message=body.message,
    )
    asyncio.create_task(task)
    return success_response(
        AffiliateInviteEmailData(
            queued=True,
            public_url=invite_url["public_url"],
            recipients=recipients,
            recipient_count=len(recipients),
        ),
    )


@router.get("/referrals/students", response_model=AffiliateReferralStudentListResponse)
@handle_route_errors("list affiliate referred students", log_prefix="Affiliate")
async def list_referred_students(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> AffiliateReferralStudentListResponse:
    """Affiliate - list only students referred by the authenticated affiliate."""
    result = await affiliate_portal_service.list_referred_students(
        affiliate_id=current_user.user_id,
        page=page,
        limit=limit,
        cursor=cursor,
    )
    return success_response(AffiliateReferralStudentListData(**result))
