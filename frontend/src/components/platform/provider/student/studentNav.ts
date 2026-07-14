import { portalIcons, type PortalNavItem } from "@/components/platform/provider/PortalShell";

export const studentNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/student", icon: portalIcons.dashboard, exact: true },
  { label: "Lectures", href: "/student/lectures", icon: portalIcons.courses },
  { label: "Calculator", href: "/student/calculator", icon: portalIcons.calculator },
  { label: "Payment", href: "/student/payment", icon: portalIcons.payment },
  { label: "Profile", href: "/student/profile", icon: portalIcons.profile },
];
