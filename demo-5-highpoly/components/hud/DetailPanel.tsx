"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { X, ClipboardCheck, Stethoscope, Send } from "lucide-react";
import { useWorldStore } from "@/lib/store/worldStore";
import { useAlertStore } from "@/lib/store/alertStore";
import { DEVICE_BY_ID } from "@/lib/mock/devices";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DataTick } from "@/components/primitives/DataTick";
import { StateBadge } from "@/components/primitives/StateBadge";
import { AGENT_BY_ID } from "@/lib/mock/agents";
import { AGENT_COLORS, STATE_COLORS } from "@/lib/theme/colors";
import { generateSparkline } from "@/lib/mock/stream";
import { cn, formatRelative } from "@/lib/utils";

export function DetailPanel() {
  const selectedId = useWorldStore((s) => s.selectedDeviceId);
  const selectDevice = useWorldStore((s) => s.selectDevice);
  const deviceStates = useWorldStore((s) => s.deviceStates);
  const alarms = useAlertStore((s) => s.alarms);

  const device = selectedId ? DEVICE_BY_ID[selectedId] : null;
  const liveState = selectedId ? deviceStates[selectedId] ?? "healthy" : "healthy";

  const deviceAlarms = useMemo(
    () => (device ? alarms.filter((a) => a.deviceId === device.id) : []),
    [device, alarms],
  );

  const sparkline = useMemo(() => {
    if (!device) return [];
    const seed = device.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    return generateSparkline(seed, 48);
  }, [device]);

  return (
    <AnimatePresence>
      {device && (
        <motion.div
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute right-3 top-16 w-[22rem] h-[660px] max-h-[calc(100vh-100px)] z-30 pointer-events-auto"
        >
          <div className="relative h-full clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)]"
            style={{ boxShadow: "0 0 32px rgba(0,0,0,0.6)" }}
          >
            <div className="absolute top-0 left-3 right-3 h-[1px]"
              style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
            />
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 flex items-start justify-between border-b border-[var(--color-rule)]">
                <div>
                  <div className="font-mono text-[10px] text-text-muted">{device.id}</div>
                  <OrnateTitle size="sm" notch={false}>
                    {device.name}
                  </OrnateTitle>
                  <div className="text-[10px] font-condensed uppercase tracking-[0.16em] text-text-secondary mt-0.5">
                    {device.type.replace("_", " ")} · {device.protocol} · SN {device.sn}
                  </div>
                </div>
                <button onClick={() => selectDevice(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-dark px-4 py-3 space-y-4">
                {/* State */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
                    <div className="text-[9px] font-condensed font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Operational State
                    </div>
                    <div className="mt-1">
                      <StateBadge state={liveState} />
                    </div>
                  </div>
                  <DataTick
                    label="Rated"
                    value={(device.ratedPowerW / 1000).toFixed(0)}
                    unit="kW"
                    size="md"
                    align="left"
                    className="p-2.5 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
                  />
                </div>

                {/* Sparkline */}
                <div className="p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-condensed font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Output · last 24h
                    </div>
                    <div className="font-mono text-[10px] text-text-secondary">
                      kW · 30m bins
                    </div>
                  </div>
                  <Sparkline values={sparkline} state={liveState} />
                </div>

                {/* Alarms */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <OrnateTitle size="xs">Linked Events</OrnateTitle>
                    <span className="font-mono text-[10px] text-text-muted">{deviceAlarms.length}</span>
                  </div>
                  {deviceAlarms.length === 0 && (
                    <div className="text-[11px] text-text-muted italic px-2 py-3">
                      No events recorded for this device in the last 24 hours.
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {deviceAlarms.slice(0, 4).map((a) => {
                      const agent = AGENT_BY_ID[a.recommendedAgent];
                      const agentColor = AGENT_COLORS[a.recommendedAgent];
                      return (
                        <div
                          key={a.id}
                          className="px-2.5 py-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
                          style={{ boxShadow: `inset 2px 0 0 ${agentColor.hex}` }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-text-secondary">{a.id}</span>
                            <span className="font-mono text-[10px] text-text-muted">
                              {formatRelative(a.timestamp)} ago
                            </span>
                          </div>
                          <div className="text-[11px] text-text-primary mt-1">{a.message}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span
                              className="text-[8px] font-mono uppercase tracking-[0.16em] px-1.5 py-0.5"
                              style={{ color: agentColor.hex, border: `1px solid ${agentColor.hex}55` }}
                            >
                              {agent.glyph} {agent.shortName}
                            </span>
                            {a.estimatedLossKWh != null && (
                              <span className="font-mono text-[9px] text-text-muted">
                                Loss est · {a.estimatedLossKWh} kWh
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI recommendations */}
                <div>
                  <OrnateTitle size="xs">AI Recommendations</OrnateTitle>
                  <div className="space-y-2 mt-2">
                    <Recommendation
                      glyph="✦"
                      agentId="diagnosis"
                      title="Run extended fault diagnostic"
                      desc="Cross-references the past 7 days of telemetry against the fault knowledge graph."
                    />
                    <Recommendation
                      glyph="⌘"
                      agentId="ticket"
                      title="Auto-draft work order"
                      desc="One-click confirm to dispatch a crew with parts pre-staged. Requires operator confirmation."
                    />
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="px-4 py-3 border-t border-[var(--color-rule)] flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1b2238] hover:bg-[#26304a] clip-hex-frame-sm transition-colors">
                  <ClipboardCheck className="w-3.5 h-3.5 text-[var(--color-gold-rim)]" />
                  <span className="font-condensed text-[11px] uppercase tracking-[0.18em] text-text-primary">
                    Dispatch Ticket
                  </span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#10162a] hover:bg-[#1b2238] clip-hex-frame-sm transition-colors">
                  <Stethoscope className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="font-condensed text-[11px] uppercase tracking-[0.18em] text-text-primary">
                    Diagnose
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Sparkline({ values, state }: { values: number[]; state: keyof typeof STATE_COLORS }) {
  const W = 290;
  const H = 64;
  if (values.length === 0) return null;
  const step = W / (values.length - 1);
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${H - v * H}`)
    .join(" ");
  const areaPath = `${path} L ${W} ${H} L 0 ${H} Z`;
  const color = STATE_COLORS[state].hex;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
      <defs>
        <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <pattern id="sparkGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#sparkGrid)" />
      <path d={areaPath} fill="url(#sparkGradient)" />
      <path d={path} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}

function Recommendation({
  glyph,
  agentId,
  title,
  desc,
}: {
  glyph: string;
  agentId: keyof typeof AGENT_COLORS;
  title: string;
  desc: string;
}) {
  const color = AGENT_COLORS[agentId];
  return (
    <div
      className={cn("flex gap-2.5 px-2.5 py-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)] stripe-ai")}
      style={{ boxShadow: `inset 2px 0 0 ${color.hex}` }}
    >
      <div
        className="flex-shrink-0 w-6 h-6 clip-hex-frame-sm flex items-center justify-center font-display text-[11px] font-bold"
        style={{
          background: `linear-gradient(135deg, ${color.hex}33 0%, #0a0e1a 70%)`,
          color: color.hex,
          border: `1px solid ${color.hex}66`,
        }}
      >
        {glyph}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-condensed font-semibold uppercase tracking-[0.16em] text-text-primary">
            {title}
          </div>
          <Send className="w-3 h-3 text-text-muted" />
        </div>
        <div className="text-[10px] text-text-secondary mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
