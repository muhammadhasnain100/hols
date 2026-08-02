"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  Icon,
  Loader2,
  ThumbsDown,
  ThumbsUp,
} from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { MarkdownContent } from "@/components/platform/provider/student/adviser/MarkdownContent";
import { ChatMessagesSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
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

export function AdviserChatPanel({ patient, onPatientChange }: AdviserChatPanelProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
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
  }, [messages, isSending]);

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
          ? { ...current, has_older: page.pagination.has_older, oldest_message_id: page.pagination.oldest_message_id }
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

  const COMPOSER_MAX_HEIGHT = 120;

  const handleComposerInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="adviser-chat-transcript min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 md:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 py-4 sm:gap-7 sm:py-5">
          {pagination?.has_older ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                disabled={isLoadingOlder}
                className="text-brand-caption font-medium text-[color:var(--dash-faint)] transition hover:text-[color:var(--dash-text)] disabled:opacity-60"
              >
                {isLoadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
              </button>
            </div>
          ) : null}

          {isLoadingMessages ? <ChatMessagesSkeleton /> : null}

          {!isLoadingMessages && messages.length === 0 ? (
            <p className="text-brand-body px-2 py-12 text-center text-[color:var(--dash-faint)] sm:py-16">
              Ask anything about this patient case.
            </p>
          ) : null}

          {messages.map((message) => (
            <ChatMessageRow
              key={message.message_id}
              message={message}
              copied={copiedId === message.message_id}
              onCopy={() => void copyMessage(message.message_id, message.content)}
            />
          ))}

          {isSending ? <AssistantTypingRow /> : null}

          {error ? (
            <div className="py-2">
              <AuthAlert variant="error">{error}</AuthAlert>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="adviser-chat-composer-bar shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-4 sm:pt-4 md:px-6 lg:px-8">
        <form
          className="adviser-chat-composer mx-auto flex w-full max-w-3xl items-end gap-1.5 rounded-[1.5rem] px-2.5 py-1.5 sm:gap-2 sm:rounded-[1.75rem] sm:px-4 sm:py-2"
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
            placeholder="Ask anything"
            spellCheck={false}
            className="text-brand-body max-h-[7.5rem] min-h-[40px] flex-1 resize-none overflow-y-auto bg-transparent px-1.5 py-2 leading-relaxed text-[color:var(--dash-text)] outline-none placeholder:text-[color:var(--dash-faint)] disabled:opacity-60 sm:min-h-[44px] sm:px-2 sm:py-2.5 [scrollbar-width:thin]"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className={cn(
              "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:mb-1 sm:h-10 sm:w-10",
              input.trim() && !isSending
                ? "bg-[#DDE466] text-[#152744] hover:brightness-105"
                : "adviser-chat-composer-send-idle",
            )}
          >
            {isSending ? (
              <ChatSpinner className="h-4 w-4 text-[#152744]" />
            ) : (
              <Icon icon={ArrowUp} size={16} strokeWidth={2.2} />
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
      <div className="flex justify-end pl-6 sm:pl-16">
        <div
          className={cn(
            "max-w-[min(100%,22rem)] rounded-[1.25rem] bg-[color:var(--dash-soft)] px-3.5 py-2 text-[color:var(--dash-text)] sm:max-w-full sm:rounded-[1.5rem] sm:px-4 sm:py-2.5",
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
      <div className="text-brand-body adviser-chat-ai-body break-words text-[color:var(--dash-text)]">
        <MarkdownContent content={message.content} className="adviser-chat-markdown" />
      </div>
      <div className="mt-2 flex items-center gap-0.5 sm:mt-3">
        <MessageActionButton
          label={copied ? "Copied" : "Copy"}
          onClick={onCopy}
        >
          {copied ? (
            <Icon icon={Check} size={18} strokeWidth={1.8} />
          ) : (
            <Icon icon={Copy} size={18} strokeWidth={1.6} />
          )}
        </MessageActionButton>
        <MessageActionButton label="Good response">
          <Icon icon={ThumbsUp} size={18} strokeWidth={1.6} />
        </MessageActionButton>
        <MessageActionButton label="Bad response">
          <Icon icon={ThumbsDown} size={18} strokeWidth={1.6} />
        </MessageActionButton>
      </div>
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
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--dash-faint)] transition-colors hover:bg-[color:var(--dash-soft)] hover:text-[color:var(--dash-text)] active:scale-[0.96]"
    >
      {children}
    </button>
  );
}

function ChatSpinner({ className }: { className?: string }) {
  return <Icon icon={Loader2} size={16} className={cn("animate-spin", className)} strokeWidth={2.5} />;
}

function AssistantTypingRow() {
  return (
    <div className="flex items-center gap-2 py-1" aria-label="Assistant is typing">
      <ChatSpinner className="h-4 w-4 text-[color:var(--dash-accent)]" />
      <span className="text-brand-caption text-[color:var(--dash-faint)]">Thinking…</span>
    </div>
  );
}
