import type { UserRole } from "@/lib/integrate/auth/types";

const portalPaths: Record<UserRole, string> = {
  student: "/student",
  admin: "/admin",
  affiliate: "/affiliate",
};

const loginPaths: Record<UserRole, string> = {
  student: "/login",
  admin: "/login/admin",
  affiliate: "/login/affiliate",
};

export function getPortalPath(role: UserRole): string {
  return portalPaths[role];
}

export function getLoginPath(role: UserRole = "student"): string {
  return loginPaths[role];
}

export function parseLoginRole(value?: string | null): UserRole {
  if (value === "admin" || value === "affiliate") return value;
  return "student";
}

export const portalLabels: Record<UserRole, string> = {
  student: "Student Portal",
  admin: "Admin Portal",
  affiliate: "Affiliate Portal",
};
