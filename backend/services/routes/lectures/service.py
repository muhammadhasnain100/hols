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

logger = logging.getLogger(__name__)

DEFAULT_CATALOG_SECTION = "lectures"


def _table():
    return get_table()


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
    detail["variants"] = normalize_value(item.get("variants") or [])
    detail["text_content"] = item.get("text_content")
    detail["raw_data_s3_key"] = item.get("raw_data_s3_key")
    return detail


async def get_course(course_id: str) -> dict[str, Any]:
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
    items, has_next, next_cursor, total = await _paginate_query(
        key_condition=Key("GSI1PK").eq(f"SECTION#{catalog_section}"),
        page=page,
        limit=limit,
        cursor=cursor,
        index_name="GSI1",
        filter_expression=Attr("entity").eq(Course.ENTITY),
        scan_forward=True,
    )
    logger.info("Listed courses page=%s limit=%s count=%s", page, limit, len(items))
    return {
        "items": [_course_summary(item) for item in items],
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


async def list_topics(
    course_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    await ensure_course_exists(course_id)
    items, has_next, next_cursor, total = await _paginate_query(
        key_condition=Key("PK").eq(CourseTopic.pk(course_id)) & Key("SK").begins_with("TOPIC#"),
        page=page,
        limit=limit,
        cursor=cursor,
        filter_expression=Attr("entity").eq(CourseTopic.ENTITY),
        scan_forward=True,
    )
    return {
        "course_id": course_id,
        "items": [_topic_summary(item) for item in items],
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


async def list_sections(
    course_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    cursor: Optional[str] = None,
    l1_name: Optional[str] = None,
    l1_order: Optional[int] = None,
) -> dict[str, Any]:
    await ensure_course_exists(course_id)

    filters = [Attr("entity").eq(CourseSection.ENTITY)]
    if l1_name:
        filters.append(Attr("l1_name").eq(l1_name))
    if l1_order is not None:
        filters.append(Attr("l1_order").eq(l1_order))
    filter_expression = filters[0]
    for extra in filters[1:]:
        filter_expression = filter_expression & extra

    items, has_next, next_cursor, total = await _paginate_query(
        key_condition=Key("PK").eq(CourseSection.pk(course_id)) & Key("SK").begins_with("SECTION#"),
        page=page,
        limit=limit,
        cursor=cursor,
        filter_expression=filter_expression,
        scan_forward=True,
    )
    # Sort by order within page for stable UX if FilterExpression scrambled order slightly
    items_sorted = sorted(items, key=lambda i: int(i.get("order") or 0))
    return {
        "course_id": course_id,
        "items": [_section_summary(item) for item in items_sorted],
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


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
    await ensure_course_exists(course_id)

    filters = [Attr("entity").eq(Lesson.ENTITY)]
    if topic_id:
        filters.append(Attr("topic_id").eq(topic_id))
    if l1_name:
        filters.append(Attr("l1_name").eq(l1_name))
    if l2_name:
        filters.append(Attr("l2_name").eq(l2_name))
    filter_expression = filters[0]
    for extra in filters[1:]:
        filter_expression = filter_expression & extra

    items, has_next, next_cursor, total = await _paginate_query(
        key_condition=Key("PK").eq(Lesson.pk(course_id)) & Key("SK").begins_with("LESSON#"),
        page=page,
        limit=limit,
        cursor=cursor,
        filter_expression=filter_expression,
        scan_forward=True,
    )
    return {
        "course_id": course_id,
        "items": [_lesson_summary(item) for item in items],
        "pagination": build_pagination(
            page=page,
            limit=limit,
            total=total,
            has_next=has_next,
            next_cursor=next_cursor,
        ),
    }


async def get_lesson(course_id: str, lesson_id: str) -> dict[str, Any]:
    await ensure_course_exists(course_id)

    kwargs: dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(Lesson.pk(course_id))
        & Key("SK").begins_with("LESSON#"),
        "FilterExpression": Attr("entity").eq(Lesson.ENTITY) & Attr("lesson_id").eq(lesson_id),
    }

    while True:
        def _query(kw=dict(kwargs)):
            return _table().query(**kw)

        response = await run_sync(_query)
        items = response.get("Items") or []
        if items:
            return _lesson_detail(items[0])
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
