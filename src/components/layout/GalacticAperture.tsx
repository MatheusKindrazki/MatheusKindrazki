"use client";

/**
 * GalacticAperture — the signature page-transition overlay.
 *
 * Three-phase cinematic transition between routes:
 *
 *   1. COLLAPSE  (0–380ms)  — radial aperture mask closes from edge to center
 *                             via `mask-image` radial-gradient whose inner stop
 *                             shrinks 100% → 0%. The outgoing page is progressively
 *                             blacked out. Driven by `transform`-free mask animation
 *                             (mask-position is GPU-friendly; we animate the stop
 *                             via a CSS custom property to keep it compositor-only).
 *
 *   2. VOID      (380–520ms) — pure black hold. A single 1px yellow scan-line
 *                             sweeps top→bottom with a soft glow. A centered HUD
 *                             counter `02 → 05` announces the jump in uppercase
 *                             tracked meta. Both are decorative (aria-hidden).
 *
 *   3. EXPAND    (520–900ms) — aperture reopens (inner stop 0% → 100%) revealing
 *                             the incoming route from the center outward.
 *
 * Reduced-motion: collapses the whole thing to a single 180ms black cross-fade.
 *
 * The outgoing home→other nav uses a particle-explode on `src/app/page.tsx` that
 * calls `router.push` after the explode finishes. To avoid doubling up on that
 * already-cinematic exit, when the previous pathname is `/` we *skip* the
 * COLLAPSE phase (the explode was the collapse) and go straight to a short VOID
 * + EXPAND. Symmetrically, when arriving at `/` the home canvas plays its
 * particle-assemble animation on mount — we let the overlay fully fade to
 * transparent during EXPAND but skip the `scale` stamp on content so the
 * particles can do their thing without visual conflict.
 *
 * SSR: the overlay is gated behind a client-mount flag; no black stamp on
 * initial paint, no hydration mismatch.
 *
 * Performance: only `opacity`, `transform`, and a CSS custom property driving
 * `mask-image`'s radial stop are animated. No width/height/top/left jank.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getRouteIndex } from "@/lib/routeIndex";

type Phase = "idle" | "collapse" | "void" | "expand";

// Timings (ms). Sum ≈ 900ms for full transitions.
const T_COLLAPSE = 380;
const T_VOID = 140;
const T_EXPAND = 380;
const T_REDUCED = 180;

const EASE = [0.19, 1, 0.22, 1] as const;

interface GalacticApertureProps {
  children: React.ReactNode;
}

export default function GalacticAperture({ children }: GalacticApertureProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Remember the last pathname so we can decide whether to skip phases
  // (home-origin departure = no collapse; home arrival = soft expand).
  const prevPathRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fromIndex, setFromIndex] = useState<string>("");
  const [toIndex, setToIndex] = useState<string>("");

  // Track whether this is the very first client render (no transition on
  // initial load — we shouldn't stamp a black overlay over the hero).
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isFirstRenderRef.current) {
      prevPathRef.current = pathname;
      isFirstRenderRef.current = false;
      return;
    }
    const prev = prevPathRef.current;
    const next = pathname;
    if (prev === next) return;

    const prevIdx = getRouteIndex(prev);
    const nextIdx = getRouteIndex(next);
    setFromIndex(prevIdx);
    setToIndex(nextIdx);
    prevPathRef.current = next;

    // Reduced-motion: single short cross-fade via the overlay opacity.
    if (reduceMotion) {
      setPhase("void");
      const t = window.setTimeout(() => setPhase("idle"), T_REDUCED);
      return () => window.clearTimeout(t);
    }

    const leavingFromHome = prev === "/";

    // Full sequence scheduler. Skip COLLAPSE when leaving home — the particle
    // explode is the exit. Always play VOID + EXPAND so the arrival feels
    // cohesive across the whole site.
    const timers: number[] = [];
    const schedule = (delay: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, delay));
    };

    if (leavingFromHome) {
      setPhase("void");
      schedule(T_VOID, () => setPhase("expand"));
      schedule(T_VOID + T_EXPAND, () => setPhase("idle"));
    } else {
      setPhase("collapse");
      schedule(T_COLLAPSE, () => setPhase("void"));
      schedule(T_COLLAPSE + T_VOID, () => setPhase("expand"));
      schedule(T_COLLAPSE + T_VOID + T_EXPAND, () => setPhase("idle"));
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname, mounted, reduceMotion]);

  // Overlay opacity by phase: the overlay is only visually present during a
  // transition. At `idle` it's fully transparent and receives no pointer events.
  const overlayActive = phase !== "idle";

  return (
    <>
      {children}
      {mounted && (
        <ApertureOverlay
          phase={phase}
          reduceMotion={!!reduceMotion}
          fromIndex={fromIndex}
          toIndex={toIndex}
          active={overlayActive}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Overlay                                  */
/* -------------------------------------------------------------------------- */

interface ApertureOverlayProps {
  phase: Phase;
  reduceMotion: boolean;
  fromIndex: string;
  toIndex: string;
  active: boolean;
}

function ApertureOverlay({
  phase,
  reduceMotion,
  fromIndex,
  toIndex,
  active,
}: ApertureOverlayProps) {
  // The mask radius is a single CSS custom property `--aperture`. During
  // COLLAPSE we animate it 120% → 0% (slight overshoot so the black edge
  // finishes cleanly off-screen). During EXPAND we animate 0% → 120%.
  // A value of 120% also means when `idle`, nothing is masked — the layer
  // simply isn't rendered.

  // Reduced-motion = plain black cross-fade, no mask, no scan, no HUD.
  if (reduceMotion) {
    return (
      <AnimatePresence>
        {active && (
          <motion.div
            key="aperture-reduced"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: T_REDUCED / 1000, ease: "linear" }}
            className="fixed inset-0 z-[55] pointer-events-none"
            style={{ backgroundColor: "#000" }}
          />
        )}
      </AnimatePresence>
    );
  }

  const showHud =
    (phase === "void" || phase === "collapse" || phase === "expand") &&
    fromIndex !== toIndex &&
    fromIndex !== "" &&
    toIndex !== "";

  // Aperture mask-image. During VOID the layer is solid black (no mask).
  // During COLLAPSE and EXPAND we animate `--aperture` via inline style.
  const apertureStyle: CSSProperties = {
    // The visible ring of "not masked" (page shows through) has a very
    // slight feather so the edge doesn't look like a hard clip.
    WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent 0%, transparent calc(var(--aperture, 120%) - 8%), #000 var(--aperture, 120%))`,
    maskImage: `radial-gradient(circle at 50% 50%, transparent 0%, transparent calc(var(--aperture, 120%) - 8%), #000 var(--aperture, 120%))`,
    backgroundColor: "#000",
  };

  // Build per-phase motion values for the mask radius. Framer-motion can
  // animate CSS custom properties directly — we pass them through
  // `initial` / `animate` typed loosely because the CSSProperties
  // index signature doesn't include custom props.
  let apertureInitial: Record<string, string> = { "--aperture": "120%" };
  let apertureAnimate: Record<string, string> = { "--aperture": "120%" };
  let apertureTransition: {
    duration: number;
    ease: number[] | "linear";
  } = {
    duration: T_COLLAPSE / 1000,
    ease: [...EASE] as number[],
  };

  if (phase === "collapse") {
    apertureInitial = { "--aperture": "120%" };
    apertureAnimate = { "--aperture": "0%" };
    apertureTransition = {
      duration: T_COLLAPSE / 1000,
      ease: [...EASE] as number[],
    };
  } else if (phase === "void") {
    apertureInitial = { "--aperture": "0%" };
    apertureAnimate = { "--aperture": "0%" };
    apertureTransition = {
      duration: T_VOID / 1000,
      ease: "linear",
    };
  } else if (phase === "expand") {
    apertureInitial = { "--aperture": "0%" };
    apertureAnimate = { "--aperture": "120%" };
    apertureTransition = {
      duration: T_EXPAND / 1000,
      ease: [...EASE] as number[],
    };
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="aperture"
          aria-hidden="true"
          className="fixed inset-0 z-[55] pointer-events-none"
          style={{ willChange: "opacity" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, ease: "linear" }}
        >
          {/* Aperture mask layer — solid black with an expanding/contracting
              transparent hole. Content behind shows through the hole. */}
          <motion.div
            className="absolute inset-0"
            style={{
              ...apertureStyle,
              willChange: "mask-image, -webkit-mask-image",
            }}
            initial={apertureInitial}
            animate={apertureAnimate}
            transition={apertureTransition}
          />

          {/* Void-phase scan line + HUD. Rendered only during the void hold. */}
          <AnimatePresence>
            {phase === "void" && (
              <>
                <motion.div
                  key="scanline"
                  className="absolute left-0 right-0 h-px"
                  style={{
                    backgroundColor: "var(--color-kindra-yellow, #e0a458)",
                    opacity: 0.7,
                    boxShadow:
                      "0 0 8px var(--color-kindra-yellow, #e0a458), 0 0 2px var(--color-kindra-yellow, #e0a458)",
                    willChange: "transform",
                    top: 0,
                  }}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: "100vh", opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    y: {
                      duration: T_VOID / 1000,
                      ease: "linear",
                    },
                    opacity: {
                      duration: 0.06,
                      ease: "linear",
                    },
                  }}
                />
                {showHud && (
                  <motion.div
                    key="hud"
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.08,
                      ease: "linear",
                    }}
                  >
                    <span
                      className="select-none uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        letterSpacing: "0.3em",
                        color: "var(--color-kindra-meta-mid, #9a9a9a)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span>{fromIndex}</span>
                      <span
                        aria-hidden="true"
                        style={{
                          margin: "0 0.9em",
                          color: "var(--color-kindra-meta-low, #7a7a7a)",
                        }}
                      >
                        →
                      </span>
                      <span
                        style={{
                          color: "var(--color-kindra-yellow, #e0a458)",
                        }}
                      >
                        {toIndex}
                      </span>
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
