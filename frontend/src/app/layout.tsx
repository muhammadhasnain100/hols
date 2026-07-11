import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { BrandStyles } from "@/components/BrandStyles";
import { brand } from "@/config/brand";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${primaryFont.variable} ${secondaryFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BrandStyles />
        {children}
      </body>
    </html>
  );
}
