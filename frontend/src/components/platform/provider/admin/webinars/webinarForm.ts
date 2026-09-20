export const WEBINAR_STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
] as const;

export type WebinarStatus = (typeof WEBINAR_STATUS_OPTIONS)[number]["value"];

export function isWebinarStatus(value: string): value is WebinarStatus {
  return WEBINAR_STATUS_OPTIONS.some((option) => option.value === value);
}

export function toLocalInputValue(value?: string | Date | null) {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function normalizeJoinUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidJoinUrl(value: string) {
  try {
    const url = new URL(normalizeJoinUrl(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
