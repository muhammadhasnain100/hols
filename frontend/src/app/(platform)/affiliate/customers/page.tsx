import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AffiliateReferralsPage } from "@/components/platform/provider/affiliate";

export default function AffiliateCustomersRoute() {
  return (
    <PortalGate role="affiliate">
      <AffiliateReferralsPage />
    </PortalGate>
  );
}
