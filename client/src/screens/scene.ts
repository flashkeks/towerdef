/** Kleine Abendszene fuer die Kartenkachel (prozedural, nur Palettenfarben, fester Seed). */
import { rowsToCanvas, type Sprite } from '../pixel/sprites/canvas';
import { Surface, irnd } from '../pixel/sprites/surface';

let cached: Sprite | null = null;

export function meadowScene(): Sprite {
  if (cached) return cached;
  const W = 160, H = 84;
  const s = new Surface(W, H);
  const rnd = irnd(11);
  // Himmel in Baendern: Daemmerung (links violett) bis Laternenlicht (rechts warm)
  const bands = ['night', 'dusk', 'violet', 'orchid', 'coral', 'peach'] as const;
  for (let y = 0; y < 48; y++) {
    const k = Math.min(bands.length - 1, Math.floor((y / 48) * bands.length));
    for (let x = 0; x < W; x++) {
      const warm = x / W > 0.55 + (y % 3) * 0.02;
      s.px(x, y, warm && k >= 3 ? bands[Math.min(k + 1, 5)] : bands[k]);
    }
  }
  for (let i = 0; i < 40; i++) s.px(Math.floor(rnd() * W * 0.6), 12 + Math.floor(rnd() * 24), rnd() > 0.6 ? 'white' : 'silver');
  s.ball(30, 24, 7, 7, ['stone', 'silver', 'white'], true);
  // ferne Huegel
  for (let x = 0; x < W; x++) {
    const y = 44 - Math.round(5 * Math.sin(x / 13) + 3 * Math.sin(x / 5 + 1));
    s.rect(x, y, 1, 50, 'deep');
  }
  for (let x = 0; x < W; x++) {
    const y = 52 - Math.round(4 * Math.sin(x / 17 + 2) + 2 * Math.sin(x / 7));
    s.rect(x, y, 1, 40, 'pine');
    if (rnd() > 0.7) s.px(x, y, 'grass');
  }
  // Wiese
  s.rect(0, 58, W, H - 58, 'grass');
  for (let i = 0; i < 160; i++) s.px(Math.floor(rnd() * W), 58 + Math.floor(rnd() * 26), rnd() > 0.5 ? 'leaf' : 'pine');
  // Erdpfad in Kurven
  for (let y = 56; y < H; y++) {
    const cx = 70 + Math.round(26 * Math.sin((y - 56) / 6.5) * (1 - (y - 56) / 60));
    const w = 3 + Math.floor((y - 56) / 5);
    s.rect(cx - w, y, w * 2, 1, 'tan');
    s.px(cx - w, y, 'wood');
    s.px(cx + w - 1, y, 'wood');
    if (rnd() > 0.8) s.px(cx + Math.floor(rnd() * w) - 1, y, 'sand');
  }
  // Baeume
  const tree = (x: number, y: number, r: number): void => {
    s.rect(x - 1, y - 2, 3, 6, 'bark');
    s.ball(x, y - 7, r, r, ['deep', 'pine', 'grass'], true);
    s.ball(x - 2, y - 4, r - 2, r - 3, ['deep', 'pine', 'grass']);
  };
  tree(12, 64, 7); tree(26, 58, 5); tree(138, 62, 8); tree(150, 57, 5); tree(118, 57, 4);
  // Laternen mit Lichtkreis
  for (const [x, y] of [[48, 68], [100, 72], [124, 66]]) {
    s.rect(x, y - 8, 1, 8, 'bark');
    s.rect(x - 1, y - 11, 3, 3, 'amber');
    s.px(x, y - 10, 'yellow');
    for (let a = -5; a <= 5; a++) for (let b = -3; b <= 3; b++) if (a * a + b * b * 2 < 22 && (a + b) % 2 === 0) s.pxUnder(x + a, y + b - 4, 'yellow');
  }
  // Gluehwuermchen
  for (let i = 0; i < 9; i++) s.px(Math.floor(rnd() * W), 40 + Math.floor(rnd() * 36), 'yellow');
  // Stadttor ganz rechts
  s.box(151, 40, 9, 22, ['dusk', 'stone', 'silver']);
  s.rect(153, 48, 5, 14, 'ink');
  s.rect(151, 36, 9, 4, 'slate');
  s.rect(154, 30, 1, 6, 'bark');
  s.poly([[155, 30], [159, 32], [155, 34]], 'red');
  const rows = s.toRows();
  cached = rowsToCanvas(rows, 0, 0);
  return cached;
}
