"use client";

import { motion } from "framer-motion";
import { AGENTS } from "@/lib/mock/agents";
import { useAgentStore } from "@/lib/store/agentStore";
import { useCommandStore } from "@/lib/store/commandStore";
import { AGENT_COLORS } from "@/lib/theme/colors";
import { cn } from "@/lib/utils";

/** Horizontal DOTA-style skill bar — 10 agents as hex portrait tiles
 *  with hotkey + class name. Replaces the right-side roster.
 *  Hotkey handler lives in BottomHUD so it stays active when this panel
 *  is collapsed. */
export function AgentSkillBar() {
  const statuses = useAgentStore((s) => s.statuses);
  const activeAgent = useCommandStore((s) => s.activeAgent);
  const toggleAgent = useCommandStore((s) => s.toggleAgent);

  return (
    <div className="flex items-stretch h-full gap-1 px-2">
      {AGENTS.map((agent, idx) => {
        const color = AGENT_COLORS[agent.id];
        const status = statuses[agent.id];
        const isAlert = status === "alert";
        const isResponding = status === "responding";
        const isThinking = status === "thinking";
        const hotkey = String((idx + 1) % 10); // 1..9, 0
        const isActive = activeAgent === agent.id;

        return (
          <motion.button
            key={agent.id}
            onClick={() => toggleAgent(agent.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            animate={isAlert ? { y: [0, -3, 0, -2, 0] } : { y: 0 }}
            transition={isAlert ? { duration: 0.5 } : { duration: 0.2 }}
            className={cn(
              "relative group flex flex-col items-center justify-between py-1.5 px-1.5 clip-hex-frame-sm",
              "bg-gradient-to-b from-[#10162a] to-[#0a0e1a]",
              "ring-1 ring-inset ring-[rgba(148,163,184,0.1)]",
              "transition-all w-16",
              isAlert && "ring-[rgba(239,68,68,0.5)]",
              isActive && "ring-[rgba(201,168,90,0.55)]",
            )}
            style={{
              boxShadow: isActive
                ? `inset 0 -2px 0 ${color.hex}, 0 0 20px ${color.glow}`
                : isAlert
                  ? `inset 0 -2px 0 ${color.hex}, 0 0 16px ${color.glow}`
                  : isResponding
                    ? `inset 0 -2px 0 ${color.hex}, 0 0 10px ${color.glow}`
                    : `inset 0 -2px 0 ${color.hex}`,
            }}
            title={`${agent.name} · ${agent.role} · [${hotkey}]`}
          >
            {/* Hotkey */}
            <span className="absolute top-0.5 left-1 font-mono text-[8px] text-text-muted bg-black/40 px-1 leading-tight rounded-sm">
              {hotkey}
            </span>

            {/* Portrait — hex */}
            <div className="relative">
              <div
                className="relative w-9 h-9 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[18px] overflow-hidden"
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
                    className="absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-[0_0_4px_rgba(0,0,0,0.45)]"
                    draggable={false}
                  />
                ) : (
                  <span style={{ textShadow: `0 0 6px ${color.glow}` }}>{agent.glyph}</span>
                )}
                {isAlert && (
                  <span
                    className="absolute -inset-0.5 clip-hex-frame-sm animate-alert-pulse pointer-events-none"
                    style={{
                      border: `1px solid ${color.hex}`,
                      boxShadow: `0 0 14px ${color.glow}`,
                    }}
                  />
                )}
              </div>
              {/* Status dot */}
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

            {/* Short name */}
            <span className="font-condensed text-[8.5px] font-semibold uppercase tracking-[0.12em] text-text-secondary mt-0.5">
              {agent.shortName}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
