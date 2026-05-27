"use client";

import { useState } from "react";
import { useAlertStore } from "@/lib/store/alertStore";
import { useWorldStore } from "@/lib/store/worldStore";
import { useCommandStore } from "@/lib/store/commandStore";
import { DEVICE_BY_ID } from "@/lib/mock/devices";
import { PLANT_BY_ID } from "@/lib/mock/plants";
import { AGENT_BY_ID } from "@/lib/mock/agents";
import { AGENT_COLORS, SEVERITY_COLORS } from "@/lib/theme/colors";
import { formatRelative } from "@/lib/utils";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { cn } from "@/lib/utils";
import type { AlarmSeverity, AlarmStatus } from "@/lib/mock/alarms";

type SeverityFilter = AlarmSeverity | "all";
type StatusFilter = AlarmStatus | "all";

export function AlarmsSheet() {
  const alarms = useAlertStore((s) => s.alarms);
  const acknowledge = useAlertStore((s) => s.acknowledge);
  const resolve = useAlertStore((s) => s.resolve);
  const selectDevice = useWorldStore((s) => s.selectDevice);
  const closeSheet = useCommandStore((s) => s.close);

  const [sevFilter, setSevFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");

  const filtered = alarms.filter(
    (a) =>
      (sevFilter === "all" || a.severity === sevFilter) &&
      (statusFilter === "all" || a.status === statusFilter),
  );

  const counts = {
    open: alarms.filter((a) => a.status === "open").length,
    ack: alarms.filter((a) => a.status === "acknowledged").length,
    resolved: alarms.filter((a) => a.status === "resolved").length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter strip + tallies */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)] gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Severity
          </span>
          {(["all", "critical", "major", "minor", "info"] as const).map((s) => (
            <FilterChip key={s} active={sevFilter === s} onClick={() => setSevFilter(s)}>
              {s}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Status
          </span>
          {(["all", "open", "acknowledged", "resolved"] as const).map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-red-400">{counts.open} open</span>
          <span className="text-amber-400">{counts.ack} ack</span>
          <span className="text-emerald-400">{counts.resolved} resolved</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-dark pr-1">
        <table className="w-full text-[11px]">
          <thead className="text-text-muted font-condensed uppercase tracking-[0.16em] sticky top-0 bg-[#0a0e1a]">
            <tr className="border-b border-[var(--color-rule)]">
              <th className="text-left py-1.5 pl-2 font-semibold w-24">ID</th>
              <th className="text-left font-semibold w-20">Sev</th>
              <th className="text-left font-semibold">Device · Plant</th>
              <th className="text-left font-semibold">Type</th>
              <th className="text-left font-semibold">Message</th>
              <th className="text-left font-semibold w-24">Agent</th>
              <th className="text-right font-semibold w-16">Loss</th>
              <th className="text-right font-semibold w-16">Age</th>
              <th className="text-right font-semibold w-44 pr-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-text-muted italic text-[11px]">
                  No alarms match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((a, i) => {
              const device = DEVICE_BY_ID[a.deviceId];
              const plant = PLANT_BY_ID[a.plantId];
              const agent = AGENT_BY_ID[a.recommendedAgent];
              const agentColor = AGENT_COLORS[a.recommendedAgent];
              const sevColor = SEVERITY_COLORS[a.severity];
              return (
                <tr
                  key={a.id}
                  className={cn(
                    "border-b border-[var(--color-rule)] hover:bg-[#10162a] transition-colors",
                    i % 2 === 0 ? "bg-[#0a0f1c]" : "bg-transparent",
                    a.status === "resolved" && "opacity-50",
                  )}
                >
                  <td className="py-1.5 pl-2 font-mono text-[10px] text-text-secondary">{a.id}</td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                      style={{ color: sevColor }}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: sevColor, boxShadow: `0 0 6px ${sevColor}` }}
                      />
                      {a.severity}
                    </span>
                  </td>
                  <td className="font-condensed text-text-primary">
                    {device?.name ?? a.deviceId}
                    <div className="text-[9px] text-text-muted">{plant?.name ?? a.plantId}</div>
                  </td>
                  <td className="font-mono text-[10px] text-text-secondary">{a.type.replace(/_/g, " ")}</td>
                  <td className="text-text-secondary truncate max-w-[280px]" title={a.message}>{a.message}</td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5"
                      style={{ color: agentColor.hex, background: `${agentColor.hex}1a` }}
                    >
                      <span>{agent.glyph}</span>
                      {agent.shortName}
                    </span>
                  </td>
                  <td className="font-mono text-right text-text-secondary">{a.estimatedLossKWh ?? "—"}</td>
                  <td className="font-mono text-right text-text-muted">{formatRelative(a.timestamp)}</td>
                  <td className="text-right pr-2">
                    <div className="inline-flex items-center gap-1">
                      <ActionButton
                        label="View"
                        onClick={() => {
                          selectDevice(a.deviceId);
                          closeSheet();
                        }}
                      />
                      {a.status === "open" && (
                        <ActionButton label="Ack" onClick={() => acknowledge(a.id)} />
                      )}
                      {a.status !== "resolved" && (
                        <ActionButton label="Resolve" onClick={() => resolve(a.id)} tone="good" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

function ActionButton({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone?: "good";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 font-condensed text-[10px] uppercase tracking-[0.14em] clip-hex-frame-sm transition-colors",
        tone === "good"
          ? "bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50"
          : "bg-[#10162a] text-text-secondary hover:text-text-primary hover:bg-[#1b2238]",
      )}
    >
      {label}
    </button>
  );
}

void OrnateTitle;
