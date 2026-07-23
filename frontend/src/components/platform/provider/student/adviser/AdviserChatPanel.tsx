"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, [messages, isSending]);

  const loadOlderMessages = useCallback(async () => {
    if (!pagination?.has_older || !pagination.oldest_message_id || isLoadingOlder) return;

    setIsLoadingOlder(true);
    shouldStickToBottomRef.current = false;
    const previousHeight = document.documentElement.scrollHeight;

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
        window.scrollTo({ top: document.documentElement.scrollHeight - previousHeight });
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
    function handleWindowScroll() {
      const doc = document.documentElement;
      const distanceFromBottom = doc.scrollHeight - window.scrollY - window.innerHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 96;

      if (window.scrollY <= 48) {
        void loadOlderMessages();
      }
    }

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
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
    <div className="flex min-h-[calc(100svh-7.5rem)] flex-col sm:min-h-[calc(100svh-8rem)]">
      <div className="flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-36">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-1 sm:gap-7 sm:px-2">
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

      <footer className="adviser-chat-composer-bar fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 sm:px-4 sm:pb-4 sm:pt-6 md:px-6 lg:left-[var(--portal-sidebar-offset)] lg:px-8">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12.5 9.5 17 19 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8.5 8.5V6.8c0-1 .8-1.8 1.8-1.8h7.9c1 0 1.8.8 1.8 1.8v7.9c0 1-.8 1.8-1.8 1.8h-1.7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="4"
                y="8.5"
                width="11.5"
                height="11.5"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          )}
        </MessageActionButton>
        <MessageActionButton label="Good response">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 10v10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M7 20H5.5A1.5 1.5 0 0 1 4 18.5v-6A1.5 1.5 0 0 1 5.5 11H7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M7 11l.8-3.2A2.8 2.8 0 0 1 10.5 5.5H12a1.2 1.2 0 0 1 1.2 1.2V10h5.1a1.8 1.8 0 0 1 1.78 2.1l-1.05 6A1.8 1.8 0 0 1 17.05 20H7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </MessageActionButton>
        <MessageActionButton label="Bad response">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M17 14V4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M17 4h1.5A1.5 1.5 0 0 1 20 5.5v6A1.5 1.5 0 0 1 18.5 13H17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M17 13l-.8 3.2a2.8 2.8 0 0 1-2.7 2.3H12a1.2 1.2 0 0 1-1.2-1.2V14H5.7a1.8 1.8 0 0 1-1.78-2.1l1.05-6A1.8 1.8 0 0 1 6.95 4H17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
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
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AssistantTypingRow() {
  return (
    <div className="flex items-center gap-2 py-1" aria-label="Assistant is typing">
      <ChatSpinner className="h-4 w-4 text-[color:var(--dash-accent)]" />
      <span className="text-brand-caption text-[color:var(--dash-faint)]">Thinking…</span>
    </div>
  );
}
