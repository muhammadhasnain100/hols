import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters, NewsletterBlock } from "@/components/blog/BlogClient";
import { blogContent } from "@/content/blog";

export default function BlogPage() {
  return (
    <>
      <Section variant="gradient" className="pt-20 pb-16 md:pt-28">
        <PageHero
          headline={blogContent.hero.headline}
          subhead={blogContent.hero.subhead}
        />
      </Section>

      <Section variant="default">
        <BlogFilters />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <BlogCard {...blogContent.featured} featured />
          {blogContent.posts.map((post) => (
            <BlogCard key={post.slug} {...post} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="secondary">Load more</Button>
        </div>
      </Section>

      <Section variant="muted">
        <NewsletterBlock />
      </Section>
    </>
  );
}
