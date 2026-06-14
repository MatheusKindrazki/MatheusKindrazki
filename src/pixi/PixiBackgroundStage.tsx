"use client";

import { useEffect, useRef } from "react";
import { Application, Container, type Ticker } from "pixi.js";
import { usePixiScene } from "@/pixi/PixiSceneContext";
import { BlackHoleLayer } from "@/pixi/layers/BlackHoleLayer";
import { PortraitParticlesLayer } from "@/pixi/layers/PortraitParticlesLayer";
import { StarfieldLayer } from "@/pixi/layers/StarfieldLayer";
import { qualityGovernor } from "@/pixi/qualityGovernor";

interface BackgroundLayers {
  app: Application;
  root: Container;
  starfield: StarfieldLayer;
  portrait: PortraitParticlesLayer;
  blackHole: BlackHoleLayer;
  tick: (ticker: Ticker) => void;
}

export default function PixiBackgroundStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<BackgroundLayers | null>(null);
  const { portrait, blackHole, slew } = usePixiScene();
  const sceneRef = useRef({ portrait, blackHole, slew });

  sceneRef.current = { portrait, blackHole, slew };

  useEffect(() => {
    let cancelled = false;
    let layers: BackgroundLayers | null = null;
    let unsubscribeTier: (() => void) | null = null;

    async function boot() {
      if (!hostRef.current) return;

      const app = new Application();
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(
          window.devicePixelRatio || 1,
          qualityGovernor.resolutionCap,
        ),
        preference: "webgl",
      });

      if (cancelled || !hostRef.current) {
        app.destroy(true);
        return;
      }

      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      hostRef.current.appendChild(app.canvas);

      const root = new Container();
      const starfield = new StarfieldLayer();
      const portraitLayer = new PortraitParticlesLayer();
      const blackHoleLayer = new BlackHoleLayer();

      portraitLayer.setRenderer(app.renderer);
      app.stage.addChild(root);
      starfield.mount(root);
      portraitLayer.mount(root);
      blackHoleLayer.mount(root);

      // Adaptive quality: the governor watches real frame times and steps
      // the renderer resolution down (layers react to density on their own).
      unsubscribeTier = qualityGovernor.subscribe(() => {
        const next = Math.min(
          window.devicePixelRatio || 1,
          qualityGovernor.resolutionCap,
        );
        if (app.renderer.resolution !== next) {
          app.renderer.resize(app.screen.width, app.screen.height, next);
        }
      });

      const tick = (ticker: Ticker) => {
        qualityGovernor.sample(ticker.deltaMS);
        const { width, height } = app.screen;
        starfield.resize(width, height);
        portraitLayer.resize(width, height);
        blackHoleLayer.resize(width, height);
        starfield.update(ticker, width, height);
        portraitLayer.update(ticker, width, height);
        blackHoleLayer.update(ticker, width, height);
      };

      app.ticker.add(tick);
      layers = {
        app,
        root,
        starfield,
        portrait: portraitLayer,
        blackHole: blackHoleLayer,
        tick,
      };
      layersRef.current = layers;
      portraitLayer.setSlew(sceneRef.current.slew);
      portraitLayer.setConfig(sceneRef.current.portrait);
      blackHoleLayer.setConfig(sceneRef.current.blackHole);
    }

    void boot();

    return () => {
      cancelled = true;
      unsubscribeTier?.();
      unsubscribeTier = null;
      if (layers) {
        layers.app.ticker.remove(layers.tick);
        layers.starfield.destroy();
        layers.portrait.destroy();
        layers.blackHole.destroy();
        layers.root.destroy({ children: true });
        layers.app.destroy(true);
      }
      layersRef.current = null;
    };
  }, []);

  // Slew first: when a navigation begins, the direction/rate must be known
  // by the time the explode flag lands (both arrive in the same commit, and
  // the layer also applies a late slew to an in-flight explode).
  useEffect(() => {
    layersRef.current?.portrait.setSlew(slew);
  }, [slew]);

  useEffect(() => {
    layersRef.current?.portrait.setConfig(portrait);
  }, [portrait]);

  useEffect(() => {
    layersRef.current?.blackHole.setConfig(blackHole);
  }, [blackHole]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
