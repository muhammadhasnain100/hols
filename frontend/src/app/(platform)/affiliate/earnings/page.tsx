import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AffiliateEarningsPage } from "@/components/platform/provider/affiliate";

export default function AffiliateEarningsRoute() {
  return (
    <PortalGate role="affiliate">
      <AffiliateEarningsPage />
    </PortalGate>
  );
}
