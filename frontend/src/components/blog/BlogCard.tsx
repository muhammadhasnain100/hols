import Link from "next/link";
import { cn } from "@/lib/utils";
import { blogContent } from "@/content/blog";

type BlogCardProps = {
  slug: string;
  title: string;
  teaser: string;
  date: string;
  category: string;
  lastReviewed?: string;
  featured?: boolean;
};

export function BlogCard({
  slug,
  title,
  teaser,
  date,
  category,
  lastReviewed,
  featured = false,
}: BlogCardProps) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/50 bg-white transition-shadow hover:shadow-md",
        featured && "md:col-span-2 md:grid md:grid-cols-2",
      )}
    >
      <div
        className={cn(
          "bg-gradient-deep-intelligence",
          featured ? "min-h-48 md:min-h-full" : "h-40",
        )}
      />
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="rounded-full bg-primary/5 px-3 py-1 font-medium text-primary-light">
            {category}
          </span>
          <time dateTime={date}>{date}</time>
          {lastReviewed && (
            <span>Reviewed {lastReviewed}</span>
          )}
        </div>
        <h3
          className={cn(
            "mt-3 font-sans font-semibold text-primary group-hover:text-primary-light",
            featured ? "text-2xl" : "text-lg",
          )}
        >
          <Link href={`/blog/${slug}`}>{title}</Link>
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{teaser}</p>
      </div>
    </article>
  );
}
