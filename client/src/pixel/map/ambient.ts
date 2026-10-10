/**
 * Bewegte Luft der Karten (Runde 15 / B1): Schneefall (Frostfen), Funken und Hitzedunst (Quarry), Gluehwuermchen (Meadow bleibt
 * im Renderer), Runde 16: Laub und Kraehen (Hollow), Gluehwuermchen und Nebel (Marsh), Wolken und Adler (Skyreach), Raben und Funken (Bastion). Rein rechnerisch und ohne Zustand: `ambientPoints(id, tMs)` gibt zu jedem Zeitpunkt die Teilchen zurueck,
 * der Renderer zeichnet sie als 1- bis 2-Pixel-Quadrate (Palettenfarbe `c`, Deckkraft `a`) bzw. als weiche Streifen (`haze`).
 * Alles laeuft ueber Hash des Teilchen-Index, daher gleiche Bilder bei gleicher Zeit (Tests, Screenshots).
 */
import { C, hash2 } from './buf';
import { MAP_H, MAP_W } from './layout';
import { EMBER_SEEDS } from './quarry';
import { ambientK2 } from './ambient-k2';
import { waterAt as marshWaterAt } from './marsh';
import type { MapId } from './types';

export interface AmbientPoint {
  kind: 'flake' | 'ember' | 'haze' | 'smoke' | 'leaf' | 'fly' | 'bird';
  x: number;
  y: number;
  /** Kantenlaenge in px (flake/ember) bzw. Breite (haze) */
  w: number;
  /** Hoehe, nur haze */
  h?: number;
  /** Palettenindex */
  c: number;
  /** Deckkraft 0..1 */
  a: number;
}

export const SNOW_COUNT = 150;
export const EMBER_COUNT = 90;
export const HAZE_COUNT = 14;

/** Schnee: je Flocke Fallgeschwindigkeit, Schwingung und Seitenwind; nahe (grosse) Flocken fallen schneller. */
function snow(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let i = 0; i < SNOW_COUNT; i++) {
    const near = hash2(i, 1, 90) > 0.8;
    const speed = near ? 26 + hash2(i, 2, 90) * 14 : 10 + hash2(i, 3, 90) * 12;
    const wind = 5 + Math.sin(s * 0.18 + i * 0.01) * 4 + (near ? 4 : 0); // leichte Boeen
    const x0 = hash2(i, 4, 90) * MAP_W, y0 = hash2(i, 5, 90) * (MAP_H + 12);
    const sway = Math.sin(s * (0.8 + hash2(i, 6, 90)) + i) * (near ? 5 : 3);
    const x = ((x0 + wind * s + sway) % MAP_W + MAP_W) % MAP_W;
    const y = ((y0 + speed * s) % (MAP_H + 12)) - 6;
    const px = Math.round(x), py = Math.round(y);
    // auf weissem Schnee sieht man Weiss nicht: nahe Flocken tragen einen silbernen Schatten unten rechts
    if (near) out.push({ kind: 'flake', x: px + 1, y: py + 1, w: 2, c: C.silver, a: 0.8 });
    out.push({ kind: 'flake', x: px, y: py, w: near ? 2 : 1, c: near || hash2(i, 7, 90) > 0.5 ? C.white : C.silver, a: near ? 0.95 : 0.75 });
  }
  return out;
}

/** Funken: steigen von den Lavaorten auf, werden von gelb ueber orange zu rot und erloeschen. */
function embers(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let i = 0; i < EMBER_COUNT; i++) {
    const seed = EMBER_SEEDS[Math.floor(hash2(i, 1, 91) * EMBER_SEEDS.length) % EMBER_SEEDS.length];
    const life = 2.2 + hash2(i, 2, 91) * 3;
    const ph = ((s / life + hash2(i, 3, 91)) % 1 + 1) % 1;
    const rise = 20 + hash2(i, 4, 91) * 26;
    const sway = Math.sin(s * 1.6 + i * 1.7) * (3 + ph * 7);
    const x = seed[0] + (hash2(i, 5, 91) - 0.5) * 20 + sway + ph * 6;
    const y = seed[1] - ph * rise * life * 0.4;
    const c = ph < 0.25 ? C.yellow : ph < 0.55 ? C.amber : ph < 0.8 ? C.orange : C.red;
    out.push({ kind: 'ember', x: Math.round(x), y: Math.round(y), w: ph < 0.5 && hash2(i, 6, 91) > 0.6 ? 2 : 1, c, a: ph > 0.85 ? (1 - ph) / 0.15 : 1 });
  }
  return out;
}

/** Hitzedunst: breite, flache, weiche Streifen, die ueber der Lava langsam aufsteigen und wabern. */
function haze(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let i = 0; i < HAZE_COUNT; i++) {
    const seed = EMBER_SEEDS[Math.floor(hash2(i, 1, 92) * EMBER_SEEDS.length) % EMBER_SEEDS.length];
    const ph = ((s / 7 + hash2(i, 2, 92)) % 1 + 1) % 1;
    const y = seed[1] - 6 - ph * 44;
    const wob = Math.sin(s * 1.3 + i * 2.1) * 5;
    out.push({ kind: 'haze', x: Math.round(seed[0] - 30 + wob), y: Math.round(y), w: 60 + Math.floor(hash2(i, 3, 92) * 40), h: 5 + Math.floor(hash2(i, 4, 92) * 5), c: C.orange, a: 0.06 * Math.sin(ph * Math.PI) });
  }
  return out;
}


// ------------------------------------------------------------------ Runde 16 (K1)
const tri = (v: number): number => Math.abs(((v % 1) + 1) % 1 * 2 - 1);

/** Ein Vogel aus Einzelpixeln: `flap` 0..3 (Fluegelschlag, 4 = Gleitflug), Blickrichtung `dir` (+1 rechts, -1 links), `span` halbe Spannweite. */
function bird(out: AmbientPoint[], x: number, y: number, flap: number, dir: number, span: number, c: number, shadow = true): void {
  const px = Math.round(x), py = Math.round(y);
  const pts: [number, number][] = [[0, 0], [dir, 0], [-dir, 0], [-dir * 2, 1]]; // Koerper, Kopf, Schwanz
  for (let k = 1; k <= span; k++) {
    const up = flap === 4 ? (k > span - 2 ? 1 : 0) : flap === 0 ? -Math.ceil(k * 0.6) : flap === 1 ? -Math.floor(k * 0.2) : flap === 2 ? Math.ceil(k * 0.5) : Math.floor(k * 0.2);
    pts.push([k + 0, up], [-k, up]);
  }
  for (const [dx, dy] of pts) out.push({ kind: 'bird', x: px + dx, y: py + dy, w: 1, c, a: 1 });
  if (shadow) for (const [dx, dy] of pts) if (((dx + dy) & 1) === 0) out.push({ kind: 'bird', x: px + dx + 9, y: py + dy + 14, w: 1, c: C.night, a: 0.22 });
}

/** Herbstlaub (Hollow): faellt mit leichtem Wind schraeg ueber die Felder, trudelt. */
function leaves(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  const cols = [C.orange, C.amber, C.rust, C.yellow, C.clay];
  for (let i = 0; i < 44; i++) {
    const speed = 9 + hash2(i, 1, 95) * 12, life = (MAP_H + 20) / speed;
    const ph = ((s / life + hash2(i, 2, 95)) % 1 + 1) % 1;
    const y = -10 + ph * (MAP_H + 20);
    const x = (((hash2(i, 3, 95) * MAP_W + s * (6 + hash2(i, 4, 95) * 6) + Math.sin(s * 1.3 + i) * 6) % MAP_W) + MAP_W) % MAP_W;
    const flip = Math.floor(s * 2 + i) % 2;
    out.push({ kind: 'leaf', x: Math.round(x), y: Math.round(y), w: flip ? 2 : 1, h: flip ? 1 : 2, c: cols[i % cols.length], a: 0.95 });
  }
  return out;
}
/** Kraehen (Hollow): zwei Voegel queren die Karte alle ~50 s von links nach rechts bzw. zurueck. */
function crows(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let k = 0; k < 2; k++) {
    const per = 52 + k * 17, ph = ((s / per + k * 0.37) % 1 + 1) % 1;
    if (ph > 0.55) continue;
    const u = ph / 0.55, dir = k ? -1 : 1;
    const x = dir > 0 ? -12 + u * (MAP_W + 24) : MAP_W + 12 - u * (MAP_W + 24);
    bird(out, x, 62 + k * 190 + Math.sin(u * 9) * 8, Math.floor(s * 6 + k) % 4, dir, 3, C.ink, false);
  }
  return out;
}

/** Gluehwuermchen (Marsh): schwirren in kleinen Schleifen, blinken. */
function fireflies(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let i = 0; i < 70; i++) {
    const hx = hash2(i, 1, 96) * MAP_W, hy = hash2(i, 2, 96) * MAP_H;
    const x = hx + Math.sin(s * (0.35 + hash2(i, 3, 96) * 0.4) + i) * 14, y = hy + Math.cos(s * (0.3 + hash2(i, 4, 96) * 0.4) + i * 2) * 8;
    const blink = Math.sin(s * (0.9 + hash2(i, 5, 96) * 0.8) + i * 3.1);
    if (blink < 0.15) continue;
    const a = Math.min(1, (blink - 0.15) * 1.6);
    out.push({ kind: 'fly', x: Math.round(x), y: Math.round(y), w: 1, c: i % 5 === 0 ? C.leaf : C.yellow, a });
    if (a > 0.8) { out.push({ kind: 'fly', x: Math.round(x) + 1, y: Math.round(y), w: 1, c: C.amber, a: 0.45 }, { kind: 'fly', x: Math.round(x) - 1, y: Math.round(y), w: 1, c: C.amber, a: 0.45 }); }
  }
  return out;
}
/** Bodennebel (Marsh): breite, flache Schwaden ueber dem Wasser, treiben langsam und atmen. */
function mist(t: number, col: number, n: number, seedBase: number, over: (x: number, y: number) => boolean, speed = 3, alpha = 0.05, hMul = 1): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let i = 0; i < n; i++) {
    const w = 70 + Math.floor(hash2(i, 1, seedBase) * 70), h = Math.round((5 + Math.floor(hash2(i, 2, seedBase) * 5)) * hMul);
    const x0 = hash2(i, 3, seedBase) * (MAP_W + w), sp = speed * (0.6 + hash2(i, 4, seedBase) * 0.8);
    const x = (((x0 + s * sp) % (MAP_W + w)) + MAP_W + w) % (MAP_W + w) - w;
    const y = hash2(i, 5, seedBase) * MAP_H + Math.sin(s * 0.3 + i) * 4;
    if (!over(x + w / 2, y)) continue;
    out.push({ kind: 'haze', x: Math.round(x), y: Math.round(y), w, h, c: col, a: alpha * (0.6 + 0.4 * Math.sin(s * 0.4 + i * 1.7)) });
  }
  return out;
}
/** Skyreach: Wolkenschleier mit Schatten auf dem Boden, zwei kreisende Adler. */
function skyreach(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  out.push(...mist(t, C.night, 7, 97, () => true, 4.5, 0.03, 2).map((p) => ({ ...p, y: p.y + 12, x: p.x + 14 }))); // Wolkenschatten
  out.push(...mist(t, C.white, 9, 98, () => true, 4.5, 0.06, 2));
  for (const [cx, cy, rx, ry, sp, k] of [[210, 190, 120, 54, 0.11, 0], [500, 240, 80, 40, -0.15, 1]] as const) {
    const a = s * sp + k * 2;
    bird(out, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 4, Math.sin(a) * Math.sign(sp) > 0 ? -1 : 1, 5, C.night);
  }
  return out;
}
/** Bastion: Raben kreisen um den Bergfried, Funken steigen von den Feuerschalen. */
function bastion(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = t / 1000;
  for (let k = 0; k < 3; k++) {
    const a = s * (0.32 + k * 0.05) + k * 2.1, rx = 70 + k * 18, ry = 36 + k * 8;
    bird(out, 385 + Math.cos(a) * rx, 200 + Math.sin(a) * ry, Math.floor(s * 5 + k * 2) % 4, Math.sin(a) > 0 ? -1 : 1, 3, C.ink);
  }
  for (const [bx, by] of [[322, 222], [448, 222], [322, 112], [448, 112]] as const) for (let j = 0; j < 4; j++) {
    const ph = ((s / 2.4 + j / 4 + hash2(bx, by, 99)) % 1 + 1) % 1;
    out.push({ kind: 'ember', x: Math.round(bx + Math.sin(s * 1.7 + j + bx) * (2 + ph * 5)), y: Math.round(by - ph * 28), w: 1, c: ph < 0.3 ? C.yellow : ph < 0.65 ? C.orange : C.red, a: 1 - ph });
  }
  return out;
}

/** Alle bewegten Luftteilchen der Karte zum Zeitpunkt `tMs`. Meadow: keine (Gluehwuermchen kommen aus dem Renderer). */
export function ambientPoints(id: MapId, tMs: number): AmbientPoint[] {
  if (id === 'frostfen') return snow(tMs);
  if (id === 'quarry') return [...haze(tMs), ...embers(tMs)];
  if (id === 'hollow') return [...leaves(tMs), ...crows(tMs)];
  if (id === 'marsh') return [...mist(tMs, C.silver, 14, 100, (x, y) => marshWaterAt(x, y) < 0, 2.2, 0.05), ...fireflies(tMs)];
  if (id === 'skyreach') return skyreach(tMs);
  if (id === 'bastion') return bastion(tMs);
  return ambientK2(id, tMs);
}

/** Rauchfahnen: je Quelle vier Wolken, die aufsteigen, mit dem Wind abdriften, wachsen und verblassen. */
export function smokePoints(sources: { x: number; y: number }[], tMs: number, cold = true): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = tMs / 1000;
  sources.forEach((src, k) => {
    for (let j = 0; j < 4; j++) {
      const ph = ((s / 3.2 + j / 4 + hash2(k, 1, 93)) % 1 + 1) % 1;
      const x = src.x + Math.sin(s * 0.9 + k + j) * 1.5 + ph * 12;
      const y = src.y - ph * 24;
      out.push({ kind: 'smoke', x: Math.round(x), y: Math.round(y), w: ph < 0.3 ? 2 : ph < 0.7 ? 3 : 4, c: ph < 0.55 ? (cold ? C.stone : C.slate) : cold ? C.silver : C.stone, a: 0.9 * (1 - ph * 0.8) });
    }
  });
  return out;
}
