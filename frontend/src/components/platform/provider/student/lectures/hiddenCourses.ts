import type { CourseSummary } from "@/lib/integrate/provider/student/lectures";

/**
 * Courses that must stay out of the student catalog.
 * Frontier BioMed courses reuse the old AlphaBiomed IDs — those IDs are no
 * longer hidden so the replacement content can surface after Dynamo seed.
 */
const HIDDEN_COURSE_IDS = new Set<string>([
  // Keep empty unless a course must be force-hidden by id.
]);

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isHiddenLectureCourse(course: Pick<CourseSummary, "course_id" | "title">) {
  if (HIDDEN_COURSE_IDS.has(course.course_id)) return true;

  const title = normalizeTitle(course.title);
  if (title.includes("peptide dosing guide")) return true;
  // Legacy AlphaBiomed titles only — Frontier BioMed titles must remain visible.
  if (title.includes("alpha biomed") && title.includes("sales training")) return true;
  if (
    title.includes("alpha biomed") &&
    (title.includes("do's") || title.includes("dont") || title.includes("don't"))
  ) {
    return true;
  }
  if (title.includes("alpha biomed") && title.includes("faq")) return true;

  return false;
}

export function filterVisibleLectureCourses<T extends Pick<CourseSummary, "course_id" | "title">>(
  courses: T[],
) {
  return courses.filter((course) => !isHiddenLectureCourse(course));
}
