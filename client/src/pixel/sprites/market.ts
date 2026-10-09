/**
 * Lantern Market (Runde 13): Marktstand mit Haendlerin, 15 Stufen sichtbar (docs/design/tuerme-r13.md).
 * Haupt-Pfad (hoechste Stufe) bestimmt das Gebaeude und die Dachfarbe: A Harvest = warm (Stand -> Halle -> Gildenhaus -> goldene Kuppel),
 * B Bank = blaugrau (Beutel -> Truhe -> Bank -> Schreibstube -> Schatzkammer), C Town Square = Orchidee (Wachturm -> Glocke -> Trommeln
 * -> Waffenstaender -> Rathaus). Der zweite Pfad (max. 2) setzt kleine Zusaetze daneben. Kein Angriff, nur Idle (Laternen, Winken).
 * Keine Plattform: das Gebaeude steht auf dem Boden, der Schatten wird separat gezeichnet.
 */
import type { PalName } from '../palette';
import { flame, spark } from './parts';
import { growOf as _g } from './gear';
import { mainPath } from './gear';
import { GY, OX, OY, TH, TW, type TowerLayers } from './ranger';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Pose } from './pose';
import type { Tiers } from './types';

void _g;
const ROOF: Ramp[] = [['plum', 'crimson', 'red'], ['night', 'dusk', 'slate'], ['night', 'violet', 'orchid']];
const TRIM: PalName[] = ['amber', 'sky', 'orchid'];
const TRIM_HI: PalName[] = ['yellow', 'ice', 'coral'];

/** Laterne mit Aufhaenger, Flackern ueber `ph`. (x, y) = Oberkante des Aufhaengers. */
export function lamp(s: Surface, front: Surface, x: number, y: number, ph: number, big = false): void {
  const w = big ? 5 : 3, h = big ? 6 : 4;
  s.px(x, y, 'bark'); s.px(x, y + 1, 'bark');
  const y0 = y + 2, x0 = x - (w >> 1);
  s.rect(x0, y0, w, 1, 'rust');
  s.rect(x0, y0 + 1, w, h - 2, ph % 2 ? 'yellow' : 'amber');
  s.rect(x0, y0 + h - 1, w, 1, 'rust');
  s.px(x, y0 + 1 + ((h - 2) >> 1), ph % 3 === 0 ? 'orange' : 'white');
  if (big) s.px(x0 + 1, y0 + 1, 'white');
  if (ph % 2 === 0) front.pxUnder(x, y0 - 1 - (big ? 1 : 0), 'yellow');
}

/** Haendlerin: Kopftuch, Schuerze, winkt (ph 1 und 2 Arm oben). (x, gy) = Fuss. */
export function merchant(s: Surface, x: number, gy: number, ph: number, hidden = 0): void {
  const dress = RAMPS.plum;
  s.poly([[x - 3, gy - 9], [x + 3, gy - 9], [x + 4, gy - hidden], [x - 4, gy - hidden]], (px) => (px < x - 1 ? dress[2] : px > x + 2 ? dress[0] : dress[1]));
  s.rect(x - 2, gy - 6, 5, 4, 'white'); s.rect(x - 2, gy - 6, 5, 1, 'silver');
  s.rect(x - 1, gy - 9, 3, 1, 'amber');
  s.ball(x, gy - 12, 3.4, 3.2, RAMPS.skin);
  s.ellipseFn(x, gy - 13.4, 3.8, 3, (_x, y) => (y < gy - 13 ? (_x < x ? 'yellow' : 'amber') : null));
  s.px(x - 4, gy - 11, 'amber'); s.px(x + 4, gy - 11, 'orange');
  s.px(x - 1, gy - 12, 'ink'); s.px(x + 1, gy - 12, 'ink');
  s.px(x - 2, gy - 11, 'coral'); s.px(x + 2, gy - 11, 'coral');
  // linker Arm haengt, rechter winkt
  s.rect(x - 5, gy - 8, 2, 4, dress[1]); s.px(x - 5, gy - 4, 'skin');
  if (ph === 1 || ph === 2) {
    s.line(x + 3, gy - 8, x + 6, gy - 14 - (ph === 2 ? 1 : 0), dress[1], 2);
    s.rect(x + 5, gy - 17 - (ph === 2 ? 1 : 0), 2, 2, 'skin');
  } else {
    s.rect(x + 3, gy - 8, 2, 4, dress[1]); s.px(x + 4, gy - 4, 'skin');
  }
}

function awning(s: Surface, x0: number, x1: number, yTop: number, h: number, c1: PalName, c2: PalName, ph: number): void {
  for (let y = 0; y < h; y++) {
    const inset = Math.round((1 - y / (h - 1)) * 2);
    for (let x = x0 - 2 + inset; x <= x1 + 2 - inset; x++) s.px(x, yTop + y, Math.floor((x - x0 + 100) / 3) % 2 ? c1 : c2);
    s.px(x0 - 2 + inset, yTop + y, c1);
  }
  s.rect(x0 - 1, yTop, x1 - x0 + 3, 1, 'white');
  // Zacken unten
  for (let x = x0 - 2; x <= x1 + 2; x++) if (Math.floor((x - x0 + 100) / 3) % 2 === 0) s.px(x, yTop + h, c1);
  void ph;
}

function crate(s: Surface, x: number, y: number, w: number, h: number, fruit: PalName[] = []): void {
  s.box(x, y, w, h, RAMPS.wood);
  fruit.forEach((c, i) => { s.rect(x + 1 + i * 2, y - 2, 2, 2, c); s.px(x + 1 + i * 2, y - 2, 'white'); });
}

function flag(s: Surface, x: number, y: number, len: number, col: Ramp, ph: number): void {
  s.rect(x, y, 1, len, 'bark');
  s.px(x, y - 1, 'yellow');
  const w = [0, 1, 0, -1][ph & 3];
  for (let i = 0; i < 4; i++) { s.rect(x + 1, y + 1 + i, 5 - (i >> 1) + (i === 3 ? w : 0), 1, i < 2 ? col[1] : col[0]); }
  s.px(x + 1, y + 1, col[2]);
}

/** Fachwerk-/Steinhaus: Waende, Dach, Tuer, Fenster. Liefert die Dachkante (yTop). */
function house(s: Surface, cx: number, G: number, w: number, h: number, wall: Ramp, roof: Ramp, o: { beams?: boolean; roofH?: number; door?: boolean; windows?: number; trim?: PalName; gable?: boolean } = {}): number {
  const x0 = cx - (w >> 1), roofH = o.roofH ?? 8;
  s.box(x0, G - h, w, h, wall);
  if (o.beams) {
    for (let x = x0 + 1; x < x0 + w - 1; x += 8) s.rect(x, G - h + 1, 2, h - 1, 'bark');
    s.rect(x0, G - (h >> 1), w, 1, 'bark');
  } else {
    for (let y = G - h + 3; y < G - 1; y += 4) for (let x = x0 + 1 + ((y >> 2) & 1) * 3; x < x0 + w - 1; x += 6) s.rect(x, y, 3, 1, wall[0]);
  }
  // Dach
  const ry = G - h;
  s.poly([[x0 - 3, ry + 1], [x0 + 3, ry - roofH], [x0 + w - 3, ry - roofH], [x0 + w + 3, ry + 1]], (x, y) => ((y - ry) % 3 === 0 ? roof[0] : x < cx - w / 4 ? roof[2] : x > cx + w / 4 ? roof[0] : roof[1]));
  s.rect(x0 - 3, ry, w + 7, 1, roof[0]); s.rect(x0 - 3, ry - 1, w + 7, 1, o.trim ?? roof[2]);
  if (o.gable) s.poly([[cx - 6, ry - roofH], [cx, ry - roofH - 6], [cx + 6, ry - roofH]], (x) => (x < cx ? roof[2] : roof[1]));
  if (o.door !== false) {
    s.rect(cx - 3, G - 9, 7, 9, 'plum'); s.rect(cx - 2, G - 10, 5, 1, 'plum');
    s.rect(cx - 3, G - 9, 7, 1, 'bark'); s.px(cx + 2, G - 4, 'yellow');
  }
  const nw = o.windows ?? 2;
  for (let i = 0; i < nw; i++) {
    const wx = nw === 1 ? cx : Math.round(x0 + 4 + (i * (w - 11)) / Math.max(1, nw - 1));
    if (Math.abs(wx - cx) < 6 && o.door !== false) continue;
    s.rect(wx - 1, G - h + 4, 4, 5, 'bark'); s.rect(wx, G - h + 5, 2, 3, 'yellow'); s.px(wx, G - h + 5, 'white');
  }
  return ry - roofH;
}

function pillars(s: Surface, x0: number, x1: number, y0: number, y1: number, step: number, ramp: Ramp = ['silver', 'white', 'white']): void {
  for (let x = x0; x <= x1; x += step) { s.rect(x, y0, 2, y1 - y0, ramp[1]); s.rect(x, y0, 1, y1 - y0, ramp[2]); s.rect(x + 1, y0, 1, y1 - y0, ramp[0]); s.rect(x - 1, y0, 4, 1, ramp[0]); s.rect(x - 1, y1 - 1, 4, 1, ramp[0]); }
}

function coinPile(s: Surface, cx: number, G: number, w: number, h: number, ph: number): void {
  for (let y = 0; y < h; y++) {
    const ww = Math.round(w * (1 - y / h) * 0.5 + 1);
    for (let x = -ww; x <= ww; x++) s.px(cx + x, G - y, ((x + y * 2) & 3) === 0 ? 'amber' : ((x * 3 + y) & 3) === 1 ? 'orange' : 'yellow');
  }
  s.px(cx - 2, G - h + 2, 'white'); s.px(cx + 3, G - 2, 'white');
  if (ph % 2) s.px(cx + 1, G - h, 'white');
}

export function drawMarket(t: Tiers, p: Pose): TowerLayers {
  const s = new Surface(TW, TH), back = new Surface(TW, TH), front = new Surface(TW, TH);
  const [A, B, C] = t;
  const main = mainPath(t), top = t[main];
  const ph = p.ph, G = GY, ox = OX;
  const bld = top >= 3;
  const roof = ROOF[main], trim = TRIM[main], hi = TRIM_HI[main];
  let hw = 12; // halbe Breite des Hauptbaus (fuer Zusaetze)
  let topY = G - 30;

  if (!bld) {
    // ---------- Marktstand ----------
    const c1: PalName = top >= 1 ? trim : 'crimson';
    for (const px of [ox - 10, ox + 9]) { s.rect(px, G - 30, 2, 30, 'wood'); s.rect(px, G - 30, 1, 30, 'tan'); s.rect(px + 1, G - 28, 1, 28, 'bark'); }
    s.rect(ox - 9, G - 24, 18, 15, 'plum'); // Rueckwand dunkel
    merchant(s, ox, G - 8, ph, 0);
    s.box(ox - 10, G - 9, 21, 9, RAMPS.wood);
    s.rect(ox - 9, G - 6, 19, 1, 'bark'); s.rect(ox - 9, G - 3, 19, 1, 'bark');
    s.rect(ox - 10, G - 10, 21, 1, 'tan');
    // Waren
    crate(s, ox - 9, G - 13, 5, 3, ['red', 'amber', 'leaf']);
    s.rect(ox + 5, G - 14, 3, 4, 'sky'); s.rect(ox + 5, G - 15, 3, 1, 'silver'); s.px(ox + 5, G - 13, 'white');
    s.rect(ox + 8, G - 12, 2, 2, 'orange');
    awning(s, ox - 10, ox + 10, G - 33, 8, c1, 'sand', ph);
    lamp(s, front, ox - 11, G - 24, ph); lamp(s, front, ox + 12, G - 24, ph + 1);
    topY = G - 33;
    hw = 12;
  } else if (main === 0) {
    if (A === 3) {
      // Fachwerkhalle
      hw = 17;
      topY = house(s, ox, G, 34, 22, RAMPS.sand, ROOF[0], { beams: true, roofH: 10, door: false, windows: 0, trim: 'amber' });
      s.rect(ox - 8, G - 14, 17, 14, 'plum'); s.rect(ox - 8, G - 15, 17, 1, 'bark');
      for (const dx of [-13, 12]) { s.rect(ox + dx, G - 19, 3, 5, 'bark'); s.rect(ox + dx, G - 18, 3, 3, 'yellow'); s.px(ox + dx, G - 18, 'white'); }
      s.box(ox - 9, G - 6, 19, 6, RAMPS.wood);
      merchant(s, ox, G - 6, ph, 0);
      crate(s, ox - 7, G - 9, 5, 3, ['red', 'amber']); s.rect(ox + 4, G - 10, 3, 4, 'sky');
      awning(s, ox - 9, ox + 9, G - 20, 5, 'amber', 'sand', ph);
      s.rect(ox - 3, G - 27, 7, 5, 'bark'); s.ball(ox, G - 24.5, 2.4, 2.4, ['rust', 'amber', 'yellow']); s.px(ox - 1, G - 26, 'white'); // Muenzschild
      lamp(s, front, ox - 12, G - 14, ph, true); lamp(s, front, ox + 12, G - 14, ph + 1, true);
    } else if (A === 4) {
      // Gildenhaus mit Wappen
      hw = 20;
      topY = house(s, ox, G, 38, 24, RAMPS.stone, ROOF[0], { roofH: 8, door: true, windows: 3, trim: 'yellow', gable: true });
      s.rect(ox - 19, G - 24, 38, 1, 'amber'); s.rect(ox - 19, G - 1, 38, 1, 'amber');
      for (const dx of [-16, 14]) { s.rect(ox + dx, G - 22, 3, 22, 'silver'); s.rect(ox + dx, G - 22, 1, 22, 'white'); }
      // Wappen ueber der Tuer
      s.poly([[ox - 4, G - 20], [ox + 5, G - 20], [ox + 5, G - 14], [ox, G - 11], [ox - 4, G - 14]], (x) => (x < ox ? 'red' : 'crimson'));
      s.rect(ox - 4, G - 20, 9, 1, 'yellow'); s.ball(ox, G - 16, 2, 2, ['rust', 'amber', 'yellow']); s.px(ox - 1, G - 17, 'white');
      merchant(s, ox + 10, G, ph, 0);
      for (const dx of [-12, 12]) { s.line(ox + dx, G - 23, ox + dx, G - 17, 'bark'); lamp(s, front, ox + dx, G - 17, ph + dx, true); }
      flag(s, ox - 17, topY - 8, 12, RAMPS.red, ph); flag(s, ox + 16, topY - 8, 12, RAMPS.red, ph + 2);
    } else {
      // Goldene Kuppel
      hw = 22;
      s.box(ox - 19, G - 16, 38, 16, RAMPS.sand);
      s.rect(ox - 19, G - 16, 38, 2, 'white'); s.rect(ox - 19, G - 1, 38, 1, 'amber');
      pillars(s, ox - 17, ox + 15, G - 14, G - 1, 5);
      s.rect(ox - 4, G - 12, 9, 11, 'plum'); s.rect(ox - 4, G - 12, 9, 1, 'amber');
      merchant(s, ox, G, ph, 0);
      s.poly([[ox - 21, G - 16], [ox + 21, G - 16], [ox + 18, G - 20], [ox - 18, G - 20]], (x) => (x < ox ? 'yellow' : 'amber'));
      s.rect(ox - 21, G - 17, 43, 1, 'rust');
      // Kuppel
      s.ellipseFn(ox, G - 20, 15, 14, (x, y, nx, ny) => {
        if (y >= G - 20) return null;
        const l = -nx * 0.55 - ny * 0.75;
        if ((x + y) % 5 === 0 && ny < 0.2) return 'yellow';
        return l > 0.5 ? 'yellow' : l > -0.2 ? 'amber' : 'orange';
      });
      s.rect(ox - 15, G - 21, 31, 1, 'yellow'); s.rect(ox - 15, G - 20, 31, 1, 'rust');
      s.rect(ox - 1, G - 40, 3, 5, 'amber'); s.px(ox, G - 42, 'yellow'); s.rect(ox, G - 41, 1, 1, 'white');
      s.px(ox - 8, G - 28, 'white'); s.px(ox - 7, G - 29, 'white'); s.px(ox - 6, G - 29, 'yellow');
      topY = G - 42;
      for (const dx of [-12, 12]) lamp(s, front, ox + dx, G - 20, ph + dx, true);
      // Muenzregen: Muenzen fallen von der Kuppel
      for (let i = 0; i < 6; i++) {
        const k = (ph * 2 + i * 3) % 12, x = ox - 16 + i * 6 + ((i * 7) % 3);
        const y = G - 22 + k * 1.8;
        if (y < G - 2) { front.rect(x, y, 2, 2, k % 3 ? 'yellow' : 'amber'); front.px(x, y, 'white'); }
      }
      if (ph % 2) spark(front, ox - 9, G - 32, 'white', true); else spark(front, ox + 8, G - 29, 'white', true);
    }
  } else if (main === 1) {
    if (B === 3) {
      // Laternenbank mit Tresortuer
      hw = 18;
      s.box(ox - 17, G - 18, 34, 18, RAMPS.stone);
      s.rect(ox - 17, G - 18, 34, 1, 'white'); s.rect(ox - 17, G - 1, 34, 1, 'slate');
      pillars(s, ox - 15, ox + 13, G - 17, G - 1, 5);
      s.poly([[ox - 20, G - 18], [ox, G - 28], [ox + 20, G - 18]], (x, y) => (y < G - 26 ? 'white' : x < ox ? 'silver' : 'stone'));
      s.line(ox - 20, G - 18, ox, G - 28, 'slate'); s.line(ox, G - 28, ox + 20, G - 18, 'slate'); s.rect(ox - 20, G - 18, 41, 1, 'slate');
      s.ball(ox, G - 22, 2.4, 2.4, ['rust', 'amber', 'yellow']); s.px(ox - 1, G - 23, 'white');
      // Tresortuer
      s.rect(ox - 8, G - 14, 17, 13, 'night');
      s.ball(ox, G - 8, 6, 6, RAMPS.steel); s.ring(ox, G - 8, 4.4, 4.4, 'slate');
      s.rect(ox - 1, G - 9, 3, 3, 'amber'); s.px(ox, G - 8, 'yellow');
      const wa = (ph * Math.PI) / 4; s.line(ox - Math.cos(wa) * 3.4, G - 8 - Math.sin(wa) * 3.4, ox + Math.cos(wa) * 3.4, G - 8 + Math.sin(wa) * 3.4, 'amber');
      for (const [bx, by] of [[ox - 5, G - 12], [ox + 5, G - 12], [ox - 5, G - 4], [ox + 5, G - 4]]) s.px(bx, by, 'silver');
      lamp(s, front, ox - 12, G - 12, ph, true); lamp(s, front, ox + 12, G - 12, ph + 1, true);
      merchant(s, ox + 14, G, ph, 0);
      topY = G - 28;
    } else if (B === 4) {
      // Schreibstube mit Siegel
      hw = 18;
      topY = house(s, ox, G, 34, 18, RAMPS.wood, ROOF[1], { roofH: 8, door: true, windows: 2, trim: 'sky' });
      // Siegel-Schild
      s.rect(ox - 1, G - 28, 3, 7, 'bark');
      s.ball(ox, G - 24, 5, 5, RAMPS.red); s.ring(ox, G - 24, 4.2, 4.2, 'crimson');
      for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28 - 1.57; s.px(ox + Math.cos(a) * 2.2, G - 24 + Math.sin(a) * 2.2, 'yellow'); }
      s.px(ox, G - 24, 'yellow'); s.px(ox - 2, G - 27, 'white');
      // Schriftrollen und Pult
      s.rect(ox + 11, G - 8, 6, 8, 'bark'); s.rect(ox + 10, G - 10, 8, 2, 'tan');
      s.rect(ox + 10, G - 12, 7, 2, 'white'); s.px(ox + 10, G - 12, 'sand'); s.rect(ox + 13, G - 14, 1, 3, 'white'); s.px(ox + 14, G - 14, 'amber');
      s.rect(ox - 17, G - 6, 4, 6, 'sand'); s.rect(ox - 17, G - 6, 4, 1, 'white'); s.px(ox - 16, G - 4, 'crimson');
      merchant(s, ox - 9, G, ph, 0);
      lamp(s, front, ox - 6, G - 17, ph); lamp(s, front, ox + 7, G - 17, ph + 1);
      flag(s, ox + 18, topY - 4, 11, ROOF[1], ph);
    } else {
      // Schatzkammer mit Goldberg
      hw = 20;
      s.box(ox - 19, G - 22, 38, 22, RAMPS.stone);
      for (let y = G - 20; y < G - 1; y += 4) for (let x = ox - 18 + ((y >> 2) & 1) * 4; x < ox + 18; x += 8) s.rect(x, y, 4, 1, 'slate');
      for (let x = ox - 19; x < ox + 19; x += 6) { s.rect(x, G - 26, 4, 4, 'stone'); s.rect(x, G - 26, 4, 1, 'silver'); }
      s.rect(ox - 19, G - 23, 38, 1, 'amber'); s.rect(ox - 19, G - 22, 38, 1, 'rust');
      // offene Goldtore mit Goldhaufen
      s.rect(ox - 8, G - 17, 17, 17, 'night');
      coinPile(s, ox, G - 1, 18, 12, ph);
      s.poly([[ox - 12, G - 17], [ox - 8, G - 17], [ox - 8, G], [ox - 12, G - 1]], (x) => (x < ox - 10 ? 'yellow' : 'amber'));
      s.poly([[ox + 9, G - 17], [ox + 13, G - 17], [ox + 13, G - 1], [ox + 9, G]], (x) => (x < ox + 11 ? 'yellow' : 'amber'));
      s.rect(ox - 12, G - 12, 4, 1, 'rust'); s.rect(ox + 9, G - 12, 4, 1, 'rust');
      // Goldberg draussen
      coinPile(s, ox - 17, G, 12, 8, ph + 1); coinPile(s, ox + 17, G, 10, 7, ph);
      flag(s, ox - 16, G - 40, 14, RAMPS.gold, ph); flag(s, ox + 15, G - 40, 14, RAMPS.gold, ph + 2);
      s.ball(ox, G - 28, 4, 3, RAMPS.gold); s.rect(ox - 2, G - 27, 5, 1, 'rust'); s.px(ox - 1, G - 29, 'white');
      // Funkeln
      spark(front, ox - 10 + (ph % 2) * 14, G - 14 - ph, 'white', true);
      for (let i = 0; i < 4; i++) { const k = (ph + i * 2) % 8; front.px(ox - 10 + i * 7, G - 4 - k * 2, k < 4 ? 'yellow' : 'white'); }
      topY = G - 40;
    }
  } else {
    if (C === 3) {
      // Trommelhalle
      hw = 17;
      topY = house(s, ox, G, 32, 17, RAMPS.wood, ROOF[2], { beams: true, roofH: 9, door: false, windows: 0, trim: 'orchid' });
      s.rect(ox - 9, G - 12, 19, 12, 'plum');
      for (const [dx, sz] of [[-9, 6], [0, 7], [9, 6]] as [number, number][]) {
        const dy = G - sz - 1 + (ph % 2 && dx === 0 ? 1 : 0);
        s.rect(ox + dx - sz / 2, dy, sz, sz, 'rust'); s.rect(ox + dx - sz / 2, dy, sz, 1, 'tan'); s.rect(ox + dx - sz / 2, dy, 1, sz, 'clay'); s.rect(ox + dx + sz / 2 - 1, dy, 1, sz, 'crimson');
        s.ellipse(ox + dx, dy, sz / 2, 1.6, 'sand'); s.px(ox + dx - 1, dy - 1, 'white');
        for (let k = 0; k < sz; k += 2) s.px(ox + dx - sz / 2 + k, dy + sz - 2, 'amber');
        s.line(ox + dx - sz / 2, dy + 2, ox + dx + sz / 2 - 1, dy + sz - 3, 'bark'); s.line(ox + dx - sz / 2, dy + sz - 3, ox + dx + sz / 2 - 1, dy + 2, 'bark');
      }
      // Trommelstoecke zuckend
      if (ph % 2 === 1) { s.line(ox - 14, G - 14, ox - 10, G - 9, 'tan'); s.px(ox - 9, G - 9, 'white'); }
      flag(s, ox - 14, topY - 6, 14, RAMPS.plum, ph); flag(s, ox + 14, topY - 6, 14, RAMPS.plum, ph + 2);
      lamp(s, front, ox - 15, G - 12, ph, true); lamp(s, front, ox + 15, G - 12, ph + 1, true);
      merchant(s, ox + 14, G, ph, 0);
    } else if (C === 4) {
      // Waffenkammer
      hw = 19;
      topY = house(s, ox, G, 36, 20, RAMPS.stone, ROOF[2], { roofH: 7, door: true, windows: 2, trim: 'silver' });
      // Waffenstaender links und rechts der Tuer
      for (const sg of [-1, 1]) {
        const rx = ox + sg * 12;
        s.rect(rx - 4, G - 3, 9, 3, 'bark'); s.rect(rx - 4, G - 3, 9, 1, 'wood');
        for (let i = 0; i < 4; i++) { const lx = rx - 3 + i * 2; s.line(lx, G - 4, lx + sg, G - 14 - (i % 2), 'wood'); s.px(lx + sg, G - 15 - (i % 2), 'silver'); s.px(lx + sg, G - 14 - (i % 2), 'white'); }
        s.ball(rx - sg * 4, G - 8, 3, 3.4, sg < 0 ? RAMPS.red : RAMPS.ice); s.px(rx - sg * 4, G - 8, 'yellow');
      }
      // Amboss mit Funken
      s.rect(ox - 2, G - 3, 5, 2, 'slate'); s.rect(ox - 3, G - 4, 7, 1, 'stone'); s.rect(ox + 4, G - 4, 2, 1, 'stone');
      if (ph % 2) { spark(front, ox + 1, G - 7, 'yellow'); front.px(ox - 3, G - 8, 'amber'); }
      flag(s, ox - 17, topY - 6, 14, ROOF[2], ph); flag(s, ox + 17, topY - 6, 14, ROOF[2], ph + 2);
      merchant(s, ox + 1, G, ph, 0);
    } else {
      // Rathaus mit Uhrturm
      hw = 22;
      s.box(ox - 21, G - 20, 42, 20, RAMPS.stone);
      for (let y = G - 18; y < G - 1; y += 4) for (let x = ox - 20 + ((y >> 2) & 1) * 4; x < ox + 20; x += 8) s.rect(x, y, 4, 1, 'slate');
      s.rect(ox - 21, G - 20, 42, 1, 'white'); s.rect(ox - 21, G - 21, 42, 1, 'amber');
      s.poly([[ox - 24, G - 21], [ox - 18, G - 28], [ox + 18, G - 28], [ox + 24, G - 21]], (x, y) => ((y + 1) % 3 === 0 ? ROOF[2][0] : x < ox ? ROOF[2][2] : ROOF[2][1]));
      // Turm
      s.box(ox - 6, G - 46, 13, 26, RAMPS.stone);
      s.rect(ox - 6, G - 46, 13, 1, 'white'); s.rect(ox - 7, G - 47, 15, 2, 'amber');
      s.poly([[ox - 8, G - 47], [ox, G - 60], [ox + 9, G - 47]], (x) => (x < ox ? ROOF[2][2] : ROOF[2][1]));
      s.px(ox, G - 61, 'yellow'); s.px(ox, G - 62, 'white');
      // Uhr
      s.ball(ox, G - 38, 5, 5, ['silver', 'white', 'white']); s.ring(ox, G - 38, 5, 5, 'amber');
      for (const [dx, dy] of [[0, -4], [4, 0], [0, 4], [-4, 0]]) s.px(ox + dx, G - 38 + dy, 'ink');
      const ha = (ph * Math.PI) / 2 - 1.57;
      s.line(ox, G - 38, ox + Math.cos(ha) * 4, G - 38 + Math.sin(ha) * 4, 'ink'); s.line(ox, G - 38, ox + 2, G - 38, 'night');
      // Tor, Fenster
      s.rect(ox - 4, G - 12, 9, 12, 'plum'); s.rect(ox - 3, G - 13, 7, 1, 'plum'); s.rect(ox - 4, G - 12, 9, 1, 'amber'); s.px(ox - 2, G - 14, 'plum'); s.px(ox + 4, G - 14, 'plum');
      for (const dx of [-16, -10, 10, 16]) { s.rect(ox + dx - 1, G - 16, 4, 7, 'bark'); s.rect(ox + dx, G - 15, 2, 5, 'yellow'); s.px(ox + dx, G - 15, 'white'); s.rect(ox + dx - 1, G - 17, 4, 1, 'orchid'); }
      s.rect(ox - 8, G - 2, 17, 2, 'silver'); s.rect(ox - 10, G - 1, 21, 1, 'stone');
      flag(s, ox - 22, G - 40, 14, ROOF[2], ph); flag(s, ox + 22, G - 40, 14, ROOF[2], ph + 2);
      for (const dx of [-14, 14]) lamp(s, front, ox + dx, G - 27, ph + dx, true);
      merchant(s, ox + 14, G, ph, 0);
      // Leuchtender Kranz um die Turmspitze
      if (ph % 2) { front.px(ox - 3, G - 58, 'yellow'); front.px(ox + 4, G - 54, 'white'); } else { front.px(ox + 3, G - 59, 'yellow'); front.px(ox - 4, G - 55, 'white'); }
      topY = G - 62;
    }
  }

  // ---------- Zusaetze nach Pfaden (Stand-Stufe: je Pfad ein Merkmal; Gebaeude: kleine Beigaben daneben) ----------
  const lx = ox - hw - 5, rx = ox + hw + 5;
  const fits = (x: number): number => Math.max(5, Math.min(TW - 6, x));
  // A: zweiter Stand / Warenkisten (1), Laternenkette (2)
  if (A >= 1 && !(bld && main === 0)) {
    const ax = fits(lx);
    if (!bld) {
      // zweiter, kleinerer Stand links
      s.rect(ax - 5, G - 18, 1, 18, 'wood'); s.rect(ax + 4, G - 18, 1, 18, 'wood');
      s.box(ax - 6, G - 7, 12, 7, RAMPS.wood); s.rect(ax - 6, G - 8, 12, 1, 'tan');
      awning(s, ax - 5, ax + 5, G - 21, 4, 'amber', 'sand', ph);
      crate(s, ax - 4, G - 11, 4, 3, ['red', 'leaf']); s.rect(ax + 2, G - 11, 3, 3, 'orange');
      s.rect(ax - 1, G - 15, 2, 4, 'rust'); s.px(ax - 1, G - 15, 'yellow');
    } else {
      crate(s, ax - 3, G - 5, 6, 5, ['red', 'amber', 'leaf']); crate(s, ax - 1, G - 10, 5, 4, ['orange']);
    }
  }
  if (A >= 2 && !(bld && main === 0)) {
    // Laternenkette quer ueber die ganze Breite
    const x0 = fits(lx - 6), x1 = fits(rx + 6), y0 = (bld ? G - 28 : G - 33) - 2;
    for (let x = x0; x <= x1; x++) { const k = (x - x0) / Math.max(1, x1 - x0); back.px(x, y0 + Math.sin(k * Math.PI) * 5, 'bark'); }
    for (let i = 0; i < 5; i++) { const k = (i + 0.5) / 5; lamp(s, front, Math.round(x0 + (x1 - x0) * k), Math.round(y0 + Math.sin(k * Math.PI) * 5), ph + i); }
  }
  // B: Beutel (1), Truhe (2)
  if (B >= 1 && !(bld && main === 1)) {
    const bx = fits(rx);
    if (B >= 2) {
      s.box(bx - 5, G - 7, 11, 7, RAMPS.wood); s.rect(bx - 5, G - 9, 11, 3, 'bark'); s.rect(bx - 5, G - 9, 11, 1, 'wood');
      s.rect(bx - 5, G - 5, 11, 1, 'slate'); s.rect(bx - 1, G - 7, 3, 5, 'silver'); s.px(bx, G - 5, 'ink');
      for (const dx of [-4, 4]) s.rect(bx + dx, G - 9, 1, 8, 'iron'[0] ? 'slate' : 'slate');
      s.px(bx - 4, G - 9, 'stone');
    } else {
      s.ball(bx, G - 5, 4, 4, ['rust', 'tan', 'sand']); s.rect(bx - 2, G - 10, 5, 2, 'bark'); s.rect(bx - 1, G - 9, 3, 1, 'yellow'); s.px(bx, G - 5, 'yellow');
      s.px(bx + 1, G - 3, 'yellow');
    }
  }
  // C: Wachturm (1), Glocke (2)
  if (C >= 1 && !(bld && main === 2)) {
    const cx = fits(bld ? rx + 3 : ox + 25);
    s.rect(cx - 3, G - 24, 7, 24, 'bark'); s.rect(cx - 3, G - 24, 1, 24, 'wood'); s.rect(cx + 3, G - 24, 1, 24, 'plum');
    for (let y = G - 21; y < G; y += 5) s.rect(cx - 3, y, 7, 1, 'plum');
    s.rect(cx - 5, G - 28, 11, 4, 'wood'); s.rect(cx - 5, G - 28, 11, 1, 'tan');
    s.poly([[cx - 6, G - 28], [cx, G - 35], [cx + 7, G - 28]], (x) => (x < cx ? ROOF[2][2] : ROOF[2][1]));
    s.rect(cx - 2, G - 26, 5, 2, 'yellow'); s.px(cx - 1, G - 26, 'white');
    flag(s, cx + 1, G - 44, 9, ROOF[2], ph);
    if (C >= 2) {
      const sw = [0, 1, 0, -1][ph];
      s.rect(cx - 4, G - 22, 9, 1, 'bark');
      s.poly([[cx - 2 + sw, G - 21], [cx + 2 + sw, G - 21], [cx + 4 + sw, G - 16], [cx - 4 + sw, G - 16]], (x) => (x < cx + sw ? 'yellow' : 'amber'));
      s.px(cx + sw, G - 15, 'rust'); s.px(cx - 1 + sw, G - 20, 'white');
    }
  }
  void OY; void topY; void flame;
  return { fig: s, back, front, muzzle: [0, -16] };
}
