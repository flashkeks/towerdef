// Eigene Kacheln (32x32): Gras, Pfad (16 Kantenmasken), Slot-Untergruende, Deko, Spawn, Basis. Alles code-generiert (eigenes Werk).
import { Img, rng } from './pix.mjs';

const T = 32;

export function grass(seed) {
  const r = rng(1000 + seed);
  const g = new Img(T, T);
  g.rect(0, 0, T, T, 'g2');
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * (T - 2));
    const y = Math.floor(r() * (T - 1));
    g.px(x, y, 'g1').px(x + 1, y, 'g1');
  }
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(r() * T);
    const y = Math.floor(r() * (T - 2));
    g.px(x, y, 'g3').px(x, y + 1, 'g3');
  }
  return g;
}

/** mask: N=1, E=2, S=4, W=8 (Nachbar ist Pfad). Zeichnet auf Gras; offene Seiten bekommen Rand. */
export function path(mask) {
  const r = rng(2000 + mask);
  const g = grass(mask % 4);
  const open = { n: !(mask & 1), e: !(mask & 2), s: !(mask & 4), w: !(mask & 8) };
  const x0 = open.w ? 3 : 0;
  const x1 = T - 1 - (open.e ? 3 : 0);
  const y0 = open.n ? 3 : 0;
  const y1 = T - 1 - (open.s ? 3 : 0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let c = 'sand';
    if (open.w && x === x0 || open.e && x === x1 || open.n && y === y0 || open.s && y === y1) c = 'er1';
    else if (open.w && x === x0 + 1 || open.e && x === x1 - 1 || open.n && y === y0 + 1 || open.s && y === y1 - 1) c = 'er2';
    g.px(x, y, c);
  }
  // Aussenecken runden (beide Nachbarseiten offen)
  const round = (cx, cy, dx, dy) => {
    const bx = cx, by = cy;
    g.px(bx, by, 'g2').px(bx + dx, by, 'er1').px(bx, by + dy, 'er1');
    g.px(bx + dx, by + dy, 'er2');
  };
  if (open.n && open.w) round(x0, y0, 1, 1);
  if (open.n && open.e) round(x1, y0, -1, 1);
  if (open.s && open.w) round(x0, y1, 1, -1);
  if (open.s && open.e) round(x1, y1, -1, -1);
  // Kiesel und Flecken auf dem Sand
  for (let i = 0; i < 16; i++) {
    const x = x0 + 3 + Math.floor(r() * Math.max(1, x1 - x0 - 5));
    const y = y0 + 3 + Math.floor(r() * Math.max(1, y1 - y0 - 5));
    if (g.get(x, y)?.join() === '208,165,116') g.px(x, y, i % 3 === 0 ? 'parch' : 'er2');
  }
  for (let i = 0; i < 4; i++) {
    const x = x0 + 4 + Math.floor(r() * Math.max(1, x1 - x0 - 8));
    const y = y0 + 4 + Math.floor(r() * Math.max(1, y1 - y0 - 8));
    g.px(x, y, 'st2').px(x + 1, y, 'st3');
  }
  return g;
}

/** Boden-Slot: kuehle Steinplatte mit Rune, flach auf dem Gras. */
export function slotGround() {
  const g = grass(1);
  g.rect(3, 4, 26, 25, 'ink'); // Rand
  g.rect(4, 5, 24, 23, 'st3');
  g.rect(5, 6, 22, 21, 'st2');
  g.rect(4, 5, 24, 1, 'fog'); // Lichtkante oben
  g.rect(4, 27, 24, 1, 'st1'); // Schattenkante unten
  g.rect(27, 5, 1, 23, 'st1');
  for (const [x, y] of [[6, 7], [24, 7], [6, 24], [24, 24]]) g.rect(x, y, 2, 2, 'st1').px(x, y, 'st3');
  // Rune: Ring mit Punkt
  g.oval(16, 16, 6, 6, 'st1').oval(16, 16, 5, 5, 'st2').oval(16, 16, 2, 2, 'st1').px(16, 16, 'st3');
  g.px(10, 16, 'st1').px(22, 16, 'st1');
  return g;
}

/** Huegel-Slot: erhoehter Sockel mit sichtbarer Frontmauer. */
export function slotHill() {
  const g = grass(2);
  g.rect(2, 29, 28, 2, 'g1'); // Schatten auf dem Gras
  g.rect(3, 3, 26, 27, 'inkW');
  g.rect(4, 4, 24, 15, 'sand'); // Deckflaeche
  g.rect(4, 4, 24, 1, 'parch');
  g.rect(4, 4, 1, 15, 'parch');
  g.rect(4, 18, 24, 1, 'er2');
  g.rect(4, 19, 24, 10, 'er2'); // Frontmauer
  g.rect(4, 19, 24, 1, 'sand');
  for (let y = 21; y < 29; y += 4) g.rect(4, y, 24, 1, 'er1');
  for (let y = 19, row = 0; y < 29; y += 4, row++) for (let x = 4 + (row % 2) * 6; x < 28; x += 12) g.rect(x, y + 1, 1, 3, 'er1');
  g.rect(4, 28, 24, 1, 'er1');
  // Aufwaerts-Winkel als Hinweis „erhoeht“
  for (let i = 0; i < 5; i++) g.px(16 - i, 14 - (5 - i) + 4, 'er2').px(16 + i, 14 - (5 - i) + 4, 'er2');
  g.px(16, 8, 'er2');
  return g;
}

/** Grosser Slot 2x2 (64x64): Holzdeck mit goldener Kante. */
export function slotBig() {
  const W = 64;
  const g = new Img(W, W);
  g.rect(1, 1, W - 2, W - 2, 'inkW');
  g.rect(2, 2, W - 4, W - 4, 'gold');
  g.rect(4, 4, W - 8, W - 8, 'er2');
  for (let y = 5; y < W - 5; y += 8) {
    g.rect(4, y, W - 8, 1, 'er1');
    g.rect(4, y + 1, W - 8, 1, 'sand');
  }
  for (let y = 5, row = 0; y < W - 5; y += 8, row++) for (let x = 12 + (row % 2) * 14; x < W - 5; x += 28) g.rect(x, y, 1, 8, 'er1');
  for (const [x, y] of [[2, 2], [W - 6, 2], [2, W - 6], [W - 6, W - 6]]) {
    g.rect(x, y, 4, 4, 'or2').rect(x + 1, y + 1, 2, 2, 'gold');
  }
  // Muenzzeichen in der Mitte (Hinweis „Farm“)
  g.oval(32, 32, 9, 9, 'inkW').oval(32, 32, 8, 8, 'gold').oval(32, 32, 6, 6, 'or2').rect(31, 28, 2, 8, 'gold');
  return g;
}

function blob(g, cx, cy, rx, ry) {
  g.oval(cx, cy, rx, ry, 'g1').oval(cx - 1, cy - 1, rx - 1, ry - 1, 'g2');
  g.px(cx - 2, cy - 2, 'g3').px(cx - 3, cy - 1, 'g3').px(cx + 1, cy - 3, 'g3');
}

export function decoBush() {
  const g = new Img(T, T);
  blob(g, 12, 21, 7, 6);
  blob(g, 20, 20, 7, 7);
  blob(g, 16, 17, 6, 6);
  return g.outline('ink');
}
export function decoRock() {
  const g = new Img(T, T);
  g.oval(15, 22, 9, 6, 'st1').oval(14, 21, 8, 5, 'st2').oval(12, 19, 4, 2, 'st3');
  g.oval(23, 25, 4, 3, 'st1').oval(22, 24, 3, 2, 'st2');
  return g.outline('ink');
}
export function decoFlowers() {
  const g = new Img(T, T);
  for (const [x, y, c] of [[8, 10, 'pink'], [21, 8, 'gold'], [14, 20, 'fog'], [24, 22, 'pink'], [6, 25, 'gold']]) {
    g.px(x, y, c).px(x - 1, y, c).px(x + 1, y, c).px(x, y - 1, c).px(x, y + 1, c).px(x, y, 'gold');
    g.px(x, y + 2, 'g1').px(x, y + 3, 'g1');
  }
  return g;
}
export function decoTree() {
  const g = new Img(T, T);
  g.rect(14, 22, 4, 8, 'er1').rect(14, 22, 2, 8, 'er2');
  blob(g, 16, 12, 11, 10);
  blob(g, 10, 15, 6, 6);
  blob(g, 22, 15, 6, 6);
  g.px(14, 8, 'g3').px(15, 8, 'g3').px(13, 9, 'g3').px(19, 12, 'g3');
  return g.outline('ink');
}

/** Nebelriss: violetter Spalt mit Wirbel (Spawn). */
export function spawnRift() {
  const g = new Img(T, T);
  g.oval(16, 16, 13, 12, 'sh1').oval(16, 16, 11, 10, 'sh2').oval(16, 16, 8, 7, 'sh1').oval(16, 16, 4, 4, 'ink');
  for (let a = 0; a < 18; a++) {
    const t = a / 18;
    const ang = t * Math.PI * 3.2;
    const rad = 3 + t * 9;
    g.px(16 + Math.cos(ang) * rad, 16 + Math.sin(ang) * rad * 0.9, a % 3 === 0 ? 'sh3' : 'sh2');
  }
  g.px(16, 16, 'sh3');
  return g.outline('ink');
}

/** Gildentor (Basis): Steinbogen, orange Fahne, Laterne. */
export function baseGate() {
  const g = new Img(T, T);
  g.rect(3, 6, 7, 24, 'st2').rect(22, 6, 7, 24, 'st2'); // Pfeiler
  g.rect(3, 6, 7, 2, 'st3').rect(22, 6, 7, 2, 'st3');
  g.rect(8, 8, 2, 22, 'st1').rect(27, 8, 2, 22, 'st1');
  g.rect(3, 4, 26, 5, 'st2').rect(3, 4, 26, 1, 'st3').rect(3, 8, 26, 1, 'st1'); // Sturz
  g.rect(10, 9, 12, 21, 'inkW'); // Durchgang
  g.rect(11, 12, 10, 18, 'er1');
  g.rect(13, 9, 6, 7, 'or2').rect(13, 9, 6, 1, 'gold').px(14, 16, 'or2').px(16, 16, 'or2').px(18, 16, 'or2'); // Fahne
  g.rect(15, 11, 2, 2, 'gold');
  g.rect(5, 12, 3, 4, 'gold').rect(6, 13, 1, 2, 'fog'); // Laterne links
  g.rect(24, 12, 3, 4, 'gold').rect(25, 13, 1, 2, 'fog');
  return g.outline('inkW');
}
