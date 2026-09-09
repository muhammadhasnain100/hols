"""Fill the HTML layout from templates.json."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

_DIR = Path(__file__).resolve().parent
_TEMPLATES = json.loads((_DIR / "templates.json").read_text(encoding="utf-8"))
_BASE_HTML = (_DIR / "html" / "base.html").read_text(encoding="utf-8")
_PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


def _fill(text: str, values: dict) -> str:
    return _PLACEHOLDER.sub(lambda m: str(values.get(m.group(1), "")), text)


def render_email(action: str, **data) -> dict:
    """Return ``{subject, html_body}`` for an action in templates.json."""
    if action not in _TEMPLATES:
        raise KeyError(f"Unknown email action: {action}")

    safe = {k: html.escape(str(v), quote=True) for k, v in data.items()}
    values = {**_TEMPLATES[action], **safe}
    values = {k: _fill(str(v), values) for k, v in values.items()}

    return {
        "subject": values["subject"],
        "html_body": _fill(_BASE_HTML, values),
    }
