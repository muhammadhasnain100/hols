"""Email helpers: SES sender + JSON template renderer."""

from __future__ import annotations

import logging
from typing import Any

from services.common.email.renderer import frontend_origin, frontend_url, render_email
from services.common.email.sender import (
    send_bulk_email,
    send_email,
    send_email_async,
)

logger = logging.getLogger(__name__)

__all__ = [
    "frontend_origin",
    "frontend_url",
    "render_email",
    "send_bulk_email",
    "send_email",
    "send_email_async",
    "send_template_email",
]


async def send_template_email(action: str, to: str | None, **data: Any) -> bool:
    """Render ``templates.json`` and send. Returns False if skipped or SES fails."""
    if not to:
        return False
    try:
        rendered = render_email(action, **data)
        await send_email_async(
            to=to,
            subject=rendered["subject"],
            html_body=rendered["html_body"],
        )
        return True
    except Exception:
        logger.exception("Failed to send %s email to %s", action, to)
        return False
