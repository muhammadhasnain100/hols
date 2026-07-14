"""Global exception handlers for the standard API error envelope."""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from models.common import ApiErrorResponse, ErrorCodes, parse_http_exception_detail

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error(
                "HTTP %s on %s %s: %s",
                exc.status_code,
                request.method,
                request.url.path,
                exc.detail,
            )
        error, error_code = parse_http_exception_detail(exc.detail, exc.status_code)
        body = ApiErrorResponse(error=error, error_code=error_code)
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        logger.warning(
            "Validation error on %s %s: %s",
            request.method,
            request.url.path,
            exc.errors(),
        )
        error, error_code = parse_http_exception_detail(exc.errors(), 422)
        body = ApiErrorResponse(error=error, error_code=error_code)
        return JSONResponse(status_code=422, content=body.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "Unhandled error on %s %s",
            request.method,
            request.url.path,
        )
        body = ApiErrorResponse(
            error="Internal server error",
            error_code=ErrorCodes.INTERNAL_ERROR,
        )
        return JSONResponse(status_code=500, content=body.model_dump())
