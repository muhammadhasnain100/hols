"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNav } from "@/content/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function NavbarMobile() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-primary"
      >
        <span className="sr-only">Menu</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <div
        className={cn(
          "absolute inset-x-0 top-16 border-b border-border/40 bg-background px-6 py-6 shadow-lg transition-all",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav className="flex flex-col gap-4" aria-label="Mobile">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-base text-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4">
            <Button href="/login" variant="ghost">
              Log in
            </Button>
            <Button href="/contact" variant="primary">
              Get Started
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
