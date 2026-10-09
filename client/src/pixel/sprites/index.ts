/**
 * Oeffentliche API der Pixel-Sprites (Vertrag: docs/design/schnittstelle.md, Abschnitt Client-Aufbau).
 * Alles reine Funktionen: Parameter -> { canvas, ax, ay } (Anker = Fuss bzw. Mitte, siehe je Funktion), gecacht je Schluessel.
 * Keine Abhaengigkeit von Pixi oder der Sim. Die Raster dahinter (`*Raster`) sind in Node testbar.
 */
import { explosionRaster, novaRaster, popRaster, boltLineRaster, statusRaster, puffRaster, leakRaster, arrowRainRaster, absoluteZeroRaster, flareRaster, dawnBeamRaster, bossPlateRaster, type ExplosionKind, type StatusKind, EXPLOSION_RADIUS } from '../fx/effects';
import { coinRiseRaster, bankChestRaster, auraRingRaster, grantRaster, ricochetRaster, supplyDropRaster, focusRaster, bossMarkRaster } from '../fx/r13';
import { textRaster, textWidth } from '../font';
import type { PalName } from '../palette';
import { camoAlpha, rowsToCanvas, type Sprite } from './canvas';
import { enemyRaster, type EnemyOpts } from './enemies';
import { heroRaster, type HeroFrame } from './hero';
import { iconAbilityRaster, iconUpgradeRaster } from './icons';
import { bigHeartRaster, bombLanternRaster, bubbleRaster, coinRaster, emberRaster, merchantRaster, powerIconRaster, trapRaster, type PowerIconId } from './powers';
import type { TowerFrame } from './pose';
import { projectileRaster } from './projectiles';
import { Surface } from './surface';
import { towerRaster } from './towers';
import type { AbilityId, EnemyType, ProjectileKind, Tiers, TowerType } from './types';

export type { Sprite, AlphaFn } from './canvas';
export * from './types';
export type { TowerFrame } from './pose';
export { TOWER_FRAMES, dir16, dir8 } from './pose';
export type { HeroFrame } from './hero';
export { HERO_FRAMES, heroStage } from './hero';
export type { EnemyOpts } from './enemies';
export { ENEMY_SIZE, shellRamp } from './enemies';
export type { ExplosionKind, StatusKind } from '../fx/effects';
export { EXPLOSION_FRAMES, NOVA_FRAMES, POP_FRAMES, PUFF_FRAMES, PLATE_FRAMES, FLARE_FRAMES, ZERO_FRAMES, BEAM_FRAMES, STATUS_FRAMES, PATH_COLORS, EXPLOSION_RADIUS } from '../fx/effects';
export { PATH_ACCENT } from './icons';
export { textWidth };

const cache = new Map<string, Sprite>();
export function cached(key: string, make: () => Sprite): Sprite {
  let s = cache.get(key);
  if (!s) { s = make(); cache.set(key, s); }
  return s;
}
export function clearSpriteCache(): void { cache.clear(); }

const sprite = (r: { rows: string[]; ax: number; ay: number }, alpha?: (x: number, y: number) => number): Sprite => rowsToCanvas(r.rows, r.ax, r.ay, alpha);

// ---------- Tuerme und Held ----------

/** Turm (Rahmen 55 x 56, Anker = Fusspunkt am Boden). facing 0..7 (0 = rechts, gegen den Uhrzeigersinn), Frames idle0-3 / atk0-3. */
export function towerSprite(type: TowerType, tiers: Tiers, facing: number, frame: TowerFrame): Sprite {
  const f = ((Math.round(facing) % 8) + 8) % 8;
  return cached(`t|${type}|${tiers.join('')}|${f}|${frame}`, () => sprite(towerRaster(type, tiers, f, frame)));
}
/** Wo das Projektil sichtbar die Waffe verlaesst, relativ zum Anker (px). */
export function towerMuzzle(type: TowerType, tiers: Tiers, facing: number): { x: number; y: number } {
  const r = towerRaster(type, tiers, ((Math.round(facing) % 8) + 8) % 8, 'idle0');
  return { x: r.mx ?? 0, y: r.my ?? 0 };
}
export function heroSprite(level: number, facing: number, frame: HeroFrame): Sprite {
  const st = level >= 20 ? 4 : level >= 15 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0;
  const f = ((Math.round(facing) % 8) + 8) % 8;
  return cached(`h|${st}|${f}|${frame}`, () => sprite(heroRaster(st === 0 ? 1 : st === 1 ? 5 : st === 2 ? 10 : st === 3 ? 15 : 20, f, frame)));
}
export function heroMuzzle(level: number, facing: number): { x: number; y: number } {
  const r = heroRaster(level, ((Math.round(facing) % 8) + 8) % 8, 'idle0');
  return { x: r.mx, y: r.my };
}

// ---------- Gegner ----------

export interface EnemySpriteOpts extends EnemyOpts { camo?: boolean }
/** Gegner (Anker = Fuss am Boden, Blick nach rechts, `flip` fuer links). Frame 0..3 = Laufen. Camo = Flimmer-Raster. */
export function enemySprite(type: EnemyType, frame: number, o: EnemySpriteOpts = {}): Sprite {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  const key = `e|${type}|${f}|${o.damageStage ?? 0}|${o.hitFlash ? 1 : 0}|${o.flip ? 1 : 0}|${o.camo ? 1 : 0}`;
  return cached(key, () => sprite(enemyRaster(type, f, o), o.camo ? camoAlpha(f) : undefined));
}
/** Schlagschatten (ink, 35 % Alpha) als Ellipse w x h; Anker = Mitte. Turm 16x5, Glim 9x3, Boss 40x10. */
export function shadowSprite(w: number, h: number): Sprite {
  return cached(`sh|${w}|${h}`, () => {
    const s = new Surface(w + 2, h + 2);
    s.ellipse((w + 2) / 2, (h + 2) / 2, w / 2, h / 2, 'ink');
    const c = sprite({ rows: s.toRows(), ax: Math.floor((w + 2) / 2), ay: Math.floor((h + 2) / 2) });
    const g = c.canvas.getContext('2d') as CanvasRenderingContext2D;
    const d = g.getImageData(0, 0, c.canvas.width, c.canvas.height);
    for (let i = 3; i < d.data.length; i += 4) if (d.data[i]) d.data[i] = 89; // 35 %
    g.putImageData(d, 0, 0);
    return c;
  });
}

// ---------- Projektile ----------

/** Projektil in 16 Richtungen (0 = rechts, gegen den Uhrzeigersinn). Bombe: `dir16` dreht die Lunte (Spin). Anker = Mitte. */
export function projectileSprite(kind: ProjectileKind, dir16: number): Sprite {
  const d = ((Math.round(dir16) % 16) + 16) % 16;
  return cached(`p|${kind}|${d}`, () => sprite(projectileRaster(kind, kind === 'bomb' ? 0 : d, kind === 'bomb' || kind === 'lantern' ? d : 0)));
}

// ---------- Icons und Portraets ----------

export function iconUpgrade(type: TowerType, path: 0 | 1 | 2, tier: number): Sprite {
  return cached(`iu|${type}|${path}|${tier}`, () => sprite(iconUpgradeRaster(type, path, tier)));
}
export function iconAbility(id: AbilityId): Sprite {
  return cached(`ia|${id}`, () => sprite(iconAbilityRaster(id)));
}
function crop(rows: string[], pad = 1): { rows: string[]; dx: number; dy: number } {
  const s = Surface.fromRows(rows);
  let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.g[y * s.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(s.w - 1, x1 + pad); y1 = Math.min(s.h - 1, y1 + pad);
  return { rows: rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1)), dx: x0, dy: y0 };
}
/** Turm-Portraet fuer die Turm-Leiste: Stufe 0, Blick nach rechts, auf die Figur zugeschnitten. */
export function towerPortrait(type: TowerType): Sprite {
  return cached(`tp|${type}`, () => {
    const r = towerRaster(type, [0, 0, 0], 0, 'idle0');
    const c = crop(r.rows);
    return rowsToCanvas(c.rows, r.ax - c.dx, r.ay - c.dy);
  });
}
export function heroPortrait(): Sprite {
  return cached('hp', () => {
    const r = heroRaster(1, 0, 'idle0');
    const c = crop(r.rows);
    return rowsToCanvas(c.rows, r.ax - c.dx, r.ay - c.dy);
  });
}

// ---------- Effekte ----------

const explosion = (kind: ExplosionKind, frame: number, radius?: number): Sprite => {
  const R = Math.round(radius ?? EXPLOSION_RADIUS[kind]);
  const f = Math.max(0, Math.min(4, Math.floor(frame)));
  return cached(`x|${kind}|${R}|${f}`, () => sprite(explosionRaster(kind, f, R)));
};
const popShards = (etype: EnemyType, frame = 0): Sprite => {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  return cached(`pop|${etype}|${f}`, () => sprite(popRaster(etype, f)));
};
const nova = (frame: number, radius = 16): Sprite => {
  const f = Math.max(0, Math.min(3, Math.floor(frame)));
  return cached(`nova|${Math.round(radius)}|${f}`, () => sprite(novaRaster(f, radius)));
};
/** Blitzkette als Pixel-Linie durch Punkte in Weltkoordinaten (px); gezeichnet wird bei (0,0), Anker = Weltursprung. Nicht gecacht. */
const boltLine = (points: [number, number][], frame = 0): Sprite => sprite(boltLineRaster(points, frame));
const status = (kind: StatusKind, frame: number, etype: EnemyType = 'red'): Sprite => {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  return cached(`st|${kind}|${kind === 'freeze' ? etype : ''}|${f}`, () => sprite(statusRaster(kind, f, etype)));
};
const puff = (frame: number, path: number | null = null): Sprite => {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  return cached(`puff|${path}|${f}`, () => sprite(puffRaster(f, path)));
};
const leak = (frame: number): Sprite => {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  return cached(`leak|${f}`, () => sprite(leakRaster(f)));
};
const arrowRain = (frame: number, radius = 68): Sprite => {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  return cached(`ar|${Math.round(radius)}|${f}`, () => sprite(arrowRainRaster(f, radius)));
};
/** Absolute Zero: Frost ueber das ganze Feld 640 x 360, Frame 0..7, Anker (0,0). */
const absoluteZero = (frame: number): Sprite => {
  const f = Math.max(0, Math.min(7, Math.floor(frame)));
  return cached(`az|${f}`, () => sprite(absoluteZeroRaster(f)));
};
const flare = (frame: number, radius = 40): Sprite => {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  return cached(`fl|${Math.round(radius)}|${f}`, () => sprite(flareRaster(f, radius)));
};
/** Dawnbreak-Balken, `len` px lang; Anker am Anfang (Mitte der Dicke). */
const dawnBeam = (len: number, frame: number, vertical = false): Sprite => {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  return cached(`db|${Math.round(len)}|${f}|${vertical ? 1 : 0}`, () => sprite(dawnBeamRaster(len, f, vertical)));
};
const bossPlate = (frame: number, side: 1 | -1 = 1): Sprite => {
  const f = Math.max(0, Math.min(7, Math.floor(frame)));
  return cached(`bp|${side}|${f}`, () => sprite(bossPlateRaster(f, side)));
};


// ---------- Effekte Runde 13: Lantern Market und Longshot ----------
export { COIN_RISE_FRAMES, CHEST_FRAMES, AURA_FRAMES, GRANT_FRAMES, DROP_FRAMES, FOCUS_FRAMES, MARK_FRAMES } from '../fx/r13';
const clampF = (f: number, n: number): number => Math.max(0, Math.min(n - 1, Math.floor(f)));
/** Muenzflug am Rundenende: Muenzen steigen vom Market auf (Frame 0..7). Anker = Fuss des Stands. */
const coinRise = (frame: number): Sprite => { const f = clampF(frame, 8); return cached(`cr|${f}`, () => sprite(coinRiseRaster(f))); };
/** Bank-Truhe (Frame 0 zu .. 3/4 Muenzen springen .. 5 Deckel faellt). Anker = Fuss unten Mitte. */
const bankChest = (frame: number): Sprite => { const f = clampF(frame, 6); return cached(`bc|${f}`, () => sprite(bankChestRaster(f))); };
/** Aura-Ring in Pfadfarbe (`path` 0..2, Standard 2 = Town Square) mit Wirkradius in px, 4 Frames. Anker Mitte. */
const auraRing = (radius: number, frame: number, path: 0 | 1 | 2 = 2): Sprite => {
  const f = ((Math.floor(frame) % 4) + 4) % 4, R = Math.round(radius);
  return cached(`ar13|${R}|${f}|${path}`, () => sprite(auraRingRaster(R, f, path)));
};
/** Grant-Fahigkeit: Siegel-Blitz und Muenzfontaene (Frame 0..7), Anker Mitte. */
const grant = (frame: number): Sprite => { const f = clampF(frame, 8); return cached(`gr|${f}`, () => sprite(grantRaster(f))); };
/** Ricochet-Spur durch Weltpunkte, Anker = Weltursprung. Nicht gecacht. */
const ricochet = (points: [number, number][], frame = 0): Sprite => sprite(ricochetRaster(points, frame));
/** Supply-Drop: 0-5 faellt am Fallschirm, 6-8 landet, 9-11 Kiste oeffnet sich. Anker = Kistenfuss. */
const supplyDrop = (frame: number): Sprite => { const f = clampF(frame, 12); return cached(`sd|${f}`, () => sprite(supplyDropRaster(f))); };
/** Focus: goldener Doppelring + Tempo-Striche um einen Longshot (Frame 0..3), Anker Mitte. */
const focus = (frame: number): Sprite => { const f = ((Math.floor(frame) % 4) + 4) % 4; return cached(`fo|${f}`, () => sprite(focusRaster(f))); };
/** Boss-Markierung (rotes Fadenkreuz ueber dem Ziel, Crippling Shot), 4 Frames, Anker Mitte. */
const bossMark = (frame: number): Sprite => { const f = ((Math.floor(frame) % 4) + 4) % 4; return cached(`bm|${f}`, () => sprite(bossMarkRaster(f))); };

export const fx = { explosion, popShards, nova, boltLine, status, puff, leak, arrowRain, absoluteZero, flare, dawnBeam, bossPlate, coinRise, bankChest, auraRing, grant, ricochet, supplyDrop, focus, bossMark };
export { coinRise, bankChest, auraRing, grant as grantFx, ricochet, supplyDrop, focus as focusFx, bossMark };
export { explosion, popShards, nova, boltLine, status as statusFx, puff, leak as leakFx, arrowRain as arrowRainFx, absoluteZero as absoluteZeroFx, flare as flareFx, dawnBeam, bossPlate };

// ---------- Pixel-Ziffern ----------

/** Text (Ziffern, + - . , / % x k und Grossbuchstaben) in der 3 x 5-Pixelschrift mit Umriss; Anker = Mitte unten. */
export function pixelText(text: string, color: PalName = 'white', outline: PalName | null = 'ink'): Sprite {
  return cached(`tx|${text}|${color}|${outline}`, () => sprite(textRaster(text, color, outline)));
}

// ---------- Powers, Embers, Haendler (Runde 12) ----------

export type { PowerIconId } from './powers';
export { POWER_ICON_IDS, POWER_COLOR, TRAP_W, TRAP_H } from './powers';
/** Power-Icon 16 x 16 (Tafel in Power-Farbe), ohne Anker. */
export function iconPower(id: PowerIconId): Sprite {
  return cached(`ipw|${id}`, () => sprite(powerIconRaster(id)));
}
/** Embers-Symbol (Glutstueck) 16 x 16, 2 Flammenbilder. */
export function emberIcon(frame = 0): Sprite {
  const f = frame & 1;
  return cached(`emb|${f}`, () => sprite(emberRaster(f)));
}
/** Haendler fuer den Store, 40 x 44, Anker Fuss unten Mitte, 2 Atem-Bilder. */
export function merchantSprite(frame = 0): Sprite {
  const f = frame & 1;
  return cached(`mer|${f}`, () => sprite(merchantRaster(f)));
}
/** Falle auf dem Weg, Anker Mitte. `pieces` = sichtbare Zacken/Kristalle. */
export function trapSprite(kind: 'caltrops' | 'frostTrap', pieces: number, frame = 0): Sprite {
  const f = frame & 1;
  return cached(`trap|${kind}|${pieces}|${f}`, () => sprite(trapRaster(kind, pieces, f)));
}
export function coinSprite(frame: number): Sprite {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  return cached(`coin|${f}`, () => sprite(coinRaster(f)));
}
export function bigHeart(): Sprite {
  return cached('bheart', () => sprite(bigHeartRaster()));
}
export function bubbleSprite(frame: number, r: number): Sprite {
  const f = ((Math.floor(frame) % 4) + 4) % 4, rr = Math.round(r);
  return cached(`bub|${rr}|${f}`, () => sprite(bubbleRaster(f, rr)));
}
export function bombLantern(frame = 0): Sprite {
  const f = frame & 1;
  return cached(`bomblan|${f}`, () => sprite(bombLanternRaster(f)));
}
