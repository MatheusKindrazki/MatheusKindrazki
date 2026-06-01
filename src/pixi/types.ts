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
  /** Max particle count cap. Default 30000. Raise for a solid, filled photo. */
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

export interface PixiSceneState {
  portrait: PortraitSceneConfig | null;
  blackHole: BlackHoleSceneConfig | null;
}
