import { portalIcons, type PortalNavItem } from "@/components/platform/provider/PortalShell";

export const affiliateNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/affiliate", icon: portalIcons.dashboard, exact: true },
  { label: "Referrals", href: "/affiliate/referrals", icon: portalIcons.referrals },
  { label: "Earnings", href: "/affiliate/earnings", icon: portalIcons.earnings },
  { label: "Profile", href: "/affiliate/profile", icon: portalIcons.profile },
];
