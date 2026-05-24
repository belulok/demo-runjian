"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Square, X, Sparkles } from "lucide-react";
import { useWorldStore } from "@/lib/store/worldStore";
import { useAgentStore } from "@/lib/store/agentStore";
import {
  STATION_BY_ID,
  STATION_TYPE_LABEL,
  STATION_TYPE_GLYPH,
  STATION_TYPE_TINT,
  type ChainStep,
} from "@/lib/mock/stations";
import { AGENT_BY_ID } from "@/lib/mock/agents";
import { AGENT_COLORS } from "@/lib/theme/colors";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { cn, formatTime } from "@/lib/utils";

/** Bottom-anchored panel that opens when a station is selected. Renders the
 *  station's AI team and plays the chain-effect playbook on demand: each
 *  agent activates in sequence and emits a human-readable line into the
 *  transcript. */
export function StationTeamBrief() {
  const stationId = useWorldStore((s) => s.selectedStationId);
  const selectStation = useWorldStore((s) => s.selectStation);

  useEffect(() => {
    if (!stationId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectStation(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stationId, selectStation]);

  return (
    <AnimatePresence>
      {stationId && (
        <motion.div
          key={stationId}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="absolute left-3 right-[244px] bottom-3 z-40 pointer-events-auto"
        >
          <BriefBody stationId={stationId} onClose={() => selectStation(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type TranscriptLine = {
  agentId: ChainStep["agentId"];
  text: string;
  ts: number;
};

type RunState = "idle" | "running" | "done";

function BriefBody({ stationId, onClose }: { stationId: string; onClose: () => void }) {
  const station = STATION_BY_ID[stationId];
  const pulseAgent = useAgentStore((s) => s.pulse);
  const setAgentStatus = useAgentStore((s) => s.set);
  const statuses = useAgentStore((s) => s.statuses);

  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [runState, setRunState] = useState<RunState>("idle");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset state when the station changes.
  useEffect(() => {
    setTranscript([]);
    setActiveStep(-1);
    setRunState("idle");
    return () => {
      // Cancel any in-flight chain when the panel unmounts / station changes.
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, [stationId]);

  const stop = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setActiveStep(-1);
    setRunState(transcript.length > 0 ? "done" : "idle");
    // Reset any agents that were left active by a cancelled step
    for (const step of station.chain) {
      setAgentStatus(step.agentId, "idle");
    }
  }, [transcript.length, station.chain, setAgentStatus]);

  const run = useCallback(() => {
    // Restart fresh
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setTranscript([]);
    setActiveStep(-1);
    setRunState("running");

    station.chain.forEach((step, idx) => {
      const startTimer = setTimeout(() => {
        setActiveStep(idx);
        pulseAgent(step.agentId, "responding", step.durationMs);
        setTranscript((prev) => [
          ...prev,
          { agentId: step.agentId, text: step.text, ts: Date.now() },
        ]);
      }, step.delayMs);
      timers.current.push(startTimer);
    });

    // Mark done after the final step completes
    const last = station.chain[station.chain.length - 1];
    const totalMs = last.delayMs + last.durationMs + 400;
    const doneTimer = setTimeout(() => {
      setActiveStep(-1);
      setRunState("done");
    }, totalMs);
    timers.current.push(doneTimer);
  }, [station.chain, pulseAgent]);

  // Auto-scroll transcript when new lines arrive
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const tint = STATION_TYPE_TINT[station.type];
  const typeLabel = STATION_TYPE_LABEL[station.type];
  const typeGlyph = STATION_TYPE_GLYPH[station.type];
  const statusToneClass =
    station.status === "critical"
      ? "text-red-400"
      : station.status === "warning"
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <div
      className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset shadow-2xl"
      style={{
        boxShadow: `0 -10px 36px rgba(0,0,0,0.6), inset 0 -1px 0 ${tint}55`,
      }}
    >
      {/* Top accent rib in the station-type colour */}
      <div
        className="absolute top-0 left-3 right-3 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${tint} 50%, transparent)`,
          boxShadow: `0 0 12px ${tint}88`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-rule)]">
        <div className="flex items-center gap-3">
          {/* Station type glyph badge */}
          <div
            className="w-10 h-10 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[20px]"
            style={{
              background: `linear-gradient(135deg, ${tint}44 0%, #050810 70%)`,
              color: tint,
              border: `1px solid ${tint}99`,
              textShadow: `0 0 10px ${tint}66`,
            }}
          >
            {typeGlyph}
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <OrnateTitle size="sm" accentColor={tint}>
                {station.name}
              </OrnateTitle>
              <span
                className="font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5"
                style={{ color: tint, border: `1px solid ${tint}55`, background: `${tint}1a` }}
              >
                {typeLabel}
              </span>
              <span className={cn("font-mono text-[9px] uppercase tracking-[0.18em]", statusToneClass)}>
                ● {station.status}
              </span>
            </div>
            <div className="font-condensed text-[10.5px] uppercase tracking-[0.14em] text-text-secondary mt-0.5">
              {station.summary}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {runState !== "running" ? (
            <motion.button
              onClick={run}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 clip-hex-frame-sm font-condensed text-[11px] uppercase tracking-[0.18em] text-text-primary"
              style={{
                background: `linear-gradient(180deg, ${tint}55, ${tint}25)`,
                boxShadow: `inset 0 -2px 0 ${tint}, 0 0 16px ${tint}33`,
              }}
              title="Run the AI team chain"
            >
              <Play className="w-3 h-3" />
              {runState === "done" ? "Run again" : "Run team"}
            </motion.button>
          ) : (
            <motion.button
              onClick={stop}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 clip-hex-frame-sm font-condensed text-[11px] uppercase tracking-[0.18em] bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary transition-colors"
              title="Cancel the chain"
            >
              <Square className="w-3 h-3" />
              Stop
            </motion.button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2 py-1.5 text-text-muted hover:text-text-primary clip-hex-frame-sm hover:bg-[#10162a] transition-colors"
            title="Close (Esc)"
          >
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase">Esc</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body — team avatars + transcript */}
      <div className="grid grid-cols-[280px_1fr] gap-4 px-4 py-3 h-[260px]">
        {/* Team column */}
        <div className="flex flex-col min-w-0">
          <OrnateTitle size="xs" className="mb-2">
            AI Team · {station.team.length}
          </OrnateTitle>
          <div className="flex-1 overflow-auto scrollbar-dark pr-1 space-y-1.5">
            {station.team.map((agentId, i) => {
              const agent = AGENT_BY_ID[agentId];
              const color = AGENT_COLORS[agentId];
              const status = statuses[agentId];
              const isThisStep = activeStep >= 0 && station.chain[activeStep]?.agentId === agentId;
              return (
                <div
                  key={`${agentId}-${i}`}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 clip-hex-frame-sm ring-1 ring-inset transition-all",
                    isThisStep
                      ? "bg-[#141a2a] ring-[rgba(201,168,90,0.4)]"
                      : "bg-[#0a0f1c] ring-[var(--color-border-soft)]",
                  )}
                  style={{
                    boxShadow: isThisStep
                      ? `inset 2px 0 0 ${color.hex}, 0 0 16px ${color.glow}`
                      : `inset 2px 0 0 ${color.hex}66`,
                  }}
                >
                  {/* Avatar — image if available, glyph otherwise */}
                  <div
                    className="relative w-10 h-10 clip-hex-frame-sm flex items-center justify-center font-display font-bold text-[18px] overflow-hidden flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color.hex}44 0%, #050810 70%)`,
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
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0e1a]",
                        status === "idle" && "bg-emerald-400/70",
                        status === "thinking" && "bg-amber-400 animate-pulse",
                        status === "responding" && "bg-cyan-400 animate-pulse",
                        status === "alert" && "bg-red-500",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary truncate">
                      {agent.name}
                    </div>
                    <div className="font-mono text-[9.5px] text-text-muted truncate">
                      {agent.role}
                    </div>
                  </div>
                  <span
                    className="font-mono text-[8.5px] uppercase tracking-[0.18em] px-1.5 py-0.5 flex-shrink-0"
                    style={{ color: color.hex, border: `1px solid ${color.hex}66` }}
                  >
                    Step {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transcript column */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <OrnateTitle size="xs">Chain Transcript</OrnateTitle>
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-text-muted">
              <Sparkles className="w-3 h-3" style={{ color: tint }} />
              {runState === "running" && (
                <span className="text-amber-400 uppercase tracking-[0.18em]">
                  Streaming · step {activeStep + 1} / {station.chain.length}
                </span>
              )}
              {runState === "done" && (
                <span className="text-emerald-400 uppercase tracking-[0.18em]">
                  Chain complete · {transcript.length} lines
                </span>
              )}
              {runState === "idle" && (
                <span className="uppercase tracking-[0.18em]">
                  Idle · {station.chain.length} steps queued
                </span>
              )}
            </div>
          </div>
          <div
            ref={transcriptRef}
            className="flex-1 min-h-0 overflow-auto scrollbar-dark pr-1 space-y-2 bg-[#06090f] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)] p-3"
          >
            {transcript.length === 0 && (
              <div className="h-full flex items-center justify-center text-[11px] text-text-muted italic font-condensed uppercase tracking-[0.18em]">
                {runState === "running"
                  ? "Awaiting first agent…"
                  : "Press “Run team” to start the chain"}
              </div>
            )}
            <AnimatePresence initial={false}>
              {transcript.map((line, i) => {
                const agent = AGENT_BY_ID[line.agentId];
                const color = AGENT_COLORS[line.agentId];
                return (
                  <motion.div
                    key={`${line.ts}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex gap-2.5"
                  >
                    <div
                      className="flex-shrink-0 w-7 h-7 clip-hex-frame-sm flex items-center justify-center font-display text-[12px] font-bold overflow-hidden mt-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${color.hex}33 0%, #0a0e1a 70%)`,
                        color: color.hex,
                        border: `1px solid ${color.hex}66`,
                      }}
                    >
                      {agent.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={agent.image}
                          alt={agent.name}
                          className="absolute inset-0 w-7 h-7 object-contain object-bottom"
                          draggable={false}
                        />
                      ) : (
                        agent.glyph
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="font-condensed text-[10px] font-semibold uppercase tracking-[0.16em]"
                          style={{ color: color.hex }}
                        >
                          {agent.name}
                        </span>
                        <span className="font-mono text-[9px] text-text-muted">
                          {formatTime(line.ts)}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-text-primary leading-relaxed">
                        {line.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
