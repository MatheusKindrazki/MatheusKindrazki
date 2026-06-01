import { Container, Graphics, type Ticker } from "pixi.js";
import type { PixiLayer } from "@/pixi/types";
import { isPointerCursorAvailable, routeAccent } from "@/pixi/utils";

type CursorState = "default" | "link" | "drag";

export class CursorLayer implements PixiLayer {
  private readonly root = new Container();
  private readonly ring = new Graphics();
  private readonly dot = new Graphics();
  private enabled = false;
  private visible = false;
  private state: CursorState = "default";
  private accent = routeAccent("/");
  private mouseX = 0;
  private mouseY = 0;
  private ringX = 0;
  private ringY = 0;
  private hasMoved = false;

  private readonly onMove = (event: MouseEvent) => {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    if (!this.hasMoved) {
      this.hasMoved = true;
      this.ringX = this.mouseX;
      this.ringY = this.mouseY;
      this.visible = true;
    }
  };

  private readonly onDown = () => {
    this.state = "drag";
  };

  private readonly onUp = () => {
    const el = document.elementFromPoint(this.mouseX, this.mouseY);
    this.state = el && this.isInteractive(el) ? "link" : "default";
  };

  private readonly onOver = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target) return;
    if (this.state !== "drag") {
      this.state = this.isInteractive(target) ? "link" : "default";
    }
  };

  private readonly onLeave = () => {
    this.visible = false;
  };

  private readonly onEnter = () => {
    if (this.hasMoved) this.visible = true;
  };

  private readonly onResize = () => {
    this.setEnabled(isPointerCursorAvailable());
  };

  constructor() {
    this.root.addChild(this.ring);
    this.root.addChild(this.dot);
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
    this.setEnabled(isPointerCursorAvailable());
    window.addEventListener("resize", this.onResize);
  }

  setPath(pathname: string): void {
    this.accent = routeAccent(pathname);
  }

  resize(_width: number, _height: number): void {
    // Cursor geometry is rebuilt in update.
  }

  update(_ticker: Ticker, _width?: number, _height?: number): void {
    if (!this.enabled) return;
    this.ringX += (this.mouseX - this.ringX) * 0.15;
    this.ringY += (this.mouseY - this.ringY) * 0.15;
    this.draw();
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.setEnabled(false);
    this.root.destroy({ children: true });
  }

  private setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.root.visible = enabled;

    if (enabled) {
      document.body.classList.add("custom-cursor-active");
      window.addEventListener("mousemove", this.onMove, { passive: true });
      window.addEventListener("mousedown", this.onDown);
      window.addEventListener("mouseup", this.onUp);
      window.addEventListener("mouseover", this.onOver);
      document.addEventListener("mouseleave", this.onLeave);
      document.addEventListener("mouseenter", this.onEnter);
    } else {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", this.onMove);
      window.removeEventListener("mousedown", this.onDown);
      window.removeEventListener("mouseup", this.onUp);
      window.removeEventListener("mouseover", this.onOver);
      document.removeEventListener("mouseleave", this.onLeave);
      document.removeEventListener("mouseenter", this.onEnter);
      this.ring.clear();
      this.dot.clear();
    }
  }

  private draw(): void {
    const alpha = this.visible ? 1 : 0;
    let ringSize = 28;
    let dotSize = 4;
    let ringAlpha = 0.4;
    let ringWidth = 1;

    if (this.state === "link") {
      ringSize = 44;
      dotSize = 2;
      ringAlpha = 0.72;
    } else if (this.state === "drag") {
      ringSize = 18;
      dotSize = 4;
      ringAlpha = 1;
      ringWidth = 1.5;
    }

    this.ring
      .clear()
      .circle(this.ringX, this.ringY, ringSize / 2)
      .stroke({ color: this.accent, alpha: alpha * ringAlpha, width: ringWidth });
    this.dot
      .clear()
      .circle(this.mouseX, this.mouseY, dotSize / 2)
      .fill({ color: this.accent, alpha });
  }

  private isInteractive(el: Element): boolean {
    return (
      el.closest(
        'a, button, [role="button"], [data-cursor="link"], input, textarea, select, label',
      ) !== null
    );
  }
}
