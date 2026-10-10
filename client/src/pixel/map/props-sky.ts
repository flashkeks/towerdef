/**
 * Gemalte Dinge von Skyreach Cliffs (Runde 16 / K1): Bergkiefern (mit Schnee), Felsbrocken und Felsnadeln, Steinmaenner,
 * Berghuette, Wachturm, Leuchtfeuer, Bergziege, Zelt, Fahnenmast, Lagerfeuer, Torpfosten. Gleiche Regeln wie `props.ts`:
 * Licht oben links, drei Toene je Flaeche, Umriss in der dunkelsten Flaechenfarbe, Schatten separat.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, type PropArt, type Tones } from './props';
import { snowTop } from './props-frost';

export type SkyKind =
  | 'pine' | 'larch' | 'boulder' | 'spire' | 'cairn' | 'hut' | 'watchtower' | 'beacon' | 'goat' | 'tent' | 'banner' | 'campfire'
  | 'gatepost' | 'sign' | 'shrub' | 'snowrock' | 'plank' | 'flagpole';

const ROCK: Tones = { dark: C.dusk, mid: C.slate, light: C.stone, hi: C.silver };
const SNOWROCK: Tones = { dark: C.slate, mid: C.stone, light: C.silver, hi: C.white };

function pine(v: number): PropArt {
  const b = mk(30, 52);
  const cx = 15;
  b.rect(cx - 1, 42, 3, 8, C.bark); b.rect(cx - 1, 42, 1, 8, C.wood);
  const tiers: [number, number, number][] = [[33, 45, 11], [24, 36, 9], [14, 28, 8], [4, 19, 6]];
  tiers.forEach(([top, bot, hw]) => {
    for (let y = top; y <= bot; y++) {
      const f = (y - top) / (bot - top), half = Math.round(1 + f * hw);
      for (let x = -half; x <= half; x++) {
        const nx = x / (half + 0.5), lit = -nx * 0.8 - (f - 0.4) * 0.7 + (bayer(cx + x, y) - 0.5) * 0.35 + (hash2(x, y, 4 + v) - 0.5) * 0.2;
        b.set(cx + x, y, Math.abs(x) >= half && f > 0.15 && ((y + x) & 1) === 0 ? C.deep : lit > 0.3 ? C.grass : lit > -0.3 ? C.pine : C.deep);
      }
    }
    for (let x = -hw - 1; x <= hw + 1; x += 3) b.set(cx + x, bot + 1, C.deep);
  });
  rimBottom(b, C.deep);
  if (v === 1) snowTop(b, 3, 17);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 50, shadow: { ox: 5, oy: -1, rx: 10, ry: 4 } };
}

/** Lerche: lichter, goldgruen, im Herbstlicht. */
function larch(): PropArt {
  const b = mk(24, 46);
  const cx = 12;
  b.rect(cx - 1, 34, 3, 10, C.bark); b.rect(cx - 1, 34, 1, 10, C.wood);
  for (let y = 4; y <= 36; y++) {
    const f = (y - 4) / 32, half = Math.round(1 + Math.sin(f * Math.PI * 0.62) * 8);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5), lit = -nx * 0.8 - (f - 0.4) * 0.5 + (bayer(cx + x, y) - 0.5) * 0.4;
      if (hash2(x, y, 6) > 0.8) continue;
      b.set(cx + x, y, lit > 0.3 ? C.yellow : lit > -0.2 ? C.leaf : C.grass);
    }
  }
  b.outline(C.pine);
  return { buf: b, ax: cx, ay: 44, shadow: { ox: 4, oy: -1, rx: 8, ry: 3 } };
}

function shrub(v: number): PropArt {
  const b = mk(20, 14);
  const t: Tones = v ? { dark: C.pine, mid: C.grass, light: C.leaf } : { dark: C.deep, mid: C.pine, light: C.grass };
  shadedDisc(b, 6, 8, 5, 4, t, 201 + v); shadedDisc(b, 13, 8, 5, 4, t, 202 + v); shadedDisc(b, 10, 6, 6, 4, t, 203 + v);
  rimBottom(b, t.dark);
  if (v) for (const [x, y] of [[5, 6], [12, 4], [9, 7]]) b.set(x, y, C.orchid);
  b.outline(C.deep);
  return { buf: b, ax: 10, ay: 12, shadow: { ox: 2, oy: 0, rx: 8, ry: 2 } };
}

function boulder(v: number, big: boolean): PropArt {
  const b = mk(big ? 34 : 22, big ? 26 : 16);
  if (big) { shadedDisc(b, 17, 15, 13, 9, ROCK, 211 + v); shadedDisc(b, 9, 17, 7, 6, ROCK, 212 + v); shadedDisc(b, 26, 18, 7, 6, ROCK, 213 + v); }
  else { shadedDisc(b, 9, 9, 7, 5, ROCK, 214 + v); shadedDisc(b, 15, 10, 5, 4, ROCK, 215 + v); }
  rimBottom(b, C.dusk);
  // Schichtlinien
  for (let y = 4; y < b.h; y += 4) for (let x = 0; x < b.w; x++) if (b.get(x, y) === C.slate && hash2(x, y, 7) > 0.4) b.set(x, y, C.dusk);
  if (v === 1) snowTop(b, big ? 4 : 3, 33);
  b.outline(C.night);
  return { buf: b, ax: big ? 17 : 11, ay: big ? 22 : 13, shadow: { ox: 3, oy: 0, rx: big ? 15 : 9, ry: big ? 4 : 3 } };
}

function snowrock(): PropArt {
  const b = mk(26, 18);
  shadedDisc(b, 9, 11, 7, 5, SNOWROCK, 221); shadedDisc(b, 17, 12, 7, 5, SNOWROCK, 222);
  rimBottom(b, C.slate);
  b.outline(C.dusk);
  return { buf: b, ax: 13, ay: 15, shadow: { ox: 3, oy: 0, rx: 11, ry: 3 } };
}

/** Felsnadel: senkrechter Zacken mit Schichten und Schneehaube. */
function spire(v: number): PropArt {
  const b = mk(30, 60);
  const cx = 15, h = v ? 44 : 52;
  for (let y = 58 - h; y <= 56; y++) {
    const f = (y - (58 - h)) / h, half = Math.max(1, Math.round(1 + f * (v ? 8 : 9) + Math.sin(y / 5) * 1.2));
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5), lit = -nx * 0.9 + (bayer(cx + x, y) - 0.5) * 0.25;
      let c = lit > 0.5 ? C.silver : lit > 0.0 ? C.stone : lit > -0.5 ? C.slate : C.dusk;
      if ((y + Math.floor(x / 3)) % 7 === 0) c = c === C.silver ? C.stone : c === C.stone ? C.slate : C.dusk;
      b.set(cx + x, y, c);
    }
  }
  // zweiter, kleinerer Zacken
  for (let y = 58 - Math.floor(h * 0.55); y <= 56; y++) { const f = (y - (58 - Math.floor(h * 0.55))) / (h * 0.55), half = Math.max(1, Math.round(1 + f * 5)); for (let x = -half; x <= half; x++) b.set(cx + 9 + x, y, x < 0 ? C.stone : x === 0 ? C.slate : C.dusk); }
  snowTop(b, 5, 44 + v);
  b.rect(cx - 12, 56, 26, 2, C.dusk);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: 57, shadow: { ox: 7, oy: 0, rx: 14, ry: 3 } };
}

function cairn(): PropArt {
  const b = mk(14, 18);
  b.ellipse(7, 14, 5, 2.4, C.slate); b.ellipse(7, 14, 4, 1.6, C.stone);
  b.ellipse(7, 10, 4, 2, C.slate); b.ellipse(6.5, 9.6, 3, 1.4, C.silver);
  b.ellipse(7, 6.5, 3, 1.6, C.stone); b.set(6, 6, C.white);
  b.ellipse(7, 3.5, 1.6, 1.2, C.silver);
  b.outline(C.night);
  return { buf: b, ax: 7, ay: 16, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

/** Berghuette: Steinsockel, Holzaufbau, dickes Schneedach, Schornstein (Rauch ueber hook), warmes Fenster. */
function hut(): PropArt {
  const W = 50, H = 44;
  const b = mk(W, H);
  const cx = 25;
  // Steinsockel + Holzwand
  for (let y = 26; y <= 40; y++) for (let x = 5; x <= 44; x++) {
    if (y >= 33) { const row = Math.floor((y - 33) / 3), off = (row & 1) * 3; const joint = (y - 33) % 3 === 2 || (x + off) % 6 === 5; b.set(x, y, joint ? C.dusk : x < 20 ? C.stone : x < 36 ? C.slate : C.dusk); }
    else { const k = (x - 5) % 4; b.set(x, y, x >= 40 ? (k === 0 ? C.bark : C.plum) : k === 0 ? C.tan : k === 3 ? C.bark : C.wood); }
  }
  b.rect(19, 28, 7, 12, C.plum); b.rect(20, 29, 5, 11, C.bark); b.rect(20, 29, 2, 11, C.wood); b.set(24, 35, C.yellow);
  b.rect(31, 28, 8, 7, C.bark); b.rect(32, 29, 6, 5, C.amber); b.rect(32, 29, 3, 2, C.yellow); b.rect(34, 29, 1, 5, C.bark);
  b.rect(30, 35, 10, 1, C.silver);
  // Dach: Satteldach, schwere Schneelast
  for (let y = 6; y <= 27; y++) {
    const f = (y - 6) / 21, half = Math.round(8 + f * 19);
    for (let x = -half; x <= half; x++) {
      const nx = x / half, snow = f < 0.8 + (hash2(x, 3, 5) - 0.5) * 0.3;
      let c: number;
      if (snow) c = -nx * 0.7 + (1 - f) * 0.4 + (bayer(cx + x, y) - 0.5) * 0.2 > 0.1 ? C.white : C.silver; else c = f > 0.92 ? C.plum : (y % 3 === 0 ? C.bark : C.wood);
      b.set(cx + x, y, c);
    }
  }
  for (let x = cx - 24; x <= cx + 24; x += 3) { b.under(x, 28, C.ice); if (hash2(x, 2, 2) > 0.5) b.under(x, 29, C.white); }
  b.rect(cx + 8, 0, 5, 10, C.stone); b.rect(cx + 8, 0, 1, 10, C.silver); b.rect(cx + 12, 0, 1, 10, C.slate); b.rect(cx + 7, 0, 7, 2, C.white);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: 41, shadow: { ox: 8, oy: 0, rx: 26, ry: 5 }, hook: { x: 10, y: -41 } };
}

/** Wachturm: runder Steinturm mit Holzkranz; Leuchtfeuer oben (Flamme = bewegte Ebene, hook). */
function watchtower(): PropArt {
  const W = 36, H = 64;
  const b = mk(W, H);
  const cx = 18, top = 22, bot = 60, hw = 11;
  for (let y = top; y <= bot; y++) for (let x = -hw; x <= hw; x++) {
    const nx = x / hw, row = Math.floor((y - top) / 4), ry = (y - top) % 4, off = (row & 1) * 3;
    const joint = ry === 3 || (x + hw + off) % 7 === 6;
    const lit = -nx * 0.85 + (bayer(cx + x, y) - 0.5) * 0.18;
    b.set(cx + x, y, joint ? (lit > 0 ? C.slate : C.dusk) : lit > 0.45 ? C.silver : lit > 0.0 ? C.stone : lit > -0.5 ? C.slate : C.dusk);
  }
  for (const [y, lit] of [[34, true], [46, false]] as const) { b.rect(cx - 1, y, 2, 6, C.ink); if (lit) { b.rect(cx - 1, y + 1, 2, 4, C.amber); b.set(cx - 1, y + 1, C.yellow); } }
  b.rect(cx - 4, 50, 8, 10, C.night); b.rect(cx - 3, 51, 6, 9, C.bark);
  b.rect(cx - hw - 1, bot, 2 * hw + 3, 3, C.slate); b.rect(cx - hw - 1, bot, 2 * hw + 3, 1, C.stone);
  // Holzkranz mit Schnee
  b.rect(cx - hw - 3, 16, 2 * hw + 7, 7, C.wood); b.rect(cx - hw - 3, 16, 2 * hw + 7, 1, C.tan); b.rect(cx - hw - 3, 22, 2 * hw + 7, 1, C.bark);
  for (let x = cx - hw - 2; x < cx + hw + 3; x += 3) b.rect(x, 17, 1, 5, C.bark);
  b.rect(cx - hw - 3, 14, 2 * hw + 7, 2, C.white); b.rect(cx - hw - 1, 13, 2 * hw + 3, 1, C.silver);
  // Feuerkorb
  b.rect(cx - 4, 8, 9, 3, C.night); b.rect(cx - 5, 7, 11, 1, C.slate); b.rect(cx - 3, 6, 7, 1, C.rust);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: 62, shadow: { ox: 8, oy: 0, rx: 16, ry: 5 }, hook: { x: 0, y: -57 } };
}

function beacon(): PropArt {
  const b = mk(16, 36);
  b.rect(7, 12, 2, 22, C.bark); b.rect(7, 12, 1, 22, C.wood);
  b.rect(4, 32, 8, 3, C.stone); b.rect(4, 32, 8, 1, C.silver);
  b.rect(3, 9, 10, 3, C.night); b.rect(2, 8, 12, 1, C.slate); b.rect(4, 7, 8, 1, C.rust); b.set(6, 7, C.orange); b.set(10, 7, C.amber);
  b.line(4, 12, 7, 18, C.bark); b.line(12, 12, 9, 18, C.bark);
  b.outline(C.ink);
  return { buf: b, ax: 8, ay: 34, shadow: { ox: 3, oy: 0, rx: 6, ry: 2 }, hook: { x: 0, y: -26 } };
}

/** Bergziege: weisses Fell, Hoerner, Bart; v0 blickt nach links, v1 nach rechts. */
function goat(v: number): PropArt {
  const b = mk(20, 16);
  b.rect(5, 6, 10, 5, C.white); b.rect(5, 6, 10, 1, C.white); b.rect(5, 10, 10, 1, C.silver); b.rect(12, 7, 3, 3, C.silver);
  for (const x of [6, 8, 12, 14]) b.rect(x, 11, 1, 3, C.stone);
  b.rect(4, 3, 3, 5, C.white); b.rect(2, 4, 3, 3, C.white); b.set(3, 5, C.ink); b.rect(1, 6, 2, 2, C.silver); // Kopf, Bart
  b.line(4, 3, 2, 0, C.tan); b.line(5, 3, 4, 0, C.tan); // Hoerner
  b.set(15, 6, C.silver); b.set(16, 5, C.white);
  if (v) { const c = b.clone(); b.fill(0); for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) b.set(c.w - 1 - x, y, c.get(x, y)); }
  b.outline(C.slate);
  return { buf: b, ax: 10, ay: 14, shadow: { ox: 1, oy: 0, rx: 7, ry: 2 } };
}

function tent(v: number): PropArt {
  const b = mk(34, 26);
  const [l, m, d] = v ? [C.sky, C.navy, C.night] : [C.clay, C.rust, C.crimson];
  for (let y = 3; y <= 22; y++) { const f = (y - 3) / 19, half = Math.round(1 + f * 14); for (let x = -half; x <= half; x++) { const nx = x / (half + 0.5); b.set(17 + x, y, Math.abs(x) <= 1 && f > 0.5 ? C.plum : nx < -0.15 ? l : nx < 0.5 ? m : d); } }
  b.line(17, 0, 17, 3, C.bark);
  snowTop(b, 3, 71);
  b.rect(1, 22, 32, 1, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: 17, ay: 23, shadow: { ox: 4, oy: 0, rx: 16, ry: 4 } };
}

/** Fahnenmast mit wehender Fahne (im Wind nach rechts), 3 Farbstreifen. */
function banner(v: number): PropArt {
  const b = mk(26, 46);
  b.rect(4, 3, 2, 41, C.bark); b.rect(4, 3, 1, 41, C.wood); b.set(4, 1, C.yellow); b.set(5, 2, C.amber);
  const cols = v ? [C.sky, C.white, C.navy] : [C.red, C.yellow, C.crimson];
  for (let x = 0; x < 18; x++) { const dy = Math.round(Math.sin(x * 0.55) * 1.4); for (let y = 0; y < 9 - Math.floor(x / 6); y++) b.set(6 + x, 4 + y + dy, cols[Math.floor(y / 3) % 3]); }
  b.rect(1, 42, 8, 2, C.stone); b.rect(1, 42, 8, 1, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: 5, ay: 43, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 } };
}

function flagpole(): PropArt {
  const b = mk(10, 30);
  b.rect(4, 2, 2, 26, C.bark); b.rect(4, 2, 1, 26, C.wood); b.set(4, 1, C.yellow);
  b.rect(2, 26, 6, 2, C.stone);
  b.outline(C.plum);
  return { buf: b, ax: 5, ay: 28, shadow: { ox: 2, oy: 0, rx: 4, ry: 1 }, hook: { x: 2, y: -26 } };
}

function campfire(): PropArt {
  const b = mk(22, 14);
  for (const [x, y] of [[3, 9], [6, 10], [10, 10], [13, 9], [16, 8], [8, 7]]) b.disc(x + 1, y, 1.6, C.stone);
  b.line(5, 9, 15, 6, C.bark); b.line(5, 6, 15, 9, C.wood);
  b.ellipse(10, 8, 4, 2, C.night); b.set(9, 8, C.rust); b.set(11, 8, C.orange);
  b.outline(C.dusk);
  return { buf: b, ax: 11, ay: 11, shadow: { ox: 2, oy: 0, rx: 9, ry: 2 }, hook: { x: 0, y: -6 } };
}

/** Torpfosten: Steinsaeule mit Kappe und Laterne, Fahnenseil haengt zwischen zwei Pfosten (deco). */
function gatepost(v: number): PropArt {
  const b = mk(20, 50);
  stoneColumn(b, 4, 12, 12, 36, 231 + v);
  b.rect(2, 8, 16, 5, C.slate); b.rect(2, 8, 16, 1, C.silver); b.rect(2, 12, 16, 1, C.dusk);
  b.rect(6, 3, 8, 5, C.stone); b.rect(6, 3, 8, 1, C.white);
  b.rect(8, 0, 4, 3, C.night); b.rect(9, 1, 2, 2, C.amber); b.set(9, 1, C.yellow);
  b.rect(1, 46, 18, 3, C.slate); b.rect(1, 46, 18, 1, C.stone);
  b.outline(C.night);
  return { buf: b, ax: 10, ay: 48, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 }, hook: { x: 0, y: -46 } };
}
function stoneColumn(b: Buf, x0: number, y0: number, w: number, h: number, seed: number): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const row = Math.floor((y - y0) / 4), ry = (y - y0) % 4, fx = (x - x0) / (w - 1);
    const k = hash2(row, x >> 2, seed);
    b.set(x, y, ry === 3 ? C.dusk : fx < 0.3 ? (k > 0.5 ? C.silver : C.stone) : fx < 0.7 ? (k > 0.5 ? C.stone : C.slate) : C.dusk);
  }
}

function sign(): PropArt {
  const b = mk(24, 26);
  b.rect(11, 6, 2, 18, C.bark); b.rect(11, 6, 1, 18, C.wood);
  b.rect(3, 3, 17, 7, C.wood); b.rect(3, 3, 17, 1, C.tan); b.rect(3, 9, 17, 1, C.bark); b.rect(4, 6, 8, 1, C.bark);
  b.line(20, 4, 23, 6, C.wood); b.line(23, 6, 20, 8, C.wood);
  snowTop(b, 2, 63);
  b.outline(C.plum);
  return { buf: b, ax: 12, ay: 24, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 } };
}

/** Holzstapel/Planken (Bruecken-Vorrat) neben den Seilbruecken. */
function plank(): PropArt {
  const b = mk(26, 14);
  for (let i = 0; i < 4; i++) { b.rect(3, 9 - i * 2, 20, 2, i % 2 ? C.wood : C.tan); b.rect(3, 9 - i * 2, 20, 1, i % 2 ? C.tan : C.peach); }
  b.rect(3, 11, 20, 1, C.bark); b.rect(4, 5, 1, 7, C.bark); b.rect(21, 5, 1, 7, C.bark);
  snowTop(b, 2, 91);
  b.outline(C.plum);
  return { buf: b, ax: 13, ay: 12, shadow: { ox: 2, oy: 0, rx: 11, ry: 2 } };
}

const cache = new Map<string, PropArt>();
export function skyArt(kind: SkyKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) { a = build(kind, v); cache.set(key, a); }
  return a;
}
function build(kind: SkyKind, v: number): PropArt {
  switch (kind) {
    case 'pine': return pine(v);
    case 'larch': return larch();
    case 'shrub': return shrub(v);
    case 'boulder': return boulder(v, true);
    case 'snowrock': return v === 9 ? snowrock() : boulder(v, false);
    case 'spire': return spire(v);
    case 'cairn': return cairn();
    case 'hut': return hut();
    case 'watchtower': return watchtower();
    case 'beacon': return beacon();
    case 'goat': return goat(v);
    case 'tent': return tent(v);
    case 'banner': return banner(v);
    case 'flagpole': return flagpole();
    case 'campfire': return campfire();
    case 'gatepost': return gatepost(v);
    case 'sign': return sign();
    case 'plank': return plank();
  }
}
void rng;
