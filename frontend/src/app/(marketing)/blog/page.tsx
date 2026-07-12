import { HeroShell } from "@/components/layout/HeroShell";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { blogContent } from "@/content/blog";

export default function BlogPage() {
  return (
    <>
      <HeroShell variant="landing">
        <PageHero
          variant="landing"
          headline={blogContent.hero.headline}
          subhead={blogContent.hero.subhead}
        />
      </HeroShell>

      <Section variant="default" className="pt-10 md:pt-14">
        <BlogIndex />
      </Section>
    </>
  );
}
