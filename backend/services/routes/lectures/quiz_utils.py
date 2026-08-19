"""Shared quiz helpers for lecture routes and services."""

from __future__ import annotations

import copy
import re
from typing import Any, Optional

from services.common.pagination import normalize_value

PASS_THRESHOLD = 70.0

_PUNCT_RE = re.compile(r"[^\w\s]", re.UNICODE)
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_answer_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    text = str(value).strip().lower()
    text = _PUNCT_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text


def _singularize_token(token: str) -> str:
    if len(token) <= 3:
        return token
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    if token.endswith("ses") and len(token) > 4:
        return token[:-2]
    if token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def answer_forms(value: Any) -> set[str]:
    """Comparable forms of an answer, including simple plural/singular variants."""
    base = normalize_answer_text(value)
    if not base:
        return set()

    forms = {base}
    tokens = base.split(" ")
    singular_tokens = [_singularize_token(token) for token in tokens]
    singular = " ".join(singular_tokens)
    forms.add(singular)

    # Also accept common pluralization of the last token.
    if tokens:
        last = tokens[-1]
        plural_last = last + "s" if not last.endswith("s") else last
        if last.endswith("y") and len(last) > 1 and last[-2] not in "aeiou":
            plural_last = last[:-1] + "ies"
        forms.add(" ".join([*tokens[:-1], plural_last]).strip())

    return {form for form in forms if form}


def answers_match(user_answer: Any, correct_answer: Any) -> bool:
    user_forms = answer_forms(user_answer)
    correct_forms = answer_forms(correct_answer)
    if not user_forms or not correct_forms:
        return False
    return bool(user_forms & correct_forms)


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
        answers_match(submitted.get(left), right)
        for left, right in expected.items()
    )
    return is_correct, expected


def _resolve_correct_answer(content: dict[str, Any]) -> Any:
    for key in ("answer", "correct_answer", "correctAnswer"):
        if key in content and content.get(key) is not None:
            return content.get(key)
    return None


def _resolve_option_value(option: Any) -> Optional[str]:
    if option is None:
        return None
    if isinstance(option, dict):
        for key in ("value", "id", "label", "text"):
            if option.get(key) is not None:
                return str(option.get(key))
        return None
    return str(option)


def grade_variant(variant: dict[str, Any], user_answer: Any) -> tuple[bool, Any, Optional[str]]:
    content = variant.get("content") or {}
    variant_type = str(variant.get("variant_type") or "")
    question = content.get("question")
    correct_answer = _resolve_correct_answer(content)

    if variant_type == "matching":
        is_correct, correct_answer = grade_matching(content, user_answer)
        return is_correct, correct_answer, question if isinstance(question, str) else None

    # Map option ids / indexes to the same string used as the stored answer.
    options = content.get("options")
    if isinstance(options, list) and options:
        option_values = [_resolve_option_value(option) for option in options]
        option_values = [value for value in option_values if value is not None]

        def expand(value: Any) -> Any:
            if value is None:
                return None
            text = str(value)
            if text.isdigit():
                index = int(text)
                if 0 <= index < len(option_values):
                    return option_values[index]
                if 1 <= index <= len(option_values):
                    return option_values[index - 1]
            for option in option_values:
                if answers_match(text, option):
                    return option
            return value

        user_answer = expand(user_answer)
        correct_answer = expand(correct_answer)

    is_correct = answers_match(user_answer, correct_answer)
    return is_correct, correct_answer, question if isinstance(question, str) else None
