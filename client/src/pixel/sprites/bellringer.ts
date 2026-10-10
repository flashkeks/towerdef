/**
 * Bellringer (Runde 16, Paket TP): Glockenturm mit Gloeckner, Unterstuetzung ohne Angriff (Auren). Wie der Market ein Bauwerk ohne Drehung
 * und ohne Sockelplatte; der Gloeckner zieht am Seil, die Glocke schwingt in allen Frames. Atk-Frames = die Glocke schlaegt voll aus
 * (der Renderer nimmt sie, solange das Alarm-Signal laeuft).
 * A Chimes: Swift Chime (zweite Glocke) -> Resonant Bronze (drei Glocken, Klangwellen) -> Grand Peal (Steinturm) -> Cathedral Bells (Spitzturm,
 *           zwei Glockenstockwerke) -> Grand Carillon (Goldturm mit sieben Glocken, Klangwellen, Bodenring).
 * B Watch:  Watch Bell (Laterne + Wachauge) -> Haggler's Bell (Preistafel, Waage) -> Alarm (Wachturm mit roter Alarmglocke) -> Town Crier
 *           (Ausrufer mit Horn und Fahne) -> Dusk Siren (schlanker Wachturm, grosses Auge, vier Sirenentrichter).
 * C Toll:   Toll of Coin (Muenzkasten) -> Silver Bell (Silberglocke, Truhe) -> Merchants' Peal (Goldglocke, Markise) -> Bell Foundry (Esse mit
 *           fluessigem Gold) -> Golden Belfry (Goldturm, Muenzregen).
 * Zweitpfad (max. 2): kleine Beigaben neben dem Fuss (Windspiel, Laterne mit Schild, Muenzsack).
 */
import type { PalName } from '../palette';
import { flame, spark } from './parts';
import { mainPath } from './gear';
import { GY, OX, TH, TW, type TowerLayers } from './ranger';
import { RAMPS, type Ramp, Surface } from './surface';
import type { Pose } from './pose';
import type { Tiers } from './types';

const BRASS: Ramp = ['rust', 'amber', 'yellow'];
const BRONZE: Ramp = ['clay', 'orange', 'amber'];
const SILVER: Ramp = ['slate', 'silver', 'white'];
const STEEL: Ramp = ['dusk', 'stone', 'silver'];
const ALARM: Ramp = ['crimson', 'red', 'coral'];
const GOLDR: Ramp = ['rust', 'amber', 'yellow'];
const ROOF: Ramp[] = [RAMPS.crimson, ['night', 'navy', 'sky'], RAMPS.plum];
const WALL: Ramp[] = [['stone', 'silver', 'white'], ['slate', 'stone', 'silver'], ['clay', 'tan', 'sand']];

/** Glocke. (cx, y0) = Aufhaenger, `w` = Breite am Rand, `h` = Hoehe, `swing` = Ausschlag des Randes in px. Liefert die Randmitte unten. */
export function bell(s: Surface, cx: number, y0: number, w: number, h: number, ramp: Ramp, swing: number, o: { clapper?: PalName; band?: boolean } = {}): [number, number] {
  s.px(cx, y0, 'bark'); s.px(cx + Math.round(swing * 0.15), y0 + 1, 'bark');
  const yb = y0 + 1;
  for (let i = 0; i < h; i++) {
    const f = i / Math.max(1, h - 1);
    const prof = f < 0.22 ? 0.34 + f * 1.7 : f < 0.72 ? 0.72 + (f - 0.22) * 0.34 : 0.89 + (f - 0.72) * 0.4;
    let hw = Math.max(1, Math.round((w / 2) * Math.min(1, prof)));
    if (i === h - 1) hw += 1;
    const off = Math.round(swing * f);
    for (let x = -hw; x <= hw; x++) {
      const u = x / hw;
      let c: PalName = u < -0.4 ? ramp[2] : u > 0.4 ? ramp[0] : ramp[1];
      if (i === h - 1) c = u > 0.3 ? ramp[0] : ramp[1];
      else if (i === h - 2 && u < 0.4) c = ramp[2];
      s.px(cx + off + x, yb + i, c);
    }
  }
  if (o.band !== false && h >= 7) {
    const bi = Math.round(h * 0.45), off = Math.round(swing * (bi / (h - 1))), hw = Math.max(1, Math.round((w / 2) * 0.78));
    for (let x = -hw + 1; x < hw; x++) s.px(cx + off + x, yb + bi, ramp[0]);
  }
  if (h >= 6) { const hx = cx + Math.round(swing * 0.3) - Math.max(1, Math.round(w / 4)); s.px(hx, yb + Math.round(h * 0.3), 'white'); if (h >= 9) s.px(hx, yb + Math.round(h * 0.3) + 1, ramp[2]); }
  // dunkle Mundoeffnung und Klöppel
  const lipHw = Math.max(1, Math.round(w / 2 * 0.95)), mx = cx + Math.round(swing);
  s.rect(mx - lipHw + 1, yb + h, lipHw * 2 - 1, 1, 'ink');
  const bx = cx + Math.round(swing) - Math.round(swing * 0.55), by = yb + h + 1;
  s.rect(bx, by, 2, 2, o.clapper ?? 'rust'); s.px(bx, by, 'yellow');
  return [cx + Math.round(swing), yb + h - 1];
}

/** Klangwellen: Bogenstuecke links und rechts um (cx, cy), `n` Wellen, laufen mit `ph` nach aussen. */
export function waves(f: Surface, cx: number, cy: number, n: number, ph: number, base: number, big: boolean, cols: PalName[] = ['white', 'yellow', 'amber']): void {
  for (let k = 0; k < n; k++) {
    const st = (ph + k * Math.max(1, Math.floor(4 / n))) & 3;
    const r = base + st * 3 + k * 3;
    const col = cols[Math.min(cols.length - 1, st)];
    for (const sg of [-1, 1]) {
      for (let a = -34; a <= 34; a += big ? 8 : 11) {
        const rad = (a * Math.PI) / 180;
        f.px(cx + sg * Math.cos(rad) * r, cy + Math.sin(rad) * r * 0.9, col);
      }
    }
  }
}

/** Gloeckner: Kapuzenrobe, zieht am Seil. (x, gy) = Fuss, blickt nach links zum Turm. Liefert die Handhoehe. */
export function ringer(s: Surface, x: number, gy: number, ph: number, robe: Ramp, trim: PalName, atk: boolean): number {
  const pull = (atk ? [3, 1, 0, 2] : [2, 1, 0, 1])[ph & 3];
  s.rect(x - 2, gy - 1, 2, 2, 'bark'); s.rect(x + 1, gy - 1, 2, 2, 'bark');
  s.poly([[x - 3, gy - 9], [x + 3, gy - 9], [x + 4, gy - 1], [x - 4, gy - 1]], (px) => (px < x - 1 ? robe[2] : px > x + 1 ? robe[0] : robe[1]));
  s.rect(x - 3, gy - 5, 7, 1, trim);
  s.px(x + 3, gy - 4, 'amber');
  // Kopf mit Kapuze
  s.ball(x, gy - 12, 3.8, 3.6, robe);
  s.rect(x - 3, gy - 12, 3, 3, 'skin'); s.px(x - 3, gy - 12, 'peach'); s.px(x - 2, gy - 11, 'ink');
  s.px(x - 4, gy - 10, robe[1]);
  // Arme nach oben zum Seil
  const hy = gy - 17 + pull;
  s.line(x - 2, gy - 8, x - 4, hy + 1, robe[1], 2);
  s.line(x + 1, gy - 8, x - 2, hy + 1, robe[0], 2);
  s.rect(x - 5, hy - 1, 2, 2, 'skin'); s.rect(x - 3, hy, 2, 2, 'skin'); s.px(x - 5, hy - 1, 'peach');
  return hy;
}

/** Seil von (x0, y0) nach (x1, y1) mit leichtem Durchhang. */
function rope(s: Surface, x0: number, y0: number, x1: number, y1: number, sag = 0): void {
  s.curve(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1, 'sand');
}

function shingles(s: Surface, pts: [number, number][], ramp: Ramp, cx: number, step = 3): void {
  let y0 = Infinity;
  for (const p of pts) y0 = Math.min(y0, p[1]);
  s.poly(pts, (x, y) => ((y - Math.floor(y0)) % step === step - 1 ? ramp[0] : x < cx - 1 ? ramp[2] : x > cx + 1 ? ramp[0] : ramp[1]));
}

/** Zeltdach: Grundlinie y, Halbbreite hw, Hoehe h. */
function roof(s: Surface, cx: number, y: number, hw: number, h: number, ramp: Ramp, trim: PalName): void {
  shingles(s, [[cx - hw - 2, y + 1], [cx, y - h], [cx + hw + 2, y + 1]], ramp, cx);
  s.line(cx - hw - 2, y + 1, cx, y - h, ramp[2]);
  s.rect(cx - hw - 2, y + 1, hw * 2 + 5, 1, trim);
  s.px(cx, y - h - 1, trim);
}

/** Holzgeruest. Pfosten bei ox +- hw, Balken auf Hoehe G - H. */
function timber(s: Surface, ox: number, G: number, hw: number, H: number): void {
  for (const sg of [-1, 1]) {
    const px = ox + sg * hw - 1;
    s.box(px, G - H, 3, H, RAMPS.wood);
    s.rect(px - 1, G - 3, 5, 3, 'stone'); s.rect(px - 1, G - 3, 5, 1, 'silver'); s.rect(px + 2, G - 2, 2, 2, 'slate');
    // Strebe
    s.line(px + (sg > 0 ? -1 : 3), G - H + 9, px + (sg > 0 ? -5 : 7), G - H + 3, 'bark');
  }
  s.rect(ox - hw - 3, G - H - 1, hw * 2 + 7, 3, 'bark'); s.rect(ox - hw - 3, G - H - 1, hw * 2 + 7, 1, 'wood');
  s.rect(ox - hw, G - H * 0.45, hw * 2 + 1, 2, 'bark');
}

/** Rundbogenoeffnung (dunkel) mit Rand: Mitte x, Oberkante y, Breite w, Hoehe h. */
function arch(s: Surface, x: number, y: number, w: number, h: number, edge: Ramp): void {
  s.rect(x - (w >> 1) - 1, y - 1, w + 2, h + 1, edge[0]);
  s.ellipse(x, y + w / 2 - 0.5, w / 2 + 1, w / 2 + 1, edge[0]);
  s.rect(x - (w >> 1), y + w / 2, w, h - w / 2, 'night');
  s.ellipse(x, y + w / 2 - 0.5, w / 2, w / 2, 'night');
  s.rect(x - (w >> 1) - 1, y + w / 2 - 1, 1, h - w / 2 + 1, edge[2]);
}

/** Steinschaft mit Ziegelfugen, Gesimsen und Tuer. */
function shaft(s: Surface, ox: number, G: number, hw: number, y0: number, wall: Ramp, door = true): void {
  const h = G - y0;
  s.box(ox - hw, y0, hw * 2 + 1, h, wall);
  for (let y = y0 + 3; y < G - 1; y += 4) for (let x = ox - hw + 1 + (((y - y0) >> 2) & 1) * 3; x < ox + hw - 1; x += 6) s.rect(x, y, 3, 1, wall[0]);
  s.rect(ox - hw - 1, G - 2, hw * 2 + 3, 2, wall[1]); s.rect(ox - hw - 1, G - 2, hw * 2 + 3, 1, wall[2]);
  if (door) {
    s.rect(ox - 3, G - 10, 7, 8, 'bark'); s.ellipse(ox, G - 10, 3.5, 3, 'bark');
    s.rect(ox - 3, G - 10, 1, 8, 'wood'); s.px(ox + 2, G - 6, 'yellow'); s.rect(ox, G - 12, 1, 10, 'plum');
  }
}

/** Schmale Fensterschlitze in Reihe. */
function slits(s: Surface, ox: number, ys: number[], dx: number): void {
  for (const y of ys) for (const sg of dx ? [-1, 1] : [0]) { s.rect(ox + sg * dx, y, 2, 4, 'night'); s.px(ox + sg * dx, y, 'dusk'); }
}

/** Muenzstapel / Haufen (x = Mitte, gy = Boden). */
function coins(s: Surface, x: number, gy: number, n: number, ph: number): void {
  for (let i = 0; i < n; i++) {
    const w = 3 - (i > 1 ? 1 : 0) + (i === 0 ? 1 : 0);
    s.rect(x - (w >> 1), gy - 1 - i, w, 1, i % 2 ? 'amber' : 'yellow');
    s.px(x - (w >> 1), gy - 1 - i, 'white');
  }
  if (ph % 2) s.px(x + 1, gy - n - 1, 'white');
}

export function drawBellringer(t: Tiers, p: Pose): TowerLayers {
  const s = new Surface(TW, TH), back = new Surface(TW, TH), front = new Surface(TW, TH);
  const [A, B, C] = t;
  const main = mainPath(t), top = t[main];
  const ph = p.ph, G = GY, ox = OX;
  const swingAmp = p.atk ? 4 : top >= 5 ? 2 : 2;
  const sw = [-1, -0.5, 1, 0.5][ph] * swingAmp;
  const sw2 = -sw; // gegenlaeufig
  const roofR = ROOF[main], wallR = WALL[main];
  const trim: PalName = main === 0 ? 'yellow' : main === 1 ? 'ice' : 'yellow';
  const robe: Ramp = main === 0 ? RAMPS.crimson : main === 1 ? RAMPS.ice : RAMPS.plum;
  const bellRamp: Ramp = main === 0 ? (A >= 2 ? BRASS : BRONZE) : main === 1 ? STEEL : C >= 3 ? GOLDR : C >= 2 ? SILVER : BRONZE;
  const stone = top >= 3;
  let hw = 0, ringX = 0, ringY = 0, beamY = 0, rx0 = 0, ry0 = 0;
  let hw0 = 0;

  if (!stone) {
    // ---------- Holzglockenstuhl ----------
    hw = top >= 1 ? 9 : 7;
    const H = top >= 2 ? 31 : top >= 1 ? 29 : 26;
    hw0 = hw;
    timber(s, ox, G, hw, H);
    beamY = G - H;
    roof(s, ox, G - H - 2, hw + 1, top >= 2 ? 11 : 9, roofR, trim);
    if (main === 0 && top === 1) {
      bell(s, ox - 2, beamY + 2, 9, 9, bellRamp, sw);
      bell(s, ox + 5, beamY + 2, 5, 5, BRASS, sw2);
    } else if (main === 0 && top === 2) {
      bell(s, ox, beamY + 2, 9, 10, bellRamp, sw);
      bell(s, ox - 6, beamY + 2, 5, 6, BRASS, sw2); bell(s, ox + 6, beamY + 2, 5, 6, BRASS, sw2);
    } else if (main === 1 && top >= 1) {
      bell(s, ox, beamY + 2, 9, 10, bellRamp, sw);
      // Wachlaterne unter dem Dachfirst + Auge
      s.rect(ox - 1, G - H - 11, 3, 1, 'bark');
      s.rect(ox - 2, G - H - 10, 5, 4, ph % 2 ? 'yellow' : 'amber'); s.rect(ox - 2, G - H - 10, 5, 1, 'rust'); s.rect(ox - 2, G - H - 7, 5, 1, 'rust'); s.px(ox, G - H - 8, 'white');
      if (top >= 2) {
        // Preistafel mit Muenze + Waage
        s.rect(ox + hw + 2, beamY + 6, 1, 4, 'bark');
        s.box(ox + hw + 1, beamY + 10, 9, 7, RAMPS.wood); s.ball(ox + hw + 5, beamY + 13.5, 2, 2, BRASS); s.px(ox + hw + 4, beamY + 12, 'white');
        const sx2 = ox - hw - 9; s.rect(sx2, G - 15, 1, 15, 'bark'); s.rect(sx2 - 4, G - 15, 9, 1, 'silver'); s.rect(sx2 - 4, G - 14, 1, 3, 'stone'); s.rect(sx2 + 4, G - 14, 1, 3, 'stone'); s.rect(sx2 - 5, G - 11, 3, 1, 'amber'); s.rect(sx2 + 3, G - 11, 3, 1, 'amber'); s.px(sx2 - 4, G - 12, 'yellow'); s.rect(sx2 - 1, G - 2, 3, 2, 'stone');
      }
    } else if (main === 2 && top >= 1) {
      bell(s, ox, beamY + 2, top >= 2 ? 10 : 9, 10, bellRamp, sw);
      // Muenzkasten am Fuss, Muenzen fliegen beim Schlag
      s.box(ox - hw - 8, G - 7, 8, 7, RAMPS.wood); s.rect(ox - hw - 8, G - 5, 8, 1, 'bark'); s.rect(ox - hw - 5, G - 4, 2, 2, 'amber');
      coins(s, ox - hw - 4, G - 7, top >= 2 ? 4 : 2, ph);
      if (top >= 2) { s.box(ox + hw + 3, G - 8, 9, 8, RAMPS.wood); s.rect(ox + hw + 3, G - 9, 9, 2, 'bark'); s.rect(ox + hw + 3, G - 9, 9, 1, 'silver'); s.rect(ox + hw + 7, G - 6, 1, 2, 'silver'); }
    } else {
      bell(s, ox, beamY + 2, 9, 10, bellRamp, sw);
    }
    ringX = ox + hw + 12; rx0 = ox + hw + 3; ry0 = beamY + 3;
  } else {
    // ---------- Steinturm ----------
    const H = main === 0 ? (A >= 5 ? 52 : A >= 4 ? 48 : 40) : main === 1 ? (B >= 5 ? 44 : B >= 4 ? 46 : 40) : (C >= 5 ? 54 : C >= 4 ? 44 : 40);
    hw = main === 0 ? (A >= 5 ? 16 : A >= 4 ? 13 : 11) : main === 1 ? (B >= 5 ? 10 : 11) : (C >= 5 ? 14 : 12);
    hw0 = hw;
    const y0 = G - H;
    // Seitentuerme / Nebengebaeude (hinter dem Schaft)
    if (main === 0 && A >= 5) {
      for (const sg of [-1, 1]) {
        shaft(s, ox + sg * 22, G, 5, G - 34, wallR, false);
        roof(s, ox + sg * 22, G - 34, 5, 8, ['rust', 'amber', 'yellow'], 'white');
        arch(s, ox + sg * 22, G - 31, 7, 9, wallR);
        bell(s, ox + sg * 22, G - 30, 4, 6, BRASS, sg > 0 ? sw : sw2, { band: false });
      }
    }
    if (main === 2 && C >= 4) {
      // Giesserei rechts: Esse, Schlot, Glut
      const fx = ox + hw + 11;
      s.box(fx - 8, G - 14, 16, 14, ['night', 'dusk', 'slate']);
      for (let y = G - 12; y < G - 2; y += 3) for (let x = fx - 7 + (((y - G) >> 1) & 1) * 3; x < fx + 7; x += 6) s.rect(x, y, 3, 1, 'night');
      s.rect(fx - 4, G - 9, 8, 9, 'ink'); s.ellipse(fx, G - 9, 4, 3, 'ink');
      s.rect(fx - 3, G - 6, 6, 6, ph % 2 ? 'orange' : 'amber'); s.rect(fx - 2, G - 4, 4, 4, 'yellow'); s.px(fx, G - 3, 'white'); s.ellipse(fx, G - 6, 3, 2, ph % 2 ? 'orange' : 'amber');
      s.box(fx + 5, G - 25, 5, 11, ['night', 'dusk', 'slate']);
      // Rauch
      for (let i = 0; i < 4; i++) { const k = (ph * 2 + i * 2) % 8; back.ball(fx + 7 + Math.sin(k) * 2, G - 29 - k * 2, 2 + k * 0.3, 2 + k * 0.3, ['stone', 'silver', 'white']); }
      // Ambosspur
      s.rect(fx - 12, G - 3, 5, 2, 'slate'); s.rect(fx - 13, G - 4, 7, 1, 'stone');
      if (ph % 2) spark(front, fx - 10, G - 6, 'yellow');
    }
    shaft(s, ox, G, hw, y0, wallR);
    // Schlitzfenster, Gesimse
    slits(s, ox - 1, [G - 28, G - 20].map((y) => Math.max(y, y0 + 14 + (main === 1 && B >= 5 ? 8 : 0))), 0);
    s.rect(ox - hw - 1, y0 + 12, hw * 2 + 3, 2, wallR[1]); s.rect(ox - hw - 1, y0 + 12, hw * 2 + 3, 1, wallR[2]);
    if (main === 0) {
      // Glockenstube: breite Bogenoeffnung, darin Glocken
      const ow = A >= 5 ? 22 : A >= 4 ? 17 : 15;
      arch(s, ox, y0 + 2, ow, 11, wallR);
      if (A === 3) { bell(s, ox, y0 + 2, 10, 10, BRASS, sw); bell(s, ox - 4, y0 + 4, 4, 5, BRONZE, sw2); bell(s, ox + 4, y0 + 4, 4, 5, BRONZE, sw2); }
      else if (A === 4) {
        bell(s, ox, y0 + 2, 9, 9, BRASS, sw); bell(s, ox - 5, y0 + 3, 4, 6, BRASS, sw2); bell(s, ox + 5, y0 + 3, 4, 6, BRASS, sw2);
        // zweites Stockwerk unten
        arch(s, ox, y0 + 18, 9, 9, wallR);
        for (const dx of [-3, 0, 3]) bell(s, ox + dx, y0 + 19, 3, 5, BRONZE, dx ? sw2 : sw, { band: false });
        // Strebepfeiler
        for (const sg of [-1, 1]) { s.poly([[ox + sg * hw, G - 34], [ox + sg * (hw + 7), G], [ox + sg * hw, G]], (x, y) => (Math.abs(x - (ox + sg * hw)) < 1.5 ? wallR[2] : (y + x) % 5 === 0 ? wallR[0] : wallR[1])); s.line(ox + sg * hw, G - 34, ox + sg * (hw + 7), G, wallR[0]); }
        // Rosenfenster
        s.ball(ox, y0 + 32, 3.4, 3.4, ['crimson', 'red', 'coral']); s.ring(ox, y0 + 32, 3.4, 3.4, 'yellow'); s.px(ox, y0 + 32, 'white');
      } else {
        // Grand Carillon: sieben Glocken im Bogen, goldene Pfeiler, Tastenpult
        for (let i = 0; i < 7; i++) {
          const bx = ox - 9 + i * 3, big = i === 3;
          bell(s, bx, y0 + 3 + Math.abs(i - 3) * 1, big ? 8 : 4, big ? 11 : 6 - Math.abs(i - 3) * 0 , big ? BRASS : [BRONZE, BRASS, GOLDR][i % 3], (i + ph) % 2 ? sw : sw2, { band: false });
        }
        arch(s, ox, y0 + 20, 11, 10, wallR);
        for (let i = 0; i < 5; i++) bell(s, ox - 4 + i * 2, y0 + 21, 3, 5, i % 2 ? BRONZE : BRASS, i % 2 ? sw : sw2, { band: false });
        s.rect(ox - 9, G - 18, 19, 3, 'bark'); s.rect(ox - 9, G - 18, 19, 1, 'wood');
        for (let i = 0; i < 9; i++) s.px(ox - 8 + i * 2, G - 17, i % 2 ? 'white' : 'ink');
        for (let sgn = -1; sgn <= 1; sgn += 2) { s.rect(ox + sgn * (hw - 2), y0 + 14, 3, 20, 'amber'); s.rect(ox + sgn * (hw - 2), y0 + 14, 1, 20, 'yellow'); }
      }
      roof(s, ox, y0 - 1, hw, A >= 5 ? 18 : A >= 4 ? 17 : 12, A >= 5 ? ['rust', 'amber', 'yellow'] : roofR, A >= 5 ? 'white' : trim);
      if (A >= 4) { s.line(ox, y0 - 18 - (A >= 5 ? 2 : 0), ox, y0 - 22 - (A >= 5 ? 2 : 0), 'yellow'); s.px(ox, y0 - 23 - (A >= 5 ? 2 : 0), 'white'); s.rect(ox - 1, y0 - 20 - (A >= 5 ? 2 : 0), 3, 1, 'yellow'); }
    } else if (main === 1) {
      // Wachturm: Balkon mit Gelaender, oben Laterne/Auge
      s.rect(ox - hw - 3, y0, hw * 2 + 7, 2, 'bark'); s.rect(ox - hw - 3, y0, hw * 2 + 7, 1, 'wood');
      for (let x = ox - hw - 3; x <= ox + hw + 3; x += 3) { s.rect(x, y0 - 4, 1, 4, 'wood'); }
      s.rect(ox - hw - 3, y0 - 4, hw * 2 + 7, 1, 'tan');
      if (B <= 4) {
        // Alarmglocke aussen am Ausleger, Glockenstube mittig
        arch(s, ox, y0 + 2, 13, 11, wallR);
        bell(s, ox, y0 + 3, 7, 8, STEEL, sw);
        s.rect(ox - hw - 9, y0 + 14, 9, 2, 'bark'); s.line(ox - hw - 2, y0 + 15, ox - hw - 2, y0 + 20, 'bark');
        bell(s, ox - hw - 7, y0 + 16, 7, 9, ALARM, sw2);
        s.rect(ox - hw - 9, y0 + 15, 2, 6, 'wood');
        if (B >= 4) {
          // Ausrufer auf dem Balkon mit Horn, Fahnen
          s.rect(ox + 3, y0 - 11, 5, 7, 'sky'); s.rect(ox + 3, y0 - 11, 5, 1, 'ice'); s.ball(ox + 5, y0 - 14, 3, 3, RAMPS.skin); s.rect(ox + 3, y0 - 17, 5, 2, 'red'); s.px(ox + 4, y0 - 14, 'ink');
          s.line(ox + 7, y0 - 9, ox + 12, y0 - 13 + (ph & 1), 'amber', 2); s.poly([[ox + 12, y0 - 14], [ox + 15, y0 - 17], [ox + 15, y0 - 10]], (x) => (x < ox + 14 ? 'yellow' : 'amber'));
          if (ph % 2) { s.px(ox + 17, y0 - 14, 'white'); s.px(ox + 19, y0 - 16, 'yellow'); s.px(ox + 19, y0 - 12, 'yellow'); }
          for (const sg of [-1, 1]) { const fx = ox + sg * (hw + 2); s.rect(fx, y0 - 17, 1, 13, 'bark'); for (let i = 0; i < 5; i++) s.rect(fx + (sg > 0 ? 1 : -5 - ((ph + i) & 1) ), y0 - 16 + i, 5 - (i > 2 ? i - 2 : 0), 1, i < 3 ? 'red' : 'crimson'); }
        }
        roof(s, ox, y0 - (B >= 4 ? 4 : 5), hw - 1, B >= 4 ? 7 : 8, roofR, 'ice');
        if (B < 4) { s.rect(ox - 1, y0 - 15, 3, 4, ph % 2 ? 'yellow' : 'amber'); s.px(ox, y0 - 14, 'white'); }
      } else {
        // Dusk Siren: schlanker Turm mit grossem Auge in der Laterne, Sirenentrichter, rote Alarmglocke
        s.rect(ox - hw - 3, y0, hw * 2 + 7, 2, 'bark');
        // Laternenkopf
        const ly = y0 - 15;
        s.box(ox - 10, ly, 21, 15, ['navy', 'sky', 'ice']);
        s.rect(ox - 8, ly + 2, 17, 11, 'night');
        // Auge
        const open = ph === 3 ? 0 : 1;
        s.rect(ox - 7, ly + 6 - open, 15, 3 + open * 2, 'white'); s.rect(ox - 5, ly + 4, 11, 1, 'silver'); s.rect(ox - 5, ly + 11 + open - 1, 11, 1, 'silver');
        s.rect(ox - 2, ly + 5, 5, 5 + open, ph % 2 ? 'red' : 'crimson'); s.rect(ox - 1, ly + 6, 3, 3, 'ink'); s.px(ox - 1, ly + 6, 'white');
        for (const sg of [-1, 1]) s.line(ox + sg * 9, ly + 3, ox + sg * 13, ly + 1, 'yellow');
        roof(s, ox, ly, 9, 9, ROOF[1], 'ice');
        // Sirenentrichter
        for (const [dx, dy, dir] of [[-13, 6, -1], [-13, 11, -1], [13, 6, 1], [13, 11, 1]] as [number, number, number][]) {
          s.poly([[ox + dx - dir * 3, ly + dy], [ox + dx + dir * 2, ly + dy - 3], [ox + dx + dir * 2, ly + dy + 3]], (x) => (Math.abs(x - (ox + dx)) < 2 ? 'yellow' : 'amber'));
          s.px(ox + dx + dir * 2, ly + dy - 3, 'white');
        }
        for (let k = 0; k < 2; k++) { const r = 4 + ((ph + k * 2) & 3) * 3; for (const sg of [-1, 1]) for (let a = -40; a <= 40; a += 20) front.px(ox + sg * (16 + r + Math.cos((a * Math.PI) / 180) * 2), ly + 8 + Math.sin((a * Math.PI) / 180) * r, k ? 'red' : 'coral'); }
        bell(s, ox + hw + 7, y0 + 8, 8, 10, ALARM, sw2); s.rect(ox + hw + 1, y0 + 6, 9, 2, 'bark');
        arch(s, ox, y0 + 4, 5, 9, wallR); bell(s, ox, y0 + 5, 4, 6, STEEL, sw, { band: false });
      }
    } else {
      // C: Goldturm
      const gold = C >= 5;
      const ow = gold ? 20 : 15;
      arch(s, ox, y0 + 2, ow, 11, wallR);
      bell(s, ox, y0 + 2, gold ? 12 : 9, gold ? 12 : 10, gold ? GOLDR : GOLDR, sw);
      if (gold) { bell(s, ox - 6, y0 + 4, 4, 6, BRASS, sw2, { band: false }); bell(s, ox + 6, y0 + 4, 4, 6, BRASS, sw2, { band: false }); }
      // Markise (Merchants' Peal) bzw. Goldband
      if (C === 3) {
        for (let x = ox - hw - 2; x <= ox + hw + 2; x++) for (let y = 0; y < 5; y++) s.px(x, G - 21 + y, Math.floor((x - ox + 100) / 3) % 2 ? 'amber' : 'sand');
        for (let x = ox - hw - 2; x <= ox + hw + 2; x += 3) s.px(x + 1, G - 16, 'amber');
      }
      if (C >= 4) { s.rect(ox - hw, y0 + 22, hw * 2 + 1, 2, 'amber'); s.rect(ox - hw, y0 + 22, hw * 2 + 1, 1, 'yellow'); }
      if (gold) {
        for (const sg of [-1, 1]) { s.rect(ox + sg * (hw - 1), y0 + 2, 3, 28, 'amber'); s.rect(ox + sg * (hw - 1), y0 + 2, 1, 28, 'yellow'); }
        coins(s, ox - hw - 5, G, 7, ph); coins(s, ox + hw + 5, G, 6, ph + 1); coins(s, ox - hw - 10, G, 3, ph + 1);
        for (let i = 0; i < 6; i++) {
          const k = (ph * 2 + i * 3) % 12, cx = ox - 12 + i * 5 + (i % 2), cy = y0 + 15 + k * 2.2;
          if (cy < G - 2) { front.rect(cx, cy, 2, 2, k % 3 ? 'yellow' : 'amber'); front.px(cx, cy, 'white'); }
        }
        if (ph % 2) spark(front, ox - 9, y0 - 4, 'white', true); else spark(front, ox + 9, y0 + 2, 'white', true);
      }
      roof(s, ox, y0 - 1, hw, gold ? 16 : 11, gold ? ['rust', 'amber', 'yellow'] : roofR, gold ? 'white' : 'orchid');
      if (gold) { s.ball(ox, y0 - 19, 2.4, 2.4, BRASS); s.px(ox - 1, y0 - 20, 'white'); }
    }
    ringX = ox + hw + 14 + (main === 2 && C >= 4 ? 14 : 0) + (main === 0 && A >= 5 ? 12 : 0); rx0 = ox + hw; ry0 = y0 + (main === 1 ? 12 : 8);
    if (main === 0 && A >= 5) { rx0 = ox + 27; ry0 = G - 28; }
    if (main === 2 && C >= 4) { ringX = ox + hw + 28; rx0 = ox + hw; }
  }

  // ---------- Gloeckner und Seil ----------
  const rcx = Math.min(TW - 8, ringX);
  const hy = ringer(s, rcx, G, ph, robe, trim, p.atk);
  rope(front, rx0, ry0, rcx - 5, hy, p.atk ? 2 : 4);

  // ---------- Zweitpfad: kleine Beigaben links ----------
  const lx = ox - hw0 - 12;
  if (main !== 0 && A >= 1) {
    // Windspiel am Pfahl
    s.rect(lx, G - 24, 1, 24, 'bark'); s.rect(lx - 1, G - 25, 8, 2, 'wood'); s.rect(lx - 1, G - 25, 8, 1, 'tan');
    for (let i = 0; i < (A >= 2 ? 3 : 2); i++) {
      const off = [0, 1, 0, -1][(ph + i) & 3];
      s.line(lx + 1 + i * 3, G - 23, lx + 1 + i * 3 + off, G - 19, 'sand');
      bell(s, lx + 1 + i * 3 + off, G - 19, 3, 4, i % 2 ? BRASS : BRONZE, off, { band: false });
    }
    if (A >= 2 && ph % 2) spark(front, lx + 8, G - 24, 'yellow');
  }
  if (main !== 1 && B >= 1) {
    const bx = ox + hw0 + 8 + (main === 2 && C >= 4 ? 28 : 0) + (main === 0 && A >= 5 ? 20 : 0);
    const bxx = Math.min(TW - 22, bx);
    s.rect(bxx, G - 22, 2, 22, 'bark'); s.rect(bxx, G - 22, 1, 22, 'wood');
    s.rect(bxx - 3, G - 25, 8, 1, 'bark');
    s.rect(bxx - 3, G - 24, 1, 2, 'bark');
    s.rect(bxx - 3, G - 23, 3, 4, ph % 2 ? 'yellow' : 'amber'); s.rect(bxx - 3, G - 23, 3, 1, 'rust'); s.px(bxx - 2, G - 21, 'white');
    if (B >= 2) { s.box(bxx - 4, G - 15, 10, 6, RAMPS.wood); s.ball(bxx + 1, G - 12, 2, 2, BRASS); s.px(bxx, G - 13, 'white'); }
  }
  if (main !== 2 && C >= 1) {
    const cx = lx + (A >= 1 && main !== 0 ? 11 : 0);
    s.ball(cx, G - 4, 4, 4, ['rust', 'tan', 'sand']); s.rect(cx - 2, G - 9, 5, 2, 'bark'); s.rect(cx - 1, G - 8, 3, 1, 'yellow'); s.px(cx, G - 4, 'yellow');
    if (C >= 2) { coins(s, cx + 6, G, 4, ph); s.box(cx - 10, G - 6, 7, 6, RAMPS.wood); s.rect(cx - 10, G - 7, 7, 2, 'bark'); s.rect(cx - 10, G - 7, 7, 1, 'silver'); s.px(cx - 7, G - 3, 'yellow'); }
  }

  // ---------- Klangwellen und Funkeln ----------
  const wy = main === 0 ? (stone ? G - (A >= 5 ? 48 : A >= 4 ? 42 : 36) : beamY + 8) : beamY || G - 30;
  if (main === 0 && A >= 2) waves(front, ox, wy + (A >= 5 ? 2 : 3), A >= 5 ? 3 : A >= 4 ? 2 : 1, ph, A >= 5 ? 14 : 10, A >= 4);
  else if (p.atk) waves(front, ox, wy + 3, 1, ph, 10, false);
  if (main === 0 && A >= 5) {
    // goldener Bodenring (Leuchten, keine Platte)
    for (let i = 0; i < 34; i++) { const a = (i / 34) * Math.PI * 2 + ph * 0.12; if ((i + ph) % 4 === 3) continue; back.pxUnder(ox + Math.cos(a) * 26, G + 2 + Math.sin(a) * 6, i % 2 ? 'yellow' : 'amber'); }
  }
  if (main === 1 && B >= 5) { for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2 - ph * 0.12; if ((i + ph) % 4 === 3) continue; back.pxUnder(ox + Math.cos(a) * 22, G + 2 + Math.sin(a) * 6, i % 2 ? 'red' : 'ice'); } }
  void flame; void TH;
  return { fig: s, back, front, muzzle: [ox, G - 20] };
}
