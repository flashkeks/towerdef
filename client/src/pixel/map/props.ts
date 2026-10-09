/**
 * Gemalte Dinge der Karte (Runde 11 / P3): Baeume, Buesche, Steine, Haeuser, Windmuehle ... als Index-Puffer mit Fusspunkt.
 * Licht von oben links, drei Toene je Flaeche, Umriss in der dunkelsten Farbe der Flaeche (nicht ink), Schatten separat.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import type { Prop, PropKind } from './layout';

export interface PropArt {
  buf: Buf;
  /** Fusspunkt im Puffer */
  ax: number;
  ay: number;
  /** Schlagschatten (Ellipse relativ zum Fusspunkt) */
  shadow: { ox: number; oy: number; rx: number; ry: number };
  /** Aufhaenger fuer bewegte Teile (relativ zum Fusspunkt) */
  hook?: { x: number; y: number };
}

export type Tones = { dark: number; mid: number; light: number; hi?: number };

/** Scheibe mit Licht von oben links: drei Toene, am Uebergang gedithert. */
export function shadedDisc(b: Buf, cx: number, cy: number, rx: number, ry: number, t: Tones, seed = 1, rough = 0.18): void {
  b.each(cx, cy, rx, ry, (x, y) => {
    const nx = (x - cx) / rx, ny = (y - cy) / ry;
    const lit = -(nx * 0.5 + ny * 0.85) + (hash2(x, y, seed) - 0.5) * rough + (bayer(x, y) - 0.5) * 0.3;
    b.set(x, y, t.hi && lit > 0.86 ? t.hi : lit > 0.42 ? t.light : lit > -0.18 ? t.mid : t.dark);
  });
}

/** Dunkle Unterkante (Selbstschatten) an allen Pixeln, unter denen nichts liegt. */
export function rimBottom(b: Buf, col: number, depth = 1): void {
  const hits: [number, number][] = [];
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!b.get(x, y)) continue;
    let open = true;
    for (let k = 1; k <= depth; k++) if (b.get(x, y + k)) open = false;
    if (open) hits.push([x, y]);
  }
  for (const [x, y] of hits) b.set(x, y, col);
}

export function sparkle(b: Buf, n: number, from: number[], to: number, seed: number, area?: (x: number, y: number) => boolean): void {
  const r = rng(seed);
  let tries = 0;
  while (n > 0 && tries++ < 400) {
    const x = Math.floor(r() * b.w), y = Math.floor(r() * b.h);
    if (from.includes(b.get(x, y)) && (!area || area(x, y))) { b.set(x, y, to); n--; }
  }
}

export const mk = (w: number, h: number): Buf => new Buf(w, h);

// ------------------------------------------------------------------ Baeume
function oak(v: number): PropArt {
  const b = mk(40, 44);
  const cx = 20;
  // Stamm und Wurzeln
  b.rect(cx - 2, 28, 5, 14, C.bark);
  b.rect(cx - 2, 28, 2, 14, C.wood);
  b.rect(cx + 2, 28, 1, 14, C.plum);
  b.set(cx - 3, 41, C.bark); b.set(cx + 3, 41, C.bark); b.set(cx - 4, 42, C.bark); b.set(cx + 4, 42, C.bark);
  const t: Tones = v === 2 ? { dark: C.grass, mid: C.leaf, light: C.yellow } : { dark: C.pine, mid: C.grass, light: C.leaf, hi: v === 1 ? C.yellow : undefined };
  const blobs = v === 1
    ? [[cx - 9, 24, 8], [cx + 9, 24, 8], [cx, 27, 8], [cx - 10, 15, 8], [cx + 10, 15, 8], [cx, 15, 11], [cx - 5, 8, 7], [cx + 5, 9, 7]]
    : [[cx - 10, 22, 8], [cx + 10, 23, 8], [cx, 26, 9], [cx - 8, 13, 9], [cx + 9, 14, 9], [cx, 8, 10], [cx, 18, 10]];
  blobs.forEach(([x, y, r], i) => shadedDisc(b, x, y, r, r - 1, t, 11 + i + v * 3));
  rimBottom(b, t.dark);
  sparkle(b, 26, [t.mid], t.light, 5 + v, (x, y) => x < cx + 4 && y < 24);
  sparkle(b, 18, [t.mid, t.light], t.dark, 9 + v, (x, y) => y > 12);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 42, shadow: { ox: 5, oy: -1, rx: 15, ry: 5 } };
}

function pine(v: number): PropArt {
  const b = mk(30, 50);
  const cx = 15;
  b.rect(cx - 1, 40, 3, 8, C.bark);
  b.rect(cx - 1, 40, 1, 8, C.wood);
  const tiers = [[34, 46, 12], [23, 37, 10], [12, 27, 8], [3, 18, 6]]; // [apexY..]: baseY, halfwidth
  const tones: Tones = v === 2 ? { dark: C.deep, mid: C.pine, light: C.grass } : { dark: C.deep, mid: C.pine, light: C.grass, hi: C.leaf };
  // von unten nach oben, obere Stufen ueberdecken die unteren
  for (const [top, bot, hw] of [[30, 42, 13], [21, 34, 11], [12, 26, 9], [3, 17, 7]]) {
    for (let y = top; y <= bot; y++) {
      const f = (y - top) / (bot - top);
      const half = Math.round(1 + f * hw * 1.0);
      for (let x = -half; x <= half; x++) {
        const nx = x / (half + 0.5);
        const lit = -nx * 0.8 - (f - 0.4) * 0.7 + (bayer(cx + x, y) - 0.5) * 0.35 + (hash2(x, y, 4) - 0.5) * 0.2;
        const edge = Math.abs(x) >= half - 0 && f > 0.15 && ((y + x) & 1) === 0;
        b.set(cx + x, y, edge ? tones.dark : lit > 0.62 && tones.hi ? tones.hi : lit > 0.3 ? tones.light : lit > -0.3 ? tones.mid : tones.dark);
      }
    }
    // gezackter Rand unten
    for (let x = -hw - 1; x <= hw + 1; x += 3) b.set(cx + x, bot + 1, tones.dark);
  }
  void tiers;
  rimBottom(b, tones.dark);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 48, shadow: { ox: 5, oy: -1, rx: 11, ry: 4 } };
}

function birch(v: number): PropArt {
  const b = mk(30, 44);
  const cx = 15;
  b.rect(cx - 1, 20, 3, 22, C.white);
  b.rect(cx + 1, 20, 1, 22, C.silver);
  for (const y of [24, 28, 32, 36]) { b.set(cx - 1, y, C.slate); b.set(cx, y + 1, C.slate); }
  b.set(cx - 2, 41, C.silver); b.set(cx + 2, 41, C.silver);
  const t: Tones = v === 1 ? { dark: C.grass, mid: C.leaf, light: C.yellow } : { dark: C.grass, mid: C.leaf, light: C.yellow, hi: C.white };
  for (const [x, y, rx, ry] of [[cx - 6, 20, 6, 6], [cx + 6, 20, 6, 6], [cx, 22, 7, 6], [cx - 5, 12, 7, 8], [cx + 6, 13, 6, 8], [cx, 7, 7, 7]])
    shadedDisc(b, x, y, rx, ry, t, 30 + x + v);
  rimBottom(b, t.dark);
  sparkle(b, 20, [t.mid], t.light, 41 + v, (x, y) => x < cx + 3 && y < 20);
  b.outline(C.pine);
  return { buf: b, ax: cx, ay: 42, shadow: { ox: 4, oy: -1, rx: 11, ry: 4 } };
}

function vtree(v: number): PropArt {
  const b = mk(44, 52);
  const cx = 22;
  const dark = C.plum, mid = C.violet, light = C.orchid;
  // gedrehter Stamm
  const bend = v === 1 ? 2 : v === 2 ? -2 : 0;
  for (let y = 26; y < 50; y++) {
    const off = Math.round(Math.sin((y - 26) / 5) * 1.5 + bend * (50 - y) / 24);
    b.rect(cx - 2 + off, y, 5, 1, C.night);
    b.set(cx - 2 + off, y, C.dusk);
    b.set(cx - 1 + off, y, C.dusk);
  }
  b.set(cx - 4, 49, C.night); b.set(cx + 4, 49, C.night); b.set(cx - 5, 50, C.night); b.set(cx + 5, 50, C.night);
  const blobs = v === 1
    ? [[cx - 12, 20, 9], [cx + 12, 22, 8], [cx, 24, 10], [cx - 8, 10, 9], [cx + 9, 11, 9], [cx, 6, 8]]
    : v === 2
      ? [[cx - 11, 26, 8], [cx + 11, 27, 8], [cx - 6, 16, 10], [cx + 7, 17, 10], [cx, 8, 9], [cx, 22, 9]]
      : [[cx - 11, 22, 9], [cx + 11, 24, 8], [cx, 26, 9], [cx - 8, 13, 10], [cx + 8, 14, 10], [cx, 7, 9]];
  blobs.forEach(([x, y, r], i) => shadedDisc(b, x, y, r, r - 1, { dark, mid, light, hi: C.coral }, 60 + i + v * 5, 0.25));
  // haengende Zipfel
  const r = rng(77 + v);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(r() * 30) + cx - 15, y0 = 22 + Math.floor(r() * 8);
    for (let k = 0; k < 3 + (i % 3); k++) if (b.get(x, y0) ) b.under(x, y0 + 4 + k, k % 2 ? dark : mid);
  }
  rimBottom(b, dark);
  // leuchtende Pilz-/Glimmpunkte: ice und coral
  sparkle(b, 6 + v * 2, [mid, light], v === 2 ? C.ice : C.coral, 91 + v, (x, y) => y > 8 && y < 30);
  b.outline(C.ink);
  return { buf: b, ax: cx, ay: 50, shadow: { ox: 5, oy: -1, rx: 16, ry: 5 } };
}

// ------------------------------------------------------------------ Kleines
function bush(berry: boolean, v: number): PropArt {
  const b = mk(22, 18);
  const t: Tones = { dark: C.pine, mid: C.grass, light: C.leaf };
  shadedDisc(b, 6, 10, 5, 5, t, 3 + v);
  shadedDisc(b, 15, 10, 5, 5, t, 4 + v);
  shadedDisc(b, 11, 8, 7, 6, t, 5 + v);
  rimBottom(b, t.dark);
  const r = rng(120 + v);
  for (let i = 0; i < (berry ? 7 : 4); i++) {
    const x = 5 + Math.floor(r() * 12), y = 4 + Math.floor(r() * 8);
    if (b.get(x, y)) b.set(x, y, berry ? (i % 3 ? C.red : C.coral) : (i % 2 ? C.white : C.yellow));
  }
  b.outline(C.deep);
  return { buf: b, ax: 11, ay: 15, shadow: { ox: 3, oy: 0, rx: 9, ry: 3 } };
}

function rock(v: number, big: boolean): PropArt {
  const s = big ? 1 : 0;
  const b = mk(big ? 30 : 18, big ? 24 : 14);
  const t: Tones = { dark: C.slate, mid: C.stone, light: C.silver, hi: C.white };
  if (big) {
    shadedDisc(b, 15, 13, 11, 8, t, 22);
    shadedDisc(b, 9, 14, 6, 5, t, 23);
    shadedDisc(b, 22, 15, 6, 5, t, 24);
  } else {
    shadedDisc(b, 8, 8, 6, 4, t, 25 + v);
    shadedDisc(b, 12, 9, 4, 3, t, 26 + v);
  }
  rimBottom(b, t.dark);
  if (v === 1 || big) { // Moos oben links
    const moss = [C.grass, C.leaf];
    b.each(big ? 11 : 6, big ? 8 : 5, big ? 5 : 3, big ? 2 : 1.3, (x, y) => { if (b.get(x, y) && bayer(x, y) < 0.7) b.set(x, y, moss[(x + y) & 1]); });
  }
  b.outline(C.night);
  void s;
  return { buf: b, ax: big ? 15 : 9, ay: big ? 20 : 11, shadow: { ox: 3, oy: 0, rx: big ? 13 : 8, ry: big ? 4 : 3 } };
}

function hay(v: number): PropArt {
  // Strohballen: Quader mit Seil, Oberseite hell
  const b = mk(20, 16);
  b.rect(2, 5, 14, 8, C.yellow);
  b.rect(2, 3, 14, 3, C.sand);
  b.rect(2, 3, 14, 1, C.white);
  b.rect(14, 5, 2, 8, C.amber);
  b.rect(2, 12, 14, 1, C.amber);
  b.rect(6, 3, 1, 10, C.bark);
  b.rect(11, 3, 1, 10, C.bark);
  for (const [x, y] of [[3, 7], [8, 9], [4, 10], [9, 6], [13, 8]]) b.set(x, y, v ? C.sand : C.amber);
  b.outline(C.orange);
  return { buf: b, ax: 9, ay: 14, shadow: { ox: 3, oy: 0, rx: 9, ry: 3 } };
}
function barrel(): PropArt {
  const b = mk(12, 14);
  b.rect(2, 2, 7, 9, C.wood);
  b.rect(2, 2, 2, 9, C.tan);
  b.rect(7, 2, 2, 9, C.bark);
  b.rect(2, 4, 7, 1, C.slate);
  b.rect(2, 8, 7, 1, C.slate);
  b.rect(3, 1, 5, 1, C.tan);
  b.outline(C.plum);
  return { buf: b, ax: 5, ay: 11, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}
function crate(): PropArt {
  const b = mk(14, 14);
  b.rect(2, 3, 9, 8, C.wood);
  b.rect(2, 3, 9, 1, C.tan);
  b.rect(2, 3, 1, 8, C.tan);
  b.line(3, 4, 9, 10, C.bark);
  b.line(9, 4, 3, 10, C.bark);
  b.rect(10, 4, 1, 7, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 6, ay: 12, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}

// ------------------------------------------------------------------ Gebaeude
interface Roof { light: number; mid: number; dark: number }
const ROOFS: Roof[] = [
  { light: C.clay, mid: C.rust, dark: C.crimson },
  { light: C.sky, mid: C.navy, dark: C.night },
  { light: C.yellow, mid: C.amber, dark: C.orange },
];

function shingles(b: Buf, x0: number, y0: number, x1: number, y1: number, roof: Roof, slant: (y: number) => [number, number]): void {
  for (let y = y0; y <= y1; y++) {
    const [l, r] = slant(y);
    for (let x = l; x <= r; x++) {
      const fx = (x - l) / Math.max(1, r - l);
      const row = (y - y0) % 4;
      const lit = (1 - fx) * 0.9 - (y - y0) / Math.max(1, y1 - y0) * 0.4 + (bayer(x, y) - 0.5) * 0.25;
      let c = lit > 0.45 ? roof.light : lit > 0.0 ? roof.mid : roof.dark;
      if (row === 3) c = roof.dark; // Schindelreihe
      else if (row === 0 && (x + (Math.floor((y - y0) / 4) % 2) * 3) % 6 === 0) c = roof.dark;
      b.set(x, y, c);
    }
  }
  void x0;
}

function house(v: number, cottage = false): PropArt {
  const W = cottage ? 34 : 42, H = cottage ? 32 : 40;
  const b = mk(W, H);
  const roof = ROOFS[v % ROOFS.length];
  const cx = Math.floor(W / 2);
  const wl = 4, wr = W - 5; // Wand links/rechts
  const roofB = cottage ? 17 : 21, roofT = 5;
  const wallTop = roofB, wallBot = H - 3;
  // Wand (Putz), rechts Schatten, Fachwerk
  b.rect(wl, wallTop, wr - wl + 1, wallBot - wallTop + 1, C.sand);
  b.rect(wr - 3, wallTop, 4, wallBot - wallTop + 1, C.tan);
  b.rect(wl, wallBot - 2, wr - wl + 1, 3, C.stone); // Sockel
  b.rect(wl, wallBot, wr - wl + 1, 1, C.slate);
  for (let y = wallTop; y < wallBot - 2; y++) { b.set(wl, y, C.peach); b.set(wr, y, C.tan); }
  b.rect(wl, wallTop, wr - wl + 1, 1, C.bark); // Balken unter dem Dach
  b.rect(wl + 5, wallTop, 1, wallBot - wallTop - 2, C.bark);
  b.rect(wr - 6, wallTop, 1, wallBot - wallTop - 2, C.bark);
  // Tuer
  const dx = cx - 2 - (cottage ? 3 : 4);
  b.rect(dx, wallBot - 9, 6, 8, C.bark);
  b.rect(dx + 1, wallBot - 10, 4, 1, C.bark);
  b.rect(dx + 1, wallBot - 9, 2, 7, C.wood);
  b.set(dx + 4, wallBot - 5, C.yellow);
  // Fenster (warm erleuchtet) mit Laden
  const fx = cx + (cottage ? 3 : 4);
  b.rect(fx, wallBot - 11, 6, 6, C.bark);
  b.rect(fx + 1, wallBot - 10, 4, 4, C.yellow);
  b.rect(fx + 1, wallBot - 10, 2, 2, C.white);
  b.rect(fx + 3, wallBot - 8, 2, 2, C.amber);
  b.rect(fx + 2, wallBot - 10, 1, 4, C.bark);
  b.rect(fx - 1, wallBot - 5, 8, 1, C.wood);
  // Blumenkasten
  b.set(fx, wallBot - 6, C.red); b.set(fx + 2, wallBot - 6, C.yellow); b.set(fx + 4, wallBot - 6, C.coral);
  // Dach: Walmdach-Trapez
  const inset = (y: number): [number, number] => {
    const f = (y - roofT) / (roofB - roofT);
    const l = Math.round(wl + 8 - f * 10), r = Math.round(wr - 8 + f * 10);
    return [l, r];
  };
  shingles(b, 0, roofT, W - 1, roofB, roof, inset);
  // First und Traufe
  const [fl, fr] = inset(roofT);
  b.rect(fl, roofT, fr - fl + 1, 1, roof.light);
  const [bl, br] = inset(roofB);
  b.rect(bl, roofB, br - bl + 1, 1, roof.dark);
  // Schornstein
  b.rect(cx + 6, 1, 4, 8, C.stone);
  b.rect(cx + 6, 1, 1, 8, C.silver);
  b.rect(cx + 9, 1, 1, 8, C.slate);
  b.rect(cx + 5, 0, 6, 1, C.slate);
  b.outline(roof.dark === C.night ? C.ink : C.plum);
  return { buf: b, ax: cx, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: Math.floor(W / 2) + 2, ry: 5 }, hook: { x: cx + 8 - cx, y: 0 - (wallBot + 1) } };
}

function barn(): PropArt {
  const W = 60, H = 46;
  const b = mk(W, H);
  const wl = 4, wr = W - 5, roofT = 4, roofB = 22, wallBot = H - 3;
  b.rect(wl, roofB, wr - wl + 1, wallBot - roofB + 1, C.rust);
  for (let x = wl; x <= wr; x += 3) b.rect(x, roofB, 1, wallBot - roofB + 1, C.crimson);
  b.rect(wr - 4, roofB, 5, wallBot - roofB + 1, C.crimson);
  b.rect(wl, wallBot - 2, wr - wl + 1, 3, C.stone);
  // grosses Tor mit weissem X
  const gx = 22, gw = 18, gt = roofB + 5;
  b.rect(gx, gt, gw, wallBot - gt - 1, C.wood);
  b.rect(gx, gt, gw, 1, C.sand);
  b.rect(gx, wallBot - 2, gw, 1, C.sand);
  b.rect(gx, gt, 1, wallBot - gt - 1, C.sand);
  b.rect(gx + gw - 1, gt, 1, wallBot - gt - 1, C.sand);
  b.rect(gx + gw / 2, gt, 1, wallBot - gt - 1, C.bark);
  b.line(gx + 1, gt + 1, gx + gw / 2 - 1, wallBot - 3, C.sand);
  b.line(gx + gw / 2 - 1, gt + 1, gx + 1, wallBot - 3, C.sand);
  b.line(gx + gw / 2 + 1, gt + 1, gx + gw - 2, wallBot - 3, C.sand);
  b.line(gx + gw - 2, gt + 1, gx + gw / 2 + 1, wallBot - 3, C.sand);
  // Heuboden-Fenster
  b.rect(27, roofB + 1, 8, 4, C.bark);
  b.rect(28, roofB + 2, 6, 2, C.amber);
  // Dach (grau-blau) breit
  const roof: Roof = { light: C.stone, mid: C.slate, dark: C.dusk };
  shingles(b, 0, roofT, W - 1, roofB, roof, (y) => {
    const f = (y - roofT) / (roofB - roofT);
    return [Math.round(14 - f * 14 + 0), Math.round(W - 15 + f * 14)];
  });
  b.rect(14, roofT, W - 28, 1, C.silver);
  b.outline(C.night);
  return { buf: b, ax: W / 2, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: 32, ry: 6 } };
}

function windmill(): PropArt {
  const W = 32, H = 58;
  const b = mk(W, H);
  const cx = 16;
  // Turmkoerper (Trapez) mit Steinreihen
  for (let y = 22; y <= 54; y++) {
    const f = (y - 22) / 32;
    const half = Math.round(6 + f * 7);
    for (let x = -half; x <= half; x++) {
      const nx = x / half;
      const lit = -nx * 0.7 + (bayer(cx + x, y) - 0.5) * 0.2;
      let c = lit > 0.35 ? C.sand : lit > -0.35 ? C.peach : C.tan;
      if ((y % 5) === 0) c = C.tan;
      b.set(cx + x, y, c);
    }
  }
  b.rect(cx - 13, 52, 27, 3, C.stone); // Sockel
  b.rect(cx - 13, 54, 27, 1, C.slate);
  // Tuer und Fenster
  b.rect(cx - 3, 44, 6, 10, C.bark);
  b.rect(cx - 2, 43, 4, 1, C.bark);
  b.rect(cx - 2, 44, 2, 9, C.wood);
  b.rect(cx - 2, 32, 5, 5, C.bark);
  b.rect(cx - 1, 33, 3, 3, C.yellow);
  // Kappe: Kegeldach
  for (let y = 8; y <= 23; y++) {
    const f = (y - 8) / 15;
    const half = Math.round(1 + f * 9);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      const lit = -nx * 0.8 + (bayer(cx + x, y) - 0.5) * 0.25;
      b.set(cx + x, y, lit > 0.3 ? C.clay : lit > -0.3 ? C.rust : C.crimson);
    }
  }
  b.rect(cx - 11, 23, 23, 1, C.crimson);
  b.set(cx, 7, C.yellow);
  b.outline(C.plum);
  // Nabe markieren (Fluegel kommen als bewegte Ebene), Mittelpunkt
  return { buf: b, ax: cx, ay: 55, shadow: { ox: 9, oy: -1, rx: 18, ry: 5 }, hook: { x: 0, y: 18 - 55 } };
}

/** Windmuehlen-Fluegel: 8 Winkelstufen einer Vierteldrehung, 56 x 56, Nabe in der Mitte. */
export function windmillBlades(step: number): Buf {
  const b = mk(60, 60);
  const cx = 30, cy = 30;
  const ang = (step / 8) * (Math.PI / 2);
  for (let k = 0; k < 4; k++) {
    const a = ang + (k * Math.PI) / 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    // Rahmenholm
    for (let s = 3; s <= 26; s++) b.set(cx + dx * s, cy + dy * s, C.bark);
    // Segeltuch: Streifen neben dem Holm (links der Fahrtrichtung)
    const px = -dy, py = dx;
    for (let s = 8; s <= 26; s++)
      for (let w = 1; w <= 5; w++) {
        const x = cx + dx * s + px * w, y = cy + dy * s + py * w;
        b.set(x, y, (s + w) % 4 === 0 ? C.tan : w === 5 ? C.peach : C.sand);
      }
    // Querstreben
    for (const s of [10, 16, 22]) for (let w = -1; w <= 5; w++) b.set(cx + dx * s + px * w, cy + dy * s + py * w, C.wood);
  }
  b.disc(cx, cy, 2.2, C.wood);
  b.set(cx, cy, C.yellow);
  b.outline(C.plum);
  return b;
}

function well(): PropArt {
  const b = mk(22, 26);
  b.rect(4, 1, 14, 2, C.rust);
  b.rect(3, 3, 16, 2, C.clay);
  b.rect(5, 5, 1, 9, C.bark);
  b.rect(16, 5, 1, 9, C.bark);
  b.ellipse(11, 17, 8, 5, C.slate);
  b.ellipse(11, 16, 7, 4, C.stone);
  b.ellipse(11, 15, 5, 2.4, C.navy);
  b.rect(5, 17, 12, 4, C.stone);
  b.rect(5, 17, 4, 4, C.silver);
  b.rect(14, 17, 3, 4, C.slate);
  for (const y of [18, 20]) for (let x = 5; x < 17; x += 4) b.set(x + (y % 4 ? 1 : 3), y, C.slate);
  b.line(11, 5, 11, 12, C.tan);
  b.outline(C.night);
  return { buf: b, ax: 11, ay: 22, shadow: { ox: 4, oy: 0, rx: 10, ry: 4 } };
}

function lamp(): PropArt {
  const b = mk(12, 26);
  b.rect(5, 8, 2, 16, C.night);
  b.rect(5, 8, 1, 16, C.dusk);
  b.rect(3, 22, 6, 2, C.slate);
  b.rect(3, 22, 6, 1, C.stone);
  b.rect(3, 2, 6, 7, C.night);
  b.rect(4, 3, 4, 5, C.amber);
  b.rect(4, 3, 2, 3, C.yellow);
  b.set(5, 4, C.white);
  b.rect(2, 1, 8, 1, C.slate);
  b.rect(4, 0, 4, 1, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 6, ay: 24, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 0, y: -19 } };
}

function sign(): PropArt {
  const b = mk(22, 22);
  b.rect(10, 8, 2, 12, C.bark);
  b.rect(10, 8, 1, 12, C.wood);
  b.rect(2, 3, 16, 7, C.wood);
  b.rect(2, 3, 16, 1, C.tan);
  b.rect(2, 9, 16, 1, C.bark);
  b.rect(18, 5, 2, 3, C.wood);
  b.rect(19, 4, 1, 5, C.wood);
  b.line(5, 6, 14, 6, C.sand);
  b.set(13, 5, C.sand); b.set(13, 7, C.sand);
  b.outline(C.plum);
  return { buf: b, ax: 11, ay: 20, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}

function gatetower(v: number): PropArt {
  const W = 34, H = 52;
  const b = mk(W, H);
  const cx = 17;
  // Turmkoerper
  for (let y = 14; y <= 46; y++) {
    for (let x = -11; x <= 11; x++) {
      const nx = x / 11;
      const lit = -nx * 0.7 + (bayer(cx + x, y) - 0.5) * 0.2;
      let c = lit > 0.3 ? C.silver : lit > -0.3 ? C.stone : C.slate;
      if ((y - 14) % 6 === 5 || ((x + 11 + (Math.floor((y - 14) / 6) % 2) * 4) % 8 === 0)) c = lit > 0 ? C.stone : C.slate;
      b.set(cx + x, y, c);
    }
  }
  // Zinnen
  for (let x = -11; x <= 11; x++) {
    if (((x + 11) % 6) < 4) for (let y = 8; y < 14; y++) b.set(cx + x, y, x < -2 ? C.silver : x < 6 ? C.stone : C.slate);
  }
  b.rect(cx - 12, 14, 25, 2, C.slate);
  // Bogenfenster mit Licht und Tor
  b.rect(cx - 2, 22, 5, 7, C.night);
  b.rect(cx - 1, 23, 3, 5, C.amber);
  b.set(cx, 24, C.yellow);
  b.rect(cx - 12, 44, 25, 3, C.slate);
  b.rect(cx - 12, 44, 25, 1, C.stone);
  // Stange fuer die Fahne
  b.rect(cx, 0, 1, 9, C.bark);
  b.set(cx, 0, C.yellow);
  b.outline(C.night);
  void v;
  return { buf: b, ax: cx, ay: 47, shadow: { ox: 7, oy: -1, rx: 17, ry: 5 }, hook: { x: 1, y: 2 - 47 } };
}

function shrine(): PropArt {
  const b = mk(18, 24);
  b.rect(4, 17, 10, 4, C.stone);
  b.rect(4, 17, 10, 1, C.silver);
  b.rect(6, 7, 6, 10, C.stone);
  b.rect(6, 7, 2, 10, C.silver);
  b.rect(10, 7, 2, 10, C.slate);
  b.rect(7, 9, 4, 5, C.night);
  b.rect(8, 10, 2, 3, C.ice);
  b.set(8, 10, C.white);
  b.rect(3, 4, 12, 3, C.slate);
  b.rect(3, 4, 12, 1, C.stone);
  b.rect(6, 1, 6, 3, C.dusk);
  b.rect(6, 1, 6, 1, C.slate);
  b.set(9, 0, C.ice);
  b.outline(C.night);
  return { buf: b, ax: 9, ay: 21, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 }, hook: { x: 0, y: -11 } };
}

function cart(): PropArt {
  const b = mk(34, 24);
  b.rect(4, 8, 24, 8, C.wood);
  b.rect(4, 8, 24, 1, C.tan);
  b.rect(4, 15, 24, 1, C.bark);
  for (let x = 6; x < 28; x += 4) b.rect(x, 9, 1, 6, C.bark);
  b.ellipse(16, 7, 11, 4, C.yellow);
  b.ellipse(14, 6, 7, 2, C.sand);
  for (const [x, y] of [[8, 7], [20, 6], [24, 8], [12, 8]]) b.set(x, y, C.amber);
  b.line(27, 12, 33, 9, C.bark); // Deichsel
  b.disc(9, 17, 4, C.bark); b.disc(9, 17, 3, C.wood); b.disc(9, 17, 1, C.bark);
  b.disc(22, 17, 4, C.bark); b.disc(22, 17, 3, C.wood); b.disc(22, 17, 1, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 16, ay: 20, shadow: { ox: 4, oy: 0, rx: 14, ry: 3 } };
}

function cattail(v: number): PropArt {
  const b = mk(14, 22);
  const r = rng(200 + v);
  for (let i = 0; i < 5; i++) {
    const x = 2 + i * 2 + Math.floor(r() * 2), h = 10 + Math.floor(r() * 9);
    for (let y = 0; y < h; y++) b.set(x + Math.round(Math.sin(y / 3 + i) * 0.8), 20 - y, i % 2 ? C.grass : C.leaf);
    if (i % 2 === 0) { b.rect(x, 20 - h - 1, 2, 4, C.bark); b.set(x, 20 - h - 2, C.wood); }
  }
  return { buf: b, ax: 7, ay: 20, shadow: { ox: 2, oy: 0, rx: 5, ry: 1 } };
}

function stump(): PropArt {
  const b = mk(14, 12);
  b.ellipse(7, 6, 5, 3, C.wood);
  b.ellipse(7, 5, 4, 2, C.tan);
  b.rect(3, 6, 9, 3, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 7, ay: 9, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

const cache = new Map<string, PropArt>();
export function propArt(p: Pick<Prop, 'kind' | 'v'>): PropArt {
  const key = `${p.kind}:${p.v}`;
  let a = cache.get(key);
  if (!a) {
    a = build(p.kind, p.v);
    cache.set(key, a);
  }
  return a;
}

function build(kind: PropKind, v: number): PropArt {
  switch (kind) {
    case 'oak': return oak(v);
    case 'pine': return pine(v);
    case 'birch': return birch(v);
    case 'vtree': return vtree(v);
    case 'bush': return bush(false, v);
    case 'berry': return bush(true, v);
    case 'rock': return rock(v, false);
    case 'boulder': return rock(1, true);
    case 'stump': return stump();
    case 'hay': return hay(v);
    case 'barrel': return barrel();
    case 'crate': return crate();
    case 'house': return house(v);
    case 'cottage': return house(v, true);
    case 'barn': return barn();
    case 'windmill': return windmill();
    case 'well': return well();
    case 'lamp': return lamp();
    case 'sign': return sign();
    case 'gatetower': return gatetower(v);
    case 'shrine': return shrine();
    case 'cart': return cart();
    case 'cattail': return cattail(v);
  }
}
