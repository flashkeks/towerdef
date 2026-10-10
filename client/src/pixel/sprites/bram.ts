/**
 * Held Bram Ironwright (Runde 16 TP): staemmiger Schmied mit Bart, Lederschuerze und grossem Hammer.
 * Sichtbare Stufen wie Wren: L1-4 Schuerze + Hammer, L5-9 Lederhandschuhe + Funken, L10-14 Amboss auf dem Ruecken + zweiter Hammer,
 * L15-19 Ruestung mit Gluehnaehten + Helm, L20 Forge of Dawn (gluehender Hammer, Flammenmantel).
 * Posen: idle, atk (Hammer holt aus und fliegt bei atk2 weg), cast (Hammer hoch ueber den Kopf, beide Arme).
 */
import { drawArm } from './bows';
import { flame, orbit, spark, tube } from './parts';
import { heroStage } from './hero-stage';
import type { Dir, Pose } from './pose';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { RAMPS, type Ramp, Surface } from './surface';

const SHIRT: Ramp = RAMPS.cloth;
const APRON: Ramp = RAMPS.wood;
const BEARD: Ramp = ['crimson', 'rust', 'clay'];
const STEEL: Ramp = RAMPS.steel;

/** Hammer: Stiel von (x, y) in Richtung (vx, vy), Kopf quer am Ende. Gibt die Kopfmitte zurueck. */
function hammer(s: Surface, front: Surface, x: number, y: number, vx: number, vy: number, len: number, o: { head: boolean; big: boolean; hot: boolean; ph: number; glow?: boolean }): [number, number] {
  const tx = x + vx * len, ty = y + vy * len;
  tube(s, x, y, tx, ty, 2, o.hot ? RAMPS.darkWood : RAMPS.wood);
  // Kopf: quer zum Stiel
  const nx = -vy, ny = vx;
  const hw = o.big ? 5 : 4, th = o.big ? 5 : 4;
  const cx = tx + vx * 1, cy = ty + vy * 1;
  if (o.head) {
    const ramp: Ramp = o.hot ? ['rust', 'orange', 'yellow'] : STEEL;
    tube(s, cx - nx * hw, cy - ny * hw, cx + nx * hw, cy + ny * hw, th, ramp);
    // Kappen an den Enden
    const e1 = [cx + nx * (hw + 0.5), cy + ny * (hw + 0.5)], e2 = [cx - nx * (hw + 0.5), cy - ny * (hw + 0.5)];
    s.px(e1[0], e1[1], o.hot ? 'amber' : 'stone'); s.px(e2[0], e2[1], o.hot ? 'amber' : 'stone');
    s.px(cx - 1, cy - 1, 'white');
    if (o.hot) {
      s.px(cx + 1, cy, 'white'); s.px(cx, cy + 1, 'yellow');
      for (let i = 0; i < 3; i++) front.px(cx - 4 + ((o.ph * 2 + i * 3) % 8), cy - 4 - ((o.ph + i * 2) % 4), i % 2 ? 'yellow' : 'orange');
      flame(front, Math.round(cx), Math.round(cy - 4), 4, o.ph, 'orange', 'amber', 'yellow');
    }
  }
  return [cx, cy];
}

function anvil(b: Surface, ax: number, ay: number, hot: boolean): void {
  const r: Ramp = hot ? ['rust', 'orange', 'amber'] : STEEL;
  b.box(ax - 5, ay, 11, 3, r);
  b.poly([[ax - 5, ay], [ax - 11, ay], [ax - 5, ay + 2]], r[1]);
  b.px(ax - 10, ay, r[2]);
  b.box(ax - 2, ay + 3, 5, 3, RAMPS.iron);
  b.box(ax - 4, ay + 6, 9, 2, RAMPS.iron);
  b.px(ax - 4, ay, 'white');
}

export function drawBram(level: number, d: Dir, p: Pose, cast: number): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const stage = heroStage(level);
  const ph = p.ph;
  const grow = [0, 0, 1, 2, 4][stage], wg = [0, 0, 0, 1, 2][stage];
  const up = p.up + grow;
  const G = GY, ox = OX;
  const hot = stage >= 4;
  const yT = G - 10 - up, yB = G - 1;
  const hcx = ox, hcy = G - 15 - up;

  // ---- Ruecken: Flammenmantel (L20), Amboss (ab L10) ----
  if (hot) {
    for (let i = -3; i <= 3; i++) {
      const fx = ox + i * 3 - Math.sign(i) * 0, h = 9 - Math.abs(i) * 1.4 + ((ph + i + 6) % 3);
      flame(back, fx, yT + 4, Math.round(h), ph + i + 8, 'red', 'orange', 'amber');
    }
    back.rect(ox - 8, yT + 3, 17, 4, 'crimson');
  }
  if (stage >= 2) anvil(back, ox - 12, yT + 2, hot);

  // ---- Hammer: Haltung je Pose ----
  const hxS = ox + 9 + wg, hyS = yT + 8;
  let vx = 0.42, vy = -0.9;
  let showHead = true;
  if (p.atk) {
    if (p.ai === 0) { vx = -0.45 * d.ux; vy = -0.85; }
    else if (p.ai === 1) { vx = -0.8 * d.ux; vy = -0.6; }
    else if (p.ai === 2) { vx = 0.95 * d.ux; vy = -0.2 + 0.5 * d.uy; showHead = false; }
    else { vx = 0.5 * d.ux; vy = -0.85 + 0.3 * d.uy; }
  }
  if (cast >= 0) { vx = 0; vy = -1; }
  const vl = Math.hypot(vx, vy); vx /= vl; vy /= vl;
  const hot2 = hot;
  const hlen = cast >= 0 ? 14 : 15 + (stage >= 3 ? 1 : 0);
  // Hand am Stiel
  const gripX = cast >= 0 ? ox + 1 : hxS, gripY = cast >= 0 ? yT - 3 - cast * 2 : hyS;
  let muzzle: [number, number] = [hxS + vx * (hlen + 1), hyS + vy * (hlen + 1)];
  const drawHammer = (): void => {
    const bigHead = stage >= 2 || cast >= 0;
    const [cx, cy] = hammer(s, front, gripX - vx * 3, gripY - vy * 3, vx, vy, hlen, { head: showHead, big: bigHead, hot: hot2, ph });
    if (cast >= 0) {
      back.ball(Math.round(cx), Math.round(cy), cast ? 9 : 7, cast ? 9 : 7, hot2 ? ['red', 'orange', 'yellow'] : ['rust', 'orange', 'amber']);
      front.ring(cx, cy, cast ? 12 : 10, cast ? 12 : 10, hot2 ? 'yellow' : 'amber');
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + cast; spark(front, cx + Math.cos(a) * (cast ? 11 : 9), cy + Math.sin(a) * (cast ? 11 : 9), i % 2 ? 'yellow' : 'white'); }
    } else if (p.atk && p.ai === 2) {
      // Schwungstreifen, der Hammer ist unterwegs
      for (let i = 1; i <= 4; i++) front.px(gripX + vx * (hlen + i * 2) - 1, gripY + vy * (hlen + i * 2) - i % 2, i < 3 ? 'white' : 'silver');
      front.px(Math.round(muzzle[0]), Math.round(muzzle[1]), 'white');
    }
    if (stage >= 1 && !(p.atk && p.ai === 2)) {
      // Funken am Kopf
      for (let i = 0; i < (hot ? 4 : 3); i++) { front.px(Math.round(cx) - 4 + ((ph * 2 + i * 3) % 9), Math.round(cy) - 4 - ((ph + i * 2) % 6), i % 2 ? 'yellow' : 'orange'); if (i === 0) front.px(Math.round(cx) + 5, Math.round(cy) - 2 + (ph % 2), 'white'); }
    }
    muzzle = [cx, cy];
  };
  if (d.behind) drawHammer();

  // ---- Beine, Rumpf, Schuerze ----
  const boot: Ramp = stage >= 3 ? STEEL : RAMPS.darkWood;
  s.rect(ox - 5, G - 1, 4, 2, boot[1]); s.rect(ox + 1, G - 1, 4, 2, boot[1]);
  s.rect(ox - 5, G - 1, 4, 1, boot[2]); s.rect(ox + 1, G - 1, 4, 1, boot[2]);
  s.rect(ox - 5, G, 4, 1, boot[0]); s.rect(ox + 1, G, 4, 1, boot[0]);
  s.rect(ox - 4, G - 3, 3, 2, 'night'); s.rect(ox + 1, G - 3, 3, 2, 'night');
  const tw = 5 + wg;
  s.poly([[ox - tw, yT], [ox + tw, yT], [ox + tw + 1, yB - 1], [ox - tw - 1, yB - 1]], (x) => (x <= ox - tw + 1 ? SHIRT[2] : x >= ox + tw - 2 ? SHIRT[0] : SHIRT[1]));
  s.rect(ox - tw, yT, tw * 2, 1, SHIRT[2]);
  // Schuerze (Latz bis zum Saum) mit Taschenband und Nieten
  const aw = 3 + Math.min(1, wg);
  s.poly([[ox - aw, yT + 1], [ox + aw + 1, yT + 1], [ox + aw + 2, yB], [ox - aw - 1, yB]], (x) => (x <= ox - aw ? APRON[2] : x >= ox + aw ? APRON[0] : APRON[1]));
  s.rect(ox - aw - 1, yB, aw * 2 + 3, 1, APRON[0]);
  s.rect(ox - aw, yT + 5, aw * 2 + 1, 1, 'bark');
  s.px(ox - aw + 1, yT + 3, 'amber'); s.px(ox + aw - 1, yT + 3, 'amber');
  s.rect(ox - 1, G - 4, 3, 2, 'bark'); s.px(ox, G - 4, 'amber');
  // Guertel
  s.rect(ox - tw - 1, G - 6, tw * 2 + 3, 1, 'bark'); s.px(ox, G - 6, 'yellow'); s.px(ox - 1, G - 6, 'amber');
  // Zweiter Hammer am Guertel (ab L10)
  if (stage >= 2) {
    s.rect(ox - tw - 2, G - 6, 1, 6, 'wood'); s.rect(ox - tw - 3, G - 1, 3, 2, 'stone'); s.px(ox - tw - 3, G - 1, 'white');
  }
  // Ruestung (ab L15): Brustplatte mit Gluehnaehten
  if (stage >= 3) {
    const seam = ph % 2 ? 'yellow' : 'orange', seam2 = hot ? 'white' : 'amber';
    const bt = yT + 1, bb = yT + 8;
    s.rect(ox - tw, bt, tw * 2 + 1, bb - bt, STEEL[1]);
    s.rect(ox - tw, bt, tw * 2 + 1, 1, STEEL[2]); s.rect(ox - tw, bt, 1, bb - bt, STEEL[2]);
    s.rect(ox + tw, bt + 1, 1, bb - bt - 1, STEEL[0]); s.rect(ox - tw, bb - 1, tw * 2 + 1, 1, STEEL[0]);
    s.rect(ox, bt + 1, 1, bb - bt - 2, seam); s.rect(ox - tw + 1, bt + 3, tw * 2 - 1, 1, seam);
    s.px(ox, bt + 3, seam2); s.px(ox - 2, bt + 3, seam2); s.px(ox + 2, bt + 3, seam2);
    for (const sg of [-1, 1]) {
      s.ball(ox + sg * (tw + 1), yT + 1, 3.4, 2.8, STEEL);
      s.px(ox + sg * (tw + 1) - 1, yT, 'white'); s.rect(ox + sg * (tw + 1) - 2, yT + 3, 5, 1, seam);
    }
    s.rect(ox - tw, G - 6, tw * 2 + 1, 1, 'rust');
  }
  // Riemen des Amboss ueber die Brust (ab L10, vor der Ruestung)
  if (stage >= 2 && stage < 3) { for (let i = 0; i < 8; i++) s.px(ox - 4 + i, yT + 1 + i, 'bark'); s.px(ox, yT + 5, 'amber'); }

  // ---- Kopf ----
  const hb = stage >= 4 ? 1 : 0;
  s.ball(hcx, hcy, 6 + hb, 5.4 + hb, RAMPS.skin);
  // Haar-Kappe, Stirnband
  s.ellipseFn(hcx, hcy - 1.5, 6.6 + hb, 5.2 + hb, (x, y, nx, ny) => (y < hcy - 2 ? ((-nx * 0.5 - ny * 0.7) > 0.25 ? BEARD[2] : BEARD[1]) : null));
  s.rect(hcx - 6, hcy - 3, 13, 1, 'crimson'); s.rect(hcx - 5, hcy - 3, 3, 1, 'red');
  if (d.eyes === 0) {
    s.rect(hcx - 6, hcy - 2, 13, 7, BEARD[1]); s.rect(hcx - 6, hcy - 2, 4, 7, BEARD[2]); s.rect(hcx + 4, hcy - 2, 3, 7, BEARD[0]);
    s.rect(hcx - 6, hcy - 3, 13, 1, 'crimson');
  } else {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.4)) - 0;
    const eye = (x: number): void => { s.rect(x, fy - 1, 2, 2, 'ink'); s.px(x, fy - 1, 'white'); s.rect(x - 1, fy - 3, 4, 1, BEARD[0]); };
    if (d.eyes === 2) { eye(fx - 3); eye(fx + 1); s.px(fx, fy + 1, 'tan'); }
    else eye(fx);
    // Bart: unten um das Gesicht, Spitze nach unten
    const bx = d.eyes === 1 ? 2 : 0;
    s.ellipseFn(hcx + bx, hcy + 3.4, 6.2, 4.6, (x, y, nx, ny) => (y >= fy + 2 ? ((-nx * 0.5 - ny * 0.6) > 0.1 ? BEARD[2] : (ny > 0.4 ? BEARD[0] : BEARD[1])) : null));
    s.rect(hcx + bx - 1, hcy + 7, 3, 2, BEARD[1]); s.px(hcx + bx, hcy + 9, BEARD[0]);
    s.rect(fx - 2, fy + 2, 5, 1, BEARD[2]); // Schnurrbart
    s.px(hcx + bx + (d.eyes === 1 ? 2 : 0), fy + 3, 'coral'); // Mund
  }
  // Helm (ab L15)
  if (stage >= 3) {
    s.ellipseFn(hcx, hcy - 2, 6.8, 5, (x, y, nx, ny) => (y < hcy - 2 ? ((-nx * 0.5 - ny * 0.7) > 0.3 ? STEEL[2] : STEEL[1]) : null));
    s.rect(hcx - 6, hcy - 3, 13, 2, STEEL[1]); s.rect(hcx - 6, hcy - 3, 13, 1, 'amber');
    s.px(hcx - 3, hcy - 2, 'white'); s.px(hcx + 3, hcy - 2, 'yellow');
    s.px(hcx - 6, hcy - 6, 'stone'); s.px(hcx - 7, hcy - 7, 'silver'); s.px(hcx + 6, hcy - 6, 'stone'); s.px(hcx + 7, hcy - 7, 'silver');
    if (hot) flame(front, hcx, hcy - 7, 7, ph, 'red', 'orange', 'yellow');
  }
  // Funken im Haar (L5+)
  if (stage >= 1 && stage < 3) { if (ph % 2 === 0) s.px(hcx - 4, hcy - 7, 'yellow'); else s.px(hcx + 4, hcy - 7, 'orange'); }

  // ---- Arme ----
  const gl = stage >= 1;
  const arm = (sx: number, sy: number, hx: number, hy: number): void => {
    drawArm(s, { sx, sy, hx, hy, sleeve: stage >= 3 ? 'slate' : 'slate', skin: 'skin', roll: stage >= 3 ? 1 : 0.55, hand: false });
    if (gl) { s.rect(Math.round(hx), Math.round(hy), 3, 3, 'bark'); s.px(hx, hy, 'wood'); s.rect(Math.round(hx), Math.round(hy) - 1, 3, 1, 'amber'); }
    else { s.rect(Math.round(hx), Math.round(hy), 2, 2, 'skin'); s.px(hx, hy, 'peach'); s.px(hx + 1, hy + 1, 'tan'); }
  };
  if (cast >= 0) {
    arm(ox + tw, yT + 2, gripX + 1, gripY + 2);
    arm(ox - tw, yT + 2, gripX - 1, gripY + 5);
  } else {
    arm(ox + tw - 1, yT + 2, Math.round(hxS - 1), Math.round(hyS - 1));
    arm(ox - tw + 1, yT + 2, ox - tw - 1, yT + 8);
  }
  if (!d.behind) drawHammer();
  // Hand ueber dem Stiel: Lederhandschuh mit Stulpe (ab L5), vorher nackte Hand
  if (!d.behind && cast < 0) {
    const gx2 = Math.round(hxS - 1), gy2 = Math.round(hyS - 1);
    if (stage >= 1) { s.rect(gx2, gy2, 4, 4, 'bark'); s.rect(gx2, gy2, 4, 1, 'wood'); s.px(gx2, gy2 + 1, 'wood'); s.rect(gx2, gy2 - 1, 4, 1, 'amber'); s.px(gx2 + 1, gy2 + 3, 'plum'); }
    else { s.rect(gx2, gy2, 3, 3, 'skin'); s.px(gx2, gy2, 'peach'); s.px(gx2 + 2, gy2 + 2, 'tan'); }
  }

  // ---- L20: Glut ueber dem Boden, Funkenflug ----
  if (hot) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + ph * 0.1;
      back.pxUnder(ox + Math.cos(a) * 15, G - 1 + Math.sin(a) * 4, (i + ph) % 2 ? 'orange' : 'yellow');
    }
    for (const [x, y, z] of orbit(ox, G - 12 - up, 14, 6, 4, ph, 4)) (z < 0 ? back : front).px(x, y, 'yellow');
    for (let i = 0; i < 5; i++) spark(front, ox - 12 + i * 6, G - 30 + ((ph * 3 + i * 5) % 10), i % 2 ? 'yellow' : 'amber');
  }
  return { fig: s, back, front, muzzle };
}
