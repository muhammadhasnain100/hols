import type { IntakeAnswers } from "@/lib/integrate/provider/student/chat";

/** Ages where pregnancy / trying / breastfeeding is clinically N/A. */
export const PREGNANCY_MIN_AGE = 12;
export const PREGNANCY_MAX_AGE = 55;

/** Young children are not offered "Athlete" training level. */
export const CHILD_MAX_AGE = 12;

export function parseIntakeAge(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const age = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(age)) return null;
  return Math.trunc(age);
}

export function normalizeSex(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Pregnancy / trying / breastfeeding only applies to non-male patients
 * in a plausible reproductive age window.
 */
export function isPregnancyApplicable(sex: unknown, age: unknown): boolean {
  if (normalizeSex(sex) === "male") return false;
  const years = parseIntakeAge(age);
  if (years != null && (years < PREGNANCY_MIN_AGE || years >= PREGNANCY_MAX_AGE)) {
    return false;
  }
  // Sex not chosen yet — keep the field visible until we know.
  if (!normalizeSex(sex)) return true;
  return true;
}

export function pregnancyAutoValue(sex: unknown, age: unknown): "N/A" | null {
  return isPregnancyApplicable(sex, age) ? null : "N/A";
}

/**
 * Keep intake answers consistent when sex / age / allergy change.
 * - Male, young child, or older patient → pregnancy forced to N/A
 * - Switching away from Male with a forced N/A → clear pregnancy so Female must answer
 * - Allergy detail cleared when allergy is not Yes
 * - Athlete activity cleared for young children
 */
export function sanitizeIntakeAnswers(
  answers: IntakeAnswers,
  previous?: IntakeAnswers,
): IntakeAnswers {
  const next: IntakeAnswers = { ...answers };
  const prev = previous ?? {};

  const sex = String(next.sex ?? "");
  const prevSex = String(prev.sex ?? "");
  const age = next.age;
  const applicable = isPregnancyApplicable(sex, age);

  if (!applicable) {
    next.pregnancy = "N/A";
  } else if (
    prevSex === "Male" &&
    sex !== "Male" &&
    String(next.pregnancy ?? "") === "N/A"
  ) {
    next.pregnancy = "";
  } else if (
    // Age moved into reproductive window from child/elder with forced N/A
    !isPregnancyApplicable(prev.sex ?? sex, prev.age) &&
    applicable &&
    String(next.pregnancy ?? "") === "N/A" &&
    sex !== "Male"
  ) {
    next.pregnancy = "";
  }

  if (String(next.peptide_allergy ?? "") !== "Yes") {
    if (next.allergy_detail != null && next.allergy_detail !== "") {
      next.allergy_detail = "";
    }
  }

  const years = parseIntakeAge(age);
  if (years != null && years < CHILD_MAX_AGE && String(next.activity ?? "") === "Athlete") {
    next.activity = "";
  }

  return next;
}

/** Snapshot keys that must be filled for stage 2 — pregnancy always present after sanitize. */
export function snapshotRequiredKeys(answers: IntakeAnswers): string[] {
  return ["age", "sex", "pregnancy", "height_cm", "weight_kg", "activity"];
}

export function isSnapshotComplete(answers: IntakeAnswers): boolean {
  const sanitized = sanitizeIntakeAnswers(answers);
  return snapshotRequiredKeys(sanitized).every((key) => {
    const value = sanitized[key];
    return value !== "" && value != null;
  });
}
