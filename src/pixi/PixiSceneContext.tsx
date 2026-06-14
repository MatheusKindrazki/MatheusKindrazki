"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  BlackHoleSceneConfig,
  PixiSceneState,
  PortraitSceneConfig,
  SlewConfig,
  SlewRequest,
} from "@/pixi/types";

interface PixiSceneContextValue extends PixiSceneState {
  setPortraitScene: (scene: PortraitSceneConfig | null) => void;
  setBlackHoleScene: (scene: BlackHoleSceneConfig | null) => void;
  /**
   * Announce a navigation slew. Stamps a monotonic id so repeated slews
   * between the same routes still retrigger the Pixi stages' effects.
   * Consumed by PixiOverlayStage (telemetry band) and PixiBackgroundStage
   * (portrait streak direction + explode rate).
   */
  beginSlew: (request: SlewRequest) => void;
}

const PixiSceneContext = createContext<PixiSceneContextValue | null>(null);

export function PixiSceneProvider({ children }: { children: ReactNode }) {
  const [portrait, setPortrait] = useState<PortraitSceneConfig | null>(null);
  const [blackHole, setBlackHole] = useState<BlackHoleSceneConfig | null>(null);
  const [slew, setSlew] = useState<SlewConfig | null>(null);
  const slewIdRef = useRef(0);

  const setPortraitScene = useCallback((scene: PortraitSceneConfig | null) => {
    setPortrait(scene);
  }, []);

  const setBlackHoleScene = useCallback((scene: BlackHoleSceneConfig | null) => {
    setBlackHole(scene);
  }, []);

  const beginSlew = useCallback((request: SlewRequest) => {
    slewIdRef.current += 1;
    setSlew({ ...request, id: slewIdRef.current });
  }, []);

  const value = useMemo<PixiSceneContextValue>(
    () => ({
      portrait,
      blackHole,
      slew,
      setPortraitScene,
      setBlackHoleScene,
      beginSlew,
    }),
    [beginSlew, blackHole, portrait, setBlackHoleScene, setPortraitScene, slew],
  );

  return (
    <PixiSceneContext.Provider value={value}>
      {children}
    </PixiSceneContext.Provider>
  );
}

export function usePixiScene() {
  const value = useContext(PixiSceneContext);
  if (!value) {
    throw new Error("usePixiScene must be used inside PixiSceneProvider");
  }
  return value;
}
