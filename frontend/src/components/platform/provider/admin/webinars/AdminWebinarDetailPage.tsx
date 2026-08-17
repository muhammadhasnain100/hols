"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getWebinar,
  listWebinarRegistrants,
  updateWebinar,
  uploadWebinarThumbnail,
  type WebinarRegistration,
  type WebinarSummary,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { formatDate, formatMoney } from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function AdminWebinarDetailPage({ webinarId }: { webinarId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webinar, setWebinar] = useState<WebinarSummary | null>(null);
  const [registrants, setRegistrants] = useState<WebinarRegistration[]>([]);
  const [joinUrl, setJoinUrl] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState("100");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, regs] = await Promise.all([
        getWebinar(webinarId),
        listWebinarRegistrants(webinarId, { page: 1, limit: 50 }),
      ]);
      setWebinar(detail.webinar);
      setJoinUrl(detail.webinar.join_url ?? "");
      setPrice(String(detail.webinar.price ?? 0));
      setCapacity(String(detail.webinar.capacity ?? 100));
      setRegistrants(regs.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load webinar.");
    } finally {
      setLoading(false);
    }
  }, [webinarId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await updateWebinar(webinarId, {
        join_url: joinUrl.trim() || undefined,
        price: Number(price) || 0,
        capacity: Number(capacity) || 100,
      });
      setWebinar(data.webinar);
      setSuccess("Webinar updated.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update webinar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingThumb(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await uploadWebinarThumbnail(webinarId, file);
      setWebinar(data.webinar);
      setSuccess("Thumbnail updated.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not upload thumbnail.");
    } finally {
      setUploadingThumb(false);
    }
  }

  return (
    <PortalShell
      role="admin"
      title="Webinar detail"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={adminNav}
    >
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <Icon icon={Menu} size={18} />
            </button>
            <h1 className="font-sans truncate text-base font-bold text-[color:var(--dash-text)] sm:text-xl">
              Webinar detail
            </h1>
          </div>
          <WelcomeChip fallbackName="Admin" />
        </header>

        <div className="grid gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {loading || !webinar ? (
            <div className="dashboard-surface rounded-2xl p-10 text-center text-[color:var(--dash-faint)]">
              {loading ? "Loading…" : "Webinar not found."}
            </div>
          ) : (
            <>
              <section className="dashboard-hero rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {webinar.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={webinar.thumbnail_url}
                      alt=""
                      className="h-28 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-40"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                      {formatWebinarWhen(webinar.starts_at)} · {webinar.status}
                    </p>
                    <h2 className="font-sans mt-2 text-2xl font-bold text-[color:var(--dash-text)]">
                      {webinar.title}
                    </h2>
                    <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
                      {webinar.seats_taken}/{webinar.capacity} seats booked
                    </p>
                  </div>
                </div>
              </section>

              <section className="dashboard-surface rounded-2xl p-4 sm:p-6">
                <h3 className="font-sans text-base font-semibold text-[color:var(--dash-text)]">
                  Settings
                </h3>
                <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSave}>
                  <label className="grid gap-2 sm:col-span-2">
                    <span className="dashboard-field-label">Thumbnail</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingThumb}
                      onChange={(event) => void handleThumbnailChange(event)}
                      className="dashboard-field file:mr-3 file:rounded-full file:border-0 file:bg-[#DDE466] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#152744]"
                    />
                    <span className="text-brand-caption text-[color:var(--dash-faint)]">
                      {uploadingThumb
                        ? "Uploading…"
                        : "JPEG, PNG, WebP, or GIF up to 5 MB. Replaces the current image."}
                    </span>
                  </label>
                  <label className="grid gap-2 sm:col-span-2">
                    <span className="dashboard-field-label">Join URL</span>
                    <input
                      value={joinUrl}
                      onChange={(event) => setJoinUrl(event.target.value)}
                      className="dashboard-field"
                      placeholder="https://zoom.us/j/..."
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="dashboard-field-label">Price</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      className="dashboard-field"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="dashboard-field-label">Capacity</span>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(event) => setCapacity(event.target.value)}
                      className="dashboard-field"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="font-sans inline-flex min-h-11 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <Link
                      href="/admin/webinars"
                      className="dashboard-pill-soft font-sans inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium"
                    >
                      Back
                    </Link>
                  </div>
                </form>
              </section>

              <section className="dashboard-surface rounded-2xl p-4 sm:p-6">
                <h3 className="font-sans text-base font-semibold text-[color:var(--dash-text)]">
                  Registrants
                </h3>
                <div className="mt-4 space-y-2.5">
                  {registrants.length === 0 ? (
                    <p className="text-brand-body py-6 text-center text-[color:var(--dash-faint)]">
                      No bookings yet.
                    </p>
                  ) : (
                    registrants.map((item) => (
                      <article
                        key={`${item.user_id}-${item.order_id ?? item.created_at}`}
                        className="rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/40 px-3.5 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                              Student {item.user_id.slice(0, 8)}…
                            </p>
                            <p className="text-brand-caption text-[color:var(--dash-faint)]">
                              {item.created_at ? formatDate(item.created_at) : "—"}
                              {" · "}
                              {formatMoney(item.amount, item.currency)}
                            </p>
                          </div>
                          <Link
                            href={`/admin/users/${encodeURIComponent(item.user_id)}`}
                            className="text-brand-caption font-medium text-[color:var(--dash-accent)] underline-offset-2 hover:underline"
                          >
                            View profile
                          </Link>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
