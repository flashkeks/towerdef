/** Wiederverwendbare Bauteile fuer Tuerme, Held und Effekte (alles ganze Pixel, nur Palette). */
import type { PalName } from '../palette';
import { irnd, outlineSurface, RAMPS, type Ramp, Surface } from './surface';

/** Licht kommt von oben links. */
export const LIGHT = { x: -0.55, y: -0.75 };

/** Rohr/Strebe als Parallelogramm von (x0,y0) nach (x1,y1) mit Breite `w` und Licht-Schattierung quer zur Achse. */
export function tube(s: Surface, x0: number, y0: number, x1: number, y1: number, w: number, ramp: Ramp, w1 = w): void {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len; // Normale
  const lit = nx * LIGHT.x + ny * LIGHT.y; // >0: +Normale zeigt zum Licht
  const a0 = w / 2, a1 = w1 / 2;
  const pts: [number, number][] = [
    [x0 + nx * a0, y0 + ny * a0], [x1 + nx * a1, y1 + ny * a1],
    [x1 - nx * a1, y1 - ny * a1], [x0 - nx * a0, y0 - ny * a0],
  ];
  s.poly(pts, (x, y) => {
    // Position quer: Abstand zur Achse entlang der Normalen, normiert auf die Breite an der Stelle
    const px = x + 0.5 - x0, py = y + 0.5 - y0;
    const along = Math.min(1, Math.max(0, (px * dx + py * dy) / (len * len)));
    const half = a0 + (a1 - a0) * along;
    const across = (px * nx + py * ny) / Math.max(0.6, half);
    const t = across * Math.sign(lit || 1);
    return t > 0.34 ? ramp[2] : t > -0.5 ? ramp[1] : ramp[0];
  });
}

export function pedestal(s: Surface, ox: number, oy: number, kind: 'stump' | 'stone' | 'gold' | 'ice' | 'snow', ph: number, rx = 9): void {
  // oy = Bodenmitte (Fuss des Turms). Oberflaeche liegt 4 px darueber.
  const ty = oy - 4, ry = 3;
  const ramps: Record<string, Ramp> = { stump: RAMPS.wood, stone: RAMPS.stone, gold: RAMPS.gold, ice: RAMPS.ice, snow: RAMPS.snow };
  const r = ramps[kind];
  const side = kind === 'stump' ? RAMPS.darkWood : r;
  // Seitenwand
  s.ellipse(ox, oy, rx, ry, side[0]);
  s.rect(ox - rx, ty, rx * 2, oy - ty, side[1]);
  s.ellipse(ox, oy, rx, ry, side[0]);
  s.rect(ox - rx, ty, rx * 2, oy - ty, side[1]);
  s.rect(ox - rx, ty, 2, oy - ty, side[2]);
  s.rect(ox + rx - 2, ty, 2, oy - ty, side[0]);
  // untere Rundung
  s.ellipseFn(ox, oy, rx, ry, (x, y, nx, ny) => (ny > 0.25 ? side[0] : null));
  if (kind === 'stump') {
    for (let i = -rx + 3; i < rx - 2; i += 3) s.rect(ox + i, ty + 1, 1, oy - ty - 1, 'bark');
  }
  if (kind === 'stone') {
    s.rect(ox - rx, ty, rx * 2, 1, 'amber');
    s.rect(ox - rx, oy - 1, rx * 2, 1, 'rust');
    for (let i = -rx + 4; i < rx - 2; i += 5) s.rect(ox + i, ty + 2, 1, oy - ty - 3, 'slate');
  }
  if (kind === 'gold') {
    s.rect(ox - rx, ty, rx * 2, 1, 'yellow');
    s.rect(ox - rx, oy - 1, rx * 2, 1, 'rust');
    for (let i = -rx + 3; i < rx - 2; i += 4) s.px(ox + i, ty + 2, 'white');
  }
  if (kind === 'ice') {
    s.line(ox - rx + 3, ty + 1, ox - rx + 5, oy - 1, 'white');
    s.line(ox + 2, ty + 2, ox + 4, oy - 1, 'navy');
  }
  if (kind === 'snow') {
    s.rect(ox - rx, ty, rx * 2, 1, 'white');
    for (let i = -rx + 2; i < rx - 1; i += 4) s.rect(ox + i, ty + 1, 2, 1, 'white');
  }
  // Oberflaeche
  const top = kind === 'stump' ? RAMPS.wood : r;
  s.ellipseFn(ox, ty, rx, ry, (x, y, nx, ny) => {
    const l = -nx * 0.5 - ny * 0.6;
    return l > 0.35 ? top[2] : l > -0.45 ? top[1] : top[0];
  });
  if (kind === 'stump') {
    s.ring(ox, ty, rx * 0.6, ry * 0.55, 'bark');
    s.px(ox, ty, 'bark');
  }
  if (kind === 'stone' || kind === 'ice' || kind === 'snow') s.ring(ox, ty, rx - 1, ry - 0.6, kind === 'stone' ? 'amber' : kind === 'ice' ? 'white' : 'silver');
  if (kind === 'gold') {
    s.ring(ox, ty, rx - 1, ry - 0.6, 'yellow');
    // Runen, die reihum aufleuchten
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      s.px(ox + Math.cos(a) * (rx - 3), ty + Math.sin(a) * (ry - 1), i === ph % 4 ? 'white' : 'orange');
    }
  }
}

/** Funke/Stern: 1 px Kreuz oder Plus. */
export function spark(s: Surface, x: number, y: number, c: PalName, big = false): void {
  s.px(x, y, c);
  if (big) {
    s.px(x - 1, y, c); s.px(x + 1, y, c); s.px(x, y - 1, c); s.px(x, y + 1, c);
    s.px(x, y, 'white');
  }
}

/** Kleine Flamme (Hoehe h), flackert ueber `ph`. */
export function flame(s: Surface, x: number, y: number, h: number, ph: number, outer: PalName = 'orange', mid: PalName = 'amber', core: PalName = 'yellow'): void {
  const sway = [0, 1, 0, -1][ph & 3];
  for (let i = 0; i < h; i++) {
    const w = i < h * 0.35 ? 2 : i < h * 0.7 ? 1 : 0; // halbe Breite
    const cx = x + (i > h / 2 ? sway * (i / h) : 0);
    s.rect(cx - w, y - i, w * 2 + 1, 1, i < h * 0.3 ? core : i < h * 0.6 ? mid : outer);
  }
  s.px(x + sway, y - h, outer);
}

/** Schneeflocke 3x3 (Plus mit Ecken) bzw. 5x5. */
export function flake(s: Surface, x: number, y: number, c: PalName = 'white', big = false): void {
  s.px(x, y, c);
  s.px(x - 1, y, c); s.px(x + 1, y, c); s.px(x, y - 1, c); s.px(x, y + 1, c);
  if (big) {
    s.px(x - 2, y, c); s.px(x + 2, y, c); s.px(x, y - 2, c); s.px(x, y + 2, c);
    s.px(x - 1, y - 1, c); s.px(x + 1, y - 1, c); s.px(x - 1, y + 1, c); s.px(x + 1, y + 1, c);
  }
}

/** Kristall (Raute) aufrecht, Mitte (x, y), Halbhoehe h. */
export function crystal(s: Surface, x: number, y: number, h: number, ramp: Ramp = RAMPS.ice, hw = Math.max(1, Math.round(h / 2.2))): void {
  s.poly([[x, y - h], [x + hw + 0.5, y - h * 0.2], [x, y + h * 0.7], [x - hw - 0.5, y - h * 0.2]], (px, py) => (px < x - 0.3 ? ramp[2] : px > x + hw * 0.4 ? ramp[0] : ramp[1]));
  s.px(x - 1, y - h * 0.4, 'white');
}

/** Wolke (Breite w) mit eigenem Umriss, unten flach; `dark` = Gewitterwolke. (x, y) = Mitte der Unterkante. */
export function cloud(s: Surface, x: number, y: number, w: number, dark: boolean, ph = 0): void {
  const r: Ramp = dark ? ['night', 'dusk', 'slate'] : ['stone', 'silver', 'white'];
  const H = Math.round(w * 0.6) + 4;
  const t = new Surface(w + 8, H + 4);
  const base = H + 1;
  const n = Math.max(3, Math.round(w / 4.5));
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const bump = Math.sin(u * Math.PI);
    const rr = 2.4 + bump * (w / 5.5) + (i % 2 ? 0.4 : 0);
    const cx = 4 + 2 + u * (w - 4);
    t.ball(cx, base - rr - 0.5, rr + 0.6, rr, r);
  }
  t.rect(5, base - 2, w - 2, 3, r[1]);
  t.rect(5, base, w - 2, 1, r[0]);
  t.rect(5, base - 2, w - 2, 1, r[1]);
  if (dark && ph % 2 === 0) { t.px(5 + ((ph >> 1) ? w - 5 : 3), base - 3, 'yellow'); t.px(6 + ((ph >> 1) ? w - 8 : 6), base - 5, 'white'); }
  const o = outlineSurface(t, 'ink');
  s.blit(o, Math.round(x - (w + 8) / 2), Math.round(y - base));
}

/** Zackiger Blitz von (x0,y0) nach (x1,y1), deterministisch ueber `seed`. */
export function bolt(s: Surface, x0: number, y0: number, x1: number, y1: number, seed: number, core: PalName = 'white', glow: PalName | null = 'yellow'): void {
  const rnd = irnd(seed);
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3));
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const pts: [number, number][] = [[x0, y0]];
  for (let i = 1; i < n; i++) {
    const t = i / n, j = (rnd() - 0.5) * 4;
    pts.push([x0 + dx * t + nx * j, y0 + dy * t + ny * j]);
  }
  pts.push([x1, y1]);
  if (glow) for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    s.line(a[0] + 1, a[1], b[0] + 1, b[1], glow);
    s.line(a[0], a[1] + 1, b[0], b[1] + 1, glow);
  }
  for (let i = 0; i + 1 < pts.length; i++) s.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], core);
}

/** Pfeil (gerade, Winkel ueber Einheitsvektor): Schaft + Spitze + Federn. */
export function arrowAt(s: Surface, tx: number, ty: number, ux: number, uy: number, len: number, o: { tip?: PalName; shaft?: PalName; fletch?: PalName | null; head?: boolean; barbs?: boolean } = {}): void {
  const hx = tx + ux * len, hy = ty + uy * len;
  s.line(tx, ty, hx, hy, o.shaft ?? 'sand');
  if (o.head !== false) {
    s.px(hx, hy, o.tip ?? 'silver');
    s.px(hx - ux * 1, hy - uy * 1, o.tip ?? 'silver');
    if (o.barbs) { const nx = -uy, ny = ux; s.px(hx - ux * 1 + nx, hy - uy * 1 + ny, o.tip ?? 'silver'); s.px(hx - ux * 1 - nx, hy - uy * 1 - ny, o.tip ?? 'silver'); }
  }
  if (o.fletch) {
    const nx = -uy, ny = ux;
    s.px(tx + nx, ty + ny, o.fletch);
    s.px(tx - nx, ty - ny, o.fletch);
    s.px(tx + ux + nx, ty + uy + ny, o.fletch);
    s.px(tx + ux - nx, ty + uy - ny, o.fletch);
  }
}

/** Kurve von Wolken-/Sturm-Funken u. a.: n Partikel auf einem Kreis, die mit `ph` kreisen. */
export function orbit(cx: number, cy: number, rx: number, ry: number, n: number, ph: number, phases = 4): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + ph / phases) / n) * Math.PI * 2;
    out.push([Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), Math.sin(a)]);
  }
  return out;
}
