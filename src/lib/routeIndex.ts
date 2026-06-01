/**
 * Canonical route registry — single source of truth for everything the chrome
 * needs to know about a route: its HUD index, its human label, and its accent.
 *
 * Previously two registries drifted: this file (index only) and pixi/utils.ts
 * routeAccent() (accent only, and missing /now → white fallback). They are now
 * unified here; pixi consumes getRouteAccent() so the background tint and the
 * chrome index can never disagree.
 *
 * Indices are zero-padded two-digit strings to match the on-screen `01`, `02`
 * typographic convention used by PageChrome.
 */

import type { ThemeColor } from '@/lib/colors'

export interface RouteMeta {
  index: string
  label: string
  accent: ThemeColor
}

const ROUTE_META: Record<string, RouteMeta> = {
  '/': { index: '01', label: 'co-founder & builder', accent: 'yellow' },
  '/projetos': { index: '02', label: 'projects', accent: 'green' },
  '/skills': { index: '03', label: 'skills', accent: 'blue' },
  '/sobre': { index: '04', label: 'about', accent: 'yellow' },
  '/contato': { index: '05', label: 'contact', accent: 'red' },
  '/now': { index: '06', label: 'now', accent: 'green' },
}

const FALLBACK: RouteMeta = { index: '—', label: 'kindra', accent: 'yellow' }

/**
 * Resolve the full route meta for a pathname. Exact match first, then the
 * longest registered prefix (so deep routes like `/projetos/foo` inherit
 * `/projetos`). Unknown routes get a balanced fallback.
 */
export function getRouteMeta(pathname: string | null | undefined): RouteMeta {
  if (!pathname) return FALLBACK
  if (ROUTE_META[pathname]) return ROUTE_META[pathname]
  const prefix = Object.keys(ROUTE_META)
    .filter((k) => k !== '/' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return prefix ? ROUTE_META[prefix] : FALLBACK
}

/** Zero-padded HUD index for a pathname (e.g. "02"). */
export function getRouteIndex(pathname: string | null | undefined): string {
  return getRouteMeta(pathname).index
}

/** Theme accent for a pathname — the single source the Pixi tint reads. */
export function getRouteAccent(pathname: string | null | undefined): ThemeColor {
  return getRouteMeta(pathname).accent
}

export default getRouteIndex
