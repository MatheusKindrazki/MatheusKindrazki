"use client";

import { useEffect, useState } from "react";

/**
 * Canonical "mobile-flow" signal — the JS twin of the shell's CSS release.
 *
 * shell.module.css releases the fixed-height snap viewport at `max-width:
 * 820px` (the shell becomes height:auto, snap is disabled, sections flow in
 * natural height). Routes that drive their own layout in JS — parallax via
 * useScroll, a scroll-jacking rAF (skills' gravity field), or a forced
 * fixed-height/!scroll wrapper — must DISABLE that logic when the shell is
 * released, or they fight it and push content off-screen (the /now, /skills,
 * /contato P0s).
 *
 * This hook returns `true` exactly when that CSS release is active, so route
 * code can gate the desktop-only behavior on `!isMobileFlow`. It is:
 *  - width-based only (mirrors the CSS media query precisely — NOT touch- or
 *    UA-based, so a desktop with a touchscreen or a >820px landscape tablet
 *    stays on the desktop path);
 *  - SSR-safe (returns `false` until mounted, matching the desktop-first CSS
 *    default before the media query applies);
 *  - resize-reactive via matchMedia.
 *
 * The breakpoint is exported so it stays the single source of truth shared
 * with the CSS (keep them in lockstep).
 */
export const MOBILE_FLOW_MAX_WIDTH = 820;

const QUERY = `(max-width: ${MOBILE_FLOW_MAX_WIDTH}px)`;

export function useMobileFlow(): boolean {
  const [isMobileFlow, setIsMobileFlow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const update = () => setIsMobileFlow(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobileFlow;
}

export default useMobileFlow;
