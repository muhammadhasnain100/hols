import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AffiliateReferralsPage } from "@/components/platform/provider/affiliate";

export default function AffiliateReferralsRoute() {
  return (
    <PortalGate role="affiliate">
      <AffiliateReferralsPage />
    </PortalGate>
  );
}
