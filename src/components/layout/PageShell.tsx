"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import PageChrome from "@/components/layout/PageChrome";
import { getRouteMeta } from "@/lib/routeIndex";
import { usePixiScene } from "@/pixi/PixiSceneContext";
import { prefersReducedMotion } from "@/pixi/utils";
import styles from "./shell.module.css";

/**
 * Shared navigation context — lets any descendant (PageNav, a back link,
 * a card) trigger the explode→navigate transition without each page
 * re-implementing the pendingNavRef / exploding state machine.
 *
 * Before: home/projetos/sobre/contato each hand-rolled identical
 * handleBackClick/handleNavClick/handleExplodeComplete; skills had no
 * transition and /now bypassed it with an immediate router.push.
 * Now there is exactly one machine, here.
 */
interface ShellNavContextValue {
  exploding: boolean;
  /** Begin the explode transition, then navigate to `href` when it finishes. */
  navigateWithExplode: (href: string) => void;
  /** Convenience onClick factory for links: preventDefault + explode-nav. */
  onNavClick: (href: string) => (e: React.MouseEvent) => void;
}

const ShellNavContext = createContext<ShellNavContextValue | null>(null);

export function useShellNav(): ShellNavContextValue {
  const ctx = useContext(ShellNavContext);
  if (!ctx) {
    throw new Error("useShellNav must be used within a <PageShell>");
  }
  return ctx;
}

/**
 * Slew pacing. One continuous take: the explode IS the transition (the old
 * full-screen iris is retired), so the route push fires the moment the
 * background finishes — or at the hard fallback below, whichever comes first.
 */
/** Structural deadlock guard: router.push ALWAYS fires by this point. */
const NAV_FALLBACK_MS = 1200;
/** Standard slew (non-adjacent routes): streak + telemetry band. */
const SLEW_STANDARD_MS = 1100;
/** Fast path for adjacent routes (|Δindex| <= 1): streak only, no band. */
const SLEW_FAST_MS = 700;
/** Routes without a background (/now): band + fade, push at mid-flight. */
const SLEW_FADE_MS = 700;

interface PageShellProps {
  children: ReactNode;
  /**
   * Background layer (ParticlePhoto / BlackHole / backdrop). It is rendered
   * behind the shell and receives the explode signal via the render-prop arg
   * so it can play its dissolve in sync with navigation.
   */
  background?: (state: { exploding: boolean; onExplodeComplete: () => void }) => ReactNode;
  /**
   * Set when the background scene persists across navigation with no
   * navigation-tied dissolve to mask the route swap (the /skills black
   * hole). The shell then runs the fade-band slew — veil + route push at
   * mid-flight — exactly like background-less routes, instead of trusting
   * an explode that never visually happens. Without this, the swap is a
   * naked hard cut under a still-playing telemetry band.
   */
  persistentBackground?: boolean;
  /** Override the HUD role line (default derives from route status). */
  hudRole?: string;
  /** Override the right-edge vertical strip text. */
  stripText?: string;
  /** Extra className on the shell container (e.g. a per-page accent var). */
  className?: string;
  /** Inline style on the shell (e.g. `--project-accent`). */
  style?: React.CSSProperties;
}

/**
 * The single page container every route renders inside. Provides the
 * tokenized 1280px shell, mounts the shared chrome (deriving index/label
 * from the route registry by pathname — no hand-passed literals), owns the
 * explode/navigate machine, and supplies the mobile svh/snap fallback.
 */
export default function PageShell({
  children,
  background,
  persistentBackground = false,
  hudRole,
  stripText,
  className,
  style,
}: PageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { beginSlew } = usePixiScene();
  const meta = getRouteMeta(pathname);
  const isHome = pathname === "/";
  // A background only masks the route swap when it plays a navigation-tied
  // dissolve (ParticlePhoto). Persistent scenes can't — they take the
  // fade-band path below, same as routes with no background at all.
  const backgroundMasksSwap = !!background && !persistentBackground;

  const [exploding, setExploding] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const navigatedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Never leave stray nav timers behind after the route swaps this shell out.
  useEffect(
    () => () => {
      for (const t of timersRef.current) window.clearTimeout(t);
      timersRef.current = [];
    },
    [],
  );

  /** Fires the pending push exactly once, clearing every scheduled fallback. */
  const performNavigate = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
    if (pendingNavRef.current) {
      router.push(pendingNavRef.current);
    }
  }, [router]);

  const navigateWithExplode = useCallback(
    (href: string) => {
      if (exploding) return;
      pendingNavRef.current = href;
      navigatedRef.current = false;
      setExploding(true);

      const reduced = prefersReducedMotion();

      if (!reduced) {
        // One continuous take: tell the Pixi stages where we are slewing so
        // the portrait streaks toward the target and the telemetry band
        // (TransitionLayer) plays over the flight. Adjacent routes take the
        // fast path; background-less routes get band + fade instead.
        const from = getRouteMeta(pathname);
        const to = getRouteMeta(href);
        const delta = Math.abs(Number(to.index) - Number(from.index));
        const adjacent = Number.isFinite(delta) && delta <= 1;
        const mode = !backgroundMasksSwap
          ? "fade-band"
          : adjacent
            ? "streak"
            : "streak-band";
        const duration = !backgroundMasksSwap
          ? SLEW_FADE_MS
          : adjacent
            ? SLEW_FAST_MS
            : SLEW_STANDARD_MS;
        beginSlew({ fromPath: pathname, toPath: href, mode, duration });

        if (!backgroundMasksSwap) {
          // Nothing will call onExplodeComplete — push under the band's
          // mid-flight fade peak so the swap hides inside the take.
          timersRef.current.push(
            window.setTimeout(performNavigate, Math.round(duration * 0.5)),
          );
        }
      } else if (!backgroundMasksSwap) {
        // Reduced motion without a masking background: nothing fires the
        // explode callback, so push immediately (the 180ms reduced fade
        // covers it).
        timersRef.current.push(window.setTimeout(performNavigate, 0));
      }

      // Hard fallback — navigation is structurally guaranteed even if the
      // background never reports completion (the old /now deadlock).
      timersRef.current.push(window.setTimeout(performNavigate, NAV_FALLBACK_MS));
    },
    [beginSlew, exploding, backgroundMasksSwap, pathname, performNavigate],
  );

  const onNavClick = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      navigateWithExplode(href);
    },
    [navigateWithExplode],
  );

  const handleExplodeComplete = useCallback(() => {
    performNavigate();
  }, [performNavigate]);

  const handleBackClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigateWithExplode("/");
    },
    [navigateWithExplode],
  );

  return (
    <ShellNavContext.Provider value={{ exploding, navigateWithExplode, onNavClick }}>
      {background?.({ exploding, onExplodeComplete: handleExplodeComplete })}

      <div className={`${styles.shell} ${className ?? ""}`} style={style}>
        <PageChrome
          index={meta.index}
          label={meta.label}
          hudRole={hudRole}
          stripText={stripText}
          showBack={!isHome}
          onBackClick={isHome ? undefined : handleBackClick}
        />
        {children}
      </div>
    </ShellNavContext.Provider>
  );
}
