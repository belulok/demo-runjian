"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  accentColor?: string;
  glowColor?: string;
  glow?: boolean;
  ribSide?: "left" | "top" | "none";
  size?: "sm" | "md";
  children?: ReactNode;
};

/**
 * Dota-HUD style angular panel — hex-cut corners, agent-color rib accent,
 * subtle inner stroke, dark surface gradient.
 */
export function Panel({
  accentColor,
  glowColor,
  glow = false,
  ribSide = "left",
  size = "md",
  className,
  style,
  children,
  ...rest
}: PanelProps) {
  const cssVars: CSSProperties = {
    ...(accentColor ? { ["--rib" as never]: accentColor } : {}),
    ...(glowColor ? { ["--rib-glow" as never]: glowColor } : {}),
    ...style,
  };

  return (
    <div className={cn("relative", className)} style={cssVars} {...rest}>
      {/* Outer chrome (clip-path frame) */}
      <div
        className={cn(
          "absolute inset-0",
          size === "sm" ? "clip-hex-frame-sm" : "clip-hex-frame",
          "bg-gradient-to-b from-[#141a2a] to-[#0a0e1a]",
          "ring-1 ring-inset ring-[rgba(148,163,184,0.12)]",
          glow && "glow-accent",
        )}
      />
      {/* Inner border tint */}
      <div
        className={cn(
          "absolute inset-px",
          size === "sm" ? "clip-hex-frame-sm" : "clip-hex-frame",
          "bg-gradient-to-b from-[#0f1424] to-[#0a0e1a]",
        )}
      />
      {/* Rib accent */}
      {ribSide === "left" && accentColor && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[2px] z-10"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${accentColor} 30%, ${accentColor} 70%, transparent 100%)`,
            boxShadow: glowColor ? `0 0 10px ${glowColor}` : undefined,
          }}
        />
      )}
      {ribSide === "top" && accentColor && (
        <div
          className="absolute top-0 left-3 right-3 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 30%, ${accentColor} 70%, transparent 100%)`,
            boxShadow: glowColor ? `0 0 10px ${glowColor}` : undefined,
          }}
        />
      )}
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
}
