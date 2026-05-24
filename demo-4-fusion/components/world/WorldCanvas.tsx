"use client";

import { useWorldStore } from "@/lib/store/worldStore";
import { STATION_BY_PLANT_ID, type Station } from "@/lib/mock/stations";
import { WorldScene } from "./WorldScene";

/**
 * Single unified SimCity-style world. Per-sector scene dispatch was removed —
 * every plant now lives as a station inside this one world. activePlantId
 * is still used to highlight which station is the "active" one (driven from
 * the SectorPicker), but the scene itself does not change.
 *
 * Station click → selectStation(stationId) → StationTeamBrief slides up.
 */
export function WorldCanvas() {
  const activePlantId = useWorldStore((s) => s.activePlantId);
  const selectedStationId = useWorldStore((s) => s.selectedStationId);
  const selectStation = useWorldStore((s) => s.selectStation);

  const activeStation = STATION_BY_PLANT_ID[activePlantId] ?? null;

  const handleSelect = (station: Station) => {
    selectStation(station.id);
  };

  return (
    <div className="absolute inset-0 world-3d-host">
      <WorldScene
        selectedStationId={selectedStationId}
        activeStationId={activeStation?.id ?? null}
        onSelectStation={handleSelect}
      />
    </div>
  );
}
