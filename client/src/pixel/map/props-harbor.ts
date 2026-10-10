/**
 * Gemalte Dinge von Gloomharbor (Runde 16 / K2): Staffelgiebel- und Fachwerkhaeuser, Wirtshaus, Lagerhaeuser, Zollhaus,
 * Leuchtturm, Torbauten, Laternen, Kisten, Fass, Netze, Kran, Brunnen, Schiffe und Boote. Nachtszene: gedeckte Putz- und
 * Dachtoene, dazu warm erleuchtete Fenster. Regeln wie `props.ts`: Licht (Mond) oben links, drei Toene, Umriss in der
 * dunkelsten Flaechenfarbe, Schatten separat. Fussmitte unten = (ax, ay).
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, type PropArt, type Tones } from './props';
import { bricks, crenel, dome, flame, pole, shadedRect, tileRoof, windowLit } from './k2sprites';

export type HarborKind =
  | 'house' | 'cottage' | 'tavern' | 'warehouse' | 'customs' | 'lighthouse' | 'lamp' | 'crate' | 'barrel' | 'net' | 'bollard' | 'anchor'
  | 'coil' | 'crane' | 'fountain' | 'gatetower' | 'ship' | 'rowboat' | 'banner' | 'sign' | 'cart';

const PLASTER: Tones[] = [
  { dark: C.dusk, mid: C.slate, light: C.stone, hi: C.silver },
  { dark: C.bark, mid: C.wood, light: C.tan },
  { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone },
  { dark: C.plum, mid: C.violet, light: C.orchid },
];
const ROOFS: Tones[] = [
  { dark: C.night, mid: C.dusk, light: C.slate },
  { dark: C.plum, mid: C.crimson, light: C.red },
  { dark: C.deep, mid: C.pine, light: C.grass },
  { dark: C.plum, mid: C.violet, light: C.orchid },
];
const TIMBER: Tones = { dark: C.plum, mid: C.bark, light: C.wood };
const STONE: Tones = { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone };

// ------------------------------------------------------------------ Haeuser
/** Staffelgiebel-Stadthaus: schmale Fassade, Stufen oben, zwei Fensterreihen, Tuer mit Laterne. */
function townhouse(v: number): PropArt {
  const W = 36, H = 62;
  const b = mk(W, H);
  const P = PLASTER[v % 4];
  const x0 = 4, x1 = 31, wallBot = H - 3;
  const top = 9;
  // Stufen: Breite je Stufe
  const steps = [8, 12, 16, 20, 24, 28];
  const halfAt = (y: number): number => {
    const k = Math.floor((y - top) / 3);
    return k < steps.length ? steps[k] / 2 : 14;
  };
  const cx = (x0 + x1 + 1) / 2;
  for (let y = top; y <= wallBot; y++) {
    const h = halfAt(y);
    for (let x = Math.round(cx - h); x < Math.round(cx + h); x++) {
      const i = x - x0;
      let c = i < 2 ? P.light : i >= 25 ? P.dark : P.mid;
      if (v % 4 === 1) { // Fachwerk: Putzfelder zwischen Balken
        c = (i + 2) % 7 === 0 || (y - top) % 12 === 11 ? C.plum : i < 2 ? C.sand : i >= 25 ? C.tan : C.peach;
        if (c === C.sand || c === C.peach || c === C.tan) c = i < 2 ? C.stone : i >= 25 ? C.slate : C.dusk; // Nacht: gedimmt
      } else if (hash2(x, y, 5 + v) > 0.93) c = P.light;
      b.set(x, y, c);
    }
  }
  // Stufenkanten hell (Mondlicht oben links)
  for (let k = 0; k < steps.length; k++) { const y = top + k * 3; b.rect(Math.round(cx - steps[k] / 2), y, steps[k], 1, P.hi ?? P.light); }
  // Gesims zwischen den Geschossen
  for (const y of [wallBot - 17, wallBot - 33]) b.rect(x0, y, x1 - x0 + 1, 1, P.dark);
  // Fenster: je Geschoss 2-3, zufaellig beleuchtet
  const rows = [wallBot - 29, wallBot - 13];
  rows.forEach((wy, ri) => {
    const xs = ri === 0 ? [cx - 9, cx - 2, cx + 5] : [cx - 9, cx + 5];
    xs.forEach((wx, ci) => { if (!(ri === 0 && wy < top + 8 && ci === 2)) windowLit(b, Math.round(wx), wy, 4, 6, hash2(ri, ci, 30 + v) > 0.35, C.night); });
  });
  b.rect(Math.round(cx - 3), top + 8, 6, 5, C.night); b.rect(Math.round(cx - 2), top + 9, 4, 3, hash2(v, 1, 9) > 0.4 ? C.amber : C.dusk); // Speicherluke
  // Tuer + Laterne
  const dx = Math.round(cx - 3);
  b.rect(dx - 1, wallBot - 11, 8, 12, C.night);
  b.rect(dx, wallBot - 10, 6, 11, C.bark); b.rect(dx, wallBot - 10, 2, 11, C.wood); b.rect(dx + 1, wallBot - 11, 4, 1, C.bark);
  b.set(dx + 4, wallBot - 5, C.yellow);
  b.rect(dx + 7, wallBot - 12, 3, 4, C.night); b.rect(dx + 8, wallBot - 11, 1, 2, C.amber);
  b.rect(x0, wallBot - 1, x1 - x0 + 1, 2, STONE.light);
  b.outline(C.ink);
  return { buf: b, ax: Math.round(cx), ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: 17, ry: 5 }, hook: { x: 6, y: -(wallBot - 10) } };
}

/** Giebelhaus mit Satteldach (Traufseite vorn): breit, flach, Schornstein mit Rauch. */
function cottage(v: number): PropArt {
  const W = 40, H = 40;
  const b = mk(W, H);
  const P = PLASTER[(v + 1) % 4], R = ROOFS[v % 4];
  const wl = 4, wr = W - 5, wallTop = 20, wallBot = H - 3, roofT = 5;
  for (let y = wallTop; y <= wallBot; y++) for (let x = wl; x <= wr; x++) {
    const i = x - wl;
    let c = i < 2 ? P.light : i >= wr - wl - 2 ? P.dark : P.mid;
    if (hash2(x, y, 7 + v) > 0.92) c = P.light;
    b.set(x, y, c);
  }
  b.rect(wl, wallBot - 1, wr - wl + 1, 2, STONE.mid);
  windowLit(b, wl + 6, wallTop + 4, 5, 6, true, C.night);
  windowLit(b, wr - 11, wallTop + 4, 5, 6, v !== 1, C.night);
  const dx = Math.round((wl + wr) / 2) - 3;
  b.rect(dx - 1, wallBot - 11, 8, 11, C.night); b.rect(dx, wallBot - 10, 6, 10, C.bark); b.rect(dx, wallBot - 10, 2, 10, C.wood); b.set(dx + 4, wallBot - 5, C.yellow);
  b.rect(wl + 5, wallTop + 11, 7, 1, C.wood); b.set(wl + 6, wallTop + 10, C.red); b.set(wl + 8, wallTop + 10, C.yellow);
  tileRoof(b, Math.floor(W / 2), roofT, wallTop, 11, 18, R, 20 + v);
  b.rect(Math.floor(W / 2) - 11, roofT, 23, 1, R.light);
  b.rect(Math.floor(W / 2) - 18, wallTop, 37, 1, R.dark);
  // Schornstein
  b.rect(wr - 12, 0, 4, 8, STONE.mid); b.rect(wr - 12, 0, 1, 8, STONE.light); b.rect(wr - 9, 0, 1, 8, STONE.dark); b.rect(wr - 13, 0, 6, 1, STONE.light);
  b.outline(C.ink);
  return { buf: b, ax: Math.floor(W / 2), ay: wallBot + 1, shadow: { ox: 8, oy: -1, rx: 20, ry: 5 }, hook: { x: wr - 10 - Math.floor(W / 2), y: -(wallBot + 1) } };
}

function tavern(v: number): PropArt {
  const W = 52, H = 54;
  const b = mk(W, H);
  const P = v ? PLASTER[1] : PLASTER[0], R = ROOFS[v ? 1 : 0];
  const wl = 4, wr = W - 5, wallTop = 24, wallBot = H - 3;
  for (let y = wallTop; y <= wallBot; y++) for (let x = wl; x <= wr; x++) {
    const i = x - wl;
    let c = i < 2 ? P.light : i >= wr - wl - 3 ? P.dark : P.mid;
    if ((i + 3) % 11 === 0 || (y - wallTop) % 14 === 13) c = C.plum; // Fachwerk
    if (hash2(x, y, 3) > 0.93) c = P.light;
    b.set(x, y, c);
  }
  b.rect(wl, wallBot - 1, wr - wl + 1, 2, STONE.mid);
  // grosse, helle Fenster (die Schenke ist voll)
  windowLit(b, wl + 5, wallTop + 6, 7, 8, true, C.night);
  windowLit(b, wr - 14, wallTop + 6, 7, 8, true, C.night);
  windowLit(b, wl + 18, wallTop + 6, 5, 6, false, C.night);
  // Tuer mit Vordach und Laterne
  const dx = 25;
  b.rect(dx - 1, wallBot - 13, 9, 14, C.night); b.rect(dx, wallBot - 12, 7, 13, C.bark); b.rect(dx, wallBot - 12, 2, 13, C.wood); b.set(dx + 5, wallBot - 6, C.yellow);
  b.rect(dx - 2, wallBot - 15, 11, 2, R.mid); b.rect(dx - 2, wallBot - 15, 11, 1, R.light);
  b.rect(dx + 9, wallBot - 13, 3, 5, C.night); b.rect(dx + 10, wallBot - 12, 1, 3, C.amber);
  // Aushaengeschild mit Humpen
  pole(b, 45, wallTop + 2, wallTop + 6, { dark: C.night, mid: C.dusk, light: C.slate }, 1);
  b.rect(45, wallTop + 6, 6, 6, C.wood); b.rect(45, wallTop + 6, 6, 1, C.tan); b.rect(46, wallTop + 8, 3, 3, C.amber); b.set(46, wallTop + 8, C.white); b.rect(49, wallTop + 9, 1, 1, C.amber);
  tileRoof(b, 26, 6, wallTop, 14, 24, R, 40 + v);
  b.rect(26 - 14, 6, 29, 1, R.light);
  b.rect(26 - 24, wallTop, 49, 1, R.dark);
  // Schornstein x2
  for (const sx of [8, 36]) { b.rect(sx, 0, 4, 9, STONE.mid); b.rect(sx, 0, 1, 9, STONE.light); b.rect(sx + 3, 0, 1, 9, STONE.dark); b.rect(sx - 1, 0, 6, 1, STONE.light); }
  b.outline(C.ink);
  return { buf: b, ax: 26, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: 26, ry: 6 }, hook: { x: 8 + 2 - 26, y: -(wallBot + 1) } };
}

function warehouse(v: number): PropArt {
  const len = [134, 72, 54][v] ?? 72;
  const W = len + 8, H = 36;
  const b = mk(W, H);
  const R = ROOFS[0];
  const wl = 4, wr = W - 5, wallTop = 15, wallBot = H - 3;
  // Bretterwand mit Querleisten
  for (let y = wallTop; y <= wallBot; y++) for (let x = wl; x <= wr; x++) {
    const i = x - wl;
    let c = i % 4 === 0 ? TIMBER.light : i % 4 === 3 ? TIMBER.dark : TIMBER.mid;
    if (i < 2) c = TIMBER.light; else if (i >= wr - wl - 2) c = TIMBER.dark;
    if ((y - wallTop) % 10 === 9) c = C.plum;
    b.set(x, y, c);
  }
  b.rect(wl, wallBot - 1, wr - wl + 1, 2, STONE.mid);
  // Tore: je ~44 px ein grosses Doppeltor mit Eisenbaendern
  const gates = Math.max(1, Math.round(len / 44));
  for (let g = 0; g < gates; g++) {
    const gx = Math.round(wl + (len / gates) * (g + 0.5)) - 9;
    b.rect(gx - 1, wallTop + 3, 20, wallBot - wallTop - 3, C.night);
    b.rect(gx, wallTop + 4, 18, wallBot - wallTop - 4, C.wood); b.rect(gx, wallTop + 4, 9, wallBot - wallTop - 4, C.tan); b.rect(gx + 9, wallTop + 4, 1, wallBot - wallTop - 4, C.bark);
    for (const y of [wallTop + 7, wallBot - 5]) b.rect(gx, y, 18, 1, C.slate);
    b.line(gx + 1, wallTop + 5, gx + 8, wallBot - 3, C.bark); b.line(gx + 17, wallTop + 5, gx + 10, wallBot - 3, C.bark);
    b.rect(gx + 8, wallTop, 3, 3, C.night); b.set(gx + 9, wallTop + 1, C.amber); // Lampe ueber dem Tor
  }
  // niedriges Satteldach (nur 11 px hoch), Hebebalken
  tileRoof(b, Math.floor(W / 2), 3, wallTop, Math.floor(len / 2) - 4, Math.floor(len / 2) + 4, R, 60 + v);
  b.rect(Math.floor(W / 2) - Math.floor(len / 2) + 4, 3, len - 8, 1, R.light);
  b.rect(wl, wallTop, wr - wl + 1, 1, R.dark);
  if (len >= 72) { b.rect(wr - 12, 1, 9, 2, TIMBER.mid); b.rect(wr - 12, 1, 9, 1, TIMBER.light); b.line(wr - 11, 3, wr - 11, 12, C.stone); b.rect(wr - 12, 12, 3, 2, C.slate); }
  b.outline(C.ink);
  return { buf: b, ax: Math.floor(W / 2), ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: Math.floor(W / 2) + 2, ry: 6 }, hook: { x: 0, y: -(wallBot + 1) + 4 } };
}

function customs(): PropArt {
  const W = 66, H = 60;
  const b = mk(W, H);
  const wl = 4, wr = W - 5, wallTop = 26, wallBot = H - 3;
  bricks(b, wl, wallTop, wr - wl + 1, wallBot - wallTop + 1, STONE, C.night, 77, 6, 3);
  // Saeulenportal
  for (const px of [24, 38]) { shadedRect(b, px, wallTop + 6, 4, wallBot - wallTop - 6, { dark: C.slate, mid: C.stone, light: C.silver }, 3); }
  b.rect(22, wallTop + 3, 20, 3, C.stone); b.rect(22, wallTop + 3, 20, 1, C.silver);
  b.rect(28, wallBot - 12, 8, 12, C.night); b.rect(29, wallBot - 11, 6, 11, C.amber); b.rect(29, wallBot - 11, 3, 6, C.yellow); b.rect(31, wallBot - 11, 1, 11, C.night);
  windowLit(b, wl + 6, wallTop + 8, 5, 7, true, C.night); windowLit(b, wl + 16, wallTop + 8, 4, 7, false, C.night);
  windowLit(b, wr - 11, wallTop + 8, 5, 7, true, C.night); windowLit(b, wr - 20, wallTop + 8, 4, 7, true, C.night);
  tileRoof(b, 33, 10, wallTop, 18, 29, ROOFS[3], 88);
  b.rect(33 - 18, 10, 37, 1, ROOFS[3].light);
  // Glockenturm
  shadedRect(b, 28, 2, 10, 9, STONE, 99);
  b.rect(31, 4, 4, 5, C.night); b.rect(32, 5, 2, 3, C.amber); b.rect(31, 1, 4, 1, STONE.hi!);
  // Fahne
  pole(b, 33, -1 + 1, 2, { dark: C.night, mid: C.dusk, light: C.slate }, 1);
  b.rect(34, 0, 7, 3, C.red); b.rect(34, 0, 7, 1, C.coral); b.set(41, 1, C.crimson);
  b.rect(wl, wallBot - 1, wr - wl + 1, 2, STONE.light);
  b.outline(C.ink);
  return { buf: b, ax: 33, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: 34, ry: 6 }, hook: { x: 0, y: -(wallBot + 1) + 4 } };
}

function lighthouse(): PropArt {
  const W = 36, H = 100;
  const b = mk(W, H);
  const cx = 18, wallBot = H - 3;
  // Sockelhaus
  bricks(b, 6, wallBot - 14, 24, 14, STONE, C.night, 55, 5, 3);
  tileRoof(b, 18, wallBot - 22, wallBot - 14, 8, 14, ROOFS[0], 66);
  // Turm: konisch, weiss/rot geringelt, Licht links
  for (let y = 22; y < wallBot - 20; y++) {
    const f = (y - 22) / (wallBot - 42), half = 5 + Math.round(f * 4);
    const band = Math.floor((y - 22) / 9) % 2;
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      const base = band ? [C.crimson, C.red, C.rust] : [C.stone, C.silver, C.slate];
      b.set(cx + x, y, nx < -0.25 ? base[1] : nx < 0.45 ? base[0] : base[2]);
    }
  }
  windowLit(b, cx - 1, 50, 3, 4, true, C.night); windowLit(b, cx - 1, 66, 3, 4, true, C.night);
  // Galerie
  b.rect(cx - 9, 19, 19, 3, C.slate); b.rect(cx - 9, 19, 19, 1, C.stone);
  for (let x = -8; x <= 8; x += 2) b.rect(cx + x, 16, 1, 3, C.dusk);
  b.rect(cx - 9, 16, 19, 1, C.slate);
  // Laternenhaus: gelbes Glas, Mitte hell
  b.rect(cx - 5, 7, 11, 9, C.night); b.rect(cx - 4, 8, 9, 8, C.amber); b.rect(cx - 4, 8, 5, 5, C.yellow); b.rect(cx - 2, 9, 2, 3, C.white);
  b.rect(cx, 7, 1, 9, C.night);
  // Kappe
  for (let y = 0; y < 7; y++) { const h = Math.round(y * 0.9) + 1; b.rect(cx - h, y, 2 * h + 1, 1, y < 2 ? ROOFS[1].light : y < 5 ? ROOFS[1].mid : ROOFS[1].dark); }
  b.set(cx, 0, C.yellow);
  b.outline(C.ink);
  return { buf: b, ax: cx, ay: wallBot + 1, shadow: { ox: 10, oy: -1, rx: 17, ry: 5 }, hook: { x: 0, y: -(wallBot + 1) + 12 } };
}

function gatetower(): PropArt {
  const W = 30, H = 62;
  const b = mk(W, H);
  const x0 = 3, x1 = 26, wallTop = 16, wallBot = H - 3;
  bricks(b, x0, wallTop, x1 - x0 + 1, wallBot - wallTop + 1, STONE, C.night, 31, 6, 3);
  crenel(b, x0 - 1, x1 - x0 + 3, wallTop - 6, STONE, 4, 3, 4);
  b.rect(x0 - 1, wallTop - 2, x1 - x0 + 3, 2, STONE.light); b.rect(x0 - 1, wallTop, x1 - x0 + 3, 1, STONE.dark);
  // Schiessscharten
  for (const [sx, sy] of [[8, 26], [8, 40], [18, 33]]) { b.rect(sx, sy, 2, 5, C.ink); b.set(sx, sy, C.dusk); }
  // Tor-Bogen unten
  b.rect(10, wallBot - 11, 9, 11, C.ink); b.rect(11, wallBot - 12, 7, 1, C.ink); b.rect(11, wallBot - 10, 7, 10, C.night);
  // Fahne
  pole(b, 14, 0, 11, { dark: C.night, mid: C.dusk, light: C.slate }, 1);
  b.rect(15, 1, 9, 6, C.navy); b.rect(15, 1, 9, 1, C.sky); b.rect(17, 3, 5, 2, C.silver); b.set(24, 3, C.night);
  // Fackel
  b.rect(22, wallBot - 17, 2, 4, C.bark); flame(b, 23, wallBot - 18, 5);
  b.outline(C.ink);
  return { buf: b, ax: 15, ay: wallBot + 1, shadow: { ox: 8, oy: -1, rx: 16, ry: 5 }, hook: { x: 8, y: -(wallBot - 20) } };
}

// ------------------------------------------------------------------ Kleinzeug
function lamp(): PropArt {
  const b = mk(14, 36);
  b.rect(6, 12, 2, 22, C.night); b.rect(6, 12, 1, 22, C.dusk);
  b.rect(4, 31, 6, 3, C.slate); b.rect(4, 31, 6, 1, C.stone);
  b.rect(3, 8, 8, 2, C.slate); // Arm
  b.rect(4, 2, 6, 7, C.night); b.rect(5, 3, 4, 5, C.amber); b.rect(5, 3, 2, 3, C.yellow); b.set(5, 3, C.white);
  b.rect(3, 1, 8, 1, C.slate); b.rect(5, 0, 4, 1, C.stone);
  b.outline(C.ink);
  return { buf: b, ax: 7, ay: 33, shadow: { ox: 3, oy: 0, rx: 5, ry: 2 }, hook: { x: 0, y: -29 } };
}

function crate(v: number): PropArt {
  const b = mk(22, 20);
  shadedRect(b, 2, 7, 12, 10, TIMBER, 91 + v);
  b.line(3, 8, 12, 16, C.plum); b.line(12, 8, 3, 16, C.plum);
  shadedRect(b, 8, 1 + (v ? 0 : 3), 10, 9 - (v ? 0 : 3), { dark: C.bark, mid: C.wood, light: C.tan }, 93 + v);
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 17, shadow: { ox: 3, oy: 0, rx: 9, ry: 2 } };
}

function barrel(): PropArt {
  const b = mk(14, 18);
  dome(b, 7, 9, 5, 7, { dark: C.plum, mid: C.bark, light: C.wood }, 3);
  b.rect(2, 5, 11, 1, C.slate); b.rect(2, 12, 11, 1, C.slate);
  b.rect(3, 3, 8, 1, C.wood);
  b.outline(C.plum);
  return { buf: b, ax: 7, ay: 15, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function net(): PropArt {
  const b = mk(30, 28);
  pole(b, 3, 4, 25, { dark: C.plum, mid: C.bark, light: C.wood }, 2); pole(b, 25, 4, 25, { dark: C.plum, mid: C.bark, light: C.wood }, 2);
  b.rect(3, 3, 24, 2, C.wood); b.rect(3, 3, 24, 1, C.tan);
  for (let y = 5; y < 22; y += 2) for (let x = 6; x < 25; x += 2) { if (((x + y) >> 1) % 2) b.set(x, y, C.stone); else b.set(x, y + 1, C.slate); }
  for (let x = 7; x < 24; x += 5) { b.set(x, 22, C.silver); b.set(x + 1, 23, C.stone); } // Fische
  b.outline(C.plum);
  return { buf: b, ax: 15, ay: 25, shadow: { ox: 3, oy: 0, rx: 13, ry: 2 } };
}

function bollard(): PropArt {
  const b = mk(10, 10);
  b.rect(2, 3, 5, 5, C.dusk); b.rect(2, 3, 2, 5, C.slate); b.rect(1, 2, 7, 2, C.slate); b.rect(1, 2, 7, 1, C.stone);
  b.outline(C.ink);
  return { buf: b, ax: 5, ay: 8, shadow: { ox: 2, oy: 0, rx: 4, ry: 1 } };
}

function anchor(): PropArt {
  const b = mk(18, 12);
  b.line(2, 6, 14, 6, C.slate); b.line(2, 5, 14, 5, C.stone);
  b.line(2, 6, 4, 10, C.slate); b.line(14, 6, 11, 10, C.slate); b.rect(1, 9, 4, 1, C.slate); b.rect(10, 9, 4, 1, C.slate);
  b.rect(12, 3, 4, 1, C.slate); b.rect(8, 4, 1, 3, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 9, ay: 10, shadow: { ox: 1, oy: 0, rx: 7, ry: 1 } };
}

function coil(): PropArt {
  const b = mk(14, 9);
  b.ellipse(7, 5, 5, 2.4, C.tan); b.ellipse(7, 4, 5, 2, C.peach); b.ellipse(7, 4, 3, 1, C.tan); b.ellipse(7, 4, 1, 0.5, C.wood);
  b.outline(C.plum);
  return { buf: b, ax: 7, ay: 8, shadow: { ox: 1, oy: 0, rx: 6, ry: 1 } };
}

function crane(): PropArt {
  const W = 54, H = 70;
  const b = mk(W, H);
  // Turm: zwei Holme + Querstreben
  for (const x of [14, 22]) pole(b, x, 18, 66, { dark: C.plum, mid: C.bark, light: C.wood }, 3);
  for (let y = 24; y < 64; y += 9) { b.line(15, y, 24, y + 8, C.wood); b.line(24, y, 15, y + 8, C.bark); b.rect(14, y, 11, 1, C.bark); }
  b.rect(10, 62, 20, 4, C.slate); b.rect(10, 62, 20, 1, C.stone);
  // Ausleger ueber das Wasser (nach unten rechts im Bild = Wasser liegt unten), hier nach rechts
  b.rect(10, 14, 38, 3, C.bark); b.rect(10, 14, 38, 1, C.wood); b.rect(10, 16, 38, 1, C.plum);
  b.line(19, 18, 46, 15, C.wood); b.line(19, 8, 46, 14, C.stone); b.line(19, 8, 19, 18, C.stone);
  b.rect(16, 6, 6, 3, C.slate); b.rect(16, 6, 6, 1, C.stone);
  // Seil, Haken, Last
  b.line(44, 17, 44, 42, C.stone); b.rect(42, 42, 5, 2, C.slate); b.rect(40, 44, 9, 7, C.wood); b.rect(40, 44, 9, 1, C.tan); b.line(41, 45, 47, 50, C.bark);
  // Gegengewicht
  b.rect(8, 16, 6, 8, C.slate); b.rect(8, 16, 6, 1, C.stone);
  b.outline(C.ink);
  return { buf: b, ax: 20, ay: 67, shadow: { ox: 6, oy: 0, rx: 14, ry: 3 } };
}

function fountain(): PropArt {
  const W = 34, H = 34;
  const b = mk(W, H);
  shadedDisc(b, 17, 24, 14, 7, STONE, 5);
  b.ellipse(17, 22, 12, 5, STONE.light); b.ellipse(17, 23, 10, 4, C.navy); b.ellipse(15, 22, 6, 2, C.sky); b.set(12, 22, C.ice);
  // Mittelsaeule mit Schale
  b.rect(15, 10, 4, 14, STONE.mid); b.rect(15, 10, 1, 14, STONE.light); b.rect(18, 10, 1, 14, STONE.dark);
  b.ellipse(17, 10, 6, 2, STONE.mid); b.ellipse(17, 9, 6, 2, STONE.light); b.ellipse(17, 9, 4, 1, C.sky);
  // Fontaene
  for (const [x, y] of [[17, 7], [17, 5], [16, 4], [18, 4], [15, 6], [19, 6], [17, 3]]) b.set(x, y, C.ice);
  b.set(17, 2, C.white);
  b.outline(C.night);
  return { buf: b, ax: 17, ay: 29, shadow: { ox: 4, oy: 0, rx: 15, ry: 3 } };
}

function banner(): PropArt {
  const b = mk(20, 44);
  pole(b, 4, 2, 40, { dark: C.night, mid: C.dusk, light: C.slate }, 2);
  b.rect(3, 0, 4, 3, C.stone);
  for (let y = 5; y < 28; y++) for (let x = 6; x < 17; x++) {
    const f = (x - 6) / 11;
    if (y > 22 + (x % 4 < 2 ? 0 : 3)) continue;
    b.set(x, y, f < 0.3 ? C.sky : f < 0.7 ? C.navy : C.night);
  }
  b.rect(8, 10, 6, 1, C.silver); b.rect(10, 8, 2, 6, C.silver); b.rect(8, 16, 6, 1, C.stone);
  b.rect(2, 40, 6, 2, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 5, ay: 41, shadow: { ox: 3, oy: 0, rx: 6, ry: 2 } };
}

function sign(): PropArt {
  const b = mk(22, 26);
  b.rect(10, 6, 2, 18, C.bark); b.rect(10, 6, 1, 18, C.wood);
  b.rect(3, 4, 16, 7, C.wood); b.rect(3, 4, 16, 1, C.tan); b.rect(3, 10, 16, 1, C.bark);
  b.rect(5, 6, 9, 1, C.bark); b.rect(5, 8, 6, 1, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 11, ay: 24, shadow: { ox: 3, oy: 0, rx: 7, ry: 2 } };
}

function cart(): PropArt {
  const b = mk(34, 24);
  b.rect(4, 8, 22, 7, C.wood); b.rect(4, 8, 22, 1, C.tan); b.rect(4, 14, 22, 1, C.bark);
  for (const x of [8, 13, 18]) b.rect(x, 9, 1, 5, C.bark);
  dome(b, 10, 6, 4, 4, { dark: C.plum, mid: C.bark, light: C.wood }, 2); dome(b, 18, 6, 4, 4, { dark: C.plum, mid: C.bark, light: C.wood }, 3);
  b.disc(15, 18, 4, C.bark); b.disc(15, 18, 3, C.tan); b.disc(15, 18, 1, C.bark); b.line(11, 18, 19, 18, C.bark);
  b.line(26, 12, 33, 16, C.bark); b.line(26, 13, 33, 17, C.wood);
  b.outline(C.plum);
  return { buf: b, ax: 16, ay: 21, shadow: { ox: 3, oy: 0, rx: 15, ry: 3 } };
}

function rowboat(): PropArt {
  const b = mk(30, 14);
  for (let x = 2; x < 28; x++) {
    const t = (x - 2) / 25, sag = Math.round(Math.sin(t * Math.PI) * 3);
    const top = 3 - Math.round(Math.sin(t * Math.PI) * 1);
    for (let y = top; y < 7 + sag; y++) b.set(x, y, y === top ? C.tan : y > 4 + sag ? C.plum : C.bark);
  }
  b.rect(5, 3, 20, 1, C.wood);
  for (let x = 8; x < 24; x += 6) b.rect(x, 4, 1, 3, C.plum);
  b.line(9, 2, 17, 8, C.tan);
  b.outline(C.ink);
  return { buf: b, ax: 15, ay: 9, shadow: { ox: 2, oy: 0, rx: 13, ry: 2 } };
}

// ------------------------------------------------------------------ Schiffe
/**
 * Vertaeutes Schiff (Seitenansicht, Bug links, Mondlicht von links): v0 Galeone, v1 Schaluppe, v2 Fischkutter.
 * Fusspunkt = Mitte der Wasserlinie. Segel gerefft (eng um die Rahen gebunden), Laterne am Heck, Wimpel am Mast.
 */
function ship(v: number): PropArt {
  const cfg = [
    { L: 82, hh: 13, H: 88, masts: [[24, 58], [46, 66], [66, 44]], cast: 8 },
    { L: 58, hh: 11, H: 66, masts: [[20, 46], [38, 40]], cast: 5 },
    { L: 44, hh: 9, H: 48, masts: [[18, 32]], cast: 3 },
  ][v] ?? { L: 58, hh: 11, H: 66, masts: [[20, 46]], cast: 4 };
  const { L, hh, H, masts, cast } = cfg;
  const W = L + 14;
  const b = mk(W, H);
  const x0 = 6, base = H - 4; // Wasserlinie
  const hull: Tones = { dark: C.plum, mid: C.bark, light: C.wood };
  // Rumpf
  for (let x = 0; x <= L; x++) {
    const t = x / L;
    const sheer = Math.round((1 - t) * (1 - t) * 5 + (t > 0.78 ? (t - 0.78) * cast * 3.2 : 0)); // Bug hoch, Heck mit Aufbau
    const bottom = t < 0.12 ? Math.round((0.12 - t) * 45) : t > 0.9 ? Math.round((t - 0.9) * 20) : 0;
    const top = base - hh - sheer;
    for (let y = top; y <= base - bottom; y++) {
      const f = (y - top) / Math.max(1, base - bottom - top);
      let c = f < 0.18 ? hull.light : f > 0.82 ? hull.dark : hull.mid;
      if ((y - top) % 4 === 3) c = hull.dark;
      if (t < 0.15 && f < 0.5) c = hull.light;
      if (hash2(x, y, 40 + v) > 0.94) c = hull.light;
      if (f < 0.1) c = C.tan;
      b.set(x0 + x, y, c);
    }
    // Zierstreifen
    if (v < 2) b.set(x0 + x, top + 3, C.amber);
  }
  // Kanonenpforten (Galeone)
  if (v === 0) for (let x = 14; x < L - 12; x += 9) { b.rect(x0 + x, base - hh + 5, 3, 3, C.night); b.set(x0 + x, base - hh + 5, C.dusk); }
  // Heckaufbau mit Fenster
  const sx = x0 + L - 14;
  b.rect(sx, base - hh - cast - 5, 14, cast + 5, hull.mid); b.rect(sx, base - hh - cast - 5, 14, 1, C.tan); b.rect(sx + 13, base - hh - cast - 5, 1, cast + 5, hull.dark);
  windowLit(b, sx + 3, base - hh - cast - 3, 3, 3, true, C.night); windowLit(b, sx + 8, base - hh - cast - 3, 3, 3, true, C.night);
  // Reling mit Pfosten
  for (let x = 4; x < L - 14; x += 4) b.rect(x0 + x, base - hh - 8, 1, 3, hull.dark);
  b.rect(x0 + 4, base - hh - 5 - 2, L - 20, 1, hull.mid);
  // Bugspriet
  b.line(x0 + 2, base - hh - 5, x0 - 6, base - hh - 10, C.wood); b.line(x0 + 2, base - hh - 4, x0 - 6, base - hh - 9, C.bark);
  // Masten, gerefftes Segel (Bueschel), Seile, Wimpel
  masts.forEach(([mx, mh], i) => {
    const px = x0 + mx, py = base - hh - 5;
    pole(b, px, py - mh, py, { dark: C.plum, mid: C.bark, light: C.wood }, 2);
    // Rahen mit gerefftem Segel
    for (let k = 0; k < (mh > 50 ? 2 : 1); k++) {
      const ry = py - mh + 8 + k * 17;
      const hw = 8 - k * 2 + (i === masts.length - 1 && v === 0 ? -2 : 0);
      b.rect(px - hw, ry, 2 * hw + 2, 1, C.wood);
      b.rect(px - hw + 1, ry + 1, 2 * hw, 4, C.silver); b.rect(px - hw + 1, ry + 1, 2 * hw, 1, C.white); b.rect(px - hw + 1, ry + 4, 2 * hw, 1, C.stone);
      for (let x = px - hw + 2; x < px + hw; x += 3) b.rect(x, ry + 1, 1, 4, C.stone);
    }
    // Wimpel
    b.rect(px + 1, py - mh - 1, 7, 3, C.red); b.set(px + 8, py - mh, C.crimson);
    // Wanten zum Rumpf
    b.line(px, py - mh + 6, x0 + mx - 8, base - hh - 5, C.slate);
    b.line(px + 1, py - mh + 6, x0 + mx + 8, base - hh - 5, C.slate);
  });
  // Laterne am Heck
  const lx = x0 + L + 2;
  b.rect(lx, base - hh - cast - 12, 1, 8, C.dusk); b.rect(lx - 1, base - hh - cast - 15, 4, 4, C.night); b.rect(lx, base - hh - cast - 14, 2, 2, C.amber); b.set(lx, base - hh - cast - 14, C.yellow);
  // Wasserlinie: heller Schaum, dunkle Fugen darunter
  for (let x = -2; x <= L + 2; x++) { b.set(x0 + x, base + 1, x % 3 === 0 ? C.silver : C.stone); if (x % 2) b.set(x0 + x, base + 2, C.slate); }
  b.outline(C.ink);
  return { buf: b, ax: x0 + Math.round(L / 2), ay: base, shadow: { ox: 3, oy: 2, rx: Math.round(L / 2) + 3, ry: 3 }, hook: { x: L / 2 + 2 - L / 2 + (L / 2), y: -(hh + cast + 12) } };
}

const cache = new Map<string, PropArt>();
export function harborArt(kind: HarborKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) {
    a = (() => {
      switch (kind) {
        case 'house': return townhouse(v);
        case 'cottage': return cottage(v);
        case 'tavern': return tavern(v);
        case 'warehouse': return warehouse(v);
        case 'customs': return customs();
        case 'lighthouse': return lighthouse();
        case 'gatetower': return gatetower();
        case 'lamp': return lamp();
        case 'crate': return crate(v);
        case 'barrel': return barrel();
        case 'net': return net();
        case 'bollard': return bollard();
        case 'anchor': return anchor();
        case 'coil': return coil();
        case 'crane': return crane();
        case 'fountain': return fountain();
        case 'banner': return banner();
        case 'sign': return sign();
        case 'cart': return cart();
        case 'rowboat': return rowboat();
        case 'ship': return ship(v);
      }
    })();
    cache.set(key, a);
  }
  return a;
}
void bayer; void rimBottom; void rng; void (null as unknown as Buf);
