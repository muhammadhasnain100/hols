"""Middleware — request logging and API response envelope."""

from __future__ import annotations

import json
import logging
import time
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status, and duration for every request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s -> %s (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


class ApiResponseMiddleware(BaseHTTPMiddleware):
    """Wrap ``/api/*`` success JSON as ``{status: true, response: ...}``."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        if not request.url.path.startswith("/api"):
            return response

        if response.status_code >= 400:
            return response

        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        if not body:
            payload: dict | list | None = {}
        else:
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                return Response(
                    content=body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type,
                )

        if isinstance(payload, dict) and payload.get("status") is True and "response" in payload:
            wrapped = payload
        elif isinstance(payload, dict) and payload.get("status") is False:
            return response
        else:
            wrapped = {"status": True, "response": payload}

        headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower() not in {"content-length", "content-type"}
        }
        return JSONResponse(
            content=wrapped,
            status_code=response.status_code,
            headers=headers,
        )
