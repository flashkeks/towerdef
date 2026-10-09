import { describe, expect, it, vi } from 'vitest';

import json from '../../sim/data/maps/quarry.json';
import { BRIDGES_Q, EMBER_SEEDS, LAVA, Q_BRANCHES, Q_HW, QUARRY_PROPS, blockers, lavaAt } from '../src/pixel/map/quarry';
import { pathDistAll, pathLength } from '../src/pixel/map/kit';
import { ambientPoints } from '../src/pixel/map/ambient';
import { mapArt } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('Ember Quarry: Layout und quarry.json', () => {
  it('quarry.json passt zum Layout (node scripts/run-ts.mjs scripts/gen-maps.ts schreibt neu)', () => {
    expect(json.blockers).toEqual(blockers());
    expect(json.lava).toEqual(LAVA);
    expect(json.size).toEqual([640, 360]);
  });

  it('kurzer Weg (etwa 1.050 px) und vier Bruecken', () => {
    expect(Math.abs(pathLength(Q_BRANCHES[0]) - 1050)).toBeLessThan(60);
    expect(BRIDGES_Q).toHaveLength(4);
  });

  it('kein Blocker liegt auf dem Weg oder in der Lava', () => {
    const bad: string[] = [];
    for (const [x, y, r] of blockers()) {
      if (pathDistAll(Q_BRANCHES, x, y) < Q_HW + r - 0.01) bad.push(`${x},${y} r${r} auf dem Weg`);
      if (lavaAt(x, y) < r - 1) bad.push(`${x},${y} r${r} in der Lava`);
    }
    expect(bad).toEqual([]);
  });

  it('Bruecken liegen auf dem Weg und ueber Lava', () => {
    for (const [a, b] of BRIDGES_Q) {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      expect(pathDistAll(Q_BRANCHES, mx, my)).toBeLessThan(2);
      expect(lavaAt(mx, my)).toBeLessThan(0);
    }
  });

  it('Dinge ueberlappen sich nicht (kleine Zierde ausgenommen)', () => {
    const big = QUARRY_PROPS.filter((p) => p.r >= 5 && lavaAt(p.x, p.y) > 0);
    for (let i = 0; i < big.length; i++)
      for (let j = i + 1; j < big.length; j++) {
        const a = big[i], b = big[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.kind}@${a.x},${a.y} und ${b.kind}@${b.x},${b.y}`).toBeGreaterThanOrEqual(Math.min(a.r, b.r) * 1.2);
      }
  });

  it('wenig Bauplatz, aber nicht zu wenig (Lava und Felsen sperren)', () => {
    let ok = 0, total = 0, near = 0;
    const bl = blockers();
    for (let y = 12; y < 352; y += 6)
      for (let x = 12; x < 600; x += 6) {
        total++;
        if (pathDistAll(Q_BRANCHES, x, y) < Q_HW + 9) continue;
        if (lavaAt(x, y) < 9) continue;
        if (bl.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r + 9)) continue;
        ok++;
        if (pathDistAll(Q_BRANCHES, x, y) < Q_HW + 9 + 28) near++;
      }
    expect(ok / total).toBeGreaterThan(0.1);
    expect(ok / total).toBeLessThan(0.4);
    expect(near).toBeGreaterThan(100);
  });

  it('gemalt: 640 x 360, Palette, Lava-Bildfolge schliesst nahtlos, Funken und Dunst', () => {
    const art = mapArt('quarry');
    expect(art.ground.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    expect(art.anim).toHaveLength(8);
    expect(art.anim[0].d.some((c) => c > 0)).toBe(true);
    expect(art.anim[0].d).not.toEqual(art.anim[3].d);
    expect(art.props.length).toBe(QUARRY_PROPS.length);
    expect(art.lights.length).toBeGreaterThan(20);
    expect(EMBER_SEEDS.length).toBeGreaterThan(30);
    const a = ambientPoints('quarry', 777);
    expect(a.some((p) => p.kind === 'ember')).toBe(true);
    expect(a.some((p) => p.kind === 'haze')).toBe(true);
    expect(a).toEqual(ambientPoints('quarry', 777));
  });
});
