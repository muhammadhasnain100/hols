import { cookies } from "next/headers";
import {
  parsePortalTheme,
  PORTAL_THEME_COOKIE,
  type PortalTheme,
} from "@/components/platform/provider/portal-theme";
import { PortalThemeProvider } from "@/components/platform/provider/PortalThemeProvider";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const initialTheme: PortalTheme =
    parsePortalTheme(jar.get(PORTAL_THEME_COOKIE)?.value) ?? "dark";

  return <PortalThemeProvider initialTheme={initialTheme}>{children}</PortalThemeProvider>;
}
