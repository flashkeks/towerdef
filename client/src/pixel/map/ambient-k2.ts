/**
 * Bewegte Luft der Runde-16-Karten (K2): Sandsturm (Dunes), Nebelschwaden, Motten und Gischt (Harbor), Funken, Glutdunst und
 * Fackelfunken (Spire). Gleiche Regeln wie `ambient.ts`: rein rechnerisch, ohne Zustand, Hash des Teilchen-Index -> gleiche Bilder
 * bei gleicher Zeit. Der Renderer zeichnet 1- bis 3-Pixel-Quadrate bzw. weiche Streifen (`haze`).
 */
import { C, hash2 } from './buf';
import { MAP_H, MAP_W } from './layout';
import type { AmbientPoint } from './ambient';
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

/** Alle bewegten Luftteilchen der K2-Karten; leer fuer fremde Karten. */
export function ambientK2(id: MapId, tMs: number): AmbientPoint[] {
  if (id === 'dunes') return sandstorm(tMs);
  return [];
}
