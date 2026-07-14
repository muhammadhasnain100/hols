"""User listing routes — affiliates and students."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.common import success_response
from models.users import (
    AffiliateListData,
    AffiliateListResponse,
    StudentListData,
    StudentListResponse,
)
from services.routes.users import service as users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/affiliates", response_model=AffiliateListResponse)
@handle_route_errors("list affiliates", log_prefix="Users")
async def list_affiliates(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> AffiliateListResponse:
    """List affiliates with pagination and total student count per affiliate."""
    _ = current_user
    result = await users_service.list_affiliates(page=page, limit=limit, cursor=cursor)
    return success_response(AffiliateListData(**result))


@router.get("/students", response_model=StudentListResponse)
@handle_route_errors("list students", log_prefix="Users")
async def list_students(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> StudentListResponse:
    """List students with pagination and linked affiliate details when present."""
    _ = current_user
    result = await users_service.list_students(page=page, limit=limit, cursor=cursor)
    return success_response(StudentListData(**result))
