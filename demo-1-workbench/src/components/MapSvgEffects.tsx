import { useEffect, useState, useRef } from 'react';

/**
 * SVG effects layered over the iso map. Targets specific landmarks:
 *  • aviation blink lights atop transmission towers + water tower
 *  • sporadic lightning arcs between high-voltage tower pairs
 *  • feTurbulence water shimmer over the river edge
 *  • heat shimmer over substation yards
 *  • sun-glint sweeping across solar arrays
 */
export function MapSvgEffects() {
  return (
    <>
      <SolarGlint />
      <ArcLightning />
      <svg className="map-fx-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {/* WATER shimmer — animated turbulence + displacement */}
          <filter id="fx-water" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="1" result="t">
              <animate attributeName="baseFrequency" dur="14s" values="0.012 0.04; 0.018 0.03; 0.012 0.04" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="1.4"/>
          </filter>

          {/* HEAT shimmer — subtle vertical displacement, faster freq */}
          <filter id="fx-heat" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="4" result="h">
              <animate attributeName="baseFrequency" dur="3.2s" values="0.02 0.06; 0.025 0.07; 0.02 0.06" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="h" scale="0.55"/>
          </filter>

          {/* GLOW filters for lights */}
          <filter id="fx-glow-sm"><feGaussianBlur stdDeviation=".4"/></filter>
          <filter id="fx-glow-md"><feGaussianBlur stdDeviation="1.2"/></filter>

          {/* RIVER gradient — cyan‐blue */}
          <linearGradient id="grad-river" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity=".0"/>
            <stop offset="50%" stopColor="#22d3ee" stopOpacity=".55"/>
            <stop offset="100%" stopColor="#0891b2" stopOpacity=".0"/>
          </linearGradient>
        </defs>

        {/* ---------- RIVER SHIMMER ---------- */}
        <g filter="url(#fx-water)">
          <path
            d="M-1,28
               C 1.8,40  3.5,52  2.6,64
               C 1.8,76  3.4,86  1.6,99
               L -1,99 Z"
            fill="url(#grad-river)"
          />
        </g>

        {/* ---------- HEAT SHIMMER over substation yards ---------- */}
        <g filter="url(#fx-heat)" opacity=".55">
          <rect x="10" y="50" width="10" height="14" fill="#facc15" opacity=".10" />
          <rect x="27" y="35" width="11" height="13" fill="#facc15" opacity=".10" />
          <rect x="66" y="45" width="10" height="13" fill="#facc15" opacity=".10" />
          <rect x="84" y="38" width="9"  height="13" fill="#facc15" opacity=".10" />
        </g>

        {/* ---------- AVIATION LIGHTS (slow, ambient — no more strobe) ---------- */}
        <BlinkDot cx={12} cy={5}  color="#ef4444" period={3.6} delay={0}    />
        <BlinkDot cx={50} cy={2}  color="#ef4444" period={3.6} delay={0.9}  />
        <BlinkDot cx={92} cy={5}  color="#ef4444" period={3.6} delay={1.8}  />
        <BlinkDot cx={96} cy={62} color="#ef4444" period={4.0} delay={1.2}  />
        <BlinkDot cx={4}  cy={26} color="#ef4444" period={4.0} delay={2.4}  />
        <BlinkDot cx={80} cy={4}  color="#fbbf24" period={5.0} delay={0}    sizeBoost />
        <BlinkDot cx={50} cy={32} color="#22d3ee" period={6.0} delay={0.5}  thin />

        {/* ---------- WINDOW LIGHT FLICKER (control building) ---------- */}
        <g opacity=".7">
          <rect x="48" y="38" width="6" height="5" fill="#fde047" opacity=".18">
            <animate attributeName="opacity" values=".18;.32;.18;.22;.18" dur="4s" repeatCount="indefinite"/>
          </rect>
        </g>
      </svg>
    </>
  );
}

interface BlinkProps { cx: number; cy: number; color: string; period: number; delay: number; sizeBoost?: boolean; thin?: boolean }
function BlinkDot({ cx, cy, color, period, delay, sizeBoost, thin }: BlinkProps) {
  const r = sizeBoost ? 0.7 : thin ? 0.35 : 0.55;
  const rGlow = sizeBoost ? 1.6 : thin ? 0.9 : 1.3;
  return (
    <g>
      <circle cx={cx} cy={cy} r={rGlow} fill={color} filter="url(#fx-glow-md)" opacity={.6}>
        <animate attributeName="opacity" values="0;.6;.6;0;0" dur={`${period}s`} begin={`${delay}s`} repeatCount="indefinite"/>
      </circle>
      <circle cx={cx} cy={cy} r={r} fill={color} filter="url(#fx-glow-sm)">
        <animate attributeName="opacity" values="1;0;0;1;1" dur={`${period}s`} begin={`${delay}s`} repeatCount="indefinite"/>
      </circle>
    </g>
  );
}

/* ---------- SOLAR GLINT (CSS-driven sweeping highlight over arrays) ---------- */
function SolarGlint() {
  return (
    <div className="solar-glint-layer">
      {/* Each glint is positioned over a known solar-array spot in the image. */}
      <div className="glint" style={{ left: '8%',  top: '34%', width: '14%', height: '9%' }} />
      <div className="glint" style={{ left: '36%', top: '16%', width: '10%', height: '7%' }} />
      <div className="glint" style={{ left: '60%', top: '24%', width: '9%',  height: '7%' }} />
      <div className="glint" style={{ left: '30%', top: '62%', width: '18%', height: '11%' }} />
      <div className="glint" style={{ left: '50%', top: '63%', width: '14%', height: '10%' }} />
    </div>
  );
}

/* ---------- SPORADIC LIGHTNING ARCS between transmission tower tops ---------- */
const ARC_PAIRS: Array<[number, number, number, number]> = [
  // [x1, y1, x2, y2] in %
  [12, 5,  50, 2 ],
  [50, 2,  92, 5 ],
  [92, 5,  96, 62],
  [4, 26,  12, 5 ],
];

function jaggedPath(x1: number, y1: number, x2: number, y2: number, segs = 6, jitter = 1.0): string {
  const pts: string[] = [`M${x1},${y1}`];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter * 2;
    const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter * 2;
    pts.push(`L${mx.toFixed(2)},${my.toFixed(2)}`);
  }
  pts.push(`L${x2},${y2}`);
  return pts.join(' ');
}

function ArcLightning() {
  const [arc, setArc] = useState<{ id: number; d: string } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let id = 0;
    function schedule() {
      const wait = 14000 + Math.random() * 16000; // 14–30s between strikes (was 4–10s)
      timerRef.current = window.setTimeout(() => {
        const [x1, y1, x2, y2] = ARC_PAIRS[Math.floor(Math.random() * ARC_PAIRS.length)];
        const d = jaggedPath(x1, y1, x2, y2, 6 + Math.floor(Math.random() * 3), 0.9);
        setArc({ id: ++id, d });
        // multi-flash sequence (zap! zap! zap!)
        window.setTimeout(() => setArc({ id: ++id, d: jaggedPath(x1, y1, x2, y2, 7, 1.1) }), 70);
        window.setTimeout(() => setArc({ id: ++id, d: jaggedPath(x1, y1, x2, y2, 5, 0.6) }), 150);
        window.setTimeout(() => setArc(null), 360);
        schedule();
      }, wait);
    }
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <svg className="arc-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation=".6"/>
        </filter>
      </defs>
      {arc && (
        <g key={arc.id}>
          <path d={arc.d} stroke="#67e8f9" strokeWidth=".35" fill="none" filter="url(#arcGlow)" opacity=".9"/>
          <path d={arc.d} stroke="#ecfeff" strokeWidth=".18" fill="none" opacity="1"/>
        </g>
      )}
    </svg>
  );
}
