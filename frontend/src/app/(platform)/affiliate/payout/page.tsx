import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AffiliatePayoutPage } from "@/components/platform/provider/affiliate";

export default function AffiliatePayoutRoute() {
  return (
    <PortalGate role="affiliate">
      <AffiliatePayoutPage />
    </PortalGate>
  );
}
