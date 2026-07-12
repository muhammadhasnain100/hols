import { blogPosts, type BlogCategory, type BlogPost } from "@/content/blog";

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((post) => post.featured);
}

export function getGridPosts(): BlogPost[] {
  return blogPosts.filter((post) => !post.featured);
}

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: BlogCategory | "All"): BlogPost[] {
  if (category === "All") return blogPosts;
  return blogPosts.filter((post) => post.category === category);
}

export function getAllPostSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
