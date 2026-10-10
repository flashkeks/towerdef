/**
 * Sentry (Runde 16, Paket TP): Mini-Geschuetz des Tinkers, steht neben ihm auf dem Boden. Stufe (`look` 0..4) folgt dem Sentry-Pfad A1-A5:
 * Holz/Eisen -> Stahl mit Zwillingsrohr -> Messing mit Schild -> Messing mit Zahnrad -> Clockwork (Gold, Leuchtauge).
 * Frames: b0..b2 = Aufbau (steigt aus dem Boden), idle0/idle1, fire (Muendungsfeuer). Blick 0..7 wie die Tuerme. Anker = Fuss.
 */
import type { PalName } from '../palette';
import { spark, tube } from './parts';
import { dirOf } from './pose';
import { outlineSurface, RAMPS, type Ramp, Surface } from './surface';
import { cog } from './tinker';

export type SentryFrame = 'b0' | 'b1' | 'b2' | 'idle0' | 'idle1' | 'fire';
export const SENTRY_FRAMES: SentryFrame[] = ['b0', 'b1', 'b2', 'idle0', 'idle1', 'fire'];
export const SENTRY_W = 32;
export const SENTRY_H = 30;
export const SENTRY_AX = 16;
export const SENTRY_AY = 25;

const IRON: Ramp = ['ink', 'dusk', 'stone'];
const BODY: Ramp[] = [IRON, RAMPS.steel, RAMPS.brass, RAMPS.brass, RAMPS.gold];

export function sentryRaster(look: number, facing: number, frame: SentryFrame): { rows: string[]; ax: number; ay: number; mx: number; my: number } {
  const lk = Math.max(0, Math.min(4, Math.round(look)));
  const d = dirOf(facing);
  const s = new Surface(SENTRY_W, SENTRY_H), front = new Surface(SENTRY_W, SENTRY_H);
  const cx = SENTRY_AX, G = SENTRY_AY;
  const bi = frame === 'b0' ? 0 : frame === 'b1' ? 1 : frame === 'b2' ? 2 : 3;
  const sink = bi < 3 ? (3 - bi) * 5 : 0;
  const bob = frame === 'idle1' ? 1 : 0;
  const rec = frame === 'fire' ? 1 : 0;
  const body = BODY[lk];
  const py = G - 11 + sink + bob; // Drehpunkt des Rohrs
  // Dreibein
  for (const sg of [-1, 1]) { s.line(cx, py + 3, cx + sg * 5, G + sink, 'bark', 1); s.px(cx + sg * 5, G + sink, 'wood'); }
  s.line(cx, py + 3, cx, G + sink, 'bark'); s.px(cx, G + sink - 1, 'wood');
  s.rect(cx - 2, G - 1 + sink, 5, 1, 'stone');
  const barrel = (): void => {
    const ax = d.ux, ay = d.uy * 0.85, l = Math.hypot(ax, ay) || 1, nx = ax / l, ny = ay / l;
    const len = 8 + (lk >= 2 ? 1 : 0) - rec;
    const off = lk >= 1 ? 1.5 : 0;
    for (const o of lk >= 1 ? [-1, 1] : [0]) {
      const ox = cx - ny * off * o * 0.0 + (-ny) * o * off, oy = py + nx * o * off * 0.8;
      tube(s, ox, oy, ox + nx * len, oy + ny * len, 2, lk >= 2 ? RAMPS.brass : IRON);
      s.px(ox + nx * len, oy + ny * len, 'white');
    }
  };
  if (d.behind) barrel();
  // Gehaeuse
  s.box(cx - 4, py - 4, 9, 8, body);
  s.rect(cx - 4, py + 1, 9, 1, body[0]);
  if (lk >= 2) { s.rect(cx - 5, py - 3, 1, 6, body[2]); s.px(cx - 5, py - 3, 'white'); }
  if (lk >= 2) s.rect(cx - 3, py - 6, 7, 2, body[1]);
  // Auge / Zielgeraet
  if (!d.behind) { const ex = cx + Math.round(d.ux * 2) - 1; s.rect(ex, py - 2, 3, 2, lk >= 4 ? (frame === 'idle1' ? 'white' : 'yellow') : 'sky'); s.px(ex, py - 2, 'white'); }
  else { s.rect(cx - 2, py - 1, 5, 1, body[0]); }
  s.px(cx + 3, py + 2, lk >= 2 ? 'yellow' : 'amber');
  if (lk >= 3) cog(s, cx - 2, py - 8, 2.4, frame === 'idle1' ? 1 : 0, RAMPS.brass, 6);
  if (lk >= 4) { s.px(cx + 3, py - 7, 'red'); s.px(cx + 3, py - 8, frame === 'idle1' ? 'coral' : 'red'); s.line(cx + 3, py - 6, cx + 3, py - 6, 'bark'); }
  if (!d.behind) barrel();
  // Muendungsfeuer
  const ax2 = d.ux, ay2 = d.uy * 0.85, l2 = Math.hypot(ax2, ay2) || 1;
  const mxu = cx + (ax2 / l2) * (8 + (lk >= 2 ? 1 : 0)), myu = py + (ay2 / l2) * (8 + (lk >= 2 ? 1 : 0));
  if (frame === 'fire') spark(front, mxu + (ax2 / l2) * 2, myu + (ay2 / l2) * 2, lk >= 4 ? 'white' : 'yellow', true);
  // Aufbau: Staub und Funken
  if (bi < 3) { for (let i = 0; i < 4; i++) front.px(cx - 8 + i * 5 + (bi & 1), G - 2 - ((i + bi) & 1) * 2, i % 2 ? 'sand' : 'white'); spark(front, cx + (bi ? 6 : -6), G - 8 - bi * 3, 'yellow'); }
  const out = new Surface(SENTRY_W, SENTRY_H);
  out.blit(outlineSurface(s)).blit(front);
  if (bi < 3) out.mask((_x, y) => y <= G + 1); // steigt aus dem Boden
  const fin = d.flip ? out.flipX() : out;
  const mx = (d.flip ? 2 * cx - mxu : mxu) - cx;
  void ({} as PalName);
  return { rows: fin.toRows(), ax: cx, ay: G, mx, my: myu - G };
}
