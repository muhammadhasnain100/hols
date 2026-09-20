"""Notification list and websocket payload schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from models.common import ApiSuccessResponse
from models.users import PaginationMeta


class NotificationItem(BaseModel):
    notification_id: str
    action: str
    title: str
    body: str
    href: Optional[str] = None
    read: bool = False
    summary: bool = False
    created_at: Optional[str] = None
    read_at: Optional[str] = None


class NotificationListData(BaseModel):
    items: list[NotificationItem]
    unread_count: int = 0
    pagination: PaginationMeta


class NotificationReadData(BaseModel):
    item: NotificationItem
    unread_count: int = 0


class NotificationReadAllData(BaseModel):
    unread_count: int = 0
    marked: int = 0


NotificationListResponse = ApiSuccessResponse[NotificationListData]
NotificationReadResponse = ApiSuccessResponse[NotificationReadData]
NotificationReadAllResponse = ApiSuccessResponse[NotificationReadAllData]
