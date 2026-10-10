/**
 * Gemeinsames Werkzeug der drei Karten aus Runde 16 / K2 (Ashra Dunes, Gloomharbor, Duskspire Keep):
 * Laenge/Ausgleich der Wegaeste, Rechtecke -> Blocker, Schatten, Lichtpfuetzen, Vignette, Streu-Platzierung.
 * Reine Funktionen (Node und Browser gleich), nur Palettenindizes.
 */
import { bayer, Buf, C, rng, shadeIdx } from './buf';
import { MAP_H, MAP_W } from './layout';
import { pathDistAll, pathLength, type Pt } from './kit';
import type { PropArt } from './props';
import type { MapLight } from './types';

export type Rect = [number, number, number, number]; // x0, y0, x1, y1

/** Rechtecke als Polygone (fuer `walls` in der Karten-JSON). */
export const rectPoly = ([x0, y0, x1, y1]: Rect): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/**
 * Rechteck -> Blockerkreise [x, y, r] (die Sim kennt nur Kreise). Kreise entlang der langen Achse, Radius = halbe kurze Seite
 * (mind. 3), Abstand ~ Radius, damit kein Turm in eine Luecke rutscht.
 */
export function rectBlockers([x0, y0, x1, y1]: Rect): [number, number, number][] {
  const w = x1 - x0, h = y1 - y0;
  const horiz = w >= h;
  const short = horiz ? h : w, long = horiz ? w : h;
  const r = Math.max(3, Math.round(short / 2));
  const n = Math.max(1, Math.ceil((long - 2 * r) / (r * 1.1)) + 1);
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = Math.round(r + t * Math.max(0, long - 2 * r));
    out.push(horiz ? [x0 + a, Math.round(y0 + h / 2), r] : [Math.round(x0 + w / 2), y0 + a, r]);
  }
  return out;
}

/** Kleinste Laenge, die ein Ast hat, und der groesste Unterschied zwischen den Aesten. */
export const branchSpread = (br: Pt[][]): number => {
  const l = br.map(pathLength);
  return Math.max(...l) - Math.min(...l);
};

/**
 * Hilfe beim Entwerfen: baut den Ast ueber `build(v)` und sucht per Bisektion das `v` in [lo, hi], bei dem er genau `target` px lang ist
 * (Laenge muss in v monoton sein; Ergebnis auf 0,01 px). So sind alle Aeste einer Karte gleich lang.
 */
export function fitLength(build: (v: number) => Pt[], target: number, lo: number, hi: number): Pt[] {
  let a = lo, b = hi;
  const up = pathLength(build(hi)) >= pathLength(build(lo));
  for (let it = 0; it < 60; it++) {
    const mid = (a + b) / 2;
    if ((pathLength(build(mid)) < target) === up) a = mid; else b = mid;
  }
  const v = Math.round(((a + b) / 2) * 100) / 100;
  return build(v);
}

// ---------- Schatten, Licht, Rand ----------
/** Schlagschatten aller Dinge (Ellipse unten rechts) in den Boden: ein Schritt dunkler, nur wo `ok` wahr ist. */
export function castShadows(ground: Buf, props: { prop: { x: number; y: number }; art: PropArt }[], ok: (x: number, y: number) => boolean = () => true): void {
  const W = ground.w, H = ground.h;
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
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (shade[y * W + x] && ok(x, y)) ground.set(x, y, shadeIdx(ground.get(x, y)));
}

/** Rand dunkler (Vignette) auf 12 px, nur wo `ok`. */
export function vignette(ground: Buf, ok: (x: number, y: number) => boolean = () => true, width = 12, strength = 0.7): void {
  const W = ground.w, H = ground.h;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e < width && ok(x, y) && bayer(x, y) < ((width - e) / width) * strength) ground.set(x, y, shadeIdx(ground.get(x, y)));
  }
}

/**
 * Lichtpfuetzen unter Lichtern: im Radius werden Bodenfarben per Raster gegen warme Nachbarn getauscht (`warm[von] = nach`).
 * `groundShift` verschiebt den Mittelpunkt nach unten (Laterne: Licht faellt auf den Boden).
 */
export function lightPools(ground: Buf, lights: MapLight[], warm: Map<number, number>, minR = 14, ok: (x: number, y: number) => boolean = () => true): void {
  const W = ground.w, H = ground.h;
  for (const L of lights.filter((l) => l.r >= minR && l.warm)) {
    const ly = L.y + (L.r >= 26 ? 14 : 6), rx = L.r * 0.8, ry = L.r * 0.5;
    for (let y = Math.floor(ly - ry); y <= ly + ry; y++) for (let x = Math.floor(L.x - rx); x <= L.x + rx; x++) {
      const d = Math.hypot((x - L.x) / rx, (y - ly) / ry);
      if (d >= 1 || x < 0 || y < 0 || x >= W || y >= H || !ok(x, y)) continue;
      if (bayer(x, y) < (1 - d) * 0.85) {
        const c = ground.get(x, y);
        const n = warm.get(c);
        if (n !== undefined) ground.set(x, y, n);
      }
    }
  }
}

/** Streu-Platzierung mit festem Seed: `accept(x, y, kind)` entscheidet, `gap` ist der Mindestabstand (mit Radius). */
export function scatterProps<K extends string>(opts: {
  seed: number; count: number; tries: number; kinds: [K, number][]; radius: Record<K, number>; hand: { kind: K; x: number; y: number; r: number }[];
  branches: Pt[][]; hw: number; accept: (x: number, y: number, r: number, kind: K) => boolean; variants?: number;
}): { kind: K; x: number; y: number; v: number; r: number }[] {
  const rnd = rng(opts.seed);
  const out: { kind: K; x: number; y: number; v: number; r: number }[] = [];
  const total = opts.kinds.reduce((s, [, w]) => s + w, 0);
  for (let i = 0; i < opts.tries && out.length < opts.count; i++) {
    const x = Math.round(rnd() * (MAP_W - 8) + 4), y = Math.round(rnd() * (MAP_H - 4) + 8);
    let roll = rnd() * total, kind = opts.kinds[0][0];
    for (const [k, w] of opts.kinds) { if (roll < w) { kind = k; break; } roll -= w; }
    const v = Math.floor(rnd() * (opts.variants ?? 3));
    const r = opts.radius[kind];
    if (pathDistAll(opts.branches, x, y - 2) < opts.hw + r + 5) continue;
    if (!opts.accept(x, y, r, kind)) continue;
    if ([...opts.hand, ...out].some((q) => Math.hypot(q.x - x, (q.y - y) * 1.3) < Math.max(q.r, r) * 1.9 + 5)) continue;
    out.push({ kind, x, y, v, r });
  }
  return out;
}

export { C, MAP_H, MAP_W };
