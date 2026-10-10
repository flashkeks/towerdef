import { describe, expect, it, vi } from 'vitest';

import json from '../../sim/data/maps/dunes.json';
import { DU_BRANCHES, DU_BUILD, DU_HW, DU_PROPS, OASIS, duBlockers, duWater, oasisAt } from '../src/pixel/map/dunes-layout';
import { inPoly, pathDistAll, pathLength } from '../src/pixel/map/kit';
import { ambientPoints, smokePoints } from '../src/pixel/map/ambient';
import { mapArt, mapPreview } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('Ashra Dunes: Layout und dunes.json', () => {
  it('dunes.json passt zum Layout (node scripts/run-ts.mjs scripts/gen-maps.ts schreibt neu)', () => {
    expect(json.id).toBe('dunes');
    expect(json.size).toEqual([640, 360]);
    expect(json.water).toEqual(duWater());
    expect(json.blockers).toEqual(duBlockers());
    expect(json.paths).toEqual(DU_BRANCHES);
    expect(json.path).toEqual(DU_BRANCHES[0]);
    expect(json.buildArea).toEqual(DU_BUILD);
  });

  it('drei Eingaenge, jeder Ast 1.000 px, alle enden im selben Punkt', () => {
    expect(DU_BRANCHES).toHaveLength(3);
    for (const br of DU_BRANCHES) expect(Math.abs(pathLength(br) - 1000)).toBeLessThan(0.5);
    const ends = DU_BRANCHES.map((b) => b[b.length - 1].join(','));
    expect(new Set(ends).size).toBe(1);
    // links oben, links unten, oben
    const starts = DU_BRANCHES.map((b) => b[0]);
    expect(starts[0][0]).toBeLessThan(0); expect(starts[0][1]).toBeLessThan(120);
    expect(starts[1][0]).toBeLessThan(0); expect(starts[1][1]).toBeGreaterThan(240);
    expect(starts[2][1]).toBeLessThan(0);
  });

  it('die Oase ist Wasser, gross genug fuer 3 Wassertuerme (Radius ~10) und haelt Abstand zum Weg', () => {
    expect(json.water).toHaveLength(1);
    let min = 1e9;
    for (const [x, y] of OASIS) min = Math.min(min, pathDistAll(DU_BRANCHES, x, y) - DU_HW);
    expect(min).toBeGreaterThanOrEqual(15);
    // drei Kreise (r 11) passen nebeneinander ganz hinein (Mittelpunkte in 20 px Abstand)
    const poly = json.water[0] as [number, number][];
    const fits = (cx: number, cy: number, r: number): boolean => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => inPoly(cx + dx, cy + dy, poly));
    const row = [48, 68, 88].filter((x) => fits(x, 189, 11));
    expect(row.length).toBe(3);
  });

  it('kein Blocker liegt auf dem Weg oder im Wasser', () => {
    const bad: string[] = [];
    for (const [x, y, r] of duBlockers()) {
      if (pathDistAll(DU_BRANCHES, x, y) < DU_HW + r - 0.01) bad.push(`${x},${y} r${r} auf dem Weg`);
      if (oasisAt(x, y) < r - 1) bad.push(`${x},${y} r${r} im Wasser`);
    }
    expect(bad).toEqual([]);
  });

  it('genug Bauplatz: Land mit Abstand zum Weg, Anteil und nahe Plaetze', () => {
    let ok = 0, total = 0, near = 0;
    const bl = duBlockers();
    for (let y = 12; y < 348; y += 6)
      for (let x = 12; x < 628; x += 6) {
        total++;
        if (pathDistAll(DU_BRANCHES, x, y) < DU_HW + 9) continue;
        if (oasisAt(x, y) < 9) continue;
        if (bl.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r + 9)) continue;
        ok++;
        if (pathDistAll(DU_BRANCHES, x, y) < DU_HW + 9 + 28) near++;
      }
    expect(ok / total).toBeGreaterThan(0.2);
    expect(near).toBeGreaterThan(200);
  });

  it('gemalt: 640 x 360, nur Palettenindizes, Wasserbildfolge, Sandsturm, Vorschau 160 x 90', () => {
    const art = mapArt('dunes');
    expect(art.id).toBe('dunes');
    expect(art.ground.w).toBe(640);
    expect(art.ground.h).toBe(360);
    expect(art.ground.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim.length).toBeGreaterThanOrEqual(6);
    for (const f of art.anim) expect(f.d.every((c) => c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim[0].d.some((c) => c > 0)).toBe(true);
    expect(art.anim[0].d).not.toEqual(art.anim[3].d);
    expect(art.props.length).toBe(DU_PROPS.length);
    expect(art.lights.length).toBeGreaterThanOrEqual(5);
    expect(art.smoke.length).toBeGreaterThanOrEqual(1);
    const a = ambientPoints('dunes', 4000), b = ambientPoints('dunes', 4000), c = ambientPoints('dunes', 9000);
    expect(a.length).toBeGreaterThan(80);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.some((p) => p.kind === 'haze')).toBe(true);
    expect(a.filter((p) => p.kind === 'flake').every((p) => p.x >= -40 && p.x <= 680 && p.y >= -6 && p.y < 370)).toBe(true);
    expect(smokePoints(art.smoke, 500)).toHaveLength(art.smoke.length * 4);
    const pv = mapPreview('dunes');
    expect(pv.w).toBe(160);
    expect(pv.h).toBe(90);
    expect(pv.d.every((c2) => c2 >= 1 && c2 <= PAL_NAMES.length)).toBe(true);
  });
});
