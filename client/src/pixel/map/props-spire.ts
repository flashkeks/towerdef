/**
 * Gemalte Dinge von Duskspire Keep (Runde 16 / K2): Torbauten, Rundtuerme, Kaserne/Waffenkammer, der Bergfried mit dem Spitzturm,
 * Feuerschalen, Banner, Statuen, Katapulte, Kriegszelte, Palisaden und Truemmer. Dunkle Festung: Nacht-, Dusk- und Slate-Stein,
 * dazu Violett/Karmesin fuer Dach und Stoff, warmes Fackellicht. Regeln wie `props.ts`: Licht oben links, drei Toene,
 * Umriss in der dunkelsten Flaechenfarbe, Schatten separat. Fussmitte unten = (ax, ay).
 */
import { bayer, Buf, C, hash2, rng } from './buf';
import { mk, rimBottom, shadedDisc, sparkle, type PropArt, type Tones } from './props';
import { bricks, crenel, dome, flame, pole, shadedRect, tileRoof, windowLit } from './k2sprites';

export type SpireKind =
  | 'gatetower' | 'roundtower' | 'hall' | 'keep' | 'brazier' | 'banner' | 'statue' | 'catapult' | 'tent' | 'stakes' | 'crate' | 'barrel'
  | 'rack' | 'rock' | 'deadtree' | 'bones' | 'rubble' | 'cisternarch';

const STONE: Tones = { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone };
const ROOF: Tones = { dark: C.plum, mid: C.violet, light: C.orchid };
const TIM: Tones = { dark: C.plum, mid: C.bark, light: C.wood };

function banner(b: Buf, x: number, y: number, h: number, w = 9): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (j > h - 4 && (i + (j & 1)) % 4 < 2 && j > h - 3 + (i % 4 < 2 ? 0 : -1)) continue;
    const f = i / w;
    b.set(x + i, y + j, f < 0.3 ? C.red : f < 0.7 ? C.crimson : C.plum);
  }
  b.rect(x + 2, y + 2, w - 4, 1, C.amber);
  b.rect(x + 3, y + 4, w - 6, 3, C.amber); b.rect(x + 3, y + 4, 2, 1, C.yellow);
  b.rect(x - 1, y - 1, w + 2, 1, C.slate);
}

function gatetower(): PropArt {
  const W = 30, H = 66;
  const b = mk(W, H);
  const x0 = 3, x1 = 26, wallTop = 18, wallBot = H - 3;
  bricks(b, x0, wallTop, x1 - x0 + 1, wallBot - wallTop + 1, STONE, C.ink, 31, 6, 3);
  // Kragstein-Rand und Zinnen
  crenel(b, x0 - 1, x1 - x0 + 3, wallTop - 6, STONE, 4, 3, 4);
  b.rect(x0 - 2, wallTop - 2, x1 - x0 + 5, 3, STONE.light); b.rect(x0 - 2, wallTop - 2, x1 - x0 + 5, 1, STONE.hi!); b.rect(x0 - 2, wallTop + 1, x1 - x0 + 5, 1, STONE.dark);
  // Schiessscharten, von innen rot erleuchtet
  for (const [sx, sy] of [[8, 28], [8, 42], [18, 35]]) { b.rect(sx, sy, 2, 6, C.ink); b.rect(sx, sy + 1, 1, 4, C.crimson); b.set(sx, sy + 2, C.orange); }
  // Torbogen unten, Fallgatter
  b.rect(9, wallBot - 13, 11, 13, C.ink); b.rect(10, wallBot - 14, 9, 1, C.ink); b.rect(10, wallBot - 12, 9, 12, C.night);
  for (let x = 11; x < 19; x += 2) b.rect(x, wallBot - 12, 1, 8, C.slate);
  for (let y = wallBot - 11; y < wallBot - 5; y += 3) b.rect(10, y, 9, 1, C.dusk);
  // Fahne an der Zinne
  pole(b, 15, 0, 12, { dark: C.night, mid: C.dusk, light: C.slate }, 1);
  b.rect(16, 1, 9, 6, C.crimson); b.rect(16, 1, 9, 1, C.red); b.rect(18, 3, 5, 2, C.amber); b.set(25, 3, C.plum);
  // Fackel
  b.rect(22, wallBot - 18, 2, 4, C.bark); flame(b, 23, wallBot - 19, 5);
  rimBottom(b, C.night);
  b.outline(C.ink);
  return { buf: b, ax: 15, ay: wallBot + 1, shadow: { ox: 8, oy: -1, rx: 16, ry: 5 }, hook: { x: 8, y: -(wallBot - 21) } };
}

function roundTower(): PropArt {
  const W = 38, H = 76;
  const b = mk(W, H);
  const cx = 19, r = 12, bodyTop = 28, wallBot = H - 3;
  for (let y = bodyTop; y <= wallBot; y++) for (let x = -r; x <= r; x++) {
    const nx = x / r;
    const row = Math.floor((y - bodyTop) / 3), off = row % 2 ? 3 : 0;
    const ix = (x + r + off) % 6, iy = (y - bodyTop) % 3;
    let c = nx < -0.35 ? STONE.light : nx < 0.3 ? STONE.mid : STONE.dark;
    if (iy === 2 || ix === 5) c = C.ink;
    else if (hash2(Math.floor((x + r + off) / 6), row, 17) > 0.8) c = nx < 0.3 ? STONE.hi! : STONE.light;
    b.set(cx + x, y, c);
  }
  // Wulst unter dem Dach
  b.rect(cx - r - 2, bodyTop - 2, 2 * r + 5, 3, STONE.light); b.rect(cx - r - 2, bodyTop - 2, 2 * r + 5, 1, STONE.hi!);
  // Kegeldach
  for (let y = 4; y < bodyTop - 2; y++) {
    const f = (y - 4) / (bodyTop - 6), half = Math.round(1 + f * 15);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.3 ? ROOF.light : nx < 0.35 ? ROOF.mid : ROOF.dark;
      if ((y + Math.floor((x + 30) / 5)) % 4 === 0) c = nx < 0.35 ? ROOF.mid : ROOF.dark;
      b.set(cx + x, y, c);
    }
  }
  b.rect(cx, 0, 1, 6, C.slate); b.rect(cx + 1, 0, 6, 3, C.crimson); b.set(cx + 7, 1, C.plum);
  // Scharten + Fenster
  windowLit(b, cx - 2, bodyTop + 10, 4, 6, true, C.ink);
  b.rect(cx - 6, bodyTop + 26, 2, 5, C.ink); b.rect(cx + 4, bodyTop + 26, 2, 5, C.ink); b.set(cx + 4, bodyTop + 27, C.crimson);
  b.rect(cx - 5, wallBot - 12, 10, 12, C.ink); b.rect(cx - 4, wallBot - 11, 8, 11, C.night);
  rimBottom(b, C.night);
  b.outline(C.ink);
  return { buf: b, ax: cx, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: 18, ry: 5 }, hook: { x: 0, y: -(wallBot - bodyTop - 12) } };
}

/** Langhaus (Kaserne v0, Waffenkammer v1, Stall v2): flaches Zinnendach, Tuerme an den Ecken, rote Scharten. */
function hall(v: number): PropArt {
  const len = [116, 76, 60][v] ?? 76;
  const W = len + 10, H = 54;
  const b = mk(W, H);
  const x0 = 5, x1 = W - 6, wallTop = 20, wallBot = H - 3;
  bricks(b, x0, wallTop, x1 - x0 + 1, wallBot - wallTop + 1, STONE, C.ink, 71 + v, 6, 3);
  // flaches Dach mit Zinnenkranz
  b.rect(x0 - 2, wallTop - 4, x1 - x0 + 5, 5, STONE.light); b.rect(x0 - 2, wallTop - 4, x1 - x0 + 5, 1, STONE.hi!); b.rect(x0 - 2, wallTop, x1 - x0 + 5, 1, STONE.dark);
  crenel(b, x0 - 2, x1 - x0 + 5, wallTop - 9, STONE, 5, 3, 5);
  // Dachaufbau mit Schornstein/Rauchfang
  b.rect(x0 + 10, 1, 8, 12, STONE.mid); b.rect(x0 + 10, 1, 1, 12, STONE.light); b.rect(x0 + 17, 1, 1, 12, STONE.dark); b.rect(x0 + 9, 1, 10, 1, STONE.light);
  // grosses Tor + Scharten
  const cx = Math.floor(W / 2);
  b.rect(cx - 8, wallBot - 17, 16, 17, C.ink); b.rect(cx - 7, wallBot - 16, 14, 16, C.night);
  b.rect(cx - 6, wallBot - 15, 12, 14, C.bark); b.rect(cx - 6, wallBot - 15, 6, 14, C.wood); b.rect(cx, wallBot - 15, 1, 14, C.plum);
  for (const y of [wallBot - 12, wallBot - 5]) b.rect(cx - 6, y, 12, 1, C.slate);
  b.rect(cx - 8, wallBot - 18, 16, 2, STONE.light);
  for (let x = x0 + 6; x < x1 - 4; x += 9) { if (Math.abs(x - cx) < 12) continue; b.rect(x, wallTop + 8, 2, 7, C.ink); b.rect(x, wallTop + 9, 1, 5, C.crimson); b.set(x, wallTop + 10, C.orange); }
  // Banner und Waffen an der Wand
  if (v === 0) { banner(b, x0 + 14, wallTop + 3, 13); banner(b, x1 - 24, wallTop + 3, 13); }
  if (v === 1) for (let k = 0; k < 4; k++) b.line(x0 + 8 + k * 4, wallTop + 10, x0 + 12 + k * 4, wallTop + 22, C.stone);
  rimBottom(b, C.night);
  b.outline(C.ink);
  return { buf: b, ax: cx, ay: wallBot + 1, shadow: { ox: 9, oy: -1, rx: Math.floor(W / 2) + 2, ry: 6 }, hook: { x: x0 + 14 - cx, y: -(wallBot + 1) + 1 } };
}

/** Der Bergfried: breiter Sockel mit Torhaus links (Zugbruecke), Mittelturm, Spitzturm mit schlankem Dach, Wimpel, Strebepfeiler. */
function keep(): PropArt {
  const W = 84, H = 140;
  const b = mk(W, H);
  const baseBot = H - 3;
  // Sockel
  bricks(b, 16, baseBot - 46, 62, 47, STONE, C.ink, 5, 7, 3);
  crenel(b, 14, 66, baseBot - 53, STONE, 5, 3, 5);
  b.rect(14, baseBot - 48, 66, 3, STONE.light); b.rect(14, baseBot - 48, 66, 1, STONE.hi!);
  // Mittelturm
  bricks(b, 26, baseBot - 90, 42, 43, STONE, C.ink, 6, 6, 3);
  b.rect(24, baseBot - 92, 46, 3, STONE.light); b.rect(24, baseBot - 92, 46, 1, STONE.hi!);
  crenel(b, 24, 46, baseBot - 98, STONE, 4, 3, 5);
  // Spitzturm
  bricks(b, 34, baseBot - 124, 26, 33, STONE, C.ink, 7, 5, 3);
  for (let y = 0; y < 30; y++) { // Spitzdach
    const f = y / 30, half = Math.round(1 + (1 - f) * 0 + f * 16);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.3 ? ROOF.light : nx < 0.35 ? ROOF.mid : ROOF.dark;
      if ((y + Math.floor((x + 40) / 6)) % 4 === 0) c = nx < 0.35 ? ROOF.mid : ROOF.dark;
      b.set(47 + x, 4 + y, c);
    }
  }
  b.rect(47, 0, 1, 6, C.slate); b.rect(48, 0, 8, 4, C.red); b.rect(48, 0, 8, 1, C.coral); b.set(56, 1, C.crimson);
  // Fenster (gluehend)
  for (const [x, y] of [[41, baseBot - 118], [51, baseBot - 118]]) windowLit(b, x, y, 4, 7, true, C.ink);
  for (const [x, y] of [[32, baseBot - 84], [44, baseBot - 84], [56, baseBot - 84]]) windowLit(b, x, y, 5, 8, true, C.ink);
  // Strebepfeiler mit Feuerschalen
  for (const x of [14, 76]) { shadedRect(b, x, baseBot - 62, 7, 62, STONE, 9); b.rect(x - 1, baseBot - 64, 9, 3, STONE.light); }
  for (const x of [17, 79]) { b.rect(x - 2, baseBot - 68, 5, 4, C.slate); flame(b, x, baseBot - 69, 6); }
  // Torhaus mit Fallgatter links (die Bruecke endet hier)
  b.rect(0, baseBot - 34, 20, 34, C.slate); bricks(b, 0, baseBot - 34, 20, 34, STONE, C.ink, 8, 5, 3);
  crenel(b, -1, 22, baseBot - 40, STONE, 4, 3, 5);
  b.rect(3, baseBot - 22, 13, 22, C.ink); b.rect(4, baseBot - 21, 11, 21, C.night);
  for (let x = 5; x < 14; x += 2) b.rect(x, baseBot - 21, 1, 14, C.slate);
  for (let y = baseBot - 20; y < baseBot - 8; y += 4) b.rect(4, y, 11, 1, C.dusk);
  b.rect(6, baseBot - 6, 7, 6, C.red); b.rect(7, baseBot - 5, 5, 5, C.orange); // Glut im Torgang
  // grosses Haupttor in der Mitte
  b.rect(38, baseBot - 24, 16, 24, C.ink); b.rect(39, baseBot - 23, 14, 23, C.night); b.rect(40, baseBot - 22, 12, 22, C.bark);
  b.rect(40, baseBot - 22, 6, 22, C.wood); b.rect(46, baseBot - 22, 1, 22, C.plum);
  for (const y of [baseBot - 18, baseBot - 8]) b.rect(40, y, 12, 1, C.slate);
  banner(b, 61, baseBot - 44, 17); banner(b, 25, baseBot - 44, 17);
  rimBottom(b, C.night);
  b.outline(C.ink);
  return { buf: b, ax: 47, ay: baseBot + 1, shadow: { ox: 12, oy: -1, rx: 38, ry: 7 }, hook: { x: 0, y: -(baseBot - 100) } };
}

function brazier(): PropArt {
  const b = mk(24, 28);
  b.rect(9, 16, 6, 9, C.dusk); b.rect(9, 16, 2, 9, C.slate);
  b.rect(6, 24, 12, 2, C.slate); b.rect(6, 24, 12, 1, C.stone);
  dome(b, 12, 14, 8, 3, { dark: C.night, mid: C.dusk, light: C.slate }, 3);
  b.rect(4, 12, 16, 2, C.slate); b.rect(4, 12, 16, 1, C.stone);
  b.rect(6, 11, 12, 1, C.crimson); b.rect(9, 11, 3, 1, C.orange);
  flame(b, 12, 11, 9, 1); flame(b, 8, 11, 6, -1); flame(b, 16, 11, 6, 1);
  b.outline(C.ink);
  return { buf: b, ax: 12, ay: 25, shadow: { ox: 3, oy: 0, rx: 8, ry: 2 }, hook: { x: 0, y: -18 } };
}

function bannerProp(): PropArt {
  const b = mk(22, 46);
  pole(b, 4, 2, 42, { dark: C.night, mid: C.dusk, light: C.slate }, 2);
  b.rect(3, 0, 4, 3, C.stone);
  banner(b, 6, 5, 22, 11);
  b.rect(2, 42, 6, 2, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 5, ay: 43, shadow: { ox: 3, oy: 0, rx: 6, ry: 2 } };
}

/** Ritterstandbild auf Sockel: Helm, Schild, Schwert, Moos. */
function statue(): PropArt {
  const b = mk(24, 44);
  shadedRect(b, 3, 34, 18, 8, STONE, 4);
  b.rect(2, 41, 20, 2, STONE.dark); b.rect(2, 33, 20, 2, STONE.light);
  // Koerper
  shadedRect(b, 8, 17, 8, 16, { dark: C.dusk, mid: C.slate, light: C.stone }, 5);
  shadedDisc(b, 12, 12, 4, 4, { dark: C.dusk, mid: C.slate, light: C.stone, hi: C.silver }, 6);
  b.rect(10, 11, 4, 1, C.night); b.rect(11, 12, 2, 2, C.night); // Visier
  b.rect(11, 5, 2, 4, C.slate); b.set(11, 5, C.stone); // Helmzier
  // Schild links, Schwert rechts
  shadedRect(b, 3, 17, 6, 10, { dark: C.dusk, mid: C.slate, light: C.stone }, 7); b.rect(5, 19, 2, 4, C.crimson);
  b.rect(18, 8, 1, 22, C.stone); b.rect(16, 24, 5, 1, C.slate);
  for (const [x, y] of [[8, 36], [14, 38], [5, 40]]) b.set(x, y, C.pine);
  b.outline(C.ink);
  return { buf: b, ax: 12, ay: 42, shadow: { ox: 4, oy: 0, rx: 10, ry: 3 } };
}

function catapult(): PropArt {
  const W = 52, H = 40;
  const b = mk(W, H);
  // Rahmen
  b.rect(6, 28, 40, 4, TIM.mid); b.rect(6, 28, 40, 1, TIM.light); b.rect(6, 31, 40, 1, TIM.dark);
  for (const x of [10, 36]) { pole(b, x, 12, 28, TIM, 4); b.line(x, 28, x + 8, 20, C.bark); }
  // Wurfarm mit Loeffel
  b.line(14, 16, 40, 6, C.wood); b.line(14, 17, 40, 7, C.bark); b.line(15, 15, 41, 5, C.tan);
  b.rect(38, 2, 9, 4, C.bark); b.rect(38, 2, 9, 1, C.wood); b.disc(42, 1, 2, C.dusk); b.set(41, 0, C.slate);
  // Gegengewicht + Seil
  b.rect(8, 18, 7, 8, C.slate); b.rect(8, 18, 7, 1, C.stone); b.line(12, 17, 14, 16, C.stone);
  // Raeder
  for (const wx of [12, 40]) { b.disc(wx, 33, 5, C.bark); b.disc(wx, 33, 4, C.wood); b.disc(wx, 33, 2, C.bark); b.line(wx - 4, 33, wx + 4, 33, C.bark); b.line(wx, 29, wx, 37, C.bark); }
  // Steinhaufen
  for (const [x, y] of [[46, 34], [48, 33], [47, 36]]) b.rect(x, y, 3, 2, C.slate);
  b.outline(C.plum);
  return { buf: b, ax: 26, ay: 37, shadow: { ox: 4, oy: 0, rx: 24, ry: 4 } };
}

function tent(v: number): PropArt {
  const W = 40, H = 32;
  const b = mk(W, H);
  const [c1, c2, c3] = v ? [C.orchid, C.violet, C.plum] : [C.red, C.crimson, C.plum];
  const cx = 20;
  for (let y = 4; y <= 26; y++) {
    const f = (y - 4) / 22, half = Math.round(1 + f * 17);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      let c = nx < -0.2 ? c1 : nx < 0.5 ? c2 : c3;
      if (Math.abs(x) <= Math.round((f - 0.35) * 7) && f > 0.35) c = Math.abs(x) <= Math.round((f - 0.35) * 7) - 1 ? C.ink : C.plum;
      if ((x + 40) % 6 === 0 && Math.abs(x) > 2) c = nx < 0.4 ? c2 : c3;
      b.set(cx + x, y, c);
    }
  }
  pole(b, cx, 0, 6, { dark: C.bark, mid: C.wood, light: C.tan }, 1);
  b.rect(cx + 1, 0, 6, 3, C.amber); b.set(cx + 7, 1, C.orange);
  for (const sx of [-1, 1]) b.line(cx + sx * 17, 26, cx + sx * 21, 29, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: cx, ay: 28, shadow: { ox: 5, oy: -1, rx: 20, ry: 4 } };
}

function stakes(v: number): PropArt {
  const b = mk(30, 24);
  const r = rng(910 + v);
  for (let i = 0; i < 6; i++) {
    const x = 3 + i * 4, h = 12 + Math.floor(r() * 6), lean = (i % 3) - 1;
    for (let y = 0; y < h; y++) { const xx = x + Math.round(lean * y / 8); b.set(xx, 20 - y, y > h - 4 ? C.wood : C.bark); b.set(xx + 1, 20 - y, y > h - 4 ? C.tan : C.wood); }
    b.set(x + Math.round(lean * h / 8), 20 - h, C.stone);
  }
  b.rect(1, 18, 28, 2, C.plum); b.rect(1, 18, 28, 1, C.bark);
  b.outline(C.plum);
  return { buf: b, ax: 15, ay: 21, shadow: { ox: 2, oy: 0, rx: 13, ry: 2 } };
}

function crate(v: number): PropArt {
  const b = mk(22, 20);
  shadedRect(b, 2, 7, 12, 10, TIM, 91 + v);
  b.line(3, 8, 12, 16, C.plum); b.line(12, 8, 3, 16, C.plum);
  shadedRect(b, 8, 1 + (v ? 0 : 3), 10, 9 - (v ? 0 : 3), TIM, 93 + v);
  b.outline(C.plum);
  return { buf: b, ax: 8, ay: 17, shadow: { ox: 3, oy: 0, rx: 9, ry: 2 } };
}

function barrel(): PropArt {
  const b = mk(14, 18);
  dome(b, 7, 9, 5, 7, TIM, 3);
  b.rect(2, 5, 11, 1, C.slate); b.rect(2, 12, 11, 1, C.slate); b.rect(3, 3, 8, 1, C.wood);
  b.outline(C.plum);
  return { buf: b, ax: 7, ay: 15, shadow: { ox: 2, oy: 0, rx: 6, ry: 2 } };
}

function rack(): PropArt {
  const b = mk(30, 26);
  pole(b, 2, 8, 22, TIM, 2); pole(b, 25, 8, 22, TIM, 2);
  b.rect(2, 7, 25, 2, C.bark); b.rect(2, 7, 25, 1, C.wood); b.rect(2, 16, 25, 2, C.bark); b.rect(2, 16, 25, 1, C.wood);
  for (let k = 0; k < 6; k++) { b.line(5 + k * 4, 5, 5 + k * 4, 21, k % 2 ? C.stone : C.silver); b.set(5 + k * 4, 4, C.stone); }
  b.rect(8, 11, 5, 5, C.crimson); b.rect(9, 12, 3, 3, C.plum); // Schild
  b.outline(C.plum);
  return { buf: b, ax: 15, ay: 23, shadow: { ox: 3, oy: 0, rx: 13, ry: 2 } };
}

function rock(v: number): PropArt {
  const b = mk(24, 18);
  const T: Tones = { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone };
  shadedDisc(b, 9, 11, 7, 5, T, 52 + v); shadedDisc(b, 16, 12, 4, 3, T, 53 + v);
  rimBottom(b, C.night);
  sparkle(b, 4, [C.dusk], C.slate, 61 + v);
  b.outline(C.ink);
  return { buf: b, ax: 12, ay: 15, shadow: { ox: 3, oy: 0, rx: 9, ry: 3 } };
}

function deadtree(v: number): PropArt {
  const b = mk(30, 40);
  const t: Tones = { dark: C.plum, mid: C.bark, light: C.wood };
  const trunk = (x0: number, y0: number, x1: number, y1: number, w: number): void => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      const ww = Math.max(1, Math.round(w * (1 - i / n * 0.6)));
      for (let k = 0; k < ww; k++) b.set(x + k, y, k === 0 ? t.light : k === ww - 1 ? t.dark : t.mid);
    }
  };
  const d = v ? -1 : 1;
  trunk(14, 37, 15 + 2 * d, 16, 5);
  trunk(15 + 2 * d, 20, 15 + 11 * d, 6, 3); trunk(15 + 2 * d, 26, 15 - 9 * d, 14, 3); trunk(15 + 11 * d, 8, 15 + 14 * d, 2, 2);
  b.outline(C.ink);
  return { buf: b, ax: 15, ay: 38, shadow: { ox: 4, oy: 0, rx: 9, ry: 3 } };
}

function bones(): PropArt {
  const b = mk(22, 12);
  b.rect(5, 4, 8, 6, C.silver); b.rect(6, 3, 6, 1, C.white); b.rect(6, 9, 6, 2, C.stone);
  b.set(7, 6, C.ink); b.set(10, 6, C.ink); b.rect(8, 8, 2, 1, C.slate);
  b.line(13, 8, 20, 10, C.silver); b.line(14, 5, 19, 3, C.stone);
  return { buf: b, ax: 11, ay: 10, shadow: { ox: 1, oy: 0, rx: 8, ry: 1 } };
}

function rubble(): PropArt {
  const b = mk(26, 16);
  const T: Tones = { dark: C.night, mid: C.dusk, light: C.slate, hi: C.stone };
  shadedRect(b, 3, 7, 8, 6, T, 41); shadedRect(b, 10, 4, 7, 8, T, 42); shadedRect(b, 16, 8, 7, 5, T, 43);
  for (const [x, y] of [[1, 12], [24, 12], [13, 13]]) b.rect(x, y, 3, 2, C.dusk);
  b.rect(5, 6, 4, 1, C.pine);
  b.outline(C.ink);
  return { buf: b, ax: 13, ay: 14, shadow: { ox: 2, oy: 0, rx: 11, ry: 3 } };
}

/** Zisternenbogen: kleiner Steinbogen mit Winde und Eimer, steht am Rand der Zisterne. */
function cisternArch(): PropArt {
  const b = mk(40, 36);
  shadedRect(b, 4, 12, 7, 22, STONE, 3); shadedRect(b, 29, 12, 7, 22, STONE, 4);
  for (let a = 0; a <= 180; a += 6) { const rad = (a * Math.PI) / 180; const x = Math.round(20 - Math.cos(rad) * 13), y = Math.round(13 - Math.sin(rad) * 9); for (let k = 0; k < 3; k++) b.set(x, y - k, k === 0 ? STONE.light : k === 2 ? STONE.dark : STONE.mid); }
  b.line(20, 7, 20, 20, C.stone); b.rect(17, 20, 7, 5, C.wood); b.rect(17, 20, 7, 1, C.tan); b.rect(17, 24, 7, 1, C.bark);
  b.rect(16, 6, 9, 2, C.slate);
  b.outline(C.ink);
  return { buf: b, ax: 20, ay: 34, shadow: { ox: 5, oy: 0, rx: 18, ry: 3 } };
}

const cache = new Map<string, PropArt>();
export function spireArt(kind: SpireKind, v: number): PropArt {
  const key = `${kind}:${v}`;
  let a = cache.get(key);
  if (!a) {
    a = (() => {
      switch (kind) {
        case 'gatetower': return gatetower();
        case 'roundtower': return roundTower();
        case 'hall': return hall(v);
        case 'keep': return keep();
        case 'brazier': return brazier();
        case 'banner': return bannerProp();
        case 'statue': return statue();
        case 'catapult': return catapult();
        case 'tent': return tent(v);
        case 'stakes': return stakes(v);
        case 'crate': return crate(v);
        case 'barrel': return barrel();
        case 'rack': return rack();
        case 'rock': return rock(v);
        case 'deadtree': return deadtree(v);
        case 'bones': return bones();
        case 'rubble': return rubble();
        case 'cisternarch': return cisternArch();
      }
    })();
    cache.set(key, a);
  }
  return a;
}
void bayer; void tileRoof;
