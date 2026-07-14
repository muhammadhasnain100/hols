"""Route-level exception helpers for auth and user endpoints."""

from __future__ import annotations

import inspect
import logging
from functools import wraps
from typing import Any, Callable, TypeVar

from fastapi import HTTPException, status

from models.common import ErrorCodes

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def raise_api_error(
    *,
    status_code: int,
    error: str,
    error_code: str | None = None,
) -> None:
    """Raise an HTTPException using the standard error envelope fields."""
    raise HTTPException(
        status_code=status_code,
        detail={
            "error": error,
            "error_code": error_code or ErrorCodes.BAD_REQUEST,
        },
    )


def handle_route_errors(action: str, *, log_prefix: str = "API") -> Callable[[F], F]:
    """Decorator — re-raise HTTPException; wrap unexpected errors consistently."""

    def decorator(func: F) -> F:
        if inspect.iscoroutinefunction(func):

            @wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                try:
                    return await func(*args, **kwargs)
                except HTTPException:
                    raise
                except ValueError as exc:
                    logger.warning("%s validation error during %s: %s", log_prefix, action, exc)
                    raise_api_error(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        error=str(exc) or f"Invalid request while trying to {action}",
                        error_code=ErrorCodes.BAD_REQUEST,
                    )
                except Exception:
                    logger.exception("%s unexpected error during %s", log_prefix, action)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail={
                            "error": f"Failed to {action}",
                            "error_code": ErrorCodes.INTERNAL_ERROR,
                        },
                    )

            async_wrapper.__signature__ = inspect.signature(func)
            async_wrapper.__annotations__ = func.__annotations__
            return async_wrapper  # type: ignore[return-value]

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except HTTPException:
                raise
            except ValueError as exc:
                logger.warning("%s validation error during %s: %s", log_prefix, action, exc)
                raise_api_error(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    error=str(exc) or f"Invalid request while trying to {action}",
                    error_code=ErrorCodes.BAD_REQUEST,
                )
            except Exception:
                logger.exception("%s unexpected error during %s", log_prefix, action)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": f"Failed to {action}",
                        "error_code": ErrorCodes.INTERNAL_ERROR,
                    },
                )

        sync_wrapper.__signature__ = inspect.signature(func)
        sync_wrapper.__annotations__ = func.__annotations__
        return sync_wrapper  # type: ignore[return-value]

    return decorator
