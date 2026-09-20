"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Icon,
  Copy,
  ThumbsDown,
  ThumbsUp,
} from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AdviserBoardDrawer } from "@/components/platform/provider/student/adviser/AdviserBoardDrawer";
import { MarkdownContent } from "@/components/platform/provider/student/adviser/MarkdownContent";
import { PeptideFocusSelect } from "@/components/platform/provider/student/adviser/PeptideFocusSelect";
import {
  rankedFocusNames,
  samePeptideNames,
  talkAboutHeaderLabel,
  talkAboutTitle,
} from "@/components/platform/provider/student/adviser/talkAbout";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { ChatMessagesSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getPatientMessages,
  sendPatientMessage,
  updatePatientBoard,
  type BoardConfidence,
  type ChatMessagesPagination,
  type PatientDetail,
  type RecommendationBoard,
  type RecommendationBoardPeptide,
  type StoredChatMessage,
} from "@/lib/integrate/provider/student/chat";
import { cn } from "@/lib/utils";

type AdviserChatPanelProps = {
  patient: PatientDetail;
  onPatientChange?: (patient: PatientDetail) => void;
  boardOpen?: boolean;
  onBoardOpenChange?: (open: boolean) => void;
  onBoardUpdated?: () => void;
};

type DisplayMessage = StoredChatMessage & {
  pending?: boolean;
};

const TEMP_USER_PREFIX = "temp-user-";
const TEMP_ASSISTANT_PREFIX = "temp-assistant-";
const DEFAULT_CHAT_MAX_TURNS = 50;

function createTempUserMessage(content: string): DisplayMessage {
  return {
    message_id: `${TEMP_USER_PREFIX}${Date.now()}`,
    role: "user",
    content,
    created_at: new Date().toISOString(),
    kind: "message",
    pending: true,
  };
}

function createTypingMessage(): DisplayMessage {
  return {
    message_id: `${TEMP_ASSISTANT_PREFIX}${Date.now()}`,
    role: "assistant",
    content: "Thinking…",
    created_at: new Date().toISOString(),
    kind: "message",
    pending: true,
  };
}

function chipToQuestion(chip: string, board: RecommendationBoard): string {
  const top = board.ranked[0]?.name;
  const second = board.ranked[1]?.name;
  switch (chip) {
    case "Why #1?":
      return top
        ? `In ≤3 short bullets: why is ${top} #1 for this patient?`
        : "In ≤3 short bullets: why is this the top recommendation?";
    case "Compare top 2":
      return top && second
        ? `Compare ${top} vs ${second} in ≤4 short bullets. Which fits better?`
        : "Compare the top two peptides in ≤4 short bullets.";
    case "Safety flags":
      return "List only the key safety flags/cautions for this case as short bullets.";
    case "Labs checklist":
      return "Baseline labs checklist only — short bullets, no prose.";
    case "Draft clinical note":
      return "Draft a 4–6 line clinical note for the record. No fluff.";
    default:
      return `${chip} Reply briefly.`;
  }
}

function peptideActionQuestion(
  peptide: RecommendationBoardPeptide,
  action: "why" | "compare" | "safety",
  board: RecommendationBoard,
  selectedNames: string[],
): string {
  if (action === "why") {
    return `In ≤3 bullets: why is ${peptide.name} ranked #${peptide.rank}?`;
  }
  if (action === "safety") {
    return `Safety/monitoring for ${peptide.name} — short bullets only.`;
  }
  const compareNames =
    selectedNames.length >= 2
      ? selectedNames
      : [
          peptide.name,
          board.ranked.find((item) => item.name !== peptide.name)?.name,
        ].filter(Boolean) as string[];
  return compareNames.length >= 2
    ? `Compare ${compareNames.join(" vs ")} in ≤4 short bullets. Which fits better?`
    : `Clinical fit of ${peptide.name} — ≤3 short bullets.`;
}

export function AdviserChatPanel({
  patient,
  onPatientChange,
  boardOpen = false,
  onBoardOpenChange,
  onBoardUpdated,
}: AdviserChatPanelProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  const [board, setBoard] = useState<RecommendationBoard | null>(
    patient.recommendation_board ?? null,
  );
  const [focusNames, setFocusNames] = useState<string[]>(() =>
    rankedFocusNames(patient.recommendation_board),
  );
  const focusSaveTimerRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pagination, setPagination] = useState<ChatMessagesPagination | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const initializedPatientRef = useRef<string | null>(null);

  useEffect(() => {
    setBoard(patient.recommendation_board ?? null);
    const stored = rankedFocusNames(patient.recommendation_board);
    setFocusNames((current) => {
      if (current.length > 0 && samePeptideNames(current, stored)) return current;
      if (stored.length > 0) return stored;
      return current;
    });
  }, [patient.patient_id, patient.recommendation_board]);

  useEffect(() => {
    return () => {
      if (focusSaveTimerRef.current) window.clearTimeout(focusSaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (initializedPatientRef.current === patient.patient_id) return;

    let cancelled = false;
    initializedPatientRef.current = patient.patient_id;

    const seedMessages = patient.messages ?? [];
    const seedPagination = patient.messages_pagination ?? null;

    async function initializeThread() {
      if (seedMessages.length > 0) {
        setMessages(seedMessages);
        setPagination(seedPagination);
        return;
      }

      setIsLoadingMessages(true);
      try {
        const page = await getPatientMessages(patient.patient_id);
        if (cancelled) return;
        setMessages(page.messages);
        setPagination(page.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiRequestError ? err.message : "Could not load chat messages.",
        );
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    }

    void initializeThread();

    return () => {
      cancelled = true;
    };
  }, [patient.patient_id]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const lastId = last?.message_id ?? null;
    const replyArrived =
      last != null &&
      last.role === "assistant" &&
      !last.pending &&
      last.kind !== "board_update" &&
      lastId !== lastMessageIdRef.current;
    if (isSending || replyArrived) {
      shouldStickToBottomRef.current = true;
    }
    lastMessageIdRef.current = lastId;

    if (!shouldStickToBottomRef.current) return;

    const container = scrollContainerRef.current;
    const inner = container?.firstElementChild;
    if (!container) return;

    const jump = () => {
      if (!shouldStickToBottomRef.current) return;
      container.scrollTop = container.scrollHeight;
    };

    jump();
    const raf = requestAnimationFrame(() => {
      jump();
      requestAnimationFrame(jump);
    });
    const ro = inner ? new ResizeObserver(jump) : null;
    if (inner) ro?.observe(inner);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [messages, isSending, board]);

  const applyPatientUpdate = useCallback(
    (updated: PatientDetail) => {
      setMessages(updated.messages ?? []);
      setPagination(updated.messages_pagination ?? null);
      if (updated.recommendation_board) {
        setBoard(updated.recommendation_board);
      }
      if (updated.messages?.some((message) => message.kind === "board_update")) {
        onBoardUpdated?.();
      }
      onPatientChange?.(updated);
    },
    [onBoardUpdated, onPatientChange],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!pagination?.has_older || !pagination.oldest_message_id || isLoadingOlder) return;

    setIsLoadingOlder(true);
    shouldStickToBottomRef.current = false;
    const container = scrollContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;

    try {
      const page = await getPatientMessages(patient.patient_id, {
        before: pagination.oldest_message_id,
      });
      setMessages((current) => [...page.messages, ...current]);
      setPagination((current) =>
        current
          ? {
              ...current,
              has_older: page.pagination.has_older,
              oldest_message_id: page.pagination.oldest_message_id,
            }
          : page.pagination,
      );

      requestAnimationFrame(() => {
        const nextContainer = scrollContainerRef.current;
        if (!nextContainer) return;
        nextContainer.scrollTop = nextContainer.scrollHeight - previousHeight;
      });
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not load older messages.",
      );
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, pagination, patient.patient_id]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function handleContainerScroll() {
      const el = scrollContainerRef.current;
      if (!el) return;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 96;

      if (el.scrollTop <= 48) {
        void loadOlderMessages();
      }
    }

    container.addEventListener("scroll", handleContainerScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleContainerScroll);
  }, [loadOlderMessages]);

  const sendQuestion = useCallback(
    async (question: string, focusOverride?: string[]) => {
      const trimmed = question.trim();
      const used =
        patient.turns_used ??
        messages.filter((message) => message.role === "user" && (message.kind ?? "message") === "message")
          .length;
      if (!trimmed || isSending || !patient.recommendation || used >= (patient.turns_max ?? DEFAULT_CHAT_MAX_TURNS)) return;

      const optimisticMessage = createTempUserMessage(trimmed);
      const typingMessage = createTypingMessage();
      const focusPeptides = (focusOverride ?? focusNames).filter(Boolean);

      setInput("");
      setError(null);
      setIsSending(true);
      shouldStickToBottomRef.current = true;
      setMessages((current) => [...current, optimisticMessage, typingMessage]);

      if (composerRef.current) {
        composerRef.current.style.height = "auto";
      }

      try {
        const updated = await sendPatientMessage(patient.patient_id, trimmed, {
          focusPeptides,
        });
        applyPatientUpdate(updated);
      } catch (err) {
        setMessages((current) =>
          current.filter(
            (message) =>
              message.message_id !== optimisticMessage.message_id &&
              message.message_id !== typingMessage.message_id,
          ),
        );
        setInput(trimmed);
        setError(err instanceof ApiRequestError ? err.message : "Could not send message.");
      } finally {
        setIsSending(false);
        composerRef.current?.focus();
      }
    },
    [
      applyPatientUpdate,
      focusNames,
      isSending,
      messages,
      patient.patient_id,
      patient.recommendation,
      patient.turns_max,
      patient.turns_used,
    ],
  );

  const sendMessage = useCallback(async () => {
    await sendQuestion(input);
  }, [input, sendQuestion]);

  const handleBoardUpdate = useCallback(
    async (inputUpdate: {
      confidence?: BoardConfidence;
      preferred?: string | null;
      clear_preferred?: boolean;
    }) => {
      if (isUpdatingBoard || isSending || !patient.recommendation) return;
      setIsUpdatingBoard(true);
      setError(null);
      shouldStickToBottomRef.current = true;
      try {
        const updated = await updatePatientBoard(patient.patient_id, inputUpdate);
        applyPatientUpdate(updated);
        onBoardUpdated?.();
      } catch (err) {
        setError(
          err instanceof ApiRequestError ? err.message : "Could not update recommendation board.",
        );
      } finally {
        setIsUpdatingBoard(false);
      }
    },
    [applyPatientUpdate, isSending, isUpdatingBoard, onBoardUpdated, patient.patient_id, patient.recommendation],
  );

  const applyFocusNames = useCallback(
    (names: string[]) => {
      const next = names.filter(Boolean);
      if (next.length === 0) return;
      setFocusNames(next);
      setBoard((current) => (current ? { ...current, focus_peptides: next } : current));
      const nextBoard = board
        ? { ...board, focus_peptides: next }
        : patient.recommendation_board
          ? { ...patient.recommendation_board, focus_peptides: next }
          : null;
      if (nextBoard) {
        onPatientChange?.({
          ...patient,
          recommendation_board: nextBoard,
          messages: undefined as unknown as PatientDetail["messages"],
        });
      }
      if (focusSaveTimerRef.current) window.clearTimeout(focusSaveTimerRef.current);
      focusSaveTimerRef.current = window.setTimeout(() => {
        void updatePatientBoard(patient.patient_id, { focus_peptides: next })
          .then((updated) => {
            if (updated.recommendation_board) {
              setBoard(updated.recommendation_board);
            }
          })
          .catch((err) => {
            setError(
              err instanceof ApiRequestError ? err.message : "Could not save selected peptides.",
            );
          });
      }, 350);
    },
    [board, onPatientChange, patient],
  );

  /** Cap composer to ~3 lines of body text, then scroll. */
  const COMPOSER_MAX_LINES = 3;
  const COMPOSER_LINE_HEIGHT_PX = 24;
  const COMPOSER_VERTICAL_PAD_PX = 20;
  const COMPOSER_MAX_HEIGHT =
    COMPOSER_LINE_HEIGHT_PX * COMPOSER_MAX_LINES + COMPOSER_VERTICAL_PAD_PX;

  const resizeComposer = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.overflowY = "hidden";
    const fullHeight = el.scrollHeight;
    if (fullHeight > COMPOSER_MAX_HEIGHT) {
      el.style.height = `${COMPOSER_MAX_HEIGHT}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${fullHeight}px`;
    }
  };

  const handleComposerInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    resizeComposer(event.target);
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;

    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const el = event.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = `${input.slice(0, start)}\n${input.slice(end)}`;
        setInput(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 1;
          resizeComposer(el);
        });
      }
      return;
    }

    event.preventDefault();
    void sendMessage();
  };

  const copyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      window.setTimeout(() => setCopiedId((current) => (current === messageId ? null : current)), 1600);
    } catch {
      setError("Could not copy message.");
    }
  }, []);

  const busy = isSending || isUpdatingBoard;
  const turnsUsed =
    patient.turns_used ??
    messages.filter((message) => message.role === "user" && (message.kind ?? "message") === "message")
      .length;
  const turnsMax = patient.turns_max ?? DEFAULT_CHAT_MAX_TURNS;
  const turnsLeft = Math.max(0, turnsMax - turnsUsed);
  const atTurnLimit = turnsLeft <= 0;
  const composerLocked = busy || atTurnLimit || !patient.recommendation;
  const talkingPeptide =
    board?.ranked.find((item) => item.name === focusNames[0]) ?? board?.ranked[0] ?? null;
  const currentPeptideName = talkAboutHeaderLabel(focusNames) ?? talkingPeptide?.name;
  const composerPlaceholder = atTurnLimit
    ? "Turn limit reached"
    : focusNames.length === 1
      ? `Ask about ${focusNames[0]}…`
      : focusNames.length > 1
        ? `Ask about ${focusNames.length} peptides…`
        : "Ask about this case…";
  const openBoard = () => onBoardOpenChange?.(true);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="adviser-chat-transcript min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 sm:px-4 md:px-6 lg:px-8"
        data-lenis-prevent
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 py-3 sm:gap-7 sm:py-5">
          {pagination?.has_older ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                disabled={isLoadingOlder}
                className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-brand-caption font-medium text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)] disabled:opacity-60"
              >
                {isLoadingOlder ? (
                  <>
                    <SidebarSvgIcon name="spinner" size={14} strokeWidth={2.2} className="animate-spin" />
                    Loading earlier…
                  </>
                ) : (
                  "Load earlier messages"
                )}
              </button>
            </div>
          ) : null}

          {isLoadingMessages ? <ChatMessagesSkeleton /> : null}

          {!isLoadingMessages && messages.length === 0 ? (
            <div className="adviser-chat-empty dashboard-glass-card flex flex-col items-center justify-center rounded-2xl px-5 py-10 text-center sm:py-12">
              <span className="dashboard-tool-icon flex h-12 w-12 items-center justify-center rounded-full text-[color:var(--dash-text)]" aria-hidden>
                <SidebarSvgIcon name="adviser" size={22} strokeWidth={1.75} />
              </span>
              <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)]">
                Ask about this case
              </p>
              <p className="text-brand-caption mt-1.5 max-w-[20rem] text-[color:var(--dash-muted)]">
                Choose one peptide or several in the composer, then ask a question.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessageRow
              key={message.message_id}
              message={message}
              copied={copiedId === message.message_id}
              peptideName={currentPeptideName}
              onCopy={() => void copyMessage(message.message_id, message.content)}
              onOpenBoard={openBoard}
            />
          ))}

          {error ? (
            <div className="py-2">
              <AuthAlert variant="error">{error}</AuthAlert>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="adviser-chat-composer-bar shrink-0 px-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-4 sm:pt-3 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          {focusNames.length > 0 ? (
            <div className="adviser-focus-bar">
              <div className="adviser-focus-copy">
                <p className="adviser-focus-title">{talkAboutTitle(focusNames)}</p>
                <div className="adviser-focus-chips" aria-label="Selected peptides">
                  {focusNames.map((name) => (
                    <span
                      key={name}
                      className={cn("adviser-focus-chip", focusNames.length === 1 && "is-solo")}
                    >
                      <span className="adviser-focus-chip-name">{name}</span>
                      {focusNames.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Stop talking about ${name}`}
                          disabled={composerLocked}
                          className="adviser-onboarding-close adviser-focus-chip-remove"
                          onClick={() =>
                            applyFocusNames(focusNames.filter((item) => item !== name))
                          }
                        >
                          <SidebarSvgIcon name="cross" size={16} strokeWidth={2.15} />
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-brand-caption shrink-0 pt-0.5 text-[color:var(--dash-faint)]">
                {atTurnLimit ? `${turnsMax}-turn limit reached` : `${turnsUsed} of ${turnsMax} turns`}
              </span>
            </div>
          ) : (
            <p className="text-brand-caption mb-1.5 text-[color:var(--dash-faint)]">
              {atTurnLimit ? `${turnsMax}-turn limit reached` : `${turnsUsed} of ${turnsMax} turns`}
            </p>
          )}
          <form
            className="adviser-chat-composer dashboard-glass-card flex w-full items-end gap-1.5 overflow-visible rounded-2xl px-1.5 py-1.5 sm:items-center sm:gap-2 sm:px-3 sm:py-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!composerLocked) void sendMessage();
            }}
          >
            {board ? (
              <PeptideFocusSelect
                peptides={board.ranked}
                selected={focusNames}
                disabled={composerLocked}
                onChange={applyFocusNames}
              />
            ) : null}

            <div className="adviser-chat-composer-field min-w-0 flex-1">
              <textarea
                ref={composerRef}
                value={input}
                onChange={handleComposerInput}
                onKeyDown={handleComposerKeyDown}
                disabled={composerLocked}
                rows={1}
                placeholder={composerPlaceholder}
                spellCheck={false}
                className="adviser-chat-composer-input text-brand-body min-h-[44px] w-full resize-none border-0 bg-transparent px-1 py-2.5 leading-6 text-[color:var(--dash-text)] shadow-none outline-none ring-0 placeholder:text-[color:var(--dash-faint)] focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 disabled:opacity-60 sm:px-2"
                aria-describedby="adviser-composer-hint"
              />
            </div>
            <span id="adviser-composer-hint" className="sr-only">
              Press Enter to send. Press Ctrl+Enter for a new line. Use the peptide icon to choose one peptide or several.
            </span>
            <button
              type="submit"
              disabled={composerLocked || !input.trim()}
              aria-label="Send message"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full self-end transition sm:self-center",
                input.trim() && !composerLocked
                  ? "dashboard-navy-btn"
                  : "adviser-chat-composer-send-idle",
              )}
            >
              {isSending ? (
                <SidebarSvgIcon name="spinner" size={16} strokeWidth={2.4} className="animate-spin" />
              ) : (
                <SidebarSvgIcon name="send" size={17} />
              )}
            </button>
          </form>
        </div>
      </footer>

      {board && boardOpen ? (
        <AdviserBoardDrawer
          board={board}
          disabled={busy}
          isUpdating={isUpdatingBoard}
          onClose={() => onBoardOpenChange?.(false)}
          onConfidenceChange={(confidence) => void handleBoardUpdate({ confidence })}
          onPrefer={(name) => void handleBoardUpdate({ preferred: name })}
          onClearPreferred={() => void handleBoardUpdate({ clear_preferred: true })}
          onChip={(chip) => void sendQuestion(chipToQuestion(chip, board))}
          onAskAbout={(peptide, action) => {
            const nextFocus = focusNames.includes(peptide.name)
              ? focusNames
              : [...focusNames, peptide.name];
            if (nextFocus !== focusNames) applyFocusNames(nextFocus);
            void sendQuestion(
              peptideActionQuestion(peptide, action, board, nextFocus),
              nextFocus,
            );
          }}
          selectedNames={focusNames}
          onSelectPeptides={applyFocusNames}
        />
      ) : null}
    </div>
  );
}

function ChatMessageRow({
  message,
  copied,
  peptideName,
  onCopy,
  onOpenBoard,
}: {
  message: DisplayMessage;
  copied: boolean;
  peptideName?: string;
  onCopy: () => void;
  onOpenBoard: () => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end pl-4 sm:pl-16">
        <div
          className={cn(
            "adviser-chat-user max-w-[min(100%,20rem)] rounded-2xl px-3.5 py-2.5 sm:max-w-[min(100%,28rem)] sm:px-4",
            message.pending && "opacity-80",
          )}
        >
          <p className="text-brand-body whitespace-pre-wrap break-words leading-[1.5] text-inherit">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.kind === "board_update") {
    return (
      <div className="flex justify-center py-1">
        <button
          type="button"
          onClick={onOpenBoard}
          className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)]"
        >
          <span className="adviser-chat-board-dot" aria-hidden />
          Board updated
          {peptideName ? (
            <span className="max-w-[10rem] truncate text-[color:var(--dash-muted)]">· {peptideName}</span>
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "adviser-chat-ai dashboard-glass-card w-full min-w-0 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4",
        message.pending && "adviser-chat-ai--typing",
      )}
    >
      {message.pending ? (
        <div
          className="adviser-chat-typing"
          aria-live="polite"
          aria-label="Assistant is replying"
        >
          <span className="adviser-chat-typing-dots" aria-hidden>
            <span className="adviser-chat-typing-dot" />
            <span className="adviser-chat-typing-dot" />
            <span className="adviser-chat-typing-dot" />
          </span>
          <span className="adviser-chat-typing-label">Replying…</span>
        </div>
      ) : (
        <>
          <div className="text-brand-body adviser-chat-ai-body break-words text-[color:var(--dash-text)]">
            <MarkdownContent content={message.content} className="adviser-chat-markdown" />
          </div>
          <div className="adviser-chat-ai-actions mt-2 flex items-center gap-0.5 sm:mt-3">
            <MessageActionButton label={copied ? "Copied" : "Copy"} onClick={onCopy}>
              {copied ? (
                <SidebarSvgIcon name="check" size={16} strokeWidth={2} />
              ) : (
                <Icon icon={Copy} size={16} strokeWidth={1.7} />
              )}
            </MessageActionButton>
            <MessageActionButton label="Good response">
              <Icon icon={ThumbsUp} size={16} strokeWidth={1.7} />
            </MessageActionButton>
            <MessageActionButton label="Bad response">
              <Icon icon={ThumbsDown} size={16} strokeWidth={1.7} />
            </MessageActionButton>
          </div>
        </>
      )}
    </div>
  );
}

function MessageActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="adviser-chat-ai-action flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-[0.96]"
    >
      {children}
    </button>
  );
}
