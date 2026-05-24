"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Minimap } from "./Minimap";
import { AgentSkillBar } from "./AgentSkillBar";
import { CommandTray } from "./CommandTray";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { Panel } from "@/components/primitives/Panel";
import { useAgentStore } from "@/lib/store/agentStore";
import { useCommandStore } from "@/lib/store/commandStore";
import { AGENTS } from "@/lib/mock/agents";

const STORAGE_COLLAPSED = "irun.skillbar.collapsed.v1";

/** DOTA-style bottom HUD strip: Minimap (left) + Agent skill bar (center) +
 *  Command tray (right). The skill bar is collapsible to free the world view
 *  above the middle slot. */
export function BottomHUD() {
  const statuses = useAgentStore((s) => s.statuses);
  const activeCount = Object.values(statuses).filter((s) => s !== "idle").length;
  const toggleAgent = useCommandStore((s) => s.toggleAgent);

  const [collapsed, setCollapsed] = useState(false);
  // Restore persisted collapsed flag
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_COLLAPSED);
      if (raw === "1") setCollapsed(true);
    } catch {
      /* */
    }
  }, []);

  // Agent hotkeys (1..9, 0) — registered here so they keep working when the
  // skill panel is collapsed.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8, "0": 9,
      };
      const idx = map[e.key];
      if (idx == null) return;
      const agent = AGENTS[idx];
      if (!agent) return;
      e.preventDefault();
      toggleAgent(agent.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleAgent]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(STORAGE_COLLAPSED, next ? "1" : "0");
      } catch {
        /* */
      }
      return next;
    });
  };

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-none">
      <div className="flex items-end gap-3 h-44 pointer-events-auto">
        {/* Minimap (square, always full height) */}
        <div className="h-full">
          <Minimap />
        </div>

        {/* Middle slot — expanded panel, or thin collapsed bar */}
        <div className="flex-1 min-w-0 h-full flex items-end">
          <AnimatePresence initial={false} mode="wait">
            {collapsed ? (
              <motion.button
                key="collapsed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={toggleCollapsed}
                className="w-full h-9 px-3 flex items-center justify-between clip-hex-frame-sm bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.18)] hover:ring-[rgba(201,168,90,0.4)] transition-colors text-text-secondary hover:text-text-primary"
                title="Expand agent skill panel"
              >
                <div className="flex items-center gap-2">
                  <ChevronUp className="w-3 h-3 text-[var(--color-gold-rim)]" />
                  <OrnateTitle size="xs">Agent Skill Panel</OrnateTitle>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-text-muted">
                  {activeCount > 0 ? (
                    <span className="text-amber-400">{activeCount} active</span>
                  ) : (
                    <span>10 idle</span>
                  )}
                  <span className="text-text-dim">·</span>
                  <span>1·9·0 to invoke</span>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full h-full"
              >
                <Panel
                  className="h-full"
                  accentColor="var(--color-gold-rim)"
                  glowColor="var(--color-gold-glow)"
                  ribSide="top"
                >
                  <div className="flex flex-col h-full px-2 py-1.5">
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[var(--color-rule)]">
                      <OrnateTitle size="xs">Agent Skill Panel</OrnateTitle>
                      <div className="flex items-center gap-2 font-mono text-[9px] text-text-muted">
                        <span>
                          {activeCount > 0 ? (
                            <span className="text-amber-400">{activeCount} active</span>
                          ) : (
                            <span>10 idle</span>
                          )}
                        </span>
                        <span className="text-text-dim">·</span>
                        <span>1·9·0 to invoke</span>
                        <button
                          onClick={toggleCollapsed}
                          title="Collapse agent skill panel"
                          className="ml-1 p-0.5 text-text-muted hover:text-text-primary"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <AgentSkillBar />
                    </div>
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Command tray + portal stacked on the right (always full height) */}
        <div className="w-[280px] flex-shrink-0 h-full">
          <CommandTray />
        </div>
      </div>
    </div>
  );
}
