import { Suspense } from "react";
import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminStudentsPage } from "@/components/platform/provider/admin/users/AdminStudentsPage";

type AdminAffiliateStudentsRouteProps = {
  params: Promise<{ affiliateId: string }>;
};

export default async function AdminAffiliateStudentsRoute({
  params,
}: AdminAffiliateStudentsRouteProps) {
  const { affiliateId } = await params;

  return (
    <PortalGate role="admin">
      <Suspense>
        <AdminStudentsPage key={affiliateId} affiliateId={affiliateId} />
      </Suspense>
    </PortalGate>
  );
}
