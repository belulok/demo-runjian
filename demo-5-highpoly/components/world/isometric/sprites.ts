/**
 * PixiJS Graphics drawing helpers for isometric tiles and structures.
 *
 * The 3-face box pattern (top/left/right) comes from amilich/isometric-city —
 * gives every solid the right depth perception without sprites.
 */

import { Graphics } from "pixi.js";
import { TILE_W, TILE_H } from "./tileMath";
import { GROUND_DEFS, STRUCTURE_DEFS, type GroundKind, type StructureKind, type FaceColors } from "./tileKinds";

/** Draws a flat diamond tile centered at origin, suitable for ground. */
export function drawGroundTile(g: Graphics, kind: GroundKind, w = TILE_W, h = TILE_H) {
  const def = GROUND_DEFS[kind];
  g.poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0]).fill({ color: def.color });

  if (def.edge != null) {
    g.poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0]).stroke({
      color: def.edge,
      width: 0.5,
      alpha: 0.7,
    });
  }

  // Cheap noise: small dots scattered for textured kinds
  if (def.noiseAmount && def.noiseAmount > 0) {
    const count = Math.floor(def.noiseAmount * 14);
    for (let i = 0; i < count; i++) {
      // Pseudo-random but stable per-tile: use hash of i + kind name
      const seed = hashStr(kind) + i * 17;
      const rx = (frac(seed * 0.137) - 0.5) * (w * 0.7);
      const ry = (frac(seed * 0.293) - 0.5) * (h * 0.7);
      const inside = Math.abs(rx) / (w / 2) + Math.abs(ry) / (h / 2) < 0.85;
      if (!inside) continue;
      g.circle(rx, ry, 0.6).fill({ color: 0x000000, alpha: 0.35 });
    }
  }

  // Water shimmer
  if (kind === "water") {
    g.moveTo(-w / 4, -2).lineTo(w / 4, -2).stroke({ color: 0x4f9cff, width: 0.5, alpha: 0.3 });
    g.moveTo(-w / 4, 4).lineTo(w / 4, 4).stroke({ color: 0x4f9cff, width: 0.5, alpha: 0.2 });
  }

  // Asphalt centerline (when used as road)
  if (kind === "asphalt") {
    g.moveTo(-w / 6, 0).lineTo(w / 6, 0).stroke({ color: 0xc9a85a, width: 0.6, alpha: 0.5 });
  }
}

/** The 4 corners of a w×h footprint diamond, relative to the footprint centroid.
 *
 *  In iso projection with TILE_W:TILE_H = 2:1, a w×h footprint covers a diamond
 *  whose corners sit at the outer edges of the corner tiles:
 *    - top    = (-(w-h)*W/4, -(w+h)*H/4)   ← upper vertex (north)
 *    - right  = ( (w+h)*W/4,  (w-h)*H/4)   ← right vertex (east)
 *    - bottom = ( (w-h)*W/4,  (w+h)*H/4)   ← lower vertex (south)
 *    - left   = (-(w+h)*W/4, -(w-h)*H/4)   ← left vertex (west)
 *
 *  For 1×1 this collapses to the familiar single-tile diamond.
 *  For asymmetric footprints (e.g. 4×1), the diamond is elongated along the
 *  long axis and skewed in iso-space — which is exactly the cell coverage.
 */
export function footprintDiamond(footprintW: number, footprintH: number) {
  const E = ((footprintW + footprintH) * TILE_W) / 4;
  const N = ((footprintW + footprintH) * TILE_H) / 4;
  const skewX = ((footprintW - footprintH) * TILE_W) / 4;
  const skewY = ((footprintW - footprintH) * TILE_H) / 4;
  return {
    top:    { x: -skewX, y: -N },
    right:  { x:  E,     y:  skewY },
    bottom: { x:  skewX, y:  N },
    left:   { x: -E,     y: -skewY },
  };
}

/** Draws a 3-face isometric box (top + left + right) of given footprint and height.
 *  Footprint w/h are in tile units; height is in tile units (TILE_H pixels each). */
export function drawBox3Face(
  g: Graphics,
  footprintW: number,
  footprintH: number,
  heightTiles: number,
  faces: FaceColors,
  accent?: number,
) {
  const { top, right, bottom, left } = footprintDiamond(footprintW, footprintH);
  const h = heightTiles * TILE_H;

  // Left face (darker)
  g.poly([left.x, left.y, bottom.x, bottom.y, bottom.x, bottom.y - h, left.x, left.y - h])
    .fill({ color: faces.left });
  // Right face (lighter)
  g.poly([bottom.x, bottom.y, right.x, right.y, right.x, right.y - h, bottom.x, bottom.y - h])
    .fill({ color: faces.right });
  // Top face (the actual top diamond, lifted by h)
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .fill({ color: faces.top });

  // Subtle edges around the top diamond
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: 0x000000, width: 0.5, alpha: 0.45 });

  // Vertical edges at the three visible corners (front, right-front, left-front)
  g.moveTo(bottom.x, bottom.y).lineTo(bottom.x, bottom.y - h).stroke({ color: 0x000000, width: 0.5, alpha: 0.45 });
  g.moveTo(left.x, left.y).lineTo(left.x, left.y - h).stroke({ color: 0x000000, width: 0.5, alpha: 0.35 });
  g.moveTo(right.x, right.y).lineTo(right.x, right.y - h).stroke({ color: 0x000000, width: 0.5, alpha: 0.35 });

  // Accent stripe along the back edges of the top face
  if (accent != null) {
    g.moveTo(left.x + 2, left.y - h + 1).lineTo(top.x, top.y - h + 1)
      .stroke({ color: accent, width: 1, alpha: 0.85 });
    g.moveTo(top.x, top.y - h + 1).lineTo(right.x - 2, right.y - h + 1)
      .stroke({ color: accent, width: 1, alpha: 0.85 });
  }
}

/** Panel array — tilted glass surface lying within the footprint diamond.
 *
 *  The top face is the cell-coverage diamond, lifted slightly and with its
 *  "back" edges (toward top/north) lifted higher to imply tilt.
 *  All ink stays inside the cell footprint so clicks map back correctly.
 */
export function drawPanelArray(g: Graphics, footprintW: number, footprintH: number, accent: number) {
  const { top, right, bottom, left } = footprintDiamond(footprintW, footprintH);

  const baseLift = 3;   // panel sits this far off the ground
  const tiltLift = 11;  // additional lift at the back (top) corner

  // Ground shadow — slightly larger diamond, low alpha
  g.poly([
    left.x - 2, left.y,
    top.x, top.y - 2,
    right.x + 2, right.y,
    bottom.x, bottom.y + 2,
  ]).fill({ color: 0x000000, alpha: 0.35 });

  // Slab body — the dark frame under the glass (drawn as a 3-face mini box)
  const frameH = 4;
  g.poly([
    left.x, left.y - baseLift,
    bottom.x, bottom.y - baseLift,
    bottom.x, bottom.y - baseLift - frameH,
    left.x, left.y - baseLift - frameH,
  ]).fill({ color: 0x0a1322 });
  g.poly([
    bottom.x, bottom.y - baseLift,
    right.x, right.y - baseLift,
    right.x, right.y - baseLift - frameH,
    bottom.x, bottom.y - baseLift - frameH,
  ]).fill({ color: 0x142848 });

  // Tilted glass top — same diamond shape, with top corner lifted further.
  const tL = { x: left.x,   y: left.y   - baseLift - frameH - tiltLift * 0.4 };
  const tT = { x: top.x,    y: top.y    - baseLift - frameH - tiltLift };
  const tR = { x: right.x,  y: right.y  - baseLift - frameH - tiltLift * 0.4 };
  const tB = { x: bottom.x, y: bottom.y - baseLift - frameH };

  g.poly([tT.x, tT.y, tR.x, tR.y, tB.x, tB.y, tL.x, tL.y])
    .fill({ color: 0x1a3360 })
    .stroke({ color: accent, width: 0.8, alpha: 0.85 });

  // Solar-cell grid lines along the long axis
  const cellsAcross = Math.max(footprintW, footprintH) * 3;
  for (let i = 1; i < cellsAcross; i++) {
    const t = i / cellsAcross;
    // Lines from top-side edge (tL→tT for i<0.5 or tT→tR for i>0.5)
    // Simpler: interpolate between bottom edge (tB→tR) and top edge (tL→tT)?
    // Use the long axis: for w>=h, draw lines from left side to right side
    if (footprintW >= footprintH) {
      // Lines perpendicular to the long axis: from tL→tT edge to tB→tR edge
      const a = { x: lerp(tL.x, tT.x, t), y: lerp(tL.y, tT.y, t) };
      const b = { x: lerp(tB.x, tR.x, t), y: lerp(tB.y, tR.y, t) };
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x000000, width: 0.4, alpha: 0.4 });
    } else {
      // Vertical panel — lines from tT→tR to tL→tB
      const a = { x: lerp(tT.x, tR.x, t), y: lerp(tT.y, tR.y, t) };
      const b = { x: lerp(tL.x, tB.x, t), y: lerp(tL.y, tB.y, t) };
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x000000, width: 0.4, alpha: 0.4 });
    }
  }
  // One cross-line for the short axis
  {
    const a = { x: lerp(tL.x, tB.x, 0.5), y: lerp(tL.y, tB.y, 0.5) };
    const b = { x: lerp(tT.x, tR.x, 0.5), y: lerp(tT.y, tR.y, 0.5) };
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x000000, width: 0.3, alpha: 0.3 });
  }

  // Sun glint near the top edge
  g.moveTo(lerp(tL.x, tT.x, 0.4), lerp(tL.y, tT.y, 0.4))
    .lineTo(lerp(tT.x, tR.x, 0.6), lerp(tT.y, tR.y, 0.6))
    .stroke({ color: 0xffffff, width: 0.7, alpha: 0.22 });
}

/** Control Building — multi-storey office with lit window grid + roof antenna. */
export function drawControlBuilding(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);

  // Floor bands + window grid on left and right faces
  const floors = 5;
  for (let floor = 0; floor < floors; floor++) {
    const yMid = -h + (floor + 0.5) * (h / floors);
    // Left face windows
    for (let i = 0; i < 5; i++) {
      const t = 0.12 + i * 0.18;
      const wx = lerp(left.x, bottom.x, t);
      const wy = lerp(left.y, bottom.y, t);
      const lit = (floor + i) % 3 !== 0;
      g.rect(wx - 1, wy + yMid - 1.5, 2, 3).fill({ color: lit ? 0xfde68a : 0x1a2238, alpha: lit ? 0.85 : 1 });
    }
    // Right face windows
    for (let i = 0; i < 5; i++) {
      const t = 0.12 + i * 0.18;
      const wx = lerp(bottom.x, right.x, t);
      const wy = lerp(bottom.y, right.y, t);
      const lit = (floor + i) % 4 !== 0;
      g.rect(wx - 1, wy + yMid - 1.5, 2, 3).fill({ color: lit ? 0xfde68a : 0x1a2238, alpha: lit ? 0.85 : 1 });
    }
  }

  // Floor separators on the front (bottom) face
  for (let floor = 1; floor < floors; floor++) {
    const y = -h + floor * (h / floors);
    g.moveTo(left.x, left.y + y).lineTo(bottom.x, bottom.y + y).stroke({ color: 0x000000, width: 0.4, alpha: 0.55 });
    g.moveTo(bottom.x, bottom.y + y).lineTo(right.x, right.y + y).stroke({ color: 0x000000, width: 0.4, alpha: 0.55 });
  }

  // Entrance door on the front-right face
  const dx = lerp(bottom.x, right.x, 0.22);
  const dy = lerp(bottom.y, right.y, 0.22);
  g.poly([dx - 2.5, dy, dx + 2.5, dy, dx + 2.5, dy - h * 0.18, dx - 2.5, dy - h * 0.18])
    .fill({ color: 0x1a1a1a });
  g.poly([dx - 2.5, dy, dx + 2.5, dy, dx + 2.5, dy - h * 0.18, dx - 2.5, dy - h * 0.18])
    .stroke({ color: accent, width: 0.4, alpha: 0.6 });

  // Roof parapet edge
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: accent, width: 0.7, alpha: 0.7 });

  // Rooftop antenna mast with strobe
  g.rect(-0.5, -h - 18, 1, 18).fill({ color: 0x586071 });
  g.moveTo(-3, -h - 6).lineTo(3, -h - 6).stroke({ color: 0x586071, width: 0.6 });
  g.circle(0, -h - 18, 1.6).fill({ color: accent });
  g.circle(0, -h - 18, 5).fill({ color: accent, alpha: 0.25 });
}

/** Substation building — large industrial shed with rooftop switchgear. */
export function drawSubstation(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);

  // Vent louvre bands across right face
  for (let row = 0; row < 2; row++) {
    const yMid = -h + (row + 0.5) * (h / 2);
    for (let i = 0; i < 4; i++) {
      const t = 0.15 + i * 0.2;
      const lx = lerp(bottom.x, right.x, t);
      const ly = lerp(bottom.y, right.y, t);
      g.rect(lx - 2.5, ly + yMid - 1, 5, 2).fill({ color: 0x000000, alpha: 0.55 });
    }
  }

  // Double roller doors on front (bottom-right) face
  for (let i = 0; i < 2; i++) {
    const t = 0.22 + i * 0.32;
    const dx = lerp(bottom.x, right.x, t);
    const dy = lerp(bottom.y, right.y, t);
    g.poly([dx - 3, dy, dx + 3, dy, dx + 3, dy - h * 0.55, dx - 3, dy - h * 0.55])
      .fill({ color: 0x1a1a1a });
    g.poly([dx - 3, dy, dx + 3, dy, dx + 3, dy - h * 0.55, dx - 3, dy - h * 0.55])
      .stroke({ color: accent, width: 0.4, alpha: 0.55 });
  }

  // Side signage on left face
  const sx = lerp(left.x, bottom.x, 0.4);
  const sy = lerp(left.y, bottom.y, 0.4);
  g.rect(sx - 5, sy - h * 0.78, 10, 2.5).fill({ color: accent, alpha: 0.85 });

  // Rooftop switchgear pods (3 along the long axis)
  const rooftopY = -h;
  for (let i = 0; i < 3; i++) {
    const t = 0.2 + i * 0.3;
    const cx = lerp(left.x, right.x, t);
    const cy = lerp(left.y, right.y, t);
    // Pod body
    g.rect(cx - 3.5, cy + rooftopY - 7, 7, 7).fill({ color: 0x4a5468 });
    g.rect(cx - 3.5, cy + rooftopY - 7, 7, 1.2).fill({ color: accent, alpha: 0.7 });
    // Bushings (3 ceramic stalks)
    for (let j = -1; j <= 1; j++) {
      g.circle(cx + j * 2, cy + rooftopY - 7, 0.9).fill({ color: 0xddd6c4 });
      g.moveTo(cx + j * 2, cy + rooftopY - 7).lineTo(cx + j * 2, cy + rooftopY - 13).stroke({ color: 0xddd6c4, width: 0.7 });
      g.circle(cx + j * 2, cy + rooftopY - 13, 0.6).fill({ color: 0xddd6c4 });
    }
  }

  // Roof edge accent
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: accent, width: 0.7, alpha: 0.6 });
}

/** Comm Tower — tall lattice mast with antenna array and red navigation light. */
export function drawCommTower(g: Graphics, accent: number) {
  const h = 4.0 * TILE_H;

  // Concrete base pad
  g.poly([-10, 0, 0, 5, 10, 0, 0, -5]).fill({ color: 0x3a4256 });
  g.poly([-10, 0, 0, 5, 10, 0, 0, -5]).stroke({ color: 0x000000, width: 0.4, alpha: 0.5 });

  // Tapered lattice mast
  const baseHalf = 4.5;
  const topHalf = 0.8;
  g.moveTo(-baseHalf, 0).lineTo(-topHalf, -h).stroke({ color: 0x586071, width: 1.5 });
  g.moveTo(baseHalf, 0).lineTo(topHalf, -h).stroke({ color: 0x586071, width: 1.5 });
  g.moveTo(0, 0).lineTo(0, -h).stroke({ color: 0x4a5066, width: 1 });

  // Horizontal lattice bands + X-braces
  const bands = 16;
  for (let i = 1; i < bands; i++) {
    const t = i / bands;
    const y = -t * h;
    const halfW = lerp(baseHalf, topHalf, t);
    g.moveTo(-halfW, y).lineTo(halfW, y).stroke({ color: 0x4a5066, width: 0.5, alpha: 0.6 });
    if (i % 2 === 1 && i < bands - 1) {
      const nT = (i + 1) / bands;
      const nY = -nT * h;
      const nHalf = lerp(baseHalf, topHalf, nT);
      g.moveTo(-halfW, y).lineTo(nHalf, nY).stroke({ color: 0x363c4d, width: 0.3, alpha: 0.6 });
      g.moveTo(halfW, y).lineTo(-nHalf, nY).stroke({ color: 0x363c4d, width: 0.3, alpha: 0.6 });
    }
  }

  // Maintenance platforms
  for (const heightFrac of [0.35, 0.62, 0.85]) {
    const y = -h * heightFrac;
    const halfW = lerp(baseHalf, topHalf, heightFrac);
    g.rect(-halfW - 2.5, y - 1.2, (halfW + 2.5) * 2, 1.6).fill({ color: 0x3a4458 });
    g.rect(-halfW - 2.5, y - 1.2, (halfW + 2.5) * 2, 0.6).fill({ color: accent, alpha: 0.6 });
    // Railings
    g.moveTo(-halfW - 2.5, y - 1.2).lineTo(-halfW - 2.5, y - 4).stroke({ color: 0x586071, width: 0.4 });
    g.moveTo(halfW + 2.5, y - 1.2).lineTo(halfW + 2.5, y - 4).stroke({ color: 0x586071, width: 0.4 });
  }

  // Dish antenna mid-tower
  g.circle(-6, -h * 0.55, 3).fill({ color: 0xddd6c4 }).stroke({ color: 0x000000, width: 0.3 });
  g.moveTo(-3, -h * 0.55).lineTo(-1, -h * 0.55).stroke({ color: 0x586071, width: 0.5 });

  // Top antenna array — vertical whip + crossarm with antennas
  g.moveTo(0, -h).lineTo(0, -h - 24).stroke({ color: 0x586071, width: 1 });
  g.moveTo(-8, -h - 9).lineTo(8, -h - 9).stroke({ color: 0x586071, width: 0.8 });
  for (const xPos of [-8, -4, 4, 8]) {
    g.rect(xPos - 0.8, -h - 13, 1.6, 5).fill({ color: 0x586071 });
  }

  // Red navigation strobe at the apex
  g.circle(0, -h - 24, 2.2).fill({ color: 0xef4444 }).stroke({ color: 0xffffff, width: 0.3 });
  g.circle(0, -h - 24, 7).fill({ color: 0xef4444, alpha: 0.3 });
}

/** Power Pylon — high-voltage transmission lattice with three crossarms. */
export function drawPowerPylon(g: Graphics, accent: number) {
  const h = 3.5 * TILE_H;
  const baseHalf = 7;
  const waistHalf = 1.6;
  const topHalf = 2.4;
  const waistY = -h * 0.55;

  // Concrete footings around base (visible front 2)
  g.rect(-baseHalf - 1, -1, 3, 3).fill({ color: 0x3a4256 });
  g.rect(baseHalf - 2, -1, 3, 3).fill({ color: 0x3a4256 });

  // Legs (base → waist)
  g.moveTo(-baseHalf, 0).lineTo(-waistHalf, waistY).stroke({ color: 0x586071, width: 1.6 });
  g.moveTo(baseHalf, 0).lineTo(waistHalf, waistY).stroke({ color: 0x586071, width: 1.6 });
  g.moveTo(0, 0).lineTo(0, waistY).stroke({ color: 0x4a5066, width: 1 });

  // Body (waist → top, slight outward splay)
  g.moveTo(-waistHalf, waistY).lineTo(-topHalf, -h).stroke({ color: 0x586071, width: 1.5 });
  g.moveTo(waistHalf, waistY).lineTo(topHalf, -h).stroke({ color: 0x586071, width: 1.5 });
  g.moveTo(0, waistY).lineTo(0, -h).stroke({ color: 0x4a5066, width: 1 });

  // Horizontal lattice rungs + X-braces
  const rungs = 14;
  for (let i = 1; i < rungs; i++) {
    const t = i / rungs;
    const y = -t * h;
    let halfW: number;
    if (y > waistY) {
      const localT = y / waistY;
      halfW = lerp(baseHalf, waistHalf, localT);
    } else {
      const localT = (waistY - y) / (waistY - -h);
      halfW = lerp(waistHalf, topHalf, localT);
    }
    g.moveTo(-halfW, y).lineTo(halfW, y).stroke({ color: 0x4a5066, width: 0.4, alpha: 0.6 });
    if (i % 2 === 0 && i < rungs - 1) {
      const nT = (i + 1) / rungs;
      const nY = -nT * h;
      let nHalf: number;
      if (nY > waistY) {
        nHalf = lerp(baseHalf, waistHalf, nY / waistY);
      } else {
        nHalf = lerp(waistHalf, topHalf, (waistY - nY) / (waistY - -h));
      }
      g.moveTo(-halfW, y).lineTo(nHalf, nY).stroke({ color: 0x363c4d, width: 0.3, alpha: 0.5 });
      g.moveTo(halfW, y).lineTo(-nHalf, nY).stroke({ color: 0x363c4d, width: 0.3, alpha: 0.5 });
    }
  }

  // Three crossarms with insulator strings
  const armConfig = [
    { y: -h * 0.5, halfW: 10 },
    { y: -h * 0.72, halfW: 12 },
    { y: -h * 0.94, halfW: 7 },
  ];
  for (const { y, halfW } of armConfig) {
    g.rect(-halfW, y - 0.6, halfW * 2, 1.2).fill({ color: 0x586071 });
    g.rect(-halfW, y - 0.6, halfW * 2, 0.4).fill({ color: 0x363c4d, alpha: 0.6 });
    // Insulator strings — 4 strings per arm, 3 discs each
    for (const xPos of [-halfW + 1.2, -halfW * 0.45, halfW * 0.45, halfW - 1.2]) {
      for (let d = 0; d < 3; d++) {
        g.circle(xPos, y + 1.4 + d * 1.2, 0.7).fill({ color: 0xddd6c4 });
      }
    }
  }

  // Peak warning light
  g.circle(0, -h - 4, 1.5).fill({ color: accent });
  g.circle(0, -h - 4, 5).fill({ color: accent, alpha: 0.3 });
}

/** Skyscraper — tall glass tower with grid of lit windows + crown spire. */
export function drawSkyscraper(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);

  // Dense window grid — 10 floors × 6 columns per face
  const floors = 10;
  for (let floor = 0; floor < floors; floor++) {
    const yMid = -h + (floor + 0.5) * (h / floors);
    for (let i = 0; i < 6; i++) {
      const t = 0.08 + i * 0.165;
      // Left face
      const lx = lerp(left.x, bottom.x, t);
      const ly = lerp(left.y, bottom.y, t);
      const litL = (floor * 5 + i * 3) % 7 < 5;
      g.rect(lx - 0.9, ly + yMid - 1.2, 1.8, 2.4).fill({ color: litL ? 0xfde68a : 0x0a1322, alpha: 0.9 });
      // Right face
      const rx = lerp(bottom.x, right.x, t);
      const ry = lerp(bottom.y, right.y, t);
      const litR = (floor * 3 + i * 5) % 7 < 5;
      g.rect(rx - 0.9, ry + yMid - 1.2, 1.8, 2.4).fill({ color: litR ? 0xfde68a : 0x0a1322, alpha: 0.9 });
    }
  }

  // Setback crown — horizontal accent band 80% up
  const crownY = -h + h * 0.86;
  g.poly([top.x, top.y + crownY + h, right.x, right.y + crownY + h, bottom.x, bottom.y + crownY + h, left.x, left.y + crownY + h])
    .stroke({ color: accent, width: 0.6, alpha: 0.6 });

  // Roof outline + parapet
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: accent, width: 0.9, alpha: 0.8 });

  // Antenna spire + red warning strobe
  g.rect(-0.5, -h - 26, 1, 26).fill({ color: 0x586071 });
  g.moveTo(-2, -h - 18).lineTo(2, -h - 18).stroke({ color: 0x586071, width: 0.5 });
  g.circle(0, -h - 26, 2).fill({ color: 0xef4444 }).stroke({ color: 0xffffff, width: 0.3 });
  g.circle(0, -h - 26, 6).fill({ color: 0xef4444, alpha: 0.3 });

  // Glowing entrance lobby on front face
  const dx = lerp(bottom.x, right.x, 0.5);
  const dy = lerp(bottom.y, right.y, 0.5);
  g.rect(dx - 6, dy - h * 0.07, 12, h * 0.06).fill({ color: 0xfde68a, alpha: 0.85 });
}

/** Apartment — mid-rise residential with paired windows + balconies + roof tank. */
export function drawApartment(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);

  const floors = 6;
  for (let floor = 0; floor < floors; floor++) {
    const yMid = -h + (floor + 0.5) * (h / floors);
    // Left face windows + balcony rail
    for (let i = 0; i < 4; i++) {
      const t = 0.13 + i * 0.22;
      const wx = lerp(left.x, bottom.x, t);
      const wy = lerp(left.y, bottom.y, t);
      const lit = (floor * 3 + i * 5) % 7 < 4;
      g.rect(wx - 1.1, wy + yMid - 1.6, 2.2, 3).fill({ color: lit ? 0xfde68a : 0x0a1322, alpha: 0.85 });
      g.moveTo(wx - 1.6, wy + yMid + 1.5).lineTo(wx + 1.6, wy + yMid + 1.5).stroke({ color: 0x000000, width: 0.5, alpha: 0.55 });
    }
    // Right face windows + balcony rail
    for (let i = 0; i < 4; i++) {
      const t = 0.13 + i * 0.22;
      const wx = lerp(bottom.x, right.x, t);
      const wy = lerp(bottom.y, right.y, t);
      const lit = (floor * 2 + i * 4) % 7 < 4;
      g.rect(wx - 1.1, wy + yMid - 1.6, 2.2, 3).fill({ color: lit ? 0xfde68a : 0x0a1322, alpha: 0.85 });
      g.moveTo(wx - 1.6, wy + yMid + 1.5).lineTo(wx + 1.6, wy + yMid + 1.5).stroke({ color: 0x000000, width: 0.5, alpha: 0.55 });
    }
  }

  // Lobby door
  const dx = lerp(bottom.x, right.x, 0.22);
  const dy = lerp(bottom.y, right.y, 0.22);
  g.poly([dx - 2.2, dy, dx + 2.2, dy, dx + 2.2, dy - h * 0.14, dx - 2.2, dy - h * 0.14])
    .fill({ color: 0x1a1a1a });

  // Flat roof + water tank + satellite dish
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: accent, width: 0.6, alpha: 0.65 });
  g.rect(-3, -h - 4, 6, 4).fill({ color: 0x4a5468 });
  g.rect(-3, -h - 4, 6, 1).fill({ color: accent, alpha: 0.5 });
  g.circle(4, -h - 2, 1.6).fill({ color: 0xddd6c4 });
}

/** Office Block — curtain wall facade with horizontal glass bands. */
export function drawOfficeBlock(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);

  const floors = 4;
  for (let floor = 0; floor < floors; floor++) {
    const yMid = -h + (floor + 0.5) * (h / floors);
    // Left face — continuous glass band
    const lx1 = lerp(left.x, bottom.x, 0.05);
    const ly1 = lerp(left.y, bottom.y, 0.05);
    const lx2 = lerp(left.x, bottom.x, 0.95);
    const ly2 = lerp(left.y, bottom.y, 0.95);
    g.poly([lx1, ly1 + yMid - 2, lx2, ly2 + yMid - 2, lx2, ly2 + yMid + 1.8, lx1, ly1 + yMid + 1.8])
      .fill({ color: 0x60a5fa, alpha: 0.4 });
    // Right face
    const rx1 = lerp(bottom.x, right.x, 0.05);
    const ry1 = lerp(bottom.y, right.y, 0.05);
    const rx2 = lerp(bottom.x, right.x, 0.95);
    const ry2 = lerp(bottom.y, right.y, 0.95);
    g.poly([rx1, ry1 + yMid - 2, rx2, ry2 + yMid - 2, rx2, ry2 + yMid + 1.8, rx1, ry1 + yMid + 1.8])
      .fill({ color: 0x60a5fa, alpha: 0.4 });
  }

  // Vertical mullions (suggests individual office bays)
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const lx = lerp(left.x, bottom.x, t);
    const ly = lerp(left.y, bottom.y, t);
    g.moveTo(lx, ly - h).lineTo(lx, ly).stroke({ color: 0x000000, width: 0.4, alpha: 0.55 });
    const rx = lerp(bottom.x, right.x, t);
    const ry = lerp(bottom.y, right.y, t);
    g.moveTo(rx, ry - h).lineTo(rx, ry).stroke({ color: 0x000000, width: 0.4, alpha: 0.55 });
  }

  // Lobby on front face
  const dx = lerp(bottom.x, right.x, 0.32);
  const dy = lerp(bottom.y, right.y, 0.32);
  g.rect(dx - 5, dy - h * 0.22, 10, h * 0.22).fill({ color: 0x1a1a1a, alpha: 0.85 });
  g.rect(dx - 5, dy - h * 0.04, 10, 1).fill({ color: accent, alpha: 0.85 });

  // Roof edge accent
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: accent, width: 0.6, alpha: 0.6 });
}

/** Shop — small storefront with awning + display window. */
export function drawShop(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { bottom, right } = footprintDiamond(fw, fh);

  // Awning over the front face
  const ax1 = lerp(bottom.x, right.x, 0.1);
  const ay1 = lerp(bottom.y, right.y, 0.1);
  const ax2 = lerp(bottom.x, right.x, 0.9);
  const ay2 = lerp(bottom.y, right.y, 0.9);
  g.poly([
    ax1, ay1 - h * 0.45,
    ax2, ay2 - h * 0.45,
    ax2 + 2, ay2 - h * 0.62,
    ax1 - 2, ay1 - h * 0.62,
  ]).fill({ color: accent, alpha: 0.85 });

  // Storefront window
  g.poly([
    ax1, ay1 - h * 0.38,
    ax2, ay2 - h * 0.38,
    ax2, ay2 - h * 0.1,
    ax1, ay1 - h * 0.1,
  ]).fill({ color: 0xfde68a, alpha: 0.7 });

  // Door on the front
  const dx = lerp(bottom.x, right.x, 0.6);
  const dy = lerp(bottom.y, right.y, 0.6);
  g.rect(dx - 1.3, dy - h * 0.32, 2.6, h * 0.32).fill({ color: 0x1a1a1a });
}

/** Warehouse — long industrial shed with pitched roof + loading docks. */
export function drawWarehouse(g: Graphics, fw: number, fh: number, hTiles: number, faces: FaceColors, accent: number) {
  drawBox3Face(g, fw, fh, hTiles, faces, accent);
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);

  // Corrugated lines across top face along the long axis
  const longCount = Math.max(fw, fh) * 3 + 1;
  for (let i = 1; i < longCount; i++) {
    const t = i / longCount;
    if (fw >= fh) {
      const ax = lerp(left.x, top.x, t);
      const ay = lerp(left.y, top.y, t) - h;
      const bx = lerp(bottom.x, right.x, t);
      const by = lerp(bottom.y, right.y, t) - h;
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ color: 0x000000, width: 0.3, alpha: 0.4 });
    } else {
      const ax = lerp(top.x, right.x, t);
      const ay = lerp(top.y, right.y, t) - h;
      const bx = lerp(left.x, bottom.x, t);
      const by = lerp(left.y, bottom.y, t) - h;
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ color: 0x000000, width: 0.3, alpha: 0.4 });
    }
  }

  // Loading dock doors on the front (bottom-right) face
  const doorCount = Math.max(2, Math.min(4, Math.max(fw, fh)));
  for (let i = 0; i < doorCount; i++) {
    const t = 0.12 + i * (0.76 / Math.max(1, doorCount - 1));
    const dx = lerp(bottom.x, right.x, t);
    const dy = lerp(bottom.y, right.y, t);
    g.poly([dx - 3, dy, dx + 3, dy, dx + 3, dy - h * 0.7, dx - 3, dy - h * 0.7])
      .fill({ color: 0x1a1a1a });
    g.poly([dx - 3, dy, dx + 3, dy, dx + 3, dy - h * 0.7, dx - 3, dy - h * 0.7])
      .stroke({ color: accent, width: 0.4, alpha: 0.55 });
  }

  // Sign band on left face
  const sx1 = lerp(left.x, bottom.x, 0.2);
  const sy1 = lerp(left.y, bottom.y, 0.2);
  const sx2 = lerp(left.x, bottom.x, 0.8);
  const sy2 = lerp(left.y, bottom.y, 0.8);
  g.poly([sx1, sy1 - h * 0.78, sx2, sy2 - h * 0.78, sx2, sy2 - h * 0.62, sx1, sy1 - h * 0.62])
    .fill({ color: accent, alpha: 0.85 });

  // Rooftop vents
  for (let i = 0; i < 3; i++) {
    const t = 0.25 + i * 0.25;
    const cx = lerp(left.x, right.x, t);
    const cy = lerp(left.y, right.y, t);
    g.rect(cx - 1.5, cy - h - 3, 3, 3).fill({ color: 0x4a5468 });
    g.circle(cx, cy - h - 3, 1).fill({ color: 0x1a1a1a });
  }
}

/** Met tower — thin mast with sensor head + anemometer arms. */
export function drawTower(g: Graphics, accent: number) {
  // Concrete base
  g.poly([-8, 0, 0, 4, 8, 0, 0, -4]).fill({ color: 0x3a4256 });
  g.poly([-8, 0, 0, 4, 8, 0, 0, -4]).stroke({ color: 0x000000, width: 0.4, alpha: 0.5 });

  // Mast
  g.rect(-1.5, -64, 3, 64).fill({ color: 0x2a3142 });
  g.rect(-1.5, -64, 1, 64).fill({ color: 0x4a5066 });

  // Cross arms (anemometer)
  g.moveTo(-10, -60).lineTo(10, -60).stroke({ color: 0x4a5066, width: 1 });
  g.circle(-10, -60, 1.5).fill({ color: accent });
  g.circle(10, -60, 1.5).fill({ color: accent });

  // Sensor head
  g.rect(-6, -54, 12, 4).fill({ color: 0x3a4458 });
  g.rect(-6, -54, 12, 1).fill({ color: accent });
  g.circle(0, -50, 2).fill({ color: 0x000000, alpha: 0.8 }).stroke({ color: accent, width: 0.6 });

  // Top antenna
  g.moveTo(0, -64).lineTo(0, -72).stroke({ color: accent, width: 0.8 });
  g.circle(0, -72, 1).fill({ color: accent });
}

/** Tree — round canopy on a small trunk, drawn with two ellipses for depth. */
export function drawTree(g: Graphics) {
  // Trunk
  g.rect(-1.5, -10, 3, 10).fill({ color: 0x3d2818 });
  // Canopy back (darker)
  g.ellipse(0, -20, 10, 12).fill({ color: 0x1f4a26 });
  // Canopy front (lighter)
  g.ellipse(2, -22, 8, 9).fill({ color: 0x2f6a3a });
  // Highlight
  g.ellipse(4, -24, 3, 3).fill({ color: 0x46894f, alpha: 0.8 });
}

/** Bollard — small cone marker. */
export function drawBollard(g: Graphics) {
  g.poly([-3, 0, 3, 0, 2, -8, -2, -8]).fill({ color: 0xc9a85a });
  g.rect(-2, -8, 4, 1).fill({ color: 0xddc07a });
}

/** Fence segment along the iso X axis. */
export function drawFence(g: Graphics, axis: "h" | "v") {
  const len = TILE_W * 0.42;
  const h = 8;
  if (axis === "h") {
    g.rect(-len / 2, -h, len, 1).fill({ color: 0x586071 });
    g.rect(-len / 2, -h, 1, h).fill({ color: 0x363c4d });
    g.rect(len / 2 - 1, -h, 1, h).fill({ color: 0x363c4d });
    g.moveTo(-len / 2 + len * 0.5, -h).lineTo(-len / 2 + len * 0.5, 0).stroke({ color: 0x363c4d, width: 0.5 });
  } else {
    g.rect(-1, -h, 1, h).fill({ color: 0x586071 });
    g.rect(-len / 2, -h / 2, len, 0.6).fill({ color: 0x4a5066 });
  }
}

/** Light pole with glowing tip. */
export function drawLightPole(g: Graphics, accent: number) {
  g.rect(-1, -44, 2, 44).fill({ color: 0x586071 });
  // Arm
  g.moveTo(0, -40).lineTo(8, -42).stroke({ color: 0x586071, width: 1.5 });
  // Lamp
  g.circle(8, -42, 2).fill({ color: accent }).stroke({ color: 0x000000, width: 0.3 });
  // Glow
  g.circle(8, -42, 5).fill({ color: accent, alpha: 0.2 });
}

/** Single-tile hover diamond — used when no multi-tile brush is active. */
export function drawHoverDiamond(g: Graphics, color = 0xc9a85a, w = TILE_W, h = TILE_H) {
  g.poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0])
    .stroke({ color, width: 1.5, alpha: 0.95 })
    .fill({ color, alpha: 0.12 });
}

/** Outline a w×h footprint diamond (centered on origin), used as a build-mode
 *  cursor for multi-tile brushes. */
export function drawFootprintOutline(g: Graphics, footprintW: number, footprintH: number, color = 0xc9a85a, alpha = 0.18) {
  const { top, right, bottom, left } = footprintDiamond(footprintW, footprintH);
  g.poly([top.x, top.y, right.x, right.y, bottom.x, bottom.y, left.x, left.y])
    .fill({ color, alpha })
    .stroke({ color, width: 1.5, alpha: 0.95 });
}

/** Structure dispatch — given a kind, draw it into Graphics. */
export function drawStructure(g: Graphics, kind: StructureKind, accentOverride?: number) {
  const def = STRUCTURE_DEFS[kind];
  const accent = accentOverride ?? def.accent ?? 0xffffff;

  switch (kind) {
    case "panel_array_ns":
      drawPanelArray(g, def.footprint.w, def.footprint.h, accent);
      return;
    case "panel_array_ew":
      drawPanelArray(g, def.footprint.w, def.footprint.h, accent);
      return;
    case "tower":
      drawTower(g, accent);
      return;
    case "comm_tower":
      drawCommTower(g, accent);
      return;
    case "power_pylon":
      drawPowerPylon(g, accent);
      return;
    case "control_building":
      drawControlBuilding(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "substation":
      drawSubstation(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "warehouse":
      drawWarehouse(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "skyscraper":
      drawSkyscraper(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "apartment":
      drawApartment(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "office_block":
      drawOfficeBlock(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "shop":
      drawShop(g, def.footprint.w, def.footprint.h, def.height, def.faces, accent);
      return;
    case "tree":
      drawTree(g);
      return;
    case "bollard":
      drawBollard(g);
      return;
    case "fence_h":
      drawFence(g, "h");
      return;
    case "fence_v":
      drawFence(g, "v");
      return;
    case "light_pole":
      drawLightPole(g, accent);
      return;
    default:
      drawBox3Face(g, def.footprint.w, def.footprint.h, def.height, def.faces, def.accent);
      // Add type-specific embellishments
      addStructureDetail(g, kind, def.footprint.w, def.footprint.h, def.height);
  }
}

function addStructureDetail(
  g: Graphics,
  kind: StructureKind,
  fw: number,
  fh: number,
  hTiles: number,
) {
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);
  // Center of the top face (lifted by h)
  const topY = -h;

  switch (kind) {
    case "inverter": {
      // Vents on right face — runs along the right-front diagonal
      for (let i = 0; i < 3; i++) {
        const t = 0.18 + i * 0.16;
        const x1 = lerp(bottom.x, right.x, t);
        const y1 = lerp(bottom.y, right.y, t) - h + 4;
        const x2 = lerp(bottom.x, right.x, t + 0.1);
        const y2 = lerp(bottom.y, right.y, t + 0.1) - h + 4;
        g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0x000000, width: 1.4, alpha: 0.6 });
      }
      // Display panel near the left-front edge
      const dispX = lerp(left.x, bottom.x, 0.55);
      const dispY = lerp(left.y, bottom.y, 0.55) - h * 0.7;
      g.rect(dispX - 5, dispY, 10, 3).fill({ color: 0x000000, alpha: 0.7 });
      g.rect(dispX - 4, dispY + 0.5, 5, 2).fill({ color: 0x34d399, alpha: 0.7 });
      return;
    }
    case "transformer": {
      for (let i = -1; i <= 1; i++) {
        g.circle(i * 5, topY - 2, 1.5).fill({ color: 0xeab308 });
        g.moveTo(i * 5, topY - 2).lineTo(i * 5, topY - 8).stroke({ color: 0xeab308, width: 0.7 });
      }
      return;
    }
    case "meter": {
      g.rect(-6, topY + 2, 12, 4).fill({ color: 0x000000, alpha: 0.6 });
      g.rect(-5, topY + 3, 5, 2).fill({ color: 0x3b82f6, alpha: 0.7 });
      return;
    }
    case "depot": {
      // Pitched roof ridge between left-back and right-back edges
      g.moveTo(top.x, topY - 6).lineTo(left.x, topY + 1).stroke({ color: 0xd97706, width: 1, alpha: 0.6 });
      g.moveTo(top.x, topY - 6).lineTo(right.x, topY + 1).stroke({ color: 0xd97706, width: 1, alpha: 0.6 });
      // Door on the front (bottom) face — small dark rectangle
      const dx = lerp(bottom.x, right.x, 0.25);
      const dy = lerp(bottom.y, right.y, 0.25);
      g.poly([dx - 3, dy, dx + 3, dy, dx + 3, dy - h * 0.45, dx - 3, dy - h * 0.45])
        .fill({ color: 0x2a2218, alpha: 0.85 });
      return;
    }
    case "combiner": {
      g.rect(-4, topY + 2, 8, 3).fill({ color: 0x000000, alpha: 0.6 });
      return;
    }
    case "battery": {
      // Stripe of cells across the top face — fit within the top diamond
      // For 2x1: top diamond half-width ≈ (w+h)*W/4 = 48; place cells along the long axis
      const cellCount = Math.max(fw, fh) * 2 + 1;
      for (let i = 0; i < cellCount; i++) {
        const t = (i + 0.5) / cellCount;
        const cx = lerp(left.x, right.x, t);
        const cy = lerp(left.y, right.y, t);
        g.rect(cx - 2, cy + topY - 2, 4, 5).fill({ color: 0xa855f7, alpha: 0.5 });
      }
      return;
    }
  }
}

// ────────────────────────── helpers ──────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function frac(n: number) {
  return n - Math.floor(n);
}
