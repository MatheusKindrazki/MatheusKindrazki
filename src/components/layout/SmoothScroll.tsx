"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { cancelFrame, frame } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

interface SmoothScrollProps {
  children: ReactNode;
}

// Lenis smooth scroll bridged to framer-motion's animation frame loop so
// scroll-linked animations (useScroll/useTransform/useSpring) tick in sync
// with the smoothed scroll position, not the raw wheel/trackpad events.
//
// Pattern per lenis/react docs — autoRaf:false + frame.update(update, true)
// means framer-motion drives Lenis's internal RAF, keeping scroll and
// motion state on the same clock.
export default function SmoothScroll({ children }: SmoothScrollProps) {
  const reduceMotion = usePrefersReducedMotion();
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    if (reduceMotion) return;

    function update(data: { timestamp: number }) {
      const time = data.timestamp;
      lenisRef.current?.lenis?.raf(time);
    }

    frame.update(update, true);
    return () => cancelFrame(update);
  }, [reduceMotion]);

  if (reduceMotion) return <>{children}</>;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        // Longer duration = more perceived inertia. 1.6s is the sweet spot
        // for editorial scroll — short enough to feel responsive, long enough
        // that each wheel tick blends into momentum rather than staccato
        // frame-by-frame updates.
        duration: 1.6,
        // Exponential ease-out — matches --ease-smooth across the site.
        // Starts fast, settles gently; this is what gives trackpad the
        // "butter" feel instead of "raw delta mapped 1:1".
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Slightly under 1 softens the mapping of wheel deltas to scroll
        // distance, so aggressive trackpad flicks don't overshoot sections.
        wheelMultiplier: 0.85,
        touchMultiplier: 1.4,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
