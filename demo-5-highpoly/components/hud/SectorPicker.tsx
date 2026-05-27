"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useWorldStore } from "@/lib/store/worldStore";
import { PLANTS, PRIMARY_PLANT_ID, type Plant } from "@/lib/mock/plants";
import { STATION_BY_PLANT_ID, STATION_TYPE_LABEL } from "@/lib/mock/stations";
import { STATE_COLORS } from "@/lib/theme/colors";
import { cn } from "@/lib/utils";

const STATUS_COLOR = (s: Plant["status"]) =>
  s === "alarm"
    ? STATE_COLORS.faulted.hex
    : s === "warning"
      ? STATE_COLORS.degraded.hex
      : s === "offline"
        ? STATE_COLORS.offline.hex
        : STATE_COLORS.healthy.hex;

export function SectorPicker() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const setActive = useWorldStore((s) => s.setActivePlant);
  const selectStation = useWorldStore((s) => s.selectStation);
  const panToWorld = useWorldStore((s) => s.panToWorld);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = PLANTS.find((p) => p.id === activeId) ?? PLANTS[0];
  const activeStation = STATION_BY_PLANT_ID[activeId];

  /** Fast-travel: pan the 3D camera to the station and open its brief. The
   *  world itself doesn't reload — there's a single unified scene now. */
  const handleSelect = (id: string) => {
    setActive(id);
    setOpen(false);
    const station = STATION_BY_PLANT_ID[id];
    if (station) {
      panToWorld(station.pos[0], station.pos[2]);
      selectStation(station.id);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative leading-tight">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex items-center gap-2 px-1.5 py-1 -mx-1.5 transition-colors",
          "hover:bg-[#10162a] clip-hex-frame-sm",
        )}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: STATUS_COLOR(active.status), boxShadow: `0 0 6px ${STATUS_COLOR(active.status)}` }}
        />
        <span className="flex flex-col items-start leading-tight">
          <span className="font-display text-[10px] uppercase tracking-[0.32em] text-text-secondary">
            {activeStation ? STATION_TYPE_LABEL[activeStation.type] : "Active Sector"}
          </span>
          <span className="font-display text-[15px] uppercase tracking-[0.24em] text-text-primary">
            {active.name}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-text-muted transition-transform",
            open && "rotate-180 text-text-primary",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 z-50 w-80"
          >
            <div className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)] shadow-2xl">
              <div
                className="absolute top-0 left-3 right-3 h-[1px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)",
                }}
              />
              <div className="py-1.5">
                {PLANTS.map((p) => {
                  const isActive = p.id === activeId;
                  const isPrimary = p.id === PRIMARY_PLANT_ID;
                  const station = STATION_BY_PLANT_ID[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                        isActive ? "bg-[#1b2238]" : "hover:bg-[#10162a]",
                      )}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: STATUS_COLOR(p.status),
                          boxShadow: `0 0 6px ${STATUS_COLOR(p.status)}`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-[11px] uppercase tracking-[0.18em] text-text-primary truncate">
                            {p.name}
                          </span>
                          <span className="font-mono text-[9px] text-text-muted">{p.oem}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {station && (
                            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-gold-rim)]">
                              {STATION_TYPE_LABEL[station.type]}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-text-muted">
                            {p.region} · {p.capacityKWp.toFixed(0)} kWp
                          </span>
                        </div>
                      </div>
                      {isPrimary && (
                        <span
                          className="font-mono text-[8px] uppercase tracking-[0.18em] px-1.5 py-0.5"
                          style={{
                            color: "var(--color-gold-rim)",
                            border: "1px solid var(--color-gold-deep)",
                          }}
                        >
                          LIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 border-t border-[var(--color-rule)] text-[10px] text-text-muted font-condensed">
                Picking a sector pans the camera to its station and opens the team brief.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
