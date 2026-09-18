"use client";

import { WebinarNotificationsBell } from "@/components/platform/provider/student/webinars/WebinarNotificationsBell";
import { WebinarDetailPanel } from "@/components/platform/provider/student/webinars/WebinarDetailPanel";
import { WebinarsPageLayout } from "@/components/platform/provider/student/webinars/WebinarsPageLayout";

export function StudentWebinarDetailPage({ webinarId }: { webinarId: string }) {
  return (
    <WebinarsPageLayout
      title="Webinar"
      backHref="/student/webinars"
      headerRight={
        <WebinarNotificationsBell buttonClassName="dashboard-notify-btn relative flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12" />
      }
    >
      <WebinarDetailPanel webinarId={webinarId} />
    </WebinarsPageLayout>
  );
}
