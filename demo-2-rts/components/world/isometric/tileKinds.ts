/**
 * Tile + structure kind catalog. Each kind defines its 3-face isometric
 * palette (top/left/right) plus optional height in tile units.
 *
 * Inspired by amilich/isometric-city's placeholder system.
 */

export type GroundKind =
  | "grass"
  | "concrete"
  | "dirt"
  | "asphalt"
  | "sand"
  | "water"
  | "gravel";

export type StructureKind =
  // PV-specific
  | "panel_array_ns" // panel array oriented north-south (long axis)
  | "panel_array_ew" // panel array oriented east-west
  | "inverter"
  | "transformer"
  | "tower"
  | "meter"
  | "depot"
  | "combiner"
  // Heavy infrastructure / city buildings
  | "control_building"
  | "substation"
  | "comm_tower"
  | "power_pylon"
  | "warehouse"
  // Urban buildings
  | "skyscraper"
  | "apartment"
  | "office_block"
  | "shop"
  // Decoration / infrastructure
  | "tree"
  | "bollard"
  | "fence_h"
  | "fence_v"
  | "light_pole"
  | "battery";

export type FaceColors = {
  top: number;
  left: number;
  right: number;
};

export type GroundDef = {
  id: GroundKind;
  label: string;
  category: "ground";
  color: number;        // base fill
  edge?: number;        // optional edge stroke
  noiseAmount?: number; // 0..1 — adds dotted noise overlay
  swatch: string;       // CSS hex for the palette swatch
};

export type StructureDef = {
  id: StructureKind;
  label: string;
  category: "structure" | "decoration";
  /** Footprint in tiles (w × h on the grid, before iso projection). */
  footprint: { w: number; h: number };
  /** Height in tile units (1 = TILE_H tall). */
  height: number;
  faces: FaceColors;
  /** Optional state-driven accent (used as edge highlight on devices). */
  accent?: number;
  swatch: string;
  /** If true, this kind can be linked to a Device for live telemetry. */
  linkable?: boolean;
  /** Short tag rendered above the sprite. */
  tagDefault?: string;
};

export const GROUND_DEFS: Record<GroundKind, GroundDef> = {
  grass: {
    id: "grass",
    label: "Grass",
    category: "ground",
    color: 0x1f4030,
    edge: 0x14271e,
    noiseAmount: 0.4,
    swatch: "#1f4030",
  },
  concrete: {
    id: "concrete",
    label: "Concrete",
    category: "ground",
    color: 0x3a4256,
    edge: 0x252a3a,
    noiseAmount: 0.15,
    swatch: "#3a4256",
  },
  dirt: {
    id: "dirt",
    label: "Dirt",
    category: "ground",
    color: 0x4a3a26,
    edge: 0x2b2114,
    noiseAmount: 0.5,
    swatch: "#4a3a26",
  },
  asphalt: {
    id: "asphalt",
    label: "Asphalt",
    category: "ground",
    color: 0x1c2030,
    edge: 0x0e1018,
    noiseAmount: 0.05,
    swatch: "#1c2030",
  },
  sand: {
    id: "sand",
    label: "Sand",
    category: "ground",
    color: 0x6e5a32,
    edge: 0x44391f,
    noiseAmount: 0.3,
    swatch: "#6e5a32",
  },
  water: {
    id: "water",
    label: "Water",
    category: "ground",
    color: 0x0e2e4a,
    edge: 0x07182a,
    noiseAmount: 0,
    swatch: "#0e2e4a",
  },
  gravel: {
    id: "gravel",
    label: "Gravel",
    category: "ground",
    color: 0x2e3242,
    edge: 0x1a1d28,
    noiseAmount: 0.6,
    swatch: "#2e3242",
  },
};

export const STRUCTURE_DEFS: Record<StructureKind, StructureDef> = {
  panel_array_ns: {
    id: "panel_array_ns",
    label: "Panel Array (NS)",
    category: "structure",
    footprint: { w: 4, h: 1 },
    height: 0.4,
    faces: { top: 0x1f3a5e, left: 0x142848, right: 0x274a76 },
    accent: 0x4f9cff,
    swatch: "#1f3a5e",
    linkable: true,
    tagDefault: "PV·N",
  },
  panel_array_ew: {
    id: "panel_array_ew",
    label: "Panel Array (EW)",
    category: "structure",
    footprint: { w: 1, h: 4 },
    height: 0.4,
    faces: { top: 0x1f3a5e, left: 0x142848, right: 0x274a76 },
    accent: 0x4f9cff,
    swatch: "#1f3a5e",
    linkable: true,
    tagDefault: "PV·E",
  },
  inverter: {
    id: "inverter",
    label: "Inverter",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 1.0,
    faces: { top: 0x2e3a55, left: 0x1a2238, right: 0x3a4a6a },
    accent: 0x34d399,
    swatch: "#2e3a55",
    linkable: true,
    tagDefault: "INV",
  },
  transformer: {
    id: "transformer",
    label: "Transformer",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 0.8,
    faces: { top: 0x2a3550, left: 0x172238, right: 0x344066 },
    accent: 0xeab308,
    swatch: "#2a3550",
    linkable: true,
    tagDefault: "TX",
  },
  tower: {
    id: "tower",
    label: "Met Tower",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 2.2,
    faces: { top: 0x222d44, left: 0x121829, right: 0x303d58 },
    accent: 0xa855f7,
    swatch: "#222d44",
    linkable: true,
    tagDefault: "MET",
  },
  meter: {
    id: "meter",
    label: "Grid Meter",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 0.5,
    faces: { top: 0x2a3142, left: 0x161a25, right: 0x3a4458 },
    accent: 0x3b82f6,
    swatch: "#2a3142",
    linkable: true,
    tagDefault: "GRD",
  },
  depot: {
    id: "depot",
    label: "Maintenance Depot",
    category: "structure",
    footprint: { w: 2, h: 2 },
    height: 0.9,
    faces: { top: 0x44382a, left: 0x2a2218, right: 0x564636 },
    accent: 0xd97706,
    swatch: "#44382a",
    tagDefault: "DEPOT",
  },
  combiner: {
    id: "combiner",
    label: "Combiner Box",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 0.4,
    faces: { top: 0x2a3142, left: 0x161a25, right: 0x3a4458 },
    accent: 0x60a5fa,
    swatch: "#2a3142",
    linkable: true,
    tagDefault: "CMB",
  },
  control_building: {
    id: "control_building",
    label: "Control Building",
    category: "structure",
    footprint: { w: 2, h: 2 },
    height: 2.5,
    faces: { top: 0x32445e, left: 0x1b2638, right: 0x44597a },
    accent: 0x60a5fa,
    swatch: "#32445e",
    linkable: true,
    tagDefault: "CTRL",
  },
  substation: {
    id: "substation",
    label: "Substation",
    category: "structure",
    footprint: { w: 3, h: 3 },
    height: 1.4,
    faces: { top: 0x3a4256, left: 0x1f2535, right: 0x4a5468 },
    accent: 0xeab308,
    swatch: "#3a4256",
    linkable: true,
    tagDefault: "SUBSTN",
  },
  comm_tower: {
    id: "comm_tower",
    label: "Comm Tower",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 4.0,
    faces: { top: 0x4a5066, left: 0x2c3142, right: 0x5e667e },
    accent: 0xef4444,
    swatch: "#4a5066",
    linkable: true,
    tagDefault: "COMM",
  },
  power_pylon: {
    id: "power_pylon",
    label: "Power Pylon",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 3.5,
    faces: { top: 0x4a5066, left: 0x2c3142, right: 0x5e667e },
    accent: 0xfbbf24,
    swatch: "#4a5066",
    tagDefault: "HV·400",
  },
  warehouse: {
    id: "warehouse",
    label: "Warehouse",
    category: "structure",
    footprint: { w: 3, h: 2 },
    height: 1.0,
    faces: { top: 0x3d4a5e, left: 0x232c3e, right: 0x4a5872 },
    accent: 0xddc07a,
    swatch: "#3d4a5e",
    tagDefault: "WHSE",
  },
  skyscraper: {
    id: "skyscraper",
    label: "Skyscraper",
    category: "structure",
    footprint: { w: 2, h: 2 },
    height: 5.0,
    faces: { top: 0x223558, left: 0x0d1530, right: 0x37507a },
    accent: 0x60a5fa,
    swatch: "#223558",
    tagDefault: "TOWER",
  },
  apartment: {
    id: "apartment",
    label: "Apartment",
    category: "structure",
    footprint: { w: 2, h: 2 },
    height: 3.0,
    faces: { top: 0x4f3a2a, left: 0x301f15, right: 0x6a513c },
    accent: 0xddc07a,
    swatch: "#4f3a2a",
    tagDefault: "RES",
  },
  office_block: {
    id: "office_block",
    label: "Office Block",
    category: "structure",
    footprint: { w: 3, h: 2 },
    height: 2.0,
    faces: { top: 0x2a3a56, left: 0x141d36, right: 0x405578 },
    accent: 0x38bdf8,
    swatch: "#2a3a56",
    tagDefault: "OFFICE",
  },
  shop: {
    id: "shop",
    label: "Shop",
    category: "structure",
    footprint: { w: 1, h: 1 },
    height: 0.7,
    faces: { top: 0x4a3520, left: 0x2c1f12, right: 0x6a5238 },
    accent: 0xfbbf24,
    swatch: "#4a3520",
    tagDefault: "SHOP",
  },
  tree: {
    id: "tree",
    label: "Tree",
    category: "decoration",
    footprint: { w: 1, h: 1 },
    height: 0.9,
    faces: { top: 0x2f6a3a, left: 0x1d4524, right: 0x46894f },
    swatch: "#2f6a3a",
  },
  bollard: {
    id: "bollard",
    label: "Bollard",
    category: "decoration",
    footprint: { w: 1, h: 1 },
    height: 0.3,
    faces: { top: 0xc9a85a, left: 0x806530, right: 0xddc07a },
    swatch: "#c9a85a",
  },
  fence_h: {
    id: "fence_h",
    label: "Fence ↔",
    category: "decoration",
    footprint: { w: 1, h: 1 },
    height: 0.25,
    faces: { top: 0x4a5066, left: 0x2c3142, right: 0x5e667e },
    swatch: "#4a5066",
  },
  fence_v: {
    id: "fence_v",
    label: "Fence ↕",
    category: "decoration",
    footprint: { w: 1, h: 1 },
    height: 0.25,
    faces: { top: 0x4a5066, left: 0x2c3142, right: 0x5e667e },
    swatch: "#4a5066",
  },
  light_pole: {
    id: "light_pole",
    label: "Light Pole",
    category: "decoration",
    footprint: { w: 1, h: 1 },
    height: 1.4,
    faces: { top: 0x586071, left: 0x363c4d, right: 0x6e7a90 },
    accent: 0xfde047,
    swatch: "#586071",
  },
  battery: {
    id: "battery",
    label: "Battery Bank",
    category: "structure",
    footprint: { w: 2, h: 1 },
    height: 0.7,
    faces: { top: 0x3a3055, left: 0x231b3a, right: 0x4e4170 },
    accent: 0xa855f7,
    swatch: "#3a3055",
    linkable: true,
    tagDefault: "BATT",
  },
};

export type AnyTileDef = GroundDef | StructureDef;

export const ALL_STRUCTURE_KINDS = Object.values(STRUCTURE_DEFS);
export const ALL_GROUND_KINDS = Object.values(GROUND_DEFS);
