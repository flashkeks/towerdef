/** Runde 10 / P4: Kartenbild je Welt. Das Malen selbst braucht eine Zeichenflaeche (Browser, im Smoke und per shots-r10-p4 geprueft); hier die reine Logik. */
import { describe, expect, it } from 'vitest';
import { boardPx, mix, pathLine, resolveBoard, rgba, shade } from '../src/game/board-art';
import { loadBrowserData } from '../src/sim';

const data = loadBrowserData();
const worldIds = (data.worlds ?? []).map((w) => w.id);

describe('Kartenthema im Client (P4)', () => {
  it('jede Welt-Stage traegt ein Kartenthema, das der Client unveraendert benutzt', () => {
    expect(worldIds.length).toBeGreaterThanOrEqual(10);
    for (const id of worldIds) {
      const st = data.stages[`${id}-1`];
      expect(st.theme?.board, id).toBeDefined();
      expect(resolveBoard(st.theme), id).toBe(st.theme!.board);
    }
  });

  it('Stage ohne `board` (Standard-Stage, alte Daten) bekommt ein abgeleitetes Thema aus Gras- und Pfadfarbe', () => {
    const std = resolveBoard(data.stages['standard20'].theme);
    expect(std.ground.pattern).toBe('grass');
    expect(std.deco.length).toBeGreaterThan(0);
    const t = data.stages['greenie-1'].theme!;
    const derived = resolveBoard({ ...t, board: undefined });
    expect(derived.ground.base).toBe(t.grass.color);
    expect(derived.path.base).toBe(t.path.color);
    expect(derived.light.ambient).toBe('none');
  });

  it('Farbhelfer: mix, shade, rgba', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(shade('#808080', 1)).toBe('#ffffff');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(rgba('#ff8000', 0.5)).toBe('rgba(255,128,0,0.5)');
  });

  it('Aufloesung der Zeichenflaeche folgt Kachel x Pixeldichte in 16er-Stufen, gedeckelt', () => {
    expect(boardPx(48, 1)).toBe(48);
    expect(boardPx(49, 1)).toBe(64);
    expect(boardPx(72, 2)).toBe(96);
    expect(boardPx(10, 1)).toBe(32);
  });

  it('Pfadlinie: Start am Rand wird bis zur Kartenkante verlaengert, sonst Kachelmitte', () => {
    const g = data.stages['greenie-1'];
    const line = pathLine(g, g.zones.rows[0].length, g.zones.rows.length);
    expect(line[0]).toEqual([0, 1.5]);
    expect(line[1]).toEqual([14.5, 1.5]);
    expect(line[line.length - 1]).toEqual([6.5, 6.5]);
  });
});
