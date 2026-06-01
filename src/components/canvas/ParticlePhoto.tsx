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
  /** Pixel sampling step (lower = denser). Default 2. */
  density?: number;
  /** Max particle count cap. Default 30000. Raise for a solid, filled photo. */
  maxParticles?: number;
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
  density = 2,
  maxParticles = 30000,
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
      density,
      maxParticles,
      animate,
      explode,
      onExplodeComplete,
    }),
    [
      animate,
      brightness,
      density,
      edgeFade,
      explode,
      imageSrc,
      maxParticles,
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
