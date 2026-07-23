"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  DataField,
  PaginationControls,
  StatPill,
  StatusBadge,
} from "@/components/platform/provider/admin/shared";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import { useAffiliateProfile } from "@/components/platform/provider/affiliate/affiliateProfile";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listAffiliateReferralStudents,
  sendAffiliateInvites,
} from "@/lib/integrate/provider/affiliate/referrals/api";
import type { StudentSummary } from "@/lib/integrate/provider/admin/users/types";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "S";
}

const copyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

type CopiedField = "code" | "url" | "hero" | null;

export function AffiliateReferralsPage() {
  const { profile, inviteInfo, refreshing, error, setError, inviteLink } = useAffiliateProfile();
  const [copied, setCopied] = useState<CopiedField>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? 0;
  const invitationQuota = inviteInfo?.invitation_quota ?? profile?.invitation_quota;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code;
  const availableQuota =
    invitationQuota == null
      ? "Unlimited"
      : String(Math.max(invitationQuota - studentCount, 0));

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      async function loadStudents() {
        setStudentsLoading(true);
        try {
          const data = await listAffiliateReferralStudents({ page, limit: 15 }, controller.signal);
          if (controller.signal.aborted) return;
          setStudents(data.items);
          setTotal(data.pagination.total);
          setHasNext(data.pagination.has_next);
          setHasPrevious(data.pagination.has_previous);
        } catch (err) {
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof ApiRequestError ? err.message : "Failed to load referred students.");
        } finally {
          if (!controller.signal.aborted) setStudentsLoading(false);
        }
      }

      void loadStudents();
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [page, setError]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!inviteSuccess) return;
    const timer = window.setTimeout(() => setInviteSuccess(null), 3500);
    return () => window.clearTimeout(timer);
  }, [inviteSuccess]);

  async function copyText(value: string | undefined | null, field: CopiedField) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setError(null);
    } catch {
      setError("Could not copy. Please copy it manually.");
    }
  }

  return (
    <PortalShell
      role="affiliate"
      title="Referrals"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={affiliateNav}
    >
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Referrals
            </h1>
          </div>
          <WelcomeChip fallbackName="Affiliate" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {inviteSuccess ? <AuthAlert variant="success">{inviteSuccess}</AuthAlert> : null}

          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Referral capacity
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {refreshing && !profile ? "—" : studentCount}
                  </span>
                  <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                    referred students
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  Share your invite link and track students who join through you.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setInviteSuccess(null);
                    setInviteOpen(true);
                  }}
                  disabled={!inviteLink}
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:px-5"
                >
                  <span className="sm:hidden">Email</span>
                  <span className="hidden sm:inline">Email invite</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText(inviteLink, "hero")}
                  disabled={!inviteLink}
                  className="font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50 sm:px-5"
                >
                  {copied === "hero" ? (
                    <>
                      {checkIcon}
                      Copied
                    </>
                  ) : (
                    <>
                      {copyIcon}
                      <span className="sm:hidden">Copy</span>
                      <span className="hidden sm:inline">Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[420px]:grid-cols-3 sm:gap-3">
            <StatPill label="Referred" value={String(studentCount)} />
            <StatPill
              label="Quota"
              value={invitationQuota == null ? "Unlimited" : `${studentCount}/${invitationQuota}`}
            />
            <StatPill label="Available" value={availableQuota} />
          </div>

          <section className="dashboard-surface min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Share
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  Invite link
                </h2>
              </div>
              <Link
                href="/affiliate"
                className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110"
              >
                Dashboard
              </Link>
            </div>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)]">
              Students should sign up from this link so your referral code is attached.
            </p>
            <div className="mt-4 grid min-w-0 gap-3">
              <CopyField
                label="Invite code"
                value={inviteCode ?? "Not assigned"}
                copyValue={inviteCode}
                copied={copied === "code"}
                onCopy={() => copyText(inviteCode, "code")}
                valueClassName="text-lg font-semibold"
              />
              <CopyField
                label="Shareable URL"
                value={
                  inviteLink ||
                  "An admin must assign your invite code before referrals can be tracked."
                }
                copyValue={inviteLink}
                copied={copied === "url"}
                onCopy={() => copyText(inviteLink, "url")}
                valueClassName="text-sm font-medium"
              />
            </div>
          </section>

          <section className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Directory
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  Referral students
                </h2>
              </div>
              <p className="text-brand-caption text-[color:var(--dash-faint)]">{total} total</p>
            </div>

            {studentsLoading ? (
              <div className="mt-5 space-y-2.5" aria-busy="true" aria-label="Loading students">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="dashboard-row rounded-xl px-3.5 py-3.5">
                    <span className="dashboard-skeleton-block h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-[color:var(--dash-surface-border)] px-4 py-10 text-center">
                <p className="font-sans text-sm font-medium text-[color:var(--dash-text)]">
                  No referred students yet
                </p>
                <p className="text-brand-body mx-auto mt-2 max-w-md text-sm text-[color:var(--dash-muted)]">
                  Share your invite link or send an email invite to start tracking referrals.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInviteSuccess(null);
                    setInviteOpen(true);
                  }}
                  disabled={!inviteLink}
                  className="font-sans mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
                >
                  Invite by email
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {students.map((student) => {
                  const name =
                    [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
                  return (
                    <article
                      key={student.user_id}
                      className="dashboard-row min-w-0 rounded-xl px-3.5 py-3.5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] font-sans text-xs font-bold text-[color:var(--dash-text)]">
                          {initials(student.first_name, student.last_name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)]">
                              {name}
                            </p>
                            <StatusBadge tone={student.marketing_pref ? "accent" : "muted"}>
                              <span className="sm:hidden">{student.marketing_pref ? "On" : "Off"}</span>
                              <span className="hidden sm:inline">
                                {student.marketing_pref ? "Marketing on" : "Marketing off"}
                              </span>
                            </StatusBadge>
                          </div>
                          <div className="mt-2.5 grid min-w-0 gap-2.5 sm:grid-cols-2">
                            <DataField label="Email" value={student.email} />
                            <DataField
                              label="Joined"
                              value={student.created_at ? formatDate(student.created_at) : "—"}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <PaginationControls
                  page={page}
                  total={total}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  loading={studentsLoading}
                  onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                  onNext={() => setPage((current) => current + 1)}
                />
              </div>
            )}
          </section>
        </div>
      </div>

      <InviteEmailDialog
        open={inviteOpen}
        inviteLinkReady={Boolean(inviteLink)}
        onClose={() => setInviteOpen(false)}
        onSuccess={(message) => {
          setInviteSuccess(message);
          setInviteOpen(false);
        }}
        onError={(message) => setError(message)}
      />
    </PortalShell>
  );
}

function CopyField({
  label,
  value,
  copyValue,
  copied,
  onCopy,
  valueClassName,
}: {
  label: string;
  value: string;
  copyValue?: string | null;
  copied: boolean;
  onCopy: () => void;
  valueClassName?: string;
}) {
  const canCopy = Boolean(copyValue);
  return (
    <div className="dashboard-row min-w-0 overflow-hidden rounded-xl px-3.5 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-brand-caption min-w-0 font-medium text-[color:var(--dash-faint)]">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          className="dashboard-pill-soft font-sans inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-40"
        >
          {copied ? checkIcon : copyIcon}
          <span className="hidden min-[360px]:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <p
        className={`font-sans mt-1 break-all text-[color:var(--dash-text)] [overflow-wrap:anywhere] ${valueClassName ?? "text-sm font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}

function InviteEmailDialog({
  open,
  inviteLinkReady,
  onClose,
  onSuccess,
  onError,
}: {
  open: boolean;
  inviteLinkReady: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const titleId = useId();
  const emailsRef = useRef<HTMLTextAreaElement>(null);
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmails("");
    setMessage("");
    setLocalError(null);
    setSending(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => emailsRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !sending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, sending]);

  if (!open || typeof document === "undefined") return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const parsed = emails
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (parsed.length === 0) {
      setLocalError("Add at least one student email.");
      return;
    }
    if (!inviteLinkReady) {
      setLocalError("Invite link is not ready yet.");
      return;
    }

    setSending(true);
    try {
      const result = await sendAffiliateInvites({
        emails: parsed,
        message: message.trim() || undefined,
      });
      onSuccess(
        `${result.recipient_count} invite email${result.recipient_count === 1 ? "" : "s"} queued.`,
      );
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Could not send invite emails.";
      setLocalError(msg);
      onError(msg);
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div className="adviser-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-3 py-4 sm:px-4 sm:py-6 max-sm:items-end max-sm:px-0 max-sm:py-0">
      <button
        type="button"
        aria-label="Close invite dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!sending) onClose();
        }}
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="adviser-dialog-panel relative z-10 flex max-h-[min(92svh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl max-sm:h-[min(96svh,36rem)] max-sm:max-h-none max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Email
            </p>
            <h2
              id={titleId}
              className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]"
            >
              Invite students by email
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Close"
            className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <p className="text-brand-body text-sm text-[color:var(--dash-muted)]">
            Separate multiple emails with commas, spaces, or new lines.
          </p>

          {localError ? (
            <div className="mt-3">
              <AuthAlert variant="error">{localError}</AuthAlert>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:gap-4">
            <div className="grid min-w-0 gap-2">
              <label htmlFor="invite-emails" className="dashboard-field-label">
                Student emails
              </label>
              <textarea
                ref={emailsRef}
                id="invite-emails"
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                rows={3}
                required
                className="dashboard-field min-h-[5.5rem] resize-y"
                placeholder="student@example.com, another@example.com"
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <label htmlFor="invite-message" className="dashboard-field-label">
                Optional message
              </label>
              <textarea
                id="invite-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={2}
                maxLength={500}
                className="dashboard-field min-h-[4rem] resize-y"
                placeholder="Add a short personal note"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending || !inviteLinkReady}
            className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            {sending ? "Sending…" : "Send invites"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
