import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AffiliateProfilePage } from "@/components/platform/provider/affiliate";

export default function AffiliateProfileRoute() {
  return (
    <PortalGate role="affiliate">
      <AffiliateProfilePage />
    </PortalGate>
  );
}
