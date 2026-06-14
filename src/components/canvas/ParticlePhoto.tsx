"use client";

import { useEffect, useMemo } from "react";
import { usePixiScene } from "@/pixi/PixiSceneContext";
import type { PortraitSceneConfig } from "@/pixi/types";

const DEFAULT_MAX_PARTICLES = 200000;

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
  /** Max particle count cap. Default 200000. Raise for a solid, filled photo. */
  maxParticles?: number;
  animate?: boolean;
  explode?: boolean;
  onExplodeComplete?: () => void;
}

function normalizeDensity(value: number | undefined): number {
  const num = Number(value);
  if (isNaN(num) || num <= 0) return 2;
  return Math.max(1, Math.round(num));
}

function normalizeMaxParticles(value: number | undefined): number {
  const num = Number(value);
  if (isNaN(num) || num <= 0) return DEFAULT_MAX_PARTICLES;
  return Math.round(num);
}

export default function ParticlePhoto({
  imageSrc = "/images/kindra-photo.png",
  maxWidth = 700,
  xOffset = 250,
  particleSize = 1.8,
  edgeFade = 0.15,
  brightness = 1,
  density = 2,
  maxParticles = DEFAULT_MAX_PARTICLES,
  animate = false,
  explode = false,
  onExplodeComplete,
}: ParticlePhotoProps) {
  const { setPortraitScene } = usePixiScene();

  // Normalize props before passing to stage/adapter
  const normalizedDensity = normalizeDensity(density);
  const normalizedMaxParticles = normalizeMaxParticles(maxParticles);

  const config = useMemo<PortraitSceneConfig>(
    () => ({
      imageSrc,
      maxWidth,
      xOffset,
      particleSize,
      edgeFade,
      brightness,
      density: normalizedDensity,
      maxParticles: normalizedMaxParticles,
      animate,
      explode,
      onExplodeComplete,
    }),
    [
      animate,
      brightness,
      normalizedDensity,
      edgeFade,
      explode,
      imageSrc,
      normalizedMaxParticles,
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
