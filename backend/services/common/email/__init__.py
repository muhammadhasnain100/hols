"""Email helpers: SES sender + JSON template renderer."""

from services.common.email.renderer import frontend_origin, frontend_url, render_email
from services.common.email.sender import (
    send_bulk_email,
    send_email,
    send_email_async,
)

__all__ = [
    "frontend_origin",
    "frontend_url",
    "render_email",
    "send_bulk_email",
    "send_email",
    "send_email_async",
]
