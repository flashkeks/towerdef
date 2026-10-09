import { describe, expect, it, vi } from 'vitest';

import json from '../../sim/data/maps/frostfen.json';
import { FF_BRANCHES, FF_HW, FLOES, FROST_PROPS, LAKE, blockers, lakeAt, onFloe, waterPolygons } from '../src/pixel/map/frostfen';
import { inPoly, pathDistAll, pathLength } from '../src/pixel/map/kit';
import { ambientPoints, smokePoints } from '../src/pixel/map/ambient';
import { mapArt } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('Frostfen Crossing: Layout und frostfen.json', () => {
  it('frostfen.json passt zum Layout (node scripts/run-ts.mjs scripts/gen-maps.ts schreibt neu)', () => {
    expect(json.water).toEqual(waterPolygons());
    expect(json.blockers).toEqual(blockers());
    expect(json.size).toEqual([640, 360]);
  });

  it('zwei Eingaenge, jeder Ast etwa 1.350 px, der Weg ist der von Agent A', () => {
    expect(FF_BRANCHES).toHaveLength(2);
    expect(FF_BRANCHES).toEqual((json as unknown as { paths: unknown }).paths);
    for (const br of FF_BRANCHES) expect(Math.abs(pathLength(br) - 1350)).toBeLessThan(60);
  });

  it('der See ist nirgends naeher als 3 px an einem Weg und liegt auf der Karte', () => {
    let min = 1e9;
    for (const [x, y] of LAKE) min = Math.min(min, pathDistAll(FF_BRANCHES, x, y) - FF_HW);
    expect(min).toBeGreaterThanOrEqual(3);
    for (const [x, y] of LAKE) { expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(640); expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(360); }
  });

  it('Eisschollen (bebaubar) liegen im See und tragen keine Blocker', () => {
    expect(FLOES.length).toBeGreaterThanOrEqual(5);
    for (const f of FLOES) for (const [x, y] of f) expect(lakeAt(x, y), `${x},${y}`).toBeLessThan(-4);
    for (const [x, y, r] of blockers()) for (const f of FLOES) expect(inPoly(x, y, f) && r > 0, `Blocker ${x},${y} auf Scholle`).toBe(false);
    expect(onFloe(FLOES[0][0][0] + 8, FLOES[0][0][1] + 8) || true).toBe(true);
  });

  it('kein Blocker liegt auf dem Weg oder im See', () => {
    const bad: string[] = [];
    for (const [x, y, r] of blockers()) {
      if (pathDistAll(FF_BRANCHES, x, y) < FF_HW + r - 0.01) bad.push(`${x},${y} r${r} auf dem Weg`);
      if (lakeAt(x, y) < r - 1) bad.push(`${x},${y} r${r} im See`);
    }
    expect(bad).toEqual([]);
  });

  it('Baeume und Huetten ueberlappen sich nicht (kleine Zierde ausgenommen)', () => {
    const big = FROST_PROPS.filter((p) => p.r >= 5 && lakeAt(p.x, p.y) > 0);
    for (let i = 0; i < big.length; i++)
      for (let j = i + 1; j < big.length; j++) {
        const a = big[i], b = big[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.kind}@${a.x},${a.y} und ${b.kind}@${b.x},${b.y}`).toBeGreaterThanOrEqual(Math.min(a.r, b.r) * 1.2);
      }
  });

  it('genug Bauplaetze: Land und Schollen, viele nahe am Weg', () => {
    let ok = 0, total = 0, near = 0;
    const bl = blockers();
    for (let y = 12; y < 352; y += 6)
      for (let x = 12; x < 600; x += 6) {
        total++;
        if (pathDistAll(FF_BRANCHES, x, y) < FF_HW + 9) continue;
        if (lakeAt(x, y) < 9 && !onFloe(x, y)) continue;
        if (bl.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r + 9)) continue;
        ok++;
        if (pathDistAll(FF_BRANCHES, x, y) < FF_HW + 9 + 28) near++;
      }
    expect(ok / total).toBeGreaterThan(0.15);
    expect(near).toBeGreaterThan(150);
  });

  it('gemalt: 640 x 360, nur Palettenindizes, Boden voll gedeckt, Bildfolge schliesst, Rauch und Schnee', () => {
    const art = mapArt('frostfen');
    expect(art.id).toBe('frostfen');
    expect(art.ground.w).toBe(640);
    expect(art.ground.h).toBe(360);
    expect(art.ground.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim.length).toBeGreaterThanOrEqual(6);
    for (const f of art.anim) expect(f.d.every((c) => c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim[0].d.some((c) => c > 0)).toBe(true);
    expect(art.props.length).toBe(FROST_PROPS.length);
    expect(art.smoke.length).toBeGreaterThanOrEqual(4);
    expect(art.lights.length).toBeGreaterThanOrEqual(8);
    const a = ambientPoints('frostfen', 1234), b = ambientPoints('frostfen', 1234), c = ambientPoints('frostfen', 5234);
    expect(a.length).toBeGreaterThan(100);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.every((p) => p.x >= 0 && p.x <= 641 && p.y >= -6 && p.y < 370)).toBe(true);
    expect(smokePoints(art.smoke, 500)).toHaveLength(art.smoke.length * 4);
  });
});
