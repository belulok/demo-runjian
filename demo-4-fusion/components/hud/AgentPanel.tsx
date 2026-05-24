"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play, Pause, Sparkles } from "lucide-react";
import { useCommandStore } from "@/lib/store/commandStore";
import { AGENT_BY_ID } from "@/lib/mock/agents";
import { AGENT_CONTENT, type AgentAbility, type AgentStat, type AgentActivityEntry, type AgentAction } from "@/lib/mock/agentContent";
import { AGENT_COLORS } from "@/lib/theme/colors";
import { useAgentStore } from "@/lib/store/agentStore";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DataTick } from "@/components/primitives/DataTick";
import { cn, formatRelative } from "@/lib/utils";

/** Slide-up agent panel — DOTA-style "skill / talent" sheet for one agent.
 *  Lives at the same z-layer as CommandSheet and replaces it when opened. */
export function AgentPanel() {
  const activeAgent = useCommandStore((s) => s.activeAgent);
  const close = useCommandStore((s) => s.close);

  useEffect(() => {
    if (!activeAgent) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeAgent, close]);

  return (
    <AnimatePresence>
      {activeAgent && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute left-3 right-[244px] bottom-3 z-40 pointer-events-auto"
        >
          <PanelContents agentId={activeAgent} onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelContents({ agentId, onClose }: { agentId: keyof typeof AGENT_BY_ID; onClose: () => void }) {
  const agent = AGENT_BY_ID[agentId];
  const content = AGENT_CONTENT[agentId];
  const color = AGENT_COLORS[agentId];
  const status = useAgentStore((s) => s.statuses[agentId]);
  const pulseAgent = useAgentStore((s) => s.pulse);
  const setAgentStatus = useAgentStore((s) => s.set);

  return (
    <div
      className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset shadow-2xl"
      style={{
        boxShadow: `0 -8px 32px rgba(0,0,0,0.55), inset 0 -1px 0 ${color.hex}55`,
        ["--rib" as never]: color.hex,
      }}
    >
      {/* Accent ribbon along the top */}
      <div
        className="absolute top-0 left-3 right-3 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color.hex} 50%, transparent)`,
          boxShadow: `0 0 12px ${color.glow}`,
        }}
      />

      {/* Hero */}
      <div className="flex items-stretch gap-3 px-4 py-3 border-b border-[var(--color-rule)]">
        {/* Portrait */}
        <div className="relative">
          <div
            className="relative w-14 h-14 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[28px] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color.hex}44 0%, #050810 70%)`,
              color: color.hex,
              border: `1px solid ${color.hex}99`,
              textShadow: `0 0 10px ${color.glow}`,
            }}
          >
            {agent.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.image}
                alt={agent.name}
                className="absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]"
                draggable={false}
              />
            ) : (
              agent.glyph
            )}
            {status === "alert" && (
              <span
                className="absolute -inset-1 clip-hex-frame-sm animate-alert-pulse pointer-events-none"
                style={{ border: `1px solid ${color.hex}`, boxShadow: `0 0 18px ${color.glow}` }}
              />
            )}
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0a0e1a]",
              status === "idle" && "bg-emerald-400/80",
              status === "thinking" && "bg-amber-400 animate-pulse",
              status === "responding" && "bg-cyan-400 animate-pulse",
              status === "alert" && "bg-red-500",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <OrnateTitle size="md" accentColor={color.hex}>
              {agent.name}
            </OrnateTitle>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em] px-1.5 py-0.5"
              style={{
                color: color.hex,
                background: `${color.hex}1a`,
                border: `1px solid ${color.hex}55`,
              }}
            >
              {agent.className} · L{agent.level}
            </span>
            <span className="font-mono text-[10px] text-text-muted">{agent.cnName}</span>
          </div>
          <div className="text-[12px] text-text-secondary leading-snug">
            <span className="text-text-primary font-condensed font-semibold uppercase tracking-[0.14em]">
              {agent.role}
            </span>
            <span className="mx-2 text-text-dim">·</span>
            <span className="italic">&ldquo;{agent.motto}&rdquo;</span>
          </div>
          <div className="text-[11px] text-text-secondary mt-0.5">
            {content.tagline}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span
            className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1 stripe-ai"
            style={{ color: color.hex, border: `1px solid ${color.hex}55` }}
          >
            {content.autonomy.split("·")[0].trim()}
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2 py-1 text-text-muted hover:text-text-primary clip-hex-frame-sm hover:bg-[#10162a] transition-colors"
            title="Close (Esc)"
          >
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase">Esc</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_320px] gap-4 px-4 py-3 h-[420px]">
        {/* Left column: stats + abilities */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2">
            {content.stats.map((s) => (
              <StatCell key={s.label} stat={s} accent={color.hex} />
            ))}
          </div>

          {/* Abilities */}
          <div className="flex-1 min-h-0 flex flex-col">
            <OrnateTitle size="xs" accentColor={color.hex} className="mb-2">
              Abilities
            </OrnateTitle>
            <div className="space-y-2 overflow-auto scrollbar-dark pr-1">
              {content.abilities.map((a) => (
                <AbilityRow key={a.name} ability={a} accent={color.hex} glow={color.glow} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: recent activity + autonomy */}
        <div className="flex flex-col gap-3 min-w-0">
          <OrnateTitle size="xs" accentColor={color.hex}>
            Recent activity
          </OrnateTitle>
          <div className="flex-1 overflow-auto scrollbar-dark pr-1 space-y-1.5 min-h-0">
            {content.recent.map((e, i) => (
              <ActivityRow key={i} entry={e} accent={color.hex} />
            ))}
          </div>
          <div
            className="p-2.5 bg-[#0a0f1c] clip-hex-frame-sm"
            style={{ boxShadow: `inset 2px 0 0 ${color.hex}` }}
          >
            <div className="font-condensed text-[9px] uppercase tracking-[0.2em] text-text-muted mb-0.5">
              Autonomy
            </div>
            <div className="text-[11px] text-text-secondary leading-snug">
              {content.autonomy}
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-4 py-3 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
          <Sparkles className="w-3 h-3" style={{ color: color.hex }} />
          <span className="uppercase tracking-[0.18em]">
            Status · {status === "idle" ? "ready" : status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Visible demo button: triggers the agent's alert/respond states */}
          <button
            onClick={() => pulseAgent(agentId, "responding", 2000)}
            className="flex items-center gap-1.5 px-3 py-1.5 clip-hex-frame-sm font-condensed text-[10px] uppercase tracking-[0.16em] bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary transition-colors"
            title="Pulse responding"
          >
            <Play className="w-3 h-3" />
            Invoke
          </button>
          <button
            onClick={() => setAgentStatus(agentId, "idle")}
            className="flex items-center gap-1.5 px-3 py-1.5 clip-hex-frame-sm font-condensed text-[10px] uppercase tracking-[0.16em] bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary transition-colors"
            title="Reset to idle"
          >
            <Pause className="w-3 h-3" />
            Reset
          </button>
          <span className="w-px h-5 bg-[var(--color-rule)] mx-1" />
          {content.actions.map((a) => (
            <ActionButton key={a.label} action={a} accent={color.hex} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCell({ stat, accent }: { stat: AgentStat; accent: string }) {
  return (
    <div
      className="p-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
      style={{ boxShadow: `inset 2px 0 0 ${accent}55` }}
    >
      <DataTick
        label={stat.label}
        value={stat.value}
        unit={stat.unit}
        tone={stat.tone}
        size="md"
        align="left"
      />
      {stat.delta && (
        <div
          className={cn(
            "mt-0.5 font-mono text-[9px]",
            stat.delta.startsWith("-")
              ? stat.tone === "bad"
                ? "text-red-400"
                : "text-emerald-400"
              : "text-amber-400",
          )}
        >
          Δ {stat.delta}
        </div>
      )}
    </div>
  );
}

function AbilityRow({ ability, accent, glow }: { ability: AgentAbility; accent: string; glow: string }) {
  return (
    <div
      className="flex items-start gap-3 px-2.5 py-2 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
      style={{ boxShadow: `inset 2px 0 0 ${accent}` }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 clip-hex-frame-sm flex items-center justify-center font-display text-[18px] font-bold"
        style={{
          background: `linear-gradient(135deg, ${accent}33, #050810 70%)`,
          color: accent,
          border: `1px solid ${accent}66`,
          textShadow: `0 0 8px ${glow}`,
        }}
      >
        {ability.glyph}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-condensed text-[11.5px] font-semibold uppercase tracking-[0.14em] text-text-primary">
          {ability.name}
        </div>
        <div className="text-[10.5px] text-text-secondary mt-0.5 leading-snug">
          {ability.description}
        </div>
      </div>
      {ability.kpi && (
        <div className="flex-shrink-0 text-right">
          <div className="font-condensed text-[8.5px] uppercase tracking-[0.2em] text-text-muted">
            {ability.kpi.label}
          </div>
          <div className="font-mono text-[12px]" style={{ color: accent }}>
            {ability.kpi.value}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ entry, accent }: { entry: AgentActivityEntry; accent: string }) {
  return (
    <div
      className="px-2 py-1.5 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]"
      style={{ boxShadow: `inset 2px 0 0 ${accent}66` }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-mono text-[9px] text-text-muted">{formatRelative(entry.ts)} ago</span>
      </div>
      <div className="text-[11px] text-text-primary leading-snug">{entry.message}</div>
    </div>
  );
}

function ActionButton({ action, accent }: { action: AgentAction; accent: string }) {
  return (
    <button
      disabled={action.disabled}
      title={action.hint ?? action.label}
      className={cn(
        "flex items-center px-3 py-1.5 clip-hex-frame-sm font-condensed text-[10.5px] uppercase tracking-[0.16em] transition-colors",
        action.disabled
          ? "bg-[#10162a] text-text-muted cursor-not-allowed opacity-60"
          : action.primary
            ? "text-text-primary hover:brightness-110"
            : "bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary",
      )}
      style={
        action.primary && !action.disabled
          ? { background: `linear-gradient(180deg, ${accent}55, ${accent}25)`, boxShadow: `inset 0 -2px 0 ${accent}` }
          : undefined
      }
    >
      {action.label}
    </button>
  );
}
