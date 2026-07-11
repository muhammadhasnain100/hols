import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";

const titles: Record<string, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  "medical-disclaimer": "Medical Disclaimer",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: `${titles[slug] ?? "Legal"} | House of Life Sciences`,
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = titles[slug] ?? "Legal";

  return (
    <Section variant="default" className="pt-20">
      <PageHero
        headline={title}
        subhead="This page is coming soon."
        centered
      />
    </Section>
  );
}
