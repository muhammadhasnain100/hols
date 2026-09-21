export const PORTAL_THEME_KEY = "hols-portal-theme";
export const PORTAL_THEME_COOKIE = "hols-portal-theme";
export const PORTAL_THEME_CHANGE_EVENT = "hols-portal-theme-change";

export type PortalTheme = "light" | "dark";

export function parsePortalTheme(value: string | null | undefined): PortalTheme | null {
  return value === "light" || value === "dark" ? value : null;
}
