"""Admin order report routes — list and websocket export."""

import asyncio
import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi import status as http_status
from fastapi.exceptions import HTTPException

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.common import success_response
from models.reports import ReportOrderListData, ReportOrderListResponse
from services.routes.auth import service as auth_service
from services.routes.reports import service as report_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


@router.get("/orders", response_model=ReportOrderListResponse)
@handle_route_errors("list report orders", log_prefix="Reports")
async def list_report_orders(
    current_user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> ReportOrderListResponse:
    """Admin — paginated order report with student and affiliate detail."""
    _ = current_user
    result = await report_service.list_report_orders(
        scope="all",
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )
    return success_response(ReportOrderListData(**result))


@router.websocket("/export")
async def export_report_orders(
    websocket: WebSocket,
    token: str = Query(default=""),
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
) -> None:
    """Stream report rows in batches so the admin download can show progress."""
    await websocket.accept()
    try:
        payload = auth_service.decode_token(token, auth_service.TOKEN_TYPE_ACCESS)
        role = payload.get("role")
        if role != UserRole.ADMIN.value:
            await websocket.send_json({"type": "error", "message": "Insufficient permissions"})
            await websocket.close(code=1008)
            return

        async for event in report_service.iter_export_batches(
            scope="all",
            date_from=date_from,
            date_to=date_to,
        ):
            await websocket.send_json(event)
            if event.get("type") == "batch":
                await asyncio.sleep(0.05)
        await websocket.close()
    except WebSocketDisconnect:
        logger.info("Report export websocket disconnected")
    except HTTPException as exc:
        if isinstance(exc.detail, dict):
            message = str(exc.detail.get("error") or "Export failed")
        elif isinstance(exc.detail, str):
            message = exc.detail
        else:
            message = "Unauthorized" if exc.status_code == http_status.HTTP_401_UNAUTHORIZED else "Export failed"
        try:
            await websocket.send_json({"type": "error", "message": message})
            await websocket.close(code=1008)
        except Exception:
            logger.debug("Could not send report export error", exc_info=True)
    except Exception:
        logger.exception("Report export websocket failed")
        try:
            await websocket.send_json({"type": "error", "message": "Failed to export report"})
            await websocket.close(code=1011)
        except Exception:
            logger.debug("Could not close failed report export", exc_info=True)
