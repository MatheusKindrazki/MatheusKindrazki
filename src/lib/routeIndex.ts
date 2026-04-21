/**
 * Canonical route → HUD index mapping.
 *
 * Kept as the single source of truth for the transition counter
 * (Galactic Aperture void phase) and any future chrome that needs
 * to display an index for a given route.
 *
 * Indices are zero-padded two-digit strings to match the on-screen
 * `01`, `02`, etc. typographic convention used by PageChrome.
 */

const ROUTE_INDEX: Record<string, string> = {
  "/": "01",
  "/projetos": "02",
  "/skills": "03",
  "/sobre": "04",
  "/contato": "05",
  "/now": "06",
};

/**
 * Returns the zero-padded index for a given pathname.
 *
 * Unknown pathnames (nested / future routes) fall back to an em-dash
 * so the HUD still renders a visually balanced glyph rather than
 * collapsing to an empty string.
 */
export function getRouteIndex(pathname: string | null | undefined): string {
  if (!pathname) return "—";
  // Exact match first; fall back to the longest prefix that exists
  // in the map (handles deep routes like `/projetos/foo` mapping to `/projetos`).
  if (ROUTE_INDEX[pathname]) return ROUTE_INDEX[pathname];
  const prefix = Object.keys(ROUTE_INDEX)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? ROUTE_INDEX[prefix] : "—";
}

export default getRouteIndex;
