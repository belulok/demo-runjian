"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, ClipboardList, Hammer, Map, Radio, Search, Shield, Sparkles } from "lucide-react";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/lib/store/layoutStore";

const ACTIONS = [
  { key: "overview", label: "Overview", icon: Activity, hotkey: "1" },
  { key: "alarms", label: "Alarms", icon: AlertTriangle, hotkey: "2" },
  { key: "tickets", label: "Tickets", icon: ClipboardList, hotkey: "3" },
  { key: "analytics", label: "Analytics", icon: BarChart3, hotkey: "4" },
  { key: "map", label: "Map", icon: Map, hotkey: "5" },
  { key: "comms", label: "Comms", icon: Radio, hotkey: "6" },
  { key: "safety", label: "Safety", icon: Shield, hotkey: "7" },
  { key: "search", label: "Search", icon: Search, hotkey: "/" },
];

export function CommandBar() {
  const [active, setActive] = useState("overview");
  const isBuildMode = useLayoutStore((s) => s.isBuildMode);
  const toggleBuildMode = useLayoutStore((s) => s.toggleBuildMode);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(148,163,184,0.15)]">
        <div
          className="absolute top-0 left-3 right-3 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
        />
        <div className="flex items-center gap-1 px-3 py-2">
          <div className="flex items-center gap-1.5 pr-3 border-r border-[var(--color-rule)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-gold-rim)]" />
            <OrnateTitle size="xs">Command</OrnateTitle>
          </div>
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            const isActive = active === action.key;
            return (
              <motion.button
                key={action.key}
                onClick={() => setActive(action.key)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 group transition-all",
                  "clip-hex-frame-sm",
                  isActive
                    ? "bg-[#1b2238] text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-[#10162a]",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-condensed text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {action.label}
                </span>
                <span className="font-mono text-[9px] text-text-muted px-1 py-0.5 bg-black/30 rounded-sm">
                  {action.hotkey}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="cmd-active"
                    className="absolute bottom-0 left-2 right-2 h-[2px]"
                    style={{ background: "var(--color-gold-rim)", boxShadow: "0 0 8px var(--color-gold-glow)" }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Build mode — separate cluster, gold accent when active */}
          <div className="pl-2 ml-1 border-l border-[var(--color-rule)]">
            <motion.button
              onClick={toggleBuildMode}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex items-center gap-2 px-3 py-2 group transition-all clip-hex-frame-sm",
                isBuildMode
                  ? "bg-[#241c10] text-[var(--color-gold-rim)] ring-1 ring-inset ring-[var(--color-gold-deep)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-[#10162a]",
              )}
              style={isBuildMode ? { boxShadow: "0 0 14px var(--color-gold-glow)" } : undefined}
              title="Toggle build mode (B)"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span className="font-condensed text-[11px] font-semibold uppercase tracking-[0.18em]">
                {isBuildMode ? "Building" : "Build"}
              </span>
              <span className="font-mono text-[9px] text-text-muted px-1 py-0.5 bg-black/30 rounded-sm">
                B
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
