/**
 * Longshot (Runde 13): Lanternfolk-Scharfschuetze mit Langarmbrust bzw. Gewehr, Tarnumhang, Fernrohr. 15 Stufen sichtbar
 * (docs/design/tuerme-r13.md). A Heavy Rounds: Eisenbolzen -> Zielfernrohr -> Riesenarmbrust -> goldene Kanone.
 * B Rapid Reload: Nachtglas -> Patronengurt -> Repetierer -> zweiter Schuetze -> drei Schuetzen mit Banner.
 * C Field Kit: Splitterpatronen -> Ricochet-Spuren -> Funkgeraet mit Kiste -> Tarnnetz -> rotes Fadenkreuz.
 * Keine Plattform: Figur steht auf dem Boden. Haltung/Blick wie die anderen Tuerme (8 Richtungen, Idle 4 Frames, Angriff 4 Frames).
 */
import type { PalName } from '../palette';
import { drawArm } from './bows';
import { drawGear, growOf, mainPath, widthOf, PATH_RAMP5 } from './gear';
import { spark, tube } from './parts';
import type { Dir, Pose } from './pose';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { irnd, RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';

const CAMO: Ramp = ['deep', 'pine', 'grass'];

/** Rot-weisses Fadenkreuz-Symbol (Markierung). (cx, cy) = Mitte, r = Radius. */
export function crosshair(s: Surface, cx: number, cy: number, r: number, col: PalName, core: PalName = 'white'): void {
  s.ring(cx, cy, r, r, col);
  for (const sg of [-1, 1]) {
    s.line(cx + sg * (r + 2), cy, cx + sg * (r - 2), cy, col);
    s.line(cx, cy + sg * (r + 2), cx, cy + sg * (r - 2), col);
  }
  s.px(cx, cy, core);
}

/** Kleiner zweiter/dritter Schuetze (Volley Squad, Legion): Kapuze, Koerper, Gewehr in Blickrichtung. */
function mini(s: Surface, x: number, G: number, d: Dir, p: Pose, cloak: Ramp, flash: boolean): void {
  const up = p.up, yT = G - 8 - up;
  s.rect(x - 2, G - 1, 2, 2, 'bark'); s.rect(x + 1, G - 1, 2, 2, 'bark');
  s.poly([[x - 3, yT], [x + 3, yT], [x + 4, G - 1], [x - 4, G - 1]], (px) => (px < x - 1 ? cloak[2] : px > x + 1 ? cloak[0] : cloak[1]));
  s.ball(x, yT - 3, 4, 3.8, cloak);
  if (d.eyes > 0) { const fx = x + (d.eyes === 1 ? 2 : d.ex); s.rect(fx - 1, yT - 3, 3, 2, 'skin'); s.px(fx - 1, yT - 3, 'ink'); s.px(fx + 1, yT - 3, 'ink'); }
  const ax = d.ux * 0.95, ay = d.uy * 0.8, sx = x + 2, sy = yT + 2;
  tube(s, sx - ax * 2, sy - ay * 2, sx + ax * 11, sy + ay * 11, 2, RAMPS.iron);
  s.px(sx + ax * 6, sy + ay * 6 - 2, 'ice'); s.rect(sx + ax * 4 - 1, sy + ay * 4 - 3, 3, 1, 'night');
  s.rect(Math.round(sx + ax * 3), Math.round(sy + ay * 3), 2, 2, 'skin');
  if (flash) spark(s, sx + ax * 13, sy + ay * 13, 'yellow', true);
}

export function drawLongshot(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C), main = mainPath(t);
  const gr = growOf(top), wg = widthOf(top);
  const up = p.up + gr;
  const G = GY, ox = OX, ph = p.ph;
  const cloak: Ramp = top >= 5 ? (main === 0 ? RAMPS.gold : main === 1 ? (['navy', 'sky', 'ice'] as Ramp) : RAMPS.crimson) : CAMO;
  const kind = main === 0 && A >= 5 ? 'cannon' : main === 0 && A >= 4 ? 'giant' : main === 1 && B >= 3 ? 'rifle' : 'xbow';
  const rnd = irnd(7 + t[0] * 3 + t[1] * 11 + t[2] * 17);

  // ---------- Hintergrund: Funkgeraet (C3+), Banner (B5), zusaetzliche Schuetzen (B4/B5) ----------
  if (C >= 3) {
    const rx = ox - 9 - wg;
    back.box(rx, G - 18 - up + gr, 6, 9, RAMPS.dark);
    back.rect(rx + 1, G - 17 - up + gr, 3, 2, ph % 2 ? 'amber' : 'orange'); back.px(rx + 4, G - 13 - up + gr, 'leaf');
    back.line(rx + 1, G - 19 - up + gr, rx - 1, G - 29 - up + gr, 'silver'); back.px(rx - 1, G - 30 - up + gr, ph % 2 ? 'red' : 'crimson');
  }
  if (B >= 5) {
    // Banner der Legion
    const bx = ox - 14;
    back.rect(bx, G - 34, 1, 33, 'bark'); back.px(bx, G - 35, 'yellow');
    const w = [0, 1, 0, -1][ph];
    for (let i = 0; i < 9; i++) back.rect(bx + 1, G - 33 + i, 8 - (i > 5 ? i - 5 : 0) + (i > 6 ? w : 0), 1, i < 3 ? 'sky' : 'navy');
    back.rect(bx + 3, G - 31, 3, 3, 'yellow'); back.px(bx + 4, G - 30, 'white');
  }
  if (B >= 4) {
    const sh = 17;
    mini(s, ox + sh, G, d, { ...p, up: 0 }, B >= 5 ? ['navy', 'sky', 'ice'] : CAMO, p.flash && ph % 2 === 0);
    if (B >= 5) mini(s, ox - sh - 4, G, d, { ...p, up: 0 }, ['navy', 'sky', 'ice'], p.flash && ph % 2 === 1);
  }
  // Fallschirm-Kiste (C3+): gepackter Fallschirm auf der Kiste neben den Fuessen
  if (C >= 3) {
    const kx = ox + 11 + (B >= 4 ? 8 : 0);
    s.box(kx, G - 5, 7, 6, RAMPS.wood); s.rect(kx, G - 3, 7, 1, 'bark'); s.rect(kx + 3, G - 5, 1, 6, 'amber');
    s.ball(kx + 3, G - 7, 3.4, 2.4, ['violet', 'orchid', 'coral']); s.rect(kx + 1, G - 7, 5, 1, 'white');
  }

  // ---------- Waffe ----------
  const sx = ox + 3 + Math.min(2, wg), sy = G - 9 - up;
  const weapon = (): [number, number] => drawWeapon(s, front, back, t, d, p, kind, sx, sy, G);
  let muzzle: [number, number] = [ox + 10, G - 12];
  if (d.behind) muzzle = weapon();

  // ---------- Koerper ----------
  s.rect(ox - 4, G - 1, 3, 2, 'bark'); s.rect(ox + 1, G - 1, 3, 2, 'bark');
  const yT = G - 10 - up, yB = G - 1;
  const hem = [0, 1, 1, 0][ph];
  s.poly([[ox - 4 - wg, yT], [ox + 4 + wg, yT], [ox + 5 + wg, yB], [ox - 5 - wg, yB]], (x, y) => (x <= ox - 4 - wg && y < yB - 1 ? cloak[2] : x >= ox + 3 + wg ? cloak[0] : y <= yT ? cloak[2] : cloak[1]));
  for (let x = ox - 5 - wg; x <= ox + 4 + wg; x++) if ((x + hem) % 2 === 0) s.px(x, yB, cloak[0]);
  s.rect(ox - 4 - wg, G - 5, 9 + wg * 2, 1, 'bark');
  s.px(ox, G - 5, 'amber');
  if (top < 5) for (let i = 0; i < 9; i++) { const x = ox - 4 - wg + Math.floor(rnd() * (9 + wg * 2)), y = yT + 1 + Math.floor(rnd() * (yB - yT - 2)); s.px(x, y, rnd() < 0.5 ? 'leaf' : 'deep'); }
  if (B >= 2) {
    // Patronengurt schraeg ueber der Brust
    for (let i = 0; i < 9 + wg; i++) { const x = ox - 4 - wg + i, y = yT + 1 + Math.round(i * 0.75); s.px(x, y, 'bark'); if (i % 2 === 0) { s.px(x, y - 1, 'amber'); s.px(x, y, 'yellow'); } }
  }
  if (C >= 1) {
    // Splitterpatronen am Guertel
    for (let i = 0; i < 3; i++) { s.rect(ox - 4 - wg + i * 3, G - 5, 2, 3, 'violet'); s.px(ox - 4 - wg + i * 3, G - 5, 'orchid'); s.px(ox - 3 - wg + i * 3, G - 3, 'amber'); }
  }
  drawGear(s, back, front, { ox, G, yT, wg, t, ph, OY, own: { cape: false } });
  if (C >= 4) {
    // Tarnnetz ueber Schultern und Rumpf mit Abzeichen
    for (let y = yT - 1; y < yB - 2; y++) for (let x = ox - 5 - wg; x <= ox + 5 + wg; x++) if (((x + y) & 3) === 0 && s.get(x, y)) s.px(x, y, ((x * 3 + y) & 4) ? 'deep' : 'grass');
    for (let i = 0; i < 4; i++) { s.px(ox - 5 - wg - (i & 1), yT + 4 + i * 2, 'pine'); s.px(ox + 5 + wg + (i & 1), yT + 6 + i * 2, 'pine'); }
    s.px(ox - 3, yT + 5, 'yellow'); s.px(ox - 4, yT + 6, 'yellow'); s.px(ox - 2, yT + 6, 'yellow'); s.px(ox - 3, yT + 7, 'yellow');
  }

  // ---------- Kopf ----------
  const hcx = ox, hcy = G - 15 - up;
  const hb = gr >= 4 ? 1 : 0;
  s.ball(hcx, hcy, 6 + hb, 5.5 + hb, cloak);
  if (top < 5) for (let i = 0; i < 6; i++) s.px(hcx - 5 + Math.floor(rnd() * 11), hcy - 5 + Math.floor(rnd() * 5), rnd() < 0.5 ? 'leaf' : 'deep');
  s.px(hcx - 6, hcy - 3, cloak[1]); s.px(hcx - 7, hcy - 2, cloak[0]); s.px(hcx - 6, hcy - 2, cloak[1]);
  if (C >= 4) { s.rect(hcx - 5, hcy - 4, 11, 1, 'bark'); for (let i = 0; i < 4; i++) s.px(hcx - 4 + i * 3, hcy - 5, 'leaf'); }
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.5));
    const rx = d.eyes === 1 ? 2.6 : 3.7;
    s.ellipseFn(fx, fy, rx, 3.2, (_x, _y, nx, ny) => ((-nx * 0.4 - ny * 0.7) > 0.3 ? 'peach' : 'skin'));
    const eye = (x: number, patch = false) => {
      if (patch) { s.rect(x - 1, fy - 2, 4, 3, 'ink'); s.px(x - 1, fy - 2, 'night'); s.line(x - 1, fy - 2, x - 4, fy - 4, 'ink'); return; }
      s.rect(x, fy - 1, 2, 2, 'ink'); s.px(x, fy - 1, 'white');
    };
    if (d.eyes === 2) { eye(fx - 2, A >= 3); eye(fx + 1); s.px(fx - 3, fy + 1, 'coral'); s.px(fx + 3, fy + 1, 'coral'); s.px(fx, fy + 2, 'tan'); }
    else eye(fx);
    if (B >= 1) { s.rect(fx + (d.eyes === 2 ? 0 : -1), fy - 2, 4, 1, 'night'); s.rect(fx + (d.eyes === 2 ? 1 : 0), fy - 1, 3, 2, 'leaf'); s.px(fx + (d.eyes === 2 ? 1 : 0), fy - 1, 'white'); }
  }
  if (top >= 4 && !(C >= 4)) { s.rect(hcx - 6, hcy - 3, 13, 1, main === 0 ? 'amber' : main === 1 ? 'sky' : 'orchid'); }

  if (!d.behind) muzzle = weapon();

  // ---------- Effekte am Kopf ----------
  if (C >= 5) {
    // rotes Fadenkreuz-Abzeichen schwebt ueber dem Kopf (pulsiert)
    crosshair(front, hcx, hcy - 14 - (ph & 1), 4 + (ph === 2 ? 1 : 0), ph % 2 ? 'red' : 'crimson', 'white');
  }
  if (B >= 3 && p.flash) { front.px(sx - 4, sy - 5, 'amber'); front.px(sx - 5, sy - 7, 'yellow'); front.px(sx - 6, sy - 6, 'amber'); }
  void PATH_RAMP5;
  return { fig: s, back, front, muzzle };
}

function drawWeapon(s: Surface, front: Surface, back: Surface, t: Tiers, d: Dir, p: Pose, kind: 'xbow' | 'giant' | 'cannon' | 'rifle', sx: number, sy: number, G: number): [number, number] {
  const [A, B, C] = t;
  const ax = d.ux * 0.95, ay = d.uy * 0.8;
  const nl = Math.hypot(ax, ay) || 1;
  const px = -ay / nl, py = ax / nl; // quer
  const rec = p.recoil;
  const L = kind === 'cannon' ? 22 : kind === 'giant' ? 20 : kind === 'rifle' ? 21 : 15 + (A >= 2 ? 4 : 0);
  const w = kind === 'cannon' ? 5 : kind === 'giant' ? 3 : 2;
  const x0 = sx - ax * (1 + rec * 0.7), y0 = sy - ay * (1 + rec * 0.6) - 1;
  const x1 = x0 + ax * L, y1 = y0 + ay * L;
  const at = (f: number): [number, number] => [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
  const goldR = RAMPS.gold;

  // Stativ (Riesenarmbrust, Kanone)
  if (kind === 'giant' || kind === 'cannon') {
    const [mx, my] = at(0.45);
    const col: PalName = kind === 'cannon' ? 'rust' : 'bark';
    s.line(mx, my + 2, mx - 5, G + 1, col, 2); s.line(mx, my + 2, mx + 6, G + 1, col, 2); s.line(mx, my + 2, mx + 1, G + 2, kind === 'cannon' ? 'amber' : 'plum', 1);
    if (kind === 'cannon') { s.px(mx - 5, G, 'yellow'); s.px(mx + 6, G, 'yellow'); }
  }
  const arms = (): void => {
    const [fx, fy] = at(kind === 'rifle' ? 0.5 : 0.42), [rx, ry] = at(0.12);
    drawArm(s, { sx: sx - 1, sy, hx: Math.round(fx), hy: Math.round(fy + 1), sleeve: 'grass', skin: 'skin', roll: 1 });
    drawArm(s, { sx: sx - 6, sy, hx: Math.round(rx), hy: Math.round(ry + 1), sleeve: 'grass', skin: 'skin', roll: 1 });
  };
  const behind = d.behind;
  if (behind) arms();

  if (kind === 'rifle') {
    tube(s, x0, y0, x0 + ax * 7, y0 + ay * 7, 3, RAMPS.wood);
    tube(s, x0 + ax * 5, y0 + ay * 5, x1, y1, 2, RAMPS.iron);
    s.px(x1, y1, 'ink'); s.px(x1 - ax, y1 - ay, 'silver');
    // Magazin + Lauf-Ringe
    const [mx, my] = at(0.4);
    s.box(Math.round(mx - 2), Math.round(my + 1), 4, 5, RAMPS.dark); s.rect(Math.round(mx - 2), Math.round(my + 1), 4, 1, 'amber'); s.px(Math.round(mx), Math.round(my + 3), 'yellow');
    for (const f of [0.55, 0.8]) { const [rx, ry] = at(f); tube(s, rx - px * 2, ry - py * 2, rx + px * 2, ry + py * 2, 1, RAMPS.brass); }
    if (B >= 5) { const [mx2, my2] = at(0.7); s.rect(Math.round(mx2), Math.round(my2 + 1), 5, 2, 'amber'); } // Kopfzeichen: Messing
  } else if (kind === 'cannon') {
    tube(s, x0, y0, x1, y1, w, goldR, w + 1);
    for (const f of [0.15, 0.4, 0.7]) { const [rx, ry] = at(f); tube(s, rx - px * 3.5, ry - py * 3.5, rx + px * 3.5, ry + py * 3.5, 1.4, ['rust', 'orange', 'amber']); }
    s.ball(x1, y1, 3.6, 3.6, goldR); s.ball(x1 + ax, y1 + ay, 2, 2, ['ink', 'ink', 'night']);
    s.ball(x0, y0, 3, 3, goldR);
    // Leuchtkristall auf dem Rohr
    const [kx, ky] = at(0.3);
    s.poly([[kx, ky - 8], [kx + 2, ky - 5], [kx, ky - 2], [kx - 2, ky - 5]], (x) => (x < kx ? 'white' : 'ice')); front.px(kx, ky - 5, 'white');
    if (ph(p) % 2) spark(front, kx + 3, ky - 8, 'yellow'); else spark(front, kx - 4, ky - 6, 'white');
  } else {
    // Langarmbrust (auch Riesenarmbrust)
    tube(s, x0, y0, x1, y1, w, kind === 'giant' ? RAMPS.iron : RAMPS.wood, w);
    tube(s, x0, y0, x0 + ax * 5, y0 + ay * 5, w + 1, RAMPS.wood);
    const [cx, cy] = at(0.78);
    const half = kind === 'giant' ? 10 : 5 + (A >= 2 ? 1 : 0), th = kind === 'giant' ? 3 : 1.4;
    const ramp: Ramp = kind === 'giant' ? RAMPS.steel : RAMPS.darkWood;
    const tipA: [number, number] = [cx + px * half + ax * 2, cy + py * half + ay * 2], tipB: [number, number] = [cx - px * half + ax * 2, cy - py * half + ay * 2];
    tube(s, tipA[0], tipA[1], cx, cy, th, ramp, th + 0.6); tube(s, cx, cy, tipB[0], tipB[1], th + 0.6, ramp, th);
    const nock: [number, number] = [cx - ax * (1 + 6 * p.pull), cy - ay * (1 + 6 * p.pull)];
    s.line(tipA[0], tipA[1], nock[0], nock[1], 'silver'); s.line(tipB[0], tipB[1], nock[0], nock[1], 'silver');
    // Bolzen (nicht im Abschuss-Frame)
    if (!p.flash) {
      const bl = kind === 'giant' ? 20 : 15, tipc: PalName = A >= 1 ? 'stone' : 'sand';
      s.line(nock[0], nock[1], nock[0] + ax * bl, nock[1] + ay * bl, kind === 'giant' ? 'stone' : 'sand');
      const tx = nock[0] + ax * bl, ty = nock[1] + ay * bl;
      s.px(tx, ty, 'white'); s.px(tx - ax, ty - ay, tipc); s.px(tx - ax * 2, ty - ay * 2, tipc);
      if (A >= 1) { s.px(tx + ax * 1, ty + ay * 1, 'white'); s.px(tx - ax * 2 + px, ty - ay * 2 + py, 'slate'); s.px(tx - ax * 2 - px, ty - ay * 2 - py, 'slate'); }
      s.px(nock[0] + px, nock[1] + py, 'red'); s.px(nock[0] - px, nock[1] - py, 'red');
    }
    // Ricochet-Spuren (C2+): kleine Abprall-Zacken vor der Mündung
    if (C >= 2) {
      const mx = x1 + ax * 5, my = y1 + ay * 5;
      const o = ph(p) % 2;
      front.line(mx, my - 3, mx + 3, my - 1 + o, 'white'); front.line(mx + 3, my - 1 + o, mx + 1, my + 3, 'ice'); front.px(mx + 4, my - 2, 'yellow');
    }
  }
  // Zielfernrohr
  const scope = A >= 3 || B >= 1 || C >= 5 || kind !== 'xbow';
  if (scope) {
    const f0 = kind === 'rifle' ? 0.2 : 0.18, f1 = kind === 'rifle' ? 0.6 : 0.62;
    const [a0, b0] = at(f0), [a1, b1] = at(f1);
    const oy = -3 - (kind === 'cannon' ? 1 : 0);
    s.line(a0, b0 + oy + 3, a0, b0 + oy + 1, 'dusk');
    tube(s, a0, b0 + oy, a1, b1 + oy, 2, RAMPS.dark);
    s.rect(Math.round(a1 - 1), Math.round(b1 + oy - 1), 3, 3, 'night');
    const lens: PalName = B >= 1 ? 'leaf' : C >= 5 ? 'red' : 'ice';
    s.px(a1 + ax * 1.5, b1 + oy + ay * 1.5, lens); s.px(a1 + ax * 1.5, b1 + oy - 1 + ay * 1.5, lens);
    s.px(a0 - ax, b0 + oy - ay, B >= 1 ? 'white' : lens);
    if (B >= 1 && ph(p) % 2 === 0) front.px(a1 + ax * 2.5, b1 + oy - 2 + ay * 2.5, 'leaf');
    if (C >= 5 && ph(p) % 2) front.px(a1 + ax * 2.5, b1 + oy - 2, 'red');
  }
  if (!behind) arms();

  // Muendungsblitz und Rauch
  const mxp = x1 + ax * (kind === 'cannon' ? 5 : 4), myp = y1 + ay * (kind === 'cannon' ? 5 : 4);
  if (p.flash) {
    const r = kind === 'cannon' ? 5 : kind === 'giant' ? 4 : 3;
    front.ball(mxp, myp, r, r, kind === 'cannon' ? ['amber', 'yellow', 'white'] : ['orange', 'amber', 'yellow']);
    spark(front, mxp + ax * 3, myp + ay * 3, 'white', true);
    if (kind === 'cannon') {
      // Lichtstrahl entlang der Schussrichtung
      for (let i = 4; i < 20; i++) { const bx = mxp + ax * i * 1.4, by = myp + ay * i * 1.4; front.px(bx, by, 'white'); front.px(bx + px, by + py, i % 2 ? 'yellow' : 'amber'); front.px(bx - px, by - py, i % 2 ? 'amber' : 'yellow'); }
    }
  } else if (p.ai === 3) {
    front.ball(mxp + ax * 2, myp + ay * 2 - 3, 2, 2, RAMPS.stone);
    front.px(mxp + ax * 4, myp + ay * 4 - 5, 'silver');
  }
  void back; void B;
  return [Math.round(mxp), Math.round(myp)];
}
const ph = (p: Pose): number => p.ph;
