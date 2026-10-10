/**
 * Gemalte Dinge von Mistwood Marsh (Runde 16 / K1): Sumpfzypressen mit Haengemoos, tote Baeume, Mangroven, Pfahlhuette,
 * Steglaternen, Leuchtpilze, Reiher, Totempfahl, Boot ... Gleiche Regeln wie `props.ts`: Licht oben links, drei Toene je
 * Flaeche, Umriss in der dunkelsten Flaechenfarbe, Schatten separat. Kuehle Toene (deep/pine/dusk), warme Lichtpunkte.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';

export type MarshKind =
  | 'cypress' | 'dead' | 'mangrove' | 'sbush' | 'reeds' | 'hut' | 'lantern' | 'mushroom' | 'mosslog' | 'rock' | 'stump' | 'boat'
  | 'heron' | 'totem' | 'fern' | 'bones';

const LEAF: Tones = { dark: C.deep, mid: C.pine, light: C.grass, hi: C.leaf };

/** Haengemoos: Straehnen, die von den untersten Kronenpixeln nach unten schwingen. */
function moss(b: Buf, x0: number, x1: number, y: number, seed: number, maxLen = 14): void {
  for (let x = x0; x <= x1; x += 2) {
    if (!b.get(x, y - 1) && !b.get(x, y)) continue;
    const len = 4 + Math.floor(hash2(x, seed, 3) * maxLen);
    for (let k = 0; k < len; k++) {
      const wob = Math.round(Math.sin(k / 3 + x) * 0.8);
      b.under(x + wob, y + k, k > len - 3 ? C.deep : hash2(x, k, seed) > 0.6 ? C.leaf : C.grass);
    }
  }
}

function cypress(v: number): PropArt {
  const W = 54, H = 64;
  const b = mk(W, H);
  const cx = 27;
  // Stamm: unten breit (Stuetzwurzeln), nach oben schmal
  for (let y = 26; y <= 58; y++) {
    const f = (y - 26) / 32, half = Math.round(2 + f * f * 6);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5), lit = -nx * 0.8 + (bayer(cx + x, y) - 0.5) * 0.3;
      b.set(cx + x, y, lit > 0.3 ? C.wood : lit > -0.3 ? C.bark : C.plum);
    }
  }
  // Knie (Atemwurzeln) rund um den Fuss
  for (const dx of [-12, -8, 8, 12, 15]) { const h = 3 + Math.floor(hash2(dx, v, 9) * 4); b.rect(cx + dx, 58 - h, 2, h, C.bark); b.set(cx + dx, 58 - h, C.wood); }
  b.line(cx - 8, 57, cx - 14, 60, C.bark); b.line(cx + 8, 57, cx + 14, 60, C.bark);
  // Krone: flache, dichte Schirme in Stufen
  const tops: [number, number, number, number][] = v ? [[cx - 12, 22, 12, 6], [cx + 12, 20, 12, 6], [cx, 14, 15, 7], [cx - 6, 7, 10, 5], [cx + 7, 6, 9, 5]] : [[cx - 13, 24, 11, 6], [cx + 12, 22, 12, 6], [cx, 15, 16, 7], [cx - 7, 9, 9, 5], [cx + 6, 5, 10, 5]];
  tops.forEach(([x, y, rx, ry], i) => shadedDisc(b, x, y, rx, ry, LEAF, 31 + i + v * 7));
  rimBottom(b, C.deep);
  sparkle(b, 22, [C.pine], C.grass, 71 + v, (x, y) => x < cx + 6 && y < 22);
  sparkle(b, 16, [C.grass], C.leaf, 72 + v, (x, y) => x < cx && y < 14);
  moss(b, cx - 24, cx + 24, 27, 5 + v, 16);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 60, shadow: { ox: 6, oy: 0, rx: 18, ry: 5 } };
}

function dead(v: number): PropArt {
  const W = 40, H = 56;
  const b = mk(W, H);
  const cx = 20;
  const tone = (lit: number): number => (lit > 0.3 ? C.stone : lit > -0.3 ? C.slate : C.dusk);
  for (let y = 22; y <= 52; y++) {
    const f = (y - 22) / 30, half = Math.round(1.5 + f * 3.5);
    for (let x = -half; x <= half; x++) b.set(cx + x + Math.round(Math.sin(y / 6 + v) * 1.4), y, tone(-(x / (half + 0.5)) * 0.8 + (bayer(x, y) - 0.5) * 0.3));
  }
  // Aeste: verzweigt, kahl
  const limbs: [number, number, number, number][] = v
    ? [[cx, 30, cx - 14, 14], [cx, 26, cx + 12, 8], [cx - 8, 20, cx - 16, 6], [cx + 6, 16, cx + 9, 1], [cx, 36, cx + 13, 28], [cx - 14, 14, cx - 18, 10]]
    : [[cx, 28, cx - 12, 12], [cx, 24, cx + 14, 12], [cx + 8, 16, cx + 6, 1], [cx - 8, 18, cx - 14, 3], [cx, 36, cx - 12, 32], [cx + 14, 12, cx + 17, 6]];
  for (const [x0, y0, x1, y1] of limbs) { b.line(x0, y0, x1, y1, C.slate); b.line(x0 + 1, y0, x1 + 1, y1, C.stone); }
  b.rect(cx - 5, 49, 11, 3, C.dusk); b.set(cx - 7, 52, C.dusk); b.set(cx + 7, 52, C.dusk);
  // Haengemoos an den Aesten
  for (const [, , x1, y1] of limbs) for (let k = 0; k < 7 + (x1 & 3) * 2; k++) b.under(x1 + Math.round(Math.sin(k / 2) * 0.8), y1 + 2 + k, k % 3 === 2 ? C.deep : C.grass);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: 52, shadow: { ox: 4, oy: 0, rx: 11, ry: 3 } };
}

function mangrove(): PropArt {
  const W = 50, H = 46;
  const b = mk(W, H);
  const cx = 25;
  // Stelzwurzeln: Boegen vom Stamm ins Wasser
  for (const dx of [-17, -11, -5, 5, 11, 17]) {
    b.line(cx + dx * 0.3, 22, cx + dx * 0.7, 30, C.bark);
    b.line(cx + dx * 0.7, 30, cx + dx, 42, C.bark); b.line(cx + dx * 0.7 + 1, 30, cx + dx + 1, 42, C.wood);
  }
  b.rect(cx - 3, 14, 7, 12, C.bark); b.rect(cx - 3, 14, 3, 12, C.wood);
  shadedDisc(b, cx - 10, 14, 10, 7, LEAF, 81); shadedDisc(b, cx + 10, 14, 10, 7, LEAF, 82); shadedDisc(b, cx, 9, 13, 8, LEAF, 83); shadedDisc(b, cx, 17, 11, 5, LEAF, 84);
  rimBottom(b, C.deep);
  sparkle(b, 18, [C.pine], C.grass, 85, (x, y) => x < cx && y < 14);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 42, shadow: { ox: 4, oy: 0, rx: 18, ry: 4 } };
}

function sbush(v: number): PropArt {
  const b = mk(24, 18);
  shadedDisc(b, 7, 10, 6, 5, LEAF, 91 + v); shadedDisc(b, 16, 10, 6, 5, LEAF, 92 + v); shadedDisc(b, 11, 8, 8, 6, LEAF, 93 + v);
  rimBottom(b, C.deep);
  const r = rng(190 + v);
  for (let i = 0; i < 6; i++) { const x = 4 + Math.floor(r() * 16), y = 3 + Math.floor(r() * 9); if (b.get(x, y)) { b.set(x, y, i % 2 ? C.orchid : C.coral); b.set(x, y - 1, C.white); } }
  b.outline(C.deep);
  return { buf: b, ax: 12, ay: 15, shadow: { ox: 3, oy: 0, rx: 10, ry: 3 } };
}

function fern(v: number): PropArt {
  const b = mk(20, 14);
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.42 + (v ? 0.1 : 0);
    for (let s = 1; s <= 8; s++) { const x = 10 + Math.cos(a) * s, y = 12 + Math.sin(a) * s * 0.9 + (s * s) / 40; b.set(x, y, s > 5 ? C.leaf : C.grass); if (s % 2) { b.set(x + 1, y, C.pine); b.set(x - 1, y, C.pine); } }
  }
  b.set(10, 12, C.deep); b.set(9, 12, C.deep);
  return { buf: b, ax: 10, ay: 12, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

/** Schilf und Rohrkolben, hoch und dicht. */
function reeds(v: number): PropArt {
  const b = mk(22, 34);
  const r = rng(300 + v);
  for (let i = 0; i < 8; i++) {
    const x = 2 + i * 2 + Math.floor(r() * 2), h = 14 + Math.floor(r() * 14);
    const lean = (i - 3.5) * 0.12;
    for (let y = 0; y < h; y++) b.set(x + Math.round(Math.sin(y / 4 + i) * 0.9 + lean * y), 31 - y, i % 3 === 0 ? C.leaf : i % 3 === 1 ? C.grass : C.pine);
    if (i % 2 === 0) { const tx = x + Math.round(lean * h); b.rect(tx, 31 - h - 3, 2, 5, C.bark); b.set(tx, 31 - h - 4, C.wood); b.set(tx + 1, 31 - h - 3, C.wood); }
  }
  b.rect(1, 31, 20, 1, C.deep);
  return { buf: b, ax: 11, ay: 31, shadow: { ox: 2, oy: 0, rx: 6, ry: 1 } };
}

/** Pfahlhuette: Plattform auf Stelzen, Strohdach mit Moos, warmes Fenster, Leiter, Ofenrohr. */
function hut(): PropArt {
  const W = 60, H = 64;
  const b = mk(W, H);
  const cx = 30;
  // Stelzen und Plattform
  for (const x of [8, 18, 40, 50]) { b.rect(x, 40, 3, 22, C.bark); b.rect(x, 40, 1, 22, C.wood); b.set(x, 61, C.deep); b.set(x + 2, 62, C.deep); }
  b.line(8, 44, 18, 56, C.bark); b.line(50, 44, 40, 56, C.bark); b.line(18, 44, 8, 56, C.bark); b.line(40, 44, 50, 56, C.bark);
  b.rect(4, 38, 52, 4, C.wood); b.rect(4, 38, 52, 1, C.tan); b.rect(4, 41, 52, 1, C.bark);
  for (let x = 6; x < 54; x += 4) b.set(x, 39, C.bark);
  // Huette: Bretterwand
  for (let y = 22; y <= 38; y++) for (let x = 12; x <= 48; x++) {
    const k = (x - 12) % 4;
    b.set(x, y, x >= 44 ? (k === 0 ? C.bark : C.plum) : k === 0 ? C.tan : k === 3 ? C.bark : C.wood);
  }
  b.rect(30, 26, 8, 12, C.plum); b.rect(31, 27, 6, 11, C.bark); b.rect(31, 27, 2, 11, C.wood); b.set(35, 33, C.yellow);
  b.rect(16, 27, 9, 8, C.bark); b.rect(17, 28, 7, 6, C.amber); b.rect(17, 28, 3, 3, C.yellow); b.rect(20, 28, 1, 6, C.bark); b.set(17, 28, C.white);
  // Strohdach mit Moos
  for (let y = 6; y <= 24; y++) {
    const f = (y - 6) / 18, half = Math.round(8 + f * 20);
    for (let x = -half; x <= half; x++) {
      const nx = x / half, lit = -nx * 0.7 - f * 0.2 + (bayer(cx + x, y) - 0.5) * 0.3;
      let c = lit > 0.25 ? C.sand : lit > -0.2 ? C.tan : C.wood;
      if ((y + ((x + half) >> 2)) % 4 === 0) c = c === C.sand ? C.tan : C.bark;
      if (hash2(x, y, 4) > 0.86 && y < 16) c = lit > 0 ? C.grass : C.pine;
      b.set(cx + x, y, c);
    }
  }
  for (let x = cx - 28; x <= cx + 28; x += 2) { const len = 2 + Math.floor(hash2(x, 1, 6) * 3); for (let k = 0; k < len; k++) b.under(x, 25 + k, hash2(x, k, 2) > 0.5 ? C.tan : C.wood); }
  b.rect(cx + 10, 0, 5, 10, C.slate); b.rect(cx + 10, 0, 1, 10, C.stone); b.rect(cx + 9, 0, 7, 1, C.stone); // Ofenrohr
  // Leiter und Laterne
  b.rect(52, 41, 1, 21, C.bark); b.rect(56, 41, 1, 21, C.bark); for (let y = 44; y < 62; y += 4) b.rect(52, y, 5, 1, C.wood);
  b.rect(10, 34, 1, 3, C.bark); b.rect(8, 37, 5, 4, C.amber); b.rect(9, 36, 3, 1, C.bark); b.set(9, 38, C.yellow); b.set(10, 38, C.white);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: 62, shadow: { ox: 8, oy: 0, rx: 28, ry: 5 }, hook: { x: 12, y: -62 } };
}

/** Stegleuchte: Pfahl mit Aufsatz, haengender Laterne und Schilfbuendel. */
function lantern(): PropArt {
  const b = mk(14, 34);
  b.rect(6, 8, 2, 24, C.bark); b.rect(6, 8, 1, 24, C.wood);
  b.rect(5, 30, 4, 2, C.slate); b.rect(2, 7, 7, 1, C.bark); b.set(2, 8, C.bark);
  b.rect(1, 8, 1, 2, C.tan);
  b.rect(0, 10, 5, 7, C.night); b.rect(1, 11, 3, 5, C.amber); b.rect(1, 11, 2, 3, C.yellow); b.set(1, 11, C.white);
  b.rect(0, 9, 5, 1, C.slate);
  b.rect(8, 22, 3, 6, C.grass); b.set(9, 21, C.leaf); b.set(10, 23, C.leaf);
  b.outline(C.ink);
  return { buf: b, ax: 7, ay: 32, shadow: { ox: 2, oy: 0, rx: 5, ry: 2 }, hook: { x: -4, y: -20 } };
}

/** Leuchtpilze: Kappen in Orchidee/Coral/Eis mit weissen Punkten; v0 Orchidee, v1 Eis, v2 Coral. */
function mushroom(v: number): PropArt {
  const b = mk(20, 16);
  const cap = [C.orchid, C.ice, C.coral][v % 3], capD = [C.violet, C.sky, C.red][v % 3];
  const one = (cx: number, base: number, rx: number, h: number): void => {
    b.rect(cx - 1, base - h, 2, h, C.sand); b.set(cx - 1, base - h, C.white);
    b.ellipse(cx, base - h, rx, rx * 0.55, capD);
    b.ellipse(cx - 0.5, base - h - 0.5, rx - 0.6, rx * 0.5 - 0.3, cap);
    b.set(cx - 1, base - h - 1, C.white); b.set(cx + 2, base - h, C.white);
  };
  one(6, 14, 5, 6); one(14, 14, 3.4, 4); one(10, 15, 2.4, 3);
  b.outline(C.night);
  return { buf: b, ax: 10, ay: 14, shadow: { ox: 2, oy: 0, rx: 8, ry: 2 }, hook: { x: 0, y: -8 } };
}

function mosslog(): PropArt {
  const b = mk(40, 16);
  b.rect(3, 5, 30, 7, C.bark); b.rect(3, 5, 30, 2, C.wood); b.rect(3, 11, 30, 1, C.plum);
  b.ellipse(33, 8, 2, 3.6, C.wood); b.ellipse(33, 8, 1, 1.8, C.tan); b.ellipse(3, 8, 1.4, 3.6, C.plum);
  for (let x = 4; x < 31; x++) if (hash2(x, 1, 8) > 0.45) { b.set(x, 5, C.grass); if (hash2(x, 2, 8) > 0.6) { b.set(x, 4, C.leaf); b.set(x, 6, C.pine); } }
  b.set(12, 3, C.orchid); b.set(13, 3, C.white); b.set(24, 4, C.coral);
  b.outline(C.deep);
  return { buf: b, ax: 20, ay: 12, shadow: { ox: 2, oy: 0, rx: 16, ry: 2 } };
}

function rock(v: number): PropArt {
  const b = mk(26, 18);
  const t: Tones = { dark: C.dusk, mid: C.slate, light: C.stone, hi: C.silver };
  shadedDisc(b, 9, 10, 7, 5, t, 22 + v); shadedDisc(b, 17, 11, 6, 5, t, 23 + v); shadedDisc(b, 13, 8, 5, 4, t, 24 + v);
  rimBottom(b, t.dark);
  b.each(10, 6, 7, 2.5, (x, y) => { if (b.get(x, y) && bayer(x, y) < 0.75) b.set(x, y, (x + y) & 1 ? C.grass : C.leaf); });
  b.outline(C.night);
  return { buf: b, ax: 13, ay: 14, shadow: { ox: 3, oy: 0, rx: 11, ry: 3 } };
}

function stump(): PropArt {
  const b = mk(18, 16);
  b.ellipse(9, 9, 6, 3.4, C.wood); b.rect(3, 9, 12, 4, C.bark); b.rect(3, 9, 3, 4, C.wood);
  b.ellipse(9, 7, 6, 2.6, C.tan); b.ellipse(9, 7, 2.6, 1.2, C.wood);
  b.rect(4, 6, 4, 1, C.grass); b.set(5, 5, C.leaf);
  b.rect(11, 14, 4, 1, C.deep);
  b.outline(C.plum);
  return { buf: b, ax: 9, ay: 13, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

function boat(): PropArt {
  const b = mk(32, 22);
  for (let x = 2; x < 30; x++) {
    const t = (x - 2) / 27, sag = Math.round(Math.sin(t * Math.PI) * 3), top = 11 - Math.round(Math.sin(t * Math.PI) * 1);
    for (let y = top; y < 14 + sag; y++) b.set(x, y, y === top ? C.tan : y > 11 + sag ? C.bark : C.wood);
  }
  b.rect(4, 11, 24, 1, C.peach);
  b.rect(8, 12, 1, 2, C.bark); b.rect(22, 12, 1, 2, C.bark);
  b.rect(15, 3, 1, 8, C.bark); b.rect(13, 2, 5, 1, C.bark);
  b.rect(12, 4, 4, 5, C.night); b.rect(13, 5, 2, 3, C.amber); b.set(13, 5, C.yellow);
  b.line(6, 10, 24, 6, C.tan);
  b.outline(C.plum);
  return { buf: b, ax: 16, ay: 17, shadow: { ox: 2, oy: 0, rx: 12, ry: 2 }, hook: { x: 0, y: -12 } };
}

function heron(): PropArt {
  const b = mk(20, 34);
  b.line(10, 33, 10, 22, C.stone); b.line(11, 33, 11, 22, C.slate); b.rect(8, 33, 6, 1, C.slate);
  b.ellipse(11, 19, 5, 4, C.silver); b.ellipse(9, 18, 4, 2.6, C.white); b.rect(13, 20, 4, 2, C.stone); // Koerper, Fluegel, Schwanz
  b.line(6, 18, 3, 24, C.stone);
  b.line(8, 16, 7, 8, C.silver); b.line(9, 16, 8, 8, C.white);
  b.disc(8, 6, 2.2, C.white); b.rect(10, 5, 5, 1, C.amber); b.set(8, 5, C.ink); b.rect(6, 3, 4, 1, C.ink); b.set(5, 4, C.ink);
  b.outline(C.slate);
  return { buf: b, ax: 10, ay: 33, shadow: { ox: 2, oy: 0, rx: 5, ry: 1 } };
}

function totem(): PropArt {
  const b = mk(20, 46);
  b.rect(7, 8, 6, 34, C.bark); b.rect(7, 8, 2, 34, C.wood); b.rect(12, 8, 1, 34, C.plum);
  // Gesichter: Schaedel oben, Maske darunter
  b.rect(5, 3, 10, 9, C.sand); b.rect(5, 3, 10, 1, C.white); b.rect(5, 3, 2, 9, C.white); b.rect(13, 3, 2, 9, C.peach);
  b.rect(6, 6, 3, 3, C.ink); b.rect(11, 6, 3, 3, C.ink); b.set(7, 7, C.ice); b.set(12, 7, C.ice); b.rect(9, 9, 2, 2, C.ink); b.rect(7, 11, 6, 1, C.tan);
  for (const x of [7, 9, 11]) b.set(x, 11, C.ink);
  b.rect(5, 16, 10, 7, C.crimson); b.rect(5, 16, 10, 1, C.red); b.rect(7, 18, 2, 2, C.yellow); b.rect(11, 18, 2, 2, C.yellow); b.rect(8, 21, 4, 1, C.ink);
  b.rect(5, 26, 10, 6, C.pine); b.rect(5, 26, 10, 1, C.grass); b.rect(7, 28, 2, 2, C.ice); b.rect(11, 28, 2, 2, C.ice);
  b.line(2, 14, 6, 17, C.tan); b.line(18, 14, 14, 17, C.tan); b.set(1, 13, C.red); b.set(19, 13, C.ice);
  b.rect(4, 40, 12, 3, C.stone); b.rect(4, 40, 12, 1, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: 10, ay: 42, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 }, hook: { x: 0, y: -16 } };
}

function bones(): PropArt {
  const b = mk(22, 12);
  b.rect(3, 6, 14, 2, C.sand); b.set(2, 5, C.white); b.set(2, 8, C.white); b.set(17, 5, C.white); b.set(17, 8, C.white);
  b.disc(15, 5, 3, C.white); b.set(14, 4, C.ink); b.set(16, 4, C.ink); b.rect(14, 7, 3, 1, C.stone);
  b.line(5, 9, 11, 10, C.sand);
  b.outline(C.slate);
  return { buf: b, ax: 11, ay: 9, shadow: { ox: 1, oy: 0, rx: 8, ry: 2 } };
}

const cache = new Map<string, PropArt>();
export function marshArt(kind: MarshKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) { a = build(kind, v); cache.set(key, a); }
  return a;
}
function build(kind: MarshKind, v: number): PropArt {
  switch (kind) {
    case 'cypress': return cypress(v);
    case 'dead': return dead(v);
    case 'mangrove': return mangrove();
    case 'sbush': return sbush(v);
    case 'fern': return fern(v);
    case 'reeds': return reeds(v);
    case 'hut': return hut();
    case 'lantern': return lantern();
    case 'mushroom': return mushroom(v);
    case 'mosslog': return mosslog();
    case 'rock': return rock(v);
    case 'stump': return stump();
    case 'boat': return boat();
    case 'heron': return heron();
    case 'totem': return totem();
    case 'bones': return bones();
  }
}
