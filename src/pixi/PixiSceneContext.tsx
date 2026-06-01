"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BlackHoleSceneConfig,
  PixiSceneState,
  PortraitSceneConfig,
} from "@/pixi/types";

interface PixiSceneContextValue extends PixiSceneState {
  setPortraitScene: (scene: PortraitSceneConfig | null) => void;
  setBlackHoleScene: (scene: BlackHoleSceneConfig | null) => void;
}

const PixiSceneContext = createContext<PixiSceneContextValue | null>(null);

export function PixiSceneProvider({ children }: { children: ReactNode }) {
  const [portrait, setPortrait] = useState<PortraitSceneConfig | null>(null);
  const [blackHole, setBlackHole] = useState<BlackHoleSceneConfig | null>(null);

  const setPortraitScene = useCallback((scene: PortraitSceneConfig | null) => {
    setPortrait(scene);
  }, []);

  const setBlackHoleScene = useCallback((scene: BlackHoleSceneConfig | null) => {
    setBlackHole(scene);
  }, []);

  const value = useMemo<PixiSceneContextValue>(
    () => ({
      portrait,
      blackHole,
      setPortraitScene,
      setBlackHoleScene,
    }),
    [blackHole, portrait, setBlackHoleScene, setPortraitScene],
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
