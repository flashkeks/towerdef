import { describe, expect, it, vi } from 'vitest';

import json from '../../sim/data/maps/spire.json';
import { SP_BRANCHES, SP_BUILD, SP_HW, SP_LAVA, SP_PROPS, SP_WALLS, cisternAt, footRect, lavaAt, spBlockers, spWallPolys, spWater } from '../src/pixel/map/spire-layout';
import { inPoly, pathDistAll, pathLength } from '../src/pixel/map/kit';
import { ambientPoints, smokePoints } from '../src/pixel/map/ambient';
import { mapArt, mapPreview } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('Duskspire Keep: Layout und spire.json', () => {
  it('spire.json passt zum Layout (node scripts/run-ts.mjs scripts/gen-maps.ts schreibt neu)', () => {
    expect(json.id).toBe('spire');
    expect(json.size).toEqual([640, 360]);
    expect(json.water).toEqual(spWater());
    expect(json.lava).toEqual(SP_LAVA);
    expect(json.blockers).toEqual(spBlockers());
    expect((json as unknown as { walls: unknown }).walls).toEqual(spWallPolys());
    expect(json.paths).toEqual(SP_BRANCHES);
    expect(json.path).toEqual(SP_BRANCHES[0]);
    expect(json.buildArea).toEqual(SP_BUILD);
  });

  it('drei Eingaenge, jeder Ast 850 px, gleicher Ausgang', () => {
    expect(SP_BRANCHES).toHaveLength(3);
    for (const br of SP_BRANCHES) { expect(Math.abs(pathLength(br) - 850)).toBeLessThan(0.5); expect(br[0][0]).toBeLessThan(0); }
    const end = (i: number) => SP_BRANCHES[i][SP_BRANCHES[i].length - 1].join(',');
    expect(end(0)).toBe(end(1));
    expect(end(0)).toBe(end(2));
  });

  it('Wasser = nur die Zisterne (Lava ist kein Wasser); Platz fuer 2 Wassertuerme, Abstand zum Weg', () => {
    expect(json.water).toHaveLength(1);
    const poly = json.water[0] as [number, number][];
    let spots = 0;
    for (let y = 236; y < 280; y += 4) for (let x = 418; x < 490; x += 4) {
      const r = 8;
      if (![[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => inPoly(x + dx, y + dy, poly))) continue;
      spots++;
    }
    expect(spots).toBeGreaterThanOrEqual(4);
    for (const [x, y] of poly) expect(pathDistAll(SP_BRANCHES, x, y) - SP_HW).toBeGreaterThanOrEqual(2);
    expect(cisternAt(452, 256)).toBeLessThan(-5);
    expect(lavaAt(452, 256)).toBeGreaterThan(20);
  });

  it('Mauern und Bauten sind Blocker, keiner liegt auf dem Weg; Lava beruehrt den Weg nur an den Bruecken', () => {
    const bl = spBlockers();
    const bad: string[] = [];
    // der Bergfried (x > 570) steht am Pfadende und darf den letzten Wegpunkt beruehren
    for (const [x, y, r] of bl) if (x < 570 && pathDistAll(SP_BRANCHES, x, y) < SP_HW + r - 1.5) bad.push(`${x},${y} r${r}`);
    expect(bad).toEqual([]);
    expect(SP_WALLS.length).toBeGreaterThanOrEqual(4);
    expect(spWallPolys().length).toBe(SP_WALLS.length);
    for (const p of SP_PROPS) {
      const fr = footRect(p);
      if (!fr) continue;
      const [x, y] = [(fr[0] + fr[2]) / 2, (fr[1] + fr[3]) / 2];
      expect(bl.some(([bx, by, br]) => Math.hypot(bx - x, by - y) < br + 9), `${p.kind}@${p.x},${p.y}`).toBe(true);
    }
  });

  it('sehr wenig Bauplatz, aber mehrere Plaetze am Weg', () => {
    let ok = 0, total = 0, near = 0;
    const bl = spBlockers();
    const water = [spWater()[0]];
    for (let y = 12; y < 348; y += 6)
      for (let x = 12; x < 628; x += 6) {
        total++;
        if (pathDistAll(SP_BRANCHES, x, y) < SP_HW + 9) continue;
        if (SP_LAVA.some((p) => inPoly(x, y, p) || lavaAt(x, y) < 9)) continue;
        if (water.some((p) => inPoly(x, y, p))) continue;
        if (bl.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r + 9)) continue;
        ok++;
        if (pathDistAll(SP_BRANCHES, x, y) < SP_HW + 9 + 40) near++;
      }
    expect(ok / total).toBeGreaterThan(0.03);
    expect(ok / total).toBeLessThan(0.2);
    expect(near).toBeGreaterThan(30);
  });

  it('gemalt: 640 x 360, nur Palettenindizes, Bildfolge, Luftteilchen, Rauch, Vorschau 160 x 90', () => {
    const art = mapArt('spire');
    expect(art.id).toBe('spire');
    expect(art.ground.w).toBe(640);
    expect(art.ground.h).toBe(360);
    expect(art.ground.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim.length).toBeGreaterThanOrEqual(4);
    for (const f of art.anim) expect(f.d.every((c) => c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim[0].d).not.toEqual(art.anim[2].d);
    expect(art.props.length).toBe(SP_PROPS.length);
    expect(art.lights.length).toBeGreaterThanOrEqual(15);
    const a = ambientPoints('spire', 4000), b = ambientPoints('spire', 4000), c = ambientPoints('spire', 9000);
    expect(a.length).toBeGreaterThan(10);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(smokePoints(art.smoke, 500)).toHaveLength(art.smoke.length * 4);
    const pv = mapPreview('spire');
    expect(pv.w).toBe(160);
    expect(pv.h).toBe(90);
    expect(pv.d.every((c2) => c2 >= 1 && c2 <= PAL_NAMES.length)).toBe(true);
  });
});
