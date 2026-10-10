/**
 * Heldin Sela Nightglass (Runde 16 TP): schlanke Seherin in nachtblauem Mantel mit Kapuze und langem Sternenlicht-Gewehr.
 * Sichtbare Stufen wie Wren: L1-4 Kapuze + Gewehr, L5-9 Monokel (Camo-Auge), L10-14 Sternenrune am Lauf, L15-19 Sternenmantel,
 * L20 Eclipse (dunkle Sonne als Halo, leuchtende Augen). Posen: idle, atk (zielen, Muendungsfeuer bei atk2), cast (Gewehr gen Himmel).
 */
import { drawArm } from './bows';
import { orbit, spark, tube } from './parts';
import { heroStage } from './hero-stage';
import type { Dir, Pose } from './pose';
import { GY, OX, TH, TW, type TowerLayers } from './ranger';
import { RAMPS, type Ramp, Surface } from './surface';

const CLOAK: Ramp = ['night', 'navy', 'navy'];
const STEEL: Ramp = RAMPS.steel;

/** Stern: kleines Plus, `big` mit weissem Kern. */
function star(s: Surface, x: number, y: number, big = false, c: 'yellow' | 'white' | 'ice' = 'yellow'): void {
  s.px(x, y, big ? 'white' : c);
  if (big) { s.px(x - 1, y, c); s.px(x + 1, y, c); s.px(x, y - 1, c); s.px(x, y + 1, c); }
}

export function drawSela(level: number, d: Dir, p: Pose, cast: number): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const stage = heroStage(level);
  const ph = p.ph;
  const grow = [0, 0, 1, 2, 4][stage], wg = [0, 0, 0, 1, 1][stage];
  const up = p.up + grow;
  const G = GY, ox = OX;
  const eclipse = stage >= 4;
  const yT = G - 10 - up, yB = G - 1;
  const hcx = ox, hcy = G - 15 - up;

  // ---- Hinten: Halo (L20), Mantel ----
  if (eclipse) {
    const cx = hcx, cy = hcy - 2;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + ph * 0.05;
      const r1 = 11, r2 = i % 2 ? 15 : 13 + (ph & 1);
      back.line(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, i % 2 ? 'amber' : 'yellow');
    }
    back.ellipse(cx, cy, 11, 11, 'amber'); back.ellipse(cx, cy, 10, 10, 'yellow'); back.ellipse(cx, cy, 9, 9, 'ink');
    back.ring(cx, cy, 9.6, 9.6, 'white');
  }
  if (stage >= 0) {
    const wob = [0, 1, 1, 0][ph];
    const len = stage >= 3 ? 4 : stage >= 1 ? 2 : 0;
    const w = 4 + wg;
    back.poly([[ox - w, yT - 1], [ox + w, yT - 1], [ox + w + 3, G - 2], [ox + w + 1, G + len], [ox - w + 2, G + len + 1 - wob], [ox - w - 5 - wob, G + len - 1], [ox - w - 4 - wob, G - 7], [ox - w - 1, yT]], (x, y) => (x > ox + w - 1 || y > G - 1 ? CLOAK[0] : x < ox - w - 1 ? CLOAK[2] : CLOAK[1]));
    back.line(ox - w - 1, yT, ox - w - 4 - wob, G + len - 2, stage >= 3 ? 'yellow' : 'sky');
    if (stage >= 3) { for (let x = ox - w - 4 - wob; x <= ox + w + 2; x += 3) back.px(x, G + len + (x & 1), 'yellow'); }
    const sp: [number, number][] = stage >= 3 ? [[-6, 2], [-4, 8], [0, 12], [4, 6], [6, 11], [-2, 5], [2, 1], [5, 3]] : stage >= 2 ? [[-4, 6], [3, 9], [-5, 10]] : [[-4, 7]];
    sp.forEach(([dx, dy], i) => star(back, ox + dx - (dx < -5 ? 1 : 0), yT + dy, false, (i + ph) % 4 === 0 ? 'white' : 'yellow'));
  }

  // ---- Gewehr: Haltung je Pose ----
  const gx = ox + 6, gy = yT + 6;
  let vx = 0.5, vy = -0.85;
  if (p.atk) {
    if (p.ai === 0) { vx = 0.8 * d.ux; vy = -0.45 + 0.3 * d.uy; }
    else if (p.ai === 1) { vx = 0.97 * d.ux; vy = -0.12 + 0.4 * d.uy; }
    else if (p.ai === 2) { vx = 0.97 * d.ux; vy = -0.12 + 0.4 * d.uy; }
    else { vx = 0.75 * d.ux; vy = -0.5 + 0.2 * d.uy; }
  }
  if (cast >= 0) { vx = 0.08 * (cast ? 1 : 0); vy = -1; }
  const vl = Math.hypot(vx, vy); vx /= vl; vy /= vl;
  const L = stage >= 3 ? 27 : 25;
  const rec = p.recoil * 0.6;
  const lift = cast >= 0 ? -4 - cast * 2 : 0;
  const bx0 = gx - vx * 5 - vx * rec, by0 = gy - vy * 5 + lift - vy * rec;      // Schaftende
  const tx = gx + vx * (L - 7) - vx * rec, ty = gy + vy * (L - 7) + lift - vy * rec; // Muendung
  let muzzle: [number, number] = [tx, ty];
  const nx = -vy, ny = vx;
  const rifle = (): void => {
    // Schaft + Gehaeuse (Holz), Lauf (Stahl), Zielfernrohr
    tube(s, bx0, by0, gx + vx * 4, gy + vy * 4 + lift - vy * rec, 3, RAMPS.darkWood);
    tube(s, gx + vx * 3 - vx * rec, gy + vy * 3 + lift - vy * rec, tx, ty, 2, STEEL);
    s.px(tx + vx, ty + vy, 'silver');
    // Zielfernrohr oben auf dem Gehaeuse
    const sgn = ny < 0 || (ny === 0 && nx < 0) ? 1 : -1; // Normale nach oben
    const ox2 = nx * sgn * 2.4, oy2 = ny * sgn * 2.4;
    tube(s, gx + vx * 1 + ox2 - vx * rec, gy + vy * 1 + oy2 + lift - vy * rec, gx + vx * 9 + ox2 - vx * rec, gy + vy * 9 + oy2 + lift - vy * rec, 2, RAMPS.iron);
    s.px(gx + vx * 9 + ox2 - vx * rec, gy + vy * 9 + oy2 + lift - vy * rec, 'sky');
    s.px(gx + vx * 5 + ox2 - vx * rec, gy + vy * 5 + oy2 + lift - vy * rec, 'stone');
    // L10: Sternenrune am Lauf (Goldbaender + leuchtende Rune)
    if (stage >= 2) {
      for (const k of [14, 18, 22]) {
        const rx = gx + vx * (k - 7) - vx * rec, ry = gy + vy * (k - 7) + lift - vy * rec;
        s.px(rx, ry, 'yellow'); s.px(rx + nx, ry + ny, 'amber'); s.px(rx - nx, ry - ny, 'amber');
      }
      const mx = gx + vx * 11 - vx * rec, my = gy + vy * 11 + lift - vy * rec;
      front.px(mx + nx * 2, my + ny * 2, ph % 2 ? 'white' : 'yellow'); front.px(mx - nx * 2, my - ny * 2, ph % 2 ? 'yellow' : 'white');
      star(front, mx + nx * 3.5, my + ny * 3.5, ph % 2 === 0, 'yellow');
    }
    if (eclipse) { s.px(tx, ty, 'white'); s.px(tx - vx, ty - vy, 'yellow'); }
    // Muendungsfeuer / Sternenblitz
    if (p.flash) {
      front.ball(Math.round(tx + vx * 3), Math.round(ty + vy * 3), 4, 4, ['yellow', 'white', 'white']);
      for (let i = 0; i < 4; i++) star(front, tx + vx * (6 + i * 2) + nx * ((i % 2) * 2 - 1), ty + vy * (6 + i * 2) + ny * ((i % 2) * 2 - 1), i === 0, 'ice');
    }
    if (cast >= 0) {
      const cy = ty - 4, cxx = tx;
      front.ball(Math.round(cxx), Math.round(cy), cast ? 5 : 3, cast ? 5 : 3, ['ice', 'white', 'white']);
      front.ring(cxx, cy, cast ? 8 : 6, cast ? 8 : 6, 'ice');
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + cast * 0.4; star(front, cxx + Math.cos(a) * (cast ? 12 : 9), cy + Math.sin(a) * (cast ? 12 : 9), i % 4 === 0, i % 2 ? 'yellow' : 'white'); }
      for (let k = 1; k <= 4; k++) front.px(cxx + ((k * 5 + ph) % 3) - 1, cy - 9 - k * 2, k % 2 ? 'white' : 'ice'); // Strahl nach oben
    }
    muzzle = [tx + vx * 2, ty + vy * 2];
  };
  if (d.behind) rifle();

  // ---- Beine, Robe ----
  s.rect(ox - 3, G - 1, 3, 2, 'night'); s.rect(ox + 1, G - 1, 3, 2, 'night');
  s.px(ox - 3, G - 1, 'dusk'); s.px(ox + 1, G - 1, 'dusk');
  const tw = 3 + wg;
  s.poly([[ox - tw, yT], [ox + tw, yT], [ox + tw + 2, yB], [ox - tw - 2, yB]], (x) => (x <= ox - tw ? CLOAK[2] : x >= ox + tw - 1 ? CLOAK[0] : CLOAK[1]));
  s.rect(ox - tw - 2, yB, tw * 2 + 5, 1, CLOAK[0]);
  s.rect(ox - tw, yT + 1, tw * 2, 1, 'sky'); // Kragen
  // Guertel + Sternspange
  s.rect(ox - tw - 1, G - 5, tw * 2 + 3, 1, 'bark'); star(s, ox, G - 5, false, 'yellow');
  star(s, ox - 2, G - 3, false, 'yellow'); if (stage >= 3) { star(s, ox + 2, G - 7, false, 'white'); star(s, ox - 2, G - 8, false, 'yellow'); }
  if (stage >= 3) {
    // Schulterumhang mit goldener Sternspange
    s.rect(ox - tw - 1, yT, tw * 2 + 3, 3, CLOAK[1]); s.rect(ox - tw - 1, yT, tw * 2 + 3, 1, CLOAK[2]);
    for (let x = ox - tw - 1; x <= ox + tw + 1; x += 2) s.px(x, yT + 3, CLOAK[0]);
    s.px(ox, yT + 2, 'yellow'); s.px(ox - 1, yT + 1, 'amber'); s.px(ox + 1, yT + 1, 'amber');
  }

  // ---- Kopf: Kapuze mit Gesicht ----
  s.ball(hcx, hcy - 1, 6, 6, CLOAK);
  // Kapuzenspitze nach hinten
  s.poly([[hcx - 3, hcy - 6], [hcx - 8, hcy - 9 + (ph & 1)], [hcx - 7, hcy - 2]], CLOAK[1]);
  s.px(hcx - 8, hcy - 9 + (ph & 1), 'sky');
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.4));
    // Gesicht: heller Ausschnitt in der Kapuze
    s.ellipseFn(fx, fy + 0.5, d.eyes === 1 ? 2.4 : 3.6, 3.4, (x, y, nx2, ny2) => ((-nx2 * 0.5 - ny2 * 0.6) > 0.35 ? 'peach' : (ny2 > 0.5 ? 'tan' : 'skin')));
    const eyeC = eclipse ? 'white' : 'yellow';
    const eye = (x: number): void => { s.rect(x, fy, 2, 1, eclipse ? 'white' : 'ink'); s.px(x, fy, eyeC); if (eclipse) { s.px(x - 1, fy, 'yellow'); s.px(x + 2, fy, 'yellow'); s.px(x, fy - 1, 'amber'); } };
    if (d.eyes === 2) { eye(fx - 2); eye(fx + 1); s.px(fx, fy + 2, 'coral'); }
    else eye(fx);
    // L5: Monokel am hinteren Auge, Kette
    if (stage >= 1) {
      const mxp = d.eyes === 2 ? fx + 1.5 : fx + 0.5;
      s.ring(mxp, fy, 1.8, 1.8, 'silver');
      s.px(mxp + 1, fy - 1, 'white'); s.px(mxp, fy, ph % 2 ? 'ice' : 'sky');
      s.line(mxp + 2, fy + 1, mxp + 2, fy + 3, 'amber');
    }
    // Stirnband mit Stern
    s.rect(hcx - 5, hcy - 3, 11, 1, CLOAK[0]);
    if (stage >= 3) star(s, hcx + (d.eyes === 1 ? 2 : 0), hcy - 4, true, 'yellow');
    else star(s, hcx + (d.eyes === 1 ? 2 : 0), hcy - 4, false, 'yellow');
  } else if (stage >= 3) star(s, hcx, hcy - 4, true, 'yellow');

  // ---- Arme (Gewehr in beiden Haenden) ----
  const sh1x = ox + tw, sh2x = ox - tw + 1;
  const hand1: [number, number] = [Math.round(gx + vx * 1 - vx * rec), Math.round(gy + vy * 1 + lift - vy * rec)];
  const hand2: [number, number] = [Math.round(gx + vx * 9 - vx * rec), Math.round(gy + vy * 9 + lift - vy * rec)];
  drawArm(s, { sx: sh1x, sy: yT + 2, hx: hand1[0], hy: hand1[1], sleeve: 'navy', skin: 'skin', roll: 0.9 });
  drawArm(s, { sx: sh2x, sy: yT + 2, hx: cast >= 0 ? hand2[0] - 2 : hand2[0], hy: hand2[1], sleeve: 'navy', skin: 'skin', roll: 0.9 });
  if (!d.behind) rifle();
  if (!d.behind) { s.px(hand1[0], hand1[1], 'peach'); }

  // ---- Aura: Sterne (L15), Eclipse-Funken (L20) ----
  if (stage >= 3) {
    for (const [x, y, z] of orbit(ox, G - 12 - up, 14, 6, stage >= 4 ? 5 : 3, ph, 4)) star(z < 0 ? back : front, x, y, ph % 2 === (x & 1), 'yellow');
  }
  if (eclipse) {
    for (let i = 0; i < 5; i++) spark(front, ox - 12 + i * 6, G - 30 + ((ph * 3 + i * 5) % 10), i % 2 ? 'white' : 'yellow');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + ph * 0.1; back.pxUnder(ox + Math.cos(a) * 15, G - 1 + Math.sin(a) * 4, (i + ph) % 2 ? 'ice' : 'sky'); }
  }
  void TH;
  return { fig: s, back, front, muzzle };
}
