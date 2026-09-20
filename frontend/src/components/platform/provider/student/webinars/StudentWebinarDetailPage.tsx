"use client";

import { useState } from "react";
import { WebinarDetailPanel } from "@/components/platform/provider/student/webinars/WebinarDetailPanel";
import { WebinarsPageLayout } from "@/components/platform/provider/student/webinars/WebinarsPageLayout";

export function StudentWebinarDetailPage({ webinarId }: { webinarId: string }) {
  const [title, setTitle] = useState("Webinar");

  return (
    <WebinarsPageLayout title={title} backHref="/student/webinars">
      <WebinarDetailPanel
        webinarId={webinarId}
        onWebinarChange={(webinar) => setTitle(webinar.title || "Webinar")}
      />
    </WebinarsPageLayout>
  );
}
