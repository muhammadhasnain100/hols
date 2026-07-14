import { apiRequest } from "@/lib/integrate/client";
import type {
  CourseDetailData,
  CourseListData,
  LessonDetailData,
  LessonListData,
  LessonListParams,
  PaginationParams,
  SectionListData,
  SectionListParams,
  TopicListData,
} from "@/lib/integrate/provider/student/lectures/types";

export type {
  CourseDetailData,
  CourseListData,
  CourseSummary,
  LessonDetail,
  LessonDetailData,
  LessonListData,
  LessonListParams,
  LessonSummary,
  LessonVariant,
  PaginationMeta,
  PaginationParams,
  SectionListData,
  SectionListParams,
  SectionSummary,
  TopicListData,
  TopicSummary,
} from "@/lib/integrate/provider/student/lectures/types";

function toQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listCourses(params: PaginationParams = {}) {
  return apiRequest<CourseListData>(
    `/api/lectures/courses${toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
    })}`,
    { auth: true },
  );
}

export function getCourse(courseId: string) {
  return apiRequest<CourseDetailData>(`/api/lectures/courses/${courseId}`, {
    auth: true,
  });
}

export function listTopics(courseId: string, params: PaginationParams = {}) {
  return apiRequest<TopicListData>(
    `/api/lectures/courses/${courseId}/topics${toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
    })}`,
    { auth: true },
  );
}

export function listSections(courseId: string, params: SectionListParams = {}) {
  return apiRequest<SectionListData>(
    `/api/lectures/courses/${courseId}/sections${toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
      l1_name: params.l1_name,
      l1_order: params.l1_order,
    })}`,
    { auth: true },
  );
}

export function listLessons(courseId: string, params: LessonListParams = {}) {
  return apiRequest<LessonListData>(
    `/api/lectures/courses/${courseId}/lessons${toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
      topic_id: params.topic_id,
      l1_name: params.l1_name,
      l2_name: params.l2_name,
    })}`,
    { auth: true },
  );
}

export function getLesson(courseId: string, lessonId: string) {
  return apiRequest<LessonDetailData>(
    `/api/lectures/courses/${courseId}/lessons/${lessonId}`,
    { auth: true },
  );
}
