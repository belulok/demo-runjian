import * as THREE from "three";

/* ============================================================
   Procedural PBR texture generator.

   Every large surface in the world (terrain, asphalt, concrete
   pads, sand, water) gets a tiling albedo + normal (+ roughness)
   map generated from value-noise fbm. This is what separates a
   "flat low-poly plane" from something that reads as a real
   material under grazing light — the normal map gives micro-relief
   that the directional sun + AO can bite into.

   All textures are generated from typed arrays (no canvas / DOM),
   so this is safe to import anywhere, and memoised by key so we
   only pay the generation cost once per material.
   ============================================================ */

export interface PBRSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

/* ---------- seeded value-noise fbm ---------- */

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
}

/** Tiling fbm — wraps the lattice at `period` so the texture seams match. */
function fbm(x: number, y: number, seed: number, octaves: number, period: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const p = period * freq;
    // wrap coords into [0,p) so opposite edges sample identical lattice points
    const wx = ((x * freq) % p + p) % p;
    const wy = ((y * freq) % p + p) % p;
    sum += valueNoise(wx, wy, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/* ---------- builders ---------- */

interface PBROpts {
  key: string;
  size?: number;
  repeat?: [number, number];
  /** base albedo 0-255 */
  base: [number, number, number];
  /** per-channel albedo variance amplitude 0-255 */
  variance: [number, number, number];
  /** macro colour blotch amplitude (low-freq) */
  macro?: [number, number, number];
  /** texture frequency in lattice cells across the tile */
  freq?: number;
  octaves?: number;
  /** base roughness 0-1 and its variance */
  rough?: number;
  roughVar?: number;
  /** bump height → normal strength */
  normalStrength?: number;
  seed?: number;
}

const cache = new Map<string, PBRSet>();

function configure(tex: THREE.Texture, repeat: [number, number], srgb: boolean) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
}

export function buildPBR(opts: PBROpts): PBRSet {
  const cached = cache.get(opts.key);
  if (cached) return cached;

  const size = opts.size ?? 256;
  const freq = opts.freq ?? 24;
  const octaves = opts.octaves ?? 5;
  const seed = opts.seed ?? 1;
  const macro = opts.macro ?? [0, 0, 0];
  const rough = opts.rough ?? 0.9;
  const roughVar = opts.roughVar ?? 0.1;
  const ns = opts.normalStrength ?? 2;

  const albedo = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const fx = (x / size) * freq;
      const fy = (y / size) * freq;
      const n = fbm(fx, fy, seed, octaves, freq);
      const m = fbm(fx * 0.18, fy * 0.18, seed + 91, 3, freq * 0.18); // macro blotches
      const detail = n - 0.5;
      const macroD = m - 0.5;

      const r = THREE.MathUtils.clamp(opts.base[0] + detail * opts.variance[0] + macroD * macro[0], 0, 255);
      const g = THREE.MathUtils.clamp(opts.base[1] + detail * opts.variance[1] + macroD * macro[1], 0, 255);
      const b = THREE.MathUtils.clamp(opts.base[2] + detail * opts.variance[2] + macroD * macro[2], 0, 255);

      const p = i * 4;
      albedo[p] = r;
      albedo[p + 1] = g;
      albedo[p + 2] = b;
      albedo[p + 3] = 255;

      const rgh = THREE.MathUtils.clamp(rough + detail * roughVar, 0, 1) * 255;
      roughData[p] = roughData[p + 1] = roughData[p + 2] = rgh;
      roughData[p + 3] = 255;

      height[i] = n;
    }
  }

  // Sobel-ish normal from height (wrapping for seamless tiling)
  const normalData = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => height[((y % size) + size) % size * size + (((x % size) + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hl = at(x - 1, y);
      const hr = at(x + 1, y);
      const hd = at(x, y - 1);
      const hu = at(x, y + 1);
      let nx = (hl - hr) * ns;
      let ny = (hd - hu) * ns;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      const p = (y * size + x) * 4;
      normalData[p] = (nx * 0.5 + 0.5) * 255;
      normalData[p + 1] = (ny * 0.5 + 0.5) * 255;
      normalData[p + 2] = (nz / len * 0.5 + 0.5) * 255;
      normalData[p + 3] = 255;
    }
  }

  const map = new THREE.DataTexture(albedo, size, size, THREE.RGBAFormat);
  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  configure(map, opts.repeat ?? [1, 1], true);
  configure(normalMap, opts.repeat ?? [1, 1], false);
  configure(roughnessMap, opts.repeat ?? [1, 1], false);
  map.generateMipmaps = normalMap.generateMipmaps = roughnessMap.generateMipmaps = true;
  map.minFilter = normalMap.minFilter = roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;

  const set: PBRSet = { map, normalMap, roughnessMap };
  cache.set(opts.key, set);
  return set;
}

/* ---------- preset materials ---------- */

export const grassTextures = () =>
  buildPBR({
    key: "grass",
    size: 256,
    repeat: [42, 42],
    base: [86, 122, 64],
    variance: [44, 60, 36],
    macro: [30, 46, 26],
    freq: 40,
    octaves: 6,
    rough: 0.96,
    roughVar: 0.06,
    normalStrength: 2.4,
    seed: 7,
  });

export const fieldTextures = () =>
  buildPBR({
    key: "field",
    size: 256,
    repeat: [10, 10],
    base: [104, 132, 70],
    variance: [30, 40, 26],
    macro: [40, 50, 30],
    freq: 18,
    octaves: 5,
    rough: 0.95,
    roughVar: 0.08,
    normalStrength: 1.8,
    seed: 23,
  });

export const asphaltTextures = () =>
  buildPBR({
    key: "asphalt",
    size: 256,
    repeat: [8, 8],
    base: [46, 49, 56],
    variance: [26, 26, 28],
    macro: [10, 10, 12],
    freq: 60,
    octaves: 5,
    rough: 0.88,
    roughVar: 0.16,
    normalStrength: 1.4,
    seed: 41,
  });

export const concreteTextures = () =>
  buildPBR({
    key: "concrete",
    size: 256,
    repeat: [4, 4],
    base: [180, 182, 186],
    variance: [22, 22, 24],
    macro: [26, 26, 28],
    freq: 28,
    octaves: 5,
    rough: 0.82,
    roughVar: 0.14,
    normalStrength: 1.1,
    seed: 53,
  });

export const sandTextures = () =>
  buildPBR({
    key: "sand",
    size: 256,
    repeat: [6, 6],
    base: [206, 188, 150],
    variance: [22, 22, 24],
    macro: [20, 18, 16],
    freq: 46,
    octaves: 5,
    rough: 0.98,
    roughVar: 0.05,
    normalStrength: 1.6,
    seed: 67,
  });

/* ---------- water ripple normal map ---------- */

let waterNormalCache: THREE.Texture | null = null;

/** Animated-looking ripple normal map built from layered sine waves.
 *  Feeds MeshReflectorMaterial's normalMap for a believable water surface. */
export function waterNormalMap(): THREE.Texture {
  if (waterNormalCache) return waterNormalCache;
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const waves = [
    { ax: 6, ay: 2, amp: 1.0, ph: 0 },
    { ax: 3, ay: 7, amp: 0.7, ph: 1.3 },
    { ax: 11, ay: 9, amp: 0.4, ph: 2.1 },
    { ax: 8, ay: 14, amp: 0.25, ph: 0.7 },
  ];
  const TWO_PI = Math.PI * 2;
  const heightAt = (u: number, v: number) => {
    let h = 0;
    for (const w of waves) {
      h += Math.sin((u * w.ax + v * w.ay) * TWO_PI + w.ph) * w.amp;
    }
    return h;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const e = 1 / size;
      const hl = heightAt(u - e, v);
      const hr = heightAt(u + e, v);
      const hd = heightAt(u, v - e);
      const hu = heightAt(u, v + e);
      let nx = (hl - hr) * 0.5;
      let ny = (hd - hu) * 0.5;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      const p = (y * size + x) * 4;
      data[p] = (nx * 0.5 + 0.5) * 255;
      data[p + 1] = (ny * 0.5 + 0.5) * 255;
      data[p + 2] = (nz / len * 0.5 + 0.5) * 255;
      data[p + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  waterNormalCache = tex;
  return tex;
}
