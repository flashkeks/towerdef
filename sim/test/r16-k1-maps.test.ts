/** Runde 16 / K1: die vier neuen Karten (hollow, marsh, bastion, skyreach) laden, Wege und Wasser stimmen. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, createGame, getMap } from '../src/index';

const IDS = ['hollow', 'marsh', 'bastion', 'skyreach'] as const;
const LEN: Record<string, [number, number, number]> = { hollow: [1750, 60, 1], marsh: [1500, 60, 1], bastion: [1250, 60, 2], skyreach: [1150, 60, 2] };
const len = (p: readonly (readonly [number, number])[]): number => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);

describe('Runde 16 K1: Karten', () => {
  for (const id of IDS) {
    it(`${id}: createGame laedt, 640 x 360, Weglaenge und Eingaenge`, () => {
      const g = createGame({ map: id, difficulty: 'medium', seed: 1 });
      expect(g.state).toBeTruthy();
      const f = DATA.maps[id];
      expect(f.size).toEqual([640, 360]);
      const [target, tol, n] = LEN[id];
      const paths = f.paths ?? [f.path];
      expect(paths).toHaveLength(n);
      for (const p of paths) expect(Math.abs(len(p) - target)).toBeLessThan(tol);
      if (n === 2) expect(Math.abs(len(paths[0]) - len(paths[1]))).toBeLessThan(0.5);
      expect(getMap(id).paths).toHaveLength(n);
    });
    it(`${id}: Wasser vorhanden, Blocker liegen im Bild`, () => {
      const m = getMap(id);
      if (id !== 'hollow') expect(m.water.length).toBeGreaterThan(0);
      expect(m.water.length).toBeGreaterThan(0);
      expect(m.blockers.length).toBeGreaterThan(10);
      for (const b of m.blockers) { expect(b.x).toBeGreaterThan(-20_000); expect(b.x).toBeLessThan(660_000); }
    });
  }
  it('Bauplatz: auf jeder Karte findet ein Raster-Lauf genug Stellen fuer einen Ranger', () => {
    for (const id of IDS) {
      const g = createGame({ map: id, difficulty: 'medium', seed: 1 });
      let ok = 0;
      for (let y = 20_000; y < 340_000; y += 8_000) for (let x = 20_000; x < 620_000; x += 8_000) if (g.canPlace('ranger', x, y).ok) ok++;
      expect(ok, id).toBeGreaterThan(300);
    }
  });
});
