"use client";

/**
 * PageTransition — thin wrapper around the Galactic Aperture overlay system.
 *
 * The actual three-phase transition logic (collapse → void → expand) lives
 * in `GalacticAperture`. This file is kept as the public entry point so the
 * rest of the app can import a single, stable name for "the site transition."
 */

import GalacticAperture from "@/components/layout/GalacticAperture";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return <GalacticAperture>{children}</GalacticAperture>;
}
