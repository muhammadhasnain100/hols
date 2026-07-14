"""Run blocking I/O (boto3, etc.) without blocking the event loop."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any, TypeVar

T = TypeVar("T")


async def run_sync(func: Callable[..., T], /, *args: Any, **kwargs: Any) -> T:
    """Execute a blocking callable in the default thread pool."""
    return await asyncio.to_thread(func, *args, **kwargs)
