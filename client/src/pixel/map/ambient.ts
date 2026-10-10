/**
 * Bewegte Luft der Karten (Runde 15 / B1): Schneefall (Frostfen), Funken und Hitzedunst (Quarry), Gluehwuermchen (Meadow bleibt
 * im Renderer). Rein rechnerisch und ohne Zustand: `ambientPoints(id, tMs)` gibt zu jedem Zeitpunkt die Teilchen zurueck,
 * der Renderer zeichnet sie als 1- bis 2-Pixel-Quadrate (Palettenfarbe `c`, Deckkraft `a`) bzw. als weiche Streifen (`haze`).
 * Alles laeuft ueber Hash des Teilchen-Index, daher gleiche Bilder bei gleicher Zeit (Tests, Screenshots).
 */
import { C, hash2 } from './buf';
import { MAP_H, MAP_W } from './layout';
import { EMBER_SEEDS } from './quarry';
import { ambientK2 } from './ambient-k2';
import type { MapId } from './types';

export interface AmbientPoint {
  kind: 'flake' | 'ember' | 'haze' | 'smoke';
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

/** Alle bewegten Luftteilchen der Karte zum Zeitpunkt `tMs`. Meadow: keine (Gluehwuermchen kommen aus dem Renderer). */
export function ambientPoints(id: MapId, tMs: number): AmbientPoint[] {
  if (id === 'frostfen') return snow(tMs);
  if (id === 'quarry') return [...haze(tMs), ...embers(tMs)];
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
