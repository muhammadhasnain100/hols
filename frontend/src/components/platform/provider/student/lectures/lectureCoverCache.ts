/**
 * In-memory lecture cover image cache — preload once, reuse across cards / pages.
 * Prevents vials and mode backgrounds from flashing reload on remount.
 */

const MODE_ASSETS = [
  "/assets/lectures/mode/light.png",
  "/assets/lectures/mode/dark.png",
] as const;

const LOGO_ASSETS = [
  "/assets/logo/hols-logo-light.png",
  "/assets/logo/hols-logo.png",
  "/assets/logo/hols-logo-mark-light.png",
  "/assets/logo/hols-logo-mark.png",
] as const;

const loadedSrcs = new Set<string>();
const inflight = new Map<string, Promise<void>>();
let sharedAssetsStarted = false;

function loadImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (loadedSrcs.has(src)) return Promise.resolve();

  const existing = inflight.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      loadedSrcs.add(src);
      inflight.delete(src);
      resolve();
    };
    img.onerror = () => {
      inflight.delete(src);
      resolve();
    };
    img.src = src;
  });

  inflight.set(src, promise);
  return promise;
}

/** Warm shared studio + logo assets once per session. */
export function preloadSharedLectureCoverAssets() {
  if (typeof window === "undefined" || sharedAssetsStarted) return;
  sharedAssetsStarted = true;
  for (const src of MODE_ASSETS) void loadImage(src);
  for (const src of LOGO_ASSETS) void loadImage(src);
}

/** Preload specific vial / book cover URLs (deduped). */
export function preloadLectureCoverSrcs(srcs: Array<string | undefined | null>) {
  if (typeof window === "undefined") return;
  preloadSharedLectureCoverAssets();
  for (const src of srcs) {
    if (src) void loadImage(src);
  }
}

export function isLectureCoverSrcCached(src: string) {
  return loadedSrcs.has(src);
}
