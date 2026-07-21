"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { MarkdownContent } from "@/components/platform/provider/student/adviser/MarkdownContent";
import {
  portalDisclaimerClass,
  portalInlineMetaClass,
  portalNavItemClass,
  portalRowCategoryClass,
  portalSectionDescClass,
  portalSectionTitleClass,
  portalSubnavItemClass,
} from "@/components/platform/provider/portal-styles";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getPatientMessages,
  sendPatientMessage,
  type ChatMessagesPagination,
  type PatientDetail,
  type StoredChatMessage,
} from "@/lib/integrate/provider/student/chat";
import { cn } from "@/lib/utils";

type AdviserChatPanelProps = {
  patient: PatientDetail;
  onPatientChange?: (patient: PatientDetail) => void;
  onNewCase: () => void;
};

type DisplayMessage = StoredChatMessage & {
  pending?: boolean;
};

const TEMP_USER_PREFIX = "temp-user-";

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

export function AdviserChatPanel({ patient, onPatientChange, onNewCase }: AdviserChatPanelProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pagination, setPagination] = useState<ChatMessagesPagination | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const initializedPatientRef = useRef<string | null>(null);

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
    if (!shouldStickToBottomRef.current || !threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isSending]);

  const loadOlderMessages = useCallback(async () => {
    if (!pagination?.has_older || !pagination.oldest_message_id || isLoadingOlder) return;

    setIsLoadingOlder(true);
    shouldStickToBottomRef.current = false;
    const previousHeight = threadRef.current?.scrollHeight ?? 0;

    try {
      const page = await getPatientMessages(patient.patient_id, {
        before: pagination.oldest_message_id,
      });
      setMessages((current) => [...page.messages, ...current]);
      setPagination((current) =>
        current
          ? { ...current, has_older: page.pagination.has_older, oldest_message_id: page.pagination.oldest_message_id }
          : page.pagination,
      );

      requestAnimationFrame(() => {
        if (!threadRef.current) return;
        threadRef.current.scrollTop = threadRef.current.scrollHeight - previousHeight;
      });
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not load older messages.",
      );
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, pagination, patient.patient_id]);

  const handleThreadScroll = useCallback(() => {
    const node = threadRef.current;
    if (!node) return;

    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 96;

    if (node.scrollTop <= 48) {
      void loadOlderMessages();
    }
  }, [loadOlderMessages]);

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || isSending || !patient.recommendation) return;

    const optimisticMessage = createTempUserMessage(question);

    setInput("");
    setError(null);
    setIsSending(true);
    shouldStickToBottomRef.current = true;
    setMessages((current) => [...current, optimisticMessage]);

    if (composerRef.current) {
      composerRef.current.style.height = "auto";
    }

    try {
      const updated = await sendPatientMessage(patient.patient_id, question);
      setMessages(updated.messages);
      setPagination(updated.messages_pagination ?? null);
      onPatientChange?.(updated);
    } catch (err) {
      setMessages((current) =>
        current.filter((message) => message.message_id !== optimisticMessage.message_id),
      );
      setInput(question);
      setError(err instanceof ApiRequestError ? err.message : "Could not send message.");
    } finally {
      setIsSending(false);
      composerRef.current?.focus();
    }
  }, [input, isSending, onPatientChange, patient.patient_id, patient.recommendation]);

  const handleComposerInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const messageCount = patient.message_count ?? messages.length;

  return (
    <div className="flex h-[min(78vh,52rem)] flex-col overflow-hidden rounded-2xl border border-primary/10 bg-[#f7f8fb] shadow-[0_8px_30px_rgba(21,39,68,0.06)]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/8 bg-white px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", portalNavItemClass)}>{patient.display_name}</p>
          <p className={portalInlineMetaClass}>
            Clinical consultation · {messageCount} message{messageCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onNewCase}
          className={cn(
            "shrink-0 rounded-full border border-primary/10 bg-white px-3 py-1.5 transition hover:border-primary/20 hover:text-primary",
            portalSubnavItemClass,
            "text-primary/70",
          )}
        >
          New patient
        </button>
      </header>

      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto px-3 py-5 md:px-6"
        onScroll={handleThreadScroll}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {pagination?.has_older ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                disabled={isLoadingOlder}
                className={cn(
                  "rounded-full bg-white px-4 py-1.5 shadow-sm transition hover:text-primary disabled:opacity-60",
                  portalSubnavItemClass,
                  "text-primary/55",
                )}
              >
                {isLoadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
              </button>
            </div>
          ) : null}

          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-primary/45">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/15 border-t-[#3853A4]" />
              <p className={portalSectionDescClass}>Loading conversation…</p>
            </div>
          ) : null}

          {!isLoadingMessages && messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/10 bg-white/70 px-6 py-10 text-center">
              <p className={portalSectionTitleClass}>Start the follow-up consultation</p>
              <p className={cn("mt-2", portalSectionDescClass)}>
                Ask about dosing, alternatives, side effects, labs, or mechanisms for this patient case.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessageRow key={message.message_id} message={message} />
          ))}

          {isSending ? <AssistantTypingRow /> : null}
        </div>
      </div>

      {error ? (
        <div className="shrink-0 border-t border-primary/8 bg-white px-4 py-2 md:px-6">
          <AuthAlert variant="error">{error}</AuthAlert>
        </div>
      ) : null}

      <footer className="shrink-0 border-t border-primary/8 bg-white px-3 py-3 md:px-6 md:py-4">
        <form
          className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-primary/10 bg-[#f7f8fb] p-2 shadow-inner"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <textarea
            ref={composerRef}
            value={input}
            onChange={handleComposerInput}
            onKeyDown={handleComposerKeyDown}
            disabled={isSending}
            rows={1}
            placeholder="Message the clinical adviser…"
            className="text-brand-body max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 leading-relaxed text-primary outline-none placeholder:text-primary/35 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className={cn(
              "mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
              input.trim() && !isSending
                ? "bg-[#3853A4] text-white hover:bg-[#2f4690]"
                : "bg-primary/8 text-primary/30",
            )}
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </form>
        <p className={cn("mx-auto mt-2 max-w-3xl text-center", portalDisclaimerClass)}>
          Enter to send · Shift+Enter for new line · For clinical decision support only
        </p>
      </footer>
    </div>
  );
}

function ChatMessageRow({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  const isRecommendation = message.kind === "recommendation";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[85%] rounded-[1.25rem] rounded-br-md bg-[#3853A4] px-4 py-3 text-white shadow-sm md:max-w-[75%]",
            message.pending && "opacity-90",
          )}
        >
          <p className="text-brand-body whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="text-brand-caption mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3853A4]/10 font-bold text-[#3853A4]">
        AI
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("mb-1.5", portalRowCategoryClass)}>
          {isRecommendation ? "Recommendation card" : "Clinical adviser"}
        </p>
        <div className="rounded-[1.25rem] rounded-tl-md border border-primary/8 bg-white px-4 py-3 shadow-sm">
          <MarkdownContent content={message.content} />
        </div>
      </div>
    </div>
  );
}

function AssistantTypingRow() {
  return (
    <div className="flex items-start gap-3">
      <div className="text-brand-caption mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3853A4]/10 font-bold text-[#3853A4]">
        AI
      </div>
      <div className="rounded-[1.25rem] rounded-tl-md border border-primary/8 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 py-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/30 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/30 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/30 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
