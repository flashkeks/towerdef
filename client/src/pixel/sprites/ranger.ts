/** Ranger: Lanternfolk mit gruener Kapuze und Bogen. 15 Stufen sichtbar (docs/design/tuerme.md). */
import type { PalName } from '../palette';
import { cloud, orbit, spark } from './parts';
import { drawGear, growOf, mainPath, widthOf } from './gear';
import { drawArm, drawArrow, drawBow, bowShape } from './bows';
import type { Dir, Pose } from './pose';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';
import { tube } from './parts';

export interface TowerLayers { fig: Surface; back: Surface; front: Surface; muzzle: [number, number] }

// Runde 13: keine Plattform mehr. Die Figur steht auf dem Boden, Anker = Fuesse (OY), Schatten kommt separat (shadowSprite).
export const TW = 96;
export const TH = 80;
export const OX = 48;
export const GY = 70; // unterste Zeile der Schuhe
export const OY = 71; // Boden (Ankerpunkt): eine Zeile unter den Schuhen

export { mainPath };

export function drawRanger(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C);
  const mainP = mainPath(t);
  const gr = growOf(top), wg = widthOf(top);
  const up = p.up + gr;
  const G = GY, ox = OX;
  const goldArmor = B >= 5;
  // Stufe 5 hat eigene Farben: A flammenrot, B gold, C Sternenviolett
  const cloak: Ramp = top >= 5 ? (mainP === 0 ? RAMPS.red : mainP === 1 ? RAMPS.gold : (['night', 'violet', 'orchid'] as Ramp)) : RAMPS.leaf;
  const ph = p.ph;

  // ---------- Hintergrund: Umhang, Banner, Koecher, Aura ----------
  if (B >= 4) {
    const bx = ox - 6;
    back.rect(bx, G - 28 - up, 1, 25, 'bark');
    back.px(bx, G - 29 - up, 'yellow');
    const w = [0, 1, 0, -1][ph];
    for (let i = 0; i < 6; i++) {
      const len = 8 - Math.floor(i / 2) * 1;
      back.rect(bx - len - (i === 5 ? w : 0), G - 27 - up + i, len, 1, i < 3 ? 'crimson' : 'plum');
    }
    back.px(bx - 4, G - 25 - up, 'yellow'); back.px(bx - 4, G - 24 - up, 'yellow'); back.px(bx - 5, G - 24 - up, 'yellow'); back.px(bx - 3, G - 24 - up, 'yellow');
  }
  // Koecher
  const quiver = (qx: number, flip: number) => {
    tube(back, qx, G - 5 - up, qx + flip * 2, G - 13 - up, 3, RAMPS.wood);
    for (let i = 0; i < 3; i++) {
      const ax = qx + flip * (2 + i) - (i === 0 ? 1 : 0);
      back.line(ax, G - 13 - up, ax + flip * 1, G - 17 - up + (i === 1 ? 1 : 0), 'sand');
      back.px(ax + flip * 1, G - 17 - up + (i === 1 ? 1 : 0), A >= 2 ? 'red' : 'sand');
      if (A >= 2) back.px(ax + flip * 1, G - 16 - up + (i === 1 ? 1 : 0), 'crimson');
    }
  };
  quiver(ox - 4, -1);
  if (A >= 3) quiver(ox + 4, 1);

  // ---------- Waffe hinter dem Koerper (Blick nach oben) ----------
  const sx = ox + 3 + Math.min(2, wg), sy = G - 9 - up;
  const weapon = () => drawRangerWeapon(s, front, t, d, p, sx, sy, G, up);
  let muzzle: [number, number] = [ox, G - 10];
  if (d.behind) muzzle = weapon();

  // ---------- Koerper ----------
  s.rect(ox - 4, G - 1, 3, 2, 'bark'); s.rect(ox + 1, G - 1, 3, 2, 'bark');
  s.px(ox - 4, G - 1, 'wood'); s.px(ox + 1, G - 1, 'wood');
  const yT = G - 10 - up, yB = G - 1;
  const hem = [0, 1, 1, 0][ph];
  s.poly([[ox - 4 - wg, yT], [ox + 4 + wg, yT], [ox + 5 + wg, yB], [ox - 5 - wg, yB]], (x, y) => {
    if (x <= ox - 4 - wg && y < yB - 1) return cloak[2];
    if (x >= ox + 3 + wg) return cloak[0];
    if (y <= yT) return cloak[2];
    return cloak[1];
  });
  // Saum
  for (let x = ox - 5 - wg; x <= ox + 4 + wg; x++) if ((x + hem) % 2 === 0) s.px(x, yB, cloak[0]);
  // Guertel
  const by = G - 5;
  s.rect(ox - 4 - wg, by, 9 + wg * 2, 1, goldArmor ? 'rust' : 'bark');
  s.px(ox, by, 'yellow');
  if (goldArmor) { s.rect(ox - 3, G - 8 - up, 7, 1, 'yellow'); s.px(ox, G - 7 - up, 'white'); s.px(ox - 1, G - 7 - up, 'white'); }
  drawGear(s, back, front, { ox, G, yT, wg, t, ph, OY });

  // ---------- Kopf ----------
  const hcx = ox, hcy = G - 15 - up;
  const hood: Ramp = cloak;
  const hb = gr >= 4 ? 1 : 0;
  s.ball(hcx, hcy, 6 + hb, 5.5 + hb, hood);
  // Kapuzenspitze (zeigt nach hinten/links)
  s.px(hcx - 6, hcy - 3, hood[1]); s.px(hcx - 7, hcy - 2, hood[0]); s.px(hcx - 6, hcy - 2, hood[1]);
  if (A >= 2 && !goldArmor && B < 4) {
    // rote Feder in der Kapuze
    s.line(hcx + 3, hcy - 5, hcx + 6, hcy - 10, 'red'); s.line(hcx + 4, hcy - 5, hcx + 6, hcy - 9, 'crimson'); s.px(hcx + 6, hcy - 11, 'coral'); s.px(hcx + 5, hcy - 9, 'white');
  }
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.5));
    const rx = d.eyes === 1 ? 2.6 : 3.7;
    s.ellipseFn(fx, fy, rx, 3.2, (x, y, nx, ny) => ((-nx * 0.4 - ny * 0.7) > 0.3 ? 'peach' : 'skin'));
    const eye = (x: number) => {
      s.rect(x, fy - 1, 2, 2, 'ink');
      s.px(x, fy - 1, 'white');
    };
    if (d.eyes === 2) {
      eye(fx - 2); eye(fx + 1);
      s.px(fx - 3, fy + 1, 'coral'); s.px(fx + 3, fy + 1, 'coral');
      s.px(fx, fy + 2, 'tan');
    } else {
      eye(fx);
    }
    if (C >= 2) {
      // Adler-Monokel
      const mx = d.eyes === 2 ? fx + 1 : fx;
      for (let i = 0; i < 4; i++) { s.px(mx - 1 + i, fy - 2, 'amber'); s.px(mx - 1 + i, fy + 1, 'amber'); }
      s.px(mx - 1, fy - 1, 'amber'); s.px(mx - 1, fy, 'amber'); s.px(mx + 2, fy - 1, 'amber'); s.px(mx + 2, fy, 'amber');
      s.px(mx + 2, fy + 2, 'yellow'); s.px(mx + 3, fy + 3, 'yellow');
      s.px(mx + 2, fy - 2, 'white');
    }
  } else if (C >= 2) {
    s.px(hcx + 2, hcy - 2, 'amber'); // Federchen am Hinterkopf
  }
  if (B >= 2 && B < 4 && !goldArmor) {
    // Stirnband
    s.rect(hcx - 5, hcy - 3, 11, 1, 'crimson');
    s.px(hcx - 6, hcy - 3, 'crimson'); s.px(hcx - 7, hcy - 2 + (ph & 1), 'red'); s.px(hcx - 8, hcy - 1 + (ph & 1), 'crimson');
  }
  if (goldArmor) {
    // Helmkamm
    for (let i = 0; i < 6; i++) s.px(hcx - 3 + i, hcy - 6 - (i === 2 || i === 3 ? 1 : 0), 'red');
    s.px(hcx, hcy - 7, 'crimson'); s.rect(hcx - 5, hcy - 4, 11, 1, 'rust');
  }
  if (B >= 4 && !goldArmor) {
    // Hauptmannshut mit Feder
    s.ellipse(hcx, hcy - 4, 8, 2.4, 'plum');
    s.ellipseFn(hcx, hcy - 4.5, 7.5, 2, (x, y, nx, ny) => (ny < -0.1 ? 'crimson' : 'plum'));
    s.ball(hcx, hcy - 6.5, 4, 3, RAMPS.crimson);
    s.rect(hcx - 4, hcy - 5, 9, 1, 'yellow');
    s.curve(hcx + 3, hcy - 8, hcx + 8, hcy - 12 + (ph & 1), hcx + 9, hcy - 6, 'white');
    s.px(hcx + 8, hcy - 8, 'silver');
  }

  // ---------- Waffe vor dem Koerper ----------
  if (!d.behind) muzzle = weapon();

  // ---------- Aura (Stufe 5) ----------
  if (B >= 5) {
    // Pfeilwirbel
    for (const [x, y, z] of orbit(ox, G - 8 - up, 15, 5, 8, ph * 1, 4)) {
      const tx = -Math.sign(z || 1), tgt = z < 0 ? back : front;
      tgt.line(x, y, x + tx * 3, y + (z < 0 ? 1 : -1) * 0, 'yellow');
      tgt.px(x + (tx > 0 ? 3 : -3), y, 'white');
    }
  }
  if (A >= 5) {
    for (let i = 0; i < 6; i++) {
      const a = (i * 2.1 + ph * 0.5) % 6.28;
      spark(back, ox - 12 + Math.cos(a) * 3, G - 22 + Math.sin(a * 1.3) * 8 + ((ph + i) % 4), i % 2 ? 'yellow' : 'white');
    }
  }
  if (C >= 5) {
    for (const [x, y] of orbit(ox, G - 10 - up, 14, 8, 5, ph, 4)) spark(front, x, y, 'yellow', true);
    cloud; // eslint
  }
  return { fig: s, back, front, muzzle };
}

export function drawRangerWeapon(s: Surface, front: Surface, t: Tiers, d: Dir, p: Pose, sx: number, sy: number, G: number, up: number): [number, number] {
  const [A, B, C] = t;
  const main = mainPath(t);
  const ballista = main === 2 && C >= 3;
  const sleeve: PalName = B >= 5 ? 'amber' : A >= 5 ? 'grass' : 'grass';
  const ux = d.ux, uy = d.uy;
  const roll = B >= 1 ? 0.4 : 1;
  const draw = 5 + (A >= 5 ? 3 : 0);
  const recoil = p.recoil;
  const aimx = ux * 0.9, aimy = uy * 0.75;
  if (!ballista) {
    // Bogen
    const half = A >= 5 ? 11 : A >= 4 ? 8 : A >= 3 ? 6.5 : C >= 1 ? 7 : 5;
    const reach = 6 + (A >= 5 ? 4 : 0);
    const cx = sx + aimx * reach - ux * recoil * 0.6, cy = sy + aimy * reach - uy * recoil * 0.4;
    const ramp: Ramp = A >= 5 ? RAMPS.gold : A >= 4 ? RAMPS.wood : RAMPS.wood;
    const tip: PalName | null = A >= 4 ? 'amber' : null;
    const th = A >= 5 ? 2 : 1;
    const bo = { cx, cy, ux, uy, half, pull: p.pull, ramp, tip, th, draw };
    if (!d.behind) {
      // Arme zuerst, Bogen darueber
      drawArm(s, { sx: sx - 1, sy, hx: Math.round(cx), hy: Math.round(cy), sleeve, skin: 'skin', roll });
    }
    const { nock } = drawBow(s, bo);
    if (d.behind) drawArm(s, { sx: sx - 1, sy, hx: Math.round(cx), hy: Math.round(cy), sleeve, skin: 'skin', roll });
    // Zugarm
    drawArm(s, { sx: sx - 6, sy, hx: Math.round(nock[0]), hy: Math.round(nock[1]), sleeve, skin: 'skin', roll });
    // Pfeile
    const fired = p.flash;
    const tipc: PalName = A >= 1 ? 'white' : 'silver';
    const fletch: PalName | null = A >= 2 ? 'red' : null;
    const arrows = A >= 5 ? 1 : A >= 4 ? 5 : A >= 3 ? 3 : 1;
    if (!fired) {
      for (let i = 0; i < arrows; i++) {
        const off = (i - (arrows - 1) / 2) * 0.28;
        const ca = Math.cos(off), sa = Math.sin(off);
        const dx = ux * ca - uy * sa, dy = ux * sa + uy * ca;
        const len = A >= 5 ? 14 : 9;
        drawArrow(s, nock[0], nock[1], dx, dy, len, { tip: A >= 5 ? 'yellow' : tipc, fletch: A >= 5 ? 'white' : fletch, shaft: A >= 5 ? 'amber' : 'sand', barbs: A >= 1 });
        if (A >= 5) drawArrow(front, nock[0], nock[1] + 0, dx, dy, 0, { tip: 'yellow', fletch: null });
      }
    }
    if (A >= 1 && p.ph % 2 === 0) front.px(cx + aimx * 9 + 1, cy + aimy * 9 - 1, 'white');
    if (A >= 5) {
      // Leuchtspur hinter dem Pfeil
      for (let i = 1; i <= 5; i++) front.px(nock[0] - aimx * i * 1.6, nock[1] - aimy * i * 1.6, i < 3 ? 'yellow' : 'amber');
    }
    // Repetier-Mechanik
    if (B >= 3) {
      const mx = Math.round(cx - ux * 0), my = Math.round(cy);
      s.box(mx - 2, my - 2, 4, 4, RAMPS.iron);
      s.px(mx, my - 1, 'amber');
      s.rect(mx - 1, my - 4, 2, 2, 'wood'); // Magazin
      s.px(mx - 1, my - 5, 'sand'); s.px(mx, my - 5, 'sand');
    }
    // zweiter Bogen (B5)
    if (B >= 5) {
      const c2x = sx - 11, c2y = sy - 1;
      drawBow(s, { cx: c2x, cy: c2y, ux, uy, half: 6, pull: p.pull, ramp: RAMPS.gold, tip: 'white', draw: 4 });
    }
    return [Math.round(cx + aimx * 4), Math.round(cy + aimy * 4)];
  }
  // ---- Balliste (C3..C5) ----
  const len = C >= 5 ? 17 : C >= 4 ? 15 : 12;
  const half = C >= 5 ? 10 : C >= 4 ? 8 : 6;
  const gx = sx + aimx * 1.5, gy = sy + 1 + aimy * 1.5; // Stockanfang
  const ex = gx + aimx * len - ux * p.recoil * 0.5, ey = gy + aimy * len - uy * p.recoil * 0.4;
  // Staender
  if (Math.abs(uy) < 0.9) {
    const mx = (gx + ex) / 2, my = (gy + ey) / 2;
    s.line(mx, my + 1, mx - 2, G + 1, 'bark', 2);
    s.line(mx, my + 1, mx + 3, G + 1, 'bark', 1);
  }
  const stockRamp: Ramp = C >= 5 ? RAMPS.gold : C >= 4 ? RAMPS.iron : RAMPS.wood;
  tube(s, gx, gy, ex, ey, 3, C >= 4 ? RAMPS.wood : RAMPS.wood);
  if (C >= 4) { for (const f of [0.3, 0.6, 0.85]) s.px(gx + (ex - gx) * f, gy + (ey - gy) * f - 1, 'stone'); s.px(ex, ey, 'silver'); }
  const bo = { cx: ex - aimx * 2, cy: ey - aimy * 2, ux, uy, half, pull: p.pull, ramp: stockRamp, tip: C >= 4 ? 'silver' as PalName : null, th: C >= 5 ? 2 : 2, draw: len - 3, string: 'silver' as PalName };
  const { nock } = drawBow(s, bo);
  if (C >= 4) { s.px(bo.cx, bo.cy, 'stone'); s.px(bo.cx + 1, bo.cy, 'silver'); }
  // Hand am Stock, Arm
  drawArm(s, { sx: sx - 1, sy, hx: Math.round(gx + aimx * 4), hy: Math.round(gy), sleeve, skin: 'skin', roll: 1 });
  drawArm(s, { sx: sx - 6, sy, hx: Math.round(gx + aimx * 1), hy: Math.round(gy + 1), sleeve, skin: 'skin', roll: 1 });
  // Bolzen
  if (!p.flash) {
    const bl = C >= 5 ? 16 : 13;
    drawArrow(s, nock[0], nock[1], ux, uy, bl, { tip: C >= 5 ? 'yellow' : C >= 4 ? 'silver' : 'stone', fletch: 'red', shaft: C >= 4 ? 'stone' : 'sand' });
    if (C >= 5) {
      const tx = nock[0] + aimx * bl, ty = nock[1] + aimy * bl;
      front.px(tx, ty, 'white');
    }
  }
  if (C >= 5) {
    // Leuchtkristall auf dem Stock
    const kx = gx + aimx * len * 0.4, ky = gy + aimy * len * 0.4 - 4;
    s.poly([[kx, ky - 3], [kx + 2, ky], [kx, ky + 3], [kx - 2, ky]], (x) => (x < kx ? 'white' : 'ice'));
    front.px(kx, ky, 'white');
    spark(front, kx + 3, ky - 3 + (p.ph & 1), 'yellow', true);
    spark(front, kx - 4, ky + 1 - (p.ph & 1), 'ice');
  }
  return [Math.round(ex + aimx * 4), Math.round(ey + aimy * 4)];
}

export { bowShape };
