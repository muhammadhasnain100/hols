"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { blogCategories } from "@/content/blog";
import { cn } from "@/lib/utils";

export function BlogFilters() {
  const [active, setActive] = useState<string>("All");

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {["All", ...blogCategories].map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => setActive(category)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition-colors",
            active === category
              ? "border-primary bg-primary text-white"
              : "border-border/60 text-muted hover:border-primary/30 hover:text-primary",
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export function NewsletterBlock() {
  return (
    <div className="rounded-2xl border border-border/50 bg-primary/[0.03] p-8 text-center md:p-12">
      <h3 className="font-sans text-xl font-semibold text-primary md:text-2xl">
        Practical insights, straight to your inbox.
      </h3>
      <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
        New guides, research, and updates — no spam, just what&apos;s useful for
        your clinic.
      </p>
      <form
        className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          placeholder="Your email"
          className="flex-1 rounded-full border border-border/60 bg-white px-5 py-3 text-sm outline-none focus:border-primary-light"
          required
        />
        <Button type="submit" variant="primary">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
