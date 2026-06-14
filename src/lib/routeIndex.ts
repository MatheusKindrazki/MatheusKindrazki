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

/**
 * Deterministic per-route sky coordinates (RA/dec-flavored degrees) — the
 * conceit is that the site is a telescope parked over Curitiba (−25.42 / −49.27)
 * and every navigation is a slew to a new target. Single source for the
 * TransitionLayer telemetry band (ΔRA readout), the portrait explode's
 * directional streak, and any future system map.
 */
export interface RouteCoord {
  /** Right-ascension-flavored degrees (screen-x axis of a slew). */
  ra: number
  /** Declination-flavored degrees (screen-y axis of a slew). */
  dec: number
}

export interface RouteMeta {
  index: string
  label: string
  accent: ThemeColor
  coord: RouteCoord
}

/** Curitiba — where the telescope (and the author) lives. */
const ORIGIN: RouteCoord = { ra: -49.27, dec: -25.42 }

const ROUTE_META: Record<string, RouteMeta> = {
  '/': { index: '01', label: 'co-founder & builder', accent: 'yellow', coord: ORIGIN },
  '/projetos': { index: '02', label: 'projects', accent: 'green', coord: { ra: -41.93, dec: -19.58 } },
  '/skills': { index: '03', label: 'skills', accent: 'blue', coord: { ra: -57.66, dec: -31.04 } },
  '/sobre': { index: '04', label: 'about', accent: 'yellow', coord: { ra: -36.87, dec: -12.31 } },
  '/contato': { index: '05', label: 'contact', accent: 'red', coord: { ra: -63.02, dec: -7.85 } },
  '/now': { index: '06', label: 'now', accent: 'green', coord: { ra: -44.55, dec: -1.92 } },
}

const FALLBACK: RouteMeta = { index: '—', label: 'kindra', accent: 'yellow', coord: ORIGIN }

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

/** Sky coordinate for a pathname — unknown routes park at the Curitiba origin. */
export function getRouteCoord(pathname: string | null | undefined): RouteCoord {
  return getRouteMeta(pathname).coord
}

export default getRouteIndex
