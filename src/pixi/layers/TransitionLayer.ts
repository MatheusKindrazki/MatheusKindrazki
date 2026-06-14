import { Container, Graphics, Text, type Ticker } from "pixi.js";
import { getRouteCoord, getRouteIndex } from "@/lib/routeIndex";
import type { PixiLayer, SlewConfig, SlewMode } from "@/pixi/types";
import {
  clamp,
  easeInOutCubic,
  lerp,
  prefersReducedMotion,
  routeAccent,
} from "@/pixi/utils";

/**
 * TransitionLayer — the navigation "slew".
 *
 * The old full-screen iris (collapse → void → expand, ~900ms stacked on top
 * of the portrait explode) is retired. Navigation is now ONE continuous take:
 * the portrait particles streak toward the destination while this layer
 * renders a slim telemetry band in the route accent — mono-styled text like
 * `SLEW 01 → 04 · ΔRA +12.4° · ACQUIRING TARGET` — and lerps the accent from
 * the origin route's color to the destination's mid-flight.
 *
 * Modes (driven by PageShell via PixiSceneContext.beginSlew):
 * - `streak-band` — band + accent sweep over the portrait streak.
 * - `streak`      — fast path for adjacent routes: accent sweep only, no band.
 * - `fade-band`   — background-less routes (/now): band over a soft veil.
 *
 * Navigations that bypass the shell machine (browser back/forward) are caught
 * by `setPath` and get a synthesized fade-band so they are never a hard cut.
 *
 * Reduced motion: exactly the legacy 180ms full-screen fade on path change —
 * no band, no sweep, no streak.
 */

const T_REDUCED = 180;
/** Synthesized slew for untracked navigations (back/forward). */
const T_UNTRACKED = 600;
const BAND_HEIGHT = 30;

/** Per-channel lerp between two 0xRRGGBB colors. */
function lerpColor(a: number, b: number, t: number): number {
  const r = Math.round(lerp((a >> 16) & 0xff, (b >> 16) & 0xff, t));
  const g = Math.round(lerp((a >> 8) & 0xff, (b >> 8) & 0xff, t));
  const bl = Math.round(lerp(a & 0xff, b & 0xff, t));
  return (r << 16) | (g << 8) | bl;
}

/**
 * The band is data-voiced: read the design system's --font-data token
 * (IBM Plex Mono via next/font) off the document root. Hashed next/font
 * families can't be hardcoded, so this is resolved at construction.
 */
function resolveDataFont(): string {
  if (typeof document === "undefined") return "monospace";
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-data")
    .trim();
  return family || "monospace";
}

interface ActiveSlew {
  mode: SlewMode;
  duration: number;
  fromAccent: number;
  toAccent: number;
  /** Sweep direction: +1 sweeps left→right (ΔRA >= 0), −1 the reverse. */
  sweepDir: 1 | -1;
  showBand: boolean;
  fade: boolean;
}

export class TransitionLayer implements PixiLayer {
  private readonly root = new Container();
  private readonly veil = new Graphics();
  private readonly band = new Graphics();
  private readonly sweep = new Graphics();
  private readonly hud = new Text({
    text: "",
    style: {
      fontFamily: resolveDataFont(),
      fontSize: 10,
      fill: 0xffffff,
      letterSpacing: 3,
    },
    anchor: 0.5,
  });
  private readonly reduced = prefersReducedMotion();
  private slew: ActiveSlew | null = null;
  private elapsed = 0;
  private fading = false;
  private prevPath: string | null = null;
  /** Destination announced by beginSlew — lets setPath skip the fallback. */
  private expectedPath: string | null = null;

  constructor() {
    this.root.visible = false;
    this.root.addChild(this.veil);
    this.root.addChild(this.band);
    this.root.addChild(this.sweep);
    this.root.addChild(this.hud);
    this.hud.visible = false;
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
  }

  /** Begin a shell-driven slew at navigation start (before the route push). */
  beginSlew(config: SlewConfig): void {
    if (this.reduced) return; // reduced motion keeps only the setPath fade
    this.expectedPath = config.toPath;
    this.startSlew(config.fromPath, config.toPath, config.mode, config.duration);
  }

  setPath(pathname: string): void {
    if (this.prevPath === null) {
      this.prevPath = pathname;
      return;
    }
    if (this.prevPath === pathname) return;

    const from = this.prevPath;
    this.prevPath = pathname;

    if (this.reduced) {
      // Legacy reduced-motion behavior, verbatim: a 180ms full-screen fade.
      this.fading = true;
      this.elapsed = 0;
      this.root.visible = true;
      return;
    }

    if (this.expectedPath === pathname) {
      // The band for this navigation is already mid-flight — let it ride
      // across the route swap (that continuity IS the single take).
      this.expectedPath = null;
      return;
    }

    // Untracked navigation (browser back/forward, external pushes): a short
    // synthesized fade-band so the swap is never a naked hard cut.
    this.startSlew(from, pathname, "fade-band", T_UNTRACKED);
  }

  resize(_width: number, _height: number): void {
    // Geometry is rebuilt every frame — the sweep and envelope are animated.
  }

  update(ticker: Ticker, width: number, height: number): void {
    if (!this.slew && !this.fading) return;

    this.elapsed += ticker.deltaMS;
    this.draw(width, height);
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }

  private startSlew(
    fromPath: string,
    toPath: string,
    mode: SlewMode,
    duration: number,
  ): void {
    const fromIndex = getRouteIndex(fromPath);
    const toIndex = getRouteIndex(toPath);
    const dRa = getRouteCoord(toPath).ra - getRouteCoord(fromPath).ra;
    const showBand = mode !== "streak" && fromIndex !== toIndex;

    if (showBand) {
      const sign = dRa >= 0 ? "+" : "-";
      this.hud.text = `SLEW ${fromIndex} → ${toIndex} · ΔRA ${sign}${Math.abs(dRa).toFixed(1)}° · ACQUIRING TARGET`;
    }

    this.slew = {
      mode,
      duration,
      fromAccent: routeAccent(fromPath),
      toAccent: routeAccent(toPath),
      sweepDir: dRa >= 0 ? 1 : -1,
      showBand,
      fade: mode === "fade-band",
    };
    this.fading = false;
    this.elapsed = 0;
    this.root.visible = true;
  }

  private clearGraphics(): void {
    this.veil.clear();
    this.band.clear();
    this.sweep.clear();
    this.hud.visible = false;
  }

  private endSlew(): void {
    this.slew = null;
    this.fading = false;
    this.clearGraphics();
    this.root.visible = false;
  }

  private draw(width: number, height: number): void {
    this.clearGraphics();

    if (this.fading) {
      // Reduced motion: the legacy 180ms fade, unchanged.
      if (this.elapsed >= T_REDUCED) {
        this.endSlew();
        return;
      }
      const alpha = 1 - Math.min(1, this.elapsed / T_REDUCED);
      this.veil.rect(0, 0, width, height).fill({ color: 0x000000, alpha });
      return;
    }

    const slew = this.slew;
    if (!slew) return;
    if (this.elapsed >= slew.duration) {
      this.endSlew();
      return;
    }

    const p = clamp(this.elapsed / slew.duration);
    const eased = easeInOutCubic(p);
    // Origin accent on departure, destination accent past mid-flight.
    const accent = lerpColor(slew.fromAccent, slew.toAccent, eased);
    // Envelope: quick rise, hold, release — the band never pops in or out.
    const envelope = Math.min(1, p / 0.15, (1 - p) / 0.2);
    const cy = height / 2;

    if (slew.fade) {
      // Background-less routes: a soft veil that peaks exactly mid-flight,
      // where PageShell schedules the route push — the swap hides inside it.
      this.veil
        .rect(0, 0, width, height)
        .fill({ color: 0x000000, alpha: 0.55 * Math.sin(p * Math.PI) });
    }

    // Accent sweep — the slew's motion cue. Grows across the screen in the
    // ΔRA direction; on fast-path navigations it is the whole transition.
    const sweepW = width * eased;
    const sweepX = slew.sweepDir === 1 ? 0 : width - sweepW;
    const sweepY = slew.showBand ? cy + BAND_HEIGHT / 2 + 8 : cy;
    this.sweep
      .rect(sweepX, sweepY - 4, sweepW, 9)
      .fill({ color: accent, alpha: 0.08 * envelope })
      .rect(sweepX, sweepY, sweepW, 1)
      .fill({ color: accent, alpha: 0.75 * envelope });

    if (slew.showBand) {
      const top = cy - BAND_HEIGHT / 2;
      this.band
        .rect(0, top, width, BAND_HEIGHT)
        .fill({ color: 0x000000, alpha: 0.78 * envelope })
        .rect(0, top, width, 1)
        .fill({ color: accent, alpha: 0.5 * envelope })
        .rect(0, top + BAND_HEIGHT - 1, width, 1)
        .fill({ color: accent, alpha: 0.5 * envelope });

      this.hud.position.set(width / 2, cy);
      this.hud.tint = accent;
      this.hud.alpha = envelope;
      this.hud.visible = true;
    }
  }
}
