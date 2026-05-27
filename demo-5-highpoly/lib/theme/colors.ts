import type { AgentId } from "@/lib/mock/agents";

export const AGENT_COLORS: Record<AgentId, { hex: string; cssVar: string; glow: string }> = {
  alarm: { hex: "#dc2626", cssVar: "var(--color-agent-alarm)", glow: "rgba(220, 38, 38, 0.35)" },
  diagnosis: { hex: "#2563eb", cssVar: "var(--color-agent-diagnosis)", glow: "rgba(37, 99, 235, 0.35)" },
  warning: { hex: "#f59e0b", cssVar: "var(--color-agent-warning)", glow: "rgba(245, 158, 11, 0.35)" },
  pv_assistant: { hex: "#a855f7", cssVar: "var(--color-agent-pv)", glow: "rgba(168, 85, 247, 0.35)" },
  scheduling: { hex: "#14b8a6", cssVar: "var(--color-agent-scheduling)", glow: "rgba(20, 184, 166, 0.35)" },
  inspection: { hex: "#22c55e", cssVar: "var(--color-agent-inspection)", glow: "rgba(34, 197, 94, 0.35)" },
  ticket: { hex: "#d946ef", cssVar: "var(--color-agent-ticket)", glow: "rgba(217, 70, 239, 0.35)" },
  data_qa: { hex: "#3b82f6", cssVar: "var(--color-agent-dataqa)", glow: "rgba(59, 130, 246, 0.35)" },
  operation: { hex: "#eab308", cssVar: "var(--color-agent-operation)", glow: "rgba(234, 179, 8, 0.35)" },
  safety: { hex: "#ef4444", cssVar: "var(--color-agent-safety)", glow: "rgba(239, 68, 68, 0.35)" },
};

export const STATE_COLORS = {
  healthy: { hex: "#34d399", label: "OK" },
  degraded: { hex: "#f59e0b", label: "DEGRADED" },
  faulted: { hex: "#ef4444", label: "FAULTED" },
  offline: { hex: "#6b7280", label: "OFFLINE" },
} as const;

export const SEVERITY_COLORS = {
  critical: "#ef4444",
  major: "#f59e0b",
  minor: "#3b82f6",
  info: "#9aa6bf",
} as const;
