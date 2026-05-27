import { PLANTS, PRIMARY_PLANT_ID } from "./plants";

export type DeviceType = "panel_array" | "inverter" | "meter" | "weather" | "combiner" | "transformer" | "tower";
export type DeviceState = "healthy" | "degraded" | "faulted" | "offline";

export type Device = {
  id: string;
  plantId: string;
  type: DeviceType;
  name: string;
  sn: string;
  protocol: "Modbus" | "IoT";
  ratedPowerW: number;
  state: DeviceState;
  /** Isometric grid coordinates (only set for primary plant). */
  layout?: { row: number; col: number; w?: number; h?: number };
};

/**
 * Johor plant layout — 14 devices placed on a 16×12 isometric grid.
 * The grid is rendered roughly centered around (col=8, row=6).
 *
 *  Grid uses (col, row) where col increases right-down-east in iso space
 *  and row increases right-down-west. Each panel array is 4 tiles wide.
 */
const JOHOR: Device[] = [
  // 8 panel array rows arranged in two blocks
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `DEV-JHR-PNL-${(i + 1).toString().padStart(2, "0")}`,
    plantId: PRIMARY_PLANT_ID,
    type: "panel_array" as const,
    name: `Panel Array A${i + 1}`,
    sn: `PA-A${i + 1}-2024`,
    protocol: "Modbus" as const,
    ratedPowerW: 145000,
    state: "healthy" as const,
    layout: { row: 2 + i * 2, col: 1, w: 5, h: 1 },
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `DEV-JHR-PNL-${(i + 5).toString().padStart(2, "0")}`,
    plantId: PRIMARY_PLANT_ID,
    type: "panel_array" as const,
    name: `Panel Array B${i + 1}`,
    sn: `PA-B${i + 1}-2024`,
    protocol: "Modbus" as const,
    ratedPowerW: 145000,
    state: "healthy" as const,
    layout: { row: 2 + i * 2, col: 8, w: 5, h: 1 },
  })),

  // 2 inverter stations between the two panel blocks
  {
    id: "DEV-JHR-INV-01",
    plantId: PRIMARY_PLANT_ID,
    type: "inverter",
    name: "Inverter COM1-5",
    sn: "ES2470048574",
    protocol: "Modbus",
    ratedPowerW: 580000,
    state: "healthy",
    layout: { row: 4, col: 6, w: 1, h: 1 },
  },
  {
    id: "DEV-JHR-INV-02",
    plantId: PRIMARY_PLANT_ID,
    type: "inverter",
    name: "Inverter COM2-5",
    sn: "ES2470048575",
    protocol: "Modbus",
    ratedPowerW: 580000,
    state: "healthy",
    layout: { row: 6, col: 6, w: 1, h: 1 },
  },

  // Monitoring tower
  {
    id: "DEV-JHR-MET-01",
    plantId: PRIMARY_PLANT_ID,
    type: "tower",
    name: "Meteorological Tower",
    sn: "MET-JHR-01",
    protocol: "IoT",
    ratedPowerW: 0,
    state: "healthy",
    layout: { row: 10, col: 7, w: 1, h: 1 },
  },

  // Transformer + meter
  {
    id: "DEV-JHR-TRA-01",
    plantId: PRIMARY_PLANT_ID,
    type: "transformer",
    name: "Transformer T1",
    sn: "TRA-JHR-01",
    protocol: "Modbus",
    ratedPowerW: 1200000,
    state: "healthy",
    layout: { row: 0, col: 6, w: 1, h: 1 },
  },
  {
    id: "DEV-JHR-MTR-01",
    plantId: PRIMARY_PLANT_ID,
    type: "meter",
    name: "Grid Meter G1",
    sn: "MTR-JHR-01",
    protocol: "Modbus",
    ratedPowerW: 0,
    state: "healthy",
    layout: { row: 1, col: 6, w: 1, h: 1 },
  },
];

/**
 * The other 4 plants each contribute ~13 devices to get total ~66.
 * Only Johor has layout coords; others are listed but not drawn.
 */
function bulkDevices(plantId: string, prefix: string, count: number, startSn: number): Device[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `DEV-${prefix}-INV-${(i + 1).toString().padStart(2, "0")}`,
    plantId,
    type: "inverter" as const,
    name: `Inverter ${prefix}-${i + 1}`,
    sn: `ES${startSn + i}`,
    protocol: "Modbus" as const,
    ratedPowerW: 116000 + Math.floor(Math.random() * 80000),
    state: "healthy" as const,
  }));
}

export const DEVICES: Device[] = [
  ...JOHOR,
  ...bulkDevices("PNG", "PNG", 18, 2470050000),
  ...bulkDevices("KDH", "KDH", 6, 2470060000),
  ...bulkDevices("PRK", "PRK", 18, 2470070000),
  ...bulkDevices("MLK", "MLK", 9, 2470080000),
];

export const PRIMARY_DEVICES = DEVICES.filter((d) => d.plantId === PRIMARY_PLANT_ID);

export const DEVICE_BY_ID: Record<string, Device> = Object.fromEntries(DEVICES.map((d) => [d.id, d]));

/** Aggregate counts for the platform header chip. */
export const PLATFORM_COUNTS = {
  plants: PLANTS.length,
  devices: DEVICES.length,
};
