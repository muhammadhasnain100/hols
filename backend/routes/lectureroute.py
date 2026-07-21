"""Student lecture routes — browse courses, topics, sections, and lessons."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.common import success_response
from models.lectures import (
    CourseBundleData,
    CourseBundleResponse,
    CourseDetailData,
    CourseDetailResponse,
    CourseListData,
    CourseListResponse,
    CourseTestResultsData,
    CourseTestResultsResponse,
    LessonDetailData,
    LessonDetailResponse,
    LessonListData,
    LessonListResponse,
    LessonQuizResult,
    LessonQuizResultResponse,
    SectionListData,
    SectionListResponse,
    SubmitLessonQuizRequest,
    TopicListData,
    TopicListResponse,
)
from services.routes.lectures import service as lectures_service
from services.routes.lectures import quiz_service

router = APIRouter(prefix="/lectures", tags=["lectures"])

StudentUser = Annotated[
    CurrentUser,
    Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
]


@router.get("/courses", response_model=CourseListResponse)
@handle_route_errors("list courses", log_prefix="Lectures")
async def list_courses(
    current_user: StudentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> CourseListResponse:
    """Paginated list of lecture courses available to students."""
    _ = current_user
    result = await lectures_service.list_courses(page=page, limit=limit, cursor=cursor)
    return success_response(CourseListData(**result))


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
@handle_route_errors("get course", log_prefix="Lectures")
async def get_course(
    course_id: str,
    current_user: StudentUser,
) -> CourseDetailResponse:
    """Get a single course by id."""
    _ = current_user
    course = await lectures_service.get_course(course_id)
    return success_response(CourseDetailData(course=course))


@router.get("/courses/{course_id}/bundle", response_model=CourseBundleResponse)
@handle_route_errors("get course bundle", log_prefix="Lectures")
async def get_course_bundle(
    course_id: str,
    current_user: StudentUser,
) -> CourseBundleResponse:
    """Get static course topics, sections, and lessons in one cached payload."""
    _ = current_user
    bundle = await lectures_service.get_course_bundle(course_id)
    return success_response(CourseBundleData(**bundle))


@router.get("/courses/{course_id}/topics", response_model=TopicListResponse)
@handle_route_errors("list course topics", log_prefix="Lectures")
async def list_topics(
    course_id: str,
    current_user: StudentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> TopicListResponse:
    """Paginated L1 topics for a course."""
    _ = current_user
    result = await lectures_service.list_topics(
        course_id,
        page=page,
        limit=limit,
        cursor=cursor,
    )
    return success_response(TopicListData(**result))


@router.get("/courses/{course_id}/sections", response_model=SectionListResponse)
@handle_route_errors("list course sections", log_prefix="Lectures")
async def list_sections(
    course_id: str,
    current_user: StudentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
    l1_name: Optional[str] = Query(default=None, description="Filter by L1 topic name"),
    l1_order: Optional[int] = Query(default=None, ge=1, description="Filter by L1 topic order"),
) -> SectionListResponse:
    """Paginated L2 sections for a course (optionally filtered by topic)."""
    _ = current_user
    result = await lectures_service.list_sections(
        course_id,
        page=page,
        limit=limit,
        cursor=cursor,
        l1_name=l1_name,
        l1_order=l1_order,
    )
    return success_response(SectionListData(**result))


@router.get("/courses/{course_id}/lessons", response_model=LessonListResponse)
@handle_route_errors("list course lessons", log_prefix="Lectures")
async def list_lessons(
    course_id: str,
    current_user: StudentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
    topic_id: Optional[str] = Query(default=None, description="Filter by section topic_id"),
    l1_name: Optional[str] = Query(default=None),
    l2_name: Optional[str] = Query(default=None),
) -> LessonListResponse:
    """Paginated lessons for a course. List omits full variants (includes variant_count)."""
    _ = current_user
    result = await lectures_service.list_lessons(
        course_id,
        page=page,
        limit=limit,
        cursor=cursor,
        topic_id=topic_id,
        l1_name=l1_name,
        l2_name=l2_name,
    )
    return success_response(LessonListData(**result))


@router.get(
    "/courses/{course_id}/lessons/{lesson_id}",
    response_model=LessonDetailResponse,
)
@handle_route_errors("get lesson", log_prefix="Lectures")
async def get_lesson(
    course_id: str,
    lesson_id: str,
    current_user: StudentUser,
) -> LessonDetailResponse:
    """Get one lesson with quiz variants."""
    _ = current_user
    lesson = await lectures_service.get_lesson(course_id, lesson_id)
    return success_response(LessonDetailData(lesson=lesson))


@router.post(
    "/courses/{course_id}/lessons/{lesson_id}/quiz/submit",
    response_model=LessonQuizResultResponse,
)
@handle_route_errors("submit lesson quiz", log_prefix="Lectures")
async def submit_lesson_quiz(
    course_id: str,
    lesson_id: str,
    payload: SubmitLessonQuizRequest,
    current_user: StudentUser,
) -> LessonQuizResultResponse:
    """Submit lesson quiz answers, score them, and store the test result."""
    result = await quiz_service.submit_lesson_quiz(
        user_id=current_user.user_id,
        course_id=course_id,
        lesson_id=lesson_id,
        answers=[answer.model_dump() for answer in payload.answers],
    )
    return success_response(LessonQuizResult(**result))


@router.get(
    "/courses/{course_id}/test-results",
    response_model=CourseTestResultsResponse,
)
@handle_route_errors("list course test results", log_prefix="Lectures")
async def list_course_test_results(
    course_id: str,
    current_user: StudentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
) -> CourseTestResultsResponse:
    """List stored quiz results for the current student in a course."""
    result = await quiz_service.list_course_test_results(
        current_user.user_id,
        course_id,
        page=page,
        limit=limit,
    )
    return success_response(CourseTestResultsData(**result))
