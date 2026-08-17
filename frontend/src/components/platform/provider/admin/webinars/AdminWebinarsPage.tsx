"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { DashboardSelect } from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  createWebinar,
  listWebinars,
  updateWebinar,
  uploadWebinarThumbnail,
  type WebinarSummary,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function toLocalInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

type FormState = {
  title: string;
  description: string;
  starts_at: string;
  price: string;
  capacity: string;
  join_url: string;
  status: "draft" | "published" | "cancelled" | "completed";
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  starts_at: toLocalInputValue(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  price: "0",
  capacity: "100",
  join_url: "",
  status: "published",
});

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
] as const;

export function AdminWebinarsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webinars, setWebinars] = useState<WebinarSummary[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWebinars({ page: 1, limit: 50 });
      setWebinars(data.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load webinars.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createWebinar({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        starts_at: new Date(form.starts_at).toISOString(),
        price: Number(form.price) || 0,
        capacity: Number(form.capacity) || 100,
        join_url: form.join_url.trim() || undefined,
        status: form.status,
      });
      if (thumbnailFile) {
        await uploadWebinarThumbnail(created.webinar.webinar_id, thumbnailFile);
      }
      setForm(emptyForm());
      setThumbnailFile(null);
      setShowForm(false);
      setSuccess("Webinar created.");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not create webinar.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(webinar: WebinarSummary) {
    const nextStatus = webinar.status === "published" ? "draft" : "published";
    setError(null);
    try {
      await updateWebinar(webinar.webinar_id, { status: nextStatus });
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update webinar.");
    }
  }

  return (
    <PortalShell
      role="admin"
      title="Webinars"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={adminNav}
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
              <Icon icon={Menu} size={18} />
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Webinars
            </h1>
          </div>
          <WelcomeChip fallbackName="Admin" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Live events
                </p>
                <h2 className="font-sans mt-2 text-xl font-bold text-[color:var(--dash-text)] sm:text-2xl">
                  Manage webinars
                </h2>
                <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  Publish sessions, set price and capacity, and attach a join link for booked students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm((value) => !value)}
                className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105"
              >
                {showForm ? "Close form" : "New webinar"}
              </button>
            </div>
          </section>

          {showForm ? (
            <section className="dashboard-surface rounded-2xl p-4 sm:p-5 md:p-6">
              <h3 className="font-sans text-base font-semibold text-[color:var(--dash-text)]">
                Create webinar
              </h3>
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
                <Field
                  label="Title"
                  value={form.title}
                  onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
                  required
                />
                <Field
                  label="Starts at"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(value) => setForm((prev) => ({ ...prev, starts_at: value }))}
                  required
                />
                <Field
                  label="Price (USD)"
                  type="number"
                  value={form.price}
                  onChange={(value) => setForm((prev) => ({ ...prev, price: value }))}
                />
                <Field
                  label="Capacity"
                  type="number"
                  value={form.capacity}
                  onChange={(value) => setForm((prev) => ({ ...prev, capacity: value }))}
                />
                <Field
                  label="Join URL"
                  value={form.join_url}
                  onChange={(value) => setForm((prev) => ({ ...prev, join_url: value }))}
                  className="sm:col-span-2"
                />
                <label className="grid gap-2 sm:col-span-2">
                  <span className="dashboard-field-label">Thumbnail</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
                    className="dashboard-field file:mr-3 file:rounded-full file:border-0 file:bg-[#DDE466] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#152744]"
                  />
                  <span className="text-brand-caption text-[color:var(--dash-faint)]">
                    Optional. JPEG, PNG, WebP, or GIF up to 5 MB.
                  </span>
                </label>
                <label className="grid gap-2 sm:col-span-2">
                  <span className="dashboard-field-label">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={3}
                    className="dashboard-field min-h-[6rem] resize-y"
                  />
                </label>
                <div className="grid gap-2">
                  <span className="dashboard-field-label" id="webinar-status-label">
                    Status
                  </span>
                  <DashboardSelect
                    aria-label="Status"
                    value={form.status}
                    options={STATUS_OPTIONS}
                    onChange={(status) => setForm((prev) => ({ ...prev, status }))}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Create webinar"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="dashboard-surface rounded-2xl p-4 sm:p-5 md:p-6">
            <h3 className="font-sans text-base font-semibold text-[color:var(--dash-text)]">
              All webinars
            </h3>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-brand-body py-8 text-center text-[color:var(--dash-faint)]">
                  Loading…
                </p>
              ) : webinars.length === 0 ? (
                <p className="text-brand-body py-8 text-center text-[color:var(--dash-faint)]">
                  No webinars yet. Create the first one.
                </p>
              ) : (
                webinars.map((webinar) => (
                  <article
                    key={webinar.webinar_id}
                    className="rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/35 p-3.5 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {webinar.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={webinar.thumbnail_url}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                          />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[color:var(--dash-soft)] text-brand-caption font-semibold text-[color:var(--dash-faint)] sm:h-20 sm:w-20">
                            No art
                          </span>
                        )}
                        <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-sans text-base font-bold text-[color:var(--dash-text)]">
                            {webinar.title}
                          </h4>
                          <span className="rounded-full bg-[color:var(--dash-soft)] px-2.5 py-0.5 text-brand-caption font-semibold capitalize text-[color:var(--dash-accent)]">
                            {webinar.status}
                          </span>
                        </div>
                        <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                          {formatWebinarWhen(webinar.starts_at)}
                          {" · "}
                          {formatMoney(webinar.price, webinar.currency)}
                          {" · "}
                          {webinar.seats_taken}/{webinar.capacity} booked
                        </p>
                        {webinar.join_url ? (
                          <p className="text-brand-caption mt-1 break-all text-[color:var(--dash-muted)]">
                            Join: {webinar.join_url}
                          </p>
                        ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void togglePublish(webinar)}
                          className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium"
                        >
                          {webinar.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <Link
                          href={`/admin/webinars/${encodeURIComponent(webinar.webinar_id)}`}
                          className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744]"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className ?? ""}`}>
      <span className="dashboard-field-label">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="dashboard-field"
      />
    </label>
  );
}
