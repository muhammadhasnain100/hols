"""Event-based in-app notifications — list, mark read, live websocket."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi import status as http_status
from fastapi.exceptions import HTTPException

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.common import success_response
from models.notifications import (
    NotificationItem,
    NotificationListData,
    NotificationListResponse,
    NotificationReadAllData,
    NotificationReadAllResponse,
    NotificationReadData,
    NotificationReadResponse,
)
from models.users import PaginationMeta
from services.notification import service as notification_service
from services.routes.auth import service as auth_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _list_payload(result: dict) -> NotificationListData:
    return NotificationListData(
        items=[NotificationItem(**item) for item in result["items"]],
        unread_count=result.get("unread_count") or 0,
        pagination=PaginationMeta(**result["pagination"]),
    )


@router.get("", response_model=NotificationListResponse)
@handle_route_errors("list notifications", log_prefix="Notifications")
async def list_notifications(
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.AFFILIATE, UserRole.ADMIN)),
    ],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    unread: bool = Query(default=False),
) -> NotificationListResponse:
    result = await notification_service.list_notifications(
        current_user.user_id,
        page=page,
        limit=limit,
        unread_only=unread,
    )
    return success_response(_list_payload(result))


@router.post("/read-all", response_model=NotificationReadAllResponse)
@handle_route_errors("mark all notifications read", log_prefix="Notifications")
async def mark_all_notifications_read(
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.AFFILIATE, UserRole.ADMIN)),
    ],
) -> NotificationReadAllResponse:
    result = await notification_service.mark_all_read(current_user.user_id)
    return success_response(NotificationReadAllData(**result))


@router.post("/{notification_id}/read", response_model=NotificationReadResponse)
@handle_route_errors("mark notification read", log_prefix="Notifications")
async def mark_notification_read(
    notification_id: str,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.STUDENT, UserRole.AFFILIATE, UserRole.ADMIN)),
    ],
) -> NotificationReadResponse:
    result = await notification_service.mark_read(current_user.user_id, notification_id)
    return success_response(
        NotificationReadData(
            item=NotificationItem(**result["item"]),
            unread_count=result.get("unread_count") or 0,
        )
    )


@router.websocket("/stream")
async def notification_stream(
    websocket: WebSocket,
    token: str = Query(default=""),
) -> None:
    await websocket.accept()
    user_id = ""
    try:
        payload = auth_service.decode_token(token, auth_service.TOKEN_TYPE_ACCESS)
        role = payload.get("role")
        user_id = str(payload.get("sub") or payload.get("user_id") or "")
        if role not in {
            UserRole.STUDENT.value,
            UserRole.AFFILIATE.value,
            UserRole.ADMIN.value,
        } or not user_id:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close(code=1008)
            return

        await notification_service.hub.connect(user_id, websocket)
        snapshot = await notification_service.list_notifications(user_id, page=1, limit=20)
        await websocket.send_json(
            {
                "type": "hello",
                "unread_count": snapshot.get("unread_count") or 0,
                "items": snapshot.get("items") or [],
            }
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        return
    except HTTPException as exc:
        message = "Unauthorized" if exc.status_code == http_status.HTTP_401_UNAUTHORIZED else "Notification stream failed"
        if isinstance(exc.detail, dict):
            message = str(exc.detail.get("error") or message)
        elif isinstance(exc.detail, str):
            message = exc.detail
        try:
            await websocket.send_json({"type": "error", "message": message})
            await websocket.close(code=1008)
        except Exception:
            return
    finally:
        if user_id:
            notification_service.hub.disconnect(user_id, websocket)
