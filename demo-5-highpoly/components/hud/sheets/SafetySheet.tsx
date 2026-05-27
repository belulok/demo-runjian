"use client";

import { useState } from "react";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DataTick } from "@/components/primitives/DataTick";
import { StateBadge } from "@/components/primitives/StateBadge";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

type IncidentSeverity = "critical" | "major" | "minor" | "near_miss";
type IncidentStatus = "open" | "investigating" | "resolved";

type Incident = {
  id: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  type: string;
  plant: string;
  device?: string;
  description: string;
  timestamp: number;
};

type Certification = {
  crew: string;
  role: string;
  cert: string;
  expiresInDays: number;
};

const now = Date.now();

const INCIDENTS: Incident[] = [
  {
    id: "SAF-204",
    severity: "major",
    status: "investigating",
    type: "Ground-fault",
    plant: "Johor-Commercial-1160",
    device: "INV COM1-5",
    description: "Insulation impedance dropped to 8 kΩ — isolation initiated, awaiting field verification.",
    timestamp: now - 1000 * 60 * 18,
  },
  {
    id: "SAF-203",
    severity: "minor",
    status: "open",
    type: "Heat exposure",
    plant: "Penang-Commercial-2757",
    description: "Cabinet temp 6 °C above safe envelope. Active power reduced 15% per safety protocol.",
    timestamp: now - 1000 * 60 * 42,
  },
  {
    id: "SAF-202",
    severity: "near_miss",
    status: "investigating",
    type: "Working-at-height",
    plant: "Johor-Commercial-1160",
    description: "Crew dispatched to Array A3 without anchor verification. Caught by Safety Agent pre-dispatch.",
    timestamp: now - 1000 * 60 * 88,
  },
  {
    id: "SAF-201",
    severity: "critical",
    status: "resolved",
    type: "Fire risk",
    plant: "Perak-Commercial-2855",
    device: "TX-PRK-02",
    description: "Transformer overload alert. Active power redirected, fire suppression armed. No incident.",
    timestamp: now - 1000 * 60 * 60 * 5,
  },
  {
    id: "SAF-200",
    severity: "minor",
    status: "resolved",
    type: "Weather lockout",
    plant: "Melaka-Commercial-409",
    description: "Severe rain triggered safety lockout. Inspection rescheduled.",
    timestamp: now - 1000 * 60 * 60 * 9,
  },
];

const CERTS: Certification[] = [
  { crew: "Tan Boon Wei", role: "Senior Tech", cert: "Working-at-height L3", expiresInDays: 18 },
  { crew: "Lim Chee Keong", role: "Field Engineer", cert: "HV LV Operations", expiresInDays: 62 },
  { crew: "Aisyah Rahman", role: "Inspection Lead", cert: "Drone Pilot · Cat A", expiresInDays: 4 },
  { crew: "Rajesh Kumar", role: "Senior Tech", cert: "First Aid · CPR", expiresInDays: 134 },
  { crew: "Sarah Wong", role: "Field Engineer", cert: "Confined Space", expiresInDays: -7 },
  { crew: "Daniel Foo", role: "Apprentice", cert: "Working-at-height L2", expiresInDays: 240 },
];

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  critical: "#ef4444",
  major: "#f59e0b",
  minor: "#3b82f6",
  near_miss: "#a855f7",
};

const STATUS_COLOR: Record<IncidentStatus, string> = {
  open: "#ef4444",
  investigating: "#f59e0b",
  resolved: "#22c55e",
};

// 4x4 risk matrix: rows = severity (high→low), cols = likelihood (low→high)
const RISK_MATRIX: number[][] = [
  [0, 1, 2, 1], // Catastrophic
  [1, 2, 4, 3], // Major
  [3, 5, 6, 2], // Moderate
  [2, 4, 3, 1], // Minor
];
const RISK_LABELS = ["Catastrophic", "Major", "Moderate", "Minor"];
const LIKELIHOOD_LABELS = ["Rare", "Unlikely", "Possible", "Likely"];

function riskColor(row: number, col: number) {
  const score = (4 - row) * (col + 1); // 1..16
  if (score >= 12) return "#ef4444";
  if (score >= 8) return "#f59e0b";
  if (score >= 4) return "#3b82f6";
  return "#22c55e";
}

export function SafetySheet() {
  const [tab, setTab] = useState<"incidents" | "matrix" | "certs">("incidents");

  const counts = {
    open: INCIDENTS.filter((i) => i.status === "open").length,
    investigating: INCIDENTS.filter((i) => i.status === "investigating").length,
    resolved: INCIDENTS.filter((i) => i.status === "resolved").length,
    near_miss: INCIDENTS.filter((i) => i.severity === "near_miss").length,
  };

  const expiringSoon = CERTS.filter((c) => c.expiresInDays <= 30).length;

  return (
    <div className="flex flex-col h-full">
      {/* Top KPIs */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        <KpiCell label="Open Incidents" value={counts.open.toString()} tone={counts.open > 0 ? "warn" : "good"} />
        <KpiCell label="Investigating" value={counts.investigating.toString()} tone="warn" />
        <KpiCell label="Resolved 30d" value="14" tone="good" />
        <KpiCell label="Near-miss 30d" value="3" tone="muted" />
        <KpiCell label="Certs Expiring ≤30d" value={expiringSoon.toString()} tone={expiringSoon > 1 ? "bad" : "warn"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {([
          { k: "incidents" as const, l: "Incidents" },
          { k: "matrix" as const, l: "Risk Matrix" },
          { k: "certs" as const, l: "Certifications" },
        ]).map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-3 py-1.5 font-condensed text-[10px] font-semibold uppercase tracking-[0.16em] clip-hex-frame-sm",
              tab === k
                ? "bg-[#1b2238] text-text-primary ring-1 ring-inset ring-[var(--color-gold-deep)]"
                : "bg-[#0a0f1c] text-text-muted hover:text-text-primary hover:bg-[#10162a]",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "incidents" && (
          <div className="h-full overflow-auto scrollbar-dark pr-1">
            <table className="w-full text-[11px]">
              <thead className="text-text-muted font-condensed uppercase tracking-[0.16em] sticky top-0 bg-[#0a0e1a]">
                <tr className="border-b border-[var(--color-rule)]">
                  <th className="text-left py-1.5 pl-2 font-semibold w-24">ID</th>
                  <th className="text-left font-semibold w-28">Severity</th>
                  <th className="text-left font-semibold w-28">Type</th>
                  <th className="text-left font-semibold">Description</th>
                  <th className="text-left font-semibold w-44">Plant · Device</th>
                  <th className="text-left font-semibold w-28">Status</th>
                  <th className="text-right font-semibold w-20 pr-2">Age</th>
                </tr>
              </thead>
              <tbody>
                {INCIDENTS.map((i, idx) => (
                  <tr
                    key={i.id}
                    className={cn(
                      "border-b border-[var(--color-rule)]",
                      idx % 2 === 0 ? "bg-[#0a0f1c]" : "bg-transparent",
                      i.status === "resolved" && "opacity-55",
                    )}
                  >
                    <td className="py-1.5 pl-2 font-mono text-[10px] text-text-secondary">{i.id}</td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: SEVERITY_COLOR[i.severity] }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{
                            background: SEVERITY_COLOR[i.severity],
                            boxShadow: `0 0 6px ${SEVERITY_COLOR[i.severity]}`,
                          }}
                        />
                        {i.severity.replace("_", "-")}
                      </span>
                    </td>
                    <td className="font-condensed text-text-primary">{i.type}</td>
                    <td className="text-text-secondary truncate max-w-[420px]" title={i.description}>
                      {i.description}
                    </td>
                    <td>
                      <div className="font-condensed text-text-secondary">{i.plant}</div>
                      {i.device && <div className="text-[9px] text-text-muted">{i.device}</div>}
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5"
                        style={{
                          color: STATUS_COLOR[i.status],
                          background: `${STATUS_COLOR[i.status]}1a`,
                          border: `1px solid ${STATUS_COLOR[i.status]}55`,
                        }}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="font-mono text-right text-text-muted pr-2">{formatRelative(i.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "matrix" && (
          <div className="h-full grid grid-cols-[1fr_240px] gap-3">
            <div className="p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)] overflow-auto scrollbar-dark">
              <OrnateTitle size="xs" className="mb-3">Severity × Likelihood</OrnateTitle>
              <div className="grid grid-cols-[120px_repeat(4,1fr)] gap-1.5 text-[10px]">
                <div />
                {LIKELIHOOD_LABELS.map((l) => (
                  <div key={l} className="text-center font-condensed font-semibold uppercase tracking-[0.16em] text-text-muted">
                    {l}
                  </div>
                ))}
                {RISK_MATRIX.map((row, ri) => (
                  <div className="contents" key={ri}>
                    <div className="font-condensed font-semibold uppercase tracking-[0.16em] text-text-muted self-center">
                      {RISK_LABELS[ri]}
                    </div>
                    {row.map((count, ci) => {
                      const color = riskColor(ri, ci);
                      return (
                        <div
                          key={ci}
                          className="aspect-square flex items-center justify-center clip-hex-frame-sm"
                          style={{
                            background: `${color}22`,
                            border: `1px solid ${color}66`,
                          }}
                        >
                          <span
                            className="font-mono text-base font-semibold"
                            style={{ color }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
                <OrnateTitle size="xs" className="mb-2">Heat zones</OrnateTitle>
                <Legend color="#ef4444" label="High (12-16) · immediate action" />
                <Legend color="#f59e0b" label="Elevated (8-11) · mitigate now" />
                <Legend color="#3b82f6" label="Moderate (4-7) · monitor" />
                <Legend color="#22c55e" label="Low (1-3) · acceptable" />
              </div>
              <div className="p-3 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
                <OrnateTitle size="xs" className="mb-2">Trend (30d)</OrnateTitle>
                <DataTick label="Avg risk score" value="5.2" tone="warn" size="md" align="left" />
                <div className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-secondary mt-1">
                  −0.4 vs last period
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "certs" && (
          <div className="h-full overflow-auto scrollbar-dark pr-1">
            <table className="w-full text-[11px]">
              <thead className="text-text-muted font-condensed uppercase tracking-[0.16em] sticky top-0 bg-[#0a0e1a]">
                <tr className="border-b border-[var(--color-rule)]">
                  <th className="text-left py-1.5 pl-2 font-semibold">Crew</th>
                  <th className="text-left font-semibold">Role</th>
                  <th className="text-left font-semibold">Certification</th>
                  <th className="text-right font-semibold w-28">Expires</th>
                  <th className="text-left font-semibold w-28 pl-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {CERTS.map((c, i) => {
                  const status: keyof typeof STATUS_COLOR_CERT =
                    c.expiresInDays < 0 ? "expired" : c.expiresInDays <= 30 ? "expiring" : "current";
                  return (
                    <tr
                      key={c.crew + c.cert}
                      className={cn(
                        "border-b border-[var(--color-rule)]",
                        i % 2 === 0 ? "bg-[#0a0f1c]" : "bg-transparent",
                      )}
                    >
                      <td className="py-1.5 pl-2 font-condensed text-text-primary">{c.crew}</td>
                      <td className="text-text-secondary">{c.role}</td>
                      <td className="font-condensed text-text-primary">{c.cert}</td>
                      <td className="font-mono text-right text-text-secondary">
                        {c.expiresInDays < 0 ? `${Math.abs(c.expiresInDays)}d ago` : `in ${c.expiresInDays}d`}
                      </td>
                      <td className="pl-3">
                        <StateBadge state={STATUS_COLOR_CERT[status]} size="xs" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLOR_CERT = {
  expired: "faulted",
  expiring: "degraded",
  current: "healthy",
} as const;

function KpiCell({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: "good" | "warn" | "bad" | "muted" }) {
  return (
    <div className="p-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
      <DataTick label={label} value={value} unit={unit} tone={tone} size="md" align="left" />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-text-secondary mb-1 last:mb-0">
      <span className="inline-block w-3 h-3 clip-hex-frame-sm" style={{ background: `${color}33`, border: `1px solid ${color}66` }} />
      <span>{label}</span>
    </div>
  );
}
