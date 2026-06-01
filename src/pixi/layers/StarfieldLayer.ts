import {
  Container,
  NoiseFilter,
  Particle,
  ParticleContainer,
  type Texture,
  type Ticker,
} from "pixi.js";
import type { PixiLayer } from "@/pixi/types";
import {
  createCircleTexture,
  prefersReducedMotion,
  randomRange,
  STAR_COLORS,
} from "@/pixi/utils";

interface StarParticle {
  particle: Particle;
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  minRadius: number;
}

export class StarfieldLayer implements PixiLayer {
  private readonly root = new Container();
  private readonly particles = new ParticleContainer<Particle>({
    dynamicProperties: {
      position: true,
      color: true,
      rotation: false,
      vertex: true,
    },
  });
  private readonly texture: Texture;
  private readonly reduced = prefersReducedMotion();
  private readonly mouse = { x: -9999, y: -9999 };
  private stars: StarParticle[] = [];
  private width = 0;
  private height = 0;
  private readonly onMouseMove = (event: MouseEvent) => {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  };

  constructor() {
    this.texture = createCircleTexture(32);
    this.root.alpha = 0.86;
    this.root.filters = [new NoiseFilter({ noise: 0.012, seed: Math.random() })];
    this.root.addChild(this.particles);
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
    if (!this.reduced) {
      window.addEventListener("mousemove", this.onMouseMove, { passive: true });
    }
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.prepare(width, height);
  }

  update(ticker: Ticker, _width?: number, _height?: number): void {
    if (this.reduced) return;

    const delta = Math.min(2, ticker.deltaTime);
    for (const star of this.stars) {
      star.x += star.dx * delta;
      star.y += star.dy * delta;

      if (star.x + star.radius > this.width || star.x - star.radius < 0) {
        star.dx *= -1;
      }
      if (star.y + star.radius > this.height || star.y - star.radius < 0) {
        star.dy *= -1;
      }

      const distX = this.mouse.x - star.x;
      const distY = this.mouse.y - star.y;
      const close = Math.abs(distX) < 54 && Math.abs(distY) < 54;
      if (close) {
        star.radius = Math.min(star.radius + 0.08 * delta, 1.7);
      } else {
        star.radius = Math.max(star.radius - 0.08 * delta, star.minRadius);
      }

      star.particle.x = star.x;
      star.particle.y = star.y;
      const scale = (star.radius * 2) / 32;
      star.particle.scaleX = scale;
      star.particle.scaleY = scale;
    }
  }

  destroy(): void {
    window.removeEventListener("mousemove", this.onMouseMove);
    this.root.destroy({ children: true });
    this.texture.destroy(true);
  }

  private prepare(width: number, height: number): void {
    const count = width < 768 ? 420 : 860;
    this.particles.particleChildren.length = 0;
    this.stars = [];

    for (let i = 0; i < count; i++) {
      const radius = randomRange(0.45, 1.1);
      const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      const particle = new Particle({
        texture: this.texture,
        x: Math.random() * width,
        y: Math.random() * height,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: (radius * 2) / 32,
        scaleY: (radius * 2) / 32,
        tint: color,
        alpha: randomRange(0.25, 0.92),
      });
      this.particles.particleChildren.push(particle);
      this.stars.push({
        particle,
        x: particle.x,
        y: particle.y,
        dx: randomRange(-0.75, 0.75),
        dy: randomRange(-1.1, -0.15),
        radius,
        minRadius: radius,
      });
    }

    this.particles.update();
  }
}
