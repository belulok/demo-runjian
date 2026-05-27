"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { AGENTS } from "@/lib/mock/agents";
import { AGENT_COLORS } from "@/lib/theme/colors";

const SUGGESTIONS = [
  "Why is Array A3 underperforming this week?",
  "Dispatch a crew to inverter COM1-5",
  "Summarize today's safety events",
  "Forecast generation for tomorrow",
];

const MOCK_RESPONSE = [
  { agent: "supervisor", text: "Routing to specialists…" },
  { agent: "warning", text: "Detected a 23% output gap on Array A3 since 09:12. Trend is degrading at 1.8%/hr." },
  { agent: "diagnosis", text: "Root cause likely shading or surface soiling. Pattern matches 11 prior cases. Confidence 0.84." },
  { agent: "ticket", text: "Drafted WO-2026-0518 for field verification. Awaiting confirmation." },
];

/**
 * Header-mounted Unified Intelligence button. The dropdown anchors below
 * the button so it never overlaps the bottom HUD or any command/agent panel.
 * ⌘K / Ctrl-K opens; Esc closes.
 */
export function UnifiedPortalButton() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl-K to toggle; Esc to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "relative h-9 px-3 flex items-center gap-2 clip-hex-frame-sm transition-colors",
          open
            ? "bg-[#241c10] text-[var(--color-gold-rim)] ring-1 ring-inset ring-[var(--color-gold-deep)]"
            : "bg-[#10162a] hover:bg-[#1b2238] text-text-secondary hover:text-text-primary ring-1 ring-inset ring-[rgba(201,168,90,0.2)]",
        )}
        style={open ? { boxShadow: "0 0 14px var(--color-gold-glow)" } : undefined}
        title="Unified Intelligence (⌘K)"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="font-display text-[10px] uppercase tracking-[0.24em]">
          Portal
        </span>
        <span className="font-mono text-[9px] text-text-muted bg-black/40 px-1 rounded-sm">⌘K</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-[420px] z-50"
          >
            <div
              className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)]"
              style={{ boxShadow: "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(201,168,90,0.08)" }}
            >
              <div
                className="absolute top-0 left-3 right-3 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
              />
              <div className="px-4 py-3 border-b border-[var(--color-rule)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-gold-rim)]" />
                  <OrnateTitle size="sm">Unified Intelligence</OrnateTitle>
                </div>
                <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-4 py-3 space-y-2 max-h-72 overflow-y-auto scrollbar-dark">
                {MOCK_RESPONSE.map((line, i) => {
                  const isAgent = line.agent !== "supervisor";
                  const color = isAgent ? AGENT_COLORS[line.agent as keyof typeof AGENT_COLORS] : null;
                  const agent = isAgent ? AGENTS.find((a) => a.id === line.agent) : null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.6, duration: 0.3 }}
                      className="flex gap-2.5"
                    >
                      <div
                        className="flex-shrink-0 w-6 h-6 clip-hex-frame-sm flex items-center justify-center font-display text-[11px] font-bold"
                        style={
                          color
                            ? {
                                background: `linear-gradient(135deg, ${color.hex}33 0%, #0a0e1a 70%)`,
                                color: color.hex,
                                border: `1px solid ${color.hex}66`,
                              }
                            : {
                                background: "#1b2238",
                                color: "var(--color-gold-rim)",
                                border: "1px solid var(--color-gold-deep)",
                              }
                        }
                      >
                        {agent?.glyph ?? "S"}
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-text-muted mb-0.5">
                          {agent?.name ?? "Supervisor"}
                        </div>
                        <div className="text-[12px] text-text-primary leading-relaxed">{line.text}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-4 py-2 border-t border-[var(--color-rule)]">
                <div className="flex flex-wrap gap-1 mb-2">
                  {SUGGESTIONS.slice(0, 2).map((s) => (
                    <button
                      key={s}
                      className="text-[10px] px-2 py-1 bg-[#10162a] text-text-secondary hover:text-text-primary border border-[var(--color-border-soft)] clip-hex-frame-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Ask the team…"
                    className="flex-1 bg-[#070a14] border border-[var(--color-border-soft)] px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[var(--color-gold-rim)] clip-hex-frame-sm"
                  />
                  <button className="w-9 h-9 flex items-center justify-center clip-hex-frame-sm bg-[#1b2238] hover:bg-[#26304a] text-[var(--color-gold-rim)]">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Kept for back-compat — the standalone bottom-anchored portal was removed
 *  in favour of the header-mounted UnifiedPortalButton. */
export function UnifiedPortal() {
  return null;
}
