/**
 * Adaptive quality governor — a rolling frame-time watchdog shared by the
 * Pixi layers.
 *
 * The governor owns a single quality tier (0 = full, 1 = reduced,
 * 2 = minimal). The initial tier is seeded from device hints
 * (hardwareConcurrency / deviceMemory); afterwards a ~2s rolling window of
 * frame times steps the tier down whenever the average frame cost stays
 * above the budget. Degradation is monotonic — once a device proves it
 * cannot hold the budget we never climb back up, which avoids tier
 * oscillation (thrash) mid-session.
 *
 * The budget is NOT a bare absolute: rAF streams are quantized to the
 * display/vsync interval, so iOS Low Power Mode (30fps rAF cap) and 30Hz
 * external monitors deliver a steady ~33ms with the GPU near idle. The
 * watchdog therefore compares the window average against the device's own
 * demonstrated frame interval (fastest decile) with headroom — sessions
 * that are merely display-capped keep full quality, while frames that are
 * slow relative to what the device has shown it can do still degrade.
 *
 * Layers read `qualityGovernor.densityDivisor` when (re)building particle
 * buffers and may `subscribe` to rebuild live; the background stage applies
 * `resolutionCap` to the renderer.
 */

export type QualityTier = 0 | 1 | 2;

/** Particle-density divisor per tier (1 → full density, 4 → quarter). */
export const TIER_DENSITY_DIVISOR: readonly number[] = [1, 2, 4];

/** Renderer resolution cap per tier (min(devicePixelRatio, cap) applies). */
export const TIER_RESOLUTION_CAP: readonly number[] = [2, 1.5, 1];

const WINDOW_MS = 2000;
/** Floor of the degrade budget: sustained averages above ~24ms (<42fps)
 *  step the tier down on a 60Hz+ device. */
const DEGRADE_AVG_FRAME_MS = 24;
/**
 * Frames longer than this are treated as one-off stalls (tab switch, image
 * decode, GC) and reset the window instead of polluting the average. Pixi's
 * ticker caps deltaMS at 100, so this must sit below that cap.
 */
const SPIKE_MS = 95;
/**
 * A RUN of spike frames is not a one-off stall — it is a device in
 * sustained collapse (<~10fps) whose every frame clears SPIKE_MS, so the
 * rolling window alone would never fill. Hidden tabs cannot trip this:
 * they get no rAF ticks at all, and the single long frame on return is
 * absorbed as one spike.
 */
const SPIKE_RUN_LIMIT = 4;
/**
 * Slowest plausible display/rAF cap (~30Hz: iOS/macOS Low Power Mode,
 * 30Hz external monitors). The vsync baseline is clamped here so a
 * genuinely collapsed device (no fast frames at all) cannot raise its
 * own degrade bar indefinitely.
 */
const SLOWEST_VSYNC_MS = 1000 / 29;
/** Floor for the baseline — guards against bogus sub-vsync rAF deltas. */
const FASTEST_VSYNC_MS = 4;
/**
 * Headroom over the observed vsync interval before sustained slowness is
 * attributed to rendering load rather than the display cap itself.
 */
const VSYNC_HEADROOM = 1.5;

function seedTier(): QualityTier {
  if (typeof navigator === "undefined") return 0;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (cores <= 2 || memory <= 2) return 2;
  if (cores <= 4 || memory <= 4) return 1;
  return 0;
}

type TierListener = (tier: QualityTier) => void;

class QualityGovernor {
  private currentTier: QualityTier = seedTier();
  private readonly listeners = new Set<TierListener>();
  private windowElapsed = 0;
  private readonly windowSamples: number[] = [];
  private spikeRun = 0;
  /** Best (fastest-decile) frame interval the session has demonstrated. */
  private vsyncBaseline = SLOWEST_VSYNC_MS;

  get tier(): QualityTier {
    return this.currentTier;
  }

  get densityDivisor(): number {
    return TIER_DENSITY_DIVISOR[this.currentTier];
  }

  get resolutionCap(): number {
    return TIER_RESOLUTION_CAP[this.currentTier];
  }

  /** Feed one frame's `ticker.deltaMS`; call once per rendered frame. */
  sample(deltaMS: number): void {
    if (this.currentTier >= 2) return;

    if (deltaMS > SPIKE_MS) {
      this.windowElapsed = 0;
      this.windowSamples.length = 0;
      this.spikeRun += 1;
      // Sustained collapse (every frame a "spike") must still degrade —
      // these are exactly the devices the governor exists for.
      if (this.spikeRun >= SPIKE_RUN_LIMIT) {
        this.spikeRun = 0;
        this.degrade();
      }
      return;
    }
    this.spikeRun = 0;

    this.windowElapsed += deltaMS;
    this.windowSamples.push(deltaMS);
    if (this.windowElapsed < WINDOW_MS) return;

    const samples = this.windowSamples;
    const average = this.windowElapsed / samples.length;

    // The fastest decile of the window approximates the vsync interval the
    // rAF stream is quantized to — on a 30Hz-capped session it sits near
    // 33ms with the renderer idle, so it must not count as load.
    const sorted = samples.slice().sort((a, b) => a - b);
    const p10 = sorted[Math.floor(sorted.length * 0.1)];
    this.vsyncBaseline = Math.min(
      this.vsyncBaseline,
      Math.max(p10, FASTEST_VSYNC_MS),
    );

    this.windowElapsed = 0;
    this.windowSamples.length = 0;

    const budget = Math.max(
      DEGRADE_AVG_FRAME_MS,
      this.vsyncBaseline * VSYNC_HEADROOM,
    );
    if (average > budget) this.degrade();
  }

  /** Notifies on tier change. Returns an unsubscribe function. */
  subscribe(listener: TierListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private degrade(): void {
    if (this.currentTier >= 2) return;
    this.currentTier = (this.currentTier + 1) as QualityTier;
    for (const listener of this.listeners) listener(this.currentTier);
  }
}

/** Module-level singleton — the tier survives route changes by design. */
export const qualityGovernor = new QualityGovernor();
