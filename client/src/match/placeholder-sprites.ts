/**
 * Platzhalter-Sprites (Runde 11 / P3) mit derselben Signatur wie die P2-API (`pixel/sprites/index.ts`): schlichte, aber lesbare
 * Raster aus Palettenfarben. Der Renderer ruft sie nur ueber `sprites.ts`; sobald P2 liefert, springt der Adapter um.
 */
import { Buf, C } from '../pixel/map/buf';
import type { EnemyType, HeroType, ProjectileKind, Tiers, TowerType } from '../sim';

export interface Spr { canvas: HTMLCanvasElement; ax: number; ay: number }
const cache = new Map<string, Spr>();
const memo = (key: string, make: () => { b: Buf; ax: number; ay: number }): Spr => {
  let s = cache.get(key);
  if (!s) {
    const { b, ax, ay } = make();
    s = { canvas: b.toCanvas(), ax, ay };
    cache.set(key, s);
  }
  return s;
};

const BODY: Record<TowerType | HeroType, [number, number, number]> = {
  ranger: [C.pine, C.grass, C.leaf],
  bombardier: [C.rust, C.orange, C.amber],
  frostcaller: [C.navy, C.sky, C.ice],
  wren: [C.crimson, C.amber, C.yellow],
};
const PATHC = [C.amber, C.ice, C.coral];

export function towerSprite(type: TowerType | HeroType, tiers: Tiers, facing: number, frame: string): Spr {
  const top = Math.max(...tiers);
  const key = `t:${type}:${tiers.join('')}:${facing & 7}:${frame}`;
  return memo(key, () => {
    const b = new Buf(36, 40);
    const [d, m, l] = BODY[type];
    const bob = frame === 'idle1' || frame === 'idle3' ? 1 : 0;
    const atk = frame.startsWith('atk') ? Number(frame[3]) : -1;
    // Sockel
    const sock = top >= 5 ? C.amber : top >= 3 ? C.stone : C.wood;
    b.ellipse(18, 34, 11, 4, C.ink);
    b.ellipse(18, 33, 10, 4, sock);
    b.ellipse(18, 32, 8, 3, top >= 5 ? C.yellow : top >= 3 ? C.silver : C.tan);
    // Koerper
    b.rect(12, 18 - bob, 12, 13, m);
    b.rect(12, 18 - bob, 4, 13, l);
    b.rect(21, 18 - bob, 3, 13, d);
    b.disc(18, 14 - bob, 6, C.skin);
    b.rect(12, 8 - bob, 12, 4, d);
    b.rect(12, 8 - bob, 5, 3, l);
    b.set(16, 14 - bob, C.ink); b.set(20, 14 - bob, C.ink);
    // Waffe in Blickrichtung
    const ang = ((facing & 7) * Math.PI) / 4;
    const reach = atk === 0 ? 5 : atk === 2 ? 11 : 8;
    const wx = 18 + Math.cos(ang) * reach, wy = 21 - Math.sin(ang) * reach * 0.7;
    b.line(18, 21, wx, wy, C.bark);
    b.disc(wx, wy, 2, type === 'bombardier' ? C.slate : type === 'frostcaller' ? C.ice : C.wood);
    // Stufenpunkte je Pfad ueber dem Kopf
    tiers.forEach((t, i) => { for (let k = 0; k < t; k++) b.set(8 + i * 10 + (k % 5) * 2 - 1, 4 + (k >= 5 ? 1 : 0), PATHC[i]); });
    if (top >= 5) { b.disc(18, 18, 14, 0); for (let a = 0; a < 16; a++) b.set(18 + Math.cos(a / 16 * 6.283) * 15, 20 + Math.sin(a / 16 * 6.283) * 12, C.yellow); }
    b.outline(C.ink);
    return { b, ax: 18, ay: 36 };
  });
}

export function heroSprite(level: number, facing: number, frame: string): Spr {
  return towerSprite('wren', [Math.min(5, Math.floor(level / 4)), 0, 0], facing, frame);
}

const ECOL: Record<EnemyType, [number, number, number]> = {
  red: [C.crimson, C.red, C.coral],
  blue: [C.navy, C.sky, C.ice],
  green: [C.grass, C.leaf, C.yellow],
  gold: [C.orange, C.amber, C.yellow],
  ironshell: [C.slate, C.stone, C.silver],
  ember: [C.crimson, C.orange, C.yellow],
  brute: [C.dusk, C.slate, C.stone],
  leviathan: [C.night, C.navy, C.sky],
};
const ESIZE: Record<EnemyType, number> = { red: 5, blue: 5, green: 5, gold: 5, ironshell: 6, ember: 5, brute: 8, leviathan: 22 };

export function enemySprite(type: EnemyType, frame: number, o: { camo?: boolean; damageStage?: number; hitFlash?: boolean } = {}): Spr {
  const key = `e:${type}:${frame & 3}:${o.camo ? 1 : 0}:${o.damageStage ?? 0}:${o.hitFlash ? 1 : 0}`;
  return memo(key, () => {
    const r = ESIZE[type];
    const W = r * 2 + 6, H = r * 2 + 8;
    const b = new Buf(W, H);
    const cx = r + 3, cy = r + 3;
    const squash = frame & 1 ? 1 : 0;
    const [d, m, l] = o.hitFlash ? [C.white, C.white, C.white] : ECOL[type];
    b.ellipse(cx, cy + 1 - squash * 0, r + squash * 0.5, r - squash * 0.4 + 0.5, m);
    b.each(cx - r * 0.3, cy - r * 0.3, r * 0.5, r * 0.5, (x, y) => b.set(x, y, l));
    b.each(cx + r * 0.4, cy + r * 0.5, r * 0.9, r * 0.45, (x, y) => b.get(x, y) === m && b.set(x, y, d));
    if (!o.hitFlash) {
      b.set(cx - Math.ceil(r / 3), cy, C.ink); b.set(cx + Math.ceil(r / 3), cy, C.ink);
      if (type === 'ironshell' || type === 'brute' || type === 'leviathan') for (let x = -r + 2; x < r - 1; x += 3) b.set(cx + x, cy - r + 3, C.silver);
      if (type === 'ember') { b.set(cx, cy - r - 1, C.yellow); b.set(cx - 2, cy - r, C.orange); }
      if (type === 'leviathan') { b.line(cx - r, cy + 2, cx + r, cy + 2, C.dusk); }
      for (let i = 0; i < (o.damageStage ?? 0); i++) b.line(cx - 2 + i * 2, cy - r + 2, cx + i, cy + 2, C.ink);
    }
    if (o.camo) b.d.forEach((v, i) => { if (v && ((i % b.w) + Math.floor(i / b.w)) % 2 === 0) b.d[i] = 0; });
    b.outline(C.ink);
    return { b, ax: Math.floor(W / 2), ay: cy + r + 3 };
  });
}

export function projectileSprite(kind: ProjectileKind, dir16: number): Spr {
  return memo(`p:${kind}:${dir16 & 15}`, () => {
    const b = new Buf(13, 13);
    const a = ((dir16 & 15) / 16) * Math.PI * 2;
    const dx = Math.cos(a), dy = -Math.sin(a);
    const col = kind === 'bomb' ? C.ink : kind === 'frost' || kind === 'shard' ? C.ice : kind === 'lantern' ? C.yellow : kind === 'bolt' || kind === 'bigArrow' || kind === 'starBolt' ? C.amber : C.sand;
    if (kind === 'bomb') { b.disc(6, 6, 2.5, C.ink); b.set(5, 5, C.slate); b.set(8, 3, C.orange); return { b, ax: 6, ay: 6 }; }
    if (kind === 'frag') { b.rect(5, 5, 2, 2, C.stone); return { b, ax: 6, ay: 6 }; }
    const len = kind === 'bigArrow' || kind === 'bolt' || kind === 'starBolt' ? 5 : 3;
    for (let i = -len; i <= len; i++) b.set(6 + dx * i, 6 + dy * i, i > len - 2 ? C.white : i < -len + 1 ? C.red : col);
    if (kind === 'frost' || kind === 'lantern') b.disc(6, 6, 2, col);
    return { b, ax: 6, ay: 6 };
  });
}

export function iconUpgrade(type: TowerType | HeroType, path: number, tier: number): Spr {
  return memo(`i:${type}:${path}:${tier}`, () => {
    const b = new Buf(16, 16);
    const [d, m, l] = BODY[type];
    b.rect(0, 0, 16, 16, d);
    b.rect(1, 1, 14, 14, m);
    b.rect(1, 1, 14, 2, l);
    const pc = PATHC[path];
    // Glyphe je Pfad: Pfeile / Wirbel / Blitz, Anzahl wachsende Stufe
    for (let i = 0; i < tier; i++) b.rect(2 + i * 3, 12, 2, 2, pc);
    if (path === 0) { b.line(4, 9, 11, 4, C.white); b.set(11, 3, C.white); b.set(12, 4, C.white); }
    else if (path === 1) { b.disc(8, 7, 3, C.white); b.disc(8, 7, 1.2, pc); }
    else { b.line(9, 2, 6, 7, C.yellow); b.line(6, 7, 10, 7, C.yellow); b.line(10, 7, 7, 11, C.yellow); }
    return { b, ax: 0, ay: 0 };
  });
}

export function explosionSprite(frame: number, radiusPx: number): Spr {
  const rr = Math.max(6, Math.round(radiusPx));
  return memo(`x:${frame}:${rr}`, () => {
    const S = rr * 2 + 6;
    const b = new Buf(S, S);
    const cx = S / 2, cy = S / 2;
    const f = Math.min(4, frame) / 4;
    const r = rr * (0.45 + f * 0.55);
    const cols = [C.white, C.yellow, C.amber, C.orange, C.slate];
    if (frame >= 3) { b.disc(cx, cy, r, cols[3]); b.disc(cx, cy, r * 0.6, C.stone); }
    else { b.disc(cx, cy, r, cols[frame + 1]); b.disc(cx, cy, r * 0.6, cols[frame]); }
    if (frame === 4) b.d.forEach((v, i) => { if (v && (((i % b.w) + Math.floor(i / b.w)) & 1)) b.d[i] = 0; });
    return { b, ax: Math.floor(cx), ay: Math.floor(cy) };
  });
}

export function ringSprite(radiusPx: number, col: number, dashed = false): Spr {
  const r = Math.max(2, Math.round(radiusPx));
  return memo(`r:${r}:${col}:${dashed ? 1 : 0}`, () => {
    const S = r * 2 + 4;
    const b = new Buf(S, S);
    const n = Math.max(24, Math.round(r * 7));
    for (let i = 0; i < n; i++) {
      if (dashed && i % 2) continue;
      const a = (i / n) * Math.PI * 2;
      b.set(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, col);
    }
    return { b, ax: S >> 1, ay: S >> 1 };
  });
}
