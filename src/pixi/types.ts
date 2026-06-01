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
