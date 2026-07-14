import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminUserDetailPage } from "@/components/platform/provider/admin/users/AdminUserDetailPage";

type AdminUserRouteProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserRoute({ params }: AdminUserRouteProps) {
  const { userId } = await params;

  return (
    <PortalGate role="admin">
      <AdminUserDetailPage userId={userId} />
    </PortalGate>
  );
}
