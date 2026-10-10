/**
 * Gemalte Dinge von Ashra Dunes (Runde 16 / K2): Palmen, Kakteen, Sandsteinfelsen, Ruinen (Saeulen, Bogen, Obelisk, Statue),
 * Beduinenzelt, Kamel, Fackeln, Kisten und Kleinkram. Regeln wie `props.ts`: Licht oben links, drei Toene, Umriss in der
 * dunkelsten Flaechenfarbe, Schatten separat. Warme Palette: Sand, Tan, Rost, dazu das Gruen der Oase.
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';
import { bricks, dome, flame, pole, shadedRect } from './k2sprites';

export type DunesKind =
  | 'palm' | 'palmsmall' | 'cactus' | 'cactusround' | 'mesa' | 'rock' | 'boulder' | 'column' | 'columnbroken' | 'columnfallen' | 'arch'
  | 'obelisk' | 'ruinwall' | 'statue' | 'tent' | 'camel' | 'bones' | 'deadtree' | 'torch' | 'brazier' | 'crate' | 'jar' | 'banner'
  | 'shrub' | 'well' | 'cart' | 'reeds';

const SS: Tones = { dark: C.wood, mid: C.tan, light: C.peach, hi: C.sand };
const LIME: Tones = { dark: C.tan, mid: C.peach, light: C.sand, hi: C.white };

// ------------------------------------------------------------------ Palmen
function frond(b: Buf, x0: number, y0: number, ang: number, len: number, droop: number, tl: Tones): void {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const cols = dx < -0.3 ? [tl.light, tl.mid] : dx > 0.3 ? [tl.mid, tl.dark] : [tl.mid, tl.light];
  let lx = x0, ly = y0;
  for (let i = 0; i <= len; i++) {
    const t = i / len;
    const x = Math.round(x0 + dx * len * t), y = Math.round(y0 + dy * len * t * 0.6 + droop * len * t * t);
    b.set(x, y, cols[0]);
    if (Math.abs(x - lx) + Math.abs(y - ly) > 1) b.set(x, y - 1, cols[0]);
    // Fiedern: kurze Striche nach unten, nach aussen kuerzer
    if (i > 1 && i % 2 === 0 && t < 0.95) {
      const n = Math.max(1, Math.round(3 * (1 - t) + 0.7));
      for (let k = 1; k <= n; k++) b.set(x + (dx < 0 ? -(k >> 1) : (k >> 1)), y + k, k === n ? tl.dark : cols[1]);
    }
    if (t > 0.55 && t < 0.8 && dx < -0.3) b.set(x, y - 1, tl.light);
    lx = x; ly = y;
  }
}

function palm(v: number, small: boolean): PropArt {
  const W = small ? 30 : 46, H = small ? 38 : 58;
  const b = mk(W, H);
  const lean = [3, -4, 5][v % 3] * (small ? 0.6 : 1);
  const baseY = H - 3, crownY = small ? 12 : 17, bx = Math.round(W / 2 - lean), crownX = Math.round(bx + lean);
  const tw = small ? 2 : 3;
  for (let y = baseY; y >= crownY; y--) {
    const f = (baseY - y) / (baseY - crownY);
    const x = Math.round(bx + lean * Math.pow(f, 1.7));
    const ring = (y % 3) === 0;
    for (let i = 0; i < tw; i++) b.set(x - 1 + i, y, ring ? (i === 0 ? C.wood : C.bark) : i === 0 ? C.tan : i === tw - 1 ? C.bark : C.wood);
  }
  b.set(bx - tw, baseY, C.wood); b.set(bx + tw, baseY, C.bark); b.set(bx - tw - 1, baseY + 1, C.bark); b.set(bx + tw + 1, baseY + 1, C.plum);
  const tl: Tones = v === 1 ? { dark: C.pine, mid: C.grass, light: C.leaf } : { dark: C.deep, mid: C.pine, light: C.grass, hi: C.leaf };
  const L = small ? 11 : 17;
  const angs = small ? [200, 245, 290, 335, 20, 160] : [195, 225, 255, 285, 315, 345, 15, 165];
  angs.forEach((a, i) => frond(b, crownX, crownY, (a * Math.PI) / 180, L * (i % 2 ? 0.9 : 1), 0.35 + (i % 3) * 0.1, tl));
  for (const [x, y] of [[-2, 2], [0, 3], [2, 2]]) { b.disc(crownX + x, crownY + y, 1.2, C.bark); b.set(crownX + x - 1, crownY + y - 1, C.wood); }
  b.outline(C.deep);
  return { buf: b, ax: bx, ay: baseY + 1, shadow: { ox: 6, oy: -1, rx: small ? 9 : 14, ry: small ? 3 : 4 } };
}

function reeds(v: number): PropArt {
  const b = mk(18, 26);
  const r = rng(710 + v);
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 2 + Math.floor(r() * 2), h = 11 + Math.floor(r() * 10);
    for (let y = 0; y < h; y++) b.set(x + Math.round(Math.sin(y / 3.5 + i) * 0.9), 23 - y, y > h - 3 ? C.leaf : i % 2 ? C.grass : C.pine);
    if (i % 2 === 0) { b.rect(x, 23 - h - 2, 2, 4, C.bark); b.set(x, 23 - h - 2, C.wood); }
  }
  return { buf: b, ax: 9, ay: 23, shadow: { ox: 2, oy: 0, rx: 6, ry: 1 } };
}

// ------------------------------------------------------------------ Pflanzen
function cactus(v: number): PropArt {
  const b = mk(26, 36);
  const t: Tones = { dark: C.deep, mid: C.pine, light: C.grass, hi: C.leaf };
  const arm = (x: number, y0: number, y1: number, w: number, up: number): void => {
    for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) b.set(x + i, y, i === 0 ? t.light : i === w - 1 ? t.dark : t.mid);
    for (let i = 0; i < w; i++) b.set(x + i, y0 - 1, i === 0 ? t.light : t.mid);
    void up;
  };
  arm(11, 7, 32, 5, 0);
  if (v !== 2) { arm(3, 16, 22, 4, 1); b.rect(4, 22, 8, 3, t.mid); b.rect(4, 22, 8, 1, t.light); arm(3, 14, 22, 4, 1); }
  if (v !== 1) { arm(19, 12, 18, 4, 1); b.rect(15, 18, 8, 3, t.mid); b.rect(15, 18, 8, 1, t.light); arm(19, 10, 18, 4, 1); }
  for (const [x, y] of [[12, 12], [13, 18], [12, 25], [14, 29]]) b.set(x, y, t.dark);
  for (let y = 9; y < 31; y += 3) { b.set(11, y, C.leaf); b.set(15, y + 1, C.yellow); }
  if (v === 0) { b.set(13, 5, C.coral); b.set(12, 4, C.coral); b.set(14, 4, C.orchid); b.set(13, 3, C.coral); }
  rimBottom(b, t.dark);
  b.outline(C.deep);
  return { buf: b, ax: 13, ay: 33, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 } };
}

function cactusRound(v: number): PropArt {
  const b = mk(18, 16);
  const t: Tones = { dark: C.deep, mid: C.pine, light: C.grass, hi: C.leaf };
  shadedDisc(b, 8, 9, 6, 5, t, 22 + v);
  for (let x = 3; x <= 13; x += 2) b.line(x, 5, x - Math.round((x - 8) * 0.2), 12, t.dark);
  for (const [x, y] of [[5, 6], [8, 5], [11, 7], [6, 10], [10, 11]]) b.set(x, y, C.yellow);
  b.set(8, 3, C.coral); b.set(7, 3, C.coral); b.set(9, 3, C.red);
  rimBottom(b, t.dark);
  b.outline(C.deep);
  return { buf: b, ax: 9, ay: 14, shadow: { ox: 2, oy: 0, rx: 7, ry: 2 } };
}

function shrub(v: number): PropArt {
  const b = mk(22, 14);
  const r = rng(730 + v);
  for (let i = 0; i < 9; i++) {
    const x0 = 11 + Math.round((r() - 0.5) * 6), len = 5 + Math.floor(r() * 6), dir = (i - 4) * 0.5;
    for (let k = 0; k < len; k++) b.set(Math.round(x0 + dir * k * 0.9), 12 - k, k > len - 3 ? C.tan : k % 2 ? C.wood : C.bark);
    b.set(Math.round(x0 + dir * len * 0.9), 12 - len, C.sand);
  }
  for (const x of [8, 11, 14]) b.set(x, 12, C.bark);
  return { buf: b, ax: 11, ay: 12, shadow: { ox: 2, oy: 0, rx: 8, ry: 2 } };
}

function deadtree(v: number): PropArt {
  const b = mk(30, 40);
  const t: Tones = { dark: C.bark, mid: C.wood, light: C.tan };
  const trunk = (x0: number, y0: number, x1: number, y1: number, w: number): void => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      const ww = Math.max(1, Math.round(w * (1 - i / n * 0.6)));
      for (let k = 0; k < ww; k++) b.set(x + k, y, k === 0 ? t.light : k === ww - 1 ? t.dark : t.mid);
    }
  };
  trunk(14, 37, 15 + (v ? -2 : 2), 18, 5);
  trunk(15 + (v ? -2 : 2), 20, v ? 5 : 24, 8, 3);
  trunk(15 + (v ? -2 : 2), 24, v ? 26 : 5, 14, 3);
  trunk(v ? 6 : 23, 9, v ? 3 : 26, 3, 2);
  trunk(15 + (v ? -2 : 2), 18, 14, 4, 2);
  b.set(13, 37, C.bark); b.set(19, 37, C.bark); b.set(12, 38, C.plum);
  b.outline(C.plum);
  return { buf: b, ax: 15, ay: 38, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 } };
}

// ------------------------------------------------------------------ Felsen
function rock(v: number, big: boolean): PropArt {
  const b = mk(big ? 34 : 22, big ? 26 : 16);
  if (big) { shadedDisc(b, 17, 15, 13, 9, SS, 52); shadedDisc(b, 9, 17, 7, 6, SS, 53); shadedDisc(b, 26, 18, 6, 5, SS, 54); }
  else { shadedDisc(b, 9, 10, 7, 5, SS, 55 + v); shadedDisc(b, 15, 11, 4, 3, SS, 56 + v); }
  rimBottom(b, SS.dark);
  // Schichten (waagrechte Linien) und Risse
  for (let y = 3; y < b.h; y += 4) for (let x = 0; x < b.w; x++) if (b.get(x, y) && bayer(x, y) < 0.4) b.set(x, y, SS.dark);
  sparkle(b, 6, [SS.mid], SS.light, 61 + v);
  b.outline(C.bark);
  return { buf: b, ax: big ? 17 : 11, ay: big ? 23 : 13, shadow: { ox: 4, oy: 0, rx: big ? 15 : 9, ry: big ? 4 : 3 } };
}

/** Sandsteinfelsen mit Schichtbaendern (Rost, Lehm, Tan, Pfirsich): Mesa/Zeugenberg. */
function mesa(v: number): PropArt {
  const W = 64, H = 54;
  const b = mk(W, H);
  const bands = [C.peach, C.tan, C.clay, C.tan, C.rust, C.wood, C.tan, C.clay];
  const topY = 8, botY = H - 6;
  const shape = (y: number): [number, number] => {
    const f = (y - topY) / (botY - topY);
    const wob = v === 1 ? 4 : 0;
    // oben schmaler Hut, in der Mitte eingezogen, unten Schutthalde
    const hw = f < 0.08 ? 11 + f * 60 : f < 0.5 ? 16 - (f - 0.08) * 8 + wob * Math.sin(f * 9) : 14 + (f - 0.5) * 38;
    const cx = 32 + (v === 2 ? Math.sin(f * 5) * 3 : 0);
    return [Math.round(cx - hw), Math.round(cx + hw)];
  };
  for (let y = topY; y <= botY; y++) {
    const [x0, x1] = shape(y);
    const band = bands[Math.floor((y - topY) / 4.5) % bands.length];
    for (let x = x0; x <= x1; x++) {
      const nx = (x - x0) / Math.max(1, x1 - x0);
      let c = band;
      if (nx > 0.72) c = band === C.peach ? C.tan : band === C.tan ? C.wood : band === C.clay ? C.rust : C.bark;
      else if (nx < 0.14) c = band === C.peach ? C.sand : band === C.tan ? C.peach : band === C.clay ? C.skin : band === C.rust ? C.clay : C.tan;
      if (hash2(x, y, 90 + v) > 0.93) c = nx > 0.6 ? C.bark : C.sand;
      if ((y - topY) % 9 === 0 && bayer(x, y) < 0.5) c = C.bark;
      b.set(x, y, c);
    }
    // Rinnen (senkrechte dunkle Furchen)
    if (y > topY + 6) for (const fx of [0.3, 0.55]) { const x = Math.round(x0 + (x1 - x0) * fx + Math.sin(y / 4 + fx * 9) * 1.2); if (hash2(x, y, 7) > 0.35) b.set(x, y, C.bark); }
  }
  // Geroell am Fuss
  for (let i = 0; i < 14; i++) { const x = 10 + Math.floor(hash2(i, v, 4) * 44), y = botY + Math.floor(hash2(i, v, 5) * 4); b.rect(x, y, 2 + (i & 1), 2, i % 3 ? C.tan : C.wood); b.set(x, y, C.peach); }
  rimBottom(b, C.bark, 1);
  b.outline(C.bark);
  return { buf: b, ax: 32, ay: botY + 3, shadow: { ox: 9, oy: -1, rx: 28, ry: 6 } };
}

// ------------------------------------------------------------------ Ruinen
function column(): PropArt {
  const b = mk(18, 44);
  // Sockel
  shadedRect(b, 2, 38, 14, 4, LIME, 1);
  // Schaft mit Kanneluren
  for (let y = 12; y < 38; y++) for (let x = 4; x < 14; x++) {
    const i = x - 4;
    let c = i < 2 ? LIME.light : i < 6 ? LIME.mid : LIME.dark;
    if (i === 2 || i === 5 || i === 8) c = i === 8 ? LIME.dark : LIME.mid;
    if (i === 3 || i === 6) c = i < 5 ? LIME.light : LIME.mid;
    if (hash2(x, y, 3) > 0.96) c = LIME.dark;
    b.set(x, y, c);
  }
  // Kapitell
  shadedRect(b, 2, 7, 14, 5, LIME, 2);
  shadedRect(b, 4, 12, 10, 2, LIME, 3);
  for (const x of [4, 8, 12]) b.set(x, 9, LIME.dark);
  // Abdeckplatte, an einer Ecke abgebrochen
  shadedRect(b, 1, 3, 16, 4, LIME, 4);
  b.rect(12, 3, 6, 2, 0);
  b.set(11, 5, 0); b.set(12, 6, C.tan);
  for (const [x, y] of [[6, 20], [10, 28], [7, 33]]) { b.set(x, y, C.tan); b.set(x + 1, y + 1, C.skin); }
  b.outline(C.bark);
  return { buf: b, ax: 9, ay: 41, shadow: { ox: 5, oy: 0, rx: 9, ry: 3 } };
}

function columnBroken(): PropArt {
  const b = mk(18, 28);
  shadedRect(b, 2, 22, 14, 4, LIME, 5);
  for (let y = 11; y < 22; y++) for (let x = 4; x < 14; x++) {
    const i = x - 4;
    b.set(x, y, i < 2 ? LIME.light : i < 6 ? LIME.mid : LIME.dark);
    if (i === 3 || i === 6 || i === 8) b.set(x, y, i === 8 ? LIME.dark : LIME.mid);
  }
  // gezackter Bruch oben
  for (let x = 4; x < 14; x++) { const k = [2, 0, 3, 1, 4, 0, 2, 3, 1, 2][x - 4]; for (let j = 0; j < k; j++) b.set(x, 11 + j, 0); }
  for (let x = 4; x < 14; x += 2) b.set(x, 13, C.sand);
  b.outline(C.bark);
  return { buf: b, ax: 9, ay: 26, shadow: { ox: 4, oy: 0, rx: 8, ry: 2 } };
}

function columnFallen(): PropArt {
  const b = mk(44, 16);
  for (let x = 3; x < 40; x++) for (let y = 3; y < 12; y++) {
    const j = y - 3;
    let c = j < 2 ? LIME.light : j < 5 ? LIME.mid : LIME.dark;
    if (x % 6 === 0) c = LIME.dark;
    if (hash2(x, y, 6) > 0.95) c = LIME.dark;
    b.set(x, y, c);
  }
  for (let y = 3; y < 12; y++) { b.set(2, y, LIME.light); b.set(40, y, y % 2 ? LIME.mid : LIME.dark); }
  b.rect(31, 3, 3, 2, 0); b.rect(36, 3, 5, 1, 0);
  b.rect(34, 12, 2, 1, C.tan);
  b.outline(C.bark);
  return { buf: b, ax: 22, ay: 13, shadow: { ox: 3, oy: 0, rx: 20, ry: 3 } };
}

function arch(): PropArt {
  const W = 58, H = 56;
  const b = mk(W, H);
  const pillar = (x: number, top: number): void => {
    bricks(b, x, top, 11, H - 6 - top, LIME, C.tan, 8, 5, 3);
    shadedRect(b, x - 1, H - 9, 13, 5, LIME, 9);
    shadedRect(b, x - 1, top - 3, 13, 4, LIME, 10);
  };
  pillar(6, 18);
  pillar(41, 8);
  // Bogenansatz: linke Haelfte steht, rechte ist weg
  for (let a = 0; a <= 90; a += 3) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(29 - Math.cos(rad) * 18 + 6), y = Math.round(18 - Math.sin(rad) * 14);
    if (x > 30) continue;
    for (let k = 0; k < 4; k++) b.set(x, y - k + 2, k === 0 ? LIME.light : k === 3 ? LIME.dark : LIME.mid);
  }
  // Schlussstein-Rest und herabgefallene Quader
  b.rect(30, 4, 6, 4, LIME.mid); b.rect(30, 4, 6, 1, LIME.light); b.rect(30, 7, 6, 1, LIME.dark);
  for (const [x, y, w] of [[22, H - 8, 6], [34, H - 7, 5], [16, H - 6, 4]]) { b.rect(x, y, w, 3, LIME.mid); b.rect(x, y, w, 1, LIME.light); b.rect(x, y + 2, w, 1, LIME.dark); }
  // Hieroglyphen: kleine dunkle Zeichen auf dem rechten Pfeiler
  for (let i = 0; i < 5; i++) { b.set(44 + (i % 2) * 3, 14 + i * 5, C.tan); b.set(45 + (i % 2) * 3, 15 + i * 5, C.wood); }
  b.outline(C.bark);
  return { buf: b, ax: 29, ay: H - 5, shadow: { ox: 8, oy: 0, rx: 28, ry: 5 } };
}

function obelisk(): PropArt {
  const W = 22, H = 62;
  const b = mk(W, H);
  const cx = 11;
  for (let y = 10; y < H - 8; y++) {
    const f = (y - 10) / (H - 18), half = 3 + Math.round(f * 4);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.2 ? LIME.light : nx < 0.5 ? LIME.mid : LIME.dark;
      if (hash2(x, y, 5) > 0.95) c = LIME.dark;
      b.set(cx + x, y, c);
    }
  }
  // Spitze (Pyramidion) vergoldet
  for (let y = 0; y < 10; y++) for (let x = -Math.round(y * 0.4) - (y > 3 ? 0 : 0); x <= Math.round(y * 0.4); x++) b.set(cx + x, y, x < 0 ? C.yellow : x === 0 && y < 6 ? C.amber : C.orange);
  b.set(cx, 0, C.white);
  // Hieroglyphen-Spalte
  for (let y = 16; y < H - 12; y += 4) { b.set(cx - 1, y, C.tan); b.set(cx, y + 1, C.wood); b.set(cx + 1, y, C.tan); if (hash2(y, 1, 2) > 0.5) b.set(cx, y - 1, C.wood); }
  shadedRect(b, 2, H - 8, 18, 4, LIME, 11);
  shadedRect(b, 0, H - 4, 22, 4, LIME, 12);
  b.outline(C.bark);
  return { buf: b, ax: cx, ay: H - 1, shadow: { ox: 9, oy: -1, rx: 12, ry: 4 } };
}

function ruinWall(v: number): PropArt {
  const b = mk(46, 22);
  const h = (x: number): number => 6 + Math.round(hash2(x >> 2, v, 14) * 8) + (x > 30 ? -2 : 0);
  for (let x = 2; x < 44; x++) {
    const top = 20 - h(x);
    for (let y = top; y < 18; y++) {
      const i = x - 2;
      const row = Math.floor((y - top) / 3), off = row % 2 ? 3 : 0, ix = (i + off) % 7, iy = (y - top) % 3;
      let c = iy === 2 || ix === 6 ? C.tan : LIME.mid;
      if (iy === 0) c = LIME.light;
      if (hash2(Math.floor((i + off) / 7), row, 16 + v) > 0.78 && iy !== 2 && ix !== 6) c = LIME.light;
      if (hash2(x, y, 9) > 0.95) c = LIME.dark;
      b.set(x, y, c);
    }
  }
  b.rect(2, 17, 42, 2, LIME.dark);
  for (const [x, y] of [[8, 19], [30, 19], [38, 20]]) b.rect(x, y, 3, 2, LIME.mid);
  b.outline(C.bark);
  return { buf: b, ax: 23, ay: 19, shadow: { ox: 4, oy: 0, rx: 21, ry: 4 } };
}

/** Halb versunkener Wachter: ein steinerner Kopf mit Kopftuch (Nemes), Nase abgebrochen. */
function statue(): PropArt {
  const W = 34, H = 40;
  const b = mk(W, H);
  const cx = 17;
  // Koerper/Sockelrest (Sand schluckt ihn)
  for (let y = 26; y < 36; y++) { const half = 9 + (y - 26) / 2; for (let x = -Math.round(half); x <= Math.round(half); x++) { const nx = x / half; b.set(cx + x, y, nx < -0.2 ? LIME.light : nx < 0.5 ? LIME.mid : LIME.dark); } }
  // Kopftuch (Trapez mit Streifen)
  for (let y = 2; y < 30; y++) {
    const f = (y - 2) / 28;
    const half = Math.round(7 + Math.pow(f, 1.3) * 7);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.25 ? C.yellow : nx < 0.45 ? C.amber : C.orange;
      if ((y + (x < 0 ? 0 : 1)) % 4 === 0) c = nx < -0.25 ? C.amber : nx < 0.45 ? C.orange : C.rust;
      if (Math.abs(x) <= 5 && y >= 7 && y <= 25) c = 0;
      b.set(cx + x, y, c);
    }
  }
  // Gesicht
  for (let y = 7; y <= 25; y++) for (let x = -5; x <= 5; x++) {
    const nx = x / 5.5;
    b.set(cx + x, y, nx < -0.3 ? LIME.light : nx < 0.5 ? LIME.mid : LIME.dark);
  }
  b.rect(cx - 4, 12, 3, 2, C.night); b.rect(cx + 1, 12, 3, 2, C.night); b.set(cx - 4, 12, C.white); b.set(cx + 1, 12, C.white);
  b.rect(cx - 4, 11, 3, 1, C.tan); b.rect(cx + 1, 11, 3, 1, C.tan);
  b.rect(cx - 1, 14, 3, 4, LIME.dark); b.rect(cx - 1, 14, 1, 3, LIME.mid); // Nase (Rest)
  b.rect(cx - 3, 20, 7, 1, C.wood); b.rect(cx - 2, 21, 5, 1, C.tan);
  for (const [x, y] of [[cx + 3, 9], [cx - 4, 22], [cx + 2, 24]]) { b.set(x, y, C.tan); b.set(x + 1, y, C.wood); }
  b.rect(cx - 5, 25, 11, 3, 0); // abgebrochenes Kinn
  b.rect(cx - 7, 27, 15, 2, LIME.dark);
  b.outline(C.bark);
  return { buf: b, ax: cx, ay: 36, shadow: { ox: 6, oy: 0, rx: 14, ry: 4 } };
}

// ------------------------------------------------------------------ Lager
function tent(v: number): PropArt {
  const W = 46, H = 34;
  const b = mk(W, H);
  const cx = 23;
  const [c1, c2, c3] = v ? [C.sky, C.navy, C.night] : [C.red, C.crimson, C.plum];
  for (let y = 5; y <= 28; y++) {
    const f = (y - 5) / 23, half = Math.round(2 + f * 18);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      // senkrechte Streifen: Farbe / Sand
      const stripe = Math.floor((x + 40) / 4) % 2 === 0;
      let c: number;
      if (nx < -0.2) c = stripe ? c1 : C.sand; else if (nx < 0.5) c = stripe ? c2 : C.peach; else c = stripe ? c3 : C.skin;
      // Eingang: dunkles Dreieck
      if (Math.abs(x) <= Math.round((f - 0.35) * 8) && f > 0.35) c = Math.abs(x) <= Math.round((f - 0.35) * 8) - 1 ? C.night : C.plum;
      b.set(cx + x, y, c);
    }
  }
  b.rect(cx - 2, 26, 5, 2, C.plum); b.set(cx, 25, C.dusk);
  // Zeltstange mit Wimpel, Seile
  pole(b, cx, 0, 7, { dark: C.bark, mid: C.wood, light: C.tan }, 1);
  b.rect(cx + 1, 0, 6, 3, C.amber); b.rect(cx + 1, 0, 6, 1, C.yellow); b.set(cx + 7, 1, C.orange);
  for (const sx of [-1, 1]) { b.line(cx + sx * 19, 28, cx + sx * 23, 31, C.bark); b.set(cx + sx * 23, 32, C.wood); }
  b.rect(cx - 19, 28, 39, 1, C.tan);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: 30, shadow: { ox: 6, oy: -1, rx: 22, ry: 4 } };
}

/** Liegendes Kamel (Seitenansicht, nach links schauend), v1 gespiegelt. */
function camel(v: number): PropArt {
  const W = 40, H = 30;
  const b = mk(W, H);
  const T: Tones = { dark: C.wood, mid: C.skin, light: C.peach, hi: C.sand };
  // Koerper
  shadedDisc(b, 22, 19, 12, 6, T, 31);
  // Hoecker
  shadedDisc(b, 21, 11, 4, 4, T, 32);
  shadedDisc(b, 28, 12, 3, 3, T, 33);
  // Hals und Kopf
  for (let i = 0; i < 12; i++) { const x = 11 - Math.round(i * 0.3), y = 17 - i; for (let k = 0; k < 4; k++) b.set(x + k, y, k === 0 ? T.light : k === 3 ? T.dark : T.mid); }
  shadedDisc(b, 8, 5, 4, 3, T, 34);
  b.rect(3, 5, 4, 3, T.mid); b.rect(3, 5, 4, 1, T.light); b.rect(3, 7, 4, 1, T.dark); b.set(3, 6, C.wood);
  b.set(8, 4, C.ink); b.set(9, 2, T.dark); b.set(10, 2, T.dark);
  // Beine unter dem Koerper (angewinkelt)
  b.rect(12, 23, 8, 2, T.dark); b.rect(24, 24, 9, 2, T.dark); b.rect(12, 23, 8, 1, T.mid); b.rect(24, 24, 9, 1, T.mid);
  // Satteldecke
  b.rect(17, 12, 10, 5, C.crimson); b.rect(17, 12, 10, 1, C.red); b.rect(17, 16, 10, 1, C.plum);
  for (let x = 18; x < 27; x += 2) b.set(x, 14, C.yellow);
  b.rect(26, 17, 2, 5, C.red); b.rect(26, 21, 2, 1, C.yellow);
  b.outline(C.bark);
  if (v) { const f = mk(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f.set(W - 1 - x, y, b.get(x, y)); return { buf: f, ax: 20, ay: 26, shadow: { ox: -2, oy: 0, rx: 16, ry: 3 } }; }
  return { buf: b, ax: 20, ay: 26, shadow: { ox: 2, oy: 0, rx: 16, ry: 3 } };
}

function bones(v: number): PropArt {
  const b = mk(20, 10);
  if (v === 0) { // Rinderschaedel
    b.rect(5, 3, 8, 5, C.white); b.rect(5, 3, 8, 1, C.white); b.rect(6, 7, 6, 2, C.silver);
    b.set(7, 5, C.ink); b.set(10, 5, C.ink); b.rect(8, 7, 2, 1, C.stone);
    b.line(5, 3, 2, 1, C.white); b.line(12, 3, 15, 1, C.white); b.set(2, 0, C.silver); b.set(15, 0, C.silver);
  } else { // Rippen
    for (let i = 0; i < 4; i++) b.line(4 + i * 3, 3, 3 + i * 3, 8 - (i & 1), i % 2 ? C.silver : C.white);
    b.line(3, 2, 15, 2, C.stone);
  }
  return { buf: b, ax: 10, ay: 9, shadow: { ox: 1, oy: 0, rx: 7, ry: 1 } };
}

function torch(): PropArt {
  const b = mk(14, 34);
  pole(b, 6, 12, 30, { dark: C.plum, mid: C.bark, light: C.wood }, 2);
  b.rect(4, 29, 6, 2, C.slate); b.rect(4, 29, 6, 1, C.stone);
  b.rect(4, 9, 6, 4, C.slate); b.rect(4, 9, 6, 1, C.stone); b.rect(5, 12, 4, 1, C.dusk);
  flame(b, 7, 9, 8, 0);
  b.outline(C.ink);
  return { buf: b, ax: 7, ay: 31, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 0, y: -26 } };
}

function brazier(): PropArt {
  const b = mk(22, 26);
  b.rect(8, 15, 6, 8, C.dusk); b.rect(8, 15, 2, 8, C.slate);
  b.rect(5, 22, 12, 2, C.slate); b.rect(5, 22, 12, 1, C.stone);
  dome(b, 11, 13, 8, 3, { dark: C.night, mid: C.slate, light: C.stone }, 3);
  b.rect(4, 11, 14, 2, C.slate); b.rect(4, 11, 14, 1, C.stone);
  b.rect(6, 10, 10, 1, C.crimson); b.rect(8, 10, 2, 1, C.orange);
  flame(b, 11, 10, 8, 1); flame(b, 8, 10, 5, -1); flame(b, 14, 10, 5, 1);
  b.outline(C.ink);
  return { buf: b, ax: 11, ay: 23, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 }, hook: { x: 0, y: -17 } };
}

function crate(v: number): PropArt {
  const b = mk(20, 18);
  const T: Tones = { dark: C.bark, mid: C.wood, light: C.tan };
  shadedRect(b, 2, 5, 12, 10, T, 21 + v);
  b.line(3, 6, 12, 14, C.bark); b.line(12, 6, 3, 14, C.bark);
  if (v) { shadedRect(b, 9, 1, 9, 9, T, 25); b.line(10, 2, 16, 8, C.bark); }
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 15, shadow: { ox: 3, oy: 0, rx: 9, ry: 2 } };
}

function jar(v: number): PropArt {
  const b = mk(14, 20);
  const T: Tones = { dark: C.rust, mid: C.clay, light: C.skin };
  shadedDisc(b, 7, 12, 5, 6, T, 41 + v);
  b.rect(5, 4, 5, 4, T.mid); b.rect(5, 4, 1, 4, T.light); b.rect(9, 4, 1, 4, T.dark);
  b.rect(4, 3, 7, 2, T.dark); b.rect(4, 3, 7, 1, T.mid);
  b.rect(3, 11, 9, 1, C.bark); if (v) b.rect(3, 13, 9, 1, C.amber);
  rimBottom(b, T.dark);
  b.outline(C.bark);
  return { buf: b, ax: 7, ay: 18, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function banner(): PropArt {
  const b = mk(22, 44);
  pole(b, 4, 2, 40, { dark: C.bark, mid: C.wood, light: C.tan }, 2);
  b.rect(3, 0, 4, 3, C.amber); b.rect(3, 0, 2, 1, C.yellow);
  // Tuch mit Zipfeln
  for (let y = 5; y < 26; y++) for (let x = 6; x < 18; x++) {
    const f = (x - 6) / 12, wave = Math.round(Math.sin(y / 3 + f * 2) * 1);
    if (y > 20 + (x % 4 < 2 ? 0 : 4) - Math.round(f * 2) + wave) continue;
    b.set(x + wave * 0, y, f < 0.3 ? C.red : f < 0.7 ? C.crimson : C.plum);
  }
  b.rect(8, 8, 8, 1, C.amber); b.rect(8, 9, 8, 1, C.yellow);
  b.rect(10, 12, 4, 4, C.amber); b.set(11, 13, C.yellow); b.set(12, 14, C.orange);
  b.rect(2, 40, 6, 2, C.tan);
  b.outline(C.plum);
  return { buf: b, ax: 5, ay: 41, shadow: { ox: 3, oy: 0, rx: 6, ry: 2 } };
}

function well(): PropArt {
  const b = mk(28, 30);
  shadedDisc(b, 14, 21, 11, 5, LIME, 61);
  for (let y = 15; y < 24; y++) for (let x = 4; x < 25; x++) { const nx = (x - 14) / 10.5; if (Math.abs(nx) > 1 || ((y - 15) / 8 > 1 - Math.sqrt(Math.max(0, 1 - nx * nx)) * 0 && false)) continue; }
  bricks(b, 4, 17, 21, 8, LIME, C.tan, 62, 5, 3);
  b.ellipse(14, 16, 10, 3, LIME.light); b.ellipse(14, 17, 8, 2, C.navy); b.ellipse(13, 17, 5, 1, C.sky);
  // Galgen mit Eimer
  pole(b, 4, 4, 18, { dark: C.bark, mid: C.wood, light: C.tan }, 2); pole(b, 22, 4, 18, { dark: C.bark, mid: C.wood, light: C.tan }, 2);
  b.rect(4, 3, 20, 2, C.wood); b.rect(4, 3, 20, 1, C.tan);
  b.line(14, 5, 14, 11, C.stone); b.rect(12, 11, 5, 4, C.wood); b.rect(12, 11, 5, 1, C.tan);
  b.outline(C.bark);
  return { buf: b, ax: 14, ay: 25, shadow: { ox: 4, oy: 0, rx: 13, ry: 3 } };
}

function cart(): PropArt {
  const W = 46, H = 32;
  const b = mk(W, H);
  const T: Tones = { dark: C.bark, mid: C.wood, light: C.tan };
  // Planen-Dach (Sand mit Streifen)
  for (let y = 3; y < 17; y++) {
    const f = (y - 3) / 14, half = Math.round(10 + Math.sin(f * 2.2) * 9);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.2 ? C.sand : nx < 0.5 ? C.peach : C.skin;
      if ((x + 40) % 6 < 1) c = nx < 0.4 ? C.skin : C.tan;
      b.set(23 + x, y, c);
    }
  }
  b.rect(8, 17, 31, 6, C.wood); b.rect(8, 17, 31, 1, C.tan); b.rect(8, 22, 31, 1, C.bark);
  for (let x = 10; x < 38; x += 5) b.rect(x, 18, 1, 4, C.bark);
  // Raeder
  for (const wx of [14, 33]) { b.disc(wx, 25, 5, C.bark); b.disc(wx, 25, 4, C.tan); b.disc(wx, 25, 2, C.bark); b.set(wx, 25, C.tan); b.line(wx - 4, 25, wx + 4, 25, C.bark); b.line(wx, 21, wx, 29, C.bark); }
  b.line(38, 22, 45, 26, C.bark); b.line(38, 23, 45, 27, C.wood); // Deichsel
  void T;
  b.outline(C.plum);
  return { buf: b, ax: 23, ay: 29, shadow: { ox: 4, oy: 0, rx: 21, ry: 4 } };
}

const cache = new Map<string, PropArt>();
export function dunesArt(kind: DunesKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) {
    a = (() => {
      switch (kind) {
        case 'palm': return palm(v, false);
        case 'palmsmall': return palm(v, true);
        case 'reeds': return reeds(v);
        case 'cactus': return cactus(v);
        case 'cactusround': return cactusRound(v);
        case 'shrub': return shrub(v);
        case 'deadtree': return deadtree(v);
        case 'mesa': return mesa(v);
        case 'rock': return rock(v, false);
        case 'boulder': return rock(v, true);
        case 'column': return column();
        case 'columnbroken': return columnBroken();
        case 'columnfallen': return columnFallen();
        case 'arch': return arch();
        case 'obelisk': return obelisk();
        case 'ruinwall': return ruinWall(v);
        case 'statue': return statue();
        case 'tent': return tent(v);
        case 'camel': return camel(v);
        case 'bones': return bones(v);
        case 'torch': return torch();
        case 'brazier': return brazier();
        case 'crate': return crate(v);
        case 'jar': return jar(v);
        case 'banner': return banner();
        case 'well': return well();
        case 'cart': return cart();
      }
    })();
    cache.set(key, a);
  }
  return a;
}
