/**
 * Gemalte Dinge von Frostfen Crossing (Runde 15 / B1): verschneite Tannen, Fischerhuetten, Eishuetten, Laternen, Schneemann ...
 * Gleiche Regeln wie `props.ts` (Licht oben links, drei Toene, Umriss in der dunkelsten Flaechenfarbe, Schatten separat),
 * dazu eine Schneehaube (`snowTop`) auf allem, was nach oben schaut.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';

export type FrostKind =
  | 'fir' | 'firsmall' | 'birch' | 'rock' | 'boulder' | 'stump' | 'hut' | 'shanty' | 'lamp' | 'snowman' | 'rack' | 'woodpile'
  | 'boat' | 'crate' | 'barrel' | 'sign' | 'reeds' | 'mound' | 'icerock' | 'tent';

const SNOW: Tones = { dark: C.stone, mid: C.silver, light: C.white };

/** Schneehaube: in jeder Spalte vom obersten sichtbaren Pixel `depth` Pixel (schwankend) weiss/silber faerben. */
export function snowTop(b: Buf, depth: number, seed: number, only?: (x: number, y: number) => boolean): void {
  const hits: [number, number, number][] = [];
  for (let x = 0; x < b.w; x++) {
    let y = 0;
    while (y < b.h && !b.get(x, y)) y++;
    if (y >= b.h) continue;
    const d = Math.max(1, Math.round(depth * (0.55 + hash2(x, seed, 3) * 0.9)));
    for (let k = 0; k < d; k++) {
      if (!b.get(x, y + k) || (only && !only(x, y + k))) break;
      hits.push([x, y + k, k === d - 1 ? 1 : 0]);
    }
  }
  for (const [x, y, last] of hits) b.set(x, y, last || (x > b.w * 0.62 && bayer(x, y) < 0.7) ? C.silver : C.white);
}

// ------------------------------------------------------------------ Tannen
function fir(tiers: [number, number, number][], W: number, H: number, v: number): PropArt {
  const b = mk(W, H);
  const cx = Math.floor(W / 2);
  const trunkTop = tiers[0][1] - 4;
  b.rect(cx - 1, trunkTop, 3, H - trunkTop - 1, C.bark);
  b.rect(cx - 1, trunkTop, 1, H - trunkTop - 1, C.wood);
  // von unten nach oben, obere Stufen ueberdecken die unteren
  tiers.forEach(([top, bot, hw], ti) => {
    const snowy = 0.58 + (v === 1 ? 0.12 : 0) - ti * 0.02;
    for (let y = top; y <= bot; y++) {
      const f = (y - top) / (bot - top);
      const half = Math.round(1 + f * hw);
      for (let x = -half; x <= half; x++) {
        const nx = x / (half + 0.5);
        const lit = -nx * 0.8 - (f - 0.4) * 0.5 + (bayer(cx + x, y) - 0.5) * 0.35 + (hash2(x, y, 4 + v) - 0.5) * 0.2;
        const isSnow = f < snowy - Math.abs(nx) * 0.18 + (hash2(x + 9, y, 8 + v) - 0.5) * 0.4;
        let c: number;
        if (isSnow) c = lit > -0.1 ? C.white : lit > -0.55 ? C.silver : C.stone;
        else c = lit > 0.35 ? C.grass : lit > -0.25 ? C.pine : C.deep;
        if (Math.abs(x) >= half && f > 0.15 && ((y + x) & 1) === 0) c = isSnow ? C.silver : C.deep;
        b.set(cx + x, y, c);
      }
    }
    // gezackter Rand unten, mit hellen Schneeklumpen an den Spitzen
    for (let x = -hw - 1; x <= hw + 1; x += 3) { b.set(cx + x, bot + 1, C.deep); if (hash2(x, ti, 5) > 0.5) b.set(cx + x, bot, C.white); }
  });
  rimBottom(b, C.deep);
  b.set(cx, tiers[tiers.length - 1][0] - 1, C.white);
  b.outline(C.deep);
  // Schneehaufen am Fuss
  const foot = mk(W, 8);
  shadedDisc(foot, cx, 4, Math.floor(W * 0.28), 2.5, SNOW, 6 + v);
  const out = mk(W, H + 3);
  out.blit(foot, 0, H - 6);
  out.blit(b, 0, 0);
  return { buf: out, ax: cx, ay: H - 1, shadow: { ox: 5, oy: 0, rx: Math.floor(W * 0.38), ry: 4 } };
}

const firArt = (v: number): PropArt => v === 2
  ? fir([[2, 14, 7], [10, 24, 9], [20, 34, 11]], 28, 44, 2)
  : v === 1
    ? fir([[4, 16, 7], [12, 26, 10], [22, 38, 12], [32, 46, 14]], 32, 54, 1)
    : fir([[3, 15, 6], [11, 25, 9], [21, 35, 11], [30, 43, 13]], 30, 52, 0);
const firSmall = (v: number): PropArt => fir([[2, 11, 5], [8, 19, 7], [15, 26, 9]], 22, 34, 3 + v);

function birch(v: number): PropArt {
  const b = mk(30, 44);
  const cx = 15;
  b.rect(cx - 1, 14, 3, 28, C.white);
  b.rect(cx + 1, 14, 1, 28, C.silver);
  for (const y of [20, 25, 30, 36]) { b.set(cx - 1, y, C.slate); b.set(cx, y + 1, C.slate); }
  b.set(cx - 2, 41, C.silver); b.set(cx + 2, 41, C.silver);
  // kahle Aeste mit Schnee drauf
  const limbs: [number, number, number, number][] = v === 1
    ? [[cx, 18, cx - 9, 8], [cx, 22, cx + 9, 11], [cx, 14, cx - 3, 2], [cx - 5, 12, cx - 11, 14], [cx + 5, 15, cx + 11, 6]]
    : [[cx, 20, cx - 10, 11], [cx, 16, cx + 9, 7], [cx, 12, cx - 2, 1], [cx + 4, 21, cx + 11, 18], [cx - 6, 14, cx - 9, 3]];
  for (const [x0, y0, x1, y1] of limbs) { b.line(x0, y0, x1, y1, C.stone); b.line(x0, y0 - 1, x1, y1 - 1, C.stone); b.set(x1, y1 - 1, C.white); }
  for (const [x0, y0, x1, y1] of limbs) { b.set(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2) - 2, C.white); b.set(x1 + 1, y1 - 2, C.white); }
  b.outline(C.slate);
  const foot = mk(30, 8);
  shadedDisc(foot, 15, 4, 8, 2.5, SNOW, 3);
  const out = mk(30, 47);
  out.blit(foot, 0, 38);
  out.blit(b, 0, 0);
  return { buf: out, ax: cx, ay: 42, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 } };
}

// ------------------------------------------------------------------ Steine
function rock(v: number, big: boolean): PropArt {
  const b = mk(big ? 32 : 20, big ? 24 : 15);
  const t: Tones = { dark: C.slate, mid: C.stone, light: C.silver, hi: C.white };
  if (big) {
    shadedDisc(b, 16, 14, 12, 8, t, 22);
    shadedDisc(b, 9, 15, 6, 5, t, 23);
    shadedDisc(b, 24, 16, 6, 5, t, 24);
  } else {
    shadedDisc(b, 9, 9, 7, 5, t, 25 + v);
    shadedDisc(b, 14, 10, 4, 3, t, 26 + v);
  }
  rimBottom(b, t.dark);
  snowTop(b, big ? 5 : 3, 40 + v);
  b.outline(C.night);
  return { buf: b, ax: big ? 16 : 10, ay: big ? 21 : 12, shadow: { ox: 3, oy: 0, rx: big ? 14 : 9, ry: big ? 4 : 3 } };
}

/** Eisblock/Eiskristall-Fels am Ufer (hellblau). */
function iceRock(v: number): PropArt {
  const b = mk(20, 20);
  const t: Tones = { dark: C.sky, mid: C.ice, light: C.white };
  shadedDisc(b, 8, 12, 6, 6, t, 31 + v);
  shadedDisc(b, 14, 13, 4, 4, t, 32 + v);
  rimBottom(b, C.sky);
  for (const [x, y] of [[6, 8], [7, 9], [11, 11]]) b.set(x, y, C.white);
  b.outline(C.navy);
  return { buf: b, ax: 10, ay: 17, shadow: { ox: 3, oy: 0, rx: 8, ry: 3 } };
}

function stump(): PropArt {
  const b = mk(16, 14);
  b.ellipse(8, 8, 5, 3, C.wood);
  b.rect(4, 8, 9, 4, C.bark);
  b.rect(4, 8, 2, 4, C.wood);
  b.ellipse(8, 6, 5, 2.4, C.white);
  b.set(5, 7, C.silver); b.set(11, 6, C.silver); b.set(10, 7, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 12, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

// ------------------------------------------------------------------ Gebaeude
/** Fischerhuette: Blockhaus mit dick verschneitem Dach, Schornstein (Rauch ueber `hook`), warmem Fenster. */
function hut(v: number): PropArt {
  const W = 44, H = 40;
  const b = mk(W, H);
  const cx = Math.floor(W / 2);
  const wl = 5, wr = W - 6, wallTop = 18, wallBot = H - 3, roofT = 4;
  // Wand: waagrechte Staemme, Licht oben, Fugen dunkel, rechts Schatten
  for (let y = wallTop; y <= wallBot; y++) {
    const row = (y - wallTop) % 4;
    for (let x = wl; x <= wr; x++) {
      let c = row === 0 ? C.tan : row === 3 ? C.bark : C.wood;
      if (x >= wr - 3) c = row === 0 ? C.wood : row === 3 ? C.plum : C.bark;
      if (row === 1 && hash2(x >> 2, y, 7 + v) > 0.8) c = C.tan;
      b.set(x, y, c);
    }
  }
  // Stammenden an den Ecken
  for (let y = wallTop; y <= wallBot; y += 4) { b.rect(wl - 2, y, 3, 3, C.tan); b.set(wl - 2, y, C.peach); b.rect(wr, y + 1, 3, 3, C.wood); b.set(wr + 2, y + 2, C.bark); }
  b.rect(wl, wallBot - 1, wr - wl + 1, 2, C.stone);
  // Tuer
  const dx = cx - 9;
  b.rect(dx, wallBot - 11, 7, 11, C.plum);
  b.rect(dx + 1, wallBot - 10, 5, 10, C.bark);
  b.rect(dx + 1, wallBot - 10, 2, 10, C.wood);
  b.set(dx + 5, wallBot - 5, C.yellow);
  b.rect(dx - 1, wallBot - 12, 9, 1, C.silver); // Schneekante ueber der Tuer
  // Fenster, warm beleuchtet, mit Eisblumen
  const fx = cx + 3;
  b.rect(fx - 1, wallBot - 13, 10, 9, C.plum);
  b.rect(fx, wallBot - 12, 8, 7, C.amber);
  b.rect(fx, wallBot - 12, 4, 3, C.yellow);
  b.rect(fx + 3, wallBot - 12, 1, 7, C.plum);
  b.rect(fx, wallBot - 9, 8, 1, C.plum);
  b.set(fx, wallBot - 12, C.white); b.set(fx + 7, wallBot - 6, C.white); b.set(fx + 1, wallBot - 11, C.ice);
  b.rect(fx - 2, wallBot - 4, 12, 1, C.silver);
  // Fischernetz und Fisch an der Wand
  b.line(wl + 2, wallTop + 3, wl + 2, wallTop + 11, C.silver);
  b.set(wl + 1, wallTop + 12, C.stone); b.set(wl + 2, wallTop + 12, C.stone); b.set(wl + 3, wallTop + 13, C.stone);
  // Dach: breites Trapez, dunkles Holz mit dicker Schneelast
  const half = (y: number): number => Math.round(12 + ((y - roofT) / (wallTop - roofT)) * 14);
  for (let y = roofT; y <= wallTop; y++) {
    const f = (y - roofT) / (wallTop - roofT);
    for (let x = cx - half(y); x <= cx + half(y); x++) {
      const nx = (x - cx) / half(y);
      const snowBottom = 0.78 + (hash2(x, 3, 11 + v) - 0.5) * 0.35 + ((x + y) & 1 ? 0.04 : 0);
      let c: number;
      if (f < snowBottom) c = -nx * 0.7 + (1 - f) * 0.4 - 0.1 + (bayer(x, y) - 0.5) * 0.2 > 0.05 ? C.white : C.silver;
      else c = f > 0.92 ? C.plum : (y - roofT) % 3 === 0 ? C.bark : C.wood;
      if (f < snowBottom && f > snowBottom - 0.16 && ((x + y) & 1) === 0 && nx > -0.2) c = C.silver;
      b.set(x, y, c);
    }
  }
  // Eiszapfen an der Traufe
  for (let x = cx - half(wallTop) + 3; x <= cx + half(wallTop) - 3; x += 4) { b.set(x, wallTop + 1, C.ice); if (hash2(x, 1, 2) > 0.45) b.set(x, wallTop + 2, C.white); }
  // Schornstein
  b.rect(cx + 7, 0, 5, 8, C.stone);
  b.rect(cx + 7, 0, 1, 8, C.silver);
  b.rect(cx + 11, 0, 1, 8, C.slate);
  b.rect(cx + 6, 0, 7, 2, C.white);
  b.rect(cx + 8, 2, 3, 1, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: Math.floor(W / 2) + 2, ry: 5 }, hook: { x: 9, y: -(wallBot + 1) } };
}

/** Eishuette (Angelschuppen): kleine Bretterbude auf dem Eis, Ofenrohr. v0 rot, v1 blau. */
function shanty(v: number): PropArt {
  const W = 28, H = 28;
  const b = mk(W, H);
  const [l, m, d] = v ? [C.sky, C.navy, C.night] : [C.clay, C.rust, C.crimson];
  const wl = 3, wr = W - 4, wallTop = 12, wallBot = H - 3;
  for (let y = wallTop; y <= wallBot; y++) for (let x = wl; x <= wr; x++) {
    const plank = (x - wl) % 4;
    let c = plank === 0 ? l : plank === 3 ? d : m;
    if (x >= wr - 2) c = plank === 3 ? d : m;
    b.set(x, y, c);
  }
  b.rect(wl, wallBot - 1, wr - wl + 1, 2, C.stone);
  // Tuer + Fensterchen
  b.rect(wl + 4, wallBot - 8, 6, 8, C.plum);
  b.rect(wl + 5, wallBot - 7, 4, 7, C.bark);
  b.rect(wr - 8, wallBot - 11, 5, 5, C.plum);
  b.rect(wr - 7, wallBot - 10, 3, 3, C.amber);
  b.set(wr - 7, wallBot - 10, C.yellow);
  // Pultdach mit Schnee, nach rechts abfallend
  for (let y = 4; y <= wallTop; y++) {
    const f = (y - 4) / (wallTop - 4);
    const x0 = wl - 2, x1 = wr + 2 - Math.round((1 - f) * 3);
    for (let x = x0; x <= x1; x++) {
      const sn = f < 0.7 + (hash2(x, 1, 6 + v) - 0.5) * 0.4;
      b.set(x, y, sn ? ((x - x0) / (x1 - x0) < 0.6 && f < 0.5 ? C.white : C.silver) : f > 0.9 ? C.plum : C.bark);
    }
  }
  b.rect(wr - 4, 0, 2, 6, C.slate); // Ofenrohr
  b.rect(wr - 4, 0, 1, 6, C.stone);
  b.rect(wr - 5, 0, 4, 1, C.white);
  b.outline(C.plum);
  return { buf: b, ax: 14, ay: wallBot + 1, shadow: { ox: 4, oy: -1, rx: 15, ry: 4 }, hook: { x: 7, y: -(wallBot + 1) } };
}

function tent(): PropArt {
  const W = 34, H = 26;
  const b = mk(W, H);
  const cx = 17;
  for (let y = 2; y <= 22; y++) {
    const f = (y - 2) / 20, half = Math.round(1 + f * 14);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.15 ? C.clay : nx < 0.5 ? C.rust : C.crimson;
      if (Math.abs(x) <= 1 && f > 0.5) c = C.plum; // Eingang
      if (f > 0.5 && Math.abs(x) < 4 && Math.abs(x) > 1) c = nx < 0 ? C.rust : C.crimson;
      if ((y + x) % 7 === 0 && Math.abs(x) > 1) c = shade(c);
      b.set(cx + x, y, c);
    }
  }
  b.line(cx, 0, cx, 3, C.bark);
  snowTop(b, 3, 71);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: 23, shadow: { ox: 5, oy: -1, rx: 17, ry: 4 } };
}
const shade = (c: number): number => (c === C.clay ? C.rust : c === C.rust ? C.crimson : C.plum);

function lamp(): PropArt {
  const b = mk(14, 28);
  b.rect(6, 9, 2, 17, C.night);
  b.rect(6, 9, 1, 17, C.dusk);
  b.rect(4, 24, 6, 2, C.slate);
  b.rect(4, 24, 6, 1, C.stone);
  b.rect(4, 3, 6, 7, C.night);
  b.rect(5, 4, 4, 5, C.amber);
  b.rect(5, 4, 2, 3, C.yellow);
  b.set(6, 5, C.white);
  b.rect(3, 2, 8, 1, C.slate);
  b.rect(5, 1, 4, 1, C.slate);
  b.rect(4, 0, 6, 1, C.white); b.rect(5, -0, 4, 1, C.white);
  b.rect(3, 1, 2, 1, C.white); b.rect(9, 1, 2, 1, C.silver);
  b.set(5, 23, C.white); b.set(8, 23, C.silver); b.rect(3, 25, 8, 1, C.silver);
  b.outline(C.ink);
  return { buf: b, ax: 7, ay: 26, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 0, y: -21 } };
}

function snowman(): PropArt {
  const b = mk(18, 26);
  shadedDisc(b, 9, 20, 6, 5, SNOW, 51);
  shadedDisc(b, 9, 13, 5, 4.5, SNOW, 52);
  shadedDisc(b, 9, 7, 4, 4, SNOW, 53);
  rimBottom(b, C.stone);
  b.line(4, 12, 0, 8, C.bark); b.line(14, 12, 17, 9, C.bark); b.set(0, 7, C.bark); b.set(17, 8, C.bark);
  b.rect(5, 10, 9, 2, C.red); b.rect(5, 12, 2, 4, C.crimson); b.rect(5, 10, 9, 1, C.coral); // Schal
  b.set(7, 6, C.ink); b.set(11, 6, C.ink); b.rect(9, 8, 4, 1, C.orange); b.set(13, 8, C.rust);
  for (const y of [14, 17]) b.set(9, y, C.ink);
  b.rect(5, 2, 9, 1, C.night); b.rect(6, -0, 7, 2, C.night); b.set(6, 1, C.dusk); // Hut
  b.outline(C.slate);
  return { buf: b, ax: 9, ay: 24, shadow: { ox: 2, oy: 0, rx: 8, ry: 3 } };
}

function rack(): PropArt {
  const b = mk(34, 24);
  b.rect(3, 4, 2, 18, C.bark); b.rect(3, 4, 1, 18, C.wood);
  b.rect(28, 4, 2, 18, C.bark); b.rect(28, 4, 1, 18, C.wood);
  b.rect(2, 5, 29, 2, C.wood); b.rect(2, 5, 29, 1, C.tan);
  for (let x = 7; x < 28; x += 5) {
    b.rect(x, 7, 1, 2, C.stone);
    b.rect(x - 1, 9, 3, 5, C.silver); b.rect(x - 1, 9, 1, 5, C.white); b.set(x + 1, 13, C.stone);
    b.set(x, 14, C.stone); b.set(x - 1, 15, C.slate); b.set(x + 1, 15, C.slate);
    b.set(x, 10, C.ink);
  }
  b.rect(3, 3, 26, 1, C.white); b.rect(4, 4, 6, 1, C.silver); b.rect(20, 4, 7, 1, C.silver);
  b.rect(1, 21, 32, 1, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: 16, ay: 22, shadow: { ox: 4, oy: 0, rx: 15, ry: 3 } };
}

function woodpile(): PropArt {
  const b = mk(26, 18);
  // Stapel von der Seite: drei Reihen Scheite, links die hellen Schnittflaechen mit Ring
  for (let row = 0; row < 3; row++) {
    const y = 12 - row * 4, off = row === 1 ? 1 : 0;
    for (let x = 3 + off; x < 22 - (row === 2 ? 2 : 0); x++) {
      b.set(x, y, C.tan); b.set(x, y + 1, C.wood); b.set(x, y + 2, C.bark);
      if ((x + row * 2) % 5 === 0) { b.set(x, y, C.wood); b.set(x, y + 1, C.bark); }
    }
    for (let k = 0; k < 2; k++) { const x = 3 + off + k * 6; b.set(x, y, C.peach); b.set(x, y + 1, C.sand); b.set(x + 1, y, C.tan); b.set(x + 1, y + 1, C.wood); b.set(x + 1, y + 2, C.bark); }
    b.set(2 + off, y + 1, C.bark);
  }
  b.rect(3, 15, 19, 1, C.bark);
  b.rect(1, 4, 1, 12, C.bark); b.rect(23, 4, 1, 12, C.bark); // Stuetzpfosten
  b.rect(1, 4, 1, 12, C.wood);
  snowTop(b, 3, 90);
  b.outline(C.plum);
  return { buf: b, ax: 13, ay: 16, shadow: { ox: 3, oy: 0, rx: 12, ry: 3 } };
}

function boat(): PropArt {
  const b = mk(34, 16);
  for (let x = 2; x < 32; x++) {
    const t = (x - 2) / 29;
    const sag = Math.round(Math.sin(t * Math.PI) * 4);
    const top = 5 - Math.round(Math.sin(t * Math.PI) * 1.5);
    for (let y = top; y < 9 + sag; y++) b.set(x, y, y === top ? C.tan : y > 6 + sag ? C.bark : C.wood);
  }
  b.rect(4, 5, 26, 1, C.peach);
  for (let x = 6; x < 29; x += 6) b.rect(x, 6, 2, 1, C.bark);
  b.ellipse(16, 5, 11, 1.4, C.white); // Schnee im Boot
  b.ellipse(15, 4, 6, 1, C.white);
  b.line(10, 3, 24, 1, C.tan); // Ruder
  b.outline(C.plum);
  return { buf: b, ax: 17, ay: 12, shadow: { ox: 2, oy: 0, rx: 15, ry: 3 } };
}

function crate(): PropArt {
  const b = mk(16, 16);
  b.rect(2, 4, 10, 9, C.wood);
  b.rect(2, 4, 1, 9, C.tan);
  b.line(3, 5, 10, 12, C.bark);
  b.line(10, 5, 3, 12, C.bark);
  b.rect(11, 5, 1, 8, C.bark);
  b.rect(2, 12, 10, 1, C.bark);
  snowTop(b, 3, 61);
  b.outline(C.plum);
  return { buf: b, ax: 7, ay: 13, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}
function barrel(): PropArt {
  const b = mk(14, 16);
  b.rect(2, 3, 8, 10, C.wood);
  b.rect(2, 3, 2, 10, C.tan);
  b.rect(8, 3, 2, 10, C.bark);
  b.rect(2, 5, 8, 1, C.slate);
  b.rect(2, 10, 8, 1, C.slate);
  snowTop(b, 3, 62);
  b.outline(C.plum);
  return { buf: b, ax: 6, ay: 13, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function sign(): PropArt {
  const b = mk(22, 24);
  b.rect(10, 6, 2, 16, C.bark); b.rect(10, 6, 1, 16, C.wood);
  b.rect(3, 4, 15, 6, C.wood); b.rect(3, 4, 15, 1, C.tan); b.rect(3, 9, 15, 1, C.bark);
  b.rect(4, 6, 8, 1, C.bark); b.rect(4, 8, 5, 1, C.bark);
  b.rect(17, 5, 1, 4, C.bark); b.set(18, 6, C.bark); b.set(18, 7, C.bark);
  snowTop(b, 2, 63);
  b.outline(C.plum);
  return { buf: b, ax: 11, ay: 22, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}

function reeds(v: number): PropArt {
  const b = mk(14, 22);
  const r = rng(300 + v);
  for (let i = 0; i < 5; i++) {
    const x = 2 + i * 2 + Math.floor(r() * 2), h = 10 + Math.floor(r() * 9);
    for (let y = 0; y < h; y++) b.set(x + Math.round(Math.sin(y / 3 + i) * 0.8), 20 - y, i % 2 ? C.tan : C.sand);
    if (i % 2 === 0) { b.rect(x, 20 - h - 1, 2, 4, C.wood); b.set(x, 20 - h - 2, C.white); b.set(x + 1, 20 - h - 1, C.white); }
  }
  b.rect(1, 20, 12, 1, C.white); b.rect(3, 21, 8, 1, C.silver);
  return { buf: b, ax: 7, ay: 20, shadow: { ox: 2, oy: 0, rx: 5, ry: 1 } };
}

function mound(v: number): PropArt {
  const b = mk(30, 12);
  shadedDisc(b, 10, 7, 8, 3.5, SNOW, 80 + v);
  shadedDisc(b, 19, 7, 7, 3, SNOW, 81 + v);
  rimBottom(b, C.stone);
  sparkle(b, 3, [C.white], C.ice, 5 + v);
  return { buf: b, ax: 15, ay: 9, shadow: { ox: 2, oy: 0, rx: 10, ry: 2 } };
}

const cache = new Map<string, PropArt>();
export function frostArt(kind: FrostKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) {
    a = (() => {
      switch (kind) {
        case 'fir': return firArt(v);
        case 'firsmall': return firSmall(v);
        case 'birch': return birch(v);
        case 'rock': return rock(v, false);
        case 'boulder': return rock(1, true);
        case 'icerock': return iceRock(v);
        case 'stump': return stump();
        case 'hut': return hut(v);
        case 'shanty': return shanty(v);
        case 'tent': return tent();
        case 'lamp': return lamp();
        case 'snowman': return snowman();
        case 'rack': return rack();
        case 'woodpile': return woodpile();
        case 'boat': return boat();
        case 'crate': return crate();
        case 'barrel': return barrel();
        case 'sign': return sign();
        case 'reeds': return reeds(v);
        case 'mound': return mound(v);
      }
    })();
    cache.set(key, a);
  }
  return a;
}
