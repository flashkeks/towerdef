/**
 * Kristall-Gruppen fuer den Shop (Runde 9, P4): reiner Code, ohne Bilddatei. Je Paketstufe mehr und groessere Kristalle.
 * Farben ueber CSS-Variablen (Aether-Tuerkis aus `tokens.css`), damit die Gruppe mit dem Rest der Farbwelt geht.
 */
const NS = 'http://www.w3.org/2000/svg';

interface Gem {
  /** Mitte unten (viewBox 240x160) */
  x: number;
  y: number;
  /** Hoehe und halbe Breite */
  h: number;
  w: number;
  tilt: number;
}

/** Ein Kristall: sechseckiger Schliff mit drei Flaechen (hell links, dunkel rechts, Spitze oben). */
function gem(g: Gem): string {
  const top = [g.x, g.y - g.h];
  const ul = [g.x - g.w, g.y - g.h * 0.64];
  const ur = [g.x + g.w, g.y - g.h * 0.64];
  const ll = [g.x - g.w * 0.78, g.y - g.h * 0.14];
  const lr = [g.x + g.w * 0.78, g.y - g.h * 0.14];
  const bot = [g.x, g.y];
  const mid = [g.x, g.y - g.h * 0.5];
  const pts = (...p: number[][]): string => p.map(([a, b]) => `${a!.toFixed(1)},${b!.toFixed(1)}`).join(' ');
  return `<g transform="rotate(${g.tilt} ${g.x} ${g.y})">
    <polygon points="${pts(top, ul, ll, bot, lr, ur)}" fill="var(--gem-mid)" stroke="var(--gem-edge)" stroke-width="1.4" stroke-linejoin="round"/>
    <polygon points="${pts(top, ul, ll, mid)}" fill="var(--gem-lit)"/>
    <polygon points="${pts(ll, bot, mid)}" fill="var(--gem-base)"/>
    <polygon points="${pts(top, mid, lr, ur)}" fill="var(--gem-dark)"/>
    <polygon points="${pts(mid, lr, bot)}" fill="var(--gem-deep)"/>
    <path d="M${ul[0]! + 5} ${ul[1]! + 4}L${top[0]! - 3} ${top[1]! + 8}" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}

const LAYOUTS: Gem[][] = [
  [{ x: 120, y: 142, h: 112, w: 42, tilt: 0 }],
  [
    { x: 82, y: 146, h: 70, w: 28, tilt: -14 },
    { x: 158, y: 146, h: 78, w: 30, tilt: 12 },
    { x: 120, y: 150, h: 118, w: 44, tilt: 0 },
  ],
  [
    { x: 46, y: 148, h: 52, w: 21, tilt: -22 },
    { x: 194, y: 148, h: 56, w: 22, tilt: 20 },
    { x: 84, y: 148, h: 82, w: 31, tilt: -12 },
    { x: 158, y: 148, h: 90, w: 33, tilt: 11 },
    { x: 120, y: 152, h: 132, w: 48, tilt: 0 },
  ],
];

/** Kristall-Gruppe der Stufe `tier` (0 = ein Kristall, 1 = drei, 2 = fuenf mit Funken). */
export function gemCluster(tier: number): SVGElement {
  const gems = LAYOUTS[Math.max(0, Math.min(LAYOUTS.length - 1, tier))]!;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 240 160');
  svg.setAttribute('class', `gems tier${Math.min(2, Math.max(0, tier))}`);
  svg.setAttribute('aria-hidden', 'true');
  const sparks = tier >= 1 ? [[30, 40, 5], [212, 52, 4], [186, 14, 3.4], [60, 18, 3]] : [[40, 50, 3.5], [200, 40, 3]];
  const spark = sparks.map(([x, y, s]) => `<path class="gem-spark" d="M${x} ${y! - s! * 2}L${x! + s!} ${y}L${x} ${y! + s! * 2}L${x! - s!} ${y}z"/>`).join('');
  svg.innerHTML = `<ellipse class="gem-floor" cx="120" cy="152" rx="96" ry="9"/>${gems.map(gem).join('')}${spark}`;
  return svg;
}
