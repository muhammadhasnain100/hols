"""Encrypt/decrypt sensitive payment fields at rest."""

from __future__ import annotations

import base64
import hashlib
import re

from cryptography.fernet import Fernet, InvalidToken

from config import settings


def _fernet() -> Fernet:
    digest = hashlib.sha256(settings.jwt_secret_key.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_value(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Unable to decrypt stored payment value") from exc


def normalize_card_number(card_number: str) -> str:
    digits = re.sub(r"\D", "", card_number)
    if len(digits) < 12 or len(digits) > 19:
        raise ValueError("Card number must be between 12 and 19 digits")
    return digits


def detect_card_brand(card_number: str) -> str:
    if card_number.startswith("4"):
        return "visa"
    if card_number.startswith(("51", "52", "53", "54", "55")):
        return "mastercard"
    if card_number.startswith("3"):
        return "amex"
    return "card"


def mask_card_number(card_last4: str) -> str:
    return f"**** **** **** {card_last4}"
