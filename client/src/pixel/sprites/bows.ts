/** Bogen, Armbrust/Balliste und Arme: gemeinsame Zeichner fuer Ranger und Wren. */
import type { PalName } from '../palette';
import { arrowAt } from './parts';
import { RAMPS, type Ramp, Surface } from './surface';

export interface BowOpts {
  /** Mittelpunkt des Bogens (Griffhand). */
  cx: number;
  cy: number;
  ux: number;
  uy: number;
  half: number;
  pull: number;
  ramp?: Ramp;
  tip?: PalName | null;
  th?: number;
  /** Wie weit die Sehne maximal zurueckgezogen wird. */
  draw?: number;
  string?: PalName;
}

/** Bogenkruemmung als Punktliste (von oben nach unten quer zur Zielrichtung). Liefert auch die Sehnenpunkte. */
export function bowShape(o: BowOpts): { a: [number, number]; b: [number, number]; mid: [number, number]; nock: [number, number]; pts: [number, number][] } {
  const ax = o.ux, ay = o.uy * 0.85;
  const px = -ay, py = ax;
  const pl = Math.hypot(px, py) || 1;
  const nx = px / pl, ny = py / pl;
  const A: [number, number] = [o.cx + nx * o.half, o.cy + ny * o.half];
  const B: [number, number] = [o.cx - nx * o.half, o.cy - ny * o.half];
  const bulge = o.half * 0.55;
  const M: [number, number] = [o.cx + ax * bulge * 2, o.cy + ay * bulge * 2];
  const pts: [number, number][] = [];
  const n = Math.max(8, Math.ceil(o.half * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * A[0] + 2 * u * t * M[0] + t * t * B[0], u * u * A[1] + 2 * u * t * M[1] + t * t * B[1]]);
  }
  const pd = (o.draw ?? 5) * o.pull;
  const nock: [number, number] = [o.cx - ax * pd, o.cy - ay * pd];
  return { a: A, b: B, mid: M, nock, pts };
}

export function drawBow(s: Surface, o: BowOpts): { nock: [number, number] } {
  const sh = bowShape(o);
  const ramp = o.ramp ?? RAMPS.wood;
  const th = o.th ?? 1;
  // Sehne
  const st = o.string ?? 'silver';
  s.line(sh.a[0], sh.a[1], sh.nock[0], sh.nock[1], st);
  s.line(sh.b[0], sh.b[1], sh.nock[0], sh.nock[1], st);
  // Holz: Licht von oben links -> obere/linke Haelfte heller
  for (let i = 0; i + 1 < sh.pts.length; i++) {
    const p = sh.pts[i], q = sh.pts[i + 1];
    const t = i / (sh.pts.length - 1);
    const col = t < 0.45 ? ramp[2] : t < 0.62 ? ramp[1] : ramp[0];
    s.line(p[0], p[1], q[0], q[1], col, th);
    if (th === 1) s.px(p[0], p[1], col);
  }
  if (o.tip) {
    s.px(sh.a[0], sh.a[1], o.tip);
    s.px(sh.b[0], sh.b[1], o.tip);
    if (th > 1) { s.px(sh.a[0] + 1, sh.a[1], o.tip); s.px(sh.b[0] + 1, sh.b[1], o.tip); }
  }
  return { nock: sh.nock };
}

export interface ArmOpts { sx: number; sy: number; hx: number; hy: number; sleeve: PalName; skin: PalName; roll: number; hand?: boolean }
/** Arm: 2 px dick (oben hell, unten dunkel), Aermel bis `roll` (0..1), dann Haut; Hand am Ende (2 x 2). */
export function drawArm(s: Surface, o: ArmOpts): void {
  const n = Math.max(1, Math.round(Math.hypot(o.hx - o.sx, o.hy - o.sy)));
  const dark: Record<string, PalName> = { grass: 'pine', orange: 'rust', violet: 'night', navy: 'night', amber: 'rust', leaf: 'grass', bark: 'plum' };
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = o.sx + (o.hx - o.sx) * t, y = o.sy + (o.hy - o.sy) * t;
    const sl = t < o.roll;
    s.px(x, y, sl ? o.sleeve : o.skin);
    s.px(x, y + 1, sl ? (dark[o.sleeve] ?? o.sleeve) : 'tan');
  }
  if (o.hand !== false) {
    s.rect(Math.round(o.hx), Math.round(o.hy), 2, 2, o.skin);
    s.px(o.hx, o.hy, 'peach');
    s.px(o.hx + 1, o.hy + 1, 'tan');
  }
}

export function drawArrow(s: Surface, tx: number, ty: number, ux: number, uy: number, len: number, o: { tip: PalName; fletch: PalName | null; shaft?: PalName; barbs?: boolean }): void {
  const vy = uy * 0.85;
  const l = Math.hypot(ux, vy) || 1;
  arrowAt(s, tx, ty, ux / l, vy / l, len, { tip: o.tip, fletch: o.fletch, shaft: o.shaft ?? 'sand', barbs: o.barbs });
}
