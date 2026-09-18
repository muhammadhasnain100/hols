"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Menu } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { StudentCardPanel } from "@/components/platform/provider/student/payment/StudentCardPage";
import { StudentOrdersPanel } from "@/components/platform/provider/student/payment/StudentOrdersPage";
import { SettingsProfilePanel } from "@/components/platform/provider/student/profile/SettingsProfilePanel";
import {
  SETTINGS_NAV,
  type SettingsSection,
} from "@/components/platform/provider/student/profile/settingsNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { ApiRequestError } from "@/lib/integrate/client";
import { getStoredUser, updateStoredProfile } from "@/lib/integrate/auth/storage";
import {
  getCachedStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  type StudentAddress,
  type StudentProfile,
} from "@/lib/integrate/provider/student/profile/api";
import { cn } from "@/lib/utils";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function storedProfileFallback(): StudentProfile | null {
  const user = getStoredUser();
  if (!user?.profile) return null;
  return {
    user_id: user.user_id,
    role: user.role,
    email: String(user.profile.email ?? ""),
    first_name: String(user.profile.first_name ?? ""),
    last_name: String(user.profile.last_name ?? ""),
    profile_pic: typeof user.profile.profile_pic === "string" ? user.profile.profile_pic : undefined,
    address: user.profile.address as StudentAddress | undefined,
    marketing_pref: Boolean(user.profile.marketing_pref),
    referred_by_affiliate_id:
      typeof user.profile.referred_by_affiliate_id === "string"
        ? user.profile.referred_by_affiliate_id
        : undefined,
    email_verified: Boolean(user.profile.email_verified),
    created_at: typeof user.profile.created_at === "string" ? user.profile.created_at : undefined,
  };
}

function initials(profile: StudentProfile | null) {
  const first = profile?.first_name?.[0] ?? "";
  const last = profile?.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "S";
}

export function StudentSettingsPage({ section }: { section: SettingsSection }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyProfile = useCallback((next: StudentProfile) => {
    setProfile(next);
    updateStoredProfile(next as unknown as Record<string, unknown>);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const cached =
      (getCachedStudentProfile()?.profile as StudentProfile | undefined) ?? storedProfileFallback();

    if (cached) applyProfile(cached);

    async function load() {
      try {
        const data = await getStudentProfile(controller.signal);
        if (controller.signal.aborted) return;
        applyProfile(data.profile as StudentProfile);
      } catch {
        if (controller.signal.aborted) return;
      }
    }

    void load();
    return () => controller.abort();
  }, [applyProfile]);

  async function onPickPhoto(file: File | null) {
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    setPhotoSuccess(null);
    try {
      const data = await updateStudentProfile({}, file);
      applyProfile(data.profile as StudentProfile);
      setPhotoSuccess("Photo updated.");
    } catch (err) {
      setPhotoError(err instanceof ApiRequestError ? err.message : "Could not update photo.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const avatarSrc = profile?.profile_pic;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your profile";

  return (
    <PortalShell
      role="student"
      title="Settings"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen lectures-page min-w-0 overflow-x-hidden">
        <header className="mb-2 flex h-10 min-w-0 items-center gap-2 sm:mb-3 sm:h-12 sm:gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:hidden sm:h-12 sm:w-12"
          >
            <Icon icon={Menu} size={18} />
          </button>

          <h1 className="font-sans min-w-0 truncate text-xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            Settings
          </h1>
        </header>

        <p className="text-brand-body mb-4 max-w-2xl text-sm text-[color:var(--dash-muted)] sm:mb-5 sm:text-base">
          Manage your profile, payment card, and orders.
        </p>

        {photoError ? (
          <div className="mb-3 sm:mb-4">
            <AuthAlert variant="error">{photoError}</AuthAlert>
          </div>
        ) : null}
        {photoSuccess ? (
          <div className="mb-3 sm:mb-4">
            <AuthAlert variant="success">{photoSuccess}</AuthAlert>
          </div>
        ) : null}

        <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(15.5rem,18.75rem)_minmax(0,1fr)]">
            <aside className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:sticky lg:top-3">
              <section className="dashboard-glass-card flex flex-col items-center rounded-2xl px-4 py-5 text-center sm:p-5">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] font-sans text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:h-24 sm:w-24 sm:text-xl">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(profile)
                  )}
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => void onPickPhoto(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || !profile}
                  className="text-brand-caption mt-3 font-medium text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)] disabled:opacity-60"
                >
                  {uploadingPhoto ? "Uploading…" : "Change photo"}
                </button>

                <p className="font-sans mt-3 max-w-full break-words text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-lg">
                  {fullName}
                </p>
                <p className="text-brand-caption mt-1 max-w-full break-all text-[color:var(--dash-muted)]">
                  {profile?.email || "—"}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-[color:var(--dash-soft)] px-2.5 py-1 text-brand-caption font-semibold text-[color:var(--dash-muted)]">
                  Student
                </span>
              </section>

              <nav
                aria-label="Settings sections"
                className="flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
              >
                {SETTINGS_NAV.map((item) => {
                  const active = item.id === section;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "portal-nav-item font-sans inline-flex min-h-10 shrink-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-medium tracking-[0.005em] sm:px-4 sm:text-sm",
                        active && "is-active",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <SidebarSvgIcon
                        name={item.icon}
                        size={15}
                        strokeWidth={1.9}
                        className={cn("portal-nav-icon", !active && "text-[color:var(--dash-muted)]")}
                      />
                      {item.shortLabel}
                    </Link>
                  );
                })}
              </nav>

              <section className="dashboard-glass-card hidden rounded-2xl p-2 sm:p-2.5 lg:block">
                <nav aria-label="Settings sections" className="space-y-0.5">
                  {SETTINGS_NAV.map((item) => {
                    const active = item.id === section;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "portal-nav-item font-sans flex h-12 min-w-0 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium tracking-[0.005em] md:text-base",
                          active && "is-active",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="portal-nav-icon flex h-5 w-5 shrink-0 items-center justify-center">
                          <SidebarSvgIcon name={item.icon} size={18} strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </section>
            </aside>

            <div className="min-w-0">
              {section === "profile" ? <SettingsProfilePanel onProfileChange={applyProfile} /> : null}
              {section === "card" ? <StudentCardPanel /> : null}
              {section === "orders" ? <StudentOrdersPanel /> : null}
            </div>
          </div>
      </div>
    </PortalShell>
  );
}

export function StudentProfilePage() {
  return <StudentSettingsPage section="profile" />;
}
