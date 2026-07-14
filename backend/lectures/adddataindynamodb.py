"""Seed DynamoDB with courses / topics / sections / lessons from courses_complete.json.

JSON shape
----------
[
  {
    "id": "<course_uuid>",
    "course_name": "...",
    "description": "...",
    "topics": [
      {
        "l1_name": "Handling, Storage & Fulfillment",
        "sections": [
          {
            "topic_id": "<section_uuid>",
            "l2_name": "Reconstitution, Storage & Shipping Essentials",
            "item_count": 17,
            "lessons": [
              {
                "id": "<lesson_uuid>",
                "fact": "...",
                "study_bullets": "...",
                "supporting_content": "...",
                "variants": [ { "id", "variant_type", "content" }, ... ]
              }
            ]
          }
        ]
      }
    ]
  }
]

DynamoDB layout (single table)
------------------------------
  COURSE#{course_id} / METADATA                 -> Course
  COURSE#{course_id} / TOPIC#{order}#{key}      -> CourseTopic (L1)
  COURSE#{course_id} / SECTION#{topic_id}       -> CourseSection (L2)
  COURSE#{course_id} / LESSON#{order}#{id}      -> Lesson (lecture)

Usage
-----
  # from backend/
  python lectures/adddataindynamodb.py --dry-run
  python lectures/adddataindynamodb.py --limit 1
  python lectures/adddataindynamodb.py
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import sys
import time
from pathlib import Path
from typing import Any, Iterator

# Allow running as ``python lectures/adddataindynamodb.py`` from backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from database import create_table, get_table  # noqa: E402
from database_entities import (  # noqa: E402
    Course,
    CourseSection,
    CourseTopic,
    Lesson,
    PlanType,
)
from core.logging_config import setup_logging  # noqa: E402
from config import settings  # noqa: E402

logger = logging.getLogger(__name__)

DEFAULT_JSON = Path(__file__).resolve().parent / "courses_complete.json"
DEFAULT_SECTION = "lectures"


def _topic_key(l1_name: str) -> str:
    """Stable short key for L1 topic sort keys."""
    digest = hashlib.sha1(l1_name.encode("utf-8")).hexdigest()[:12]
    return digest


def _lesson_title(fact: str, max_len: int = 180) -> str:
    text = (fact or "").strip()
    if not text:
        return "Untitled lesson"
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def build_items(course: dict[str, Any]) -> list[dict[str, Any]]:
    """Map one JSON course into DynamoDB items (course + topics + sections + lessons)."""
    course_id = course["id"]
    topics = course.get("topics") or []
    items: list[dict[str, Any]] = []

    lesson_order = 0
    section_order = 0
    total_sections = 0
    total_lessons = 0

    for l1_order, topic in enumerate(topics, start=1):
        l1_name = (topic.get("l1_name") or "").strip() or f"Topic {l1_order}"
        sections = topic.get("sections") or []
        topic_lesson_count = sum(len(s.get("lessons") or []) for s in sections)
        topic_key = _topic_key(l1_name)

        items.append(
            CourseTopic(
                course_id=course_id,
                topic_key=topic_key,
                l1_name=l1_name,
                order=l1_order,
                section_count=len(sections),
                lesson_count=topic_lesson_count,
            ).to_item()
        )

        for section in sections:
            section_order += 1
            total_sections += 1
            topic_id = section["topic_id"]
            l2_name = (section.get("l2_name") or "").strip() or f"Section {section_order}"
            lessons = section.get("lessons") or []
            item_count = int(section.get("item_count") or len(lessons))

            items.append(
                CourseSection(
                    course_id=course_id,
                    topic_id=topic_id,
                    l1_name=l1_name,
                    l2_name=l2_name,
                    order=section_order,
                    item_count=item_count,
                    l1_order=l1_order,
                ).to_item()
            )

            for lesson in lessons:
                lesson_order += 1
                total_lessons += 1
                fact = lesson.get("fact") or ""
                supporting = lesson.get("supporting_content")
                items.append(
                    Lesson(
                        course_id=course_id,
                        lesson_id=lesson["id"],
                        title=_lesson_title(fact),
                        order=lesson_order,
                        fact=fact or None,
                        study_bullets=lesson.get("study_bullets"),
                        supporting_content=supporting,
                        variants=lesson.get("variants") or [],
                        topic_id=topic_id,
                        l1_name=l1_name,
                        l2_name=l2_name,
                        l1_order=l1_order,
                        l2_order=section_order,
                        text_content=supporting,
                    ).to_item()
                )

    first_l1 = (topics[0].get("l1_name") if topics else None) or DEFAULT_SECTION
    items.insert(
        0,
        Course(
            course_id=course_id,
            title=course.get("course_name") or "Untitled course",
            section=DEFAULT_SECTION,
            description=course.get("description"),
            required_plan=PlanType.MONTHLY,
            topic_count=len(topics),
            section_count=total_sections,
            lesson_count=total_lessons,
        ).to_item(),
    )
    # Keep section field queryable; first L1 name is also useful metadata.
    items[0]["primary_topic"] = first_l1
    return items


def iter_course_batches(
    courses: list[dict[str, Any]],
    *,
    limit: int | None = None,
) -> Iterator[tuple[dict[str, Any], list[dict[str, Any]]]]:
    selected = courses[:limit] if limit is not None else courses
    for course in selected:
        yield course, build_items(course)


def write_items(table, items: list[dict[str, Any]]) -> int:
    """Batch-write items using the DynamoDB Table batch_writer."""
    written = 0
    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            batch.put_item(Item=item)
            written += 1
    return written


def seed(
    *,
    json_path: Path,
    dry_run: bool = False,
    limit: int | None = None,
    ensure_table: bool = True,
) -> dict[str, int]:
    courses = __import__("json").loads(json_path.read_text(encoding="utf-8"))
    if not isinstance(courses, list):
        raise ValueError("Expected courses_complete.json to be a JSON array")

    stats = {
        "courses": 0,
        "topics": 0,
        "sections": 0,
        "lessons": 0,
        "items": 0,
    }

    if ensure_table and not dry_run:
        create_table()

    table = None if dry_run else get_table()
    started = time.perf_counter()

    for course, items in iter_course_batches(courses, limit=limit):
        course_name = course.get("course_name", course.get("id"))
        course_items = sum(1 for i in items if i.get("entity") == "COURSE")
        topic_items = sum(1 for i in items if i.get("entity") == "COURSE_TOPIC")
        section_items = sum(1 for i in items if i.get("entity") == "COURSE_SECTION")
        lesson_items = sum(1 for i in items if i.get("entity") == "LESSON")

        stats["courses"] += course_items
        stats["topics"] += topic_items
        stats["sections"] += section_items
        stats["lessons"] += lesson_items
        stats["items"] += len(items)

        logger.info(
            "%s course=%s topics=%s sections=%s lessons=%s items=%s",
            "DRY-RUN" if dry_run else "WRITE",
            course_name,
            topic_items,
            section_items,
            lesson_items,
            len(items),
        )

        if dry_run:
            continue

        assert table is not None
        write_items(table, items)

    elapsed = time.perf_counter() - started
    logger.info(
        "Done in %.1fs — courses=%s topics=%s sections=%s lessons=%s total_items=%s dry_run=%s",
        elapsed,
        stats["courses"],
        stats["topics"],
        stats["sections"],
        stats["lessons"],
        stats["items"],
        dry_run,
    )
    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed HOLS lecture entities into DynamoDB")
    parser.add_argument(
        "--json",
        type=Path,
        default=DEFAULT_JSON,
        help=f"Path to courses_complete.json (default: {DEFAULT_JSON})",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only seed the first N courses (useful for testing)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and map items without writing to DynamoDB",
    )
    parser.add_argument(
        "--skip-create-table",
        action="store_true",
        help="Do not call create_table() before writing",
    )
    return parser.parse_args()


def main() -> None:
    setup_logging(level=settings.log_level, log_format=settings.log_format)  # type: ignore[arg-type]
    args = parse_args()
    if not args.json.exists():
        raise SystemExit(f"JSON file not found: {args.json}")

    seed(
        json_path=args.json,
        dry_run=args.dry_run,
        limit=args.limit,
        ensure_table=not args.skip_create_table,
    )


if __name__ == "__main__":
    main()
