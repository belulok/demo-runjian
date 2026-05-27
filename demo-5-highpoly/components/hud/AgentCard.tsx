"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AGENT_COLORS } from "@/lib/theme/colors";
import type { Agent, AgentStatus } from "@/lib/mock/agents";

type AgentCardProps = {
  agent: Agent;
  status: AgentStatus;
  onClick?: () => void;
};

export function AgentCard({ agent, status, onClick }: AgentCardProps) {
  const color = AGENT_COLORS[agent.id];
  const isAlert = status === "alert";
  const isResponding = status === "responding";
  const isThinking = status === "thinking";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -1 }}
      animate={isAlert ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }}
      transition={isAlert ? { duration: 0.4 } : { duration: 0.2 }}
      className="relative w-full text-left group"
    >
      <div
        className={cn(
          "relative flex items-center gap-2.5 px-2 py-1.5 clip-hex-frame-sm",
          "bg-gradient-to-r from-[#10162a] to-[#0a0e1a]",
          "ring-1 ring-inset ring-[rgba(148,163,184,0.08)]",
          "transition-all duration-200",
          isAlert && "ring-[rgba(239,68,68,0.4)]",
        )}
        style={{
          boxShadow: isAlert
            ? `inset 2px 0 0 ${color.hex}, 0 0 14px ${color.glow}`
            : `inset 2px 0 0 ${color.hex}`,
        }}
      >
        {/* Portrait */}
        <div className="relative flex-shrink-0">
          <div
            className="relative w-7 h-7 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[15px]"
            style={{
              background: `linear-gradient(135deg, ${color.hex}33 0%, #0a0e1a 70%)`,
              color: color.hex,
              border: `1px solid ${color.hex}55`,
            }}
          >
            <span style={{ textShadow: `0 0 5px ${color.glow}` }}>{agent.glyph}</span>
            {isAlert && (
              <span
                className="absolute -inset-0.5 clip-hex-frame-sm animate-alert-pulse pointer-events-none"
                style={{
                  border: `1px solid ${color.hex}`,
                  boxShadow: `0 0 10px ${color.glow}`,
                }}
              />
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

        {/* Name only — no role line */}
        <div className="flex-1 min-w-0">
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-text-primary truncate">
            {agent.name.replace("iRun.", "")}
          </div>
          <div className="text-[9px] text-text-muted font-condensed truncate uppercase tracking-[0.14em]">
            {agent.className}
          </div>
        </div>

        <div className="font-mono text-[9px] text-text-muted flex-shrink-0">L{agent.level}</div>
      </div>
    </motion.button>
  );
}
