"use client";

import styles from "./Eyebrow.module.css";

interface EyebrowProps {
  /** Zero-padded section index, e.g. "02". Optional. */
  index?: string;
  /** The label text after the index, e.g. "project atlas", "what i do". */
  label: string;
  /** Optional accent color CSS value for the brackets. Default: meta-low. */
  accent?: string;
  className?: string;
}

/**
 * The bracketed eyebrow / kicker that opens every hero and section:
 *   ──  [ / 02 — project atlas ]
 *
 * Promoted from the projetos `.kicker/.bracket/.separator` (which was locked
 * inside a private CSS module) and the five inline Tailwind reimplementations
 * that had drifted on tracking, rule width, and bracket color.
 */
export default function Eyebrow({ index, label, accent, className }: EyebrowProps) {
  return (
    <p className={`${styles.eyebrow} ${className ?? ""}`}>
      <span className={styles.rule} />
      <span>
        <span className={styles.bracket} style={accent ? { color: accent } : undefined}>
          [
        </span>{" "}
        {index && (
          <>
            <span className={styles.index}>/ {index}</span>{" "}
            <span className={styles.separator}>—</span>{" "}
          </>
        )}
        {label}{" "}
        <span className={styles.bracket} style={accent ? { color: accent } : undefined}>
          ]
        </span>
      </span>
    </p>
  );
}
