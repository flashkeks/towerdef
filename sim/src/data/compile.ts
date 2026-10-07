/**
 * Leitet aus den validierten Rohdaten die zur Laufzeit benötigten, abgeleiteten Tabellen ab
 * (Level-Stats je Unit, HP-/Bounty-Kurven, Pfad, Slots). Rein deterministisch, nur Ganzzahlen
 * (BigInt nur bei der einmaligen Vorberechnung der Potenzkurven).
 */
import { buildPath, type Path } from '../path.js';
import { buildMap, type MapDef } from '../placement.js';
import { TILE } from '../fixed.js';
import type {
  AttackData,
  BossKit,
  DifficultyDef,
  DifficultyId,
  DotData,
  EffectDef,
  EnemyArchetype,
  GameData,
  RiskCard,
  SpecialData,
  StageData,
  UnitData,
} from './schema.js';

/** Ein Effekt in Festkomma (Ticks, Basispunkte, Milli-Tiles), abgeleitet aus dem Effekt-Katalog plus den Überschreibungen des Angriffs. */
export type FxSpec =
  | { kind: 'slow'; name: string; ticks: number; bp: number; immune: number }
  | { kind: 'stun' | 'freeze' | 'timestop'; name: string; ticks: number; immune: number }
  | { kind: 'unconscious'; name: string; ticks: number }
  | { kind: 'walkback'; name: string; ticks: number; chanceBp: number; immune: number }
  | { kind: 'knockback'; name: string; distMilli: number; immune: number }
  /** `ticks` -1 = dauerhaft. */
  | { kind: 'curse'; name: string; dtype: 'magic' | 'physical'; bp: number; ticks: number }
  | { kind: 'bleedAmp'; name: string; ticks: number; factorBp: number }
  | { kind: 'overCrit'; name: string }
  | { kind: 'battlelust'; name: string; stepBp: number; maxBp: number }
  | { kind: 'snatched'; name: string; stepBp: number; maxBp: number; maxBpMaxLevel: number; ticks: number }
  | { kind: 'sunshine'; name: string; maxWaves: number; dmgBp: number; rangeBp: number }
  | { kind: 'motivate'; name: string; dmgBp: number; rangeBp: number; ticks: number }
  | { kind: 'shatter'; name: string }
  | { kind: 'wither'; name: string; ticks: number }
  | { kind: 'dot'; name: string; dot: CompiledDot }
  | { kind: 'wildcard'; name: string; pool: FxSpec[] };

export interface CompiledDot {
  kind: 'burn' | 'bleed' | 'poison' | 'wither';
  /** Gesamtschaden in Bp des Treffer-Schadens (multiplierPerTick x ticks). */
  totalBp: number;
  /** Dauer in Spiel-Ticks (AA-Ticks x `economy.dot.intervalTicks`). */
  ticks: number;
}

export type AttackKind = 'single' | 'circle' | 'cone' | 'line' | 'full';

export interface CompiledAttack {
  id: string;
  kind: AttackKind;
  /** circle: Radius um das Ziel (Milli-Tiles). */
  radiusMilli: number;
  /** line: Breite (Milli-Tiles). */
  widthMilli: number;
  /** cone: Gesamtwinkel in Grad und cos^2(Halbwinkel) in Bp. */
  coneDeg: number;
  cos2Bp: number;
  hits: number;
  dot: CompiledDot | null;
  fx: FxSpec[];
}

export interface LevelStat {
  /** Basis-Schaden je Angriff in Centi-HP (vor Level/Trait/Buff/Schwäche/Resistenz); wird auf `attack.hits` geteilt. 0 = diese Stufe greift nicht an. */
  damageCenti: number;
  spaTicks: number;
  rangeMilli: number;
  /** Angriff dieser Stufe (null = greift nicht an). */
  attack: CompiledAttack | null;
  /** Farm-Ertrag je Wave in Münzen. */
  farm: number;
}

export type DamageType = 'physical' | 'magic' | 'true';

export interface UnitDef {
  id: string;
  name: string;
  rarity: UnitData['rarity'];
  placement: UnitData['placement'];
  /** Aus den Daten abgeleitet: economy | control | aoe | single (nur Anzeige und Bot-Hinweise, nie Regel). */
  role: string;
  footprint: 1 | 2;
  placeCost: number;
  /** Unit-eigener Zuwachs der Platzierkosten (Bp je Exemplar), sonst gilt `economy.placeCostGrowthBp`. */
  placeGrowthBp?: number;
  /** Kosten je Upgrade (Stufe k -> k+1 kostet upgradeCosts[k]). */
  upgradeCosts: number[];
  maxLevel: number;
  /** Kollisionsradius in Milli-Tiles (aus `footprint`, `economy.placement.unitRadiusMilli`). */
  radiusMilli: number;
  sellBp: number;
  unsellable: boolean;
  /** Der erste Angriff der Unit (Stufe mit Angriff), für Anzeige und Effekte; je Stufe zählt `levels[k].attack`. */
  attack: CompiledAttack | null;
  defaultTargeting: 'first' | 'last' | 'close' | 'strongest';
  damageType: DamageType;
  elements: string[];
  /** Crit-Chance in Bp (0 = kein Crit) und Multiplikator in Bp. */
  critBp: number;
  critMultBp: number;
  /** Gelesen, nicht durchgesetzt. */
  spawnCap: number | null;
  /** Hat irgendeine Stufe Farm-Ertrag? (Farm-Units) */
  farm?: { yieldByLevel: number[] };
  canHitAir: boolean;
  levels: LevelStat[];
}

/** Altbestand (Runden 1-5): Position eines festen Slots. Keine Platzierregel mehr (siehe `placement.ts`). */
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

export interface Affinity {
  weakBp: Record<string, number>;
  resist: Record<string, number>;
}

export interface Ctx {
  data: GameData;
  stage: StageData;
  difficultyId: DifficultyId;
  difficulty: DifficultyDef;
  players: number;
  path: Path;
  /** Zonenmaske, Kartenrand und Pfadbreite für die freie Platzierung. */
  map: MapDef;
  /** Altbestand: Positionen der früheren Slots (Milli-Tiles). */
  slots: SlotDef[];
  units: Record<string, UnitDef>;
  unitList: UnitDef[];
  enemies: Record<string, EnemyArchetype>;
  /** Wave-Element (Index) -> AA-Element (`enemies.waveElements`); 0 = keins. */
  waveElement(index: number): string | null;
  /** Schwächen (Bp) und Resistenzen (R) eines Gegnertyps mit Element (Archetyp + Element-Affinität), je Typ/Element gecacht. */
  affinity(type: string, element: number): Affinity;
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
  /** Stage-Faktor auf die Gegner-HP in Basispunkten (`stage.hpBp`, Welten/Acts; Standard 10000). Wirkt auch auf die Bounty-Basis. */
  stageHpBp: number;
  /** Kill-Bounty in Münzen für einen Gegner mit Bounty-Basis-HP (Centi) in Wave n. */
  bounty(n: number, hpBasisCenti: number): number;
}

const ticksOf = (sec: number): number => Math.round(sec * 20);
const bpOf = (x: number): number => Math.round(x * 10000);

/** Katalog-Eintrag + Überschreibungen des Angriffs -> Festkomma-Effekt. `null`: Name unbekannt (No-op, wird gemeldet). */
export function compileFx(name: string, catalog: Record<string, EffectDef>, over: Pick<SpecialData, 'duration' | 'influence' | 'chance'>, d: GameData, depth = 0): FxSpec | null {
  const e = catalog[name];
  if (!e) return null;
  const sec = (x: number): number => ticksOf(over.duration ?? x);
  switch (e.kind) {
    case 'slow':
      return { kind: 'slow', name, ticks: sec(e.durationSec), bp: bpOf(over.influence ?? e.influence), immune: ticksOf(e.immuneSec) };
    case 'stun':
    case 'freeze':
    case 'timestop':
      return { kind: e.kind, name, ticks: sec(e.durationSec), immune: ticksOf(e.immuneSec) };
    case 'unconscious':
      return { kind: 'unconscious', name, ticks: sec(e.durationSec) };
    case 'walkback':
      return { kind: 'walkback', name, ticks: sec(e.durationSec), chanceBp: bpOf(over.chance ?? e.chance), immune: ticksOf(e.immuneSec) };
    case 'knockback':
      return { kind: 'knockback', name, distMilli: Math.round(e.distanceTiles * 1000), immune: ticksOf(e.immuneSec) };
    case 'curse':
      return { kind: 'curse', name, dtype: e.damageType, bp: Math.round(e.percent * 100), ticks: e.durationSec > 0 ? sec(e.durationSec) : -1 };
    case 'bleedAmp':
      return { kind: 'bleedAmp', name, ticks: sec(e.durationSec), factorBp: bpOf(e.factor) };
    case 'overCrit':
      return { kind: 'overCrit', name };
    case 'battlelust':
      return { kind: 'battlelust', name, stepBp: Math.round(e.stepPercent * 100), maxBp: Math.round(e.maxPercent * 100) };
    case 'snatched':
      return { kind: 'snatched', name, stepBp: Math.round(e.stepPercent * 100), maxBp: Math.round(e.maxPercent * 100), maxBpMaxLevel: Math.round(e.maxPercentAtMaxLevel * 100), ticks: sec(e.durationSec) };
    case 'sunshine':
      return { kind: 'sunshine', name, maxWaves: e.maxWaves, dmgBp: bpOf(e.damageFactor - 1), rangeBp: bpOf(e.rangeFactor - 1) };
    case 'motivate':
      return { kind: 'motivate', name, dmgBp: Math.round(e.damagePercent * 100), rangeBp: Math.round(e.rangePercent * 100), ticks: sec(e.durationSec) };
    case 'shatter':
      return { kind: 'shatter', name };
    case 'wither':
      return { kind: 'wither', name, ticks: sec(e.durationSec) };
    case 'dot':
      return { kind: 'dot', name, dot: compileDot({ type: e.type, multiplierPerTick: e.multiplierPerTick, ticks: e.ticks }, d) };
    case 'wildcard': {
      if (depth > 0) return null;
      const pool: FxSpec[] = [];
      for (const n of e.pool) {
        const f = compileFx(n, catalog, {}, d, depth + 1);
        if (f) pool.push(f);
      }
      return pool.length > 0 ? { kind: 'wildcard', name, pool } : null;
    }
  }
}

function compileDot(x: Pick<DotData, 'type' | 'multiplierPerTick' | 'ticks'> & { totalMultiplier?: number | null }, d: GameData): CompiledDot {
  const total = x.totalMultiplier ?? x.multiplierPerTick * x.ticks;
  return { kind: x.type.toLowerCase() as CompiledDot['kind'], totalBp: Math.round(total * 10000), ticks: x.ticks * d.economy.dot.intervalTicks };
}

/** Katalog-Eintrag eines Angriffs -> Festkomma. Fehlende Formparameter bekommen Standardwerte (kein Absturz bei unvollständigen Importen). */
export function compileAttack(id: string, a: AttackData | null | undefined, d: GameData, unknown: Set<string>): CompiledAttack {
  const spt = d.economy.scale.studsPerTile;
  const kind: AttackKind = a?.aoe ?? 'single';
  const coneDeg = a?.angle ?? 60;
  const fx: FxSpec[] = [];
  const sp = a?.special;
  for (const x of sp === undefined || sp === null ? [] : Array.isArray(sp) ? sp : [sp]) {
    const f = compileFx(x.name, d.effects.effects, x, d);
    if (f) fx.push(f);
    else unknown.add(x.name);
  }
  return {
    id,
    kind,
    radiusMilli: Math.round(((a?.radius ?? 8) * 1000) / spt),
    widthMilli: Math.round(((a?.width ?? 4) * 1000) / spt),
    coneDeg,
    // cos^2(Halbwinkel) = (1 + cos(Winkel)) / 2, auf Basispunkte gerundet (einmalig beim Laden).
    cos2Bp: Math.round((10000 * (1 + Math.cos((coneDeg * Math.PI) / 180))) / 2),
    hits: a?.hits ?? 1,
    dot: a?.dot ? compileDot(a.dot, d) : null,
    fx,
  };
}

const CC_KINDS = new Set(['slow', 'stun', 'freeze', 'timestop', 'unconscious', 'walkback', 'knockback']);

function build(u: UnitData, d: GameData, unknown: Set<string>): UnitDef {
  const eco = d.economy;
  const yen = (v: number): number => Math.max(1, Math.round(v / eco.scale.yenPerCoin));
  const attackCache = new Map<string, CompiledAttack>();
  const attackFor = (id: string | null): CompiledAttack => {
    const key = id ?? '';
    let c = attackCache.get(key);
    if (!c) {
      c = compileAttack(key, id ? d.units.attacks[id] : undefined, d, unknown);
      attackCache.set(key, c);
    }
    return c;
  };
  const levels: LevelStat[] = [];
  let damage = 0;
  let spa = 1;
  let range = 0;
  let attackId: string | null = null;
  let cost = 0;
  const costs: number[] = [];
  u.levels.forEach((l, k) => {
    damage = l.damage ?? damage;
    spa = l.spa ?? spa;
    range = l.range ?? range;
    attackId = l.attack ?? attackId;
    cost = l.cost ?? cost;
    costs.push(yen(cost));
    const attacks = damage > 0 && spa > 0 && range > 0;
    levels.push({
      damageCenti: attacks ? Math.max(1, Math.round(damage * 100)) : 0,
      spaTicks: Math.max(1, ticksOf(spa)),
      rangeMilli: Math.round((range * 1000) / eco.scale.studsPerTile),
      attack: attacks ? attackFor(attackId) : null,
      farm: l.farm ? yen(l.farm) : 0,
    });
    void k;
  });
  const first = levels.find((l) => l.attack)?.attack ?? null;
  const last = [...levels].reverse().find((l) => l.attack)?.attack ?? null;
  const hasFarm = levels.some((l) => l.farm > 0);
  const allFx = levels.flatMap((l) => l.attack?.fx ?? []);
  const role = hasFarm ? 'economy' : allFx.some((f) => CC_KINDS.has(f.kind)) ? 'control' : last && last.kind !== 'single' ? 'aoe' : 'single';
  return {
    id: u.id,
    name: u.name,
    rarity: u.rarity,
    placement: u.placement,
    role,
    footprint: u.footprint,
    placeCost: costs[0],
    placeGrowthBp: u.placeGrowthBp ?? undefined,
    upgradeCosts: costs.slice(1),
    maxLevel: levels.length - 1,
    radiusMilli: eco.placement.unitRadiusMilli[String(u.footprint) as '1' | '2'],
    sellBp: u.unsellable ? 0 : hasFarm ? eco.sell.farmBp : eco.sell.combatBp,
    unsellable: u.unsellable === true,
    attack: first,
    defaultTargeting: 'first',
    damageType: u.damageType,
    elements: u.elements,
    critBp: u.critChance ? bpOf(u.critChance) : 0,
    critMultBp: u.critDamage ? bpOf(u.critDamage) : eco.damage.critDefaultMultBp,
    spawnCap: u.spawnCap ?? null,
    farm: hasFarm ? { yieldByLevel: levels.map((l) => l.farm) } : undefined,
    canHitAir: u.hitsAir ?? u.placement !== 'ground',
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

/**
 * Boss-Kits der Stage nach Wave. Ohne `stage.bossKits` gilt der Altbestand (jedes Kit an seiner eigenen `wave`, solange sie in der Stage liegt);
 * mit `stage.bossKits` (Welten, Runde 8 / P3) wählt die Stage Kits per ID und legt sie auf die gewünschte Wave (das Kit wird dafür kopiert).
 */
function stageBossKits(data: GameData, stage: StageData, fixedWaves: number): Record<number, BossKit> {
  const kits = data.bosses?.kits ?? [];
  if (!stage.bossKits) return Object.fromEntries(kits.filter((k) => k.wave !== undefined && k.wave <= fixedWaves).map((k) => [k.wave, k]));
  const out: Record<number, BossKit> = {};
  for (const [w, id] of Object.entries(stage.bossKits)) {
    const kit = kits.find((k) => k.id === id);
    if (!kit) throw new Error(`Stage ${stage.id}: Boss-Kit ${id} unbekannt`);
    if (Number(w) <= fixedWaves) out[Number(w)] = { ...kit, wave: Number(w) };
  }
  return out;
}

export function compile(data: GameData, stage: StageData, difficultyId: DifficultyId, players: number, opts: CompileOpts = {}): Ctx {
  const infinite = stage.infinite === true;
  const fixedWaves = stage.waves.length;
  if (!Number.isInteger(players) || players < 1 || players > data.economy.coop.maxPlayers) {
    throw new Error(`Spielerzahl ${players} ungültig`);
  }
  const unknownFx = new Set<string>();
  const unitList = data.units.units.map((u) => build(u, data, unknownFx));
  const units: Record<string, UnitDef> = {};
  // P6b: Koop-Upgrade-Kosten (Tabelle je Spielerzahl, nur Kampf-Units); 1 Spieler = unverändert.
  const upBp = coopTable(data.economy.coop.upgradeCostTableBp, players) ?? 10000;
  if (upBp !== 10000) for (const u of unitList) if (!u.farm) u.upgradeCosts = u.upgradeCosts.map((c) => Math.round((c * upBp) / 10000));
  for (const u of unitList) units[u.id] = u;
  const enemies: Record<string, EnemyArchetype> = {};
  for (const a of data.enemies.archetypes) enemies[a.id] = a;
  const affCache = new Map<string, Affinity>();
  const waveElement = (i: number): string | null => (i >= 1 && i <= 5 ? data.enemies.waveElements[i - 1] : null);
  const affinity = (type: string, element: number): Affinity => {
    const key = `${type}:${element}`;
    let a = affCache.get(key);
    if (!a) {
      const base = enemies[type];
      const el = waveElement(element);
      const extra = el ? data.enemies.elementAffinity[el] : undefined;
      a = { weakBp: { ...base.weakBp }, resist: { ...base.resist } };
      for (const [k, v] of Object.entries(extra?.weakBp ?? {})) a.weakBp[k] = (a.weakBp[k] ?? 0) + v;
      for (const [k, v] of Object.entries(extra?.resist ?? {})) a.resist[k] = (a.resist[k] ?? 0) + v;
      affCache.set(key, a);
    }
    return a;
  };
  void unknownFx;

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
    map: buildMap(stage, data.economy.placement.pathMarginMilli),
    slots: stage.slots.map((s) => ({ id: s.id, x: Math.round(s.x * TILE), y: Math.round(s.y * TILE), kind: s.kind, size: s.size })),
    units,
    unitList,
    enemies,
    waveElement,
    affinity,
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
    bossKits: stageBossKits(data, stage, fixedWaves),
    cards: Object.fromEntries((data.cards?.cards ?? []).map((c) => [c.id, c])),
    cardList: data.cards?.cards ?? [],
    // P3 x P4: das Boss-Fähigkeiten-Set der Stufe (difficulties.json bossAbilityTier) entscheidet über minDifficulty der Boss-Kits.
    difficultyRank: data.difficulties[difficultyId].bossAbilityTier ?? DIFFICULTY_RANK[difficultyId],
    coopHpBp,
    coopBossHpBp: coopTable(data.difficulties[difficultyId].coopBossHpTableBp ?? data.economy.coop.bossHpTableBp, players) ?? coopHpBp,
    hpGrunt,
    stageHpBp: stage.hpBp ?? 10000,
    bounty,
  };
}

/** Effektnamen, die in Angriffen vorkommen, aber nicht im Katalog stehen (No-op in der Sim). Zum Prüfen von Importen. */
export function unknownEffects(data: GameData): string[] {
  const unknown = new Set<string>();
  for (const u of data.units.units) build(u, data, unknown);
  return [...unknown].sort();
}
