import { Container, Graphics, Text, type Ticker } from "pixi.js";
import { getRouteIndex } from "@/lib/routeIndex";
import type { PixiLayer } from "@/pixi/types";
import { easeInOutCubic, KINDRA_COLORS, prefersReducedMotion } from "@/pixi/utils";

type TransitionPhase = "idle" | "collapse" | "void" | "expand";

const T_COLLAPSE = 380;
const T_VOID = 140;
const T_EXPAND = 380;
const T_REDUCED = 180;

export class TransitionLayer implements PixiLayer {
  private readonly root = new Container();
  private readonly mask = new Graphics();
  private readonly scanline = new Graphics();
  private readonly hud = new Text({
    text: "",
    style: {
      fontFamily: "Montserrat, sans-serif",
      fontSize: 10,
      fill: 0x9a9a9a,
      letterSpacing: 3,
    },
    anchor: 0.5,
  });
  private readonly reduced = prefersReducedMotion();
  private phase: TransitionPhase = "idle";
  private elapsed = 0;
  private prevPath: string | null = null;
  private fromIndex = "";
  private toIndex = "";

  constructor() {
    this.root.visible = false;
    this.root.addChild(this.mask);
    this.root.addChild(this.scanline);
    this.root.addChild(this.hud);
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
  }

  setPath(pathname: string): void {
    if (this.prevPath === null) {
      this.prevPath = pathname;
      return;
    }
    if (this.prevPath === pathname) return;

    const leavingFromHome = this.prevPath === "/";
    this.fromIndex = getRouteIndex(this.prevPath);
    this.toIndex = getRouteIndex(pathname);
    this.prevPath = pathname;
    this.elapsed = 0;
    this.phase = this.reduced ? "void" : leavingFromHome ? "void" : "collapse";
    this.root.visible = true;
  }

  resize(_width: number, _height: number): void {
    // All geometry is rebuilt every frame because the aperture radius is animated.
  }

  update(ticker: Ticker, width: number, height: number): void {
    if (this.phase === "idle") return;

    this.elapsed += ticker.deltaMS;
    this.advancePhase();
    this.draw(width, height);
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }

  private advancePhase(): void {
    if (this.reduced) {
      if (this.elapsed >= T_REDUCED) this.phase = "idle";
      return;
    }

    if (this.phase === "collapse" && this.elapsed >= T_COLLAPSE) {
      this.phase = "void";
      this.elapsed = 0;
    } else if (this.phase === "void" && this.elapsed >= T_VOID) {
      this.phase = "expand";
      this.elapsed = 0;
    } else if (this.phase === "expand" && this.elapsed >= T_EXPAND) {
      this.phase = "idle";
      this.elapsed = 0;
    }
  }

  private draw(width: number, height: number): void {
    if (this.phase === "idle") {
      this.root.visible = false;
      this.mask.clear();
      this.scanline.clear();
      this.hud.visible = false;
      return;
    }

    this.root.visible = true;
    this.mask.clear();
    this.scanline.clear();
    this.hud.visible = false;

    if (this.reduced) {
      const alpha = 1 - Math.min(1, this.elapsed / T_REDUCED);
      this.mask.rect(0, 0, width, height).fill({ color: 0x000000, alpha });
      return;
    }

    const maxR = Math.sqrt(width * width + height * height) * 0.62;
    const cx = width / 2;
    const cy = height / 2;

    if (this.phase === "void") {
      this.mask.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 1 });
      const y = (this.elapsed / T_VOID) * height;
      this.scanline.rect(0, y, width, 1).fill({ color: KINDRA_COLORS.yellow, alpha: 0.75 });
      this.scanline.rect(0, y - 4, width, 9).fill({ color: KINDRA_COLORS.yellow, alpha: 0.08 });
      if (this.fromIndex && this.toIndex && this.fromIndex !== this.toIndex) {
        this.hud.text = `${this.fromIndex}  ->  ${this.toIndex}`;
        this.hud.position.set(cx, cy);
        this.hud.visible = true;
      }
      return;
    }

    const duration = this.phase === "collapse" ? T_COLLAPSE : T_EXPAND;
    const raw = Math.min(1, this.elapsed / duration);
    const eased = easeInOutCubic(raw);
    const aperture = this.phase === "collapse" ? maxR * (1 - eased) : maxR * eased;

    this.mask
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 1 })
      .circle(cx, cy, Math.max(0.1, aperture))
      .cut();
  }
}
