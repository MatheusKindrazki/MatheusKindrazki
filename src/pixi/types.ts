import type { Container, Ticker } from "pixi.js";

export interface PixiLayer {
  mount(parent: Container): void;
  resize(width: number, height: number): void;
  update(ticker: Ticker, width: number, height: number): void;
  destroy(): void;
}

export interface PortraitSceneConfig {
  imageSrc: string;
  maxWidth?: number;
  xOffset?: number;
  particleSize?: number;
  edgeFade?: number;
  /** Brightness boost for dark photos (1 = original, >1 lifts shadows). */
  brightness?: number;
  /** Pixel sampling step (lower = denser). Default 2. */
  density?: number;
  /**
   * Safety cap on the sampled particle count. Default 200000 — high enough
   * that the photo reads as a solid image; the adaptive quality governor and
   * mobile/dpr heuristics may thin the rendered set further at runtime.
   */
  maxParticles?: number;
  animate?: boolean;
  explode?: boolean;
  onExplodeComplete?: () => void;
}

export interface BlackHoleSceneConfig {
  src: string;
  alt?: string;
  className?: string;
  offsetX?: number;
  revealMedia?: boolean;
  onFormationComplete?: () => void;
}

/**
 * How a navigation slew renders:
 * - `streak-band`  — portrait particles streak toward the target + telemetry band.
 * - `streak`       — fast path for adjacent routes: streak + accent lerp, no band.
 * - `fade-band`    — routes without a portrait (/now): telemetry band over a soft
 *                    fade, never a dead wait, never a streak.
 */
export type SlewMode = "streak-band" | "streak" | "fade-band";

export interface SlewConfig {
  /** Monotonic id so identical back-to-back slews still retrigger effects. */
  id: number;
  fromPath: string;
  toPath: string;
  mode: SlewMode;
  /** Total slew duration in ms (drives explode rate and band life). */
  duration: number;
}

/** What callers pass to `beginSlew` — the context stamps the id. */
export type SlewRequest = Omit<SlewConfig, "id">;

export interface PixiSceneState {
  portrait: PortraitSceneConfig | null;
  blackHole: BlackHoleSceneConfig | null;
  slew: SlewConfig | null;
}
