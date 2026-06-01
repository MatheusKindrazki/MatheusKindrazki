"use client";

import styles from "./ContentScrim.module.css";

interface ContentScrimProps {
  /**
   * Which side the reading column sits on — the scrim darkens that side so
   * text stays legible over a visual background on the opposite side.
   * Default: "left" (text left, photo/black-hole right).
   */
  side?: "left" | "right";
  /** Scrim strength. "strong" for busy photos, "soft" for subtle backgrounds. */
  intensity?: "soft" | "strong";
}

/**
 * A fixed, full-viewport reading scrim that lives behind the content but above
 * the visual background. Centralizes the per-page "left vignette" gradients
 * (sobre/home/projetos each hand-rolled their own) so every page with a photo
 * or black-hole background protects the text column the same way.
 */
export default function ContentScrim({
  side = "left",
  intensity = "strong",
}: ContentScrimProps) {
  return (
    <div
      aria-hidden
      className={`${styles.scrim} ${styles[side]} ${styles[intensity]}`}
    />
  );
}
