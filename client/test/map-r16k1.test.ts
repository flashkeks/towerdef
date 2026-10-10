import { describe, expect, it, vi } from 'vitest';

import skyJson from '../../sim/data/maps/skyreach.json';
import baJson from '../../sim/data/maps/bastion.json';
import hoJson from '../../sim/data/maps/hollow.json';
import maJson from '../../sim/data/maps/marsh.json';
import * as sky from '../src/pixel/map/skyreach';
import * as ba from '../src/pixel/map/bastion';
import * as ho from '../src/pixel/map/hollow';
import * as ma from '../src/pixel/map/marsh';
import { pathDistAll } from '../src/pixel/map/kit';
import { ambientPoints } from '../src/pixel/map/ambient';
import { composeMap, mapArt, mapPreview } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('K1-Karten: JSON gleich Layout (node scripts/run-ts.mjs scripts/gen-maps.ts schreibt neu)', () => {
  it('hollow', () => { expect(hoJson.water).toEqual(ho.waterPolygons()); expect(hoJson.blockers).toEqual(ho.blockers()); });
  it('marsh', () => { expect(maJson.water).toEqual(ma.waterPolygons()); expect(maJson.blockers).toEqual(ma.blockers()); });
  it('bastion (Mauern als walls und als Kreisketten in blockers)', () => {
    const j = baJson as unknown as { water: unknown; blockers: unknown; walls: unknown };
    expect(j.water).toEqual(ba.waterPolygons()); expect(j.blockers).toEqual(ba.blockers()); expect(j.walls).toEqual(ba.wallPolygons());
  });
  it('skyreach (Schluchten und Massiv als Kreise in blockers, See als water)', () => { expect(skyJson.water).toEqual(sky.waterPolygons()); expect(skyJson.blockers).toEqual(sky.blockers()); });
});

describe('Skyreach Cliffs', () => {
  it('zwei Eingaenge, drei Haengebruecken (zwei ueber Schlucht A, eine ueber B)', () => {
    expect(sky.SK_BRANCHES).toHaveLength(2);
    expect(sky.BRIDGES).toHaveLength(3);
  });
  it('jeder Wegpunkt in einer Schlucht liegt auf einer Bruecke', () => {
    for (const br of sky.SK_BRANCHES) for (let i = 0; i < br.length; i++) {
      const [x, y] = br[i];
      if (sky.gorgeAt(x, y) < 0) expect(sky.BRIDGES.some((b) => pathDistAll([b.pts], x, y) < 1.5), `${x},${y}`).toBe(true);
    }
  });
  it('der Bergsee haelt Abstand zum Weg und zu den Schluchten', () => {
    let min = 1e9;
    for (const [x, y] of sky.LAKE) { min = Math.min(min, pathDistAll(sky.SK_BRANCHES, x, y) - sky.SK_HW); expect(sky.gorgeAt(x, y)).toBeGreaterThan(8); }
    expect(min).toBeGreaterThan(20);
  });
});

describe('Bastion: Mauern', () => {
  it('Mauer-Polygone sperren: kein Mauerstueck liegt auf dem Weg', () => {
    const polys = ba.wallPolygons();
    expect(polys.length).toBeGreaterThanOrEqual(6);
    for (const p of polys) { const cx = (p[0][0] + p[1][0]) / 2, cy = (p[0][1] + p[2][1]) / 2; expect(pathDistAll(ba.BA_BRANCHES, cx, cy)).toBeGreaterThan(ba.BA_HW - 1); }
  });
});

describe('Alle vier: Bild, Vorschau, Ambient', () => {
  for (const id of ['hollow', 'marsh', 'bastion', 'skyreach'] as const) {
    it(id, () => {
      const a = mapArt(id);
      expect(a.anim.length).toBeGreaterThanOrEqual(8);
      expect(composeMap(id, 3).d.every((c) => c > 0)).toBe(true);
      const p = mapPreview(id);
      expect([p.w, p.h]).toEqual([160, 90]);
      expect(p.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
      // Ambient: zu zwei Zeiten verschieden und nur Palettenfarben
      const t1 = ambientPoints(id, 4000), t2 = ambientPoints(id, 9000);
      expect(t1.length).toBeGreaterThan(5);
      expect(JSON.stringify(t1)).not.toBe(JSON.stringify(t2));
      for (const q of t1) expect(q.c >= 1 && q.c <= PAL_NAMES.length).toBe(true);
    });
  }
  it('Hollow und Marsh: Pfahlhuette / Bauernhaus rauchen', () => {
    expect(mapArt('hollow').smoke.length).toBeGreaterThan(0);
    expect(mapArt('marsh').smoke.length).toBeGreaterThan(0);
    expect(mapArt('skyreach').smoke.length).toBeGreaterThan(0);
  });
});
