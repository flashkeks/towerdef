/** Effekte Runde 16 TP: Overclock (Funkenring am Turm), Alarm-Markierung am Gegner (Ausrufezeichen) und Bellringer-Ring. Ganze Pixel, nur Palette. */
import { bolt, spark } from '../sprites/parts';
import { Surface } from '../sprites/surface';
import type { FxRaster } from './effects';

const fin = (s: Surface, ax: number, ay: number): FxRaster => ({ rows: s.toRows(), ax, ay });

export const OC_FRAMES = 4;
export const ALARM_MARK_FRAMES = 4;

/** Overclock am Turm: Funken kreisen, kleine Blitze, Zahnrad-Blinken; 4 Frames, 48 x 56, Anker = Fuss. `big` = Ultra-Overclock (mehr Blitze). */
export function overclockRaster(frame: number, big = false): FxRaster {
  const f = ((Math.floor(frame) % OC_FRAMES) + OC_FRAMES) % OC_FRAMES;
  const W = 48, H = 56, ax = 24, ay = 50;
  const s = new Surface(W, H);
  const n = big ? 12 : 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + f * 0.5;
    const x = ax + Math.cos(a) * 14, y = ay - 14 + Math.sin(a) * 5 - (Math.cos(a) < 0 ? 0 : 0);
    s.px(x, y, (i + f) % 3 === 0 ? 'white' : (i + f) % 3 === 1 ? 'yellow' : 'ice');
    if ((i + f) % 4 === 0) spark(s, x, y - 6 - ((i + f) & 3), i % 2 ? 'ice' : 'yellow');
  }
  bolt(s, ax - 9, ay - 6, ax - 5, ay - 28 - (f & 1) * 2, 11 + f * 3, 'white', 'yellow');
  bolt(s, ax + 9, ay - 6, ax + 6, ay - 26 + (f & 1) * 2, 41 + f * 3, 'white', 'ice');
  if (big) bolt(s, ax - 12, ay - 16, ax + 12, ay - 18, 71 + f * 3, 'white', 'yellow');
  // blinkendes Zahnrad ueber dem Kopf
  const cy = ay - 40;
  s.ball(ax, cy, 2.5, 2.5, ['rust', 'amber', 'yellow']);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + f * 0.52; s.px(ax + Math.cos(a) * 4, cy + Math.sin(a) * 4, i % 2 ? 'amber' : 'yellow'); }
  s.px(ax, cy, f % 2 ? 'white' : 'ink');
  return fin(s, ax, ay);
}

/** Alarm-Markierung ueber einem stehenden Gegner: rotes Ausrufezeichen im Schild, wippt; 4 Frames, 13 x 17, Anker = Mitte des Gegners. */
export function alarmMarkRaster(frame: number): FxRaster {
  const f = ((Math.floor(frame) % ALARM_MARK_FRAMES) + ALARM_MARK_FRAMES) % ALARM_MARK_FRAMES;
  const W = 13, H = 17, ax = 6, ay = 12;
  const s = new Surface(W, H);
  const y = [0, 1, 0, -1][f] + 3;
  s.poly([[ax - 5, y + 9], [ax, y], [ax + 5, y + 9]], (x) => (x < ax ? 'coral' : 'red'));
  s.rect(ax - 5, y + 9, 11, 1, 'crimson');
  s.rect(ax, y + 3, 1, 3, 'white'); s.px(ax, y + 7, 'white');
  s.px(ax - 5, y + 9, 'crimson'); s.px(ax + 5, y + 9, 'crimson');
  if (f % 2) { s.px(ax - 7 + 1, y + 2, 'yellow'); s.px(ax + 6, y + 3, 'yellow'); }
  return fin(s, ax, ay);
}

/** Sentry-Bauwolke: kurzes Funkenpuff, 5 Frames, Anker = Fuss. */
export const BUILD_FRAMES = 5;
export function buildPuffRaster(frame: number): FxRaster {
  const f = Math.max(0, Math.min(BUILD_FRAMES - 1, Math.floor(frame)));
  const W = 32, H = 28, ax = 16, ay = 24;
  const s = new Surface(W, H);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, r = 3 + f * 2.4;
    s.px(ax + Math.cos(a) * r, ay - 4 + Math.sin(a) * r * 0.45 - f * 0.5, f < 3 ? (i % 2 ? 'white' : 'sand') : 'silver');
  }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; spark(s, ax + Math.cos(a) * (2 + f * 2.2), ay - 8 - f * 1.5 + Math.sin(a) * 3, i % 2 ? 'yellow' : 'amber'); }
  return fin(s, ax, ay);
}
