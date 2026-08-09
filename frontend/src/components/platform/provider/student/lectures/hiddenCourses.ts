import type { CourseSummary } from "@/lib/integrate/provider/student/lectures";

const HIDDEN_COURSE_IDS = new Set([
  "18e729a6-7061-48cf-9d51-a04ffa77124a",
  "0eed2662-8a08-443b-8146-357b3f51232e",
]);

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isHiddenLectureCourse(course: Pick<CourseSummary, "course_id" | "title">) {
  if (HIDDEN_COURSE_IDS.has(course.course_id)) return true;

  const title = normalizeTitle(course.title);
  if (title.includes("peptide dosing guide")) return true;
  if (title.includes("alpha biomed") && title.includes("sales training")) return true;
  if (
    title.includes("alpha biomed") &&
    (title.includes("do's") || title.includes("dont") || title.includes("don't"))
  ) {
    return true;
  }

  return false;
}

export function filterVisibleLectureCourses<T extends Pick<CourseSummary, "course_id" | "title">>(
  courses: T[],
) {
  return courses.filter((course) => !isHiddenLectureCourse(course));
}
