import {
  parsePortalTheme,
  PORTAL_THEME_CHANGE_EVENT,
  PORTAL_THEME_KEY,
  type PortalTheme,
} from "@/components/platform/provider/portal-theme";

/** In-memory theme so soft navigations remount PortalShell without a dark flash. */
let portalThemeMemory: PortalTheme | null = null;

export function getPortalThemeMemory() {
  return portalThemeMemory;
}

export function setPortalThemeMemory(theme: PortalTheme | null) {
  portalThemeMemory = theme;
}

export function readStoredPortalTheme(): PortalTheme {
  if (portalThemeMemory) return portalThemeMemory;

  if (typeof document !== "undefined") {
    const fromHtml = parsePortalTheme(document.documentElement.getAttribute("data-portal-theme"));
    if (fromHtml) {
      portalThemeMemory = fromHtml;
      return fromHtml;
    }
  }

  try {
    const stored = parsePortalTheme(localStorage.getItem(PORTAL_THEME_KEY));
    if (stored) {
      portalThemeMemory = stored;
      return stored;
    }
  } catch {
    // Ignore storage access errors (private mode, etc.).
  }
  return "dark";
}

export function subscribePortalTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PORTAL_THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PORTAL_THEME_CHANGE_EVENT, onStoreChange);
  };
}

export function getPortalThemeSnapshot(): PortalTheme {
  return readStoredPortalTheme();
}

export function writePortalTheme(next: PortalTheme) {
  portalThemeMemory = next;
  try {
    localStorage.setItem(PORTAL_THEME_KEY, next);
  } catch {
    // Ignore storage write errors.
  }
  try {
    document.documentElement.setAttribute("data-portal-theme", next);
    document.cookie = `${PORTAL_THEME_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Ignore document write errors.
  }
  window.dispatchEvent(new Event(PORTAL_THEME_CHANGE_EVENT));
}
