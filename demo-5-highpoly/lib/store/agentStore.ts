"use client";

import { create } from "zustand";
import { AGENTS, type AgentId, type AgentStatus } from "@/lib/mock/agents";

type AgentState = {
  statuses: Record<AgentId, AgentStatus>;
  pulse: (id: AgentId, status: AgentStatus, durationMs?: number) => void;
  set: (id: AgentId, status: AgentStatus) => void;
};

const initialStatuses = Object.fromEntries(AGENTS.map((a) => [a.id, "idle"])) as Record<
  AgentId,
  AgentStatus
>;

export const useAgentStore = create<AgentState>((set) => ({
  statuses: initialStatuses,
  set: (id, status) =>
    set((s) => ({ statuses: { ...s.statuses, [id]: status } })),
  pulse: (id, status, durationMs = 1800) => {
    set((s) => ({ statuses: { ...s.statuses, [id]: status } }));
    setTimeout(() => {
      set((s) => ({ statuses: { ...s.statuses, [id]: "idle" } }));
    }, durationMs);
  },
}));
