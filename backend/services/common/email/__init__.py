"""Email helpers: SES sender + JSON template renderer."""

from services.common.email.renderer import render_email
from services.common.email.sender import (
    send_bulk_email,
    send_email,
    send_email_async,
)

__all__ = [
    "render_email",
    "send_bulk_email",
    "send_email",
    "send_email_async",
]
