"use client";

import { useMemo, useState } from "react";
import { AGENTS, AGENT_BY_ID, type AgentId } from "@/lib/mock/agents";
import { AGENT_COLORS } from "@/lib/theme/colors";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Speaker =
  | { kind: "agent"; id: AgentId }
  | { kind: "supervisor" }
  | { kind: "operator"; name: string };

type Channel = "supervisor" | "agent" | "operator";

type Entry = {
  id: string;
  ts: number;
  speaker: Speaker;
  to?: Speaker;
  channel: Channel;
  text: string;
};

const now = Date.now();

const FEED: Entry[] = [
  {
    id: "C-101",
    ts: now - 1000 * 45,
    speaker: { kind: "agent", id: "alarm" },
    to: { kind: "supervisor" },
    channel: "agent",
    text: "ALM-100024 critical — hot spot signature on PNL-03. Routing to Diagnosis for deep analysis.",
  },
  {
    id: "C-102",
    ts: now - 1000 * 60 * 1.4,
    speaker: { kind: "agent", id: "diagnosis" },
    to: { kind: "supervisor" },
    channel: "agent",
    text: "Match against fault graph: 11 prior cases. Confidence 0.84 — likely solder defect. Recommend dispatch.",
  },
  {
    id: "C-103",
    ts: now - 1000 * 60 * 1.8,
    speaker: { kind: "agent", id: "ticket" },
    channel: "agent",
    text: "Auto-drafted WO-2026-0518 (P1). Awaiting operator confirmation before dispatch.",
  },
  {
    id: "C-104",
    ts: now - 1000 * 60 * 2.5,
    speaker: { kind: "operator", name: "hunter" },
    to: { kind: "agent", id: "ticket" },
    channel: "operator",
    text: "Approve WO-2026-0518. Assign Tan Boon Wei, ETA 2h.",
  },
  {
    id: "C-105",
    ts: now - 1000 * 60 * 3.2,
    speaker: { kind: "agent", id: "scheduling" },
    channel: "agent",
    text: "Optimal route: depot → COM1-5 → PNL-03 → return. 14 km, 22 min. Weather clear.",
  },
  {
    id: "C-106",
    ts: now - 1000 * 60 * 4.1,
    speaker: { kind: "agent", id: "warning" },
    to: { kind: "supervisor" },
    channel: "agent",
    text: "Array A7 PR declining 1.8 %/hr since 09:12. Trend matches morning soiling pattern.",
  },
  {
    id: "C-107",
    ts: now - 1000 * 60 * 5.4,
    speaker: { kind: "agent", id: "data_qa" },
    channel: "agent",
    text: "Operator query on inverter COM1-5 24h output — sparkline pushed to detail panel.",
  },
  {
    id: "C-108",
    ts: now - 1000 * 60 * 6.6,
    speaker: { kind: "agent", id: "safety" },
    to: { kind: "agent", id: "scheduling" },
    channel: "agent",
    text: "Working-at-height risk on WO-2026-0517. Lock dispatch until safety briefing acknowledged.",
  },
  {
    id: "C-109",
    ts: now - 1000 * 60 * 8.0,
    speaker: { kind: "agent", id: "operation" },
    channel: "agent",
    text: "Penang fleet revenue variance −2.6% vs forecast for May. Drafting executive brief.",
  },
  {
    id: "C-110",
    ts: now - 1000 * 60 * 9.2,
    speaker: { kind: "agent", id: "inspection" },
    channel: "agent",
    text: "Drone sweep complete on Array B4. Two minor diode anomalies flagged for next inspection cycle.",
  },
  {
    id: "C-111",
    ts: now - 1000 * 60 * 11,
    speaker: { kind: "agent", id: "pv_assistant" },
    channel: "agent",
    text: "Indexed 142 new fault cases from operator notes overnight. Knowledge graph refreshed.",
  },
  {
    id: "C-112",
    ts: now - 1000 * 60 * 13,
    speaker: { kind: "supervisor" },
    channel: "supervisor",
    text: "Daily summary compiled — 4 incidents, 6 work orders, PR 97.4%. Sent to operations@irun.",
  },
];

type ChannelFilter = "all" | Channel;
type AgentFilter = "all" | AgentId;

export function CommsSheet() {
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [agent, setAgent] = useState<AgentFilter>("all");

  const filtered = useMemo(
    () =>
      FEED.filter(
        (e) =>
          (channel === "all" || e.channel === channel) &&
          (agent === "all" || (e.speaker.kind === "agent" && e.speaker.id === agent)),
      ),
    [channel, agent],
  );

  const tallies = useMemo(() => {
    const byAgent: Partial<Record<AgentId, number>> = {};
    for (const e of FEED) {
      if (e.speaker.kind === "agent") {
        byAgent[e.speaker.id] = (byAgent[e.speaker.id] ?? 0) + 1;
      }
    }
    return byAgent;
  }, []);

  return (
    <div className="grid grid-cols-[1fr_220px] gap-4 h-full">
      {/* Feed */}
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)] gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-muted">Channel</span>
            {(["all", "supervisor", "agent", "operator"] as const).map((c) => (
              <Chip key={c} active={channel === c} onClick={() => setChannel(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="font-mono text-[10px] text-text-muted">
            {filtered.length} of {FEED.length} entries
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-dark pr-1 space-y-1.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-text-muted italic text-[11px]">
              No comms match the current filters.
            </div>
          )}
          {filtered.map((e) => (
            <Bubble key={e.id} entry={e} />
          ))}
        </div>
      </div>

      {/* Agent activity panel */}
      <div className="flex flex-col gap-2 min-w-0">
        <OrnateTitle size="xs">Agent activity</OrnateTitle>
        <div className="flex-1 overflow-auto scrollbar-dark space-y-1 pr-1">
          {AGENTS.map((a) => {
            const color = AGENT_COLORS[a.id];
            const count = tallies[a.id] ?? 0;
            const isActive = agent === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAgent(agent === a.id ? "all" : a.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 clip-hex-frame-sm transition-colors",
                  isActive ? "bg-[#1b2238]" : "bg-[#0a0f1c] hover:bg-[#10162a]",
                )}
                style={{ boxShadow: `inset 2px 0 0 ${color.hex}` }}
              >
                <div
                  className="w-6 h-6 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[11px]"
                  style={{
                    background: `linear-gradient(135deg, ${color.hex}33, #0a0e1a 70%)`,
                    color: color.hex,
                    border: `1px solid ${color.hex}55`,
                  }}
                >
                  {a.glyph}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-condensed text-[10px] uppercase tracking-[0.14em] text-text-primary truncate">
                    {a.shortName}
                  </div>
                  <div className="text-[9px] text-text-muted truncate">{a.className}</div>
                </div>
                <span className="font-mono text-[10px] text-text-secondary">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="text-[9px] text-text-muted font-condensed pt-1.5 border-t border-[var(--color-rule)]">
          Click any agent to filter the feed.
        </div>
      </div>
    </div>
  );
}

function Bubble({ entry }: { entry: Entry }) {
  const speakerInfo = describeSpeaker(entry.speaker);
  const toInfo = entry.to ? describeSpeaker(entry.to) : null;
  return (
    <div
      className="px-2.5 py-1.5 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
      style={{ boxShadow: `inset 2px 0 0 ${speakerInfo.color}` }}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center w-4 h-4 clip-hex-frame-sm font-display text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${speakerInfo.color}33, #0a0e1a 70%)`,
              color: speakerInfo.color,
              border: `1px solid ${speakerInfo.color}55`,
            }}
          >
            {speakerInfo.glyph}
          </span>
          <span className="font-condensed text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: speakerInfo.color }}>
            {speakerInfo.label}
          </span>
          {toInfo && (
            <>
              <span className="font-mono text-[10px] text-text-muted">→</span>
              <span className="font-mono text-[10px] text-text-secondary">{toInfo.label}</span>
            </>
          )}
        </div>
        <span className="font-mono text-[9px] text-text-muted">{formatRelative(entry.ts)} ago</span>
      </div>
      <div className="text-[11px] text-text-primary leading-relaxed">{entry.text}</div>
    </div>
  );
}

function describeSpeaker(s: Speaker): { label: string; color: string; glyph: string } {
  if (s.kind === "supervisor") {
    return { label: "Supervisor", color: "#c9a85a", glyph: "S" };
  }
  if (s.kind === "operator") {
    return { label: s.name, color: "#e7ecf5", glyph: "@" };
  }
  const agent = AGENT_BY_ID[s.id];
  return { label: agent.shortName, color: AGENT_COLORS[s.id].hex, glyph: agent.glyph };
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 font-condensed text-[10px] uppercase tracking-[0.14em] clip-hex-frame-sm transition-colors",
        active
          ? "bg-[#1b2238] text-text-primary ring-1 ring-inset ring-[var(--color-gold-deep)]"
          : "bg-[#0a0f1c] text-text-muted hover:text-text-primary hover:bg-[#10162a]",
      )}
    >
      {children}
    </button>
  );
}
