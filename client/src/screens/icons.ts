/**
 * Kleine Pixel-Icons fuer die Meta-Bildschirme (Medaillen, Schloss, Wissensknoten ...).
 * Alles Surface-Zeichnungen in Palettenfarben, mit 1-px-Umriss, gecacht. Stil: docs/design/pixel-stil.md.
 */
import { outline, pad } from '../pixel/raster';
import { rowsToCanvas, type Sprite } from '../pixel/sprites/canvas';
import { Surface, RAMPS, type Ramp } from '../pixel/sprites/surface';

export type IconName =
  | 'coin' | 'tag' | 'lantern' | 'eye' | 'bomb' | 'snow' | 'discount' | 'heart' | 'star' | 'book'
  | 'lock' | 'check' | 'flame' | 'arrow' | 'bolt' | 'gear' | 'flag';

const W = 14;
type Draw = (s: Surface) => void;

const DRAW: Record<IconName, Draw> = {
  coin: (s) => {
    s.ball(7, 7, 5, 5, RAMPS.gold, true);
    s.ring(7, 7, 5, 5, 'rust');
    s.rect(6, 4, 2, 6, 'rust');
    s.rect(6, 4, 1, 5, 'yellow');
  },
  tag: (s) => {
    s.poly([[2, 4], [8, 1], [12, 7], [6, 12]], 'silver');
    s.line(2, 4, 8, 1, 'white');
    s.line(6, 12, 12, 7, 'stone');
    s.px(8, 4, 'ink');
    s.px(9, 4, 'ink');
    s.line(5, 8, 8, 5, 'amber');
  },
  lantern: (s) => {
    s.rect(5, 1, 4, 1, 'bark');
    s.rect(4, 2, 6, 1, 'wood');
    s.rect(3, 3, 8, 8, 'amber');
    s.rect(4, 4, 6, 6, 'yellow');
    s.rect(6, 5, 2, 4, 'white');
    s.rect(3, 11, 8, 1, 'bark');
    s.rect(3, 3, 1, 8, 'rust');
    s.rect(10, 3, 1, 8, 'rust');
    s.px(7, 0, 'stone');
  },
  eye: (s) => {
    s.ellipse(7, 7, 6, 4, 'white');
    s.ring(7, 7, 6, 4, 'slate');
    s.ball(7, 7, 3, 3, ['navy', 'sky', 'ice'] as Ramp);
    s.rect(6, 6, 2, 2, 'ink');
    s.px(5, 5, 'white');
  },
  bomb: (s) => {
    s.ball(6, 8, 5, 5, ['ink', 'night', 'slate'] as Ramp, true);
    s.px(4, 6, 'white');
    s.line(9, 4, 11, 2, 'wood');
    s.px(12, 1, 'yellow');
    s.px(11, 1, 'orange');
    s.px(12, 2, 'amber');
  },
  snow: (s) => {
    s.line(7, 1, 7, 12, 'ice');
    s.line(2, 4, 12, 9, 'ice');
    s.line(12, 4, 2, 9, 'ice');
    s.px(7, 6, 'white');
    s.px(7, 7, 'white');
    for (const [x, y] of [[7, 1], [7, 12], [2, 4], [12, 9], [12, 4], [2, 9]]) s.px(x, y, 'white');
  },
  discount: (s) => {
    s.ball(6, 6, 4, 4, RAMPS.gold, true);
    s.ring(6, 6, 4, 4, 'rust');
    s.rect(10, 8, 3, 1, 'red');
    s.line(11, 9, 11, 12, 'red');
    s.line(9, 11, 11, 13, 'red');
    s.line(13, 11, 11, 13, 'red');
  },
  heart: (s) => {
    s.ball(4, 5, 3, 3, ['crimson', 'red', 'coral'] as Ramp, true);
    s.ball(9, 5, 3, 3, ['crimson', 'red', 'coral'] as Ramp, true);
    s.poly([[1, 6], [12, 6], [7, 12]], 'red');
    s.line(2, 7, 7, 11, 'crimson');
    s.px(3, 3, 'white');
  },
  star: (s) => {
    s.poly([[7, 0], [9, 5], [13, 5], [10, 8], [11, 13], [7, 10], [3, 13], [4, 8], [1, 5], [5, 5]], 'amber');
    s.poly([[7, 2], [8, 5], [7, 8], [6, 5]], 'yellow');
  },
  book: (s) => {
    s.rect(2, 2, 10, 10, 'navy');
    s.rect(3, 3, 8, 8, 'sky');
    s.rect(3, 3, 8, 1, 'ice');
    s.rect(6, 5, 4, 1, 'white');
    s.rect(6, 7, 4, 1, 'white');
    s.rect(6, 9, 3, 1, 'silver');
    s.rect(2, 2, 2, 10, 'violet');
  },
  lock: (s) => {
    s.ring(7, 5, 3, 3, 'silver');
    s.rect(4, 6, 1, 1, 'silver');
    s.rect(10, 6, 1, 1, 'silver');
    s.box(3, 6, 8, 7, ['dusk', 'stone', 'silver'] as Ramp);
    s.rect(6, 8, 2, 3, 'ink');
  },
  check: (s) => {
    s.line(2, 7, 5, 11, 'leaf', 2);
    s.line(5, 11, 12, 2, 'leaf', 2);
    s.line(3, 7, 5, 10, 'white');
  },
  flame: (s) => {
    s.ellipseFn(7, 9, 4, 5, (_x, _y, nx, ny) => (ny > 0.35 && Math.abs(nx) < 0.45 ? 'yellow' : ny > -0.1 ? 'amber' : 'orange'));
    s.poly([[7, 0], [10, 5], [4, 5]], 'orange');
    s.px(7, 1, 'red');
    s.rect(6, 9, 2, 3, 'white');
  },
  arrow: (s) => {
    s.rect(2, 6, 8, 2, 'white');
    s.poly([[9, 3], [13, 7], [9, 11]], 'white');
  },
  bolt: (s) => {
    s.poly([[8, 0], [3, 7], [7, 7], [5, 13], [11, 5], [7, 5]], 'yellow');
  },
  gear: (s) => {
    s.ball(7, 7, 5, 5, ['slate', 'stone', 'silver'] as Ramp);
    for (const [x, y] of [[7, 0], [7, 13], [0, 7], [13, 7], [2, 2], [12, 2], [2, 12], [12, 12]]) s.rect(x - 1, y - 1, 2, 2, 'stone');
    s.rect(5, 5, 4, 4, 'ink');
  },
  flag: (s) => {
    s.rect(3, 1, 1, 12, 'wood');
    s.poly([[4, 2], [12, 4], [4, 8]], 'red');
  },
};

const cache = new Map<string, Sprite>();
function make(key: string, w: number, h: number, draw: Draw): Sprite {
  let c = cache.get(key);
  if (!c) {
    const s = new Surface(w, h);
    draw(s);
    const rows = outline(pad(['.'.repeat(w + 2), ...s.toRows().map((r) => `.${r}.`), '.'.repeat(w + 2)], w + 2));
    c = rowsToCanvas(rows, 0, 0);
    cache.set(key, c);
  }
  return c;
}

export function icon(name: IconName): Sprite {
  return make(`i|${name}`, W, W, DRAW[name]);
}

export type MedalKind = 'bronze' | 'silver' | 'gold';
const MEDAL_RAMP: Record<MedalKind, Ramp> = {
  bronze: ['rust', 'clay', 'tan'],
  silver: ['slate', 'silver', 'white'],
  gold: ['rust', 'amber', 'yellow'],
};
const RIBBON: Record<MedalKind, [string, string]> = { bronze: ['crimson', 'red'], silver: ['navy', 'sky'], gold: ['pine', 'leaf'] };

/** Medaille 18 x 22; `earned` false = graue Silhouette (leerer Platz). */
export function medal(kind: MedalKind, earned: boolean): Sprite {
  return make(`m|${kind}|${earned ? 1 : 0}`, 18, 22, (s) => {
    const [rd, rl] = earned ? RIBBON[kind] : (['night', 'dusk'] as const);
    s.rect(4, 0, 4, 9, rd as never);
    s.rect(10, 0, 4, 9, rl as never);
    s.rect(4, 0, 1, 9, rl as never);
    const ramp: Ramp = earned ? MEDAL_RAMP[kind] : ['night', 'night', 'dusk'];
    s.ball(9, 15, 8, 7, ramp, earned);
    s.ring(9, 15, 8, 7, earned ? ramp[0] : 'dusk');
    if (earned) {
      s.ring(9, 15, 4, 4, ramp[0]);
      s.px(9, 13, 'white');
      s.rect(8, 14, 2, 3, ramp[2]);
    }
  });
}

export const MEDAL_OF: Record<'easy' | 'medium' | 'hard', MedalKind> = { easy: 'bronze', medium: 'silver', hard: 'gold' };

