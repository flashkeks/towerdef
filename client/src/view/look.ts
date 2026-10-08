/**
 * Aussehen im Match, reine Daten und Logik (Runde 10 / P2): Elementfarben und Partikelart, Seltenheits-Ringe, Gegner-Figuren je Typ,
 * Angriffsgrafik je Form x Element, Krit-Schaetzung, Aufwands-Deckel. Kein Pixi, kein DOM, kein Ton: alles hier ist testbar,
 * `game/figures.ts` und `game/fx.ts` zeichnen nur, was hier beschlossen wird.
 */
import type { UnitDef } from '../sim';
import type { HitStyle } from './feel';

// ---- Elemente ------------------------------------------------------------------------------------------------------

export type LookKey = 'fire' | 'water' | 'ice' | 'lightning' | 'air' | 'light' | 'dark' | 'rose' | 'physical' | 'magic' | 'true';

/** Wie Splitter eines Elements aussehen und sich bewegen. */
export type ParticleKind = 'ember' | 'drop' | 'spark' | 'shard' | 'wisp' | 'star' | 'petal' | 'chip' | 'rune' | 'ray';

export interface ElementLook {
  key: LookKey;
  /** Hauptfarbe, helle Kante, dunkler Kern (RGB). */
  main: number;
  light: number;
  dark: number;
  particle: ParticleKind;
  /** Schwerkraft der Splitter in Kacheln/s^2 (negativ = steigt auf). */
  gravity: number;
  /** Kurzer Name des Symbols (`icons.ts`), fuer das Abzeichen. */
  icon: string;
}

export const ELEMENT_LOOKS: Record<LookKey, ElementLook> = {
  fire: { key: 'fire', main: 0xff7a3c, light: 0xffd08a, dark: 0xb02a10, particle: 'ember', gravity: -2.4, icon: 'fire' },
  water: { key: 'water', main: 0x4a9bf0, light: 0xb7e3ff, dark: 0x1f4fa0, particle: 'drop', gravity: 5.5, icon: 'water' },
  ice: { key: 'ice', main: 0x9fe2ff, light: 0xf2fcff, dark: 0x3d86b8, particle: 'shard', gravity: 2.2, icon: 'ice' },
  lightning: { key: 'lightning', main: 0xffe14a, light: 0xffffff, dark: 0xb89a10, particle: 'spark', gravity: 0, icon: 'lightning' },
  air: { key: 'air', main: 0x7fe8bd, light: 0xe6fff4, dark: 0x2f9c78, particle: 'wisp', gravity: -0.6, icon: 'air' },
  light: { key: 'light', main: 0xfff0a8, light: 0xffffff, dark: 0xd8a830, particle: 'star', gravity: -1, icon: 'light' },
  dark: { key: 'dark', main: 0x9a64e0, light: 0xd9b8ff, dark: 0x3a1c70, particle: 'wisp', gravity: 0.8, icon: 'dark' },
  rose: { key: 'rose', main: 0xff6fa3, light: 0xffc4da, dark: 0xa02a60, particle: 'petal', gravity: 1.6, icon: 'rose' },
  physical: { key: 'physical', main: 0xdfe3ee, light: 0xffffff, dark: 0x7c84a0, particle: 'chip', gravity: 3.2, icon: 'sword' },
  magic: { key: 'magic', main: 0xb98cff, light: 0xf0e2ff, dark: 0x5a30b0, particle: 'rune', gravity: -0.8, icon: 'sparkle' },
  true: { key: 'true', main: 0xffd966, light: 0xffffff, dark: 0xb07a10, particle: 'ray', gravity: 0, icon: 'target' },
};

const KEYS = new Set<string>(Object.keys(ELEMENT_LOOKS));

/** Welches Aussehen ein Element oder ein Damage-Typ bekommt (unbekannt: physisch). */
export const lookOf = (key: string | undefined): ElementLook => ELEMENT_LOOKS[(KEYS.has(key ?? '') ? key : 'physical') as LookKey];

/** Bestimmendes Aussehen einer Unit: erstes Element, sonst der Damage-Typ. */
export const unitLook = (def: Pick<UnitDef, 'elements' | 'damageType'>): ElementLook => lookOf(def.elements[0] ?? def.damageType);

// ---- Seltenheit ----------------------------------------------------------------------------------------------------

export interface RarityLook {
  /** Aussenring, Innenring, Leuchten (RGB). */
  a: number;
  b: number;
  glow: number;
  /** Ringbreite in Kacheln. */
  width: number;
  /** Ring dreht (Mythic/Secret/Exclusive) und Leuchten pulsiert. */
  live: boolean;
  /** Anzahl der Zacken/Funken am Ring (nur Dekor), 0 = glatt. */
  studs: number;
}

export const RARITY_LOOKS: Record<string, RarityLook> = {
  Rare: { a: 0x7fc4ff, b: 0x3b82e6, glow: 0x3b82e6, width: 0.045, live: false, studs: 0 },
  Epic: { a: 0xc7a6ff, b: 0x8a52e6, glow: 0x8a52e6, width: 0.05, live: false, studs: 0 },
  Legendary: { a: 0xfbe7a6, b: 0xe9a52b, glow: 0xf5c542, width: 0.055, live: false, studs: 8 },
  Mythic: { a: 0xff7a9a, b: 0xd8344a, glow: 0xff4a6a, width: 0.065, live: true, studs: 12 },
  Secret: { a: 0xf1f2f7, b: 0x55e6d3, glow: 0x9ff0ff, width: 0.065, live: true, studs: 12 },
  Exclusive: { a: 0xd9fff0, b: 0x2fc98a, glow: 0x55e6a8, width: 0.065, live: true, studs: 8 },
};
export const rarityLook = (rarity: string): RarityLook => RARITY_LOOKS[rarity] ?? RARITY_LOOKS.Rare;

// ---- Gegner-Figuren ------------------------------------------------------------------------------------------------

export type EnemyShape = 'blob' | 'sprinter' | 'bulwark' | 'wing' | 'splitter' | 'splitterChild' | 'champion' | 'overlord';

export interface EnemyLook {
  shape: EnemyShape;
  /** Koerper, Kante/Licht, Augen/Akzent. */
  body: number;
  edge: number;
  accent: number;
  /** Radius des Koerpers in Kacheln. */
  radius: number;
  /** Takt des Wippens (Hz) und Tiefe in Kacheln. */
  bobHz: number;
  bobDepth: number;
  /** Sprite-Skalierung zum Bild. */
  banner: boolean;
}

export const ENEMY_LOOKS: Record<string, EnemyLook> = {
  grunt: { shape: 'blob', body: 0x5b3a96, edge: 0xb89cf0, accent: 0xffe8a0, radius: 0.3, bobHz: 2.2, bobDepth: 0.03, banner: false },
  runner: { shape: 'sprinter', body: 0x2f8f9c, edge: 0x8af0e0, accent: 0xffffff, radius: 0.26, bobHz: 4.4, bobDepth: 0.04, banner: false },
  brute: { shape: 'bulwark', body: 0x6a3030, edge: 0xe0a070, accent: 0xff8d4e, radius: 0.4, bobHz: 1.1, bobDepth: 0.025, banner: false },
  flyer: { shape: 'wing', body: 0x3d4ea8, edge: 0x9fb4ff, accent: 0xc8e8ff, radius: 0.3, bobHz: 2.6, bobDepth: 0.06, banner: false },
  splitter: { shape: 'splitter', body: 0x3f8a46, edge: 0xb6f088, accent: 0xf5ff9a, radius: 0.32, bobHz: 2.0, bobDepth: 0.035, banner: false },
  splitter_child: { shape: 'splitterChild', body: 0x3f8a46, edge: 0xb6f088, accent: 0xf5ff9a, radius: 0.18, bobHz: 3.4, bobDepth: 0.03, banner: false },
  elite: { shape: 'champion', body: 0x7a5a1a, edge: 0xf5d070, accent: 0xff5a4a, radius: 0.5, bobHz: 1.4, bobDepth: 0.03, banner: false },
  boss: { shape: 'overlord', body: 0x4a1830, edge: 0xff6a8a, accent: 0xffd966, radius: 0.85, bobHz: 0.7, bobDepth: 0.03, banner: true },
};
export const enemyLook = (type: string): EnemyLook => ENEMY_LOOKS[type] ?? ENEMY_LOOKS.grunt;

// ---- Angriffs-Grafik -----------------------------------------------------------------------------------------------

/** Was der Treffer zeigt: gezeichnet wird je Form x Element, hier steht die Entscheidung ohne Pixi. */
export interface AttackLook {
  style: HitStyle;
  element: ElementLook;
  /** Projektil/Hieb/Strahl in Form des Elements (siehe fx.ts). */
  shape: 'arc' | 'orb' | 'bolt' | 'shard' | 'blade' | 'bullet' | 'petal' | 'beam' | 'wave' | 'fan';
  /** Anzahl Splitter je Treffer vor dem Deckel. */
  particles: number;
  /** Nur jede n-te Zuendung zeigt die volle Grafik (dichte Salven). */
  heavy: boolean;
}

/** Form des Geschosses: Elementabhaengig, aber nur fuer Einzelziele (Flaechen haben feste Form). */
export function projectileShape(el: LookKey, melee: boolean): AttackLook['shape'] {
  if (melee) return el === 'lightning' ? 'bolt' : el === 'air' ? 'blade' : el === 'ice' ? 'shard' : 'arc';
  switch (el) {
    case 'fire':
    case 'water':
    case 'dark':
    case 'light':
    case 'magic':
      return 'orb';
    case 'lightning':
      return 'bolt';
    case 'ice':
      return 'shard';
    case 'air':
      return 'blade';
    case 'rose':
      return 'petal';
    default:
      return 'bullet';
  }
}

export function attackLook(style: HitStyle, def: Pick<UnitDef, 'elements' | 'damageType'>): AttackLook {
  const element = unitLook(def);
  let shape: AttackLook['shape'];
  switch (style) {
    case 'slash':
      shape = projectileShape(element.key, true);
      break;
    case 'cone':
      shape = 'fan';
      break;
    case 'line':
      shape = 'beam';
      break;
    case 'blast':
    case 'full':
      shape = 'wave';
      break;
    case 'shell':
      shape = 'orb';
      break;
    default:
      shape = projectileShape(element.key, false);
  }
  const particles = style === 'slash' ? 5 : style === 'tracer' || style === 'bolt' ? 4 : style === 'blast' || style === 'full' ? 12 : 8;
  return { style, element, shape, particles, heavy: style === 'blast' || style === 'full' || style === 'shell' };
}

// ---- Krit-Schaetzung -----------------------------------------------------------------------------------------------

/**
 * Die Sim meldet keine einzelnen Treffer, also auch keinen Krit. Naeherung fuer die Anzeige: Eine Unit mit Crit-Chance hat kritisch getroffen,
 * wenn der Verlust des Ziels deutlich ueber dem Grundschaden der Stufe liegt (`critMult` in Bp, 15000 = x1,5). Gemessen wird nur ueber einen
 * Schlag, bei mehreren Treffern (`hits`) zaehlt die Summe. Darf in Randfaellen falsch liegen (Schwaeche, Buffs), es ist nur ein Zeichen.
 */
export function guessCrit(lost: number, baseCenti: number, critBp: number, critMultBp: number): boolean {
  if (critBp <= 0 || baseCenti <= 0 || critMultBp <= 10000) return false;
  const mult = critMultBp / 10000;
  return lost >= baseCenti * (1 + (mult - 1) * 0.55);
}

// ---- Deckel ---------------------------------------------------------------------------------------------------------

/**
 * Wie dicht gezeichnet wird: 1 bei wenig Last, bis 0.25 bei voller Pool-Auslastung. Splitterzahlen werden mit diesem Faktor multipliziert,
 * damit 30 Units mit Dauerfeuer die Pools nicht ueberlaufen lassen und die Bildrate gehalten wird.
 */
export function detailFactor(liveEffects: number, maxEffects: number, liveParticles: number, maxParticles: number): number {
  const load = Math.max(liveEffects / Math.max(1, maxEffects), liveParticles / Math.max(1, maxParticles));
  if (load <= 0.35) return 1;
  return Math.max(0.25, 1 - (load - 0.35) * 1.15);
}

/** Anzahl Pips (Stufen), die gezeichnet werden: hoechstens `cap`. */
export const pipCount = (level: number, cap = 8): number => Math.max(0, Math.min(cap, level));

/** Winkel auf [-PI, PI] bringen. */
export const wrapAngle = (a: number): number => {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
};

/** Winkel `from` Richtung `to` um hoechstens `step` drehen (kuerzester Weg). */
export const turnToward = (from: number, to: number, step: number): number => {
  const d = wrapAngle(to - from);
  return Math.abs(d) <= step ? to : wrapAngle(from + Math.sign(d) * step);
};

/** Wippen einer stehenden Unit: Hoehenversatz in Kacheln, Phase aus der ID, damit nicht alle im Gleichschritt gehen. */
export const idleBob = (nowMs: number, id: number, depth = 0.025): number => Math.sin(nowMs / 1000 * 2.4 + id * 1.7) * depth;

/** Aufsetz-Animation (0..1 Fortschritt): Skalierung und Hoehe, kurzer Hopser mit Quetschen am Ende. */
export function dropIn(p: number): { scale: number; lift: number; squash: number } {
  const x = Math.min(1, Math.max(0, p));
  if (x < 0.55) {
    const f = x / 0.55;
    return { scale: 1.5 - 0.5 * f * f, lift: (1 - f * f) * 0.55, squash: 1 };
  }
  const f = (x - 0.55) / 0.45;
  return { scale: 1, lift: 0, squash: 1 - Math.sin(f * Math.PI) * 0.16 };
}
