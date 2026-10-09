/**
 * Gemeinsame Ausruestung fuer die Figuren (Runde 13): keine Plattform mehr, die Stufe zeigt die Figur selbst.
 * Pfadfarbe: A = Messing/Gold, B = Eisblau, C = Orchidee. Stufe 1-2 Ausruestungsteile, 3 Schulterpanzer + groesser,
 * 4 Brustpanzer + Umhang + Leuchten + nochmals groesser, 5 Fluegel + Bodenring (Verwandlung, eigene Farben).
 */
import type { PalName } from '../palette';
import { orbit, spark } from './parts';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';

export const PATH_RAMP: Ramp[] = [RAMPS.brass, RAMPS.ice, RAMPS.plum];
/** Stufe 5: eigene Farben (Flamme, Eis/Weiss, Sternenviolett). */
export const PATH_RAMP5: Ramp[] = [RAMPS.red, RAMPS.frost, ['night', 'violet', 'orchid']];
export const PATH_HI: PalName[] = ['yellow', 'ice', 'coral'];
export const PATH_MID: PalName[] = ['amber', 'sky', 'orchid'];

export function mainPath(t: Tiers): number {
  return t[0] >= t[1] && t[0] >= t[2] ? 0 : t[1] >= t[2] ? 1 : 2;
}
/** Wie viele px die Figur nach hoechster Stufe hoeher wird. */
export const growOf = (top: number): number => [0, 0, 0, 2, 4, 7][Math.min(5, top)];
/** Zusaetzliche halbe Breite. */
export const widthOf = (top: number): number => [0, 0, 0, 1, 2, 3][Math.min(5, top)];

export interface GearOpts {
  ox: number;
  /** Fuss der Figur (unterste Pixelzeile der Schuhe). */
  G: number;
  /** Oberkante des Rumpfes (schon mit up/grow). */
  yT: number;
  /** Zusaetzliche halbe Breite (widthOf). */
  wg: number;
  t: Tiers;
  ph: number;
  /** Bodenanker, fuer den Ring bei Stufe 5. */
  OY: number;
  /** Umhang und Fluegel weglassen (wenn die Figur eigene hat). */
  own?: { cape?: boolean; wings?: boolean };
  /** Eigene Pfadfarben je Turm (Standard: A Messing, B Eisblau, C Orchidee). */
  pal?: GearPal;
}
export interface GearPal { ramp: Ramp[]; ramp5: Ramp[]; hi: PalName[]; mid: PalName[] }
export const DEFAULT_PAL: GearPal = { ramp: PATH_RAMP, ramp5: PATH_RAMP5, hi: PATH_HI, mid: PATH_MID };
/** Frostcaller: A Schnee/Weiss, B Eis, C Blitzgelb. */
export const FROST_PAL: GearPal = {
  ramp: [RAMPS.snow, RAMPS.ice, RAMPS.brass],
  ramp5: [RAMPS.frost, ['navy', 'sky', 'ice'], RAMPS.yellow],
  hi: ['white', 'ice', 'yellow'],
  mid: ['silver', 'sky', 'amber'],
};

/** Fluegel aus Licht/Federn: je Seite 5 Federn, schlagen mit `ph`. */
export function wings(back: Surface, cx: number, cy: number, span: number, ramp: Ramp, ph: number, tip: PalName = 'white'): void {
  const flap = [0, 1, 2, 1][ph & 3];
  for (const sg of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const bx = cx + sg * 3, by = cy + 4 - i * 1;
      const tx = cx + sg * (span - i * 2.2), ty = cy - 16 + i * 4.2 - flap * 2 + (i === 0 ? -2 : 0);
      back.line(bx, by, tx, ty, i % 2 ? ramp[2] : ramp[1], 2);
      back.line(bx, by + 1, tx, ty + 1, ramp[0], 1);
      back.px(tx, ty - 1, tip);
    }
  }
}

/** Umhang hinter dem Koerper (Hueftlang bei Stufe 3, bodenlang ab 4). */
export function cape(back: Surface, ox: number, yT: number, G: number, wg: number, ramp: Ramp, ph: number, long: boolean, trim: PalName): void {
  const wob = [0, 1, 2, 1][ph & 3];
  const bot = long ? G + 2 : G - 4;
  const hw = 4 + wg;
  back.poly(
    [[ox - hw, yT], [ox + hw, yT], [ox + hw + 3, bot - 2], [ox + hw + 1, bot + 1], [ox - hw + 2, bot + 2 - (wob & 1)], [ox - hw - 3 - wob, bot], [ox - hw - 2 - wob, bot - 10], [ox - hw - 1, yT + 1]],
    (x, y) => (x > ox + hw - 1 || y > bot - 2 ? ramp[0] : x < ox - hw ? ramp[2] : ramp[1]),
  );
  back.line(ox - hw - 1, yT + 1, ox - hw - 2 - wob, bot - 1, trim);
  if (long) for (let x = ox - hw - 2 - wob; x <= ox + hw + 2; x += 3) back.px(x, bot + 1 + (x & 1), trim);
}

/** Rumpf-Ausruestung nach Pfadfarbe. Danach den Kopf zeichnen. */
export function drawGear(s: Surface, back: Surface, front: Surface, o: GearOpts): void {
  const { ox, G, yT, wg, t, ph } = o;
  const main = mainPath(t);
  const top = t[main];
  const hw = 4 + wg;
  const pal = o.pal ?? DEFAULT_PAL;
  const R = (p: number): Ramp => (t[p] >= 5 ? pal.ramp5[p] : pal.ramp[p]);
  // Zweitpfad (max. 2): Stiefel/Armbaender und Guertelband
  for (let p = 0; p < 3; p++) {
    if (p === main || t[p] < 1) continue;
    const r = R(p);
    s.rect(ox - 5 - wg, G - 1, 4 + wg, 2, r[0]); s.rect(ox + 1, G - 1, 4 + wg, 2, r[0]);
    s.rect(ox - 5 - wg, G - 1, 4 + wg, 1, r[1]); s.rect(ox + 1, G - 1, 4 + wg, 1, r[1]);
    s.rect(ox - hw, G - 5, hw * 2 + 1, 1, r[2]);
    if (t[p] >= 2) { s.rect(ox - hw - 1, yT + 4, 2, 2, r[2]); s.px(ox - hw - 1, yT + 4, 'white'); }
  }
  if (top < 1) return;
  const r = R(main), hi = pal.hi[main];
  // Stufe 1: Stiefel + Schaerpe diagonal
  s.rect(ox - 5 - wg, G - 1, 4 + wg, 2, r[0]); s.rect(ox + 1, G - 1, 4 + wg, 2, r[0]);
  s.rect(ox - 5 - wg, G - 1, 4 + wg, 1, r[2]); s.rect(ox + 1, G - 1, 4 + wg, 1, r[2]);
  const hh = G - 5 - (yT + 1);
  for (let i = 0; i <= hh; i++) {
    const x = ox - hw + 1 + Math.round((i / hh) * (hw * 2 - 2));
    s.px(x, yT + 1 + i, r[2]); if (top >= 2) s.px(x + 1, yT + 1 + i, r[1]);
  }
  // Kragen/Halstuch in Pfadfarbe (Stufe 1: schmal, Stufe 2: Zipfel)
  s.rect(ox - hw, yT - 1, hw * 2 + 1, 2, r[1]); s.rect(ox - hw, yT - 1, hw * 2 + 1, 1, r[2]);
  if (top >= 2) { s.rect(ox - hw - 2, yT, 2, 4 + (ph & 1), r[1]); s.px(ox - hw - 2, yT + 4 + (ph & 1), r[0]); }
  // Stufe 2: Mantel ueber den Schultern mit Fransen
  if (top >= 2) {
    s.rect(ox - hw - 1, yT - 1, hw * 2 + 3, 3, r[1]);
    s.rect(ox - hw - 1, yT - 1, hw * 2 + 3, 1, r[2]);
    for (let x = ox - hw - 1; x <= ox + hw + 1; x += 2) s.px(x, yT + 2, r[0]);
    s.px(ox, yT + 2, hi);
  }
  // Stufe 3: Schulterpanzer, Wappen, Beinschienen
  if (top >= 3) {
    for (const sg of [-1, 1]) {
      s.ball(ox + sg * (hw + 1), yT + 1, 3.4, 2.6, r);
      s.px(ox + sg * (hw + 1) - 1, yT, 'white');
      s.rect(ox + sg * (hw + 1) - 2, yT + 3, 5, 1, r[0]);
    }
    s.poly([[ox - 2, yT + 4], [ox + 3, yT + 4], [ox + 3, yT + 7], [ox, yT + 9], [ox - 2, yT + 7]], (x) => (x < ox ? r[2] : r[1]));
    s.px(ox, yT + 6, hi); s.px(ox - 1, yT + 5, 'white');
    s.rect(ox - 5 - wg, G - 4, 4 + wg, 2, r[1]); s.rect(ox + 1, G - 4, 4 + wg, 2, r[1]);
    s.rect(ox - 5 - wg, G - 4, 4 + wg, 1, r[2]); s.rect(ox + 1, G - 4, 4 + wg, 1, r[2]);
  }
  // Stufe 4: Brustpanzer mit Leuchtstein, Schulterzacken, Gurt
  if (top >= 4) {
    s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 8, r[1]);
    s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 1, r[2]); s.rect(ox - hw + 1, yT + 3, 1, 8, r[2]);
    s.rect(ox + hw - 1, yT + 4, 1, 7, r[0]); s.rect(ox - hw + 1, yT + 10, hw * 2 - 1, 1, r[0]);
    for (const sg of [-1, 1]) {
      s.poly([[ox + sg * (hw + 1) - 1, yT - 2], [ox + sg * (hw + 1) + 1, yT - 2], [ox + sg * (hw + 3), yT - 7 - (ph & 1)]], r[2]);
      s.px(ox + sg * (hw + 3), yT - 7 - (ph & 1), 'white');
    }
    const glow: PalName = ph % 2 ? 'white' : hi;
    s.rect(ox - 1, yT + 5, 3, 3, glow); s.px(ox, yT + 6, 'white'); s.rect(ox - 2, yT + 6, 5, 1, hi);
    s.rect(ox - hw + 1, G - 6, hw * 2 - 1, 2, r[0]); s.px(ox, G - 6, hi);
  }
  // Umhang
  if (top >= 3 && !o.own?.cape) cape(back, ox, yT, G, wg, r, ph, top >= 4, hi);
  // Stufe 5: Fluegel, Bodenring, Funken
  if (top >= 5) {
    if (!o.own?.wings) wings(back, ox, yT + 3, 20 + wg, pal.ramp5[main], ph, 'white');
    ring(back, ox, o.OY, 16, 5, ph, hi, pal.mid[main]);
    for (let i = 0; i < 5; i++) spark(front, ox - 13 + i * 6.5, o.OY - 6 - ((ph * 3 + i * 5) % 14), i % 2 ? hi : 'white');
  }
  void orbit;
}

/** Gestrichelter Ring flach auf dem Boden (keine Plattform, nur Leuchten); dreht mit `ph`. */
export function ring(back: Surface, cx: number, cy: number, rx: number, ry: number, ph: number, c1: PalName, c2: PalName): void {
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + ph * 0.12;
    if ((i + ph) % 4 === 3) continue;
    back.pxUnder(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, i % 2 ? c1 : c2);
  }
}
