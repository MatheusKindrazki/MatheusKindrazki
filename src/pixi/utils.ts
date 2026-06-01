import { Texture } from "pixi.js";
import { getRouteAccent } from "@/lib/routeIndex";
import type { ThemeColor } from "@/lib/colors";

export const KINDRA_COLORS = {
  green: 0x419d78,
  yellow: 0xe0a458,
  red: 0xd9594c,
  blue: 0x53a2be,
  gray: 0x666666,
  white: 0xffffff,
  black: 0x000000,
} as const;

/** Theme-color name → Pixi numeric hex, so the engine and CSS share one palette. */
const ACCENT_HEX: Record<ThemeColor, number> = {
  green: KINDRA_COLORS.green,
  yellow: KINDRA_COLORS.yellow,
  red: KINDRA_COLORS.red,
  blue: KINDRA_COLORS.blue,
  grayscale: KINDRA_COLORS.gray,
};

export const STAR_COLORS = [
  0x4c1a22,
  0x4c1a23,
  0x5d6268,
  0x1f2e37,
  0x474848,
  0x542619,
  0xead8cf,
  0x4c241f,
  0xd6b9b1,
  0x964a47,
] as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isPointerCursorAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth >= 768 &&
    !window.matchMedia("(hover: none)").matches &&
    !("ontouchstart" in window) &&
    !prefersReducedMotion()
  );
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createCircleTexture(size = 32): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.52, "rgba(255,255,255,0.82)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return Texture.from(canvas, true);
}

export function rgbToHex(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

export function getEdgeFade(
  x: number,
  y: number,
  w: number,
  h: number,
  fadeX: number,
  fadeY: number,
): number {
  let fx = 1;
  let fy = 1;

  if (x < fadeX) {
    fx = x / fadeX;
  } else if (x > w - fadeX) {
    fx = (w - x) / fadeX;
  }

  if (y < fadeY) {
    fy = y / fadeY;
  } else if (y > h - fadeY) {
    fy = (h - y) / fadeY;
  }

  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);

  return fx * fy;
}

export interface ImageParticleSeed {
  relX: number;
  relY: number;
  scatterX: number;
  scatterY: number;
  tint: number;
  alpha: number;
  depth: number;
}

/**
 * Lift a dark pixel toward visibility without blowing out highlights.
 * `amount` of 1 is a no-op; >1 brightens. Uses a gamma-style curve so shadows
 * open up more than midtones (dark portraits read on a black void), then a
 * mild gain. Clamped to 0-255.
 */
function boostChannel(value: number, amount: number): number {
  if (amount <= 1) return value;
  const norm = value / 255;
  const gamma = 1 / amount; // amount 1.6 → gamma ~0.625, lifts shadows
  const lifted = Math.pow(norm, gamma);
  return Math.min(255, Math.round(lifted * 255));
}

export async function createImageParticleSeeds(
  imageSrc: string,
  maxWidth = 700,
  xOffset = 250,
  edgeFade = 0.15,
  step = 2,
  maxParticles = 30000,
  brightness = 1,
): Promise<ImageParticleSeed[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${imageSrc}`));
    image.src = imageSrc;
  });

  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h).data;
  const fadeX = w * edgeFade;
  const fadeY = h * edgeFade;

  const candidates: ImageParticleSeed[] = [];

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (x + y * w) * 4;
      const pixelAlpha = pixels[i + 3] / 255;
      if (pixelAlpha <= 0.02) continue;

      const fade = getEdgeFade(x, y, w, h, fadeX, fadeY);
      if (fade <= 0.01) continue;

      // Jitter each sample off the rigid sampling grid by up to ±step/2.
      // Without this, every particle lands on an exact multiple of `step`,
      // so they line up into visible vertical/horizontal scanlines. The
      // jitter breaks that lattice into an organic point cloud.
      const jitterX = (Math.random() - 0.5) * step;
      const jitterY = (Math.random() - 0.5) * step;
      const relX = x - w / 2 + xOffset + jitterX;
      const relY = y - h / 2 + jitterY;
      const angle = Math.random() * Math.PI * 2;
      const dist = randomRange(360, 1120);

      candidates.push({
        relX,
        relY,
        scatterX: relX + Math.cos(angle) * dist,
        scatterY: relY + Math.sin(angle) * dist,
        tint: rgbToHex(
          boostChannel(pixels[i], brightness),
          boostChannel(pixels[i + 1], brightness),
          boostChannel(pixels[i + 2], brightness),
        ),
        alpha: clamp(pixelAlpha * fade),
        depth: Math.random(),
      });
    }
  }

  if (candidates.length <= maxParticles) return candidates;

  // Random (partial Fisher-Yates) downsample. A fixed-stride pick
  // (candidates[i * stride]) drops particles in a regular pattern — since the
  // array is row-major, that systematically thins whole columns and *amplifies*
  // the scanline look. Shuffling the first `maxParticles` slots picks an
  // unbiased random subset that keeps the cloud even.
  for (let i = 0; i < maxParticles; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }
  return candidates.slice(0, maxParticles);
}

/**
 * Pixi background tint for a route — derives from the single route registry
 * (lib/routeIndex.ts) so the WebGL accent and the chrome index never disagree.
 * Previously a parallel map here was missing /now and fell back to white.
 */
export function routeAccent(pathname: string | null): number {
  return ACCENT_HEX[getRouteAccent(pathname)];
}
