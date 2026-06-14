import type { MetadataRoute } from "next";

/** Canonical production origin — matches `metadataBase` in app/layout.tsx. */
const BASE_URL = "https://kindrazki.dev";

/** The six public routes — mirrors ROUTE_META in src/lib/routeIndex.ts. */
const ROUTES = ["/", "/projetos", "/skills", "/sobre", "/contato", "/now"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // Content stamp injected by next.config.ts (last commit touching
  // src/lib/content.ts); falls back to build time when absent.
  const stamp = process.env.NEXT_PUBLIC_CONTENT_UPDATED_AT;
  const lastModified = stamp ? new Date(stamp) : new Date();

  return ROUTES.map((route) => ({
    // next.config.ts sets trailingSlash: true — the slashed form IS the
    // canonical URL (the bare form 308-redirects to it).
    url: route === "/" ? `${BASE_URL}/` : `${BASE_URL}${route}/`,
    lastModified,
    changeFrequency: route === "/now" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : 0.6,
  }));
}
