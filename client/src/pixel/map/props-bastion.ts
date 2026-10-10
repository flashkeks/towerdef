/**
 * Gemalte Dinge von Sunken Bastion (Runde 16 / K1): Rundtuerme, Torhaeuser, Bergfried-Ruine, Saeulen, Bogen, Schutt, Statue,
 * Feuerschalen, Banner, knorrige Baeume ... Gleiche Regeln wie `props.ts`: Licht oben links, drei Toene je Flaeche, Umriss
 * in der dunkelsten Flaechenfarbe, Schatten separat. Stein in silver/stone/slate/dusk, Moos in grass/pine, Banner crimson/violet.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';

export type BastionKind =
  | 'tower' | 'gatetower' | 'keep' | 'pillar' | 'arch' | 'rubble' | 'statue' | 'brazier' | 'banner' | 'oak' | 'dead' | 'pine'
  | 'bush' | 'rock' | 'cannon' | 'tent' | 'well' | 'crate' | 'barrel' | 'grave' | 'reeds' | 'wreck' | 'cart' | 'lamp';

export const STONE: Tones = { dark: C.dusk, mid: C.slate, light: C.stone, hi: C.silver };

/** Mauerwerk: Reihen von Steinen mit Fugen, links hell, rechts dunkel; `moss` = Anteil bemooster Steine unten. */
export function stoneRect(b: Buf, x0: number, y0: number, w: number, h: number, seed: number, moss = 0.15): void {
  for (let y = y0; y < y0 + h; y++) {
    const row = Math.floor((y - y0) / 4), ry = (y - y0) % 4;
    for (let x = x0; x < x0 + w; x++) {
      const off = (row & 1) * 3, bx = Math.floor((x - x0 + off) / 6);
      const joint = ry === 3 || (x - x0 + off) % 6 === 5;
      const fx = (x - x0) / Math.max(1, w - 1);
      const k = hash2(bx, row, seed);
      let c = joint ? C.dusk : fx < 0.3 ? (k > 0.5 ? C.silver : C.stone) : fx < 0.7 ? (k > 0.6 ? C.stone : C.slate) : k > 0.5 ? C.slate : C.dusk;
      if (!joint && ry === 0 && fx < 0.8) c = c === C.slate ? C.stone : c === C.dusk ? C.slate : c; // Lichtkante
      if (!joint && hash2(x, y, seed + 1) > 0.96) c = C.night; // Riss
      if (!joint && y > y0 + h * 0.65 && hash2(bx, row, seed + 2) < moss) c = hash2(x, y, seed + 3) > 0.5 ? C.grass : C.pine;
      b.set(x, y, c);
    }
  }
}

/** Zinnen: Zahnreihe, `broken` loest einzelne Zinnen auf. */
function crenel(b: Buf, x0: number, x1: number, y: number, seed: number, broken = 0.2): void {
  for (let x = x0; x <= x1; x += 6) {
    if (hash2(x, seed, 5) < broken) { b.rect(x, y + 2, 4, 1, C.dusk); continue; }
    b.rect(x, y, 4, 3, C.silver); b.rect(x, y, 4, 1, C.white); b.rect(x + 3, y, 1, 3, C.stone); b.rect(x, y + 2, 4, 1, C.stone);
  }
}

function tower(v: number): PropArt {
  const W = 40, H = 62;
  const b = mk(W, H);
  const cx = 20, top = 18, bot = 58, hw = 13;
  // Zylinderkoerper: links hell, rechts dunkel, Fugen als Ringe
  for (let y = top; y <= bot; y++) for (let x = -hw; x <= hw; x++) {
    const nx = x / hw, row = Math.floor((y - top) / 4), ry = (y - top) % 4, off = (row & 1) * 3;
    const joint = ry === 3 || (x + hw + off) % 7 === 6;
    const lit = -nx * 0.85 + (bayer(cx + x, y) - 0.5) * 0.18;
    let c = joint ? (lit > 0 ? C.slate : C.dusk) : lit > 0.45 ? C.silver : lit > 0.0 ? C.stone : lit > -0.5 ? C.slate : C.dusk;
    if (!joint && y > bot - 10 && hash2(x + hw, row, 7 + v) < 0.35) c = hash2(x, y, 8) > 0.5 ? C.grass : C.pine; // Moos am Fuss
    b.set(cx + x, y, c);
  }
  // Pfeilscharten und ein warm erleuchtetes Fenster
  for (const [y, lit] of [[28, false], [40, true]] as const) { b.rect(cx - 1, y, 2, 6, C.ink); if (lit) { b.rect(cx - 1, y + 1, 2, 4, C.amber); b.set(cx - 1, y + 1, C.yellow); } }
  b.rect(cx - hw - 1, bot, 2 * hw + 3, 3, C.slate); b.rect(cx - hw - 1, bot, 2 * hw + 3, 1, C.stone); // Sockel
  // oberer Kranz: Ellipse (Oberseite sichtbar), Zinnen vorn, ein Stueck eingebrochen
  b.ellipse(cx, top, hw + 2, 4.4, C.slate);
  b.ellipse(cx - 0.5, top - 0.6, hw + 1, 3.6, C.stone);
  b.ellipse(cx - 1, top - 1, hw - 3, 2, C.dusk);
  for (let a = 0; a < 18; a++) {
    const an = Math.PI * (0.05 + (a / 17) * 0.9); // untere Haelfte = vorn
    const x = Math.round(cx + Math.cos(an) * (hw + 1.5)), y = Math.round(top + Math.sin(an) * 4);
    if (v && a > 11 && a < 15) { b.set(x, y, C.dusk); continue; } // Bresche
    b.rect(x - 1, y - 2, 3, 3, a % 2 ? C.silver : C.stone); b.set(x - 1, y - 2, C.white);
  }
  // Efeu
  for (let k = 0; k < 20; k++) { const x = cx - hw + Math.floor(hash2(k, v, 3) * 8), y = top + 6 + Math.floor(hash2(k, v, 4) * 28); b.under(x, y, C.pine); if (k % 3 === 0) b.under(x, y + 1, C.grass); }
  // Fahnenstange (Fahne = bewegte Ebene)
  b.rect(cx + 1, 0, 1, 14, C.bark); b.set(cx + 1, 0, C.yellow);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: bot + 2, shadow: { ox: 9, oy: 0, rx: 18, ry: 5 }, hook: { x: 2, y: 2 - (bot + 2) } };
}

/** Torturm (schmal, eckig) mit Spitzdach-Ruine, v0 mit Banner. */
function gatetower(v: number): PropArt {
  const W = 34, H = 58;
  const b = mk(W, H);
  const cx = 17;
  stoneRect(b, 4, 18, 26, 36, 41 + v);
  b.rect(3, 54, 28, 3, C.slate); b.rect(3, 54, 28, 1, C.stone);
  // Torbogen-Ansatz und Schiessscharte
  b.rect(cx - 2, 28, 4, 8, C.ink); b.rect(cx - 1, 29, 2, 6, C.amber); b.set(cx - 1, 29, C.yellow);
  b.rect(cx - 2, 42, 4, 12, C.night); b.rect(cx - 2, 42, 4, 1, C.dusk);
  // Obergeschoss, vorkragend, mit Zinnen
  b.rect(2, 12, 30, 7, C.slate); b.rect(2, 12, 30, 1, C.silver); b.rect(2, 18, 30, 1, C.dusk);
  for (let x = 3; x < 31; x += 4) b.rect(x, 14, 2, 3, C.stone);
  crenel(b, 2, 28, 8, 9 + v, 0.3);
  b.rect(cx, 0, 1, 10, C.bark);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: 56, shadow: { ox: 8, oy: 0, rx: 16, ry: 4 }, hook: { x: 1, y: 2 - 56 } };
}

/** Bergfried-Ruine: breiter Hauptbau, abgebrochener Turm, Seitenfluegel, Banner, warmes Tor. */
function keep(): PropArt {
  const W = 110, H = 92;
  const b = mk(W, H);
  // Seitenfluegel links und rechts (niedriger)
  stoneRect(b, 4, 46, 28, 42, 51); stoneRect(b, 78, 46, 28, 42, 52);
  // Hauptbau
  stoneRect(b, 28, 30, 54, 58, 53);
  // Hauptturm links oben (eingestuerzt)
  stoneRect(b, 30, 4, 20, 30, 54);
  crenel(b, 29, 48, 2, 1, 0.45);
  b.rect(31, 6, 18, 1, C.silver);
  // Zinnenkranz Hauptbau mit Luecken
  crenel(b, 28, 80, 27, 2, 0.35);
  crenel(b, 4, 30, 43, 3, 0.4); crenel(b, 78, 104, 43, 4, 0.5);
  // Dachreste: freiliegende Balken
  for (const [x, y, l] of [[56, 20, 14], [60, 14, 10], [70, 22, 9]] as const) { b.rect(x, y, l, 2, C.bark); b.rect(x, y, l, 1, C.wood); }
  b.line(56, 20, 68, 8, C.bark); b.line(57, 20, 69, 8, C.wood);
  // Tor: grosser Bogen mit warmem Licht
  const gx = 55, gw = 18, gt = 56;
  b.rect(gx, gt, gw, 32, C.ink);
  b.ellipse(gx + gw / 2, gt, gw / 2, 6, C.ink);
  b.rect(gx + 2, gt + 1, gw - 4, 31, C.amber); b.rect(gx + 2, gt + 1, 5, 12, C.yellow); b.ellipse(gx + gw / 2, gt + 1, gw / 2 - 2, 4, C.amber);
  b.rect(gx + gw / 2, gt - 4, 1, 36, C.bark); // Torfluegel-Spalt
  for (const y of [62, 70, 78]) b.rect(gx + 2, y, gw - 4, 1, C.orange);
  // Fenster
  for (const [x, y] of [[40, 40], [40, 62], [85, 40], [85, 62], [14, 58], [92, 58]] as const) { b.rect(x, y, 5, 8, C.ink); b.rect(x + 1, y + 1, 3, 6, hash2(x, y, 6) > 0.4 ? C.amber : C.night); if (hash2(x, y, 6) > 0.4) b.set(x + 1, y + 1, C.yellow); }
  // Banner
  for (const bx of [36, 98]) { b.rect(bx, 8, 1, 36 - (bx > 60 ? 0 : 0), C.bark); for (let y = 16; y < 40; y++) for (let x = 1; x < 7; x++) if (y < 38 - Math.abs(x - 3) * 1.4) b.set(bx + x, y, (y - 16) % 6 < 2 ? C.amber : x < 3 ? C.crimson : C.plum); }
  // Fuss: Schutt und Moos
  b.rect(2, 86, W - 4, 4, C.slate); b.rect(2, 86, W - 4, 1, C.stone);
  for (let x = 4; x < W - 4; x += 3) if (hash2(x, 5, 9) > 0.55) b.under(x, 85, hash2(x, 6, 9) > 0.5 ? C.grass : C.pine);
  // Efeu
  for (let k = 0; k < 70; k++) { const x = 8 + Math.floor(hash2(k, 1, 12) * 96), y = 40 + Math.floor(hash2(k, 2, 12) * 46); if (b.get(x, y) && b.get(x, y) !== C.ink && b.get(x, y) !== C.amber && b.get(x, y) !== C.yellow && b.get(x, y) !== C.orange) b.set(x, y, hash2(k, 3, 12) > 0.5 ? C.pine : C.grass); }
  b.outline(C.night);
  return { buf: b, ax: W / 2, ay: 90, shadow: { ox: 12, oy: 0, rx: 52, ry: 8 }, hook: { x: 0, y: -30 } };
}

function pillar(v: number): PropArt {
  const b = mk(16, 36);
  const h = v ? 22 : 30;
  stoneRect(b, 4, 34 - h, 9, h, 61 + v, 0.3);
  b.rect(3, 31, 11, 3, C.slate); b.rect(3, 31, 11, 1, C.stone);
  // abgebrochene Kante oben
  for (let x = 4; x < 13; x++) { const d = Math.floor(hash2(x, v, 7) * 3); b.rect(x, 34 - h - 1, 1, 1 + d, C.dusk); if (d) b.set(x, 34 - h - 1, C.stone); }
  b.rect(3, 34 - h - 3, 11, 3, C.silver); b.rect(3, 34 - h - 3, 11, 1, C.white);
  if (v === 0) { b.rect(2, 1, 13, 3, C.stone); b.rect(2, 1, 13, 1, C.silver); }
  b.outline(C.night);
  return { buf: b, ax: 8, ay: 34, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}

/** Freistehender Bogen (Ruine eines Durchgangs). */
function arch(): PropArt {
  const b = mk(44, 44);
  stoneRect(b, 4, 12, 9, 30, 71); stoneRect(b, 31, 12, 9, 30, 72);
  for (let a = 0; a <= 20; a++) { const an = Math.PI * (a / 20), x = Math.round(22 + Math.cos(an) * 14), y = Math.round(14 - Math.sin(an) * 12); b.rect(x - 2, y - 1, 5, 4, a % 2 ? C.stone : C.silver); b.set(x - 2, y - 1, C.white); b.set(x + 2, y + 2, C.dusk); }
  for (let a = 7; a <= 13; a++) { const an = Math.PI * (a / 20); b.rect(Math.round(22 + Math.cos(an) * 14) - 2, Math.round(14 - Math.sin(an) * 12) - 1, 5, 4, 0); }
  b.rect(2, 40, 40, 3, C.slate); b.rect(2, 40, 40, 1, C.stone);
  for (const x of [8, 11, 33, 36]) b.under(x, 12, C.pine);
  for (let k = 0; k < 14; k++) b.under(5 + Math.floor(hash2(k, 5, 5) * 8), 16 + Math.floor(hash2(k, 6, 5) * 20), C.grass);
  b.outline(C.night);
  return { buf: b, ax: 22, ay: 42, shadow: { ox: 5, oy: 0, rx: 19, ry: 4 } };
}

function rubble(v: number): PropArt {
  const b = mk(30, 16);
  const r = rng(80 + v);
  for (let i = 0; i < 8; i++) { const cx = 4 + Math.floor(r() * 22), cy = 5 + Math.floor(r() * 7), rx = 2 + Math.floor(r() * 3), ry = 1 + Math.floor(r() * 2); shadedDisc(b, cx, cy, rx, ry, STONE, 90 + i + v); }
  rimBottom(b, C.dusk);
  for (let i = 0; i < 6; i++) b.under(3 + Math.floor(r() * 24), 4 + Math.floor(r() * 8), i % 2 ? C.grass : C.pine);
  b.outline(C.night);
  return { buf: b, ax: 15, ay: 13, shadow: { ox: 2, oy: 0, rx: 12, ry: 3 } };
}

function statue(): PropArt {
  const b = mk(20, 42);
  stoneRect(b, 3, 28, 14, 11, 81, 0.35);
  b.rect(2, 26, 16, 3, C.stone); b.rect(2, 26, 16, 1, C.silver); b.rect(3, 38, 14, 2, C.slate);
  // Ritter: Koerper, Helm, Schwert
  b.rect(7, 14, 6, 12, C.stone); b.rect(7, 14, 2, 12, C.silver); b.rect(12, 14, 1, 12, C.slate);
  b.rect(8, 8, 4, 6, C.silver); b.rect(8, 8, 1, 6, C.white); b.rect(9, 10, 3, 1, C.dusk);
  b.rect(9, 5, 2, 3, C.stone);
  b.rect(14, 8, 1, 17, C.stone); b.set(14, 7, C.silver); b.rect(12, 18, 5, 1, C.stone);
  for (let k = 0; k < 12; k++) b.under(6 + Math.floor(hash2(k, 7, 5) * 8), 10 + Math.floor(hash2(k, 8, 5) * 28), hash2(k, 9, 5) > 0.5 ? C.pine : C.grass);
  b.outline(C.night);
  return { buf: b, ax: 10, ay: 38, shadow: { ox: 3, oy: 0, rx: 8, ry: 3 } };
}

/** Feuerschale auf Dreifuss; die Flamme malt die bewegte Ebene (Aufhaenger = hook). */
export function brazier(): PropArt {
  const b = mk(18, 26);
  b.line(4, 24, 8, 15, C.slate); b.line(14, 24, 10, 15, C.slate); b.line(9, 25, 9, 15, C.dusk);
  b.ellipse(9, 13, 6, 2.6, C.slate); b.rect(3, 13, 12, 3, C.slate); b.rect(3, 13, 12, 1, C.stone); b.ellipse(9, 12, 5, 1.8, C.night);
  b.rect(5, 12, 8, 1, C.rust); b.set(7, 12, C.orange); b.set(11, 12, C.amber);
  b.outline(C.ink);
  return { buf: b, ax: 9, ay: 24, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 }, hook: { x: 0, y: -14 } };
}

function banner(v: number): PropArt {
  const b = mk(18, 46);
  b.rect(8, 2, 2, 42, C.bark); b.rect(8, 2, 1, 42, C.wood); b.rect(5, 1, 8, 2, C.wood); b.set(9, 0, C.yellow);
  const cols = v ? [C.violet, C.orchid] : [C.crimson, C.red];
  for (let y = 4; y < 30; y++) for (let x = 10; x < 17; x++) { if (y > 26 - Math.abs(x - 13) * 2) continue; b.set(x, y, x < 12 ? cols[1] : cols[0]); }
  b.rect(11, 8, 4, 1, C.amber); b.rect(12, 10, 2, 3, C.amber); b.rect(11, 14, 4, 1, C.amber);
  b.rect(6, 40, 6, 3, C.stone); b.rect(6, 40, 6, 1, C.silver);
  b.outline(C.plum);
  return { buf: b, ax: 9, ay: 43, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 } };
}

function oak(v: number): PropArt {
  const b = mk(46, 52);
  const cx = 23;
  // knorriger Stamm mit Wurzeln
  b.rect(cx - 3, 26, 7, 22, C.bark); b.rect(cx - 3, 26, 3, 22, C.wood); b.rect(cx + 3, 26, 1, 22, C.plum);
  b.line(cx - 3, 46, cx - 9, 50, C.bark); b.line(cx + 4, 46, cx + 10, 50, C.bark); b.line(cx, 30, cx - 11, 22, C.bark); b.line(cx + 1, 28, cx + 12, 20, C.bark);
  const t: Tones = v ? { dark: C.deep, mid: C.pine, light: C.grass } : { dark: C.pine, mid: C.grass, light: C.leaf };
  const blobs = [[cx - 12, 22, 9, 7], [cx + 12, 22, 9, 7], [cx, 25, 11, 7], [cx - 10, 13, 10, 8], [cx + 11, 13, 10, 8], [cx, 8, 12, 8], [cx, 16, 12, 8]];
  blobs.forEach(([x, y, rx, ry], i) => shadedDisc(b, x, y, rx, ry, t, 101 + i + v * 4));
  rimBottom(b, t.dark);
  sparkle(b, 24, [t.mid], t.light, 111 + v, (x, y) => x < cx + 4 && y < 22);
  sparkle(b, 12, [t.mid, t.light], t.dark, 112 + v, (x, y) => y > 12);
  b.outline(C.deep);
  return { buf: b, ax: cx, ay: 48, shadow: { ox: 5, oy: -1, rx: 16, ry: 5 } };
}

function dead(v: number): PropArt {
  const b = mk(36, 50);
  const cx = 18;
  for (let y = 20; y <= 46; y++) { const f = (y - 20) / 26, half = Math.round(1.5 + f * 3); for (let x = -half; x <= half; x++) b.set(cx + x + Math.round(Math.sin(y / 5 + v) * 1.2), y, x < 0 ? C.stone : x === 0 ? C.slate : C.dusk); }
  const limbs: [number, number, number, number][] = v ? [[cx, 26, cx - 12, 10], [cx, 22, cx + 11, 6], [cx - 6, 16, cx - 10, 2], [cx, 32, cx + 11, 26]] : [[cx, 24, cx - 11, 8], [cx, 22, cx + 12, 10], [cx + 6, 14, cx + 4, 0], [cx, 33, cx - 11, 29]];
  for (const [x0, y0, x1, y1] of limbs) { b.line(x0, y0, x1, y1, C.slate); b.line(x0 + 1, y0, x1 + 1, y1, C.stone); }
  b.rect(cx - 4, 44, 9, 3, C.dusk);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: 46, shadow: { ox: 4, oy: 0, rx: 10, ry: 3 } };
}

function pine(): PropArt {
  const b = mk(28, 50);
  const cx = 14;
  b.rect(cx - 1, 40, 3, 8, C.bark);
  for (const [top, bot, hw] of [[31, 43, 11], [22, 34, 9], [13, 26, 7], [3, 17, 5]]) {
    for (let y = top; y <= bot; y++) {
      const f = (y - top) / (bot - top), half = Math.round(1 + f * hw);
      for (let x = -half; x <= half; x++) {
        const nx = x / (half + 0.5), lit = -nx * 0.8 - (f - 0.4) * 0.7 + (bayer(cx + x, y) - 0.5) * 0.35;
        b.set(cx + x, y, Math.abs(x) >= half && f > 0.15 && ((y + x) & 1) === 0 ? C.deep : lit > 0.3 ? C.pine : lit > -0.3 ? C.deep : C.night);
      }
    }
    for (let x = -hw - 1; x <= hw + 1; x += 3) b.set(cx + x, bot + 1, C.night);
  }
  rimBottom(b, C.night);
  b.outline(C.night);
  return { buf: b, ax: cx, ay: 47, shadow: { ox: 5, oy: -1, rx: 10, ry: 4 } };
}

function bush(v: number): PropArt {
  const b = mk(24, 18);
  const t: Tones = v ? { dark: C.deep, mid: C.pine, light: C.grass } : { dark: C.pine, mid: C.grass, light: C.leaf };
  shadedDisc(b, 7, 10, 6, 5, t, 121 + v); shadedDisc(b, 16, 10, 6, 5, t, 122 + v); shadedDisc(b, 11, 8, 8, 6, t, 123 + v);
  rimBottom(b, t.dark);
  const r = rng(140 + v);
  for (let i = 0; i < 4; i++) { const x = 4 + Math.floor(r() * 16), y = 3 + Math.floor(r() * 9); if (b.get(x, y)) b.set(x, y, i % 2 ? C.white : C.violet); }
  b.outline(C.deep);
  return { buf: b, ax: 12, ay: 15, shadow: { ox: 3, oy: 0, rx: 10, ry: 3 } };
}

function rock(v: number): PropArt {
  const b = mk(28, 20);
  shadedDisc(b, 9, 12, 7, 5, STONE, 131 + v); shadedDisc(b, 18, 13, 7, 5, STONE, 132 + v); shadedDisc(b, 13, 9, 6, 5, STONE, 133 + v);
  rimBottom(b, C.dusk);
  b.each(10, 7, 7, 2.5, (x, y) => { if (b.get(x, y) && bayer(x, y) < 0.7) b.set(x, y, (x + y) & 1 ? C.grass : C.pine); });
  b.outline(C.night);
  return { buf: b, ax: 14, ay: 16, shadow: { ox: 3, oy: 0, rx: 12, ry: 3 } };
}

function cannon(): PropArt {
  const b = mk(32, 24);
  b.rect(8, 12, 18, 5, C.slate); b.rect(8, 12, 18, 1, C.stone); b.rect(24, 11, 5, 7, C.dusk);
  b.rect(2, 13, 8, 3, C.dusk); b.rect(1, 12, 3, 5, C.slate); b.rect(0, 13, 2, 3, C.ink);
  b.rect(14, 12, 2, 5, C.stone); b.rect(20, 12, 2, 5, C.stone);
  b.disc(12, 20, 4, C.bark); b.disc(12, 20, 3, C.wood); b.disc(12, 20, 1, C.bark);
  b.disc(24, 20, 3, C.bark); b.disc(24, 20, 2, C.wood);
  b.rect(10, 17, 16, 2, C.bark);
  b.outline(C.night);
  return { buf: b, ax: 16, ay: 22, shadow: { ox: 3, oy: 0, rx: 13, ry: 3 } };
}

function tent(): PropArt {
  const b = mk(36, 28);
  for (let y = 3; y <= 24; y++) { const f = (y - 3) / 21, half = Math.round(1 + f * 15); for (let x = -half; x <= half; x++) { const nx = x / (half + 0.5); b.set(18 + x, y, Math.abs(x) <= 1 && f > 0.45 ? C.plum : nx < -0.1 ? C.sand : nx < 0.5 ? C.tan : C.wood); } }
  b.line(18, 0, 18, 4, C.bark); b.rect(18, 0, 5, 3, C.crimson); b.rect(18, 0, 5, 1, C.red);
  for (let y = 8; y < 24; y += 5) b.rect(18 - Math.round(1 + ((y - 3) / 21) * 15), y, 2 * Math.round(1 + ((y - 3) / 21) * 15) + 1, 1, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 18, ay: 25, shadow: { ox: 5, oy: 0, rx: 17, ry: 4 } };
}

function well(): PropArt {
  const b = mk(24, 28);
  b.ellipse(12, 18, 9, 5, C.slate); b.ellipse(12, 17, 8, 4, C.stone); b.ellipse(12, 16, 6, 2.6, C.navy);
  b.rect(4, 18, 16, 5, C.stone); b.rect(4, 18, 5, 5, C.silver); b.rect(16, 18, 4, 5, C.slate);
  for (const y of [19, 21]) for (let x = 4; x < 20; x += 4) b.set(x + (y % 4 ? 1 : 3), y, C.slate);
  b.rect(5, 6, 2, 12, C.bark); b.rect(17, 6, 2, 12, C.bark); b.rect(4, 4, 16, 3, C.wood); b.rect(4, 4, 16, 1, C.tan);
  b.line(12, 6, 12, 14, C.tan); b.rect(11, 14, 3, 2, C.wood);
  b.outline(C.night);
  return { buf: b, ax: 12, ay: 24, shadow: { ox: 4, oy: 0, rx: 11, ry: 4 } };
}

function crate(v: number): PropArt {
  const b = mk(18, 16);
  b.rect(2, 5, 12, 9, C.wood); b.rect(2, 5, 12, 1, C.tan); b.rect(2, 5, 1, 9, C.tan);
  b.line(3, 6, 12, 13, C.bark); b.line(12, 6, 3, 13, C.bark); b.rect(13, 6, 1, 8, C.bark);
  if (v) { b.rect(4, 2, 5, 3, C.wood); b.rect(4, 2, 5, 1, C.tan); }
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

function grave(v: number): PropArt {
  const b = mk(16, 20);
  if (v) { b.rect(7, 4, 2, 14, C.bark); b.rect(3, 8, 10, 2, C.bark); b.rect(7, 4, 1, 14, C.wood); }
  else { b.rect(3, 6, 10, 12, C.stone); b.ellipse(8, 6, 5, 3, C.stone); b.rect(3, 6, 3, 12, C.silver); b.rect(10, 6, 3, 12, C.slate); b.rect(7, 8, 2, 5, C.dusk); b.rect(5, 10, 6, 1, C.dusk); }
  b.rect(2, 17, 12, 2, C.pine); b.set(3, 16, C.grass); b.set(12, 16, C.grass);
  b.outline(C.night);
  return { buf: b, ax: 8, ay: 18, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function reeds(v: number): PropArt {
  const b = mk(20, 30);
  const r = rng(250 + v);
  for (let i = 0; i < 7; i++) {
    const x = 2 + i * 2 + Math.floor(r() * 2), h = 12 + Math.floor(r() * 12);
    for (let y = 0; y < h; y++) b.set(x + Math.round(Math.sin(y / 4 + i) * 0.9), 27 - y, i % 2 ? C.grass : C.pine);
    if (i % 2 === 0) { b.rect(x, 27 - h - 3, 2, 5, C.bark); b.set(x, 27 - h - 4, C.wood); }
  }
  return { buf: b, ax: 10, ay: 27, shadow: { ox: 2, oy: 0, rx: 5, ry: 1 } };
}

/** Wrack im Graben: Bootsrumpf, schraeg, mit Mast. */
function wreck(): PropArt {
  const b = mk(40, 24);
  for (let x = 3; x < 36; x++) { const t = (x - 3) / 32, top = 12 - Math.round(t * 5), sag = Math.round(Math.sin(t * Math.PI) * 4); for (let y = top; y < 16 + sag - Math.round(t * 3); y++) b.set(x, y, y === top ? C.tan : y > 13 + sag - Math.round(t * 3) ? C.bark : C.wood); }
  for (let x = 6; x < 33; x += 5) b.rect(x, 12 - Math.round(((x - 3) / 32) * 5), 1, 4, C.plum);
  b.line(16, 10, 12, 0, C.bark); b.line(17, 10, 13, 0, C.wood); b.line(12, 2, 8, 5, C.tan);
  for (let k = 0; k < 10; k++) b.under(5 + Math.floor(hash2(k, 5, 6) * 28), 11 + Math.floor(hash2(k, 6, 6) * 8), C.pine);
  b.outline(C.plum);
  return { buf: b, ax: 20, ay: 19, shadow: { ox: 2, oy: 0, rx: 15, ry: 2 } };
}

function cart(): PropArt {
  const b = mk(34, 24);
  b.rect(4, 8, 24, 7, C.wood); b.rect(4, 8, 24, 1, C.tan); b.rect(4, 14, 24, 1, C.bark);
  for (let x = 6; x < 28; x += 4) b.rect(x, 9, 1, 5, C.bark);
  b.line(27, 12, 33, 16, C.bark);
  b.disc(9, 17, 4, C.bark); b.disc(9, 17, 3, C.wood); b.disc(9, 17, 1, C.bark); b.line(5, 17, 13, 17, C.bark);
  b.line(19, 14, 24, 20, C.bark); // gebrochene Achse
  b.outline(C.plum);
  return { buf: b, ax: 16, ay: 20, shadow: { ox: 3, oy: 0, rx: 14, ry: 3 } };
}

/** Eisenlaterne auf hohem Pfosten. */
function lamp(): PropArt {
  const b = mk(12, 30);
  b.rect(5, 8, 2, 20, C.night); b.rect(5, 8, 1, 20, C.dusk);
  b.rect(3, 26, 6, 2, C.slate); b.rect(3, 26, 6, 1, C.stone);
  b.rect(3, 2, 6, 7, C.night); b.rect(4, 3, 4, 5, C.amber); b.rect(4, 3, 2, 3, C.yellow); b.set(5, 4, C.white);
  b.rect(2, 1, 8, 1, C.slate); b.rect(4, 0, 4, 1, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 6, ay: 28, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 0, y: -22 } };
}

const cache = new Map<string, PropArt>();
export function bastionArt(kind: BastionKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) { a = build(kind, v); cache.set(key, a); }
  return a;
}
function build(kind: BastionKind, v: number): PropArt {
  switch (kind) {
    case 'tower': return tower(v);
    case 'gatetower': return gatetower(v);
    case 'keep': return keep();
    case 'pillar': return pillar(v);
    case 'arch': return arch();
    case 'rubble': return rubble(v);
    case 'statue': return statue();
    case 'brazier': return brazier();
    case 'banner': return banner(v);
    case 'oak': return oak(v);
    case 'dead': return dead(v);
    case 'pine': return pine();
    case 'bush': return bush(v);
    case 'rock': return rock(v);
    case 'cannon': return cannon();
    case 'tent': return tent();
    case 'well': return well();
    case 'crate': return crate(v);
    case 'barrel': return barrel();
    case 'grave': return grave(v);
    case 'reeds': return reeds(v);
    case 'wreck': return wreck();
    case 'cart': return cart();
    case 'lamp': return lamp();
  }
}
