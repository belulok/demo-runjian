"use client";

import { create } from "zustand";
import type { GroundKind, StructureKind } from "@/components/world/isometric/tileKinds";
import { STRUCTURE_DEFS } from "@/components/world/isometric/tileKinds";
import { PRIMARY_DEVICES, DEVICES } from "@/lib/mock/devices";
import { PLANTS, PRIMARY_PLANT_ID } from "@/lib/mock/plants";

export type Structure = {
  id: string;
  kind: StructureKind;
  /** Any integer — positive, negative, or zero. The world is unbounded. */
  col: number;
  row: number;
  rotation?: 0 | 90 | 180 | 270;
  deviceId?: string;
  tag?: string;
};

export type Tile = {
  ground: GroundKind;
};

/** Unlimited 2D world.
 *  Ground tiles are sparse — any cell not present defaults to grass.
 *  Structures live at arbitrary integer (col, row), including negative. */
export type Layout = {
  tiles: Map<string, Tile>;
  structures: Structure[];
};

export type Brush =
  | { type: "ground"; kind: GroundKind }
  | { type: "structure"; kind: StructureKind }
  | { type: "erase" }
  | null;

type LayoutState = {
  layouts: Record<string, Layout>;
  currentPlantId: string;
  layout: Layout;
  isBuildMode: boolean;
  brush: Brush;
  hoverCell: { col: number; row: number } | null;

  switchToPlant: (plantId: string) => void;

  toggleBuildMode: () => void;
  setBuildMode: (on: boolean) => void;
  setBrush: (b: Brush) => void;
  setHoverCell: (cell: { col: number; row: number } | null) => void;

  setGround: (col: number, row: number, kind: GroundKind) => void;
  placeStructure: (col: number, row: number, kind: StructureKind) => string | null;
  removeStructureAt: (col: number, row: number) => void;
  removeStructureById: (id: string) => void;

  save: () => void;
  load: () => boolean;
  reset: () => void;
};

export const DEFAULT_GROUND: GroundKind = "grass";

export function tileKey(col: number, row: number) {
  return `${col},${row}`;
}

export function getGroundAt(layout: Layout, col: number, row: number): GroundKind {
  return layout.tiles.get(tileKey(col, row))?.ground ?? DEFAULT_GROUND;
}

// ───────────────────────── seeding ─────────────────────────

function deviceKindToStructure(dType: string): StructureKind | null {
  switch (dType) {
    case "panel_array": return "panel_array_ns";
    case "inverter": return "inverter";
    case "transformer": return "transformer";
    case "tower": return "tower";
    case "meter": return "meter";
    case "combiner": return "combiner";
    default: return null;
  }
}

/** Stamp a concrete pad of cells into a tiles Map. */
function stampPad(tiles: Map<string, Tile>, lo: number, hi: number, opts?: { coastal?: boolean }) {
  for (let r = lo; r < hi; r++) {
    for (let c = lo; c < hi; c++) {
      // Outer ring asphalt; rest concrete
      const ground: GroundKind =
        c === lo || c === hi - 1 || r === lo || r === hi - 1 ? "asphalt" : "concrete";
      tiles.set(tileKey(c, r), { ground });
    }
  }
  if (opts?.coastal) {
    // Water + sand strip along the west edge of the pad
    for (let r = lo - 4; r < hi + 4; r++) {
      tiles.set(tileKey(lo - 5, r), { ground: "water" });
      tiles.set(tileKey(lo - 4, r), { ground: "water" });
      tiles.set(tileKey(lo - 3, r), { ground: "sand" });
      tiles.set(tileKey(lo - 2, r), { ground: "sand" });
    }
  }
}

function makeJohorLayout(): Layout {
  const PAD_LO = 0;
  const PAD_HI = 24;
  const tiles = new Map<string, Tile>();
  stampPad(tiles, PAD_LO, PAD_HI);

  // Internal cross-road splits the pad into 4 districts. NW holds the original
  // linked devices, the other 3 districts are new city expansion.
  const ROAD_ROW = 13;
  const ROAD_COL = 13;
  for (let r = PAD_LO + 1; r < PAD_HI - 1; r++) {
    tiles.set(tileKey(ROAD_COL, r), { ground: "asphalt" });
  }
  for (let c = PAD_LO + 1; c < PAD_HI - 1; c++) {
    tiles.set(tileKey(c, ROAD_ROW), { ground: "asphalt" });
  }

  const structures: Structure[] = [];
  let nextId = 0;
  const used = new Set<string>();
  const reserve = (col: number, row: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) used.add(`${c},${r}`);
    }
  };
  const isFreeAt = (col: number, row: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (used.has(`${c},${r}`)) return false;
      }
    }
    return true;
  };
  const add = (col: number, row: number, kind: StructureKind, opts?: { deviceId?: string }) => {
    const def = STRUCTURE_DEFS[kind];
    if (!isFreeAt(col, row, def.footprint.w, def.footprint.h)) return false;
    structures.push({ id: `S-${nextId++}-${kind}`, kind, col, row, ...opts });
    reserve(col, row, def.footprint.w, def.footprint.h);
    return true;
  };

  // ─── NW district: the original 14 linked devices ───
  const OX = 1;
  const OY = 1;
  for (const d of PRIMARY_DEVICES) {
    if (!d.layout) continue;
    const kind = deviceKindToStructure(d.type);
    if (!kind) continue;
    add(d.layout.col + OX, d.layout.row + OY, kind, { deviceId: d.id });
  }

  // Reserve road tiles so nothing lands on them (devices were placed first
  // and win any conflict at the road edge).
  for (let r = PAD_LO; r < PAD_HI; r++) reserve(ROAD_COL, r, 1, 1);
  for (let c = PAD_LO; c < PAD_HI; c++) reserve(c, ROAD_ROW, 1, 1);

  // ─── NW: combiners packed between the existing panel arrays ───
  for (const row of [3, 5, 7, 9]) {
    add(6, row, "combiner");
    add(8, row, "combiner");
  }
  add(0, 3, "combiner"); add(0, 5, "combiner"); add(0, 7, "combiner"); add(0, 9, "combiner");

  // ─── NE district: PV expansion + east-edge battery row ───
  for (let band = 0; band < 4; band++) {
    const r = 1 + band * 3;
    add(14, r, "panel_array_ns", { deviceId: undefined });
    add(18, r, "combiner");
    add(19, r, "battery");
    if (band === 0) add(21, r, "meter");
    if (band < 3) add(18, r + 1, "inverter");
  }
  add(14, 12, "tower");
  add(21, 12, "meter");

  // ─── SW district: Residential neighborhood (apartments + shops + park) ───
  // Two rows of apartment blocks
  for (const r of [14, 17] as const) {
    add(1, r, "apartment");          // 2×2 → (1-2, r-r+1)
    add(4, r, "apartment");          // (4-5, r-r+1)
    add(8, r, "apartment");          // (8-9, r-r+1)
  }
  // Sidewalk trees + light poles between apartment rows
  add(3, 14, "tree");
  add(7, 14, "tree");
  add(11, 14, "light_pole");
  add(3, 17, "tree");
  add(7, 17, "tree");
  add(11, 17, "light_pole");
  add(6, 16, "light_pole");
  add(10, 16, "tree");
  // Commercial strip along row 20 — 6 shops + a tree
  for (const c of [1, 2, 3, 5, 6, 7, 9, 10, 11] as const) {
    add(c, 20, "shop");
  }
  add(4, 20, "tree");
  add(8, 20, "tree");
  // Park row along row 22 — trees + bollards
  for (const c of [1, 3, 5, 7, 9, 11] as const) add(c, 22, "tree");
  for (const c of [2, 6, 10] as const) add(c, 22, "bollard");

  // ─── SE district: Downtown CBD + power station ───
  // Top row: skyscraper centerpiece + office block + meter + comm tower
  add(14, 14, "skyscraper");          // 2×2 × 5 tall — CENTERPIECE
  add(17, 14, "office_block");        // 3×2 × 2 tall → (17-19, 14-15)
  add(20, 14, "meter");
  add(21, 14, "tower");
  add(22, 14, "comm_tower");          // tall (4 tiles)
  add(16, 16, "bollard");
  add(15, 16, "bollard");
  // Mid: substation building + 2 apartments + 3 shops + power pylon
  add(14, 17, "substation");          // 3×3 → (14-16, 17-19)
  add(17, 17, "apartment");           // 2×2 → (17-18, 17-18)
  add(20, 17, "apartment");           // 2×2 → (20-21, 17-18)
  add(22, 17, "power_pylon");         // tall (3.5 tiles)
  add(17, 19, "shop");
  add(18, 19, "shop");
  add(19, 19, "shop");
  add(22, 19, "tree");
  // Bottom: civic plaza + warehouse + depot + pylon
  add(14, 21, "bollard");
  add(15, 21, "bollard");
  add(16, 21, "bollard");
  add(17, 21, "warehouse");           // 3×2 → (17-19, 21-22)
  add(20, 21, "tree");
  add(PAD_HI - 3, PAD_HI - 3, "depot");
  add(14, 22, "tree");
  add(15, 22, "light_pole");
  add(16, 22, "power_pylon");
  add(20, 22, "tree");

  // ─── Light poles at district corners + mid-edges ───
  const lpCandidates: Array<[number, number]> = [
    [1, 1], [22, 1], [1, 22],
    [12, 12], [14, 12], [12, 14],
    [7, 12], [12, 7],
    [20, 12], [12, 20],
    [7, 14], [14, 7],
    [22, 12], [12, 22],
  ];
  for (const [c, r] of lpCandidates) add(c, r, "light_pole");

  // ─── Perimeter fences (every other cell on the outer asphalt ring) ───
  for (let c = PAD_LO + 1; c < PAD_HI - 1; c += 2) {
    add(c, PAD_LO, "fence_h");
    add(c, PAD_HI - 1, "fence_h");
  }
  for (let r = PAD_LO + 1; r < PAD_HI - 1; r += 2) {
    add(PAD_LO, r, "fence_v");
    add(PAD_HI - 1, r, "fence_v");
  }

  // ─── Forest belt outside the pad (2 rows deep, alternating) ───
  const seenDecor = new Set<string>();
  const pushTree = (c: number, r: number) => {
    const key = `${c},${r}`;
    if (seenDecor.has(key)) return;
    seenDecor.add(key);
    structures.push({ id: `S-${nextId++}-tree`, kind: "tree", col: c, row: r });
  };
  for (let c = -3; c <= PAD_HI + 2; c++) {
    if (((c % 2) + 2) % 2 === 0) { pushTree(c, -3); pushTree(c, PAD_HI + 2); }
    else { pushTree(c, -2); pushTree(c, PAD_HI + 1); }
  }
  for (let r = -3; r <= PAD_HI + 2; r++) {
    if (((r % 2) + 2) % 2 === 0) { pushTree(-3, r); pushTree(PAD_HI + 2, r); }
    else { pushTree(-2, r); pushTree(PAD_HI + 1, r); }
  }
  // Extra trees at the four outer corners
  for (const [c, r] of [[-4, -4], [PAD_HI + 3, -4], [-4, PAD_HI + 3], [PAD_HI + 3, PAD_HI + 3]] as const) {
    pushTree(c, r);
  }

  // Outgoing transmission line — pylons stride east from the substation
  for (const [c, r] of [[PAD_HI + 3, 18], [PAD_HI + 7, 18], [PAD_HI + 11, 18]] as const) {
    structures.push({ id: `S-${nextId++}-power_pylon`, kind: "power_pylon", col: c, row: r });
  }
  // Standalone comm tower in the forest belt
  structures.push({ id: `S-${nextId++}-comm_tower`, kind: "comm_tower", col: -5, row: PAD_HI + 4 });

  return { tiles, structures };
}

function makePrng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  let state = Math.abs(h) || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function makeProceduralLayout(plantId: string): Layout {
  const plant = PLANTS.find((p) => p.id === plantId);
  if (!plant) return makeJohorLayout();

  const rng = makePrng(plantId);
  const PAD_LO = 0;
  // Pad scales aggressively with capacity — large sites feel like cities.
  const PAD_HI =
    plant.capacityKWp < 500 ? 22 :
    plant.capacityKWp < 1500 ? 30 :
    plant.capacityKWp < 2500 ? 38 : 44;
  const tiles = new Map<string, Tile>();
  const isCoastal = plant.region === "Penang" || plant.region === "Melaka";
  stampPad(tiles, PAD_LO, PAD_HI, { coastal: isCoastal });

  // City road grid — every ROAD_PITCH cells, leaving at least 5 cells before
  // the south/east pad edge so the last block isn't a sliver.
  const ROAD_PITCH = 7;
  const roadLines: number[] = [];
  for (let i = ROAD_PITCH; i < PAD_HI - 5; i += ROAD_PITCH) {
    roadLines.push(i);
  }
  for (const r of roadLines) {
    for (let c = PAD_LO + 1; c < PAD_HI - 1; c++) {
      tiles.set(tileKey(c, r), { ground: "asphalt" });
    }
  }
  for (const c of roadLines) {
    for (let r = PAD_LO + 1; r < PAD_HI - 1; r++) {
      tiles.set(tileKey(c, r), { ground: "asphalt" });
    }
  }

  const structures: Structure[] = [];
  let nextId = 0;
  const used = new Set<string>();
  const reserve = (col: number, row: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) used.add(`${c},${r}`);
    }
  };
  const isFreeAt = (col: number, row: number, w: number, h: number) => {
    if (col < PAD_LO + 1 || row < PAD_LO + 1 || col + w > PAD_HI - 1 || row + h > PAD_HI - 1) return false;
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (used.has(`${c},${r}`)) return false;
      }
    }
    return true;
  };

  // Reserve every road cell so PV/utility structures don't land on them.
  for (const r of roadLines) {
    for (let c = PAD_LO; c < PAD_HI; c++) used.add(`${c},${r}`);
  }
  for (const c of roadLines) {
    for (let r = PAD_LO; r < PAD_HI; r++) used.add(`${c},${r}`);
  }

  const plantDevices = DEVICES.filter((d) => d.plantId === plantId);
  let deviceIdx = 0;
  const nextDeviceId = (): string | undefined => {
    while (deviceIdx < plantDevices.length) {
      const d = plantDevices[deviceIdx++];
      if (d.type === "inverter") return d.id;
    }
    return undefined;
  };

  const add = (col: number, row: number, kind: StructureKind, opts?: { deviceId?: string }) => {
    const def = STRUCTURE_DEFS[kind];
    if (!isFreeAt(col, row, def.footprint.w, def.footprint.h)) return false;
    structures.push({ id: `S-${plantId}-${nextId++}`, kind, col, row, ...opts });
    reserve(col, row, def.footprint.w, def.footprint.h);
    return true;
  };

  // ─── Block decomposition ───
  // A block is the inner-cell rectangle between two road lines (or a road and
  // the outer asphalt ring). Skip slivers (w<4 or h<4).
  const colBoundaries = [PAD_LO, ...roadLines, PAD_HI - 1];
  const rowBoundaries = [PAD_LO, ...roadLines, PAD_HI - 1];
  type Block = { gx: number; gy: number; baseCol: number; baseRow: number; w: number; h: number };
  const blocks: Block[] = [];
  for (let gy = 0; gy < rowBoundaries.length - 1; gy++) {
    for (let gx = 0; gx < colBoundaries.length - 1; gx++) {
      const lc = colBoundaries[gx] + 1;
      const lr = rowBoundaries[gy] + 1;
      const hc = colBoundaries[gx + 1] - 1;
      const hr = rowBoundaries[gy + 1] - 1;
      const w = hc - lc + 1;
      const h = hr - lr + 1;
      if (w < 4 || h < 4) continue;
      blocks.push({ gx, gy, baseCol: lc, baseRow: lr, w, h });
    }
  }

  // Designate special-purpose blocks
  const cols = colBoundaries.length - 1;
  const rows = rowBoundaries.length - 1;
  const findBlock = (gx: number, gy: number) =>
    blocks.find((b) => b.gx === gx && b.gy === gy) ?? null;
  const depotBlock = findBlock(0, 0);
  const substationBlock = findBlock(cols - 1, 0);
  const batteryBlock = findBlock(cols - 1, rows - 1);
  const secondDepotBlock = blocks.length > 6 ? findBlock(0, rows - 1) : null;
  // Central CBD — the tallest cluster of buildings sits centrally
  const cbdBlock = blocks.length >= 9 ? findBlock(Math.floor(cols / 2), 0) : null;
  const cbdBlock2 = blocks.length >= 12 ? findBlock(Math.floor(cols / 2) - 1, 0) : null;

  type District = "pv" | "residential" | "commercial" | "park" | "cbd";
  const districtFor = (b: Block): District => {
    // Special-purpose blocks short-circuit
    const r = rng();
    // Edge bias — bordering blocks lean urban, interior leans PV
    const onEdge = b.gx === 0 || b.gx === cols - 1 || b.gy === 0 || b.gy === rows - 1;
    if (onEdge) {
      if (r < 0.35) return "residential";
      if (r < 0.55) return "commercial";
      if (r < 0.65) return "park";
      if (r < 0.75) return "cbd";
      return "pv";
    }
    if (r < 0.15) return "residential";
    if (r < 0.25) return "commercial";
    if (r < 0.30) return "park";
    return "pv";
  };

  // ─── Fill each block ───
  for (const b of blocks) {
    if (b === depotBlock) {
      add(b.baseCol, b.baseRow, "depot");
      if (b.w >= 5) add(b.baseCol + 3, b.baseRow, "depot");
      add(b.baseCol + 2, b.baseRow + 2, "bollard");
      add(b.baseCol, b.baseRow + 3, "bollard");
      if (b.w >= 5) add(b.baseCol + 4, b.baseRow + 3, "bollard");
      if (b.h >= 5) add(b.baseCol, b.baseRow + 4, "meter");
      if (b.h >= 5 && b.w >= 5) add(b.baseCol + 2, b.baseRow + 4, "tower");
      if (b.h >= 6 && b.w >= 5) add(b.baseCol + 3, b.baseRow + 4, "battery");
      continue;
    }
    if (b === substationBlock) {
      // Power-station district: substation building + comm tower + pylons + batteries
      if (b.w >= 5 && b.h >= 5) {
        add(b.baseCol, b.baseRow, "substation");      // 3×3
      } else {
        add(b.baseCol, b.baseRow, "transformer");
        add(b.baseCol + 2, b.baseRow, "transformer");
      }
      if (b.w >= 5) add(b.baseCol + 4, b.baseRow, "comm_tower");
      if (b.h >= 4 && b.w >= 5) add(b.baseCol + 4, b.baseRow + 2, "power_pylon");
      if (b.h >= 5) add(b.baseCol, b.baseRow + 4, "battery");
      if (b.h >= 5 && b.w >= 5) add(b.baseCol + 3, b.baseRow + 4, "battery");
      if (b.h >= 5 && b.w >= 6) add(b.baseCol + 5, b.baseRow + 4, "power_pylon");
      continue;
    }
    if (b === batteryBlock) {
      for (let rr = 0; rr < Math.min(3, Math.floor(b.h / 2)); rr++) {
        add(b.baseCol, b.baseRow + rr * 2, "battery");
        if (b.w >= 5) add(b.baseCol + 3, b.baseRow + rr * 2, "battery");
      }
      if (b.w >= 6 && b.h >= 5) add(b.baseCol + 5, b.baseRow, "meter");
      continue;
    }
    if (b === secondDepotBlock) {
      // Civic district: control building + warehouse + tower + bollards
      add(b.baseCol, b.baseRow, "control_building"); // 2×2
      if (b.w >= 5) add(b.baseCol + 3, b.baseRow, "comm_tower");
      if (b.h >= 5) {
        if (b.w >= 6) add(b.baseCol, b.baseRow + 3, "warehouse"); // 3×2
        else add(b.baseCol, b.baseRow + 3, "depot");
      }
      if (b.h >= 5 && b.w >= 5) add(b.baseCol + 4, b.baseRow + 4, "power_pylon");
      continue;
    }
    if (b === cbdBlock || b === cbdBlock2) {
      // Downtown core — skyscrapers + office block + plaza
      add(b.baseCol, b.baseRow, "skyscraper");      // 2×2 × 5 tall
      if (b.w >= 5) add(b.baseCol + 3, b.baseRow, "office_block"); // 3×2
      if (b.h >= 5) {
        add(b.baseCol, b.baseRow + 3, "shop");
        add(b.baseCol + 1, b.baseRow + 3, "shop");
        if (b.w >= 5) add(b.baseCol + 3, b.baseRow + 3, "shop");
        if (b.w >= 6) add(b.baseCol + 4, b.baseRow + 3, "shop");
      }
      if (b.h >= 5 && b.w >= 5) {
        add(b.baseCol + 2, b.baseRow + 4, "light_pole");
        add(b.baseCol + 5, b.baseRow + 4, "tree");
      }
      continue;
    }

    // ─── Non-special blocks: dispatch by district roll ───
    const district = districtFor(b);

    if (district === "residential") {
      // 2–4 apartment blocks + small park + light pole
      add(b.baseCol, b.baseRow, "apartment");                // 2×2 × 3 tall
      if (b.w >= 5) add(b.baseCol + 3, b.baseRow, "apartment");
      if (b.h >= 5) {
        add(b.baseCol, b.baseRow + 3, "apartment");
        if (b.w >= 5) add(b.baseCol + 3, b.baseRow + 3, "apartment");
      }
      add(b.baseCol + 2, b.baseRow + 2, "light_pole");
      if (b.w >= 6 && b.h >= 6) add(b.baseCol + 5, b.baseRow + 5, "tree");
      continue;
    }
    if (district === "commercial") {
      // Office block + row of shops + tree
      add(b.baseCol, b.baseRow, "office_block");             // 3×2 × 2 tall
      if (b.h >= 5) {
        for (let i = 0; i < Math.min(b.w, 4); i++) {
          add(b.baseCol + i, b.baseRow + 3, "shop");
        }
      }
      if (b.h >= 5 && b.w >= 5) add(b.baseCol + 4, b.baseRow + 3, "tree");
      if (b.h >= 6 && b.w >= 5) add(b.baseCol + 4, b.baseRow + 4, "light_pole");
      continue;
    }
    if (district === "park") {
      // Greenery + light poles + bollards (no buildings)
      const stride = 2;
      for (let r = 0; r < b.h; r += stride) {
        for (let c = 0; c < b.w; c += stride) {
          if ((r + c) % 4 === 0) {
            add(b.baseCol + c, b.baseRow + r, "tree");
          } else if ((r + c) % 6 === 0) {
            add(b.baseCol + c, b.baseRow + r, "bollard");
          }
        }
      }
      add(b.baseCol + Math.floor(b.w / 2), b.baseRow + Math.floor(b.h / 2), "light_pole");
      continue;
    }
    if (district === "cbd") {
      // Mid-density CBD spill — office + apartments
      add(b.baseCol, b.baseRow, "office_block");
      if (b.h >= 5) {
        add(b.baseCol, b.baseRow + 3, "apartment");
        if (b.w >= 5) add(b.baseCol + 3, b.baseRow + 3, "apartment");
      }
      continue;
    }

    // Default: PV cluster block — 2-3 panel rows + inverter + combiners
    add(b.baseCol, b.baseRow, "panel_array_ns", { deviceId: nextDeviceId() });
    add(b.baseCol, b.baseRow + 2, "panel_array_ns", { deviceId: nextDeviceId() });
    if (b.h >= 6) {
      add(b.baseCol, b.baseRow + 4, "panel_array_ns", { deviceId: nextDeviceId() });
    }
    if (b.w >= 5) {
      add(b.baseCol + 4, b.baseRow, "combiner");
      add(b.baseCol + 4, b.baseRow + 1, "inverter", { deviceId: nextDeviceId() });
      add(b.baseCol + 4, b.baseRow + 2, "combiner");
      if (b.h >= 5) add(b.baseCol + 4, b.baseRow + 4, "combiner");
    }
    if (b.w >= 6) {
      add(b.baseCol + 5, b.baseRow + 1, "meter");
    }
  }

  // ─── Perimeter fences — denser than before (every other cell) ───
  for (let c = PAD_LO + 1; c < PAD_HI - 1; c += 2) {
    add(c, PAD_LO, "fence_h");
    add(c, PAD_HI - 1, "fence_h");
  }
  for (let r = PAD_LO + 1; r < PAD_HI - 1; r += 2) {
    add(PAD_LO, r, "fence_v");
    add(PAD_HI - 1, r, "fence_v");
  }

  // ─── Light poles at every road intersection corner ───
  const allLines = [PAD_LO, ...roadLines, PAD_HI - 1];
  for (const r of allLines) {
    for (const c of allLines) {
      const lc = c === PAD_LO ? PAD_LO + 1 : c === PAD_HI - 1 ? PAD_HI - 2 : c - 1;
      const lr = r === PAD_LO ? PAD_LO + 1 : r === PAD_HI - 1 ? PAD_HI - 2 : r - 1;
      add(lc, lr, "light_pole");
    }
  }

  // ─── Forest belt outside the pad (2 deep, alternating) ───
  const seenDecor = new Set<string>();
  const pushTree = (c: number, r: number) => {
    const key = `${c},${r}`;
    if (seenDecor.has(key)) return;
    seenDecor.add(key);
    structures.push({ id: `S-${plantId}-${nextId++}`, kind: "tree", col: c, row: r });
  };
  for (let c = -3; c <= PAD_HI + 2; c++) {
    if (((c % 2) + 2) % 2 === 0) { pushTree(c, -3); pushTree(c, PAD_HI + 2); }
    else { pushTree(c, -2); pushTree(c, PAD_HI + 1); }
  }
  for (let r = -3; r <= PAD_HI + 2; r++) {
    if (((r % 2) + 2) % 2 === 0) { pushTree(-3, r); pushTree(PAD_HI + 2, r); }
    else { pushTree(-2, r); pushTree(PAD_HI + 1, r); }
  }
  // Random scatter on the outer band for organic feel
  const scatterCount = 18 + Math.floor(rng() * 12);
  const span = PAD_HI + 12;
  for (let i = 0; i < scatterCount; i++) {
    const edge = Math.floor(rng() * 4);
    let c: number, r: number;
    if (edge === 0) { c = -6 + Math.floor(rng() * span); r = -6 + Math.floor(rng() * 4); }
    else if (edge === 1) { c = PAD_HI + Math.floor(rng() * 6); r = -6 + Math.floor(rng() * span); }
    else if (edge === 2) { c = -6 + Math.floor(rng() * span); r = PAD_HI + Math.floor(rng() * 6); }
    else { c = -6 + Math.floor(rng() * 4); r = -6 + Math.floor(rng() * span); }
    pushTree(c, r);
  }

  // Outgoing transmission line — pylons march east from the substation district
  const linePylonRow = Math.floor(PAD_HI / 4);
  for (const dc of [3, 7, 11, 15]) {
    structures.push({ id: `S-${plantId}-${nextId++}-pylon`, kind: "power_pylon", col: PAD_HI + dc, row: linePylonRow });
  }
  // Distant comm tower in the forest belt
  structures.push({ id: `S-${plantId}-${nextId++}-comm`, kind: "comm_tower", col: -5, row: PAD_HI + 4 });

  return { tiles, structures };
}

function makeLayoutForPlant(plantId: string): Layout {
  return plantId === PRIMARY_PLANT_ID ? makeJohorLayout() : makeProceduralLayout(plantId);
}

// ───────────────────────── persistence ─────────────────────────

const STORAGE_KEY_PREFIX = "irun.layout.v7";
const storageKey = (plantId: string) => `${STORAGE_KEY_PREFIX}.${plantId}`;

type SerializedLayout = {
  tiles: [string, Tile][];
  structures: Structure[];
};

function serializeLayout(l: Layout): string {
  const obj: SerializedLayout = {
    tiles: Array.from(l.tiles.entries()),
    structures: l.structures,
  };
  return JSON.stringify(obj);
}

function deserializeLayout(raw: string): Layout | null {
  try {
    const obj = JSON.parse(raw) as SerializedLayout;
    if (!Array.isArray(obj.tiles) || !Array.isArray(obj.structures)) return null;
    return {
      tiles: new Map(obj.tiles),
      structures: obj.structures,
    };
  } catch {
    return null;
  }
}

function initialLayouts(): Record<string, Layout> {
  return { [PRIMARY_PLANT_ID]: makeJohorLayout() };
}

// ───────────────────────── store ─────────────────────────

export const useLayoutStore = create<LayoutState>((set, get) => {
  const initialPlant = PRIMARY_PLANT_ID;
  const seed = initialLayouts();

  function updateActive(updater: (l: Layout) => Layout) {
    set((s) => {
      const next = updater(s.layout);
      return {
        layout: next,
        layouts: { ...s.layouts, [s.currentPlantId]: next },
      };
    });
  }

  return {
    layouts: seed,
    currentPlantId: initialPlant,
    layout: seed[initialPlant],
    isBuildMode: false,
    brush: null,
    hoverCell: null,

    switchToPlant: (plantId) => {
      const s = get();
      if (s.currentPlantId === plantId) return;
      const target = s.layouts[plantId] ?? (() => {
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem(storageKey(plantId));
            if (raw) {
              const parsed = deserializeLayout(raw);
              if (parsed) return parsed;
            }
          } catch { /* */ }
        }
        return makeLayoutForPlant(plantId);
      })();
      set({
        currentPlantId: plantId,
        layout: target,
        layouts: { ...s.layouts, [plantId]: target },
        hoverCell: null,
      });
    },

    toggleBuildMode: () =>
      set((s) => ({ isBuildMode: !s.isBuildMode, brush: !s.isBuildMode ? s.brush : null })),
    setBuildMode: (on) => set({ isBuildMode: on, brush: on ? get().brush : null }),
    setBrush: (b) => set({ brush: b }),
    setHoverCell: (cell) => set({ hoverCell: cell }),

    setGround: (col, row, kind) => {
      updateActive((l) => {
        const tiles = new Map(l.tiles);
        tiles.set(tileKey(col, row), { ground: kind });
        return { ...l, tiles };
      });
    },

    placeStructure: (col, row, kind) => {
      const def = STRUCTURE_DEFS[kind];
      const l = get().layout;
      if (isFootprintOccupied(l.structures, col, row, def.footprint.w, def.footprint.h)) {
        return null;
      }
      const id = `S-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newStructure: Structure = { id, kind, col, row };
      updateActive((curr) => ({ ...curr, structures: [...curr.structures, newStructure] }));
      return id;
    },

    removeStructureAt: (col, row) => {
      updateActive((l) => {
        const target = findStructureAt(l.structures, col, row);
        if (!target) return l;
        return { ...l, structures: l.structures.filter((x) => x.id !== target.id) };
      });
    },

    removeStructureById: (id) => {
      updateActive((l) => ({ ...l, structures: l.structures.filter((x) => x.id !== id) }));
    },

    save: () => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey(get().currentPlantId), serializeLayout(get().layout));
      } catch { /* */ }
    },

    load: () => {
      if (typeof window === "undefined") return false;
      try {
        const raw = window.localStorage.getItem(storageKey(get().currentPlantId));
        if (!raw) return false;
        const parsed = deserializeLayout(raw);
        if (!parsed) return false;
        updateActive(() => parsed);
        return true;
      } catch {
        return false;
      }
    },

    reset: () => {
      const plantId = get().currentPlantId;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(storageKey(plantId));
        } catch { /* */ }
      }
      const fresh = makeLayoutForPlant(plantId);
      set((s) => ({ layout: fresh, layouts: { ...s.layouts, [plantId]: fresh } }));
    },
  };
});

// ───────────────────────── helpers ─────────────────────────

export function findStructureAt(structures: Structure[], col: number, row: number): Structure | null {
  for (let i = structures.length - 1; i >= 0; i--) {
    const s = structures[i];
    const def = STRUCTURE_DEFS[s.kind];
    if (
      col >= s.col &&
      col < s.col + def.footprint.w &&
      row >= s.row &&
      row < s.row + def.footprint.h
    ) {
      return s;
    }
  }
  return null;
}

export function isFootprintOccupied(
  structures: Structure[],
  col: number,
  row: number,
  w: number,
  h: number,
): boolean {
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (findStructureAt(structures, c, r)) return true;
    }
  }
  return false;
}
