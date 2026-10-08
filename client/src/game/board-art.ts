/**
 * Kartenbild je Welt (Runde 10 / P4): malt Boden, Huegel, Pfad, Hindernisse, Bodendeko, Spawn-Portal, Basis-Schrein und Lichtstimmung
 * aus dem Kartenthema (`theme.board`, Daten in `sim/data/worlds/*.json`) einmal in eine Zeichenflaeche. `map-layer.ts` macht daraus eine
 * Textur; pro Frame kostet die Karte nichts. Kein Atlas, keine Raster-Kacheln: alles wird per Code gemalt, deterministisch je Welt
 * (gleicher Seed -> gleiches Bild, alle Acts einer Welt sehen gleich aus).
 *
 * Einheit beim Malen ist die Kachel (die Zeichenflaeche ist mit `px` Pixeln je Kachel skaliert). Nur Darstellung, die Sim liest nichts davon.
 */
import type { BoardTheme, StageData, Theme } from '../sim';
import { pathCells, zoneChar } from './map-compose';

type Ctx = CanvasRenderingContext2D;
type Rng = () => number;
type Pal = { base: string; dark: string; light: string; accent?: string };

const TAU = Math.PI * 2;
/** Hoehe der Felswand unter einem Huegel (in Kacheln). */
const WALL = 0.3;

// ---------------------------------------------------------------- Farben und Zufall

const parse = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/** Mischung a -> b um t (0..1). */
export const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};
/** t > 0 hellt auf, t < 0 dunkelt ab. */
export const shade = (h: string, t: number): string => (t >= 0 ? mix(h, '#ffffff', t) : mix(h, '#000000', -t));
export const rgba = (h: string, a: number): string => {
  const [r, g, b] = parse(h);
  return `rgba(${r},${g},${b},${a})`;
};

const hashStr = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rngFrom = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rr = (r: Rng, a: number, b: number): number => a + (b - a) * r();
const pick = <T>(r: Rng, list: readonly T[]): T => list[Math.floor(r() * list.length) % list.length];
const pickWeighted = <T extends { weight?: number }>(r: Rng, list: readonly T[]): T => {
  const sum = list.reduce((s, x) => s + (x.weight ?? 1), 0);
  let v = r() * sum;
  for (const x of list) {
    v -= x.weight ?? 1;
    if (v <= 0) return x;
  }
  return list[list.length - 1];
};

// ---------------------------------------------------------------- Thema (mit Rueckfall fuer Stages ohne `board`)

/** Das Kartenthema einer Stage; ohne `theme.board` wird eines aus Gras-/Pfadfarbe abgeleitet (alte Daten, Test-Stages, Standard-Stage). */
export function resolveBoard(theme: Theme | undefined): BoardTheme {
  if (theme?.board) return theme.board;
  const g = theme?.grass.color ?? '#3f7a45';
  const p = theme?.path.color ?? '#d0a574';
  return {
    ground: { pattern: 'grass', base: g, dark: shade(g, -0.28), light: shade(g, 0.25), accent: shade(g, 0.4) },
    path: { pattern: 'dirt', base: p, edge: shade(p, -0.5), light: shade(p, 0.3) },
    deco: [
      { kind: 'tree', color: shade(g, -0.1), color2: '#6b4a2e', weight: 2 },
      { kind: 'rock', color: '#8a90a6', weight: 1 },
    ],
    scatter: [
      { kind: 'tufts', color: shade(g, 0.3), density: 0.3 },
      ...(theme?.flowers === false ? [] : [{ kind: 'flowers' as const, color: '#f5d96a', density: 0.12 }]),
    ],
    light: { tint: '#fff2c0', tintAlpha: 0.1, vignette: 0.4, ambient: 'none' },
  };
}

// ---------------------------------------------------------------- Zeichenhelfer

const mk = (w: number, h: number): { cv: HTMLCanvasElement; c: Ctx } => {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  if (!c) throw new Error('board-art: kein 2D-Kontext');
  return { cv, c };
};

const ell = (c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0): void => {
  c.beginPath();
  c.ellipse(x, y, Math.max(rx, 0.001), Math.max(ry, 0.001), rot, 0, TAU);
  c.fillStyle = fill;
  c.fill();
};

/** Weicher Schatten/Fleck: radialer Verlauf, in y gestaucht. */
const soft = (c: Ctx, x: number, y: number, rx: number, ry: number, color: string, a: number): void => {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.6, rgba(color, a * 0.55));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, TAU);
  c.fill();
  c.restore();
};

const roundRect = (c: Ctx, x: number, y: number, w: number, h: number, r: number): void => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
};

const poly = (c: Ctx, pts: Array<[number, number]>, fill: string): void => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
};

// ---------------------------------------------------------------- Muster (Boden, Huegel-Kuppen, Pfad)

interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}
const sizeOf = (a: Area): number => a.w * a.h;

function blotches(c: Ctx, r: Rng, a: Area, pal: Pal, n: number): void {
  for (let i = 0; i < n; i++) {
    const col = r() < 0.5 ? pal.dark : pal.light;
    soft(c, a.x + r() * a.w, a.y + r() * a.h, rr(r, 0.9, 2.6), rr(r, 0.9, 2.6), col, rr(r, 0.1, 0.26));
  }
}

function speckle(c: Ctx, r: Rng, a: Area, pal: Pal, n: number, rMin = 0.008, rMax = 0.03): void {
  for (let i = 0; i < n; i++) {
    c.fillStyle = rgba(r() < 0.55 ? pal.dark : pal.light, rr(r, 0.12, 0.38));
    c.beginPath();
    c.arc(a.x + r() * a.w, a.y + r() * a.h, rr(r, rMin, rMax), 0, TAU);
    c.fill();
  }
}

/** Das Muster einer Flaeche. `c` ist bereits auf die Flaeche beschnitten (oder die Flaeche ist die ganze Karte). */
function paintPattern(c: Ctx, r: Rng, pattern: string, pal: Pal, a: Area, scale = 1): void {
  const A = sizeOf(a);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  switch (pattern) {
    case 'grass': {
      blotches(c, r, a, pal, Math.ceil(A / 3));
      for (let i = 0; i < A * 16; i++) {
        const x = a.x + r() * a.w;
        const y = a.y + r() * a.h;
        const col = r() < 0.45 ? pal.dark : r() < 0.8 ? pal.light : (pal.accent ?? pal.light);
        c.strokeStyle = rgba(col, rr(r, 0.3, 0.6));
        c.lineWidth = 0.022;
        for (let k = -1; k <= 1; k++) {
          c.beginPath();
          c.moveTo(x + k * 0.025, y);
          c.quadraticCurveTo(x + k * 0.05, y - 0.06, x + k * 0.07 + rr(r, -0.02, 0.02), y - rr(r, 0.09, 0.17));
          c.stroke();
        }
      }
      break;
    }
    case 'moss': {
      blotches(c, r, a, pal, Math.ceil(A / 2));
      speckle(c, r, a, pal, A * 16);
      for (let i = 0; i < A * 5; i++) {
        const x = a.x + r() * a.w;
        const y = a.y + r() * a.h;
        c.fillStyle = rgba(r() < 0.6 ? pal.light : (pal.accent ?? pal.light), rr(r, 0.2, 0.45));
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(x + rr(r, -0.04, 0.04), y + rr(r, -0.03, 0.03), rr(r, 0.025, 0.05), 0, TAU);
          c.fill();
        }
      }
      break;
    }
    case 'snow': {
      blotches(c, r, a, pal, Math.ceil(A / 2.5));
      for (let i = 0; i < A * 1.3; i++) {
        const x = a.x + r() * a.w;
        const y = a.y + r() * a.h;
        const rx = rr(r, 0.2, 0.55);
        const ry = rx * rr(r, 0.25, 0.4);
        ell(c, x + 0.02, y + ry * 0.35, rx, ry, rgba(pal.dark, 0.2));
        ell(c, x, y, rx * 0.95, ry * 0.9, rgba(pal.light, 0.7));
      }
      speckle(c, r, a, pal, A * 9, 0.006, 0.016);
      break;
    }
    case 'sand': {
      blotches(c, r, a, pal, Math.ceil(A / 3));
      for (let i = 0; i < A * 4; i++) {
        const x = a.x + r() * a.w;
        const y = a.y + r() * a.h;
        const len = rr(r, 0.35, 0.9);
        const bend = rr(r, -0.08, 0.08);
        for (const [dy, col, al] of [[0.028, pal.dark, 0.28], [0, pal.light, 0.5]] as const) {
          c.strokeStyle = rgba(col, al);
          c.lineWidth = 0.026;
          c.beginPath();
          c.moveTo(x, y + dy);
          c.quadraticCurveTo(x + len / 2, y + dy + bend, x + len, y + dy);
          c.stroke();
        }
      }
      speckle(c, r, a, pal, A * 18, 0.006, 0.016);
      break;
    }
    case 'dirt': {
      blotches(c, r, a, pal, Math.ceil(A / 2));
      speckle(c, r, a, pal, A * 28);
      for (let i = 0; i < A * 1.4; i++) {
        const x = a.x + r() * a.w;
        const y = a.y + r() * a.h;
        const s = rr(r, 0.025, 0.06);
        ell(c, x + 0.01, y + 0.012, s, s * 0.7, rgba(pal.dark, 0.4));
        ell(c, x, y, s, s * 0.7, rgba(mix(pal.base, pal.light, 0.5), 0.8));
      }
      break;
    }
    case 'cobble': {
      c.fillStyle = mix(pal.base, pal.dark, 0.75);
      c.fillRect(a.x, a.y, a.w, a.h);
      const cs = 0.3 * scale;
      for (let gy = Math.floor(a.y / cs) - 1; gy <= Math.ceil((a.y + a.h) / cs); gy++) {
        for (let gx = Math.floor(a.x / cs) - 1; gx <= Math.ceil((a.x + a.w) / cs); gx++) {
          const cx = (gx + (gy & 1 ? 0.5 : 0) + rr(r, -0.1, 0.1) + 0.5) * cs;
          const cy = (gy + rr(r, -0.08, 0.08) + 0.5) * cs;
          const sw = cs * rr(r, 0.78, 0.98);
          const sh = cs * rr(r, 0.7, 0.92);
          const tone = mix(pal.base, r() < 0.5 ? pal.dark : pal.light, rr(r, 0.05, 0.4));
          roundRect(c, cx - sw / 2, cy - sh / 2, sw, sh, cs * 0.3);
          c.fillStyle = tone;
          c.fill();
          c.strokeStyle = rgba(pal.light, 0.32);
          c.lineWidth = cs * 0.08;
          c.beginPath();
          c.arc(cx, cy, sh * 0.38, Math.PI * 1.05, Math.PI * 1.65);
          c.stroke();
          c.strokeStyle = rgba(pal.dark, 0.3);
          c.beginPath();
          c.arc(cx, cy, sh * 0.38, Math.PI * 0.1, Math.PI * 0.6);
          c.stroke();
        }
      }
      blotches(c, r, a, pal, Math.ceil(A / 5));
      break;
    }
    case 'flagstone': {
      c.fillStyle = mix(pal.base, pal.dark, 0.75);
      c.fillRect(a.x, a.y, a.w, a.h);
      let y = a.y - rr(r, 0, 0.5);
      while (y < a.y + a.h) {
        const rh = rr(r, 0.5, 0.82) * scale;
        let x = a.x - rr(r, 0, 1) * scale;
        while (x < a.x + a.w) {
          const sw = rr(r, 0.65, 1.4) * scale;
          const tone = mix(pal.base, r() < 0.5 ? pal.dark : pal.light, rr(r, 0.04, 0.32));
          const inset = 0.022;
          roundRect(c, x + inset, y + inset, sw - inset * 2, rh - inset * 2, 0.05);
          c.fillStyle = tone;
          c.fill();
          c.strokeStyle = rgba(pal.light, 0.38);
          c.lineWidth = 0.022;
          c.beginPath();
          c.moveTo(x + 0.06, y + inset + 0.01);
          c.lineTo(x + sw - 0.06, y + inset + 0.01);
          c.stroke();
          c.strokeStyle = rgba(pal.dark, 0.35);
          c.beginPath();
          c.moveTo(x + 0.06, y + rh - inset - 0.01);
          c.lineTo(x + sw - 0.06, y + rh - inset - 0.01);
          c.stroke();
          if (r() < 0.22) {
            c.strokeStyle = rgba(pal.dark, 0.55);
            c.lineWidth = 0.014;
            c.beginPath();
            let cx = x + rr(r, 0.15, sw - 0.15);
            let cy = y + 0.06;
            c.moveTo(cx, cy);
            while (cy < y + rh - 0.06) {
              cx += rr(r, -0.07, 0.07);
              cy += rr(r, 0.06, 0.12);
              c.lineTo(cx, cy);
            }
            c.stroke();
          }
          x += sw;
        }
        y += rh;
      }
      speckle(c, r, a, pal, A * 10, 0.006, 0.018);
      blotches(c, r, a, pal, Math.ceil(A / 5));
      break;
    }
    case 'cracked': {
      blotches(c, r, a, pal, Math.ceil(A / 2));
      speckle(c, r, a, pal, A * 22);
      const glowCol = pal.accent;
      for (let i = 0; i < A * 0.55; i++) {
        let x = a.x + r() * a.w;
        let y = a.y + r() * a.h;
        const pts: Array<[number, number]> = [[x, y]];
        let ang = r() * TAU;
        for (let k = 0; k < 6; k++) {
          ang += rr(r, -0.8, 0.8);
          x += Math.cos(ang) * rr(r, 0.12, 0.28);
          y += Math.sin(ang) * rr(r, 0.12, 0.28);
          pts.push([x, y]);
        }
        const trace = (): void => {
          c.beginPath();
          pts.forEach(([px, py], j) => (j === 0 ? c.moveTo(px, py) : c.lineTo(px, py)));
          c.stroke();
        };
        c.strokeStyle = rgba(pal.dark, 0.7);
        c.lineWidth = 0.034;
        trace();
        if (glowCol) {
          c.strokeStyle = rgba(glowCol, 0.65);
          c.lineWidth = 0.012;
          trace();
        }
      }
      break;
    }
    case 'planks': {
      // Stege werden entlang der Wegsegmente gelegt (`paintPlanks`), als Flaechenmuster gilt Dielen-Boden
      c.fillStyle = mix(pal.base, pal.dark, 0.6);
      c.fillRect(a.x, a.y, a.w, a.h);
      for (let x = a.x; x < a.x + a.w; x += 0.2) {
        c.fillStyle = mix(pal.base, r() < 0.5 ? pal.dark : pal.light, rr(r, 0.05, 0.3));
        c.fillRect(x + 0.01, a.y, 0.18, a.h);
      }
      break;
    }
    case 'ice': {
      c.fillStyle = pal.base;
      c.fillRect(a.x, a.y, a.w, a.h);
      blotches(c, r, a, pal, Math.ceil(A / 2));
      for (let i = 0; i < A * 3; i++) {
        const x = a.x + r() * a.w;
        const y = a.y + r() * a.h;
        c.strokeStyle = rgba('#ffffff', rr(r, 0.15, 0.4));
        c.lineWidth = rr(r, 0.015, 0.04);
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + rr(r, 0.25, 0.7), y - rr(r, 0.1, 0.35));
        c.stroke();
      }
      for (let i = 0; i < A * 0.5; i++) {
        let x = a.x + r() * a.w;
        let y = a.y + r() * a.h;
        c.strokeStyle = rgba(pal.dark, 0.5);
        c.lineWidth = 0.015;
        c.beginPath();
        c.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += rr(r, -0.14, 0.14);
          y += rr(r, -0.14, 0.14);
          c.lineTo(x, y);
        }
        c.stroke();
      }
      break;
    }
    default: {
      blotches(c, r, a, pal, Math.ceil(A / 2));
      speckle(c, r, a, pal, A * 20);
    }
  }
}

// ---------------------------------------------------------------- Pfad

type Pt = [number, number];

/** Pfad als Mittellinie in Kachelkoordinaten; Start bis zum Kartenrand verlaengert, wenn er dort beginnt. */
export function pathLine(stage: StageData, cols: number, rows: number): Pt[] {
  const pts: Pt[] = stage.path.map(([x, y]) => [x + 0.5, y + 0.5]);
  const [x0, y0] = stage.path[0];
  if (pts.length > 1) {
    const horizontal = stage.path[1][1] === y0;
    if (horizontal && x0 === 0) pts[0] = [0, pts[0][1]];
    else if (horizontal && x0 === cols - 1) pts[0] = [cols, pts[0][1]];
    else if (!horizontal && y0 === 0) pts[0] = [pts[0][0], 0];
    else if (!horizontal && y0 === rows - 1) pts[0] = [pts[0][0], rows];
  }
  return pts;
}

function strokeLine(c: Ctx, pts: Pt[], width: number, style: string | CanvasGradient, dash?: number[]): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.lineWidth = width;
  c.strokeStyle = style;
  c.lineJoin = 'round';
  c.lineCap = 'butt';
  c.setLineDash(dash ?? []);
  c.stroke();
  c.setLineDash([]);
}

/** Dielen quer zur Laufrichtung, Segment fuer Segment. */
function paintPlanks(c: Ctx, r: Rng, pts: Pt[], pal: Pal): void {
  const step = 0.21;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const horizontal = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    const len = horizontal ? Math.abs(x1 - x0) : Math.abs(y1 - y0);
    const dir = horizontal ? Math.sign(x1 - x0) : Math.sign(y1 - y0);
    for (let d = -0.4; d < len + 0.4; d += step) {
      const px = horizontal ? x0 + dir * d : x0;
      const py = horizontal ? y0 : y0 + dir * d;
      const tone = mix(pal.base, r() < 0.5 ? pal.dark : pal.light, rr(r, 0.05, 0.35));
      c.fillStyle = tone;
      if (horizontal) c.fillRect(px - 0.01, py - 0.5, step - 0.025, 1);
      else c.fillRect(px - 0.5, py - 0.01, 1, step - 0.025);
      // Wurmloch/Kerbe und Nagelkoepfe
      c.fillStyle = rgba(pal.dark, 0.55);
      for (const o of [-0.4, 0.4]) {
        c.beginPath();
        if (horizontal) c.arc(px + step * 0.45, py + o, 0.016, 0, TAU);
        else c.arc(px + o, py + step * 0.45, 0.016, 0, TAU);
        c.fill();
      }
      // Maserung
      c.strokeStyle = rgba(pal.dark, 0.18);
      c.lineWidth = 0.01;
      c.beginPath();
      if (horizontal) {
        c.moveTo(px + step * 0.3, py - 0.4);
        c.lineTo(px + step * 0.3 + rr(r, -0.01, 0.01), py + 0.4);
      } else {
        c.moveTo(px - 0.4, py + step * 0.3);
        c.lineTo(px + 0.4, py + step * 0.3 + rr(r, -0.01, 0.01));
      }
      c.stroke();
    }
  }
}

function paintPath(c: Ctx, r: Rng, board: BoardTheme, pts: Pt[], cols: number, rows: number, px: number): void {
  const p = board.path;
  const pal: Pal = { base: p.base, dark: p.edge, light: p.light, accent: p.glow };
  // 1) Abgenutzter Rand: weicher, dunkler Saum im Boden und Schlagschatten, damit der Weg Tiefe bekommt
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.55)';
  c.shadowBlur = px * 0.22;
  c.shadowOffsetY = px * 0.07;
  strokeLine(c, pts, 1.06, p.edge);
  c.restore();
  strokeLine(c, pts, 1.06, p.edge);
  // 2) Lippe (Randstein) und Koerper
  strokeLine(c, pts, 0.98, mix(p.edge, p.light, 0.38));
  strokeLine(c, pts, 0.9, mix(p.edge, p.base, 0.55));
  // 3) Muster nur im Koerper: auf eigener Ebene malen, mit der Weg-Form ausstanzen
  const { cv: layer, c: lc } = mk(Math.ceil(cols * px), Math.ceil(rows * px));
  lc.scale(px, px);
  lc.fillStyle = p.base;
  lc.fillRect(0, 0, cols, rows);
  if (p.pattern === 'planks') paintPlanks(lc, r, pts, pal);
  else paintPattern(lc, r, p.pattern === 'glow' ? 'flagstone' : p.pattern, pal, { x: 0, y: 0, w: cols, h: rows }, 0.9);
  lc.globalCompositeOperation = 'destination-in';
  strokeLine(lc, pts, 0.8, '#000');
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(layer, 0, 0);
  c.restore();
  // 4) Wulst: heller Streifen in der Mitte; Innenkante dunkelt in Stufen zum Rand hin ab (Tiefe)
  const { cv: shLayer, c: sc } = mk(Math.ceil(cols * px), Math.ceil(rows * px));
  sc.scale(px, px);
  sc.fillStyle = rgba(p.edge, 0.55);
  sc.fillRect(0, 0, cols, rows);
  sc.globalCompositeOperation = 'destination-out';
  for (const w of [0.74, 0.68, 0.62, 0.56, 0.5, 0.44]) strokeLine(sc, pts, w, 'rgba(0,0,0,0.24)');
  sc.globalCompositeOperation = 'destination-in';
  strokeLine(sc, pts, 0.8, '#000');
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(shLayer, 0, 0);
  c.restore();
  strokeLine(c, pts, 0.5, rgba(p.light, 0.1));
  strokeLine(c, pts, 0.24, rgba(p.light, 0.09));
  // 5) Leuchtende Mittellinie (Runen / Glut)
  if (p.glow) {
    c.save();
    c.shadowColor = p.glow;
    c.shadowBlur = px * 0.18;
    strokeLine(c, pts, 0.045, rgba(p.glow, 0.7), [0.22, 0.16]);
    c.restore();
  }
}

// ---------------------------------------------------------------- Huegel

function paintHills(c: Ctx, r: Rng, stage: StageData, board: BoardTheme, cols: number, rows: number, px: number): { shadows: Area[] } {
  const hc = stage.theme?.hill ?? { top: '#6f9a4c', topLight: '#8cb35e', wall: '#8a5a3a', wallDark: '#5a3a2a' };
  const isHill = (x: number, y: number): boolean => zoneChar(stage, x, y) === 'h';
  const shadows: Area[] = [];
  const top = new Path2D();
  let any = false;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isHill(x, y)) continue;
      any = true;
      const wall = isHill(x, y + 1) ? 0 : WALL;
      top.rect(x - 0.002, y - 0.002, 1.004, 1.004 - wall);
    }
  }
  if (!any) return { shadows };
  // Schlagschatten der Terrasse auf den Boden: hebt sie vom Untergrund ab, auch wenn die Farben nah beieinander liegen
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.5)';
  c.shadowBlur = px * 0.16;
  c.shadowOffsetY = px * 0.05;
  c.fillStyle = hc.wall;
  c.fill(top);
  c.restore();
  // Kuppe: Muster der Welt in den Hang-Farben, deutlich heller als der Boden (Terrasse)
  c.save();
  c.clip(top);
  const topCol = mix(hc.top, hc.topLight, 0.4);
  const pal: Pal = { base: topCol, dark: mix(topCol, hc.wall, 0.45), light: hc.topLight, accent: board.ground.accent };
  c.fillStyle = topCol;
  c.fillRect(0, 0, cols, rows);
  paintPattern(c, r, board.ground.pattern, pal, { x: 0, y: 0, w: cols, h: rows }, 1.1);
  const g = c.createLinearGradient(0, 0, cols * 0.3, rows);
  g.addColorStop(0, rgba(hc.topLight, 0.28));
  g.addColorStop(1, rgba(hc.wall, 0.2));
  c.fillStyle = g;
  c.fillRect(0, 0, cols, rows);
  c.restore();
  // Aussenkante der Terrasse: dunkle Linie rundum, damit sie sich vom Boden loest
  c.strokeStyle = rgba(hc.wallDark, 0.7);
  c.lineWidth = 0.05;
  c.lineCap = 'square';
  c.beginPath();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isHill(x, y)) continue;
      const faceH = 1 - (isHill(x, y + 1) ? 0 : WALL);
      if (!isHill(x, y - 1)) c.moveTo(x, y + 0.025), c.lineTo(x + 1, y + 0.025);
      if (!isHill(x - 1, y)) c.moveTo(x + 0.025, y), c.lineTo(x + 0.025, y + faceH);
      if (!isHill(x + 1, y)) c.moveTo(x + 0.975, y), c.lineTo(x + 0.975, y + faceH);
    }
  }
  c.stroke();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isHill(x, y)) continue;
      const below = isHill(x, y + 1);
      const wall = below ? 0 : WALL;
      const faceH = 1 - wall;
      // Lichtkante oben/links, Schattenkante rechts
      c.lineCap = 'butt';
      if (!isHill(x, y - 1)) {
        c.fillStyle = rgba(hc.topLight, 0.85);
        c.fillRect(x, y, 1, 0.045);
      }
      if (!isHill(x - 1, y)) {
        c.fillStyle = rgba(hc.topLight, 0.5);
        c.fillRect(x, y, 0.04, faceH);
      }
      if (!isHill(x + 1, y)) {
        c.fillStyle = rgba(hc.wallDark, 0.45);
        c.fillRect(x + 0.96, y, 0.04, faceH);
      }
      if (!below) {
        // Felswand mit Schichten
        const wy = y + faceH;
        const wg = c.createLinearGradient(0, wy, 0, wy + wall);
        wg.addColorStop(0, hc.wall);
        wg.addColorStop(1, hc.wallDark);
        c.fillStyle = wg;
        c.fillRect(x, wy, 1, wall);
        c.fillStyle = rgba('#000000', 0.18);
        c.fillRect(x, wy, 1, 0.025);
        c.strokeStyle = rgba(hc.wallDark, 0.55);
        c.lineWidth = 0.012;
        for (let k = 0; k < 3; k++) {
          const sx = x + rr(r, 0.05, 0.85);
          c.beginPath();
          c.moveTo(sx, wy + 0.03);
          c.lineTo(sx + rr(r, -0.04, 0.04), wy + wall - 0.02);
          c.stroke();
        }
        shadows.push({ x, y: y + 1, w: 1, h: 0.3 });
      }
    }
  }
  return { shadows };
}

// ---------------------------------------------------------------- Hindernisse

type Deco = BoardTheme['deco'][number];

const WARM_WINDOW = '#ffd680';

/** Ein Hindernis. (bx, by) = Fusspunkt, s = Groesse (1 = eine Kachel). */
function drawDeco(c: Ctx, r: Rng, d: Deco, bx: number, by: number, s: number): void {
  const col = d.color;
  const col2 = d.color2;
  // Bodenkontakt
  soft(c, bx + 0.04 * s, by + 0.01, 0.42 * s, 0.16 * s, '#000000', 0.42);
  switch (d.kind) {
    case 'tree': {
      const trunk = col2 ?? '#6b4a2e';
      roundRect(c, bx - 0.06 * s, by - 0.34 * s, 0.12 * s, 0.36 * s, 0.03);
      c.fillStyle = trunk;
      c.fill();
      c.fillStyle = rgba('#000000', 0.25);
      c.fillRect(bx + 0.01 * s, by - 0.32 * s, 0.05 * s, 0.34 * s);
      const cy = by - 0.46 * s;
      const blobs: Array<[number, number, number]> = [
        [-0.17, 0.05, 0.26],
        [0.17, 0.06, 0.25],
        [0, -0.12, 0.3],
        [-0.1, -0.2, 0.2],
        [0.12, -0.18, 0.2],
      ];
      for (const [ox, oy, rad] of blobs) ell(c, bx + ox * s, cy + oy * s, rad * s, rad * s * 0.94, shade(col, -0.28));
      for (const [ox, oy, rad] of blobs) ell(c, bx + (ox - 0.03) * s, cy + (oy - 0.04) * s, rad * s * 0.88, rad * s * 0.82, col);
      for (let i = 0; i < 5; i++) ell(c, bx + rr(r, -0.2, 0.15) * s, cy + rr(r, -0.32, 0.0) * s, rr(r, 0.04, 0.09) * s, rr(r, 0.03, 0.07) * s, rgba(shade(col, 0.4), 0.55));
      break;
    }
    case 'pine': {
      roundRect(c, bx - 0.045 * s, by - 0.2 * s, 0.09 * s, 0.22 * s, 0.02);
      c.fillStyle = col2 && col2 !== '#ffffff' ? col2 : '#5a3f2a';
      c.fill();
      const snow = col2 === '#ffffff' || (col2 ?? '').toLowerCase() === '#fff';
      const tiers: Array<[number, number, number]> = [
        [0.34, 0.1, 0.34],
        [0.27, 0.34, 0.28],
        [0.2, 0.55, 0.24],
      ];
      for (const [hw, yb, h] of tiers) {
        const yBase = by - yb * s + 0.12 * s;
        poly(c, [[bx - hw * s, yBase], [bx + hw * s, yBase], [bx, yBase - h * s * 1.5]], shade(col, -0.2 - yb * 0.1));
        poly(c, [[bx - hw * s, yBase], [bx - 0.02 * s, yBase], [bx, yBase - h * s * 1.5]], shade(col, 0.05));
        if (snow) poly(c, [[bx - hw * s * 0.62, yBase - h * s * 0.55], [bx + hw * s * 0.62, yBase - h * s * 0.55], [bx, yBase - h * s * 1.5]], rgba('#ffffff', 0.92));
      }
      break;
    }
    case 'deadtree': {
      c.strokeStyle = shade(col, -0.2);
      c.lineCap = 'round';
      const branch = (x0: number, y0: number, ang: number, len: number, w: number, depth: number): void => {
        const x1 = x0 + Math.cos(ang) * len;
        const y1 = y0 + Math.sin(ang) * len;
        c.lineWidth = w;
        c.strokeStyle = depth === 0 ? shade(col, -0.25) : col;
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x1, y1);
        c.stroke();
        if (depth < 3) {
          branch(x1, y1, ang - rr(r, 0.35, 0.7), len * 0.7, w * 0.65, depth + 1);
          branch(x1, y1, ang + rr(r, 0.35, 0.7), len * 0.7, w * 0.65, depth + 1);
        }
      };
      branch(bx, by, -Math.PI / 2 + rr(r, -0.1, 0.1), 0.3 * s, 0.1 * s, 0);
      break;
    }
    case 'rock': {
      for (const [ox, sz] of [[0, 1], ...(r() < 0.55 ? [[0.25, 0.5]] : [])] as Array<[number, number]>) {
        const rad = 0.32 * s * sz;
        const x = bx + ox * s;
        const pts: Pt[] = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          const rd = rad * rr(r, 0.78, 1.05);
          pts.push([x + Math.cos(a) * rd * 1.1, by - rad * 0.65 + Math.sin(a) * rd * 0.8]);
        }
        poly(c, pts, col);
        // Lichtseite oben links, Schattenseite unten rechts
        c.save();
        c.beginPath();
        pts.forEach(([px, py], i) => (i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)));
        c.closePath();
        c.clip();
        const g = c.createLinearGradient(x - rad, by - rad * 1.4, x + rad, by);
        g.addColorStop(0, rgba(shade(col, 0.45), 0.7));
        g.addColorStop(0.5, rgba(col, 0));
        g.addColorStop(1, rgba(shade(col, -0.5), 0.6));
        c.fillStyle = g;
        c.fillRect(x - rad * 1.4, by - rad * 2, rad * 3, rad * 3);
        c.strokeStyle = rgba(shade(col, -0.45), 0.55);
        c.lineWidth = 0.014;
        c.beginPath();
        c.moveTo(x - rad * 0.2, by - rad * 1.1);
        c.lineTo(x + rad * 0.1, by - rad * 0.6);
        c.lineTo(x - rad * 0.1, by - rad * 0.25);
        c.stroke();
        c.restore();
      }
      break;
    }
    case 'bush': {
      const blobs: Array<[number, number, number]> = [[-0.15, -0.12, 0.2], [0.14, -0.1, 0.19], [0, -0.22, 0.22]];
      for (const [ox, oy, rad] of blobs) ell(c, bx + ox * s, by + oy * s, rad * s, rad * s * 0.9, shade(col, -0.3));
      for (const [ox, oy, rad] of blobs) ell(c, bx + (ox - 0.02) * s, by + (oy - 0.03) * s, rad * s * 0.85, rad * s * 0.78, col);
      for (let i = 0; i < 3; i++) ell(c, bx + rr(r, -0.2, 0.2) * s, by + rr(r, -0.3, -0.1) * s, 0.025 * s, 0.025 * s, col2 ?? shade(col, 0.45));
      break;
    }
    case 'crystal':
    case 'ice': {
      const glowCol = d.kind === 'crystal' ? col : shade(col, 0.4);
      const shards: Array<[number, number, number, number]> = [
        [0, 0.62, 0.15, 0],
        [-0.2, 0.4, 0.11, -0.22],
        [0.19, 0.46, 0.12, 0.2],
      ];
      c.save();
      c.shadowColor = glowCol;
      c.shadowBlur = 8;
      for (const [ox, h, w, lean] of shards) {
        const x = bx + ox * s;
        const tip: Pt = [x + lean * 0.3 * s, by - h * s];
        poly(c, [[x - w * s, by], [x + w * s, by], tip], shade(col, -0.2));
      }
      c.restore();
      for (const [ox, h, w, lean] of shards) {
        const x = bx + ox * s;
        const tip: Pt = [x + lean * 0.3 * s, by - h * s];
        poly(c, [[x - w * s, by], [x, by + 0.02 * s], tip], shade(col, 0.12));
        poly(c, [[x, by + 0.02 * s], [x + w * s, by], tip], shade(col, -0.25));
        c.strokeStyle = rgba(col2 ?? '#ffffff', 0.7);
        c.lineWidth = 0.012;
        c.beginPath();
        c.moveTo(x - w * s * 0.4, by - h * s * 0.2);
        c.lineTo(tip[0] - 0.01, tip[1] + h * s * 0.2);
        c.stroke();
      }
      break;
    }
    case 'pillar': {
      const broken = r() < 0.6;
      const w = 0.2 * s;
      const h = (broken ? rr(r, 0.38, 0.52) : 0.66) * s;
      roundRect(c, bx - w * 1.5, by - 0.1 * s, w * 3, 0.12 * s, 0.02);
      c.fillStyle = shade(col, -0.18);
      c.fill();
      const g = c.createLinearGradient(bx - w, 0, bx + w, 0);
      g.addColorStop(0, shade(col, 0.28));
      g.addColorStop(0.55, col);
      g.addColorStop(1, shade(col, -0.35));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(bx - w, by - 0.08 * s);
      c.lineTo(bx - w, by - h);
      if (broken) {
        c.lineTo(bx - w * 0.4, by - h - 0.07 * s);
        c.lineTo(bx + w * 0.1, by - h + 0.03 * s);
        c.lineTo(bx + w * 0.6, by - h - 0.05 * s);
      } else {
        c.lineTo(bx + w, by - h);
      }
      c.lineTo(bx + w, by - h);
      c.lineTo(bx + w, by - 0.08 * s);
      c.closePath();
      c.fill();
      if (!broken) {
        roundRect(c, bx - w * 1.4, by - h - 0.08 * s, w * 2.8, 0.1 * s, 0.02);
        c.fillStyle = shade(col, 0.1);
        c.fill();
      }
      c.strokeStyle = rgba(shade(col, -0.5), 0.35);
      c.lineWidth = 0.01;
      for (const o of [-0.4, 0.05, 0.5]) {
        c.beginPath();
        c.moveTo(bx + o * w, by - 0.1 * s);
        c.lineTo(bx + o * w, by - h + 0.02 * s);
        c.stroke();
      }
      break;
    }
    case 'cactus': {
      const body = (x: number, y: number, w: number, h: number): void => {
        roundRect(c, x - w / 2, y - h, w, h, w / 2);
        const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        g.addColorStop(0, shade(col, 0.2));
        g.addColorStop(0.6, col);
        g.addColorStop(1, shade(col, -0.35));
        c.fillStyle = g;
        c.fill();
      };
      body(bx, by, 0.2 * s, 0.62 * s);
      body(bx - 0.19 * s, by - 0.2 * s, 0.1 * s, 0.26 * s);
      body(bx + 0.19 * s, by - 0.28 * s, 0.1 * s, 0.3 * s);
      c.fillStyle = rgba(shade(col, -0.5), 0.5);
      c.fillRect(bx - 0.19 * s - 0.05 * s, by - 0.22 * s, 0.38 * s, 0.05 * s);
      c.strokeStyle = rgba(shade(col, 0.5), 0.5);
      c.lineWidth = 0.01;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(bx + (i - 1.5) * 0.04 * s, by - 0.55 * s);
        c.lineTo(bx + (i - 1.5) * 0.04 * s, by - 0.04 * s);
        c.stroke();
      }
      break;
    }
    case 'mushroom': {
      roundRect(c, bx - 0.07 * s, by - 0.3 * s, 0.14 * s, 0.32 * s, 0.05);
      c.fillStyle = col2 ?? '#efe2c8';
      c.fill();
      const cy = by - 0.32 * s;
      c.beginPath();
      c.ellipse(bx, cy, 0.3 * s, 0.24 * s, 0, Math.PI, TAU);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      c.beginPath();
      c.ellipse(bx, cy, 0.3 * s, 0.07 * s, 0, 0, Math.PI);
      c.fillStyle = shade(col, -0.35);
      c.fill();
      for (const [ox, oy, rad] of [[-0.12, -0.12, 0.045], [0.08, -0.17, 0.05], [0.16, -0.07, 0.035]] as const) ell(c, bx + ox * s, cy + oy * s, rad * s, rad * s, rgba(col2 ?? '#ffffff', 0.9));
      break;
    }
    case 'tombstone': {
      const w = 0.3 * s;
      const h = 0.44 * s;
      ell(c, bx, by - 0.03 * s, w * 0.75, 0.08 * s, shade(col, -0.45));
      c.beginPath();
      c.moveTo(bx - w / 2, by - 0.02 * s);
      c.lineTo(bx - w / 2, by - h + w / 2);
      c.arc(bx, by - h + w / 2, w / 2, Math.PI, TAU);
      c.lineTo(bx + w / 2, by - 0.02 * s);
      c.closePath();
      const g = c.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
      g.addColorStop(0, shade(col, 0.25));
      g.addColorStop(1, shade(col, -0.3));
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = rgba(shade(col, -0.55), 0.7);
      c.lineWidth = 0.02 * s;
      c.beginPath();
      c.moveTo(bx, by - h + 0.1 * s);
      c.lineTo(bx, by - h + 0.26 * s);
      c.moveTo(bx - 0.05 * s, by - h + 0.15 * s);
      c.lineTo(bx + 0.05 * s, by - h + 0.15 * s);
      c.stroke();
      break;
    }
    case 'crate': {
      const w = 0.5 * s;
      roundRect(c, bx - w / 2, by - w * 0.95, w, w * 0.95, 0.03);
      c.fillStyle = col;
      c.fill();
      c.fillStyle = rgba('#ffffff', 0.18);
      c.fillRect(bx - w / 2 + 0.02, by - w * 0.95 + 0.02, w - 0.04, 0.04);
      c.strokeStyle = shade(col, -0.45);
      c.lineWidth = 0.025 * s;
      c.strokeRect(bx - w / 2 + 0.03, by - w * 0.95 + 0.03, w - 0.06, w * 0.95 - 0.06);
      c.beginPath();
      c.moveTo(bx - w / 2 + 0.03, by - w * 0.95 + 0.03);
      c.lineTo(bx + w / 2 - 0.03, by - 0.03);
      c.moveTo(bx + w / 2 - 0.03, by - w * 0.95 + 0.03);
      c.lineTo(bx - w / 2 + 0.03, by - 0.03);
      c.stroke();
      break;
    }
    case 'barrel': {
      const w = 0.4 * s;
      const h = 0.5 * s;
      const g = c.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
      g.addColorStop(0, shade(col, 0.25));
      g.addColorStop(0.5, col);
      g.addColorStop(1, shade(col, -0.35));
      c.beginPath();
      c.moveTo(bx - w / 2, by);
      c.quadraticCurveTo(bx - w * 0.62, by - h / 2, bx - w / 2, by - h);
      c.lineTo(bx + w / 2, by - h);
      c.quadraticCurveTo(bx + w * 0.62, by - h / 2, bx + w / 2, by);
      c.closePath();
      c.fillStyle = g;
      c.fill();
      ell(c, bx, by - h, w / 2, 0.07 * s, shade(col, 0.2));
      c.strokeStyle = '#2a2a30';
      c.lineWidth = 0.03 * s;
      for (const y of [0.18, 0.78]) {
        c.beginPath();
        c.moveTo(bx - w * 0.55, by - h * y);
        c.lineTo(bx + w * 0.55, by - h * y);
        c.stroke();
      }
      break;
    }
    case 'house': {
      const w = 0.7 * s;
      const h = 0.34 * s;
      const roof = col2 ?? shade(col, -0.4);
      c.fillStyle = col;
      c.fillRect(bx - w / 2, by - h, w, h);
      c.fillStyle = rgba('#000000', 0.22);
      c.fillRect(bx + w * 0.18, by - h, w * 0.32, h);
      poly(c, [[bx - w * 0.6, by - h + 0.02 * s], [bx + w * 0.6, by - h + 0.02 * s], [bx + w * 0.34, by - h - 0.3 * s], [bx - w * 0.34, by - h - 0.3 * s]], roof);
      poly(c, [[bx - w * 0.6, by - h + 0.02 * s], [bx - w * 0.2, by - h + 0.02 * s], [bx - w * 0.1, by - h - 0.3 * s], [bx - w * 0.34, by - h - 0.3 * s]], rgba('#ffffff', 0.2));
      c.fillStyle = rgba('#000000', 0.28);
      c.fillRect(bx - w * 0.6, by - h + 0.02 * s, w * 1.2, 0.035 * s);
      c.fillStyle = shade(col, -0.5);
      c.fillRect(bx - 0.06 * s, by - 0.2 * s, 0.12 * s, 0.2 * s);
      c.save();
      c.shadowColor = WARM_WINDOW;
      c.shadowBlur = 6;
      c.fillStyle = WARM_WINDOW;
      c.fillRect(bx - w * 0.36, by - h * 0.78, 0.1 * s, 0.1 * s);
      c.fillRect(bx + w * 0.22, by - h * 0.78, 0.1 * s, 0.1 * s);
      c.restore();
      c.fillStyle = shade(col, -0.45);
      c.fillRect(bx + w * 0.2, by - h - 0.34 * s, 0.07 * s, 0.14 * s);
      break;
    }
    case 'mound': {
      c.beginPath();
      c.moveTo(bx - 0.42 * s, by);
      c.bezierCurveTo(bx - 0.36 * s, by - 0.5 * s, bx + 0.36 * s, by - 0.5 * s, bx + 0.42 * s, by);
      c.closePath();
      const g = c.createLinearGradient(bx - 0.4 * s, by - 0.4 * s, bx + 0.4 * s, by);
      g.addColorStop(0, shade(col, 0.28));
      g.addColorStop(1, shade(col, -0.35));
      c.fillStyle = g;
      c.fill();
      for (let i = 0; i < 12; i++) {
        c.fillStyle = rgba(r() < 0.5 ? shade(col, 0.4) : shade(col, -0.5), 0.4);
        c.beginPath();
        c.arc(bx + rr(r, -0.3, 0.3) * s, by - rr(r, 0.04, 0.26) * s, 0.012 * s + r() * 0.012, 0, TAU);
        c.fill();
      }
      ell(c, bx, by - 0.05 * s, 0.11 * s, 0.065 * s, col2 ?? '#1f150c');
      break;
    }
    case 'lantern': {
      const post = col2 ?? '#2b2b33';
      c.fillStyle = post;
      c.fillRect(bx - 0.025 * s, by - 0.52 * s, 0.05 * s, 0.54 * s);
      roundRect(c, bx - 0.09 * s, by - 0.04 * s, 0.18 * s, 0.05 * s, 0.02);
      c.fill();
      c.save();
      c.globalCompositeOperation = 'lighter';
      soft(c, bx, by - 0.5 * s, 0.5 * s, 0.5 * s, col, 0.5);
      c.restore();
      c.save();
      c.shadowColor = col;
      c.shadowBlur = 10;
      roundRect(c, bx - 0.07 * s, by - 0.62 * s, 0.14 * s, 0.17 * s, 0.03);
      c.fillStyle = shade(col, 0.2);
      c.fill();
      c.restore();
      poly(c, [[bx - 0.1 * s, by - 0.62 * s], [bx + 0.1 * s, by - 0.62 * s], [bx, by - 0.7 * s]], post);
      break;
    }
    case 'stalagmite': {
      for (const [ox, h, w] of [[0, 0.6, 0.15], [-0.2, 0.36, 0.11], [0.2, 0.3, 0.1]] as const) {
        const x = bx + ox * s;
        poly(c, [[x - w * s, by], [x + w * s, by], [x + 0.01 * s, by - h * s]], shade(col, -0.2));
        poly(c, [[x - w * s, by], [x, by], [x + 0.01 * s, by - h * s]], shade(col, 0.2));
      }
      break;
    }
  }
}

// ---------------------------------------------------------------- Bodendeko

type Scatter = BoardTheme['scatter'][number];

function drawScatter(c: Ctx, r: Rng, sc: Scatter, x: number, y: number): void {
  const col = sc.color;
  switch (sc.kind) {
    case 'flowers':
      for (let i = 0; i < 3; i++) {
        const fx = x + rr(r, -0.1, 0.1);
        const fy = y + rr(r, -0.07, 0.07);
        c.strokeStyle = rgba('#2e6a3a', 0.7);
        c.lineWidth = 0.014;
        c.beginPath();
        c.moveTo(fx, fy + 0.07);
        c.lineTo(fx, fy);
        c.stroke();
        for (let k = 0; k < 5; k++) ell(c, fx + Math.cos((k / 5) * TAU) * 0.032, fy + Math.sin((k / 5) * TAU) * 0.032, 0.026, 0.026, col);
        ell(c, fx, fy, 0.018, 0.018, '#f6b83a');
      }
      break;
    case 'tufts':
      c.strokeStyle = rgba(col, 0.75);
      c.lineWidth = 0.02;
      c.lineCap = 'round';
      for (let k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(x + k * 0.025, y + 0.04);
        c.quadraticCurveTo(x + k * 0.04, y - 0.02, x + k * 0.07, y - 0.1 - Math.abs(k) * -0.01);
        c.stroke();
      }
      break;
    case 'pebbles':
      for (let i = 0; i < 3; i++) {
        const px = x + rr(r, -0.12, 0.12);
        const py = y + rr(r, -0.07, 0.07);
        const s = rr(r, 0.03, 0.055);
        ell(c, px + 0.008, py + 0.012, s, s * 0.7, rgba('#000000', 0.25));
        ell(c, px, py, s, s * 0.7, col);
        ell(c, px - s * 0.25, py - s * 0.25, s * 0.45, s * 0.28, rgba('#ffffff', 0.3));
      }
      break;
    case 'puddle': {
      const rx = rr(r, 0.14, 0.24);
      ell(c, x, y, rx + 0.02, rx * 0.5 + 0.015, rgba('#000000', 0.18));
      ell(c, x, y, rx, rx * 0.46, rgba(col, 0.62));
      c.strokeStyle = rgba('#ffffff', 0.45);
      c.lineWidth = 0.014;
      c.beginPath();
      c.ellipse(x - rx * 0.1, y - rx * 0.1, rx * 0.5, rx * 0.16, 0, Math.PI * 1.1, Math.PI * 1.7);
      c.stroke();
      break;
    }
    case 'drift': {
      const rx = rr(r, 0.16, 0.3);
      ell(c, x + 0.015, y + rx * 0.14, rx, rx * 0.34, rgba('#7b97b8', 0.28));
      ell(c, x, y, rx, rx * 0.32, rgba(col, 0.85));
      break;
    }
    case 'bones': {
      c.strokeStyle = rgba(col, 0.9);
      c.lineWidth = 0.032;
      c.lineCap = 'round';
      const a = rr(r, -0.5, 0.5);
      c.beginPath();
      c.moveTo(x - 0.1 * Math.cos(a), y - 0.1 * Math.sin(a));
      c.lineTo(x + 0.1 * Math.cos(a), y + 0.1 * Math.sin(a));
      c.moveTo(x - 0.08 * Math.cos(a + 1.2), y - 0.08 * Math.sin(a + 1.2));
      c.lineTo(x + 0.08 * Math.cos(a + 1.2), y + 0.08 * Math.sin(a + 1.2));
      c.stroke();
      ell(c, x + 0.05, y - 0.03, 0.035, 0.032, col);
      break;
    }
    case 'leaves':
      for (let i = 0; i < 3; i++) ell(c, x + rr(r, -0.12, 0.12), y + rr(r, -0.08, 0.08), 0.04, 0.02, rgba(col, 0.85), rr(r, 0, Math.PI));
      break;
    case 'sparkle': {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.shadowColor = col;
      c.shadowBlur = 5;
      c.strokeStyle = rgba(col, 0.9);
      c.lineWidth = 0.014;
      c.lineCap = 'round';
      const s = rr(r, 0.04, 0.075);
      c.beginPath();
      c.moveTo(x - s, y);
      c.lineTo(x + s, y);
      c.moveTo(x, y - s);
      c.lineTo(x, y + s);
      c.stroke();
      c.restore();
      break;
    }
    case 'rune': {
      c.save();
      c.shadowColor = col;
      c.shadowBlur = 5;
      c.strokeStyle = rgba(col, 0.5);
      c.lineWidth = 0.014;
      c.beginPath();
      c.ellipse(x, y, 0.15, 0.1, 0, 0, TAU);
      c.moveTo(x - 0.07, y);
      c.lineTo(x + 0.07, y);
      c.moveTo(x, y - 0.05);
      c.lineTo(x, y + 0.05);
      c.stroke();
      c.restore();
      break;
    }
    case 'moss':
      for (let i = 0; i < 4; i++) ell(c, x + rr(r, -0.1, 0.1), y + rr(r, -0.06, 0.06), rr(r, 0.04, 0.09), rr(r, 0.03, 0.05), rgba(col, 0.5));
      break;
  }
}

// ---------------------------------------------------------------- Spawn und Basis

function drawPortal(c: Ctx, x: number, y: number, col: string): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  soft(c, x, y, 1.15, 1.15, col, 0.3);
  c.restore();
  soft(c, x, y + 0.22, 0.46, 0.15, '#000000', 0.4);
  // Steinring
  c.beginPath();
  c.ellipse(x, y, 0.4, 0.44, 0, 0, TAU);
  c.fillStyle = '#2a2530';
  c.fill();
  c.lineWidth = 0.06;
  c.strokeStyle = '#4b4358';
  c.stroke();
  // Wirbel
  const g = c.createRadialGradient(x, y, 0.02, x, y, 0.34);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, shade(col, 0.4));
  g.addColorStop(0.75, col);
  g.addColorStop(1, shade(col, -0.6));
  c.save();
  c.shadowColor = col;
  c.shadowBlur = 14;
  c.beginPath();
  c.ellipse(x, y, 0.33, 0.37, 0, 0, TAU);
  c.fillStyle = g;
  c.fill();
  c.restore();
  c.strokeStyle = rgba('#ffffff', 0.55);
  c.lineWidth = 0.022;
  c.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.arc(x, y, 0.1 + k * 0.07, k * 2.1, k * 2.1 + 2.2);
    c.stroke();
  }
}

function drawShrine(c: Ctx, x: number, y: number, col: string): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  soft(c, x, y - 0.1, 1.2, 1.2, col, 0.32);
  c.restore();
  soft(c, x, y + 0.26, 0.5, 0.16, '#000000', 0.45);
  // Sockel
  ell(c, x, y + 0.2, 0.46, 0.2, '#3a3846');
  ell(c, x, y + 0.16, 0.42, 0.17, '#6a6880');
  ell(c, x, y + 0.13, 0.32, 0.12, '#85849c');
  // Kristall
  const top = y - 0.5;
  c.save();
  c.shadowColor = col;
  c.shadowBlur = 16;
  poly(c, [[x, top], [x + 0.2, y - 0.14], [x, y + 0.08], [x - 0.2, y - 0.14]], shade(col, -0.15));
  c.restore();
  poly(c, [[x, top], [x, y + 0.08], [x - 0.2, y - 0.14]], shade(col, 0.3));
  poly(c, [[x, top], [x + 0.2, y - 0.14], [x, y + 0.08]], shade(col, -0.1));
  poly(c, [[x, top + 0.05], [x - 0.05, y - 0.22], [x - 0.12, y - 0.16]], rgba('#ffffff', 0.6));
}

// ---------------------------------------------------------------- Licht

function paintLight(c: Ctx, board: BoardTheme, bg: string, cols: number, rows: number, spawn: Pt, base: Pt, spawnCol: string, baseCol: string): void {
  const L = board.light;
  // Stimmung: Farbton weich ueber alles
  c.save();
  c.globalCompositeOperation = 'soft-light';
  c.globalAlpha = Math.min(1, L.tintAlpha * 2.6);
  c.fillStyle = L.tint;
  c.fillRect(0, 0, cols, rows);
  c.restore();
  c.save();
  c.globalAlpha = L.tintAlpha * 0.45;
  c.fillStyle = L.tint;
  c.fillRect(0, 0, cols, rows);
  c.restore();
  // Licht von links oben
  const dir = c.createLinearGradient(0, 0, cols, rows);
  dir.addColorStop(0, 'rgba(255,255,255,0.1)');
  dir.addColorStop(0.5, 'rgba(255,255,255,0)');
  dir.addColorStop(1, 'rgba(0,0,0,0.14)');
  c.fillStyle = dir;
  c.fillRect(0, 0, cols, rows);
  // Leuchten um Spawn und Basis
  if (L.glow) {
    c.save();
    c.globalCompositeOperation = 'soft-light';
    soft(c, base[0], base[1], 3.2, 3.2, L.glow, 0.55);
    c.restore();
  }
  c.save();
  c.globalCompositeOperation = 'lighter';
  soft(c, spawn[0], spawn[1], 2.2, 2.2, spawnCol, 0.1);
  soft(c, base[0], base[1], 2.4, 2.4, baseCol, 0.12);
  c.restore();
  // Vignette
  if (L.vignette > 0) {
    const cx = cols / 2;
    const cy = rows / 2;
    const rad = Math.hypot(cols, rows) / 2;
    const g = c.createRadialGradient(cx, cy, rad * 0.4, cx, cy, rad * 1.02);
    const dark = mix(bg, '#000000', 0.6);
    g.addColorStop(0, rgba(dark, 0));
    g.addColorStop(0.65, rgba(dark, L.vignette * 0.28));
    g.addColorStop(1, rgba(dark, L.vignette * 0.9));
    c.fillStyle = g;
    c.fillRect(0, 0, cols, rows);
  }
  // Rand: schmaler dunkler Saum, damit die Karte im Fenster "gerahmt" liegt
  const edge = 0.5;
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [
    [0, 0, edge, 0, 0, 0, edge, rows],
    [cols, 0, cols - edge, 0, cols - edge, 0, edge, rows],
    [0, 0, 0, edge, 0, 0, cols, edge],
    [0, rows, 0, rows - edge, 0, rows - edge, cols, edge],
  ] as const) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, rgba(mix(bg, '#000000', 0.7), 0.4));
    g.addColorStop(1, rgba(bg, 0));
    c.fillStyle = g;
    c.fillRect(rx, ry, rw, rh);
  }
}

// ---------------------------------------------------------------- Zusammenbau

export interface PaintedBoard {
  canvas: HTMLCanvasElement;
  /** Pixel je Kachel, mit dem gemalt wurde. */
  px: number;
}

/** Malt die ganze Karte. `px` = Pixel je Kachel in der Zeichenflaeche. Deterministisch je Welt. */
export function paintBoard(stage: StageData, px: number): PaintedBoard {
  const theme = stage.theme;
  const board = resolveBoard(theme);
  const rows = stage.zones.rows.length;
  const cols = stage.zones.rows[0]?.length ?? 0;
  const seed = hashStr(theme?.id ?? stage.world ?? stage.id);
  const { cv, c } = mk(Math.ceil(cols * px), Math.ceil(rows * px));
  c.scale(px, px);
  const all: Area = { x: 0, y: 0, w: cols, h: rows };
  const g = board.ground;
  const gpal: Pal = { base: g.base, dark: g.dark, light: g.light, accent: g.accent };

  // 1) Boden
  c.fillStyle = g.base;
  c.fillRect(0, 0, cols, rows);
  paintPattern(c, rngFrom(seed ^ 0x11), g.pattern, gpal, all);

  // 2) Huegel
  const { shadows } = paintHills(c, rngFrom(seed ^ 0x22), stage, board, cols, rows, px);

  // 3) Pfad
  const line = pathLine(stage, cols, rows);
  paintPath(c, rngFrom(seed ^ 0x33), board, line, cols, rows, px);

  // 4) Huegel-Schatten ueber Boden/Pfad (nach dem Pfad, damit auch dort Kanten haengen)
  for (const s of shadows) {
    const sg = c.createLinearGradient(0, s.y, 0, s.y + s.h);
    sg.addColorStop(0, 'rgba(0,0,0,0.34)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg;
    c.fillRect(s.x, s.y, s.w, s.h);
  }

  // 5) Bodendeko auf freien Kacheln (nie auf Pfad, Huegel, Hindernis)
  const cells = pathCells(stage.path);
  const rs = rngFrom(seed ^ 0x44);
  if (board.scatter.length > 0) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (cells.has(`${x},${y}`) || zoneChar(stage, x, y) !== '.') continue;
        let drawn = 0;
        for (const item of board.scatter) {
          if (drawn < 2 && rs() < item.density) {
            drawScatter(c, rs, item, x + rr(rs, 0.15, 0.85), y + rr(rs, 0.2, 0.85));
            drawn++;
          }
        }
      }
    }
  }

  // 6) Spawn und Basis
  const sc = board.markers?.spawn ?? '#e0384e';
  const bc = board.markers?.base ?? '#3fd8c0';
  const [sx, sy] = stage.path[0];
  const [bx, by] = stage.path[stage.path.length - 1];
  drawPortal(c, sx + 0.5, sy + 0.5, sc);
  drawShrine(c, bx + 0.5, by + 0.5, bc);

  // 7) Hindernisse von hinten nach vorn
  const ro = rngFrom(seed ^ 0x55);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (zoneChar(stage, x, y) !== '#' || cells.has(`${x},${y}`)) continue;
      const d = pickWeighted(ro, board.deco);
      const s = rr(ro, 0.92, 1.12);
      drawDeco(c, ro, d, x + 0.5 + rr(ro, -0.07, 0.07), y + 0.8 + rr(ro, -0.04, 0.04), s);
    }
  }

  // 8) Lichtstimmung
  paintLight(c, board, theme?.background ?? '#101820', cols, rows, [sx + 0.5, sy + 0.5], [bx + 0.5, by + 0.5], sc, bc);
  return { canvas: cv, px };
}

/** Pixel je Kachel fuer die Zeichenflaeche: dem Bildschirm (Kachel x Pixeldichte) folgend, in Stufen, damit ein kleiner Groessenwechsel nicht neu malt. */
export function boardPx(tile: number, dpr: number): number {
  return Math.min(96, Math.max(32, Math.ceil((tile * dpr) / 16) * 16));
}
