/**
 * Angriffs-Grafik (Runde 10 / P2): wie ein Geschoss, ein Hieb, eine Druckwelle, ein Faecher und ein Strahl je Element aussehen.
 * Reine Zeichenfunktionen auf ein gemeinsames `Graphics` (wird je Frame geleert), ohne Zustand: alles Zeitabhaengige kommt als Fortschritt `p` (0..1).
 * Welche Form zu welcher Angriffsform gehoert, steht in `view/look.ts` (`attackLook`); hier steht nur, wie sie aussieht.
 */
import type { Graphics } from 'pixi.js';
import type { ElementLook, LookKey } from '../view/look';

/** Was die Zeichenfunktionen von einem Effekt brauchen (Teilmenge von `Eff` in fx.ts). */
export interface GfxEff {
  x: number;
  y: number;
  x2: number;
  y2: number;
  r: number;
  r2: number;
  w: number;
  ang: number;
  spread: number;
  seed: number;
  el: ElementLook;
  shape: string;
}

const TAU = Math.PI * 2;
export const easeOut = (p: number): number => 1 - (1 - p) * (1 - p);

/** Deterministischer Zufall 0..1 aus einer Zahl (Blitzpfade flackern pro Takt, nicht pro Frame). */
export const rnd = (s: number): number => {
  const v = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Gezackte Linie von A nach B (Blitz): Pfad anlegen, Strich setzt der Aufrufer. */
export function zigzag(g: Graphics, x0: number, y0: number, x1: number, y1: number, seed: number, segs: number, amp: number): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  g.moveTo(x0, y0);
  for (let i = 1; i < segs; i++) {
    const f = i / segs;
    const o = (rnd(seed + i * 7.3) - 0.5) * 2 * amp;
    g.lineTo(x0 + dx * f + nx * o, y0 + dy * f + ny * o);
  }
  g.lineTo(x1, y1);
}

/** Gedrehte Ellipse als Vieleck (Pixi kann Ellipsen nicht drehen). */
function tiltedEllipse(g: Graphics, cx: number, cy: number, rx: number, ry: number, rot: number): void {
  const pts: number[] = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const px = Math.cos(a) * rx;
    const py = Math.sin(a) * ry;
    pts.push(cx + px * c - py * s, cy + px * s + py * c);
  }
  g.poly(pts);
}

/** Sichel (Mondbogen) mit Spitze in Richtung `ang`: zwei Boegen gegeneinander. */
function crescent(g: Graphics, cx: number, cy: number, ang: number, r: number, color: number, alpha: number): void {
  const a0 = ang - 1.05;
  const a1 = ang + 1.05;
  g.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r)
    .arc(cx, cy, r, a0, a1)
    .arc(cx - Math.cos(ang) * r * 0.45, cy - Math.sin(ang) * r * 0.45, r * 0.85, a1 - 0.12, a0 + 0.12, true)
    .fill({ color, alpha });
}

// ---- Geschosse ------------------------------------------------------------------------------------------------------

/** Geschoss auf dem Weg von (x,y) nach (x2,y2): Kopf bei `p`, Schweif dahinter. */
export function drawProjectile(g: Graphics, e: GfxEff, p: number): void {
  const el = e.el;
  const hx = e.x + (e.x2 - e.x) * p;
  const hy = e.y + (e.y2 - e.y) * p;
  const ang = Math.atan2(e.y2 - e.y, e.x2 - e.x);
  const r = e.r;
  const back = (f: number): { x: number; y: number } => {
    const q = Math.max(0, p - f);
    return { x: e.x + (e.x2 - e.x) * q, y: e.y + (e.y2 - e.y) * q };
  };
  switch (e.shape) {
    case 'bolt': {
      const t = back(0.55);
      const seed = e.seed + Math.floor(p * 9) * 3.1;
      zigzag(g, t.x, t.y, hx, hy, seed, 6, r * 1.6);
      g.stroke({ width: e.w * 1.7, color: el.main, alpha: 0.5, cap: 'round', join: 'round' });
      zigzag(g, t.x, t.y, hx, hy, seed, 6, r * 1.6);
      g.stroke({ width: Math.max(1.5, e.w * 0.6), color: el.light, alpha: 0.95, cap: 'round', join: 'round' });
      g.circle(hx, hy, r * 1.5).fill({ color: el.light, alpha: 0.9 });
      g.circle(hx, hy, r * 2.6).fill({ color: el.main, alpha: 0.28 });
      break;
    }
    case 'shard': {
      const t = back(0.4);
      g.moveTo(t.x, t.y).lineTo(hx, hy).stroke({ width: Math.max(1, e.w * 0.5), color: el.main, alpha: 0.4, cap: 'round' });
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const L = r * 3.4;
      const W = r * 1.15;
      g.poly([hx + c * L, hy + s * L, hx - s * W, hy + c * W, hx - c * L * 0.7, hy - s * L * 0.7, hx + s * W, hy - c * W]).fill({ color: el.light }).stroke({ width: 1.5, color: el.main, alpha: 0.95 });
      g.circle(hx, hy, r * 2.2).fill({ color: el.main, alpha: 0.18 });
      break;
    }
    case 'blade': {
      const t = back(0.35);
      g.moveTo(t.x, t.y).lineTo(hx, hy).stroke({ width: Math.max(1, e.w * 0.4), color: el.main, alpha: 0.3, cap: 'round' });
      crescent(g, hx - Math.cos(ang) * r * 0.6, hy - Math.sin(ang) * r * 0.6, ang, r * 2.6, el.main, 0.75);
      crescent(g, hx - Math.cos(ang) * r * 0.4, hy - Math.sin(ang) * r * 0.4, ang, r * 1.9, el.light, 0.9);
      break;
    }
    case 'petal': {
      const t = back(0.4);
      g.moveTo(t.x, t.y).lineTo(hx, hy).stroke({ width: Math.max(1, e.w * 0.4), color: el.main, alpha: 0.25, cap: 'round' });
      for (let i = 0; i < 3; i++) {
        const a = p * 18 + (i * TAU) / 3;
        const px = hx + Math.cos(a) * r * 1.1;
        const py = hy + Math.sin(a) * r * 1.1;
        tiltedEllipse(g, px, py, r * 1.35, r * 0.75, a + 0.6);
        g.fill({ color: i === 0 ? el.light : el.main, alpha: 0.95 });
      }
      g.circle(hx, hy, r * 0.7).fill({ color: el.light });
      break;
    }
    case 'orb': {
      for (let i = 5; i >= 1; i--) {
        const t = back(i * 0.055);
        g.circle(t.x, t.y, r * (1 - i * 0.14)).fill({ color: el.main, alpha: 0.5 - i * 0.07 });
      }
      if (el.key === 'dark') {
        g.circle(hx, hy, r * 2.2).fill({ color: el.main, alpha: 0.25 });
        g.circle(hx, hy, r * 1.15).fill({ color: el.dark });
        g.circle(hx, hy, r * 1.35).stroke({ width: Math.max(1.5, r * 0.3), color: el.light, alpha: 0.9 });
      } else {
        g.circle(hx, hy, r * 2.3).fill({ color: el.main, alpha: 0.22 });
        g.circle(hx, hy, r * 1.4).fill({ color: el.main, alpha: 0.7 });
        g.circle(hx, hy, r * 0.8).fill({ color: el.light });
      }
      break;
    }
    default: {
      // Kugel/Leuchtspur (physisch, true): kurzer heller Strich
      const t = back(0.28);
      g.moveTo(t.x, t.y).lineTo(hx, hy).stroke({ width: e.w * 1.8, color: el.main, alpha: 0.55, cap: 'round' });
      g.moveTo(t.x, t.y).lineTo(hx, hy).stroke({ width: Math.max(1.2, e.w * 0.7), color: el.light, alpha: 1, cap: 'round' });
      g.circle(hx, hy, r * 0.9).fill({ color: el.light });
    }
  }
}

// ---- Hieb (Nahkampf) ------------------------------------------------------------------------------------------------

/** Hieb am Ziel: Bogen, Blitz-Kreuz, Doppel-Sichel oder Eisspitzen, je Element. */
export function drawSlash(g: Graphics, e: GfxEff, p: number): void {
  const el = e.el;
  const inv = 1 - p;
  const r = e.r * (0.7 + 0.5 * easeOut(p));
  switch (e.shape) {
    case 'bolt': {
      const seed = e.seed + Math.floor(p * 6) * 5.7;
      for (let k = 0; k < 2; k++) {
        const a = e.ang + (k === 0 ? -0.7 : 0.7);
        zigzag(g, e.x - Math.cos(a) * r, e.y - Math.sin(a) * r, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, seed + k * 11, 5, r * 0.28);
        g.stroke({ width: e.w * 1.5, color: el.main, alpha: inv * 0.6, cap: 'round', join: 'round' });
        zigzag(g, e.x - Math.cos(a) * r, e.y - Math.sin(a) * r, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, seed + k * 11, 5, r * 0.28);
        g.stroke({ width: Math.max(1.5, e.w * 0.55), color: el.light, alpha: inv, cap: 'round', join: 'round' });
      }
      break;
    }
    case 'blade': {
      for (let k = 0; k < 2; k++) {
        const rr = r * (k === 0 ? 1 : 0.7);
        const a0 = e.ang - 1.0 + p * 0.6 + k * 0.1;
        g.moveTo(e.x + Math.cos(a0) * rr, e.y + Math.sin(a0) * rr).arc(e.x, e.y, rr, a0, a0 + 2.0).stroke({ width: Math.max(2, e.w * (k === 0 ? 1.1 : 0.6)), color: k === 0 ? el.light : el.main, alpha: inv * (k === 0 ? 0.95 : 0.7), cap: 'round' });
      }
      break;
    }
    case 'shard': {
      const a0 = e.ang - 0.9 + p * 0.5;
      g.moveTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a0 + 1.8).stroke({ width: e.w, color: el.light, alpha: inv, cap: 'round' });
      for (let k = 0; k < 5; k++) {
        const a = e.ang + (k - 2) * 0.55;
        const len = r * (0.55 + 0.55 * easeOut(p));
        g.poly([e.x + Math.cos(a) * r * 0.25, e.y + Math.sin(a) * r * 0.25, e.x + Math.cos(a + 0.12) * len * 0.6, e.y + Math.sin(a + 0.12) * len * 0.6, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.x + Math.cos(a - 0.12) * len * 0.6, e.y + Math.sin(a - 0.12) * len * 0.6]).fill({ color: el.main, alpha: inv * 0.85 });
      }
      break;
    }
    default: {
      // Bogen: heller Strich aussen, farbiger innen; physisch grau-weiss, Feuer/Wasser tragen ihre Farbe
      const a0 = e.ang - 1.0 + p * 0.5;
      const a1 = e.ang + 1.0 + p * 0.5;
      g.moveTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a1).stroke({ width: e.w, color: el.light, alpha: inv, cap: 'round' });
      const r2 = r * 0.7;
      g.moveTo(e.x + Math.cos(a0 + 0.2) * r2, e.y + Math.sin(a0 + 0.2) * r2).arc(e.x, e.y, r2, a0 + 0.2, a1 - 0.2).stroke({ width: Math.max(2, e.w * 0.6), color: el.main, alpha: inv * 0.8, cap: 'round' });
    }
  }
}

// ---- Druckwelle (Kreis / ganze Bahn) --------------------------------------------------------------------------------

/** Welle um (x,y) bis Radius `r2`: Grundform ist ein Ring mit Fuellung, dazu eine Verzierung je Element. */
export function drawWave(g: Graphics, e: GfxEff, p: number): void {
  const el = e.el;
  const inv = 1 - p;
  const R = e.r2 * easeOut(Math.min(1, p * 1.6));
  // `spread` > 0 daempft die Flaechenfuellung (ganze Bahn, grosse Radien): nur Ring und Verzierung bleiben kraeftig
  const k = e.spread > 0 ? e.spread : 1;
  g.circle(e.x, e.y, R).fill({ color: el.main, alpha: 0.28 * inv * k });
  g.circle(e.x, e.y, R * 0.55).fill({ color: el.light, alpha: 0.4 * inv * k });
  g.circle(e.x, e.y, R).stroke({ width: Math.max(2, e.w), color: el.light, alpha: 0.9 * inv });
  const key: LookKey = el.key;
  switch (key) {
    case 'fire':
      g.circle(e.x, e.y, R * 0.8).fill({ color: el.dark, alpha: 0.18 * inv });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + e.seed;
        const l = R * (0.7 + 0.35 * rnd(e.seed + i));
        g.poly([e.x + Math.cos(a - 0.14) * R * 0.5, e.y + Math.sin(a - 0.14) * R * 0.5, e.x + Math.cos(a) * l, e.y + Math.sin(a) * l, e.x + Math.cos(a + 0.14) * R * 0.5, e.y + Math.sin(a + 0.14) * R * 0.5]).fill({ color: el.main, alpha: 0.5 * inv });
      }
      break;
    case 'water':
      g.circle(e.x, e.y, R * 0.72).stroke({ width: Math.max(1.5, e.w * 0.6), color: el.light, alpha: 0.7 * inv });
      g.circle(e.x, e.y, R * 0.42).stroke({ width: Math.max(1, e.w * 0.4), color: el.light, alpha: 0.55 * inv });
      break;
    case 'ice':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + p * 0.5;
        g.moveTo(e.x, e.y).lineTo(e.x + Math.cos(a) * R, e.y + Math.sin(a) * R).stroke({ width: Math.max(1.5, e.w * 0.7), color: el.light, alpha: 0.85 * inv, cap: 'round' });
        g.moveTo(e.x + Math.cos(a) * R * 0.62, e.y + Math.sin(a) * R * 0.62).lineTo(e.x + Math.cos(a + 0.4) * R * 0.8, e.y + Math.sin(a + 0.4) * R * 0.8).stroke({ width: Math.max(1, e.w * 0.5), color: el.light, alpha: 0.8 * inv });
      }
      break;
    case 'lightning': {
      const seed = e.seed + Math.floor(p * 7) * 4.3;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + rnd(seed + i) * 0.5;
        zigzag(g, e.x, e.y, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, seed + i * 3, 5, R * 0.1);
        g.stroke({ width: Math.max(1.5, e.w * 0.6), color: el.light, alpha: 0.95 * inv, cap: 'round', join: 'round' });
      }
      break;
    }
    case 'air':
      for (let i = 0; i < 3; i++) {
        const a0 = (i / 3) * TAU + p * 3.2;
        g.moveTo(e.x + Math.cos(a0) * R * 0.85, e.y + Math.sin(a0) * R * 0.85).arc(e.x, e.y, R * 0.85, a0, a0 + 1.3).stroke({ width: Math.max(1.5, e.w * 0.7), color: el.light, alpha: 0.8 * inv, cap: 'round' });
        g.moveTo(e.x + Math.cos(a0 + 0.5) * R * 0.5, e.y + Math.sin(a0 + 0.5) * R * 0.5).arc(e.x, e.y, R * 0.5, a0 + 0.5, a0 + 1.4).stroke({ width: Math.max(1, e.w * 0.5), color: el.main, alpha: 0.7 * inv, cap: 'round' });
      }
      break;
    case 'light':
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        g.moveTo(e.x + Math.cos(a) * R * 0.3, e.y + Math.sin(a) * R * 0.3).lineTo(e.x + Math.cos(a) * R * (i % 2 ? 0.95 : 1.15), e.y + Math.sin(a) * R * (i % 2 ? 0.95 : 1.15)).stroke({ width: Math.max(1.5, e.w * 0.6), color: el.light, alpha: 0.8 * inv, cap: 'round' });
      }
      break;
    case 'dark':
      g.circle(e.x, e.y, R).fill({ color: el.dark, alpha: 0.3 * inv });
      for (let i = 0; i < 3; i++) {
        const a0 = (i / 3) * TAU - p * 4;
        g.moveTo(e.x + Math.cos(a0) * R * 0.75, e.y + Math.sin(a0) * R * 0.75).arc(e.x, e.y, R * 0.75, a0, a0 + 1.5).stroke({ width: Math.max(1.5, e.w * 0.7), color: el.light, alpha: 0.7 * inv, cap: 'round' });
        g.moveTo(e.x + Math.cos(a0) * R * 0.4, e.y + Math.sin(a0) * R * 0.4).arc(e.x, e.y, R * 0.4, a0 + 0.3, a0 + 1.6).stroke({ width: Math.max(1, e.w * 0.5), color: el.main, alpha: 0.8 * inv, cap: 'round' });
      }
      break;
    case 'rose':
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + p * 1.2;
        const d = R * (0.45 + 0.5 * easeOut(p));
        tiltedEllipse(g, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, R * 0.1, R * 0.06, a);
        g.fill({ color: i % 2 ? el.light : el.main, alpha: 0.85 * inv });
      }
      break;
    case 'magic':
    case 'true': {
      // Runenring: Sechsstern im Kreis
      const a0 = p * 1.6;
      for (let k = 0; k < 2; k++) {
        const pts: number[] = [];
        for (let i = 0; i < 3; i++) {
          const a = a0 + k * Math.PI / 3 + (i / 3) * TAU;
          pts.push(e.x + Math.cos(a) * R * 0.85, e.y + Math.sin(a) * R * 0.85);
        }
        g.poly(pts).stroke({ width: Math.max(1.5, e.w * 0.6), color: el.light, alpha: 0.85 * inv });
      }
      g.circle(e.x, e.y, R * 0.85).stroke({ width: Math.max(1, e.w * 0.4), color: el.main, alpha: 0.7 * inv });
      break;
    }
    default:
      // physisch: Staubring
      g.circle(e.x, e.y, R * 0.8).stroke({ width: Math.max(2, e.w * 0.9), color: el.main, alpha: 0.4 * inv });
  }
}

// ---- Faecher (Kegel) ------------------------------------------------------------------------------------------------

export function drawFan(g: Graphics, e: GfxEff, p: number): void {
  const el = e.el;
  const inv = 1 - p;
  const r = e.r * easeOut(Math.min(1, p * 2.4));
  const a0 = e.ang - e.spread;
  const a1 = e.ang + e.spread;
  g.moveTo(e.x, e.y).lineTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a1).lineTo(e.x, e.y).fill({ color: el.main, alpha: 0.3 * inv });
  g.moveTo(e.x, e.y).lineTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a1).lineTo(e.x, e.y).stroke({ width: 3, color: el.light, alpha: 0.85 * inv });
  // Innenleben je Element
  const lines = 5;
  for (let k = 0; k < lines; k++) {
    const f = (k + 0.5) / lines;
    const a = a0 + (a1 - a0) * f;
    const len = r * (0.55 + 0.4 * rnd(e.seed + k));
    switch (el.key) {
      case 'ice':
        g.poly([e.x + Math.cos(a) * len * 0.3, e.y + Math.sin(a) * len * 0.3, e.x + Math.cos(a + 0.07) * len * 0.7, e.y + Math.sin(a + 0.07) * len * 0.7, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.x + Math.cos(a - 0.07) * len * 0.7, e.y + Math.sin(a - 0.07) * len * 0.7]).fill({ color: el.light, alpha: 0.75 * inv });
        break;
      case 'lightning':
        zigzag(g, e.x, e.y, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.seed + k * 5 + Math.floor(p * 6) * 2, 5, r * 0.06);
        g.stroke({ width: 2.5, color: el.light, alpha: 0.9 * inv, join: 'round' });
        break;
      case 'fire':
        g.poly([e.x + Math.cos(a - 0.1) * len * 0.35, e.y + Math.sin(a - 0.1) * len * 0.35, e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, e.x + Math.cos(a + 0.1) * len * 0.35, e.y + Math.sin(a + 0.1) * len * 0.35]).fill({ color: el.light, alpha: 0.6 * inv });
        break;
      default:
        g.moveTo(e.x + Math.cos(a) * len * 0.25, e.y + Math.sin(a) * len * 0.25).lineTo(e.x + Math.cos(a) * len, e.y + Math.sin(a) * len).stroke({ width: 2, color: el.light, alpha: 0.7 * inv, cap: 'round' });
    }
  }
}

// ---- Strahl (Linie) -------------------------------------------------------------------------------------------------

export function drawBeam(g: Graphics, e: GfxEff, p: number): void {
  const el = e.el;
  const inv = 1 - p;
  const reach = e.r * easeOut(Math.min(1, p * 4));
  const w = e.w * (1 - p * 0.6);
  const dx = Math.cos(e.ang);
  const dy = Math.sin(e.ang);
  const nx = -dy * (w / 2);
  const ny = dx * (w / 2);
  g.poly([e.x + nx, e.y + ny, e.x + dx * reach + nx, e.y + dy * reach + ny, e.x + dx * reach - nx, e.y + dy * reach - ny, e.x - nx, e.y - ny]).fill({ color: el.main, alpha: 0.5 * inv });
  if (el.key === 'lightning') {
    const seed = e.seed + Math.floor(p * 8) * 3;
    zigzag(g, e.x, e.y, e.x + dx * reach, e.y + dy * reach, seed, 9, w * 0.35);
    g.stroke({ width: Math.max(2.5, w * 0.35), color: el.light, alpha: inv, cap: 'round', join: 'round' });
  } else {
    g.moveTo(e.x, e.y).lineTo(e.x + dx * reach, e.y + dy * reach).stroke({ width: Math.max(2, w * 0.3), color: el.light, alpha: inv });
    if (el.key === 'water' || el.key === 'air') {
      for (let k = 1; k <= 3; k++) {
        const f = reach * (k / 4);
        g.circle(e.x + dx * f, e.y + dy * f, w * 0.42).stroke({ width: 1.5, color: el.light, alpha: 0.6 * inv });
      }
    }
  }
  // Muendung
  g.circle(e.x, e.y, w * 0.55).fill({ color: el.light, alpha: 0.6 * inv });
}
