/**
 * Gemalte Dinge von Harvest Hollow (Runde 16 / K1): Herbstbaeume, Scheune, Bauernhaus, Muehle, Heuballen, Kuerbisse,
 * Vogelscheuche, Maisstaude, Leiterwagen ... Gleiche Regeln wie `props.ts`: Licht oben links, drei Toene je Flaeche,
 * Umriss in der dunkelsten Flaechenfarbe, Schatten separat. Alles in Palettenfarben.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';

export type HollowKind =
  | 'maple' | 'oak' | 'birch' | 'fir' | 'willow' | 'apple' | 'bush' | 'rock' | 'boulder' | 'stump' | 'log'
  | 'barn' | 'farmhouse' | 'windmill' | 'haystack' | 'bale' | 'balestack' | 'pumpkin' | 'scarecrow' | 'cornshock' | 'wagon'
  | 'well' | 'lamp' | 'sign' | 'crate' | 'barrel' | 'cattail' | 'beehive' | 'basket' | 'dock' | 'boat' | 'coop';

const MAPLE: Tones[] = [
  { dark: C.rust, mid: C.orange, light: C.amber, hi: C.yellow },
  { dark: C.crimson, mid: C.red, light: C.orange, hi: C.amber },
  { dark: C.orange, mid: C.amber, light: C.yellow, hi: C.sand },
];
const OAKT: Tones = { dark: C.rust, mid: C.clay, light: C.amber, hi: C.yellow };
const GREEN: Tones = { dark: C.pine, mid: C.grass, light: C.leaf };
const GOLD: Tones = { dark: C.amber, mid: C.yellow, light: C.sand, hi: C.white };

/** Laubkrone aus ueberlappenden Scheiben, mit Licht oben links, Sprenkeln und Umriss. */
function crown(b: Buf, blobs: number[][], t: Tones, seed: number, outline: number): void {
  blobs.forEach(([x, y, rx, ry], i) => shadedDisc(b, x, y, rx, ry ?? rx - 1, t, seed + i));
  rimBottom(b, t.dark);
  sparkle(b, Math.floor(b.w * 0.9), [t.mid], t.light, seed + 5, (x, y) => x < b.w * 0.55 && y < b.h * 0.6);
  sparkle(b, Math.floor(b.w * 0.5), [t.mid, t.light], t.dark, seed + 9, (x, y) => y > b.h * 0.35);
  if (t.hi) sparkle(b, 8, [t.light], t.hi, seed + 13, (x, y) => x < b.w * 0.5 && y < b.h * 0.45);
  b.outline(outline);
}

function maple(v: number): PropArt {
  const b = mk(40, 46);
  const cx = 20;
  b.rect(cx - 2, 28, 5, 15, C.bark);
  b.rect(cx - 2, 28, 2, 15, C.wood);
  b.rect(cx + 2, 28, 1, 15, C.plum);
  b.set(cx - 4, 42, C.bark); b.set(cx + 4, 42, C.bark); b.set(cx - 3, 43, C.bark); b.set(cx + 3, 43, C.bark);
  b.line(cx, 30, cx - 8, 22, C.bark); b.line(cx, 28, cx + 8, 20, C.bark);
  const t = MAPLE[v % 3];
  crown(b, [[cx - 11, 23, 8], [cx + 11, 24, 8], [cx, 27, 9], [cx - 9, 14, 9], [cx + 10, 15, 9], [cx, 8, 10], [cx, 18, 11]], t, 11 + v * 5, t.dark === C.crimson ? C.plum : C.bark);
  return { buf: b, ax: cx, ay: 43, shadow: { ox: 5, oy: -1, rx: 16, ry: 5 } };
}

function oak(v: number): PropArt {
  const b = mk(52, 54);
  const cx = 26;
  b.rect(cx - 3, 34, 7, 18, C.bark);
  b.rect(cx - 3, 34, 3, 18, C.wood);
  b.rect(cx + 3, 34, 1, 18, C.plum);
  for (const [x, y] of [[-5, 51], [5, 51], [-6, 50], [6, 50]]) b.set(cx + x, y, C.bark);
  b.line(cx - 1, 36, cx - 12, 26, C.bark); b.line(cx + 1, 36, cx + 12, 26, C.bark);
  const t = v ? { dark: C.rust, mid: C.orange, light: C.amber, hi: C.yellow } : OAKT;
  crown(b, [[cx - 14, 28, 10], [cx + 14, 29, 10], [cx, 32, 11], [cx - 12, 17, 11], [cx + 13, 18, 11], [cx, 10, 12], [cx - 1, 21, 13], [cx - 6, 8, 8], [cx + 7, 9, 8]], t, 41 + v * 7, C.bark);
  // vereinzelt gruene Blaetter (Herbstanfang)
  sparkle(b, 14, [t.dark, t.mid], C.grass, 80 + v, (x, y) => y > 22);
  return { buf: b, ax: cx, ay: 52, shadow: { ox: 6, oy: -1, rx: 20, ry: 6 } };
}

function birch(v: number): PropArt {
  const b = mk(30, 46);
  const cx = 15;
  b.rect(cx - 1, 20, 3, 23, C.white);
  b.rect(cx + 1, 20, 1, 23, C.silver);
  for (const y of [24, 28, 33, 38]) { b.set(cx - 1, y, C.slate); b.set(cx, y + 1, C.slate); }
  b.set(cx - 2, 42, C.silver); b.set(cx + 2, 42, C.silver);
  const t = v ? GOLD : { dark: C.orange, mid: C.amber, light: C.yellow, hi: C.sand };
  crown(b, [[cx - 6, 21, 6, 6], [cx + 6, 21, 6, 6], [cx, 23, 7, 6], [cx - 5, 13, 7, 8], [cx + 6, 14, 6, 8], [cx, 8, 7, 7]], t, 51 + v * 3, C.orange);
  return { buf: b, ax: cx, ay: 43, shadow: { ox: 4, oy: -1, rx: 11, ry: 4 } };
}

/** Immergruene Tanne (dunkle Insel im Herbst). */
function fir(): PropArt {
  const b = mk(28, 48);
  const cx = 14;
  b.rect(cx - 1, 38, 3, 8, C.bark);
  b.rect(cx - 1, 38, 1, 8, C.wood);
  for (const [top, bot, hw] of [[30, 41, 11], [21, 33, 9], [12, 25, 7], [3, 16, 5]]) {
    for (let y = top; y <= bot; y++) {
      const f = (y - top) / (bot - top), half = Math.round(1 + f * hw);
      for (let x = -half; x <= half; x++) {
        const nx = x / (half + 0.5);
        const lit = -nx * 0.8 - (f - 0.4) * 0.7 + (bayer(cx + x, y) - 0.5) * 0.35 + (hash2(x, y, 4) - 0.5) * 0.2;
        b.set(cx + x, y, Math.abs(x) >= half && f > 0.15 && ((y + x) & 1) === 0 ? C.deep : lit > 0.3 ? C.grass : lit > -0.3 ? C.pine : C.deep);
      }
    }
    for (let x = -hw - 1; x <= hw + 1; x += 3) b.set(cx + x, bot + 1, C.deep);
  }
  rimBottom(b, C.deep);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 46, shadow: { ox: 5, oy: -1, rx: 10, ry: 4 } };
}

/** Trauerweide am Teich: hellgelbe Haengezweige. */
function willow(): PropArt {
  const b = mk(52, 52);
  const cx = 26;
  b.rect(cx - 3, 18, 6, 30, C.bark);
  b.rect(cx - 3, 18, 2, 30, C.wood);
  b.line(cx, 22, cx - 10, 12, C.bark); b.line(cx, 20, cx + 10, 10, C.bark);
  const t = GOLD;
  for (const [x, y, rx, ry] of [[cx - 12, 14, 10, 8], [cx + 12, 14, 10, 8], [cx, 10, 12, 9], [cx, 16, 14, 8]]) shadedDisc(b, x, y, rx, ry, t, 61 + x);
  // Haengezweige: Streifen, die nach unten laufen, leicht schwingend
  for (let x = cx - 20; x <= cx + 20; x += 2) {
    const len = 14 + Math.floor(hash2(x, 3, 71) * 14) - Math.floor(Math.abs(x - cx) / 4);
    for (let y = 20; y < 20 + len; y++) {
      const wob = Math.round(Math.sin(y / 4 + x) * 0.6);
      b.set(x + wob, y, y > 20 + len - 3 ? C.orange : hash2(x, y, 72) > 0.7 ? C.sand : y % 5 === 0 ? C.amber : C.yellow);
    }
  }
  b.outline(C.orange);
  return { buf: b, ax: cx, ay: 46, shadow: { ox: 6, oy: 0, rx: 18, ry: 5 } };
}

function apple(): PropArt {
  const b = mk(34, 38);
  const cx = 17;
  b.rect(cx - 2, 22, 4, 13, C.bark);
  b.rect(cx - 2, 22, 2, 13, C.wood);
  crown(b, [[cx - 8, 17, 7], [cx + 8, 17, 7], [cx, 20, 8], [cx - 5, 9, 8], [cx + 6, 10, 7], [cx, 6, 7]], GREEN, 91, C.deep);
  for (const [x, y] of [[8, 14], [24, 12], [14, 19], [20, 21], [10, 8], [26, 18], [17, 10]]) { b.set(x, y, C.red); b.set(x, y - 1, C.coral); }
  return { buf: b, ax: cx, ay: 36, shadow: { ox: 4, oy: -1, rx: 13, ry: 4 } };
}

function bush(v: number): PropArt {
  const b = mk(22, 18);
  const t = v === 1 ? MAPLE[1] : v === 2 ? { dark: C.rust, mid: C.orange, light: C.amber } : { dark: C.pine, mid: C.grass, light: C.leaf };
  shadedDisc(b, 6, 10, 5, 5, t, 3 + v);
  shadedDisc(b, 15, 10, 5, 5, t, 4 + v);
  shadedDisc(b, 11, 8, 7, 6, t, 5 + v);
  rimBottom(b, t.dark);
  const r = rng(150 + v);
  for (let i = 0; i < 6; i++) { const x = 5 + Math.floor(r() * 12), y = 4 + Math.floor(r() * 8); if (b.get(x, y)) b.set(x, y, v === 0 ? (i % 2 ? C.red : C.coral) : C.yellow); }
  b.outline(v === 0 ? C.deep : t.dark);
  return { buf: b, ax: 11, ay: 15, shadow: { ox: 3, oy: 0, rx: 9, ry: 3 } };
}

function rock(big: boolean, v: number): PropArt {
  const b = mk(big ? 30 : 18, big ? 24 : 14);
  const t: Tones = { dark: C.slate, mid: C.stone, light: C.silver, hi: C.white };
  if (big) { shadedDisc(b, 15, 13, 11, 8, t, 22); shadedDisc(b, 9, 14, 6, 5, t, 23); shadedDisc(b, 22, 15, 6, 5, t, 24); }
  else { shadedDisc(b, 8, 8, 6, 4, t, 25 + v); shadedDisc(b, 12, 9, 4, 3, t, 26 + v); }
  rimBottom(b, t.dark);
  b.each(big ? 11 : 6, big ? 8 : 5, big ? 5 : 3, big ? 2 : 1.3, (x, y) => { if (b.get(x, y) && bayer(x, y) < 0.6) b.set(x, y, (x + y) & 1 ? C.grass : C.leaf); });
  b.outline(C.night);
  return { buf: b, ax: big ? 15 : 9, ay: big ? 20 : 11, shadow: { ox: 3, oy: 0, rx: big ? 13 : 8, ry: big ? 4 : 3 } };
}

function stump(): PropArt {
  const b = mk(16, 14);
  b.ellipse(8, 8, 5, 3, C.wood); b.rect(4, 8, 9, 4, C.bark); b.rect(4, 8, 2, 4, C.wood);
  b.ellipse(8, 6, 5, 2.4, C.tan); b.ellipse(8, 6, 2.4, 1, C.wood);
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 12, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

function log(): PropArt {
  const b = mk(30, 14);
  b.rect(3, 4, 22, 7, C.wood); b.rect(3, 4, 22, 2, C.tan); b.rect(3, 10, 22, 1, C.bark);
  for (const x of [8, 14, 20]) b.set(x, 7, C.bark);
  b.ellipse(25, 7, 2, 3.4, C.tan); b.ellipse(25, 7, 1, 1.6, C.wood);
  b.ellipse(3, 7, 1.4, 3.4, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 14, ay: 11, shadow: { ox: 2, oy: 0, rx: 13, ry: 3 } };
}

// ------------------------------------------------------------------ Hof
/** Rote Scheune mit weissen Zierleisten, Gambrel-Dach, Heuboden-Luke. */
function barn(): PropArt {
  const W = 58, H = 50;
  const b = mk(W, H);
  const wl = 4, wr = W - 6, wallBot = H - 3, eave = 22;
  // Wand: senkrechte Bretter, Licht links
  for (let y = eave; y <= wallBot; y++) for (let x = wl; x <= wr; x++) {
    const k = (x - wl) % 3;
    let c = k === 0 ? C.red : k === 1 ? C.rust : C.crimson;
    if (x >= wr - 4) c = k === 0 ? C.rust : C.crimson;
    b.set(x, y, c);
  }
  b.rect(wl, wallBot - 2, wr - wl + 1, 3, C.stone);
  b.rect(wl, wallBot - 2, wr - wl + 1, 1, C.silver);
  // Tor mit weissem Rahmen und X
  const gx = 20, gw = 20, gt = eave + 6;
  b.rect(gx, gt, gw, wallBot - gt - 2, C.crimson);
  b.rect(gx + 1, gt + 1, gw - 2, wallBot - gt - 4, C.rust);
  for (const [x0, y0, x1, y1] of [[gx + 1, gt + 1, gx + gw / 2 - 1, wallBot - 4], [gx + gw / 2 - 1, gt + 1, gx + 1, wallBot - 4], [gx + gw / 2 + 1, gt + 1, gx + gw - 2, wallBot - 4], [gx + gw - 2, gt + 1, gx + gw / 2 + 1, wallBot - 4]]) b.line(x0, y0, x1, y1, C.sand);
  b.rect(gx, gt, gw, 1, C.white); b.rect(gx, wallBot - 3, gw, 1, C.white); b.rect(gx, gt, 1, wallBot - gt - 2, C.white); b.rect(gx + gw - 1, gt, 1, wallBot - gt - 2, C.silver);
  b.rect(gx + gw / 2, gt, 1, wallBot - gt - 2, C.white);
  // Heuboden-Luke
  b.rect(26, eave + 1, 8, 5, C.plum); b.rect(27, eave + 2, 6, 3, C.amber); b.rect(27, eave + 2, 3, 1, C.yellow);
  b.rect(25, eave, 10, 1, C.white);
  // Gambrel-Dach: unten steil, oben flach
  const half = (y: number): number => (y < 12 ? 11 + (y - 3) * 1.2 : 22 + (y - 12) * 0.8);
  for (let y = 3; y <= eave; y++) {
    const hw = Math.round(half(y));
    for (let x = W / 2 - hw; x <= W / 2 + hw; x++) {
      const fx = (x - (W / 2 - hw)) / (2 * hw);
      const lit = (1 - fx) * 0.9 - (y - 3) / (eave - 3) * 0.35 + (bayer(x, y) - 0.5) * 0.2;
      let c = lit > 0.5 ? C.stone : lit > 0.05 ? C.slate : C.dusk;
      if ((y - 3) % 3 === 2) c = C.dusk;
      else if ((y - 3) % 3 === 0 && (x + ((y / 3) | 0) * 2) % 5 === 0) c = C.dusk;
      b.set(x, y, c);
    }
  }
  b.rect(W / 2 - 11, 3, 23, 1, C.silver);
  b.rect(W / 2 - 23, eave, 47, 1, C.night);
  b.set(W / 2, 1, C.yellow); b.rect(W / 2, 1, 1, 3, C.bark); // Wetterfahne
  b.outline(C.plum);
  return { buf: b, ax: W / 2, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: 31, ry: 6 } };
}

function farmhouse(): PropArt {
  const W = 44, H = 44;
  const b = mk(W, H);
  const wl = 4, wr = W - 6, wallTop = 22, wallBot = H - 3;
  // Fachwerk-Putz
  b.rect(wl, wallTop, wr - wl + 1, wallBot - wallTop + 1, C.sand);
  b.rect(wr - 4, wallTop, 5, wallBot - wallTop + 1, C.tan);
  b.rect(wl, wallBot - 2, wr - wl + 1, 3, C.stone); b.rect(wl, wallBot - 2, wr - wl + 1, 1, C.silver);
  for (const x of [wl, wl + 11, wl + 22, wr - 5, wr]) b.rect(x, wallTop, 1, wallBot - wallTop - 2, C.bark);
  b.rect(wl, wallTop + 7, wr - wl + 1, 1, C.bark);
  b.line(wl + 1, wallTop + 7, wl + 10, wallTop + 1, C.bark);
  b.line(wl + 12, wallTop + 1, wl + 21, wallTop + 7, C.bark);
  // Tuer (gruen) und Fenster (warm)
  b.rect(wl + 14, wallBot - 12, 7, 11, C.plum); b.rect(wl + 15, wallBot - 11, 5, 10, C.pine); b.rect(wl + 15, wallBot - 11, 2, 10, C.grass); b.set(wl + 19, wallBot - 6, C.yellow);
  b.rect(wl + 3, wallBot - 12, 7, 7, C.bark); b.rect(wl + 4, wallBot - 11, 5, 5, C.amber); b.rect(wl + 4, wallBot - 11, 2, 2, C.yellow); b.rect(wl + 6, wallBot - 11, 1, 5, C.bark);
  b.rect(wl + 2, wallBot - 5, 9, 1, C.wood); b.set(wl + 3, wallBot - 6, C.orange); b.set(wl + 5, wallBot - 6, C.red); b.set(wl + 7, wallBot - 6, C.yellow);
  b.rect(wr - 12, wallBot - 12, 7, 7, C.bark); b.rect(wr - 11, wallBot - 11, 5, 5, C.amber); b.rect(wr - 11, wallBot - 11, 2, 2, C.yellow); b.rect(wr - 9, wallBot - 11, 1, 5, C.bark);
  // Kuerbis auf der Stufe
  b.rect(wl + 22, wallBot - 3, 4, 3, C.orange); b.set(wl + 22, wallBot - 3, C.amber); b.set(wl + 23, wallBot - 4, C.grass);
  // Walmdach in Herbstorange
  const R = { light: C.clay, mid: C.rust, dark: C.crimson };
  for (let y = 6; y <= wallTop; y++) {
    const f = (y - 6) / (wallTop - 6), l = Math.round(wl + 10 - f * 12), r = Math.round(wr - 10 + f * 12);
    for (let x = l; x <= r; x++) {
      const fx = (x - l) / Math.max(1, r - l);
      const lit = (1 - fx) * 0.9 - f * 0.4 + (bayer(x, y) - 0.5) * 0.25;
      let c = lit > 0.45 ? R.light : lit > 0 ? R.mid : R.dark;
      if ((y - 6) % 4 === 3) c = R.dark;
      b.set(x, y, c);
    }
  }
  b.rect(wl + 10, 6, wr - wl - 19, 1, C.orange);
  b.rect(wl - 2, wallTop, wr - wl + 5, 1, C.crimson);
  // Schornstein
  b.rect(wr - 16, 0, 5, 9, C.stone); b.rect(wr - 16, 0, 1, 9, C.silver); b.rect(wr - 12, 0, 1, 9, C.slate); b.rect(wr - 17, 0, 7, 1, C.slate);
  b.outline(C.plum);
  return { buf: b, ax: W / 2, ay: wallBot + 1, shadow: { ox: 8, oy: -1, rx: 24, ry: 5 }, hook: { x: wr - 14 - W / 2, y: -(wallBot + 1) } };
}

/** Windmuehle (Koerper): Fachwerkturm mit Steinsockel und Kuppelhaube. Die Fluegel liegen als bewegte Ebene darueber (Nabe = hook). */
export const MILL_HUB = { dx: 0, dy: -50 };
function windmill(): PropArt {
  const W = 44, H = 66;
  const b = mk(W, H);
  const cx = 22, top = 22, bot = 62;
  for (let y = top; y <= bot; y++) {
    const f = (y - top) / (bot - top), half = Math.round(8 + f * 9);
    for (let x = -half; x <= half; x++) {
      const nx = x / half;
      const lit = -nx * 0.7 + (bayer(cx + x, y) - 0.5) * 0.2;
      let c = lit > 0.3 ? C.sand : lit > -0.35 ? C.peach : C.tan;
      if (y > bot - 12) c = lit > 0.2 ? C.silver : lit > -0.35 ? C.stone : C.slate; // Steinsockel
      b.set(cx + x, y, c);
    }
  }
  // Fachwerkbalken
  for (let y = top; y <= bot - 12; y += 9) { const half = Math.round(8 + ((y - top) / (bot - top)) * 9); b.rect(cx - half, y, 2 * half + 1, 1, C.bark); }
  b.line(cx - 8, top + 1, cx - 11, top + 9, C.bark); b.line(cx + 8, top + 1, cx + 11, top + 9, C.bark);
  b.line(cx - 11, top + 10, cx + 12, top + 18, C.bark); b.line(cx + 11, top + 10, cx - 12, top + 18, C.bark);
  // Steinfugen im Sockel
  for (let y = bot - 12; y <= bot; y += 4) for (let x = -17; x <= 17; x += 5) if (b.get(cx + x, y)) b.set(cx + x + ((y / 4) % 2 ? 2 : 0), y, C.slate);
  // Tuer, Fenster
  b.rect(cx - 3, bot - 11, 7, 11, C.plum); b.rect(cx - 2, bot - 10, 5, 10, C.bark); b.rect(cx - 2, bot - 10, 2, 10, C.wood);
  b.rect(cx - 3, top + 20, 7, 6, C.bark); b.rect(cx - 2, top + 21, 5, 4, C.amber); b.rect(cx - 2, top + 21, 2, 2, C.yellow);
  // Kuppelhaube mit Balkon, die Nabe sitzt vorn
  for (let y = 6; y <= top; y++) {
    const f = (y - 6) / (top - 6), half = Math.round(2 + Math.sin(f * Math.PI * 0.5) * 9);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      const lit = -nx * 0.8 - (1 - f) * 0.1 + (bayer(cx + x, y) - 0.5) * 0.25;
      b.set(cx + x, y, lit > 0.3 ? C.clay : lit > -0.3 ? C.rust : C.crimson);
    }
  }
  b.rect(cx - 11, top, 23, 2, C.crimson); b.rect(cx - 11, top, 23, 1, C.rust);
  b.rect(cx - 12, top + 2, 25, 1, C.bark);
  b.set(cx, 5, C.yellow); b.rect(cx, 4, 1, 3, C.bark);
  // Nabe vorn
  b.disc(cx, top - 6, 3, C.bark); b.disc(cx, top - 6, 2, C.wood); b.set(cx - 1, top - 7, C.tan); b.set(cx, top - 6, C.yellow);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: bot + 1, shadow: { ox: 10, oy: -1, rx: 22, ry: 6 }, hook: { x: 0, y: top - 6 - (bot + 1) } };
}

/** Fluegelkreuz der Muehle, 8 Winkelstufen einer Vierteldrehung, 76 x 76, Nabe in der Mitte. */
export const MILL_STEPS_H = 8;
export function hollowBlades(step: number): Buf {
  const S = 76, b = mk(S, S);
  const cx = S / 2, cy = S / 2;
  const ang = (step / MILL_STEPS_H) * (Math.PI / 2) + 0.22;
  for (let k = 0; k < 4; k++) {
    const a = ang + (k * Math.PI) / 2, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
    for (let s = 3; s <= 33; s++) { b.set(cx + dx * s, cy + dy * s, C.bark); b.set(cx + dx * s + px * 0.6, cy + dy * s + py * 0.6, C.bark); }
    // Segeltuchrahmen: Holzrahmen mit Gitter, Tuch halb aufgezogen
    for (let s = 10; s <= 33; s++) for (let w = 1; w <= 7; w++) {
      const x = cx + dx * s + px * w, y = cy + dy * s + py * w;
      const edge = w === 7 || s === 33 || s === 10;
      b.set(x, y, edge ? C.wood : (s + w) % 5 === 0 ? C.tan : w < 3 ? C.white : C.sand);
    }
    for (const s of [16, 22, 28]) for (let w = 0; w <= 7; w++) b.set(cx + dx * s + px * w, cy + dy * s + py * w, C.wood);
  }
  b.disc(cx, cy, 3, C.wood); b.disc(cx, cy, 2, C.tan); b.set(cx, cy, C.yellow);
  b.outline(C.plum);
  return b;
}

function haystack(v: number): PropArt {
  const b = mk(26, 28);
  const cx = 13;
  for (let y = 2; y <= 24; y++) {
    const f = (y - 2) / 22, half = Math.round(1 + Math.sin(f * Math.PI * 0.5 + 0.05) * 10);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      const lit = -nx * 0.8 + (bayer(cx + x, y) - 0.5) * 0.3 + (hash2(x, y, 5 + v) - 0.5) * 0.3;
      let c = lit > 0.35 ? C.sand : lit > -0.25 ? C.yellow : C.amber;
      if (((x + y * 2) % 7 === 0 || (x * 2 - y) % 9 === 0) && hash2(x, y, 9) > 0.35) c = lit > 0.1 ? C.yellow : C.orange; // Halme
      b.set(cx + x, y, c);
    }
  }
  for (const y of [11, 18]) b.rect(cx - Math.round(1 + Math.sin(((y - 2) / 22) * Math.PI * 0.5) * 10), y, 2 * Math.round(1 + Math.sin(((y - 2) / 22) * Math.PI * 0.5) * 10) + 1, 1, C.bark);
  b.rect(cx - 11, 24, 23, 1, C.orange);
  b.set(cx, 1, C.sand); b.set(cx + 1, 0, C.amber);
  b.outline(C.orange);
  return { buf: b, ax: cx, ay: 25, shadow: { ox: 4, oy: 0, rx: 12, ry: 3 } };
}

/** Runder Heuballen von der Seite: konzentrische Ringe, Folienband bei v1. */
function bale(v: number): PropArt {
  const b = mk(20, 18);
  b.disc(10, 9, 7, v ? C.silver : C.amber);
  b.disc(10, 9, 6, v ? C.white : C.yellow);
  for (const [r, c] of [[4.6, v ? C.silver : C.amber], [3.2, v ? C.white : C.sand], [1.8, v ? C.stone : C.orange]] as const) { b.disc(10, 9, r, c); }
  b.set(10, 9, C.bark);
  b.each(7, 6, 3, 2, (x, y) => { if (b.get(x, y) === (v ? C.silver : C.amber) && bayer(x, y) < 0.5) b.set(x, y, v ? C.white : C.yellow); });
  b.outline(v ? C.slate : C.orange);
  return { buf: b, ax: 10, ay: 15, shadow: { ox: 3, oy: 0, rx: 8, ry: 3 } };
}

function balestack(): PropArt {
  const b = mk(30, 24);
  const bl = (x: number, y: number): void => {
    b.rect(x, y, 12, 7, C.yellow); b.rect(x, y, 12, 2, C.sand); b.rect(x, y, 12, 1, C.white); b.rect(x + 10, y + 2, 2, 5, C.amber); b.rect(x, y + 6, 12, 1, C.amber);
    b.rect(x + 4, y, 1, 7, C.bark); b.rect(x + 8, y, 1, 7, C.bark);
    b.set(x + 1, y + 3, C.amber); b.set(x + 6, y + 4, C.orange); b.set(x + 2, y + 5, C.sand);
  };
  bl(2, 14); bl(15, 14); bl(8, 7);
  b.outline(C.orange);
  return { buf: b, ax: 15, ay: 21, shadow: { ox: 3, oy: 0, rx: 14, ry: 3 } };
}

function pumpkin(v: number): PropArt {
  const b = mk(30, 20);
  const one = (cx: number, cy: number, rx: number, ry: number): void => {
    b.ellipse(cx, cy, rx, ry, C.rust);
    b.ellipse(cx - 1, cy - 1, rx - 1, ry - 0.6, C.orange);
    b.ellipse(cx - 2, cy - 2, Math.max(1, rx - 3), Math.max(1, ry - 2), C.amber);
    for (const k of [-0.5, 0.5]) b.line(cx + Math.round(k * rx * 0.9), cy - ry + 1, cx + Math.round(k * rx * 0.9), cy + ry - 1, C.rust);
    b.line(cx, cy - ry + 1, cx, cy + ry - 1, C.rust);
    b.rect(cx - 1, cy - ry - 1, 2, 2, C.pine); b.set(cx - 1, cy - ry - 2, C.grass); b.set(cx + 1, cy - ry - 2, C.grass);
    b.set(cx - 3, cy - 2, C.yellow);
  };
  if (v === 1) { one(8, 13, 6, 4.5); one(21, 12, 5, 4); one(15, 8, 5, 4); }
  else if (v === 2) { one(15, 11, 9, 7); }
  else { one(9, 12, 5, 4); one(19, 12, 6, 4.6); }
  b.line(2, 17, 12, 18, C.grass); b.line(12, 18, 20, 16, C.grass); b.set(24, 16, C.leaf);
  b.outline(C.crimson);
  return { buf: b, ax: 15, ay: 16, shadow: { ox: 2, oy: 0, rx: 12, ry: 3 } };
}

function scarecrow(): PropArt {
  const b = mk(28, 38);
  b.rect(13, 12, 2, 24, C.bark); b.rect(13, 12, 1, 24, C.wood);
  b.rect(4, 17, 20, 2, C.bark); b.rect(4, 17, 20, 1, C.wood);
  // Hemd (rot-schwarz kariert) und Koerper aus Stroh
  for (let y = 14; y <= 27; y++) for (let x = 8; x <= 19; x++) b.set(x, y, ((x >> 1) + (y >> 1)) % 2 ? C.red : C.crimson);
  b.rect(8, 14, 12, 1, C.coral);
  for (const x of [3, 4, 23, 24]) for (let y = 18; y <= 22; y++) b.set(x, y, hash2(x, y, 3) > 0.4 ? C.yellow : C.amber);
  for (let x = 9; x <= 18; x += 3) b.set(x, 28, C.yellow);
  // Kopf: Sack mit Naht, Augen, Strohhut
  b.disc(14, 8, 4, C.sand); b.disc(14, 9, 3, C.peach);
  b.set(12, 8, C.ink); b.set(16, 8, C.ink); b.rect(12, 11, 5, 1, C.ink); b.set(13, 11, C.sand); b.set(15, 11, C.sand);
  b.rect(7, 5, 16, 2, C.yellow); b.rect(7, 5, 16, 1, C.sand); b.rect(10, 1, 9, 5, C.amber); b.rect(10, 1, 9, 1, C.yellow); b.rect(10, 4, 9, 1, C.bark);
  b.set(8, 7, C.amber); b.set(22, 7, C.amber);
  b.outline(C.plum);
  return { buf: b, ax: 14, ay: 36, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 } };
}

function cornshock(v: number): PropArt {
  const b = mk(22, 28);
  const r = rng(220 + v);
  for (let i = 0; i < 9; i++) {
    const lean = (i - 4) * 0.9, h = 20 + Math.floor(r() * 4);
    for (let y = 0; y < h; y++) b.set(Math.round(11 + lean * (y / h) * 1.6 - lean * 0.2 * 0), 25 - y, y > h - 5 ? C.yellow : y % 4 === 0 ? C.sand : C.tan);
    // Blaetter
    const ly = 25 - Math.floor(h * 0.6);
    for (let k = 1; k <= 3; k++) { b.set(Math.round(11 + lean * 0.9) - k * (i % 2 ? 1 : -1), ly - k + 3, C.yellow); }
  }
  b.rect(8, 17, 7, 1, C.bark); b.rect(8, 18, 7, 1, C.wood);
  // Kolben
  b.rect(8, 12, 2, 4, C.amber); b.set(8, 12, C.yellow); b.rect(13, 11, 2, 4, C.amber); b.set(13, 11, C.yellow);
  b.outline(C.orange);
  return { buf: b, ax: 11, ay: 25, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 } };
}

function wagon(): PropArt {
  const b = mk(40, 28);
  b.rect(5, 10, 28, 8, C.wood); b.rect(5, 10, 28, 1, C.tan); b.rect(5, 17, 28, 1, C.bark);
  for (let x = 8; x < 33; x += 4) b.rect(x, 11, 1, 6, C.bark);
  b.ellipse(19, 9, 13, 5, C.yellow); b.ellipse(16, 7, 8, 2.4, C.sand);
  for (const [x, y] of [[9, 8], [22, 7], [27, 9], [14, 9], [30, 10]]) b.set(x, y, C.amber);
  b.line(33, 14, 39, 10, C.bark); b.line(33, 15, 39, 11, C.bark);
  for (const wx of [10, 27]) { b.disc(wx, 20, 5, C.bark); b.disc(wx, 20, 4, C.wood); b.disc(wx, 20, 1, C.bark); b.line(wx - 4, 20, wx + 4, 20, C.bark); b.line(wx, 16, wx, 24, C.bark); }
  b.outline(C.plum);
  return { buf: b, ax: 20, ay: 24, shadow: { ox: 4, oy: 0, rx: 17, ry: 3 } };
}

function well(): PropArt {
  const b = mk(24, 28);
  b.rect(4, 1, 16, 2, C.rust); b.rect(3, 3, 18, 2, C.clay);
  b.rect(5, 5, 1, 10, C.bark); b.rect(18, 5, 1, 10, C.bark);
  b.ellipse(12, 18, 9, 5, C.slate); b.ellipse(12, 17, 8, 4, C.stone); b.ellipse(12, 16, 6, 2.6, C.navy);
  b.rect(4, 18, 16, 5, C.stone); b.rect(4, 18, 5, 5, C.silver); b.rect(16, 18, 4, 5, C.slate);
  for (const y of [19, 21]) for (let x = 4; x < 20; x += 4) b.set(x + (y % 4 ? 1 : 3), y, C.slate);
  b.line(12, 5, 12, 13, C.tan); b.rect(11, 13, 3, 2, C.wood);
  b.outline(C.night);
  return { buf: b, ax: 12, ay: 24, shadow: { ox: 4, oy: 0, rx: 11, ry: 4 } };
}

/** Laternenpfahl aus Holz mit Papierlaterne. */
function lamp(): PropArt {
  const b = mk(14, 30);
  b.rect(6, 8, 2, 20, C.bark); b.rect(6, 8, 1, 20, C.wood);
  b.rect(4, 26, 6, 2, C.stone); b.rect(4, 26, 6, 1, C.silver);
  b.rect(3, 5, 8, 1, C.bark); b.line(7, 8, 3, 5, C.bark);
  b.rect(8, 6, 1, 2, C.bark);
  b.rect(8, 8, 5, 6, C.rust); b.rect(9, 9, 3, 4, C.amber); b.rect(9, 9, 1, 2, C.yellow); b.set(10, 10, C.white);
  b.rect(8, 7, 5, 1, C.crimson); b.rect(8, 14, 5, 1, C.crimson);
  b.outline(C.plum);
  return { buf: b, ax: 7, ay: 28, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 3, y: -18 } };
}

function sign(): PropArt {
  const b = mk(24, 24);
  b.rect(11, 6, 2, 16, C.bark); b.rect(11, 6, 1, 16, C.wood);
  b.rect(2, 3, 18, 7, C.wood); b.rect(2, 3, 18, 1, C.tan); b.rect(2, 9, 18, 1, C.bark);
  b.rect(4, 5, 5, 1, C.bark); b.rect(4, 7, 9, 1, C.bark);
  b.rect(15, 5, 3, 3, C.orange); b.set(15, 5, C.amber); b.set(16, 4, C.grass);
  b.outline(C.plum);
  return { buf: b, ax: 12, ay: 22, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 } };
}

function crate(v: number): PropArt {
  const b = mk(18, 16);
  b.rect(2, 5, 12, 9, C.wood); b.rect(2, 5, 12, 1, C.tan); b.rect(2, 5, 1, 9, C.tan);
  b.line(3, 6, 12, 13, C.bark); b.line(12, 6, 3, 13, C.bark); b.rect(13, 6, 1, 8, C.bark);
  if (v === 1) { for (const [x, y] of [[4, 3], [8, 2], [11, 3], [6, 4]]) { b.rect(x, y, 3, 2, C.orange); b.set(x, y, C.amber); } }
  if (v === 2) { for (const [x, y] of [[4, 3], [8, 3], [11, 4], [6, 4]]) { b.rect(x, y, 2, 2, C.red); b.set(x, y, C.coral); } }
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 14, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 } };
}

function barrel(): PropArt {
  const b = mk(14, 16);
  b.rect(2, 3, 9, 11, C.wood); b.rect(2, 3, 2, 11, C.tan); b.rect(9, 3, 2, 11, C.bark);
  b.rect(2, 5, 9, 1, C.slate); b.rect(2, 11, 9, 1, C.slate); b.rect(3, 2, 7, 1, C.tan);
  b.outline(C.plum);
  return { buf: b, ax: 6, ay: 14, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

function cattail(v: number): PropArt {
  const b = mk(16, 26);
  const r = rng(300 + v);
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 2 + Math.floor(r() * 2), h = 12 + Math.floor(r() * 10);
    for (let y = 0; y < h; y++) b.set(x + Math.round(Math.sin(y / 3.5 + i) * 0.9), 24 - y, i % 2 ? C.grass : C.leaf);
    if (i % 2 === 0) { b.rect(x + 0, 24 - h - 2, 2, 5, C.bark); b.set(x, 24 - h - 3, C.wood); b.set(x + 1, 24 - h - 2, C.wood); }
  }
  b.rect(1, 24, 14, 1, C.pine);
  return { buf: b, ax: 8, ay: 24, shadow: { ox: 2, oy: 0, rx: 5, ry: 1 } };
}

function beehive(): PropArt {
  const b = mk(14, 16);
  for (let y = 2; y <= 12; y++) { const half = Math.round(2 + Math.sin(((y - 2) / 10) * Math.PI * 0.55) * 4); for (let x = -half; x <= half; x++) b.set(7 + x, y, ((y - 2) % 3 === 2) ? C.amber : x < -half / 2 ? C.sand : C.yellow); }
  b.rect(5, 10, 4, 3, C.plum); b.set(2, 9, C.ink); b.set(11, 6, C.ink);
  b.rect(3, 13, 8, 1, C.wood);
  b.outline(C.orange);
  return { buf: b, ax: 7, ay: 14, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function basket(): PropArt {
  const b = mk(16, 14);
  b.ellipse(8, 9, 6, 3.4, C.wood); b.rect(2, 7, 13, 5, C.wood);
  for (let x = 2; x < 15; x += 2) { b.set(x, 8, C.tan); b.set(x + 1, 10, C.bark); }
  b.rect(2, 7, 13, 1, C.tan);
  for (const [x, y] of [[4, 5], [7, 4], [10, 5], [12, 6], [6, 6]]) { b.disc(x, y, 1.6, C.red); b.set(x - 1, y - 1, C.coral); }
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 12, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

function coop(): PropArt {
  const b = mk(30, 28);
  b.rect(3, 11, 20, 12, C.wood); b.rect(3, 11, 20, 1, C.tan);
  for (let x = 4; x < 23; x += 3) b.rect(x, 12, 1, 11, C.bark);
  b.rect(10, 15, 6, 7, C.plum); b.rect(11, 16, 4, 6, C.bark);
  for (let y = 3; y <= 11; y++) for (let x = 1; x <= 25; x++) { const f = (y - 3) / 8; if (x >= 4 - f * 3 && x <= 22 + f * 3) b.set(x, y, (y - 3) % 3 === 2 ? C.crimson : x < 12 ? C.clay : C.rust); }
  b.rect(23, 17, 6, 6, C.bark); b.line(23, 17, 28, 22, C.wood);
  b.set(25, 14, C.white); b.rect(24, 15, 2, 2, C.white); b.set(26, 14, C.red); b.set(24, 17, C.amber);
  b.outline(C.plum);
  return { buf: b, ax: 14, ay: 23, shadow: { ox: 4, oy: 0, rx: 14, ry: 3 } };
}

/** Holzsteg in den Teich (Wasserseite unten, 10 px breit, 24 px lang); haengt an der Uferkante. */
function dock(): PropArt {
  const b = mk(16, 36);
  for (let y = 2; y <= 32; y++) for (let x = 3; x <= 12; x++) {
    const sep = y % 3 === 2;
    b.set(x, y, sep ? C.bark : (Math.floor(y / 3) % 2 ? C.wood : C.tan));
    if (x === 3) b.set(x, y, C.bark);
    if (x === 12) b.set(x, y, C.plum);
  }
  for (const y of [4, 18, 31]) for (const x of [2, 12]) { b.rect(x, y - 3, 2, 5, C.bark); b.set(x, y - 3, C.tan); }
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 3, shadow: { ox: 3, oy: 14, rx: 6, ry: 11 } };
}

function boat(): PropArt {
  const b = mk(26, 14);
  for (let x = 2; x < 24; x++) {
    const t = (x - 2) / 21, sag = Math.round(Math.sin(t * Math.PI) * 3), top = 4 - Math.round(Math.sin(t * Math.PI) * 1);
    for (let y = top; y < 8 + sag; y++) b.set(x, y, y === top ? C.tan : y > 5 + sag ? C.bark : C.wood);
  }
  b.rect(4, 4, 18, 1, C.peach); b.rect(8, 5, 1, 2, C.bark); b.rect(16, 5, 1, 2, C.bark);
  b.line(6, 3, 18, 0, C.tan);
  b.outline(C.plum);
  return { buf: b, ax: 13, ay: 10, shadow: { ox: 2, oy: 0, rx: 11, ry: 2 } };
}

const cache = new Map<string, PropArt>();
export function hollowArt(kind: HollowKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) { a = build(kind, v); cache.set(key, a); }
  return a;
}
function build(kind: HollowKind, v: number): PropArt {
  switch (kind) {
    case 'maple': return maple(v);
    case 'oak': return oak(v);
    case 'birch': return birch(v);
    case 'fir': return fir();
    case 'willow': return willow();
    case 'apple': return apple();
    case 'bush': return bush(v);
    case 'rock': return rock(false, v);
    case 'boulder': return rock(true, v);
    case 'stump': return stump();
    case 'log': return log();
    case 'barn': return barn();
    case 'farmhouse': return farmhouse();
    case 'windmill': return windmill();
    case 'haystack': return haystack(v);
    case 'bale': return bale(v);
    case 'balestack': return balestack();
    case 'pumpkin': return pumpkin(v);
    case 'scarecrow': return scarecrow();
    case 'cornshock': return cornshock(v);
    case 'wagon': return wagon();
    case 'well': return well();
    case 'lamp': return lamp();
    case 'sign': return sign();
    case 'crate': return crate(v);
    case 'barrel': return barrel();
    case 'cattail': return cattail(v);
    case 'beehive': return beehive();
    case 'basket': return basket();
    case 'dock': return dock();
    case 'boat': return boat();
    case 'coop': return coop();
  }
}
