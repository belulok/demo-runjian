"use client";

import { create } from "zustand";
import { SEED_ALARMS, type Alarm } from "@/lib/mock/alarms";

type AlertState = {
  alarms: Alarm[];
  addAlarm: (a: Alarm) => void;
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
  selectedAlarmId: string | null;
  selectAlarm: (id: string | null) => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  alarms: SEED_ALARMS,
  selectedAlarmId: null,

  addAlarm: (a) => set((s) => ({ alarms: [a, ...s.alarms].slice(0, 60) })),
  acknowledge: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a)),
    })),
  resolve: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, status: "resolved" } : a)),
    })),
  selectAlarm: (id) => set({ selectedAlarmId: id }),
}));
