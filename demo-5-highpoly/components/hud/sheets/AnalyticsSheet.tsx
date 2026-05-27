"use client";

import { useMemo } from "react";
import { PLANTS } from "@/lib/mock/plants";
import { useWorldStore } from "@/lib/store/worldStore";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DataTick } from "@/components/primitives/DataTick";
import { generateSparkline } from "@/lib/mock/stream";
import { PRIMARY_KPI } from "@/lib/mock/kpis";
import { formatNumber } from "@/lib/utils";

export function AnalyticsSheet() {
  const activeId = useWorldStore((s) => s.activePlantId);

  // Produce stable per-plant series
  const series = useMemo(() => {
    return PLANTS.map((p, i) => ({
      plant: p,
      data: generateSparkline(p.capacityKWp + i * 17, 48),
    }));
  }, []);

  const W = 720;
  const H = 200;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* KPI summary row */}
      <div className="grid grid-cols-5 gap-2">
        <KpiCell label="PR · 7d avg" value={(PRIMARY_KPI.performanceRatio - 0.4).toFixed(1)} unit="%" tone="good" />
        <KpiCell label="PR · 30d avg" value={(PRIMARY_KPI.performanceRatio - 0.9).toFixed(1)} unit="%" tone="good" />
        <KpiCell label="Yield · today" value={formatNumber(PRIMARY_KPI.actualKWh)} unit="kWh" />
        <KpiCell label="Variance vs forecast" value="-2.6" unit="%" tone="warn" />
        <KpiCell label="Soiling loss · est" value="48" unit="kWh" tone="muted" />
      </div>

      {/* Multi-plant generation chart */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex items-center justify-between">
          <OrnateTitle size="xs">Generation · last 24h · all plants</OrnateTitle>
          <div className="flex items-center gap-3 font-mono text-[10px] text-text-muted">
            <Legend label="Active" color="var(--color-gold-rim)" />
            <Legend label="Others" color="#5b6680" />
          </div>
        </div>

        <div className="flex-1 p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
            <defs>
              <pattern id="anaGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="anaFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#c9a85a" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#c9a85a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect width={W} height={H} fill="url(#anaGrid)" />
            {/* Other plants — thin grey lines */}
            {series.map(({ plant, data }) => {
              if (plant.id === activeId) return null;
              const path = data
                .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * W} ${H - v * H}`)
                .join(" ");
              return (
                <path
                  key={plant.id}
                  d={path}
                  fill="none"
                  stroke="rgba(91,102,128,0.55)"
                  strokeWidth={1}
                />
              );
            })}
            {/* Active plant — gold thick line + gradient area */}
            {series.map(({ plant, data }) => {
              if (plant.id !== activeId) return null;
              const linePath = data
                .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * W} ${H - v * H}`)
                .join(" ");
              const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
              return (
                <g key={plant.id}>
                  <path d={areaPath} fill="url(#anaFill)" />
                  <path d={linePath} fill="none" stroke="#c9a85a" strokeWidth={1.6} />
                </g>
              );
            })}
            {/* X-axis ticks */}
            {[0, 6, 12, 18, 24].map((h) => (
              <g key={h}>
                <line x1={(h / 24) * W} y1={H - 4} x2={(h / 24) * W} y2={H} stroke="rgba(148,163,184,0.3)" strokeWidth={0.5} />
                <text x={(h / 24) * W + 2} y={H - 6} fontSize="8" fill="#5b6680" fontFamily="ui-monospace, monospace">
                  {h.toString().padStart(2, "0")}h
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Plant tile strip with sparkline */}
        <div className="grid grid-cols-5 gap-2">
          {series.map(({ plant, data }) => {
            const isActive = plant.id === activeId;
            const sparkPath = data
              .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * 100} ${30 - v * 30}`)
              .join(" ");
            return (
              <div
                key={plant.id}
                className="p-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
                style={isActive ? { boxShadow: "inset 0 -2px 0 var(--color-gold-rim)" } : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-condensed text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary truncate">
                    {plant.region}
                  </div>
                  <div className="font-mono text-[9px] text-text-muted">{plant.capacityKWp.toFixed(0)} kWp</div>
                </div>
                <svg viewBox="0 0 100 30" className="w-full h-7">
                  <path
                    d={sparkPath}
                    fill="none"
                    stroke={isActive ? "#c9a85a" : "#5b6680"}
                    strokeWidth={1.2}
                  />
                </svg>
              </div>
            );
          })}
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

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-2 h-0.5" style={{ background: color }} />
      {label}
    </span>
  );
}
