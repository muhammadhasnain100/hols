import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AffiliatePortal } from "@/components/platform/provider/affiliate";

export default function AffiliatePage() {
  return (
    <PortalGate role="affiliate">
      <AffiliatePortal />
    </PortalGate>
  );
}
