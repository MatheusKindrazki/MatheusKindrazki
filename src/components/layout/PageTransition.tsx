"use client";

/**
 * PageTransition — stable wrapper for route content.
 *
 * The visual transition is rendered by PixiOverlayStage. This component stays
 * as a stable public boundary around the route tree.
 */

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}
