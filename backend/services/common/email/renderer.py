"""Fill the HTML layout from templates.json."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin

from config import settings

_DIR = Path(__file__).resolve().parent
_TEMPLATES = json.loads((_DIR / "templates.json").read_text(encoding="utf-8"))
_BASE_HTML = (_DIR / "html" / "base.html").read_text(encoding="utf-8")
_PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


def frontend_origin() -> str:
    """Return the configured frontend base URL (no trailing slash)."""
    return (settings.frontend_url or "http://localhost:3000").rstrip("/")


def frontend_url(path: str = "/") -> str:
    """Join a path onto the configured frontend origin."""
    origin = frontend_origin()
    if not path:
        return origin
    return urljoin(f"{origin}/", path.lstrip("/"))


def _fill(text: str, values: dict) -> str:
    return _PLACEHOLDER.sub(lambda m: str(values.get(m.group(1), "")), text)


def render_email(action: str, **data) -> dict:
    """Return ``{subject, html_body}`` for an action in templates.json.

    Callers should pass dynamic fields (names, OTP codes, invite URLs, etc.).
    Missing ``cta_url`` / ``unsubscribe_url`` / ``preheader`` / ``recipient_name``
    are filled from the template ``cta_path`` and ``FRONTEND_URL``.
    """
    if action not in _TEMPLATES:
        raise KeyError(f"Unknown email action: {action}")

    template = dict(_TEMPLATES[action])
    cta_path = str(data.pop("cta_path", None) or template.pop("cta_path", "/login"))

    # Build URL defaults before escaping so hrefs stay valid.
    defaults = {
        "recipient_name": "there",
        "preheader": template.get("subject", ""),
        "cta_url": frontend_url(cta_path),
        "unsubscribe_url": frontend_url("/legal/privacy"),
        "frontend_url": frontend_origin(),
    }
    # Explicit caller values win (e.g. invite public_url).
    merged = {**defaults, **{k: v for k, v in data.items() if v is not None}}

    safe = {k: html.escape(str(v), quote=True) for k, v in merged.items()}
    values = {**template, **safe}
    values = {k: _fill(str(v), values) for k, v in values.items()}

    # Ensure CTA still resolves if a template left it blank after fill.
    if not values.get("cta_url"):
        values["cta_url"] = html.escape(frontend_url(cta_path), quote=True)

    return {
        "subject": values["subject"],
        "html_body": _fill(_BASE_HTML, values),
    }
