/**
 * Gemeinsames Werkzeug der Runde-16-Karten (K1: hollow, marsh, bastion, skyreach): Wegkoordinaten (Abstand, Bogenlaenge,
 * Seite), Schatten, Lichtpfuetzen, Vignette, Wasser-Grundton und -Bildfolge, Streuung mit Abstandsregeln.
 * Reine Funktionen ohne Zustand, laufen in Node und im Browser gleich.
 */
import { bayer, Buf, C, hash2, rng, shadeIdx, vnoise } from './buf';
import { Field, inPoly, pathDistAll, walk, type Pt } from './kit';
import { MAP_H, MAP_W, segDist } from './layout';
import type { PlacedArt, MapLight } from './types';
import type { PropArt } from './props';

export interface SceneProp<K extends string = string> { kind: K; x: number; y: number; v: number; r: number }

/** Je Pixel: Abstand zum naechsten Wegstueck, Bogenlaenge `s` dort und Seite (+1 links der Gehrichtung, -1 rechts). */
export interface PathCoords {
  dist: Float32Array;
  s: Float32Array;
  side: Float32Array;
}
export function pathCoords(branches: Pt[][], maxDist = 40): PathCoords {
  const W = MAP_W, H = MAP_H;
  const dist = new Float32Array(W * H).fill(1e4), s = new Float32Array(W * H), side = new Float32Array(W * H);
  for (const br of branches) {
    let cum = 0;
    for (let i = 1; i < br.length; i++) {
      const [ax, ay] = br[i - 1], [bx, by] = br[i];
      const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy, l = Math.sqrt(l2);
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - maxDist)), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx) + maxDist));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by) - maxDist)), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by) + maxDist));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2)) : 0;
        const d = Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
        const k = y * W + x;
        if (d < dist[k]) {
          dist[k] = d;
          s[k] = cum + t * l;
          side[k] = (px - ax) * vy - (py - ay) * vx > 0 ? 1 : -1;
        }
      }
      cum += l;
    }
  }
  return { dist, s, side };
}

export const at = (a: Float32Array, x: number, y: number): number => a[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];

/** Gradient eines Rasters (zentrale Differenz). */
export function gradOf(a: Float32Array, x: number, y: number): [number, number] {
  return [(at(a, x + 1, y) - at(a, x - 1, y)) / 2, (at(a, x, y + 1) - at(a, x, y - 1)) / 2];
}

/** Schlagschatten der Dinge auf den Boden: eine Ellipse je Ding, Rand gedithert, eine Stufe dunkler. */
export function shadowPass(ground: Buf, props: PlacedArt[], skip?: (c: number) => boolean): void {
  const W = MAP_W, H = MAP_H;
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
    if (skip && skip(c)) continue;
    ground.set(x, y, shadeIdx(c));
  }
}

/** Ein Lichtfleck auf dem Boden: dithert die Pixel im Umkreis (Ellipse rx x ry um x, y) nach `lift`, je weiter innen desto dichter. */
export function lightPool(ground: Buf, x: number, y: number, rx: number, ry: number, lift: (c: number, inner: boolean, px: number, py: number) => number, strength = 0.85): void {
  for (let yy = Math.floor(y - ry); yy <= y + ry; yy++) for (let xx = Math.floor(x - rx); xx <= x + rx; xx++) {
    const d = Math.hypot((xx - x) / rx, (yy - y) / ry);
    if (d >= 1 || xx < 0 || yy < 0 || xx >= MAP_W || yy >= MAP_H) continue;
    if (bayer(xx, yy) < (1 - d) * strength) {
      const c = ground.get(xx, yy);
      const n = lift(c, d < 0.45 && bayer(xx + 2, yy + 1) < 0.5, xx, yy);
      if (n !== c) ground.set(xx, yy, n);
    }
  }
}

/** Rand dunkler (und optional kuehler): am Bildrand `e` Pixel breit, gedithert. */
export function vignette(ground: Buf, e = 12, strength = 0.7, skip?: (c: number) => boolean): void {
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const d = Math.min(x, y, MAP_W - 1 - x, MAP_H - 1 - y);
    if (d < e && bayer(x, y) < ((e - d) / e) * strength) {
      const c = ground.get(x, y);
      if (!skip || !skip(c)) ground.set(x, y, shadeIdx(c));
    }
  }
}

// ------------------------------------------------------------------ Wasser
export interface WaterStyle {
  /** Uferrand (seicht) */
  shallow: number;
  /** Grundton */
  mid: number;
  /** tief */
  deep: number;
  /** Lichtreflex / Glanzpunkt */
  glint: number;
  /** Schaum / Ufersaum */
  foam: number;
  /** Reflexionsfarbe (gedithert eingestreut), z. B. Herbstlaub im Teich */
  tint?: number;
  /** Schatten des Ufers (obere linke Kante) */
  shore: number;
}

/** Wasser-Grundton in den Boden: Rand heller, Uferschatten oben links, Tiefe in der Mitte. `dep` > 0 im Wasser. */
export function waterBase(x: number, y: number, dep: number, lit: number, st: WaterStyle, seed = 1): number {
  const n = vnoise(x, y, 10, seed), k = bayer(x, y);
  if (dep < 1.4) return st.shallow;
  let c = dep < 3.2 ? (k < 0.5 ? st.shallow : st.mid) : st.mid;
  if (lit > 0.3 && dep < 6 && bayer(x, y + 1) < 0.65) c = shadeIdx(c);
  if (dep > 7 && bayer(x + 2, y) < 0.15 + (n - 0.4) * 0.6) c = st.deep;
  if (st.tint && n > 0.62 && bayer(x + 1, y + 2) < 0.18) c = st.tint;
  return c;
}

/** Eine Bildfolge fuer Wasser: Stroemungs-/Wellenstriche, Funkeln, Schaum; `f` 0..frames-1 schliesst nahtlos. */
export function waterFrame(f: number, frames: number, field: Field, st: WaterStyle, opts: { flow?: [number, number]; sparkle?: number; ripple?: number; minDep?: number } = {}): Buf {
  const b = new Buf(MAP_W, MAP_H);
  const [fx, fy] = opts.flow ?? [0, 1];
  const sp = opts.sparkle ?? 0.9965, minDep = opts.minDep ?? 2;
  const bb = bounds(field);
  for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) {
    const dd = field.at(x, y);
    if (dd > -minDep) continue;
    const dep = -dd;
    const col = hash2(Math.floor(x / 2), 7, 5);
    // laufende Wellenstriche (waagrecht, 3-6 px lang), schliessen nach `frames` Bildern
    const ph = Math.floor(hash2(Math.floor(y / 2), 0, 6) * 24);
    const len = 3 + Math.floor(hash2(Math.floor(y / 2), 1, 7) * 4);
    const xx = (((x + fx * f * (24 / frames) + fy * 0 + ph) % 24) + 24) % 24;
    if (col < 0.5 && xx < len && vnoise(x, y, 14, 2) > 0.42 && bayer(x, y) < 0.8 && ((y & 1) === 0 || fy === 0)) b.set(x, y, xx === 0 && col < 0.2 ? st.glint : st.shallow);
    if (hash2(x + f * 31, y + f * 17, 9) > sp && dep > 2) b.set(x, y, st.glint);
    if (dep < 1.8) {
      const foam = vnoise(x + f * 3, y + f * 1.5, 3.2, 12);
      if (foam > 0.64) b.set(x, y, st.foam);
    }
  }
  return b;
}

const boundsCache = new WeakMap<Field, { x0: number; y0: number; x1: number; y1: number }>();
function bounds(field: Field): { x0: number; y0: number; x1: number; y1: number } {
  let r = boundsCache.get(field);
  if (!r) {
    let x0 = MAP_W, y0 = MAP_H, x1 = 0, y1 = 0;
    for (let y = 0; y < MAP_H; y += 2) for (let x = 0; x < MAP_W; x += 2) if (field.at(x, y) < 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); }
    r = { x0: Math.max(0, x0 - 2), y0: Math.max(0, y0 - 2), x1: Math.min(MAP_W - 1, x1 + 2), y1: Math.min(MAP_H - 1, y1 + 2) };
    boundsCache.set(field, r);
  }
  return r;
}

// ------------------------------------------------------------------ Masken
/** Vorzeichenbehaftetes Abstandsfeld (px) einer Maske (1 = innen): < 0 innen, > 0 aussen. Chamfer 3-4, wie `polySdf`. */
export function maskSdf(mask: Uint8Array, W = MAP_W, H = MAP_H): Float32Array {
  const dist = (inside: number): Float32Array => {
    const d = new Float32Array(W * H);
    const BIG = 1e5;
    for (let i = 0; i < d.length; i++) d[i] = mask[i] === inside ? BIG : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = d[i];
      if (!v) continue;
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 1);
        if (x > 0) v = Math.min(v, d[i - W - 1] + 1.414);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + 1.414);
      }
      d[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = d[i];
      if (!v) continue;
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 1);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + 1.414);
        if (x > 0) v = Math.min(v, d[i + W - 1] + 1.414);
      }
      d[i] = v;
    }
    return d;
  };
  const dOut = dist(0), dIn = dist(1);
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = mask[i] ? -(dIn[i] - 0.5) : dOut[i] - 0.5;
  return out;
}

/**
 * Maske -> Rechteck-Polygone (Vereinigung = die Maske), Raster `cell` px: je Zeilenband die Laeufe, gleiche Laeufe in
 * Folgebaendern werden zu einem Rechteck verschmolzen. Die Sim kennt nur Polygone ohne Loecher; Rechtecke koennen sich
 * ueberlappen, ohne Schaden. Ein Pixel zaehlt, wenn die Mitte der Zelle in der Maske liegt.
 */
export function maskToRects(inMask: (x: number, y: number) => boolean, cell = 4, W = MAP_W, H = MAP_H): Pt[][] {
  const rects: Pt[][] = [];
  let open = new Map<string, { x0: number; x1: number; y0: number }>();
  const close = (r: { x0: number; x1: number; y0: number }, y1: number): void => { rects.push([[r.x0, r.y0], [r.x1, r.y0], [r.x1, y1], [r.x0, y1]]); };
  for (let by = 0; by <= H; by += cell) {
    const next = new Map<string, { x0: number; x1: number; y0: number }>();
    if (by < H) {
      let x = 0;
      while (x < W) {
        if (!inMask(x + cell / 2, by + cell / 2)) { x += cell; continue; }
        const x0 = x;
        while (x < W && inMask(x + cell / 2, by + cell / 2)) x += cell;
        const key = `${x0}:${x}`;
        const prev = open.get(key);
        next.set(key, prev ?? { x0, x1: x, y0: by });
        if (prev) open.delete(key);
      }
    }
    for (const r of open.values()) close(r, by);
    open = next;
  }
  return rects;
}

/** Zusammenhaengende Wassergebiete (4er-Nachbarschaft) einer Maske: Flaechen in px. */
export function maskAreas(mask: Uint8Array, W = MAP_W, H = MAP_H): number[] {
  const seen = new Uint8Array(W * H), out: number[] = [];
  const stack: number[] = [];
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || seen[i]) continue;
    let n = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const k = stack.pop() as number;
      n++;
      const x = k % W, y = (k / W) | 0;
      for (const j of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) if (j >= 0 && mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
    }
    out.push(n);
  }
  return out.sort((a, b) => b - a);
}

// ------------------------------------------------------------------ Streuung und Blocker
/** Fester Zufall mit Abstandsregeln: `pick(x, y, rnd)` liefert ein Ding oder null; Abstand zu allen anderen und zum Weg wird hier geprueft. */
export function scatter<K extends string>(opts: {
  seed: number; tries: number; max: number; hand: SceneProp<K>[]; branches: Pt[][]; hw: number;
  pick: (x: number, y: number, rnd: () => number) => SceneProp<K> | null;
  free?: (p: SceneProp<K>) => boolean;
  gap?: number;
}): SceneProp<K>[] {
  const rnd = rng(opts.seed), out: SceneProp<K>[] = [];
  const gap = opts.gap ?? 1.9;
  for (let i = 0; i < opts.tries && out.length < opts.max; i++) {
    const x = Math.round(rnd() * (MAP_W - 6) + 3), y = Math.round(rnd() * (MAP_H - 4) + 6);
    const p = opts.pick(x, y, rnd);
    if (!p) continue;
    if (pathDistAll(opts.branches, p.x, p.y - 2) < opts.hw + p.r + 5) continue;
    if (opts.free && !opts.free(p)) continue;
    if (opts.hand.some((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 1.3) < Math.max(q.r, p.r) * gap + 4)) continue;
    if (out.some((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 1.3) < Math.max(q.r, p.r) * gap + 4)) continue;
    out.push(p);
  }
  return out;
}

/** Blocker (Kreise) aus den Dingen mit Radius > 0, die in der Baufläche liegen. */
export function blockersOf(props: SceneProp[], area: [number, number, number, number], skip?: (p: SceneProp) => boolean): [number, number, number][] {
  const [bx, by, bw, bh] = area;
  return props.filter((q) => q.r > 0 && q.x - q.r < bx + bw && q.x + q.r > bx && q.y - q.r < by + bh && q.y + q.r > by && !(skip && skip(q))).map((q) => [q.x, q.y - 2, q.r]);
}

/** Kreise entlang eines Linienzugs (Mauer, Schlucht): Radius r, Abstand ~ r * 1.1, ganzzahlig. `skip` laesst Stellen frei (Tor, Bruecke). */
export function chain(poly: Pt[], r: number, skip?: (x: number, y: number) => boolean): [number, number, number][] {
  const pts: Pt[] = walk(poly, r * 1.1).map((p) => [p.x, p.y]);
  pts.push(poly[poly.length - 1]);
  return pts.map(([x, y]): [number, number, number] => [Math.round(x), Math.round(y), r]).filter(([x, y]) => !(skip && skip(x, y)));
}

/** Kreise, die ein Polygon fuellen (Schlucht): Raster mit Schritt `r * 1.4`, nur wo der Mittelpunkt im Polygon liegt. */
export function fillCircles(poly: Pt[], r: number, skip?: (x: number, y: number) => boolean): [number, number, number][] {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const out: [number, number, number][] = [];
  const st = r * 1.3;
  for (let row = 0, y = y0 + r * 0.6; y <= y1 + r * 0.2; y += st * 0.9, row++) {
    for (let x = x0 + (row % 2 ? st / 2 : 0); x <= x1 + r * 0.2; x += st) {
      const px = Math.round(x), py = Math.round(y);
      if (!inPoly(px, py, poly) && !inPoly(px + r * 0.6, py, poly) && !inPoly(px - r * 0.6, py, poly) && !inPoly(px, py + r * 0.6, poly) && !inPoly(px, py - r * 0.6, poly)) continue;
      if (skip && skip(px, py)) continue;
      out.push([px, py, r]);
    }
  }
  return out;
}

/** Wie viele sichtbare Pixel des Dings liegen dort, wo `test(x, y)` wahr ist (z. B. Baumkrone ueber dem Weg)? */
export function spriteOver(art: PropArt, prop: { x: number; y: number }, test: (x: number, y: number) => boolean): number {
  let n = 0;
  const { buf, ax, ay } = art;
  for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) if (buf.d[y * buf.w + x] && test(prop.x - ax + x, prop.y - ay + y)) n++;
  return n;
}

const pcMemo = new WeakMap<Pt[][], PathCoords>();
/** `pathCoords`, einmal je Wegsatz gerechnet. */
export function pathCoordsOf(branches: Pt[][]): PathCoords {
  let c = pcMemo.get(branches);
  if (!c) { c = pathCoords(branches); pcMemo.set(branches, c); }
  return c;
}

/** Von Hand gesetzte Dinge, die auf dem Weg o. ae. landen, werden zum naechsten freien Platz geschoben (Ring um die Wunschstelle); wo nichts frei ist, entfallen sie. */
export function nudge<K extends string>(props: SceneProp<K>[], ok: (p: SceneProp<K>) => boolean, maxR = 30): SceneProp<K>[] {
  const out: SceneProp<K>[] = [];
  for (const p of props) {
    if (ok(p)) { out.push(p); continue; }
    let found: SceneProp<K> | null = null;
    for (let d = 2; d <= maxR && !found; d += 2) for (let k = 0; k < 16 && !found; k++) {
      const a = (k / 16) * Math.PI * 2;
      const q = { ...p, x: Math.round(p.x + Math.cos(a) * d), y: Math.round(p.y + Math.sin(a) * d * 0.8) };
      if (ok(q)) found = q;
    }
    if (found) out.push(found);
  }
  return out;
}

/** Hilfsmittel: `PlacedArt` aus Dingen und einer Bildfunktion. */
export function placed<K extends string>(props: SceneProp<K>[], art: (k: K, v: number) => PropArt): PlacedArt[] {
  return props.map((prop) => ({ prop, art: art(prop.kind, prop.v) }));
}

/** Rechteck-Abstand (px) zu Segmenten, fuer kurze Pfade ohne Feld. */
export function segsDist(x: number, y: number, segs: [Pt, Pt][]): number {
  let d = 1e9;
  for (const [a, b] of segs) d = Math.min(d, segDist(x, y, a[0], a[1], b[0], b[1]));
  return d;
}

export type { MapLight };
export { C, hash2 };
