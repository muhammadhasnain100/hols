"""Standard API response envelope used across the application."""

from __future__ import annotations

from typing import Any, Generic, Literal, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiSuccessResponse(BaseModel, Generic[T]):
    status: Literal[True] = True
    response: T


class ApiErrorResponse(BaseModel):
    status: Literal[False] = False
    error: str
    error_code: str


class ErrorCodes:
    BAD_REQUEST = "BAD_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


STATUS_TO_ERROR_CODE: dict[int, str] = {
    400: ErrorCodes.BAD_REQUEST,
    401: ErrorCodes.UNAUTHORIZED,
    403: ErrorCodes.FORBIDDEN,
    404: ErrorCodes.NOT_FOUND,
    409: ErrorCodes.CONFLICT,
    422: ErrorCodes.VALIDATION_ERROR,
    500: ErrorCodes.INTERNAL_ERROR,
}


def success_response(data: Any) -> dict[str, Any]:
    """Build a standard success envelope."""
    if isinstance(data, BaseModel):
        payload = data.model_dump()
    else:
        payload = data
    return {"status": True, "response": payload}


def error_response(
    error: str,
    error_code: str,
    status_code: int = 400,
) -> dict[str, Any]:
    """Build a standard error envelope."""
    return {
        "status": False,
        "error": error,
        "error_code": error_code or STATUS_TO_ERROR_CODE.get(status_code, ErrorCodes.BAD_REQUEST),
    }


def parse_http_exception_detail(detail: Any, status_code: int) -> tuple[str, str]:
    """Normalise FastAPI HTTPException detail into error message + code."""
    if isinstance(detail, dict):
        error = str(detail.get("error") or detail.get("message") or "Request failed")
        error_code = str(
            detail.get("error_code")
            or STATUS_TO_ERROR_CODE.get(status_code, ErrorCodes.BAD_REQUEST)
        )
        return error, error_code

    if isinstance(detail, list):
        messages = []
        for item in detail:
            if isinstance(item, dict):
                loc = ".".join(str(part) for part in item.get("loc", []))
                messages.append(f"{loc}: {item.get('msg', 'Invalid value')}")
            else:
                messages.append(str(item))
        return "; ".join(messages) or "Validation failed", ErrorCodes.VALIDATION_ERROR

    message = str(detail) if detail else "Request failed"
    return message, STATUS_TO_ERROR_CODE.get(status_code, ErrorCodes.BAD_REQUEST)
