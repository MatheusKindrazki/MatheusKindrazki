"use client";

import { useEffect, useRef } from "react";
import { Application, Container, type Ticker } from "pixi.js";
import { usePixiScene } from "@/pixi/PixiSceneContext";
import { BlackHoleLayer } from "@/pixi/layers/BlackHoleLayer";
import { PortraitParticlesLayer } from "@/pixi/layers/PortraitParticlesLayer";
import { StarfieldLayer } from "@/pixi/layers/StarfieldLayer";

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
  const { portrait, blackHole } = usePixiScene();
  const sceneRef = useRef({ portrait, blackHole });

  sceneRef.current = { portrait, blackHole };

  useEffect(() => {
    let cancelled = false;
    let layers: BackgroundLayers | null = null;

    async function boot() {
      if (!hostRef.current) return;

      const app = new Application();
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
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

      app.stage.addChild(root);
      starfield.mount(root);
      portraitLayer.mount(root);
      blackHoleLayer.mount(root);

      const tick = (ticker: Ticker) => {
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
      portraitLayer.setConfig(sceneRef.current.portrait);
      blackHoleLayer.setConfig(sceneRef.current.blackHole);
    }

    void boot();

    return () => {
      cancelled = true;
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
