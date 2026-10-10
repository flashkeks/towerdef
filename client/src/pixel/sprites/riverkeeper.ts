/**
 * Riverkeeper (Runde 16 TP): Fischer/Faehrmann der Lanternfolk in einem Boot. Das Boot gehoert zur Figur (keine Plattform, kein Sockel),
 * ein Wellenkranz laeuft um den Rumpf. Alles in der Bodenebene gerechnet (`P(u, v, h)`: u = Bug-Richtung, v = quer, h = Hoehe) und mit
 * 0,55 gestaucht auf den Bildschirm gelegt, damit das Boot in allen 8 Richtungen eine echte Lage hat.
 * A Harpoons: Widerhaken -> Faecher (Speergestell) -> Tidal Steel (Harpunenkanone, Stahlhaut) -> Whaler (Walfaengerkanone mit Winde) -> Tidal Lance (riesige leuchtende Lanze).
 * B Sonar:    Glocke -> Schuessel-Array -> Riptide (Strudel um das Boot) -> Deep Current (Runensteine, Strom) -> Leviathan Call (Seeschlange hinter dem Boot).
 * C Armada:   Deckkanone -> Laternenschiff (Mast + Segel) -> Breitseite (Zweimaster, Kanonenpforten) -> Man o' War (Kriegsschiff) -> Dusk Armada (Flaggschiff + zwei Begleiter).
 * Stufe 3 = neue Silhouette, 4 = Ruestung/Leuchten, 5 = Verwandlung. Haltung/Blick wie die anderen Tuerme (8 Richtungen, Idle 4, Angriff 4).
 */
import type { PalName } from '../palette';
import { drawArm } from './bows';
import { mainPath } from './gear';
import { tube } from './parts';
import type { Dir, Pose } from './pose';
import { GY, OX, TH, TW, type TowerLayers } from './ranger';
import { irnd, outlineSurface, RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';

/** Stauchung der Bodenebene (Blick schraeg von oben). */
const K = 0.55;

interface Ship { L: number; W: number; depth: number; ramp: Ramp; trim: PalName }
interface Cx {
  s: Surface; back: Surface; front: Surface; d: Dir; p: Pose;
  A: number; B: number; C: number; top: number; main: number;
  ox: number; wy: number; fx: number; fy: number; rx: number; ry: number; ph: number; ship: Ship;
  /** Mündung der Hauptwaffe (Bildpunkt), wird beim Zeichnen gesetzt. */
  muzzle: [number, number];
}

/** Bodenpunkt (u = vor, v = quer, h = Hoehe) -> Bildpunkt. */
const P = (c: Cx, u: number, v: number, h = 0): [number, number] => {
  const gx = u * c.fx + v * c.rx, gy = u * c.fy + v * c.ry;
  return [c.ox + gx, c.wy + gy * K - h];
};
/** Richtung mit Neigung `elev` (Bogenmass) und Laenge `len` als Bildvektor. */
const V = (c: Cx, elev: number, len: number): [number, number] => [c.fx * Math.cos(elev) * len, (c.fy * K * Math.cos(elev) - Math.sin(elev)) * len];

/** Umriss des Rumpfes in der Bodenebene: spitzer Bug (+u), stumpfes Heck. */
function planform(L: number, W: number, shrink = 0, grow = 0): [number, number][] {
  const n = 18, l = L / 2 - shrink + grow, w0 = W / 2 - shrink + grow;
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const sN = -1 + (2 * i) / n;
    const hw = sN >= 0 ? w0 * Math.pow(Math.max(0, 1 - Math.pow(sN, 2.1)), 0.55) : w0 * (1 - 0.16 * sN * sN);
    left.push([sN * l, -hw]); right.push([sN * l, hw]);
  }
  return [...left, ...right.reverse()];
}
/** Gleichmaessig verteilte Punkte auf dem Umfang. */
function perim(pts: [number, number][], n: number): [number, number][] {
  const segs: number[] = []; let tot = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push(l); tot += l; }
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    let t = (k / n) * tot, i = 0;
    while (t > segs[i] && i < segs.length - 1) { t -= segs[i]; i++; }
    const a = pts[i], b = pts[(i + 1) % pts.length], f = segs[i] ? t / segs[i] : 0;
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

function shipOf(A: number, B: number, C: number, main: number): Ship {
  if (main === 2) {
    const L = [32, 33, 38, 44, 54, 66][C], W = [13, 13, 14, 15, 17, 19][C], depth = [4, 4, 4, 4, 5, 6][C];
    const ramp: Ramp = C >= 5 ? ['night', 'violet', 'orchid'] : C >= 2 ? ['plum', 'bark', 'wood'] : RAMPS.wood;
    return { L, W, depth, ramp, trim: C >= 4 ? 'yellow' : C >= 2 ? 'amber' : 'tan' };
  }
  if (main === 1) {
    const L = [32, 32, 33, 36, 40, 44][B], W = [13, 13, 13, 14, 15, 16][B], depth = [4, 4, 4, 4, 4, 5][B];
    const ramp: Ramp = B >= 3 ? ['deep', 'navy', 'sky'] : RAMPS.wood;
    return { L, W, depth, ramp, trim: B >= 4 ? 'ice' : B >= 3 ? 'sky' : 'tan' };
  }
  const L = [32, 32, 33, 37, 41, 48][A], W = [13, 13, 13, 14, 15, 16][A], depth = [4, 4, 4, 4, 4, 5][A];
  return { L, W, depth, ramp: RAMPS.wood, trim: A >= 5 ? 'ice' : A >= 4 ? 'white' : A >= 3 ? 'silver' : 'tan' };
}

const rise = (ship: Ship, u: number): number => (u > 0 ? 2.6 : 1.4) * Math.pow(Math.abs(u) / (ship.L / 2), 2);
/** Deckhoehe an Stelle u (Rumpf-Sprung eingerechnet). */
const deckH = (c: Cx, u: number): number => c.ship.depth - 1.5 + rise(c.ship, u);

// ---------------------------------------------------------------- Wasser
function drawWater(c: Cx): void {
  const { back, ph, ship } = c;
  const proj = (pts: [number, number][], h = 0): [number, number][] => pts.map(([u, v]) => P(c, u, v, h));
  // dunkler Wasserrand direkt am Rumpf
  back.poly(proj(planform(ship.L, ship.W, 0, 1.8)), 'navy');
  // zwei Wellenringe, laufen mit der Phase nach aussen
  const grow = [0, 0.7, 1.4, 0.7][ph];
  const n1 = Math.round((ship.L + ship.W) * 2.2);
  perim(planform(ship.L, ship.W, 0, 3 + grow), n1).forEach(([u, v], i) => {
    if ((i + ph) % 5 < 2) { const [x, y] = P(c, u, v, 0); back.pxUnder(x, y, i % 2 ? 'white' : 'ice'); }
  });
  perim(planform(ship.L, ship.W, 0, 5.5 + grow * 1.5), n1 + 8).forEach(([u, v], i) => {
    if ((i + ph * 2) % 7 < 2) { const [x, y] = P(c, u, v, 0); back.pxUnder(x, y, 'sky'); }
  });
  // Kielwasser hinter dem Heck
  for (let k = 0; k < 4; k++) {
    const u = -ship.L / 2 - 3 - k * 2.4 - ph * 0.5, v = (k % 2 ? 1 : -1) * (0.8 + k * 0.9);
    const [x, y] = P(c, u, v, 0);
    back.pxUnder(x, y, k < 2 ? 'white' : 'ice');
  }
}

// ---------------------------------------------------------------- Rumpf
interface Hull { near: Surface; yc: number }
function drawHull(c: Cx): Hull {
  const { ship, s } = c;
  const { L, W, depth, ramp } = ship;
  const proj = (pts: [number, number][], h: number): [number, number][] => pts.map(([u, v]) => P(c, u, v, h + rise(ship, u)));
  const side = new Surface(s.w, s.h);
  const plan = planform(L, W, 0);
  for (let h = 0; h <= depth; h++) {
    const col: PalName = h === depth ? ramp[2] : h === 0 ? ramp[0] : h >= depth - 1 ? ramp[2] : ramp[1];
    side.poly(proj(plan, h), col);
  }
  // Planken: dunkle Fugen quer zum Rumpf
  if (L >= 30) for (let u = -L / 2 + 3; u < L / 2 - 2; u += 4) for (const sg of [-1, 1]) {
    const hw = (W / 2) * (u >= 0 ? Math.pow(Math.max(0, 1 - Math.pow(u / (L / 2), 2.1)), 0.55) : 1 - 0.16 * Math.pow(u / (L / 2), 2));
    const [x, y] = P(c, u, sg * hw, depth * 0.45 + rise(ship, u));
    if (side.get(x, y)) side.px(x, y, ramp[0]);
  }
  // Innenraum
  const mTop = new Surface(s.w, s.h), mIn = new Surface(s.w, s.h), mFloor = new Surface(s.w, s.h);
  mTop.poly(proj(plan, depth), 'white');
  mIn.poly(proj(planform(L, W, 1.4), depth), 'white');
  mFloor.poly(proj(planform(L, W, 1.4), depth - 2), 'white');
  const ring = new Surface(s.w, s.h);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    if (mIn.get(x, y)) { s.px(x, y, mFloor.get(x, y) ? ramp[2] === 'tan' ? 'sand' : 'tan' : ramp[1]); if (mFloor.get(x, y) && (x + y) % 5 === 0) s.px(x, y, 'tan'); }
    else if (side.get(x, y)) { s.px(x, y, side.get(x, y)); ring.px(x, y, side.get(x, y)); }
  }
  const yc = Math.round(P(c, 0, 0, depth)[1]);
  const near = new Surface(s.w, s.h);
  for (let y = yc + 2; y < s.h; y++) for (let x = 0; x < s.w; x++) { const q = ring.get(x, y); if (q) near.px(x, y, q); }
  return { near, yc };
}

// ---------------------------------------------------------------- Kleinteile
/** Laterne: 3 x 4, Kern flackert, Funken im front-Layer. */
function lantern(c: Cx, x: number, y: number, size = 1): void {
  const { s, front, ph } = c;
  x = Math.round(x); y = Math.round(y);
  s.px(x, y - 1, 'bark'); s.px(x - 1, y, 'amber'); s.px(x + 1, y, 'amber');
  s.rect(x - 1, y + 1, 3, size > 1 ? 4 : 3, 'amber');
  s.px(x, y + 1, ph % 2 ? 'white' : 'yellow'); s.px(x, y + 2, 'yellow');
  s.px(x - 1, y + 1 + (size > 1 ? 4 : 3), 'bark'); s.px(x, y + 1 + (size > 1 ? 4 : 3), 'bark'); s.px(x + 1, y + 1 + (size > 1 ? 4 : 3), 'bark');
  front.pxUnder(x + (ph % 2 ? 3 : -3), y + 2, 'yellow'); front.pxUnder(x + (ph > 1 ? 2 : -2), y - 2, 'amber');
}
/** Hand-Harpune; (hx, hy) = Griff, `elev` Neigung, liefert die Spitze. */
function harpoon(c: Cx, hx: number, hy: number, elev: number, len: number, o: { barbs: number; head: PalName; shaft?: Ramp; glow?: PalName; th?: number; rope?: [number, number] }): [number, number] {
  const { s, front } = c;
  const [vx, vy] = V(c, elev, 1);
  const bl = 5;
  const bx = hx - vx * bl, by = hy - vy * bl, tx = hx + vx * len, ty = hy + vy * len;
  tube(s, bx, by, tx, ty, o.th ?? 2, o.shaft ?? RAMPS.wood);
  const m = Math.hypot(vx, vy) || 1, dx = vx / m, dy = vy / m, nx = -dy, ny = dx;
  // Spitze
  const wing = 1.7 + (o.barbs >= 1 ? 0.5 : 0);
  s.poly([[tx + nx * wing, ty + ny * wing], [tx + dx * 4.4, ty + dy * 4.4], [tx - nx * wing, ty - ny * wing], [tx - dx * 1, ty - dy * 1]], (x, y) => ((x + y) % 3 === 0 ? 'white' : o.head));
  if (o.barbs >= 1) { s.px(tx - dx * 1.5 + nx * 2.4, ty - dy * 1.5 + ny * 2.4, 'stone'); s.px(tx - dx * 1.5 - nx * 2.4, ty - dy * 1.5 - ny * 2.4, 'stone'); }
  if (o.barbs >= 2) { s.px(tx - dx * 3 + nx * 2.6, ty - dy * 3 + ny * 2.6, 'stone'); s.px(tx - dx * 3 - nx * 2.6, ty - dy * 3 - ny * 2.6, 'stone'); }
  s.px(tx + dx * 3.2, ty + dy * 3.2, 'white');
  if (o.glow) { front.pxUnder(tx + dx * 5.5, ty + dy * 5.5, o.glow); front.pxUnder(tx + dx * 4.5 + nx * 1.6, ty + dy * 4.5 + ny * 1.6, o.glow); front.pxUnder(tx + dx * 4.5 - nx * 1.6, ty + dy * 4.5 - ny * 1.6, o.glow); }
  if (o.rope) { s.curve(bx, by, (bx + o.rope[0]) / 2, Math.max(by, o.rope[1]) + 3, o.rope[0], o.rope[1], 'tan'); }
  return [tx + dx * 4.4, ty + dy * 4.4];
}
/** Kanone: Rohr (tube), Wulst am Heck, Lafette. Liefert die Muendung. */
function cannon(c: Cx, u: number, v: number, o: { len: number; th: number; ramp: Ramp; band?: PalName; elev?: number }): [number, number] {
  const { s, front, p } = c;
  const rec = p.ai === 2 ? 2 : p.ai === 3 ? 1 : p.ai === 1 ? -0.5 : 0;
  const [bx, by] = P(c, u - rec, v, deckH(c, u) + 2.2);
  const [vx, vy] = V(c, o.elev ?? 0.2, o.len);
  // Lafette
  const [lx, ly] = P(c, u, v, deckH(c, u));
  s.rect(lx - 2, ly - 1, 5, 2, 'bark'); s.px(lx - 2, ly - 1, 'wood'); s.px(lx - 2, ly + 1, 'ink'); s.px(lx + 2, ly + 1, 'ink');
  tube(s, bx, by, bx + vx, by + vy, o.th, o.ramp);
  s.ball(bx, by, o.th * 0.62, o.th * 0.62, o.ramp);
  const mx = bx + vx, my = by + vy;
  s.px(mx, my, o.band ?? o.ramp[2]); s.px(bx + vx * 0.5, by + vy * 0.5, o.band ?? o.ramp[2]);
  if (p.flash) {
    front.rect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3, 'yellow'); front.px(mx, my, 'white');
    front.px(mx + c.fx * 3, my + c.fy * 2, 'amber'); front.px(mx + c.fx * 4, my + c.fy * 3 - 1, 'stone');
  } else if (p.ai === 1) front.px(mx + c.fx + 1, my - 2, c.ph % 2 ? 'yellow' : 'orange');
  return [mx, my];
}
/** Segel in der Senkrechten durch den Mast; um 35 Grad zur Bootsachse gedreht, damit es in jeder Richtung Flaeche zeigt. */
function sail(c: Cx, u: number, h0: number, h1: number, w: number, ramp: Ramp, o: { emblem?: PalName | null; trim?: PalName; flutter?: boolean } = {}): void {
  const { s, ph } = c;
  const th = 0.62, cu = Math.cos(th), cv = Math.sin(th);
  const bil = [0, 1, 1.4, 1][ph];
  const pt = (k: number, h: number, bulge: number): [number, number] => P(c, u + k * cu, k * cv, h + bulge);
  const top: [number, number][] = [], bot: [number, number][] = [];
  for (let i = 0; i <= 6; i++) { const k = -w / 2 + (w * i) / 6; top.push(pt(k, h1, 0)); bot.push(pt(k, h0, -Math.sin((i / 6) * Math.PI) * (1.6 + bil * 0.5))); }
  const x0 = Math.min(...top.map((q) => q[0])), x1 = Math.max(...top.map((q) => q[0]));
  s.poly([...top, ...bot.reverse()], (x, y) => {
    const t = (x - x0) / Math.max(1, x1 - x0);
    return t < 0.22 ? ramp[2] : t > 0.72 ? ramp[0] : ramp[1];
  });
  // Falten
  for (let i = 1; i < 5; i++) { const a = pt(-w / 2 + (w * i) / 5, h1 - 1, 0), b = pt(-w / 2 + (w * i) / 5, h0 + 1, -bil * 0.3); s.line(a[0], a[1], b[0], b[1], ramp[0]); }
  if (o.trim) { const a = top[0], b = top[top.length - 1]; s.line(a[0], a[1], b[0], b[1], o.trim); const m = bot; void m; }
  if (o.emblem) { const [ex, ey] = pt(0, (h0 + h1) / 2 + 1, 0); s.rect(ex - 1, ey - 1, 3, 3, o.emblem); s.px(ex, ey, 'white'); }
}
function mast(c: Cx, u: number, h: number, flag?: PalName | null): [number, number] {
  const { s, ph } = c;
  const [x0, y0] = P(c, u, 0, deckH(c, u)), [x1, y1] = [x0, y0 - h];
  s.rect(x0 - 1, y1, 2, h, 'bark'); s.rect(x0 - 1, y1, 1, h, 'wood'); s.px(x0, y0, 'ink');
  // Mastkorb
  if (h >= 28) { s.rect(x0 - 3, y1 + 6, 6, 2, 'bark'); s.rect(x0 - 3, y1 + 6, 6, 1, 'wood'); }
  if (flag) { const w = [0, 1, 0, -1][ph]; for (let i = 0; i < 5; i++) s.rect(x0 + 1 + (c.fx < 0 ? -i - 1 : 0), y1 - 3 + (i < 3 ? 0 : 1), 1, 1, flag); for (let i = 0; i < 6; i++) s.px(x0 + 1 + i + (i > 3 ? w : 0), y1 - 2 + (i > 3 ? 0 : 0), flag); s.px(x0 + 1, y1 - 3, flag); s.px(x0, y1 - 1, 'yellow'); }
  return [x0, y1];
}
/** Sonarschuessel: Hohlspiegel mit Speisehorn, zeigt in Blickrichtung. */
function dish(c: Cx, x: number, y: number, R: number, o: { shell: Ramp; inner: Ramp; glow: PalName }): void {
  const { s, front, ph } = c;
  const fsx = c.fx, fsy = c.fy * K;
  const latx = 0.85, laty = 0.3;
  const ring = (cx: number, cy: number, rr: number): [number, number][] => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [cx + latx * Math.cos(a) * rr * 1.1, cy + laty * Math.cos(a) * rr * 1.1 - Math.sin(a) * rr] as [number, number]; });
  const away = c.fy < -0.3;
  const sh = ring(x - fsx * 2.2, y - fsy * 2.2, R), rim = ring(x + fsx * 2.2, y + fsy * 2.2, R);
  const paintShell = (): void => { s.poly(sh, (px, py) => ((px - x) + (py - y) * 0.5 < -R * 0.2 ? o.shell[2] : (px - x) > R * 0.2 ? o.shell[0] : o.shell[1])); };
  const paintInner = (): void => {
    s.poly(rim, o.shell[2]);
    const r2 = ring(x + fsx * 1.2, y + fsy * 1.2, R * 0.78);
    s.poly(r2, (px, py) => ((px - x) + (py - y) < 0 ? o.inner[0] : o.inner[1]));
    s.px(x + fsx * 2, y + fsy * 2 - 1, o.inner[2]);
  };
  if (away) { paintInner(); paintShell(); } else { paintShell(); paintInner(); }
  // Speisehorn
  const hx = x + fsx * (R * 1.1 + 2), hy = y + fsy * (R * 1.1 + 2) - (fsx !== 0 ? 1 : 0);
  s.line(x + fsx * 2, y + fsy * 2, hx, hy, 'silver');
  s.px(hx, hy, ph % 2 ? 'white' : o.glow); front.pxUnder(hx + fsx, hy + fsy, o.glow);
}

// ---------------------------------------------------------------- Figur
interface Look { cloak: Ramp; hat: Ramp; kind: 'sou' | 'tricorn'; trim: PalName; eye: PalName | null; wg: number }
function lookOf(c: Cx): Look {
  const { A, B, C, main, top } = c;
  const wg = Math.min(2, top >= 3 ? top - 2 : 0);
  let cloak: Ramp = RAMPS.navy, hat: Ramp = ['rust', 'amber', 'yellow'], kind: Look['kind'] = 'sou', trim: PalName = 'yellow', eye: PalName | null = null;
  if (main === 0 && A >= 5) { cloak = ['navy', 'sky', 'ice']; hat = ['stone', 'silver', 'white']; trim = 'ice'; eye = 'white'; }
  else if (main === 0 && A >= 3) { cloak = ['night', 'navy', 'sky']; hat = ['dusk', 'stone', 'silver']; trim = 'silver'; }
  if (main === 1 && B >= 3) { cloak = ['deep', 'navy', 'sky']; trim = 'ice'; }
  if (main === 1 && B >= 5) { cloak = ['night', 'navy', 'sky']; hat = ['navy', 'sky', 'ice']; trim = 'ice'; eye = 'yellow'; }
  if (main === 2 && C >= 2) { cloak = ['plum', 'crimson', 'red']; hat = ['ink', 'night', 'dusk']; kind = 'tricorn'; trim = 'yellow'; }
  if (main === 2 && C >= 5) { cloak = ['night', 'violet', 'orchid']; hat = ['ink', 'night', 'violet']; eye = 'yellow'; }
  return { cloak, hat, kind, trim, eye, wg };
}

/** Der Fischer. `hand` ist die Griffhand, `weapon()` zeichnet die Waffe (vor oder hinter dem Koerper, je nach Blick). */
function fisher(c: Cx, x: number, G: number, look: Look, hand: [number, number], weapon: () => void, hand2?: [number, number]): void {
  const { s, front, d, ph, A, B, C, main } = c;
  const { cloak, hat, wg } = look;
  const yT = G - 10, yB = G - 1, hem = [0, 1, 1, 0][ph];
  if (d.behind) weapon();
  // Stiefel + Rock
  s.rect(x - 4, G - 1, 3, 2, 'bark'); s.rect(x + 1, G - 1, 3, 2, 'bark'); s.px(x - 4, G - 1, 'wood'); s.px(x + 1, G - 1, 'wood');
  s.poly([[x - 4 - wg, yT], [x + 4 + wg, yT], [x + 5 + wg, yB], [x - 5 - wg, yB]], (px, py) => (px <= x - 4 - wg && py < yB - 1 ? cloak[2] : px >= x + 3 + wg ? cloak[0] : py <= yT ? cloak[2] : cloak[1]));
  for (let px = x - 5 - wg; px <= x + 4 + wg; px++) if ((px + hem) % 2 === 0) s.px(px, yB, cloak[0]);
  // Oelzeug-Latz (gelb) und Seilguertel
  if (look.kind === 'sou') { s.rect(x - 2, yT + 1, 5, 6, main === 0 && A >= 3 ? 'silver' : hat[1]); s.rect(x - 2, yT + 1, 5, 1, hat[2]); s.rect(x + 2, yT + 2, 1, 5, hat[0]); s.px(x - 2, yT + 3, 'ink'); }
  else { s.rect(x - 1, yT + 1, 3, 8, look.trim); for (let i = 0; i < 4; i++) s.px(x - 3 + (i % 2) * 6, yT + 2 + i * 2, look.trim); }
  s.rect(x - 4 - wg, G - 5, 9 + wg * 2, 1, 'tan'); s.px(x + 1, G - 4, 'tan'); s.px(x + 2, G - 3, 'sand');
  // Stufen am Koerper
  if (main === 0 && A >= 3) for (const sg of [-1, 1]) { s.ball(x + sg * (5 + wg), yT + 1, 3.4, 2.8, A >= 5 ? ['sky', 'ice', 'white'] : RAMPS.steel); s.px(x + sg * (5 + wg) - 1, yT, 'white'); }
  if (main === 0 && A >= 4) { s.rect(x - 4 - wg, yT + 2, 9 + wg * 2, 1, A >= 5 ? 'ice' : 'white'); s.px(x, yT + 4, 'white'); }
  if (main === 1 && B >= 3) for (let i = 0; i < 4; i++) s.px(x - 3 + i * 2, yT + 2 + (i % 2) * 2, B >= 5 ? 'ice' : 'sky');
  if (main === 1 && B >= 4) { s.rect(x - 4 - wg, yT, 9 + wg * 2, 2, 'sand'); s.px(x - 3, yT, 'white'); s.px(x + 2, yT + 1, 'tan'); }
  if (main === 2 && C >= 3) for (const sg of [-1, 1]) { s.rect(x + sg * (4 + wg) - (sg < 0 ? 2 : 0), yT, 3, 2, 'yellow'); s.px(x + sg * (4 + wg) - (sg < 0 ? 2 : 0), yT, 'white'); }
  if (main === 2 && C >= 4) { for (let i = 0; i < 3; i++) s.px(x - 3 + i * 3, yT + 4 + i, 'amber'); s.rect(x - 4 - wg, yT + 8, 9 + wg * 2, 1, 'yellow'); }
  // Kopf
  const hcx = x, hcy = G - 15;
  s.ball(hcx, hcy, 6, 5.5, cloak);
  s.px(hcx - 6, hcy - 2, cloak[0]); s.px(hcx - 6, hcy - 3, cloak[1]);
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.5));
    const rx = d.eyes === 1 ? 2.6 : 3.7;
    s.ellipseFn(fx, fy, rx, 3.2, (_px, _py, nx, ny) => ((-nx * 0.4 - ny * 0.7) > 0.3 ? 'peach' : 'skin'));
    const ec: PalName = look.eye ?? 'ink';
    const eye = (px: number): void => { s.rect(px, fy - 1, 2, 2, ec); if (!look.eye) s.px(px, fy - 1, 'white'); else s.px(px, fy - 2, ec); };
    if (d.eyes === 2) { eye(fx - 2); eye(fx + 1); s.px(fx - 3, fy + 1, 'coral'); s.px(fx + 3, fy + 1, 'coral'); s.px(fx, fy + 2, 'tan'); }
    else eye(fx);
    // Bart/Schnurrbart des Faehrmanns (Wal-Faenger: weiss)
    if (d.eyes === 2 && main === 0 && A >= 4) { s.rect(fx - 3, fy + 2, 7, 2, 'white'); s.px(fx - 3, fy + 4, 'silver'); s.px(fx + 3, fy + 4, 'silver'); s.px(fx, fy + 4, 'silver'); }
    if (main === 1 && B >= 2 && d.eyes === 2) { s.rect(fx - 3, fy - 1, 7, 1, 'ice'); s.px(fx - 3, fy, 'sky'); s.px(fx + 3, fy, 'sky'); s.px(fx - 1, fy - 2, 'white'); }
  }
  // Hut
  if (look.kind === 'sou') {
    s.ellipseFn(hcx - 0.5, hcy - 4, 7.8, 2.3, (_px, _py, nx, ny) => (ny < -0.25 ? hat[2] : ny > 0.45 ? hat[0] : hat[1]));
    s.ball(hcx, hcy - 6.5, 4.6, 3.8, hat);
    s.rect(hcx - 4, hcy - 5, 9, 1, main === 0 && A >= 3 ? 'slate' : 'rust');
    s.rect(hcx - 9, hcy - 3, 4, 3, hat[1]); s.px(hcx - 9, hcy - 3, hat[2]); s.px(hcx - 9, hcy - 1, hat[0]); // Nackenschutz
    if (A >= 2 && main !== 2) { s.line(hcx + 3, hcy - 9, hcx + 7, hcy - 14, 'red'); s.line(hcx + 4, hcy - 9, hcx + 7, hcy - 13, 'crimson'); s.px(hcx + 7, hcy - 15, 'coral'); }
  } else {
    s.poly([[hcx - 8, hcy - 3], [hcx - 5, hcy - 9], [hcx - 1, hcy - 7], [hcx + 1, hcy - 7], [hcx + 5, hcy - 9], [hcx + 8, hcy - 3], [hcx, hcy - 1.5]], (px, py) => (py < hcy - 8 ? hat[2] : px < hcx - 3 ? hat[1] : px > hcx + 4 ? hat[0] : hat[1]));
    s.line(hcx - 8, hcy - 3, hcx, hcy - 1, look.trim); s.line(hcx, hcy - 1, hcx + 8, hcy - 3, look.trim);
    s.px(hcx - 5, hcy - 9, look.trim); s.px(hcx + 5, hcy - 9, look.trim); s.px(hcx, hcy - 5, look.trim); s.px(hcx, hcy - 4, 'white');
    if (C >= 4) { s.line(hcx + 4, hcy - 9, hcx + 8, hcy - 14, 'white'); s.line(hcx + 5, hcy - 9, hcx + 8, hcy - 13, 'silver'); s.px(hcx + 8, hcy - 15, 'white'); }
  }
  // Kronen der Verwandlung
  if (main === 0 && A >= 5) for (let i = -2; i <= 2; i++) { const h = [3, 5, 7, 5, 3][i + 2] + (((ph + i) & 1) ? 1 : 0); s.line(hcx + i * 2, hcy - 9, hcx + i * 2, hcy - 9 - h, i % 2 ? 'ice' : 'white'); s.px(hcx + i * 2, hcy - 10 - h, 'white'); }
  if (main === 1 && B >= 5) { s.line(hcx - 4, hcy - 9, hcx - 6, hcy - 15, 'ice'); s.line(hcx + 4, hcy - 9, hcx + 6, hcy - 15, 'ice'); s.line(hcx, hcy - 10, hcx, hcy - 17, 'white'); s.px(hcx, hcy - 18, 'white'); s.px(hcx - 6, hcy - 16, 'white'); s.px(hcx + 6, hcy - 16, 'white'); }
  if (main === 2 && C >= 5) { for (let i = -3; i <= 3; i++) front.pxUnder(hcx + i * 2, hcy - 11 - ((ph + i) & 1) - (3 - Math.abs(i)), i % 2 ? 'yellow' : 'amber'); }
  // Arme
  const sx = x + 3, sy = yT + 2;
  if (hand2) drawArm(s, { sx: x - 3, sy, hx: hand2[0], hy: hand2[1], sleeve: 'navy', skin: 'skin', roll: 1 });
  drawArm(s, { sx, sy, hx: hand[0], hy: hand[1], sleeve: 'navy', skin: 'skin', roll: 1 });
  if (!d.behind) weapon();
  void B;
}

/** Wie weit die Hand beim Ausholen/Werfen entlang der Blickrichtung wandert. */
const handShift = (p: Pose): number => (p.ai < 0 ? 0 : [-2, -4, 4, 1][p.ai]);
const aimElev = (p: Pose): number => (p.ai < 0 ? 0.5 : [0.65, 0.4, 0.06, 0.3][p.ai]);

// ---------------------------------------------------------------- Aufbauten
/** Quader in der Bodenebene (u0..u1, v0..v1, h0..h1): Oberseite + die dem Betrachter zugewandten Seiten, Licht links. */
function block(c: Cx, u0: number, u1: number, v0: number, v1: number, h0: number, h1: number, ramp: Ramp): void {
  const { s } = c;
  const corners: [number, number][] = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const gy = (q: [number, number]): number => q[0] * c.fy + q[1] * c.ry;
  const gx = (q: [number, number]): number => q[0] * c.fx + q[1] * c.rx;
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    const mid = ((gy(a) + gy(b)) / 2), cy = (gy(corners[0]) + gy(corners[1]) + gy(corners[2]) + gy(corners[3])) / 4;
    if (mid <= cy + 0.01) continue; // abgewandte Seite
    const nxs = (gx(a) + gx(b)) / 2 - (gx(corners[0]) + gx(corners[1]) + gx(corners[2]) + gx(corners[3])) / 4;
    s.poly([P(c, a[0], a[1], h0), P(c, b[0], b[1], h0), P(c, b[0], b[1], h1), P(c, a[0], a[1], h1)], nxs < -0.4 ? ramp[2] : nxs > 0.4 ? ramp[0] : ramp[1]);
  }
  s.poly(corners.map(([u, v]) => P(c, u, v, h1)), ramp[2]);
}

/** Speergestell (A2): drei Harpunen im Faecher, rote Baender. */
function spearRack(c: Cx, u: number, v: number): void {
  const { s } = c;
  const [x, y] = P(c, u, v, deckH(c, u) + 1);
  s.rect(x - 3, y - 2, 7, 3, 'bark'); s.rect(x - 3, y - 2, 7, 1, 'wood'); s.px(x - 3, y, 'ink');
  for (let i = -1; i <= 1; i++) {
    const tx = x + i * 4, ty = y - 20 + Math.abs(i) * 2;
    tube(s, x + i, y - 2, tx, ty, 2, RAMPS.wood);
    s.poly([[tx - 1.6, ty + 0.5], [tx, ty - 4], [tx + 1.6, ty + 0.5]], (px, py) => ((px + py) % 3 === 0 ? 'white' : 'silver'));
    s.px(tx - 2, ty + 1, 'stone'); s.px(tx + 2, ty + 1, 'stone');
    s.px(tx - Math.sign(i), ty + 6, 'red'); s.px(tx, ty + 7, 'crimson');
  }
}
function rope(c: Cx, u: number, v: number): void {
  const { s } = c;
  const [x, y] = P(c, u, v, deckH(c, u) + 1);
  s.ellipseFn(x, y, 2.9, 1.6, (_x, _y, nx, ny) => (ny < -0.2 ? 'sand' : 'tan'));
  s.ellipse(x, y - 1, 1.4, 0.7, 'bark'); s.px(x + 2, y, 'sand');
}
function basket(c: Cx, u: number, v: number): void {
  const { s, ph } = c;
  const [x, y] = P(c, u, v, deckH(c, u) + 1);
  s.box(x - 3, y - 4, 7, 5, RAMPS.wood); for (let i = 0; i < 3; i++) s.px(x - 1 + i * 2, y - 2, 'bark');
  s.px(x - 2, y - 5, 'silver'); s.px(x - 1, y - 6, 'white'); s.px(x + 1, y - 5, 'stone'); s.px(x + 2, y - 6 + (ph % 2), 'silver'); s.px(x + 3, y - 5, 'ice');
}
function keg(c: Cx, u: number, v: number): void {
  const { s } = c;
  const [x, y] = P(c, u, v, deckH(c, u) + 1);
  s.ball(x, y - 2, 3, 3.2, RAMPS.darkWood); s.rect(x - 3, y - 3, 6, 1, 'stone'); s.rect(x - 3, y - 1, 6, 1, 'stone'); s.px(x + 1, y - 5, 'red'); s.px(x - 1, y - 3, 'tan');
}
function bell(c: Cx, x: number, y: number, r = 2.5, glow = false): void {
  const { s, ph } = c;
  s.line(x, y - r - 2, x, y - r, 'bark');
  s.ball(x, y, r, r * 1.05, RAMPS.brass);
  s.rect(Math.round(x - r), Math.round(y + r * 0.7), Math.round(r * 2), 1, 'rust');
  s.px(x + (ph % 2 ? 1 : 0), y + r + 1, 'amber');
  s.px(x - r * 0.4, y - r * 0.5, 'white');
  if (glow) c.front.pxUnder(x + r + 1 + (ph & 1), y - 1, 'ice');
}
/** Laternenmast am Heck: Stange mit Arm. Liefert die Spitze und haengt die Laterne auf. */
function lanternPost(c: Cx, u: number, h: number, withLantern = true): [number, number] {
  const { s } = c;
  const [x, y0] = P(c, u, 0, deckH(c, u)), y1 = y0 - h;
  s.rect(x, y1, 1, h, 'bark'); s.px(x, y1, 'wood'); s.px(x, y0, 'ink');
  const ax = x + Math.round(c.fx * 3), ay = y1 + Math.round(c.fy * 1.5);
  s.line(x, y1, ax, ay, 'bark');
  if (withLantern) lantern(c, ax, ay + 2);
  return [x, y1];
}

/** Strudel um das Boot (Riptide ab B3). */
function whirl(c: Cx, strength: number): void {
  const { back, ph, ship } = c;
  const arms = strength >= 2 ? 4 : 3, rMax = ship.L * 0.6 + 6 + strength * 4;
  for (let k = 0; k < arms; k++) {
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const a = (k / arms) * Math.PI * 2 + t * 3.1 - ph * 0.55;
      const r = ship.W * 0.55 + 3 + t * rMax;
      const [x, y] = P(c, Math.cos(a) * r * 1.15, Math.sin(a) * r, 0);
      if (t > 0.88 || (i + k + ph) % 7 === 6) continue;
      back.pxUnder(x, y, t < 0.3 ? 'white' : t < 0.6 ? 'ice' : 'sky');
      if (t < 0.6) back.pxUnder(x, y + 1, 'navy');
    }
  }
}
/** Seeschlange (Leviathan Call): Hals erhebt sich hinter dem Boot, Kopf schaut in Blickrichtung. */
function serpent(c: Cx): void {
  const { s, front, ph, ship, p } = c;
  const [bx, by] = P(c, -ship.L * 0.12, -(ship.W / 2 + 8), 0);
  const bob = [0, -1, -1, 0][ph];
  const hx = bx - 3, hy = by - 38 + bob + (p.ai === 2 ? 3 : 0);
  const body: Ramp = ['night', 'navy', 'sky'];
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, u = 1 - t;
    const x = u * u * bx + 2 * u * t * (bx - 11) + t * t * hx;
    const y = u * u * by + 2 * u * t * (by - 18) + t * t * hy;
    pts.push([x, y, 4.3 - t * 1.1 + (t < 0.15 ? 1 : 0)]);
  }
  // Windungen im Wasser
  for (const [dx, rr] of [[-12, 4.6], [11, 5]] as [number, number][]) {
    s.ellipseFn(bx + dx, by - 1, rr + 1.5, rr * 0.8, (x, y, nx, ny) => (ny < -0.3 ? body[2] : ny > 0.4 ? body[0] : body[1]));
    for (let i = 0; i < 3; i++) s.px(bx + dx - 2 + i * 2, by - 3 - (i % 2), 'ice');
  }
  pts.forEach(([x, y, r], i) => { s.ball(x, y, r, r, body); if (i % 3 === 1) { s.px(x + r * 0.2, y + r * 0.3, 'sky'); s.px(x + r * 0.5, y + r * 0.8, 'ice'); } });
  // Bauchschuppen vorn
  pts.forEach(([x, y, r], i) => { if (i > 1 && i % 2 === 0) s.rect(x + r - 1.5, y - 1, 2, 2, i % 4 === 0 ? 'sand' : 'tan'); });
  // Rueckenflosse
  pts.forEach(([x, y, r], i) => { if (i % 2 === 1 && i > 2 && i < 18) { s.line(x - r, y - 1, x - r - 3, y - 4 + (i % 4 === 1 ? 1 : 0), 'ice'); s.px(x - r - 3, y - 5, 'white'); } });
  // Kopf
  const open = p.flash || p.ai === 1;
  s.ellipseFn(hx + 4, hy, 7, 4.2, (x, y, nx, ny) => (ny < -0.2 ? body[2] : ny > 0.45 ? body[0] : body[1]));
  s.poly([[hx + 9, hy - 2], [hx + 14, hy], [hx + 9, hy + 2]], body[1]);
  if (open) { s.poly([[hx + 4, hy + 2], [hx + 14, hy + 5], [hx + 8, hy + 6]], body[0]); s.rect(hx + 5, hy + 2, 8, 2, 'crimson'); for (let i = 0; i < 4; i++) { s.px(hx + 6 + i * 2, hy + 1, 'white'); s.px(hx + 7 + i * 2, hy + 4, 'white'); } }
  else { s.rect(hx + 3, hy + 2, 11, 1, 'night'); for (let i = 0; i < 4; i++) s.px(hx + 6 + i * 2, hy + 3, 'white'); }
  s.rect(hx + 5, hy - 2, 3, 2, 'yellow'); s.px(hx + 5, hy - 2, 'white'); s.px(hx + 7, hy - 1, 'ink');
  for (let i = 0; i < 3; i++) { s.line(hx + 1 - i * 2, hy - 3, hx - 3 - i * 3, hy - 7 + i, 'ice'); s.px(hx - 3 - i * 3, hy - 8 + i, 'white'); }
  s.px(hx + 13, hy - 1, 'ink'); s.px(hx + 11, hy - 1, 'ink');
  if (p.ai === 2) for (let i = 0; i < 6; i++) front.pxUnder(hx + 15 + i, hy + 2 + ((i * 3) % 4) , i % 2 ? 'ice' : 'white');
  // Wasserschaum am Fuss
  for (let i = 0; i < 8; i++) front.pxUnder(bx - 6 + i * 2 + (ph & 1), by + 1, i % 2 ? 'white' : 'ice');
}

// ---------------------------------------------------------------- Begleitboote (Dusk Armada)
function escort(c: Cx, sg: number, off: number): void {
  const mini: Ship = { L: 19, W: 8, depth: 3, ramp: ['plum', 'bark', 'wood'], trim: 'amber' };
  const [ex, ey] = P(c, -c.ship.L * 0.12, sg * (c.ship.W / 2 + 11), 0);
  const c2: Cx = { ...c, ox: Math.round(ex), wy: Math.round(ey) + [0, 1, 1, 0][(c.ph + off) % 4], ship: mini };
  drawWater(c2);
  const h = drawHull(c2);
  const [px, py] = P(c2, -6, 0, deckH(c2, -6));
  c2.s.rect(px, py - 12, 1, 12, 'bark'); lantern(c2, px + Math.round(c.fx * 2), py - 11);
  cannon(c2, 5, 0, { len: 6, th: 2, ramp: RAMPS.brass, elev: 0.2 });
  c2.s.blit(h.near);
  const [qx, qy] = P(c2, 0, 0, deckH(c2, 0));
  // Matrose: kleiner Kopf mit Huetchen
  c2.s.rect(qx - 1, qy - 5, 3, 5, 'plum'); c2.s.ball(qx, qy - 7, 2.2, 2.2, RAMPS.skin); c2.s.rect(qx - 2, qy - 10, 5, 2, 'ink'); c2.s.px(qx - 1, qy - 7, 'ink'); c2.s.px(qx + 1, qy - 7, 'ink');
}

// ---------------------------------------------------------------- Hauptfunktion
export function drawRiverkeeper(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C), main = mainPath(t);
  const ship = shipOf(A, B, C, main);
  const half = ship.L / 2;
  const wy = 71 - Math.round((Math.max(ship.W / 2, half * 0.75) + 4.5) * K) - 1 - p.up;
  const c: Cx = { s, back, front, d, p, A, B, C, top, main, ox: OX, wy, fx: d.ux, fy: d.uy, rx: -d.uy, ry: d.ux, ph: p.ph, ship, muzzle: [OX + 10, wy - 14] };
  const look = lookOf(c);
  const rnd = irnd(41 + A * 3 + B * 7 + C * 13);
  void rnd; void GY; void H;
  const uB = half, uS = -half;
  const nearSign = c.ry > 0.3 ? 1 : c.ry < -0.3 ? -1 : 0;
  const farV = nearSign === 0 ? -1 : -nearSign;

  // ---------- Wasser und Hintergrund ----------
  drawWater(c);
  if (main === 1 && B >= 3) whirl(c, B - 3);
  const escorts = main === 2 && C >= 5;
  const farSign = nearSign === 0 ? -1 : -nearSign; // Seite, die hinter dem Flaggschiff liegt
  if (escorts) { escort(c, farSign, 0); if (nearSign === 0) escort(c, 1, 2); }
  if (main === 1 && B >= 5) serpent(c);
  if (main === 0 && A >= 5) lanceWater(c);

  const hull = drawHull(c);
  const objs: { z: number; ord: number; draw: () => void }[] = [];
  const add = (u: number, v: number, ord: number, draw: () => void): void => { objs.push({ z: u * c.fy + v * c.ry, ord, draw }); };
  const nearDecor: (() => void)[] = [];

  const ship2 = main === 2 && C >= 2;       // Segelschiff
  const gun = main === 0 && A >= 3;         // Harpunenkanone
  const mastSets: Record<number, { u: number; h: number; sails: [number, number][]; w: number }[]> = {
    2: [{ u: 3, h: 22, sails: [[5, 19]], w: 15 }],
    3: [{ u: 9, h: 25, sails: [[5, 21]], w: 15 }, { u: -5, h: 29, sails: [[5, 25]], w: 17 }],
    4: [{ u: 11, h: 32, sails: [[5, 18], [19, 29]], w: 17 }, { u: -6, h: 37, sails: [[5, 20], [21, 33]], w: 19 }],
    5: [{ u: 19, h: 34, sails: [[5, 17], [18, 31]], w: 17 }, { u: 2, h: 43, sails: [[5, 17], [18, 30], [31, 40]], w: 21 }, { u: -15, h: 33, sails: [[5, 18], [19, 30]], w: 17 }],
  };
  const cannonSets: Record<number, [number, number][]> = {
    1: [[uB - 5, 0]], 2: [[uB - 6, 0]],
    3: [[uB - 8, -3], [uB - 8, 3], [uB - 15, 0]],
    4: [[uB - 9, -3.6], [uB - 9, 3.6], [uB - 18, -3.6], [uB - 18, 3.6]],
    5: [[uB - 9, -4.4], [uB - 9, 4.4], [uB - 19, -4.4], [uB - 19, 4.4], [uB - 29, -4.4], [uB - 29, 4.4]],
  };

  // Laterne oder Sonar-Mast am Heck
  const postU = ship2 ? uS + 2 : uS + 3;
  if (!ship2) {
    const bonus = B >= 2 ? 3 + B : 0;
    add(postU, 0, 1, () => {
      const sonarMain = main === 1;
      const h = 18 + bonus;
      const [px, py] = lanternPost(c, postU, h, !(B >= 2));
      if (B >= 1 && B < 2) bell(c, px - Math.round(c.fx * 3), py + 5);
      if (B >= 1) {
        const R = sonarMain ? (B >= 5 ? 7 : B >= 4 ? 6.6 : B >= 3 ? 6 : 5) : 4.4;
        if (B >= 2) {
          dish(c, px, py - 1, R, { shell: B >= 4 ? ['dusk', 'sky', 'ice'] : RAMPS.brass, inner: ['navy', 'sky', 'ice'], glow: 'ice' });
          if (B >= 2) { const [lx, ly] = [px + Math.round(c.fx * 3), py + 14]; s.line(px, py + 6, lx, ly - 2, 'bark'); lantern(c, lx, ly); }
          if (B >= 2) dish(c, px, py + 9, 2.8, { shell: RAMPS.brass, inner: ['navy', 'sky', 'ice'], glow: 'ice' });
        }
        if (B >= 4) { crystalAt(c, px, py - 1 - R - 4); }
        // Ping-Boegen
        const r0 = 5 + ((c.ph + 1) % 4) * 3 + (B >= 3 ? 2 : 0);
        const cy = py - 1, ang = Math.atan2(c.fy * K, c.fx);
        for (let k = -3; k <= 3; k++) { const a = ang + k * 0.28; if (c.ph === 0 && B < 4 && Math.abs(k) > 1) continue; front.pxUnder(px + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.8, Math.abs(k) < 2 ? 'white' : 'ice'); }
        for (let k = -2; k <= 2; k++) { const a = ang + k * 0.34; front.pxUnder(px + Math.cos(a) * (r0 + 4), cy + Math.sin(a) * (r0 + 4) * 0.8, 'sky'); }
      }
    });
  }
  // Seile, Korb
  if (!ship2) {
    add(uB - 5, farV * 2.2, 1, () => rope(c, uB - 5, farV * 2.2));
    if ((A < 2 || gun) && A < 4) add(uS + 6, farV * 2.4, 1, () => basket(c, uS + 6, farV * 2.4));
    if ((A >= 2 && !gun) || A >= 4) add(uS + 4, farV * 2.6, 1, () => spearRack(c, uS + 4, farV * 2.6));
    if (C >= 1 && main !== 2) add(uS + 6, -farV * 1.4, 1, () => keg(c, uS + 6, -farV * 1.4));
    if (C >= 2 && main !== 2) add(uB - 6, farV * 0.4, 3, () => { const m = cannon(c, uB - 6, farV * 0.4, { len: 6, th: 2.4, ramp: RAMPS.brass }); void m; });
  }

  // Waffe: Harpunenkanone / Lanze
  if (gun) {
    const gu = uB - 6;
    add(gu, 0, d.behind ? 3 : 7, () => {
      const [bx, by] = P(c, gu - 2, 0, deckH(c, gu) + 4);
      const rec = p.ai === 2 ? 2 : p.ai === 3 ? 1 : 0;
      const bx2 = bx - c.fx * rec, by2 = by - c.fy * K * rec;
      const elev = 0.2 + (p.ai === 1 ? 0.05 : 0);
      const len = A >= 5 ? 19 : A >= 4 ? 13 : 10, th = A >= 5 ? 4 : A >= 4 ? 4 : 3;
      const [px, py] = P(c, gu - 2, 0, deckH(c, gu));
      // Bock
      s.rect(px - 1, py - 4, 3, 5, 'bark'); s.rect(px - 3, py, 7, 1, 'bark'); s.px(px - 1, py - 4, 'wood');
      const ramp: Ramp = A >= 5 ? ['sky', 'ice', 'white'] : A >= 4 ? RAMPS.steel : RAMPS.steel;
      const [vx, vy] = V(c, elev, len);
      if (!(A >= 5)) {
        tube(s, bx2, by2, bx2 + vx, by2 + vy, th, ramp);
        s.ball(bx2, by2, th * 0.62, th * 0.62, ramp);
        for (const f of [0.35, 0.7]) { s.px(bx2 + vx * f, by2 + vy * f, A >= 4 ? 'yellow' : 'white'); s.px(bx2 + vx * f, by2 + vy * f + 1, A >= 4 ? 'amber' : 'stone'); }
        // Winde
        s.ball(bx2 - c.fx * 2, by2 - 3, 2.6, 2.6, A >= 4 ? RAMPS.brass : RAMPS.iron); s.px(bx2 - c.fx * 2, by2 - 3, 'white');
        if (A >= 4) { s.line(bx2 - c.fx * 2, by2 - 3, bx2 + vx * 0.7, by2 + vy * 0.7 - 2, 'tan'); s.px(bx2 + vx * 0.2, by2 + vy * 0.2 - 3, 'white'); s.px(bx2 + vx * 0.5, by2 + vy * 0.5 - 4, 'white'); }
      }
      const mx = bx2 + vx, my = by2 + vy;
      if (A >= 5) {
        // Tidal Lance: riesige leuchtende Lanze auf Bockgabeln
        const lx = bx2 - vx * 0.25, ly = by2 - vy * 0.25;
        tube(s, lx, ly, mx, my, th, ramp);
        s.line(lx, ly - 1, mx, my - 1, 'white');
        for (let i = 0; i < 4; i++) { const f = 0.15 + i * 0.22; s.rect(lx + (mx - lx) * f - 1, ly + (my - ly) * f - 2, 2, 4, i % 2 ? 'sky' : 'navy'); }
        const [dx, dy] = [vx / Math.hypot(vx, vy), vy / Math.hypot(vx, vy)];
        const nx = -dy, ny = dx;
        s.poly([[mx + nx * 3.6, my + ny * 3.6], [mx + dx * 9, my + dy * 9], [mx - nx * 3.6, my - ny * 3.6], [mx - dx * 2, my - dy * 2]], (x, y) => ((x - y) % 3 === 0 ? 'white' : 'ice'));
        s.line(mx, my, mx + dx * 8, my + dy * 8, 'white');
        c.muzzle = [mx + dx * 9, my + dy * 9];
        for (let i = 0; i < 6; i++) { const f = (i + c.ph * 0.25) / 6; front.pxUnder(lx + (mx - lx) * f + nx * (3 + (i % 2)), ly + (my - ly) * f + ny * (3 + (i % 2)), i % 2 ? 'ice' : 'white'); front.pxUnder(lx + (mx - lx) * f - nx * 3, ly + (my - ly) * f - ny * 3 + 1, 'sky'); }
        if (p.flash) for (let i = 0; i < 8; i++) front.pxUnder(mx + dx * (11 + i * 1.5), my + dy * (11 + i * 1.5) + (i % 2), i % 2 ? 'white' : 'ice');
      } else {
        const hid = p.ai === 2 || p.ai === 3;
        c.muzzle = [mx, my];
        if (!hid) c.muzzle = harpoon(c, mx, my, elev, 4, { barbs: 2, head: 'silver', glow: A >= 4 ? 'ice' : undefined, th: 2 });
        if (p.flash) { front.rect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3, 'ice'); front.px(mx, my, 'white'); }
      }
    });
  } else {
    // Handwaffe: Harpune (A/B) oder Luntenstab (C1) oder Fernrohr (Schiffe)
  }

  // Kanonen (Armada)
  if (main === 2 && C >= 1) {
    const list = cannonSets[C] ?? [];
    list.forEach(([u, v], i) => add(u, v, 3, () => {
      const m = cannon(c, u, v, { len: C >= 4 ? 9 : C >= 3 ? 8 : 7, th: C >= 4 ? 3 : 2.6, ramp: C >= 5 ? ['night', 'violet', 'orchid'] : C >= 3 ? RAMPS.iron : RAMPS.brass, band: C >= 4 ? 'yellow' : undefined });
      if (i === 0) c.muzzle = m;
    }));
  }

  // Schiffsaufbauten
  if (ship2) {
    mastSets[C].forEach((m, i) => add(m.u, 0, 2, () => {
      const [mx, my] = mast(c, m.u, m.h, i === 0 ? (C >= 5 ? 'orchid' : C >= 4 ? 'red' : 'amber') : null);
      const sc: Ramp = C >= 5 ? ['plum', 'violet', 'orchid'] : C >= 4 ? ['crimson', 'red', 'coral'] : ['tan', 'sand', 'white'];
      m.sails.forEach(([h0, h1]) => sail(c, m.u, deckH(c, m.u) + h0, deckH(c, m.u) + h1, m.w * (h1 - h0 < 12 && m.sails.length > 2 ? 0.8 : 1), sc, { emblem: C >= 5 ? 'yellow' : C >= 3 ? 'amber' : null, trim: C >= 4 ? 'yellow' : undefined }));
      void mx; void my;
      // Wanten
      const [bx, by] = P(c, uB - 1, 0, deckH(c, uB - 1) + 1), [sx2, sy2] = P(c, uS + 1, 0, deckH(c, uS) + 1);
      s.line(mx, my + 2, bx, by, 'tan'); s.line(mx, my + 2, sx2, sy2, 'tan');
      // Laterne im Mastkorb / an der Spitze
      lantern(c, mx + Math.round(c.fx * 3) + (i === 0 ? 0 : 0), my + (m.h >= 28 ? 8 : 3));
    }));
    // Bugspriet + Galionsfigur
    add(uB - 1, 0, 4, () => {
      const [x0, y0] = P(c, uB - 4, 0, deckH(c, uB) + 1), [x1, y1] = P(c, uB + 5, 0, deckH(c, uB) + 3.5);
      tube(s, x0, y0, x1, y1, 2, RAMPS.wood);
      if (C >= 2) { s.line(x1, y1, x1, y1 + 3, 'bark'); lantern(c, x1, y1 + 4); }
      if (C >= 4) { s.ball(x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5 + 2, 2.4, 2.4, RAMPS.gold); s.px(x1, y1 + 8, 'yellow'); }
    });
    // Heckkastell
    if (C >= 3) add(uS + 7, 0, 0, () => {
      const hd = deckH(c, uS + 6);
      block(c, uS + 1.5, uS + (C >= 5 ? 14 : C >= 4 ? 11 : 9), -(ship.W / 2 - 2.2), ship.W / 2 - 2.2, hd - 1, hd + (C >= 4 ? 3.5 : 2.5), ship.ramp);
      if (C >= 4) { const [wx, wy2] = P(c, uS + 1.6, 0, hd + 4); lantern(c, wx + Math.round(c.fx * -0), wy2 - 3); }
    });
  }

  // Fischer / Kapitaen
  {
    const fu = gun ? uB - 20 : ship2 ? (C >= 4 ? uS + 6.5 : uS + 7) : 1;
    const lift = ship2 && C >= 4 ? 3.5 : 0;
    add(fu, 0, 6, () => {
      const [x, y] = P(c, fu, 0, deckH(c, fu) + lift);
      const G = Math.round(y) + 2;
      const xs = Math.round(x);
      const off = handShift(p);
      const hand: [number, number] = [xs + 4 + look.wg + Math.round(c.fx * 3 + c.fx * off), G - 8 + Math.round(c.fy * 2 + c.fy * K * off)];
      if (gun) {
        const [gx, gy] = P(c, uB - 8, 0, deckH(c, uB - 6) + 4);
        const h1: [number, number] = [Math.round(gx) - 1, Math.round(gy) - 2], h2: [number, number] = [Math.round(gx) - 3, Math.round(gy) - 1];
        fisher(c, xs, G, look, h1, () => undefined, h2);
      } else if (ship2) {
        // Fernrohr
        fisher(c, xs, G, look, hand, () => {
          const [vx, vy] = V(c, 0.12 + p.pull * 0.06, 6);
          tube(s, hand[0], hand[1], hand[0] + vx, hand[1] + vy, 2, RAMPS.brass); s.px(hand[0] + vx, hand[1] + vy, 'white'); s.px(hand[0] + vx * 0.5, hand[1] + vy * 0.5, 'yellow');
        });
      } else if (main === 2) {
        // Luntenstab (C1)
        fisher(c, xs, G, look, hand, () => {
          const [vx, vy] = V(c, aimElev(p) + 0.1, 1);
          const tx = hand[0] + vx * 13, ty = hand[1] + vy * 13;
          tube(s, hand[0] - vx * 5, hand[1] - vy * 5, tx, ty, 2, RAMPS.wood);
          s.px(tx, ty - 1, 'orange'); s.px(tx, ty - 2, p.ai === 1 || p.ai === 2 ? 'white' : 'yellow'); front.pxUnder(tx + 1, ty - 3, 'amber'); front.pxUnder(tx - 1, ty - 4 - (c.ph & 1), 'orange');
        });
      } else {
        fisher(c, xs, G, look, hand, () => {
          const tip = harpoon(c, hand[0], hand[1], aimElev(p), 15 + (A >= 2 ? 1 : 0), { barbs: A >= 2 ? 2 : A >= 1 ? 1 : 0, head: 'silver', rope: [xs - 4, G - 1], glow: undefined });
          c.muzzle = tip;
          if (p.flash) { front.pxUnder(tip[0] + c.fx * 2, tip[1] + c.fy, 'white'); front.pxUnder(tip[0] + c.fx * 3, tip[1] - 1, 'ice'); front.pxUnder(tip[0] + c.fx * 1, tip[1] + 2, 'sky'); }
        });
      }
    });
  }

  objs.sort((a, b) => a.z - b.z || a.ord - b.ord);
  objs.forEach((o) => o.draw());

  // ---------- Vordergrund: Bordwand, Pforten ----------
  s.blit(hull.near);
  if (main === 2 && C >= 3 && nearSign !== 0) {
    const ports = C >= 5 ? 5 : C >= 4 ? 4 : 3;
    for (let i = 0; i < ports; i++) {
      const u = uB - 8 - i * (C >= 5 ? 9 : 8) - (C >= 5 ? 0 : 0);
      const hw = (ship.W / 2) * (1 - 0.16 * Math.pow(u / half, 2));
      const [x, y] = P(c, u, nearSign * hw, 1.8 + rise(ship, u));
      s.rect(x - 1, y - 1, 3, 3, 'ink'); s.px(x - 1, y - 1, 'night');
      if (C >= 4) s.px(x, y, c.ph % 2 ? 'amber' : 'orange');
      if (p.flash && i % 2 === c.ph % 2) { front.pxUnder(x, y + 1, 'yellow'); front.pxUnder(x + c.fx, y, 'white'); }
    }
  }
  if (nearSign !== 0 && ship.trim !== 'tan' && !(main === 2 && C < 2)) {
    // Zierleiste an der Bordwand
    for (let u = uS + 3; u < uB - 2; u += 2) {
      const hw = (ship.W / 2) * (u >= 0 ? Math.pow(Math.max(0, 1 - Math.pow(u / half, 2.1)), 0.55) : 1 - 0.16 * Math.pow(u / half, 2));
      const [x, y] = P(c, u, nearSign * hw, ship.depth - 0.4 + rise(ship, u));
      if (s.get(x, y)) s.px(x, y, ship.trim);
    }
  }
  nearDecor.forEach((f) => f());
  if (escorts && nearSign !== 0) escort(c, nearSign, 2);
  // Bugschaum
  { const [x, y] = P(c, uB + 1.5, 0, 0); front.pxUnder(x + 1, y, 'white'); front.pxUnder(x + c.fx * 2, y + c.fy, 'ice'); front.pxUnder(x - 1 + [0, 1, 0, -1][c.ph], y + 1, 'white'); }

  return { fig: s, back, front, muzzle: [Math.round(c.muzzle[0]), Math.round(c.muzzle[1])] };
}

/** Lanze (A5): Wasserwirbel und Gischt um den Bug. */
function lanceWater(c: Cx): void {
  const { back, ph, ship } = c;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + ph * 0.3;
    const [x, y] = P(c, Math.cos(a) * (ship.L * 0.55 + 4), Math.sin(a) * (ship.W * 0.8 + 6), 0);
    back.pxUnder(x, y, i % 2 ? 'white' : 'ice');
  }
}
function crystalAt(c: Cx, x: number, y: number): void {
  const { s, ph } = c;
  s.poly([[x, y - 4], [x + 2.2, y], [x, y + 3], [x - 2.2, y]], (px) => (px < x - 0.3 ? 'white' : px > x + 0.5 ? 'sky' : 'ice'));
  c.front.pxUnder(x + 3, y - 3 + (ph & 1), 'white');
}

// ---------------------------------------------------------------- Effekte (Runde 16 TP)
/** Leviathan-Schlag (B5): Seeschlange schiesst aus dem Wasser, hebt den Kopf und schlaegt zu. 9 Bilder, Anker = Fuss (Wasserlinie am Ziel). */
export const LEVIATHAN_FRAMES = 9;
export const LEV_W = 56, LEV_H = 76, LEV_AX = 28, LEV_AY = 68;
export function leviathanStrikeRaster(frame: number): { rows: string[]; ax: number; ay: number } {
  const f = Math.max(0, Math.min(LEVIATHAN_FRAMES - 1, Math.floor(frame)));
  const s = new Surface(LEV_W, LEV_H), fx = new Surface(LEV_W, LEV_H);
  const body: Ramp = ['night', 'navy', 'sky'];
  const hgt = [6, 18, 32, 44, 46, 28, 14, 6, 0][f];
  const slam = f === 5 || f === 6;
  const open = f >= 3 && f <= 4;
  const bx = LEV_AX, by = LEV_AY;
  // Wasserringe am Fuss
  for (let k = 0; k < 2; k++) {
    const r = 4 + f * 2 + k * 5;
    if (f < 8 || k === 0) for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; if ((i + f) % 3 === 0) continue; fx.pxUnder(bx + Math.cos(a) * r, by + Math.sin(a) * r * 0.45, k ? 'sky' : (i % 2 ? 'white' : 'ice')); }
  }
  if (hgt > 0) {
    const topX = bx + (slam ? 6 : 0), topY = by - hgt;
    const n = Math.max(3, Math.round(hgt / 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = bx + (topX - bx) * t + Math.sin(t * 5 + f * 0.9) * 3 * (1 - t * 0.4), y = by - hgt * t;
      const r = 6 - t * 1.6;
      s.ball(x, y, r, r, body);
      if (i % 2 === 0) { s.px(x + r * 0.35, y + 0.5, 'sky'); s.px(x + r * 0.7, y + 1.5, 'ice'); }
      if (i % 3 === 1) s.rect(x + r - 2, y - 1, 2, 2, 'sand');
    }
    // Kopf
    const hx = topX, hy = topY;
    if (slam) {
      s.ellipseFn(hx, hy + 2, 5, 8, (x, y, nx, ny) => (nx < -0.3 ? body[2] : nx > 0.45 ? body[0] : body[1]));
      s.rect(hx - 4, hy + 8, 9, 3, 'crimson'); for (let i = 0; i < 4; i++) { s.px(hx - 3 + i * 2, hy + 7, 'white'); s.px(hx - 3 + i * 2, hy + 11, 'white'); }
      s.rect(hx - 3, hy, 2, 2, 'yellow'); s.rect(hx + 1, hy, 2, 2, 'yellow'); s.px(hx - 3, hy, 'white'); s.px(hx + 1, hy, 'white');
    } else {
      s.ellipseFn(hx + 3, hy - 1, 8, 5, (x, y, nx, ny) => (ny < -0.2 ? body[2] : ny > 0.45 ? body[0] : body[1]));
      if (open) { s.poly([[hx + 2, hy + 2], [hx + 14, hy + 6], [hx + 8, hy + 7]], body[0]); s.rect(hx + 4, hy + 2, 9, 2, 'crimson'); for (let i = 0; i < 4; i++) { s.px(hx + 5 + i * 2, hy + 1, 'white'); s.px(hx + 6 + i * 2, hy + 5, 'white'); } }
      else { s.rect(hx + 2, hy + 2, 11, 1, 'night'); for (let i = 0; i < 4; i++) s.px(hx + 5 + i * 2, hy + 3, 'white'); }
      s.rect(hx + 4, hy - 3, 3, 2, 'yellow'); s.px(hx + 4, hy - 3, 'white'); s.px(hx + 6, hy - 2, 'ink');
      for (let i = 0; i < 3; i++) { s.line(hx - i * 2, hy - 4, hx - 4 - i * 3, hy - 8 + i, 'ice'); s.px(hx - 4 - i * 3, hy - 9 + i, 'white'); }
    }
    if (f === 5) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; fx.px(bx + 6 + Math.cos(a) * 11, by + 1 + Math.sin(a) * 5, i % 2 ? 'white' : 'ice'); }
  }
  // Tropfen
  const rnd = irnd(f + 3);
  for (let i = 0; i < (f < 8 ? 7 : 3); i++) { const a = rnd() * Math.PI * 2, r = 5 + rnd() * 13; fx.pxUnder(bx + Math.cos(a) * r, by - 4 - rnd() * (hgt * 0.6 + 6), i % 2 ? 'white' : 'ice'); }
  const out = new Surface(LEV_W, LEV_H);
  out.blit(outlineSurface(s)); out.blit(fx);
  return { rows: out.toRows(), ax: LEV_AX, ay: LEV_AY };
}

/** Sonar-Ring (B1+): flacher Bodenring mit Lueckenmuster, Radius `r`, `t` 0..1 = Fortschritt (blasst aus). 4 Bilder je Radius kommen aus `frame`. */
export function sonarRingRaster(r: number, frame: number): { rows: string[]; ax: number; ay: number } {
  const R = Math.max(6, Math.round(r)), w = R * 2 + 6, h = Math.round(R * 1.1) + 6;
  const s = new Surface(w, h);
  const cx = R + 3, cy = Math.round(h / 2);
  const n = Math.max(24, Math.round(R * 4));
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if ((i + frame * 2) % 6 < 2) continue; s.px(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.55, i % 3 === 0 ? 'white' : 'ice'); }
  return { rows: s.toRows(), ax: cx, ay: cy };
}
