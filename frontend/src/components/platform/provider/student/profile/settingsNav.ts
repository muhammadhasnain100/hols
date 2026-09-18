import type { SidebarIconName } from "@/components/platform/provider/sidebar-icons";

export type SettingsSection = "profile" | "card" | "orders";

export type SettingsNavItem = {
  id: SettingsSection;
  href: string;
  label: string;
  shortLabel: string;
  icon: SidebarIconName;
  exact?: boolean;
};

export const SETTINGS_NAV: readonly SettingsNavItem[] = [
  {
    id: "profile",
    href: "/student/profile",
    label: "Profile information",
    shortLabel: "Profile",
    icon: "profile",
    exact: true,
  },
  {
    id: "card",
    href: "/student/profile/card",
    label: "Payment card",
    shortLabel: "Card",
    icon: "payment",
  },
  {
    id: "orders",
    href: "/student/profile/orders",
    label: "Orders",
    shortLabel: "Orders",
    icon: "orders",
  },
];
