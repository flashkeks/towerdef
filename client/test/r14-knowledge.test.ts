import { describe, expect, it } from 'vitest';
import { BRANCHES, KNOWLEDGE } from '../src/meta';
import { DEFAULT_OPTS, layoutTree } from '../src/screens/knowledge-layout';
import { NODE_ICONS } from '../src/screens/knowledge';
import { S } from '../src/screens/text';
import { TOWER_TYPES } from '../src/meta';

const VIEWS: [number, number][] = [[1280, 720], [1920, 1080], [1366, 768], [2560, 1440]];
/** Brett = Fenster minus Kopf, Infofeld und Rand (grob wie im CSS) */
const board = (w: number, h: number) => ({ ...DEFAULT_OPTS, width: w - 72 - 8, height: h - 70 - (h <= 800 ? 76 : 104) - 60 });
const lay = layoutTree(KNOWLEDGE, BRANCHES as readonly string[], board(1920, 1080));

describe('Wissensbaum Runde 14b', () => {
  it('46 Knoten in fuenf Aesten (Runde 16: +6)', () => {
    expect(KNOWLEDGE).toHaveLength(46);
    expect(lay.branches).toHaveLength(5);
    expect(lay.branches.reduce((n, b) => n + b.nodes.length, 0)).toBe(46);
  });
  it('Knoten skalieren mit dem Fenster, bei 1280 x 720 noch lesbar', () => {
    const small = layoutTree(KNOWLEDGE, BRANCHES as readonly string[], board(1280, 720));
    expect(small.cell).toBeGreaterThanOrEqual(60);
    expect(lay.cell).toBeGreaterThan(small.cell);
    expect(lay.badge).toBeGreaterThanOrEqual(56);
  });
  for (const [w, h] of VIEWS) {
    it(`${w} x ${h}: alles auf einer Flaeche, innerhalb des Brettes, ohne Ueberlappung`, () => {
      const o = board(w, h);
      const l = layoutTree(KNOWLEDGE, BRANCHES as readonly string[], o);
      expect(l.x).toBeGreaterThanOrEqual(0);
      expect(l.x + l.w).toBeLessThanOrEqual(o.width);
      expect(l.y + l.h).toBeLessThanOrEqual(o.height);
      const seen = new Set<string>();
      for (const b of l.branches) {
        expect(b.x).toBeGreaterThanOrEqual(l.x);
        expect(b.x + b.w).toBeLessThanOrEqual(l.x + l.w + 1);
        for (const n of b.nodes) {
          expect(n.cx - l.colW / 2).toBeGreaterThanOrEqual(b.x - 1);
          expect(n.cx + l.colW / 2).toBeLessThanOrEqual(b.x + b.w + 1);
          expect(n.cy - l.cell / 2).toBeGreaterThanOrEqual(l.y);
          expect(n.cy + l.cell / 2).toBeLessThanOrEqual(l.y + l.h + 1);
          const k = `${n.cx}|${n.cy}`; expect(seen.has(k)).toBe(false); seen.add(k);
        }
      }
      for (const a of l.branches) for (const b of l.branches) if (a !== b) expect(a.x + a.w <= b.x || b.x + b.w <= a.x).toBe(true);
      // Abzeichen zweier Knoten ueberlappen nie (Mittelpunkte mindestens eine Zelle auseinander in einer Achse)
      const all = l.branches.flatMap((b) => b.nodes);
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        expect(Math.abs(all[i].cx - all[j].cx) >= l.badge || Math.abs(all[i].cy - all[j].cy) >= l.badge).toBe(true);
      }
    });
  }
  it('jede Voraussetzung hat eine Linie nach unten', () => {
    const want = KNOWLEDGE.reduce((n, k) => n + k.requires.length, 0);
    expect(lay.branches.reduce((n, b) => n + b.lines.length, 0)).toBe(want);
    for (const b of lay.branches) for (const l of b.lines) expect(l.y2).toBeGreaterThanOrEqual(l.y1);
  });
  it('jeder Knoten hat ein eigenes Icon (nicht nur den Stern)', () => {
    for (const n of KNOWLEDGE) expect(NODE_ICONS[n.id], n.id).toBeDefined();
  });
  it('Texte: Legende, Pfadnamen der neuen Tuerme', () => {
    expect(S.knowledge.legend.length).toBeGreaterThan(3);
    for (const t of TOWER_TYPES) expect(S.towers.paths[t], t).toHaveLength(3);
  });
});
