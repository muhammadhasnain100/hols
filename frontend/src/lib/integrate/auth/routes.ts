import type { UserRole } from "@/lib/integrate/auth/types";

const portalPaths: Record<UserRole, string> = {
  student: "/student",
  admin: "/admin",
  affiliate: "/affiliate",
};

export function getPortalPath(role: UserRole): string {
  return portalPaths[role];
}

export const portalLabels: Record<UserRole, string> = {
  student: "Student Portal",
  admin: "Admin Portal",
  affiliate: "Affiliate Portal",
};
