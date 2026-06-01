"use client";

import type { ReactNode } from "react";
import styles from "./shell.module.css";

type Measure = "narrow" | "wide" | "ledger";

interface SectionProps {
  children: ReactNode;
  /** Inner reading width — maps to a content-measure token. Default: narrow. */
  measure?: Measure;
  /** Skip the centered measure wrapper (page provides its own inner grid). */
  bare?: boolean;
  /** Extra className on the <section> (e.g. for a data-gravity-item parent). */
  className?: string;
  /** Extra className on the inner measure wrapper. */
  innerClassName?: string;
  /** Passthrough data attribute hook (e.g. data-gravity-item for skills). */
  "data-gravity-item"?: boolean;
}

/**
 * A snap-aligned full-height section with a tokenized inner measure.
 * Replaces the per-page `min-h-full snap-start flex items-center` +
 * `w-[90%] max-w-[650px] mx-auto` literals that had drifted across six
 * different widths.
 */
export default function Section({
  children,
  measure = "narrow",
  bare = false,
  className,
  innerClassName,
  ...rest
}: SectionProps) {
  return (
    <section className={`${styles.section} ${className ?? ""}`} {...rest}>
      {bare ? (
        children
      ) : (
        <div className={`${styles.measure} ${styles[measure]} ${innerClassName ?? ""}`}>
          {children}
        </div>
      )}
    </section>
  );
}
