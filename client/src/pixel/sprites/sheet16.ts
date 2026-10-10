/** Sprite-Boegen Runde 16 TP (nur Entwicklung/Screenshots): Helden Bram und Sela, Geschosse, Faehigkeits-Icons. Eingebunden von sheet.ts. */
import * as api from './index';
import type { HeroType, ProjectileKind } from './types';

const GRASS = '#3e8948', PANEL = '#262b44';
function mk(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.fillStyle = PANEL; g.fillRect(0, 0, w, h);
  return { c, g };
}
function blit(g: CanvasRenderingContext2D, s: api.Sprite, x: number, y: number, k: number): void {
  g.drawImage(s.canvas, x - s.ax * k, y - s.ay * k, s.canvas.width * k, s.canvas.height * k);
}
function label(g: CanvasRenderingContext2D, t: string, x: number, y: number): void {
  g.fillStyle = '#fff'; g.font = '12px monospace'; g.fillText(t, x, y);
}
function tile(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col = GRASS): void {
  g.fillStyle = col; g.fillRect(x, y, w, h);
}

const CELL_W = 100, CELL_H = 84;
/** Zelle ohne Raster-Rand: Held ausschnitt 96 x 80 -> wir zeigen die Mitte (Figur ist hoechstens ~60 px hoch). */
function heroCell(g: CanvasRenderingContext2D, K: number, col: number, row: number, hero: HeroType, lv: number, f: number, fr: api.HeroFrame, text: string): void {
  const CW = CELL_W * K * 0.62, CH = CELL_H * K * 0.74;
  const x = 10 + col * CW, y = 10 + row * CH;
  tile(g, x, y, CW - 4, CH - 4);
  blit(g, api.heroSprite(hero, lv, f, fr), x + CW / 2, y + CH - 14 * K, K);
  label(g, text, x + 4, y + 14);
}

/** Alle fuenf Stufen (idle + atk), alle Frames auf Stufe 20 und 10 (inkl. cast), acht Richtungen. */
export function sheetHeroR16(hero: HeroType): HTMLCanvasElement {
  const K = 3, CW = CELL_W * K * 0.62, CH = CELL_H * K * 0.74;
  const { c, g } = mk(Math.ceil(10 * CW + 20), Math.ceil(5 * CH + 20));
  [1, 5, 10, 15, 20].forEach((l, i) => {
    heroCell(g, K, i, 0, hero, l, 0, 'idle0', `L${l} idle`);
    heroCell(g, K, i, 1, hero, l, 7, 'atk1', `L${l} atk1`);
    heroCell(g, K, i + 5, 0, hero, l, 0, 'cast0', `L${l} cast0`);
    heroCell(g, K, i + 5, 1, hero, l, 0, 'cast1', `L${l} cast1`);
  });
  api.HERO_FRAMES.forEach((f, i) => heroCell(g, K, i, 2, hero, 20, 0, f, `L20 ${f}`));
  api.HERO_FRAMES.forEach((f, i) => heroCell(g, K, i, 3, hero, 10, 0, f, `L10 ${f}`));
  for (let d = 0; d < 8; d++) heroCell(g, K, d, 4, hero, 15, d, 'idle0', `L15 facing ${d}`);
  heroCell(g, K, 8, 4, hero, 20, 3, 'atk2', 'L20 f3 atk2');
  heroCell(g, K, 9, 4, hero, 20, 2, 'atk1', 'L20 f2 atk1');
  return c;
}

const PROJ: ProjectileKind[] = ['hammer', 'starlight'];
/** Geschosse (starlight in 16 Richtungen, hammer in 16 Drehschritten) und die vier Faehigkeits-Icons gross, dazu die Vorbilder zum Vergleich. */
export function sheetFxHeroesR16(): HTMLCanvasElement {
  const { c, g } = mk(16 * 52 + 20, 2 * 80 + 4 * 140 + 20);
  let y = 10;
  PROJ.forEach((k) => {
    for (let d = 0; d < 16; d++) {
      const x = 10 + d * 52;
      tile(g, x, y, 48, 48);
      blit(g, api.projectileSprite(k, d), x + 24, y + 24, 3);
    }
    label(g, k, 10, y + 62);
    y += 80;
  });
  (['anvilDrop', 'forgeOfDawn', 'starfall', 'eclipse'] as const).forEach((a, i) => {
    tile(g, 10 + i * 140, y, 130, 130, '#333c57');
    blit(g, api.iconAbility(a), 10 + i * 140 + 1, y + 1, 8);
    label(g, a, 10 + i * 140 + 4, y + 142);
  });
  (['alarm', 'flare', 'dawnbreak', 'absoluteZero'] as const).forEach((a, i) => { tile(g, 600 + i * 70, y, 66, 66, '#333c57'); blit(g, api.iconAbility(a), 600 + i * 70 + 1, y + 1, 4); });
  return c;
}

/** Grosse Ansicht (5x): fuenf Stufen nebeneinander, Zeilen idle, atk2, cast1, Blick nach vorn (6) und nach hinten (2). */
export function sheetHeroZoomR16(hero: HeroType): HTMLCanvasElement {
  const K = 5, S = 64 * K;
  const rows: [string, number, api.HeroFrame][] = [['idle', 0, 'idle0'], ['atk2', 0, 'atk2'], ['cast1', 0, 'cast1'], ['front', 6, 'idle1'], ['back', 2, 'idle1']];
  const { c, g } = mk(5 * (S + 6) + 10, rows.length * (S + 6) + 10);
  rows.forEach(([name, f, fr], r) => {
    [1, 5, 10, 15, 20].forEach((l, i) => {
      const x = 10 + i * (S + 6), y = 10 + r * (S + 6);
      tile(g, x, y, S, S);
      const sp = api.heroSprite(hero, l, f, fr);
      g.drawImage(sp.canvas, 16, 10, 64, 64, x, y, S, S);
      label(g, `${hero} L${l} ${name}`, x + 4, y + 14);
    });
  });
  return c;
}
