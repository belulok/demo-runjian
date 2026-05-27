"use client";

import { PLANTS } from "@/lib/mock/plants";
import { PORTFOLIO_KPI, PRIMARY_KPI } from "@/lib/mock/kpis";
import { DEVICES } from "@/lib/mock/devices";
import { useAlertStore } from "@/lib/store/alertStore";
import { useWorldStore } from "@/lib/store/worldStore";
import { useCommandStore } from "@/lib/store/commandStore";
import { STATION_BY_PLANT_ID } from "@/lib/mock/stations";
import { DataTick } from "@/components/primitives/DataTick";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { StateBadge } from "@/components/primitives/StateBadge";
import { formatNumber } from "@/lib/utils";
import { STATE_COLORS } from "@/lib/theme/colors";
import { cn } from "@/lib/utils";

export function OverviewSheet() {
  const alarms = useAlertStore((s) => s.alarms);
  const setActive = useWorldStore((s) => s.setActivePlant);
  const panToWorld = useWorldStore((s) => s.panToWorld);
  const selectStation = useWorldStore((s) => s.selectStation);
  const closeSheet = useCommandStore((s) => s.close);
  const activeId = useWorldStore((s) => s.activePlantId);

  /** Mirror SectorPicker — fast-travel to the chosen plant's station. */
  const openPlant = (plantId: string) => {
    setActive(plantId);
    const station = STATION_BY_PLANT_ID[plantId];
    if (station) {
      panToWorld(station.pos[0], station.pos[2]);
      selectStation(station.id);
    }
    closeSheet();
  };

  const openByPlant: Record<string, number> = {};
  for (const a of alarms) {
    if (a.status === "open") openByPlant[a.plantId] = (openByPlant[a.plantId] || 0) + 1;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top KPI strip */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        <KpiCell label="Plants" value={PORTFOLIO_KPI.totalPlants.toString()} />
        <KpiCell label="Devices" value={PORTFOLIO_KPI.totalDevices.toString()} />
        <KpiCell label="Installed" value={formatNumber(PORTFOLIO_KPI.installedCapacityKWp)} unit="kWp" />
        <KpiCell label="Year Gen" value={PORTFOLIO_KPI.yearlyGenerationGWh.toFixed(2)} unit="GWh" tone="good" />
        <KpiCell label="Month Gen" value={PORTFOLIO_KPI.monthlyGenerationMWh.toFixed(1)} unit="MWh" tone="good" />
        <KpiCell label="CO₂ Saved" value={formatNumber(PORTFOLIO_KPI.co2SavedTons, 1)} unit="t" tone="good" />
      </div>

      <OrnateTitle size="xs" className="mb-2">Plant fleet</OrnateTitle>

      {/* Plant grid */}
      <div className="flex-1 overflow-auto scrollbar-dark pr-1">
        <table className="w-full text-[11px]">
          <thead className="text-text-muted font-condensed uppercase tracking-[0.16em]">
            <tr className="border-b border-[var(--color-rule)]">
              <th className="text-left py-1.5 pl-2 font-semibold">Sector</th>
              <th className="text-left font-semibold">OEM</th>
              <th className="text-left font-semibold">Region</th>
              <th className="text-right font-semibold">Capacity</th>
              <th className="text-right font-semibold">Devices</th>
              <th className="text-right font-semibold">Open Alerts</th>
              <th className="text-left pl-3 font-semibold">State</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {PLANTS.map((p, i) => {
              const isActive = p.id === activeId;
              const deviceCount = DEVICES.filter((d) => d.plantId === p.id).length;
              const open = openByPlant[p.id] ?? 0;
              const stateKey =
                p.status === "alarm" ? "faulted" :
                p.status === "warning" ? "degraded" :
                p.status === "offline" ? "offline" : "healthy";
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-[var(--color-rule)] hover:bg-[#10162a] transition-colors",
                    i % 2 === 0 ? "bg-[#0a0f1c]" : "bg-transparent",
                    isActive && "ring-1 ring-inset ring-[var(--color-gold-deep)]",
                  )}
                >
                  <td className="py-2 pl-2 font-condensed font-semibold text-text-primary">
                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span
                          className="inline-block w-1 h-1 rounded-full"
                          style={{ background: "var(--color-gold-rim)", boxShadow: "0 0 6px var(--color-gold-glow)" }}
                        />
                      )}
                      {p.name}
                    </div>
                  </td>
                  <td className="text-text-secondary font-mono text-[10px]">{p.oem}</td>
                  <td className="text-text-secondary">{p.region}, MY</td>
                  <td className="font-mono text-right">{formatNumber(p.capacityKWp)} <span className="text-text-muted">kWp</span></td>
                  <td className="font-mono text-right">{deviceCount}</td>
                  <td className={cn(
                    "font-mono text-right",
                    open === 0 && "text-emerald-400",
                    open > 0 && open <= 2 && "text-amber-400",
                    open > 2 && "text-red-400",
                  )}>{open.toString().padStart(2, "0")}</td>
                  <td className="pl-3"><StateBadge state={stateKey} size="xs" /></td>
                  <td className="text-right pr-2">
                    <button
                      onClick={() => openPlant(p.id)}
                      className="font-condensed text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 bg-[#10162a] hover:bg-[#1b2238] clip-hex-frame-sm text-text-secondary hover:text-text-primary"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: primary plant deep-dive snapshot */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--color-rule)] mt-2">
        <KpiCell label="Active PR" value={PRIMARY_KPI.performanceRatio.toFixed(1)} unit="%" tone="good" />
        <KpiCell label="Today" value={formatNumber(PRIMARY_KPI.actualKWh)} unit="kWh" />
        <KpiCell label="Theoretical" value={formatNumber(PRIMARY_KPI.theoreticalKWh)} unit="kWh" tone="muted" />
        <KpiCell label="Eff Hours" value={PRIMARY_KPI.effectiveHours.toFixed(2)} unit="hrs" />
      </div>
    </div>
  );
}

function KpiCell({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: "good" | "warn" | "bad" | "muted" }) {
  void STATE_COLORS;
  return (
    <div className="p-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
      <DataTick label={label} value={value} unit={unit} tone={tone} size="md" align="left" />
    </div>
  );
}
