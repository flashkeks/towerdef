/**
 * Gemalte Dinge von Ember Quarry (Runde 15 / B1): Kristalle, Felsen, Holzgeruest, Stolleneingang, Lore, Erzhaufen, Feuerkorb ...
 * Regeln wie `props.ts`: Licht oben links, drei Toene je Flaeche, Umriss in der dunkelsten Flaechenfarbe, Schatten separat.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';

export type QuarryKind =
  | 'crystal' | 'rock' | 'boulder' | 'spire' | 'scaffold' | 'mine' | 'cart' | 'ore' | 'tnt' | 'barrel' | 'lamp' | 'dead' | 'brazier'
  | 'crane' | 'sign' | 'bones' | 'pickaxe';

const STONE: Tones = { dark: C.dusk, mid: C.slate, light: C.stone, hi: C.silver };

/** Ein Kristall: Spitze oben, zwei Flaechen (links hell, rechts dunkel), Mittelgrat, Glanzpunkt. */
function shard(b: Buf, cx: number, base: number, w: number, h: number, t: Tones, lean = 0): void {
  for (let y = 0; y < h; y++) {
    const f = y / h; // 0 Spitze .. 1 Fuss
    const half = Math.max(0, Math.round((f < 0.12 ? f / 0.12 * 0.4 : 0.4 + (f - 0.12) * 0.7) * (w / 2) * (f > 0.9 ? 0.85 : 1)));
    const mid = cx + Math.round(lean * (1 - f));
    for (let x = -half; x <= half; x++) {
      let c = x < -half * 0.2 ? t.light : x < half * 0.35 ? t.mid : t.dark;
      if (x === -half) c = t.light;
      if (x === 0 && f > 0.15 && f < 0.9) c = t.mid;
      if (f > 0.82) c = x < 0 ? t.mid : t.dark;
      b.set(mid + x, base - h + y + 1, c);
    }
  }
  if (t.hi) { b.set(cx + Math.round(lean * 0.7) - 1, base - Math.round(h * 0.7), t.hi); b.set(cx + Math.round(lean * 0.9), base - Math.round(h * 0.85), t.hi); }
}

function crystal(v: number): PropArt {
  const b = mk(40, 40);
  const t: Tones = v === 1 ? { dark: C.navy, mid: C.sky, light: C.ice, hi: C.white }
    : v === 2 ? { dark: C.crimson, mid: C.magenta, light: C.coral, hi: C.white }
      : { dark: C.violet, mid: C.orchid, light: C.coral, hi: C.white };
  // Fuss: dunkler Felssockel
  shadedDisc(b, 20, 34, 13, 4, { dark: C.night, mid: C.dusk, light: C.slate }, 7 + v);
  const shards: [number, number, number, number, number][] = [[20, 35, 12, 30, 0], [11, 36, 8, 20, -3], [29, 36, 9, 22, 3], [16, 37, 6, 13, -2], [25, 37, 6, 15, 2], [34, 37, 5, 10, 2]];
  for (const [x, base, w, h, lean] of shards) shard(b, x, base, w, h, t, lean);
  rimBottom(b, t.dark);
  sparkle(b, 4, [t.mid, t.light], C.white, 9 + v);
  b.outline(v === 1 ? C.night : C.plum);
  return { buf: b, ax: 20, ay: 37, shadow: { ox: 4, oy: 0, rx: 14, ry: 4 } };
}

function rock(v: number, big: boolean): PropArt {
  const b = mk(big ? 36 : 20, big ? 28 : 15);
  const t: Tones = { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone };
  if (big) {
    shadedDisc(b, 18, 16, 14, 9, t, 12);
    shadedDisc(b, 9, 18, 7, 6, t, 13);
    shadedDisc(b, 27, 19, 8, 6, t, 14);
    shadedDisc(b, 20, 9, 8, 5, t, 15);
  } else {
    shadedDisc(b, 10, 9, 7, 5, t, 25 + v);
    shadedDisc(b, 15, 10, 4, 3, t, 26 + v);
  }
  rimBottom(b, C.ink);
  // Risse und Glutadern: warme Pixel an der Unterkante (Lava in der Naehe)
  const r = rng(77 + v + (big ? 9 : 0));
  for (let i = 0; i < (big ? 9 : 3); i++) {
    const x = Math.floor(r() * b.w), y = Math.floor(b.h * 0.45 + r() * b.h * 0.4);
    if (b.get(x, y) && b.get(x, y + 1)) { b.set(x, y, C.crimson); if (r() < 0.5) b.set(x + 1, y + 1, C.rust); }
  }
  b.outline(C.ink);
  return { buf: b, ax: big ? 18 : 10, ay: big ? 24 : 12, shadow: { ox: 3, oy: 0, rx: big ? 15 : 9, ry: big ? 5 : 3 } };
}

function spire(v: number): PropArt {
  const b = mk(22, 36);
  const t = STONE;
  const spires: [number, number, number][] = v ? [[8, 32, 22], [15, 33, 14], [4, 33, 10]] : [[11, 33, 30], [5, 33, 16], [17, 34, 18]];
  for (const [cx, base, h] of spires) {
    for (let y = 0; y < h; y++) {
      const f = y / h, half = Math.round(0.3 + f * (h > 20 ? 5 : 4));
      for (let x = -half; x <= half; x++) {
        const lit = -x / (half + 0.5) * 0.9 + (bayer(cx + x, y) - 0.5) * 0.5 - f * 0.2;
        b.set(cx + x, base - h + y + 1, lit > 0.45 ? t.light : lit > -0.2 ? t.mid : t.dark);
      }
    }
  }
  rimBottom(b, C.night);
  b.outline(C.ink);
  return { buf: b, ax: 11, ay: 34, shadow: { ox: 4, oy: 0, rx: 10, ry: 3 } };
}

/** Holzgeruest: vier Pfosten, Kreuzstreben, Plattform mit Gelaender, Leiter, Laterne. */
function scaffold(): PropArt {
  const b = mk(34, 56);
  const W = [C.tan, C.wood, C.bark];
  const post = (x: number): void => { b.rect(x, 12, 3, 40, W[1]); b.rect(x, 12, 1, 40, W[0]); b.rect(x + 2, 12, 1, 40, W[2]); };
  post(5); post(26);
  // Streben
  b.line(8, 50, 26, 28, W[2]); b.line(9, 50, 27, 28, W[1]); b.line(26, 50, 8, 28, W[2]); b.line(25, 50, 7, 28, W[1]);
  b.line(8, 26, 26, 14, W[2]); b.line(26, 26, 8, 14, W[2]);
  for (const y of [28, 40]) { b.rect(5, y, 24, 2, W[1]); b.rect(5, y, 24, 1, W[0]); }
  // Plattform
  b.rect(1, 10, 32, 3, W[0]); b.rect(1, 12, 32, 2, W[2]); b.rect(1, 10, 32, 1, C.peach);
  for (let x = 4; x < 32; x += 5) b.set(x, 11, W[2]);
  // Gelaender und Laterne
  b.rect(1, 3, 1, 8, W[1]); b.rect(32, 3, 1, 8, W[1]); b.rect(1, 3, 32, 1, W[0]); b.rect(1, 6, 32, 1, W[1]);
  b.rect(16, 3, 2, 8, W[2]);
  b.rect(19, 4, 5, 6, C.night); b.rect(20, 5, 3, 4, C.amber); b.set(20, 5, C.yellow);
  // Leiter
  b.rect(13, 14, 1, 38, W[2]); b.rect(18, 14, 1, 38, W[2]);
  for (let y = 16; y < 50; y += 4) b.rect(14, y, 4, 1, W[0]);
  // Seil und Eimer
  b.line(30, 14, 30, 24, C.sand); b.rect(28, 24, 5, 4, C.slate); b.rect(28, 24, 5, 1, C.stone); b.set(30, 26, C.orange);
  b.outline(C.plum);
  return { buf: b, ax: 17, ay: 53, shadow: { ox: 7, oy: -1, rx: 16, ry: 4 } };
}

/** Kran: A-Bock mit Ausleger, Seil und Kuebel voll gluehendem Erz. */
function crane(): PropArt {
  const b = mk(44, 54);
  const W = [C.tan, C.wood, C.bark];
  b.line(8, 50, 20, 6, W[1]); b.line(9, 50, 21, 6, W[0]); b.line(32, 50, 21, 6, W[2]); b.line(31, 50, 20, 6, W[1]);
  b.line(12, 36, 28, 36, W[2]); b.line(12, 37, 28, 37, W[1]);
  b.line(21, 7, 40, 14, W[1]); b.line(21, 6, 40, 13, W[0]); // Ausleger
  b.line(21, 10, 36, 24, C.sand);
  b.line(39, 14, 39, 28, C.sand);
  b.rect(35, 28, 9, 7, C.slate); b.rect(35, 28, 9, 1, C.stone); b.rect(35, 34, 9, 1, C.dusk);
  b.rect(36, 27, 7, 1, C.orange); b.set(38, 26, C.yellow); b.set(41, 27, C.amber);
  b.rect(19, 4, 4, 4, C.night); b.set(20, 5, C.amber); b.set(21, 5, C.yellow);
  b.rect(4, 49, 36, 2, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 22, ay: 51, shadow: { ox: 6, oy: -1, rx: 18, ry: 4 } };
}

/** Stolleneingang: Felswand mit Holzrahmen, dunkler Schlund, Schienen nach innen, zwei Laternen. */
function mine(): PropArt {
  const b = mk(52, 44);
  const t: Tones = { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone };
  shadedDisc(b, 26, 22, 24, 19, t, 41, 0.3);
  shadedDisc(b, 12, 28, 11, 12, t, 42);
  shadedDisc(b, 40, 28, 11, 12, t, 43);
  b.rect(0, 33, 52, 8, 0);
  for (let x = 0; x < 52; x++) for (let y = 33; y < 40; y++) if (b.get(x, y) === 0 && x > 3 && x < 48 && y < 38) b.set(x, y, C.dusk);
  b.rect(2, 36, 48, 4, C.dusk);
  // Rahmen
  const x0 = 15, x1 = 36, top = 16, bot = 39;
  b.rect(x0, top, x1 - x0 + 1, bot - top + 1, C.ink);
  for (let y = top + 3; y <= bot; y++) for (let x = x0 + 3; x <= x1 - 3; x++) b.set(x, y, y > top + 9 && bayer(x, y) < (y - top - 9) / 28 ? C.night : C.ink);
  b.rect(x0, top, 3, bot - top + 1, C.wood); b.rect(x0, top, 1, bot - top + 1, C.tan); b.rect(x0 + 2, top, 1, bot - top + 1, C.bark);
  b.rect(x1 - 2, top, 3, bot - top + 1, C.bark); b.rect(x1 - 2, top, 1, bot - top + 1, C.wood);
  b.rect(x0 - 2, top - 2, x1 - x0 + 5, 3, C.wood); b.rect(x0 - 2, top - 2, x1 - x0 + 5, 1, C.tan); b.rect(x0 - 2, top, x1 - x0 + 5, 1, C.bark);
  // Schienen in den Berg
  for (let y = bot - 8; y <= bot; y++) { const o = Math.round((bot - y) * 0.5); b.set(x0 + 5 + o, y, C.stone); b.set(x1 - 5 - o, y, C.stone); }
  for (let y = bot - 7; y <= bot; y += 3) b.rect(x0 + 5 - (bot - y) / 2 - 1, y, 12 + (bot - y), 1, C.bark);
  // Laternen
  for (const lx of [x0 - 3, x1 + 3]) { b.rect(lx, top + 6, 3, 5, C.night); b.rect(lx, top + 7, 3, 3, C.amber); b.set(lx, top + 7, C.yellow); b.set(lx + 1, top + 5, C.slate); }
  rimBottom(b, C.night);
  b.outline(C.ink);
  return { buf: b, ax: 26, ay: 40, shadow: { ox: 6, oy: 0, rx: 24, ry: 5 }, hook: { x: 0, y: -24 } };
}

/** Lore (Minenwagen) voll gluehendem Erz. */
function cart(): PropArt {
  const b = mk(34, 24);
  // Kasten: nach unten verjuengt
  for (let y = 6; y <= 16; y++) {
    const f = (y - 6) / 10, l = Math.round(3 + f * 2), r = Math.round(30 - f * 2);
    for (let x = l; x <= r; x++) b.set(x, y, y === 6 ? C.stone : x < l + 3 ? C.stone : x > r - 3 ? C.dusk : C.slate);
  }
  b.rect(3, 6, 28, 1, C.silver);
  b.rect(4, 11, 26, 1, C.dusk);
  for (const x of [7, 14, 21, 28]) { b.set(x, 8, C.silver); b.set(x, 14, C.dusk); }
  // Erzhaufen
  const r = rng(61);
  for (let x = 5; x <= 28; x++) {
    const h = Math.round(3.2 - Math.abs(x - 16) * 0.12 + (hash2(x, 1, 5) - 0.5) * 2);
    for (let k = 0; k < h; k++) b.set(x, 5 - k, k === h - 1 ? (r() < 0.5 ? C.amber : C.orange) : r() < 0.3 ? C.yellow : r() < 0.5 ? C.rust : C.crimson);
  }
  b.set(12, 2, C.yellow); b.set(20, 3, C.white); b.set(24, 3, C.yellow);
  // Raeder
  for (const cx of [9, 24]) { b.disc(cx, 18, 3, C.night); b.disc(cx, 18, 2, C.slate); b.set(cx, 18, C.stone); b.set(cx - 1, 17, C.silver); }
  b.rect(3, 21, 28, 1, C.stone); b.rect(3, 22, 28, 1, C.dusk);
  b.outline(C.ink);
  return { buf: b, ax: 17, ay: 21, shadow: { ox: 3, oy: 0, rx: 15, ry: 3 } };
}

function ore(): PropArt {
  const b = mk(26, 18);
  const t: Tones = { dark: C.ink, mid: C.night, light: C.dusk, hi: C.slate };
  shadedDisc(b, 8, 11, 7, 5, t, 51);
  shadedDisc(b, 17, 11, 7, 5, t, 52);
  shadedDisc(b, 13, 8, 8, 6, t, 53);
  rimBottom(b, C.ink);
  const r = rng(91);
  for (let i = 0; i < 11; i++) { const x = 3 + Math.floor(r() * 20), y = 4 + Math.floor(r() * 9); if (b.get(x, y)) { b.set(x, y, i % 3 ? C.amber : C.yellow); if (i % 4 === 0) b.set(x + 1, y, C.orange); } }
  b.set(13, 5, C.white);
  b.outline(C.ink);
  return { buf: b, ax: 13, ay: 15, shadow: { ox: 3, oy: 0, rx: 11, ry: 3 } };
}

function tnt(): PropArt {
  const b = mk(20, 18);
  b.rect(2, 5, 14, 10, C.red);
  b.rect(2, 5, 14, 1, C.coral);
  b.rect(2, 5, 1, 10, C.coral);
  b.rect(15, 5, 1, 10, C.crimson);
  b.rect(2, 14, 14, 1, C.crimson);
  b.rect(2, 8, 14, 1, C.bark); b.rect(2, 12, 14, 1, C.bark);
  // T N T
  for (const [x, y] of [[4, 9], [5, 9], [6, 9], [5, 10], [5, 11], [8, 9], [8, 10], [8, 11], [9, 10], [10, 9], [10, 10], [10, 11], [12, 9], [13, 9], [14, 9], [13, 10], [13, 11]]) b.set(x, y, C.white);
  b.line(8, 4, 10, 1, C.sand); b.set(10, 0, C.yellow); b.set(11, 1, C.orange);
  b.outline(C.plum);
  return { buf: b, ax: 9, ay: 15, shadow: { ox: 3, oy: 0, rx: 9, ry: 2 } };
}

function barrel(): PropArt {
  const b = mk(14, 16);
  b.rect(2, 3, 8, 10, C.slate);
  b.rect(2, 3, 2, 10, C.stone);
  b.rect(8, 3, 2, 10, C.dusk);
  b.rect(2, 5, 8, 1, C.night); b.rect(2, 10, 8, 1, C.night);
  b.rect(3, 2, 6, 1, C.stone);
  b.set(5, 7, C.orange); b.set(6, 7, C.amber); // Glut aus der Fuge
  b.outline(C.ink);
  return { buf: b, ax: 6, ay: 13, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function lamp(): PropArt {
  const b = mk(14, 28);
  b.rect(6, 9, 2, 17, C.night);
  b.rect(6, 9, 1, 17, C.dusk);
  b.rect(4, 24, 6, 2, C.slate);
  b.rect(4, 24, 6, 1, C.stone);
  b.rect(4, 3, 6, 7, C.ink);
  b.rect(5, 4, 4, 5, C.orange);
  b.rect(5, 4, 2, 3, C.amber);
  b.set(6, 5, C.yellow);
  b.rect(3, 2, 8, 1, C.slate); b.rect(5, 1, 4, 1, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 7, ay: 26, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 0, y: -21 } };
}

function dead(v: number): PropArt {
  const b = mk(30, 44);
  const cx = 15;
  b.rect(cx - 2, 20, 4, 22, C.night); b.rect(cx - 2, 20, 1, 22, C.dusk); b.rect(cx + 1, 20, 1, 22, C.ink);
  b.set(cx - 3, 41, C.night); b.set(cx + 3, 41, C.night); b.set(cx - 4, 42, C.night);
  const limbs: [number, number, number, number][] = v
    ? [[cx, 24, cx - 11, 14], [cx, 20, cx + 10, 10], [cx, 14, cx - 2, 2], [cx - 7, 18, cx - 13, 20]]
    : [[cx, 26, cx + 12, 17], [cx, 21, cx - 10, 9], [cx, 15, cx + 4, 3], [cx + 7, 18, cx + 13, 8]];
  for (const [x0, y0, x1, y1] of limbs) { b.line(x0, y0, x1, y1, C.night); b.line(x0 + 1, y0, x1 + 1, y1, C.ink); b.set(x1, y1 - 1, C.orange); }
  b.set(cx - 2, 28, C.crimson); b.set(cx + 1, 33, C.rust); b.set(cx - 1, 37, C.crimson);
  b.outline(C.ink);
  return { buf: b, ax: cx, ay: 42, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 } };
}

function brazier(): PropArt {
  const b = mk(18, 26);
  b.line(4, 24, 8, 14, C.slate); b.line(14, 24, 10, 14, C.dusk); b.line(9, 24, 9, 14, C.stone);
  b.rect(3, 12, 13, 3, C.slate); b.rect(3, 12, 13, 1, C.stone); b.rect(4, 14, 11, 1, C.night);
  // Flamme
  b.rect(6, 9, 7, 3, C.orange); b.rect(7, 6, 5, 4, C.amber); b.rect(8, 4, 3, 3, C.yellow); b.set(9, 2, C.yellow); b.set(9, 3, C.white);
  b.set(6, 8, C.red); b.set(12, 9, C.red); b.set(5, 11, C.crimson);
  b.outline(C.ink);
  return { buf: b, ax: 9, ay: 24, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 }, hook: { x: 0, y: -16 } };
}

function sign(): PropArt {
  const b = mk(22, 24);
  b.rect(10, 6, 2, 16, C.bark); b.rect(10, 6, 1, 16, C.wood);
  b.rect(3, 3, 16, 8, C.wood); b.rect(3, 3, 16, 1, C.tan); b.rect(3, 10, 16, 1, C.bark);
  // Warndreieck
  b.rect(8, 5, 6, 1, C.yellow); b.rect(9, 6, 4, 1, C.yellow); b.rect(9, 7, 4, 1, C.amber); b.rect(10, 8, 2, 1, C.amber);
  b.set(10, 6, C.ink); b.set(11, 6, C.ink); b.set(10, 7, C.ink);
  b.outline(C.plum);
  return { buf: b, ax: 11, ay: 22, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}

function bones(): PropArt {
  const b = mk(20, 12);
  b.ellipse(8, 7, 4, 3, C.sand); b.set(6, 6, C.ink); b.set(9, 6, C.ink); b.set(7, 9, C.ink); b.set(9, 9, C.ink);
  b.rect(5, 8, 7, 1, C.sand);
  b.line(12, 9, 18, 6, C.sand); b.line(12, 10, 18, 7, C.peach); b.set(18, 5, C.sand); b.set(19, 7, C.sand);
  b.outline(C.dusk);
  return { buf: b, ax: 10, ay: 10, shadow: { ox: 2, oy: 0, rx: 8, ry: 2 } };
}

function pickaxe(): PropArt {
  const b = mk(18, 22);
  shadedDisc(b, 9, 16, 6, 4, STONE, 71);
  rimBottom(b, C.night);
  b.line(9, 15, 12, 3, C.wood); b.line(10, 15, 13, 3, C.tan);
  b.line(6, 3, 17, 4, C.stone); b.line(6, 4, 17, 5, C.slate); b.set(5, 4, C.silver); b.set(17, 6, C.dusk);
  b.outline(C.ink);
  return { buf: b, ax: 9, ay: 18, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

const cache = new Map<string, PropArt>();
export function quarryArt(kind: QuarryKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) {
    a = (() => {
      switch (kind) {
        case 'crystal': return crystal(v);
        case 'rock': return rock(v, false);
        case 'boulder': return rock(1, true);
        case 'spire': return spire(v);
        case 'scaffold': return scaffold();
        case 'crane': return crane();
        case 'mine': return mine();
        case 'cart': return cart();
        case 'ore': return ore();
        case 'tnt': return tnt();
        case 'barrel': return barrel();
        case 'lamp': return lamp();
        case 'dead': return dead(v);
        case 'brazier': return brazier();
        case 'sign': return sign();
        case 'bones': return bones();
        case 'pickaxe': return pickaxe();
      }
    })();
    cache.set(key, a);
  }
  return a;
}
