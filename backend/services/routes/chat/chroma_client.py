"""
chroma_client.py
----------------
Shared Chroma Cloud client factory with Windows-friendly SSL handling.

Set in .env:
  CHROMA_SSL_VERIFY=false     — local dev if you see CERTIFICATE_VERIFY_FAILED
  CHROMA_SSL_VERIFY=true      — use certifi CA bundle (default on Linux/Railway)
  CHROMA_SSL_VERIFY=/path/to/ca.pem
"""

import chromadb
import certifi
from chromadb.config import Settings

from config import settings


def _ssl_verify_setting():
    raw = (settings.chroma_ssl_verify or "true").strip().lower()
    if raw in {"0", "false", "no", "off"}:
        return False
    if raw in {"1", "true", "yes", "on"}:
        return certifi.where()
    # treat as path to a custom CA bundle
    return raw


def get_chroma_client() -> chromadb.CloudClient:
    api_key = settings.chroma_api_key
    tenant = settings.chroma_tenant
    database = settings.chroma_database
    if not (api_key and tenant):
        raise ValueError("CHROMA_API_KEY and CHROMA_TENANT required in .env")

    ssl_verify = _ssl_verify_setting()
    chroma_settings = Settings(chroma_server_ssl_verify=ssl_verify)

    return chromadb.CloudClient(
        api_key=api_key,
        tenant=tenant,
        database=database,
        settings=chroma_settings,
    )
