import { describe, expect, it, vi } from 'vitest';

import json from '../../sim/data/maps/harbor.json';
import { HB_BRANCHES, HB_BUILD, HB_HW, HB_PIERS, HB_PROPS, HB_WALLS, footRect, hbBlockers, hbWallPolys, hbWater, seaAt } from '../src/pixel/map/harbor-layout';
import { inPoly, pathDistAll, pathLength } from '../src/pixel/map/kit';
import { ambientPoints, smokePoints } from '../src/pixel/map/ambient';
import { mapArt, mapPreview } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('Gloomharbor: Layout und harbor.json', () => {
  it('harbor.json passt zum Layout (node scripts/run-ts.mjs scripts/gen-maps.ts schreibt neu)', () => {
    expect(json.id).toBe('harbor');
    expect(json.size).toEqual([640, 360]);
    expect(json.water).toEqual(hbWater());
    expect(json.blockers).toEqual(hbBlockers());
    expect((json as unknown as { walls: unknown }).walls).toEqual(hbWallPolys());
    expect(json.paths).toEqual(HB_BRANCHES);
    expect(json.path).toEqual(HB_BRANCHES[0]);
    expect(json.buildArea).toEqual(HB_BUILD);
  });

  it('zwei Eingaenge (Westtor, Nordstrasse), jeder Ast 950 px, gleicher Ausgang', () => {
    expect(HB_BRANCHES).toHaveLength(2);
    for (const br of HB_BRANCHES) expect(Math.abs(pathLength(br) - 950)).toBeLessThan(0.5);
    expect(HB_BRANCHES[0][0][0]).toBeLessThan(0);
    expect(HB_BRANCHES[1][0][1]).toBeLessThan(0);
    const end = (i: number) => HB_BRANCHES[i][HB_BRANCHES[i].length - 1].join(',');
    expect(end(0)).toBe(end(1));
  });

  it('das Hafenbecken ist gross (Wasser) und haelt Abstand zum Weg; Wassertuerme passen mehrfach hinein', () => {
    expect(json.water).toHaveLength(1);
    const poly = json.water[0] as [number, number][];
    // mindestens 8 x 3 Plaetze (Radius 11) im freien Wasser (ohne Stege/Schiffe)
    let spots = 0;
    const bl = hbBlockers();
    for (let y = 230; y < 350; y += 20) for (let x = 40; x < 480; x += 20) {
      const r = 11;
      if (![[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => inPoly(x + dx, y + dy, poly))) continue;
      if (bl.some(([bx, by, br]) => Math.hypot(bx - x, by - y) < br + r)) continue;
      spots++;
    }
    expect(spots).toBeGreaterThanOrEqual(24);
    // Land liegt am Weg: Wasser beruehrt den Weg nicht (Kaimauer dazwischen)
    for (const [x, y] of poly) if (x > 0 && x < 640 && y > 0 && y < 360) expect(pathDistAll(HB_BRANCHES, x, y) - HB_HW).toBeGreaterThanOrEqual(2);
  });

  it('Mauern, Haeuser, Stege und Schiffe sind Blocker; keiner liegt auf dem Weg', () => {
    const bl = hbBlockers();
    const bad: string[] = [];
    for (const [x, y, r] of bl) if (pathDistAll(HB_BRANCHES, x, y) < HB_HW + r - 1.5) bad.push(`${x},${y} r${r}`);
    expect(bad).toEqual([]);
    expect(HB_WALLS.length).toBeGreaterThanOrEqual(4);
    expect(hbWallPolys().length).toBe(HB_WALLS.length);
    // jedes Gebaeude ist vollstaendig von Blockerkreisen ueberdeckt (Mitte und Ecken, 2 px nach innen)
    for (const p of HB_PROPS) {
      const fr = footRect(p);
      if (!fr) continue;
      for (const [x, y] of [[(fr[0] + fr[2]) / 2, (fr[1] + fr[3]) / 2], [fr[0] + 2, fr[1] + 2], [fr[2] - 2, fr[1] + 2], [fr[0] + 2, fr[3] - 2], [fr[2] - 2, fr[3] - 2]])
        expect(bl.some(([bx, by, br]) => Math.hypot(bx - x, by - y) <= br), `${p.kind}@${p.x},${p.y}`).toBe(true);
    }
  });

  it('Schiffe liegen im Wasser, Stege reichen vom Kai ins Wasser', () => {
    for (const p of HB_PROPS.filter((q) => q.kind === 'ship' || q.kind === 'rowboat')) expect(seaAt(p.x, p.y), `${p.kind}@${p.x},${p.y}`).toBeLessThan(-2);
    for (const [x0, y0, x1, y1] of HB_PIERS) { expect(seaAt((x0 + x1) / 2, y0)).toBeGreaterThan(-1); expect(seaAt((x0 + x1) / 2, y1)).toBeLessThan(-4); }
  });

  it('Land ist knapp, aber es gibt Bauplaetze: wenige Prozent der Karte, mehrere Plaetze am Weg', () => {
    let ok = 0, total = 0, near = 0;
    const bl = hbBlockers();
    for (let y = 12; y < 348; y += 6)
      for (let x = 12; x < 628; x += 6) {
        total++;
        if (pathDistAll(HB_BRANCHES, x, y) < HB_HW + 9) continue;
        if (seaAt(x, y) < 9) continue;
        if (bl.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r + 9)) continue;
        ok++;
        if (pathDistAll(HB_BRANCHES, x, y) < HB_HW + 9 + 40) near++;
      }
    expect(ok / total).toBeGreaterThan(0.05);
    expect(ok / total).toBeLessThan(0.2);
    expect(near).toBeGreaterThan(40);
  });

  it('gemalt: 640 x 360, nur Palettenindizes, Wasserbildfolge, Nebel, Rauch, Vorschau 160 x 90', () => {
    const art = mapArt('harbor');
    expect(art.id).toBe('harbor');
    expect(art.ground.w).toBe(640);
    expect(art.ground.h).toBe(360);
    expect(art.ground.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim.length).toBeGreaterThanOrEqual(8);
    for (const f of art.anim) expect(f.d.every((c) => c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim[0].d).not.toEqual(art.anim[4].d);
    expect(art.props.length).toBe(HB_PROPS.length);
    expect(art.lights.length).toBeGreaterThanOrEqual(20);
    expect(art.smoke.length).toBeGreaterThanOrEqual(3);
    const a = ambientPoints('harbor', 4000), b = ambientPoints('harbor', 4000), c = ambientPoints('harbor', 9000);
    expect(a.length).toBeGreaterThan(20);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(smokePoints(art.smoke, 500)).toHaveLength(art.smoke.length * 4);
    const pv = mapPreview('harbor');
    expect(pv.w).toBe(160);
    expect(pv.h).toBe(90);
    expect(pv.d.every((c2) => c2 >= 1 && c2 <= PAL_NAMES.length)).toBe(true);
  });
});
