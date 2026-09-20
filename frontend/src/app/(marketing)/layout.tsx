import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScrollProvider>
      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      <Footer />
    </SmoothScrollProvider>
  );
}
