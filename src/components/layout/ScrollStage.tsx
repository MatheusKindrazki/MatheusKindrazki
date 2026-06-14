"use client";

import { forwardRef, type ReactNode } from "react";
import styles from "./shell.module.css";

interface ScrollStageProps {
  children: ReactNode;
  className?: string;
}

/**
 * The inner snap-scroll layer inside a <PageShell>. Encapsulates the
 * overflow / scroll-snap / hidden-scrollbar behavior that was previously
 * copy-pasted as `relative z-10 h-full overflow-y-auto snap-y snap-mandatory`
 * on every page. Forwards its ref so pages that animate on scroll (skills'
 * gravity field) can still reach the scroll element.
 */
const ScrollStage = forwardRef<HTMLDivElement, ScrollStageProps>(
  function ScrollStage({ children, className }, ref) {
    return (
      <div ref={ref} className={`${styles.scroll} ${className ?? ""}`}>
        {children}
      </div>
    );
  },
);

export default ScrollStage;
