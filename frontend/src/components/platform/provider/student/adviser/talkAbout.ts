import type { RecommendationBoard } from "@/lib/integrate/provider/student/chat";

export function rankedFocusNames(board: RecommendationBoard | null | undefined): string[] {
  const rankedNames = (board?.ranked ?? []).map((item) => item.name).filter(Boolean);
  const stored = (board?.focus_peptides ?? []).filter((name) => rankedNames.includes(name));
  if (stored.length > 0) return stored;
  if (board?.preferred && rankedNames.includes(board.preferred)) return [board.preferred];
  return rankedNames[0] ? [rankedNames[0]] : [];
}

export function talkAboutTitle(names: string[]): string {
  if (names.length <= 0) return "Select a peptide";
  if (names.length === 1) return "Talking about 1 peptide";
  return `Talking about ${names.length} peptides`;
}

export function talkAboutHeaderLabel(names: string[]): string | undefined {
  if (names.length <= 0) return undefined;
  if (names.length === 1) return names[0];
  return `${names[0]} + ${names.length - 1} more`;
}

export function samePeptideNames(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((name) => right.includes(name));
}
