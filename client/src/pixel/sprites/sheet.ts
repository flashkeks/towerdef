/** Testseite fuer Sprite-Boegen (nur Entwicklung/Screenshots, wird nicht ins Spiel gebundelt). */
import * as api from './index';

const q = new URLSearchParams(location.search);
const which = q.get('sheet') ?? 'towers';
const SCALE = Number(q.get('scale') ?? 4);
const out = document.getElementById('out') as HTMLElement;

function mk(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  return { c, g };
}
function blit(g: CanvasRenderingContext2D, s: api.Sprite, x: number, y: number, k = SCALE): void {
  g.drawImage(s.canvas, x - s.ax * k, y - s.ay * k, s.canvas.width * k, s.canvas.height * k);
}
function label(g: CanvasRenderingContext2D, t: string, x: number, y: number, col = '#c0cbdc'): void {
  g.fillStyle = col; g.font = '12px monospace'; g.fillText(t, x, y);
}

function sheetTowers(): void {
  const types = ['ranger', 'bombardier', 'frostcaller'] as const;
  const tierRows: Record<string, number[][]> = {
    ranger: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]],
  };
  const cw = 60 * SCALE, ch = 60 * SCALE;
  const cols = 8;
  const { c, g } = mk(cols * cw, 0.01);
  void c; void g; void tierRows; void types;
}
void sheetTowers;

if (which === 'quick') {
  const { c, g } = mk(8 * 60 * SCALE, 60 * SCALE * 3);
  g.fillStyle = '#3e8948'; g.fillRect(0, 0, c.width, c.height);
  const rows = [[0, 0, 0], [5, 0, 0], [0, 5, 0], [0, 0, 5], [3, 0, 2], [4, 2, 0], [0, 3, 2], [0, 2, 4]];
  for (let r = 0; r < 3; r++)
    rows.forEach((t, i) => {
      const spr = api.towerSprite((q.get('t') ?? 'ranger') as 'ranger', t as [number, number, number], r === 0 ? 0 : r === 1 ? 7 : 2, r === 2 ? 'atk1' : 'idle0');
      blit(g, spr, i * 60 * SCALE + 30 * SCALE, r * 60 * SCALE + 50 * SCALE);
    });
  out.appendChild(c);
}
(window as unknown as { __ready: boolean }).__ready = true;
if (which === 'hero') {
  const { c, g } = mk(8 * 60 * SCALE, 60 * SCALE * 3);
  g.fillStyle = '#3e8948'; g.fillRect(0, 0, c.width, c.height);
  const lv = [1, 5, 10, 15, 20, 20, 20, 20];
  for (let r = 0; r < 3; r++)
    lv.forEach((l, i) => {
      const spr = api.heroSprite(l, r === 0 ? 0 : r === 1 ? 7 : 2, i < 5 ? (r === 2 ? 'atk1' : 'idle0') : i === 5 ? 'atk2' : i === 6 ? 'cast0' : 'cast1');
      blit(g, spr, i * 60 * SCALE + 30 * SCALE, r * 60 * SCALE + 50 * SCALE);
    });
  out.appendChild(c);
}
