import type { CourseSummary } from "@/lib/integrate/provider/student/lectures";

/**
 * Courses that must stay out of the student catalog.
 * Leave empty so the full Dynamo catalog (81 courses) is listed.
 */
const HIDDEN_COURSE_IDS = new Set<string>([
  // Keep empty unless a course must be force-hidden by id.
]);

export function isHiddenLectureCourse(course: Pick<CourseSummary, "course_id" | "title">) {
  return HIDDEN_COURSE_IDS.has(course.course_id);
}

export function filterVisibleLectureCourses<T extends Pick<CourseSummary, "course_id" | "title">>(
  courses: T[],
) {
  return courses.filter((course) => !isHiddenLectureCourse(course));
}
