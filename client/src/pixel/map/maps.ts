/**
 * Kartenwahl ueber die ID (Runde 15 / B1): `mapArt('meadow' | 'frostfen' | 'quarry')` liefert die gemalte Karte in der
 * gemeinsamen Form `MapArt` (types.ts), `composeMap` setzt sie zu einem Bild zusammen (Vorschau, Tests),
 * `mapPreview` malt das kleine Vorschaubild fuer die Kartenwahl.
 */
import { Buf, C } from './buf';
import { meadowArt } from './compose';
import { MAP_H, MAP_W } from './layout';
import { paintFrostfen } from './frostfen';
import { paintQuarry } from './quarry';
import { paintHollow } from './hollow';
import { paintMarsh } from './marsh';
import { paintBastion } from './bastion';
import { ambientPoints, smokePoints } from './ambient';
import { bayer } from './buf';
import type { MapArt, MapId } from './types';

export { MAP_IDS, type MapArt, type MapId } from './types';

const cache = new Map<MapId, MapArt>();

/** Die Wiese in der gemeinsamen Form (Wasser = animierte Ebene; Muehle, Fahnen bleiben ueber `meadowArt()` erreichbar). */
function meadowAsMap(): MapArt {
  const a = meadowArt();
  return {
    id: 'meadow', name: 'Lanternfall Meadow', ground: a.ground, anim: a.water, animMs: 170, deco: a.deco, props: a.props,
    lights: a.lights.map((l) => ({ ...l, flicker: 'flame' as const })), smoke: a.smoke,
  };
}

const PAINTERS: Record<MapId, () => MapArt> = {
  meadow: meadowAsMap,
  hollow: paintHollow,
  marsh: paintMarsh,
  frostfen: paintFrostfen,
  bastion: paintBastion,
  quarry: paintQuarry,
  skyreach: () => { throw new Error('skyreach folgt'); },
};

export function mapArt(id: MapId): MapArt {
  let a = cache.get(id);
  if (!a) {
    a = PAINTERS[id]();
    cache.set(id, a);
  }
  return a;
}

/** Alles in einen Puffer (ohne Schnee, Funken, Rauch): Boden, animierte Ebene (Bild `frame`), Deko, Dinge nach y. */
export function composeMap(id: MapId, frame = 0, tMs?: number): Buf {
  const art = mapArt(id);
  const out = art.ground.clone();
  out.blit(art.anim[frame % art.anim.length], 0, 0);
  out.blit(art.deco, 0, 0);
  for (const { prop, art: pa } of [...art.props].sort((a, b) => a.prop.y - b.prop.y)) out.blit(pa.buf, prop.x - pa.ax, prop.y - pa.ay);
  if (tMs !== undefined) {
    // Rauch und Luftteilchen (im Spiel eigene Ebenen; hier mit Raster-Deckkraft in den Puffer gedithert)
    for (const p of [...smokePoints(art.smoke, tMs, id !== 'quarry'), ...ambientPoints(id, tMs)]) {
      if (p.kind === 'haze') {
        for (let y = 0; y < (p.h ?? 4); y++) for (let x = 0; x < p.w; x++) if (bayer(p.x + x, p.y + y) < p.a * 3) out.set(p.x + x, p.y + y, p.c);
      } else if (bayer(p.x, p.y) < p.a + 0.15) out.rect(p.x, p.y, p.w, p.w, p.c);
    }
  }
  return out;
}

export const PREVIEW_W = 160;
export const PREVIEW_H = 90;

/** Vorschaubild 160 x 90: jeder 4 x 4-Block wird zur haeufigsten Palettenfarbe, wobei Dinge (Dach, Baum, Kristall) Vorrang vor Boden haben. */
export function mapPreview(id: MapId): Buf {
  const full = composeMap(id, 0);
  const out = new Buf(PREVIEW_W, PREVIEW_H);
  const k = MAP_W / PREVIEW_W;
  const count = new Map<number, number>();
  for (let y = 0; y < PREVIEW_H; y++) for (let x = 0; x < PREVIEW_W; x++) {
    count.clear();
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const c = full.get(x * k + i, y * k + j);
      count.set(c, (count.get(c) ?? 0) + 1 + (c === C.ink || c === C.night ? -0.4 : 0));
    }
    let best = 0, bn = -1;
    for (const [c, n] of count) if (n > bn || (n === bn && c > best)) { best = c; bn = n; }
    out.set(x, y, best);
  }
  void MAP_H;
  return out;
}
