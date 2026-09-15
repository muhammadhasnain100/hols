"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Icon,
  Copy,
  Rocket,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { RecommendationWarRoom } from "@/components/platform/provider/student/adviser/RecommendationWarRoom";
import { MarkdownContent } from "@/components/platform/provider/student/adviser/MarkdownContent";
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
};

type DisplayMessage = StoredChatMessage & {
  pending?: boolean;
};

const TEMP_USER_PREFIX = "temp-user-";
const TEMP_ASSISTANT_PREFIX = "temp-assistant-";

const CONFIDENCE_FIELD_OPTIONS: Array<{
  value: BoardConfidence;
  label: string;
  hint: string;
  icon: typeof ShieldCheck;
}> = [
  {
    value: "conservative",
    label: "Conservative",
    hint: "Safer shortlist",
    icon: ShieldCheck,
  },
  {
    value: "balanced",
    label: "Balanced",
    hint: "Default mix",
    icon: Sparkles,
  },
  {
    value: "aggressive",
    label: "Aggressive",
    hint: "Bolder picks",
    icon: Rocket,
  },
];

function ConfidenceFieldToggle({
  value,
  onChange,
  disabled,
  isUpdating,
}: {
  value: BoardConfidence;
  onChange: (confidence: BoardConfidence) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected =
    CONFIDENCE_FIELD_OPTIONS.find((option) => option.value === value) ?? CONFIDENCE_FIELD_OPTIONS[1];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled || isUpdating) setOpen(false);
  }, [disabled, isUpdating]);

  return (
    <div ref={rootRef} className="adviser-composer-confidence-menu relative shrink-0 self-center">
      <button
        type="button"
        disabled={disabled || isUpdating}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Confidence: ${selected.label}. Click to change.`}
        title={`Confidence: ${selected.label}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "adviser-composer-confidence-trigger",
          open && "is-open",
          isUpdating && "is-updating",
        )}
      >
        <span
          className="adviser-composer-confidence-trigger-row"
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap",
          }}
        >
          <Icon
            icon={selected.icon}
            size={16}
            strokeWidth={2.1}
            className="adviser-composer-confidence-trigger-icon"
          />
          <span className="adviser-composer-confidence-trigger-label">{selected.label}</span>
          <Icon
            icon={ChevronDown}
            size={14}
            strokeWidth={2.2}
            className={cn("adviser-composer-confidence-chevron", open && "is-open")}
          />
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Confidence options"
          className="adviser-composer-confidence-popover"
        >
          {CONFIDENCE_FIELD_OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn(
                    "adviser-composer-confidence-option",
                    active && "is-active",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="adviser-composer-confidence-option-icon" aria-hidden>
                    <Icon icon={option.icon} size={15} strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                    <span className="text-brand-caption mt-0.5 block text-[color:var(--dash-faint)]">
                      {option.hint}
                    </span>
                  </span>
                  {active ? (
                    <SidebarSvgIcon name="check" size={14} strokeWidth={2.4} className="shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

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
): string {
  if (action === "why") {
    return `In ≤3 bullets: why is ${peptide.name} ranked #${peptide.rank}?`;
  }
  if (action === "safety") {
    return `Safety/monitoring for ${peptide.name} — short bullets only.`;
  }
  const other = board.ranked.find((item) => item.name !== peptide.name)?.name;
  return other
    ? `Compare ${peptide.name} vs ${other} in ≤4 short bullets.`
    : `Clinical fit of ${peptide.name} — ≤3 short bullets.`;
}

export function AdviserChatPanel({ patient, onPatientChange }: AdviserChatPanelProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  const [board, setBoard] = useState<RecommendationBoard | null>(
    patient.recommendation_board ?? null,
  );
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pagination, setPagination] = useState<ChatMessagesPagination | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const initializedPatientRef = useRef<string | null>(null);

  useEffect(() => {
    setBoard(patient.recommendation_board ?? null);
  }, [patient.patient_id, patient.recommendation_board]);

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
    if (!shouldStickToBottomRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isSending, board]);

  const applyPatientUpdate = useCallback(
    (updated: PatientDetail) => {
      setMessages(updated.messages ?? []);
      setPagination(updated.messages_pagination ?? null);
      if (updated.recommendation_board) {
        setBoard(updated.recommendation_board);
      }
      onPatientChange?.(updated);
    },
    [onPatientChange],
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
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isSending || !patient.recommendation) return;

      const optimisticMessage = createTempUserMessage(trimmed);
      const typingMessage = createTypingMessage();

      setInput("");
      setError(null);
      setIsSending(true);
      shouldStickToBottomRef.current = true;
      setMessages((current) => [...current, optimisticMessage, typingMessage]);

      if (composerRef.current) {
        composerRef.current.style.height = "auto";
      }

      try {
        const updated = await sendPatientMessage(patient.patient_id, trimmed);
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
    [applyPatientUpdate, isSending, patient.patient_id, patient.recommendation],
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
      } catch (err) {
        setError(
          err instanceof ApiRequestError ? err.message : "Could not update recommendation board.",
        );
      } finally {
        setIsUpdatingBoard(false);
      }
    },
    [applyPatientUpdate, isSending, isUpdatingBoard, patient.patient_id, patient.recommendation],
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="adviser-chat-transcript min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 sm:px-4 md:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 py-3 sm:gap-7 sm:py-5">
          {board ? (
            <RecommendationWarRoom
              board={board}
              disabled={busy}
              isUpdating={isUpdatingBoard}
              hideConfidenceDial
              onConfidenceChange={(confidence) => void handleBoardUpdate({ confidence })}
              onPrefer={(name) => void handleBoardUpdate({ preferred: name })}
              onClearPreferred={() => void handleBoardUpdate({ clear_preferred: true })}
              onChip={(chip) => void sendQuestion(chipToQuestion(chip, board))}
              onAskAbout={(peptide, action) =>
                void sendQuestion(peptideActionQuestion(peptide, action, board))
              }
            />
          ) : null}

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
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
              <span className="membership-plan-icon !h-12 !w-12" aria-hidden>
                <SidebarSvgIcon name="adviser" size={24} strokeWidth={1.75} />
              </span>
              <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)]">
                Explore the board, then ask
              </p>
              <p className="text-brand-caption mt-1.5 max-w-[20rem] text-[color:var(--dash-faint)]">
                Use the War Room chips or ask anything about this patient case.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessageRow
              key={message.message_id}
              message={message}
              copied={copiedId === message.message_id}
              onCopy={() => void copyMessage(message.message_id, message.content)}
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
        <form
          className="adviser-chat-composer mx-auto flex w-full max-w-3xl items-end gap-1.5 overflow-visible rounded-xl px-1.5 py-1.5 sm:items-center sm:gap-2 sm:px-3 sm:py-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          {board ? (
            <ConfidenceFieldToggle
              value={(board.confidence as BoardConfidence) || "balanced"}
              disabled={busy || !patient.recommendation}
              isUpdating={isUpdatingBoard}
              onChange={(confidence) => void handleBoardUpdate({ confidence })}
            />
          ) : null}

          <div className="adviser-chat-composer-field min-w-0 flex-1 self-center">
            <textarea
              ref={composerRef}
              value={input}
              onChange={handleComposerInput}
              onKeyDown={handleComposerKeyDown}
              disabled={busy}
              rows={1}
              placeholder="Ask about this case…"
              spellCheck={false}
              className="adviser-chat-composer-input auth-field text-brand-body min-h-[44px] w-full resize-none border-0 bg-transparent px-1 py-2.5 leading-6 text-[color:var(--dash-text)] shadow-none outline-none ring-0 placeholder:text-[color:var(--dash-faint)] focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 disabled:opacity-60 sm:px-2"
              aria-describedby="adviser-composer-hint"
            />
          </div>
          <span id="adviser-composer-hint" className="sr-only">
            Press Enter to send. Press Ctrl+Enter for a new line. Click the confidence control to open Conservative, Balanced, or Aggressive options.
          </span>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className={cn(
              "mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition self-center",
              input.trim() && !busy
                ? "bg-[#DDE466] text-[#152744] hover:brightness-105"
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
      </footer>
    </div>
  );
}

function ChatMessageRow({
  message,
  copied,
  onCopy,
}: {
  message: DisplayMessage;
  copied: boolean;
  onCopy: () => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end pl-4 sm:pl-16">
        <div
          className={cn(
            "max-w-[min(100%,20rem)] rounded-xl bg-[color:var(--dash-soft)] px-3 py-2.5 text-[color:var(--dash-text)] sm:max-w-[min(100%,28rem)] sm:px-4",
            message.pending && "opacity-80",
          )}
        >
          <p className="text-brand-body whitespace-pre-wrap break-words leading-[1.5]">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adviser-chat-ai w-full min-w-0">
      {message.kind === "board_update" ? (
        <p className="text-brand-caption mb-1 font-medium uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
          Board updated
        </p>
      ) : null}
      {message.pending ? (
        <div
          className="adviser-chat-typing inline-flex items-center gap-2 rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3.5 py-2.5 text-[color:var(--dash-muted)]"
          aria-live="polite"
          aria-label="Assistant is typing"
        >
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--dash-accent)]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--dash-accent)] [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--dash-accent)] [animation-delay:240ms]" />
          </span>
          <span className="text-brand-caption">Replying…</span>
        </div>
      ) : (
        <>
          <div className="text-brand-body adviser-chat-ai-body break-words text-[color:var(--dash-text)]">
            <MarkdownContent content={message.content} className="adviser-chat-markdown" />
          </div>
          <div className="mt-2 flex items-center gap-0.5 sm:mt-3">
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
      className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--dash-faint)] transition-colors hover:bg-[color:var(--dash-soft)] hover:text-[color:var(--dash-text)] active:scale-[0.96] sm:h-8 sm:w-8"
    >
      {children}
    </button>
  );
}
