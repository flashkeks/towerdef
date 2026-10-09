/**
 * Alchemist (Runde 14): Lanternfolk mit Schutzbrille, Lederschuerze und Guertel voller Flaeschchen. Keine Plattform.
 * A Brews:    groessere Flaschen -> Saeurefass-Tropfen -> Kessel + Tragegestell -> Kessel unter Feuer, Buff-Leuchten -> goldener Dauer-Trank.
 * B Unstable: Saeurelöcher -> Gasmaske + Totenkopf-Flaschen -> Warnschild + rauchende Flaschen -> Hulk-Arm (Transforming Tonic)
 *             -> Total Transformation (ganzer Koerper Monster). Dazu `drawMonster`: das grosse Monster-Sprite der Faehigkeit.
 * C Gold:     Messing-Armschiene + zweite Flasche -> Saeurekanister mit Pfuetze -> Destille mit Goldbarren -> Midas-Hand -> Schrumpftrank-Aura.
 * Stufe 3 = neue Silhouette, 4 = Ruestung/Leuchten, 5 = Verwandlung. 8 Richtungen, Idle 4 Frames (Blubbern, Dampf), Angriff 4 Frames (Trank werfen).
 */
import type { PalName } from '../palette';
import { growOf, mainPath, widthOf } from './gear';
import { flame, spark, tube } from './parts';
import type { Dir, Pose } from './pose';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';

const ACID: Ramp = ['grass', 'leaf', 'yellow'];
const HULK: Ramp = ['pine', 'grass', 'leaf'];

/** Flasche: Bauch (r), Hals, Korken; Fluessigkeit in `liq`, `ph` laesst Blasen steigen. (x, y) = Mitte des Bauchs. */
export function flask(s: Surface, x: number, y: number, r: number, liq: Ramp, ph = 0, o: { skull?: boolean; fuse?: boolean; cork?: PalName } = {}): void {
  s.ball(x, y, r + 0.6, r + 0.6, ['stone', 'silver', 'white']);
  s.ball(x, y + 0.5, r - 0.2, r - 0.4, liq);
  s.rect(Math.round(x - 1), Math.round(y - r - 2), 3, 3, 'silver');
  s.rect(Math.round(x - 1), Math.round(y - r - 1), 3, 1, liq[1]);
  s.rect(Math.round(x - 1), Math.round(y - r - 3), 3, 1, o.cork ?? 'wood');
  s.px(x - r * 0.5 - 0.5, y - r * 0.5, 'white');
  if (o.skull) { s.px(x - 1, y, 'white'); s.px(x + 1, y, 'white'); s.px(x, y + 1, 'white'); s.px(x - 1, y + 1, 'ink'); s.px(x + 1, y + 1, 'ink'); s.px(x, y, 'white'); }
  if (o.fuse) { s.px(x + 1, y - r - 4, 'tan'); s.px(x + 2, y - r - 5, ph % 2 ? 'yellow' : 'orange'); }
  // Blasen im Fluessigen
  s.px(x - 1 + (ph & 1), y + 1 - (ph >> 1), liq[2]);
}

function bubbles(f: Surface, x: number, y: number, ph: number, col: PalName = 'white', n = 3): void {
  for (let i = 0; i < n; i++) f.px(x + ((i * 3 + ph) % 5) - 2, y - ((ph * 3 + i * 4) % 11), i % 2 ? col : 'ice');
}
function steam(f: Surface, x: number, y: number, ph: number, w = 1): void {
  for (let i = 0; i < 3; i++) {
    const yy = y - 3 - i * 4 - ph * 1, xx = x + (i % 2 ? 1 : -1) * ((ph + i) & 1);
    f.ball(xx, yy, 1.6 + i * 0.5 * w, 1.4 + i * 0.4 * w, ['stone', 'silver', 'white']);
  }
}

/** Kessel (Rumpf, Rand, Beine); `fire` = Flammen unter dem Kessel, `liq` = Fluessigkeit. (x, by) = Mitte der Unterkante. */
function cauldron(s: Surface, f: Surface, x: number, by: number, w: number, liq: Ramp, ph: number, ramp: Ramp = RAMPS.iron, fire = false): void {
  const h = Math.round(w * 0.65);
  if (fire) { flame(f, x - 3, by + 1, 5, ph, 'orange', 'amber', 'yellow'); flame(f, x + 3, by + 1, 6, ph + 2, 'orange', 'amber', 'yellow'); flame(f, x, by + 1, 4, ph + 1, 'red', 'orange', 'yellow'); }
  s.rect(x - w / 2 + 1, by - 1, 2, 2, ramp[0]); s.rect(x + w / 2 - 3, by - 1, 2, 2, ramp[0]);
  s.ellipseFn(x, by - h / 2 - 1, w / 2, h / 2 + 1, (_x, _y, nx, ny) => (-nx * 0.5 - ny * 0.7 > 0.3 ? ramp[2] : -nx * 0.5 - ny * 0.7 > -0.35 ? ramp[1] : ramp[0]));
  s.ellipse(x, by - h, w / 2 - 0.5, 2, ramp[0]);
  s.ellipse(x, by - h, w / 2 - 2, 1.4, liq[1]);
  for (let i = 0; i < 3; i++) s.px(x - 3 + i * 3 + ((ph + i) & 1), by - h - 1 + (i & 1), liq[2]);
  s.rect(x - w / 2, by - h - 1, w, 1, ramp[2]);
  s.px(x - w / 2 + 1, by - h * 0.6, 'white');
}

export function drawAlchemist(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C), main = mainPath(t);
  const gr = growOf(top), wg = widthOf(top);
  const up = p.up + gr;
  const G = GY, ox = OX, ph = p.ph;
  const hw = 4 + wg;
  const yT = G - 10 - up, yB = G - 1;
  const hulk = main === 1 && B >= 5, hulkArm = main === 1 && B >= 4;

  // Farben
  let coat: Ramp = ['night', 'violet', 'orchid'];
  if (main === 0 && A >= 5) coat = ['clay', 'amber', 'yellow'];
  if (main === 1 && B >= 3) coat = ['plum', 'violet', 'orchid'];
  if (main === 2 && C >= 3) coat = ['night', 'violet', 'orchid'];
  if (main === 2 && C >= 5) coat = ['violet', 'orchid', 'coral'];
  const apron: Ramp = main === 0 && A >= 5 ? ['rust', 'orange', 'amber'] : RAMPS.wood;
  const liq: Ramp = main === 0 && A >= 5 ? ['rust', 'amber', 'yellow'] : main === 0 && A >= 3 ? ['crimson', 'red', 'coral'] : main === 1 && B >= 4 ? ['violet', 'orchid', 'coral'] : main === 1 && B >= 2 ? ['plum', 'violet', 'orchid'] : main === 1 && B >= 1 ? ['leaf', 'yellow', 'white'] : main === 2 && C >= 5 ? ['violet', 'orchid', 'ice'] : main === 2 && C >= 3 ? ['rust', 'amber', 'yellow'] : ACID;
  const fr = [0, 0, 1, 1][ph];

  // ---------- Ground & Hintergrund ----------
  if (top >= 4 || (main === 2 && C >= 5)) {
    const rc: [PalName, PalName] = main === 0 ? ['yellow', 'amber'] : main === 1 ? ['orchid', 'leaf'] : ['yellow', 'orchid'];
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + ph * 0.12;
      if ((i + ph) % 4 === 3) continue;
      const r = main === 2 && C >= 5 ? 19 - ph * 1.5 : 18;
      back.pxUnder(ox + Math.cos(a) * r, OY + Math.sin(a) * (r * 0.28), i % 2 ? rc[0] : rc[1]);
    }
  }
  // Tragegestell mit Tank + Roehren (A3+, B3+, B4/B5 Bottiche)
  if (A >= 3 && main === 0 || (main === 1 && B >= 4)) {
    const bx = ox - 11 - wg;
    const tank: Ramp = main === 0 ? (A >= 5 ? RAMPS.gold : RAMPS.brass) : ['pine', 'grass', 'leaf'];
    back.box(bx - 2, yT + 1, 8, 12, tank); back.rect(bx - 2, yT + 4, 8, 1, tank[0]); back.px(bx, yT + 2, 'white');
    back.line(bx + 5, yT + 3, ox - 3, yT + 6, 'silver');
    for (let i = 0; i < 3; i++) back.px(bx + i * 2, yT - 1 - ((ph + i) & 1), i % 2 ? 'silver' : 'white');
    if (main === 1 && B >= 4) { back.box(bx - 4, yT + 6, 5, 9, ['pine', 'grass', 'leaf']); }
  }
  // Warnschild (B3, B4)
  if (main === 1 && B >= 3) {
    const sx = ox - 14 - wg - (B >= 4 ? 4 : 0), sy = yT - 12 - (B >= 4 ? 0 : 0);
    back.line(sx, sy + 8, sx, yT + 18, 'bark', 1);
    back.poly([[sx - 6, sy + 10], [sx + 6, sy + 10], [sx, sy - 1]], (x, y) => (y > sy + 8 ? 'amber' : 'yellow'));
    back.rect(sx - 6, sy + 10, 13, 1, 'orange');
    back.rect(sx, sy + 3, 1, 4, 'ink'); back.px(sx, sy + 8, 'ink');
    if (ph % 2) back.px(sx + 2, sy + 1, 'white');
  }
  // Gold-Destille (C3+): Kupferkessel + Spiralrohr
  if (C >= 3 && main === 2) {
    const bx = ox - 12 - wg;
    back.ball(bx, yT + 8, 6, 5, RAMPS.brass); back.rect(bx - 2, yT + 1, 4, 3, 'rust'); back.px(bx - 2, yT + 8, 'white');
    back.line(bx + 1, yT + 1, bx + 6, yT - 3, 'amber', 1); back.line(bx + 6, yT - 3, bx + 8, yT + 6 + (ph & 1), 'amber', 1);
    back.px(bx + 8, yT + 8 + ph % 3, 'yellow');
    if (C >= 5) for (let i = 0; i < 3; i++) back.px(bx - 4 + i * 3, yT - 2 - ((ph + i * 2) % 5), 'orchid');
  }

  // Seitliche Dinge am Boden (in s, vor dem Rumpf gemalt)
  const sideX = ox + 13 + wg;
  if (A >= 3 && main === 0) cauldron(s, front, sideX, G + 1, 12 + (A >= 4 ? 4 : 0) + (A >= 5 ? 2 : 0), liq, ph, A >= 5 ? RAMPS.gold : RAMPS.iron, A >= 4);
  if (A >= 3 && main === 0) { steam(front, sideX, G - 12 - (A >= 4 ? 2 : 0), ph); if (A >= 4) bubbles(front, sideX, G - 12, ph, A >= 5 ? 'yellow' : 'coral', 3); }
  if (C >= 2 && main !== 0 || (C >= 2 && main === 0 && A < 3)) {
    // Saeurekanister + Pfuetze
    const kx = ox + 12 + wg;
    back.pxUnder(kx, G + 2, 'deep');
    back.ellipse(kx + 5, G + 1, 9, 2, 'pine'); back.ellipse(kx + 5, G + 1, 7, 1, ACID[1]);
    for (let i = 0; i < 3; i++) back.px(kx + 2 + i * 3 + ((ph + i) & 1), G + (i & 1), 'yellow');
    s.box(kx - 3, G - 9, 6, 10, ['pine', 'grass', 'leaf']); s.rect(kx - 3, G - 7, 6, 1, 'pine'); s.px(kx - 1, G - 4, 'ink'); s.px(kx + 1, G - 4, 'ink'); s.px(kx, G - 3, 'white');
    s.rect(kx - 1, G - 11, 3, 2, 'silver'); s.line(kx + 2, G - 1, kx + 5, G + 1, 'silver');
    if (ph & 1) front.px(kx + 5, G - ((ph) % 3), 'leaf');
  }
  if (C >= 3 && main === 2) {
    // Goldbarren und Muenzen am Boden
    const gx = ox - 12 - wg;
    for (const [dx, dy] of [[0, 0], [4, 0], [2, -3]] as [number, number][]) { s.box(gx + dx, G - 3 + dy, 5, 3, RAMPS.gold); s.px(gx + dx + 1, G - 3 + dy, 'white'); }
    s.ellipse(gx + 9, G, 2, 1, 'amber'); s.px(gx + 8, G, 'yellow');
    if (ph & 1) spark(front, gx + 2, G - 8, 'white');
  }
  if (main === 1 && B >= 4 && !hulk) { /* Bottiche am Ruecken stehen im back */ }

  // ---------- Wurfarm hinten (Blick nach oben) ----------
  const hand = handPos(ox, yT, G, up, wg, d, p);
  const behind = d.behind;
  const drawArmAndFlask = (): [number, number] => {
    const sx = ox + 3, sy = yT + 2;
    if (hulkArm) {
      tube(s, sx, sy, hand[0], hand[1], 5 + (hulk ? 2 : 0), HULK);
      s.ball(hand[0], hand[1], 3.2, 3, HULK); s.px(hand[0] - 1, hand[1] - 1, 'white');
      s.rect(hand[0] - 2, hand[1] + 1, 5, 1, 'pine'); for (let i = 0; i < 2; i++) s.px(hand[0] - 1 + i * 2, hand[1] + 2, 'white');
      s.rect(sx - 1, sy - 1, 4, 4, coat[0]); s.px(sx + 1, sy + 3, coat[0]); s.px(sx + 2, sy + 4, coat[0]); // zerfetzter Aermel
    } else {
      const sleeve = coat[1];
      const n = Math.max(1, Math.round(Math.hypot(hand[0] - sx, hand[1] - sy)));
      for (let i = 0; i <= n; i++) { const tt = i / n; const x = sx + (hand[0] - sx) * tt, y = sy + (hand[1] - sy) * tt; s.px(x, y, tt < 0.65 ? sleeve : 'skin'); s.px(x, y + 1, tt < 0.65 ? coat[0] : 'tan'); }
      s.rect(Math.round(hand[0]), Math.round(hand[1]), 2, 2, main === 2 && C >= 4 ? 'yellow' : 'skin'); s.px(hand[0], hand[1], main === 2 && C >= 4 ? 'white' : 'peach');
      // Messing-Armschiene (C1+)
      if (C >= 1) { const mx = sx + (hand[0] - sx) * 0.75, my = sy + (hand[1] - sy) * 0.75; s.rect(Math.round(mx) - 1, Math.round(my), 3, 3, 'amber'); s.px(mx - 1, my, 'yellow'); s.px(mx, my + 1, 'rust'); if (C >= 1) { s.px(mx + 2, my - 1, 'silver'); s.px(mx + 2, my + 1, 'silver'); } }
    }
    // Flasche in der Hand (nicht im Abschuss-Frame)
    const r = 3 + (A >= 1 ? 1 : 0) + (A >= 4 ? 1 : 0) + (top >= 5 ? 1 : 0);
    const shake = main === 1 && B >= 3 ? (ph & 1 ? 1 : -1) : 0;
    if (!p.flash) {
      flask(s, hand[0] + shake, hand[1] - r - 1, r, liq, ph, { skull: main === 1 && B >= 2 && B < 5, fuse: main === 1 && B >= 3, cork: main === 0 && A >= 5 ? 'yellow' : 'wood' });
      if (main === 2 && C >= 1) flask(s, hand[0] + 6 + (d.flip ? 0 : 0), hand[1] - 4, 2, ['rust', 'amber', 'yellow'], ph);
      bubbles(front, hand[0] + shake, hand[1] - r * 2 - 4, ph, 'white', 2 + (A >= 2 ? 1 : 0));
    }
    return [hand[0], hand[1] - r - 1];
  };
  let muzzle: [number, number] = [hand[0], hand[1] - 4];
  if (behind) muzzle = drawArmAndFlask();

  // ---------- Beine, Rumpf ----------
  const bootC: Ramp = RAMPS.darkWood;
  s.rect(ox - 4, G - 1, 3, 2, bootC[1]); s.rect(ox + 1, G - 1, 3, 2, bootC[1]);
  if (hulk) { s.rect(ox - 5 - wg, G - 3, 4 + wg, 4, HULK[1]); s.rect(ox + 1, G - 3, 4 + wg, 4, HULK[1]); s.rect(ox - 5 - wg, G - 3, 4 + wg, 1, HULK[2]); s.rect(ox + 1, G - 3, 4 + wg, 1, HULK[2]); s.rect(ox - 5 - wg, G, 4 + wg, 1, bootC[0]); s.rect(ox + 1, G, 4 + wg, 1, bootC[0]); }
  const bodyR: Ramp = hulk ? HULK : coat;
  s.poly([[ox - hw, yT], [ox + hw, yT], [ox + hw + 1, yB], [ox - hw - 1, yB]], (x, y) => (x <= ox - hw && y < yB - 1 ? bodyR[2] : x >= ox + hw - 1 ? bodyR[0] : y <= yT ? bodyR[2] : bodyR[1]));
  // Mantelsaum / Fetzen
  for (let x = ox - hw - 1; x <= ox + hw; x++) if ((x + fr) % 2 === 0) s.px(x, yB, hulk ? 'pine' : coat[0]);
  if (hulk) {
    // zerfetzte Weste
    s.poly([[ox - hw, yT + 1], [ox + hw, yT + 1], [ox + hw, yT + 7], [ox + 2, yT + 5], [ox, yT + 9], [ox - 2, yT + 5], [ox - hw, yT + 8]], (x, y) => (x < ox ? coat[2] : coat[1]));
    for (let i = 0; i < 4; i++) s.px(ox - hw + i * 3, yT + 8 + (i & 1), coat[0]);
    s.line(ox - 3, yT + 3, ox - 1, yT + 5, 'plum'); s.px(ox + 3, yT + 6, 'plum');
    s.rect(ox - hw - 1, yT + 12, hw * 2 + 3, 2, coat[1]);
  } else {
    // Lederschuerze
    const aw = 3 + (top >= 3 ? 1 : 0);
    s.poly([[ox - aw, yT + 2], [ox + aw + 1, yT + 2], [ox + aw + 2, yB], [ox - aw - 1, yB]], (x, y) => (x <= ox - aw ? apron[2] : x >= ox + aw ? apron[0] : y <= yT + 3 ? apron[2] : apron[1]));
    s.rect(ox - aw, yT + 2, aw * 2 + 1, 1, apron[2]);
    s.line(ox - aw, yT + 2, ox - hw, yT, 'bark'); s.line(ox + aw, yT + 2, ox + hw, yT, 'bark');
    // Taschen
    s.rect(ox - 2, yB - 6, 5, 3, apron[0]); s.rect(ox - 2, yB - 6, 5, 1, apron[2]);
    // Saeurelöcher (B1+) / Warnstreifen (A2)
    if (B >= 1) for (const [dx, dy] of [[-2, 3], [1, 6], [-1, 9]] as [number, number][]) { s.px(ox + dx, yT + dy, 'ink'); s.px(ox + dx - 1, yT + dy, 'leaf'); s.px(ox + dx + 1, yT + dy, 'leaf'); s.px(ox + dx, yT + dy - 1, 'grass'); }
  }
  // Guertel mit Flaeschchen
  s.rect(ox - hw, G - 6, hw * 2 + 1, 1, 'bark');
  const vialCols: Ramp[] = [ACID, ['crimson', 'red', 'coral'], ['navy', 'sky', 'ice'], ['rust', 'amber', 'yellow'], ['violet', 'orchid', 'coral']];
  const nv = hw >= 6 ? 5 : 3 + (top >= 1 ? 1 : 0);
  for (let i = 0; i < nv; i++) {
    const vx = ox - hw + 1 + Math.round(i * ((hw * 2 - 2) / Math.max(1, nv - 1))), vc = vialCols[(i + (main === 2 ? 3 : main === 0 ? 1 : 0)) % 5];
    s.rect(vx, G - 5, 2, 3, vc[1]); s.px(vx, G - 5, vc[2]); s.px(vx, G - 6, 'white'); s.px(vx + 1, G - 3, vc[0]);
    if ((ph + i) % 4 === 0) front.px(vx, G - 8, vc[2]);
  }
  if (A >= 1 && main === 0) { flask(s, ox - hw - 3, G - 8, 3, ACID, ph); }
  if (A >= 2 && main === 0) { for (let x = ox - 4; x <= ox + 4; x++) { s.px(x, yB, (x + ox) % 2 ? 'yellow' : 'ink'); s.px(x, yB - 1, (x + ox) % 2 ? 'ink' : 'yellow'); } s.px(ox - 5, G - 8 + 1, 'leaf'); s.px(ox + 5, G - 9, 'yellow'); }
  // Bandolier (A4+, B4)
  if (main === 0 && A >= 4) { for (let i = 0; i < 9 + wg; i++) { const x = ox - hw + i, y = yT + 2 + Math.round(i * 0.8); s.px(x, y, 'bark'); if (i % 2 === 0) { s.px(x, y, 'orange'); s.px(x, y - 1, 'yellow'); } } s.rect(ox - hw - 2, yT, 3, 2, 'amber'); s.rect(ox + hw, yT, 3, 2, 'amber'); s.px(ox - hw - 2, yT, 'yellow'); s.px(ox + hw, yT, 'yellow'); }
  if (main === 0 && A >= 3) { for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 1), yT + 1, 3.4, 2.6, RAMPS.brass); s.px(ox + sg * (hw + 1) - 1, yT, 'white'); } }
  if (main === 0 && A >= 5) { s.rect(ox - hw, yT + 4, hw * 2 + 1, 2, 'yellow'); s.px(ox, yT + 5, 'white'); for (let i = 0; i < 4; i++) s.px(ox - 3 + i * 2, yT + 7, 'white'); }
  // B-Pfad Schulterpolster Metall, Rohre, Dampf
  if (main === 1 && B >= 3) for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 1), yT + 1, 3.2, 2.6, RAMPS.iron); s.px(ox + sg * (hw + 1) - 1, yT, 'silver'); }
  if (hulk) { for (const sg of [-1, 1]) { s.rect(ox + sg * (hw + 1) - 1, yT - 5, 3, 4, 'slate'); s.rect(ox + sg * (hw + 1) - 1, yT - 5, 3, 1, 'stone'); steam(front, ox + sg * (hw + 1), yT - 6, ph + (sg > 0 ? 2 : 0), 0.8); } }
  // C-Pfad Messing-Details
  if (main === 2 && C >= 3) { s.rect(ox - hw, yT + 4, hw * 2 + 1, 1, 'amber'); s.px(ox, yT + 4, 'yellow'); if (C >= 4) for (let i = 0; i < 4; i++) s.px(ox - 3 + i * 2, yT + 5, 'yellow'); }
  if (main === 2 && C >= 4) for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 1), yT + 1, 3.4, 2.6, RAMPS.gold); s.px(ox + sg * (hw + 1) - 1, yT, 'white'); }
  // Zweitpfad-Zusaetze (max. Stufe 2)
  if (main !== 0 && A >= 1) { s.px(ox + hw + 1, G - 9, 'leaf'); s.px(ox + hw + 2, G - 8, 'yellow'); if (A >= 2) { s.rect(ox - hw - 1, G - 12, 2, 3, 'amber'); s.px(ox - hw - 1, G - 12, 'yellow'); } }
  if (main !== 1 && B >= 1) { s.px(ox - hw - 1, yT + 3, 'leaf'); s.px(ox + hw + 1, yT + 5, 'leaf'); if (B >= 2) { s.rect(ox + hw, G - 11, 2, 4, 'plum'); s.px(ox + hw, G - 11, 'white'); } }
  if (main !== 2 && C >= 1) { s.rect(ox - hw - 3, G - 9, 3, 2, 'amber'); s.px(ox - hw - 3, G - 9, 'yellow'); if (C >= 2) { s.rect(ox - hw - 1, G - 4, 2, 3, 'leaf'); } }

  // ---------- Kopf ----------
  const hcx = ox, hcy = G - 15 - up, hb = gr >= 4 ? 1 : 0;
  const cap: Ramp = hulk ? HULK : ['plum', 'bark', 'wood'];
  s.ball(hcx, hcy, 6 + hb, 5.5 + hb, cap);
  s.rect(hcx - 6 - hb, hcy - 1, 13 + hb * 2, 1, 'plum');
  s.px(hcx - 5, hcy - 3, 'tan'); s.px(hcx - 4, hcy - 4, 'wood');
  // Haarbueschel / Zahnrad
  if (!hulk) { s.rect(hcx + 2, hcy - 8 - hb, 2, 3, 'orange'); s.px(hcx + 3, hcy - 9 - hb, 'yellow'); s.px(hcx + 4, hcy - 8 - hb, 'amber'); }
  else { for (const sg of [-1, 1]) { s.line(hcx + sg * 4, hcy - 4, hcx + sg * 6, hcy - 8, 'white'); s.px(hcx + sg * 6, hcy - 9, 'white'); } }
  const lensC: PalName = main === 1 && B >= 1 ? 'yellow' : main === 2 && C >= 3 ? 'yellow' : 'leaf';
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.5));
    const rx = d.eyes === 1 ? 2.6 : 3.7;
    s.ellipseFn(fx, fy + 1, rx, 3.2, (_x, _y, nx, ny) => (hulk ? ((-nx * 0.4 - ny * 0.7) > 0.3 ? 'leaf' : 'grass') : (-nx * 0.4 - ny * 0.7) > 0.3 ? 'peach' : 'skin'));
    const rim: PalName = main === 2 && C >= 3 ? 'yellow' : 'silver';
    const lens = (x: number, y: number, big = false): void => {
      s.ball(x + 0.5, y, big ? 2.9 : 2.4, big ? 2.9 : 2.4, ['dusk', 'stone', rim]);
      s.rect(x - (big ? 1 : 0), y - (big ? 1 : 0), big ? 3 : 2, big ? 3 : 2, hulk ? (ph % 2 ? 'red' : 'crimson') : lensC); s.px(x - (big ? 1 : 0), y - (big ? 1 : 0), 'white');
    };
    const big = main === 2 && C >= 5;
    if (d.eyes === 2) { lens(fx - 2, fy, big); lens(fx + 2, fy, big); s.px(fx, fy, 'ink'); s.px(fx - 1, fy + 3, 'tan'); s.px(fx, fy + 3, 'tan'); if (hulk) { s.px(fx - 2, fy + 3, 'white'); s.px(fx + 2, fy + 3, 'white'); s.rect(fx - 1, fy + 2, 3, 1, 'ink'); } }
    else { lens(fx, fy, big); }
    // Gummiband
    s.line(hcx - 6, fy, hcx - 4, fy, 'ink');
    // Gasmaske (B2..B4)
    if (main === 1 && B >= 2 && B < 5 && d.eyes === 2) { s.rect(fx - 3, fy + 2, 7, 4, 'dusk'); s.rect(fx - 3, fy + 2, 7, 1, 'stone'); s.ball(fx - 3, fy + 4, 1.8, 1.8, ['slate', 'stone', 'silver']); s.ball(fx + 4, fy + 4, 1.8, 1.8, ['slate', 'stone', 'silver']); if (ph % 2) front.px(fx + 6, fy + 1, 'leaf'); }
    else if (main === 1 && B >= 2 && B < 5) { s.rect(fx - 1, fy + 2, 4, 4, 'dusk'); s.ball(fx + 1, fy + 4, 1.8, 1.8, ['slate', 'stone', 'silver']); }
  } else {
    s.line(hcx - 6, hcy + 1, hcx + 6, hcy + 1, 'ink');
    s.px(hcx - 4, hcy + 2, 'silver'); s.px(hcx + 4, hcy + 2, 'silver');
  }
  // Brille auf der Stirn (Hulk) / Zusatzlinse (A4+)
  if (main === 0 && A >= 4) { s.ball(hcx - 3, hcy - 5, 2, 2, ['rust', 'amber', 'yellow']); s.ball(hcx + 1, hcy - 5, 2, 2, ['rust', 'amber', 'yellow']); }
  if (main === 0 && A >= 5) { // goldener Heiligenschein aus Blasen
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + ph * 0.3; front.px(hcx + Math.cos(a) * 8, hcy - 11 + Math.sin(a) * 2.5, i % 2 ? 'yellow' : 'white'); }
  }

  if (!behind) muzzle = drawArmAndFlask();

  // ---------- Effekte: Dampf, Blasen, Stufe-5-Besonderheiten ----------
  if (main === 0 && A >= 5) {
    // schwebender goldener Riesentrank ueber der Schulter
    const gx = ox - 14 - wg, gy = yT - 16 - ((ph >> 1) & 1);
    flask(s, gx, gy, 6, ['rust', 'amber', 'yellow'], ph, { cork: 'yellow' });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + ph * 0.7; front.px(gx + Math.cos(a) * 9, gy + Math.sin(a) * 9, i % 2 ? 'yellow' : 'white'); }
  }
  if (main === 2 && C >= 5) {
    // Schrumpfpfeile: vier Pfeile zeigen nach innen
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; const r = 15 - ph * 1.5; const px = ox + Math.cos(a) * r, py = yT + 4 + Math.sin(a) * r * 0.8; front.line(px, py, px - Math.cos(a) * 3, py - Math.sin(a) * 3, 'coral'); front.px(px - Math.cos(a) * 4, py - Math.sin(a) * 4, 'white'); }
    const gx = ox - 15 - wg, gy = yT - 12 - ((ph >> 1) & 1);
    flask(s, gx, gy, 5, ['violet', 'orchid', 'ice'], ph);
    flask(s, gx + 8, gy + 4, 2, ['violet', 'orchid', 'ice'], ph);
    spark(front, gx - 6, gy - 2, 'white', ph % 2 === 0);
  }
  if (main === 2 && C >= 4) for (let i = 0; i < 6; i++) { const x = ox - 12 + ((ph * 4 + i * 7) % 26), y = yT + 14 - ((ph * 3 + i * 5) % 22); front.px(x, y, i % 2 ? 'yellow' : 'white'); }
  if (main === 0 && A >= 4) for (let i = 0; i < 6; i++) { const x = ox - 11 + ((i * 5 + ph) % 22), y = G - 3 - ((ph * 4 + i * 6) % 24); front.px(x, y, i % 2 ? 'orange' : 'yellow'); }
  if (main === 1 && B >= 3) { front.px(ox + hw + 4, yT - 4 - (ph % 3), 'stone'); steam(front, ox - 5, yT - 3, ph); }
  if (main === 1 && B >= 1 && B < 3) for (let i = 0; i < 3; i++) { const yy = G - 4 - ((ph * 3 + i * 5) % 12); front.px(hand[0] - 2 + i * 2, yy, i % 2 ? 'leaf' : 'yellow'); front.px(hand[0] - 2 + i * 2, yy + 1, 'grass'); }
  if (main === 2 && C >= 1) for (const y of [-1, 2]) front.line(hand[0] + 3 + (p.flash ? 0 : 3), hand[1] + y * 2, hand[0] + 9 + (p.flash ? 0 : 3), hand[1] + y * 2, 'white');
  steam(front, ox + 6 + wg, G - 12 - up - (main === 0 && A >= 1 ? 4 : 0) - 4, ph, 0.7);
  void gr;
  return { fig: s, back, front, muzzle: [Math.round(muzzle[0]), Math.round(muzzle[1])] };
}

/** Handposition (Wurfhand) je Pose: Idle auf Brusthoehe, Ausholen hinter den Kopf, Wurf nach vorn. */
function handPos(ox: number, yT: number, G: number, up: number, wg: number, d: Dir, p: Pose): [number, number] {
  const idle: [number, number] = [ox + 7 + wg + Math.round(d.ux * 1), G - 12 - up + Math.round(d.uy * 2)];
  const sw = (a: number): number => a;
  if (p.ai < 0) return idle;
  switch (p.ai) {
    case 0: return [ox + 4 - Math.round(d.ux * 3), yT - 3];
    case 1: return [ox + 2 - Math.round(d.ux * 5) + 1, yT - 8];
    case 2: return [ox + 8 + Math.round(d.ux * 8) + wg, yT + 1 + Math.round(d.uy * 7)];
    default: return [ox + 8 + wg + sw(Math.round(d.ux * 3)), yT + 3 + Math.round(d.uy * 3)];
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Monster-Form (Transforming Tonic): eigenes grosses Sprite, 8 Richtungen ueber dirOf, Idle 4 + Angriff 4 Frames.
// ---------------------------------------------------------------------------------------------------------------------
export const MONSTER_W = 84;
export const MONSTER_H = 76;
export const MONSTER_AX = 42;
export const MONSTER_AY = 70;

export function drawMonster(d: Dir, p: Pose): { fig: Surface; back: Surface; front: Surface } {
  const s = new Surface(MONSTER_W, MONSTER_H), back = new Surface(MONSTER_W, MONSTER_H), front = new Surface(MONSTER_W, MONSTER_H);
  const ox = MONSTER_AX, G = MONSTER_AY, ph = p.ph;
  const br = [0, 0, 1, 1][ph & 3];
  const coat: Ramp = ['plum', 'violet', 'orchid'];
  const atk = p.ai;
  const fx = d.ux;
  // Bottiche am Ruecken
  back.box(ox - 17, G - 40 - br, 9, 15, ['pine', 'grass', 'leaf']); back.box(ox + 9, G - 38 - br, 8, 13, ['night', 'violet', 'orchid']);
  back.rect(ox - 17, G - 35 - br, 9, 1, 'pine'); back.rect(ox + 9, G - 33 - br, 8, 1, 'night');
  back.line(ox - 12, G - 40 - br, ox - 5, G - 44 - br, 'silver'); back.line(ox + 13, G - 38 - br, ox + 6, G - 43 - br, 'silver');
  back.px(ox - 14, G - 37 - br, 'white'); back.px(ox + 11, G - 35 - br, 'white');
  for (let i = 0; i < 3; i++) { back.px(ox - 14 + i * 2, G - 42 - br - ((ph + i) & 1), i % 2 ? 'ice' : 'white'); }
  // Beine
  for (const sg of [-1, 1]) {
    const lx = ox + sg * 9;
    s.box(lx - 5, G - 12, 10, 12, HULK); s.rect(lx - 5, G - 4, 10, 4, 'plum'); s.rect(lx - 5, G - 4, 10, 1, 'bark');
    s.px(lx - 4, G - 11, 'white');
    for (let i = 0; i < 3; i++) s.px(lx - 3 + i * 3, G, 'ink');
  }
  // Rumpf
  const yT = G - 40 - br;
  s.ellipseFn(ox, G - 24 - br / 2, 21, 17, (_x, _y, nx, ny) => (-nx * 0.5 - ny * 0.7 > 0.35 ? HULK[2] : -nx * 0.5 - ny * 0.7 > -0.35 ? HULK[1] : HULK[0]));
  // Muskeln
  s.line(ox, yT + 8, ox, yT + 24, 'pine'); s.line(ox - 9, yT + 14, ox - 3, yT + 16, 'pine'); s.line(ox + 9, yT + 14, ox + 3, yT + 16, 'pine');
  for (let i = 0; i < 3; i++) { s.px(ox - 10 + i * 4, yT + 22, 'pine'); }
  // zerfetzte Weste
  s.poly([[ox - 14, yT + 6], [ox - 4, yT + 4], [ox - 5, yT + 22], [ox - 9, yT + 27], [ox - 12, yT + 20], [ox - 17, yT + 24]], (x, y) => (x < ox - 10 ? coat[2] : coat[1]));
  s.poly([[ox + 14, yT + 6], [ox + 5, yT + 4], [ox + 6, yT + 20], [ox + 10, yT + 25], [ox + 13, yT + 18], [ox + 17, yT + 22]], (x) => (x > ox + 11 ? coat[0] : coat[1]));
  s.rect(ox - 20, G - 20, 41, 3, 'bark'); s.rect(ox - 20, G - 20, 41, 1, 'wood'); s.rect(ox - 3, G - 21, 6, 5, 'amber'); s.px(ox - 2, G - 20, 'yellow');
  // Schulterpanzer
  for (const sg of [-1, 1]) { s.ball(ox + sg * 20, yT + 7, 7, 5.4, RAMPS.iron); s.px(ox + sg * 20 - 3, yT + 5, 'silver'); s.px(ox + sg * 20 + 3, yT + 8, 'slate'); for (const dx of [-3, 0, 3]) s.px(ox + sg * 20 + dx, yT + 2, 'white'); }
  // Arme
  const sh1: [number, number] = [ox - 20, yT + 9], sh2: [number, number] = [ox + 20, yT + 9];
  const fistFront: [number, number][] = [
    [ox + 24 + fx * 2, G - 18], [ox + 26 + fx * 4, G - 22], [ox + 30 + fx * 8, G - 19], [ox + 26 + fx * 5, G - 15],
  ];
  const fistL: [number, number] = atk >= 0 ? [ox - 24, G - 26 + (atk === 1 ? 4 : 0)] : [ox - 23, G - 18 + br];
  const fistR: [number, number] = atk >= 0 ? (atk === 0 ? [ox + 26, G - 52] : atk === 1 ? [ox + 24, G - 56] : atk === 2 ? [ox + 26 + fx * 10, G - 8 + (d.uy > 0 ? 2 : 0)] : fistFront[3]) : [ox + 24, G - 17 + br];
  tube(s, sh1[0], sh1[1], fistL[0], fistL[1], 9, HULK); s.ball(fistL[0], fistL[1], 5, 4.6, HULK);
  tube(s, sh2[0], sh2[1], fistR[0], fistR[1], 9, HULK); s.ball(fistR[0], fistR[1], 5.6, 5, HULK);
  for (const [fxp, fyp] of [fistL, fistR]) { s.line(fxp - 3, fyp + 1, fxp + 3, fyp + 1, 'pine'); s.px(fxp - 1, fyp - 2, 'white'); }
  // Kopf
  const hy = yT - 2;
  s.ball(ox, hy, 10, 8.6, ['pine', 'grass', 'leaf']);
  if (d.eyes > 0) {
    const ex = d.eyes === 1 ? 4 : Math.round(d.ex * 1.5), ey = d.eyes === 1 ? -1 : Math.round(d.ey);
    const ec: PalName = ph % 2 ? 'red' : 'crimson';
    for (const sg of [-1, 1]) { const x = ox + ex + sg * 4 + (d.eyes === 1 ? 2 : 0) - 1; s.rect(x - 1, (hy + ey) - 3, 4, 3, 'ink'); s.rect(x, (hy + ey) - 2, 2, 2, ec); s.px(x, (hy + ey) - 2, 'white'); s.line(x - 2, (hy + ey) - 5 + (sg > 0 ? 1 : 0), x + 3, (hy + ey) - 4 - (sg > 0 ? 0 : 1), 'pine'); }
    s.rect(ox + ex - 5, (hy + ey) + 3, 11, 3, 'ink'); for (let i = 0; i < 4; i++) s.px(ox + ex - 4 + i * 3, (hy + ey) + 3, 'white');
    s.px(ox + ex - 6, (hy + ey) + 2, 'white'); s.px(ox + ex + 6, (hy + ey) + 2, 'white'); s.px(ox + ex - 6, (hy + ey) + 1, 'sand'); s.px(ox + ex + 6, (hy + ey) + 1, 'sand');
  } else { s.line(ox - 8, hy - 2, ox + 8, hy - 2, 'pine'); }
  // Schutzbrille auf der Stirn
  s.rect(ox - 9, hy - 8, 19, 2, 'bark'); s.ball(ox - 4, hy - 8, 3, 2.6, ['dusk', 'stone', 'silver']); s.ball(ox + 4, hy - 8, 3, 2.6, ['dusk', 'stone', 'silver']); s.rect(ox - 5, hy - 9, 2, 2, 'leaf'); s.rect(ox + 3, hy - 9, 2, 2, 'leaf'); s.px(ox - 5, hy - 9, 'white');
  s.rect(ox + 6, hy - 14, 2, 4, 'orange'); s.px(ox + 7, hy - 15, 'yellow');
  // Angriff: Staubring bei Schlag
  if (p.flash) { for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; front.px(ox + 14 + fx * 8 + Math.cos(a) * 12, G + 1 + Math.sin(a) * 3, i % 2 ? 'sand' : 'tan'); } for (let i = 0; i < 6; i++) spark(front, ox + 20 + fx * 8 + (i - 3) * 4, G - 6 - (i % 3) * 3, i % 2 ? 'white' : 'yellow'); }
  // Dampf ueber den Bottichen, Bodenstaub
  steam(front, ox - 12, G - 44 - br, ph, 1.1); steam(front, ox + 13, G - 42 - br, ph + 2, 1);
  for (let i = 0; i < 4; i++) front.px(ox - 14 + ((ph * 6 + i * 9) % 30), G - 2 - ((ph + i) & 1), 'tan');
  return { fig: s, back, front };
}
