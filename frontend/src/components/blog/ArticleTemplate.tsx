import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { BlogPost } from "@/content/blog";

type ArticleTemplateProps = {
  post: BlogPost;
};

export function ArticleTemplate({ post }: ArticleTemplateProps) {
  return (
    <>
      <article className="bg-background pb-12 pt-28 md:pb-16 md:pt-32">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-light transition hover:text-primary"
            >
              <span aria-hidden>←</span>
              Back to blog
            </Link>

            <h1 className="mt-8 font-serif text-3xl leading-tight text-primary md:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <p className="mt-6 text-sm leading-relaxed text-muted md:text-base">
              {post.author}
              <span className="mx-2 text-border">·</span>
              Reviewed by {post.reviewedBy}
              <span className="mx-2 text-border">·</span>
              <time dateTime={post.date}>{post.date}</time>
              {post.updated && (
                <>
                  <span className="mx-2 text-border">·</span>
                  Updated {post.updated}
                </>
              )}
            </p>

            <div
              className="mt-10 overflow-hidden rounded-3xl border border-border/40 shadow-[0_12px_40px_rgba(21,39,68,0.08)]"
              aria-hidden
            >
              <div className="h-56 bg-gradient-science-haze md:h-72" />
            </div>

            <div className="prose-blog mt-10 space-y-6">
              {post.body.map((block, index) =>
                block.type === "h2" ? (
                  <h2
                    key={index}
                    className="pt-2 font-sans text-xl font-semibold text-primary md:text-2xl"
                  >
                    {block.content}
                  </h2>
                ) : (
                  <p
                    key={index}
                    className="text-base leading-relaxed text-muted md:text-lg md:leading-relaxed"
                  >
                    {block.content}
                  </p>
                ),
              )}
            </div>

            {post.sources.length > 0 && (
              <section className="mt-14 border-t border-border/40 pt-10">
                <h2 className="font-sans text-lg font-semibold text-primary">Sources</h2>
                <ul className="mt-4 space-y-3">
                  {post.sources.map((source) => (
                    <li key={source.label} className="text-sm leading-relaxed text-muted">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary-light transition hover:text-primary"
                        >
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {post.related.length > 0 && (
              <section className="mt-12 border-t border-border/40 pt-10">
                <h2 className="font-sans text-lg font-semibold text-primary">
                  Related lessons &amp; reference entries
                </h2>
                <ul className="mt-4 space-y-3">
                  {post.related.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary-light transition hover:text-primary"
                      >
                        <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-light">
                          {item.type}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </Container>
      </article>
    </>
  );
}
