"use client";

import { create } from "zustand";
import { PRIMARY_DEVICES } from "@/lib/mock/devices";
import { PRIMARY_PLANT_ID } from "@/lib/mock/plants";
import type { DeviceState } from "@/lib/mock/devices";

/** Camera target in world (x, z) coords. `bump` is a per-call nonce so
 *  consumers can react via useEffect even when the coords haven't changed. */
export type CameraTarget = { x: number; z: number; bump: number };

/** Live camera viewport, in world coords. `radius` is an approximate
 *  half-extent of what the camera is currently looking at. */
export type CameraView = { x: number; z: number; radius: number };

type WorldState = {
  activePlantId: string;
  selectedDeviceId: string | null;
  hoveredDeviceId: string | null;
  deviceStates: Record<string, DeviceState>;
  zoom: number;
  pan: { x: number; y: number };
  /** Imperative command — Scene3D pans to this world (x, z) and the Minimap
   *  uses it as a target indicator. */
  cameraTarget: CameraTarget | null;
  /** Live camera viewport in world coords — pushed from Scene3D each time
   *  OrbitControls moves. */
  cameraView: CameraView | null;

  setActivePlant: (id: string) => void;
  selectDevice: (id: string | null) => void;
  hoverDevice: (id: string | null) => void;
  setDeviceState: (id: string, state: DeviceState) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  /** Pan the camera to the given world (x, z). */
  panToWorld: (x: number, z: number) => void;
  clearCameraTarget: () => void;
  setCameraView: (v: CameraView | null) => void;
};

const initialDeviceStates: Record<string, DeviceState> = Object.fromEntries(
  PRIMARY_DEVICES.map((d) => [d.id, d.state]),
);

export const useWorldStore = create<WorldState>((set) => ({
  activePlantId: PRIMARY_PLANT_ID,
  selectedDeviceId: null,
  hoveredDeviceId: null,
  deviceStates: initialDeviceStates,
  zoom: 1,
  pan: { x: 0, y: 0 },
  cameraTarget: null,
  cameraView: null,

  setActivePlant: (id) =>
    set({
      activePlantId: id,
      selectedDeviceId: null,
      cameraTarget: null,
      cameraView: null,
    }),
  selectDevice: (id) => set({ selectedDeviceId: id }),
  hoverDevice: (id) => set({ hoveredDeviceId: id }),
  setDeviceState: (id, state) =>
    set((s) => ({ deviceStates: { ...s.deviceStates, [id]: state } })),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2.5, zoom)) }),
  setPan: (pan) => set({ pan }),
  panToWorld: (x, z) => set({ cameraTarget: { x, z, bump: Date.now() } }),
  clearCameraTarget: () => set({ cameraTarget: null }),
  setCameraView: (v) => set({ cameraView: v }),
}));
