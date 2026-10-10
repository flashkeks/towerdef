/**
 * Tinker (Runde 16, Paket TP): Bastler/Ingenieur der Laternenleute mit Schutzbrille, Rucksack voller Werkzeug und Nagelpistole. Keine Plattform.
 * A Sentry:    Werkzeugkasten -> zwei Mini-Geschuetze am Boden -> Geschuetzaufbau auf dem Rucksack (neue Silhouette) -> Messingpanzer mit Zahnraedern
 *              -> Clockwork Fort (Uhrwerk-Festung mit drehenden Zahnraedern hinter ihm, Messinganzug).
 * B Caltrops:  Beutel mit Kraehenfuessen -> spitze Kraehenfuesse + Stachelarmschienen -> aufgerollte Stachelmatte (Silhouette) -> Eisenstachelruestung
 *              -> Iron Thorn Field (Eisenstacheln wachsen rund um ihn, Stacheltrauben als Fluegel, rote Augen).
 * C Overclock: Oelkanne + Zahnrad -> leuchtende Brille -> Teslaspule auf dem Rucksack (Silhouette) -> Doppelspule mit Blitzen -> Ultra-Overclock
 *              (schwebt, Riesenspulen, Blitzring, gleissende Brille).
 * Haltung/Blick wie die anderen Tuerme (8 Richtungen, Idle 4 Frames, Angriff 4 Frames). Stufe 3 = neue Silhouette, 4 = Ruestung/Leuchten, 5 = Verwandlung.
 */
import type { PalName } from '../palette';
import { drawArm } from './bows';
import { growOf, mainPath, widthOf } from './gear';
import { bolt, spark, tube } from './parts';
import type { Dir, Pose } from './pose';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { irnd, RAMPS, type Ramp, Surface } from './surface';
import type { Tiers } from './types';

const BRASS: Ramp = ['rust', 'amber', 'yellow'];
const IRON: Ramp = ['ink', 'dusk', 'stone'];
const OVER: Ramp = ['night', 'navy', 'sky'];

/** Zahnrad: Mitte (cx, cy), Radius r, `ph` dreht die Zaehne. */
export function cog(s: Surface, cx: number, cy: number, r: number, ph: number, ramp: Ramp = BRASS, teeth = 8): void {
  s.ball(cx, cy, r, r, ramp);
  const n = teeth;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + ph * (Math.PI / n) * 0.5;
    const x = cx + Math.cos(a) * (r + 1), y = cy + Math.sin(a) * (r + 1);
    s.px(x, y, i % 2 ? ramp[1] : ramp[2]);
    if (r >= 4) s.px(cx + Math.cos(a) * (r + 1.6), cy + Math.sin(a) * (r + 1.6), ramp[0]);
  }
  s.rect(cx - 1 + (r < 3 ? 1 : 0), cy - 1 + (r < 3 ? 1 : 0), r < 3 ? 1 : 2, r < 3 ? 1 : 2, 'ink');
}

/** Kraehenfuss (Caltrop): Mitte (x, y), vier Spitzen. */
export function jack(s: Surface, x: number, y: number, c: PalName = 'silver', hi: PalName = 'white'): void {
  s.px(x, y, c); s.px(x, y - 1, hi); s.px(x, y - 2, c);
  s.px(x - 1, y + 1, c); s.px(x - 2, y + 1, 'stone'); s.px(x + 1, y + 1, c); s.px(x + 2, y + 1, 'stone');
}

/** Mini-Geschuetz (Sentry-Modell) fuer die Figur: Dreibein, Rohr in Richtung `dx`. (x, gy) = Fuss. */
export function miniTurret(s: Surface, x: number, gy: number, dx: number, ramp: Ramp, ph: number, big = false): void {
  const h = big ? 4 : 3;
  s.line(x, gy - h, x - 3, gy, 'bark'); s.line(x, gy - h, x + 3, gy, 'bark'); s.px(x, gy - 1, 'wood');
  s.box(x - 2, gy - h - 3, 5, 3, ramp);
  tube(s, x + dx, gy - h - 2, x + dx * 6, gy - h - 2, 2, IRON);
  s.px(x + dx * 6, gy - h - 2, 'white');
  s.px(x - dx, gy - h - 3, ph % 2 ? 'yellow' : 'amber');
}

interface Look { shirt: Ramp; over: Ramp; cap: Ramp; metal: Ramp; glow: PalName; lens: PalName }
function lookOf(t: Tiers, main: number): Look {
  const top = t[main];
  const L: Look = { shirt: RAMPS.orange, over: OVER, cap: ['plum', 'bark', 'wood'], metal: RAMPS.steel, glow: 'yellow', lens: 'sky' };
  if (main === 0 && top >= 3) { L.cap = BRASS; }
  if (main === 1 && top >= 3) { L.over = IRON; L.cap = ['ink', 'night', 'dusk']; L.glow = 'red'; L.lens = 'coral'; L.shirt = RAMPS.rust; }
  if (main === 2 && top >= 2) { L.lens = top >= 3 ? 'yellow' : 'ice'; }
  if (main === 2 && top >= 3) { L.over = ['night', 'violet', 'orchid']; L.glow = 'ice'; L.shirt = RAMPS.ice; L.cap = ['night', 'navy', 'sky']; }
  if (main === 2 && top >= 5) { L.lens = 'white'; L.over = ['night', 'navy', 'ice']; }
  return L;
}

export function drawTinker(t: Tiers, d: Dir, p: Pose): TowerLayers {
  const W = TW, H = TH;
  const s = new Surface(W, H), back = new Surface(W, H), front = new Surface(W, H);
  const [A, B, C] = t;
  const top = Math.max(A, B, C), main = mainPath(t);
  const gr = growOf(top), wg = widthOf(top);
  const hover = main === 2 && C >= 5 ? 3 + (p.ph & 1) : 0;
  const up = p.up + gr + hover;
  const G = GY, ox = OX, ph = p.ph;
  const L = lookOf(t, main);
  const rnd = irnd(5 + A * 3 + B * 7 + C * 13);
  const yT = G - 10 - up, yB = G - 1 - hover;
  const hw = 4 + wg;
  const hcx = ox, hcy = G - 15 - up;
  const sway = [0, 1, 0, -1][ph];
  // Rucksack liegt hinten: Blick nach rechts -> links vom Koerper; von vorn/hinten mittig
  const bk = Math.abs(d.ux) > 0.5 ? -1 : Math.abs(d.ux) > 0.1 ? -1 : 0;
  const bx = ox + bk * (hw + 3);

  // ======================= Boden und Hintergrund =======================
  // Clockwork Fort (A5): Messingfestung hinter ihm mit drehenden Zahnraedern
  if (main === 0 && A >= 5) {
    const fy = G - 2;
    // Mauer
    back.box(ox - 26, fy - 22, 53, 22, ['plum', 'rust', 'clay']);
    for (let y = fy - 20; y < fy - 1; y += 4) for (let x = ox - 25 + (((fy - y) >> 2) & 1) * 4; x < ox + 25; x += 8) back.rect(x, y, 4, 1, 'rust');
    for (let x = ox - 26; x < ox + 27; x += 6) { back.rect(x, fy - 26, 4, 4, 'orange'); back.rect(x, fy - 26, 4, 1, 'amber'); }
    // Tuerme
    for (const sg of [-1, 1]) {
      back.box(ox + sg * 24 - 5, fy - 34, 10, 34, ['plum', 'rust', 'clay']);
      back.poly([[ox + sg * 24 - 7, fy - 34], [ox + sg * 24, fy - 42], [ox + sg * 24 + 7, fy - 34]], (x) => (x < ox + sg * 24 ? 'yellow' : 'amber'));
      back.rect(ox + sg * 24 - 1, fy - 29, 3, 5, 'ink'); back.px(ox + sg * 24 - 1, fy - 29, ph % 2 ? 'yellow' : 'orange');
      cog(back, ox + sg * 24, fy - 16, 4, sg > 0 ? ph : -ph, BRASS);
    }
    cog(back, ox - 11, fy - 14, 7, ph, ['rust', 'amber', 'yellow'], 10);
    cog(back, ox + 9, fy - 12, 5, -ph, ['rust', 'orange', 'amber'], 8);
    // Tor und Fahne
    back.rect(ox - 4, fy - 11, 9, 11, 'ink'); back.ellipse(ox, fy - 11, 4.5, 3, 'ink');
    back.rect(ox + 22, fy - 56, 1, 14, 'bark'); for (let i = 0; i < 4; i++) back.rect(ox + 23, fy - 55 + i, 6 - (i > 2 ? 1 : 0) + ((ph + i) & 1), 1, i < 2 ? 'amber' : 'orange');
    // Dampf
    for (let i = 0; i < 3; i++) { const k = (ph * 2 + i * 3) % 9; back.ball(ox - 24 + i * 24 + (i === 1 ? 0 : 0), fy - 46 - k * 1.2, 1.8 + k * 0.25, 1.8 + k * 0.25, ['stone', 'silver', 'white']); }
    // Ring aus Zahnraedern auf dem Boden
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + ph * 0.1; back.pxUnder(ox + Math.cos(a) * 22, OY + Math.sin(a) * 5, i % 2 ? 'yellow' : 'amber'); }
  }
  // Eisenfeld (B5): Dornen aus dem Boden rund um ihn
  if (main === 1 && B >= 5) {
    const arr: [number, number, number][] = [[-22, 2, 12], [-17, 4, 8], [-12, 5, 14], [12, 5, 14], [17, 4, 9], [22, 2, 12], [-27, 0, 8], [27, 0, 8], [-8, 6, 7], [8, 6, 7], [-4, 7, 5], [4, 7, 5]];
    arr.forEach(([dx, dy, h], i) => {
      const x = ox + dx, y = G + dy - 1 - (((ph + i) & 3) === 0 ? 1 : 0);
      const dark = i % 2 ? IRON : ['night', 'slate', 'silver'] as Ramp;
      (dy < 5 ? back : front).poly([[x - 2, y], [x + 2, y], [x + 0.5, y - h]], (px) => (px < x ? dark[2] : px > x + 0.5 ? dark[0] : dark[1]));
      (dy < 5 ? back : front).px(x, y - h + 1, 'white');
    });
    // Stacheltrauben als Fluegel hinter dem Koerper
    for (const sg of [-1, 1]) for (let i = 0; i < 5; i++) {
      const bx0 = ox + sg * 4, by0 = yT + 5, tx = ox + sg * (14 + i * 4), ty = yT - 8 + i * 4 - (ph & 1);
      back.line(bx0, by0, tx, ty, i % 2 ? 'dusk' : 'slate', 2);
      back.px(tx + sg, ty - 1, 'white'); back.px(tx + sg * 2, ty - 2, 'silver');
    }
  }
  // Blitzring (C5)
  if (main === 2 && C >= 5) {
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2 + ph * 0.3; if ((i + ph) % 3 === 2) continue; back.pxUnder(ox + Math.cos(a) * 19, OY + Math.sin(a) * 5, i % 2 ? 'ice' : 'yellow'); }
    for (const sg of [-1, 1]) {
      // Riesenspule: Pfosten mit Ringen und Kugel
      const px = ox + sg * 24;
      back.rect(px - 1, G - 36, 3, 36, 'slate'); back.rect(px - 1, G - 36, 1, 36, 'stone');
      for (let k = 0; k < 4; k++) back.rect(px - 4, G - 30 + k * 6, 9, 2, k % 2 ? 'amber' : 'rust');
      back.ball(px, G - 40, 5, 5, ['sky', 'ice', 'white']); back.px(px - 2, G - 42, 'white');
      bolt(front, px, G - 40, ox + sg * 6, yT - 6, 11 + ph * 3 + (sg > 0 ? 7 : 0), 'white', 'yellow');
    }
  }

  // ======================= Rucksack und Aufbauten (hinten) =======================
  const rig = (): void => {
    // Rucksack: Holzkasten mit Riemen, Werkzeug schaut raus
    const rx = bx - (bk === 0 ? 4 : 3), ry = yT + 1;
    s.box(rx, ry, 8, 11, RAMPS.wood);
    s.rect(rx, ry + 4, 8, 1, 'bark'); s.rect(rx + 3, ry, 2, 11, 'bark');
    s.px(rx + 3, ry + 5, 'yellow');
    // Schraubenschluessel
    s.line(rx + 1, ry - 1, rx + 2, ry - 6, 'stone', 1); s.px(rx + 2, ry - 7, 'silver'); s.px(rx + 1, ry - 7, 'stone'); s.px(rx + 3, ry - 7, 'stone');
    // Zahnrad an der Seite
    s.px(rx + 6, ry + 7, 'amber'); s.px(rx + 6, ry + 8, 'rust');
    if (main === 0) {
      if (A >= 3) {
        // Geschuetzaufbau: Mast mit schwenkbarem Rohr ueber der Schulter
        s.rect(rx + 3, ry - 12, 2, 12, 'iron'[0] ? 'slate' : 'slate');
        s.box(rx - 1, ry - 17, 10, 5, A >= 4 ? BRASS : RAMPS.iron);
        const dxs = d.ux >= 0 ? 1 : -1;
        tube(s, rx + 4, ry - 15, rx + 4 + Math.round(d.ux * 9) + dxs, ry - 15 + Math.round(d.uy * 5), 3, A >= 4 ? BRASS : IRON);
        s.px(rx + 4 + Math.round(d.ux * 9) + dxs, ry - 15 + Math.round(d.uy * 5), 'white');
        s.px(rx + 1, ry - 16, ph % 2 ? 'yellow' : 'orange'); s.px(rx + 6, ry - 15, 'ice');
      }
      if (A >= 4) { cog(s, rx + 4, ry + 5, 5, ph, BRASS, 10); s.px(rx + 4, ry + 5, 'ink'); }
    }
    if (main === 1) {
      if (B >= 3) {
        // aufgerollte Stachelmatte quer ueber dem Ruecken
        const my = ry - 3 - (B >= 4 ? 2 : 0);
        s.box(rx - 4, my, 16, 7, ['night', 'slate', 'stone']);
        s.ellipse(rx - 3, my + 3.5, 2.5, 3.5, 'stone'); s.ellipse(rx - 3, my + 3.5, 1.2, 2, 'slate');
        for (let i = 0; i < 6; i++) { s.px(rx - 1 + i * 2, my - 1, 'white'); s.px(rx - 1 + i * 2, my - 2 + (i & 1), 'silver'); s.px(rx - 1 + i * 2, my + 7, 'silver'); }
        s.rect(rx + 1, my, 1, 7, 'bark'); s.rect(rx + 8, my, 1, 7, 'bark');
      }
    }
    if (main === 2) {
      if (C >= 3) {
        // Teslaspule: Mast, Ringe, Kugel mit Funken
        const mh = C >= 4 ? 18 : 13;
        s.rect(rx + 3, ry - mh, 2, mh, 'slate'); s.px(rx + 3, ry - mh, 'stone');
        for (let k = 0; k < (C >= 4 ? 4 : 3); k++) { s.rect(rx + 1, ry - 3 - k * 4, 6, 2, k % 2 ? 'amber' : 'rust'); s.px(rx + 1, ry - 3 - k * 4, 'yellow'); }
        s.ball(rx + 4, ry - mh - 3, C >= 4 ? 4 : 3, C >= 4 ? 4 : 3, ['sky', 'ice', 'white']); s.px(rx + 3, ry - mh - 5, 'white');
        if (C >= 4) { s.rect(rx - 2, ry - mh + 4, 1, 4, 'slate'); s.ball(rx - 2, ry - mh + 2, 2, 2, ['sky', 'ice', 'white']); }
        bolt(front, rx + 4, ry - mh - 6, rx + 4 + (ph % 2 ? 6 : -6), ry - mh - 11 + (ph & 1), 3 + ph * 4, 'white', 'yellow');
        if (C >= 4) bolt(front, rx + 4, ry - mh - 4, rx + 4 + Math.round(d.ux * 18), ry - mh + 3 + (ph & 1) * 2, 23 + ph * 5, 'ice', 'yellow');
      } else if (C >= 1) {
        // Oelkanne am Rucksack
        s.box(rx + 1, ry + 11, 6, 4, ['rust', 'amber', 'yellow']); s.px(rx + 6, ry + 12, 'amber'); s.px(rx + 7, ry + 11, 'silver');
      }
    }
  };
  if (!d.behind) rig();

  // ======================= Waffe hinter dem Koerper (Blick nach oben) =======================
  const reachBoost = top >= 4 ? 1 : 0;
  const hand: [number, number] = [ox + 6 + wg + Math.round(d.ux * 2), G - 8 - up + Math.round(d.uy * 2)];
  const ax = d.ux, ay = d.uy * 0.85, al = Math.hypot(ax, ay) || 1;
  const nx = ax / al, ny = ay / al;
  const rec = p.recoil;
  const glen = 7 + reachBoost + (main === 0 && A >= 3 ? 1 : 0);
  const butt: [number, number] = [hand[0] - nx * (3 + rec), hand[1] - ny * (3 + rec)];
  const tip: [number, number] = [hand[0] + nx * (glen - rec), hand[1] + ny * (glen - rec)];
  const gunRamp: Ramp = main === 0 && A >= 3 ? BRASS : main === 2 && C >= 3 ? ['dusk', 'sky', 'ice'] : main === 1 && B >= 3 ? IRON : RAMPS.iron;
  const gun = (): void => {
    tube(s, butt[0], butt[1], tip[0], tip[1], 2, gunRamp);
    // Magazin und Griff
    s.rect(Math.round(hand[0]) - 1, Math.round(hand[1]) + 2, 3, 3, 'bark'); s.px(Math.round(hand[0]) - 1, Math.round(hand[1]) + 2, 'wood');
    s.rect(Math.round(butt[0] + nx * 4) - 1, Math.round(butt[1] + ny * 4) - 3, 3, 2, main === 2 && C >= 3 ? 'yellow' : 'amber');
    s.px(tip[0], tip[1], 'white'); s.px(tip[0] + Math.sign(nx), tip[1] + Math.sign(ny) * (Math.abs(ny) > 0.3 ? 1 : 0), 'silver');
    if (main === 2 && C >= 3) { s.px(Math.round(butt[0] + nx * 2), Math.round(butt[1] + ny * 2) - 2, ph % 2 ? 'white' : 'ice'); }
    if (p.flash) { spark(front, tip[0] + nx * 3, tip[1] + ny * 3, main === 2 && C >= 3 ? 'ice' : 'yellow', true); front.px(tip[0] + nx * 6, tip[1] + ny * 6, 'orange'); }
  };
  if (d.behind) gun();

  // ======================= Koerper =======================
  // Stiefel
  s.rect(ox - 4, G - 1 - hover, 3, 2, 'bark'); s.rect(ox + 1, G - 1 - hover, 3, 2, 'bark');
  s.px(ox - 4, G - 1 - hover, 'wood'); s.px(ox + 1, G - 1 - hover, 'wood');
  if (hover) { front.pxUnder(ox - 3, G + 1, 'ice'); front.pxUnder(ox + 2, G + 1, 'yellow'); }
  // Latzhose
  const hem = [0, 1, 1, 0][ph];
  s.poly([[ox - hw, yT], [ox + hw, yT], [ox + hw + 1, yB], [ox - hw - 1, yB]], (x, y) => (x <= ox - hw && y < yB - 1 ? L.over[2] : x >= ox + hw - 1 ? L.over[0] : y <= yT + 2 ? L.shirt[1] : L.over[1]));
  for (let x = ox - hw - 1; x <= ox + hw; x++) if ((x + hem) % 2 === 0) s.px(x, yB, L.over[0]);
  // Hemdkragen und Traeger
  s.rect(ox - hw, yT, hw * 2 + 1, 1, L.shirt[2]);
  s.rect(ox - 2, yT + 1, 1, 3, 'amber'); s.rect(ox + 2, yT + 1, 1, 3, 'amber');
  // Brusttasche mit Werkzeug
  s.rect(ox - 3, yT + 5, 4, 3, L.over[0]); s.px(ox - 2, yT + 4, 'silver'); s.px(ox - 1, yT + 4, 'red'); s.px(ox - 1, yT + 3, 'white');
  // Guertel mit Schnalle und Taschen
  s.rect(ox - hw, G - 5 - hover, hw * 2 + 1, 1, 'bark'); s.px(ox, G - 5 - hover, 'yellow');
  s.rect(ox + hw - 3, G - 5 - hover, 2, 3, 'wood'); s.px(ox + hw - 3, G - 5 - hover, 'tan');
  // Pfad-Beigaben am Koerper
  drawBody(s, front, t, main, ox, yT, yB, G, hw, wg, ph, hover, L, d);
  if (d.behind) rig();

  // ======================= Kopf =======================
  const hb = gr >= 4 ? 1 : 0;
  s.ball(hcx, hcy, 5.6 + hb, 5.2 + hb, L.cap);
  // Muetze: Krempe und Riemen
  s.rect(hcx - 5 - hb, hcy - 1, 11 + hb * 2, 1, L.cap[0]);
  if (d.eyes > 0) {
    const fx = hcx + (d.eyes === 1 ? 3 : d.ex), fy = hcy + 1 + (d.eyes === 1 ? -1 : Math.round(d.ey * 0.5));
    const rx = d.eyes === 1 ? 2.6 : 3.7;
    s.ellipseFn(fx, fy + 1, rx, 3, (_x, _y, nx2, ny2) => ((-nx2 * 0.4 - ny2 * 0.7) > 0.3 ? 'peach' : 'skin'));
    // Schutzbrille auf der Stirn
    const lensGlow = (main === 2 && C >= 2) || (main === 1 && B >= 5) || (main === 0 && A >= 5);
    const lc: PalName = main === 1 && B >= 5 ? (ph % 2 ? 'red' : 'coral') : main === 2 && C >= 5 ? (ph % 2 ? 'white' : 'yellow') : L.lens;
    const lens = (x: number): void => {
      s.rect(x - 1, fy - 3, 4, 4, main === 0 && A >= 3 ? 'amber' : 'rust'); s.rect(x, fy - 2, 2, 2, lc); s.px(x, fy - 2, lensGlow ? 'white' : 'white');
    };
    if (d.eyes === 2) { lens(fx - 3); lens(fx + 1); s.rect(fx - 1, fy - 2, 2, 1, 'rust'); s.px(fx - 1, fy + 2, 'ink'); s.px(fx + 1, fy + 2, 'ink'); s.px(fx, fy + 3, 'coral'); }
    else { lens(fx - 1); s.px(fx, fy + 2, 'ink'); }
  } else {
    // Hinterkopf: Brillenriemen
    s.rect(hcx - 5, hcy - 2, 11, 1, 'rust'); s.px(hcx, hcy - 2, 'amber');
  }
  // Zusatz am Kopf je Pfad
  drawHead(s, front, t, main, hcx, hcy, ph, hb, L, d);

  // ======================= Arme =======================
  const sh: [number, number] = [ox + 3, yT + 2];
  if (!d.behind) { gun(); drawArm(s, { sx: sh[0], sy: sh[1], hx: hand[0], hy: hand[1], sleeve: L.shirt[1] as PalName, skin: 'skin', roll: 0.8 }); }
  else drawArm(s, { sx: sh[0], sy: sh[1], hx: hand[0], hy: hand[1], sleeve: L.shirt[1] as PalName, skin: 'skin', roll: 0.8 });
  // freier Arm: haelt Schraubenschluessel an die Schulter (Idle: wippt)
  const wx = ox - 6 - wg, wy = yT + 8 + (ph === 2 ? 1 : 0);
  drawArm(s, { sx: ox - 3, sy: yT + 2, hx: wx, hy: wy, sleeve: L.shirt[1] as PalName, skin: 'skin', roll: 0.8 });
  s.line(wx + 1, wy, wx - 1, wy - 7, 'silver'); s.px(wx - 1, wy - 8, 'white'); s.px(wx - 2, wy - 8, 'stone'); s.px(wx, wy - 8, 'stone');

  // ======================= Funken, Staub, Zahnraeder in der Luft =======================
  if (main === 0 && A >= 4 && A < 5) {
    for (let i = 0; i < 3; i++) { const a = ((i + ph / 4) / 3) * Math.PI * 2; cog(front, ox + Math.cos(a) * 16, G - 22 - up + Math.sin(a) * 6, 2, ph + i, BRASS, 6); }
  }
  if (main === 2 && C >= 2) {
    for (let i = 0; i < 3 + (C >= 4 ? 3 : 0); i++) { const k = (ph * 3 + i * 5) % 12; front.px(ox - 14 + ((i * 11 + ph * 3) % 28), G - 6 - up - k * 1.6, i % 2 ? 'white' : 'yellow'); }
  }
  if (main === 1 && B >= 1 && B < 5) { /* Kraehenfuesse am Boden liegen im Koerper-Teil */ }
  void sway; void rnd; void H; void TH;
  return { fig: s, back, front, muzzle: [Math.round(tip[0]), Math.round(tip[1])] };
}

/** Koerper-Beigaben je Pfad und Stufe. */
function drawBody(s: Surface, front: Surface, t: Tiers, main: number, ox: number, yT: number, yB: number, G: number, hw: number, wg: number, ph: number, hover: number, L: Look, d: Dir): void {
  const [A, B, C] = t;
  const gy = G - hover;
  // ---- A: Sentry ----
  if (A >= 1 && main !== 0 || (main === 0 && A >= 1 && A < 3)) {
    // Werkzeugkasten (rot) am rechten Fuss
    const kx = ox + 8 + wg;
    s.box(kx, gy - 6, 9, 6, RAMPS.red); s.rect(kx, gy - 4, 9, 1, 'crimson'); s.rect(kx + 3, gy - 8, 3, 2, 'silver'); s.px(kx + 4, gy - 3, 'yellow');
    s.px(kx + 1, gy - 6, 'white');
    if (A >= 2 && (main !== 0 || A === 2)) {
      // Mini-Geschuetze (Modelle) links und auf dem Kasten
      miniTurret(s, kx + 4, gy - 8, 1, BRASS, ph);
      miniTurret(s, ox - 10 - wg, gy, -1, BRASS, ph + 1);
    }
  }
  if (main === 0 && A >= 4) {
    // Messingpanzer: Brust, Schultern mit Zahnraedern
    s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 8, BRASS[1]); s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 1, BRASS[2]); s.rect(ox - hw + 1, yT + 3, 1, 8, BRASS[2]); s.rect(ox + hw - 1, yT + 4, 1, 7, BRASS[0]); s.rect(ox - hw + 1, yT + 10, hw * 2 - 1, 1, BRASS[0]);
    for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 2), yT + 1, 3.6, 3, BRASS); cog(s, ox + sg * (hw + 2), yT + 1, 1.5, ph + (sg > 0 ? 1 : 0), ['rust', 'amber', 'yellow'], 6); }
    cog(s, ox, yT + 7, 2.6, ph, ['rust', 'amber', 'yellow'], 8); s.px(ox, yT + 7, ph % 2 ? 'white' : 'ink');
  } else if (main === 0 && A >= 3) {
    for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 1), yT + 1, 3.2, 2.6, RAMPS.steel); s.px(ox + sg * (hw + 1) - 1, yT, 'white'); }
    s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 2, RAMPS.steel[1]);
  }
  if (main === 0 && A >= 5) {
    // Fort-Anzug: Panzerplatten an den Beinen, Brust leuchtet
    s.rect(ox - hw, G - 6, hw * 2 + 1, 4, BRASS[1]); s.rect(ox - hw, G - 6, hw * 2 + 1, 1, BRASS[2]); s.rect(ox - hw, G - 3, hw * 2 + 1, 1, BRASS[0]);
    s.rect(ox - 2, yT + 5, 5, 4, ph % 2 ? 'white' : 'yellow'); s.px(ox - 1, yT + 6, 'orange');
    for (const sg of [-1, 1]) s.poly([[ox + sg * (hw + 1) - 1, yT - 2], [ox + sg * (hw + 1) + 1, yT - 2], [ox + sg * (hw + 4), yT - 8 - (ph & 1)]], 'yellow');
  }
  // ---- B: Caltrops ----
  if (B >= 1) {
    // Beutel am Guertel (links) mit Spitzen
    const px = ox - hw - 4 - (main === 1 && B >= 3 ? 0 : 0);
    if (!(main === 1 && B >= 4)) { s.ball(px + 2, gy - 5, 3.6, 3.6, ['bark', 'wood', 'tan']); s.rect(px, gy - 10, 5, 2, 'bark'); s.px(px + 1, gy - 11, 'white'); s.px(px + 3, gy - 12, 'silver'); s.px(px + 2, gy - 10, 'silver'); }
    // Kraehenfuesse am Boden
    jack(s, ox - hw - 8, gy - 1, 'silver'); if (B >= 2) { jack(s, ox + hw + 5, gy - 1, 'stone'); jack(s, ox - hw - 12, gy, 'silver'); }
    if (B >= 2) {
      // Stachelarmschiene am freien Arm
      for (let i = 0; i < 3; i++) { s.px(ox - 7 - wg + (i & 1), yT + 4 + i * 2, 'silver'); s.px(ox - 8 - wg + (i & 1), yT + 4 + i * 2, 'white'); }
    }
  }
  if (main === 1 && B >= 3) {
    // Beinschienen und Stachelschultern
    for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 1), yT + 1, 3.4, 2.8, IRON); s.px(ox + sg * (hw + 1), yT - 3, 'white'); s.px(ox + sg * (hw + 1), yT - 2, 'silver'); s.px(ox + sg * (hw + 2) + sg, yT - 1, 'white'); }
    s.rect(ox - hw + 1, G - 4, hw * 2 - 1, 2, IRON[1]); s.rect(ox - hw + 1, G - 4, hw * 2 - 1, 1, IRON[2]);
  }
  if (main === 1 && B >= 4) {
    s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 8, IRON[1]); s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 1, IRON[2]); s.rect(ox - hw + 1, yT + 3, 1, 8, IRON[2]); s.rect(ox + hw - 1, yT + 4, 1, 7, IRON[0]);
    for (let i = 0; i < 4; i++) { s.px(ox - hw + 3 + i * 2, yT + 5 + (i & 1) * 3, 'white'); }
    s.rect(ox - 1, yT + 6, 3, 3, ph % 2 ? 'red' : 'crimson'); s.px(ox, yT + 7, 'coral');
    // flache Stachelplatte auf dem Boden
    const mx = ox + 8 + wg;
    s.rect(mx, gy - 2, 13, 2, 'slate'); s.rect(mx, gy - 2, 13, 1, 'stone');
    for (let i = 0; i < 6; i++) { s.px(mx + 1 + i * 2, gy - 3, 'white'); s.px(mx + 1 + i * 2, gy - 4 + (i & 1), 'silver'); }
  }
  // ---- C: Overclock ----
  if (C >= 1 && main !== 2) {
    // Oelkanne am Guertel
    s.box(ox + hw - 1, gy - 9, 5, 4, ['rust', 'amber', 'yellow']); s.px(ox + hw + 4, gy - 8, 'amber'); s.px(ox + hw + 5, gy - 9, 'silver');
  }
  if (main === 2 && C >= 1) {
    // Zahnrad auf der Schulter und Oelkanne
    cog(s, ox + hw + 2, yT, 2.4, ph, BRASS, 6);
    s.box(ox + hw + 3, gy - 9, 5, 4, ['rust', 'amber', 'yellow']); s.px(ox + hw + 8, gy - 8, 'amber');
  }
  if (main === 2 && C >= 3) {
    // Leuchtadern auf der Latzhose, Funkenkragen
    s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 7, L.over[1]); s.rect(ox - hw + 1, yT + 3, hw * 2 - 1, 1, L.over[2]);
    for (let i = 0; i < 3; i++) s.px(ox - 3 + i * 3, yT + 5 + i, ph % 2 ? 'white' : 'ice');
    s.rect(ox - 1, yT + 7, 3, 3, ph % 2 ? 'white' : 'yellow'); s.px(ox, yT + 8, 'orange');
    for (const sg of [-1, 1]) { s.ball(ox + sg * (hw + 1), yT + 1, 3.4, 2.8, ['navy', 'sky', 'ice']); s.px(ox + sg * (hw + 1) - 1, yT, 'white'); front.px(ox + sg * (hw + 3), yT - 3 - ((ph + (sg > 0 ? 1 : 0)) & 1) * 2, ph % 2 ? 'white' : 'yellow'); }
  }
  if (main === 2 && C >= 5) {
    for (let i = 0; i < 5; i++) front.px(ox - hw + i * 2, yT + 2 + ((ph + i) % 4) * 2, i % 2 ? 'white' : 'ice');
  }
  void d;
}

/** Kopf-Beigaben: Muetze, Helm, Funken, Schutzbrille. */
function drawHead(s: Surface, front: Surface, t: Tiers, main: number, cx: number, cy: number, ph: number, hb: number, L: Look, d: Dir): void {
  const [A, B, C] = t;
  const y0 = cy - 5 - hb;
  if (main === 0) {
    if (A >= 1) { s.rect(cx - 2, y0 - 1, 5, 3, 'red'); s.px(cx - 1, y0 - 1, 'coral'); s.px(cx, y0 - 2, 'white'); } // Kuppe mit Warnlicht
    if (A >= 3) { s.rect(cx - 5, y0 + 2, 11, 2, 'amber'); s.rect(cx - 5, y0 + 2, 11, 1, 'yellow'); }
    if (A >= 4) { for (const sg of [-1, 1]) { s.rect(cx + sg * 6 - (sg < 0 ? 1 : 0), y0 + 4, 2, 4, 'amber'); s.px(cx + sg * 6, y0 + 4, 'yellow'); } s.rect(cx - 1, y0 - 4, 3, 3, ph % 2 ? 'yellow' : 'orange'); s.px(cx, y0 - 5, 'white'); }
    if (A >= 5) { cog(s, cx, y0 - 5, 4, ph, BRASS, 8); s.px(cx, y0 - 5, 'white'); for (const sg of [-1, 1]) s.line(cx + sg * 4, y0 - 2, cx + sg * 8, y0 - 6 - (ph & 1), 'yellow'); }
  } else if (main === 1) {
    if (B >= 1) { for (let i = -1; i <= 1; i++) { s.px(cx + i * 3, y0 - 1 - (i === 0 ? 1 : 0), 'silver'); s.px(cx + i * 3, y0, 'stone'); } }
    if (B >= 3) { for (const sg of [-1, 1]) { s.poly([[cx + sg * 5, y0 + 2], [cx + sg * 3, y0 + 2], [cx + sg * 8, y0 - 6]], 'stone'); s.px(cx + sg * 8, y0 - 7, 'white'); } }
    if (B >= 5) { for (let i = -3; i <= 3; i++) { const h = [3, 5, 7, 9, 7, 5, 3][i + 3]; s.line(cx + i * 2, y0 + 1, cx + i * 2, y0 - h, i % 2 ? 'slate' : 'stone'); s.px(cx + i * 2, y0 - h - 1, 'white'); } }
  } else {
    if (C >= 3) { s.px(cx - 4, y0 - 2, ph % 2 ? 'white' : 'ice'); s.px(cx + 4, y0 - 3, ph % 2 ? 'ice' : 'white'); s.px(cx, y0 - 3, 'yellow'); }
    if (C >= 4) { for (let i = -2; i <= 2; i++) s.px(cx + i * 2, y0 - 2 - ((ph + i) & 1) * 2, 'yellow'); }
    if (C >= 5) { for (let i = -3; i <= 3; i++) { const h = [3, 6, 5, 8, 5, 6, 3][i + 3] + ((ph + i) & 1); s.line(cx + i * 2, y0 + 1, cx + i * 2 + (i % 2), y0 - h, i % 2 ? 'white' : 'yellow'); } bolt(front, cx - 8, y0 - 6, cx + 8, y0 - 6, 5 + ph * 6, 'white', 'ice'); }
  }
  void L; void d; void A; void B; void C;
}
