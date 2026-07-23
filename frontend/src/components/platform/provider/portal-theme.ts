export const PORTAL_THEME_KEY = "hols-portal-theme";
export const PORTAL_THEME_COOKIE = "hols-portal-theme";
export const PORTAL_THEME_CHANGE_EVENT = "hols-portal-theme-change";

export type PortalTheme = "light" | "dark";

export function parsePortalTheme(value: string | null | undefined): PortalTheme | null {
  return value === "light" || value === "dark" ? value : null;
}

/** Runs before paint so light mode does not flash dark on refresh. */
export const PORTAL_THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(PORTAL_THEME_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")return;document.documentElement.setAttribute("data-portal-theme",t);document.cookie=k+"="+t+";path=/;max-age=31536000;SameSite=Lax";}catch(e){}})();`;
