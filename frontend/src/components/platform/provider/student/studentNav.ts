import { portalIcons, type PortalNavItem } from "@/components/platform/provider/PortalShell";

export const studentNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/student", icon: portalIcons.dashboard, exact: true },
  { label: "Lectures", href: "/student/lectures", icon: portalIcons.courses },
  { label: "Calculator", href: "/student/calculator", icon: portalIcons.calculator },
  { label: "Peptide Adviser", href: "/student/adviser", icon: portalIcons.adviser },
  {
    label: "Payment",
    href: "/student/payment",
    icon: portalIcons.payment,
    children: [
      { label: "Membership", href: "/student/payment", exact: true },
      { label: "Orders", href: "/student/payment/orders" },
      { label: "Payment card", href: "/student/payment/card" },
    ],
  },
  { label: "Profile", href: "/student/profile", icon: portalIcons.profile },
];
