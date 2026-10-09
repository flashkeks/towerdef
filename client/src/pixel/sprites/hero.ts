/** Held Wren, the Lamplighter: sichtbare Level-Stufen (1-4, 5-9, 10-14, 15-19, 20), Idle/Angriff/Faehigkeits-Pose. */
import { drawArm } from './bows';
import { flame, orbit, spark, tube } from './parts';
import { drawGear, growOf, widthOf, type GearPal } from './gear';
import { dirOf, poseOf, type Dir, type Pose, type TowerFrame } from './pose';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { outlineSurface, RAMPS, Surface } from './surface';

export type HeroFrame = TowerFrame | 'cast0' | 'cast1';
export const HERO_FRAMES: HeroFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3', 'cast0', 'cast1'];

/** 0 = Level 1-4, 1 = 5-9, 2 = 10-14, 3 = 15-19, 4 = 20. */
export function heroStage(level: number): number {
  return level >= 20 ? 4 : level >= 15 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0;
}

function lantern(s: Surface, front: Surface, x: number, y: number, size: number, ph: number, big: boolean): void {
  // Aufhaenger
  s.px(x, y - size - 1, 'rust');
  s.px(x - 1, y - size, 'rust'); s.px(x + 1, y - size, 'rust');
  const w = size, h = size + 1;
  s.rect(x - w / 2 - 0.5, y - h + 1, w + 1, 1, 'rust'); // Deckel
  s.rect(x - w / 2 + 0.5, y - h, w - 1, 1, 'amber');
  s.rect(x - w / 2 - 0.5, y - h + 2, w + 1, h - 3, 'yellow');
  s.rect(x - w / 2 - 0.5, y - h + 2, 1, h - 3, 'rust');
  s.rect(x + w / 2 - 0.5, y - h + 2, 1, h - 3, 'rust');
  s.rect(x - w / 2 + 0.5, y - 1, w - 1, 1, 'rust');
  // Flamme
  const fl = ph % 2;
  s.rect(x - 0.5, y - h + 3 + fl * 0, 1, h - 5, 'white');
  if (w >= 5) { s.px(x, y - h + 3, 'white'); s.px(x - 1, y - h + 4, 'amber'); s.px(x + 1, y - h + 4, 'amber'); }
  front.pxUnder(x, y - h + 2, 'white');
  if (big) {
    flame(front, x, y - h - 1, 5, ph, 'orange', 'amber', 'yellow');
  }
}

/** Wren: alle Pfade in Laternengold (Stufe 5 = goldene Fluegel). */
const WREN_PAL: GearPal = {
  ramp: [RAMPS.brass, RAMPS.brass, RAMPS.brass],
  ramp5: [RAMPS.gold, RAMPS.gold, RAMPS.gold],
  hi: ['yellow', 'yellow', 'yellow'],
  mid: ['amber', 'amber', 'amber'],
};
/** Sichtbare Ausruestungsstufe (0..5) je Helden-Stufe 0..4. */
const WREN_TIER = [0, 2, 3, 4, 5];

export function drawWren(level: number, d: Dir, p: Pose, cast: number): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const stage = heroStage(level);
  const ph = p.ph;
  const gt = WREN_TIER[stage], gr = growOf(gt), wg = widthOf(gt);
  const up = p.up + gr;
  const G = GY, ox = OX;

  // ---- Umhang (ab Stufe 1) ----
  if (stage >= 1) {
    const wob = [0, 1, 1, 0][ph];
    const len = stage >= 2 ? 3 : 1;
    back.poly([[ox - 4, G - 11 - up], [ox + 4, G - 11 - up], [ox + 6, G - 2], [ox + 4, G + len + 1], [ox - 3, G + len + 2 - wob], [ox - 11 - wob, G + len], [ox - 10 - wob, G - 6], [ox - 7, G - 12 - up]], (x, y) => (x > ox + 2 || y > G ? 'plum' : x < ox - 7 ? 'crimson' : 'red'));
    back.line(ox - 6, G - 11 - up, ox - 10 - wob, G + len - 1, 'coral');
    back.rect(ox - 4, G - 10 - up, 9, 1, 'amber');
  }
  // Haarzopf hinten
  const sway = [0, 1, 1, 0][ph];
  back.rect(ox - 7 - sway, G - 15 - up, 2, 6, 'amber'); back.rect(ox - 7 - sway, G - 15 - up, 1, 6, 'yellow'); back.px(ox - 6 - sway, G - 9 - up, 'orange'); back.px(ox - 7 - sway, G - 8 - up, 'orange');

  // ---- Stab ----
  const sx = ox + 6 + Math.min(2, wg), sy = G - 3 - up;
  let vx = 0.3 * d.ux, vy = -0.95 + 0.2 * d.uy;
  if (p.atk) { vx = d.ux * [0.55, 0.7, 0.4, 0.45][p.ai]; vy = -0.8 + 0.4 * d.uy; }
  if (cast >= 0) { vx = 0.05; vy = -1; }
  const vl = Math.hypot(vx, vy); vx /= vl; vy /= vl;
  const L = stage >= 3 ? 25 : stage >= 1 ? 23 : 21;
  const lift = cast >= 0 ? -3 - cast * 2 : 0;
  const tipx = sx + vx * (L - p.recoil * 0.5), tipy = sy + vy * (L - p.recoil * 0.5) + lift;
  const kx = Math.round(tipx), ky = Math.round(tipy);
  let muzzle: [number, number] = [kx, ky - 3];
  const stave = () => {
    tube(s, sx, sy + lift * 0.3, tipx, tipy + 3, 2, RAMPS.wood);
    if (stage >= 3) { s.px(sx + vx * 6, sy + vy * 6, 'yellow'); s.px(sx + vx * 12, sy + vy * 12, 'yellow'); }
    // Haken
    s.px(kx - 1, ky + 1, 'rust'); s.px(kx, ky, 'rust'); s.px(kx + 1, ky + 1, 'rust');
    const size = stage >= 2 ? 6 : stage >= 1 ? 5 : 4;
    lantern(s, front, kx, ky + size + 3, size, ph, stage >= 2);
    if (p.flash || cast === 1) { front.ball(kx, ky + 3, cast === 1 ? 8 : 6, cast === 1 ? 8 : 6, ['yellow', 'white', 'white']); }
    if (p.ai === 1 || cast === 0) spark(front, kx, ky - 2, 'yellow', true);
    if (stage >= 2) for (let i = 0; i < 3; i++) front.px(kx - 3 + ((ph + i * 2) % 6), ky - 4 - ((ph * 2 + i * 3) % 6), i % 2 ? 'amber' : 'yellow'); // Funken
  };
  if (d.behind) stave();

  // ---- Koerper ----
  s.rect(ox - 4, G - 1, 3, 2, 'bark'); s.rect(ox + 1, G - 1, 3, 2, 'bark');
  const yT = G - 10 - up, yB = G - 1;
  const dress = RAMPS.plum;
  s.poly([[ox - 4 - wg, yT], [ox + 4 + wg, yT], [ox + 6 + wg, yB], [ox - 6 - wg, yB]], (x, y) => (x <= ox - 4 - wg ? dress[2] : x >= ox + 3 + wg ? dress[0] : dress[1]));
  s.rect(ox - 6 - wg, yB, 13 + wg * 2, 1, 'amber'); s.rect(ox - 4 - wg, G - 5, 9 + wg * 2, 1, 'amber'); s.px(ox, G - 5, 'yellow');
  s.rect(ox - 4, yT, 9, 1, 'orchid');
  if (stage >= 3) { s.px(ox - 2, G - 7, 'yellow'); s.px(ox + 2, G - 7, 'yellow'); s.px(ox, G - 8, 'yellow'); }

  drawGear(s, back, front, { ox, G, yT, wg, t: [gt, 0, 0], ph, OY, own: { cape: true }, pal: WREN_PAL });

  // ---- Kopf ----
  const hcx = ox, hcy = G - 15 - up;
  const hb = gr >= 4 ? 1 : 0;
  s.ball(hcx, hcy, 5.5 + hb, 5 + hb, RAMPS.skin);
  // Haare: Kappe + Seitenstraehnen
  s.ellipseFn(hcx, hcy - 1.5, 6.2, 5, (x, y, nx, ny) => (y < hcy - 2 ? ((-nx * 0.5 - ny * 0.7) > 0.3 ? 'amber' : 'orange') : null));
  s.rect(hcx - 6, hcy - 2, 2, 5, 'amber'); s.rect(hcx + 5, hcy - 2, 2, 4, 'orange');
  s.px(hcx - 6, hcy - 2, 'yellow');
  // Pony
  s.rect(hcx - 4, hcy - 3, 8, 1, 'amber'); s.px(hcx - 2, hcy - 2, 'amber'); s.px(hcx + 2, hcy - 2, 'amber'); s.px(hcx, hcy - 2, 'orange');
  if (d.eyes === 0) { s.rect(hcx - 5, hcy - 2, 11, 6, 'amber'); s.rect(hcx - 5, hcy - 2, 3, 6, 'yellow'); s.rect(hcx + 3, hcy - 2, 3, 6, 'orange'); }
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.4));
    const eye = (x: number) => { s.rect(x, fy - 1, 2, 2, 'ink'); s.px(x, fy - 1, 'white'); s.px(x + 1, fy, 'yellow'); };
    if (d.eyes === 2) { eye(fx - 2); eye(fx + 1); s.px(fx - 3, fy + 1, 'coral'); s.px(fx + 3, fy + 1, 'coral'); }
    else eye(fx);
  }
  // Funken im Haar
  if (ph % 2 === 0) s.px(hcx - 4, hcy - 6, 'yellow'); else s.px(hcx + 3, hcy - 7, 'white');
  if (stage >= 3) {
    // Laternenkrone: Goldreif mit kleinen Laternen
    s.rect(hcx - 5, hcy - 5, 11, 1, 'amber');
    for (const dx of [-4, -2, 0, 2, 4]) {
      const hh = dx === 0 ? 4 : 3;
      s.rect(hcx + dx - 0, hcy - 5 - hh, 1, hh, 'rust');
      s.px(hcx + dx, hcy - 6 - hh, ph % 2 === (dx & 1 ? 0 : 1) ? 'white' : 'yellow');
      s.px(hcx + dx, hcy - 5 - hh + 1, 'yellow');
    }
  }
  // Arme
  const handx = Math.round(sx + vx * 6), handy = Math.round(sy + vy * 6 + lift * 0.3);
  drawArm(s, { sx: ox + 3, sy: yT + 2, hx: handx, hy: handy, sleeve: 'violet', skin: 'skin', roll: 1 });
  drawArm(s, { sx: ox - 3, sy: yT + 2, hx: ox - 5, hy: yT + 7, sleeve: 'violet', skin: 'skin', roll: 1 });
  if (!d.behind) stave();
  s.px(handx, handy, 'skin');
  if (!d.behind && !(p.atk) && cast < 0) muzzle = [kx, ky + 2];

  // ---- Aura ----
  if (stage >= 4) {
    for (const [x, y, z] of orbit(ox, G - 12 - up, 15, 6, 3, ph, 4)) {
      const t = z < 0 ? back : front;
      lantern(t, front, x, y + 4, 3, ph + x, false);
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + ph * 0.08;
      back.pxUnder(ox + Math.cos(a) * 16, G - 11 + Math.sin(a) * 16, (i + ph) % 2 ? 'yellow' : 'white');
    }
    for (let i = 0; i < 5; i++) spark(front, ox - 10 + i * 5, G - 28 + ((ph * 3 + i * 5) % 9), i % 2 ? 'yellow' : 'white');
  }
  return { fig: s, back, front, muzzle };
}

export function heroRaster(level: number, facing: number, frame: HeroFrame): { rows: string[]; ax: number; ay: number; mx: number; my: number } {
  const d = dirOf(facing);
  const cast = frame === 'cast0' ? 0 : frame === 'cast1' ? 1 : -1;
  const p = poseOf(cast >= 0 ? 'idle0' : (frame as TowerFrame));
  if (cast >= 0) { p.ph = cast * 2; p.up = cast; }
  const L = drawWren(level, d, p, cast);
  const out = new Surface(TW, TH);
  out.blit(L.back); out.blit(outlineSurface(L.fig)); out.blit(L.front);
  const fin = d.flip ? out.flipX() : out;
  return { rows: fin.toRows(), ax: OX, ay: OY, mx: (d.flip ? 2 * OX - L.muzzle[0] : L.muzzle[0]) - OX, my: L.muzzle[1] - OY };
}
