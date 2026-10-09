/**
 * Lanternfall Meadow malen (Runde 11 / P3). Reine Funktionen auf Index-Puffern, in Node und Browser gleich:
 *   ground  - Gras, Weg, Ufer, Wasser-Grundton, Schatten (undurchsichtig, einmal gemalt)
 *   water   - 6 Bildfolgen des Bachs (nur Wasserpixel), laufen als eigene Ebene
 *   deco    - Bruecken, Zaeune, Uferschmuck (liegt ueber dem Wasser, unter allen Figuren)
 *   props   - Baeume, Haeuser ... einzeln, damit sie nach y mit Figuren sortiert werden koennen
 * Nur Palettenfarben (Index-Puffer). Licht von oben links, Westen violett, Osten warm.
 */
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { BRIDGES, FENCES, MAP_H, MAP_W, PATH, PATH_HW, PROPS, STREAM, pathDist, waterDist, type Prop } from './layout';
import { propArt, windmillBlades, type PropArt } from './props';

export const WATER_FRAMES = 6;

export interface PlacedProp { prop: Prop; art: PropArt }
export interface MeadowArt {
  ground: Buf;
  water: Buf[];
  deco: Buf;
  props: PlacedProp[];
  /** Lichtquellen (Laternen): Mittelpunkt in px */
  lights: { x: number; y: number; r: number; warm: boolean }[];
  flags: { x: number; y: number }[];
  smoke: { x: number; y: number }[];
  mill: { x: number; y: number };
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// ------------------------------------------------------------------ Gras
function grassTone(x: number, y: number): number {
  const n = fbm(x, y, 3);
  const wx = clamp01((150 - x) / 150); // Westen: Daemmerung
  const ex = clamp01((x - 500) / 140); // Osten: warm
  let lit = n - 0.5 + ex * 0.1 - wx * 0.18;
  lit += (bayer(x, y) - 0.5) * 0.09;
  // grosse Lichtflecken (Sonne zwischen den Wolken)
  lit += (vnoise(x, y, 70, 9) - 0.5) * 0.18;
  let c: number;
  if (lit > 0.14) c = C.leaf;
  else if (lit > -0.09) c = C.grass;
  else if (lit > -0.2) c = bayer(x + 1, y) < 0.5 ? C.grass : C.pine;
  else c = C.pine;
  // Westen: kuehle Toene
  if (wx > 0.2 && c === C.pine && bayer(x + 2, y + 1) < wx * 0.55) c = C.deep;
  if (wx > 0.5 && (c === C.pine || c === C.deep) && fbm(x + 40, y, 21) > 0.55 && bayer(x, y + 2) < (wx - 0.4) * 0.9) c = C.violet;
  if (wx > 0.62 && c === C.violet && bayer(x + 3, y) < (wx - 0.5)) c = C.plum;
  return c;
}

function tuft(g: Buf, x: number, y: number, r: () => number): void {
  const type = Math.floor(r() * 3);
  const base = g.get(x, y);
  const dark = shadeIdx(base), light = base === C.leaf ? C.yellow : C.leaf;
  if (type === 0) {
    g.set(x, y, dark); g.set(x - 1, y - 1, dark); g.set(x + 1, y - 1, dark);
    g.set(x, y - 1, light); g.set(x, y - 2, light);
  } else if (type === 1) {
    g.set(x, y, dark); g.set(x - 1, y, dark); g.set(x + 1, y, dark);
    g.set(x - 1, y - 1, light); g.set(x + 1, y - 2, light); g.set(x, y - 1, base === C.leaf ? C.grass : light);
  } else {
    g.set(x, y, dark); g.set(x + 1, y, dark);
    g.set(x, y - 1, light); g.set(x + 1, y - 2, light);
  }
}

const FLOWER_COLS = [C.white, C.yellow, C.coral, C.sky, C.orchid, C.white, C.yellow];

// ------------------------------------------------------------------ Weg
function pathColor(x: number, y: number, pd: number, gx: number, gy: number): number | null {
  if (pd > PATH_HW + 2.2) return null;
  const n = vnoise(x, y, 3.5, 21) * 0.7 + hash2(x, y, 22) * 0.3;
  const lit = -(gx * 0.6 + gy * 0.8); // >0: Rand schaut nach oben links (Licht)
  // Kern: Erde, in der Mitte heller (ausgetreten), Raender dunkler
  if (pd <= PATH_HW - 0.6) {
    const edge = pd / PATH_HW; // 0 Mitte .. 1 Rand
    let c = C.tan;
    if (edge < 0.7 && n > 0.62 + edge * 0.25) c = C.peach;
    if (edge < 0.3 && n > 0.78) c = C.sand;
    if (n < 0.2 && edge > 0.3) c = C.wood;
    if (edge > 0.62) c = bayer(x, y) < (edge - 0.62) * 2.1 ? C.wood : C.tan;
    if (edge > 0.9 && lit < 0) c = bayer(x + 1, y) < 0.65 ? C.bark : C.wood; // Schattenseite
    if (edge > 0.9 && lit > 0) c = bayer(x, y + 1) < 0.5 ? C.peach : C.tan;
    // Spurrillen
    if (pd > 3.6 && pd < 5.0 && n < 0.55 && ((x + y) & 1) === 0) c = C.wood;
    // Steinchen
    const hs = hash2(x, y, 5);
    if (hs > 0.987) c = C.sand;
    else if (hs < 0.012) c = C.wood;
    return c;
  }
  // Rand (Lippe)
  if (pd <= PATH_HW + 0.9) return lit > 0.25 ? C.sand : lit > -0.25 ? C.wood : C.bark;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.wood : C.tan) : C.plum;
}

// ------------------------------------------------------------------ Malen
export function paintMeadow(): MeadowArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const pdArr = new Float32Array(W * H);
  const wdArr = new Float32Array(W * H).fill(99);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    pdArr[y * W + x] = pathDist(x + 0.5, y + 0.5);
    if (x > 262 && x < 470) wdArr[y * W + x] = waterDist(x + 0.5, y + 0.5);
  }
  const PD = (x: number, y: number): number => pdArr[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const WD = (x: number, y: number): number => wdArr[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];

  // 1) Gras, Weg, Ufer
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wd = WD(x, y);
    if (wd <= 0.4) { ground.set(x, y, C.sky); continue; }
    const pd = PD(x, y);
    const gx = (PD(x + 1, y) - PD(x - 1, y)) / 2, gy = (PD(x, y + 1) - PD(x, y - 1)) / 2;
    const pc = pd <= PATH_HW + 2.2 ? pathColor(x, y, pd, gx, gy) : null;
    if (pc && !(wd < 1.2 && pd > PATH_HW)) { ground.set(x, y, pc); continue; }
    let c = grassTone(x, y);
    // Kontaktschatten des Wegs auf der Schattenseite
    if (pd < PATH_HW + 4.2 && pd > PATH_HW + 2 && -(gx * 0.6 + gy * 0.8) < -0.25 && bayer(x, y) < 0.7) c = shadeIdx(c);
    // Ufer: nasser Sand, aussen Grasrand
    if (wd < 5) {
      const wx = (WD(x + 1, y) - WD(x - 1, y)) / 2, wy = (WD(x, y + 1) - WD(x, y - 1)) / 2;
      const lit = -(wx * 0.6 + wy * 0.8);
      if (wd < 1.8) c = lit > 0.2 ? C.sand : lit > -0.3 ? C.tan : C.wood;
      else if (wd < 3.2) c = bayer(x, y) < 0.55 + lit * 0.2 ? (lit > 0 ? C.sand : C.tan) : (lit > 0 ? C.leaf : C.grass);
      else if (wd < 4.6 && bayer(x + 1, y + 1) < 0.35) c = lit > 0 ? C.tan : C.pine;
    }
    ground.set(x, y, c);
  }

  // 2) Bueschel und Blumen (fester Seed), nur auf Gras
  const r = rng(20261009);
  const isGrass = (x: number, y: number): boolean => WD(x, y) > 5.5 && PD(x, y) > PATH_HW + 4;
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(r() * (W - 4)) + 2, y = Math.floor(r() * (H - 6)) + 4;
    if (isGrass(x, y)) tuft(ground, x, y, r);
  }
  for (let k = 0; k < 120; k++) {
    const cx = r() * W, cy = r() * H;
    if (!isGrass(Math.round(cx), Math.round(cy))) continue;
    const col = FLOWER_COLS[Math.floor(r() * FLOWER_COLS.length)];
    const n = 3 + Math.floor(r() * 5);
    for (let j = 0; j < n; j++) {
      const x = Math.round(cx + (r() - 0.5) * 18), y = Math.round(cy + (r() - 0.5) * 10);
      if (!isGrass(x, y)) continue;
      ground.set(x, y + 1, C.grass);
      ground.set(x, y, col);
      if (j % 4 === 0) { ground.set(x - 1, y, col); ground.set(x + 1, y, col); ground.set(x, y - 1, col); ground.set(x, y, col === C.yellow ? C.orange : C.yellow); }
    }
  }
  // Steine am Wegrand ("Randsteine")
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    const pd = PD(x, y);
    if (pd < PATH_HW + 0.8 || pd > PATH_HW + 2.8 || WD(x, y) < 2) continue;
    if (hash2(x >> 2, y >> 2, 31) > 0.5) continue;
    ground.set(x, y, C.silver); ground.set(x + 1, y, C.stone); ground.set(x, y + 1, C.slate); ground.set(x + 1, y + 1, C.slate);
  }
  // Fussspuren im Weg (kleine Doppelpunkte)
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    if (PD(x, y) > PATH_HW - 3 || WD(x, y) < 3) continue;
    ground.set(x, y, C.wood); ground.set(x + 2, y + 1, C.wood);
  }

  // 3) Schatten der Dinge auf dem Boden
  const props = [...PROPS].sort((a, b) => a.y - b.y).map((prop) => ({ prop, art: propArt(prop) }));
  const shade = new Uint8Array(W * H);
  for (const { prop, art } of props) {
    const { ox, oy, rx, ry } = art.shadow;
    const cx = prop.x + ox, cy = prop.y + oy;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
      if (d < 0.7 || (d < 1 && bayer(x, y) < 0.5)) shade[y * W + x] = 1;
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!shade[y * W + x]) continue;
    const c = ground.get(x, y);
    if (c !== C.sky) ground.set(x, y, shadeIdx(c));
  }
  // Waldrand: dunkler Schleier im Westen, Raender (Vignette)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    const wx = clamp01((44 - x) / 44);
    const v = e < 14 ? (14 - e) / 14 * 0.7 : 0;
    if (v + wx * 0.5 > 0 && bayer(x, y) < Math.max(v, wx * 0.8) && ground.get(x, y) !== C.sky) ground.set(x, y, shadeIdx(ground.get(x, y)));
  }

  // 4) Lichtpfuetzen unter den Laternen (heller Gras-/Wegton, gedithert)
  const lights: MeadowArt['lights'] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'lamp') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -19), r: 26, warm: true });
    else if (prop.kind === 'shrine') lights.push({ x: prop.x, y: prop.y - 12, r: 18, warm: false });
    else if (prop.kind === 'house' || prop.kind === 'cottage') lights.push({ x: prop.x + 6, y: prop.y - 10, r: 16, warm: true });
    else if (prop.kind === 'gatetower') lights.push({ x: prop.x, y: prop.y - 24, r: 24, warm: true });
  }
  for (const L of lights.filter((l) => l.warm && l.r >= 24)) {
    const ly = L.y + 14;
    for (let y = Math.floor(ly - 15); y <= ly + 15; y++) for (let x = Math.floor(L.x - 20); x <= L.x + 20; x++) {
      const d = Math.hypot((x - L.x) / 20, (y - ly) / 13);
      if (d >= 1 || x < 0 || y < 0 || x >= W || y >= H) continue;
      if (bayer(x, y) < (1 - d) * 0.8) {
        const c = ground.get(x, y);
        if (c === C.grass) ground.set(x, y, C.leaf);
        else if (c === C.leaf) ground.set(x, y, C.yellow);
        else if (c === C.tan || c === C.wood) ground.set(x, y, c === C.tan ? C.peach : C.tan);
        else if (c === C.peach) ground.set(x, y, C.sand);
        else if (c === C.pine) ground.set(x, y, C.grass);
      }
    }
  }

  // 5) Stadtseite: gepflasterter Streifen am Ostrand
  paintTownEdge(ground, PD);

  const deco = new Buf(W, H);
  paintBridges(deco, WD);
  paintFences(deco);
  paintWaterEdge(deco, WD);
  const water = Array.from({ length: WATER_FRAMES }, (_, f) => paintWater(f, WD));

  const flags = props.filter((p) => p.prop.kind === 'gatetower').map((p) => ({ x: p.prop.x + (p.art.hook?.x ?? 0), y: p.prop.y + (p.art.hook?.y ?? 0) }));
  const smoke = props.filter((p) => p.prop.kind === 'house' || p.prop.kind === 'cottage').map((p) => ({ x: p.prop.x + (p.prop.kind === 'house' ? 8 : 8), y: p.prop.y - (p.prop.kind === 'house' ? 36 : 31) }));
  const mp = props.find((p) => p.prop.kind === 'windmill');
  const mill = mp ? { x: mp.prop.x, y: mp.prop.y + (mp.art.hook?.y ?? 0) } : { x: 0, y: 0 };
  return { ground, water, deco, props, lights, flags, smoke, mill };
}

function paintTownEdge(g: Buf, PD: (x: number, y: number) => number): void {
  for (let y = 0; y < MAP_H; y++) for (let x = 604; x < MAP_W; x++) {
    const pd = PD(x, y);
    const f = (x - 604) / 36;
    if (pd <= PATH_HW + 1.5) continue;
    // Pflaster: Kopfstein-Muster, nach rechts dichter
    if (bayer(x >> 1, y >> 1) < f * 1.15) {
      const row = y >> 2, off = (row & 1) * 3;
      const stone = (x + off) % 6 === 0 || y % 4 === 0;
      const h = hash2((x + off) / 6 | 0, row, 3);
      g.set(x, y, stone ? C.slate : h > 0.66 ? C.silver : h > 0.3 ? C.stone : C.silver);
    }
  }
  // Weg im Torbereich als Pflaster (letzte 56 px)
  for (let y = 146; y < 175; y++) for (let x = 584; x < MAP_W; x++) {
    const f = (x - 584) / 56;
    if (PD(x, y) > PATH_HW - 0.5 || bayer(x, y) > f * 1.2) continue;
    const row = y >> 2, off = (row & 1) * 3;
    const stone = (x + off) % 6 === 0 || y % 4 === 0;
    g.set(x, y, stone ? C.tan : hash2((x + off) / 6 | 0, row, 4) > 0.5 ? C.sand : C.peach);
  }
}

// ------------------------------------------------------------------ Wasser
function paintWater(f: number, WD: (x: number, y: number) => number): Buf {
  const b = new Buf(MAP_W, MAP_H);
  for (let y = 0; y < MAP_H; y++) for (let x = 262; x < 470; x++) {
    const wd = WD(x, y);
    if (wd > 0.4) continue;
    const depth = -wd;
    const wx = (WD(x + 1, y) - WD(x - 1, y)) / 2, wy = (WD(x, y + 1) - WD(x, y - 1)) / 2;
    const side = -(wx * 0.6 + wy * 0.8); // >0: Ufer links/oben, wirft Schatten aufs Wasser
    let c = C.sky;
    if (depth < 1.6) c = C.ice; // seichter Rand
    else if (depth < 3.2) c = bayer(x, y) < 0.5 ? C.ice : C.sky;
    // Schatten des Ufers (Licht von links oben)
    if (side > 0.35 && depth < 5.5 && bayer(x, y + 1) < 0.65) c = c === C.ice ? C.sky : C.navy;
    // tiefes Wasser in der Mitte
    if (depth > 6.5 && bayer(x + 2, y) < 0.18 + (vnoise(x, y, 12, 4) - 0.4) * 0.5) c = C.navy;
    // Stroemungsstreifen (laufen nach unten, schliessen nach WATER_FRAMES Bildern)
    const col = hash2(x, 7, 5);
    const ph = Math.floor(hash2(x, 0, 6) * 24);
    const len = 2 + Math.floor(hash2(x, 1, 7) * 4);
    const yy = (((y - f * 4 + ph) % 24) + 24) % 24;
    if (col < 0.5 && yy < len && depth > 2 && vnoise(x, y, 14, 2) > 0.4) c = yy === 0 && col < 0.18 ? C.white : C.ice;
    // Funkeln
    if (hash2(x + f * 31, y + f * 17, 9) > 0.9965 && depth > 2) c = C.white;
    // Schaum am Ufer
    if (depth < 1.5) {
      const foam = vnoise(x + f * 3, y - f * 4 * 0 + f * 1.5, 3.2, 12);
      if (foam > 0.62 - (side > 0 ? 0 : 0.08)) c = C.white;
      else if (depth < 0.9) c = C.silver;
    }
    b.set(x, y, c);
  }
  // Seerosen
  for (const [lx, ly] of [[333, 130], [381, 154], [387, 232], [394, 276], [352, 120]] as const) {
    const bob = f % 3 === 0 ? 0 : 0;
    if (WD(lx, ly) < -3) {
      b.ellipse(lx, ly + bob, 3, 2, C.grass);
      b.set(lx - 1, ly + bob - 1, C.leaf);
      b.set(lx + 1, ly + bob, C.pine);
      b.set(lx + 3, ly + bob, C.sky);
      if ((lx + ly) % 2 === 0) { b.set(lx, ly - 1, C.coral); b.set(lx + 1, ly - 1, C.white); }
    }
  }
  // Steine im Wasser mit Gischt
  for (const [sx, sy] of [[304, 41], [371, 190], [392, 262]] as const) {
    if (WD(sx, sy) < -4) {
      b.ellipse(sx, sy, 3, 2, C.stone);
      b.set(sx - 1, sy - 1, C.silver);
      b.set(sx + 1, sy + 1, C.slate);
      b.set(sx - 4 + (f % 3), sy + 3, C.white);
      b.set(sx + 3 - (f % 2), sy + 3, C.white);
    }
  }
  return b;
}

/** Uferschmuck: Steine und Gras, die ueber das Wasser ragen (statisch). */
function paintWaterEdge(d: Buf, WD: (x: number, y: number) => number): void {
  const r = rng(555);
  for (let i = 0; i < 90; i++) {
    const s = STREAM[Math.floor(r() * STREAM.length)];
    if (s.y < 4 || s.y > MAP_H - 4) continue;
    const side = r() < 0.5 ? 1 : -1;
    const x = Math.round(s.x + s.nx * side * (s.hw + 1.5)), y = Math.round(s.y + s.ny * side * (s.hw + 1.5));
    if (WD(x, y) < -1 || BRIDGES.some((b) => Math.abs(y - b.y) < 20)) continue;
    if (r() < 0.55) { d.set(x, y, C.silver); d.set(x + 1, y, C.stone); d.set(x, y + 1, C.slate); d.set(x + 1, y + 1, C.slate); }
    else { d.set(x, y, C.leaf); d.set(x, y - 1, C.leaf); d.set(x + 1, y - 2, C.grass); d.set(x - 1, y - 2, C.leaf); d.set(x + 1, y, C.pine); }
  }
}

// ------------------------------------------------------------------ Bruecken und Zaeune
function paintBridges(d: Buf, WD: (x: number, y: number) => number): void {
  for (const br of BRIDGES) {
    const x0 = br.x - br.hw - 5, x1 = br.x + br.hw + 5, y0 = br.y - 15, y1 = br.y + 15;
    // Schatten aufs Wasser
    for (let y = y0 + 3; y <= y1 + 4; y++) for (let x = x0 + 1; x <= x1 + 2; x++) if (WD(x, y) < 0 && (x >= x0 && x <= x1 ? y > y1 - 1 || bayer(x, y) < 0.8 : bayer(x, y) < 0.5)) d.set(x, y, C.navy);
    // Bohlen (quer zur Gehrichtung)
    for (let x = x0; x <= x1; x++) {
      for (let y = y0 + 3; y <= y1 - 3; y++) {
        const plank = Math.floor((x - x0) / 3);
        const sep = (x - x0) % 3 === 2;
        const wob = hash2(plank, y >> 3, 8) > 0.82;
        let c = sep ? C.bark : (plank % 2 ? C.wood : C.tan);
        if (!sep && (x - x0) % 3 === 0) c = plank % 2 ? C.tan : C.peach;
        if (wob && !sep && y % 5 === 0) c = C.bark; // Astloch
        d.set(x, y, c);
      }
    }
    // Gelaender oben und unten
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      d.set(x, y0, C.plum); d.set(x, y0 + 1, C.tan); d.set(x, y0 + 2, C.wood); d.set(x, y0 + 3, C.bark);
      d.set(x, y1 - 3, C.plum); d.set(x, y1 - 2, C.tan); d.set(x, y1 - 1, C.wood); d.set(x, y1, C.bark); d.set(x, y1 + 1, C.plum);
    }
    // Pfosten
    for (const px of [x0 - 1, br.x - 3, x1 - 1]) {
      for (const [py, top] of [[y0 - 3, true], [y1 - 4, false]] as const) {
        d.rect(px, py, 4, 7, C.bark);
        d.rect(px, py, 1, 7, C.wood);
        d.rect(px, py - 1, 4, 1, top ? C.tan : C.peach);
        d.set(px, py - 2, C.plum);
      }
    }
  }
}

function paintFences(d: Buf): void {
  for (const f of FENCES) {
    for (let i = 1; i < f.pts.length; i++) {
      const [ax, ay] = f.pts[i - 1], [bx, by] = f.pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.round(len / 8));
      const horiz = Math.abs(bx - ax) >= Math.abs(by - ay);
      if (horiz) {
        d.rect(Math.min(ax, bx), ay - 5, Math.abs(bx - ax) + 1, 1, C.tan);
        d.rect(Math.min(ax, bx), ay - 4, Math.abs(bx - ax) + 1, 1, C.bark);
        d.rect(Math.min(ax, bx), ay - 2, Math.abs(bx - ax) + 1, 1, C.tan);
        d.rect(Math.min(ax, bx), ay - 1, Math.abs(bx - ax) + 1, 1, C.bark);
      } else {
        d.rect(ax - 1, Math.min(ay, by), 1, Math.abs(by - ay) + 1, C.tan);
        d.rect(ax + 1, Math.min(ay, by), 1, Math.abs(by - ay) + 1, C.bark);
      }
      for (let k = 0; k <= n; k++) {
        const x = Math.round(ax + ((bx - ax) * k) / n), y = Math.round(ay + ((by - ay) * k) / n);
        d.rect(x - 1, y - 7, 3, 8, C.wood);
        d.rect(x - 1, y - 7, 1, 8, C.tan);
        d.rect(x + 1, y - 7, 1, 8, C.bark);
        d.set(x, y - 8, C.tan);
        d.rect(x - 2, y + 1, 5, 1, C.pine);
      }
    }
  }
}

// ------------------------------------------------------------------ Bewegte Kleinteile
/** Fahne (24 x 14), 4 Wehfolgen: weht nach rechts, Laterne als Wappen. */
export function flagFrame(f: number): Buf {
  const b = new Buf(26, 16);
  for (let x = 0; x < 22; x++) {
    const off = Math.round(Math.sin((x / 22) * Math.PI * 1.6 + (f * Math.PI) / 2) * (1 + x / 9));
    const h = 10 - Math.floor(x / 9);
    for (let y = 0; y < h; y++) {
      const yy = 2 + y + off;
      let c = y === 0 ? C.crimson : y > h - 3 ? C.crimson : C.red;
      if (x > 9 && x < 15 && y > 2 && y < h - 2) c = C.amber; // kleine Laterne
      if (x === 11 && y === 4) c = C.yellow;
      b.set(x, yy, c);
    }
  }
  b.outline(C.plum);
  return b;
}

export { windmillBlades };
export const MILL_STEPS = 8;
