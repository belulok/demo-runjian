"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, ArrowRight, CornerDownLeft } from "lucide-react";
import { PLANTS } from "@/lib/mock/plants";
import { DEVICES, DEVICE_BY_ID } from "@/lib/mock/devices";
import { SEED_WORK_ORDERS } from "@/lib/mock/workOrders";
import { AGENTS } from "@/lib/mock/agents";
import { useAlertStore } from "@/lib/store/alertStore";
import { useWorldStore } from "@/lib/store/worldStore";
import { STATION_BY_PLANT_ID } from "@/lib/mock/stations";
import { useCommandStore, type CommandSheetId } from "@/lib/store/commandStore";
import { AGENT_COLORS } from "@/lib/theme/colors";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { cn } from "@/lib/utils";

type ResultKind = "plant" | "device" | "alarm" | "ticket" | "agent" | "action";

type Result = {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle?: string;
  accent?: string;
  glyph?: string;
  onSelect: () => void;
};

const KIND_LABEL: Record<ResultKind, string> = {
  plant: "Plants",
  device: "Devices",
  alarm: "Alarms",
  ticket: "Tickets",
  agent: "Agents",
  action: "Actions",
};

const KIND_ORDER: ResultKind[] = ["action", "plant", "device", "alarm", "ticket", "agent"];

export function SearchSheet() {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const alarms = useAlertStore((s) => s.alarms);
  const setActive = useWorldStore((s) => s.setActivePlant);
  const selectDevice = useWorldStore((s) => s.selectDevice);
  const panToWorld = useWorldStore((s) => s.panToWorld);
  const selectStation = useWorldStore((s) => s.selectStation);
  const closeSheet = useCommandStore((s) => s.close);
  const openSheet = useCommandStore((s) => s.open);

  // Autofocus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Result[] = [];

    // Quick actions — always shown, filter by query
    const actions: Result[] = [
      {
        id: "act-overview",
        kind: "action",
        title: "Open Portfolio Overview",
        subtitle: "Fleet KPIs across all 5 sectors",
        glyph: "◇",
        onSelect: () => openSheet("overview" as CommandSheetId),
      },
      {
        id: "act-alarms",
        kind: "action",
        title: "Open Alarm Operations",
        subtitle: "Full log · ack · resolve",
        glyph: "⚠",
        onSelect: () => openSheet("alarms" as CommandSheetId),
      },
      {
        id: "act-tickets",
        kind: "action",
        title: "Open Work Orders",
        subtitle: "Tickets · priorities · assignees",
        glyph: "⌘",
        onSelect: () => openSheet("tickets" as CommandSheetId),
      },
      {
        id: "act-analytics",
        kind: "action",
        title: "Open Performance Analytics",
        subtitle: "Generation · efficiency · forecast",
        glyph: "∑",
        onSelect: () => openSheet("analytics" as CommandSheetId),
      },
      {
        id: "act-safety",
        kind: "action",
        title: "Open Safety Dashboard",
        subtitle: "Incidents · risk matrix · certifications",
        glyph: "⛨",
        onSelect: () => openSheet("safety" as CommandSheetId),
      },
    ];
    for (const a of actions) {
      if (!q || a.title.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q)) {
        out.push(a);
      }
    }

    // Plants
    for (const p of PLANTS) {
      const hay = `${p.name} ${p.region} ${p.oem} ${p.id}`.toLowerCase();
      if (!q || hay.includes(q)) {
        out.push({
          id: p.id,
          kind: "plant",
          title: p.name,
          subtitle: `${p.region}, MY · ${p.capacityKWp.toFixed(0)} kWp · ${p.oem}`,
          glyph: "◆",
          onSelect: () => {
            setActive(p.id);
            const station = STATION_BY_PLANT_ID[p.id];
            if (station) {
              panToWorld(station.pos[0], station.pos[2]);
              selectStation(station.id);
            }
            closeSheet();
          },
        });
      }
    }

    // Devices (cap to 8 in results to keep it tight)
    let deviceCount = 0;
    for (const d of DEVICES) {
      if (deviceCount >= 8) break;
      const hay = `${d.name} ${d.sn} ${d.id} ${d.type}`.toLowerCase();
      if (q && hay.includes(q)) {
        out.push({
          id: d.id,
          kind: "device",
          title: d.name,
          subtitle: `${d.type.replace("_", " ")} · SN ${d.sn} · ${d.plantId}`,
          glyph: "▣",
          onSelect: () => {
            const plantId = d.plantId;
            const wantsSwitch = useWorldStore.getState().activePlantId !== plantId;
            if (wantsSwitch) setActive(plantId);
            selectDevice(d.id);
            closeSheet();
          },
        });
        deviceCount++;
      }
    }

    // Alarms (cap to 8)
    let alarmCount = 0;
    for (const a of alarms) {
      if (alarmCount >= 8) break;
      const dev = DEVICE_BY_ID[a.deviceId];
      const hay = `${a.id} ${a.type} ${a.message} ${dev?.name ?? ""}`.toLowerCase();
      if (q && hay.includes(q)) {
        out.push({
          id: a.id,
          kind: "alarm",
          title: `${dev?.name ?? a.deviceId} · ${a.type.replace(/_/g, " ")}`,
          subtitle: `${a.id} · ${a.severity.toUpperCase()} · ${a.status}`,
          glyph: "⚠",
          onSelect: () => {
            selectDevice(a.deviceId);
            closeSheet();
          },
        });
        alarmCount++;
      }
    }

    // Tickets
    for (const t of SEED_WORK_ORDERS) {
      const dev = DEVICE_BY_ID[t.deviceId];
      const hay = `${t.id} ${t.title} ${t.assignee} ${dev?.name ?? ""}`.toLowerCase();
      if (q && hay.includes(q)) {
        out.push({
          id: t.id,
          kind: "ticket",
          title: t.title,
          subtitle: `${t.id} · ${t.priority.toUpperCase()} · ${t.status} · ${t.assignee}`,
          glyph: "⌘",
          onSelect: () => {
            openSheet("tickets");
          },
        });
      }
    }

    // Agents
    for (const a of AGENTS) {
      const hay = `${a.name} ${a.role} ${a.cnName} ${a.shortName} ${a.className}`.toLowerCase();
      if (!q || hay.includes(q)) {
        const color = AGENT_COLORS[a.id];
        out.push({
          id: a.id,
          kind: "agent",
          title: a.name,
          subtitle: `${a.role} · ${a.className} · L${a.level}`,
          accent: color.hex,
          glyph: a.glyph,
          onSelect: () => {
            // No agent detail panel yet — close and let comms reveal activity
            openSheet("comms");
          },
        });
      }
    }

    return out;
  }, [query, alarms, openSheet, setActive, selectDevice, panToWorld, selectStation, closeSheet]);

  // Group by kind
  const grouped = useMemo(() => {
    const map = new Map<ResultKind, Result[]>();
    for (const r of results) {
      const list = map.get(r.kind) ?? [];
      list.push(r);
      map.set(r.kind, list);
    }
    return map;
  }, [results]);

  // Reset selected idx when results change
  useEffect(() => setSelectedIdx(0), [query]);

  // Up/Down + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "ArrowDown") {
        setSelectedIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const r = results[selectedIdx];
        if (r) r.onSelect();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, selectedIdx]);

  // Compute flat index for highlighting
  let flatIdx = 0;
  const counts: Record<ResultKind, number> = {
    plant: 0, device: 0, alarm: 0, ticket: 0, agent: 0, action: 0,
  };
  for (const r of results) counts[r.kind]++;

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="flex items-center gap-2.5 px-3 py-2 bg-[#070a14] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-gold-deep)] mb-3">
        <SearchIcon className="w-4 h-4 text-[var(--color-gold-rim)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search devices · alarms · tickets · plants · agents · actions…"
          className="flex-1 bg-transparent border-0 outline-none font-mono text-[12px] text-text-primary placeholder:text-text-muted"
        />
        <span className="font-mono text-[10px] text-text-muted">
          {results.length} {results.length === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto scrollbar-dark pr-1 min-h-0">
        {results.length === 0 && (
          <div className="text-center py-12 text-text-muted italic text-[11px]">
            No matches. Try searching by device name, plant region, ticket ID, or agent class.
          </div>
        )}

        {KIND_ORDER.map((kind) => {
          const items = grouped.get(kind);
          if (!items || items.length === 0) return null;
          return (
            <div key={kind} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-1 px-1">
                <OrnateTitle size="xs">{KIND_LABEL[kind]}</OrnateTitle>
                <span className="font-mono text-[9px] text-text-muted">{counts[kind]}</span>
              </div>
              <div className="space-y-1">
                {items.map((r) => {
                  const idx = flatIdx++;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={r.id}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={r.onSelect}
                      className={cn(
                        "w-full flex items-center gap-3 px-2.5 py-1.5 clip-hex-frame-sm transition-colors text-left",
                        isSelected
                          ? "bg-[#1b2238] ring-1 ring-inset ring-[var(--color-gold-deep)]"
                          : "bg-[#0a0f1c] hover:bg-[#10162a]",
                      )}
                      style={
                        r.accent
                          ? { boxShadow: `inset 2px 0 0 ${r.accent}` }
                          : { boxShadow: `inset 2px 0 0 var(--color-gold-deep)` }
                      }
                    >
                      <div
                        className="w-7 h-7 flex-shrink-0 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[14px]"
                        style={{
                          background: r.accent
                            ? `linear-gradient(135deg, ${r.accent}33 0%, #0a0e1a 70%)`
                            : "linear-gradient(135deg, rgba(201,168,90,0.2), #0a0e1a 70%)",
                          color: r.accent ?? "var(--color-gold-rim)",
                          border: `1px solid ${r.accent ?? "var(--color-gold-deep)"}55`,
                        }}
                      >
                        {r.glyph ?? "·"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-condensed text-[11.5px] font-semibold uppercase tracking-[0.1em] text-text-primary truncate">
                          {r.title}
                        </div>
                        {r.subtitle && (
                          <div className="text-[10px] text-text-secondary truncate">{r.subtitle}</div>
                        )}
                      </div>
                      <ArrowRight
                        className={cn(
                          "w-3.5 h-3.5 transition-opacity",
                          isSelected ? "text-[var(--color-gold-rim)] opacity-100" : "text-text-muted opacity-0",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer keyboard hints */}
      <div className="flex items-center gap-4 pt-2 mt-1 border-t border-[var(--color-rule)] font-mono text-[9px] text-text-muted uppercase tracking-[0.16em]">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd><CornerDownLeft className="w-2.5 h-2.5" /></Kbd> select
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd> close
        </span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[16px] px-1 py-0.5 bg-black/40 border border-[var(--color-border-soft)] rounded-sm font-mono text-[9px] text-text-secondary">
      {children}
    </span>
  );
}
