/** Isometric tile math — 2:1 projection. */

export const TILE_W = 80;
export const TILE_H = 40;

export type Cell = { col: number; row: number };

export function cellToScreen(cell: Cell): { x: number; y: number } {
  return {
    x: (cell.col - cell.row) * (TILE_W / 2),
    y: (cell.col + cell.row) * (TILE_H / 2),
  };
}

export function screenToCell(x: number, y: number): Cell {
  const col = (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2;
  const row = (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

/** Returns the 4 corners of a tile diamond for Pixi Graphics. */
export function tileDiamond(cell: Cell) {
  const { x, y } = cellToScreen(cell);
  return [
    { x, y: y - TILE_H / 2 },           // top
    { x: x + TILE_W / 2, y },            // right
    { x, y: y + TILE_H / 2 },            // bottom
    { x: x - TILE_W / 2, y },            // left
  ];
}
