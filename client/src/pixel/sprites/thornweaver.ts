/**
 * Thornweaver (Runde 14): Natur-Druide der Lanternfolk. Blaetterumhang, Zweig-/Geweihkrone, Stab mit Knospe. Keine Plattform.
 * A Storm:  Dornen -> Herz aus Donner (Funken) -> Tempest (Gewitterwolke, graublauer Umhang) -> Storm Mother (Blitzgeweih, Blitzaugen)
 *           -> Avatar of Wrath (Sturm-Avatar: Wolkenfluegel, Blitzkrone, Blitzbogen zwischen den Haenden).
 * B Wild:   Dornenkranz -> Ranken am Stab und an den Fuessen -> Wall of Trees (Baum waechst hinter ihm) -> Waldgeist-Begleiter
 *           -> World Tree (riesige Baumkrone, goldene Fruechte, Wurzelring).
 * C Grove:  lange Reichweite -> Kraeuterbeutel + gruenes Erkennungsauge -> Obstkorb (Gold) -> Fruehlingsbluete (Bluetenaura)
 *           -> Grove Guardian (Rindenruestung, Moos, Bluetenstab).
 * Stufe 3 = neue Silhouette, 4 = Ruestung/Leuchten, 5 = Verwandlung. Haltung/Blick wie die anderen Tuerme (8 Richtungen, Idle 4, Angriff 4).
 */
import type { PalName } from '../palette';
import { drawArm } from './bows';
import { growOf, mainPath, widthOf } from './gear';
import { cloud, spark } from './parts';
import type { Dir, Pose } from './pose';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { bolt } from './parts';
import { irnd, RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';

/** Blatt: Fuss (x, y), Richtung `ang` (Bogenmass, y nach unten), Laenge `len`. Licht oben links. */
export function leafAt(s: Surface, x: number, y: number, ang: number, len: number, ramp: Ramp): void {
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const w = Math.max(1, len * 0.36);
  const P = (t: number, o: number): [number, number] => [x + ux * len * t + nx * w * o, y + uy * len * t + ny * w * o];
  const pts = [P(0, 0), P(0.45, 1), P(1, 0), P(0.45, -1)];
  const lit = nx * -0.55 + ny * -0.75 > 0 ? 1 : -1;
  s.poly(pts, (px, py) => ((px + 0.5 - x) * nx + (py + 0.5 - y) * ny) * lit > 0 ? ramp[2] : ramp[1]);
  if (len >= 5) s.line(x, y, x + ux * len * 0.85, y + uy * len * 0.85, ramp[0]);
  s.px(x + ux * len, y + uy * len, ramp[0]);
}

/** Zweig, der nach aussen (sgn) und oben waechst, mit Zinken (Geweih). */
export function antler(s: Surface, x: number, y: number, sgn: number, size: number, ramp: Ramp, tip: PalName | null, tines = 2): void {
  const ex = x + sgn * (3 + size * 0.7), ey = y - (5 + size * 1.5);
  s.curve(x, y, x + sgn * 1, y - (3 + size), ex, ey, ramp[1], 1);
  s.curve(x + sgn * 0.0, y - 1, x + sgn * 1, y - (3 + size) - 1, ex - sgn * 0, ey, ramp[2], 1);
  for (let i = 0; i < tines; i++) {
    const f = 0.35 + i * (0.45 / Math.max(1, tines - 1 || 1));
    const bx = x + (ex - x) * f * 0.9 + sgn * 0.5, by = y + (ey - y) * f;
    const len = 2 + size * 0.45 - i * 0.4;
    const tx = bx + sgn * len, ty = by - len * 1.1;
    s.line(bx, by, tx, ty, ramp[1]);
    if (tip) s.px(tx, ty - 1, tip);
  }
  if (tip) s.px(ex, ey - 1, tip);
}

interface Look { robe: Ramp; mantle: Ramp; hood: Ramp; trim: PalName; glow: PalName; wood: Ramp }
function lookOf(t: Tiers, main: number): Look {
  const top = t[main];
  const L: Look = { robe: ['pine', 'grass', 'leaf'], mantle: ['grass', 'leaf', 'yellow'], hood: ['pine', 'grass', 'leaf'], trim: 'tan', glow: 'leaf', wood: RAMPS.wood };
  if (main === 0 && top >= 3) { L.robe = top >= 5 ? ['night', 'dusk', 'slate'] : ['night', 'dusk', 'slate']; L.mantle = top >= 5 ? ['slate', 'stone', 'silver'] : ['dusk', 'slate', 'stone']; L.hood = L.mantle; L.trim = 'yellow'; L.glow = 'yellow'; }
  else if (main === 0 && top >= 2) L.glow = 'yellow';
  if (main === 1 && top >= 3) { L.robe = top >= 5 ? ['plum', 'bark', 'wood'] : ['plum', 'bark', 'wood']; L.mantle = ['grass', 'leaf', 'yellow']; L.hood = ['deep', 'pine', 'grass']; L.glow = top >= 5 ? 'yellow' : 'leaf'; }
  if (main === 2 && top >= 3) { L.mantle = ['rust', 'amber', 'yellow']; L.trim = 'yellow'; L.glow = 'amber'; }
  if (main === 2 && top >= 5) { L.robe = ['plum', 'bark', 'wood']; L.mantle = ['slate', 'stone', 'silver']; L.hood = ['bark', 'wood', 'tan']; L.glow = 'amber'; }
  return L;
}

export function drawThornweaver(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C), main = mainPath(t);
  const gr = growOf(top), wg = widthOf(top);
  const up = p.up + gr;
  const G = GY, ox = OX, ph = p.ph;
  const L = lookOf(t, main);
  const rnd = irnd(11 + A * 3 + B * 7 + C * 13);
  const yT = G - 10 - up, yB = G - 1;
  const hcx = ox, hcy = G - 15 - up;
  const sway = [0, 1, 0, -1][ph];

  // ---------- Boden und Hintergrund ----------
  // Wurzelring (B5), Bluetenring (C4/C5), Blitzring (A5)
  if (top >= 5) {
    const ringCol: [PalName, PalName] = main === 0 ? ['yellow', 'ice'] : main === 1 ? ['yellow', 'leaf'] : ['coral', 'amber'];
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + ph * 0.1;
      if ((i + ph) % 4 === 3) continue;
      back.pxUnder(ox + Math.cos(a) * 19, OY + Math.sin(a) * 5, i % 2 ? ringCol[0] : ringCol[1]);
    }
    if (main === 1) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.4; const rx = ox + Math.cos(a) * 9, ry = OY + Math.sin(a) * 3; back.line(ox + Math.cos(a) * 3, OY - 1, rx + Math.cos(a) * 9, ry + 1, 'bark', 2); back.line(ox + Math.cos(a) * 3, OY - 2, rx + Math.cos(a) * 9, ry, 'wood', 1); }
  }
  // Wolkenfluegel hinter dem Rumpf (A5)
  if (main === 0 && A >= 5) {
    for (const sg of [-1, 1]) {
      cloud(back, ox + sg * 18, yT + 6 + (ph & 1), 16, true, ph + (sg > 0 ? 2 : 0));
      cloud(back, ox + sg * 12, yT + 14, 11, true, ph);
    }
    for (let k = 0; k < 4; k++) bolt(back, ox + (k % 2 ? 1 : -1) * (12 + k * 2), yT + 6, ox + (k % 2 ? 1 : -1) * (14 + k * 3), yT + 18 + (k * 2), 5 + k + ph * 3, 'white', 'yellow');
  }
  // Baum hinter ihm (B3+): Stamm und Krone, ab B5 gewaltig (siehe Krone)
  if (main === 1 && B >= 3 && B < 5) {
    const tx = ox - 9 - wg;
    back.rect(tx, G - 30 - up, 4, 30 + up, 'bark'); back.rect(tx, G - 30 - up, 1, 30 + up, 'wood'); back.rect(tx + 3, G - 30 - up, 1, 30 + up, 'plum');
    back.line(tx, G - 2, tx - 4, G + 1, 'bark', 2); back.line(tx + 3, G - 2, tx + 8, G + 1, 'bark', 2);
    const cy = G - 34 - up;
    for (const [dx, dy, r] of [[-4, 3, 5], [4, 1, 6], [0, -3, 6], [-8, -1, 4], [8, 4, 4]] as [number, number, number][]) back.ball(tx + 2 + dx, cy + dy, r, r * 0.85, ['pine', 'grass', 'leaf']);
    for (let i = 0; i < 6; i++) back.px(tx + 2 - 7 + ((i * 5 + ph) % 14), cy - 3 + ((i * 3) % 7), i % 2 ? 'leaf' : 'deep');
  }
  // Obstkorb (C3+) neben den Fuessen
  if (C >= 3) {
    const kx = ox + 10 + wg;
    s.box(kx, G - 5, 9, 6, RAMPS.wood);
    for (let i = 0; i < 4; i++) s.px(kx + 1 + i * 2, G - 3, 'bark'); s.rect(kx, G - 2, 9, 1, 'bark');
    const fruit: [number, number, PalName[]][] = [[2, -8, ['crimson', 'red', 'coral']], [5, -9, ['rust', 'orange', 'amber']], [8, -8, ['clay', 'amber', 'yellow']], [4, -6, ['pine', 'leaf', 'white']]];
    for (const [dx, dy, r] of fruit) { s.ball(kx + dx, G + dy + 3, 2.2, 2.2, r as unknown as Ramp); s.px(kx + dx - 1, G + dy + 2, 'white'); }
    if (C >= 3) { coin(s, kx + 9, G - 8, ph); }
    if (ph % 2 === 0) spark(front, kx + 3, G - 13, 'yellow');
  }
  // Waldgeist (B4+): schwebender Begleiter
  if (main === 1 && B >= 4) {
    const gx = ox - 17 - wg, gy = G - 24 - up - ((ph >> 1) & 1) * 1 + (B >= 5 ? 0 : 0);
    const gr2: Ramp = ['sky', 'ice', 'white'];
    s.ball(gx, gy, 5, 6, ['grass', 'leaf', 'white']);
    s.px(gx - 2, gy, 'ink'); s.px(gx + 1, gy, 'ink'); s.px(gx - 2, gy - 1, 'white');
    s.rect(gx - 1, gy + 2, 3, 1, 'deep');
    antler(s, gx - 2, gy - 4, -1, 1.5, ['bark', 'wood', 'tan'], 'yellow', 1); antler(s, gx + 2, gy - 4, 1, 1.5, ['bark', 'wood', 'tan'], 'yellow', 1);
    for (let i = 0; i < 4; i++) back.px(gx - 3 + i * 2 + (sway), gy + 7 + (i & 1) * 2, gr2[i % 3]);
    back.px(gx, gy + 9, 'ice');
    if (ph % 2) spark(front, gx + 6, gy - 5, 'white'); else spark(front, gx - 7, gy + 1, 'ice');
  }
  // Kleine Wolke ueber dem Kopf (A3+) und Blitzspiel
  if (main === 0 && A >= 3 && A < 5) {
    const w = A >= 4 ? 24 : 16;
    cloud(s, hcx + sway, hcy - (A >= 4 ? 16 : 12) - 2 * (A >= 4 ? 1 : 0) - up * 0, w, true, ph);
    if (A >= 4) { cloud(s, hcx - 9 + sway, hcy - 11, 10, true, ph + 1); }
    // Blitzzucken aus der Wolke zur Stabspitze (spaeter)
  }

  // ---------- Stab ----------
  const reach = C >= 1 ? 1.35 : 1;
  const hand: [number, number] = [ox + 6 + wg + Math.round(d.ux * 2), G - 8 - up + Math.round(d.uy * 2)];
  const k = p.ai < 0 ? 0.45 : [-0.25, -0.4, 1, 0.65][p.ai];
  let vx = d.ux * k, vy = d.uy * k * 0.8 - (1 - Math.max(0, k)) * 1;
  const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
  const len = Math.round(17 * reach) + (top >= 4 ? 3 : 0);
  const topP: [number, number] = [hand[0] + vx * len, hand[1] + vy * len];
  const butt: [number, number] = [hand[0] - vx * 8, hand[1] - vy * 8];
  const staff = (): void => {
    const w = top >= 5 && main === 2 ? 3 : 2;
    s.line(butt[0], butt[1], topP[0], topP[1], L.wood[1], w);
    s.line(butt[0] - 1, butt[1], topP[0] - 1, topP[1], L.wood[2], 1);
    s.line(butt[0] + w - 1, butt[1], topP[0] + w - 1, topP[1], L.wood[0], 1);
    // Knoten am Stab
    const nodeX = hand[0] + vx * 8, nodeY = hand[1] + vy * 8;
    s.px(nodeX + 1, nodeY, L.wood[0]);
    // A1+: Dornen am Stab
    if (A >= 1 && main !== 0 || (main === 0 && A >= 1)) for (let i = 1; i <= 3; i++) { const bx = hand[0] + vx * (2 + i * 4), by = hand[1] + vy * (2 + i * 4); s.px(bx + 2 * (i % 2 ? 1 : -1) + (i % 2 ? 1 : 0), by - 1, 'white'); s.px(bx + (i % 2 ? 3 : -2), by - 2, 'silver'); }
    // B2+: Ranken spiralen um den Stab
    if (B >= 2) for (let i = 0; i < 7; i++) { const bx = hand[0] + vx * (i * 3 - 5), by = hand[1] + vy * (i * 3 - 5); s.px(bx + (i % 2 ? 2 : -1), by, 'leaf'); s.px(bx + (i % 2 ? 1 : 0), by + 1, 'grass'); }
    // C1+: Blattband und Reichweiten-Knoten
    if (C >= 1) for (let i = 0; i < 3; i++) { const bx = hand[0] + vx * (i * 5 + 3), by = hand[1] + vy * (i * 5 + 3); s.rect(Math.round(bx) - 1, Math.round(by), 4, 1, 'leaf'); s.px(bx + 3, by + 1, 'grass'); }
    // C2: Kraeuterbuendel am Stab
    if (C >= 2) { const bx = hand[0] + vx * 2, by = hand[1] + vy * 2; for (let i = 0; i < 3; i++) leafAt(s, bx + 1, by + 1, 1.2 + i * 0.5, 4, ['pine', 'leaf', 'white']); s.px(bx + 1, by, 'coral'); }
    // C3: Obst am Stab
    if (C >= 3) { const bx = hand[0] + vx * 12, by = hand[1] + vy * 12; s.ball(bx + 3, by + 2, 2, 2, ['crimson', 'red', 'coral']); s.ball(bx - 3, by + 4, 1.8, 1.8, ['rust', 'orange', 'amber']); }
  };
  const tip = (): void => drawTip(s, front, back, t, main, topP[0], topP[1], vx, vy, ph, p.flash, L);
  const armBehind = d.behind;
  if (armBehind) { staff(); tip(); }

  // ---------- Rumpf ----------
  s.rect(ox - 4, G - 1, 3, 2, 'bark'); s.rect(ox + 1, G - 1, 3, 2, 'bark');
  if (B >= 1 && main !== 1) { s.px(ox - 5, G - 1, 'leaf'); s.px(ox + 4, G - 1, 'leaf'); }
  if (main === 2 && C >= 5) { for (const sg of [-1, 1]) { s.rect(ox + sg * 3 - (sg < 0 ? 2 : 0), G - 3, 3, 3, 'wood'); s.rect(ox + sg * 3 - (sg < 0 ? 2 : 0), G - 3, 3, 1, 'tan'); } }
  const hw = 4 + wg;
  s.poly([[ox - hw, yT], [ox + hw, yT], [ox + hw + 1, yB], [ox - hw - 1, yB]], (x, y) => (x <= ox - hw && y < yB - 1 ? L.robe[2] : x >= ox + hw - 1 ? L.robe[0] : y <= yT ? L.robe[2] : L.robe[1]));
  // Blaetter-Saum
  for (let i = -hw - 1, n = 0; i <= hw + 1; i += 2, n++) {
    leafAt(s, ox + i, yB - 1, Math.PI / 2 + (n % 2 ? 0.45 : -0.45) + sway * 0.15, 3 + (n % 2), main === 1 && B >= 3 ? ['pine', 'grass', 'leaf'] : L.robe[1] === 'pine' ? ['deep', 'pine', 'grass'] : L.mantle);
  }
  // Guertel aus Ranke mit Bluete
  s.rect(ox - hw, G - 5, hw * 2 + 1, 1, 'bark'); s.px(ox, G - 5, main === 2 ? 'coral' : main === 0 && A >= 2 ? 'yellow' : 'amber');
  if (C >= 2 || A >= 1 || B >= 1) { for (let i = 0; i < 3; i++) s.px(ox - 3 + i * 3, G - 4, i === 1 ? 'tan' : 'leaf'); }
  // Brustzier je Pfad
  drawChest(s, front, t, main, ox, yT, wg, ph, L);
  // Schultermantel aus Blaettern
  const rows = top >= 4 ? 2 : 1;
  for (let r = 0; r < rows; r++) for (let i = -hw - 1; i <= hw + 1; i += 2) {
    const ang = Math.PI / 2 + (i / (hw + 2)) * 0.9;
    leafAt(s, ox + i, yT - 1 + r * 3, ang, 4 + (r === 0 ? 1 : 0) + (top >= 3 ? 1 : 0), r ? L.robe[2] === 'grass' ? L.mantle : L.mantle : L.mantle);
  }
  if (top >= 3) for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 2), yT + 1, 3.4, 2.8, L.mantle); s.px(ox + sg * (hw + 2) - 1, yT, 'white'); if (top >= 4) { const tipc = sg > 0 ? 1 : -1; leafAt(s, ox + sg * (hw + 3), yT - 1, -Math.PI / 2 + tipc * 0.7, 6 + (top >= 5 ? 3 : 0), L.mantle); } }
  // Rindenruestung (C4/C5) und Moos
  if (main === 2 && C >= 4) drawBarkArmor(s, ox, yT, G, wg, C, ph);
  if (main === 1 && B >= 4) for (const sg of [-1, 1]) { s.rect(ox + sg * (hw - 1) - 1, yT + 4, 3, 5, 'bark'); s.rect(ox + sg * (hw - 1) - 1, yT + 4, 3, 1, 'wood'); s.px(ox + sg * (hw - 1), yT + 5, 'leaf'); }
  // Zweitpfad: kleine Zusaetze
  sideGear(s, front, back, t, main, ox, yT, G, wg, ph);

  // ---------- Kopf ----------
  const hb = gr >= 4 ? 1 : 0;
  // Blatt-Kapuze
  s.ball(hcx, hcy, 6 + hb, 5.5 + hb, L.hood);
  for (const sg of [-1, 1]) { leafAt(s, hcx + sg * 5, hcy - 3, -Math.PI / 2 + sg * 1.0, 5, L.hood); leafAt(s, hcx + sg * 6, hcy, sg > 0 ? -0.35 : Math.PI + 0.35, 4, L.hood); }
  leafAt(s, hcx, hcy - 5, -Math.PI / 2, 5, L.hood);
  drawCrown(s, back, front, t, main, hcx, hcy, ph, L, hb);
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.5));
    const rx = d.eyes === 1 ? 2.6 : 3.7;
    s.ellipseFn(fx, fy, rx, 3.2, (_x, _y, nx, ny) => ((-nx * 0.4 - ny * 0.7) > 0.3 ? 'peach' : 'skin'));
    const glowEye = (main === 0 && A >= 4) || (main === 1 && B >= 5) || (main === 2 && C >= 5);
    const ec: PalName = glowEye ? (main === 0 ? (ph % 2 ? 'white' : 'yellow') : 'amber') : 'ink';
    const eye = (x: number): void => { s.rect(x, fy - 1, 2, 2, ec); if (!glowEye) s.px(x, fy - 1, 'white'); else s.px(x, fy - 2, ec); };
    if (d.eyes === 2) { eye(fx - 2); eye(fx + 1); s.px(fx - 3, fy + 1, 'coral'); s.px(fx + 3, fy + 1, 'coral'); s.px(fx, fy + 2, 'tan'); }
    else eye(fx);
    if (C >= 2 && main !== 2 || C >= 2) { s.px(fx + (d.eyes === 2 ? 0 : 0), fy - 3, ph % 2 ? 'white' : 'leaf'); s.px(fx + 1, fy - 3, 'leaf'); }
    if (main === 0 && A >= 5 && d.eyes === 2) { s.line(fx - 5, fy - 1, fx - 8, fy - 3 - (ph & 1), 'yellow'); s.line(fx + 4, fy - 1, fx + 7, fy - 3 - (ph & 1), 'yellow'); }
  }

  // ---------- Arm, Stab vorn ----------
  if (!armBehind) {
    staff();
    drawArm(s, { sx: ox + 3, sy: yT + 2, hx: hand[0], hy: hand[1], sleeve: 'grass', skin: 'skin', roll: 1 });
    tip();
  } else drawArm(s, { sx: ox + 3, sy: yT + 2, hx: hand[0], hy: hand[1], sleeve: 'grass', skin: 'skin', roll: 1 });
  // zweite Hand (A5): Blitzbogen zwischen den Haenden
  if (main === 0 && A >= 5) { const x2 = ox - 6 - wg; s.rect(x2, yT + 6, 2, 2, 'skin'); bolt(front, x2 + 1, yT + 7, hand[0], hand[1] - 1, 3 + ph * 5, 'white', 'yellow'); }

  // ---------- Idle: Blaetter wehen, Glueh-wuermchen ----------
  for (let i = 0; i < 3; i++) {
    const a = ((i + ph / 4) / 3) * Math.PI * 2;
    const lx = ox + Math.cos(a) * (13 + wg), ly = G - 20 - up + Math.sin(a) * 6 - (i * 3);
    leafAt(front, lx, ly, a + 1.5 + ph * 0.8, 3, main === 2 && C >= 4 ? ['rust', 'coral', 'white'] : ['pine', 'grass', 'leaf']);
  }
  for (let i = 0; i < 4; i++) {
    const fxp = ox - 18 + Math.floor(rnd() * 36), fyp = G - 4 - Math.floor(rnd() * 34 + up);
    const on = (ph + i) % 4 < 2;
    front.px(fxp + (on ? 0 : 1), fyp + sway, on ? 'yellow' : 'amber');
    if (on) front.px(fxp + 1, fyp + sway, 'orange');
  }
  void back;
  return { fig: s, back, front, muzzle: [Math.round(topP[0]), Math.round(topP[1]) - 2] };
}

function coin(s: Surface, x: number, y: number, ph: number): void {
  const w = [2.2, 1.4, 0.8, 1.4][ph & 3];
  s.ellipseFn(x, y, w, 2.4, (_x, _y, nx, ny) => (-nx * 0.5 - ny * 0.7 > 0.2 ? 'yellow' : 'amber'));
}

/** Spitze des Stabs: Knospe, Funkenkugel, Beere, Blume ... */
function drawTip(s: Surface, front: Surface, back: Surface, t: Tiers, main: number, x: number, y: number, vx: number, vy: number, ph: number, flash: boolean, L: Look): void {
  const [A, B, C] = t, top = t[main];
  x = Math.round(x); y = Math.round(y);
  void back;
  if (main === 0 && top >= 3) {
    // Sturmkugel
    const r = top >= 5 ? 4 : top >= 4 ? 3.4 : 2.8;
    s.ball(x, y - 1, r, r, ['dusk', 'sky', 'ice']);
    if (top >= 4) s.ball(x, y - 1, r - 1.5, r - 1.5, ['sky', 'ice', 'white']);
    s.px(x - 1, y - 2, 'white');
    for (let i = 0; i < 3 + top; i++) { const a = (i / (3 + top)) * Math.PI * 2 + ph * 1.7; front.px(x + Math.cos(a) * (r + 2), y - 1 + Math.sin(a) * (r + 2), i % 2 ? 'yellow' : 'white'); }
    if (top >= 5) { bolt(front, x, y - 3, x - 5, y - 10, 21 + ph, 'white', 'yellow'); bolt(front, x, y - 3, x + 5, y - 9, 33 + ph, 'white', 'yellow'); }
    return;
  }
  if (main === 0 && top === 2) { s.ball(x, y - 1, 2.6, 2.6, ['rust', 'amber', 'yellow']); s.px(x - 1, y - 2, 'white'); spark(front, x + 3 * (ph % 2 ? 1 : -1), y - 3, 'white', ph % 2 === 0); front.px(x + 2, y + 1, 'yellow'); return; }
  if (main === 1 && top >= 4) {
    // Geister-Orb mit Ranken
    const r = top >= 5 ? 3.8 : 3;
    s.ball(x, y - 1, r, r, ['grass', 'leaf', 'white']);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + ph * 0.5; s.px(x + Math.cos(a) * (r + 1), y - 1 + Math.sin(a) * (r + 1), i % 2 ? 'leaf' : 'deep'); }
    if (top >= 5) { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.6; front.px(x + Math.cos(a) * 7, y - 1 + Math.sin(a) * 7 + (ph & 1), i % 2 ? 'yellow' : 'amber'); } }
    return;
  }
  if (main === 1 && top === 3) { for (let i = 0; i < 4; i++) leafAt(s, x, y, -Math.PI / 2 + (i - 1.5) * 0.7, 5, ['pine', 'grass', 'leaf']); s.ball(x, y - 1, 1.8, 1.8, ['rust', 'orange', 'amber']); return; }
  if (main === 1 && top >= 1) { s.ball(x, y - 1, 2.2, 2.2, ['crimson', 'red', 'coral']); for (const sg of [-1, 1]) { s.px(x + sg * 3, y - 2, 'white'); s.px(x + sg * 2, y - 4, 'silver'); } s.px(x, y - 4, 'white'); return; }
  if (main === 2 && top >= 4) {
    // grosse Fruehlingsbluete
    const r = top >= 5 ? 5.5 : 4;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + ph * 0.1; s.ball(x + Math.cos(a) * r * 0.8, y - 2 + Math.sin(a) * r * 0.8, 2.6, 2.6, top >= 5 ? ['rust', 'amber', 'yellow'] : ['orchid', 'coral', 'white']); }
    s.ball(x, y - 2, 2.2, 2.2, ['rust', 'amber', 'yellow']); s.px(x - 1, y - 3, 'white');
    if (flash) for (let i = 0; i < 6; i++) front.px(x + (i - 3) * 2, y - 8 - (i % 2), i % 2 ? 'coral' : 'white');
    return;
  }
  if (main === 2 && top >= 1) { s.ball(x, y - 1, 2.2, 2.2, ['orchid', 'coral', 'white']); s.px(x, y - 1, 'yellow'); leafAt(s, x - 1, y + 1, 2.4, 4, ['pine', 'grass', 'leaf']); leafAt(s, x + 1, y + 1, 0.7, 4, ['pine', 'grass', 'leaf']); return; }
  // Basis (oder A1): Knospe
  s.ball(x, y - 1, 2.2, 2.2, ['pine', 'grass', 'leaf']); s.px(x, y - 2, 'coral'); s.px(x - 1, y - 2, 'peach');
  leafAt(s, x - 1, y + 1, 2.5, 4, ['pine', 'grass', 'leaf']); leafAt(s, x + 1, y + 1, 0.6, 4, ['pine', 'grass', 'leaf']);
  void A; void B; void C; void L; void vx; void vy;
}

function drawChest(s: Surface, front: Surface, t: Tiers, main: number, ox: number, yT: number, wg: number, ph: number, L: Look): void {
  const [A, B, C] = t;
  if (main === 0 && A >= 1) {
    // Dornenkragen: weisse Stacheln rund um die Schultern
    for (let i = -5 - wg; i <= 5 + wg; i += 2) { s.px(ox + i, yT - 3 - (i % 4 === 0 ? 1 : 0), 'white'); s.px(ox + i, yT - 2, 'silver'); }
    for (const sg of [-1, 1]) { s.px(ox + sg * (6 + wg), yT + 1, 'white'); s.px(ox + sg * (7 + wg), yT, 'white'); }
  }
  if (main === 0 && A >= 2) {
    // Herz aus Donner
    const hc = A >= 4 ? 'white' : 'yellow';
    s.ball(ox, yT + 6, 3.4, 3.4, ['rust', 'amber', 'yellow']); s.px(ox - 1, yT + 5, 'white'); s.px(ox, yT + 6, 'white');
    for (const [dx, dy] of ph % 2 ? [[5, 3], [-5, 9], [0, 11]] : [[-5, 3], [5, 9], [-2, 1]]) front.px(ox + dx, yT + dy, hc);
    s.rect(ox - 5 - wg, yT + 12, 11 + wg * 2, 1, 'yellow');
    if (A >= 3) { s.rect(ox - 4 - wg, yT + 3, 2, 6, 'sky'); s.rect(ox + 3 + wg, yT + 3, 2, 6, 'sky'); }
  }
  if (main === 1 && B >= 1) {
    // Dornenring um den Rumpf (Thorn Burst): Stacheln in alle Richtungen
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const px = ox + Math.cos(a) * (6 + wg), py = yT + 6 + Math.sin(a) * 6; s.px(px, py, 'white'); s.px(px + Math.cos(a), py + Math.sin(a), 'silver'); }
    if (B >= 2) { s.line(ox - 5, G_(yT) + 12, ox - 9, G_(yT) + 14, 'leaf', 1); s.line(ox - 9, G_(yT) + 14, ox - 10, G_(yT) + 17 + (ph & 1), 'grass', 1); s.line(ox + 5, G_(yT) + 12, ox + 9, G_(yT) + 14, 'leaf', 1); for (let i = 0; i < 3; i++) s.px(ox - 8 + i * 8, G_(yT) + 13 + (i & 1), 'white'); }
    // Dornenkranz am Kragen
    for (let i = -4 - wg; i <= 4 + wg; i += 2) { s.px(ox + i, yT + 2 + (i % 4 === 0 ? 1 : 0), 'white'); s.px(ox + i, yT + 1, 'silver'); }
    if (B >= 3) { s.rect(ox - 3, yT + 4, 7, 5, 'bark'); s.rect(ox - 3, yT + 4, 7, 1, 'wood'); s.px(ox, yT + 6, 'leaf'); s.px(ox - 1, yT + 7, 'grass'); }
  }
  if (main === 2) {
    if (C >= 3 && C < 5) { s.rect(ox - 3, yT + 5, 3, 3, 'amber'); s.px(ox - 3, yT + 5, 'yellow'); s.px(ox - 2, yT + 6, 'white'); }
    if (C >= 1) for (let i = 0; i < 3; i++) { s.ball(ox - 4 + i * 4, yT + 3 + (i & 1), 1.7, 1.7, ['orchid', 'coral', 'white']); s.px(ox - 4 + i * 4, yT + 3 + (i & 1), 'yellow'); }
    if (C >= 2) { s.rect(ox - 4 - wg, yT + 9, 3, 3, 'wood'); s.px(ox - 4 - wg, yT + 9, 'tan'); for (let i = 0; i < 3; i++) s.px(ox - 3 - wg + i, yT + 12 + (i & 1), 'leaf'); }
  }
  void L;
}
const G_ = (y: number): number => y;

/** Rindenruestung (C4: Schulter und Brust, C5: voller Panzer mit Moos). */
function drawBarkArmor(s: Surface, ox: number, yT: number, G: number, wg: number, C: number, ph: number): void {
  const hw = 4 + wg;
  s.rect(ox - hw, yT + 3, hw * 2 + 1, 8, 'bark'); s.rect(ox - hw, yT + 3, hw * 2 + 1, 1, 'wood'); s.rect(ox - hw, yT + 3, 1, 8, 'wood'); s.rect(ox + hw, yT + 4, 1, 7, 'plum');
  for (let i = 0; i < 3; i++) { s.line(ox - hw + 2 + i * 3, yT + 4, ox - hw + 1 + i * 3, yT + 10, 'plum'); }
  s.rect(ox - hw, yT + 10, hw * 2 + 1, 1, 'plum');
  s.px(ox - 1, yT + 5, 'leaf'); s.px(ox, yT + 5, 'grass'); s.px(ox + 2, yT + 8, 'leaf'); s.px(ox - hw + 1, yT + 4, 'leaf');
  if (C >= 5) {
    for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 3), yT + 2, 4.6, 3.6, ['plum', 'bark', 'wood']); s.rect(ox + sg * (hw + 3) - 3, yT + 1, 6, 1, 'leaf'); s.px(ox + sg * (hw + 3) - 1, yT + 2, 'grass'); s.px(ox + sg * (hw + 3) + 1, yT + 3, 'leaf'); }
    s.rect(ox - hw - 1, G - 12, hw * 2 + 3, 2, 'plum'); s.rect(ox - hw - 1, G - 12, hw * 2 + 3, 1, 'wood');
    s.rect(ox - 2, yT + 6, 5, 4, ph % 2 ? 'amber' : 'orange'); s.px(ox, yT + 7, 'white'); s.px(ox - 1, yT + 6, 'yellow');
    for (let x = ox - hw; x <= ox + hw; x += 2) s.px(x, G - 10, 'leaf');
  }
}

function sideGear(s: Surface, front: Surface, back: Surface, t: Tiers, main: number, ox: number, yT: number, G: number, wg: number, ph: number): void {
  const hw = 4 + wg;
  const [A, B, C] = t;
  if (main !== 0 && A >= 1) { s.px(ox + hw + 1, G - 12, 'white'); s.px(ox + hw + 2, G - 11, 'silver'); if (A >= 2) { s.ball(ox - hw - 1, yT + 1, 2, 2, ['rust', 'amber', 'yellow']); if (ph % 2) spark(front, ox - hw - 4, yT - 2, 'white'); } }
  if (main !== 1 && B >= 1) { for (const sg of [-1, 1]) { s.px(ox + sg * 4 + (sg > 0 ? 1 : -1), G - 2, 'leaf'); s.px(ox + sg * 5, G - 3 + (ph & 1), 'grass'); } if (B >= 2) { s.line(ox - hw, yT + 1, ox - hw - 1, yT + 9, 'leaf'); s.line(ox - hw - 1, yT + 3, ox - hw, yT + 6, 'grass'); s.px(ox - hw - 1, yT + 9, 'leaf'); } }
  if (main !== 2 && C >= 1) { s.box(ox - hw - 3, G - 9, 4, 5, RAMPS.wood); s.px(ox - hw - 2, G - 10, 'tan'); s.px(ox - hw - 1, G - 8, 'leaf'); if (C >= 2) { s.px(ox - hw - 1, G - 11, 'coral'); s.px(ox - hw - 3, G - 11, 'leaf'); } }
  void back;
}

/** Zweig-/Geweihkrone je Pfad und Stufe. */
function drawCrown(s: Surface, back: Surface, front: Surface, t: Tiers, main: number, cx: number, cy: number, ph: number, L: Look, hb: number): void {
  const [A, B, C] = t, top = t[main];
  const y0 = cy - 5 - hb;
  const wood = RAMPS.wood;
  if (main === 0) {
    const col: Ramp = A >= 5 ? ['sky', 'ice', 'white'] : A >= 3 ? ['dusk', 'slate', 'silver'] : wood;
    const tp: PalName | null = A >= 2 ? (A >= 4 ? 'yellow' : 'amber') : null;
    for (const sg of [-1, 1]) antler(s, cx + sg * 3, y0, sg, A >= 4 ? 4 : A >= 3 ? 3 : 1.6 + (A >= 1 ? 0.6 : 0), col, tp, A >= 3 ? 3 : 2);
    if (A >= 4) { for (const sg of [-1, 1]) bolt(front, cx + sg * 8, y0 - 6, cx + sg * 11, y0 - 12, 40 + sg + ph * 3, 'white', 'yellow'); }
    if (A >= 5) {
      // Blitzkrone: Zacken ueber der Stirn
      for (let i = -3; i <= 3; i++) { const h = [4, 7, 5, 9, 5, 7, 4][i + 3] + ((ph + i) & 1); s.line(cx + i * 2, y0 + 1, cx + i * 2, y0 - h, i % 2 ? 'yellow' : 'white'); s.px(cx + i * 2, y0 - h - 1, 'white'); }
    }
  } else if (main === 1) {
    const sz = B >= 2 ? 3 : 2;
    for (const sg of [-1, 1]) antler(s, cx + sg * 3, y0, sg, sz + (B >= 3 ? 1 : 0), wood, B >= 1 ? 'leaf' : null, B >= 1 ? 3 : 2);
    if (B >= 1) { s.px(cx - 6, y0 - 4, 'white'); s.px(cx + 6, y0 - 4, 'white'); }
    if (B >= 3 && B < 5) { for (const dx of [-6, -2, 3, 7]) leafAt(s, cx + dx, y0 + 1, -Math.PI / 2 + dx * 0.1, 5, ['pine', 'grass', 'leaf']); }
    if (B >= 5) {
      // Weltenbaum-Krone: riesige Laubkrone mit goldenen Fruechten und Leuchten
      const by = y0 - 13;
      back.ball(cx, by + 1, 17, 9, ['deep', 'pine', 'grass']);
      for (const [dx, dy, r] of [[-13, 3, 6], [13, 3, 6], [-7, -4, 7], [7, -4, 7], [0, -8, 8], [-17, 6, 4], [17, 6, 4], [0, -1, 8]] as [number, number, number][]) back.ball(cx + dx, by + dy, r, r * 0.8, ['pine', 'grass', 'leaf']);
      const rnd = irnd(91);
      for (let i = 0; i < 20; i++) { const a = rnd() * Math.PI * 2, r = rnd() * 15; const x = cx + Math.cos(a) * r * 1.2, y = by - 2 + Math.sin(a) * r * 0.6; back.px(x, y, rnd() < 0.5 ? 'leaf' : 'deep'); }
      for (let i = 0; i < 7; i++) { const x = cx - 15 + i * 5, y = by - 4 + [2, -3, 3, -5, 2, -3, 3][i] ; const on = (ph + i) % 4 < 2; front.px(x, y, on ? 'yellow' : 'amber'); front.px(x + 1, y, on ? 'amber' : 'orange'); front.px(x, y + 1, 'orange'); }
      for (const sg of [-1, 1]) { s.line(cx + sg * 3, y0, cx + sg * 8, y0 - 6, 'bark', 2); }
      for (let i = 0; i < 4; i++) { const x = cx - 14 + ((ph * 5 + i * 9) % 28), y = by + 9 + ((ph * 3 + i * 4) % 14); leafAt(front, x, y, 1.6, 3, ['pine', 'grass', 'leaf']); }
    }
  } else {
    for (const sg of [-1, 1]) antler(s, cx + sg * 3, y0, sg, 2 + (C >= 1 ? 0.8 : 0) + (C >= 5 ? 2 : 0), C >= 5 ? ['clay', 'amber', 'yellow'] : wood, C >= 1 ? 'coral' : null, C >= 2 ? 3 : 2);
    if (C >= 3) for (const [dx, dy] of [[-5, 1], [-1, -1], [3, 0], [6, 2]] as [number, number][]) { s.ball(cx + dx, y0 + dy + 1, 2, 2, ['orchid', 'coral', 'white']); s.px(cx + dx, y0 + dy + 1, 'yellow'); }
    if (C >= 4) {
      // Bluetenkranz und Blueten auf dem Kopf, Blueten-Halo
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; const x = cx + Math.cos(a) * 8, y = cy - 2 + Math.sin(a) * 6 - 1; s.ball(x, y, 1.9, 1.9, i % 2 ? ['orchid', 'coral', 'white'] : ['rust', 'amber', 'yellow']); }
      for (let i = 0; i < 5; i++) { const x = cx - 14 + ((ph * 6 + i * 7) % 28), y = cy - 20 + ((ph * 4 + i * 6) % 30); front.px(x, y, i % 2 ? 'coral' : 'white'); front.px(x + 1, y + 1, 'orchid'); }
    }
    if (C >= 5) { for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + ph * 0.1; if ((i + ph) % 3 !== 2) front.px(cx + Math.cos(a) * 10, y0 - 9 + Math.sin(a) * 3, i % 2 ? 'yellow' : 'amber'); } }
  }
  void L; void B;
}
