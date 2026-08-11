/** Force the portal/document viewport back to the top (instant). */
export function scrollAppToTop() {
  if (typeof window === "undefined") return;

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const roots = document.querySelectorAll<HTMLElement>(
    ".portal-content-area, .portal-shell, .dashboard-screen, main",
  );
  roots.forEach((node) => {
    node.scrollTop = 0;
  });

  // Walk ancestors of main in case an unexpected overflow parent is the scroller.
  let node: HTMLElement | null = document.querySelector("main");
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollTop > 0
    ) {
      node.scrollTop = 0;
    }
    node = node.parentElement;
  }
}

/** Scroll now, after paint, and once more after layout settles. */
export function scrollAppToTopSoon() {
  scrollAppToTop();
  requestAnimationFrame(() => {
    scrollAppToTop();
    window.setTimeout(scrollAppToTop, 50);
    window.setTimeout(scrollAppToTop, 200);
  });
}
