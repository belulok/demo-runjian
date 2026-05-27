"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PlantHeader } from "@/components/hud/PlantHeader";
import { AlertFeed } from "@/components/hud/AlertFeed";
import { DetailPanel } from "@/components/hud/DetailPanel";
import { Minimap } from "@/components/hud/Minimap";
import { CommandSheet } from "@/components/hud/CommandSheet";
import { AgentPanel } from "@/components/hud/AgentPanel";
import { StationTeamBrief } from "@/components/hud/StationTeamBrief";
import { startAlertStream, stopAlertStream } from "@/lib/mock/stream";
import { useWorldStore } from "@/lib/store/worldStore";
import { useCommandStore, type CommandSheetId } from "@/lib/store/commandStore";
import { AGENTS } from "@/lib/mock/agents";

const WorldCanvas = dynamic(
  () => import("@/components/world/WorldCanvas").then((m) => m.WorldCanvas),
  { ssr: false },
);

const SHEET_HOTKEYS: Record<string, CommandSheetId> = {
  q: "overview",
  w: "alarms",
  e: "tickets",
  r: "analytics",
  t: "map",
  y: "comms",
  u: "safety",
  "/": "search",
};

export default function ControlCenter() {
  // Mount-gate to avoid SSR/CSR drift from Date.now() in mock data + clock.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    startAlertStream();
    return () => stopAlertStream();
  }, []);

  const selectedId = useWorldStore((s) => s.selectedDeviceId);
  const selectedStationId = useWorldStore((s) => s.selectedStationId);
  const toggleSheet = useCommandStore((s) => s.toggle);
  const toggleAgent = useCommandStore((s) => s.toggleAgent);

  // Global hotkeys — sheet shortcuts (Q/W/E/R/T/Y/U/) + agent invocation (1-9, 0).
  // These used to live in CommandTray / AgentSkillBar; now hoisted here so the
  // bottom HUD can be removed without losing keyboard navigation.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();

      // Sheets
      const sheet = SHEET_HOTKEYS[key];
      if (sheet) {
        e.preventDefault();
        toggleSheet(sheet);
        return;
      }
      // Agents — 1..9, 0
      const digitMap: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
        "6": 5, "7": 6, "8": 7, "9": 8, "0": 9,
      };
      const idx = digitMap[e.key];
      if (idx != null && AGENTS[idx]) {
        e.preventDefault();
        toggleAgent(AGENTS[idx].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSheet, toggleAgent]);

  if (!mounted) {
    return (
      <main className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
        <div className="font-display text-[11px] uppercase tracking-[0.32em] text-text-muted animate-pulse">
          ◆ Initializing Control Center ◆
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* World layer */}
      <div className="absolute inset-0">
        <WorldCanvas />
      </div>

      {/* HUD overlays */}
      <PlantHeader />
      <AlertFeed />
      <DetailPanel />

      {/* Floating Minimap — bottom-right card. Replaces the old bottom-HUD slot.
       *  Stays out of the DetailPanel's lane (top-right) and the
       *  StationTeamBrief's lane (bottom, left of this card). */}
      <div className="absolute bottom-3 right-3 z-30 pointer-events-auto w-[220px] h-[220px]">
        <Minimap />
      </div>

      <CommandSheet />
      <AgentPanel />
      <StationTeamBrief />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Hint when nothing is selected */}
      {!selectedId && !selectedStationId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="font-mono text-[10px] text-text-muted tracking-[0.32em] uppercase">
            Click a station POI · left-drag to pan · scroll to zoom · 1-9·0 invoke agents · Q/W/E… sheets
          </div>
        </div>
      )}
    </main>
  );
}
