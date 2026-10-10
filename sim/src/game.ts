/**
 * Duskwardens-Kern (Runde 11): deterministisch, Ganzzahl-Zustand, 60 Ticks/s.
 * Tick-Reihenfolge: siehe sim/README.md und `tick()` unten.
 */
import { DATA, POWER_KEYS, baseStats, type RoundData } from './data.js';
import { dist2, isqrt } from './fixed.js';
import { hashState } from './hash.js';
import { branchAt, circleInPolygon, clearOfPaths, getMap, nearestOnPaths, pointInPolygon } from './map.js';
import { DEFLATION_CASH, MODES, firstRound, isModeId, modeAllows } from './modes.js';
import { towerXpPot, splitTowerXp } from './xp.js';
import { COVERAGE_STEP, positionAt } from './path.js';
import { nextInt, seedRng } from './prng.js';
import { roundBonus, LIST_ROUNDS, freeplayGroups, fpHpBp, fpSpeedBp, popBp } from './freeplay.js';
import { applyMod, pathOrder, type Mod, type Stats } from './stats.js';
import { cosBp, rotate, sinBp } from './trig.js';
import type {
  AbilityId, Command, CommandResult, DamageType, Difficulty, EnemyState, EnemyType, Game, GameInfo, GameOptions, GameState, ModeId,
  HeroType, MarketInfo, PlaceCheck, PuddleState, TowerAura, TowerBuff, PowerKey, ProjectileKind, ProjectileState, RoundPreview, SentryState, SimEvent, TargetMode, TowerState, TowerType, Tiers, TrapState, UnlockPathInfo, UpgradeInfo, WallState,
} from './types.js';

/** Letzte Runde der Karte `meadow` (Frostfen 25, Quarry 30: `Game.info.maxRound`). */
export const MAX_ROUND = 20;
/** Runde 15: Frost Wyrm (Frosthauch), Ember Colossus (Stampfer), Regrow. */
const BREATH_EVERY = 480;
const BREATH_RADIUS = 60_000;
const BREATH_FREEZE = 120;
const SPIT_N = 6;
const STOMP_RADIUS = 80_000;
const STOMP_TICKS = 180;
const STOMP_BP = 15000;
const REGROW_TICKS = 180;
/** Regrow-Leiter: eine Schicht je Schritt (nur Gegner mit genau einem Kind in dieser Reihe wachsen nach). */
const LADDER: readonly EnemyType[] = ['red', 'blue', 'green', 'gold', 'pink'];
const WINDUP = 6;
const ATTACK_ANIM = 18;
const MIN_SPAWN_PROGRESS = 8000;
const PROJ_RADIUS = 3500;
/** Runde 14: Säurepfütze (Radius, Takt, Lebensdauer) und Monster-Form (Treffer alle 12 Ticks à 6 = 30 Schaden/s). */
const PUDDLE_RADIUS = 12000;
const PUDDLE_PULSE = 30;
const PUDDLE_TTL = 1800;
const MONSTER_EVERY = 12;
const MONSTER_HIT = 6;
const CELL = 24000;
const TOWER_TYPES: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'longshot', 'market', 'thornweaver', 'alchemist', 'riverkeeper', 'bellringer', 'tinker'];
/** Runde 16: Helden (einer je Match). */
export const HERO_TYPES: readonly HeroType[] = ['wren', 'bram', 'sela'];
/** Runde 16: Tuerme ohne eigenen Angriff, die selbst keine Auren empfangen (Auren-Quellen). */
const AURA_ONLY: readonly TowerType[] = ['market', 'bellringer'];
/** Runde 16: Sentries stehen auf einem Kreis (Milli-px) um den Tinker; Schussgeschwindigkeit der Sentry-Nagel (px/s). */
const SENTRY_RING = 13000;
const SENTRY_SPEED = 650;
/** Runde 16: Abstand (Wegfortschritt, Milli-px), den zwei Fallen desselben Tinkers mindestens haben. */
const TRAP_GAP = 14000;
/** Die drei "Primary"-Türme (Wissensbaum-Ast Primary). */
const PRIMARY: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
const ABILITY_ORDER: AbilityId[] = ['arrowRain', 'absoluteZero', 'flare', 'dawnbreak', 'focus', 'supplyDrop', 'grant', 'wallOfTrees', 'tonic', 'alarm', 'overclock', 'anvilDrop', 'forgeOfDawn', 'starfall', 'eclipse'];
/** Reichweite ab hier = ganze Karte (Longshot): Zielwahl über alle Gegner, keine Reichweiten-Boni. */
export const GLOBAL_RANGE = 1_000_000;
const perTower = <T,>(v: () => T): Record<TowerType, T> => ({
  ranger: v(), bombardier: v(), frostcaller: v(), longshot: v(), market: v(), thornweaver: v(), alchemist: v(), riverkeeper: v(), bellringer: v(), tinker: v(),
});
const STRONG_RANK: Record<EnemyType, number> = { dreadnought: 9, cruiser: 8, duskrunner: 8, colossus: 8, wyrm: 8, gloomship: 8, leviathan: 8, crystal: 7, brute: 7, frostling: 6, ironshell: 6, ember: 6, pink: 4, gold: 4, green: 3, blue: 2, red: 1 };

const isHero = (t: TowerType | HeroType): t is HeroType => t === 'wren' || t === 'bram' || t === 'sela';

/** Preis x Faktor (Basispunkte), kaufmännisch auf 5 gerundet. */
export function round5(price: number, bp: number): number {
  return 5 * Math.floor((price * bp + 25000) / 50000);
}

interface EnemyRt {
  hp: number;
  /** Basistempo in Bruchteilen von Milli-px je Tick (1000 = 1 Milli-px). */
  sp: number;
  radius: number;
  children: EnemyType[];
  armor: boolean;
  immuneCold: boolean;
  boss: boolean;
  stages: number[];
  rbe: number;
  /** Runde 15 */
  blimp: boolean;
  immuneExplosive: boolean;
  immuneStun: boolean;
  /** Runde 15b: nie verlangsamt/eingefroren (Dusk Dreadnought). */
  immuneSlow: boolean;
  /** Runde 15b: immer getarnt (Duskrunner). */
  alwaysCamo: boolean;
  heavy: boolean;
  /** Pop-Gold der Huelle (Boss/Blimp), 0 = Pop-Cash der Schwierigkeit. */
  hullCash: number;
  /** Knoten im Gegnerbaum (Hülle + alle Kinder): so viele Pops, so viel Pop-Gold. */
  nodes: number;
}

export function createGame(opts: GameOptions): Game {
  const map = getMap(opts.map);
  const diff = DATA.difficulties[opts.difficulty as Difficulty];
  if (!diff) throw new Error(`Unbekannte Schwierigkeit: ${opts.difficulty}`);
  const kmods = opts.mods ?? {};
  const heroId: HeroType = opts.hero ?? 'wren';
  if (!HERO_TYPES.includes(heroId)) throw new Error(`Unbekannter Held: ${String(opts.hero)}`);
  const mode: ModeId = opts.mode ?? 'standard';
  if (!isModeId(mode)) throw new Error(`Unbekannter Modus: ${String(opts.mode)}`);
  const halfCash = mode === 'half-cash';
  const deflation = mode === 'deflation';
  // Runde 15b (Max, 10.10.2026: "eine Rundenliste fuer alle Karten ... bis Runde 60 oder 80 und danach Free Play"):
  // gemeinsame Liste (`DATA.rounds`, 120 feste Runden), Sieg nach der Endrunde der Schwierigkeit (40/60/80),
  // danach optional Weiterspielen (`continue`) auf derselben Liste, ab R121 Formel (`freeplay.ts`).
  const maxRound = diff.endRound;
  const baseRound = firstRound(mode, maxRound) - 1;
  const nBranches = map.paths.length;
  const info: GameInfo = { map: opts.map, mode, difficulty: opts.difficulty, maxRound, baseRound, branches: nBranches, listRounds: LIST_ROUNDS, hero: heroId };
  const fpSeed = Math.floor(opts.seed ?? 0);
  /** Gruppen der Runde `r` (Liste bis R120, danach Formel). */
  const roundGroups = (r: number): RoundData['groups'] => (r <= LIST_ROUNDS ? DATA.rounds[r - 1].groups : freeplayGroups(r, fpSeed));
  /** Weg des Astes (Gegner, Fallen). */
  const pathOf = (branch: number) => map.paths[branch] ?? map.path;

  // ---- Gegnertabelle dieser Partie ----
  const etab = {} as Record<EnemyType, EnemyRt>;
  for (const [k, d] of Object.entries(DATA.enemies) as [EnemyType, (typeof DATA.enemies)[EnemyType]][]) {
    const hp = d.bossHp ? d.bossHp[opts.difficulty as Difficulty] : d.boss ? diff.bossHp : d.hp;
    etab[k] = {
      hp,
      sp: Math.floor((52_000_000 * d.tempo * diff.speedBp) / (60 * 100 * 10000)),
      radius: d.radius * 1000,
      children: d.children,
      armor: !!d.armor,
      immuneCold: !!d.immuneCold,
      boss: !!d.boss,
      stages: d.stages ?? [],
      rbe: 0,
      blimp: !!d.blimp || !!d.boss,
      immuneExplosive: !!d.immuneExplosive,
      immuneStun: !!d.immuneStun,
      immuneSlow: !!d.immuneSlow,
      alwaysCamo: !!d.alwaysCamo,
      heavy: !!d.heavy,
      hullCash: d.hullCash ?? (d.boss ? 100 : 0),
      nodes: 0,
    };
  }
  for (const k of Object.keys(etab) as EnemyType[]) {
    const calc = (e: EnemyType): number => etab[e].hp + etab[e].children.reduce((a, c) => a + calc(c), 0);
    etab[k].rbe = calc(k);
    const cnt = (e: EnemyType): number => 1 + etab[e].children.reduce((a, c) => a + cnt(c), 0);
    etab[k].nodes = cnt(k);
  }
  /** Huelle eines Typs (Fortified: doppelt bei schweren Typen). */
  const hpOf = (type: EnemyType, fort: boolean, round = 0): number => {
    const base = etab[type].hp * (fort && etab[type].heavy ? 2 : 1);
    // Runde 15b: ab R121 (Formel) wachsen Huelle ab 10 HP (Brute, Crystal, Blimps, Bosse); die 1-HP-Typen bleiben bei 1
    return round > LIST_ROUNDS && base >= 10 ? Math.max(1, Math.round((base * fpHpBp(round)) / 10000)) : base;
  };
  /** RBE des ganzen Baums (Huelle + Kinder), mit Fortified und Freeplay-Skalierung der Runde. */
  const treeRbe = (type: EnemyType, fort: boolean, round = 0): number => hpOf(type, fort, round) + etab[type].children.reduce((a, c) => a + treeRbe(c, fort, round), 0);
  const kidsRbe = (type: EnemyType, fort: boolean, round = 0): number => etab[type].children.reduce((a, c) => a + treeRbe(c, fort, round), 0);

  const zeroPowers = (v: number): Record<PowerKey, number> => {
    const o = {} as Record<PowerKey, number>;
    for (const k of POWER_KEYS) o[k] = v;
    return o;
  };
  const powers0 = zeroPowers(0);
  for (const k of POWER_KEYS) powers0[k] = Math.max(0, Math.floor(opts.powers?.[k] ?? 0)) + Math.max(0, Math.floor(kmods.freePowers?.[k] ?? 0));

  const lives0 = diff.lives + (kmods.lives ?? 0);
  const S: GameState = {
    tick: 0,
    phase: 'build',
    round: baseRound,
    freeplay: false,
    roundsCleared: 0,
    cash: deflation ? DEFLATION_CASH : halfCash ? Math.floor((diff.startCash + (kmods.startCash ?? 0)) / 2) : diff.startCash + (kmods.startCash ?? 0),
    lives: lives0,
    towers: [],
    enemies: [],
    projectiles: [],
    abilities: [],
    towerXp: perTower(() => 0),
    towerXpGained: perTower(() => 0),
    maxTier: perTower((): Tiers => [5, 5, 5]),
    roundPops: perTower(() => 0),
    stats: {
      pops: { ...perTower(() => 0), wren: 0, bram: 0, sela: 0 },
      leaked: 0,
      spent: { ...perTower(() => 0), wren: 0, bram: 0, sela: 0 },
      powersUsed: zeroPowers(0),
      income: 0,
      abilityCash: 0,
      groveGold: 0,
      healed: 0,
      bountyGold: 0,
    },
    powers: powers0,
    powerUsedRound: zeroPowers(-1),
    powerUses: zeroPowers(0),
    traps: [],
    walls: [],
    puddles: [],
    gateLeft: Math.max(0, Math.floor(kmods.gate ?? 0)),
    popCarry: 0,
    incCarry: 0,
    halfCarry: 0,
    baseRound,
    sentries: [],
    forgeLeft: 0,
    warpLeft: 0,
    oilRound: 0,
    oilCarry: 0,
    autoStart: false,
    heroPlaced: false,
    rainLeft: 0,
    focusLeft: 0,
    nextId: 1,
    rng: seedRng(opts.seed),
    groups: [],
    activeRounds: [],
  };

  for (const t of TOWER_TYPES) {
    if (opts.towerXp) S.towerXp[t] = opts.towerXp[t] ?? 0;
    if (opts.unlocks) S.maxTier[t] = opts.unlocks.maxTier[t] ? ([...opts.unlocks.maxTier[t]!] as Tiers) : [0, 0, 0];
  }

  let events: SimEvent[] = [];
  const emit = (e: SimEvent): void => {
    events.push(e);
  };

  /**
   * Runde 15: Einkommen durch die Modi schleusen. Deflation: nichts. Half Cash: halbiert, der Rest (0/1) wandert in `halfCarry`,
   * damit nichts verloren geht. Rueckgabe = tatsaechlich gutgeschriebene Menge. Verkaufserloese und Bankabhebungen laufen nicht hier durch.
   */
  /**
   * Runde 15b (Max, 10.10.2026: "T5 um R50-60 bezahlbar"): Pop-Gold ab R21 gedaempft (`popBp`), mit Bruchrest, damit 80+ Runden
   * nicht in Geld ersticken. Gilt fuer Pops, Waende und Shrink; Rundenbonus bleibt eigen (`roundBonus`).
   */
  const dampen = (cash: number, round: number): number => {
    if (round <= 20 || cash <= 0) return cash;
    const t = cash * popBp(round) + S.incCarry;
    S.incCarry = t % 10000;
    return Math.floor(t / 10000);
  };
  const earn = (n: number): number => {
    if (deflation) return 0;
    if (!halfCash) return n;
    const t = n + S.halfCarry;
    S.halfCarry = t % 2;
    return Math.floor(t / 2);
  };

  // Nicht gehashte Nebenstrukturen (aus dem Zustand ableitbar)
  const emap = new Map<number, EnemyState>();
  const tstats = new Map<number, Stats>();
  const pstats = new WeakMap<ProjectileState, Stats>();
  let grid = new Map<number, EnemyState[]>();
  /** Runde 16: Tempo-Zuwachs (Milli-Ticks je Tick) der Tuerme im laufenden Tick, fuer Sentries und Bauzeiten. Wird jeden Tick neu gefuellt. */
  const tickDec = new Map<number, number>();

  const sellRate = kmods.sellBp ?? 7000;

  // ================= Hilfen =================

  const towerById = (id: number): TowerState | undefined => {
    for (const t of S.towers) if (t.id === id) return t;
    return undefined;
  };
  const heroTower = (): TowerState | undefined => S.towers.find((t) => isHero(t.type));

  function towerDef(type: TowerType | HeroType): { price: number; radius: number } {
    return isHero(type) ? DATA.hero[type] : DATA.towers[type];
  }
  const priceOf = (type: TowerType | HeroType): number => {
    let base = towerDef(type).price;
    if (type === 'market' && kmods.marketPriceBp) base = Math.floor((base * (10000 - kmods.marketPriceBp)) / 10000);
    return round5(base, diff.priceBp);
  };
  function upgradePrice(t: TowerState, path: number, tier: number): number {
    const type = t.type as TowerType;
    let base = DATA.towers[type].paths[path].tiers[tier - 1].price;
    if (tier === 1 && kmods.t1DiscountBp) base = Math.floor((base * (10000 - kmods.t1DiscountBp)) / 10000);
    if (tier === 2 && kmods.t2DiscountBp && PRIMARY.includes(type)) base = Math.floor((base * (10000 - kmods.t2DiscountBp)) / 10000);
    const disc = auraOf(t).discountBp;
    if (disc) base = Math.floor((base * (10000 - disc)) / 10000);
    return round5(base, diff.priceBp);
  }

  /**
   * Auren auf einen Turm: je Feld der stärkste Wert, keine Stapelung. Quellen (Runde 16): Markets und Bellringer (Radius = `range`),
   * Riverkeeper-Sonar und Tinker-Ultra-Overclock (Radius `aR`) sowie der Held (Schmiede von Bram, Camo-Sicht von Sela, Radius `buffRadius`).
   * Der Turm selbst bekommt seine eigene Aura nicht. Market und Bellringer empfangen keine Auren.
   */
  function auraOf(t: TowerState): TowerAura {
    const a: TowerAura = { rangeBp: 0, camo: false, speedBp: 0, armor: false, pierce: 0, dmg: 0, discountBp: 0 };
    for (const m of S.towers) {
      if (m === t) continue;
      const ms = tstats.get(m.id);
      if (!ms) continue;
      if (isHero(m.type)) {
        if (ms.buffRadius <= 0 || dist2(t.x, t.y, m.x, m.y) > ms.buffRadius * ms.buffRadius) continue;
        a.dmg = Math.max(a.dmg, ms.forgeDmg);
        if (ms.heroCamo > 0) a.camo = true;
        continue;
      }
      if (!AURA_ONLY.includes(m.type as TowerType) && ms.aR <= 0) continue;
      const rad = ms.aR > 0 ? ms.aR : ms.range;
      if (dist2(t.x, t.y, m.x, m.y) > rad * rad) continue;
      a.rangeBp = Math.max(a.rangeBp, ms.aRangeBp);
      if (ms.aCamo > 0) a.camo = true;
      a.speedBp = Math.max(a.speedBp, ms.aSpeedBp);
      if (ms.aArmor > 0) a.armor = true;
      a.pierce = Math.max(a.pierce, ms.aPierce);
      a.dmg = Math.max(a.dmg, ms.aDmg);
      a.discountBp = Math.max(a.discountBp, ms.aDiscBp);
    }
    return a;
  }

  function computeStats(t: TowerState): Stats {
    let st: Stats;
    if (isHero(t.type)) {
      const h = DATA.hero[t.type];
      st = baseStats(h.base);
      for (let l = 2; l <= t.heroLevel; l++) for (const m of h.levels[l - 1].mods) applyMod(st, m as Mod);
    } else {
      const d = DATA.towers[t.type];
      st = baseStats(d.base);
      for (const p of pathOrder(t.tiers)) {
        for (let k = 1; k <= t.tiers[p]; k++) for (const m of d.paths[p].tiers[k - 1].mods) applyMod(st, m as Mod);
      }
      const rb = kmods.rangeBp?.[t.type];
      if (rb) st.range = Math.floor((st.range * (10000 + rb)) / 10000);
    }
    if (kmods.radiusBp) {
      const f = (v: number): number => Math.floor((v * (10000 + kmods.radiusBp!)) / 10000);
      st.radius = f(st.radius);
      st.novaR = f(st.novaR);
      st.endR = f(st.endR);
      st.flareR = f(st.flareR);
    }
    if (kmods.slowDurBp) st.slowTicks = Math.floor((st.slowTicks * (10000 + kmods.slowDurBp)) / 10000);
    if (kmods.freezeAddTicks) {
      if (st.azDur > 0) st.azDur += kmods.freezeAddTicks;
      if (st.azBoss > 0) st.azBoss += kmods.freezeAddTicks;
    }
    if (kmods.supplyBonus && st.supplyCash > 0) st.supplyCash += kmods.supplyBonus;
    if (kmods.marketRadiusBp && t.type === 'market') st.range = Math.floor((st.range * (10000 + kmods.marketRadiusBp)) / 10000);
    // Runde 16 (Wissensbaum): Aura-Radius (Bellringer = `range`, sonst `aR`), Toll, Sentry-Zeit, Fallen-Ladungen
    if (!isHero(t.type)) {
      const ab = kmods.auraRadiusBp?.[t.type];
      if (ab) {
        if (st.aR > 0) st.aR = Math.floor((st.aR * (10000 + ab)) / 10000);
        else if (AURA_ONLY.includes(t.type)) st.range = Math.floor((st.range * (10000 + ab)) / 10000);
      }
      if (kmods.tollAdd && t.type === 'bellringer' && st.income > 0) st.income += kmods.tollAdd;
    }
    if (kmods.sentryTtlBp && st.sentryTtl > 0) st.sentryTtl = Math.floor((st.sentryTtl * (10000 + kmods.sentryTtlBp)) / 10000);
    if (kmods.trapChargesAdd && st.trapCharges > 0) st.trapCharges += kmods.trapChargesAdd;
    // Runde 14 (Wissensbaum)
    if (!isHero(t.type)) {
      const pa = kmods.pierceAdd?.[t.type];
      if (pa) st.pierce += pa;
      const fa = kmods.fragAdd?.[t.type];
      if (fa && st.fragN > 0) st.fragN += fa;
    }
    if (kmods.brewDurBp && st.brewTicks > 0) st.brewTicks = Math.floor((st.brewTicks * (10000 + kmods.brewDurBp)) / 10000);
    if (kmods.bountyGold && st.bountyGold > 0) st.bountyGold += kmods.bountyGold;
    if (kmods.leadGoldAdd && st.leadGold > 0) st.leadGold += kmods.leadGoldAdd;
    return st;
  }

  function refreshTower(t: TowerState): void {
    const st = computeStats(t);
    tstats.set(t.id, st);
    t.camo = st.camo === 1;
    t.range = st.range;
    t.zone = st.zoneBp > 0 ? Math.floor((st.range * st.zoneBp) / 10000) : 0;
    syncAbilities();
  }

  function abilityParams(id: AbilityId): { cd: number } | null {
    if (id === 'arrowRain') {
      let cd = 0;
      for (const t of S.towers) if (t.type === 'ranger') { const st = tstats.get(t.id)!; if (st.rainDur > 0) cd = Math.max(cd, st.rainCd); }
      return cd > 0 ? { cd } : null;
    }
    if (id === 'absoluteZero') {
      let cd = 0;
      for (const t of S.towers) if (t.type === 'frostcaller') { const st = tstats.get(t.id)!; if (st.azDur > 0) cd = Math.max(cd, st.azCd); }
      return cd > 0 ? { cd } : null;
    }
    if (id === 'focus' || id === 'supplyDrop' || id === 'grant') {
      let cd = 0;
      for (const t of S.towers) {
        const st = tstats.get(t.id)!;
        if (id === 'focus' && t.type === 'longshot' && st.focusDur > 0) cd = Math.max(cd, st.focusCd);
        if (id === 'supplyDrop' && t.type === 'longshot' && st.supplyCash > 0) cd = Math.max(cd, st.supplyCd);
        if (id === 'grant' && t.type === 'market' && st.grantCash > 0) cd = Math.max(cd, st.grantCd);
      }
      return cd > 0 ? { cd } : null;
    }
    if (id === 'alarm' || id === 'overclock') {
      let cd = 0;
      for (const t of S.towers) {
        const st = tstats.get(t.id)!;
        if (id === 'alarm' && t.type === 'bellringer' && st.alarmStun > 0) cd = Math.max(cd, st.alarmCd);
        if (id === 'overclock' && t.type === 'tinker' && st.ocDur > 0) cd = Math.max(cd, st.ocCd);
      }
      return cd > 0 ? { cd } : null;
    }
    if (id === 'wallOfTrees' || id === 'tonic') {
      let cd = 0;
      for (const t of S.towers) {
        const st = tstats.get(t.id)!;
        if (id === 'wallOfTrees' && t.type === 'thornweaver' && st.wallRbe > 0) cd = Math.max(cd, st.wallCd);
        if (id === 'tonic' && t.type === 'alchemist' && st.tonicDur > 0) cd = Math.max(cd, st.tonicCd);
      }
      return cd > 0 ? { cd } : null;
    }
    const h = heroTower();
    if (!h) return null;
    const st = tstats.get(h.id)!;
    // Heldenfaehigkeiten: jede Abklingzeit ist nur beim passenden Helden gesetzt (die anderen Helden haben 0)
    const cd = id === 'flare' ? st.flareCd : id === 'dawnbreak' ? st.dawnCd : id === 'anvilDrop' ? st.anvilCd : id === 'forgeOfDawn' ? st.forgeCd
      : id === 'starfall' ? st.starCd : id === 'eclipse' ? st.eclipseCd : 0;
    return cd > 0 ? { cd } : null;
  }

  /** Fähigkeiten an den vorhandenen Türmen ausrichten; Abklingzeit startet beim Erwerb voll. */
  function syncAbilities(): void {
    const next: GameState['abilities'] = [];
    for (const id of ABILITY_ORDER) {
      const p = abilityParams(id);
      if (!p) continue;
      const old = S.abilities.find((a) => a.id === id);
      if (old) next.push({ id, ready: old.ready, cdLeft: Math.min(old.cdLeft, p.cd), cdTotal: p.cd });
      else next.push({ id, ready: false, cdLeft: p.cd, cdTotal: p.cd });
    }
    S.abilities = next;
  }

  // ---------- Gegner ----------

  function spawnEnemy(type: EnemyType, progress: number, camo: boolean, round: number, revealed: boolean, branch = 0, fortified = false, regrowTo: EnemyType | null = null): EnemyState {
    const hp = hpOf(type, fortified, round);
    camo = camo || etab[type].alwaysCamo;
    const pos = positionAt(pathOf(branch), progress);
    const e: EnemyState = {
      id: S.nextId++, type, x: pos.x, y: pos.y, progress, hp, maxHp: hp, camo, revealed,
      slowBp: 0, slowTicks: 0, stunTicks: 0, frozenTicks: 0, burnTicks: 0, damageStage: 0,
      frac: 0, round, brittleTicks: 0, burnDmg: 0, burnOwner: 0, vineTicks: 0, goldTicks: 0, volatile: 0, markTicks: 0, markBp: 0,
      branch, fortified, regrowTo, regrowTicks: REGROW_TICKS, hasteTicks: 0, bossCd: type === 'wyrm' ? BREATH_EVERY : 0, dead: false,
    };
    S.enemies.push(e);
    emap.set(e.id, e);
    gridInsert(e);
    return e;
  }

  const gkey = (x: number, y: number): number => (Math.floor((x + 200000) / CELL) << 9) + Math.floor((y + 200000) / CELL);
  function gridInsert(e: EnemyState): void {
    const k = gkey(e.x, e.y);
    const a = grid.get(k);
    if (a) a.push(e);
    else grid.set(k, [e]);
  }
  function rebuildGrid(): void {
    grid = new Map();
    for (const e of S.enemies) if (!e.dead) gridInsert(e);
  }
  /** Alle lebenden Gegner, deren Mittelpunkt in der Box liegt (grobe Vorauswahl). */
  function queryBox(x0: number, y0: number, x1: number, y1: number): EnemyState[] {
    const out: EnemyState[] = [];
    const cx0 = Math.floor((x0 + 200000) / CELL);
    const cx1 = Math.floor((x1 + 200000) / CELL);
    const cy0 = Math.floor((y0 + 200000) / CELL);
    const cy1 = Math.floor((y1 + 200000) / CELL);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const a = grid.get((cx << 9) + cy);
        if (a) for (const e of a) if (!e.dead) out.push(e);
      }
    }
    return out;
  }

  const enemySpeed = (e: EnemyState): number => {
    const base = etab[e.type].sp;
    let v = e.slowTicks > 0 ? Math.floor((base * (10000 - e.slowBp)) / 10000) : base;
    // Runde 15b: ab R121 steigt das Tempo je Runde (Formel in freeplay.ts)
    if (e.round > LIST_ROUNDS) v = Math.floor((v * fpSpeedBp(e.round)) / 10000);
    if (S.warpLeft > 0 && !etab[e.type].immuneSlow) {
      const bp = DATA.powers.timeWarp.params[etab[e.type].blimp ? 'bossSlowBp' : 'slowBp'];
      v = Math.floor((v * (10000 - bp)) / 10000);
    }
    // Lava-Stampfer des Ember Colossus: +50 % Tempo
    if (e.hasteTicks > 0) v = Math.floor((v * STOMP_BP) / 10000);
    return v;
  };

  /** Fortschritt eines Gegners in `ticks` Ticks (Status eingerechnet, Fortsetzung nach Stillstand). */
  function predictPos(e: EnemyState, ticks: number): { x: number; y: number } {
    const still = Math.max(e.frozenTicks, e.stunTicks);
    const moving = Math.max(0, ticks - still);
    const p = pathOf(e.branch);
    const prog = Math.min(p.length, e.progress + Math.floor((e.frac + enemySpeed(e) * moving) / 1000));
    return positionAt(p, prog);
  }

  const bonusFor = (e: EnemyState, st: Stats): number => {
    const armored = e.type === 'brute' || e.type === 'crystal' || e.type === 'gloomship' || e.type === 'ironshell';
    const forge = armored && S.forgeLeft > 0 ? forgeArmorBonus() : 0;
    return forge + (e.type === 'brute' || e.type === 'crystal' || e.type === 'gloomship'
      ? st.bonusBrute
      : e.type === 'leviathan' || e.type === 'wyrm' || e.type === 'colossus'
        ? st.bonusBrute + st.bonusBoss
        : e.type === 'ironshell' ? st.bonusIron : 0);
  };
  /** Forge of Dawn (Bram L20): Zusatzschaden gegen Panzertraeger, solange die Schmiede brennt. */
  function forgeArmorBonus(): number {
    const h = heroTower();
    return h ? tstats.get(h.id)?.forgeArmor ?? 0 : 0;
  }

  // ---------- Schaden ----------

  /** Gibt true zurück, wenn Schaden angewendet wurde (nicht abgeprallt). */
  function damage(e: EnemyState, amount: number, dtype: DamageType, src: number, created?: number[], silent = false): boolean {
    if (e.dead) return false;
    const d = etab[e.type];
    if (dtype === 'sharp' && ((d.armor && S.forgeLeft <= 0) || e.frozenTicks > 0)) {
      if (!silent) emit({ type: 'blocked', tick: S.tick, enemy: e.id, x: e.x, y: e.y, reason: 'armor' });
      return false;
    }
    if (dtype === 'cold' && d.immuneCold) {
      if (!silent) emit({ type: 'blocked', tick: S.tick, enemy: e.id, x: e.x, y: e.y, reason: 'immune' });
      return false;
    }
    if (dtype === 'explosive' && d.immuneExplosive) {
      if (!silent) emit({ type: 'blocked', tick: S.tick, enemy: e.id, x: e.x, y: e.y, reason: 'explosion' });
      return false;
    }
    let total = amount;
    if (e.brittleTicks > 0) total += 1;
    // Icicle Edge (Wissensbaum): Frostcaller-Treffer auf Eingefrorene
    if (kmods.icicleDmg && e.frozenTicks > 0 && towerById(src)?.type === 'frostcaller') total += kmods.icicleDmg;
    // Crippling Shot: markierter Boss nimmt aus allen Quellen mehr Schaden (kaufmännisch gerundet)
    if (e.markTicks > 0 && total > 0) total += Math.floor((total * e.markBp + 5000) / 10000);
    if (total <= 0) return false;
    if (!silent) emit({ type: 'hit', tick: S.tick, enemy: e.id, tower: src, dmg: total, dtype, x: e.x, y: e.y });
    const before = e.hp;
    e.hp -= total;
    if (d.stages.length && e.hp > 0) {
      let stage = 0;
      for (const pct of d.stages) if (e.hp * 100 <= pct * e.maxHp) stage++;
      if (stage > e.damageStage) {
        const from = e.damageStage;
        e.damageStage = stage;
        if (d.boss) {
          emit({ type: 'bossStage', tick: S.tick, enemy: e.id, stage });
          for (let s = from + 1; s <= stage; s++) bossStageAction(e, s);
        }
      }
    }
    if (e.hp <= 0) popEnemy(e, total - before, dtype, src, created);
    return true;
  }

  function popEnemy(e: EnemyState, excess: number, dtype: DamageType, src: number, created?: number[]): void {
    const d = etab[e.type];
    e.dead = true;
    e.hp = 0;
    let cash = d.hullCash > 0 ? d.hullCash : diff.popCash;
    if (S.oilRound > 0 && S.round <= S.oilRound) {
      // Lantern Oil: +25 % mit Bruchrest (bei 2 Gold je Schicht sonst nie ein Aufschlag)
      const t = cash * DATA.powers.lanternOil.params.cashBp + S.oilCarry;
      S.oilCarry = t % 10000;
      cash += Math.floor(t / 10000);
    }
    if (kmods.popCashBp) {
      // Pop Bonus (Wissensbaum): Aufschlag mit Bruchrest wie bei Lantern Oil
      const t = cash * kmods.popCashBp + S.popCarry;
      S.popCarry = t % 10000;
      cash += Math.floor(t / 10000);
    }
    // Rubber to Gold: markierte Gegner (und ihre Kinder) geben +1 Gold je Schicht
    if (e.goldTicks > 0) cash += 1;
    cash = earn(dampen(cash, e.round));
    S.cash += cash;
    const owner = towerById(src);
    if (owner) {
      owner.pops++;
      S.stats.pops[owner.type]++;
      if (!isHero(owner.type)) S.roundPops[owner.type]++;
      // Lead to Gold: jeder geknackte Ironshell zahlt
      if (e.type === 'ironshell' && owner.type === 'alchemist') {
        const g = earn(tstats.get(owner.id)?.leadGold ?? 0);
        if (g > 0) {
          S.cash += g;
          S.stats.bountyGold += g;
          emit({ type: 'bounty', tick: S.tick, tower: owner.id, x: e.x, y: e.y, gold: g, reason: 'lead' });
        }
      }
    }
    const kids: EnemyState[] = [];
    const n = d.children.length;
    for (let i = 0; i < n; i++) {
      const off = (2 * i - (n - 1)) * 3000;
      const ct = d.children[i];
      // Regrow: Kinder einer Regrow-Leiter-Gruppe wachsen bis zum Ursprungstyp nach, sonst bis zu ihrem eigenen Typ
      const rg = e.type === 'duskrunner' ? ct : e.regrowTo === null ? null : LADDER.includes(e.regrowTo) && LADDER.includes(ct) ? e.regrowTo : ct;
      const k = spawnEnemy(ct, Math.max(0, e.progress + off), e.camo, e.round, e.revealed, e.branch, e.fortified, rg);
      k.goldTicks = e.goldTicks;
      kids.push(k);
      created?.push(k.id);
    }
    emit({ type: 'pop', tick: S.tick, enemy: e.id, etype: e.type, x: e.x, y: e.y, children: kids.map((k) => k.id), cash });
    if (!d.blimp && excess > 0) for (const k of kids) damage(k, excess, dtype, src, created, true);
    // Unstable Concoction: markierte Gegner explodieren beim Tod
    if (e.volatile) {
      const o = tstats.get(e.volatile);
      if (o && o.unstDmg > 0) explodeAt(e.x, e.y, o.unstR, o.unstDmg, 'explosive', 12, e.volatile, null, 'unstable');
    }
  }

  /** Boss-Phase erreicht: Frost Wyrm spuckt Frostlinge (66 %/33 %), Ember Colossus stampft bei jeder Platte. */
  function bossStageAction(e: EnemyState, stage: number): void {
    if (e.type === 'wyrm') {
      const ids: number[] = [];
      for (let i = 0; i < SPIT_N; i++) {
        const k = spawnEnemy('frostling', Math.max(0, e.progress - (i + 1) * 5000), e.camo, e.round, e.revealed, e.branch, e.fortified, null);
        ids.push(k.id);
      }
      emit({ type: 'bossSpit', tick: S.tick, enemy: e.id, x: e.x, y: e.y, ids });
    } else if (e.type === 'colossus') {
      const ids: number[] = [];
      for (const o of S.enemies) {
        if (o.dead || o === e || etab[o.type].boss) continue;
        const r = STOMP_RADIUS + etab[o.type].radius;
        if (dist2(e.x, e.y, o.x, o.y) > r * r) continue;
        o.hasteTicks = Math.max(o.hasteTicks, STOMP_TICKS);
        ids.push(o.id);
      }
      emit({ type: 'stomp', tick: S.tick, enemy: e.id, x: e.x, y: e.y, radius: STOMP_RADIUS, ticks: STOMP_TICKS, enemies: ids });
    }
    void stage;
  }

  function applySlow(e: EnemyState, bp: number, ticks: number, brittle: boolean, raw = false, cosmic = false): void {
    const d = etab[e.type];
    // `cosmic` (Eclipse, Sela L20): ignoriert Kaelte-Immunitaet; Slow-Immunitaet (Dreadnought, 15b) bleibt
    if ((d.immuneCold && !cosmic) || d.immuneSlow || e.dead) return;
    if (d.blimp && !raw) {
      bp = Math.floor(bp / 2);
      ticks = Math.floor(ticks / 2);
    }
    if (bp <= 0 || ticks <= 0) return;
    const was = e.slowTicks > 0;
    if (e.slowTicks <= 0 || bp > e.slowBp) {
      e.slowBp = bp;
      e.slowTicks = ticks;
    } else if (bp === e.slowBp) e.slowTicks = Math.max(e.slowTicks, ticks);
    if (brittle) e.brittleTicks = Math.max(e.brittleTicks, e.slowTicks);
    if (!was) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'slow' });
  }

  function applyStun(e: EnemyState, ticks: number, bossTicks: number): void {
    if (e.dead || etab[e.type].immuneStun) return;
    const t = etab[e.type].boss ? bossTicks : ticks;
    if (t <= 0) return;
    const was = e.stunTicks > 0;
    e.stunTicks = Math.max(e.stunTicks, t);
    if (!was) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'stun' });
  }

  function applyBurn(e: EnemyState, dmg: number, ticks: number, owner: number, acid = false): void {
    if (e.dead || dmg <= 0) return;
    if (etab[e.type].boss) ticks = Math.floor(ticks / 2);
    const was = e.burnTicks > 0;
    e.burnTicks = Math.max(e.burnTicks, ticks);
    e.burnDmg = Math.max(e.burnDmg, dmg);
    e.burnOwner = owner;
    if (!was) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: acid ? 'acid' : 'burn' });
  }

  // ---------- Treffer-Helfer ----------

  /** Flächenschaden: nächste `max` Gegner im Radius. */
  function explodeAt(
    x: number, y: number, radius: number, dmg: number, dtype: DamageType, max: number, src: number, st: Stats | null,
    kind: 'bomb' | 'mini' | 'star' | 'unstable', stun = 0, stunBoss = 0, exclude?: readonly number[], withBonus = true,
  ): void {
    emit({ type: 'explode', tick: S.tick, x, y, radius, kind });
    const cand = queryBox(x - radius - 30000, y - radius - 30000, x + radius + 30000, y + radius + 30000);
    const list: { e: EnemyState; d2: number }[] = [];
    for (const e of cand) {
      if (exclude && exclude.includes(e.id)) continue;
      const r = radius + etab[e.type].radius;
      const d2 = dist2(x, y, e.x, e.y);
      if (d2 <= r * r) list.push({ e, d2 });
    }
    list.sort((a, b) => a.d2 - b.d2 || a.e.id - b.e.id);
    for (const { e } of list.slice(0, max)) {
      damage(e, dmg + (st && withBonus ? bonusFor(e, st) : 0), dtype, src);
      if ((stun > 0 || stunBoss > 0) && !(dtype === 'explosive' && etab[e.type].immuneExplosive)) applyStun(e, stun, stunBoss);
    }
  }

  function spawnFrags(x: number, y: number, st: Stats, owner: number, hit: number[]): void {
    const n = st.fragN;
    if (n <= 0) return;
    const a0 = nextInt(S.rng, 360);
    const v = Math.max(1, Math.floor((st.fragSpeed * 50) / 3));
    const life = Math.max(1, Math.ceil(st.fragRange / v));
    for (let i = 0; i < n; i++) {
      const deg = a0 + Math.floor((i * 360) / n);
      const p = makeProj(owner, st.fragKind, x, y, Math.round((v * cosBp(deg)) / 10000), Math.round((v * sinBp(deg)) / 10000), st.fragDmg, st.fragDtype, st.fragPierce, life, 1, st);
      p.hit = hit.slice();
    }
  }

  function makeProj(owner: number, kind: ProjectileKind, x: number, y: number, vx: number, vy: number, dmg: number, dtype: DamageType, pierce: number, life: number, sub: number, st: Stats): ProjectileState {
    const p: ProjectileState = { id: S.nextId++, kind, owner, x, y, vx, vy, dmg, dtype, pierce, life, age: -1, hit: [], sub };
    S.projectiles.push(p);
    pstats.set(p, st);
    return p;
  }

  function nearestUnhit(x: number, y: number, range: number, taken: readonly number[], n: number): EnemyState[] {
    const cand = queryBox(x - range - 25000, y - range - 25000, x + range + 25000, y + range + 25000);
    const list: { e: EnemyState; d2: number }[] = [];
    for (const e of cand) {
      if (taken.includes(e.id) || e.progress < MIN_SPAWN_PROGRESS) continue;
      const d2 = dist2(x, y, e.x, e.y);
      if (d2 <= range * range) list.push({ e, d2 });
    }
    list.sort((a, b) => a.d2 - b.d2 || a.e.id - b.e.id);
    return list.slice(0, n).map((l) => l.e);
  }

  /** Sofortiger Blitz von (x,y) auf bis zu n weitere Gegner (Funke / Kette). */
  function lightning(fromX: number, fromY: number, first: EnemyState | null, n: number, range: number, dmg: number, src: number, taken: number[], originPoint: boolean): void {
    const points: [number, number][] = [];
    if (originPoint) points.push([fromX, fromY]);
    let cx = fromX, cy = fromY;
    let cur = first;
    let left = n;
    if (!cur) {
      const c = nearestUnhit(cx, cy, range, taken, 1);
      cur = c[0] ?? null;
    }
    while (cur && left > 0) {
      points.push([cur.x, cur.y]);
      taken.push(cur.id);
      cx = cur.x; cy = cur.y;
      damage(cur, dmg, 'energy', src);
      left--;
      if (left <= 0) break;
      const nx = nearestUnhit(cx, cy, range, taken, 1);
      cur = nx[0] ?? null;
    }
    if (points.length >= 2) emit({ type: 'chain', tick: S.tick, tower: src, points, dmg });
  }

  // ---------- Zielwahl ----------

  function pickTarget(t: Pick<TowerState, 'id' | 'x' | 'y'>, range: number, detect: boolean, mode: TargetMode, requireDetect = true, filter?: (e: EnemyState) => boolean): EnemyState | null {
    let best: EnemyState | null = null;
    let bestKey = 0;
    const r2 = range * range;
    // Ganze Karte (Longshot): kein Raster, alle Gegner ansehen
    const cand = range >= GLOBAL_RANGE ? S.enemies : queryBox(t.x - range - 25000, t.y - range - 25000, t.x + range + 25000, t.y + range + 25000);
    const elite = tstats.get(t.id)?.eliteStrong === 1;
    for (const e of cand) {
      if (e.dead || e.progress < MIN_SPAWN_PROGRESS) continue;
      if (requireDetect && e.camo && !e.revealed && !detect) continue;
      if (filter && !filter(e)) continue;
      const d2 = dist2(t.x, t.y, e.x, e.y);
      if (d2 > r2) continue;
      let key: number;
      switch (mode) {
        case 'first': key = e.progress * 1024 - (e.id & 1023); break;
        case 'last': key = -e.progress * 1024 - (e.id & 1023); break;
        case 'close': key = -d2; break;
        default: key = (elite && e.type === 'brute' ? 9 : STRONG_RANK[e.type]) * 1e12 + e.progress; break;
      }
      if (best === null || key > bestKey || (key === bestKey && e.id < best.id)) {
        best = e;
        bestKey = key;
      }
    }
    return best;
  }

  // ================= Runde 14: Thornweaver und Alchemist =================

  /** Alchemist-Tränke (Timer und Permanent Brew) und Spring Blessing auf einem Turm; stärkster Wert je Feld. */
  function buffOf(t: TowerState): TowerBuff {
    const b: TowerBuff = { dmg: 0, rangeBp: 0, speedBp: 0, groveSpeedBp: 0, permanent: false, ticks: t.buffTicks };
    if (t.buffTicks > 0) {
      b.dmg = t.buffDmg;
      b.rangeBp = t.buffRangeBp;
      b.speedBp = t.buffSpeedBp;
    }
    for (const a of S.towers) {
      if (a === t) continue;
      const as = tstats.get(a.id);
      if (!as) continue;
      if (a.type === 'alchemist' && as.brewPerm > 0 && dist2(t.x, t.y, a.x, a.y) <= a.range * a.range) {
        b.permanent = true;
        b.dmg = Math.max(b.dmg, as.brewDmg);
        b.rangeBp = Math.max(b.rangeBp, as.brewRangeBp);
        b.speedBp = Math.max(b.speedBp, as.brewSpeedBp);
      }
      if (a.type === 'thornweaver' && as.groveSpeedBp > 0 && dist2(t.x, t.y, a.x, a.y) <= a.range * a.range) b.groveSpeedBp = Math.max(b.groveSpeedBp, as.groveSpeedBp);
    }
    return b;
  }

  /** Avatar of Wrath: +1 Schaden je `avatarPer` lebende Gegner auf der Karte, höchstens `avatarMax`. */
  function avatarBonus(st: Stats): number {
    if (st.avatarPer <= 0) return 0;
    let n = 0;
    for (const e of S.enemies) if (!e.dead) n++;
    return Math.min(st.avatarMax, Math.floor(n / st.avatarPer));
  }

  /** Säurepfütze auf dem Weg beim Landepunkt (x, y); eine Pfütze desselben Alchemisten in der Nähe wird aufgefrischt statt verdoppelt. */
  function addPuddle(owner: number, x: number, y: number, charges: number): void {
    const n = nearestOnPaths(map, x, y);
    const pos = positionAt(pathOf(n.branch), n.progress);
    const br = branchAt(map, pos.x, pos.y);
    const near = S.puddles.find((q) => q.owner === owner && q.branch === br && Math.abs(q.progress - n.progress) <= PUDDLE_RADIUS + 2000);
    if (near) {
      near.charges = Math.max(near.charges, charges);
      near.ttl = PUDDLE_TTL;
      emit({ type: 'puddle', tick: S.tick, id: near.id, tower: owner, x: near.x, y: near.y, radius: near.radius, charges: near.charges });
      return;
    }
    const q: PuddleState = { id: S.nextId++, owner, progress: n.progress, branch: br, x: pos.x, y: pos.y, radius: PUDDLE_RADIUS, charges, ttl: PUDDLE_TTL, cd: PUDDLE_PULSE };
    S.puddles.push(q);
    emit({ type: 'puddle', tick: S.tick, id: q.id, tower: owner, x: q.x, y: q.y, radius: q.radius, charges });
  }

  /** Tränke-Treffer: Spritzer auf die nächsten `maxT` Gegner im Radius, dazu Säure-DoT, Markierungen und Pfütze. */
  function potionLand(p: ProjectileState, st: Stats): void {
    const x = p.arc!.x1, y = p.arc!.y1;
    emit({ type: 'explode', tick: S.tick, x, y, radius: st.radius, kind: 'acid' });
    const cand = queryBox(x - st.radius - 30000, y - st.radius - 30000, x + st.radius + 30000, y + st.radius + 30000);
    const list: { e: EnemyState; d2: number }[] = [];
    for (const e of cand) {
      const r = st.radius + etab[e.type].radius;
      const d2 = dist2(x, y, e.x, e.y);
      if (d2 <= r * r) list.push({ e, d2 });
    }
    list.sort((a, b) => a.d2 - b.d2 || a.e.id - b.e.id);
    for (const { e } of list.slice(0, st.maxT)) {
      if (e.dead) continue;
      // Markierungen zuerst: auch der tödliche Treffer zählt als getroffen (Explosion, Gold)
      if (st.unstDmg > 0) {
        if (!e.volatile) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'volatile' });
        e.volatile = p.owner;
      }
      if (st.rubberTicks > 0) {
        if (e.goldTicks <= 0) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'gold' });
        e.goldTicks = Math.max(e.goldTicks, st.rubberTicks);
      }
      damage(e, p.dmg + bonusFor(e, st), p.dtype, p.owner);
      if (!e.dead && st.burnDmg > 0) applyBurn(e, st.burnDmg, st.burnTicks, p.owner, true);
    }
    if (st.poolN > 0) addPuddle(p.owner, x, y, st.poolN);
  }

  function updatePuddles(): void {
    for (const q of S.puddles.slice()) {
      q.ttl--;
      if (q.ttl <= 0) {
        S.puddles = S.puddles.filter((x) => x !== q);
        emit({ type: 'puddleGone', tick: S.tick, id: q.id, reason: 'expired' });
        continue;
      }
      if (--q.cd > 0) continue;
      q.cd = PUDDLE_PULSE;
      const hit = queryBox(q.x - q.radius - 30000, q.y - q.radius - 30000, q.x + q.radius + 30000, q.y + q.radius + 30000)
        .filter((e) => e.progress >= MIN_SPAWN_PROGRESS && dist2(q.x, q.y, e.x, e.y) <= (q.radius + etab[e.type].radius) ** 2)
        .sort((a, b) => b.progress - a.progress || a.id - b.id);
      let n = 0;
      for (const e of hit) {
        if (q.charges <= 0) break;
        if (e.dead) continue;
        damage(e, 1, 'magic', q.owner);
        q.charges--;
        n++;
      }
      if (n > 0) emit({ type: 'puddle', tick: S.tick, id: q.id, tower: q.owner, x: q.x, y: q.y, radius: q.radius, charges: q.charges });
      if (q.charges <= 0) {
        S.puddles = S.puddles.filter((x) => x !== q);
        emit({ type: 'puddleGone', tick: S.tick, id: q.id, reason: 'spent' });
      }
    }
    for (const w of S.walls.slice()) {
      if (--w.ttl <= 0) {
        S.walls = S.walls.filter((x) => x !== w);
        emit({ type: 'wallGone', tick: S.tick, id: w.id, reason: 'expired' });
      }
    }
  }

  /** Wall of Trees: am Ende des Wegstücks, das der Thornweaver erreicht (6 px davor). Null, wenn der Turm keinen Weg erreicht. */
  function placeWall(t: TowerState): WallState | null {
    const r2 = t.range * t.range;
    // Mehrere Aeste: der Ast, dessen erreichbares Stueck am weitesten vorn endet (Gleichstand: kleinerer Ast)
    let best = -1;
    let bestBranch = 0;
    map.paths.forEach((p, b) => {
      const smp = p.samples;
      for (let i = smp.length - 1; i >= 0; i--) {
        if (dist2(t.x, t.y, smp[i].x, smp[i].y) <= r2) {
          if (i > best) {
            best = i;
            bestBranch = b;
          }
          break;
        }
      }
    });
    if (best < 0) return null;
    const st = tstats.get(t.id)!;
    const progress = Math.max(MIN_SPAWN_PROGRESS, best * COVERAGE_STEP - 6000);
    const pos = positionAt(pathOf(bestBranch), progress);
    const w: WallState = { id: S.nextId++, owner: t.id, progress, branch: branchAt(map, pos.x, pos.y), x: pos.x, y: pos.y, left: st.wallRbe, ttl: st.wallTtl };
    S.walls.push(w);
    emit({ type: 'wall', tick: S.tick, id: w.id, tower: t.id, x: w.x, y: w.y, progress, left: w.left });
    return w;
  }

  /** Wände schlucken Nicht-Boss-Gegner, die in diesem Tick ihren Wegpunkt überqueren (Reihenfolge der Wände nach Weg). */
  function crossWalls(e: EnemyState, a: number, b: number): void {
    if (etab[e.type].blimp) return;
    const hit = S.walls.filter((w) => (w.branch < 0 || w.branch === e.branch) && w.progress > a && w.progress <= b).sort((x, y) => x.progress - y.progress || x.id - y.id);
    for (const w of hit) {
      const rbe = e.hp + kidsRbe(e.type, e.fortified, e.round);
      const nodes = etab[e.type].nodes;
      const cash = earn(dampen(nodes * diff.popCash, e.round));
      e.dead = true;
      S.cash += cash;
      w.left -= rbe;
      const owner = towerById(w.owner);
      if (owner) {
        owner.pops += nodes;
        S.stats.pops[owner.type] += nodes;
        S.roundPops[owner.type as TowerType] += nodes;
      }
      emit({ type: 'wallEat', tick: S.tick, wall: w.id, enemy: e.id, etype: e.type, x: w.x, y: w.y, rbe, left: Math.max(0, w.left), cash });
      if (w.left <= 0) {
        S.walls = S.walls.filter((x) => x !== w);
        emit({ type: 'wallGone', tick: S.tick, id: w.id, reason: 'spent' });
      }
      return;
    }
  }

  /** Shrink Potion: der Gegner wird zum Red Glim (gleiche Id/Position). Die abgetragenen Schichten zahlen wie Pops. */
  function shrinkEnemy(t: TowerState, e: EnemyState): void {
    const removed = etab[e.type].nodes - 1;
    const cash = earn(dampen(removed * diff.popCash, e.round));
    const from = e.type;
    S.cash += cash;
    t.pops += removed;
    S.stats.pops[t.type] += removed;
    S.roundPops[t.type as TowerType] += removed;
    e.type = 'red';
    e.hp = etab.red.hp;
    e.maxHp = etab.red.hp;
    e.damageStage = 0;
    e.regrowTo = null;
    emit({ type: 'shrink', tick: S.tick, tower: t.id, enemy: e.id, from, x: e.x, y: e.y, cash });
  }

  // ================= Türme =================

  function facingOf(dx: number, dy: number): number {
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const up = dy < 0;
    if (ay * 100000 <= ax * 41421) return dx >= 0 ? 0 : 4;
    if (ay * 100000 >= ax * 241421) return up ? 2 : 6;
    if (dx >= 0) return up ? 1 : 7;
    return up ? 3 : 5;
  }

  function aimAt(t: Pick<TowerState, 'x' | 'y'>, e: EnemyState, speedMilli: number): { x: number; y: number } {
    let tx = e.x, ty = e.y;
    for (let i = 0; i < 3; i++) {
      const d = isqrt(dist2(t.x, t.y, tx, ty));
      const ticks = Math.ceil(d / speedMilli);
      const p = predictPos(e, ticks);
      tx = p.x;
      ty = p.y;
    }
    return { x: tx, y: ty };
  }

  function doFire(t: TowerState, st: Stats): void {
    let e: EnemyState | null | undefined = emap.get(t.windupTarget);
    if (!e || e.dead || dist2(t.x, t.y, e.x, e.y) > (t.range + 12000) * (t.range + 12000)) e = pickTarget(t, t.range, t.camo, t.target);
    if (!e) return;
    t.facing = facingOf(e.x - t.x, e.y - t.y);
    // Market-Aura (Runde 13): +Schaden, sharp -> magic (Armory), +Pierce
    const aura = auraOf(t);
    const dmg = st.dmg + aura.dmg + buffOf(t).dmg + avatarBonus(st);

    if (st.atk === 'chain') {
      emit({ type: 'fire', tick: S.tick, tower: t.id, kind: 'chain' });
      lightning(t.x, t.y, e, st.chainN, st.chainRange, dmg, t.id, [], true);
      return;
    }
    if (st.atk === 'potion') {
      const flight = Math.max(1, st.flight);
      const pp = predictPos(e, flight);
      const p = makeProj(t.id, st.pk, t.x, t.y, 0, 0, dmg, st.dtype, 0, flight, 0, st);
      p.arc = { x0: t.x, y0: t.y, x1: pp.x, y1: pp.y, t: 0 };
      emit({ type: 'fire', tick: S.tick, tower: t.id, projectile: p.id, kind: st.pk });
      return;
    }
    if (st.atk === 'bomb') {
      t.shots++;
      if (st.quakeEvery > 0 && t.shots % st.quakeEvery === 0) {
        emit({ type: 'fire', tick: S.tick, tower: t.id, kind: 'bomb' });
        emit({ type: 'explode', tick: S.tick, x: t.x, y: t.y, radius: t.range, kind: 'quake' });
        for (const q of nearestUnhit(t.x, t.y, t.range, [], 9999)) {
          damage(q, st.quakeDmg, 'explosive', t.id);
          if (!etab[q.type].immuneExplosive) applyStun(q, st.quakeStun, st.quakeStunBoss);
        }
        return;
      }
      const flight = Math.max(1, st.flight);
      const pp = predictPos(e, flight);
      const p = makeProj(t.id, st.pk, t.x, t.y, 0, 0, dmg, st.dtype, 0, flight, 0, st);
      p.arc = { x0: t.x, y0: t.y, x1: pp.x, y1: pp.y, t: 0 };
      emit({ type: 'fire', tick: S.tick, tower: t.id, projectile: p.id, kind: st.pk });
      return;
    }
    // Projektil(e)
    const v = Math.max(1, Math.floor((st.speed * 50) / 3));
    const aim = aimAt(t, e, v);
    const dx = aim.x - t.x, dy = aim.y - t.y;
    const len = Math.max(1, isqrt(dx * dx + dy * dy));
    const bvx = Math.round((dx * v) / len);
    const bvy = Math.round((dy * v) / len);
    const life = Math.max(1, Math.ceil((t.range * 3) / 2 / v));
    let first = 0;
    for (let i = 0; i < st.count; i++) {
      const deg = Math.floor(((2 * i - (st.count - 1)) * st.spread) / 2);
      const [vx, vy] = rotate(bvx, bvy, deg);
      const p = makeProj(t.id, st.pk, t.x, t.y, vx, vy, dmg, aura.armor && st.dtype === 'sharp' ? 'magic' : st.dtype, st.pierce + aura.pierce, life, 0, st);
      if (i === 0) first = p.id;
    }
    emit({ type: 'fire', tick: S.tick, tower: t.id, projectile: first, kind: st.pk });
  }

  // ================= Runde 16: Tinker (Sentries, Fallen) =================

  function removeSentry(s: SentryState, reason: 'expired' | 'sold'): void {
    S.sentries = S.sentries.filter((x) => x !== s);
    emit({ type: 'sentryGone', tick: S.tick, id: s.id, tower: s.owner, reason });
  }

  /**
   * Sentry Kit ff.: der Tinker baut eine Sentry, wenn weniger als `sentryN` stehen, die Bauzeit um ist und ein Gegner in Reichweite ist.
   * Sentries stehen auf einem Kreis um den Tinker (Platz = freier Index, Winkel 30 + 60 x Platz). `t.sentryCd` zaehlt in Milli-Ticks
   * und laeuft mit dem Tempo des Tinkers (Overclock).
   */
  function buildSentry(t: TowerState, st: Stats, tdec: number): void {
    if (t.sentryCd > 0) t.sentryCd = Math.max(0, t.sentryCd - tdec);
    if (t.sentryCd > 0) return;
    const mine = S.sentries.filter((s) => s.owner === t.id);
    if (mine.length >= st.sentryN) return;
    if (!pickTarget(t, t.range, true, 'first')) return;
    let slot = 0;
    while (mine.some((s) => s.slot === slot)) slot++;
    const deg = 30 + slot * 60;
    const s: SentryState = {
      id: S.nextId++, owner: t.id, slot,
      x: t.x + Math.round((SENTRY_RING * cosBp(deg)) / 10000), y: t.y + Math.round((SENTRY_RING * sinBp(deg)) / 10000),
      ttl: st.sentryTtl, cd: 30000,
    };
    S.sentries.push(s);
    t.sentryCd = st.sentryEvery * 1000;
    emit({ type: 'sentry', tick: S.tick, id: s.id, tower: t.id, x: s.x, y: s.y, ttl: s.ttl });
  }

  /** Sentries schiessen mit den Werten ihres Tinkers (Upgrades wirken sofort auch auf stehende Sentries) und seinem Targeting. */
  function updateSentries(): void {
    if (!S.sentries.length) return;
    for (const s of S.sentries.slice()) {
      const o = towerById(s.owner);
      if (!o) {
        removeSentry(s, 'sold');
        continue;
      }
      if (--s.ttl <= 0) {
        removeSentry(s, 'expired');
        continue;
      }
      if (o.frozen > 0) continue;
      const st = tstats.get(o.id)!;
      const dec = tickDec.get(o.id) ?? 1000;
      s.cd -= dec;
      if (s.cd < -dec) s.cd = -dec;
      if (s.cd > 0) continue;
      const e = pickTarget(s, st.sentryRange, o.camo, o.target);
      if (!e) continue;
      const v = Math.max(1, Math.floor((SENTRY_SPEED * 50) / 3));
      const aim = aimAt(s, e, v);
      const dx = aim.x - s.x, dy = aim.y - s.y;
      const len = Math.max(1, isqrt(dx * dx + dy * dy));
      const aura = auraOf(o);
      const life = Math.max(1, Math.ceil((st.sentryRange * 3) / 2 / v));
      const p = makeProj(o.id, 'nail', s.x, s.y, Math.round((dx * v) / len), Math.round((dy * v) / len), st.sentryDmg + aura.dmg + buffOf(o).dmg,
        aura.armor && st.sentryDtype === 'sharp' ? 'magic' : st.sentryDtype, st.sentryPierce + aura.pierce, life, 0, st);
      s.cd += st.sentryInterval;
      emit({ type: 'fire', tick: S.tick, tower: o.id, projectile: p.id, kind: 'nail', sentry: s.id });
    }
  }

  /**
   * Caltrop Layer ff.: alle `trapEvery` Ticks eine Falle auf das vorderste freie Wegstueck in Reichweite (mindestens `TRAP_GAP` von
   * den eigenen Fallen, erst ab `MIN_SPAWN_PROGRESS`), solange weniger als `trapMax` eigene Fallen liegen. Die Falle ist eine
   * Caltrops-Falle der Powers (`TrapState`), zaehlt Pops aber dem Tinker (`owner`).
   */
  function layTrap(t: TowerState, st: Stats, tdec: number): void {
    if (t.trapCd > 0) t.trapCd = Math.max(0, t.trapCd - tdec);
    if (t.trapCd > 0) return;
    const mine = S.traps.filter((x) => x.owner === t.id);
    if (mine.length >= st.trapMax) return;
    const r2 = t.range * t.range;
    let bestProg = -1;
    let bestBranch = 0;
    map.paths.forEach((p, b) => {
      const smp = p.samples;
      for (let i = smp.length - 1; i >= 0; i--) {
        const prog = i * COVERAGE_STEP;
        if (prog < MIN_SPAWN_PROGRESS) break;
        if (dist2(t.x, t.y, smp[i].x, smp[i].y) > r2) continue;
        if (mine.some((m) => dist2(m.x, m.y, smp[i].x, smp[i].y) < TRAP_GAP * TRAP_GAP)) continue;
        if (prog > bestProg) {
          bestProg = prog;
          bestBranch = b;
        }
        break;
      }
    });
    if (bestProg < 0) {
      t.trapCd = 60000; // nichts frei: in einer Sekunde neu versuchen
      return;
    }
    const pos = positionAt(pathOf(bestBranch), bestProg);
    const tr: TrapState = {
      id: S.nextId++, kind: 'caltrops', progress: bestProg, branch: branchAt(map, pos.x, pos.y), x: pos.x, y: pos.y,
      charges: st.trapCharges, until: 0, owner: t.id, dmg: st.trapDmg,
    };
    S.traps.push(tr);
    t.trapCd = st.trapEvery * 1000;
    emit({ type: 'trapSet', tick: S.tick, id: tr.id, tower: t.id, x: tr.x, y: tr.y, charges: tr.charges });
  }

  function updateTowers(): void {
    tickDec.clear();
    const hero = heroTower();
    const hst = hero ? tstats.get(hero.id)! : null;
    // Elite Sniper: das beste Tempo-Angebot gilt für alle Longshots
    let elite = 0;
    for (const o of S.towers) if (o.type === 'longshot') elite = Math.max(elite, tstats.get(o.id)!.eliteBp);
    for (const t of S.towers) {
      const st = tstats.get(t.id)!;
      // Runde 15: vom Frost Wyrm eingefroren, der Turm tut nichts
      if (t.frozen > 0) {
        t.frozen--;
        t.windupLeft = 0;
        continue;
      }
      // Aura des Helden
      let speedBuff = 0, rangeBuff = 0;
      if (hero && hst && hst.buffRadius > 0 && t !== hero && dist2(t.x, t.y, hero.x, hero.y) <= hst.buffRadius * hst.buffRadius) {
        speedBuff = hst.buffSpeedBp;
        rangeBuff = hst.buffRangeBp;
      }
      // Auren der Markets, Wissensbaum-Tempo, Elite Sniper (additiv in Basispunkten)
      const aura = AURA_ONLY.includes(t.type as TowerType) ? null : auraOf(t);
      if (aura) {
        speedBuff += aura.speedBp;
        rangeBuff += aura.rangeBp;
      }
      speedBuff += kmods.tempoBp?.[t.type as TowerType] ?? 0;
      if (t.type === 'longshot') speedBuff += elite;
      // Runde 14: Alchemist-Tränke (Timer, Permanent Brew) und Spring Blessing
      if (t.buffTicks > 0 && --t.buffTicks === 0) {
        t.buffDmg = 0;
        t.buffRangeBp = 0;
        t.buffSpeedBp = 0;
      }
      const bf = buffOf(t);
      speedBuff += bf.speedBp + bf.groveSpeedBp;
      rangeBuff += bf.rangeBp;
      // Runde 16: Overclock (Tinker)
      if (t.boostTicks > 0) {
        speedBuff += t.boostBp;
        if (--t.boostTicks === 0) t.boostBp = 0;
      }
      const tdec = Math.floor((1000 * (10000 + speedBuff)) / 10000);
      tickDec.set(t.id, tdec);
      t.range = AURA_ONLY.includes(t.type as TowerType) || st.range >= GLOBAL_RANGE || !rangeBuff ? st.range : Math.floor((st.range * (10000 + rangeBuff)) / 10000);
      t.camo = st.camo === 1 || !!aura?.camo;

      t.zone = st.zoneBp > 0 ? Math.floor((t.range * st.zoneBp) / 10000) : 0;
      const bonus = (aura?.dmg ?? 0) + bf.dmg;

      // Monster-Form (Transforming Tonic): 30 Schaden/s auf das stärkste Ziel in Reichweite
      if (t.monsterTicks > 0) {
        t.monsterTicks--;
        if (t.monsterTicks % MONSTER_EVERY === 0) {
          const m = pickTarget(t, t.range, true, 'strong');
          if (m) damage(m, MONSTER_HIT, 'magic', t.id);
        }
      }
      // Thornweaver: Wirbelwind wirft Nicht-Boss-Gegner zurück
      if (st.whirlEvery > 0) {
        if (t.whirlCd > 0) t.whirlCd--;
        if (t.whirlCd <= 0) {
          const hit = nearestUnhit(t.x, t.y, t.range, [], 9999).filter((o) => !etab[o.type].blimp);
          if (hit.length) {
            t.whirlCd = st.whirlEvery;
            for (const o of hit) {
              o.progress = Math.max(0, o.progress - st.whirlPx);
              o.frac = 0;
              const pos = positionAt(pathOf(o.branch), o.progress);
              o.x = pos.x;
              o.y = pos.y;
            }
            emit({ type: 'whirlwind', tick: S.tick, tower: t.id, x: t.x, y: t.y, radius: t.range, px: st.whirlPx, enemies: hit.map((o) => o.id) });
          }
        }
      }
      // Thornweaver: Kettenblitz im Takt
      if (st.zapN > 0) {
        if (t.zapCd > 0) t.zapCd--;
        if (t.zapCd <= 0) {
          const z = pickTarget(t, t.range, t.camo, t.target);
          if (z) {
            t.zapCd = st.zapInterval;
            lightning(t.x, t.y, z, st.zapN, st.zapRange, st.zapDmg + bonus + avatarBonus(st), t.id, [], true);
          }
        }
      }
      // Thornweaver: Ranke hält den vordersten freien Nicht-Boss-Gegner fest
      if (st.snareEvery > 0) {
        if (t.snareCd > 0) t.snareCd--;
        if (t.snareCd <= 0) {
          const v = pickTarget(t, t.range, t.camo, 'first', true, (o) => !etab[o.type].boss && !etab[o.type].immuneStun && o.stunTicks <= 0 && o.frozenTicks <= 0);
          if (v) {
            t.snareCd = st.snareEvery;
            v.stunTicks = Math.max(v.stunTicks, st.snareTicks);
            v.vineTicks = v.stunTicks;
            emit({ type: 'status', tick: S.tick, enemy: v.id, kind: 'snare' });
            emit({ type: 'vine', tick: S.tick, tower: t.id, enemy: v.id, x: v.x, y: v.y, ticks: st.snareTicks });
          }
        }
      }
      // Thornweaver: Dornenranken-Zone, 1x je Sekunde
      if (st.zoneDmg > 0) {
        if (t.zoneCd > 0) t.zoneCd--;
        if (t.zoneCd <= 0) {
          t.zoneCd = 60;
          let n = 0;
          for (const o of nearestUnhit(t.x, t.y, t.zone, [], 9999)) {
            if (damage(o, st.zoneDmg, 'magic', t.id)) n++;
          }
          if (n > 0) emit({ type: 'zone', tick: S.tick, tower: t.id, x: t.x, y: t.y, radius: t.zone, dmg: st.zoneDmg, hits: n });
        }
      }
      // Alchemist: Buff-Trank auf den Turm im Radius mit dem kürzesten Rest (Permanent Brew braucht keine Würfe)
      if (st.brewEvery > 0 && st.brewPerm === 0) {
        if (t.brewCd > 0) t.brewCd--;
        if (t.brewCd <= 0) {
          let target: TowerState | null = null;
          let tk = 0, td = 0;
          for (const o of S.towers) {
            if (o === t || o.type === 'market' || dist2(t.x, t.y, o.x, o.y) > t.range * t.range) continue;
            const d2 = dist2(t.x, t.y, o.x, o.y);
            if (!target || o.buffTicks < tk || (o.buffTicks === tk && d2 < td)) {
              target = o;
              tk = o.buffTicks;
              td = d2;
            }
          }
          if (target) {
            t.brewCd = st.brewEvery;
            const stronger = target.buffTicks > 0 && target.buffDmg + target.buffSpeedBp > st.brewDmg + st.brewSpeedBp;
            if (!stronger) {
              target.buffDmg = st.brewDmg;
              target.buffRangeBp = st.brewRangeBp;
              target.buffSpeedBp = st.brewSpeedBp;
            }
            target.buffTicks = Math.max(target.buffTicks, st.brewTicks);
            emit({ type: 'brew', tick: S.tick, tower: t.id, target: target.id, ticks: st.brewTicks, dmg: st.brewDmg, rangeBp: st.brewRangeBp, speedBp: st.brewSpeedBp });
          }
        }
      }
      // Alchemist: Shrink Potion
      if (st.shrinkEvery > 0) {
        if (t.shrinkCd > 0) t.shrinkCd--;
        if (t.shrinkCd <= 0) {
          const sh = pickTarget(t, t.range, true, 'strong', true, (o) => !etab[o.type].blimp && o.type !== 'red');
          if (sh) {
            t.shrinkCd = st.shrinkEvery;
            shrinkEnemy(t, sh);
          }
        }
      }

      // Frost-Aura
      if (st.auraSlowBp > 0) {
        const brittle = st.brittle === 1;
        for (const e of nearestUnhit(t.x, t.y, t.range, [], 9999)) {
          const bp = etab[e.type].boss ? st.auraBossSlowBp : etab[e.type].blimp ? Math.floor(st.auraSlowBp / 2) : st.auraSlowBp;
          if (bp > 0) applySlow(e, bp, 3, brittle, true);
        }
      }
      if (st.auraDmg > 0) {
        if (t.auraCd > 0) t.auraCd--;
        if (t.auraCd <= 0) {
          t.auraCd = st.auraInterval;
          const list = nearestUnhit(t.x, t.y, t.range, [], 9999).sort((a, b) => b.progress - a.progress || a.id - b.id).slice(0, st.auraMax);
          for (const e of list) damage(e, st.auraDmg, 'cold', t.id);
        }
      }
      // Donnerschlag
      if (st.thunderInterval > 0) {
        if (t.thunderCd > 0) t.thunderCd--;
        if (t.thunderCd <= 0) {
          const e = pickTarget(t, t.range, t.camo, 'strong');
          if (e) {
            t.thunderCd = st.thunderInterval;
            emit({ type: 'chain', tick: S.tick, tower: t.id, points: [[e.x, e.y - 120000], [e.x, e.y]], dmg: st.thunderDmg });
            damage(e, st.thunderDmg, 'energy', t.id);
          }
        }
      }

      // Runde 16: Tinker baut Sentries und legt Fallen
      if (st.sentryN > 0) buildSentry(t, st, tdec);
      if (st.trapMax > 0) layTrap(t, st, tdec);

      if (st.atk === 'none') continue;
      let dec = tdec;
      if (t.type === 'ranger' && S.rainLeft > 0) dec *= 3;
      if (t.type === 'longshot' && S.focusLeft > 0) dec *= 2;
      t.cd -= dec;
      if (t.cd < -dec) t.cd = -dec;
      if (t.attackTick > 0) {
        t.attackTick++;
        if (t.attackTick > ATTACK_ANIM) t.attackTick = 0;
      }
      if (t.windupLeft > 0) {
        t.windupLeft--;
        if (t.windupLeft === 0) doFire(t, st);
      }
      if (t.windupLeft === 0 && t.cd <= 0) {
        const e = pickTarget(t, t.range, t.camo, t.target);
        if (e) {
          t.windupTarget = e.id;
          t.windupLeft = Math.max(1, Math.min(WINDUP, Math.floor(st.interval / 2000)));
          t.cd += st.interval;
          t.attackTick = 1;
          t.facing = facingOf(e.x - t.x, e.y - t.y);
          emit({ type: 'windup', tick: S.tick, tower: t.id, target: e.id });
        }
      }
    }
  }

  // ================= Projektile =================

  function endBurst(p: ProjectileState, st: Stats, at: EnemyState): void {
    if (p.sub === 0 && st.endR > 0) explodeAt(at.x, at.y, st.endR, st.endDmg, 'explosive', st.endMax, p.owner, st, 'star', 0, 0, p.hit, false);
    else if (p.sub === 1 && p.kind === 'frag' && st.fragExplR > 0) explodeAt(at.x, at.y, st.fragExplR, st.fragExplDmg, 'explosive', 6, p.owner, null, 'mini', 0, 0, p.hit);
  }

  /** Ricochet (Longshot C2): sofort auf `ricochetN` weitere Gegner, je Sprung 1 Schaden weniger (mindestens 1). */
  function ricochet(p: ProjectileState, from: EnemyState, st: Stats): void {
    const points: [number, number][] = [[from.x, from.y]];
    let cur = from;
    for (let i = 1; i <= st.ricochetN; i++) {
      const next = nearestUnhit(cur.x, cur.y, st.ricochetRange, [from.id, ...p.hit], 1)[0];
      if (!next) break;
      const created: number[] = [];
      points.push([next.x, next.y]);
      p.hit.push(next.id);
      damage(next, Math.max(1, p.dmg - i), p.dtype, p.owner, created);
      for (const c of created) p.hit.push(c);
      cur = next;
    }
    if (points.length >= 2) emit({ type: 'ricochet', tick: S.tick, tower: p.owner, points, dmg: p.dmg });
  }

  function hitEnemy(p: ProjectileState, e: EnemyState, st: Stats): void {
    p.hit.push(e.id);
    p.pierce--;
    const created: number[] = [];
    const amount = p.dmg + (p.sub === 0 ? bonusFor(e, st) : 0);
    const dealt = damage(e, amount, p.dtype, p.owner, created);
    for (const c of created) p.hit.push(c);
    if (p.sub === 0) {
      if (dealt && !e.dead) {
        const boss = etab[e.type].boss;
        if (st.markTicks > 0 && boss) {
          // Crippling Shot: Boss wird nicht verlangsamt, sondern markiert
          if (e.markTicks <= 0) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'mark' });
          e.markTicks = Math.max(e.markTicks, st.markTicks);
          e.markBp = Math.max(e.markBp, st.markBp);
        } else if (st.slowBp > 0) applySlow(e, st.slowBp, st.slowTicks, st.brittle === 1);
        if (st.hitStunBoss > 0 && boss) applyStun(e, 0, st.hitStunBoss);
        if (st.burnDmg > 0) applyBurn(e, st.burnDmg, st.burnTicks, p.owner);
      }
      if (dealt && st.fragOnHit > 0) spawnFrags(e.x, e.y, st, p.owner, p.hit.slice());
      if (dealt && st.ricochetN > 0) ricochet(p, e, st);
      if (dealt && st.sparkN > 0) {
        lightning(e.x, e.y, null, st.sparkN, st.chainRange, st.sparkDmg, p.owner, [e.id, ...p.hit], true);
      }
      if (st.novaR > 0) {
        emit({ type: 'nova', tick: S.tick, x: e.x, y: e.y, radius: st.novaR });
        const others = nearestUnhit(e.x, e.y, st.novaR, p.hit, st.novaMax);
        for (const o of others) {
          if (damage(o, st.novaDmg, 'cold', p.owner)) applySlow(o, st.slowBp, st.slowTicks, st.brittle === 1);
        }
        if (st.fragN > 0) spawnFrags(e.x, e.y, st, p.owner, p.hit.slice());
        p.pierce = 0;
      }
    }
    if (p.pierce <= 0) endBurst(p, st, e);
  }

  function updateProjectiles(): void {
    const list = S.projectiles.slice();
    const removed = new Set<number>();
    for (const p of list) {
      const st = pstats.get(p)!;
      if (p.age < 0) {
        // frisch abgeschossen: erst im nächsten Tick unterwegs
        p.age = 0;
        continue;
      }
      if (p.arc) {
        p.age++;
        const flight = p.life;
        p.arc.t = Math.min(10000, Math.floor((10000 * p.age) / flight));
        p.x = p.arc.x0 + Math.trunc(((p.arc.x1 - p.arc.x0) * p.arc.t) / 10000);
        p.y = p.arc.y0 + Math.trunc(((p.arc.y1 - p.arc.y0) * p.arc.t) / 10000);
        if (p.age >= flight) {
          if (st.atk === 'potion') potionLand(p, st);
          else explodeAt(p.arc.x1, p.arc.y1, st.radius, p.dmg, p.dtype, st.maxT, p.owner, st, 'bomb', st.stun, st.stunBoss);
          if (st.atk !== 'potion' && st.fragN > 0) spawnFrags(p.arc.x1, p.arc.y1, st, p.owner, []);
        } else continue;
        removed.add(p.id);
        continue;
      }
      const px = p.x, py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.age++;
      p.life--;
      // Sweep-Kollision: Segment (px,py)-(x,y) gegen Gegnerkreise
      const minx = Math.min(px, p.x) - 24000, maxx = Math.max(px, p.x) + 24000;
      const miny = Math.min(py, p.y) - 24000, maxy = Math.max(py, p.y) + 24000;
      const cand = queryBox(minx, miny, maxx, maxy);
      const dx = p.x - px, dy = p.y - py;
      const len2 = dx * dx + dy * dy;
      const hits: { e: EnemyState; t: number }[] = [];
      for (const e of cand) {
        if (p.hit.includes(e.id)) continue;
        const rr = etab[e.type].radius + PROJ_RADIUS;
        const ex = e.x - px, ey = e.y - py;
        const dot = ex * dx + ey * dy;
        let d2: number;
        if (len2 === 0 || dot <= 0) d2 = ex * ex + ey * ey;
        else if (dot >= len2) d2 = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
        else {
          const cross = ex * dy - ey * dx;
          d2 = (cross * cross) / len2;
        }
        if (d2 <= rr * rr) hits.push({ e, t: len2 === 0 ? 0 : dot / len2 });
      }
      hits.sort((a, b) => a.t - b.t || a.e.id - b.e.id);
      for (const h of hits) {
        if (p.pierce <= 0) break;
        if (h.e.dead || p.hit.includes(h.e.id)) continue;
        hitEnemy(p, h.e, st);
      }
      const out = p.x < -150000 || p.x > 800000 || p.y < -150000 || p.y > 520000;
      if (!(p.pierce > 0 && p.life > 0 && !out)) removed.add(p.id);
    }
    if (removed.size) S.projectiles = S.projectiles.filter((p) => !removed.has(p.id));
  }

  // ================= Gegner =================

  function leak(e: EnemyState): void {
    if (S.gateLeft > 0) {
      // Sturdy Gate: dieses Leck kostet nichts
      S.gateLeft--;
      e.dead = true;
      emit({ type: 'gate', tick: S.tick, enemy: e.id, etype: e.type });
      return;
    }
    const lost = e.hp + kidsRbe(e.type, e.fortified, e.round);
    e.dead = true;
    S.lives = Math.max(0, S.lives - lost);
    S.stats.leaked += lost;
    emit({ type: 'leak', tick: S.tick, enemy: e.id, etype: e.type, lives: S.lives });
  }

  function removeTrap(t: TrapState, reason: 'spent' | 'expired'): void {
    S.traps = S.traps.filter((x) => x !== t);
    emit({ type: 'trapGone', tick: S.tick, id: t.id, kind: t.kind, reason });
  }

  /** Gegner ist im Tick von `a` nach `b` (Wegfortschritt) gelaufen: Fallen in (a, b] in Wegreihenfolge auslösen. */
  function crossTraps(e: EnemyState, a: number, b: number): void {
    const hit = S.traps.filter((t) => (t.branch < 0 || t.branch === e.branch) && t.progress > a && t.progress <= b).sort((x, y) => x.progress - y.progress || x.id - y.id);
    for (const t of hit) {
      if (e.dead) return;
      if (t.kind === 'caltrops') {
        damage(e, t.dmg > 0 ? t.dmg : DATA.powers.caltrops.params.damage, 'magic', t.owner);
      } else {
        const d = etab[e.type];
        if (d.blimp || d.immuneCold || d.immuneSlow || e.frozenTicks > 0) continue;
        e.frozenTicks = DATA.powers.frostTrap.params.freezeTicks;
        emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'freeze' });
      }
      t.charges--;
      emit({ type: 'trap', tick: S.tick, id: t.id, kind: t.kind, charges: t.charges });
      if (t.charges <= 0) removeTrap(t, 'spent');
    }
  }

  /** Frosthauch des Frost Wyrm: alle Tuerme im Umkreis stehen `BREATH_FREEZE` Ticks still. */
  function breath(e: EnemyState): void {
    const hit: number[] = [];
    for (const t of S.towers) {
      if (dist2(e.x, e.y, t.x, t.y) > BREATH_RADIUS * BREATH_RADIUS) continue;
      t.frozen = Math.max(t.frozen, BREATH_FREEZE);
      t.windupLeft = 0;
      hit.push(t.id);
    }
    emit({ type: 'bossBreath', tick: S.tick, enemy: e.id, etype: e.type, x: e.x, y: e.y, radius: BREATH_RADIUS, ticks: BREATH_FREEZE, towers: hit });
    for (const id of hit) emit({ type: 'towerFrozen', tick: S.tick, tower: id, ticks: BREATH_FREEZE, source: e.id });
  }

  function updateEnemies(): void {
    const list = S.enemies.slice();
    for (const e of list) {
      if (e.dead) continue;
      if (e.burnTicks > 0) {
        e.burnTicks--;
        if (e.burnTicks % 60 === 0) damage(e, e.burnDmg, 'magic', e.burnOwner);
        if (e.burnTicks === 0) e.burnDmg = 0;
        if (e.dead) continue;
      }
      if (e.slowTicks > 0 && --e.slowTicks === 0) e.slowBp = 0;
      if (e.hasteTicks > 0) e.hasteTicks--;
      // Runde 15: Regrow (alle 3 s eine Schicht, bis zum Ursprungstyp) und Frosthauch des Frost Wyrm
      if (e.regrowTo !== null) {
        const ri = LADDER.indexOf(e.type);
        if (ri >= 0 && LADDER.indexOf(e.regrowTo) > ri) {
          if (--e.regrowTicks <= 0) {
            const to = LADDER[ri + 1];
            emit({ type: 'regrow', tick: S.tick, enemy: e.id, from: e.type, to, x: e.x, y: e.y });
            e.type = to;
            e.hp = hpOf(to, e.fortified, e.round);
            e.maxHp = e.hp;
            e.damageStage = 0;
            e.regrowTicks = REGROW_TICKS;
          }
        } else e.regrowTicks = REGROW_TICKS;
      }
      if (e.bossCd > 0 && --e.bossCd === 0) {
        e.bossCd = BREATH_EVERY;
        breath(e);
      }
      if (e.brittleTicks > 0) e.brittleTicks--;
      if (e.markTicks > 0 && --e.markTicks === 0) e.markBp = 0;
      if (e.goldTicks > 0) e.goldTicks--;
      if (e.vineTicks > 0) e.vineTicks--;
      if (e.frozenTicks > 0) {
        e.frozenTicks--;
        continue;
      }
      if (e.stunTicks > 0) {
        e.stunTicks--;
        continue;
      }
      const before = e.progress;
      const ep = pathOf(e.branch);
      const f = e.frac + enemySpeed(e);
      e.progress += Math.floor(f / 1000);
      e.frac = f % 1000;
      if (e.progress > ep.length) e.progress = ep.length;
      const pos = positionAt(ep, e.progress);
      e.x = pos.x;
      e.y = pos.y;
      if (S.traps.length && e.progress > before) {
        crossTraps(e, before, e.progress);
        if (e.dead) continue;
      }
      if (S.walls.length && e.progress > before) {
        crossWalls(e, before, e.progress);
        if (e.dead) continue;
      }
      if (e.progress >= ep.length) {
        leak(e);
        continue;
      }
    }
  }

  // ================= Runden =================

  function startRoundInternal(): void {
    S.round++;
    for (const g of roundGroups(S.round)) {
      S.groups.push({
        round: S.round, type: g.type, camo: !!g.camo, regrow: !!g.regrow, fortified: !!g.fortified,
        lane: g.lane === undefined ? -1 : g.lane % nBranches, spawned: 0, left: g.n,
        next: S.tick + Math.floor((g.startMs * 60) / 1000), gap: Math.max(1, Math.floor((g.gapMs * 60) / 1000)),
      });
    }
    S.activeRounds.push(S.round);
    S.phase = 'wave';
    emit({ type: 'roundStart', tick: S.tick, round: S.round });
  }

  function spawnTick(): void {
    let any = false;
    for (const g of S.groups) {
      while (g.left > 0 && S.tick >= g.next) {
        spawnEnemy(g.type, 0, g.camo, g.round, false, g.lane >= 0 ? g.lane : g.spawned % nBranches, g.fortified, g.regrow ? g.type : null);
        g.spawned++;
        g.left--;
        g.next += g.gap;
      }
      if (g.left === 0) any = true;
    }
    if (any) S.groups = S.groups.filter((g) => g.left > 0);
  }

  function grantHeroXp(amount: number): void {
    const h = heroTower();
    if (!h) return;
    h.heroXp += kmods.heroXpBp ? Math.floor((amount * (10000 + kmods.heroXpBp)) / 10000) : amount;
    const lv = DATA.hero[h.type as HeroType].levels;
    let changed = false;
    while (h.heroLevel < 20 && h.heroXp >= lv[h.heroLevel].xp) {
      h.heroLevel++;
      changed = true;
      emit({ type: 'heroLevel', tick: S.tick, tower: h.id, level: h.heroLevel });
    }
    if (changed) refreshTower(h);
  }

  /** Market-Einkommen am Rundenende (Runde 13): Zinsen auf das Konto, Einnahmen dazu, Deckel; Überlauf geht als Geld raus. */
  function payMarkets(r: number): void {
    const markets = S.towers.filter((t) => t.type === 'market');
    // Runde 16: der Bellringer (Toll of Coin) zahlt wie ein Market, aber ohne Bank, Market Savvy und Golden Exchange
    for (const m of S.towers.filter((t) => t.type === 'market' || t.type === 'bellringer')) {
      const st = tstats.get(m.id)!;
      if (st.income <= 0 && m.bank <= 0) continue;
      let golden = 0;
      if (m.type === 'market') for (const o of markets) if (o !== m) golden = Math.max(golden, tstats.get(o.id)!.goldenBp);
      const gross = earn(Math.floor((st.income * (10000 + (m.type === 'market' ? (kmods.marketBp ?? 0) + golden : 0))) / 10000));
      let amount = gross;
      let cash = gross;
      if (st.bankOn > 0) {
        const interest = Math.floor((m.bank * (st.bankRateBp + (kmods.bankRateBp ?? 0))) / 10000);
        const total = m.bank + interest + gross;
        m.bank = Math.min(st.bankCap, total);
        cash = total - m.bank;
        amount = gross + interest;
      }
      S.cash += cash;
      S.stats.income += amount;
      if (amount > 0 || cash > 0) emit({ type: 'income', tick: S.tick, tower: m.id, round: r, amount, cash, bank: m.bank });
    }
  }

  /** Rundenertrag der Thornweaver (World Tree, Jungle's Bounty) und Field Medic (Wissensbaum), je Rundenende. */
  function payGrove(r: number): void {
    for (const t of S.towers) {
      if (t.type !== 'thornweaver') continue;
      const st = tstats.get(t.id)!;
      const gold = earn(st.roundGold + st.bountyGold);
      if (gold > 0) {
        S.cash += gold;
        S.stats.groveGold += gold;
        emit({ type: 'income', tick: S.tick, tower: t.id, round: r, amount: gold, cash: gold, bank: 0 });
      }
      if (st.roundLives > 0) {
        S.lives += st.roundLives;
        S.stats.healed += st.roundLives;
        emit({ type: 'heal', tick: S.tick, tower: t.id, lives: st.roundLives });
      }
    }
    if (kmods.roundLives) {
      S.lives += kmods.roundLives;
      S.stats.healed += kmods.roundLives;
      emit({ type: 'heal', tick: S.tick, tower: 0, lives: kmods.roundLives });
    }
  }

  function endRound(r: number): void {
    const bonus = earn(roundBonus(r) + (r <= 10 ? (kmods.earlyBonus ?? 0) : 0));
    S.cash += bonus;
    S.roundsCleared++;
    S.activeRounds = S.activeRounds.filter((x) => x !== r);
    for (const t of S.traps.slice()) if (t.until > 0 && t.until <= r) removeTrap(t, 'expired');
    payMarkets(r);
    payGrove(r);
    grantHeroXp(60 + 20 * r);
    emit({ type: 'roundEnd', tick: S.tick, round: r, bonus });
    distributeTowerXp(r);
  }

  /**
   * Turm-XP-Topf am Rundenende (Runde 11b): (potBase + potPerRound x Runde) x Schwierigkeit x Fast Learner, ganzzahlig.
   * Je Typ (ohne Held): 50 % nach investiertem Geld der stehenden Türme, 50 % nach den Pops seit dem letzten Rundenende.
   * Fehlt eine Hälfte (nichts investiert / nichts geknackt), geht der ganze Topf nach der anderen. Rest nach der Rundung
   * an den Typ mit dem größten Anteil (Gleichstand: Reihenfolge ranger, bombardier, frostcaller).
   */
  function distributeTowerXp(r: number): void {
    if (!opts.towerXp) return;
    const spent = perTower(() => 0);
    for (const t of S.towers) if (!isHero(t.type)) spent[t.type] += t.spent;
    const pops = S.roundPops;
    const spentTot = TOWER_TYPES.reduce((a, k) => a + spent[k], 0);
    const popsTot = TOWER_TYPES.reduce((a, k) => a + pops[k], 0);
    S.roundPops = perTower(() => 0);
    if (spentTot === 0 && popsTot === 0) return;
    const pot = towerXpPot(r, opts.difficulty, kmods.towerXpBp ?? 0);
    const split = splitTowerXp(pot, spent, pops);
    const out: Partial<Record<TowerType, number>> = {};
    for (const t of TOWER_TYPES) {
      if (split[t] <= 0) continue;
      out[t] = split[t];
      S.towerXp[t] += split[t];
      S.towerXpGained[t] += split[t];
    }
    if (pot <= 0) return;
    emit({ type: 'towerXp', tick: S.tick, round: r, pot, gains: out });
  }

  /** Tote Gegner aus der Liste nehmen (nach jedem Tick und nach jedem Befehl). */
  function sweep(): void {
    if (S.enemies.some((e) => e.dead)) {
      for (const e of S.enemies) if (e.dead) emap.delete(e.id);
      S.enemies = S.enemies.filter((e) => !e.dead);
    }
  }

  function finishTick(): void {
    sweep();
    if (S.lives <= 0) {
      S.phase = 'lost';
      emit({ type: 'gameOver', tick: S.tick, result: 'lost', round: S.round });
      return;
    }
    if (S.activeRounds.length) {
      const present = new Set<number>();
      for (const e of S.enemies) present.add(e.round);
      for (const g of S.groups) present.add(g.round);
      for (const r of S.activeRounds.slice()) if (!present.has(r)) endRound(r);
    }
    if (S.round >= maxRound && !S.freeplay && S.activeRounds.length === 0 && S.groups.length === 0 && S.enemies.length === 0) {
      S.phase = 'won';
      emit({ type: 'gameOver', tick: S.tick, result: 'won', round: S.round });
      return;
    }
    S.phase = S.enemies.length > 0 || S.groups.length > 0 ? 'wave' : 'build';
  }

  function tick(): void {
    if (S.phase === 'won' || S.phase === 'lost') return;
    // 1. Auto-Start, Spawns
    if (S.autoStart && S.round > baseRound && (S.freeplay || S.round < maxRound) && S.groups.length === 0) startRoundInternal();
    spawnTick();
    // 2. Fähigkeits-Abklingzeiten
    for (const a of S.abilities) if (!a.ready && --a.cdLeft <= 0) { a.cdLeft = 0; a.ready = true; }
    if (S.rainLeft > 0) S.rainLeft--;
    if (S.focusLeft > 0) S.focusLeft--;
    if (S.warpLeft > 0) S.warpLeft--;
    if (S.forgeLeft > 0) S.forgeLeft--;
    // 3. Gegner bewegen, Status
    updateEnemies();
    rebuildGrid();
    // 4. Türme
    updateTowers();
    // 4b. Runde 16: Sentries der Tinker
    updateSentries();
    // 5. Projektile
    updateProjectiles();
    // 5b. Runde 14: Säurepfützen, Lebensdauer der Wände
    updatePuddles();
    // 6. Aufräumen, Runden, Sieg/Niederlage
    finishTick();
    S.tick++;
  }

  // ================= Befehle =================

  function canPlace(type: TowerType | HeroType, x: number, y: number): PlaceCheck {
    return canPlaceCore(type, x, y, true);
  }

  function canPlaceCore(type: TowerType | HeroType, x: number, y: number, needCash: boolean): PlaceCheck {
    if (!isHero(type) && !TOWER_TYPES.includes(type)) return { ok: false, reason: 'unknown-tower' };
    if (opts.unlocks && !opts.unlocks.towers.includes(type)) return { ok: false, reason: 'locked' };
    if (!modeAllows(mode, type)) return { ok: false, reason: 'mode-locked' };
    if (isHero(type) && type !== heroId) return { ok: false, reason: 'wrong-hero' };
    if (isHero(type) && S.heroPlaced) return { ok: false, reason: 'hero-limit' };
    const r = towerDef(type).radius * 1000;
    const b = map.build;
    if (x - r < b.x0 || x + r > b.x1 || y - r < b.y0 || y + r > b.y1) return { ok: false, reason: 'out-of-bounds' };
    if (!clearOfPaths(map, x, y, map.halfWidth + r)) return { ok: false, reason: 'on-path' };
    if (!isHero(type) && DATA.towers[type].placement === 'water') {
      // Runde 16: Wasserturm - der ganze Turmkreis muss in einem Wasser-Polygon liegen (Lava ist kein Wasser)
      if (!map.water.some((poly) => circleInPolygon(x, y, r, poly))) return { ok: false, reason: 'needs-water' };
    } else {
      for (const poly of map.water) {
        if (pointInPolygon(x, y, poly) || pointInPolygon(x + r, y, poly) || pointInPolygon(x - r, y, poly) || pointInPolygon(x, y + r, poly) || pointInPolygon(x, y - r, poly)) {
          return { ok: false, reason: 'water' };
        }
      }
    }
    for (const poly of map.lava) {
      if (pointInPolygon(x, y, poly) || pointInPolygon(x + r, y, poly) || pointInPolygon(x - r, y, poly) || pointInPolygon(x, y + r, poly) || pointInPolygon(x, y - r, poly)) {
        return { ok: false, reason: 'lava' };
      }
    }
    for (const bl of map.blockers) if (dist2(x, y, bl.x, bl.y) < (bl.r + r) * (bl.r + r)) return { ok: false, reason: 'blocked' };
    for (const t of S.towers) {
      const rr = towerDef(t.type).radius * 1000 + r;
      if (dist2(x, y, t.x, t.y) < rr * rr) return { ok: false, reason: 'overlap' };
    }
    if (needCash && S.cash < priceOf(type)) return { ok: false, reason: 'no-cash' };
    return { ok: true };
  }

  function tiersAllowed(t: Tiers): boolean {
    const used = t.filter((v) => v > 0).length;
    const high = t.filter((v) => v >= 3).length;
    return used <= 2 && high <= 1;
  }

  function upgradeBlock(t: TowerState, path_: 0 | 1 | 2, price: number): string | undefined {
    if (isHero(t.type)) return 'hero';
    const cur = t.tiers[path_];
    if (cur >= 5) return 'maxed';
    const nt = t.tiers.slice() as Tiers;
    nt[path_]++;
    if (!tiersAllowed(nt)) return 'crosspath';
    if (S.maxTier[t.type as TowerType][path_] < nt[path_]) return 'locked';
    if (S.cash < price) return 'no-cash';
    return undefined;
  }

  function upgradeInfo(towerId: number): UpgradeInfo[] {
    const t = towerById(towerId);
    if (!t || isHero(t.type)) return [];
    const d = DATA.towers[t.type];
    return ([0, 1, 2] as const).map((p) => {
      const cur = t.tiers[p];
      const unlocked = S.maxTier[t.type as TowerType][p];
      if (cur >= 5) return { path: p, current: cur, next: null, name: '', desc: '', price: 0, unlocked, unlockCost: 0, revealed: true, canBuy: false, reason: 'maxed' };
      const tier = d.paths[p].tiers[cur];
      const price = upgradePrice(t, p, cur + 1);
      const reason = upgradeBlock(t, p, price);
      const revealed = cur + 1 === 1 || unlocked >= cur;
      return {
        path: p, current: cur, next: cur + 1, name: revealed ? tier.name : '', desc: revealed ? tier.desc : '', price, unlocked,
        unlockCost: unlocked > cur ? 0 : DATA.xp.unlockCost[cur], revealed, canBuy: reason === undefined, ...(reason ? { reason } : {}),
      };
    });
  }

  /** Freischalt-Menü: je Pfad 5 Stufen, Text nur für sichtbare Stufen (Stufe 1 und die nach einer freigeschalteten). */
  function unlockInfo(type: TowerType): UnlockPathInfo[] {
    const d = DATA.towers[type];
    if (!d) return [];
    const towerFree = !opts.unlocks || opts.unlocks.towers.includes(type);
    return ([0, 1, 2] as const).map((p) => {
      const unlocked = S.maxTier[type][p];
      const next = unlocked >= 5 ? null : unlocked + 1;
      let reason: string | undefined;
      if (next === null) reason = 'maxed';
      else if (!towerFree) reason = 'locked';
      else if (S.towerXp[type] < DATA.xp.unlockCost[next - 1]) reason = 'no-xp';
      return {
        path: p,
        name: d.paths[p].name,
        unlocked,
        next,
        ...(reason ? { reason } : {}),
        tiers: d.paths[p].tiers.map((tier, i) => {
          const revealed = i === 0 || unlocked >= i;
          return { tier: i + 1, revealed, unlocked: unlocked >= i + 1, name: revealed ? tier.name : '', desc: revealed ? tier.desc : '', cost: DATA.xp.unlockCost[i] };
        }),
      };
    });
  }

  const sellValue = (id: number): number => {
    const t = towerById(id);
    return t ? Math.ceil((t.spent * sellRate) / 10000) + t.bank : 0;
  };

  function marketInfo(id: number): MarketInfo | null {
    const t = towerById(id);
    if (!t || t.type !== 'market') return null;
    const st = tstats.get(t.id)!;
    let golden = 0;
    for (const o of S.towers) if (o !== t && o.type === 'market') golden = Math.max(golden, tstats.get(o.id)!.goldenBp);
    const rate = st.bankOn > 0 ? st.bankRateBp + (kmods.bankRateBp ?? 0) : 0;
    return {
      income: Math.floor((st.income * (10000 + (kmods.marketBp ?? 0) + golden)) / 10000),
      hasBank: st.bankOn > 0, bank: t.bank, bankRateBp: rate, bankCap: st.bankCap,
      nextInterest: Math.floor((t.bank * rate) / 10000), grantCash: st.grantCash, radius: st.range,
    };
  }

  function useAbility(id: AbilityId): CommandResult {
    const a = S.abilities.find((x) => x.id === id);
    if (!a) return { ok: false, reason: 'no-ability' };
    if (!a.ready) return { ok: false, reason: 'cooldown' };
    if (id === 'arrowRain') {
      let dur = 0;
      for (const t of S.towers) if (t.type === 'ranger') dur = Math.max(dur, tstats.get(t.id)!.rainDur);
      S.rainLeft = dur;
      emit({ type: 'ability', tick: S.tick, id });
    } else if (id === 'absoluteZero') {
      let dur = 0, boss = 0;
      for (const t of S.towers) if (t.type === 'frostcaller') { const st = tstats.get(t.id)!; dur = Math.max(dur, st.azDur); boss = Math.max(boss, st.azBoss); }
      emit({ type: 'ability', tick: S.tick, id });
      for (const e of S.enemies) {
        if (e.dead || e.progress < MIN_SPAWN_PROGRESS || etab[e.type].immuneCold) continue;
        // Blimps (Gloomship) lassen sich nicht einfrieren, Bosse nur kurz (azBoss)
        const f = etab[e.type].boss ? boss : etab[e.type].blimp ? 0 : dur;
        if (f <= 0) continue;
        if (e.frozenTicks <= 0) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'freeze' });
        e.frozenTicks = Math.max(e.frozenTicks, f);
      }
    } else if (id === 'wallOfTrees') {
      let first: WallState | null = null;
      for (const t of S.towers) {
        if (t.type !== 'thornweaver' || tstats.get(t.id)!.wallRbe <= 0) continue;
        const w = placeWall(t);
        first ??= w;
      }
      if (!first) return { ok: false, reason: 'no-target' };
      emit({ type: 'ability', tick: S.tick, id, x: first.x, y: first.y });
    } else if (id === 'tonic') {
      emit({ type: 'ability', tick: S.tick, id });
      for (const a of S.towers) {
        const as = tstats.get(a.id)!;
        if (a.type !== 'alchemist' || as.tonicDur <= 0) continue;
        a.monsterTicks = Math.max(a.monsterTicks, as.tonicDur);
        emit({ type: 'monster', tick: S.tick, tower: a.id, source: a.id, ticks: as.tonicDur });
        if (as.tonicOthers > 0) {
          const near = S.towers
            .filter((o) => o !== a && o.type !== 'market' && dist2(a.x, a.y, o.x, o.y) <= a.range * a.range)
            .sort((p, q) => dist2(a.x, a.y, p.x, p.y) - dist2(a.x, a.y, q.x, q.y) || p.id - q.id)
            .slice(0, as.tonicOthers);
          for (const o of near) {
            o.monsterTicks = Math.max(o.monsterTicks, as.tonicDur);
            emit({ type: 'monster', tick: S.tick, tower: o.id, source: a.id, ticks: as.tonicDur });
          }
        }
      }
    } else if (id === 'alarm') {
      // Runde 16: Bellringer - alle Gegner stehen still (Boss kuerzer), Dusk Siren: Gegner nehmen kurz +1 Schaden
      let stun = 0, boss = 0, brittle = 0;
      for (const t of S.towers) {
        if (t.type !== 'bellringer') continue;
        const st = tstats.get(t.id)!;
        stun = Math.max(stun, st.alarmStun);
        boss = Math.max(boss, st.alarmBoss);
        brittle = Math.max(brittle, st.alarmBrittle);
      }
      emit({ type: 'ability', tick: S.tick, id });
      for (const e of S.enemies) {
        if (e.dead || e.progress < MIN_SPAWN_PROGRESS) continue;
        applyStun(e, stun, boss);
        if (brittle > 0) e.brittleTicks = Math.max(e.brittleTicks, brittle);
      }
    } else if (id === 'overclock') {
      // Runde 16: Tinker - die naechsten `ocMax` Tuerme mit Angriff im Radius des Tinkers (er selbst zuerst) bekommen Zusatztempo
      emit({ type: 'ability', tick: S.tick, id });
      for (const a of S.towers) {
        const as = tstats.get(a.id)!;
        if (a.type !== 'tinker' || as.ocDur <= 0) continue;
        const near = S.towers
          .filter((o) => tstats.get(o.id)!.atk !== 'none' && dist2(a.x, a.y, o.x, o.y) <= a.range * a.range)
          .sort((p, q) => dist2(a.x, a.y, p.x, p.y) - dist2(a.x, a.y, q.x, q.y) || p.id - q.id)
          .slice(0, as.ocMax);
        for (const o of near) {
          o.boostTicks = Math.max(o.boostTicks, as.ocDur);
          o.boostBp = Math.max(o.boostBp, as.ocBp);
          emit({ type: 'overclock', tick: S.tick, tower: o.id, source: a.id, ticks: as.ocDur, bp: as.ocBp });
        }
      }
    } else if (id === 'focus') {
      let dur = 0;
      for (const t of S.towers) if (t.type === 'longshot') dur = Math.max(dur, tstats.get(t.id)!.focusDur);
      S.focusLeft = dur;
      emit({ type: 'ability', tick: S.tick, id });
    } else if (id === 'supplyDrop') {
      // Jeder Longshot mit Supply Drop liefert seine Kiste (eine gemeinsame Abklingzeit, wie bei Arrow Rain)
      let total = 0;
      let at: TowerState | undefined;
      for (const t of S.towers) {
        const st = tstats.get(t.id)!;
        if (t.type === 'longshot' && st.supplyCash > 0) {
          total += st.supplyCash;
          at ??= t;
        }
      }
      total = earn(total);
      S.cash += total;
      S.stats.abilityCash += total;
      emit({ type: 'ability', tick: S.tick, id, x: at?.x, y: at?.y, cash: total });
    } else if (id === 'grant') {
      let total = 0;
      let at: TowerState | undefined;
      for (const t of S.towers) {
        const st = tstats.get(t.id)!;
        if (t.type === 'market' && st.grantCash > 0) {
          total += st.grantCash;
          at ??= t;
        }
      }
      total = earn(total);
      S.cash += total;
      S.stats.abilityCash += total;
      emit({ type: 'ability', tick: S.tick, id, x: at?.x, y: at?.y, cash: total });
    } else {
      const h = heroTower();
      if (!h) return { ok: false, reason: 'no-ability' };
      const st = tstats.get(h.id)!;
      if (id === 'flare') {
        const e = pickTarget(h, h.range, true, 'strong', false);
        if (!e) return { ok: false, reason: 'no-target' };
        emit({ type: 'ability', tick: S.tick, id, x: e.x, y: e.y });
        // enttarnen (alle im Radius), dann Schaden an den nächsten flareMax
        const radius = st.flareR;
        for (const o of queryBox(e.x - radius - 30000, e.y - radius - 30000, e.x + radius + 30000, e.y + radius + 30000)) {
          const rr = radius + etab[o.type].radius;
          if (dist2(e.x, e.y, o.x, o.y) <= rr * rr && o.camo && !o.revealed) {
            o.revealed = true;
            emit({ type: 'status', tick: S.tick, enemy: o.id, kind: 'reveal' });
          }
        }
        explodeAt(e.x, e.y, radius, st.flareDmg, 'magic', st.flareMax, h.id, null, 'star');
      } else if (id === 'dawnbreak') {
        emit({ type: 'ability', tick: S.tick, id });
        for (const e of S.enemies.slice()) {
          if (e.dead || e.progress < MIN_SPAWN_PROGRESS) continue;
          damage(e, etab[e.type].boss ? st.dawnBoss : st.dawnDmg, 'magic', h.id);
        }
      } else if (id === 'anvilDrop') {
        // Bram L10: Amboss auf das staerkste Ziel in Reichweite, Flaechenschaden und Betaeubung
        const e = pickTarget(h, h.range, true, 'strong', false);
        if (!e) return { ok: false, reason: 'no-target' };
        emit({ type: 'ability', tick: S.tick, id, x: e.x, y: e.y });
        emit({ type: 'explode', tick: S.tick, x: e.x, y: e.y, radius: st.anvilR, kind: 'bomb' });
        const list: { o: EnemyState; d2: number }[] = [];
        for (const o of queryBox(e.x - st.anvilR - 30000, e.y - st.anvilR - 30000, e.x + st.anvilR + 30000, e.y + st.anvilR + 30000)) {
          const rr = st.anvilR + etab[o.type].radius;
          const d2 = dist2(e.x, e.y, o.x, o.y);
          if (d2 <= rr * rr) list.push({ o, d2 });
        }
        list.sort((a, b) => a.d2 - b.d2 || a.o.id - b.o.id);
        for (const { o } of list.slice(0, st.anvilMax)) {
          damage(o, etab[o.type].boss ? st.anvilBoss : st.anvilDmg, 'magic', h.id);
          applyStun(o, st.anvilStun, st.anvilStunBoss);
        }
      } else if (id === 'forgeOfDawn') {
        // Bram L20: alle Tuerme brechen Panzer (sharp trifft Ironshell, Zusatzschaden gegen Panzertraeger), solange die Schmiede brennt
        S.forgeLeft = st.forgeDur;
        emit({ type: 'ability', tick: S.tick, id });
      } else if (id === 'starfall') {
        // Sela L10: Strahl ueber den Weg im Radius der Heldin, jeder gesehene Gegner darin wird getroffen
        emit({ type: 'ability', tick: S.tick, id, x: h.x, y: h.y });
        let hits = 0;
        const r2 = h.range * h.range;
        for (const e of S.enemies.slice()) {
          if (e.dead || e.progress < MIN_SPAWN_PROGRESS || dist2(h.x, h.y, e.x, e.y) > r2) continue;
          if (damage(e, etab[e.type].boss ? st.starBoss : st.starDmg, 'magic', h.id)) hits++;
        }
        emit({ type: 'starfall', tick: S.tick, tower: h.id, x: h.x, y: h.y, radius: h.range, hits });
      } else if (id === 'eclipse') {
        // Sela L20: alle Gegner (auch Blimps, Bosse, Emberlinge) kurz mit halbem Tempo
        emit({ type: 'ability', tick: S.tick, id });
        for (const e of S.enemies) {
          if (e.dead || e.progress < MIN_SPAWN_PROGRESS) continue;
          applySlow(e, st.eclipseBp, st.eclipseDur, false, true, true);
        }
      } else return { ok: false, reason: 'no-ability' };
    }
    a.ready = false;
    a.cdLeft = a.cdTotal;
    return { ok: true };
  }

  /** Turm anlegen (Kasse und `place`-Event machen die Aufrufer). `spent` = Verkaufs-/XP-Grundlage. */
  function spawnTower(type: TowerType | HeroType, x: number, y: number, spent: number, tiers: Tiers): TowerState {
    const hero = isHero(type);
    const lvl = hero ? Math.max(1, Math.min(20, kmods.heroStartLevel ?? 1)) : 0;
    const t: TowerState = {
      id: S.nextId++, type, x, y, tiers: [...tiers] as Tiers, heroLevel: lvl,
      heroXp: hero ? DATA.hero[type].levels[lvl - 1].xp : 0, target: 'first', facing: 0, attackTick: 0, pops: 0, spent,
      camo: false, range: 0, cd: 0, windupLeft: 0, windupTarget: 0, shots: 0, auraCd: 0, thunderCd: 0, bank: 0,
      zone: 0, buffTicks: 0, buffDmg: 0, buffRangeBp: 0, buffSpeedBp: 0, monsterTicks: 0,
      zapCd: 0, whirlCd: 0, snareCd: 0, zoneCd: 0, brewCd: 0, shrinkCd: 0, frozen: 0, boostTicks: 0, boostBp: 0, sentryCd: 0, trapCd: 0,
    };
    S.towers.push(t);
    if (hero) S.heroPlaced = true;
    refreshTower(t);
    return t;
  }

  // ================= Powers (Runde 12) =================

  const isPowerKey = (k: unknown): k is PowerKey => typeof k === 'string' && (POWER_KEYS as readonly string[]).includes(k);
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

  /** Prüft einen Einsatz ohne etwas zu ändern. Reihenfolge der Gründe: unknown-power, no-power, used-this-round, dann Ziel/Voraussetzung. */
  function powerCheck(power: PowerKey, xIn?: number, yIn?: number): PlaceCheck {
    if (!isPowerKey(power)) return { ok: false, reason: 'unknown-power' };
    if (!MODES[mode].powers) return { ok: false, reason: 'mode-locked' };
    if (S.powers[power] <= 0) return { ok: false, reason: 'no-power' };
    if (S.powerUsedRound[power] === S.round && S.powerUses[power] >= Math.max(1, kmods.powerUses ?? 1)) return { ok: false, reason: 'used-this-round' };
    const d = DATA.powers[power];
    if (power === 'heroBoost') {
      const h = heroTower();
      if (!h) return { ok: false, reason: 'no-hero' };
      if (h.heroLevel >= 20) return { ok: false, reason: 'maxed' };
    }
    if (d.use === 'button') return { ok: true };
    if (!num(xIn) || !num(yIn)) return { ok: false, reason: 'invalid-target' };
    const x = Math.round(xIn), y = Math.round(yIn);
    if (d.use === 'target') {
      if (x < 0 || y < 0 || x > map.size[0] * 1000 || y > map.size[1] * 1000) return { ok: false, reason: 'invalid-target' };
      return { ok: true };
    }
    if (d.use === 'path') {
      const n = nearestOnPaths(map, x, y);
      if (n.d2 > map.halfWidth * map.halfWidth) return { ok: false, reason: 'not-on-path' };
      return { ok: true };
    }
    return canPlaceCore(d.tower!, x, y, false);
  }

  function usePower(cmd: Extract<Command, { type: 'power' }>): CommandResult {
    const chk = powerCheck(cmd.power, cmd.x, cmd.y);
    if (!chk.ok) return chk;
    const key = cmd.power;
    const d = DATA.powers[key];
    const x = num(cmd.x) ? Math.round(cmd.x) : undefined;
    const y = num(cmd.y) ? Math.round(cmd.y) : undefined;
    S.powers[key]--;
    S.powerUses[key] = S.powerUsedRound[key] === S.round ? S.powerUses[key] + 1 : 1;
    S.powerUsedRound[key] = S.round;
    S.stats.powersUsed[key]++;
    let id: number | undefined;
    switch (key) {
      case 'goldDrop':
        S.cash += earn(d.params.cash);
        emit({ type: 'power', tick: S.tick, power: key });
        break;
      case 'lanternBomb': {
        emit({ type: 'power', tick: S.tick, power: key, x, y });
        const r = d.params.radiusPx * 1000;
        emit({ type: 'explode', tick: S.tick, x: x!, y: y!, radius: r, kind: 'bomb' });
        const list: { e: EnemyState; d2: number }[] = [];
        for (const e of queryBox(x! - r - 30000, y! - r - 30000, x! + r + 30000, y! + r + 30000)) {
          const rr = r + etab[e.type].radius;
          const d2 = dist2(x!, y!, e.x, e.y);
          if (d2 <= rr * rr) list.push({ e, d2 });
        }
        list.sort((a, b) => a.d2 - b.d2 || a.e.id - b.e.id);
        for (const { e } of list.slice(0, d.params.maxTargets)) damage(e, etab[e.type].boss ? d.params.bossDamage : d.params.damage, 'explosive', 0);
        break;
      }
      case 'caltrops':
      case 'frostTrap': {
        const n = nearestOnPaths(map, x!, y!);
        const pos = positionAt(pathOf(n.branch), n.progress);
        const t: TrapState = {
          id: S.nextId++, kind: key, progress: n.progress, branch: branchAt(map, pos.x, pos.y), x: pos.x, y: pos.y, charges: d.params.charges,
          until: key === 'caltrops' ? S.round + d.params.extraRounds : 0, owner: 0, dmg: 0,
        };
        S.traps.push(t);
        id = t.id;
        emit({ type: 'power', tick: S.tick, power: key, x: pos.x, y: pos.y });
        break;
      }
      case 'timeWarp':
        S.warpLeft = d.params.durationTicks;
        emit({ type: 'power', tick: S.tick, power: key });
        break;
      case 'lanternOil':
        S.oilRound = S.round + d.params.extraRounds;
        emit({ type: 'power', tick: S.tick, power: key });
        break;
      case 'extraLives':
        S.lives += d.params.lives;
        emit({ type: 'power', tick: S.tick, power: key });
        break;
      case 'heroBoost': {
        const h = heroTower()!;
        const to = Math.min(20, h.heroLevel + d.params.levels);
        emit({ type: 'power', tick: S.tick, power: key });
        for (let l = h.heroLevel + 1; l <= to; l++) emit({ type: 'heroLevel', tick: S.tick, tower: h.id, level: l });
        h.heroLevel = to;
        h.heroXp = DATA.hero[h.type as HeroType].levels[to - 1].xp;
        refreshTower(h);
        id = h.id;
        break;
      }
      default: {
        // Insta-Warden: fertig ausgebauter Turm, gratis, Verkaufswert 0, ohne Prüfung der Stufen-Sperren
        const t = spawnTower(d.tower!, x!, y!, 0, d.tiers as Tiers);
        id = t.id;
        emit({ type: 'power', tick: S.tick, power: key, x, y });
        emit({ type: 'place', tick: S.tick, tower: t.id, ttype: t.type, cash: S.cash });
      }
    }
    return id === undefined ? { ok: true } : { ok: true, id };
  }

  function roundPreview(r: number): RoundPreview | null {
    if (!Number.isInteger(r) || r < 1 || r > 9999) return null;
    const groups: RoundPreview['groups'] = [];
    let rbe = 0, hasCamo = false, hasArmor = false, hasEmber = false, hasBoss = false, hasFrostling = false, hasBlimp = false, hasRegrow = false, hasFortified = false;
    const tree = (e: EnemyType, depth: number): void => {
      if (etab[e].armor) hasArmor = true;
      if (etab[e].immuneCold) hasEmber = true;
      if (etab[e].immuneExplosive) hasFrostling = true;
      if (etab[e].blimp) hasBlimp = true;
      if (depth < 10) for (const c of etab[e].children) tree(c, depth + 1);
    };
    for (const g of roundGroups(r)) {
      const camo = !!g.camo || etab[g.type].alwaysCamo, regrow = !!g.regrow, fortified = !!g.fortified;
      const old = groups.find((x) => x.type === g.type && x.camo === camo && x.regrow === regrow && x.fortified === fortified);
      if (old) old.n += g.n;
      else groups.push({ type: g.type, n: g.n, camo, regrow, fortified });
      rbe += g.n * treeRbe(g.type, fortified, r);
      if (camo) hasCamo = true;
      if (regrow) hasRegrow = true;
      if (fortified) hasFortified = true;
      if (etab[g.type].boss) hasBoss = true;
      tree(g.type, 0);
    }
    return { round: r, groups, rbe, hasCamo, hasArmor, hasEmber, hasBoss, hasFrostling, hasBlimp, hasRegrow, hasFortified };
  }

  function apply(cmd: Command): CommandResult {
    if (S.phase === 'won' && cmd.type === 'continue') {
      // Runde 15b: nach dem Sieg weiterspielen ("Continue in Freeplay"); ohne Medaillen-Einfluss
      S.freeplay = true;
      S.phase = 'build';
      emit({ type: 'continue', tick: S.tick, round: S.round });
      return { ok: true, id: S.round };
    }
    if (S.phase === 'won' || S.phase === 'lost') return { ok: false, reason: 'game-over' };
    if (cmd.type === 'continue') return { ok: false, reason: 'not-won' };
    const res = applyInner(cmd);
    sweep();
    return res;
  }

  function applyInner(cmd: Command): CommandResult {
    switch (cmd.type) {
      case 'place': {
        const x = Math.round(cmd.x), y = Math.round(cmd.y);
        const chk = canPlace(cmd.tower, x, y);
        if (!chk.ok) return chk;
        const price = priceOf(cmd.tower);
        const t = spawnTower(cmd.tower, x, y, price, [0, 0, 0]);
        S.cash -= price;
        S.stats.spent[t.type] += price;
        emit({ type: 'place', tick: S.tick, tower: t.id, ttype: t.type, cash: S.cash });
        return { ok: true, id: t.id };
      }
      case 'upgrade': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (isHero(t.type)) return { ok: false, reason: 'hero' };
        if (![0, 1, 2].includes(cmd.path)) return { ok: false, reason: 'bad-path' };
        const cur = t.tiers[cmd.path];
        const price = cur >= 5 ? 0 : upgradePrice(t, cmd.path, cur + 1);
        const why = upgradeBlock(t, cmd.path, price);
        if (why) return { ok: false, reason: why };
        S.cash -= price;
        t.spent += price;
        S.stats.spent[t.type] += price;
        t.tiers[cmd.path]++;
        refreshTower(t);
        emit({ type: 'upgrade', tick: S.tick, tower: t.id, ttype: t.type, tiers: [...t.tiers] as Tiers, cash: S.cash });
        return { ok: true, id: t.id };
      }
      case 'unlockTier': {
        if (!TOWER_TYPES.includes(cmd.tower)) return { ok: false, reason: 'unknown-tower' };
        if (![0, 1, 2].includes(cmd.path)) return { ok: false, reason: 'bad-path' };
        const cur = S.maxTier[cmd.tower][cmd.path];
        if (cur >= 5) return { ok: false, reason: 'maxed' };
        if (opts.unlocks && !opts.unlocks.towers.includes(cmd.tower)) return { ok: false, reason: 'locked' };
        const cost = DATA.xp.unlockCost[cur];
        if (!opts.towerXp || S.towerXp[cmd.tower] < cost) return { ok: false, reason: 'no-xp' };
        S.towerXp[cmd.tower] -= cost;
        S.maxTier[cmd.tower][cmd.path] = cur + 1;
        emit({ type: 'unlockTier', tick: S.tick, tower: cmd.tower, path: cmd.path, tier: cur + 1, cost, xp: S.towerXp[cmd.tower] });
        return { ok: true };
      }
      case 'sell': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (isHero(t.type)) return { ok: false, reason: 'hero' };
        const v = sellValue(t.id);
        S.cash += v;
        S.towers = S.towers.filter((x) => x !== t);
        tstats.delete(t.id);
        for (const s of S.sentries.filter((x) => x.owner === t.id)) removeSentry(s, 'sold');
        syncAbilities();
        emit({ type: 'sell', tick: S.tick, tower: t.id, ttype: t.type, cash: S.cash });
        return { ok: true, id: t.id };
      }
      case 'target': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (!['first', 'last', 'strong', 'close'].includes(cmd.mode)) return { ok: false, reason: 'bad-mode' };
        t.target = cmd.mode;
        return { ok: true };
      }
      case 'ability':
        return useAbility(cmd.ability);
      case 'withdraw': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (t.type !== 'market' || tstats.get(t.id)!.bankOn <= 0) return { ok: false, reason: 'not-bank' };
        if (t.bank <= 0) return { ok: false, reason: 'empty' };
        const amount = t.bank;
        S.cash += amount;
        t.bank = 0;
        emit({ type: 'withdraw', tick: S.tick, tower: t.id, amount });
        return { ok: true, id: t.id };
      }
      case 'power':
        return usePower(cmd);
      case 'startRound':
        if (S.groups.length > 0) return { ok: false, reason: 'spawning' };
        if (S.round >= maxRound && !S.freeplay) return { ok: false, reason: 'no-more-rounds' };
        startRoundInternal();
        return { ok: true, id: S.round };
      case 'continue':
        return { ok: false, reason: 'not-won' };
      case 'autoStart':
        S.autoStart = !!cmd.on;
        return { ok: true };
      default:
        return { ok: false, reason: 'unknown-command' };
    }
  }

  return {
    state: S,
    info,
    apply,
    step(ticks = 1) {
      for (let i = 0; i < ticks; i++) tick();
    },
    drainEvents() {
      const e = events;
      events = [];
      return e;
    },
    hash: () => hashState(S),
    canPlace,
    upgradeInfo,
    unlockInfo,
    sellValue,
    marketInfo,
    auraOf: (id) => {
      const t = towerById(id);
      return t ? auraOf(t) : { rangeBp: 0, camo: false, speedBp: 0, armor: false, pierce: 0, dmg: 0, discountBp: 0 };
    },
    buffOf: (id) => {
      const t = towerById(id);
      return t ? buffOf(t) : { dmg: 0, rangeBp: 0, speedBp: 0, groveSpeedBp: 0, permanent: false, ticks: 0 };
    },
    priceOf,
    canUsePower: powerCheck,
    roundPreview,
    sandbox: {
      spawn(type, progress = 0, camo = false, branch = 0, traits = {}) {
        const e = spawnEnemy(type, progress, camo, S.round, false, branch, !!traits.fortified, traits.regrow ? type : null);
        S.phase = 'wave';
        return e.id;
      },
      hurt(enemyId, amount, dtype = 'explosive') {
        const e = emap.get(enemyId);
        const r = e ? damage(e, amount, dtype, 0) : false;
        sweep();
        return r;
      },
      setCash(cash) {
        S.cash = cash;
      },
    },
  };
}
