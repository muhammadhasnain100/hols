import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminWebinarDetailPage } from "@/components/platform/provider/admin/webinars/AdminWebinarDetailPage";

type PageProps = {
  params: Promise<{ webinarId: string }>;
};

export default async function AdminWebinarDetailRoute({ params }: PageProps) {
  const { webinarId } = await params;
  return (
    <PortalGate role="admin">
      <AdminWebinarDetailPage webinarId={webinarId} />
    </PortalGate>
  );
}
