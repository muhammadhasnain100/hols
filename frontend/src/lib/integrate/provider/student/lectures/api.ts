import { apiRequest } from "@/lib/integrate/client";
import type {
  CourseBundleData,
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
  CourseBundleData,
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

const lectureMemoryCache = new Map<string, unknown>();

function readSessionCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Static lecture cache is an optimization; ignore quota/private-mode failures.
  }
}

async function cachedLectureRequest<T>(key: string, path: string): Promise<T> {
  const memoryValue = lectureMemoryCache.get(key);
  if (memoryValue) return memoryValue as T;

  const sessionValue = readSessionCache<T>(key);
  if (sessionValue) {
    lectureMemoryCache.set(key, sessionValue);
    return sessionValue;
  }

  const value = await apiRequest<T>(path, { auth: true });
  lectureMemoryCache.set(key, value);
  writeSessionCache(key, value);
  return value;
}

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
  const query = toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
    });
  return cachedLectureRequest<CourseListData>(
    `lectures:courses:${query}`,
    `/api/lectures/courses${query}`,
  );
}

export function getCourse(courseId: string) {
  return cachedLectureRequest<CourseDetailData>(
    `lectures:course:${courseId}`,
    `/api/lectures/courses/${courseId}`,
  );
}

export function getCourseBundle(courseId: string) {
  return cachedLectureRequest<CourseBundleData>(
    `lectures:course-bundle:${courseId}`,
    `/api/lectures/courses/${courseId}/bundle`,
  );
}

export function listTopics(courseId: string, params: PaginationParams = {}) {
  const query = toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
    });
  return cachedLectureRequest<TopicListData>(
    `lectures:topics:${courseId}:${query}`,
    `/api/lectures/courses/${courseId}/topics${query}`,
  );
}

export function listSections(courseId: string, params: SectionListParams = {}) {
  const query = toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
      l1_name: params.l1_name,
      l1_order: params.l1_order,
    });
  return cachedLectureRequest<SectionListData>(
    `lectures:sections:${courseId}:${query}`,
    `/api/lectures/courses/${courseId}/sections${query}`,
  );
}

export function listLessons(courseId: string, params: LessonListParams = {}) {
  const query = toQuery({
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
      topic_id: params.topic_id,
      l1_name: params.l1_name,
      l2_name: params.l2_name,
    });
  return cachedLectureRequest<LessonListData>(
    `lectures:lessons:${courseId}:${query}`,
    `/api/lectures/courses/${courseId}/lessons${query}`,
  );
}

export function getLesson(courseId: string, lessonId: string) {
  return cachedLectureRequest<LessonDetailData>(
    `lectures:lesson:${courseId}:${lessonId}`,
    `/api/lectures/courses/${courseId}/lessons/${lessonId}`,
  );
}
