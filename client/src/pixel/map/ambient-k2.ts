/**
 * Bewegte Luft der Runde-16-Karten (K2): Sandsturm (Dunes), Nebelschwaden, Motten und Gischt (Harbor), Funken, Glutdunst und
 * Fackelfunken (Spire). Gleiche Regeln wie `ambient.ts`: rein rechnerisch, ohne Zustand, Hash des Teilchen-Index -> gleiche Bilder
 * bei gleicher Zeit. Der Renderer zeichnet 1- bis 3-Pixel-Quadrate bzw. weiche Streifen (`haze`).
 */
import { C, hash2 } from './buf';
import { MAP_H, MAP_W } from './layout';
import type { AmbientPoint } from './ambient';
import { HB_PROPS } from './harbor-layout';
import { SP_PROPS } from './spire-layout';
import type { MapId } from './types';

const S = (t: number): number => t / 1000;

/** Boeen: 0,1 .. 1,2, wechseln alle paar Sekunden zwischen Flaute und Sturm. */
export const gust = (t: number): number => Math.max(0.1, 0.62 + 0.38 * Math.sin(S(t) / 5.5) + 0.2 * Math.sin(S(t) / 2.1 + 1));

export const SAND_COUNT = 190;
export const SAND_VEILS = 12;

/** Sandsturm: Koerner fliegen von links nach rechts mit leichtem Absinken, bei Boeen schneller und dichter; dazu flache helle Schleier. */
function sandstorm(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = S(t), g = gust(t);
  for (let i = 0; i < SAND_COUNT; i++) {
    const near = hash2(i, 1, 120) > 0.75;
    const speed = (near ? 120 : 62) + hash2(i, 2, 120) * (near ? 70 : 40);
    // je Korn eine feste Boeen-Schwelle: bei schwachem Wind sind nur die ersten sichtbar
    const th = hash2(i, 3, 120);
    if (th > g * 0.95 + 0.12) continue;
    const x0 = hash2(i, 4, 120) * (MAP_W + 60), y0 = hash2(i, 5, 120) * MAP_H;
    const x = ((x0 + speed * (0.55 + g * 0.45) * s) % (MAP_W + 60)) - 30;
    const y = ((y0 + 10 * speed * 0.02 * s + Math.sin(s * 1.7 + i) * 3) % MAP_H + MAP_H) % MAP_H;
    const px = Math.round(x), py = Math.round(y);
    const c = near ? (hash2(i, 6, 120) > 0.5 ? C.white : C.sand) : hash2(i, 7, 120) > 0.5 ? C.skin : C.tan;
    const a = 0.45 + 0.45 * Math.min(1, g);
    out.push({ kind: 'flake', x: px, y: py, w: near ? 2 : 1, c, a });
    if (near) out.push({ kind: 'flake', x: px - 3, y: py, w: 1, c: C.peach, a: a * 0.6 }, { kind: 'flake', x: px - 5, y: py + 1, w: 1, c: C.skin, a: a * 0.35 });
  }
  for (let i = 0; i < SAND_VEILS; i++) {
    const ph = ((s / 16 + hash2(i, 1, 121)) % 1 + 1) % 1;
    const w = 90 + Math.floor(hash2(i, 2, 121) * 90);
    const x = -w + ph * (MAP_W + 2 * w) + Math.sin(s * 0.6 + i) * 6;
    const y = 12 + hash2(i, 3, 121) * (MAP_H - 30) + Math.sin(s * 0.5 + i * 2) * 4;
    out.push({ kind: 'haze', x: Math.round(x), y: Math.round(y), w, h: 5 + Math.floor(hash2(i, 4, 121) * 7), c: i % 3 ? C.sand : C.white, a: 0.07 * Math.min(1.2, g * 1.2) });
  }
  return out;
}

// ---------- Gloomharbor: Nebelschwaden ueber dem Becken, Motten um die Laternen ----------
const HB_LAMPS: [number, number][] = HB_PROPS.filter((p) => p.kind === 'lamp').map((p) => [p.x, p.y - 29]);
export const FOG_COUNT = 11;
export const MOTHS_PER_LAMP = 2;

function harborAir(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = S(t);
  for (let i = 0; i < FOG_COUNT; i++) {
    const ph = ((s / 46 + hash2(i, 1, 130)) % 1 + 1) % 1;
    const w = 110 + Math.floor(hash2(i, 2, 130) * 100);
    const x = -w + ph * (MAP_W + 2 * w);
    const y = 222 + hash2(i, 3, 130) * 120 + Math.sin(s * 0.35 + i * 1.9) * 5;
    out.push({ kind: 'haze', x: Math.round(x), y: Math.round(y), w, h: 6 + Math.floor(hash2(i, 4, 130) * 8), c: i % 2 ? C.stone : C.silver, a: 0.045 + 0.02 * Math.sin(s * 0.5 + i) });
  }
  HB_LAMPS.forEach(([lx, ly], k) => {
    for (let m = 0; m < MOTHS_PER_LAMP; m++) {
      const a = s * (1.6 + hash2(k, m, 131) * 1.4) + hash2(k, m, 132) * 6.28;
      const r = 5 + hash2(k, m, 133) * 6;
      const x = lx + Math.cos(a) * r, y = ly + Math.sin(a * 1.3) * r * 0.6;
      const flick = Math.sin(a * 9 + k) > -0.6;
      out.push({ kind: 'ember', x: Math.round(x), y: Math.round(y), w: 1, c: m ? C.amber : C.yellow, a: flick ? 0.95 : 0.35 });
    }
  });
  return out;
}


// ---------- Duskspire Keep: Glut aus dem Lavagraben, Funken ueber den Feuerschalen, kalter Dunst ----------
const SP_BRAZIERS: [number, number][] = SP_PROPS.filter((p) => p.kind === 'brazier').map((p) => [p.x, p.y - 14]);
/** Lavagraben-Spalten: [x0, x1, y0, y1] (West-Graben, Nordteil des Bergfried-Grabens, Ostteil). */
const SP_GLOW: [number, number, number, number][] = [[262, 288, 0, 360], [536, 650, 82, 102], [558, 650, 258, 278], [536, 554, 106, 254]];
export const SP_EMBERS = 70;

function spireAir(t: number): AmbientPoint[] {
  const out: AmbientPoint[] = [];
  const s = S(t);
  for (let i = 0; i < SP_EMBERS; i++) {
    const [x0, x1, y0, y1] = SP_GLOW[i % SP_GLOW.length];
    const life = 3 + hash2(i, 1, 140) * 3;
    const ph = ((s / life + hash2(i, 2, 140)) % 1 + 1) % 1;
    const x = x0 + hash2(i, 3, 140) * (x1 - x0) + Math.sin(s * 1.3 + i) * 4;
    const y = y0 + hash2(i, 4, 140) * (y1 - y0) - ph * 22;
    out.push({ kind: 'ember', x: Math.round(x), y: Math.round(y), w: 1, c: ph < 0.5 ? C.orange : C.amber, a: 0.95 * (1 - ph) });
  }
  SP_BRAZIERS.forEach(([bx, by], k) => {
    for (let m = 0; m < 2; m++) {
      const ph = ((s / (1.2 + m * 0.5) + hash2(k, m, 141)) % 1 + 1) % 1;
      out.push({ kind: 'ember', x: Math.round(bx + Math.sin(s * 2 + k + m * 3) * 3), y: Math.round(by - ph * 14), w: 1, c: m ? C.yellow : C.orange, a: 1 - ph });
    }
  });
  for (let i = 0; i < 8; i++) {
    const ph = ((s / 58 + hash2(i, 1, 142)) % 1 + 1) % 1;
    const w = 100 + Math.floor(hash2(i, 2, 142) * 90);
    out.push({ kind: 'haze', x: Math.round(-w + ph * (MAP_W + 2 * w)), y: Math.round(20 + hash2(i, 3, 142) * (MAP_H - 50) + Math.sin(s * 0.4 + i) * 4), w, h: 6 + Math.floor(hash2(i, 4, 142) * 7), c: i % 2 ? C.stone : C.silver, a: 0.04 + 0.015 * Math.sin(s * 0.5 + i) });
  }
  return out;
}

/** Alle bewegten Luftteilchen der K2-Karten; leer fuer fremde Karten. */
export function ambientK2(id: MapId, tMs: number): AmbientPoint[] {
  if (id === 'dunes') return sandstorm(tMs);
  if (id === 'harbor') return harborAir(tMs);
  if (id === 'spire') return spireAir(tMs);
  return [];
}
