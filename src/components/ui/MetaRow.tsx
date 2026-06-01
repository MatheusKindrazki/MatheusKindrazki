"use client";

import { Fragment, type ReactNode } from "react";
import styles from "./MetaRow.module.css";

interface MetaRowProps {
  /** Items rendered with a `·` separator between them. */
  items: ReactNode[];
  /** Show the leading hairline rule. Default: true. */
  rule?: boolean;
  className?: string;
}

/**
 * The dot-separated meta footer that closes hero/quote sections:
 *   ──  idx.03 · 41 capabilities · still learning
 *
 * Replaces the per-page inline footer rows that each re-typed the
 * `h-px w-10 bg-[#222]` rule + `mx-2 text-[#2a2a2a] ·` separator with
 * drifting greys (now all tokens).
 */
export default function MetaRow({ items, rule = true, className }: MetaRowProps) {
  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      {rule && <span className={styles.rule} />}
      <span className={styles.items}>
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <span className={styles.dot}>·</span>}
            {item}
          </Fragment>
        ))}
      </span>
    </div>
  );
}
