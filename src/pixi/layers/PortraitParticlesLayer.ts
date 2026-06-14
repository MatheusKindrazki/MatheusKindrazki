import {
  Container,
  Geometry,
  Mesh,
  Particle,
  ParticleContainer,
  RendererType,
  Shader,
  UniformGroup,
  type Renderer,
  type Texture,
  type Ticker,
} from "pixi.js";
import { getRouteCoord } from "@/lib/routeIndex";
import type { PixiLayer, PortraitSceneConfig, SlewConfig } from "@/pixi/types";
import { qualityGovernor } from "@/pixi/qualityGovernor";
import {
  clamp,
  createCircleTexture,
  createImageParticleSeeds,
  easeInOutCubic,
  lerp,
  prefersReducedMotion,
  type ImageParticleSeed,
} from "@/pixi/utils";

/**
 * Portrait photo as a particle cloud — GPU-resident.
 *
 * All per-particle work (scatter→seed lerp, easing, mouse repulsion, depth
 * scaling) runs in a vertex shader over a static gl.POINTS geometry; the CPU
 * animates a single `uProgress` scalar per frame. Seeds come from
 * `createImageParticleSeeds` (up to ~200k particles for a solid photo) and
 * are cached per config signature so React re-renders never rebuild them.
 *
 * Density adapts to the device: it halves under 768px viewports and on
 * dpr>2 screens, and follows the shared `qualityGovernor` tier live.
 *
 * If the renderer is not WebGL or GPU resource creation throws, the layer
 * falls back to the legacy CPU ParticleContainer path hard-capped at 30k
 * particles.
 */

/** Per-particle assembly stagger (fraction of the progress range). */
const ASSEMBLY_STAGGER = 0.18;
/**
 * Responsive portrait offset contract. The per-page `xOffset` (250 home /
 * 330 sobre) is baked into each seed's relX so the cloud sits right-of-center
 * on the desktop spread. On narrow viewports that pushes the face off the
 * right edge, so the layer cancels a fraction of the baked offset at runtime
 * by shifting the draw center left — desktop (>= this width) keeps the full
 * offset, the release point zeroes it so the portrait centers behind the
 * now-centered text, and it lerps linearly between.
 */
const PORTRAIT_OFFSET_FULL_W = 1280;
/** Matches the shell's 820px mobile-flow release: at/below this the offset is 0. */
const PORTRAIT_OFFSET_ZERO_W = 820;
/** Hard cap for the CPU fallback path — the GPU path has no such limit. */
const CPU_FALLBACK_MAX_PARTICLES = 30000;
const MOUSE_RADIUS = 130;
const MOUSE_MAX_PUSH = 36;
/** Legacy explode pacing — used when no slew announced a duration. */
const DEFAULT_EXPLODE_RATE = 0.7;
/** Progress span an explode actually traverses (0.98 → 0.012). */
const EXPLODE_PROGRESS_SPAN = 0.97;
/** Max directional drift of the streak, in logical px (scaled per particle). */
const EXPLODE_STREAK_PX = 520;
/** Incoming assemblies sweep in along the slew with a subtler cast. */
const ENTRY_STREAK_SCALE = 0.5;

const VERTEX_SRC = /* glsl */ `
  precision highp float;

  attribute vec2 aPosition;
  attribute vec2 aScatter;
  attribute vec4 aColor;
  attribute float aRand;

  uniform mat3 uProjectionMatrix;
  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uTransformMatrix;
  uniform vec2 uResolution;

  uniform float uProgress;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uPointSize;
  uniform vec2 uCenter;
  uniform vec2 uExplodeDir;
  uniform float uExplodeBias;

  varying vec4 vColor;

  const float STAGGER = ${ASSEMBLY_STAGGER};
  const float MOUSE_RADIUS = ${MOUSE_RADIUS}.0;
  const float MOUSE_MAX_PUSH = ${MOUSE_MAX_PUSH}.0;

  void main() {
    // Per-particle staggered progress, eased with easeInOutCubic so the
    // global assemble/explode pacing matches the CPU implementation.
    float t = clamp(uProgress * (1.0 + STAGGER) - aRand * STAGGER, 0.0, 1.0);
    float eased = t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

    vec2 pos = uCenter + mix(aScatter, aPosition, eased);

    // Directional slew streak: while disassembled (eased < 1) the cloud is
    // cast toward the navigation target. The quadratic drift accelerates as
    // the explode progresses; per-particle variation keeps the streak ragged.
    float drift = 1.0 - eased;
    pos += uExplodeDir * (uExplodeBias * drift * drift * (0.55 + aRand * 0.9));

    // Radial mouse repulsion (130px falloff, ~36px max push).
    vec2 fromMouse = pos - uMouse;
    float dist = max(length(fromMouse), 0.0001);
    float falloff = max(0.0, 1.0 - dist / MOUSE_RADIUS);
    pos += (fromMouse / dist) * falloff * MOUSE_MAX_PUSH * uMouseStrength;

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(pos, 1.0)).xy, 0.0, 1.0);

    // uResolution is the render target's pixel size and the projection's
    // x-scale is 2/logicalWidth, so this recovers the renderer resolution —
    // gl_PointSize is specified in physical pixels.
    float depthScale = 0.72 + aRand * 0.45;
    float resolutionScale = uResolution.x * abs(uProjectionMatrix[0][0]) * 0.5;
    gl_PointSize = max(1.0, uPointSize * depthScale * resolutionScale);

    vColor = vec4(aColor.rgb, aColor.a * (0.35 + eased * 0.65));
  }
`;

const FRAGMENT_SRC = /* glsl */ `
  precision mediump float;

  varying vec4 vColor;

  void main() {
    // Soft round point replicating the legacy radial-gradient texture
    // (alpha 1.0 at the core, 0.82 at 52% radius, 0 at the rim).
    float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
    float core = mix(1.0, 0.82, clamp(r / 0.52, 0.0, 1.0));
    float rim = clamp((r - 0.52) / 0.48, 0.0, 1.0);
    float alpha = vColor.a * core * (1.0 - rim);
    gl_FragColor = vec4(vColor.rgb * alpha, alpha);
  }
`;

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

interface UploadedUniforms {
  progress: number;
  strength: number;
  mouseX: number;
  mouseY: number;
  cx: number;
  cy: number;
  pointSize: number;
  explodeBias: number;
  explodeDirX: number;
  explodeDirY: number;
}

/** Slew parameters consumed at explode start / next assembly. */
interface PortraitSlew {
  dirX: number;
  dirY: number;
  /** Explode rate in progress/s, derived from the slew duration. */
  rate: number;
}

export class PortraitParticlesLayer implements PixiLayer {
  private readonly root = new Container();
  private readonly reduced = prefersReducedMotion();
  private config: PortraitSceneConfig | null = null;
  private signature = "";
  private seeds: ImageParticleSeed[] | null = null;
  private progress = 1;
  private exploding = false;
  private completeFired = false;
  private loadId = 0;
  private width = 0;
  private height = 0;
  private mouse = { x: 99999, y: 99999 };
  private mouseStrength = 0;
  private mouseTarget = 0;
  private unsubscribeTier: (() => void) | null = null;
  private slew: PortraitSlew | null = null;
  private explodeRate = DEFAULT_EXPLODE_RATE;
  private explodeDirX = 0;
  private explodeDirY = 0;
  private explodeBias = 0;

  // --- GPU path ---
  private gpuFailed = false;
  private rendererIsWebGL = true;
  private mesh: Mesh<Geometry, Shader> | null = null;
  private shader: Shader | null = null;
  private uniforms: UniformGroup | null = null;
  private readonly uploaded: UploadedUniforms = {
    progress: Number.NaN,
    strength: Number.NaN,
    mouseX: Number.NaN,
    mouseY: Number.NaN,
    cx: Number.NaN,
    cy: Number.NaN,
    pointSize: Number.NaN,
    explodeBias: Number.NaN,
    explodeDirX: Number.NaN,
    explodeDirY: Number.NaN,
  };

  // --- CPU fallback path (legacy ParticleContainer, capped at 30k) ---
  private cpuContainer: ParticleContainer<Particle> | null = null;
  private cpuTexture: Texture | null = null;
  private runtimeParticles: RuntimeParticle[] = [];

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
    this.root.visible = false;
  }

  /**
   * Lets the stage hand over the renderer so the layer can pick the GPU
   * path only on WebGL (the point shader has no WGSL twin).
   */
  setRenderer(renderer: Renderer): void {
    this.rendererIsWebGL = renderer.type === RendererType.WEBGL;
  }

  /**
   * Slew announcement from PageShell (via PixiBackgroundStage): the explode
   * streaks toward the destination route's sky coordinate and paces itself
   * to the slew duration. Streak modes only — fade-band routes have no
   * portrait to streak. Applies live if an explode is already in flight
   * (the announcement and the explode flag land in the same React commit,
   * in either effect order).
   */
  setSlew(slew: SlewConfig | null): void {
    if (!slew || slew.mode === "fade-band") {
      this.slew = null;
      return;
    }

    const from = getRouteCoord(slew.fromPath);
    const to = getRouteCoord(slew.toPath);
    // RA grows along screen-x, dec grows upward (screen-y is inverted).
    let dirX = to.ra - from.ra;
    let dirY = -(to.dec - from.dec);
    const length = Math.hypot(dirX, dirY);
    if (length < 1e-3) {
      dirX = 1;
      dirY = 0;
    } else {
      dirX /= length;
      dirY /= length;
    }
    const rate =
      slew.duration > 0
        ? (EXPLODE_PROGRESS_SPAN * 1000) / slew.duration
        : DEFAULT_EXPLODE_RATE;

    this.slew = { dirX, dirY, rate };
    if (this.exploding && !this.reduced) {
      this.explodeRate = rate;
      this.explodeDirX = dirX;
      this.explodeDirY = dirY;
      this.explodeBias = EXPLODE_STREAK_PX;
    }
  }

  mount(parent: Container): void {
    parent.addChild(this.root);
    if (!this.reduced) {
      window.addEventListener("mousemove", this.onMouseMove, { passive: true });
      window.addEventListener("mouseenter", this.onMouseEnter);
      window.addEventListener("mouseleave", this.onMouseLeave);
    }
    this.unsubscribeTier = qualityGovernor.subscribe(() => {
      if (this.config && this.seeds) this.applyDensity();
    });
  }

  setConfig(config: PortraitSceneConfig | null): void {
    const prevExplode = this.config?.explode;
    this.config = config;
    this.root.visible = !!config;
    if (!config) {
      this.signature = "";
      this.seeds = null;
      this.clearParticles();
      return;
    }

    const signature = [
      config.imageSrc,
      config.maxWidth ?? 700,
      config.xOffset ?? 250,
      config.edgeFade ?? 0.15,
      config.brightness ?? 1,
      config.density ?? 2,
      config.maxParticles ?? 200000,
    ].join("|");

    if (signature !== this.signature) {
      this.signature = signature;
      this.progress = config.animate && !this.reduced ? 0 : 1;
      this.exploding = false;
      this.completeFired = false;
      if (this.slew && config.animate && !this.reduced) {
        // Continue the take: the incoming portrait sweeps INTO place along
        // the same screen direction the previous one streaked out on.
        this.explodeDirX = -this.slew.dirX;
        this.explodeDirY = -this.slew.dirY;
        this.explodeBias = EXPLODE_STREAK_PX * ENTRY_STREAK_SCALE;
      } else {
        this.explodeDirX = 0;
        this.explodeDirY = 0;
        this.explodeBias = 0;
      }
      this.slew = null; // one-shot: consumed by the arrival
      this.explodeRate = DEFAULT_EXPLODE_RATE;
      void this.rebuild(signature, config);
    }

    if (config.explode && !prevExplode) {
      if (this.reduced) {
        window.setTimeout(() => config.onExplodeComplete?.(), 0);
      } else {
        this.progress = Math.max(this.progress, 0.98);
        this.exploding = true;
        this.completeFired = false;
        this.explodeRate = this.slew?.rate ?? DEFAULT_EXPLODE_RATE;
        if (this.slew) {
          this.explodeDirX = this.slew.dirX;
          this.explodeDirY = this.slew.dirY;
          this.explodeBias = EXPLODE_STREAK_PX;
        } else {
          this.explodeDirX = 0;
          this.explodeDirY = 0;
          this.explodeBias = 0;
        }
      }
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(ticker: Ticker, width: number, height: number): void {
    this.resize(width, height);
    if (!this.config) return;
    const hasGpu = this.mesh !== null;
    if (!hasGpu && this.runtimeParticles.length === 0) return;

    const deltaSeconds = Math.min(0.05, ticker.deltaMS / 1000);
    if (this.exploding) {
      this.progress = Math.max(0, this.progress - deltaSeconds * this.explodeRate);
      if (this.progress <= 0.012 && !this.completeFired) {
        this.completeFired = true;
        this.exploding = false;
        this.config.onExplodeComplete?.();
      }
    } else if (this.config.animate && !this.reduced && this.progress < 1) {
      this.progress = Math.min(1, this.progress + deltaSeconds * 0.42);
    }

    this.mouseStrength += (this.mouseTarget - this.mouseStrength) * 0.1;
    if (Math.abs(this.mouseTarget - this.mouseStrength) < 0.001) {
      this.mouseStrength = this.mouseTarget;
    }

    if (hasGpu) {
      this.updateGpuUniforms();
    } else {
      this.updateCpuParticles();
    }
  }

  destroy(): void {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseenter", this.onMouseEnter);
    window.removeEventListener("mouseleave", this.onMouseLeave);
    this.unsubscribeTier?.();
    this.unsubscribeTier = null;
    this.destroyMesh();
    this.shader?.destroy();
    this.shader = null;
    this.uniforms = null;
    this.root.destroy({ children: true });
    this.cpuContainer = null;
    this.cpuTexture?.destroy(true);
    this.cpuTexture = null;
  }

  private async rebuild(signature: string, config: PortraitSceneConfig): Promise<void> {
    const currentLoad = ++this.loadId;
    const seeds = await createImageParticleSeeds(
      config.imageSrc,
      config.maxWidth ?? 700,
      config.xOffset ?? 250,
      config.edgeFade ?? 0.15,
      config.density ?? 2,
      config.maxParticles ?? 200000,
      config.brightness ?? 1,
    );
    if (currentLoad !== this.loadId || signature !== this.signature) return;

    this.seeds = seeds;
    this.applyDensity();
  }

  /**
   * (Re)builds the on-GPU geometry (or CPU particles) from the cached seeds,
   * thinned by the combined device + governor density divisor. Cheap — no
   * image resampling — so the governor can call it live on tier changes.
   */
  private applyDensity(): void {
    if (!this.config || !this.seeds) return;
    const divisor = Math.min(8, this.environmentDivisor() * qualityGovernor.densityDivisor);

    if (this.rendererIsWebGL && !this.gpuFailed) {
      try {
        this.buildGpu(this.seeds, divisor);
        return;
      } catch {
        this.gpuFailed = true;
        this.destroyMesh();
        this.shader = null;
        this.uniforms = null;
      }
    }
    this.buildCpu(this.seeds, divisor);
  }

  /**
   * Live draw-center X, with the responsive portrait offset applied. The full
   * per-page xOffset is baked into the seeds (relX) and drawn relative to
   * width/2; on narrow viewports we cancel a fraction of it by shifting the
   * center left so the face is not pushed off the right edge. Desktop
   * (>= PORTRAIT_OFFSET_FULL_W) is unchanged; at/below PORTRAIT_OFFSET_ZERO_W
   * the portrait centers behind the (now-centered) text.
   */
  private centerX(): number {
    const cx = this.width / 2;
    const baked = this.config?.xOffset ?? 250;
    if (baked === 0 || typeof window === "undefined") return cx;
    const vw = window.innerWidth || this.width;
    let offsetScale: number;
    if (vw >= PORTRAIT_OFFSET_FULL_W) offsetScale = 1;
    else if (vw <= PORTRAIT_OFFSET_ZERO_W) offsetScale = 0;
    else {
      offsetScale =
        (vw - PORTRAIT_OFFSET_ZERO_W) /
        (PORTRAIT_OFFSET_FULL_W - PORTRAIT_OFFSET_ZERO_W);
    }
    // Cancel the un-wanted portion of the baked offset.
    return cx - baked * (1 - offsetScale);
  }

  /** Halve density on small viewports and again on very dense displays. */
  private environmentDivisor(): number {
    if (typeof window === "undefined") return 1;
    let divisor = 1;
    if (window.innerWidth < 768) divisor *= 2;
    if ((window.devicePixelRatio || 1) > 2) divisor *= 2;
    return divisor;
  }

  private ensureShader(): Shader {
    if (this.shader) return this.shader;
    this.uniforms = new UniformGroup({
      uProgress: { value: this.progress, type: "f32" },
      uMouse: { value: new Float32Array([99999, 99999]), type: "vec2<f32>" },
      uMouseStrength: { value: 0, type: "f32" },
      uPointSize: { value: 1.8, type: "f32" },
      uCenter: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uExplodeDir: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uExplodeBias: { value: 0, type: "f32" },
    });
    this.shader = Shader.from({
      gl: { vertex: VERTEX_SRC, fragment: FRAGMENT_SRC },
      resources: { portraitUniforms: this.uniforms },
    });
    return this.shader;
  }

  private buildGpu(seeds: ImageParticleSeed[], divisor: number): void {
    const stride = Math.max(1, Math.round(divisor));
    const count = Math.ceil(seeds.length / stride);
    const positions = new Float32Array(count * 2);
    const scatters = new Float32Array(count * 2);
    const colors = new Float32Array(count * 4);
    const rands = new Float32Array(count);

    let j = 0;
    for (let i = 0; i < seeds.length; i += stride) {
      const seed = seeds[i];
      positions[j * 2] = seed.relX;
      positions[j * 2 + 1] = seed.relY;
      scatters[j * 2] = seed.scatterX;
      scatters[j * 2 + 1] = seed.scatterY;
      colors[j * 4] = ((seed.tint >> 16) & 0xff) / 255;
      colors[j * 4 + 1] = ((seed.tint >> 8) & 0xff) / 255;
      colors[j * 4 + 2] = (seed.tint & 0xff) / 255;
      colors[j * 4 + 3] = seed.alpha;
      rands[j] = seed.depth;
      j += 1;
    }

    const geometry = new Geometry({
      attributes: {
        aPosition: { buffer: positions, format: "float32x2" },
        aScatter: { buffer: scatters, format: "float32x2" },
        aColor: { buffer: colors, format: "float32x4" },
        aRand: { buffer: rands, format: "float32" },
      },
      topology: "point-list",
    });

    const shader = this.ensureShader();
    if (this.mesh) {
      const previous = this.mesh.geometry;
      this.mesh.geometry = geometry;
      previous.destroy(true);
    } else {
      this.mesh = new Mesh({ geometry, shader });
      this.root.addChild(this.mesh);
    }

    // Drop any CPU particles from a previous fallback build.
    if (this.runtimeParticles.length > 0 && this.cpuContainer) {
      this.cpuContainer.particleChildren.length = 0;
      this.cpuContainer.update();
      this.runtimeParticles = [];
    }

    this.uploaded.progress = Number.NaN; // force a uniform upload next frame
  }

  private ensureCpuResources(): {
    container: ParticleContainer<Particle>;
    texture: Texture;
  } {
    if (!this.cpuTexture) this.cpuTexture = createCircleTexture(32);
    if (!this.cpuContainer) {
      this.cpuContainer = new ParticleContainer<Particle>({
        dynamicProperties: {
          position: true,
          color: true,
          rotation: false,
          vertex: true,
        },
      });
      this.root.addChild(this.cpuContainer);
    }
    return { container: this.cpuContainer, texture: this.cpuTexture };
  }

  private buildCpu(seeds: ImageParticleSeed[], divisor: number): void {
    if (!this.config) return;
    this.destroyMesh();
    const { container, texture } = this.ensureCpuResources();
    const stride = Math.max(
      Math.max(1, Math.round(divisor)),
      Math.ceil(seeds.length / CPU_FALLBACK_MAX_PARTICLES),
    );
    const size = this.config.particleSize ?? 1.8;

    container.particleChildren.length = 0;
    this.runtimeParticles = [];
    for (let i = 0; i < seeds.length; i += stride) {
      const seed = seeds[i];
      const particle = new Particle({
        texture,
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        tint: seed.tint,
        alpha: seed.alpha,
        scaleX: size / 32,
        scaleY: size / 32,
      });
      container.particleChildren.push(particle);
      this.runtimeParticles.push({ particle, ...seed });
    }
    container.update();
  }

  /**
   * The whole per-frame CPU cost of the GPU path: compare-and-upload a
   * handful of scalars. When assembly is done and the mouse is idle nothing
   * changes, so this early-outs without touching the uniform group.
   */
  private updateGpuUniforms(): void {
    if (!this.uniforms || !this.config) return;
    const cx = this.centerX();
    const cy = this.height / 2;
    const pointSize = this.config.particleSize ?? 1.8;
    const uploaded = this.uploaded;
    const mouseActive = this.mouseStrength > 0.001;

    const dirty =
      uploaded.progress !== this.progress ||
      uploaded.strength !== this.mouseStrength ||
      uploaded.cx !== cx ||
      uploaded.cy !== cy ||
      uploaded.pointSize !== pointSize ||
      uploaded.explodeBias !== this.explodeBias ||
      uploaded.explodeDirX !== this.explodeDirX ||
      uploaded.explodeDirY !== this.explodeDirY ||
      (mouseActive &&
        (uploaded.mouseX !== this.mouse.x || uploaded.mouseY !== this.mouse.y));
    if (!dirty) return;

    const uniforms = this.uniforms.uniforms as {
      uProgress: number;
      uMouse: Float32Array;
      uMouseStrength: number;
      uPointSize: number;
      uCenter: Float32Array;
      uExplodeDir: Float32Array;
      uExplodeBias: number;
    };
    uniforms.uProgress = this.progress;
    uniforms.uMouseStrength = this.mouseStrength;
    uniforms.uPointSize = pointSize;
    uniforms.uMouse[0] = this.mouse.x;
    uniforms.uMouse[1] = this.mouse.y;
    uniforms.uCenter[0] = cx;
    uniforms.uCenter[1] = cy;
    uniforms.uExplodeDir[0] = this.explodeDirX;
    uniforms.uExplodeDir[1] = this.explodeDirY;
    uniforms.uExplodeBias = this.explodeBias;
    this.uniforms.update();

    uploaded.progress = this.progress;
    uploaded.strength = this.mouseStrength;
    uploaded.cx = cx;
    uploaded.cy = cy;
    uploaded.pointSize = pointSize;
    uploaded.mouseX = this.mouse.x;
    uploaded.mouseY = this.mouse.y;
    uploaded.explodeBias = this.explodeBias;
    uploaded.explodeDirX = this.explodeDirX;
    uploaded.explodeDirY = this.explodeDirY;
  }

  /** Legacy CPU path — only runs when the GPU build is unavailable. */
  private updateCpuParticles(): void {
    if (!this.config) return;
    const t = easeInOutCubic(clamp(this.progress));
    const cx = this.centerX();
    const cy = this.height / 2;
    const size = this.config.particleSize ?? 1.8;
    const baseScale = size / 32;
    // Mirror of the GPU drift term — directional slew streak.
    const drift = 1 - t;
    const driftBase = this.explodeBias * drift * drift;

    for (const item of this.runtimeParticles) {
      const driftAmount = driftBase * (0.55 + item.depth * 0.9);
      let x = cx + lerp(item.scatterX, item.relX, t) + this.explodeDirX * driftAmount;
      let y = cy + lerp(item.scatterY, item.relY, t) + this.explodeDirY * driftAmount;

      if (this.mouseStrength > 0.001) {
        const dx = x - this.mouse.x;
        const dy = y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < MOUSE_RADIUS) {
          const push = (1 - dist / MOUSE_RADIUS) * MOUSE_MAX_PUSH * this.mouseStrength;
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

  private destroyMesh(): void {
    if (!this.mesh) return;
    const geometry = this.mesh.geometry;
    this.root.removeChild(this.mesh);
    this.mesh.destroy();
    geometry.destroy(true);
    this.mesh = null;
  }

  private clearParticles(): void {
    this.destroyMesh();
    if (this.cpuContainer) {
      this.cpuContainer.particleChildren.length = 0;
      this.cpuContainer.update();
    }
    this.runtimeParticles = [];
  }
}
