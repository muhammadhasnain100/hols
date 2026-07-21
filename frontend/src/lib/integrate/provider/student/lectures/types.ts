export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_page?: number | null;
  previous_page?: number | null;
  next_cursor?: string | null;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: string;
};

export type CourseSummary = {
  course_id: string;
  title: string;
  section: string;
  description?: string;
  required_plan?: string;
  topic_count: number;
  section_count: number;
  lesson_count: number;
  primary_topic?: string;
  created_at?: string;
};

export type TopicSummary = {
  course_id: string;
  topic_key: string;
  l1_name: string;
  order: number;
  section_count: number;
  lesson_count: number;
};

export type SectionSummary = {
  course_id: string;
  topic_id: string;
  l1_name: string;
  l2_name: string;
  order: number;
  item_count: number;
  l1_order: number;
};

export type LessonSummary = {
  course_id: string;
  lesson_id: string;
  title: string;
  order: number;
  fact?: string;
  study_bullets?: string;
  supporting_content?: string;
  topic_id?: string;
  l1_name?: string;
  l2_name?: string;
  l1_order?: number;
  l2_order?: number;
  variant_count: number;
};

export type LessonVariant = {
  id: string;
  variant_type: string;
  content: Record<string, unknown>;
};

export type LessonDetail = LessonSummary & {
  variants: LessonVariant[];
  text_content?: string;
  raw_data_s3_key?: string;
};

export type CourseListData = {
  items: CourseSummary[];
  pagination: PaginationMeta;
};

export type CourseDetailData = {
  course: CourseSummary;
};

export type CourseBundleData = {
  course: CourseSummary;
  topics: TopicSummary[];
  sections: SectionSummary[];
  lessons: LessonDetail[];
};

export type TopicListData = {
  course_id: string;
  items: TopicSummary[];
  pagination: PaginationMeta;
};

export type SectionListData = {
  course_id: string;
  items: SectionSummary[];
  pagination: PaginationMeta;
};

export type LessonListData = {
  course_id: string;
  items: LessonSummary[];
  pagination: PaginationMeta;
};

export type LessonDetailData = {
  lesson: LessonDetail;
};

export type SectionListParams = PaginationParams & {
  l1_name?: string;
  l1_order?: number;
};

export type LessonListParams = PaginationParams & {
  topic_id?: string;
  l1_name?: string;
  l2_name?: string;
};

export type QuizAnswerSubmission = {
  variant_id: string;
  answer: unknown;
};

export type SubmitLessonQuizRequest = {
  answers: QuizAnswerSubmission[];
};

export type GradedQuizAnswer = {
  variant_id: string;
  variant_type?: string;
  question?: string;
  user_answer?: unknown;
  correct_answer?: unknown;
  is_correct: boolean;
};

export type LessonQuizResult = {
  course_id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  attempt_id: string;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  passed: boolean;
  answers: GradedQuizAnswer[];
  created_at: string;
  updated_at: string;
};

export type LessonQuizResultSummary = {
  course_id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  attempt_id: string;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  passed: boolean;
  updated_at: string;
};

export type CourseTestSummary = {
  lessons_quizzed: number;
  total_lessons: number;
  average_score: number;
  passed_count: number;
};

export type CourseTestResultsData = {
  course_id: string;
  summary: CourseTestSummary;
  items: LessonQuizResultSummary[];
  pagination: PaginationMeta;
};

export type CourseTestResultsParams = PaginationParams;
