/**
 * Runde 16 (TP): Effekte der Helden-Faehigkeiten Bram (Anvil Drop, Forge of Dawn) und Sela (Starfall, Eclipse).
 * Reine Anzeige aus Sim-Events, ohne Zugriff auf die Sim; der Renderer ruft nur `heroAbilityFx` / `starfallFx` auf.
 * Alles in ganzen Pixeln der 640 x 360-Karte, nur Palettenfarben (Glut und Abdunkeln ueber Alpha der Ebene).
 */
import { Container, Sprite, Texture } from 'pixi.js';
import { C, NAME_OF } from '../pixel/map/buf';
import { PAL } from '../pixel/palette';
import { rowsToCanvas, type Sprite as Spr } from '../pixel/sprites/canvas';
import { outlineSurface, RAMPS, Surface } from '../pixel/sprites/surface';
import type { FxLayer } from './fx';
import { tex } from './textures';

/** Faehigkeiten, bei denen der Held die Cast-Pose zeigt. */
export const HERO_ABILITIES = ['flare', 'dawnbreak', 'anvilDrop', 'forgeOfDawn', 'starfall', 'eclipse'] as const;
export const isHeroAbility = (id: string): boolean => (HERO_ABILITIES as readonly string[]).includes(id);

type Pt = [number, number];
export interface HeroFxCtx {
  paths: Pt[][];
  /** Aktuelle Tuerme (Position in px), fuer Forge of Dawn. */
  towers: () => { x: number; y: number }[];
}

const hexOf = (c: number): number => parseInt(PAL[NAME_OF(c)].slice(1), 16);
const toSpr = (s: Surface, ax: number, ay: number): Spr => rowsToCanvas(s.toRows(), ax, ay);
const cache = new Map<string, Spr>();
function cached(key: string, make: () => Spr): Spr {
  let s = cache.get(key);
  if (!s) { s = make(); cache.set(key, s); }
  return s;
}

// ---------------------------------------------------------------- Anvil Drop

/** Fallender Amboss (mit Umriss), Anker = Mitte der Unterkante. */
function anvilSprite(): Spr {
  return cached('anvil', () => {
    const s = new Surface(28, 20);
    const ox = 14;
    s.box(ox - 8, 2, 17, 5, RAMPS.steel);
    s.poly([[ox - 8, 2], [ox - 14, 2], [ox - 8, 6]], RAMPS.steel[1]);
    s.px(ox - 12, 2, 'white');
    s.box(ox - 4, 7, 9, 4, RAMPS.iron);
    s.box(ox - 7, 11, 15, 4, RAMPS.iron);
    s.px(ox - 7, 2, 'white'); s.px(ox - 6, 3, 'white');
    s.rect(ox - 7, 14, 15, 1, 'ink');
    return toSpr(outlineSurface(s), ox, 17);
  });
}

function dustSprite(f: number): Spr {
  return cached(`dust|${f}`, () => {
    const s = new Surface(60, 24);
    const r = 5 + f * 5;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const x = 30 + Math.cos(a) * r, y = 20 + Math.sin(a) * r * 0.45;
      s.ball(x, y - 1, 3 - f * 0.4, 2.4 - f * 0.3, ['stone', 'silver', 'white']);
    }
    return toSpr(s, 30, 20);
  });
}

function anvilDropFx(fx: FxLayer, x: number, y: number): void {
  const FALL = 8;
  fx.custom(FALL + 22, (node) => {
    const sp = new Sprite(); node.addChild(sp);
    const a = anvilSprite();
    sp.texture = tex(a.canvas);
    const stars = Array.from({ length: 3 }, () => { const q = new Sprite(Texture.WHITE); q.width = q.height = 2; q.tint = hexOf(C.yellow); node.addChild(q); return q; });
    let landed = false;
    return (age) => {
      const t = Math.min(1, age / FALL);
      const yy = y - 110 * (1 - t * t);
      sp.position.set(Math.round(x) - a.ax, Math.round(yy) - a.ay);
      sp.visible = age < FALL + 3;
      sp.alpha = age < FALL ? 1 : Math.max(0, 1 - (age - FALL) / 3);
      if (age >= FALL && !landed) {
        landed = true;
        fx.shake.t = 12; fx.shake.amp = 3;
        fx.flash(C.white, 0.35);
        fx.ring(x, y, 4, 38, C.amber, 14);
        fx.anim(x, y + 2, 4, (f) => dustSprite(f), { per: 3 });
        fx.burst(x, y - 4, [C.silver, C.stone, C.yellow, C.white], 14, 2, 2, 0.08, 22);
        fx.float(x, y - 28, 'CRUSH', C.yellow, 36, 0.4);
      }
      // Betaeubungssterne kreisen kurz ueber dem Treffer
      stars.forEach((q, i) => {
        q.visible = age >= FALL + 2;
        const aa = (age * 0.3) + (i / 3) * Math.PI * 2;
        q.position.set(Math.round(x + Math.cos(aa) * 8), Math.round(y - 20 + Math.sin(aa) * 3));
      });
    };
  });
}

// ---------------------------------------------------------------- Forge of Dawn

function glowSprite(f: number): Spr {
  return cached(`forge|${f}`, () => {
    const s = new Surface(34, 14);
    s.ellipse(17, 8, 15 - f, 5 - f * 0.3, 'rust');
    s.ellipse(17, 8, 12 - f, 4 - f * 0.3, 'orange');
    s.ellipse(17, 8, 7, 2.4, 'amber');
    return toSpr(s, 17, 8);
  });
}

function forgeFx(fx: FxLayer, ctx: HeroFxCtx, ticks: number): void {
  fx.flash(C.orange, 0.4);
  fx.custom(ticks, (node) => {
    const pool: { g: Sprite; e: Sprite[] }[] = [];
    const cols = [hexOf(C.yellow), hexOf(C.orange), hexOf(C.amber), hexOf(C.white)];
    return (age) => {
      const ts = ctx.towers();
      while (pool.length < ts.length) {
        const g = new Sprite(); node.addChild(g);
        const e = Array.from({ length: 6 }, () => { const q = new Sprite(Texture.WHITE); q.width = q.height = 2; node.addChild(q); return q; });
        pool.push({ g, e });
      }
      const fade = age > ticks - 60 ? Math.max(0, (ticks - age) / 60) : Math.min(1, age / 12);
      pool.forEach((p, i) => {
        const t = ts[i];
        p.g.visible = !!t;
        p.e.forEach((q) => { q.visible = !!t; });
        if (!t) return;
        const gs = glowSprite((age >> 3) & 1);
        p.g.texture = tex(gs.canvas);
        p.g.position.set(Math.round(t.x) - gs.ax, Math.round(t.y) - gs.ay + 1);
        p.g.alpha = 0.55 * fade * (0.8 + 0.2 * Math.sin(age / 6 + i));
        p.e.forEach((q, j) => {
          const rise = (age * 0.55 + j * 6 + i * 5) % 32;
          q.position.set(Math.round(t.x + Math.sin((age + j * 17 + i * 7) / 8) * 5 + (j - 2.5) * 4), Math.round(t.y - 6 - rise));
          q.tint = cols[(j + (age >> 4)) % cols.length];
          q.alpha = fade * Math.max(0, 1 - rise / 32);
        });
      });
    };
  });
}

// ---------------------------------------------------------------- Starfall

/** Wegpunkte im Kreis um (cx, cy) im Abstand `step` px entlang aller Aeste (doppelte Punkte der gemeinsamen Endstuecke fallen weg). */
function roadPoints(paths: Pt[][], cx: number, cy: number, r: number, step: number): Pt[] {
  const seen = new Set<string>();
  const out: Pt[] = [];
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1], [bx, by] = path[i];
      const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / step));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(ax + ((bx - ax) * k) / n), y = Math.round(ay + ((by - ay) * k) / n);
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const key = `${Math.round(x / (step - 1))},${Math.round(y / (step - 1))}`;
        if (seen.has(key)) continue;
        seen.add(key); out.push([x, y]);
      }
    }
  }
  return out;
}

/** Sternenstrahl: Sterne fallen schraeg auf den Weg im Radius, schlagen als Lichtsaeulen ein und hinterlassen einen Lichtstreifen, der verblasst. */
export function starfallFx(fx: FxLayer, ctx: HeroFxCtx, cx: number, cy: number, radius: number): void {
  const R = Math.max(30, Math.min(220, Math.round(radius)));
  const line = roadPoints(ctx.paths, cx, cy, R, 4);
  fx.flash(C.ice, 0.2);
  fx.ring(cx, cy, 6, R, C.ice, 18);
  if (!line.length) return;
  const drops = line.filter((_, k) => k % 3 === 0).slice(0, 40);
  const PAD = 44, size = 2 * R + 2 * PAD, FR = 22, FALL = 6;
  const frames: Spr[] = [];
  const L = (x: number, y: number): Pt => [x - cx + R + PAD, y - cy + R + PAD];
  for (let f = 0; f < FR; f++) {
    const s = new Surface(size, size);
    // Lichtstreifen entlang des Weges (ab Bild 4), danach verblassend
    if (f >= 4 && f < 21) {
      line.forEach(([x, y], k) => {
        const keep = f < 12 ? true : f < 17 ? k % 2 === 0 : k % 3 === 0;
        if (!keep) return;
        const [lx, ly] = L(x, y);
        if (f < 14) s.rect(lx - 2, ly - 2, 5, 5, 'sky');
        s.rect(lx - 1, ly - 1, 3, 3, f < 16 ? 'ice' : 'sky');
        if (f < 10) s.px(lx, ly, 'white');
      });
    }
    drops.forEach(([x, y], k) => {
      const start = (k * 5) % 9 + 1;
      const t = (f - start) / FALL;
      const [lx, ly] = L(x, y);
      if (t >= 0 && t < 1) {
        // Stern im Fall: kommt von rechts oben, helle Spur dahinter
        const hx = lx + 40 * (1 - t), hy = ly - 90 * (1 - t);
        for (let i = 1; i <= 10; i++) {
          const col = i < 3 ? 'white' : i < 6 ? 'yellow' : i < 9 ? 'ice' : 'sky';
          s.px(hx + i * 1.7, hy - i * 3.8, col); if (i < 7) s.px(hx + i * 1.7 + 1, hy - i * 3.8, col);
        }
        s.ball(hx, hy, 2.2, 2.2, ['yellow', 'white', 'white']);
        s.px(hx - 3, hy, 'yellow'); s.px(hx + 3, hy, 'yellow'); s.px(hx, hy - 3, 'yellow'); s.px(hx, hy + 3, 'yellow');
      } else if (f >= start + FALL && f < start + FALL + 5) {
        const q = f - start - FALL;
        // Lichtsaeule und Funkenring am Einschlag
        s.rect(lx - (q < 2 ? 1 : 0), ly - 12 + q * 2, q < 2 ? 3 : 1, 12 - q * 2, q < 2 ? 'ice' : 'white');
        s.px(lx, ly, 'white');
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [-1, 1], [1, 1]]) s.px(lx + dx * (3 + q * 2), ly + dy * (1 + q), q < 3 ? 'yellow' : 'ice');
        s.px(lx - 1 - q * 2, ly - 2 - q, 'white'); s.px(lx + 1 + q * 2, ly - 2 - q, 'white');
      }
    });
    frames.push(toSpr(s, R + PAD, R + PAD));
  }
  fx.anim(cx, cy, FR, (f) => frames[f], { per: 2 });
}

// ---------------------------------------------------------------- Eclipse

function sunSprite(f: number): Spr {
  return cached(`sun|${f}`, () => {
    const S = 120, c = 60;
    const s = new Surface(S, S);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + f * 0.07;
      const r2 = i % 2 ? 40 : 34 + ((f + i) % 3) * 2;
      s.line(c + Math.cos(a) * 25, c + Math.sin(a) * 25, c + Math.cos(a) * r2, c + Math.sin(a) * r2, i % 2 ? 'amber' : 'yellow');
    }
    s.ellipse(c, c, 27, 27, 'amber'); s.ellipse(c, c, 26, 26, 'yellow'); s.ellipse(c, c, 24.5, 24.5, 'white');
    s.ellipse(c, c, 23.5, 23.5, 'ink');
    s.ellipseFn(c, c, 23.5, 23.5, (_x, _y, nx, ny) => (-nx * 0.6 - ny * 0.8 > 0.78 ? 'night' : null));
    return toSpr(s, c, c);
  });
}

function eclipseFx(fx: FxLayer, ticks: number): void {
  fx.flash(C.ink, 0.5);
  fx.custom(ticks, (node) => {
    const veil = new Sprite(Texture.WHITE);
    veil.width = 640; veil.height = 360; veil.tint = hexOf(C.ink);
    node.addChild(veil);
    const sun = new Sprite(); node.addChild(sun);
    return (age) => {
      const t = age < 24 ? age / 24 : age > ticks - 40 ? Math.max(0, (ticks - age) / 40) : 1;
      veil.alpha = 0.5 * t;
      const sp = sunSprite((age >> 3) & 3);
      sun.texture = tex(sp.canvas);
      sun.position.set(320 - sp.ax, Math.round(64 - 18 * (1 - t)) - sp.ay);
      sun.alpha = Math.min(1, t * 1.4);
    };
  });
}

// ---------------------------------------------------------------- Einstieg

/** Zeigt den Effekt einer Helden-Faehigkeit. `true` = behandelt (Starfall zeichnet erst beim eigenen Sim-Event `starfall`). */
export function heroAbilityFx(id: string, fx: FxLayer, ctx: HeroFxCtx, x?: number, y?: number, forgeTicks = 600, eclipseTicks = 240): boolean {
  switch (id) {
    case 'anvilDrop': if (x !== undefined && y !== undefined) anvilDropFx(fx, x / 1000, y / 1000); return true;
    case 'forgeOfDawn': forgeFx(fx, ctx, forgeTicks); return true;
    case 'starfall': return true;
    case 'eclipse': eclipseFx(fx, eclipseTicks); return true;
    default: return false;
  }
}
