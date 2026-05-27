"use client";

import { useMemo, useRef, useState } from "react";
import { PLANTS, type Plant } from "@/lib/mock/plants";
import { DEVICES } from "@/lib/mock/devices";
import { useAlertStore } from "@/lib/store/alertStore";
import { useWorldStore } from "@/lib/store/worldStore";
import { STATION_BY_PLANT_ID } from "@/lib/mock/stations";
import { useCommandStore } from "@/lib/store/commandStore";
import { STATE_COLORS } from "@/lib/theme/colors";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DataTick } from "@/components/primitives/DataTick";
import { StateBadge } from "@/components/primitives/StateBadge";
import { generateSparkline } from "@/lib/mock/stream";
import { formatNumber } from "@/lib/utils";

const STATUS_COLOR = (s: Plant["status"]) =>
  s === "alarm"
    ? STATE_COLORS.faulted.hex
    : s === "warning"
      ? STATE_COLORS.degraded.hex
      : s === "offline"
        ? STATE_COLORS.offline.hex
        : STATE_COLORS.healthy.hex;

const STATUS_STATE = (s: Plant["status"]): keyof typeof STATE_COLORS =>
  s === "alarm" ? "faulted" : s === "warning" ? "degraded" : s === "offline" ? "offline" : "healthy";

// Geographic span (deliberately roomy so labels never clip)
const LNG_MIN = 99.0;
const LNG_MAX = 105.0;
const LAT_MIN = 0.4;
const LAT_MAX = 7.0;

// SVG viewport — wide enough for right-side labels at all scales
const VB_W = 760;
const VB_H = 560;
const MARGIN_X = 80;
const MARGIN_Y = 32;

function project(lng: number, lat: number) {
  const x = MARGIN_X + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (VB_W - MARGIN_X * 2);
  const y = MARGIN_Y + (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (VB_H - MARGIN_Y * 2);
  return { x, y };
}

export function MapSheet() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const setActive = useWorldStore((s) => s.setActivePlant);
  const panToWorld = useWorldStore((s) => s.panToWorld);
  const selectStation = useWorldStore((s) => s.selectStation);
  const closeSheet = useCommandStore((s) => s.close);
  const alarms = useAlertStore((s) => s.alarms);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const focusId = hoverId ?? activeId;
  const focus = PLANTS.find((p) => p.id === focusId) ?? PLANTS[0];

  const focusDevices = DEVICES.filter((d) => d.plantId === focus.id).length;
  const focusOpenAlarms = alarms.filter((a) => a.plantId === focus.id && a.status === "open").length;

  // Per-plant pre-computed sparkline + bubble geometry
  const plantViz = useMemo(() => {
    return PLANTS.map((p) => {
      const pos = project(p.lng, p.lat);
      const r = 5 + Math.sqrt(p.capacityKWp) / 10;
      const sparkline = generateSparkline(p.capacityKWp + p.lat * 13, 32);
      const openCount = alarms.filter((a) => a.plantId === p.id && a.status === "open").length;
      // Label placement: flip to left side if plant sits in the right half
      const labelOnLeft = pos.x > VB_W / 2;
      return { plant: p, pos, r, sparkline, openCount, labelOnLeft };
    });
  }, [alarms]);

  // Compute network lines (each plant to its nearest 2 others, deduped)
  const networkLines = useMemo(() => {
    const lines: { from: { x: number; y: number }; to: { x: number; y: number }; id: string }[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < plantViz.length; i++) {
      const a = plantViz[i];
      const others = plantViz
        .filter((_, j) => j !== i)
        .map((o) => ({
          o,
          d: Math.hypot(o.pos.x - a.pos.x, o.pos.y - a.pos.y),
        }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      for (const { o } of others) {
        const key = [a.plant.id, o.plant.id].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push({ from: a.pos, to: o.pos, id: key });
      }
    }
    return lines;
  }, [plantViz]);

  const handlePick = (p: Plant) => {
    setActive(p.id);
    const station = STATION_BY_PLANT_ID[p.id];
    if (station) {
      panToWorld(station.pos[0], station.pos[2]);
      selectStation(station.id);
    }
    closeSheet();
  };

  // Track cursor for tooltip positioning (HTML overlay, NOT clipped by SVG)
  const handleMove = (evt: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    setTooltipPos({
      x: evt.clientX - bounds.left,
      y: evt.clientY - bounds.top,
    });
  };

  const hoverPlant = plantViz.find((v) => v.plant.id === hoverId);

  return (
    <div className="grid grid-cols-[1fr_300px] gap-4 h-full">
      {/* Map */}
      <div className="relative p-3 bg-[#070a14] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full h-full"
          onMouseMove={handleMove}
          onMouseLeave={() => {
            setHoverId(null);
            setTooltipPos(null);
          }}
        >
          <defs>
            <radialGradient id="mapSea2" cx="50%" cy="55%" r="65%">
              <stop offset="0%" stopColor="#0a1322" />
              <stop offset="100%" stopColor="#02060e" />
            </radialGradient>
            <pattern id="mapGrid2" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.07)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="netLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(201,168,90,0.0)" />
              <stop offset="50%" stopColor="rgba(201,168,90,0.55)" />
              <stop offset="100%" stopColor="rgba(201,168,90,0.0)" />
            </linearGradient>
            <radialGradient id="sweep" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0)" />
              <stop offset="80%" stopColor="rgba(20, 184, 166, 0.06)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
            </radialGradient>
          </defs>

          <rect width={VB_W} height={VB_H} fill="url(#mapSea2)" />
          <rect width={VB_W} height={VB_H} fill="url(#mapGrid2)" />

          {/* Radar-style sweep ring (slow ambient) */}
          <g opacity={0.6}>
            <circle cx={VB_W / 2} cy={VB_H / 2} r={140} fill="none" stroke="rgba(20,184,166,0.10)" strokeWidth={0.6}>
              <animate attributeName="r" values="120;240;120" dur="10s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.20;0;0.20" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx={VB_W / 2} cy={VB_H / 2} r={200} fill="url(#sweep)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${VB_W / 2} ${VB_H / 2}`}
                to={`360 ${VB_W / 2} ${VB_H / 2}`}
                dur="20s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* Peninsular Malaysia silhouette — sized to span the full plant lat/lng range */}
          <g>
            {/* Land mass */}
            <path
              d={MALAY_PENINSULA}
              fill="rgba(148,163,184,0.08)"
              stroke="rgba(148,163,184,0.30)"
              strokeWidth={1}
            />
            {/* Inland highlight (paler interior) */}
            <path
              d={MALAY_PENINSULA}
              fill="none"
              stroke="rgba(201,168,90,0.10)"
              strokeWidth={0.4}
              transform="translate(0,-1)"
            />
            {/* Borneo reference (top-right) */}
            <path
              d={BORNEO_TIP}
              fill="rgba(148,163,184,0.05)"
              stroke="rgba(148,163,184,0.18)"
              strokeWidth={0.7}
            />
            <text x={672} y={465} fill="#3b4258" fontSize={10} fontFamily="ui-monospace, monospace">
              BORNEO
            </text>
            {/* Sumatra hint (left bottom) */}
            <path
              d={SUMATRA_HINT}
              fill="rgba(148,163,184,0.03)"
              stroke="rgba(148,163,184,0.10)"
              strokeWidth={0.5}
            />
            <text x={68} y={530} fill="#3b4258" fontSize={10} fontFamily="ui-monospace, monospace">
              SUMATRA
            </text>
          </g>

          {/* Network connection lines between plants */}
          {networkLines.map((l) => {
            const dx = l.to.x - l.from.x;
            const dy = l.to.y - l.from.y;
            const len = Math.hypot(dx, dy);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <g key={l.id} transform={`translate(${l.from.x},${l.from.y}) rotate(${angle})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={len}
                  y2={0}
                  stroke="rgba(201,168,90,0.18)"
                  strokeDasharray="3 4"
                  strokeWidth={0.7}
                />
                {/* Animated pulse particle along the line */}
                <circle r={1.5} fill="#c9a85a" opacity={0.85}>
                  <animate attributeName="cx" values={`0;${len};0`} dur="6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0.9;0" dur="6s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}

          {/* Plant bubbles */}
          {plantViz.map(({ plant, pos, r, sparkline, openCount, labelOnLeft }) => {
            const isActive = plant.id === activeId;
            const isHover = plant.id === hoverId;
            const color = STATUS_COLOR(plant.status);
            const labelX = labelOnLeft ? pos.x - r - 8 : pos.x + r + 8;
            const labelAnchor = labelOnLeft ? "end" : "start";

            // Mini sparkline geometry
            const sparkW = 56;
            const sparkH = 12;
            const sparkX = labelOnLeft ? pos.x - r - 8 - sparkW : pos.x + r + 8;
            const sparkY = pos.y + 16;
            const sparkPath = sparkline
              .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (sparkline.length - 1)) * sparkW} ${sparkH - v * sparkH}`)
              .join(" ");

            // Capacity ring fill ratio — pseudo-derived from sparkline current end
            const fill = sparkline[sparkline.length - 1];
            const ringR = r + 4;
            const circumf = 2 * Math.PI * ringR;
            const dash = circumf * fill;

            return (
              <g
                key={plant.id}
                onMouseEnter={() => setHoverId(plant.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => handlePick(plant)}
                style={{ cursor: "pointer" }}
              >
                {/* Alarm pulse */}
                {plant.status === "alarm" && (
                  <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke={color} strokeWidth={1} opacity={0.7}>
                    <animate attributeName="r" values={`${r};${r * 2.2};${r}`} dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Active marker */}
                {isActive && (
                  <circle cx={pos.x} cy={pos.y} r={r + 6} fill="none" stroke="var(--color-gold-rim)" strokeWidth={0.9} opacity={0.6}>
                    <animate attributeName="r" values={`${r + 6};${r + 12};${r + 6}`} dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Halo */}
                <circle cx={pos.x} cy={pos.y} r={r + 3} fill={color} opacity={isHover ? 0.22 : 0.12} />
                {/* Capacity ring (fills counter-clockwise by current %) */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={ringR}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.2}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={ringR}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.4}
                  strokeDasharray={`${dash} ${circumf}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${pos.x} ${pos.y})`}
                  opacity={0.9}
                />
                {/* Body */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={color}
                  stroke={isActive ? "var(--color-gold-rim)" : "#0a0e1a"}
                  strokeWidth={isActive ? 1.5 : 0.6}
                />
                {/* Alarm count badge */}
                {openCount > 0 && (
                  <g transform={`translate(${pos.x + r - 2}, ${pos.y - r + 2})`}>
                    <circle r={4.5} fill="#ef4444" stroke="#0a0e1a" strokeWidth={0.6} />
                    <text textAnchor="middle" y={1.8} fontSize={6.5} fill="#ffffff" fontFamily="ui-monospace, monospace" fontWeight={700}>
                      {openCount}
                    </text>
                  </g>
                )}
                {/* Label */}
                <text
                  x={labelX}
                  y={pos.y - 2}
                  textAnchor={labelAnchor}
                  fill={isHover || isActive ? "#e7ecf5" : "#9aa6bf"}
                  fontSize={11.5}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={isActive ? 700 : 400}
                >
                  {plant.region.toUpperCase()}
                </text>
                <text
                  x={labelX}
                  y={pos.y + 9}
                  textAnchor={labelAnchor}
                  fill="#5b6680"
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                >
                  {plant.capacityKWp.toFixed(0)} kWp · {Math.round(fill * 100)}%
                </text>
                {/* Mini sparkline */}
                <g transform={`translate(${sparkX}, ${sparkY})`}>
                  <rect x={0} y={0} width={sparkW} height={sparkH} fill="rgba(255,255,255,0.02)" stroke="rgba(148,163,184,0.10)" strokeWidth={0.3} />
                  <path d={sparkPath} fill="none" stroke={color} strokeWidth={1} opacity={0.95} />
                </g>
              </g>
            );
          })}

          {/* Compass */}
          <g transform={`translate(${VB_W - 56}, 44)`}>
            <circle cx={0} cy={0} r={20} fill="none" stroke="rgba(201,168,90,0.4)" strokeWidth={0.8} />
            <polygon points="0,-15 3,0 0,4 -3,0" fill="#c9a85a" />
            <polygon points="0,15 3,0 0,-4 -3,0" fill="rgba(201,168,90,0.35)" />
            <text x={0} y={-22} textAnchor="middle" fill="#c9a85a" fontSize={9} fontFamily="ui-monospace, monospace">N</text>
          </g>

          {/* Scale bar */}
          <g transform={`translate(${MARGIN_X}, ${VB_H - 20})`}>
            <line x1={0} y1={0} x2={100} y2={0} stroke="rgba(148,163,184,0.55)" strokeWidth={1} />
            <line x1={0} y1={-3} x2={0} y2={3} stroke="rgba(148,163,184,0.55)" />
            <line x1={50} y1={-2} x2={50} y2={2} stroke="rgba(148,163,184,0.55)" />
            <line x1={100} y1={-3} x2={100} y2={3} stroke="rgba(148,163,184,0.55)" />
            <text x={50} y={-6} textAnchor="middle" fontSize={8} fill="#5b6680" fontFamily="ui-monospace, monospace">
              ≈ 150 km
            </text>
          </g>

          {/* Live indicator */}
          <g transform={`translate(${MARGIN_X}, 24)`}>
            <circle r={3} fill="#34d399">
              <animate attributeName="r" values="2.4;3.4;2.4" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <text x={9} y={3} fontSize={9} fill="#34d399" fontFamily="ui-monospace, monospace" fontWeight={700}>
              LIVE · {plantViz.reduce((a, v) => a + v.openCount, 0)} alerts · {PLANTS.length} sectors
            </text>
          </g>
        </svg>

        {/* HTML hover tooltip — positioned with absolute, can extend beyond SVG */}
        {hoverPlant && tooltipPos && (
          <div
            className="absolute pointer-events-none px-2.5 py-1.5 bg-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.35)] clip-hex-frame-sm z-10 min-w-[180px]"
            style={{
              left: Math.min(tooltipPos.x + 16, 600),
              top: tooltipPos.y - 12,
              boxShadow: `inset 2px 0 0 ${STATUS_COLOR(hoverPlant.plant.status)}, 0 4px 16px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-0.5">
              <span className="font-display text-[11px] uppercase tracking-[0.18em] text-text-primary">
                {hoverPlant.plant.region}
              </span>
              <StateBadge state={STATUS_STATE(hoverPlant.plant.status)} size="xs" />
            </div>
            <div className="font-mono text-[10px] text-text-secondary">
              {hoverPlant.plant.name}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 font-mono text-[10px]">
              <span className="text-text-muted">Capacity</span>
              <span className="text-right text-text-primary">{hoverPlant.plant.capacityKWp.toFixed(0)} kWp</span>
              <span className="text-text-muted">OEM</span>
              <span className="text-right text-text-primary">{hoverPlant.plant.oem}</span>
              <span className="text-text-muted">Open alerts</span>
              <span className={hoverPlant.openCount > 0 ? "text-right text-amber-400" : "text-right text-emerald-400"}>
                {hoverPlant.openCount.toString().padStart(2, "0")}
              </span>
              <span className="text-text-muted">Output now</span>
              <span className="text-right text-text-primary">
                {Math.round(hoverPlant.sparkline[hoverPlant.sparkline.length - 1] * 100)}%
              </span>
            </div>
            <div className="mt-1 pt-1 border-t border-[var(--color-rule)] text-[9px] font-mono uppercase tracking-[0.16em] text-text-muted">
              click to open sector
            </div>
          </div>
        )}
      </div>

      {/* Side panel: focused plant detail */}
      <div className="flex flex-col gap-2 min-w-0">
        <div
          className="p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
          style={{ boxShadow: `inset 2px 0 0 ${STATUS_COLOR(focus.status)}` }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-text-muted">{focus.id}</span>
            <StateBadge state={STATUS_STATE(focus.status)} size="xs" />
          </div>
          <OrnateTitle size="sm">{focus.name}</OrnateTitle>
          <div className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-secondary mt-0.5">
            {focus.region}, Malaysia · {focus.oem}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <KpiCell label="Capacity" value={formatNumber(focus.capacityKWp)} unit="kWp" />
          <KpiCell label="Devices" value={focusDevices.toString()} />
          <KpiCell
            label="Open Alerts"
            value={focusOpenAlarms.toString().padStart(2, "0")}
            tone={focusOpenAlarms > 0 ? "warn" : "good"}
          />
          <KpiCell label="Build" value={focus.buildDate.slice(0, 7)} />
        </div>

        <div className="p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
          <div className="font-condensed text-[10px] uppercase tracking-[0.18em] text-text-muted mb-1.5">
            Coordinates
          </div>
          <div className="font-mono text-[11px] text-text-primary">
            {focus.lat.toFixed(4)}° N · {focus.lng.toFixed(4)}° E
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() => handlePick(focus)}
            className="flex-1 px-3 py-2 bg-[#1b2238] hover:bg-[#26304a] clip-hex-frame-sm font-condensed text-[11px] uppercase tracking-[0.18em] text-text-primary"
            style={{ boxShadow: "inset 0 -2px 0 var(--color-gold-rim)" }}
          >
            Enter Sector
          </button>
          <button
            disabled
            className="px-3 py-2 bg-[#10162a] clip-hex-frame-sm font-condensed text-[11px] uppercase tracking-[0.18em] text-text-muted cursor-not-allowed"
            title="Drone deployment scheduled in Phase 3"
          >
            Drone
          </button>
        </div>
        <div className="text-[10px] text-text-muted font-condensed">
          Hover any plant for live KPIs · network ticks show inter-sector data flow.
        </div>
      </div>
    </div>
  );
}

function KpiCell({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: "good" | "warn" | "bad" | "muted" }) {
  return (
    <div className="p-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
      <DataTick label={label} value={value} unit={unit} tone={tone} size="md" align="left" />
    </div>
  );
}

// Stylised peninsular Malaysia path. Calibrated against project() with
// LNG 99..105 → x 80..680 and LAT 0.4..7.0 → y 32..528 so all 5 plant
// bubbles sit comfortably inside the silhouette.
//   Kedah  ≈ (217, 98)
//   Penang ≈ (213, 152)
//   Perak  ≈ (289, 213)
//   Melaka ≈ (405, 394)
//   Johor  ≈ (554, 446)
const MALAY_PENINSULA = `
  M 240 60
  L 290 52
  L 330 68
  L 360 96
  L 376 130
  L 388 170
  L 404 210
  L 420 250
  L 432 282
  L 444 312
  L 460 342
  L 480 370
  L 506 392
  L 532 410
  L 558 422
  L 580 438
  L 596 458
  L 600 478
  L 588 494
  L 564 490
  L 538 472
  L 510 454
  L 484 446
  L 458 444
  L 432 432
  L 408 416
  L 388 396
  L 372 372
  L 358 344
  L 344 318
  L 326 286
  L 310 256
  L 294 226
  L 278 196
  L 264 168
  L 248 140
  L 232 114
  L 220 90
  L 218 70
  Z
`;

// Compact stub of Borneo's western tip (top-right corner)
const BORNEO_TIP = `
  M 640 392
  L 692 388
  L 716 402
  L 720 430
  L 706 456
  L 678 462
  L 652 452
  L 640 426
  Z
`;

// Small bit of Sumatra's eastern coast (bottom-left)
const SUMATRA_HINT = `
  M 60 480
  L 120 470
  L 140 488
  L 152 510
  L 140 530
  L 100 540
  L 64 524
  Z
`;

