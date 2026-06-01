"use client";

import { useEffect, useMemo } from "react";
import { usePixiScene } from "@/pixi/PixiSceneContext";
import type { PortraitSceneConfig } from "@/pixi/types";

interface ParticlePhotoProps {
  imageSrc?: string;
  maxWidth?: number;
  xOffset?: number;
  particleSize?: number;
  edgeFade?: number;
  /** Brightness boost for dark photos (1 = original, >1 lifts shadows). */
  brightness?: number;
  animate?: boolean;
  explode?: boolean;
  onExplodeComplete?: () => void;
}

export default function ParticlePhoto({
  imageSrc = "/images/kindra-photo.png",
  maxWidth = 700,
  xOffset = 250,
  particleSize = 1.8,
  edgeFade = 0.15,
  brightness = 1,
  animate = false,
  explode = false,
  onExplodeComplete,
}: ParticlePhotoProps) {
  const { setPortraitScene } = usePixiScene();

  const config = useMemo<PortraitSceneConfig>(
    () => ({
      imageSrc,
      maxWidth,
      xOffset,
      particleSize,
      edgeFade,
      brightness,
      animate,
      explode,
      onExplodeComplete,
    }),
    [
      animate,
      brightness,
      edgeFade,
      explode,
      imageSrc,
      maxWidth,
      onExplodeComplete,
      particleSize,
      xOffset,
    ],
  );

  useEffect(() => {
    setPortraitScene(config);
    return () => setPortraitScene(null);
  }, [config, setPortraitScene]);

  return null;
}
