import { notFound } from "next/navigation";
import { HeroNavbar } from "@/components/hero/HeroNavbar";
import { ArticleTemplate } from "@/components/blog/ArticleTemplate";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Article not found | House of Life Sciences" };
  }

  return {
    title: `${post.title} | House of Life Sciences`,
    description: post.teaser,
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <HeroNavbar variant="landing" />
      <ArticleTemplate post={post} />
    </>
  );
}
