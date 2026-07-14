"""API schemas for student lecture / course browsing endpoints."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

from models.common import ApiSuccessResponse


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
    next_page: Optional[int] = None
    previous_page: Optional[int] = None
    next_cursor: Optional[str] = None


class CourseSummary(BaseModel):
    course_id: str
    title: str
    section: str
    description: Optional[str] = None
    required_plan: Optional[str] = None
    topic_count: int = 0
    section_count: int = 0
    lesson_count: int = 0
    primary_topic: Optional[str] = None
    created_at: Optional[str] = None


class TopicSummary(BaseModel):
    course_id: str
    topic_key: str
    l1_name: str
    order: int
    section_count: int = 0
    lesson_count: int = 0


class SectionSummary(BaseModel):
    course_id: str
    topic_id: str
    l1_name: str
    l2_name: str
    order: int
    item_count: int = 0
    l1_order: int = 0


class LessonSummary(BaseModel):
    """List-card lesson — excludes heavy variant payloads."""

    course_id: str
    lesson_id: str
    title: str
    order: int
    fact: Optional[str] = None
    study_bullets: Optional[str] = None
    supporting_content: Optional[str] = None
    topic_id: Optional[str] = None
    l1_name: Optional[str] = None
    l2_name: Optional[str] = None
    l1_order: Optional[int] = None
    l2_order: Optional[int] = None
    variant_count: int = 0


class LessonDetail(LessonSummary):
    """Full lesson including quiz variants."""

    variants: list[dict[str, Any]] = Field(default_factory=list)
    text_content: Optional[str] = None
    raw_data_s3_key: Optional[str] = None


class CourseListData(BaseModel):
    items: list[CourseSummary]
    pagination: PaginationMeta


class CourseDetailData(BaseModel):
    course: CourseSummary


class TopicListData(BaseModel):
    course_id: str
    items: list[TopicSummary]
    pagination: PaginationMeta


class SectionListData(BaseModel):
    course_id: str
    items: list[SectionSummary]
    pagination: PaginationMeta


class LessonListData(BaseModel):
    course_id: str
    items: list[LessonSummary]
    pagination: PaginationMeta


class LessonDetailData(BaseModel):
    lesson: LessonDetail


CourseListResponse = ApiSuccessResponse[CourseListData]
CourseDetailResponse = ApiSuccessResponse[CourseDetailData]
TopicListResponse = ApiSuccessResponse[TopicListData]
SectionListResponse = ApiSuccessResponse[SectionListData]
LessonListResponse = ApiSuccessResponse[LessonListData]
LessonDetailResponse = ApiSuccessResponse[LessonDetailData]
