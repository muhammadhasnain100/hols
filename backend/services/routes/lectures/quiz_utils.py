"""Shared quiz helpers for lecture routes and services."""

from __future__ import annotations

import copy
from typing import Any, Optional

from services.common.pagination import normalize_value

PASS_THRESHOLD = 70.0


def normalize_answer_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value).strip().lower()


def public_variant(variant: dict[str, Any]) -> dict[str, Any]:
    """Return a quiz variant safe for clients — answers are removed."""
    content = copy.deepcopy(variant.get("content") or {})
    variant_type = str(variant.get("variant_type") or "")

    for key in ("answer", "answers", "correct_answer", "correctAnswer"):
        content.pop(key, None)

    if variant_type == "matching":
        pairs = content.pop("matchingPairs", None) or []
        left_items: list[str] = []
        right_items: list[str] = []
        for pair in pairs:
            if not isinstance(pair, dict):
                continue
            left = pair.get("left")
            right = pair.get("right")
            if left is not None:
                left_items.append(str(left))
            if right is not None:
                right_items.append(str(right))
        content["matchingLeft"] = left_items
        content["matchingOptions"] = sorted(set(right_items))

    return normalize_value(
        {
            "id": variant.get("id"),
            "variant_type": variant_type,
            "content": content,
        }
    )


def public_variants(variants: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [public_variant(variant) for variant in variants if isinstance(variant, dict)]


def grade_matching(content: dict[str, Any], user_answer: Any) -> tuple[bool, Any]:
    pairs = content.get("matchingPairs") or []
    expected = {
        str(pair.get("left")): pair.get("right")
        for pair in pairs
        if isinstance(pair, dict) and pair.get("left") is not None
    }
    submitted = user_answer if isinstance(user_answer, dict) else {}
    if not expected:
        return False, expected

    is_correct = all(
        normalize_answer_text(submitted.get(left)) == normalize_answer_text(right)
        for left, right in expected.items()
    )
    return is_correct, expected


def grade_variant(variant: dict[str, Any], user_answer: Any) -> tuple[bool, Any, Optional[str]]:
    content = variant.get("content") or {}
    variant_type = str(variant.get("variant_type") or "")
    question = content.get("question")
    correct_answer = content.get("answer")

    if variant_type == "matching":
        is_correct, correct_answer = grade_matching(content, user_answer)
        return is_correct, correct_answer, question if isinstance(question, str) else None

    is_correct = normalize_answer_text(user_answer) == normalize_answer_text(correct_answer)
    return is_correct, correct_answer, question if isinstance(question, str) else None
