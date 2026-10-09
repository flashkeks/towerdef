import { describe, expect, it } from 'vitest';
import json from '../../sim/data/maps/meadow.json';
import { BLOCK_R, BRIDGES, PATH, PATH_HW, PROPS, blockers, pathDist, waterDist, waterPolygons } from '../src/pixel/map/layout';
import { meadowArt } from '../src/pixel/map/compose';
import { PAL_NAMES } from '../src/pixel/palette';


describe('Lanternfall Meadow: Layout und meadow.json', () => {
  it('meadow.json passt zum Layout (npx tsx scripts/gen-meadow.ts schreibt neu)', () => {
    expect(json.water).toEqual(waterPolygons());
    expect(json.blockers).toEqual(blockers());
    expect(json.path).toEqual(PATH);
    expect(json.size).toEqual([640, 360]);
  });

  it('der Weg bleibt wie im Vertrag (Laenge 1550..1750 px)', () => {
    let len = 0;
    for (let i = 1; i < PATH.length; i++) len += Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]);
    expect(len).toBeGreaterThan(1550);
    expect(len).toBeLessThan(1750);
  });

  it('der Bach kreuzt den Weg dreimal, mit je einer Bruecke', () => {
    expect(BRIDGES).toHaveLength(3);
  });

  it('kein Blocker liegt auf dem Weg oder im Wasser', () => {
    const bad: string[] = [];
    for (const [x, y, r] of blockers()) {
      if (pathDist(x, y) < PATH_HW + r - 0.01) bad.push(`${x},${y} r${r} auf dem Weg`);
      if (x > 262 && x < 470 && waterDist(x, y) < r - 1) bad.push(`${x},${y} r${r} im Wasser`);
    }
    expect(bad).toEqual([]);
  });

  it('Baeume und Haeuser ueberlappen sich nicht (kleine Zierde ausgenommen)', () => {
    const big = PROPS.filter((p) => p.r >= 5);
    for (let i = 0; i < big.length; i++)
      for (let j = i + 1; j < big.length; j++) {
        const a = big[i], b = big[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d, `${a.kind}@${a.x},${a.y} und ${b.kind}@${b.x},${b.y}`).toBeGreaterThanOrEqual(Math.min(a.r, b.r) * 1.2);
      }
    expect(BLOCK_R.oak).toBeGreaterThan(0);
  });

  it('genug Bauplaetze: mindestens 30 % der Spielflaeche, viele Plaetze nahe am Weg', () => {
    let ok = 0, total = 0, near = 0;
    const bl = blockers();
    for (let y = 12; y < 352; y += 6)
      for (let x = 12; x < 600; x += 6) {
        total++;
        if (pathDist(x, y) < PATH_HW + 9) continue;
        if (x > 262 && x < 470 && waterDist(x, y) < 9) continue;
        if (bl.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r + 9)) continue;
        ok++;
        if (pathDist(x, y) < PATH_HW + 9 + 28) near++;
      }
    expect(ok / total).toBeGreaterThan(0.3);
    expect(near).toBeGreaterThan(300);
  });

  it('gemalte Karte: 640 x 360, nur Palettenindizes, Boden voll gedeckt', () => {
    const art = meadowArt();
    expect(art.ground.w).toBe(640);
    expect(art.ground.h).toBe(360);
    expect(art.ground.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    expect(art.water).toHaveLength(6);
    expect(art.props.length).toBe(PROPS.length);
  });
});
