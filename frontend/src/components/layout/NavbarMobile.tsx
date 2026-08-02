"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Menu, X } from "@/components/icons";
import { mainNav } from "@/content/navigation";
import { Button } from "@/components/ui/Button";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { getButtonClassName } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

export function NavbarMobile() {
  const [open, setOpen] = useState(false);
  const { setPaused } = useSmoothScroll();

  useEffect(() => {
    setPaused(open);
  }, [open, setPaused]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((prev) => !prev)}
        className={getButtonClassName("glass", "h-10 w-10 p-0", "sm")}
      >
        <span className="sr-only">Menu</span>
        {open ? <Icon icon={X} size={20} strokeWidth={2} /> : <Icon icon={Menu} size={20} strokeWidth={2} />}
      </button>

      <div
        data-lenis-prevent
        className={cn(
          "absolute inset-x-0 top-16 px-4 py-4 transition-all duration-300",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="glass-panel rounded-2xl px-6 py-6">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-sans text-base font-medium text-primary/80 transition-colors duration-300 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-white/40 pt-4">
              <Button href="/login" variant="glass" onClick={() => setOpen(false)}>
                Log in
              </Button>
              <Button href="/register" variant="primary" onClick={() => setOpen(false)}>
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
