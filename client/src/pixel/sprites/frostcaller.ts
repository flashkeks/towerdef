/** Frostcaller: Lanternfolk mit Spitzhut, Schal und Kristallstab. 15 Stufen sichtbar. */
import { bolt, cloud, crystal, flake, orbit, pedestal, spark, tube } from './parts';
import { drawArm } from './bows';
import type { Dir, Pose } from './pose';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';
import { GY, mainPath, OX, OY, pedestalKind, type TowerLayers } from './ranger';

export function drawFrost(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = 55, H = 56;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C);
  const main = mainPath(t);
  const ph = p.ph;
  const float = C >= 5 ? 3 + (ph === 1 || ph === 2 ? 1 : 0) : 0;
  const up = p.up + float;
  const G = GY, ox = OX;
  const armor = A >= 5;
  const robe: Ramp = armor ? RAMPS.frost : RAMPS.navy;
  const hat: Ramp = C >= 4 ? ['ink', 'night', 'dusk'] : armor ? RAMPS.ice : ['night', 'navy', 'sky'];
  const scarf: Ramp = A >= 1 ? RAMPS.frost : RAMPS.sand;
  pedestal(s, ox, OY, pedestalKind(top, 'frostcaller', t), ph, top >= 5 ? 11 : top >= 3 ? 10 : 9);

  // ---- Hintergrund ----
  if (B >= 5) {
    // Frost-Golem-Silhouette hinter der Figur
    const gy = G - 4;
    const gc = (x: number, y: number) => (x < ox - 2 ? 'ice' : x > ox + 3 ? 'navy' : 'sky');
    back.poly([[ox - 8, gy - 22], [ox + 8, gy - 22], [ox + 12, gy - 14], [ox + 9, gy + 2], [ox - 9, gy + 2], [ox - 12, gy - 14]], gc);
    back.ball(ox, gy - 26, 5, 4.5, RAMPS.ice);
    back.rect(ox - 3, gy - 27, 2, 2, 'yellow'); back.rect(ox + 1, gy - 27, 2, 2, 'yellow');
    back.rect(ox - 16, gy - 20, 5, 12, 'sky'); back.rect(ox + 11, gy - 20, 5, 12, 'navy');
    back.rect(ox - 16, gy - 20, 5, 2, 'ice'); back.rect(ox + 11, gy - 20, 5, 2, 'sky');
    for (let i = 0; i < 4; i++) back.px(ox - 5 + i * 3, gy - 10 + (i % 2) * 3, 'white');
    // Eisflügel
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const wx = ox + sgn * (13 + i * 3), wy = gy - 26 + i * 2 + (ph & 1);
        back.line(wx, wy, wx + sgn * 2, wy - 8 + i * 1, i % 2 ? 'ice' : 'white', 1);
        back.line(wx, wy, wx + sgn * 2, wy - 8 + i * 1, i % 2 ? 'ice' : 'white', 1);
      }
    }
  }
  if (C >= 3) {
    // kleine Gewitterwolke über dem Hut (C3+), bei C4/C5 grösser
    const w = C >= 5 ? 20 : C >= 4 ? 16 : 11;
    cloud(back, ox, G - 28 - up - (C >= 4 ? 3 : 0) + (ph === 1 || ph === 2 ? 1 : 0), w, true, ph);
  }
  if (A >= 5) {
    // weisse Aura: gestrichelter Ring
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + ph * 0.1;
      back.pxUnder(ox + Math.cos(a) * 15, G - 10 + Math.sin(a) * 15, (i + ph) % 2 ? 'white' : 'ice');
    }
  }

  // ---- Stab ----
  const sx = ox + 5, sy = G - 3 - up + float;
  const ux = d.ux, uy = d.uy;
  const lean = p.atk ? [0.25, 0.1, -0.05, 0.1][p.ai] : 0;
  const sp = main === 1 && B >= 4;
  const staffL = sp ? 28 : A >= 4 ? 24 : 22;
  let vx = 0.42 * ux + lean * ux * 3, vy = -0.9 + 0.22 * uy;
  const vl = Math.hypot(vx, vy);
  vx /= vl; vy /= vl;
  const rec = p.recoil;
  const tipx = sx + vx * (staffL + rec * 0.5), tipy = sy + vy * (staffL + rec * 0.5);
  const drawStaff = () => {
    tube(s, sx, sy, tipx, tipy, 2, C >= 3 ? RAMPS.brass : RAMPS.wood);
    s.px(sx, sy, 'bark');
    if (C >= 3) {
      // Kupferspirale
      for (let i = 1; i < staffL; i += 3) {
        const cx = sx + vx * i, cy = sy + vy * i;
        s.px(cx - 1, cy, 'orange'); s.px(cx + 1, cy - 1, 'amber');
      }
    }
    // Spitze
    const cr = A >= 4 ? 'heart' : B >= 4 && sp ? 'spear' : B >= 1 ? 'star' : C >= 3 ? 'bolt' : 'crystal';
    const kx = Math.round(tipx), ky = Math.round(tipy);
    if (cr === 'spear') {
      // grosser Eisspeer
      const bx = tipx, by = tipy;
      const nx = -vy, ny = vx;
      s.poly([[bx + nx * 2.4, by + ny * 2.4], [bx + vx * 9, by + vy * 9], [bx - nx * 2.4, by - ny * 2.4], [bx - vx * 1.5, by - vy * 1.5]], (x, y) => ((x - bx) * (-vy) + (y - by) * vx > 0 ? 'ice' : 'sky'));
      s.line(bx, by, bx + vx * 8, by + vy * 8, 'white');
      s.rect(Math.round(bx - nx * 3), Math.round(by - ny * 3), 1, 1, 'silver');
      s.line(bx + nx * 3, by + ny * 3, bx - nx * 3, by - ny * 3, 'silver');
    } else if (cr === 'heart') {
      // Eisherz im Kristallkäfig
      const hx = kx, hy = ky - 3;
      s.ball(hx, hy + 1, 4.2, 4, ['navy', 'sky', 'ice']);
      for (const [dx, dy] of [[-2, -1], [-1, -2], [1, -2], [2, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2], [0, 0]]) void 0;
      s.rect(hx - 2, hy - 1, 2, 2, 'ice'); s.rect(hx + 1, hy - 1, 2, 2, 'ice');
      s.rect(hx - 1, hy + 1, 3, 1, 'sky'); s.px(hx, hy + 2, 'sky');
      s.px(hx - 2, hy - 1, 'white');
      s.px(hx, hy - 4, 'ice'); s.px(hx - 3, hy - 3, 'white'); s.px(hx + 4, hy - 2, 'ice');
      if (ph % 2 === 0) s.px(hx, hy, 'white');
    } else if (cr === 'star') {
      // Kristallstern: achtzackig
      const hx = kx, hy = ky - 2;
      for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0]]) s.line(hx, hy, hx + dx * 0.75, hy + dy * 0.75, 'ice');
      for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) s.px(hx + dx, hy + dy, 'sky');
      s.ball(hx, hy, 2, 2, RAMPS.frost);
      s.px(hx, hy, 'white');
      if (B >= 1 && ph % 2) s.px(hx + 4, hy - 4, 'white');
    } else if (cr === 'bolt') {
      s.poly([[kx - 1, ky - 6], [kx + 2, ky - 6], [kx, ky - 3], [kx + 2, ky - 3], [kx - 2, ky + 1], [kx - 1, ky - 2], [kx - 2, ky - 2]], (x, y) => (x < kx ? 'yellow' : 'amber'));
      s.px(kx, ky - 5, 'white');
    } else {
      crystal(s, kx, ky - 3, 4, RAMPS.ice);
    }
    if (p.flash) {
      front.ball(kx, ky - 2, 5, 5, ['sky', 'ice', 'white']);
      for (const [dx, dy] of [[-7, 0], [7, 0], [0, -7], [0, 7]]) front.px(kx + dx, ky - 2 + dy, 'white');
    } else if (p.ai === 1) { spark(front, kx, ky - 6, 'white', true); }
    if (A >= 4) { /* Herz leuchtet */ }
    return [kx, ky];
  };
  let muzzle: [number, number] = [Math.round(tipx), Math.round(tipy - 2)];
  if (d.behind) muzzle = drawStaff() as [number, number];

  // ---- Robe ----
  const yT = G - 10 - up + float, yB = G - 1 + float;
  const hem = [0, 1, 1, 0][ph];
  s.rect(ox - 4, yB, 3, 1, 'bark'); s.rect(ox + 1, yB, 3, 1, 'bark');
  s.poly([[ox - 4, yT], [ox + 4, yT], [ox + 6, yB], [ox - 6, yB]], (x, y) => (x <= ox - 4 || (x < ox - 2 && y > yT + 3) ? robe[2] : x >= ox + 3 ? robe[0] : y <= yT ? robe[2] : robe[1]));
  for (let x = ox - 6; x <= ox + 5; x++) if ((x + hem) % 3 === 0) s.px(x, yB, robe[0]);
  s.rect(ox - 4, G - 5 + float, 9, 1, armor ? 'white' : 'sky');
  s.px(ox, G - 5 + float, 'yellow');
  if (B >= 2) {
    // Risse im Mantel
    s.line(ox - 3, yT + 3, ox - 1, yT + 5, 'white'); s.line(ox - 1, yT + 5, ox - 2, yT + 7, 'white'); s.line(ox + 2, yT + 4, ox + 3, yB - 1, 'ice'); s.px(ox + 1, yT + 6, 'ice');
  }
  if (armor) { s.rect(ox - 4, yT, 9, 2, 'white'); s.px(ox, yT + 3, 'white'); s.px(ox, yT + 4, 'ice'); }
  if (C >= 2) {
    // Blitz-Brosche
    s.poly([[ox - 1, yT + 3], [ox + 1, yT + 3], [ox, yT + 5], [ox + 1, yT + 5], [ox - 1, yT + 7], [ox, yT + 5], [ox - 1, yT + 5]], (x) => 'yellow');
  }
  // Schal
  s.rect(ox - 5, yT - 1, 11, 3, scarf[1]);
  s.rect(ox - 5, yT - 1, 11, 1, scarf[2]);
  s.rect(ox - 5, yT + 1, 11, 1, scarf[0]);
  const fl = [0, 1, 2, 1][ph];
  s.rect(ox - 6, yT + 1, 2, 5 + (fl >> 1), scarf[1]); s.px(ox - 6, yT + 5 + (fl >> 1), scarf[0]); s.px(ox - 5 - fl, yT + 6, scarf[1]);
  if (A >= 1) { s.px(ox - 4, yT + 3, 'white'); s.px(ox - 5, yT + 4, 'white'); }
  // Schulter-Zapfen (B3+)
  if (B >= 3) {
    for (const sg of [-1, 1]) {
      s.poly([[ox + sg * 5, yT], [ox + sg * 9, yT - 2], [ox + sg * 7, yT + 3]], (x) => (x * sg < (ox * sg + sg * 6) ? 'ice' : 'sky'));
      s.px(ox + sg * 7, yT - 1, 'white');
      s.poly([[ox + sg * 5, yT + 2], [ox + sg * 9, yT + 5], [ox + sg * 5, yT + 4]], 'sky');
    }
  }

  // ---- Kopf ----
  const hcx = ox, hcy = G - 15 - up + float;
  s.ball(hcx, hcy, 5.5, 5, RAMPS.skin);
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.4));
    const eye = (x: number) => { s.rect(x, fy - 1, 2, 2, C >= 2 ? 'yellow' : 'ink'); s.px(x, fy - 1, 'white'); if (C >= 2) s.px(x + 1, fy, 'amber'); };
    if (d.eyes === 2) { eye(fx - 2); eye(fx + 1); s.px(fx - 3, fy + 1, 'coral'); s.px(fx + 3, fy + 1, 'coral'); }
    else eye(fx);
  }
  // Hut: Krempe + hoher Kegel
  const hy = hcy - 4;
  const sway = [0, 0, 1, 1][ph];
  s.ellipse(hcx, hy, 8, 2.3, hat[0]);
  s.ellipseFn(hcx, hy - 0.5, 7.5, 2, (x, y, nx, ny) => (ny < 0 ? hat[1] : hat[0]));
  s.rect(hcx - 7, hy - 1, 15, 1, hat[2]);
  const ht = C >= 4 ? 10 : 13;
  s.poly([[hcx - 4, hy - 1], [hcx + 4, hy - 1], [hcx + 1 + sway, hy - ht], [hcx - 1 + sway, hy - ht]], (x, y) => (x < hcx - 1 ? hat[2] : x > hcx + 1 ? hat[0] : hat[1]));
  s.px(hcx + sway, hy - ht - 1, hat[1]);
  s.rect(hcx - 4, hy - 3, 9, 1, armor ? 'white' : C >= 4 ? 'yellow' : 'sky'); // Hutband
  if (C >= 4) {
    // Sturmhaube: Zacken am Rand
    for (const sg of [-1, 1]) { s.px(hcx + sg * 8, hy, 'yellow'); s.px(hcx + sg * 9, hy + 1, 'amber'); s.px(hcx + sg * 7, hy + 1, 'yellow'); }
  }
  if (C >= 5) {
    // Blitzkrone
    for (let i = -3; i <= 3; i++) {
      const hh = i % 2 === 0 ? 5 : 3;
      s.rect(hcx + i * 2, hy - 2 - hh, 1, hh, i % 2 ? 'amber' : 'yellow');
      s.px(hcx + i * 2, hy - 3 - hh, 'white');
    }
  }
  if (A >= 3) {
    // Eiskristall-Krone auf der Krempe
    for (const dx of [-6, -3, 0, 3, 6]) crystal(s, hcx + dx, hy - 2 - (dx === 0 ? 1 : 0), dx === 0 ? 3 : 2, RAMPS.frost, 1);
  }
  if (C >= 1 && p.ph % 2 === 0) { spark(front, hcx - 1 + sway, hy - ht - 2, 'yellow', false); spark(front, hcx + 4, hy - ht + 2, 'white'); }
  if (C >= 1 && p.ph % 2 === 1) spark(front, hcx - 3, hy - ht + 1, 'yellow');
  if (A >= 2) {
    // Schneeflocken kreisen um den Hut
    for (const [x, y, z] of orbit(hcx, hy - 3, 11, 3, 3, ph, 4)) flake(z < 0 ? back : front, x, y, 'white', false);
  }
  if (C >= 3) {
    // Blitze aus der Wolke
    if (ph % 2 === 0 || C >= 5) bolt(front, ox + 2 - ph, G - 26 - up, ox - 2 + ph * 3, G - 18 - up, 3 + ph, 'white', 'yellow');
    if (C >= 4 && ph !== 1) bolt(front, ox + 9, G - 30 - up, ox + 12 + ph, G - 22 - up, 11 + ph, 'white', 'yellow');
  }
  if (C >= 3 && p.ai === 1) bolt(front, ox - 8, G - 28 - up, ox - 12, G - 20 - up, 99, 'white', 'yellow');

  // ---- Arme + Stab vorn ----
  const handx = Math.round(sx + vx * 6), handy = Math.round(sy + vy * 6);
  drawArm(s, { sx: ox + 3, sy: yT + 2, hx: handx, hy: handy, sleeve: robe[1], skin: 'skin', roll: 1 });
  if (!d.behind) muzzle = drawStaff() as [number, number];
  s.px(handx, handy, 'skin');
  drawArm(s, { sx: ox - 3, sy: yT + 2, hx: ox - 5, hy: yT + 7, sleeve: robe[1], skin: 'skin', roll: 1 });

  // ---- Aura (Stufe 3+ A: Schnee, 5: Scherben) ----
  if (A >= 3) {
    for (let i = 0; i < 6; i++) {
      const k = (ph * 2 + i * 3) % 8;
      front.px(ox - 12 + i * 5 - (k >> 1), OY - 7 + k * 0.8 - 3, k % 3 === 0 ? 'white' : 'silver');
    }
  }
  if (A >= 5) {
    for (const [x, y, z] of orbit(ox, G - 12 - up, 14, 6, 6, ph, 4)) {
      const tgt = z < 0 ? back : front;
      crystal(tgt, x, y, 2, RAMPS.frost, 1);
    }
  }
  if (C >= 5) {
    // Dauerblitze am Rand + Wolke um den Sockel
    cloud(front, ox - 6, OY - 1, 9, true, ph + 1);
    cloud(front, ox + 6, OY, 10, true, ph);
  }
  return { fig: s, back, front, muzzle };
}
export { tube };
