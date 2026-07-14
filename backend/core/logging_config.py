"""Central logging configuration for the HOLS API."""

from __future__ import annotations

import logging
import sys
from typing import Literal

LogFormat = Literal["plain", "json"]


def setup_logging(*, level: str = "INFO", log_format: LogFormat = "plain") -> None:
    """Configure root logging once at application startup."""
    root = logging.getLogger()
    if root.handlers:
        return

    numeric_level = getattr(logging, level.upper(), logging.INFO)
    root.setLevel(numeric_level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(numeric_level)

    if log_format == "json":
        formatter = logging.Formatter(
            '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}'
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    handler.setFormatter(formatter)
    root.addHandler(handler)

    logging.getLogger("uvicorn.access").setLevel(numeric_level)
    logging.getLogger("botocore").setLevel(logging.WARNING)
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
