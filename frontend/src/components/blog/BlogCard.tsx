import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogCategory } from "@/content/blog";

const categoryGradients: Record<BlogCategory, string> = {
  Guides: "bg-gradient-science-haze",
  Research: "bg-gradient-deep-intelligence",
  "Peptide Spotlights": "bg-gradient-bio-calm",
  "Product Updates": "bg-gradient-future-pulse",
};

type BlogCardProps = {
  slug: string;
  title: string;
  teaser: string;
  date: string;
  category: BlogCategory;
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
        "group overflow-hidden rounded-3xl border border-border/50 bg-white shadow-[0_8px_30px_rgba(21,39,68,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(21,39,68,0.10)]",
        featured && "md:grid md:grid-cols-2 md:items-stretch",
      )}
    >
      <Link
        href={`/blog/${slug}`}
        className={cn("block shrink-0", featured ? "h-52 md:h-auto md:min-h-[18rem]" : "h-44")}
      >
        <div
          className={cn(
            "relative h-full w-full",
            categoryGradients[category],
            featured ? "min-h-[13rem] md:min-h-full" : "h-44",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
          {!featured && (
            <span className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-primary-light backdrop-blur-sm">
              {category}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col justify-center p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <time dateTime={date}>{date}</time>
          {lastReviewed && <span>Last reviewed {lastReviewed}</span>}
        </div>

        <h3
          className={cn(
            "mt-3 font-sans font-semibold leading-snug text-primary transition-colors group-hover:text-primary-light",
            featured ? "text-2xl md:text-3xl" : "text-lg",
          )}
        >
          <Link href={`/blog/${slug}`}>{title}</Link>
        </h3>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted md:text-base">
          {teaser}
        </p>
      </div>
    </article>
  );
}
