"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { ChevronUp, ChevronDown, GripVertical, X } from "lucide-react";
import { useAlertStore } from "@/lib/store/alertStore";
import { useWorldStore } from "@/lib/store/worldStore";
import { Panel } from "@/components/primitives/Panel";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DEVICE_BY_ID } from "@/lib/mock/devices";
import { AGENT_BY_ID } from "@/lib/mock/agents";
import { AGENT_COLORS, SEVERITY_COLORS } from "@/lib/theme/colors";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 9;
const STORAGE_POS = "irun.alertfeed.pos.v1";
const STORAGE_COLLAPSED = "irun.alertfeed.collapsed.v1";

const DEFAULT_POS = { x: 0, y: 0 };
// Panel size — used for drag-constraint bounds
const PANEL_W = 288;
const EXPANDED_H = 360;
const COLLAPSED_H = 44;
// HUD chrome: header is 56px tall, bottom HUD lives ~192px above the bottom edge
const TOP_BOUND = 64;
const BOTTOM_BOUND_GAP = 196;

export function AlertFeed() {
  const allAlarms = useAlertStore((s) => s.alarms);
  const alarms = allAlarms.slice(0, MAX_VISIBLE);
  const openCount = allAlarms.filter((a) => a.status === "open").length;
  const selectAlarm = useAlertStore((s) => s.selectAlarm);
  const selectDevice = useWorldStore((s) => s.selectDevice);

  // Persisted state
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Restore persisted position + collapsed on mount
  useEffect(() => {
    try {
      const rawPos = window.localStorage.getItem(STORAGE_POS);
      if (rawPos) {
        const parsed = JSON.parse(rawPos) as { x: number; y: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          x.set(parsed.x);
          y.set(parsed.y);
        }
      }
      const rawC = window.localStorage.getItem(STORAGE_COLLAPSED);
      if (rawC === "1") setCollapsed(true);
    } catch { /* */ }
  }, [x, y]);

  const handleDragEnd = () => {
    try {
      window.localStorage.setItem(
        STORAGE_POS,
        JSON.stringify({ x: x.get(), y: y.get() }),
      );
    } catch { /* */ }
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(STORAGE_COLLAPSED, next ? "1" : "0");
      } catch { /* */ }
      return next;
    });
  };

  const resetPos = () => {
    x.set(0);
    y.set(0);
    try {
      window.localStorage.removeItem(STORAGE_POS);
    } catch { /* */ }
  };

  // Drag bounds (computed once based on viewport)
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const baseLeft = 12; // matches `left-3`
      const baseTop = 64; // matches `top-16`
      const panelH = collapsed ? COLLAPSED_H : EXPANDED_H;
      setBounds({
        left: -baseLeft + 4,
        right: vw - baseLeft - PANEL_W - 4,
        top: TOP_BOUND - baseTop,
        bottom: vh - baseTop - panelH - BOTTOM_BOUND_GAP,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [collapsed]);

  if (hidden) return null;

  return (
    <motion.aside
      drag
      dragMomentum={false}
      dragElastic={0.04}
      dragConstraints={bounds}
      onDragEnd={handleDragEnd}
      style={{ x, y }}
      animate={{ width: PANEL_W, height: collapsed ? COLLAPSED_H : EXPANDED_H }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute left-3 top-16 z-20 pointer-events-auto"
    >
      <Panel
        className="h-full"
        accentColor="var(--color-agent-alarm)"
        glowColor="rgba(220, 38, 38, 0.2)"
        ribSide="top"
      >
        <div className="flex flex-col h-full">
          {/* Drag handle / header */}
          <div
            onPointerDown={(e) => e.stopPropagation()} // doesn't prevent drag because motion uses pointermove on parent
            className="flex items-center justify-between px-2.5 py-1.5 cursor-grab active:cursor-grabbing select-none border-b border-[var(--color-rule)]"
          >
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-3 h-3 text-text-muted opacity-60" />
              <OrnateTitle size="xs" accentColor="var(--color-agent-alarm)">
                Alert Feed
              </OrnateTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className={openCount > 0 ? "text-red-400" : "text-emerald-400"}>{openCount}</span>
                <span className="text-text-muted">OPEN</span>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggleCollapsed}
                title={collapsed ? "Expand" : "Collapse"}
                className="p-0.5 text-text-muted hover:text-text-primary"
              >
                {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setHidden(true)}
                title="Hide (refresh page to restore)"
                className="p-0.5 text-text-muted hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-y-auto scrollbar-dark space-y-1 pr-0.5 px-2.5 py-2">
              <AnimatePresence initial={false}>
                {alarms.map((alarm) => {
                  const device = DEVICE_BY_ID[alarm.deviceId];
                  const agent = AGENT_BY_ID[alarm.recommendedAgent];
                  const agentColor = AGENT_COLORS[alarm.recommendedAgent];
                  const sevColor = SEVERITY_COLORS[alarm.severity];

                  return (
                    <motion.button
                      key={alarm.id}
                      layout
                      initial={{ opacity: 0, x: -12, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        selectAlarm(alarm.id);
                        selectDevice(alarm.deviceId);
                      }}
                      className={cn(
                        "w-full text-left relative px-2 py-1.5 clip-hex-frame-sm",
                        "bg-gradient-to-r from-[#10162a] to-[#0a0e1a]",
                        "ring-1 ring-inset transition-colors hover:bg-[#141a2a]",
                        alarm.status === "open"
                          ? "ring-[rgba(220,38,38,0.15)]"
                          : alarm.status === "acknowledged"
                            ? "ring-[rgba(245,158,11,0.14)] opacity-75"
                            : "ring-[rgba(148,163,184,0.08)] opacity-50",
                      )}
                      style={{ boxShadow: `inset 2px 0 0 ${sevColor}` }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-condensed font-semibold text-[11px] uppercase tracking-[0.06em] text-text-primary truncate flex-1">
                          {device?.name ?? alarm.deviceId}
                        </span>
                        <span className="font-mono text-[9px] text-text-muted flex-shrink-0">
                          {formatRelative(alarm.timestamp)}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-secondary line-clamp-1">
                        {alarm.type.replace(/_/g, " ")} · {alarm.message.split(".")[0]}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className="inline-flex items-center gap-1 px-1 py-px text-[8px] font-mono uppercase tracking-[0.14em]"
                          style={{
                            color: agentColor.hex,
                            background: `${agentColor.hex}1a`,
                          }}
                        >
                          <span>{agent.glyph}</span>
                          {agent.shortName}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Footer (collapsed only): show last alert summary */}
          {collapsed && alarms[0] && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                selectAlarm(alarms[0].id);
                selectDevice(alarms[0].deviceId);
                setCollapsed(false);
              }}
              className="px-2.5 py-1 flex items-center gap-2 text-left hover:bg-[#10162a]"
              title="Latest alert — click to inspect"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: SEVERITY_COLORS[alarms[0].severity],
                  boxShadow: `0 0 6px ${SEVERITY_COLORS[alarms[0].severity]}`,
                }}
              />
              <span className="font-condensed text-[10px] uppercase tracking-[0.12em] text-text-secondary truncate flex-1">
                {DEVICE_BY_ID[alarms[0].deviceId]?.name ?? alarms[0].deviceId} · {alarms[0].type.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-[9px] text-text-muted flex-shrink-0">
                {formatRelative(alarms[0].timestamp)}
              </span>
            </button>
          )}
        </div>
      </Panel>

      {/* Hover-only reset position handle (bottom-right corner) — small */}
      {!collapsed && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={resetPos}
          title="Reset position"
          className="absolute -bottom-2 -right-2 w-5 h-5 flex items-center justify-center bg-[#0a0e1a] ring-1 ring-inset ring-[var(--color-border-soft)] text-[9px] text-text-muted hover:text-[var(--color-gold-rim)] clip-hex-frame-sm opacity-40 hover:opacity-100 transition-opacity font-mono"
        >
          ↺
        </button>
      )}
    </motion.aside>
  );
}
