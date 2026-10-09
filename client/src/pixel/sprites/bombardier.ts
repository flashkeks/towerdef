/** Bombardier: stämmiger Lanternfolk mit Fliegerbrille und Messingkanone. 15 Stufen sichtbar. */
import { bolt, flame, orbit, pedestal, spark, tube } from './parts';
import { drawArm } from './bows';
import type { Dir, Pose } from './pose';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';
import { GY, mainPath, OX, OY, pedestalKind, type TowerLayers } from './ranger';

export function drawBombardier(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = 55, H = 56;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C);
  const main = mainPath(t);
  const up = p.up, G = GY, ox = OX, ph = p.ph;
  const vest: Ramp = RAMPS.orange;
  pedestal(s, ox, OY, pedestalKind(top, 'bombardier', t), ph, top >= 5 ? 11 : top >= 3 ? 10 : 10);
  if (C >= 5) {
    // Bodenrisse am Sockel
    s.line(ox - 8, OY - 4, ox - 4, OY - 3, 'ink'); s.line(ox - 4, OY - 3, ox - 3, OY - 5, 'ink');
    s.line(ox + 4, OY - 4, ox + 8, OY - 2, 'ink'); s.line(ox + 6, OY - 3, ox + 8, OY - 5, 'ink');
    s.px(ox - 5, OY - 3, 'orange'); s.px(ox + 6, OY - 3, 'orange');
  }

  // ---- Rücken: Raketenpack (B5), Granaten-Gestell (C3+) ----
  if (B >= 5) {
    for (const dx of [-6, -3]) {
      const rx = ox + dx;
      back.rect(rx - 1, G - 20 - up, 3, 11, 'stone'); back.rect(rx - 1, G - 20 - up, 1, 11, 'silver'); back.rect(rx + 1, G - 20 - up, 1, 11, 'slate');
      back.rect(rx - 1, G - 22 - up, 3, 2, 'red'); back.px(rx, G - 23 - up, 'red');
      back.rect(rx - 1, G - 10 - up, 3, 1, 'dusk');
      flame(back, rx, G - 9 - up + 1 + 4, 4 + (ph & 1), ph, 'orange', 'amber', 'yellow');
    }
    back.rect(ox - 7, G - 14 - up, 7, 2, 'bark');
  }
  if (C >= 3) {
    for (let i = 0; i < 3; i++) {
      const x = ox - 7 - (B >= 5 ? 3 : 0) + i * 3 - (i === 1 ? 0 : 0);
      if (B >= 5) continue;
      back.rect(x, G - 17 - up, 2, 8, 'silver'); back.rect(x, G - 17 - up, 1, 8, 'white');
      back.rect(x, G - 14 - up, 2, 1, 'sky'); back.rect(x, G - 12 - up, 2, 1, 'sky');
      back.rect(x, G - 18 - up, 2, 1, 'stone');
    }
    if (B < 5) back.rect(ox - 8, G - 9 - up, 9, 1, 'bark');
  }

  const sx = ox + 4, sy = G - 9 - up;
  let muzzle: [number, number] = [ox + 8, G - 9];
  const weapon = () => drawBombWeapon(s, front, t, d, p, sx, sy, main);
  if (d.behind) muzzle = weapon();

  // ---- Körper ----
  s.rect(ox - 5, G - 1, 4, 2, 'bark'); s.rect(ox + 1, G - 1, 4, 2, 'bark');
  s.px(ox - 5, G - 1, 'wood'); s.px(ox + 1, G - 1, 'wood');
  const yT = G - 10 - up, yB = G - 1;
  s.poly([[ox - 5, yT], [ox + 5, yT], [ox + 6, yB], [ox - 6, yB]], (x, y) => (x <= ox - 5 ? vest[2] : x >= ox + 4 ? vest[0] : y <= yT ? vest[2] : vest[1]));
  s.rect(ox - 5, G - 5, 11, 2, 'bark');
  s.rect(ox - 5, G - 5, 11, 1, 'wood');
  s.rect(ox - 1, G - 5, 3, 2, 'amber'); s.px(ox, G - 4, 'yellow');
  // Taschen
  s.rect(ox + 3, G - 8, 2, 2, 'bark');
  if (B >= 3) {
    // Patronengurt schräg über der Brust
    for (let i = 0; i < 9; i++) {
      const x = ox - 4 + i, y = yT + 1 + Math.round(i * 0.75);
      s.px(x, y, 'bark');
      if (i % 2 === 0) { s.px(x, y - 1, 'amber'); s.px(x, y, 'amber'); }
    }
  }
  if (C >= 1) {
    // Fernglas am Gürtel
    s.rect(ox - 5, G - 3, 2, 3, 'night'); s.rect(ox - 3, G - 3, 2, 3, 'night');
    s.px(ox - 5, G - 3, 'stone'); s.px(ox - 3, G - 3, 'stone'); s.px(ox - 5, G, 'ice'); s.px(ox - 3, G, 'ice');
  }
  // Schulterpolster für A4+
  if (A >= 4) { s.ball(sx - 1, sy, 3, 2, RAMPS.iron); s.px(sx - 2, sy - 1, 'silver'); }

  // ---- Kopf ----
  const hcx = ox, hcy = G - 15 - up;
  const mask = A >= 5;
  s.ball(hcx, hcy, 6, 5.5, RAMPS.skin);
  // Lederkappe oben
  const capR: Ramp = B >= 5 ? RAMPS.brass : A >= 3 ? RAMPS.iron : RAMPS.wood;
  s.ellipseFn(hcx, hcy - 1, 6.2, 5.7, (x, y, nx, ny) => (y < hcy - 2 ? ((-nx * 0.5 - ny * 0.7) > 0.4 ? capR[2] : (-nx * 0.5 - ny * 0.7) > -0.2 ? capR[1] : capR[0]) : null));
  s.rect(hcx - 6, hcy - 2, 13, 1, capR[0]);
  // Ohrenklappen
  s.rect(hcx - 6, hcy - 1, 2, 4, capR[1]); s.px(hcx - 6, hcy - 1, capR[2]);
  s.rect(hcx + 5, hcy - 1, 2, 3, capR[0]);
  if (A >= 3) { s.rect(hcx - 1, hcy - 8, 3, 2, 'stone'); s.px(hcx, hcy - 9, 'silver'); s.rect(hcx - 5, hcy - 3, 11, 1, 'silver'); } // Helmkamm
  if (B >= 5) { s.rect(hcx - 6, hcy - 3, 13, 1, 'amber'); s.px(hcx - 7, hcy + 3, 'red'); s.px(hcx - 8, hcy + 4, 'red'); s.px(hcx - 8, hcy + 5, 'crimson'); } // Piloten-Schal
  // Gesicht
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 2 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.4));
    if (d.eyes === 2) {
      if (mask) {
        s.rect(fx - 4, fy - 2, 9, 5, 'night'); s.rect(fx - 4, fy - 2, 9, 1, 'dusk');
        s.rect(fx - 3, fy - 1, 3, 2, ph % 2 ? 'orange' : 'amber'); s.rect(fx + 1, fy - 1, 3, 2, ph % 2 ? 'orange' : 'amber');
        s.px(fx - 3, fy - 1, 'yellow'); s.px(fx + 1, fy - 1, 'yellow');
      } else {
        // Brille: zwei Messingringe mit Eisglas
        for (const gx of [fx - 3, fx + 1]) {
          s.rect(gx - 1, fy - 2, 4, 4, 'rust');
          s.rect(gx, fy - 1, 2, 2, 'ice'); s.px(gx, fy - 1, 'white');
          s.px(gx - 1, fy - 2, 'amber'); s.px(gx + 2, fy - 2, 'amber');
        }
        s.rect(fx - 1, fy - 1, 2, 1, 'rust');
        s.rect(fx - 4, fy - 2, 1, 2, 'bark'); // Riemen
        // Schnurrbart
        s.rect(fx - 2, fy + 2, 5, 1, 'plum'); s.px(fx - 3, fy + 3, 'plum'); s.px(fx + 3, fy + 3, 'plum');
        s.px(fx - 4, fy + 1, 'coral'); s.px(fx + 4, fy + 1, 'coral');
      }
    } else {
      s.rect(fx - 1, fy - 2, 4, 4, 'rust'); s.rect(fx, fy - 1, 2, 2, 'ice'); s.px(fx, fy - 1, 'white');
    }
  }
  if (!d.behind) muzzle = weapon();

  // ---- Aura / Effekte ----
  if (A >= 4) {
    // Rauchschwaden
    for (let i = 0; i < 3; i++) {
      const k = (ph + i * 3) % 6;
      const x = ox + 7 + i * 2, y = G - 26 - k * 1.2;
      front.ball(x, y, 1.5 + k * 0.25, 1.4 + k * 0.2, k > 3 ? RAMPS.stone : RAMPS.steel);
    }
  }
  if (C >= 4) {
    for (let i = 0; i < 3; i++) if ((ph + i) % 3 === 0) bolt(front, ox + 4 + i * 3, G - 14 - i, ox + 10 + i * 4, G - 16 - i * 2, ph * 7 + i, 'white', 'ice');
  }
  if (C >= 5) {
    for (const [x, y] of orbit(ox, OY - 4, 12, 4, 4, ph, 4)) front.px(x, y, ph % 2 ? 'amber' : 'orange');
    for (let i = 0; i < 5; i++) front.px(ox - 12 + i * 6, OY - 5 - ((ph + i) % 3), 'stone');
  }
  return { fig: s, back, front, muzzle };
}

function drawBombWeapon(s: Surface, front: Surface, t: Tiers, d: Dir, p: Pose, sx: number, sy: number, main: number): [number, number] {
  const [A, B, C] = t;
  const ux = d.ux, uy = d.uy;
  const ax = ux * 0.95, ay = uy * 0.8;
  const px = -ay, py = ax; // Quer
  const pl = Math.hypot(px, py) || 1;
  const nx = px / pl, ny = py / pl;
  const keg = main === 0 && A >= 5;
  const mortar = main === 0 && A === 4;
  const hammer = main === 2 && C >= 5;
  const drum = main === 1 && B >= 4;
  const sleeve = 'orange' as const;
  const rec = p.recoil;

  if (mortar) {
    // Mörser auf Lafette neben der Figur: schiebt Bomben steil nach oben
    const bx = sx + 6, by = OY - 6;
    for (const wx of [bx - 5, bx + 4]) { s.ball(wx, by + 2, 3.3, 3.3, RAMPS.darkWood); s.px(wx, by + 2, 'amber'); s.ring(wx, by + 2, 2.5, 2.5, 'bark'); }
    s.box(bx - 4, by - 1, 9, 3, RAMPS.wood);
    tube(s, bx - 1, by - 1, bx + 3 + rec * 0.5 * -0.5, by - 14, 6, RAMPS.iron, 8);
    s.rect(bx + 2, by - 15, 5, 2, 'slate'); s.rect(bx + 2, by - 15, 5, 1, 'silver');
    s.rect(bx + 3, by - 16, 3, 1, 'night');
    s.px(bx + 4, by - 8, 'amber'); s.px(bx + 3, by - 5, 'amber');
    drawArm(s, { sx: sx - 1, sy, hx: bx - 2, hy: by - 3, sleeve, skin: 'skin', roll: 1 });
    drawArm(s, { sx: sx - 7, sy, hx: bx - 4, hy: by - 1, sleeve, skin: 'skin', roll: 1 });
    if (p.flash) { spark(front, bx + 4, by - 19, 'yellow', true); front.ball(bx + 4, by - 21, 3, 2, RAMPS.stone); }
    return [bx + 4, by - 18];
  }

  let L = 9 + (B >= 2 ? 3 : 0), w = 4 + (A >= 2 ? 1 : 0);
  let ramp: Ramp = RAMPS.brass;
  if (keg) { L = 12; w = 8; ramp = RAMPS.wood; }
  if (hammer) { L = 12; w = 6; ramp = RAMPS.iron; }
  if (C >= 4 && main === 2) ramp = RAMPS.brass;
  if (drum) { L = 11; w = 3; ramp = RAMPS.iron; }
  if (main === 0 && A === 3) { w = 5; }
  const x0 = sx + ax * 0 - ax * rec * 0.6 - (keg ? ax * 1 : 0), y0 = sy + ay * 0 - ay * rec * 0.5 - 1;
  const x1 = x0 + ax * L, y1 = y0 + ay * L;
  const aimN = (k: number): [number, number] => [x0 + ax * k, y0 + ay * k];

  const arms = () => {
    const [mx, my] = aimN(L * 0.5);
    drawArm(s, { sx: sx - 1, sy, hx: Math.round(mx - ax * 0), hy: Math.round(my + 1), sleeve, skin: 'skin', roll: 1 });
    const [rx, ry] = aimN(2);
    drawArm(s, { sx: sx - 6, sy: sy + 1, hx: Math.round(rx), hy: Math.round(ry + 2), sleeve, skin: 'skin', roll: 1 });
  };
  if (!d.behind) arms();

  // zweites Rohr (B3)
  if (B >= 3 && !drum) {
    const ox2 = nx * 3.2 * (Math.abs(nx) < 0.2 ? 1 : 1), oy2 = ny * 3.2;
    tube(s, x0 + ox2, y0 + oy2, x1 + ox2 - ax * 1.5, y1 + oy2 - ay * 1.5, w - 1, RAMPS.iron);
    s.px(x1 + ox2 - ax * 1.5, y1 + oy2 - ay * 1.5, 'silver');
  }
  if (keg) {
    // Fass: dicker Körper, Eisenreifen, Mündung
    tube(s, x0, y0, x1, y1, w, RAMPS.wood, w - 2);
    for (const f of [0.25, 0.6]) {
      const cx = x0 + (x1 - x0) * f, cy = y0 + (y1 - y0) * f;
      tube(s, cx - nx * w * 0.5, cy - ny * w * 0.5, cx + nx * w * 0.5, cy + ny * w * 0.5, 1.2, RAMPS.iron);
    }
    s.ball(x1, y1, 3.2, 3.2, RAMPS.iron); s.ball(x1 + ax, y1 + ay, 2, 2, ['ink', 'ink', 'night']);
    s.ball(x0, y0, 3.5, 3.5, RAMPS.wood);
    // Totenkopf-Fähnchen
    const fx = x0 + ax * 4, fy = y0 + ay * 4 - w / 2 - 1;
    s.line(fx, fy, fx, fy - 8, 'bark');
    const fl = [0, 1, 0, -1][p.ph];
    s.rect(fx + 1, fy - 8, 6, 4, 'ink'); s.rect(fx + 1 + (fl > 0 ? 1 : 0), fy - 8, 5, 4, 'ink');
    s.px(fx + 3, fy - 7, 'white'); s.px(fx + 5, fy - 7, 'white'); s.px(fx + 4, fy - 6, 'white'); s.px(fx + 3, fy - 5, 'white'); s.px(fx + 5, fy - 5, 'white');
  } else if (hammer) {
    tube(s, x0, y0, x1, y1, w, RAMPS.iron);
    // Hammerkopf quer vor dem Rohr
    const hx = x1 + ax * 1.5, hy = y1 + ay * 1.5;
    tube(s, hx - nx * 5.5, hy - ny * 5.5, hx + nx * 5.5, hy + ny * 5.5, 7, RAMPS.stone);
    s.px(hx, hy, 'white'); s.px(hx - nx * 3, hy - ny * 3, 'silver');
    // Kupferbänder
    for (const f of [0.3, 0.55]) { const cx = x0 + (x1 - x0) * f, cy = y0 + (y1 - y0) * f; tube(s, cx - nx * w * 0.55, cy - ny * w * 0.55, cx + nx * w * 0.55, cy + ny * w * 0.55, 1.2, RAMPS.brass); }
  } else if (drum) {
    tube(s, x0, y0, x0 + ax * 6, y0 + ay * 6, 3, RAMPS.iron);
    const cx = x0 + ax * 8, cy = y0 + ay * 8;
    s.ball(cx, cy, 5, 5, RAMPS.steel);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + (p.ai >= 0 ? p.ai * 0.4 : ph(p) * 0.2);
      const px2 = cx + Math.cos(a) * 3, py2 = cy + Math.sin(a) * 3;
      s.rect(px2 - 1, py2 - 1, 2, 2, i === 0 ? 'amber' : 'ink');
    }
    s.px(cx, cy, 'silver');
  } else {
    tube(s, x0, y0, x1, y1, w, ramp);
    // Messingringe an Mündung und Mitte
    for (const f of [0.15, 0.55, 0.95]) {
      const cx = x0 + (x1 - x0) * f, cy = y0 + (y1 - y0) * f;
      const bw = w + 1;
      tube(s, cx - nx * bw * 0.5, cy - ny * bw * 0.5, cx + nx * bw * 0.5, cy + ny * bw * 0.5, 1.3, f > 0.9 ? RAMPS.brass : RAMPS.iron);
    }
    s.ball(x0 - ax * 0.5, y0 - ay * 0.5, w * 0.55, w * 0.55, RAMPS.brass);
    // Mündungsloch
    s.px(x1 + ax * 0.8, y1 + ay * 0.8, 'ink');
    if (main === 0 && A === 3) {
      // Bohrspitze: Kegel mit Spiralstreifen
      const bx = x1 + ax, by = y1 + ay;
      const tipx = bx + ax * 5, tipy = by + ay * 5;
      s.poly([[bx + nx * 3, by + ny * 3], [tipx, tipy], [bx - nx * 3, by - ny * 3]], (x, y) => (((x + y + ph(p)) % 3 === 0) ? 'white' : 'silver'));
      s.px(tipx, tipy, 'white');
    }
  }
  if (d.behind) arms();
  // Zubehör am Rohr
  if (A >= 1 && !keg && !mortar && !(main === 0 && A === 3)) {
    // dicke Bombe in der Mündung
    const bx = x1 + ax * 1.5, by = y1 + ay * 1.5;
    if (!p.flash) { s.ball(bx, by, 3, 3, ['ink', 'night', 'dusk']); s.px(bx - 1, by - 1, 'stone'); }
  }
  if (C >= 2 && main !== 2 || (main === 2 && C >= 2 && C < 5)) {
    // Glocke am Rohr
    const gx = x0 + ax * L * 0.45 + 0, gy = y0 + ay * L * 0.45 + w / 2 + 2;
    s.poly([[gx - 2, gy - 1], [gx + 2, gy - 1], [gx + 3, gy + 2], [gx - 3, gy + 2]], (x) => (x < gx ? 'yellow' : 'amber'));
    s.px(gx, gy + 3, 'rust');
  }
  if (C >= 3 && main === 2 && C < 5) {
    // Rack-Granate mit blauen Streifen am Rohr
    const gx = x0 + ax * L * 0.7, gy = y0 + ay * L * 0.7 - w / 2 - 2;
    s.rect(gx - 1, gy - 2, 3, 4, 'silver'); s.rect(gx - 1, gy - 1, 3, 1, 'sky'); s.rect(gx - 1, gy + 1, 3, 1, 'sky'); s.px(gx, gy - 3, 'stone');
  }
  if (C >= 4 && main === 2) {
    // Kupferspulen
    for (const f of [0.2, 0.4, 0.6, 0.8]) {
      const cx = x0 + (x1 - x0) * f, cy = y0 + (y1 - y0) * f;
      tube(s, cx - nx * (w * 0.5 + 1), cy - ny * (w * 0.5 + 1), cx + nx * (w * 0.5 + 1), cy + ny * (w * 0.5 + 1), 1, ['rust', 'clay', 'amber']);
    }
    if (p.ph % 2 === 0) { spark(front, x0 + ax * L * 0.5, y0 + ay * L * 0.5 - w, 'ice', true); }
  }
  // Lunte am Heck
  if (B >= 1 || main === 1) {
    const lx = x0 - ax * 1, ly = y0 - ay * 1 - w * 0.4;
    s.line(lx, ly, lx - 2, ly - 3, 'tan');
    const fl = ph(p);
    front.px(lx - 2, ly - 4, fl % 2 ? 'yellow' : 'orange');
    front.px(lx - 3 + (fl > 1 ? 1 : 0), ly - 5, fl % 2 ? 'orange' : 'amber');
    if (fl === 2) front.px(lx - 2, ly - 6, 'white');
  }
  // Mündungsfeuer + Rauch
  const mxp = x1 + ax * (keg ? 5 : drum ? 7 : hammer ? 8 : 4), myp = y1 + ay * (keg ? 5 : drum ? 7 : hammer ? 8 : 4);
  if (p.flash) {
    const r = keg ? 5 : 4;
    front.ball(mxp, myp, r, r, ['orange', 'amber', 'yellow']);
    spark(front, mxp + ax * 3, myp + ay * 3, 'white', true);
    front.ball(mxp + ax * 5 - 1, myp + ay * 5 - 3, 2.5, 2, RAMPS.stone);
  } else if (p.ai === 3) {
    front.ball(mxp + ax * 2, myp + ay * 2 - 3, 2, 2, RAMPS.stone);
    front.px(mxp + ax * 4, myp + ay * 4 - 5, 'silver');
  }
  return [Math.round(mxp), Math.round(myp)];
}
function ph(p: Pose): number { return p.ph; }
