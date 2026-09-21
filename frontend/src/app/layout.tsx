import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Outfit } from "next/font/google";
import { BrandStyles } from "@/components/BrandStyles";
import {
  parsePortalTheme,
  PORTAL_THEME_COOKIE,
} from "@/components/platform/provider/portal-theme";
import { brand } from "@/config/brand";
import "./globals.css";

/**
 * Brand fonts: Google Sans (primary) + Gilroy (secondary).
 * These Google Fonts are temporary stand-ins until licensed files
 * are added under /public/fonts (see public/fonts/README.md).
 */
const primaryFont = DM_Sans({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const secondaryFont = Outfit({
  variable: "--font-secondary",
  subsets: ["latin"],
  weight: ["300", "800"],
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const portalTheme = parsePortalTheme(jar.get(PORTAL_THEME_COOKIE)?.value) ?? "dark";

  return (
    <html
      lang="en"
      data-portal-theme={portalTheme}
      suppressHydrationWarning
      className={`${primaryFont.variable} ${secondaryFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <BrandStyles />
        {children}
      </body>
    </html>
  );
}
