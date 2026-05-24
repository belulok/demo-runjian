"use client";

import { useEffect, useState } from "react";
import { PLANT_BY_ID } from "@/lib/mock/plants";
import { PRIMARY_KPI } from "@/lib/mock/kpis";
import { useWorldStore } from "@/lib/store/worldStore";
import { useAlertStore } from "@/lib/store/alertStore";
import { DataTick } from "@/components/primitives/DataTick";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { SectorPicker } from "./SectorPicker";
import { UnifiedPortalButton } from "./UnifiedPortal";
import { CommandsLauncher, AgentsLauncher } from "./HUDLaunchers";
import { formatNumber, formatTime } from "@/lib/utils";

export function PlantHeader() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const plant = PLANT_BY_ID[activeId];
  const alarms = useAlertStore((s) => s.alarms);
  const openAlarms = alarms.filter((a) => a.status === "open").length;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-stretch h-14 pl-4 pr-4 gap-4">
        {/* Brand cluster */}
        <div className="pointer-events-auto flex items-center gap-3 pr-5 border-r border-[var(--color-rule)]">
          <div className="relative w-7 h-7">
            <div
              className="absolute inset-0 rotate-45 border border-[var(--color-gold-rim)]"
              style={{ boxShadow: "0 0 12px var(--color-gold-glow)" }}
            />
            <div className="absolute inset-1 rotate-45 bg-gradient-to-br from-[var(--color-gold-rim)] to-[var(--color-gold-deep)] opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center font-display text-[9px] font-bold text-black">
              iR
            </div>
          </div>
          <div className="leading-tight">
            <OrnateTitle size="xs">iRun · Control Center</OrnateTitle>
            <div className="font-mono text-[9px] text-text-muted tracking-[0.18em]">
              v.4.6.1
            </div>
          </div>
        </div>

        {/* Sector picker */}
        <div className="pointer-events-auto flex items-center pr-4 border-r border-[var(--color-rule)]">
          <SectorPicker />
        </div>

        {/* Coordinates */}
        <div className="pointer-events-auto flex items-center pr-4 border-r border-[var(--color-rule)]">
          <div className="font-mono text-[10px] text-text-muted leading-tight">
            <div>{plant.region}, MY</div>
            <div>
              {plant.lat.toFixed(3)}°N · {plant.lng.toFixed(3)}°E
            </div>
          </div>
        </div>

        {/* KPI ticker */}
        <div className="pointer-events-auto flex-1 flex items-center gap-5">
          <DataTick label="Capacity" value={formatNumber(plant.capacityKWp, 0)} unit="kWp" size="md" align="left" />
          <DataTick
            label="Gen Today"
            value={formatNumber(PRIMARY_KPI.generatedToday, 0)}
            unit="kWh"
            size="md"
            align="left"
          />
          <DataTick
            label="PR"
            value={PRIMARY_KPI.performanceRatio.toFixed(1)}
            unit="%"
            tone="good"
            size="md"
            align="left"
          />
          <DataTick
            label="Alerts"
            value={openAlarms.toString().padStart(2, "0")}
            tone={openAlarms > 2 ? "bad" : openAlarms > 0 ? "warn" : "good"}
            size="md"
            align="left"
          />
        </div>

        {/* Command + Agent launchers — main entry points now that the bottom
         *  HUD is gone. Hotkeys (Q/W/E/R/T/Y/U/ and 1-9/0) also work. */}
        <div className="pointer-events-auto flex items-center gap-1.5 pl-4 border-l border-[var(--color-rule)]">
          <CommandsLauncher />
          <AgentsLauncher />
        </div>

        {/* Unified Portal */}
        <div className="pointer-events-auto flex items-center pl-4 border-l border-[var(--color-rule)]">
          <UnifiedPortalButton />
        </div>

        {/* Clock */}
        <div className="pointer-events-auto flex items-center gap-3 pl-4 border-l border-[var(--color-rule)]">
          <DataTick label="UTC+08" value={formatTime(now)} size="md" align="right" />
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-sm" />
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-gold-deep)] to-transparent opacity-40" />
    </header>
  );
}
