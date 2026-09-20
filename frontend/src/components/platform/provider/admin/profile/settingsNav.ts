import type { SidebarIconName } from "@/components/platform/provider/sidebar-icons";

export type AdminSettingsSection = "profile" | "payout";

export type AdminSettingsNavItem = {
  id: AdminSettingsSection;
  href: string;
  label: string;
  shortLabel: string;
  icon: SidebarIconName;
  exact?: boolean;
};

export const ADMIN_SETTINGS_NAV: readonly AdminSettingsNavItem[] = [
  {
    id: "profile",
    href: "/admin/profile",
    label: "Profile information",
    shortLabel: "Profile",
    icon: "profile",
    exact: true,
  },
  {
    id: "payout",
    href: "/admin/profile/payout",
    label: "Payout hold",
    shortLabel: "Payout",
    icon: "lock",
  },
];
