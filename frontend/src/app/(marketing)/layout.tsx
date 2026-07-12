import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScrollProvider>
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScrollProvider>
  );
}
