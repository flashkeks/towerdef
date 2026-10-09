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

export type AttackKind = 'projectile' | 'bomb' | 'chain' | 'potion' | 'none';

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
  // Lantern Market (Runde 13): `range` ist hier der Wirkradius der Auren
  /** Gold je Rundenende (vor Wissensbaum/Golden Exchange). */
  income: number;
  bankOn: number;
  bankRateBp: number;
  bankCap: number;
  grantCash: number;
  grantCd: number;
  /** Golden Exchange: andere Markets verdienen so viele Basispunkte mehr. */
  goldenBp: number;
  /** Auren auf Türme im Radius (stärkster Wert je Feld zählt, keine Stapelung). */
  aRangeBp: number;
  aCamo: number;
  aSpeedBp: number;
  aArmor: number;
  aPierce: number;
  aDmg: number;
  aDiscBp: number;
  // Longshot (Runde 13)
  /** Treffer wirft Splitter (`fragN` …) statt Bombe/Nova. */
  fragOnHit: number;
  ricochetN: number;
  ricochetRange: number;
  /** Betäubung des Bosses bei jedem Treffer (Ticks, Lanternbreaker). */
  hitStunBoss: number;
  /** Boss-Markierung: Dauer in Ticks, Zusatzschaden in Basispunkten aus allen Quellen. */
  markTicks: number;
  markBp: number;
  focusDur: number;
  focusCd: number;
  supplyCash: number;
  supplyCd: number;
  /** Elite Sniper: Tempo-Aura für alle Longshots in Basispunkten. */
  eliteBp: number;
  eliteStrong: number;
  // Thornweaver (Runde 14)
  /** Kettenblitz im Takt: Ziele, Schaden, Intervall (Ticks), Sprungweite (Milli-px). */
  zapN: number;
  zapDmg: number;
  zapInterval: number;
  zapRange: number;
  /** Wirbelwind: Takt in Ticks und Rückstoß in Milli-px (Wegfortschritt). */
  whirlEvery: number;
  whirlPx: number;
  /** Ranken-Fessel: Takt und Haltedauer in Ticks. */
  snareEvery: number;
  snareTicks: number;
  /** Wall of Trees: RBE, die die Wand schluckt, Abklingzeit, Lebensdauer (Ticks). */
  wallRbe: number;
  wallCd: number;
  wallTtl: number;
  /** Dornenranken-Zone: Radius als Faktor auf die Reichweite in Basispunkten (10000 = ×1), Schaden je Sekunde. */
  zoneBp: number;
  zoneDmg: number;
  /** Avatar: +1 Schaden je `avatarPer` Gegner auf der Karte, höchstens `avatarMax`. */
  avatarPer: number;
  avatarMax: number;
  /** Gold je Rundenende (World Tree) und Jungle's Bounty (Gold; `roundLives` = Leben). */
  roundGold: number;
  bountyGold: number;
  roundLives: number;
  /** Spring Blessing: Tempo-Aura in Basispunkten auf andere Türme im Radius. */
  groveSpeedBp: number;
  // Alchemist (Runde 14)
  bonusIron: number;
  /** Buff-Trank auf einen Turm: Takt, Schaden, Reichweite/Tempo (Basispunkte), Dauer in Ticks; `brewPerm` = dauerhaft im Radius. */
  brewEvery: number;
  brewDmg: number;
  brewRangeBp: number;
  brewSpeedBp: number;
  brewTicks: number;
  brewPerm: number;
  /** Unstable: getroffene Gegner explodieren beim Tod (Radius, Schaden). */
  unstR: number;
  unstDmg: number;
  /** Transforming Tonic: Dauer, Abklingzeit, Anzahl weiterer verwandelter Türme. */
  tonicDur: number;
  tonicCd: number;
  tonicOthers: number;
  /** Säurepfützen: Treffer je Pfütze (0 = keine). */
  poolN: number;
  /** Lead to Gold: Gold je geknacktem Ironshell. */
  leadGold: number;
  /** Rubber to Gold: Markierungsdauer in Ticks. */
  rubberTicks: number;
  /** Shrink Potion: Takt in Ticks. */
  shrinkEvery: number;
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
  income: 0, bankOn: 0, bankRateBp: 0, bankCap: 0, grantCash: 0, grantCd: 0, goldenBp: 0,
  aRangeBp: 0, aCamo: 0, aSpeedBp: 0, aArmor: 0, aPierce: 0, aDmg: 0, aDiscBp: 0,
  fragOnHit: 0, ricochetN: 0, ricochetRange: 0, hitStunBoss: 0, markTicks: 0, markBp: 0,
  focusDur: 0, focusCd: 0, supplyCash: 0, supplyCd: 0, eliteBp: 0, eliteStrong: 0,
  zapN: 0, zapDmg: 0, zapInterval: 0, zapRange: 0, whirlEvery: 0, whirlPx: 0, snareEvery: 0, snareTicks: 0,
  wallRbe: 0, wallCd: 0, wallTtl: 0, zoneBp: 0, zoneDmg: 0, avatarPer: 0, avatarMax: 0,
  roundGold: 0, bountyGold: 0, roundLives: 0, groveSpeedBp: 0,
  bonusIron: 0, brewEvery: 0, brewDmg: 0, brewRangeBp: 0, brewSpeedBp: 0, brewTicks: 0, brewPerm: 0,
  unstR: 0, unstDmg: 0, tonicDur: 0, tonicCd: 0, tonicOthers: 0, poolN: 0, leadGold: 0, rubberTicks: 0, shrinkEvery: 0,
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
