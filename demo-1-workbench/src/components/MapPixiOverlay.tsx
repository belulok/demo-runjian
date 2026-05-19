import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, BlurFilter, Ticker } from 'pixi.js';

/**
 * GPU-accelerated particle effects layered on top of the iso map.
 * - Smoke plume from the cooling tower (top-right)
 * - Light steam from the water-treatment tanks (top-left)
 * - Spark drift from substation yards (4 spots)
 *
 * Positions are expressed in % of the stage so they stay locked to map landmarks
 * even as the user pans/zooms (the parent .map-world is CSS-transformed by
 * react-zoom-pan-pinch — the canvas scales with it).
 */
export function MapPixiOverlay() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cancelled = false;
    let tickerCb: ((t: Ticker) => void) | null = null;

    app
      .init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })
      .then(() => {
        if (cancelled) return;
        host.appendChild(app.canvas);

        // -------- LAYERS --------
        const smokeLayer = new Container();
        const steamLayer = new Container();
        const sparkLayer = new Container();
        smokeLayer.filters = [new BlurFilter({ strength: 6, quality: 4 })];
        steamLayer.filters = [new BlurFilter({ strength: 5, quality: 3 })];
        app.stage.addChild(smokeLayer, steamLayer, sparkLayer);

        interface P {
          gfx: Graphics;
          vx: number;
          vy: number;
          life: number;
          maxLife: number;
          startScale: number;
          endScale: number;
          startAlpha: number;
        }
        const smoke: P[] = [];
        const steam: P[] = [];
        const sparks: P[] = [];

        // emitter spec → tower coordinates (in % of stage)
        const SMOKE_TOWERS = [
          { x: 0.945, y: 0.07, color: 0xc0c8d0, drift: 0.35, rise: -0.7, sizeMin: 4, sizeMax: 9, spawnMs: 70 },
          { x: 0.80, y: 0.06, color: 0xb8c2cc, drift: 0.28, rise: -0.55, sizeMin: 3, sizeMax: 6, spawnMs: 110 }, // water tower
        ];
        const STEAM_TANKS = [
          { x: 0.27, y: 0.10, color: 0xdfeaf3, drift: 0.18, rise: -0.5, sizeMin: 3, sizeMax: 7, spawnMs: 130 },
          { x: 0.35, y: 0.09, color: 0xdfeaf3, drift: 0.22, rise: -0.45, sizeMin: 3, sizeMax: 6, spawnMs: 150 },
        ];
        const SPARK_YARDS: Array<{ x: number; y: number; color: number; drift: number; rise: number; sizeMin: number; sizeMax: number; spawnMs: number }> = [
          // sparks removed — user asked to strip the strobe effects
        ];

        type Spec = (typeof SMOKE_TOWERS)[number];
        function makeParticle(spec: Spec, layer: Container, list: P[], maxLifeMs: number, startAlpha: number) {
          const w = app.screen.width;
          const h = app.screen.height;
          const gfx = new Graphics();
          const size = spec.sizeMin + Math.random() * (spec.sizeMax - spec.sizeMin);
          gfx.circle(0, 0, size).fill({ color: spec.color, alpha: 1 });
          gfx.x = spec.x * w + (Math.random() - 0.5) * 6;
          gfx.y = spec.y * h + (Math.random() - 0.5) * 4;
          gfx.alpha = startAlpha;
          layer.addChild(gfx);
          list.push({
            gfx,
            vx: spec.drift + (Math.random() - 0.5) * 0.15,
            vy: spec.rise + (Math.random() - 0.5) * 0.12,
            life: 0,
            maxLife: maxLifeMs * (0.7 + Math.random() * 0.6),
            startScale: 1,
            endScale: 2.4 + Math.random() * 1.2,
            startAlpha,
          });
        }

        // spawn timers (ms accumulators)
        const acc: Record<string, number> = {};
        SMOKE_TOWERS.forEach((_, i) => (acc[`sm${i}`] = 0));
        STEAM_TANKS.forEach((_, i) => (acc[`st${i}`] = 0));
        SPARK_YARDS.forEach((_, i) => (acc[`sp${i}`] = 0));

        tickerCb = (t: Ticker) => {
          const dt = t.deltaMS;

          // spawn
          SMOKE_TOWERS.forEach((spec, i) => {
            acc[`sm${i}`] += dt;
            while (acc[`sm${i}`] >= spec.spawnMs) {
              acc[`sm${i}`] -= spec.spawnMs;
              makeParticle(spec, smokeLayer, smoke, 5200, 0.7);
            }
          });
          STEAM_TANKS.forEach((spec, i) => {
            acc[`st${i}`] += dt;
            while (acc[`st${i}`] >= spec.spawnMs) {
              acc[`st${i}`] -= spec.spawnMs;
              makeParticle(spec, steamLayer, steam, 3800, 0.55);
            }
          });
          SPARK_YARDS.forEach((spec, i) => {
            acc[`sp${i}`] += dt;
            while (acc[`sp${i}`] >= spec.spawnMs) {
              acc[`sp${i}`] -= spec.spawnMs;
              makeParticle(spec, sparkLayer, sparks, 1800, 0.95);
            }
          });

          // update all particle pools (note: dt is ~16ms at 60fps)
          const updatePool = (pool: P[], layer: Container) => {
            for (let i = pool.length - 1; i >= 0; i--) {
              const p = pool[i];
              p.life += dt;
              p.gfx.x += p.vx * (dt / 16.67);
              p.gfx.y += p.vy * (dt / 16.67);
              const t01 = Math.min(1, p.life / p.maxLife);
              const sc = p.startScale + (p.endScale - p.startScale) * t01;
              p.gfx.scale.set(sc);
              p.gfx.alpha = p.startAlpha * (1 - t01);
              if (p.life >= p.maxLife) {
                layer.removeChild(p.gfx);
                p.gfx.destroy();
                pool.splice(i, 1);
              }
            }
          };
          updatePool(smoke, smokeLayer);
          updatePool(steam, steamLayer);
          updatePool(sparks, sparkLayer);
        };
        app.ticker.add(tickerCb);
      })
      .catch(err => {
        // PIXI failed (older browser/WebGL?) — degrade gracefully, no console noise in prod.
        console.warn('[MapPixiOverlay] PIXI init failed', err);
      });

    return () => {
      cancelled = true;
      try {
        if (tickerCb && app.ticker) app.ticker.remove(tickerCb);
        app.destroy(true, { children: true, texture: true });
      } catch {
        /* noop */
      }
    };
  }, []);

  return <div className="pixi-layer" ref={hostRef} />;
}
