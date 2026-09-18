"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { DashRightDrawer } from "@/components/platform/provider/student/DashRightDrawer";
import { WebinarsPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { WebinarDetailPanel } from "@/components/platform/provider/student/webinars/WebinarDetailPanel";
import { WebinarListPanel } from "@/components/platform/provider/student/webinars/WebinarListPanel";
import { WebinarNotificationsBell } from "@/components/platform/provider/student/webinars/WebinarNotificationsBell";
import { WebinarsPageLayout } from "@/components/platform/provider/student/webinars/WebinarsPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import { listWebinars, type WebinarSummary } from "@/lib/integrate/provider/student/webinars/api";

export function StudentWebinarsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webinars, setWebinars] = useState<WebinarSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = webinars.find((item) => item.webinar_id === selectedId);

  return (
    <WebinarsPageLayout
      headerRight={
        <WebinarNotificationsBell buttonClassName="dashboard-notify-btn relative flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12" />
      }
    >
      {error ? (
        <AuthAlert variant="error">{error}</AuthAlert>
      ) : loading ? (
        <WebinarsPageSkeleton />
      ) : (
        <WebinarListPanel webinars={webinars} onSelect={setSelectedId} />
      )}

      {selectedId ? (
        <DashRightDrawer
          eyebrow="Webinar"
          title={selected?.title || "Session"}
          onClose={() => setSelectedId(null)}
        >
          <WebinarDetailPanel
            webinarId={selectedId}
            compact
            onWebinarChange={(webinar) => {
              setWebinars((current) =>
                current.map((item) => (item.webinar_id === webinar.webinar_id ? webinar : item)),
              );
            }}
          />
        </DashRightDrawer>
      ) : null}
    </WebinarsPageLayout>
  );
}
