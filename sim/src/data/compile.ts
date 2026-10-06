/**
 * Leitet aus den validierten Rohdaten die zur Laufzeit benötigten, abgeleiteten Tabellen ab
 * (Level-Stats je Unit, HP-/Bounty-Kurven, Pfad, Slots). Rein deterministisch, nur Ganzzahlen
 * (BigInt nur bei der einmaligen Vorberechnung der Potenzkurven).
 */
import { buildPath, type Path } from '../path.js';
import { TILE } from '../fixed.js';
import type {
  BossKit,
  DifficultyDef,
  DifficultyId,
  EnemyArchetype,
  GameData,
  OnHitEffect,
  RiskCard,
  StageData,
  UnitData,
} from './schema.js';

export interface LevelStat {
  /** Basis-Schaden je Treffer in Centi-HP (vor Level/Trait/Buff/Element/Rüstung). */
  damageCenti: number;
  spaTicks: number;
  rangeMilli: number;
}

export interface UnitDef {
  id: string;
  name: string;
  rarity: UnitData['rarity'];
  placement: UnitData['placement'];
  role: string;
  footprint: 1 | 2;
  placeCost: number;
  /** Kosten je Upgrade (Stufe k -> k+1 kostet upgradeCosts[k]). */
  upgradeCosts: number[];
  maxLevel: number;
  cap: number;
  sellBp: number;
  attack: UnitData['attack'];
  defaultTargeting: UnitData['defaultTargeting'];
  element: number;
  penetration: number;
  crit?: UnitData['crit'];
  onHit: OnHitEffect[];
  aura?: UnitData['aura'];
  farm?: UnitData['farm'];
  ability?: UnitData['ability'];
  canHitAir: boolean;
  /** Schadensanteil gegen Flieger in Bp (nur gesetzt, wenn die Unit Luft abweichend vom vollen Schaden trifft). */
  airDamageBp?: number;
  levels: LevelStat[];
}

export interface SlotDef {
  id: number;
  x: number;
  y: number;
  kind: 'ground' | 'hill';
  size: 1 | 2;
}

export interface ParsedModifier {
  kind: 'shield' | 'regen' | 'armored' | 'fast';
  n: number;
}

export interface Ctx {
  data: GameData;
  stage: StageData;
  difficultyId: DifficultyId;
  difficulty: DifficultyDef;
  players: number;
  path: Path;
  slots: SlotDef[];
  units: Record<string, UnitDef>;
  unitList: UnitDef[];
  enemies: Record<string, EnemyArchetype>;
  /** Anzahl fester Waves; im Infinite-Modus Infinity (kein Sieg). */
  totalWaves: number;
  /** Infinite-Modus (Waves > stage.waves.length werden erzeugt). */
  infinite: boolean;
  /** Anzahl fest definierter Waves der Stage. */
  fixedWaves: number;
  /** Infinite: Abbruch nach dieser Wave (Infinity = nie). */
  maxWaves: number;
  /** Infinite-Seed für die Wave-Erzeugung (unabhängig vom Sim-PRNG). */
  waveSeed: number;
  /** Max. gleichzeitig lebende Gegner (Spawns warten am Limit). */
  enemyCap: number;
  /** Infinite-Speed-Faktor v_Infinite(n) in Basispunkten (10000 für n <= 20). */
  speedInfBp(n: number): number;
  waveTimerTicks: number;
  /** Koop-HP-Faktor h(Spielerzahl) in Basispunkten. */
  coopHpBp: number;
  /** Koop-HP-Faktor des Archetyps boss (P5: getrennt skalierbar, Standard = coopHpBp). */
  coopBossHpBp: number;
  /** Archetypen, deren Leak sofort verliert (economy.lives.instantLoss). */
  instantLoss: ReadonlySet<string>;
  /** Leben-Regeneration am Wave-Ende. */
  regenLives: number;
  /** Boss-Kits nach Wave-Nummer (P4); nur Waves der festen Stage, Infinite-Bosse ab Wave 21 haben keins. */
  bossKits: Record<number, BossKit>;
  /** Risikokarten (P4) nach ID und in Datei-Reihenfolge. */
  cards: Record<string, RiskCard>;
  cardList: RiskCard[];
  /** Rang der Stufe (normal 0, hard 1, nightmare 2) für `minDifficulty` der Boss-Kits. */
  difficultyRank: number;
  /** HP des Grunt (Normal, ohne Faktoren) in Centi-HP für Wave n. */
  hpGrunt(n: number): number;
  /** Kill-Bounty in Münzen für einen Gegner mit Bounty-Basis-HP (Centi) in Wave n. */
  bounty(n: number, hpBasisCenti: number): number;
}

function build(u: UnitData, d: GameData): UnitDef {
  const r = d.units.rarities[u.rarity];
  const upgradeCosts = u.upgradeCosts ?? r.upgradeCosts;
  const n = upgradeCosts.length;
  const levels: LevelStat[] = [];
  for (let k = 0; k <= n; k++) {
    // DESIGN-OFFEN: Level-Stats linear interpoliert (DPS, SPA, Range), jeweils abgerundet; Schaden/Treffer = floor(floor(DPS*Anteil) * SPA / 20).
    const dps = r.dpsCenti[0] + Math.floor(((r.dpsCenti[1] - r.dpsCenti[0]) * k) / n);
    const spa = r.spaTicks[0] - Math.floor(((r.spaTicks[0] - r.spaTicks[1]) * k) / n);
    const range = r.rangeMilli[0] + Math.floor(((r.rangeMilli[1] - r.rangeMilli[0]) * k) / n);
    const dpsShare = Math.floor((dps * u.dpsShareBp) / 10000);
    levels.push({ damageCenti: Math.floor((dpsShare * spa) / 20), spaTicks: spa, rangeMilli: range });
  }
  return {
    id: u.id,
    name: u.name,
    rarity: u.rarity,
    placement: u.placement,
    role: u.role,
    footprint: u.footprint,
    placeCost: u.placeCost ?? r.placeCost,
    upgradeCosts,
    maxLevel: n,
    cap: u.cap ?? r.cap,
    sellBp: u.sellBp ?? d.economy.sell.combatBp,
    attack: u.attack,
    defaultTargeting: u.defaultTargeting,
    element: u.element,
    penetration: u.penetration,
    crit: u.crit,
    onHit: u.onHit,
    aura: u.aura,
    farm: u.farm,
    ability: u.ability,
    canHitAir: u.placement !== 'ground' || u.airDamageBp !== undefined,
    airDamageBp: u.airDamageBp,
    levels,
  };
}

/** Parst "shield:3" / "regen" / "armored" / "fast". */
export function parseModifier(m: string): ParsedModifier {
  if (m.startsWith('shield:')) return { kind: 'shield', n: Number(m.slice(7)) };
  if (m === 'regen' || m === 'armored' || m === 'fast') return { kind: m, n: 1 };
  throw new Error(`Unbekannter Modifier ${m}`);
}

/** Infinite: höchstens 60 Gegner gleichzeitig (recommendations §3, Performance). */
export const INFINITE_ENEMY_CAP = 60;

/** P5: Tabellenwert für die Spielerzahl (letzter Eintrag gilt für größere Zahlen), null ohne Tabelle. */
function coopTable(t: readonly number[] | undefined, players: number): number | null {
  return t ? t[Math.min(players, t.length) - 1] : null;
}

/** Koop-HP-Faktor (Basispunkte) für einen Gegner-Archetyp: Boss getrennt, alle anderen gemeinsam. */
export function coopHpFor(ctx: { coopHpBp: number; coopBossHpBp: number }, type: string): number {
  return type === 'boss' ? ctx.coopBossHpBp : ctx.coopHpBp;
}

export const DIFFICULTY_RANK: Record<DifficultyId, number> = { normal: 0, hard: 1, nightmare: 2 };

export interface CompileOpts {
  seed?: number;
  maxWaves?: number;
}

export function compile(data: GameData, stage: StageData, difficultyId: DifficultyId, players: number, opts: CompileOpts = {}): Ctx {
  const infinite = stage.infinite === true;
  const fixedWaves = stage.waves.length;
  if (!Number.isInteger(players) || players < 1 || players > data.economy.coop.maxPlayers) {
    throw new Error(`Spielerzahl ${players} ungültig`);
  }
  const unitList = data.units.units.map((u) => build(u, data));
  const units: Record<string, UnitDef> = {};
  // P6b: Koop-Upgrade-Kosten (Tabelle je Spielerzahl, nur Kampf-Units); 1 Spieler = unverändert.
  const upBp = coopTable(data.economy.coop.upgradeCostTableBp, players) ?? 10000;
  if (upBp !== 10000) for (const u of unitList) if (!u.farm) u.upgradeCosts = u.upgradeCosts.map((c) => Math.round((c * upBp) / 10000));
  for (const u of unitList) units[u.id] = u;
  const enemies: Record<string, EnemyArchetype> = {};
  for (const a of data.enemies.archetypes) enemies[a.id] = a;

  const coopHpBp = coopTable(data.difficulties[difficultyId].coopHpTableBp ?? data.economy.coop.hpTableBp, players) ?? 10000 + data.economy.coop.hpPerExtraPlayerBp * (players - 1);
  const hpCache: number[] = [];
  const g = BigInt(data.enemies.hpCurve.growthBp);
  const hpGrunt = (n: number): number => {
    let v = hpCache[n];
    if (v === undefined) {
      if (infinite && n > fixedWaves) {
        // Infinite (§3): HP_grunt(n) = HP_grunt(Ende fester Waves) * (n/N)^2, floor.
        v = Math.floor((hpGrunt(fixedWaves) * n * n) / (fixedWaves * fixedWaves));
        hpCache[n] = v;
        return v;
      }
      const e = BigInt(n - 1);
      v = Number((BigInt(data.enemies.hpCurve.baseCenti) * g ** e) / 10000n ** e);
      hpCache[n] = v;
    }
    return v;
  };
  const gs = BigInt(data.economy.bounty.gammaStartBp);
  const gd = BigInt(data.economy.bounty.gammaDecayBp);
  const bounty = (n: number, hpBasisCenti: number): number => {
    if (infinite && n > fixedWaves) {
      // Infinite (§3): gamma(n) = gamma(N) * (N/n)^2; exakt in BigInt, kaufmännisch gerundet.
      const N = BigInt(fixedWaves);
      const nn = BigInt(n);
      const e0 = N - 1n;
      const num0 = gs * gd ** e0 * N * N * BigInt(hpBasisCenti);
      const den0 = 10000n * 10000n ** e0 * 100n * nn * nn;
      return Number((2n * num0 + den0) / (2n * den0));
    }
    const e = BigInt(n - 1);
    const num = gs * gd ** e * BigInt(hpBasisCenti);
    const den = 10000n * 10000n ** e * 100n;
    return Number((2n * num + den) / (2n * den));
  };

  return {
    data,
    stage,
    difficultyId,
    difficulty: data.difficulties[difficultyId],
    players,
    path: buildPath(stage.path.map(([x, y]) => [Math.round(x * TILE), Math.round(y * TILE)] as [number, number])),
    slots: stage.slots.map((s) => ({ id: s.id, x: Math.round(s.x * TILE), y: Math.round(s.y * TILE), kind: s.kind, size: s.size })),
    units,
    unitList,
    enemies,
    totalWaves: infinite ? Infinity : fixedWaves,
    infinite,
    fixedWaves,
    maxWaves: infinite && opts.maxWaves !== undefined ? opts.maxWaves : Infinity,
    waveSeed: opts.seed ?? 0,
    enemyCap: infinite ? (data.economy.infinite?.enemyCap ?? INFINITE_ENEMY_CAP) : data.economy.caps.enemies,
    // DESIGN-OFFEN: Infinite-Speed +1 %/Wave ab Wave N+1 bis x1,5 (wirkt zusätzlich zu Archetyp-/Schwierigkeitsfaktor).
    speedInfBp: (n: number) => {
      const inf = data.economy.infinite;
      return infinite && n > fixedWaves ? Math.min(inf?.speedMaxBp ?? 15000, 10000 + (inf?.speedPerWaveBp ?? 100) * (n - fixedWaves)) : 10000;
    },
    waveTimerTicks: stage.waveTimerTicks ?? data.economy.waveTimerTicks,
    instantLoss: new Set(data.difficulties[difficultyId].lives.instantLoss ?? data.economy.lives.instantLoss),
    regenLives: data.difficulties[difficultyId].lives.regenPerWave ?? data.economy.lives.regenPerWave,
    bossKits: Object.fromEntries((data.bosses?.kits ?? []).filter((k) => k.wave <= fixedWaves).map((k) => [k.wave, k])),
    cards: Object.fromEntries((data.cards?.cards ?? []).map((c) => [c.id, c])),
    cardList: data.cards?.cards ?? [],
    // P3 x P4: das Boss-Fähigkeiten-Set der Stufe (difficulties.json bossAbilityTier) entscheidet über minDifficulty der Boss-Kits.
    difficultyRank: data.difficulties[difficultyId].bossAbilityTier ?? DIFFICULTY_RANK[difficultyId],
    coopHpBp,
    coopBossHpBp: coopTable(data.difficulties[difficultyId].coopBossHpTableBp ?? data.economy.coop.bossHpTableBp, players) ?? coopHpBp,
    hpGrunt,
    bounty,
  };
}
