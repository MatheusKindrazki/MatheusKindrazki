import {
  Assets,
  BlurFilter,
  Container,
  Graphics,
  Particle,
  ParticleContainer,
  Sprite,
  Texture,
  type Ticker,
} from "pixi.js";
import type { BlackHoleSceneConfig, PixiLayer } from "@/pixi/types";
import {
  clamp,
  createCircleTexture,
  easeInCubic,
  easeInOutQuad,
  easeOutExpo,
  easeOutQuart,
  KINDRA_COLORS,
  lerp,
  prefersReducedMotion,
  randomRange,
} from "@/pixi/utils";

const PHASE_STARS = 2000;
const PHASE_CONVERGE = 3000;
const PHASE_COLLAPSE = 800;
const PHASE_SHOCKWAVE = 600;
const PHASE_MEDIA = 1200;

const STAR_COLORS = [
  0xffffff,
  0xe8e8ff,
  0xd0d0ff,
  0xb8c8ff,
  0xffe8d0,
  0xffd8a8,
  0xc8d8ff,
  0xa0b8ff,
] as const;

const ACCRETION_WARM = [0xffcc80, 0xffa040, 0xff8020, 0xff6000, 0xe04000];
const ACCRETION_COOL = [0x53a2be, 0x6bb8d4, 0x80d0f0, 0x40a0d0, 0x2080b0];

interface HoleParticle {
  particle: Particle;
  ix: number;
  iy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  tint: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  opacity: number;
  trail: { x: number; y: number }[];
  isAccretion: boolean;
  angularV: number;
  consumed: boolean;
}

export class BlackHoleLayer implements PixiLayer {
  private readonly root = new Container();
  private readonly glow = new Graphics();
  private readonly trails = new Graphics();
  private readonly particles = new ParticleContainer<Particle>({
    dynamicProperties: {
      position: true,
      color: true,
      vertex: true,
      rotation: false,
    },
  });
  private readonly rings = new Graphics();
  private readonly mediaMask = new Graphics();
  private readonly texture = createCircleTexture(32);
  private readonly reduced = prefersReducedMotion();
  private config: BlackHoleSceneConfig | null = null;
  private signature = "";
  private width = 0;
  private height = 0;
  private elapsed = 0;
  private formationFired = false;
  private stars: HoleParticle[] = [];
  private mediaLoadId = 0;
  private mediaLoading = false;
  private mediaSrc = "";
  private mediaTexture: Texture | null = null;
  private mediaSprite: Sprite | null = null;

  constructor() {
    this.root.visible = false;
    this.root.filters = [new BlurFilter({ strength: 0.15, quality: 1 })];
    this.root.addChild(this.glow);
    this.root.addChild(this.trails);
    this.root.addChild(this.particles);
    this.root.addChild(this.rings);
    this.root.addChild(this.mediaMask);
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
  }

  setConfig(config: BlackHoleSceneConfig | null): void {
    this.config = config;
    this.root.visible = !!config;
    if (!config) {
      this.signature = "";
      this.clearMedia();
      this.particles.particleChildren.length = 0;
      this.particles.update();
      this.stars = [];
      this.clearGraphics();
      return;
    }

    const signature = `${config.src}|${config.offsetX ?? 0}|${config.revealMedia ?? true}`;
    if (signature === this.signature) return;

    // Fast media swap: if only the video `src` changed (same formation —
    // offsetX/revealMedia) and the hole is already formed and showing media,
    // just swap the clip in place instead of re-running the ~7.6s collapse
    // sequence. Used by /skills to change the video per scrolled section.
    const formationSig = `${config.offsetX ?? 0}|${config.revealMedia ?? true}`;
    const prevFormationSig = this.signature.split("|").slice(1).join("|");
    const onlySrcChanged =
      this.signature !== "" && formationSig === prevFormationSig;

    this.signature = signature;

    if (onlySrcChanged && this.formationFired && config.revealMedia !== false) {
      this.clearMedia();
      this.prepareMedia();
      return;
    }

    this.reset();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(ticker: Ticker, width: number, height: number): void {
    this.resize(width, height);
    if (!this.config) return;

    if (this.reduced) {
      this.showReduced();
      return;
    }

    this.elapsed += ticker.deltaMS;
    const phase = this.resolvePhase(this.elapsed);
    const cx = this.centerX();
    const cy = this.centerY();
    const maxDist = Math.sqrt(width * width + height * height) / 2;

    this.drawGlobalEffects(phase.name, phase.progress, cx, cy);
    this.updateParticles(
      phase.name,
      phase.progress,
      cx,
      cy,
      maxDist,
      ticker.lastTime,
      Math.min(0.05, ticker.deltaMS / 1000),
    );
    this.drawRings(phase.name, phase.progress, cx, cy, maxDist);
    this.updateMedia(phase.name, phase.progress, cx, cy);
  }

  destroy(): void {
    this.clearMedia();
    this.root.destroy({ children: true });
    this.texture.destroy(true);
  }

  private reset(): void {
    this.elapsed = 0;
    this.formationFired = false;
    this.clearMedia();
    this.clearGraphics();
    this.prepareParticles();
    this.prepareMedia();
  }

  private clearGraphics(): void {
    this.glow.clear();
    this.trails.clear();
    this.rings.clear();
    this.mediaMask.clear();
  }

  private centerX(): number {
    return this.width / 2 + (this.config?.offsetX ?? 0);
  }

  private centerY(): number {
    return this.height / 2;
  }

  private resolvePhase(elapsed: number): {
    name: "stars" | "converge" | "collapse" | "shockwave" | "media" | "done";
    progress: number;
  } {
    const t1 = PHASE_STARS;
    const t2 = t1 + PHASE_CONVERGE;
    const t3 = t2 + PHASE_COLLAPSE;
    const t4 = t3 + PHASE_SHOCKWAVE;
    const t5 = t4 + PHASE_MEDIA;

    if (elapsed < t1) return { name: "stars", progress: elapsed / t1 };
    if (elapsed < t2) return { name: "converge", progress: (elapsed - t1) / PHASE_CONVERGE };
    if (elapsed < t3) return { name: "collapse", progress: (elapsed - t2) / PHASE_COLLAPSE };
    if (elapsed < t4) return { name: "shockwave", progress: (elapsed - t3) / PHASE_SHOCKWAVE };
    if (elapsed < t5) return { name: "media", progress: (elapsed - t4) / PHASE_MEDIA };
    return { name: "done", progress: 1 };
  }

  private prepareParticles(): void {
    const cx = this.centerX();
    const cy = this.centerY();
    const starCount = this.width < 768 ? 360 : 520;
    const accretionCount = this.width < 768 ? 130 : 210;
    const stars: HoleParticle[] = [];
    this.particles.particleChildren.length = 0;

    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * Math.max(this.width, 1);
      const y = Math.random() * Math.max(this.height, 1);
      stars.push(this.createHoleParticle(x, y, false));
    }

    for (let i = 0; i < accretionCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = randomRange(120, 390);
      const x = cx + Math.cos(angle) * dist * 1.5;
      const y = cy + Math.sin(angle) * dist * 0.4;
      stars.push(this.createHoleParticle(x, y, true));
    }

    this.stars = stars;
    this.particles.update();
  }

  private createHoleParticle(x: number, y: number, isAccretion: boolean): HoleParticle {
    const palette = isAccretion
      ? Math.random() > 0.4
        ? ACCRETION_WARM
        : ACCRETION_COOL
      : STAR_COLORS;
    const tint = palette[Math.floor(Math.random() * palette.length)];
    const baseRadius = isAccretion ? randomRange(0.55, 1.7) : randomRange(0.5, 2.2);
    const particle = new Particle({
      texture: this.texture,
      x,
      y,
      anchorX: 0.5,
      anchorY: 0.5,
      tint,
      alpha: isAccretion ? 0 : randomRange(0.25, 0.9),
      scaleX: (baseRadius * 2) / 32,
      scaleY: (baseRadius * 2) / 32,
    });
    this.particles.particleChildren.push(particle);
    return {
      particle,
      ix: x,
      iy: y,
      x,
      y,
      vx: 0,
      vy: 0,
      baseRadius,
      radius: baseRadius,
      tint,
      twinkleSpeed: randomRange(1.5, 4.5),
      twinkleOffset: Math.random() * Math.PI * 2,
      opacity: particle.alpha,
      trail: [],
      isAccretion,
      angularV: isAccretion ? randomRange(0.3, 0.9) * (Math.random() > 0.5 ? 1 : -1) : 0,
      consumed: false,
    };
  }

  private drawGlobalEffects(
    phase: "stars" | "converge" | "collapse" | "shockwave" | "media" | "done",
    progress: number,
    cx: number,
    cy: number,
  ): void {
    this.glow.clear();
    const glowIntensity =
      phase === "stars"
        ? 0
        : phase === "converge"
          ? easeInOutQuad(progress) * 0.62
          : 0.62 + (phase === "collapse" ? progress * 0.38 : 0.32);

    if (glowIntensity <= 0) return;

    for (let i = 4; i >= 1; i--) {
      const radius = 90 + glowIntensity * 115 * i;
      this.glow
        .circle(cx, cy, radius)
        .fill({
          color: i % 2 === 0 ? KINDRA_COLORS.blue : KINDRA_COLORS.yellow,
          alpha: glowIntensity * 0.012 * (5 - i),
        });
    }
  }

  private updateParticles(
    phase: "stars" | "converge" | "collapse" | "shockwave" | "media" | "done",
    progress: number,
    cx: number,
    cy: number,
    maxDist: number,
    now: number,
    dt: number,
  ): void {
    this.trails.clear();

    for (const star of this.stars) {
      if (star.consumed) {
        star.particle.alpha = 0;
        continue;
      }

      const dx = cx - star.x;
      const dy = cy - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ndx = dx / dist;
      const ndy = dy / dist;
      const twinkle = 0.5 + 0.5 * Math.sin(now * 0.001 * star.twinkleSpeed + star.twinkleOffset);
      star.radius = star.baseRadius * (0.6 + 0.4 * twinkle);

      if (phase === "stars") {
        star.opacity = star.isAccretion
          ? lerp(0, 0.4, easeInCubic(progress))
          : (0.3 + 0.7 * twinkle) * lerp(0, 1, clamp(progress * 3));
      }

      if (phase === "converge" || phase === "collapse") {
        const pullStrength = phase === "converge" ? easeInCubic(progress) * 1200 : 3000 + progress * 8000;
        const force = pullStrength / (dist * dist + 100);
        const tangentX = -ndy;
        const tangentY = ndx;
        const orbitalForce = star.isAccretion
          ? (star.angularV * 60) / (dist + 30)
          : (star.angularV * 20) / (dist + 50);

        star.vx += (ndx * force + tangentX * orbitalForce) * dt;
        star.vy += (ndy * force + tangentY * orbitalForce) * dt;
        const drag = phase === "collapse" ? 0.99 : 0.995;
        star.vx *= drag;
        star.vy *= drag;
        star.x += star.vx;
        star.y += star.vy;

        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 18) star.trail.shift();

        if (star.isAccretion) {
          star.opacity = clamp(0.4 + progress * 0.6) * twinkle;
        } else {
          star.opacity = clamp(1 - dist / maxDist + 0.3) * twinkle;
        }

        if (phase === "converge" && progress < 0.1 && star.angularV === 0 && !star.isAccretion) {
          star.angularV = randomRange(-0.3, 0.3);
        }

        const eventHorizon = phase === "collapse" ? 30 + progress * 60 : 12;
        if (dist < eventHorizon) {
          star.consumed = true;
          star.particle.alpha = 0;
          continue;
        }

        if (star.trail.length > 3) {
          this.trails.moveTo(star.trail[0].x, star.trail[0].y);
          for (let i = 1; i < star.trail.length; i++) {
            this.trails.lineTo(star.trail[i].x, star.trail[i].y);
          }
          this.trails.stroke({
            color: star.tint,
            alpha: star.opacity * (star.isAccretion ? 0.22 : 0.08),
            width: Math.max(0.35, star.radius * 0.5),
          });
        }
      }

      if (phase === "shockwave" || phase === "media" || phase === "done") {
        star.opacity = Math.max(0, star.opacity - 0.018);
        if (star.opacity <= 0) star.consumed = true;
      }

      star.particle.x = star.x;
      star.particle.y = star.y;
      star.particle.alpha = clamp(star.opacity);
      const scale = (star.radius * 2) / 32;
      star.particle.scaleX = scale;
      star.particle.scaleY = scale;
    }
  }

  private drawRings(
    phase: "stars" | "converge" | "collapse" | "shockwave" | "media" | "done",
    progress: number,
    cx: number,
    cy: number,
    maxDist: number,
  ): void {
    this.rings.clear();

    if (phase === "converge" || phase === "collapse") {
      const diskAlpha = phase === "converge" ? easeInCubic(progress) * 0.12 : 0.12 + progress * 0.08;
      for (let i = 0; i < 6; i++) {
        this.rings
          .ellipse(cx, cy, 180 + i * 42, 54 + i * 13)
          .stroke({
            color: i % 2 ? KINDRA_COLORS.yellow : KINDRA_COLORS.blue,
            alpha: diskAlpha * (1 - i / 7),
            width: 1.2,
          });
      }
    }

    if (phase === "collapse" || phase === "shockwave" || phase === "media" || phase === "done") {
      const horizonR = phase === "collapse" ? 5 + easeOutQuart(progress) * 165 : 170;
      const ringAlpha = phase === "collapse" ? progress * 0.6 : 0.6;
      this.rings
        .circle(cx, cy, horizonR * 1.2)
        .stroke({ color: 0xb4d2ff, alpha: ringAlpha * 0.35, width: 2 })
        .circle(cx, cy, horizonR)
        .fill({ color: 0x000000, alpha: 0.98 });

      for (let i = 0; i < 4; i++) {
        this.rings
          .circle(cx, cy, horizonR * (1.25 + i * 0.15))
          .stroke({
            color: i % 2 ? KINDRA_COLORS.yellow : KINDRA_COLORS.blue,
            alpha: ringAlpha * 0.08 * (4 - i),
            width: 1,
          });
      }
    }

    if (phase === "shockwave") {
      const shockRadius = easeOutExpo(progress) * maxDist * 0.82;
      const alpha = 1 - progress;
      this.rings
        .circle(cx, cy, shockRadius)
        .stroke({ color: 0xb4dcff, alpha: alpha * 0.8, width: 3 + alpha * 8 })
        .circle(cx, cy, shockRadius * 0.9)
        .stroke({ color: KINDRA_COLORS.blue, alpha: alpha * 0.35, width: 2 });
    }

    if (phase === "done") {
      const time = this.elapsed * 0.0003;
      for (let i = 0; i < 32; i++) {
        const angle = time + (i / 32) * Math.PI * 2;
        const dist = 195 + Math.sin(angle * 3 + i) * 25;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist * 0.35;
        const alpha = 0.12 + 0.1 * Math.sin(this.elapsed * 0.002 + i);
        this.rings.circle(x, y, 1).fill({ color: 0xb4d2ff, alpha });
      }
    }
  }

  private prepareMedia(): void {
    if (!this.config) return;
    if (this.config.revealMedia === false) return;
    const loadId = ++this.mediaLoadId;
    const isVideo = /\.(mp4|webm|mov)$/i.test(this.config.src);
    const textureSrc = this.config.src;
    if (this.mediaLoading && this.mediaSrc === textureSrc) return;
    if (this.mediaSprite && this.mediaSrc === textureSrc) return;

    this.mediaLoading = true;
    this.mediaSrc = textureSrc;
    const asset = isVideo
      ? {
          src: textureSrc,
          data: {
            autoPlay: true,
            loop: true,
            muted: true,
            playsinline: true,
            preload: true,
            updateFPS: 30,
          },
        }
      : textureSrc;

    void Assets.load<Texture>(asset).then((texture) => {
      if (loadId !== this.mediaLoadId || !this.config) return;
      this.mediaLoading = false;
      this.mediaTexture = texture;
      this.mediaSprite = new Sprite({
        texture,
        anchor: 0.5,
        alpha: 0,
      });
      this.mediaSprite.width = 320;
      this.mediaSprite.height = 320;
      this.mediaSprite.mask = this.mediaMask;
      this.root.addChild(this.mediaSprite);
      if (isVideo) this.ensureVideoPlaying(texture);
    }).catch(() => {
      if (loadId === this.mediaLoadId) this.mediaLoading = false;
    });
  }

  /**
   * Pixi v8's `autoPlay` is unreliable — the underlying HTMLVideoElement is
   * created paused and `.play()` is never explicitly called once it can play,
   * so the DJ clip sits on a frozen first frame. Reach the element off the
   * texture source (`texture.source.resource` on a VideoSource) and call
   * `.play()` defensively. If autoplay policy rejects the first attempt, retry
   * once on the first user gesture.
   */
  private ensureVideoPlaying(texture: Texture): void {
    const source = texture.source as unknown as {
      resource?: HTMLVideoElement;
    } | null;
    const video = source?.resource;
    if (!video || typeof video.play !== "function") return;

    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    const attempt = () => {
      const result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(() => {
          /* blocked by autoplay policy — wait for a user gesture */
        });
      }
    };

    const promise = video.play();
    if (promise && typeof promise.then === "function") {
      promise.catch(() => {
        const retry = () => {
          attempt();
          document.removeEventListener("pointerdown", retry);
          document.removeEventListener("keydown", retry);
        };
        document.addEventListener("pointerdown", retry, { once: true });
        document.addEventListener("keydown", retry, { once: true });
      });
    }
  }

  private updateMedia(
    phase: "stars" | "converge" | "collapse" | "shockwave" | "media" | "done",
    progress: number,
    cx: number,
    cy: number,
  ): void {
    if (phase === "shockwave" || phase === "media" || phase === "done") {
      if (!this.formationFired) {
        this.formationFired = true;
        this.config?.onFormationComplete?.();
      }
    }

    if (!this.mediaSprite) {
      if (phase === "shockwave" || phase === "media" || phase === "done") {
        const alpha = phase === "shockwave" ? 0.5 + progress * 0.35 : 0.9;
        this.drawPersistentSingularity(cx, cy, alpha);
      }
      return;
    }

    if (phase === "media" || phase === "done") {
      const alpha = phase === "media" ? easeOutQuart(progress) : 1;
      const scale = phase === "media" ? lerp(0.3, 1, easeOutExpo(progress)) : 1;
      this.mediaSprite.alpha = alpha;
      this.mediaSprite.position.set(cx, cy);
      this.mediaSprite.width = 320 * scale;
      this.mediaSprite.height = 320 * scale;
      this.mediaMask.clear().circle(cx, cy, 160 * scale).fill({ color: 0xffffff });

      this.rings
        .circle(cx, cy, 360)
        .stroke({ color: KINDRA_COLORS.blue, alpha: 0.04 * alpha, width: 1 })
        .circle(cx, cy, 185)
        .stroke({ color: 0xb4d2ff, alpha: 0.2 * alpha, width: 1 });
    }
  }

  private showReduced(): void {
    if (!this.config) return;
    if (this.config.revealMedia !== false && !this.mediaSprite) {
      this.prepareMedia();
    }
    const cx = this.centerX();
    const cy = this.centerY();
    this.clearGraphics();
    if (this.mediaSprite) {
      this.mediaSprite.alpha = 1;
      this.mediaSprite.position.set(cx, cy);
      this.mediaSprite.width = 320;
      this.mediaSprite.height = 320;
      this.mediaMask.clear().circle(cx, cy, 160).fill({ color: 0xffffff });
    } else {
      this.drawPersistentSingularity(cx, cy, 1);
    }
    if (!this.formationFired) {
      this.formationFired = true;
      this.config.onFormationComplete?.();
    }
  }

  private drawPersistentSingularity(cx: number, cy: number, alpha: number): void {
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 0.0014);

    this.rings
      .circle(cx, cy, 178)
      .fill({ color: 0x000000, alpha: 0.98 })
      .circle(cx, cy, 188 + pulse * 4)
      .stroke({ color: 0xc8e8ff, alpha: 0.22 * alpha, width: 2.4 })
      .circle(cx, cy, 214 + pulse * 12)
      .stroke({ color: KINDRA_COLORS.blue, alpha: 0.08 * alpha, width: 1.2 });

    for (let i = 0; i < 7; i++) {
      const orbit = this.elapsed * 0.00018 * (i % 2 ? -1 : 1);
      const radiusX = 220 + i * 26 + Math.sin(orbit * 8 + i) * 8;
      const radiusY = 50 + i * 8 + Math.cos(orbit * 6 + i) * 3;
      this.rings
        .ellipse(cx, cy, radiusX, radiusY)
        .stroke({
          color: i % 2 ? KINDRA_COLORS.yellow : KINDRA_COLORS.blue,
          alpha: alpha * (0.13 - i * 0.012),
          width: i < 2 ? 1.6 : 0.9,
        });
    }
  }

  private clearMedia(): void {
    this.mediaLoadId += 1;
    this.mediaLoading = false;
    this.mediaSrc = "";
    if (this.mediaSprite) {
      this.root.removeChild(this.mediaSprite);
      this.mediaSprite.destroy();
      this.mediaSprite = null;
    }
    this.mediaTexture = null;
  }
}
