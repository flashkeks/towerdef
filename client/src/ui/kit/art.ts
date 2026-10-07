/**
 * Gemalte Flaechen ohne Bilddateien: Ersatzfigur (Silhouette mit leuchtenden Augen), Siegel (Runenkreis) und der bewegte Hintergrund
 * (Himmel, Bergruecken, Funken). Alles Code, alles ueber CSS-Variablen faerbbar. Rein dekorativ, `aria-hidden`.
 */

const NS = 'http://www.w3.org/2000/svg';

/** Stabiler Hash einer Zeichenkette (fuer Varianten und Phasen). */
export function hash(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619) >>> 0;
  return x >>> 0;
}

/** Kleiner deterministischer Zufall (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Frisur-Varianten der Ersatzfigur (Pfade im Raster 300x400, Kopf bei 150/150). */
const HAIR: string[] = [
  // kurz, struppig
  'M98 150c-6-44 22-76 54-76s62 28 54 76c-8-22-20-30-30-34-12 10-34 10-50 0-12 4-22 12-28 34z',
  // lang, fliessend hinter den Schultern
  'M96 156c-10-52 20-84 56-84s66 32 54 84l18 120c-18-10-30-14-34-14l-4-110c-22 8-44 8-62 0l-6 110c-4 0-16 4-34 14z',
  // Kapuze
  'M88 170c-6-62 24-102 64-102s70 40 62 102c-6 16-14 28-22 34-8-34-20-52-40-52s-34 18-42 52c-10-10-18-22-22-34z',
  // Dutt
  'M100 150c-4-40 18-66 50-66s56 26 50 66c-10-22-24-32-50-32s-40 10-50 32zM150 56a22 22 0 1 1 0 44 22 22 0 0 1 0-44z',
  // lange Zoepfe
  'M98 150c-6-46 22-76 54-76s60 30 54 76c-4-20-16-34-30-38-14 6-34 6-48 0-14 4-26 18-30 38zM96 152l-10 90 14 4 8-86zM204 152l10 90-14 4-8-86z',
];

/**
 * Ersatz-Karte ohne Bild: Heiligenschein, Silhouette (Frisur nach ID), Augen-Glanz, Funken. Farbe kommt aus `--el` des Elternteils.
 * Gibt den SVG-Inhalt als Element zurueck (viewBox 300x400, `preserveAspectRatio` slice: fuellt jede Kartenform).
 */
export function bust(id: string): SVGElement {
  const r = rng(hash(id));
  const v = Math.floor(r() * HAIR.length);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 300 400');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  const dark = 'color-mix(in srgb, var(--el) 10%, #04050c)';
  const rim = 'color-mix(in srgb, var(--el) 78%, #fff)';
  const sparks = Array.from({ length: 7 }, () => {
    const x = 30 + r() * 240;
    const y = 30 + r() * 260;
    const s = 2 + r() * 4;
    return `<path d="M${x} ${y - s * 2}L${x + s} ${y}L${x} ${y + s * 2}L${x - s} ${y}z" fill="${rim}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
  }).join('');
  svg.innerHTML = `
    <g fill="none" stroke="${rim}" stroke-width="1.2">
      <circle cx="150" cy="152" r="104" opacity="0.28"/>
      <circle cx="150" cy="152" r="124" opacity="0.14" stroke-dasharray="3 7"/>
      <path d="M150 20v34M150 250v34M18 152h34M248 152h34" opacity="0.22"/>
    </g>
    ${sparks}
    <g fill="${dark}" stroke="${rim}" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke">
      <path d="M26 400c8-70 52-112 124-118 72 6 116 48 124 118z"/>
      <path d="M130 250h40v40c-8 8-32 8-40 0z"/>
      <ellipse cx="150" cy="168" rx="42" ry="50"/>
      <path d="${HAIR[v]}"/>
    </g>
    <g stroke="${rim}" stroke-width="3" stroke-linecap="round" opacity="0.95">
      <path d="M128 172l12 3M172 172l-12 3"/>
    </g>
    <path d="M26 400c8-70 52-112 124-118 72 6 116 48 124 118" fill="none" stroke="${rim}" stroke-width="2" opacity="0.5" stroke-dasharray="120 400"/>`;
  return svg;
}

/** Siegel: konzentrische Ringe mit Strichen, Dreieck-Stern und Raute; `size` in px (viewBox 200). Rotation per CSS (`.sigil`). */
export function sigil(cls = ''): SVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `sigil ${cls}`.trim());
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180;
    const long = i % 6 === 0;
    const r1 = long ? 86 : 90;
    const x1 = 100 + Math.cos(a) * r1;
    const y1 = 100 + Math.sin(a) * r1;
    const x2 = 100 + Math.cos(a) * 95;
    const y2 = 100 + Math.sin(a) * 95;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }).join('');
  const tri = (rot: number): string => {
    const pts = [0, 1, 2].map((k) => {
      const a = ((rot + k * 120 - 90) * Math.PI) / 180;
      return `${(100 + Math.cos(a) * 62).toFixed(1)},${(100 + Math.sin(a) * 62).toFixed(1)}`;
    });
    return `<polygon points="${pts.join(' ')}"/>`;
  };
  svg.innerHTML = `<g fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round">
    <circle cx="100" cy="100" r="96" stroke-width="1.6"/><circle cx="100" cy="100" r="82" opacity="0.7"/><circle cx="100" cy="100" r="64" opacity="0.5" stroke-dasharray="2 5"/>
    <path d="${ticks}" opacity="0.8"/>${tri(0)}${tri(60)}
    <circle cx="100" cy="100" r="30" opacity="0.8"/><path d="M100 70 130 100 100 130 70 100z" opacity="0.9"/><circle cx="100" cy="100" r="5" fill="currentColor"/></g>`;
  return svg;
}

/** Kleines Wappen fuer den Titel (Turm im Schild). */
export function crest(): SVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 56');
  svg.setAttribute('class', 'crest');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<path d="M24 2 44 9v21c0 12-8 20-20 24C12 50 4 42 4 30V9z" fill="rgba(8,9,22,.7)" stroke="var(--gold)" stroke-width="2"/>
    <path d="M15 40V22l3-3v-5h3v3h3v-3h3v3h3v-3h3v5l3 3v18z" fill="var(--gold)" opacity=".92"/><path d="M21 40v-8a3 3 0 0 1 6 0v8z" fill="#0b0d1b"/><circle cx="24" cy="24" r="2" fill="#0b0d1b"/>`;
  return svg;
}

// ---- Hintergrund ---------------------------------------------------------------------------------------------------

export type BackdropKind = 'lobby' | 'summon' | 'plain';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  hue: number;
}

const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Himmel mit Bergruecken-Schichten (Parallaxe per CSS-Animation) und Funken-Canvas. */
export function backdrop(kind: BackdropKind = 'lobby'): HTMLElement {
  const root = document.createElement('div');
  root.className = `backdrop bd-${kind}`;
  root.setAttribute('aria-hidden', 'true');
  const r = rng(kind === 'lobby' ? 11 : kind === 'summon' ? 23 : 5);
  if (kind !== 'plain') {
    root.append(Object.assign(document.createElement('div'), { className: 'bd-orb' }));
    const ridges = document.createElementNS(NS, 'svg');
    ridges.setAttribute('class', 'bd-ridges');
    ridges.setAttribute('viewBox', '0 0 1600 400');
    ridges.setAttribute('preserveAspectRatio', 'none');
    const layer = (base: number, amp: number, cls: string, towers: boolean): string => {
      let d = `M0 400 L0 ${base}`;
      let x = 0;
      while (x < 1600) {
        x += 60 + r() * 120;
        d += ` L${Math.min(x, 1600).toFixed(0)} ${(base - r() * amp).toFixed(0)}`;
      }
      d += ' L1600 400 Z';
      const tw = towers
        ? Array.from({ length: 5 }, () => {
            const tx = 120 + r() * 1360;
            const h = 50 + r() * 70;
            const w = 14 + r() * 16;
            const ty = base - 6;
            return `<path d="M${tx.toFixed(0)} ${ty} v${-h.toFixed(0)} l${(w / 2).toFixed(0)} -14 l${(w / 2).toFixed(0)} 14 v${h.toFixed(0)}z"/>`;
          }).join('')
        : '';
      return `<g class="${cls}"><path d="${d}"/>${tw}</g>`;
    };
    ridges.innerHTML = layer(250, 90, 'rg3', false) + layer(300, 70, 'rg2', true) + layer(350, 40, 'rg1', false);
    root.append(ridges);
  }
  const canvas = document.createElement('canvas');
  canvas.className = 'bd-fx';
  root.append(canvas);
  startField(canvas, kind);
  return root;
}

/** Funken (aufsteigend) und Sterne; stoppt von selbst, wenn das Canvas aus dem Dokument verschwindet. */
function startField(canvas: HTMLCanvasElement, kind: BackdropKind): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const parts: Particle[] = [];
  const palette = kind === 'summon' ? [255, 265, 190, 45] : [30, 38, 45, 190];
  let w = 0;
  let h = 0;
  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = Math.max(2, Math.round(rect.width / 1.5));
    h = canvas.height = Math.max(2, Math.round(rect.height / 1.5));
  };
  const spawn = (initial: boolean): Particle => ({
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + 6,
    vx: (Math.random() - 0.5) * 0.18,
    vy: -(0.12 + Math.random() * 0.4),
    r: 0.6 + Math.random() * 1.9,
    life: initial ? Math.random() * 400 : 0,
    max: 300 + Math.random() * 500,
    hue: palette[Math.floor(Math.random() * palette.length)]!,
  });
  const frame = (): void => {
    if (!canvas.isConnected) return;
    if (w < 4) resize();
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    const want = Math.min(90, Math.round((w * h) / 5200));
    while (parts.length < want) parts.push(spawn(parts.length < want * 0.8));
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      p.x += p.vx + Math.sin((p.life + i * 17) / 60) * 0.12;
      p.y += p.vy;
      p.life++;
      const k = p.life / p.max;
      if (k >= 1 || p.y < -8) {
        parts[i] = spawn(false);
        continue;
      }
      const a = Math.sin(Math.PI * k) * 0.85;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue},95%,72%,${a})`);
      g.addColorStop(1, `hsla(${p.hue},95%,60%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.r * 4, p.y - p.r * 4, p.r * 8, p.r * 8);
    }
    if (!reduced()) requestAnimationFrame(frame);
  };
  requestAnimationFrame(() => {
    resize();
    frame();
  });
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas);
}

/**
 * Funken-Ausbruch fuer die Enthuellung: `count` Teilchen schiessen aus der Mitte, `color` ist ein CSS-Farbwert (hsl-Teil, z. B. `340`) oder `rainbow`.
 * Das Canvas bleibt stehen, bis es aus dem Dokument entfernt wird; `intensity()` laesst sich spaeter hochdrehen (neuer Ausbruch).
 */
export function burstField(canvas: HTMLCanvasElement): { burst(hue: number | 'rainbow', count: number, speed?: number): void } {
  const ctx = canvas.getContext('2d');
  const parts: (Particle & { rainbow: boolean })[] = [];
  let w = 0;
  let h = 0;
  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = Math.max(2, Math.round(rect.width / 1.5));
    h = canvas.height = Math.max(2, Math.round(rect.height / 1.5));
  };
  let running = false;
  const frame = (): void => {
    if (!canvas.isConnected || !ctx) {
      running = false;
      return;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]!;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.018;
      p.vx *= 0.992;
      p.life++;
      const k = p.life / p.max;
      if (k >= 1) {
        parts.splice(i, 1);
        continue;
      }
      const hue = p.rainbow ? (p.hue + p.life * 3) % 360 : p.hue;
      const a = (1 - k) * 0.9;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
      g.addColorStop(0, `hsla(${hue},100%,75%,${a})`);
      g.addColorStop(1, `hsla(${hue},100%,55%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.r * 3.5, p.y - p.r * 3.5, p.r * 7, p.r * 7);
    }
    if (parts.length > 0) requestAnimationFrame(frame);
    else running = false;
  };
  return {
    burst(hue, count, speed = 5): void {
      if (reduced()) return;
      if (w < 4) resize();
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random()) * speed;
        parts.push({ x: w / 2, y: h * 0.46, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: 0.8 + Math.random() * 2.4, life: 0, max: 50 + Math.random() * 70, hue: hue === 'rainbow' ? Math.random() * 360 : hue, rainbow: hue === 'rainbow' });
      }
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    },
  };
}
