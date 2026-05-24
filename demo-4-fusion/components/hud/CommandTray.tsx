"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Map as MapIcon,
  Radio,
  Search,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { useCommandStore, type CommandSheetId } from "@/lib/store/commandStore";

const ACTIONS: { key: CommandSheetId; label: string; icon: typeof Activity; hotkey: string }[] = [
  { key: "overview", label: "Overview", icon: Activity, hotkey: "Q" },
  { key: "alarms", label: "Alarms", icon: AlertTriangle, hotkey: "W" },
  { key: "tickets", label: "Tickets", icon: ClipboardList, hotkey: "E" },
  { key: "analytics", label: "Analytics", icon: BarChart3, hotkey: "R" },
  { key: "map", label: "Map", icon: MapIcon, hotkey: "T" },
  { key: "comms", label: "Comms", icon: Radio, hotkey: "Y" },
  { key: "safety", label: "Safety", icon: Shield, hotkey: "U" },
  { key: "search", label: "Search", icon: Search, hotkey: "/" },
];

/** Compact command tray for the right side of the bottom HUD —
 *  icon-only navigation buttons + build mode toggle. */
export function CommandTray() {
  const activeSheet = useCommandStore((s) => s.activeSheet);
  const toggle = useCommandStore((s) => s.toggle);

  // QWERTYU / hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = e.key.toLowerCase();
      const match = ACTIONS.find((a) => a.hotkey.toLowerCase() === key);
      if (match) {
        e.preventDefault();
        toggle(match.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <div className="relative h-full flex flex-col px-2 py-1.5 clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(148,163,184,0.15)]">
      <div
        className="absolute top-0 left-3 right-3 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
      />
      <div className="flex items-center justify-between pb-1 border-b border-[var(--color-rule)]">
        <OrnateTitle size="xs">Command</OrnateTitle>
        <span className="font-mono text-[9px] text-text-muted">
          {ACTIONS.length} actions
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 mt-1.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isActive = activeSheet === action.key;
          return (
            <motion.button
              key={action.key}
              onClick={() => toggle(action.key)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 h-12 clip-hex-frame-sm transition-all",
                isActive ? "bg-[#1b2238] text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-[#10162a]",
              )}
              title={`${action.label} (${action.hotkey})`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="font-condensed text-[8px] uppercase tracking-[0.16em] text-text-muted">
                {action.label}
              </span>
              <span className="absolute top-0.5 right-1 font-mono text-[7px] text-text-muted bg-black/30 px-0.5 rounded-sm leading-tight">
                {action.hotkey}
              </span>
              {isActive && (
                <motion.div
                  layoutId="cmd-tray-active"
                  className="absolute bottom-0 left-1 right-1 h-[2px]"
                  style={{ background: "var(--color-gold-rim)", boxShadow: "0 0 6px var(--color-gold-glow)" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
