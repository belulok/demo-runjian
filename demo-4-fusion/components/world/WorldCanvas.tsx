"use client";

import { useEffect, useState } from "react";
import { useWorldStore } from "@/lib/store/worldStore";
import { PRIMARY_PLANT_ID } from "@/lib/mock/plants";
import { PLANT_POIS, PV_PARAMS, type ScenePOI } from "@/lib/mock/scenePOIs";
import { STATION_BY_PLANT_ID } from "@/lib/mock/stations";
import { Scene3D } from "./Scene3D";
import { PVPlantScene } from "./PVPlantScene";

/**
 * Per-sector scene dispatcher.
 *
 * Johor (PRIMARY_PLANT_ID) → Sohar Scene3D (the existing hand-modelled scene).
 * All other sectors → procedural PVPlantScene parameterised from PV_PARAMS.
 *
 * Clicking a POI no longer opens the right-side DetailPanel — it surfaces the
 * in-scene popover card (rendered inside the scene component) and just tracks
 * which POI is open locally.
 */
export function WorldCanvas() {
  const activePlantId = useWorldStore((s) => s.activePlantId);
  const selectStation = useWorldStore((s) => s.selectStation);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);

  const pois: ScenePOI[] = PLANT_POIS[activePlantId] ?? [];

  const handleSelect = (poi: ScenePOI | null) => {
    setSelectedPoiId(poi?.id ?? null);
    // POI click → also open the station team brief for the active plant's
    // station. Each plant maps to exactly one station.
    if (poi) {
      const station = STATION_BY_PLANT_ID[activePlantId];
      if (station) selectStation(station.id);
    }
  };

  // Reset POI popover whenever the active plant changes.
  useEffect(() => {
    setSelectedPoiId(null);
  }, [activePlantId]);

  return (
    <div className="absolute inset-0 world-3d-host">
      {activePlantId === PRIMARY_PLANT_ID ? (
        <Scene3D
          pois={pois}
          selectedPoiId={selectedPoiId}
          onSelectPoi={handleSelect}
        />
      ) : (
        <PVPlantScene
          key={activePlantId}
          params={PV_PARAMS[activePlantId]}
          pois={pois}
          selectedPoiId={selectedPoiId}
          onSelectPoi={handleSelect}
        />
      )}
    </div>
  );
}
