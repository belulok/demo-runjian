"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ClipboardList,
  Command as CommandIcon,
  Map as MapIcon,
  Radio,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useCommandStore, type CommandSheetId } from "@/lib/store/commandStore";
import { useAgentStore } from "@/lib/store/agentStore";
import { AGENTS } from "@/lib/mock/agents";
import { AGENT_COLORS } from "@/lib/theme/colors";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { cn } from "@/lib/utils";

const SHEETS: {
  key: CommandSheetId;
  label: string;
  hotkey: string;
  icon: typeof Activity;
  description: string;
}[] = [
  { key: "overview",  label: "Overview",  hotkey: "Q", icon: Activity,       description: "Fleet KPIs across all sectors" },
  { key: "alarms",    label: "Alarms",    hotkey: "W", icon: AlertTriangle,  description: "Full alarm log + dispatch" },
  { key: "tickets",   label: "Tickets",   hotkey: "E", icon: ClipboardList,  description: "Work orders + priorities" },
  { key: "analytics", label: "Analytics", hotkey: "R", icon: BarChart3,      description: "Generation + forecast variance" },
  { key: "map",       label: "Map",       hotkey: "T", icon: MapIcon,        description: "Geographic plant network" },
  { key: "comms",     label: "Comms",     hotkey: "Y", icon: Radio,          description: "Agent dialogue + operator messages" },
  { key: "safety",    label: "Safety",    hotkey: "U", icon: Shield,         description: "Incidents + risk + certifications" },
  { key: "search",    label: "Search",    hotkey: "/", icon: Search,         description: "Devices, alarms, tickets, knowledge" },
];

/* ============================================================
   Commands launcher — dropdown listing the 8 command sheets.
   ============================================================ */
export function CommandsLauncher() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activeSheet = useCommandStore((s) => s.activeSheet);
  const toggleSheet = useCommandStore((s) => s.toggle);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "h-9 px-2.5 flex items-center gap-1.5 clip-hex-frame-sm transition-colors",
          open || activeSheet
            ? "bg-[#1b2238] text-text-primary ring-1 ring-inset ring-[rgba(201,168,90,0.35)]"
            : "bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary ring-1 ring-inset ring-[rgba(148,163,184,0.15)]",
        )}
        title="Open the command sheets"
      >
        <CommandIcon className="w-3.5 h-3.5" />
        <span className="font-display text-[10px] uppercase tracking-[0.22em]">Commands</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-[300px]"
          >
            <div className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)] shadow-2xl">
              <div
                className="absolute top-0 left-3 right-3 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
              />
              <div className="px-3 py-2 border-b border-[var(--color-rule)]">
                <OrnateTitle size="xs">Command Sheets</OrnateTitle>
                <div className="font-mono text-[9px] text-text-muted mt-0.5">
                  Hotkeys also work globally
                </div>
              </div>
              <div className="py-1">
                {SHEETS.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSheet === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => {
                        toggleSheet(s.key);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors",
                        isActive ? "bg-[#1b2238]" : "hover:bg-[#10162a]",
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-[var(--color-gold-rim)]" : "text-text-secondary")} />
                      <div className="flex-1 min-w-0">
                        <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary">
                          {s.label}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">{s.description}</div>
                      </div>
                      <kbd className="font-mono text-[9px] text-text-muted bg-black/40 px-1.5 py-0.5 rounded-sm">
                        {s.hotkey}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   Agents launcher — dropdown with all 10 agent avatar tiles.
   Click → opens that agent's AgentPanel.
   ============================================================ */
export function AgentsLauncher() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activeAgent = useCommandStore((s) => s.activeAgent);
  const toggleAgent = useCommandStore((s) => s.toggleAgent);
  const statuses = useAgentStore((s) => s.statuses);
  const activeCount = Object.values(statuses).filter((s) => s !== "idle").length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "h-9 px-2.5 flex items-center gap-1.5 clip-hex-frame-sm transition-colors",
          open || activeAgent
            ? "bg-[#1b2238] text-text-primary ring-1 ring-inset ring-[rgba(201,168,90,0.35)]"
            : "bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary ring-1 ring-inset ring-[rgba(148,163,184,0.15)]",
        )}
        title="Open the AI agents panel"
      >
        <Users className="w-3.5 h-3.5" />
        <span className="font-display text-[10px] uppercase tracking-[0.22em]">Agents</span>
        {activeCount > 0 && (
          <span className="font-mono text-[9px] text-amber-400 ml-0.5">{activeCount}</span>
        )}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-[380px]"
          >
            <div className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)] shadow-2xl">
              <div
                className="absolute top-0 left-3 right-3 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
              />
              <div className="px-3 py-2 border-b border-[var(--color-rule)] flex items-center justify-between">
                <OrnateTitle size="xs">AI Agents</OrnateTitle>
                <span className="font-mono text-[9px] text-text-muted">
                  {activeCount > 0 ? (
                    <span className="text-amber-400">{activeCount} active</span>
                  ) : (
                    <span>10 idle</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 p-2">
                {AGENTS.map((agent, idx) => {
                  const color = AGENT_COLORS[agent.id];
                  const status = statuses[agent.id];
                  const isAlert = status === "alert";
                  const isResponding = status === "responding";
                  const isThinking = status === "thinking";
                  const isActive = activeAgent === agent.id;
                  const hotkey = String((idx + 1) % 10);
                  return (
                    <motion.button
                      key={agent.id}
                      onClick={() => {
                        toggleAgent(agent.id);
                        setOpen(false);
                      }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative flex flex-col items-center justify-end py-1.5 clip-hex-frame-sm transition-all",
                        "bg-gradient-to-b from-[#10162a] to-[#0a0e1a]",
                        "ring-1 ring-inset ring-[rgba(148,163,184,0.1)]",
                        isAlert && "ring-[rgba(239,68,68,0.5)]",
                        isActive && "ring-[rgba(201,168,90,0.55)]",
                      )}
                      style={{
                        boxShadow: isActive
                          ? `inset 0 -2px 0 ${color.hex}, 0 0 12px ${color.glow}`
                          : isAlert
                            ? `inset 0 -2px 0 ${color.hex}, 0 0 10px ${color.glow}`
                            : `inset 0 -2px 0 ${color.hex}`,
                      }}
                      title={`${agent.name} · ${agent.role} · [${hotkey}]`}
                    >
                      <span className="absolute top-0.5 left-1 font-mono text-[7.5px] text-text-muted bg-black/40 px-0.5 leading-tight rounded-sm">
                        {hotkey}
                      </span>
                      <div className="relative">
                        <div
                          className="relative w-10 h-10 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[18px] overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${color.hex}44 0%, #0a0e1a 70%)`,
                            color: color.hex,
                            border: `1px solid ${color.hex}88`,
                          }}
                        >
                          {agent.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={agent.image}
                              alt={agent.name}
                              className="absolute inset-0 w-full h-full object-contain object-bottom"
                              draggable={false}
                            />
                          ) : (
                            <span style={{ textShadow: `0 0 6px ${color.glow}` }}>{agent.glyph}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-[#0a0e1a]",
                            status === "idle" && "bg-emerald-400/70",
                            isThinking && "bg-amber-400 animate-pulse",
                            isResponding && "bg-cyan-400 animate-pulse",
                            isAlert && "bg-red-500",
                          )}
                        />
                      </div>
                      <span className="font-condensed text-[8px] font-semibold uppercase tracking-[0.12em] text-text-secondary mt-0.5">
                        {agent.shortName}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="px-3 py-1.5 border-t border-[var(--color-rule)] font-mono text-[9px] text-text-muted">
                Hotkeys 1-9, 0 also invoke each agent
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
