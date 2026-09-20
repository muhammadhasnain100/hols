"""FastAPI dependencies for authenticated routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.route_handlers import raise_api_error
from database_entities import UserRole
from models.common import ErrorCodes
from services.routes.auth import service as auth_service

security = HTTPBearer()


class CurrentUser:
    def __init__(self, user_id: str, role: str, email: str):
        self.user_id = user_id
        self.role = role
        self.email = email

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN.value

    @property
    def is_student(self) -> bool:
        return self.role == UserRole.STUDENT.value

    @property
    def is_affiliate(self) -> bool:
        return self.role == UserRole.AFFILIATE.value


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CurrentUser:
    payload = auth_service.decode_token(
        credentials.credentials,
        auth_service.TOKEN_TYPE_ACCESS,
    )
    user_id = payload.get("sub")
    role = payload.get("role")
    email = payload.get("email")
    if not user_id or not role or not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid access token")

    return CurrentUser(user_id=user_id, role=role, email=email)


def require_roles(*roles: UserRole):
    """Dependency factory — restrict route to specific roles."""

    allowed = {role.value for role in roles}

    async def _checker(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if current_user.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return current_user

    return _checker


MEMBERSHIP_REQUIRED_ERROR = "An active membership is required to access this feature."
ADVISER_CHAT_MEMBERSHIP_ERROR = (
    "An active membership is required to generate a recommendation and open consultation chat."
)


async def student_has_active_membership(current_user: CurrentUser) -> bool:
    if current_user.is_admin:
        return True

    from services.routes.payment.service import get_membership, has_active_membership

    membership = await get_membership(current_user.user_id)
    return has_active_membership(membership)


async def ensure_active_membership(
    current_user: CurrentUser,
    *,
    error: str = MEMBERSHIP_REQUIRED_ERROR,
) -> CurrentUser:
    """Raise MEMBERSHIP_REQUIRED when a student has no current plan."""
    if await student_has_active_membership(current_user):
        return current_user

    raise_api_error(
        status_code=status.HTTP_403_FORBIDDEN,
        error=error,
        error_code=ErrorCodes.MEMBERSHIP_REQUIRED,
    )


async def require_active_membership(
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
    ],
) -> CurrentUser:
    """Students need a current membership; admins bypass the paywall."""
    return await ensure_active_membership(current_user)


async def require_adviser_chat_membership(
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
    ],
) -> CurrentUser:
    """Paywall for generating recommendations and opening consultation chat."""
    return await ensure_active_membership(
        current_user,
        error=ADVISER_CHAT_MEMBERSHIP_ERROR,
    )
