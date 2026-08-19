"""Payment routes — plans, purchase, orders, cards."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from core.route_handlers import handle_route_errors
from database_entities import PlanType, UserRole
from dependencies import CurrentUser, get_current_user, require_roles
from models.common import ApiSuccessResponse, success_response
from models.payment import (
    CardCreateRequest,
    CardData,
    CardListData,
    CardListResponse,
    CardResponse,
    CardUpdateRequest,
    MembershipData,
    MembershipResponse,
    OrderHistoryData,
    OrderHistoryResponse,
    PlanListData,
    PlanListResponse,
    PlanUpdateData,
    PlanUpdateRequest,
    PlanUpdateResponse,
    PurchasePlanData,
    PurchasePlanRequest,
    PurchasePlanResponse,
    StudentCommerceData,
    StudentCommerceResponse,
)
from services.routes.payment import service as payment_service

router = APIRouter(prefix="/payment", tags=["payment"])


@router.get("/plans", response_model=PlanListResponse)
@handle_route_errors("list plans", log_prefix="Payment")
async def list_plans(
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
    ],
) -> PlanListResponse:
    """View available membership plans."""
    _ = current_user
    return success_response(PlanListData(items=await payment_service.list_plans()))


@router.put("/plans/{plan_type}", response_model=PlanUpdateResponse)
@handle_route_errors("update plan price", log_prefix="Payment")
async def update_plan_price(
    plan_type: PlanType,
    body: PlanUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> PlanUpdateResponse:
    """Admin — update plan price."""
    plan = await payment_service.update_plan_price(
        plan_type=plan_type,
        price=body.price,
        admin_user_id=current_user.user_id,
    )
    return success_response(PlanUpdateData(plan=plan))


@router.post("/purchase", response_model=PurchasePlanResponse)
@handle_route_errors("purchase plan", log_prefix="Payment")
async def purchase_plan(
    body: PurchasePlanRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> PurchasePlanResponse:
    """Student — purchase a membership plan using the saved card from token."""
    result = await payment_service.purchase_plan(
        user_id=current_user.user_id,
        plan_type=body.plan_type,
        payment_method_id=body.payment_method_id,
    )
    return success_response(PurchasePlanData(**result))


@router.get("/membership/current", response_model=MembershipResponse)
@handle_route_errors("get current membership", log_prefix="Payment")
async def get_current_membership(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> MembershipResponse:
    """Student — view current active plan."""
    membership = await payment_service.get_membership(current_user.user_id)
    return success_response(MembershipData(membership=membership))


@router.get("/orders", response_model=OrderHistoryResponse)
@handle_route_errors("list order history", log_prefix="Payment")
async def list_order_history(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> OrderHistoryResponse:
    """Student — paginated order history."""
    result = await payment_service.list_orders(
        user_id=current_user.user_id,
        page=page,
        limit=limit,
        cursor=cursor,
    )
    return success_response(OrderHistoryData(**result))


@router.get("/orders/{user_id}", response_model=OrderHistoryResponse)
@handle_route_errors("list student orders for admin", log_prefix="Payment")
async def list_student_orders_admin(
    user_id: str,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> OrderHistoryResponse:
    """Admin — paginated order history for any student."""
    _ = current_user
    result = await payment_service.list_orders(
        user_id=user_id,
        page=page,
        limit=limit,
        cursor=cursor,
        include_affiliate=True,
    )
    return success_response(OrderHistoryData(**result))


@router.get("/students/{user_id}/commerce", response_model=StudentCommerceResponse)
@handle_route_errors("get student commerce summary", log_prefix="Payment")
async def get_student_commerce(
    user_id: str,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> StudentCommerceResponse:
    """Admin — spend totals + current membership for one student."""
    _ = current_user
    summary = await payment_service.get_student_commerce_summary(user_id)
    return success_response(StudentCommerceData(**summary))


@router.post("/card", response_model=CardResponse)
@handle_route_errors("add card", log_prefix="Payment")
async def add_card(
    body: CardCreateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> CardResponse:
    """Student — add one payment card (one card per account)."""
    card = await payment_service.add_card(
        user_id=current_user.user_id,
        card_number=body.card_number,
        exp_month=body.exp_month,
        exp_year=body.exp_year,
        cvc=body.cvc,
        pin=body.pin,
        card_holder_name=body.card_holder_name,
        is_default=body.is_default,
        billing_address=body.billing_address,
    )
    return success_response(CardData(card=card))


@router.get("/cards", response_model=CardListResponse)
@handle_route_errors("list cards", log_prefix="Payment")
async def list_cards(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> CardListResponse:
    """Student — list saved cards (max one per account)."""
    return success_response(
        CardListData(items=await payment_service.list_cards(current_user.user_id)),
    )


@router.get("/card", response_model=CardResponse)
@handle_route_errors("get card details", log_prefix="Payment")
async def get_card(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> CardResponse:
    """Student — get saved card details from auth token (masked)."""
    card = await payment_service.get_student_card(current_user.user_id)
    return success_response(CardData(card=card))


@router.put("/card", response_model=CardResponse)
@handle_route_errors("edit card", log_prefix="Payment")
async def edit_card(
    body: CardUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> CardResponse:
    """Student — edit saved card details from auth token."""
    card = await payment_service.edit_student_card(
        user_id=current_user.user_id,
        card_number=body.card_number,
        exp_month=body.exp_month,
        exp_year=body.exp_year,
        cvc=body.cvc,
        pin=body.pin,
        card_holder_name=body.card_holder_name,
        billing_address=body.billing_address,
    )
    return success_response(CardData(card=card))


@router.delete("/card", response_model=ApiSuccessResponse[dict])
@handle_route_errors("remove card", log_prefix="Payment")
async def remove_card(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> ApiSuccessResponse[dict]:
    """Student — remove the saved payment card."""
    await payment_service.delete_student_card(current_user.user_id)
    return success_response({})
