"use client";

import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { PaginationControls } from "@/components/platform/provider/admin/shared";
import { Button } from "@/components/ui/Button";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import {
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listAffiliateReferralStudents,
  sendAffiliateInvites,
} from "@/lib/integrate/provider/affiliate/referrals/api";
import type { StudentSummary } from "@/lib/integrate/provider/admin/users/types";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";

export function AffiliateReferralsPage() {
  const { profile, inviteInfo, refreshing, error, setError, inviteLink } = useAffiliateProfile();
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvites, setSendingInvites] = useState(false);
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

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setError("Could not copy invite link. Please copy it manually.");
    }
  }

  async function handleSendInvites(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInviteSuccess(null);
    const emails = inviteEmails
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setError("Add at least one student email.");
      return;
    }

    setSendingInvites(true);
    try {
      const result = await sendAffiliateInvites({
        emails,
        message: inviteMessage.trim() || undefined,
      });
      setInviteSuccess(`${result.recipient_count} invite email${result.recipient_count === 1 ? "" : "s"} queued.`);
      setInviteEmails("");
      setInviteMessage("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not send invite emails.");
    } finally {
      setSendingInvites(false);
    }
  }

  return (
    <PortalShell
      role="affiliate"
      title="Referrals"
      subtitle="Share your invite link and track referral capacity."
      nav={affiliateNav}
    >
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {copySuccess ? <AuthAlert variant="success">Invite link copied.</AuthAlert> : null}
        {inviteSuccess ? <AuthAlert variant="success">{inviteSuccess}</AuthAlert> : null}

        {refreshing && !profile ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <PortalStatCard label="Referred students" value={String(studentCount)} hint="Current total" />
              <PortalStatCard
                label="Invitation quota"
                value={invitationQuota == null ? "Unlimited" : `${studentCount}/${invitationQuota}`}
                hint="Used / limit"
              />
              <PortalStatCard label="Available invites" value={availableQuota} hint="Remaining capacity" />
            </div>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Invite link</h2>
                  <p className="mt-1 text-sm text-primary/45">
                    Students should sign up from this link so your referral code is attached.
                  </p>
                </div>
                <Button variant="primary" size="md" onClick={copyInviteLink} disabled={!inviteLink}>
                  Copy link
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                <div className="rounded-2xl border border-black/[0.06] bg-[#F5F7FA] p-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">Invite code</p>
                  <p className="mt-2 break-all text-lg font-semibold text-primary">
                    {inviteCode ?? "Not assigned"}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/[0.06] bg-[#F5F7FA] p-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">Shareable URL</p>
                  <p className="mt-2 break-all text-sm font-medium text-primary">
                    {inviteLink || "An admin must assign your invite code before referrals can be tracked."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <h2 className="text-lg font-semibold text-primary">Invite students by email</h2>
              <p className="mt-1 text-sm text-primary/45">
                Add one or many emails. Separate multiple emails with commas, spaces, or new lines.
              </p>
              <form className="mt-5 grid gap-4" onSubmit={handleSendInvites}>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-primary/65">Student emails</span>
                  <textarea
                    value={inviteEmails}
                    onChange={(event) => setInviteEmails(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm text-primary outline-none transition placeholder:text-primary/35 focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
                    placeholder="student@example.com, another@example.com"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-primary/65">Optional message</span>
                  <textarea
                    value={inviteMessage}
                    onChange={(event) => setInviteMessage(event.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm text-primary outline-none transition placeholder:text-primary/35 focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
                    placeholder="Add a short personal note"
                  />
                </label>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="md" disabled={sendingInvites || !inviteLink}>
                    {sendingInvites ? "Sending..." : "Send invite emails"}
                  </Button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <h2 className="text-lg font-semibold text-primary">Referral students</h2>
              <p className="mt-1 text-sm text-primary/45">
                Students shown here are returned by the affiliate-safe referred students endpoint.
              </p>

              {studentsLoading ? (
                <div className="mt-5 rounded-2xl border border-black/[0.06] bg-[#F5F7FA] p-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
                </div>
              ) : students.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-black/[0.12] bg-[#F5F7FA] p-8 text-center">
                  <p className="text-sm font-medium text-primary">No referred students yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-primary/45">
                    Share your invite link or send invite emails to start tracking referrals.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-primary/45">
                        <th className="pb-3 pr-4 font-medium">Name</th>
                        <th className="pb-3 pr-4 font-medium">Email</th>
                        <th className="pb-3 pr-4 font-medium">Marketing</th>
                        <th className="pb-3 pr-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                      {students.map((student) => (
                        <tr key={student.user_id}>
                          <td className="py-3 pr-4 font-medium text-primary">
                            {[student.first_name, student.last_name].filter(Boolean).join(" ")}
                          </td>
                          <td className="py-3 pr-4 text-primary/55">{student.email}</td>
                          <td className="py-3 pr-4 text-primary/55">
                            {student.marketing_pref ? "Subscribed" : "Off"}
                          </td>
                          <td className="py-3 pr-4 text-primary/55">
                            {student.created_at ? formatDate(student.created_at) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          </>
        )}
      </div>
    </PortalShell>
  );
}
