/**
 * Oeffentliche API der Pixel-Sprites (Vertrag: docs/design/schnittstelle.md, Abschnitt Client-Aufbau).
 * Alles reine Funktionen: Parameter -> { canvas, ax, ay } (Anker = Fuss bzw. Mitte, siehe je Funktion), gecacht je Schluessel.
 * Keine Abhaengigkeit von Pixi oder der Sim. Die Raster dahinter (`*Raster`) sind in Node testbar.
 */
import { sentryRaster, type SentryFrame } from './sentry';
import { alarmMarkRaster, buildPuffRaster, overclockRaster } from '../fx/r16tb';
import { explosionRaster, novaRaster, popRaster, boltLineRaster, statusRaster, puffRaster, leakRaster, arrowRainRaster, absoluteZeroRaster, flareRaster, dawnBeamRaster, bossPlateRaster, type ExplosionKind, type StatusKind, EXPLOSION_RADIUS } from '../fx/effects';
import { coinRiseRaster, bankChestRaster, auraRingRaster, grantRaster, ricochetRaster, supplyDropRaster, focusRaster, bossMarkRaster } from '../fx/r13';
import { acidMarkRaster, acidPoolRaster, acidSplashRaster, buffGlowRaster, deathBlastRaster, goldBurstRaster, monsterTransformRaster, shrinkRaster, stormArcRaster, thornZoneRaster, treeWallGrowRaster, treeWallRaster, vineSnareRaster, whirlwindRaster, worldTreeZoneRaster } from '../fx/r14';
import { bossDeathRaster, duskTrailRaster, frostBreathRaster, gloomCrashRaster, gloomShadowRaster, regrowRaster, shipCrashRaster, shipShadowRaster, stompRaster, towerFrozenRaster, type BigShipKind, type BossKind, type ShipKind, FROST_BREATH_RADIUS, STOMP_RADIUS } from '../fx/r15';
import { textRaster, textWidth } from '../font';
import type { PalName } from '../palette';
import { camoAlpha, rowsToCanvas, type Sprite } from './canvas';
import { enemyRaster, type EnemyOpts } from './enemies';
import { heroRaster, type HeroFrame } from './hero';
import { heroStage, STAGE_LEVEL } from './hero-stage';
import { iconAbilityRaster, iconUpgradeRaster } from './icons';
import { bigHeartRaster, bombLanternRaster, bubbleRaster, coinRaster, emberRaster, merchantRaster, powerIconRaster, trapRaster, type PowerIconId } from './powers';
import type { TowerFrame } from './pose';
import { projectileRaster } from './projectiles';
import { Surface } from './surface';
import { monsterRaster, towerRaster } from './towers';
import type { AbilityId, EnemyType, HeroType, ProjectileKind, Tiers, TowerType } from './types';

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
/** Held (Rahmen 96 x 80, Anker = Fuesse). `hero` = wren | bram | sela; `level` waehlt die sichtbare Stufe (1-4, 5-9, 10-14, 15-19, 20). */
export function heroSprite(hero: HeroType, level: number, facing: number, frame: HeroFrame): Sprite {
  const st = heroStage(level);
  const f = ((Math.round(facing) % 8) + 8) % 8;
  return cached(`h|${hero}|${st}|${f}|${frame}`, () => sprite(heroRaster(hero, STAGE_LEVEL[st], f, frame)));
}
export function heroMuzzle(hero: HeroType, level: number, facing: number): { x: number; y: number } {
  const r = heroRaster(hero, STAGE_LEVEL[heroStage(level)], ((Math.round(facing) % 8) + 8) % 8, 'idle0');
  return { x: r.mx, y: r.my };
}

// ---------- Gegner ----------

export interface EnemySpriteOpts extends EnemyOpts { camo?: boolean }
/** Gegner (Anker = Fuss am Boden, Blick nach rechts, `flip` fuer links). Frame 0..3 = Laufen. Camo = Flimmer-Raster. `regrow`/`fortified` (Runde 15) legen Blaetterkranz bzw. Eisenbaender darueber, mit Camo kombinierbar. */
export function enemySprite(type: EnemyType, frame: number, o: EnemySpriteOpts = {}): Sprite {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  const key = `e|${type}|${f}|${o.damageStage ?? 0}|${o.hitFlash ? 1 : 0}|${o.flip ? 1 : 0}|${o.camo ? 1 : 0}|${o.regrow ? 1 : 0}${o.fortified ? 1 : 0}`;
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
  return cached(`p|${kind}|${d}`, () => sprite(projectileRaster(kind, kind === 'bomb' || kind === 'potion' || kind === 'potionGold' || kind === 'hammer' ? 0 : d, kind === 'bomb' || kind === 'lantern' || kind === 'potion' || kind === 'potionGold' || kind === 'hammer' ? d : 0)));
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
export function heroPortrait(hero: HeroType = 'wren'): Sprite {
  return cached(`hp|${hero}`, () => {
    const r = heroRaster(hero, 1, 0, 'idle0');
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

// ---------- Effekte Runde 14: Thornweaver und Alchemist ----------
export { ARC_FRAMES, WIND_FRAMES, SNARE_FRAMES, WALL_FRAMES, WALL_GROW_FRAMES, WALL_WEAR_STAGES, ZONE_FRAMES, SPLASH_FRAMES, MARK_ACID_FRAMES, POOL_FRAMES, BUFF_FRAMES, DEATH_BLAST_FRAMES, TRANSFORM_FRAMES, SHRINK_FRAMES, GOLD_BURST_FRAMES, SHRINK_SCALE } from '../fx/r14';
/** Blitzbogen aus der Wolke durch Weltpunkte (Wolke, Ziel, Ziel ...), Frame 0..3, `big` = Storm Mother. Anker = Weltursprung. Nicht gecacht. */
const stormArc = (points: [number, number][], frame = 0, big = false): Sprite => sprite(stormArcRaster(points, wrap4(frame), big));
const wrap4 = (f: number): number => ((Math.floor(f) % 4) + 4) % 4;
/** Wirbelwind (Tempest), Frame 0..5, Anker = Fuss. */
const whirlwind = (frame: number): Sprite => { const f = clampF(frame, 6); return cached(`ww|${f}`, () => sprite(whirlwindRaster(f))); };
/** Ranken-Fessel am Gegner (Vine Snare), Frame 0..3 (wiegt), Anker = Fuss des Gegners. */
const vineSnare = (frame: number): Sprite => { const f = wrap4(frame); return cached(`vs|${f}`, () => sprite(vineSnareRaster(f))); };
/** Baumwand auf dem Weg, `wear` 0..3 = Abnutzung, Frame 0..3 (wiegt), Anker = Fuss Mitte. */
const treeWall = (wear: number, frame: number): Sprite => { const w = clampF(wear, 4), f = wrap4(frame); return cached(`tw|${w}|${f}`, () => sprite(treeWallRaster(w, f))); };
/** Baumwand waechst aus dem Boden, Frame 0..5, gleiche Masse wie `treeWall`. */
const treeWallGrow = (frame: number): Sprite => { const f = clampF(frame, 6); return cached(`twg|${f}`, () => sprite(treeWallGrowRaster(f))); };
/** Dornenranken-Zone (Spirit of the Forest), Radius px, Frame 0..3, Anker Mitte. */
const thornZone = (radius: number, frame: number): Sprite => { const R = Math.round(radius), f = wrap4(frame); return cached(`tz|${R}|${f}`, () => sprite(thornZoneRaster(R, f))); };
/** Weltenbaum-Zone (World Tree), Radius px, Frame 0..3, Anker Mitte. */
const worldTreeZone = (radius: number, frame: number): Sprite => { const R = Math.round(radius), f = wrap4(frame); return cached(`wz|${R}|${f}`, () => sprite(worldTreeZoneRaster(R, f))); };
/** Saeurespritzer, Radius px, Frame 0..4, Anker Mitte. */
const acidSplash = (radius: number, frame: number): Sprite => { const R = Math.round(radius), f = clampF(frame, 5); return cached(`as|${R}|${f}`, () => sprite(acidSplashRaster(R, f))); };
/** Saeure-Markierung am Gegner, Frame 0..3, Anker = Mitte des Gegners. */
const acidMark = (frame: number): Sprite => { const f = wrap4(frame); return cached(`am|${f}`, () => sprite(acidMarkRaster(f))); };
/** Saeure-Pfuetze auf dem Weg, Radius px, Frame 0..3, Anker Mitte. */
const acidPool = (radius: number, frame: number): Sprite => { const R = Math.round(radius), f = wrap4(frame); return cached(`ap|${R}|${f}`, () => sprite(acidPoolRaster(R, f))); };
/** Buff-Glanz am Turm (Trank getrunken), Frame 0..5, Anker = Fuss. 'permanent' laeuft im Kreis (Permanent Brew). */
const buffGlow = (frame: number, kind: 'brew' | 'stimulant' | 'permanent' = 'brew'): Sprite => { const f = clampF(frame, 6); return cached(`bg|${kind}|${f}`, () => sprite(buffGlowRaster(f, kind))); };
/** Gruenliche Todesexplosion (Unstable Concoction), Frame 0..4, Radius px, Anker Mitte. */
const deathBlast = (frame: number, radius = 24): Sprite => { const R = Math.round(radius), f = clampF(frame, 5); return cached(`db14|${R}|${f}`, () => sprite(deathBlastRaster(f, R))); };
/** Monster-Verwandlung: Rauchwolke, Monster waechst, Frame 0..7, Anker = Fuss. */
const monsterTransform = (frame: number): Sprite => { const f = clampF(frame, 8); return cached(`mt|${f}`, () => sprite(monsterTransformRaster(f))); };
/** Schrumpf-Effekt: Gegner schrumpft zu Red Glim, Frame 0..5 (5 = Red Glim), Anker = Fuss. */
const shrink = (etype: EnemyType, frame: number): Sprite => { const f = clampF(frame, 6); return cached(`sk|${etype}|${f}`, () => sprite(shrinkRaster(etype, f))); };
/** Goldmuenzen: 'lead' (Lead to Gold) oder 'rubber' (Rubber to Gold), Frame 0..5, Anker = Mitte des Gegners. */
const goldBurst = (kind: 'lead' | 'rubber', frame: number): Sprite => { const f = clampF(frame, 6); return cached(`gb|${kind}|${f}`, () => sprite(goldBurstRaster(kind, f))); };
export { stormArc, whirlwind, vineSnare, treeWall, treeWallGrow, thornZone, worldTreeZone, acidSplash, acidMark, acidPool, buffGlow, deathBlast, monsterTransform, shrink, goldBurst };

/** Monster-Form des Alchemisten (Transforming Tonic): 84 x 76, Anker = Fuss. facing 0..7, Frame idle0-3 / atk0-3. `scale` < 1: kleine Fassung fuer verwaltete Tuerme (Total Transformation, z. B. 0.6). */
export function monsterSprite(facing: number, frame: TowerFrame, scale = 1): Sprite {
  const f = ((Math.round(facing) % 8) + 8) % 8, k = Math.round(scale * 100);
  return cached(`mon|${f}|${frame}|${k}`, () => sprite(monsterRaster(f, frame, k / 100)));
}

// ---------- Effekte Runde 15 (B2): neue Gegner und Bosse ----------
export { REGROW_FRAMES, FROST_BREATH_FRAMES, FROZEN_TOWER_FRAMES, STOMP_FRAMES, GLOOM_CRASH_FRAMES, BOSS_DEATH_FRAMES, GLOOM_SHADOW_FRAMES, FROST_BREATH_RADIUS, STOMP_RADIUS } from '../fx/r15';
export type { BossKind, BigShipKind, ShipKind } from '../fx/r15';
export { SHIP_CRASH_FRAMES, DUSK_TRAIL_FRAMES } from '../fx/r15';
/** Regrow: Schicht waechst nach (Frame 0..5), Anker = Fuss des Gegners. */
const regrow = (etype: EnemyType, frame: number): Sprite => { const f = clampF(frame, 6); return cached(`rg|${etype}|${f}`, () => sprite(regrowRaster(etype, f))); };
/** Frosthauch des Frost Wyrm (Frame 0..7), Radius px (Standard 60 = Einfrier-Umkreis), Anker = Mitte (auf dem Wyrm). */
const frostBreath = (frame: number, radius = FROST_BREATH_RADIUS): Sprite => { const f = clampF(frame, 8), R = Math.round(radius); return cached(`fb|${R}|${f}`, () => sprite(frostBreathRaster(f, R))); };
/** Eisblock ueber einem eingefrorenen Turm (Frame 0..3), durchscheinend, Anker = Fuss des Turms. */
const towerFrozen = (frame: number): Sprite => { const f = wrap4(frame); return cached(`tf|${f}`, () => sprite(towerFrozenRaster(f))); };
/** Lava-Stampfer des Ember Colossus (Frame 0..5), Radius px (Standard 80), Anker = Auftrittspunkt. */
const stomp = (frame: number, radius = STOMP_RADIUS): Sprite => { const f = clampF(frame, 6), R = Math.round(radius); return cached(`sp|${R}|${f}`, () => sprite(stompRaster(f, R))); };
/** Schatten am Boden unter dem Gloomship (35 % Alpha), Frame 0..3, Anker = Mitte. */
const gloomShadow = (frame: number): Sprite => { const f = wrap4(frame); return cached(`gs|${f}`, () => sprite(gloomShadowRaster(f), () => 0.35)); };
/** Gloomship-Absturz (Frame 0..7), Anker = Aufschlagpunkt. */
const gloomCrash = (frame: number): Sprite => { const f = clampF(frame, 8); return cached(`gc|${f}`, () => sprite(gloomCrashRaster(f))); };
/** Boss-Tod 'wyrm' (Eisbruch) / 'colossus' (Eruption), Frame 0..9, Anker = Fuss des Bosses. */
const bossDeath = (kind: BossKind, frame: number): Sprite => { const f = clampF(frame, 10); return cached(`bd|${kind}|${f}`, () => sprite(bossDeathRaster(kind, f))); };

// ---------- Effekte Runde 15e: Cruiser, Duskrunner, Dreadnought ----------
/** Schatten am Boden unter einem schwebenden Schiff (gloomship, cruiser, duskrunner, dreadnought; 35 % Alpha eingebaut), Frame 0..3, Anker = Mitte. Fuer gloomship identisch zu gloomShadow. */
const shipShadow = (kind: ShipKind, frame: number): Sprite => { const f = wrap4(frame); return cached(`ss|${kind}|${f}`, () => sprite(shipShadowRaster(kind, f), () => 0.35)); };
/** Absturz von cruiser / dreadnought (Frame 0..9, groesser als gloomCrash), Anker = Aufschlagpunkt am Boden. */
const shipCrash = (kind: BigShipKind, frame: number): Sprite => { const f = clampF(frame, 10); return cached(`scr|${kind}|${f}`, () => sprite(shipCrashRaster(kind, f))); };
/** Duskrunner-Nachzieher (Tempo-Streifen + Nachbilder), Frame 0..3. Anker = Bodenpunkt wie enemySprite('duskrunner'): an dieselbe Stelle zeichnen, unter das Schiff. `flip` wie beim Schiff. */
const duskTrail = (frame: number, flip = false): Sprite => { const f = wrap4(frame); return cached(`dt|${f}|${flip ? 1 : 0}`, () => sprite(duskTrailRaster(f, flip))); };

export const fx = { shipShadow, shipCrash, duskTrail, regrow, frostBreath, towerFrozen, stomp, gloomShadow, gloomCrash, bossDeath, stormArc, whirlwind, vineSnare, treeWall, treeWallGrow, thornZone, worldTreeZone, acidSplash, acidMark, acidPool, buffGlow, deathBlast, monsterTransform, shrink, goldBurst, explosion, popShards, nova, boltLine, status, puff, leak, arrowRain, absoluteZero, flare, dawnBeam, bossPlate, coinRise, bankChest, auraRing, grant, ricochet, supplyDrop, focus, bossMark };
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

// ---------- Runde 16 TP: Sentry, Overclock, Alarm ----------
export { SENTRY_FRAMES, type SentryFrame } from './sentry';
export { OC_FRAMES, ALARM_MARK_FRAMES, BUILD_FRAMES } from '../fx/r16tb';
/** Sentry des Tinkers: `look` 0..4 (= Sentry-Pfad A1..A5), Blick 0..7, Frame b0-b2 (Aufbau) / idle0-1 / fire. Anker = Fuss. */
export function sentrySprite(look: number, facing: number, frame: SentryFrame): Sprite {
  const l = Math.max(0, Math.min(4, Math.round(look))), f = ((Math.round(facing) % 8) + 8) % 8;
  return cached(`sen|${l}|${f}|${frame}`, () => sprite(sentryRaster(l, f, frame)));
}
/** Muendung der Sentry relativ zum Anker. */
export function sentryMuzzle(look: number, facing: number): { x: number; y: number } {
  const r = sentryRaster(look, ((Math.round(facing) % 8) + 8) % 8, 'idle0');
  return { x: r.mx, y: r.my };
}
/** Overclock-Funken am Turm (Frame 0..3), `big` = Ultra. Anker = Fuss. */
export const overclockFx = (frame: number, big = false): Sprite => { const f = ((Math.floor(frame) % 4) + 4) % 4; return cached(`oc|${big ? 1 : 0}|${f}`, () => sprite(overclockRaster(f, big))); };
/** Alarm-Zeichen ueber einem stehenden Gegner (Frame 0..3). Anker = Mitte des Gegners. */
export const alarmMarkFx = (frame: number): Sprite => { const f = ((Math.floor(frame) % 4) + 4) % 4; return cached(`alm|${f}`, () => sprite(alarmMarkRaster(f))); };
/** Bauwolke beim Aufbau einer Sentry (Frame 0..4). Anker = Fuss. */
export const buildPuffFx = (frame: number): Sprite => { const f = clampF(frame, 5); return cached(`bpf|${f}`, () => sprite(buildPuffRaster(f))); };
