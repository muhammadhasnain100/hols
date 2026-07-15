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
const lecturePendingRequests = new Map<string, Promise<unknown>>();

function cacheKey(kind: string, ...parts: Array<string | number | undefined | null>) {
  return ["lectures", kind, ...parts.map((part) => part ?? "")].join(":");
}

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

function readLectureCache<T>(key: string): T | null {
  const memoryValue = lectureMemoryCache.get(key);
  if (memoryValue) return memoryValue as T;

  const sessionValue = readSessionCache<T>(key);
  if (sessionValue) {
    lectureMemoryCache.set(key, sessionValue);
    return sessionValue;
  }

  return null;
}

async function cachedLectureRequest<T>(key: string, path: string): Promise<T> {
  const cachedValue = readLectureCache<T>(key);
  if (cachedValue) return cachedValue;

  const pending = lecturePendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = apiRequest<T>(path, { auth: true })
    .then((value) => {
      lectureMemoryCache.set(key, value);
      writeSessionCache(key, value);
      return value;
    })
    .finally(() => {
      lecturePendingRequests.delete(key);
    });
  lecturePendingRequests.set(key, request);
  return request;
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
    cacheKey("courses", query),
    `/api/lectures/courses${query}`,
  );
}

export function getCourse(courseId: string) {
  return cachedLectureRequest<CourseDetailData>(
    cacheKey("course", courseId),
    `/api/lectures/courses/${courseId}`,
  );
}

export function getCourseBundle(courseId: string) {
  return cachedLectureRequest<CourseBundleData>(
    cacheKey("course-bundle", courseId),
    `/api/lectures/courses/${courseId}/bundle`,
  );
}

export function getCachedCourseBundle(courseId: string) {
  return readLectureCache<CourseBundleData>(cacheKey("course-bundle", courseId));
}

export function listTopics(courseId: string, params: PaginationParams = {}) {
  const query = toQuery({
    page: params.page,
    limit: params.limit,
    cursor: params.cursor,
  });
  return cachedLectureRequest<TopicListData>(
    cacheKey("topics", courseId, query),
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
    cacheKey("sections", courseId, query),
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
    cacheKey("lessons", courseId, query),
    `/api/lectures/courses/${courseId}/lessons${query}`,
  );
}

export function getLesson(courseId: string, lessonId: string) {
  return cachedLectureRequest<LessonDetailData>(
    cacheKey("lesson", courseId, lessonId),
    `/api/lectures/courses/${courseId}/lessons/${lessonId}`,
  );
}

export function getCachedLesson(courseId: string, lessonId: string): LessonDetailData | null {
  const detail = readLectureCache<LessonDetailData>(cacheKey("lesson", courseId, lessonId));
  if (detail) return detail;

  const bundle = getCachedCourseBundle(courseId);
  const bundleLesson = bundle?.lessons.find((lesson) => lesson.lesson_id === lessonId);
  return bundleLesson ? { lesson: bundleLesson } : null;
}
