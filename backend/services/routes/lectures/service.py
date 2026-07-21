"""Lecture browsing service — courses, topics, sections, lessons for students."""

from __future__ import annotations

import logging
from typing import Any, Optional

from boto3.dynamodb.conditions import Attr, Key
from fastapi import HTTPException, status

from core.async_io import run_sync
from database import get_table
from database_entities import Course, CourseSection, CourseTopic, Lesson
from services.common.pagination import build_pagination, decode_cursor, encode_cursor, normalize_value
from services.routes.lectures.quiz_utils import public_variants

logger = logging.getLogger(__name__)

DEFAULT_CATALOG_SECTION = "lectures"

_courses_cache: dict[str, list[dict[str, Any]]] = {}
_course_bundle_cache: dict[str, dict[str, Any]] = {}
_lesson_key_cache: dict[str, dict[str, str]] = {}
_lesson_detail_cache: dict[str, dict[str, dict[str, Any]]] = {}


def _table():
    return get_table()


async def _query_all(
    *,
    key_condition,
    index_name: Optional[str] = None,
    filter_expression=None,
    projection_expression: Optional[str] = None,
    expression_attribute_names: Optional[dict[str, str]] = None,
    scan_forward: bool = True,
) -> list[dict[str, Any]]:
    """Read a static lecture collection once; callers cache the result."""
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": key_condition,
        "ScanIndexForward": scan_forward,
    }
    if index_name:
        kwargs["IndexName"] = index_name
    if filter_expression is not None:
        kwargs["FilterExpression"] = filter_expression
    if projection_expression:
        kwargs["ProjectionExpression"] = projection_expression
    if expression_attribute_names:
        kwargs["ExpressionAttributeNames"] = expression_attribute_names

    items: list[dict[str, Any]] = []
    while True:
        def _query(kw=dict(kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        items.extend(response.get("Items") or [])
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return items


def _paginate_list(items: list[dict[str, Any]], *, page: int, limit: int) -> dict[str, Any]:
    _validate_page_limit(page, limit)
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    page_items = items[start:end]
    return {
        "items": page_items,
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=end < total,
            next_cursor=None,
        ),
    }


def _validate_page_limit(page: int, limit: int) -> None:
    if page < 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "page must be >= 1")
    if limit < 1 or limit > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "limit must be between 1 and 100")


async def _count_query(*, key_condition, index_name: Optional[str] = None, filter_expression=None) -> int:
    total = 0
    kwargs: dict[str, Any] = {
        "KeyConditionExpression": key_condition,
        "Select": "COUNT",
    }
    if index_name:
        kwargs["IndexName"] = index_name
    if filter_expression is not None:
        kwargs["FilterExpression"] = filter_expression

    while True:
        def _count(kw=dict(kwargs)):
            return _table().query(**kw)

        response = await run_sync(_count)
        total += int(response.get("Count", 0))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return total


async def _paginate_query(
    *,
    key_condition,
    page: int,
    limit: int,
    cursor: Optional[str] = None,
    index_name: Optional[str] = None,
    filter_expression=None,
    scan_forward: bool = True,
) -> tuple[list[dict[str, Any]], bool, Optional[str], int]:
    """Offset + cursor pagination over a DynamoDB query."""
    _validate_page_limit(page, limit)
    total = await _count_query(
        key_condition=key_condition,
        index_name=index_name,
        filter_expression=filter_expression,
    )

    start_index = (page - 1) * limit
    collected: list[dict[str, Any]] = []
    skipped = 0
    has_next = False
    next_cursor: Optional[str] = None

    query_kwargs: dict[str, Any] = {
        "KeyConditionExpression": key_condition,
        "ScanIndexForward": scan_forward,
    }
    if index_name:
        query_kwargs["IndexName"] = index_name
    if filter_expression is not None:
        query_kwargs["FilterExpression"] = filter_expression

    exclusive_start = decode_cursor(cursor)
    if exclusive_start:
        query_kwargs["ExclusiveStartKey"] = exclusive_start

    while len(collected) < limit:
        def _query(kw=dict(query_kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        for item in response.get("Items", []):
            if skipped < start_index:
                skipped += 1
                continue
            collected.append(item)
            if len(collected) == limit:
                break

        last_key = response.get("LastEvaluatedKey")
        if len(collected) >= limit:
            has_next = last_key is not None or (start_index + limit) < total
            next_cursor = encode_cursor(last_key)
            break
        if not last_key:
            break
        query_kwargs["ExclusiveStartKey"] = last_key

    return collected, has_next, next_cursor, total


def _course_summary(item: dict[str, Any]) -> dict[str, Any]:
    return normalize_value(
        {
            "course_id": item.get("course_id"),
            "title": item.get("title"),
            "section": item.get("section"),
            "description": item.get("description"),
            "required_plan": item.get("required_plan"),
            "topic_count": int(item.get("topic_count") or 0),
            "section_count": int(item.get("section_count") or 0),
            "lesson_count": int(item.get("lesson_count") or 0),
            "primary_topic": item.get("primary_topic"),
            "created_at": item.get("created_at"),
        }
    )


def _topic_summary(item: dict[str, Any]) -> dict[str, Any]:
    return normalize_value(
        {
            "course_id": item.get("course_id"),
            "topic_key": item.get("topic_key"),
            "l1_name": item.get("l1_name"),
            "order": int(item.get("order") or 0),
            "section_count": int(item.get("section_count") or 0),
            "lesson_count": int(item.get("lesson_count") or 0),
        }
    )


def _section_summary(item: dict[str, Any]) -> dict[str, Any]:
    return normalize_value(
        {
            "course_id": item.get("course_id"),
            "topic_id": item.get("topic_id"),
            "l1_name": item.get("l1_name"),
            "l2_name": item.get("l2_name"),
            "order": int(item.get("order") or 0),
            "item_count": int(item.get("item_count") or 0),
            "l1_order": int(item.get("l1_order") or 0),
        }
    )


def _lesson_summary(item: dict[str, Any]) -> dict[str, Any]:
    variants = item.get("variants") or []
    return normalize_value(
        {
            "course_id": item.get("course_id"),
            "lesson_id": item.get("lesson_id"),
            "title": item.get("title"),
            "order": int(item.get("order") or 0),
            "fact": item.get("fact"),
            "study_bullets": item.get("study_bullets"),
            "supporting_content": item.get("supporting_content"),
            "topic_id": item.get("topic_id"),
            "l1_name": item.get("l1_name"),
            "l2_name": item.get("l2_name"),
            "l1_order": item.get("l1_order"),
            "l2_order": item.get("l2_order"),
            "variant_count": len(variants) if isinstance(variants, list) else 0,
        }
    )


def _lesson_detail(item: dict[str, Any]) -> dict[str, Any]:
    detail = _lesson_summary(item)
    raw_variants = item.get("variants") or []
    if isinstance(raw_variants, list):
        detail["variants"] = public_variants(raw_variants)
    else:
        detail["variants"] = []
    detail["text_content"] = item.get("text_content")
    detail["raw_data_s3_key"] = item.get("raw_data_s3_key")
    return detail


async def get_course(course_id: str) -> dict[str, Any]:
    cached_bundle = _course_bundle_cache.get(course_id)
    if cached_bundle:
        return cached_bundle["course"]

    cached_courses = _courses_cache.get(DEFAULT_CATALOG_SECTION)
    if cached_courses:
        for course in cached_courses:
            if course.get("course_id") == course_id:
                return course

    def _fetch():
        return _table().get_item(
            Key={"PK": Course.pk(course_id), "SK": Course.sk()},
        ).get("Item")

    item = await run_sync(_fetch)
    if not item or item.get("entity") != Course.ENTITY:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    return _course_summary(item)


async def ensure_course_exists(course_id: str) -> dict[str, Any]:
    return await get_course(course_id)


async def list_courses(
    *,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
    catalog_section: str = DEFAULT_CATALOG_SECTION,
) -> dict[str, Any]:
    _ = cursor  # Static catalog uses page/limit over an in-memory cache.
    courses = _courses_cache.get(catalog_section)
    if courses is None:
        items = await _query_all(
            key_condition=Key("GSI1PK").eq(f"SECTION#{catalog_section}"),
            index_name="GSI1",
            filter_expression=Attr("entity").eq(Course.ENTITY),
            scan_forward=True,
        )
        courses = [_course_summary(item) for item in items]
        _courses_cache[catalog_section] = courses
        logger.info("Primed lecture course cache section=%s count=%s", catalog_section, len(courses))

    result = _paginate_list(courses, page=page, limit=limit)
    logger.info("Listed courses page=%s limit=%s count=%s cached=true", page, limit, len(result["items"]))
    return result


async def get_course_bundle(course_id: str) -> dict[str, Any]:
    cached = _course_bundle_cache.get(course_id)
    if cached:
        return cached

    projection_names = {
        "#section": "section",
        "#order": "order",
    }
    items = await _query_all(
        key_condition=Key("PK").eq(Course.pk(course_id)),
        projection_expression=(
            "PK, SK, entity, course_id, title, #section, description, required_plan, "
            "topic_count, section_count, lesson_count, primary_topic, created_at, "
            "topic_key, l1_name, #order, item_count, l2_name, topic_id, lesson_id, "
            "l1_order, l2_order"
        ),
        expression_attribute_names=projection_names,
        scan_forward=True,
    )
    course_item = next((item for item in items if item.get("entity") == Course.ENTITY), None)
    if not course_item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")

    topics = sorted(
        (_topic_summary(item) for item in items if item.get("entity") == CourseTopic.ENTITY),
        key=lambda item: int(item.get("order") or 0),
    )
    sections = sorted(
        (_section_summary(item) for item in items if item.get("entity") == CourseSection.ENTITY),
        key=lambda item: (int(item.get("l1_order") or 0), int(item.get("order") or 0)),
    )
    lesson_items = [item for item in items if item.get("entity") == Lesson.ENTITY]
    _lesson_key_cache[course_id] = {
        item["lesson_id"]: item["SK"]
        for item in lesson_items
        if item.get("lesson_id") and item.get("SK")
    }
    lessons = sorted(
        (_lesson_detail(item) for item in lesson_items),
        key=lambda item: int(item.get("order") or 0),
    )
    bundle = {
        "course": _course_summary(course_item),
        "topics": topics,
        "sections": sections,
        "lessons": lessons,
    }
    _course_bundle_cache[course_id] = bundle
    logger.info(
        "Primed course bundle cache course_id=%s topics=%s sections=%s lessons=%s",
        course_id,
        len(topics),
        len(sections),
        len(lessons),
    )
    return bundle


async def list_topics(
    course_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    _ = cursor
    bundle = await get_course_bundle(course_id)
    result = _paginate_list(bundle["topics"], page=page, limit=limit)
    return {"course_id": course_id, **result}


async def list_sections(
    course_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
    l1_name: Optional[str] = None,
    l1_order: Optional[int] = None,
) -> dict[str, Any]:
    _ = cursor
    bundle = await get_course_bundle(course_id)
    sections = bundle["sections"]
    if l1_name:
        sections = [item for item in sections if item.get("l1_name") == l1_name]
    if l1_order is not None:
        sections = [item for item in sections if int(item.get("l1_order") or 0) == l1_order]

    result = _paginate_list(sections, page=page, limit=limit)
    return {"course_id": course_id, **result}


async def list_lessons(
    course_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
    topic_id: Optional[str] = None,
    l1_name: Optional[str] = None,
    l2_name: Optional[str] = None,
) -> dict[str, Any]:
    _ = cursor
    bundle = await get_course_bundle(course_id)
    lessons = bundle["lessons"]
    if topic_id:
        lessons = [item for item in lessons if item.get("topic_id") == topic_id]
    if l1_name:
        lessons = [item for item in lessons if item.get("l1_name") == l1_name]
    if l2_name:
        lessons = [item for item in lessons if item.get("l2_name") == l2_name]

    result = _paginate_list([_lesson_summary(item) for item in lessons], page=page, limit=limit)
    return {"course_id": course_id, **result}


async def get_lesson(course_id: str, lesson_id: str) -> dict[str, Any]:
    cached_detail = _lesson_detail_cache.get(course_id, {}).get(lesson_id)
    if cached_detail:
        return cached_detail

    if course_id not in _lesson_key_cache:
        await get_course_bundle(course_id)

    lesson_sk = _lesson_key_cache.get(course_id, {}).get(lesson_id)
    if not lesson_sk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")

    def _fetch():
        return _table().get_item(
            Key={"PK": Lesson.pk(course_id), "SK": lesson_sk},
        ).get("Item")

    item = await run_sync(_fetch)
    if item and item.get("entity") == Lesson.ENTITY:
        detail = _lesson_detail(item)
        _lesson_detail_cache.setdefault(course_id, {})[lesson_id] = detail
        return detail

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
