"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterBlock } from "@/components/blog/BlogClient";
import { blogCategories, blogContent } from "@/content/blog";
import { getFeaturedPost, getPostsByCategory } from "@/lib/blog";
import { cn } from "@/lib/utils";

export function BlogIndex() {
  const featured = getFeaturedPost();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState<number>(blogContent.index.initialVisible);

  const filteredPosts = useMemo(
    () => getPostsByCategory(activeCategory as "All" | (typeof blogCategories)[number]),
    [activeCategory],
  );

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setVisibleCount(blogContent.index.initialVisible);
  };

  return (
    <>
      {featured && (
        <div className="mb-12 md:mb-16">
          <BlogCard
            slug={featured.slug}
            title={featured.title}
            teaser={featured.teaser}
            date={featured.date}
            category={featured.category}
            lastReviewed={featured.lastReviewed}
            featured
          />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
        {["All", ...blogCategories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === category
                ? "border-primary bg-primary text-white"
                : "border-border/60 bg-white text-muted hover:border-primary/30 hover:text-primary",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {visiblePosts.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
          {visiblePosts.map((post) => (
            <BlogCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              teaser={post.teaser}
              date={post.date}
              category={post.category}
              lastReviewed={post.lastReviewed}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-muted">
          No articles in this category yet.
        </p>
      )}

      {hasMore && (
        <div className="mt-10 text-center">
          <Button
            variant="secondary"
            onClick={() =>
              setVisibleCount((count) => count + blogContent.index.loadMoreCount)
            }
          >
            Load more
          </Button>
        </div>
      )}

      <div className="mt-16 md:mt-20">
        <NewsletterBlock />
      </div>
    </>
  );
}
