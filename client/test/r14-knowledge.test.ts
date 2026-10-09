import { describe, expect, it } from 'vitest';
import { BRANCHES, KNOWLEDGE } from '../src/meta';
import { DEFAULT_OPTS, layoutTree } from '../src/screens/knowledge-layout';
import { NODE_ICONS } from '../src/screens/knowledge';
import { S } from '../src/screens/text';
import { TOWER_TYPES } from '../src/meta';

const lay = layoutTree(KNOWLEDGE, BRANCHES as readonly string[], DEFAULT_OPTS);

describe('Wissensbaum Runde 14', () => {
  it('40 Knoten in fuenf Aesten', () => {
    expect(KNOWLEDGE).toHaveLength(40);
    expect(lay.branches).toHaveLength(5);
    expect(lay.branches.reduce((n, b) => n + b.nodes.length, 0)).toBe(40);
  });
  it('groesser als in Runde 13 (96 x 76)', () => {
    expect(DEFAULT_OPTS.nodeW).toBeGreaterThanOrEqual(112);
    expect(DEFAULT_OPTS.nodeH).toBeGreaterThanOrEqual(96);
  });
  it('Breite <= 1280 abzueglich Rand, die Hoehe wird gescrollt (mehrere Zeilen)', () => {
    expect(lay.width).toBeLessThanOrEqual(1280 - 72);
    expect(lay.rows).toBeGreaterThanOrEqual(2);
    expect(lay.height).toBeGreaterThan(720);
    for (const b of lay.branches) expect(b.x + b.w).toBeLessThanOrEqual(DEFAULT_OPTS.maxW);
  });
  it('Zeilen stapeln ohne Ueberlappung, Aeste einer Zeile stehen nebeneinander', () => {
    for (const a of lay.branches) for (const b of lay.branches) {
      if (a === b) continue;
      const sepX = a.x + a.w <= b.x || b.x + b.w <= a.x, sepY = a.y + a.h <= b.y || b.y + b.h <= a.y;
      expect(sepX || sepY, `${a.branch}/${b.branch}`).toBe(true);
    }
  });
  it('jede Voraussetzung hat eine Linie nach unten', () => {
    const want = KNOWLEDGE.reduce((n, k) => n + k.requires.length, 0);
    expect(lay.branches.reduce((n, b) => n + b.lines.length, 0)).toBe(want);
    for (const b of lay.branches) for (const l of b.lines) expect(l.y2).toBeGreaterThanOrEqual(l.y1);
  });
  it('freie Breite in der letzten Zeile reicht fuer die Legende', () => { expect(lay.freeRight).toBeGreaterThanOrEqual(260); });
  it('jeder Knoten hat ein eigenes Icon (nicht nur den Stern)', () => {
    for (const n of KNOWLEDGE) expect(NODE_ICONS[n.id], n.id).toBeDefined();
  });
  it('Texte: Legende, Pfadnamen der neuen Tuerme', () => {
    expect(S.knowledge.legend.length).toBeGreaterThan(3);
    for (const t of TOWER_TYPES) expect(S.towers.paths[t], t).toHaveLength(3);
  });
});
