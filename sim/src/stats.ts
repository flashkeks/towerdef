/**
 * Modifikator-System: ein Turm ist `base` + eine feste Liste von Modifikatoren (add/mul/set/max auf flache Kennwerte).
 * Reihenfolge der Anwendung (deterministisch):
 *   1. der Nebenpfad (der mit der niedrigeren Stufe) in Stufenfolge, dann der Hauptpfad (höchste Stufe) in Stufenfolge,
 *      der dritte Pfad ist wegen Crosspath immer 0;
 *   2. innerhalb eines Pfads Stufe 1 .. n, innerhalb einer Stufe in Listenreihenfolge.
 * So überschreibt die Waffe des Hauptpfads (z. B. Ballista) den Nebenpfad nie, und `mul` auf Intervalle komponiert.
 * `mul` rechnet in Basispunkten (10000 = x1,0) und rundet nach jedem Faktor ab.
 */
import type { DamageType, ProjectileKind, Tiers } from './types.js';

export type AttackKind = 'projectile' | 'bomb' | 'chain' | 'none';

export interface Stats {
  atk: AttackKind;
  pk: ProjectileKind;
  dtype: DamageType;
  /** Schaden je Treffer. */
  dmg: number;
  pierce: number;
  /** Angriffsintervall in Milli-Ticks (1 Tick = 1000). */
  interval: number;
  /** Reichweite in Milli-px. */
  range: number;
  /** Projektiltempo in px/s. */
  speed: number;
  count: number;
  /** Fächerwinkel zwischen zwei Projektilen in Grad (gerade Zahl). */
  spread: number;
  slowBp: number;
  slowTicks: number;
  camo: number;
  bonusBrute: number;
  bonusBoss: number;
  // Frost Nova (Bolzen platzt beim ersten Treffer)
  novaR: number;
  novaMax: number;
  novaDmg: number;
  // Explosion beim letzten Treffer (Starfall)
  endR: number;
  endDmg: number;
  endMax: number;
  // Bombe
  radius: number;
  maxT: number;
  flight: number;
  stun: number;
  stunBoss: number;
  quakeEvery: number;
  quakeDmg: number;
  quakeStun: number;
  quakeStunBoss: number;
  // Splitter (Bombe: frag, Nova: shard)
  fragN: number;
  fragKind: ProjectileKind;
  fragDmg: number;
  fragPierce: number;
  fragSpeed: number;
  fragRange: number;
  fragDtype: DamageType;
  fragExplR: number;
  fragExplDmg: number;
  // Blitz
  chainN: number;
  chainRange: number;
  sparkN: number;
  sparkDmg: number;
  thunderInterval: number;
  thunderDmg: number;
  // Aura (Frost)
  auraSlowBp: number;
  auraBossSlowBp: number;
  auraDmg: number;
  auraInterval: number;
  auraMax: number;
  brittle: number;
  // Fähigkeiten
  rainDur: number;
  rainCd: number;
  azDur: number;
  azBoss: number;
  azCd: number;
  // Held
  flareDmg: number;
  flareR: number;
  flareMax: number;
  flareCd: number;
  dawnDmg: number;
  dawnBoss: number;
  dawnCd: number;
  burnDmg: number;
  burnTicks: number;
  buffRadius: number;
  buffSpeedBp: number;
  buffRangeBp: number;
}

export const STAT_DEFAULTS: Stats = {
  atk: 'projectile', pk: 'arrow', dtype: 'sharp', dmg: 1, pierce: 1, interval: 60000, range: 60000, speed: 600, count: 1, spread: 12,
  slowBp: 0, slowTicks: 0, camo: 0, bonusBrute: 0, bonusBoss: 0,
  novaR: 0, novaMax: 0, novaDmg: 0, endR: 0, endDmg: 0, endMax: 0,
  radius: 0, maxT: 0, flight: 0, stun: 0, stunBoss: 0, quakeEvery: 0, quakeDmg: 0, quakeStun: 0, quakeStunBoss: 0,
  fragN: 0, fragKind: 'frag', fragDmg: 0, fragPierce: 1, fragSpeed: 450, fragRange: 40000, fragDtype: 'sharp', fragExplR: 0, fragExplDmg: 0,
  chainN: 0, chainRange: 0, sparkN: 0, sparkDmg: 0, thunderInterval: 0, thunderDmg: 0,
  auraSlowBp: 0, auraBossSlowBp: 0, auraDmg: 0, auraInterval: 0, auraMax: 0, brittle: 0,
  rainDur: 0, rainCd: 0, azDur: 0, azBoss: 0, azCd: 0,
  flareDmg: 0, flareR: 0, flareMax: 0, flareCd: 0, dawnDmg: 0, dawnBoss: 0, dawnCd: 0, burnDmg: 0, burnTicks: 0,
  buffRadius: 0, buffSpeedBp: 0, buffRangeBp: 0,
};

export const STRING_STATS: ReadonlySet<string> = new Set(['atk', 'pk', 'dtype', 'fragKind', 'fragDtype']);

export type ModOp = 'add' | 'mul' | 'set' | 'max';
export interface Mod {
  op: ModOp;
  stat: keyof Stats;
  v: number | string;
}

export function applyMod(s: Stats, m: Mod): void {
  const rec = s as unknown as Record<string, number | string>;
  const cur = rec[m.stat];
  switch (m.op) {
    case 'set':
      rec[m.stat] = m.v;
      break;
    case 'add':
      rec[m.stat] = (cur as number) + (m.v as number);
      break;
    case 'max':
      rec[m.stat] = Math.max(cur as number, m.v as number);
      break;
    case 'mul':
      rec[m.stat] = Math.floor(((cur as number) * (m.v as number)) / 10000);
      break;
  }
}

/** Reihenfolge der Pfade: Nebenpfad zuerst, Hauptpfad zuletzt (siehe Kopfkommentar). */
export function pathOrder(tiers: Tiers): (0 | 1 | 2)[] {
  const idx: (0 | 1 | 2)[] = [0, 1, 2];
  idx.sort((a, b) => tiers[a] - tiers[b] || a - b);
  return idx.filter((i) => tiers[i] > 0);
}
