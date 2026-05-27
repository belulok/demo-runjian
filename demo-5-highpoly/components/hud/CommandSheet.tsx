"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Map as MapIcon,
  Radio,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useCommandStore, type CommandSheetId } from "@/lib/store/commandStore";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { OverviewSheet } from "./sheets/OverviewSheet";
import { AlarmsSheet } from "./sheets/AlarmsSheet";
import { TicketsSheet } from "./sheets/TicketsSheet";
import { AnalyticsSheet } from "./sheets/AnalyticsSheet";
import { MapSheet } from "./sheets/MapSheet";
import { CommsSheet } from "./sheets/CommsSheet";
import { SafetySheet } from "./sheets/SafetySheet";
import { SearchSheet } from "./sheets/SearchSheet";

const SHEETS: Record<CommandSheetId, {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  overview: { title: "Portfolio Overview", subtitle: "Fleet KPIs across all 5 sectors", icon: Activity },
  alarms: { title: "Alarm Operations", subtitle: "Full log · acknowledge · resolve · dispatch", icon: AlertTriangle },
  tickets: { title: "Work Order Engine", subtitle: "Tickets · priorities · assignees", icon: ClipboardList },
  analytics: { title: "Performance Analytics", subtitle: "Generation · efficiency · forecast variance", icon: BarChart3 },
  map: { title: "Geographic Map", subtitle: "Plant network across Malaysia", icon: MapIcon },
  comms: { title: "Comms Log", subtitle: "Agent dialogue · operator messages", icon: Radio },
  safety: { title: "Safety Dashboard", subtitle: "Incidents · risk · certifications", icon: Shield },
  search: { title: "Global Search", subtitle: "Devices · alarms · tickets · knowledge", icon: Search },
};

export function CommandSheet() {
  const active = useCommandStore((s) => s.activeSheet);
  const close = useCommandStore((s) => s.close);

  // Esc to close
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, close]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute left-3 right-[244px] bottom-3 z-40 pointer-events-auto"
        >
          <SheetContents id={active} onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetContents({ id, onClose }: { id: CommandSheetId; onClose: () => void }) {
  const meta = SHEETS[id];
  const Icon = meta.icon;

  return (
    <div
      className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)] shadow-2xl"
      style={{ boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}
    >
      <div
        className="absolute top-0 left-3 right-3 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-rule)]">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-[var(--color-gold-rim)]" />
          <div className="leading-tight">
            <OrnateTitle size="sm">{meta.title}</OrnateTitle>
            <div className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-muted mt-0.5">
              {meta.subtitle}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2 py-1 text-text-muted hover:text-text-primary clip-hex-frame-sm hover:bg-[#10162a] transition-colors"
          title="Close (Esc)"
        >
          <span className="font-mono text-[9px] tracking-[0.18em] uppercase">Esc</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 h-[440px]">
        {id === "overview" && <OverviewSheet />}
        {id === "alarms" && <AlarmsSheet />}
        {id === "tickets" && <TicketsSheet />}
        {id === "analytics" && <AnalyticsSheet />}
        {id === "map" && <MapSheet />}
        {id === "comms" && <CommsSheet />}
        {id === "safety" && <SafetySheet />}
        {id === "search" && <SearchSheet />}
      </div>
    </div>
  );
}
