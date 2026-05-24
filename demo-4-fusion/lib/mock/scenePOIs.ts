/**
 * Per-sector scene metadata: each plant's POI list + a top-down facility
 * table the Minimap uses to render the active scene's silhouette.
 *
 * POIs are NOT pinned to building centers — they are free-floating world
 * coordinates per plant. When the active sector changes, only that plant's
 * POIs are shown in the 3D world.
 */

export type POIStatus = "normal" | "critical" | "offline";

export type ScenePOI = {
  id: string;
  plantId: string;
  name: string;
  role: string;
  /** World (x, y, z) — y is the floating height of the pin marker. */
  pos: [number, number, number];
  status: POIStatus;
  capacity?: string;
  power?: string;
  health?: number;
  /** Optional device id for cross-linking to the alarm / device system. */
  deviceId?: string;
};

/** Facility footprints used by the Minimap top-down rendering. */
export type SceneFacility = {
  name: string;
  /** Top-down (x, z) centre. */
  pos: [number, number];
  /** Width along x, depth along z. */
  size: [number, number];
  kind: "building" | "tank" | "yard" | "tower" | "gate" | "pad" | "array";
};

export type SceneMeta = {
  facilities: SceneFacility[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

// ────────────────────────────────────────────────────────────────────────
// Sohar plant (Johor) — facility footprints extracted from Scene3D.tsx
// ────────────────────────────────────────────────────────────────────────

export const SOHAR_FACILITIES: SceneFacility[] = [
  // Row 0 (z=-65)
  { name: "Parking",            pos: [-102.5, -65],   size: [17.4, 16.2], kind: "pad"      },
  { name: "GIS Building",       pos: [-50,    -65],   size: [40, 22],     kind: "building" },
  { name: "Demin Water Plant",  pos: [0,      -65],   size: [28, 20],     kind: "building" },
  { name: "Fuel Oil Small",     pos: [52.5,   -65],   size: [20, 16],     kind: "tank"     },
  { name: "Raw Water Tank N",   pos: [105,    -65],   size: [22, 22],     kind: "tank"     },
  // Row 1 (z=-27.5)
  { name: "HRSG",               pos: [-102.5, -27.5], size: [24, 26],     kind: "building" },
  { name: "Gas Turbine Area",   pos: [-50,    -27.5], size: [26, 14],     kind: "yard"     },
  { name: "Cooling Towers",     pos: [0,      -27.5], size: [34, 24],     kind: "tower"    },
  { name: "Condenser Fans",     pos: [52.5,   -27.5], size: [28, 24],     kind: "building" },
  { name: "Raw Water Tank C",   pos: [105,    -27.5], size: [22, 22],     kind: "tank"     },
  // Row 2 (z=10)
  { name: "Workshop",           pos: [-102.5, 10],    size: [22, 18],     kind: "building" },
  { name: "Steam Turbine",      pos: [-50,    10],    size: [36, 26],     kind: "building" },
  { name: "Circulating Pumps",  pos: [0,      10],    size: [14, 10],     kind: "yard"     },
  { name: "Switchyard",         pos: [52.5,   10],    size: [38, 26],     kind: "yard"     },
  { name: "Aux Building",       pos: [92,     10],    size: [18, 18],     kind: "building" },
  { name: "Condenser Triple",   pos: [115,    10],    size: [18, 16],     kind: "building" },
  // Row 3 (z=57.5)
  { name: "Admin",              pos: [-102.5, 57.5],  size: [22, 26],     kind: "building" },
  { name: "Solid Waste",        pos: [-50,    57.5],  size: [20, 14],     kind: "yard"     },
  { name: "Warehouse",          pos: [0,      57.5],  size: [32, 18],     kind: "building" },
  { name: "Wastewater",         pos: [52.5,   57.5],  size: [32, 22],     kind: "yard"     },
  { name: "Fuel Oil Large",     pos: [105,    50],    size: [30, 20],     kind: "tank"     },
  { name: "Raw Water Tank S",   pos: [105,    72],    size: [22, 22],     kind: "tank"     },
  // Misc
  { name: "Gas Pipeline",       pos: [0,      -90],   size: [4, 4],       kind: "gate"     },
  { name: "Main Gate",          pos: [-5,     92],    size: [8, 5],       kind: "gate"     },
];

const SOHAR_BOUNDS = { minX: -137, maxX: 137, minZ: -92.5, maxZ: 92.5 };

// ────────────────────────────────────────────────────────────────────────
// Procedural PV plant — parameterised per non-Johor sector
// ────────────────────────────────────────────────────────────────────────

export type PVPlantParams = {
  /** Half-width of the site pad along x. */
  halfW: number;
  /** Half-depth of the site pad along z. */
  halfD: number;
  /** Panel rows count. */
  rows: number;
  /** Panel columns count. */
  cols: number;
  /** "NS" → arrays run along z; "EW" → arrays run along x. */
  orientation: "NS" | "EW";
  /** Spacing between array rows. */
  rowPitch: number;
  /** Spacing between arrays inside a row. */
  colPitch: number;
  /** Optional features. */
  features: {
    battery?: boolean;
    warehouse?: boolean;
    substation?: boolean;
    coastal?: boolean;
  };
  /** Ground tint (base pad colour). */
  groundColor: string;
  /** Boundary tree leaf colour. */
  foliageColor: string;
  /** Sky / ambient tint. */
  ambientColor: string;
};

export const PV_PARAMS: Record<string, PVPlantParams> = {
  "PLT-PNG-001": {
    halfW: 130, halfD: 90,
    rows: 6, cols: 12, orientation: "NS", rowPitch: 22, colPitch: 16,
    features: { battery: true, warehouse: true, substation: true, coastal: true },
    groundColor: "#e6e9d8",
    foliageColor: "#3d7a4b",
    ambientColor: "#dbe5ee",
  },
  "PLT-KDH-001": {
    halfW: 60, halfD: 50,
    rows: 4, cols: 5, orientation: "EW", rowPitch: 18, colPitch: 18,
    features: { battery: false, warehouse: false, substation: false, coastal: false },
    groundColor: "#e3dcc1",
    foliageColor: "#4a8b5a",
    ambientColor: "#e2ebe9",
  },
  "PLT-PRK-001": {
    halfW: 135, halfD: 95,
    rows: 7, cols: 14, orientation: "EW", rowPitch: 18, colPitch: 14,
    features: { battery: true, warehouse: true, substation: true, coastal: false },
    groundColor: "#d8d2b8",
    foliageColor: "#4a8a5e",
    ambientColor: "#e0e6eb",
  },
  "PLT-MLK-001": {
    halfW: 75, halfD: 55,
    rows: 5, cols: 6, orientation: "NS", rowPitch: 18, colPitch: 18,
    features: { battery: false, warehouse: true, substation: true, coastal: true },
    groundColor: "#e9e3c8",
    foliageColor: "#3f8a55",
    ambientColor: "#dfe7ea",
  },
};

function pvFacilities(plantId: string): SceneFacility[] {
  const p = PV_PARAMS[plantId];
  if (!p) return [];
  const out: SceneFacility[] = [];

  // Panel arrays
  const totalW = p.cols * p.colPitch;
  const totalD = p.rows * p.rowPitch;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const x = -totalW / 2 + c * p.colPitch + p.colPitch / 2;
      const z = -totalD / 2 + r * p.rowPitch + p.rowPitch / 2;
      const w = p.orientation === "NS" ? p.colPitch * 0.75 : p.colPitch * 0.55;
      const d = p.orientation === "NS" ? p.rowPitch * 0.45 : p.rowPitch * 0.75;
      out.push({ name: `PV ${r}-${c}`, pos: [x, z], size: [w, d], kind: "array" });
    }
  }

  // Admin block
  out.push({ name: "Admin", pos: [-p.halfW + 18, p.halfD - 16], size: [16, 12], kind: "building" });
  // Inverter row along the south edge
  for (let i = 0; i < Math.min(p.cols, 6); i++) {
    out.push({
      name: `Inverter ${i + 1}`,
      pos: [-totalW / 2 + (i + 0.5) * (totalW / Math.min(p.cols, 6)), totalD / 2 + 9],
      size: [6, 4], kind: "building",
    });
  }
  // Substation
  if (p.features.substation) {
    out.push({ name: "Substation", pos: [p.halfW - 22, p.halfD - 20], size: [18, 14], kind: "yard" });
  }
  // Battery
  if (p.features.battery) {
    out.push({ name: "Battery Bank", pos: [p.halfW - 18, -p.halfD + 16], size: [14, 8], kind: "tank" });
  }
  // Warehouse
  if (p.features.warehouse) {
    out.push({ name: "Warehouse", pos: [-p.halfW + 22, -p.halfD + 14], size: [20, 12], kind: "building" });
  }
  // Met tower (single tower marker)
  out.push({ name: "Met Tower", pos: [-p.halfW + 12, 0], size: [3, 3], kind: "tower" });
  // Main gate (south edge)
  out.push({ name: "Main Gate", pos: [0, p.halfD - 4], size: [10, 6], kind: "gate" });

  return out;
}

const PV_BOUNDS_FACTOR = 1.04;

export function getSceneMeta(plantId: string): SceneMeta {
  if (plantId === "PLT-JHR-001") {
    return { facilities: SOHAR_FACILITIES, bounds: SOHAR_BOUNDS };
  }
  const p = PV_PARAMS[plantId];
  if (!p) return { facilities: SOHAR_FACILITIES, bounds: SOHAR_BOUNDS };
  return {
    facilities: pvFacilities(plantId),
    bounds: {
      minX: -p.halfW * PV_BOUNDS_FACTOR,
      maxX: p.halfW * PV_BOUNDS_FACTOR,
      minZ: -p.halfD * PV_BOUNDS_FACTOR,
      maxZ: p.halfD * PV_BOUNDS_FACTOR,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────
// Per-plant POI datasets — independent of building centres
// ────────────────────────────────────────────────────────────────────────

export const PLANT_POIS: Record<string, ScenePOI[]> = {
  "PLT-JHR-001": [
    {
      id: "JHR-POI-INV01", plantId: "PLT-JHR-001",
      name: "Inverter COM1-5", role: "INVERTER",
      pos: [-30, 8, -15], status: "critical",
      capacity: "580 kW", power: "412 kW", health: 78,
      deviceId: "DEV-JHR-INV-01",
    },
    {
      id: "JHR-POI-PNL03", plantId: "PLT-JHR-001",
      name: "Panel Array A3", role: "PV ARRAY",
      pos: [-78, 6, 38], status: "critical",
      capacity: "145 kW", power: "0 kW", health: 32,
      deviceId: "DEV-JHR-PNL-03",
    },
    {
      id: "JHR-POI-MET", plantId: "PLT-JHR-001",
      name: "Met Tower", role: "WEATHER STATION",
      pos: [70, 14, -55], status: "normal",
      capacity: "—", power: "—", health: 100,
      deviceId: "DEV-JHR-MET-01",
    },
    {
      id: "JHR-POI-TRA01", plantId: "PLT-JHR-001",
      name: "Transformer T1", role: "MV / HV",
      pos: [82, 7, 42], status: "normal",
      capacity: "1.2 MVA", power: "987 kW", health: 92,
      deviceId: "DEV-JHR-TRA-01",
    },
    {
      id: "JHR-POI-MTR01", plantId: "PLT-JHR-001",
      name: "Grid Meter G1", role: "REVENUE METER",
      pos: [22, 6, 75], status: "normal",
      capacity: "—", power: "987 kW", health: 100,
      deviceId: "DEV-JHR-MTR-01",
    },
  ],

  "PLT-PNG-001": [
    {
      id: "PNG-POI-INV-A", plantId: "PLT-PNG-001",
      name: "Inverter Bank A", role: "AC EXPORT",
      pos: [-60, 7, -30], status: "critical",
      capacity: "560 kW", power: "412 kW", health: 64,
    },
    {
      id: "PNG-POI-INV-B", plantId: "PLT-PNG-001",
      name: "Inverter Bank B", role: "AC EXPORT",
      pos: [40, 7, -30], status: "normal",
      capacity: "560 kW", power: "538 kW", health: 95,
    },
    {
      id: "PNG-POI-INV-C", plantId: "PLT-PNG-001",
      name: "Inverter Bank C", role: "AC EXPORT",
      pos: [-30, 7, 30], status: "normal",
      capacity: "560 kW", power: "521 kW", health: 93,
    },
    {
      id: "PNG-POI-BATT", plantId: "PLT-PNG-001",
      name: "Battery Bank", role: "BESS",
      pos: [110, 8, -75], status: "normal",
      capacity: "1.2 MWh", power: "+220 kW", health: 97,
    },
    {
      id: "PNG-POI-SUB", plantId: "PLT-PNG-001",
      name: "Switchyard 132 kV", role: "SUBSTATION",
      pos: [110, 12, 70], status: "normal",
      capacity: "132 kV", power: "1.7 MW", health: 98,
    },
    {
      id: "PNG-POI-MET", plantId: "PLT-PNG-001",
      name: "Coastal Met Tower", role: "WEATHER",
      pos: [-118, 18, 0], status: "normal",
      capacity: "—", power: "—", health: 100,
    },
  ],

  "PLT-KDH-001": [
    {
      id: "KDH-POI-INV-A", plantId: "PLT-KDH-001",
      name: "Inverter KDH-1", role: "AC EXPORT",
      pos: [-25, 7, -15], status: "normal",
      capacity: "120 kW", power: "87 kW", health: 96,
    },
    {
      id: "KDH-POI-INV-B", plantId: "PLT-KDH-001",
      name: "Inverter KDH-2", role: "AC EXPORT",
      pos: [25, 7, -15], status: "normal",
      capacity: "120 kW", power: "92 kW", health: 98,
    },
    {
      id: "KDH-POI-MET", plantId: "PLT-KDH-001",
      name: "Met Tower", role: "WEATHER",
      pos: [-50, 16, 0], status: "normal",
      capacity: "—", power: "—", health: 100,
    },
    {
      id: "KDH-POI-ADMIN", plantId: "PLT-KDH-001",
      name: "Site Admin", role: "CONTROL",
      pos: [-42, 7, 36], status: "normal",
      capacity: "307 kWp", power: "245 kW", health: 99,
    },
  ],

  "PLT-PRK-001": [
    {
      id: "PRK-POI-INV-A", plantId: "PLT-PRK-001",
      name: "Inverter Cluster A", role: "AC EXPORT",
      pos: [-80, 7, -25], status: "normal",
      capacity: "1 MW", power: "780 kW", health: 96,
    },
    {
      id: "PRK-POI-INV-B", plantId: "PLT-PRK-001",
      name: "Inverter Cluster B", role: "AC EXPORT",
      pos: [0, 7, -25], status: "normal",
      capacity: "1 MW", power: "812 kW", health: 94,
    },
    {
      id: "PRK-POI-INV-C", plantId: "PLT-PRK-001",
      name: "Inverter Cluster C", role: "AC EXPORT",
      pos: [80, 7, -25], status: "normal",
      capacity: "1 MW", power: "788 kW", health: 92,
    },
    {
      id: "PRK-POI-BATT", plantId: "PLT-PRK-001",
      name: "Battery Bank", role: "BESS",
      pos: [115, 8, -78], status: "normal",
      capacity: "2.4 MWh", power: "+420 kW", health: 96,
    },
    {
      id: "PRK-POI-SUB", plantId: "PLT-PRK-001",
      name: "Substation North", role: "SUBSTATION",
      pos: [115, 13, 75], status: "normal",
      capacity: "275 kV", power: "2.4 MW", health: 98,
    },
    {
      id: "PRK-POI-WHSE", plantId: "PLT-PRK-001",
      name: "Spare Parts", role: "WAREHOUSE",
      pos: [-115, 7, -78], status: "normal",
      capacity: "—", power: "—", health: 100,
    },
    {
      id: "PRK-POI-MET", plantId: "PLT-PRK-001",
      name: "Met Tower", role: "WEATHER",
      pos: [-123, 16, 0], status: "normal",
      capacity: "—", power: "—", health: 100,
    },
  ],

  "PLT-MLK-001": [
    {
      id: "MLK-POI-INV-A", plantId: "PLT-MLK-001",
      name: "Inverter MLK-1", role: "AC EXPORT",
      pos: [-30, 7, -20], status: "normal",
      capacity: "150 kW", power: "118 kW", health: 95,
    },
    {
      id: "MLK-POI-INV-B", plantId: "PLT-MLK-001",
      name: "Inverter MLK-2", role: "AC EXPORT",
      pos: [30, 7, -20], status: "normal",
      capacity: "150 kW", power: "121 kW", health: 96,
    },
    {
      id: "MLK-POI-SUB", plantId: "PLT-MLK-001",
      name: "Coastal Substation", role: "SUBSTATION",
      pos: [55, 12, 38], status: "normal",
      capacity: "66 kV", power: "318 kW", health: 97,
    },
    {
      id: "MLK-POI-WHSE", plantId: "PLT-MLK-001",
      name: "Warehouse", role: "INVENTORY",
      pos: [-55, 7, -42], status: "normal",
      capacity: "—", power: "—", health: 96,
    },
    {
      id: "MLK-POI-MET", plantId: "PLT-MLK-001",
      name: "Met Tower", role: "WEATHER",
      pos: [-65, 16, 0], status: "normal",
      capacity: "—", power: "—", health: 100,
    },
  ],
};

export const POI_BY_ID: Record<string, ScenePOI> = Object.fromEntries(
  Object.values(PLANT_POIS)
    .flat()
    .map((p) => [p.id, p]),
);
