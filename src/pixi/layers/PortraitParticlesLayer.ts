import {
  Container,
  Particle,
  ParticleContainer,
  type Texture,
  type Ticker,
} from "pixi.js";
import type { PixiLayer, PortraitSceneConfig } from "@/pixi/types";
import {
  clamp,
  createCircleTexture,
  createImageParticleSeeds,
  easeInOutCubic,
  lerp,
  prefersReducedMotion,
} from "@/pixi/utils";

interface RuntimeParticle {
  particle: Particle;
  relX: number;
  relY: number;
  scatterX: number;
  scatterY: number;
  tint: number;
  alpha: number;
  depth: number;
}

export class PortraitParticlesLayer implements PixiLayer {
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
  private config: PortraitSceneConfig | null = null;
  private signature = "";
  private runtimeParticles: RuntimeParticle[] = [];
  private progress = 1;
  private exploding = false;
  private completeFired = false;
  private loadId = 0;
  private width = 0;
  private height = 0;
  private mouse = { x: 99999, y: 99999 };
  private mouseStrength = 0;
  private mouseTarget = 0;

  private readonly onMouseMove = (event: MouseEvent) => {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  };

  private readonly onMouseEnter = () => {
    if (!this.reduced) this.mouseTarget = 1;
  };

  private readonly onMouseLeave = () => {
    this.mouseTarget = 0;
  };

  constructor() {
    this.texture = createCircleTexture(32);
    this.root.addChild(this.particles);
    this.root.visible = false;
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
    if (!this.reduced) {
      window.addEventListener("mousemove", this.onMouseMove, { passive: true });
      window.addEventListener("mouseenter", this.onMouseEnter);
      window.addEventListener("mouseleave", this.onMouseLeave);
    }
  }

  setConfig(config: PortraitSceneConfig | null): void {
    const prevExplode = this.config?.explode;
    this.config = config;
    this.root.visible = !!config;
    if (!config) {
      this.signature = "";
      this.particles.particleChildren.length = 0;
      this.particles.update();
      this.runtimeParticles = [];
      return;
    }

    const signature = [
      config.imageSrc,
      config.maxWidth ?? 700,
      config.xOffset ?? 250,
      config.edgeFade ?? 0.15,
    ].join("|");

    if (signature !== this.signature) {
      this.signature = signature;
      this.progress = config.animate && !this.reduced ? 0 : 1;
      this.exploding = false;
      this.completeFired = false;
      void this.rebuild(signature, config);
    }

    if (config.explode && !prevExplode) {
      if (this.reduced) {
        window.setTimeout(() => config.onExplodeComplete?.(), 0);
      } else {
        this.progress = Math.max(this.progress, 0.98);
        this.exploding = true;
        this.completeFired = false;
      }
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(ticker: Ticker, width: number, height: number): void {
    this.resize(width, height);
    if (!this.config || this.runtimeParticles.length === 0) return;

    const deltaSeconds = Math.min(0.05, ticker.deltaMS / 1000);
    if (this.exploding) {
      this.progress = Math.max(0, this.progress - deltaSeconds * 0.7);
      if (this.progress <= 0.012 && !this.completeFired) {
        this.completeFired = true;
        this.exploding = false;
        this.config.onExplodeComplete?.();
      }
    } else if (this.config.animate && !this.reduced && this.progress < 1) {
      this.progress = Math.min(1, this.progress + deltaSeconds * 0.42);
    }

    this.mouseStrength += (this.mouseTarget - this.mouseStrength) * 0.1;
    const t = easeInOutCubic(clamp(this.progress));
    const cx = this.width / 2;
    const cy = this.height / 2;
    const size = this.config.particleSize ?? 1.8;
    const baseScale = size / 32;

    for (const item of this.runtimeParticles) {
      let x = cx + lerp(item.scatterX, item.relX, t);
      let y = cy + lerp(item.scatterY, item.relY, t);

      if (this.mouseStrength > 0.001) {
        const dx = x - this.mouse.x;
        const dy = y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 130) {
          const push = (1 - dist / 130) * 36 * this.mouseStrength;
          x += (dx / dist) * push;
          y += (dy / dist) * push;
        }
      }

      item.particle.x = x;
      item.particle.y = y;
      const depthScale = 0.72 + item.depth * 0.45;
      item.particle.scaleX = baseScale * depthScale;
      item.particle.scaleY = baseScale * depthScale;
      item.particle.tint = item.tint;
      item.particle.alpha = item.alpha * (0.35 + t * 0.65);
    }
  }

  destroy(): void {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseenter", this.onMouseEnter);
    window.removeEventListener("mouseleave", this.onMouseLeave);
    this.root.destroy({ children: true });
    this.texture.destroy(true);
  }

  private async rebuild(signature: string, config: PortraitSceneConfig): Promise<void> {
    const currentLoad = ++this.loadId;
    const seeds = await createImageParticleSeeds(
      config.imageSrc,
      config.maxWidth ?? 700,
      config.xOffset ?? 250,
      config.edgeFade ?? 0.15,
    );
    if (currentLoad !== this.loadId || signature !== this.signature) return;

    this.particles.particleChildren.length = 0;
    this.runtimeParticles = seeds.map((seed) => {
      const particle = new Particle({
        texture: this.texture,
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        tint: seed.tint,
        alpha: seed.alpha,
        scaleX: (config.particleSize ?? 1.8) / 32,
        scaleY: (config.particleSize ?? 1.8) / 32,
      });
      this.particles.particleChildren.push(particle);
      return { particle, ...seed };
    });
    this.particles.update();
  }
}
