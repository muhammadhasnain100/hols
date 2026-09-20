"""Affiliate self-service routes."""

import asyncio
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.affiliate_portal import (
    AffiliateDashboardData,
    AffiliateDashboardResponse,
    AffiliateEarningsData,
    AffiliateEarningsResponse,
    AffiliateInviteEmailData,
    AffiliateInviteEmailResponse,
    AffiliateInviteRequest,
    AffiliateInviteResolveData,
    AffiliateInviteResolveResponse,
    AffiliateInviteUrlData,
    AffiliateInviteUrlResponse,
    AffiliatePayoutOverviewData,
    AffiliatePayoutOverviewResponse,
    AffiliatePayoutRequest,
    AffiliatePayoutResultData,
    AffiliatePayoutResultResponse,
    AffiliateReferralStudentListData,
    AffiliateReferralStudentListResponse,
)
from models.common import success_response
from models.sales import SalesOverviewData, SalesOverviewResponse
from services.routes.affiliate_portal import service as affiliate_portal_service
from services.routes.payout import service as payout_service
from services.routes.sales import service as sales_service

router = APIRouter(prefix="/affiliate", tags=["affiliate"])


@router.get("/invite-url", response_model=AffiliateInviteUrlResponse)
@handle_route_errors("get affiliate invite url", log_prefix="Affiliate")
async def get_invite_url(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> AffiliateInviteUrlResponse:
    """Affiliate - return public signup URL for this affiliate's invite code."""
    result = await affiliate_portal_service.get_invite_url(affiliate_id=current_user.user_id)
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
    body: AffiliateInviteRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> AffiliateInviteEmailResponse:
    """Affiliate - email the public signup URL to one or many students."""
    recipients = body.normalized_emails()
    invite_url = await affiliate_portal_service.get_invite_url(affiliate_id=current_user.user_id)
    if not invite_url.get("invite_code"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Affiliate invite code is not assigned")

    task = affiliate_portal_service.send_student_invites(
        affiliate_id=current_user.user_id,
        recipients=recipients,
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


@router.get("/earnings", response_model=AffiliateEarningsResponse)
@handle_route_errors("get affiliate earnings", log_prefix="Affiliate")
async def get_earnings(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> AffiliateEarningsResponse:
    """Affiliate - total commission earned from referred student purchases."""
    result = await affiliate_portal_service.get_earnings(affiliate_id=current_user.user_id)
    return success_response(AffiliateEarningsData(**result))


@router.get("/dashboard", response_model=AffiliateDashboardResponse)
@handle_route_errors("get affiliate dashboard", log_prefix="Affiliate")
async def get_affiliate_dashboard(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
    period: str = Query(default="weekly"),
) -> AffiliateDashboardResponse:
    """Affiliate — stored wallet balances plus weekly/monthly/yearly earnings series."""
    result = await payout_service.get_affiliate_dashboard(
        affiliate_id=current_user.user_id,
        period=period.strip().lower(),
    )
    return success_response(AffiliateDashboardData(**result))


@router.get("/payouts", response_model=AffiliatePayoutOverviewResponse)
@handle_route_errors("get affiliate payouts", log_prefix="Affiliate")
async def get_affiliate_payouts(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> AffiliatePayoutOverviewResponse:
    """Affiliate — wallet balances and payout history."""
    result = await payout_service.get_payout_overview(current_user.user_id)
    return success_response(AffiliatePayoutOverviewData(**result))


@router.post("/payouts", response_model=AffiliatePayoutResultResponse)
@handle_route_errors("request affiliate payout", log_prefix="Affiliate")
async def request_affiliate_payout(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
    body: AffiliatePayoutRequest = AffiliatePayoutRequest(),
) -> AffiliatePayoutResultResponse:
    """Affiliate — hold available balance as pending until an admin reviews it."""
    result = await payout_service.request_payout(
        affiliate_id=current_user.user_id,
        amount=body.amount,
    )
    return success_response(AffiliatePayoutResultData(**result))


@router.get("/sales", response_model=SalesOverviewResponse)
@handle_route_errors("get affiliate sales overview", log_prefix="Affiliate")
async def get_affiliate_sales(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.AFFILIATE))],
) -> SalesOverviewResponse:
    """Affiliate — stored weekly, monthly, and yearly earnings from referred sales."""
    overview = await sales_service.get_affiliate_sales_overview(current_user.user_id)
    return success_response(SalesOverviewData(**overview))
