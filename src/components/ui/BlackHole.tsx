"use client";

import { useEffect, useMemo } from "react";
import { usePixiScene } from "@/pixi/PixiSceneContext";
import type { BlackHoleSceneConfig } from "@/pixi/types";

interface BlackHoleProps {
  src: string;
  alt?: string;
  className?: string;
  /** Horizontal offset in px for the black hole center (positive = right) */
  offsetX?: number;
  /** When false, the center remains a singularity instead of revealing media. */
  revealMedia?: boolean;
  /** Called once when the shockwave explosion completes */
  onFormationComplete?: () => void;
}

export default function BlackHole({
  src,
  alt = "",
  className = "",
  offsetX = 0,
  revealMedia = true,
  onFormationComplete,
}: BlackHoleProps) {
  const { setBlackHoleScene } = usePixiScene();

  const config = useMemo<BlackHoleSceneConfig>(
    () => ({
      src,
      alt,
      className,
      offsetX,
      revealMedia,
      onFormationComplete,
    }),
    [alt, className, offsetX, onFormationComplete, revealMedia, src],
  );

  useEffect(() => {
    setBlackHoleScene(config);
    return () => setBlackHoleScene(null);
  }, [config, setBlackHoleScene]);

  return null;
}
