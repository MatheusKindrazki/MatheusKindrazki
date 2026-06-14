"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Application, Container, type Ticker } from "pixi.js";
import { CursorLayer } from "@/pixi/layers/CursorLayer";
import { TransitionLayer } from "@/pixi/layers/TransitionLayer";
import { usePixiScene } from "@/pixi/PixiSceneContext";

interface OverlayLayers {
  app: Application;
  root: Container;
  transition: TransitionLayer;
  cursor: CursorLayer;
  tick: (ticker: Ticker) => void;
}

export default function PixiOverlayStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<OverlayLayers | null>(null);
  const pathname = usePathname();
  const { slew } = usePixiScene();

  useEffect(() => {
    let cancelled = false;
    let layers: OverlayLayers | null = null;

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
      const transition = new TransitionLayer();
      const cursor = new CursorLayer();
      app.stage.addChild(root);
      transition.mount(root);
      cursor.mount(root);

      const tick = (ticker: Ticker) => {
        const { width, height } = app.screen;
        transition.resize(width, height);
        cursor.resize(width, height);
        transition.update(ticker, width, height);
        cursor.update(ticker, width, height);
      };

      app.ticker.add(tick);
      layers = { app, root, transition, cursor, tick };
      layersRef.current = layers;
      transition.setPath(pathname);
      cursor.setPath(pathname);
    }

    void boot();

    return () => {
      cancelled = true;
      if (layers) {
        layers.app.ticker.remove(layers.tick);
        layers.transition.destroy();
        layers.cursor.destroy();
        layers.root.destroy({ children: true });
        layers.app.destroy(true);
      }
      layersRef.current = null;
    };
  }, []);

  // Slew announcements arrive at navigation start (before the route push) so
  // the telemetry band plays OVER the portrait explode — one continuous take.
  useEffect(() => {
    if (slew) layersRef.current?.transition.beginSlew(slew);
  }, [slew]);

  useEffect(() => {
    layersRef.current?.transition.setPath(pathname);
    layersRef.current?.cursor.setPath(pathname);
  }, [pathname]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="fixed inset-0 z-[9998] pointer-events-none"
    />
  );
}
