"""FastAPI dependencies for authenticated routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database_entities import UserRole
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
