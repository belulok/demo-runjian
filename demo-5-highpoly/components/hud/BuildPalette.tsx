"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eraser, Hammer, Save, Trash2, RotateCcw, X, Upload } from "lucide-react";
import { useEffect } from "react";
import { useLayoutStore } from "@/lib/store/layoutStore";
import {
  GROUND_DEFS,
  STRUCTURE_DEFS,
  type GroundKind,
  type StructureKind,
} from "@/components/world/isometric/tileKinds";
import { Panel } from "@/components/primitives/Panel";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { cn } from "@/lib/utils";

const GROUND_ORDER: GroundKind[] = ["grass", "concrete", "asphalt", "dirt", "gravel", "sand", "water"];
const STRUCTURE_ORDER: StructureKind[] = [
  "panel_array_ns",
  "panel_array_ew",
  "inverter",
  "transformer",
  "tower",
  "comm_tower",
  "power_pylon",
  "meter",
  "combiner",
  "battery",
  "depot",
  "control_building",
  "substation",
  "warehouse",
  "skyscraper",
  "office_block",
  "apartment",
  "shop",
];
const DECOR_ORDER: StructureKind[] = ["tree", "light_pole", "bollard", "fence_h", "fence_v"];

export function BuildPalette() {
  const isBuildMode = useLayoutStore((s) => s.isBuildMode);
  const brush = useLayoutStore((s) => s.brush);
  const setBrush = useLayoutStore((s) => s.setBrush);
  const setBuildMode = useLayoutStore((s) => s.setBuildMode);
  const save = useLayoutStore((s) => s.save);
  const load = useLayoutStore((s) => s.load);
  const reset = useLayoutStore((s) => s.reset);
  const structuresCount = useLayoutStore((s) => s.layout.structures.length);

  // Try loading saved layout on first mount
  useEffect(() => {
    useLayoutStore.getState().load();
  }, []);

  // Keyboard: B toggles build mode, E for eraser, Esc to clear brush
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "b" || e.key === "B") {
        useLayoutStore.getState().toggleBuildMode();
      } else if (e.key === "e" || e.key === "E") {
        if (useLayoutStore.getState().isBuildMode) {
          useLayoutStore.getState().setBrush({ type: "erase" });
        }
      } else if (e.key === "Escape") {
        useLayoutStore.getState().setBrush(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {isBuildMode && (
        <motion.aside
          initial={{ x: -360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -360, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute left-3 top-16 w-80 h-[640px] max-h-[calc(100vh-100px)] z-30 pointer-events-auto"
        >
          <Panel
            className="h-full"
            accentColor="var(--color-gold-rim)"
            glowColor="var(--color-gold-glow)"
            ribSide="top"
          >
            <div className="flex flex-col h-full px-3 py-3 gap-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
                <div className="flex items-center gap-2">
                  <Hammer className="w-3.5 h-3.5 text-[var(--color-gold-rim)]" />
                  <OrnateTitle size="sm" accentColor="var(--color-gold-rim)">
                    Build Mode
                  </OrnateTitle>
                </div>
                <button
                  onClick={() => setBuildMode(false)}
                  className="text-text-muted hover:text-text-primary"
                  title="Exit build mode (B)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Brush summary */}
              <div className="px-2 py-1.5 bg-[#0a0f1c] clip-hex-frame-sm ring-1 ring-inset ring-[var(--color-border-soft)]">
                <div className="text-[9px] font-condensed font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Active Brush
                </div>
                <div className="font-mono text-[11px] text-text-primary mt-0.5">
                  {brushLabel(brush)}
                </div>
                <div className="text-[9px] text-text-muted mt-0.5">
                  Click empty tile to place · Eraser removes
                </div>
              </div>

              {/* Tools */}
              <div className="flex gap-1.5">
                <BrushButton
                  active={brush?.type === "erase"}
                  onClick={() => setBrush({ type: "erase" })}
                  swatch="#ef4444"
                  label="Erase"
                  hotkey="E"
                  icon={<Eraser className="w-3 h-3" />}
                />
                <BrushButton
                  active={brush === null}
                  onClick={() => setBrush(null)}
                  swatch="#5b6680"
                  label="None"
                  hotkey="Esc"
                />
              </div>

              {/* Palette categories */}
              <div className="flex-1 overflow-y-auto scrollbar-dark pr-1 space-y-3">
                <Category title="Ground">
                  <div className="grid grid-cols-4 gap-1.5">
                    {GROUND_ORDER.map((k) => {
                      const def = GROUND_DEFS[k];
                      const active = brush?.type === "ground" && brush.kind === k;
                      return (
                        <BrushTile
                          key={k}
                          swatch={def.swatch}
                          label={def.label}
                          active={active}
                          onClick={() => setBrush({ type: "ground", kind: k })}
                        />
                      );
                    })}
                  </div>
                </Category>

                <Category title="Structure">
                  <div className="grid grid-cols-3 gap-1.5">
                    {STRUCTURE_ORDER.map((k) => {
                      const def = STRUCTURE_DEFS[k];
                      const active = brush?.type === "structure" && brush.kind === k;
                      return (
                        <BrushTile
                          key={k}
                          swatch={def.swatch}
                          label={def.label}
                          footprint={`${def.footprint.w}×${def.footprint.h}`}
                          active={active}
                          onClick={() => setBrush({ type: "structure", kind: k })}
                        />
                      );
                    })}
                  </div>
                </Category>

                <Category title="Decoration">
                  <div className="grid grid-cols-3 gap-1.5">
                    {DECOR_ORDER.map((k) => {
                      const def = STRUCTURE_DEFS[k];
                      const active = brush?.type === "structure" && brush.kind === k;
                      return (
                        <BrushTile
                          key={k}
                          swatch={def.swatch}
                          label={def.label}
                          active={active}
                          onClick={() => setBrush({ type: "structure", kind: k })}
                        />
                      );
                    })}
                  </div>
                </Category>
              </div>

              {/* Persistence */}
              <div className="pt-2 border-t border-[var(--color-rule)] space-y-2">
                <div className="font-mono text-[10px] text-text-muted">
                  {structuresCount} structures placed
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <FooterButton onClick={save} icon={<Save className="w-3 h-3" />} label="Save" />
                  <FooterButton onClick={() => load()} icon={<Upload className="w-3 h-3" />} label="Load" />
                  <FooterButton
                    onClick={() => {
                      if (confirm("Reset layout to default? Your saved changes will be lost.")) {
                        reset();
                      }
                    }}
                    icon={<RotateCcw className="w-3 h-3" />}
                    label="Reset"
                    danger
                  />
                </div>
              </div>
            </div>
          </Panel>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function brushLabel(brush: ReturnType<typeof useLayoutStore.getState>["brush"]): string {
  if (!brush) return "None — drag/zoom only";
  if (brush.type === "erase") return "Eraser — click structure to delete";
  if (brush.type === "ground") return `Ground · ${GROUND_DEFS[brush.kind].label}`;
  return `Structure · ${STRUCTURE_DEFS[brush.kind].label}`;
}

function Category({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <OrnateTitle size="xs" className="mb-2">
        {title}
      </OrnateTitle>
      {children}
    </div>
  );
}

function BrushButton({
  active,
  swatch,
  label,
  hotkey,
  icon,
  onClick,
}: {
  active: boolean;
  swatch: string;
  label: string;
  hotkey?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 clip-hex-frame-sm transition-colors",
        active ? "bg-[#1b2238]" : "bg-[#10162a] hover:bg-[#141a2a]",
      )}
      style={{ boxShadow: active ? `inset 2px 0 0 ${swatch}` : undefined }}
    >
      {icon}
      <span className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-primary">
        {label}
      </span>
      {hotkey && (
        <span className="font-mono text-[8px] text-text-muted bg-black/30 px-1 rounded-sm">{hotkey}</span>
      )}
    </button>
  );
}

function BrushTile({
  swatch,
  label,
  footprint,
  active,
  onClick,
}: {
  swatch: string;
  label: string;
  footprint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-1.5 py-2 clip-hex-frame-sm transition-all text-left",
        active ? "bg-[#1b2238] ring-1 ring-[var(--color-gold-rim)]" : "bg-[#0a0f1c] hover:bg-[#10162a] ring-1 ring-inset ring-[var(--color-border-soft)]",
      )}
      style={{ boxShadow: active ? `0 0 12px var(--color-gold-glow)` : undefined }}
      title={label}
    >
      <div
        className="w-9 h-6 clip-hex-frame-sm ring-1 ring-inset ring-black/40 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${swatch} 0%, ${shade(swatch, -28)} 100%)` }}
      >
        {footprint && (
          <span className="font-mono text-[8px] text-white/85 tracking-tight">{footprint}</span>
        )}
      </div>
      <span className="font-condensed text-[9px] uppercase tracking-[0.14em] text-text-secondary leading-tight text-center">
        {label}
      </span>
    </button>
  );
}

function FooterButton({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 px-2 py-1.5 clip-hex-frame-sm transition-colors",
        danger
          ? "bg-[#1a0e10] hover:bg-[#2a1518] text-red-300 ring-1 ring-inset ring-red-900/40"
          : "bg-[#10162a] hover:bg-[#141a2a] text-text-secondary",
      )}
    >
      {icon}
      <span className="font-condensed text-[10px] uppercase tracking-[0.16em]">{label}</span>
    </button>
  );
}

function shade(hex: string, amount: number): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
