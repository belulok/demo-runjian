"use client";

import { Scene3D, type Plant } from "./Scene3D";
import { useWorldStore } from "@/lib/store/worldStore";
import { DEVICES } from "@/lib/mock/devices";
import { useState } from "react";

/** Map the 3D scene's plant ids (kedah/penang/…) to demo-2's plant ids
 *  so the existing DetailPanel / device store has a real selection. */
const PLANT_ID_MAP: Record<string, string> = {
  kedah:  "PLT-KDH-001",
  penang: "PLT-PNG-001",
  perak:  "PLT-PRK-001",
  melaka: "PLT-MLK-001",
  johor:  "PLT-JHR-001",
};

/**
 * Demo-2's world layer — now a 3D R/F scene ported from demo-3.
 * The Pixi isometric "building" map has been retired in favour of
 * the 3D-ish overhead city. All other demo-2 HUD/overlay panels
 * keep working unchanged.
 */
export function WorldCanvas() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const selectDevice = useWorldStore((s) => s.selectDevice);

  const onSelectPlant = (p: Plant | null) => {
    setSelectedPlantId(p ? p.id : null);
    if (!p) {
      selectDevice(null);
      return;
    }
    const demoPlantId = PLANT_ID_MAP[p.id];
    const match = demoPlantId
      ? DEVICES.find((d) => d.plantId === demoPlantId)
      : null;
    selectDevice(match ? match.id : null);
  };

  return (
    <div className="absolute inset-0 world-3d-host">
      <Scene3D
        selectedPlantId={selectedPlantId}
        onSelectPlant={onSelectPlant}
      />
    </div>
  );
}
