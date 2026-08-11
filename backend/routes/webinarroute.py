"""Webinar routes — admin CRUD + student catalog/booking/notifications."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.common import success_response
from models.webinars import (
    WebinarBookData,
    WebinarBookRequest,
    WebinarBookResponse,
    WebinarCreateRequest,
    WebinarDetailData,
    WebinarDetailResponse,
    WebinarListData,
    WebinarListResponse,
    WebinarNotificationsData,
    WebinarNotificationsResponse,
    WebinarRegistrantListData,
    WebinarRegistrantListResponse,
    WebinarSummary,
    WebinarUpdateRequest,
)
from services.routes.webinars import service as webinars_service

router = APIRouter(prefix="/webinars", tags=["webinars"])


@router.get("", response_model=WebinarListResponse)
@handle_route_errors("list webinars", log_prefix="Webinars")
async def list_webinars(
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
    ],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> WebinarListResponse:
    if current_user.role == UserRole.ADMIN.value:
        result = await webinars_service.list_webinars_admin(page=page, limit=limit)
    else:
        result = await webinars_service.list_webinars_student(
            user_id=current_user.user_id,
            page=page,
            limit=limit,
        )
    return success_response(WebinarListData(**result))


@router.get("/notifications", response_model=WebinarNotificationsResponse)
@handle_route_errors("list webinar notifications", log_prefix="Webinars")
async def list_webinar_notifications(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> WebinarNotificationsResponse:
    items = await webinars_service.list_notifications(current_user.user_id)
    return success_response(WebinarNotificationsData(items=items))


@router.get("/mine", response_model=WebinarRegistrantListResponse)
@handle_route_errors("list my webinar bookings", log_prefix="Webinars")
async def list_my_webinar_bookings(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> WebinarRegistrantListResponse:
    items = await webinars_service.list_my_registrations(current_user.user_id)
    from models.users import PaginationMeta

    return success_response(
        WebinarRegistrantListData(
            items=items,
            pagination=PaginationMeta(
                page=1,
                limit=len(items) or 1,
                total=len(items),
                total_pages=1,
                has_next=False,
                has_previous=False,
            ),
        )
    )


@router.post("", response_model=WebinarDetailResponse)
@handle_route_errors("create webinar", log_prefix="Webinars")
async def create_webinar(
    body: WebinarCreateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> WebinarDetailResponse:
    webinar = await webinars_service.create_webinar(
        admin_user_id=current_user.user_id,
        title=body.title,
        description=body.description,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        price=body.price,
        currency=body.currency,
        capacity=body.capacity,
        join_url=body.join_url,
        status_value=body.status,
    )
    return success_response(WebinarDetailData(webinar=WebinarSummary(**webinar)))


@router.get("/{webinar_id}", response_model=WebinarDetailResponse)
@handle_route_errors("get webinar", log_prefix="Webinars")
async def get_webinar(
    webinar_id: str,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
    ],
) -> WebinarDetailResponse:
    if current_user.role == UserRole.ADMIN.value:
        webinar = await webinars_service.get_webinar_for_admin(webinar_id)
    else:
        webinar = await webinars_service.get_webinar_for_student(current_user.user_id, webinar_id)
    return success_response(WebinarDetailData(webinar=WebinarSummary(**webinar)))


@router.patch("/{webinar_id}", response_model=WebinarDetailResponse)
@handle_route_errors("update webinar", log_prefix="Webinars")
async def update_webinar(
    webinar_id: str,
    body: WebinarUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
) -> WebinarDetailResponse:
    _ = current_user
    webinar = await webinars_service.update_webinar(
        webinar_id,
        title=body.title,
        description=body.description,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        price=body.price,
        currency=body.currency,
        capacity=body.capacity,
        join_url=body.join_url,
        status=body.status,
    )
    return success_response(WebinarDetailData(webinar=WebinarSummary(**webinar)))


@router.get("/{webinar_id}/registrants", response_model=WebinarRegistrantListResponse)
@handle_route_errors("list webinar registrants", log_prefix="Webinars")
async def list_webinar_registrants(
    webinar_id: str,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> WebinarRegistrantListResponse:
    _ = current_user
    result = await webinars_service.list_registrants(webinar_id, page=page, limit=limit)
    return success_response(WebinarRegistrantListData(**result))


@router.post("/{webinar_id}/book", response_model=WebinarBookResponse)
@handle_route_errors("book webinar", log_prefix="Webinars")
async def book_webinar(
    webinar_id: str,
    body: WebinarBookRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.STUDENT))],
) -> WebinarBookResponse:
    result = await webinars_service.book_webinar(
        user_id=current_user.user_id,
        webinar_id=webinar_id,
        payment_method_id=body.payment_method_id,
    )
    return success_response(
        WebinarBookData(
            registration=result["registration"],
            webinar=WebinarSummary(**result["webinar"]),
        )
    )
