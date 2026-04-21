'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe hook that returns true when the user has requested reduced motion.
 *
 * Defaults to `false` on the server and on first client render so markup is
 * stable (no hydration mismatch). After mount we read the media query and
 * subscribe to changes so toggling the OS / DevTools preference live updates
 * every consumer.
 *
 * Use this inside non-react-three-fiber components or anywhere we can't depend
 * on framer-motion's own `useReducedMotion()`.
 */
export default function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')

    setReduced(mql.matches)

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)

    // Safari < 14 uses the deprecated addListener / removeListener API.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return reduced
}
