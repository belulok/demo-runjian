"use client";

import { create } from "zustand";
import type { AgentId } from "@/lib/mock/agents";
import { useWorldStore } from "./worldStore";

export type CommandSheetId =
  | "overview"
  | "alarms"
  | "tickets"
  | "analytics"
  | "map"
  | "comms"
  | "safety"
  | "search";

type CommandState = {
  activeSheet: CommandSheetId | null;
  activeAgent: AgentId | null;
  open: (id: CommandSheetId) => void;
  openAgent: (id: AgentId) => void;
  close: () => void;
  toggle: (id: CommandSheetId) => void;
  toggleAgent: (id: AgentId) => void;
};

/** Helper — opening a sheet/agent closes any open station brief, since they
 *  share the same bottom-3 slot now. */
function clearStation() {
  useWorldStore.getState().selectStation(null);
}

export const useCommandStore = create<CommandState>((set, get) => ({
  // Default to Overview so the bottom command panel is visible from the start.
  activeSheet: "overview",
  activeAgent: null,

  open: (id) => {
    clearStation();
    set({ activeSheet: id, activeAgent: null });
  },
  openAgent: (id) => {
    clearStation();
    set({ activeAgent: id, activeSheet: null });
  },
  close: () => set({ activeSheet: null, activeAgent: null }),

  toggle: (id) => {
    const opening = get().activeSheet !== id;
    if (opening) clearStation();
    set({
      activeSheet: opening ? id : null,
      activeAgent: null,
    });
  },
  toggleAgent: (id) => {
    const opening = get().activeAgent !== id;
    if (opening) clearStation();
    set({
      activeAgent: opening ? id : null,
      activeSheet: null,
    });
  },
}));
