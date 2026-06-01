"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import PageChrome from "@/components/layout/PageChrome";
import { getRouteMeta } from "@/lib/routeIndex";
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

interface PageShellProps {
  children: ReactNode;
  /**
   * Background layer (ParticlePhoto / BlackHole / backdrop). It is rendered
   * behind the shell and receives the explode signal via the render-prop arg
   * so it can play its dissolve in sync with navigation.
   */
  background?: (state: { exploding: boolean; onExplodeComplete: () => void }) => ReactNode;
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
  hudRole,
  stripText,
  className,
  style,
}: PageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);
  const isHome = pathname === "/";

  const [exploding, setExploding] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const navigateWithExplode = useCallback(
    (href: string) => {
      if (exploding) return;
      pendingNavRef.current = href;
      setExploding(true);
    },
    [exploding],
  );

  const onNavClick = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      navigateWithExplode(href);
    },
    [navigateWithExplode],
  );

  const handleExplodeComplete = useCallback(() => {
    if (pendingNavRef.current) {
      router.push(pendingNavRef.current);
    }
  }, [router]);

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
