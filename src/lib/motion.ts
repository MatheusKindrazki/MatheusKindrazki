/**
 * Canonical framer-motion variants for the whole portfolio.
 *
 * These replace the copy-pasted stagger/fadeUp/slideUp definitions that had
 * already drifted across pages (y:20 dur 0.6 on home/skills/sobre/contato vs
 * y:24 dur 0.62 on projetos). Importing from one place keeps the entrance
 * choreography in lock-step as pages are migrated.
 *
 * Easing matches the global `--ease-smooth` token: cubic-bezier(0.19,1,0.22,1).
 */

import type { Variants } from 'framer-motion'

export const EASE_SMOOTH = [0.19, 1, 0.22, 1] as const

/** Parent container — staggers its direct children on enter. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

/** Slightly looser stagger for dense lists (ledgers, badge grids). */
export const staggerTight: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

/** Fade + rise — the default entrance for hero copy blocks and rows. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: EASE_SMOOTH },
  },
}

/** Pure fade — for chrome/HUD elements that should not translate. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1.4, delay: 0.7 } },
}

/** Horizontal slide-in — used by side rails and inline reveals. */
export const slideIn: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: EASE_SMOOTH },
  },
}

/** Active-item content swap (e.g. project dossier) — short fade+rise. */
export const swapUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE_SMOOTH },
} as const
