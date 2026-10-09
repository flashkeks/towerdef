/**
 * Fortschritt: Match-Ergebnis anwenden, Turm-Stufen freischalten, Wissensbaum, Optionen fuer die Sim.
 * Alle Funktionen sind rein: das uebergebene Profil bleibt unveraendert.
 */
import { z } from 'zod';
import type { Difficulty, GameOptions, HeroType, PowerKey, TowerType, Tiers } from '../../sim/src/types';
import {
  DIFFICULTIES, DIFFICULTY_XP_BP, EMBERS_FIRST_MEDAL, EMBERS_LEVEL_UP, EMBERS_WIN, POWER_KEYS, embersForRound, emptyInventory, powerPrice, FREEPLAY_BP, KNOWLEDGE, LEVEL_UNLOCKS, MAX_ROUND, TIER_COST, TOWER_TYPES, WIN_BONUS_XP,
  levelFromXp, nodeById, unlockLevel, xpForLevel, type LevelUnlock,
} from './data';
import { SEEN_MATCHES_MAX, emptyMedals, type Profile } from './profile';

const nat = z.number().int().min(0);
const tierNum = z.number().int().min(0).max(5);
const tiers3 = z.tuple([tierNum, tierNum, tierNum]);
const perTowerAll = z.object({ ranger: nat, bombardier: nat, frostcaller: nat });
const perTowerNat = z.object({ ranger: nat.optional(), bombardier: nat.optional(), frostcaller: nat.optional(), wren: nat.optional() });
/** Was das Match meldet (P3 liefert es). */
export const MatchResultSchema = z.object({
  matchId: z.string().min(1),
  map: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  won: z.boolean(),
  /** Geschaffte Runden (state.roundsCleared); Runden ueber 20 zaehlen als Freeplay. */
  roundsCleared: nat.max(9999),
  livesLost: nat.max(9999),
  /** Geknackte Schichten je Turmtyp (state.stats.pops). */
  pops: perTowerNat,
  /**
   * Turm-XP aus dem Match (Runde 11b): Endkonto, Endstufen (`state.maxTier`) und die im Match verdienten XP (`state.towerXpGained`).
   * Fehlen sie (altes Format / Match ohne XP-System), bleibt das Turm-Profil unveraendert.
   */
  towerXp: perTowerAll.optional(),
  towerTiers: z.object({ ranger: tiers3, bombardier: tiers3, frostcaller: tiers3 }).optional(),
  towerXpGained: perTowerAll.optional(),
  /** Runde 12: erfolgreiche Power-Einsaetze (`state.stats.powersUsed`); werden vom Inventar abgezogen. */
  powersUsed: z.record(z.string(), nat.max(9999)).optional(),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

export const playerLevel = (p: Profile): number => levelFromXp(p.playerXp).level;

export function isTowerUnlocked(p: Profile, id: TowerType | HeroType): boolean {
  return p.settings.unlockAll || playerLevel(p) >= unlockLevel(id);
}
export function isDifficultyUnlocked(p: Profile, d: Difficulty): boolean {
  return p.settings.unlockAll || playerLevel(p) >= unlockLevel(d);
}

// ---------------------------------------------------------------- Match-XP

export function matchXp(roundsCleared: number, difficulty: Difficulty, won: boolean): number {
  let base = 0;
  for (let r = 1; r <= roundsCleared; r++) {
    const v = 20 + 10 * r;
    base += r > MAX_ROUND ? Math.floor((v * FREEPLAY_BP) / 10000) : v;
  }
  if (won) base += WIN_BONUS_XP;
  return Math.round((base * DIFFICULTY_XP_BP[difficulty]) / 10000);
}

export interface MatchReport {
  /** true = dieses Match war schon verbucht, nichts hat sich geaendert. */
  duplicate: boolean;
  xpGained: number;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  /** Wissenspunkte aus Level-Ups dieses Matches. */
  pointsGained: number;
  unlocks: LevelUnlock[];
  newMedal: Difficulty | null;
  newBest: boolean;
  towerXpGained: Partial<Record<TowerType, number>>;
  /** Runde 12: Embers aus diesem Match, Summe und Aufschluesselung. */
  embersGained: number;
  embers: { rounds: number; win: number; medal: number; levelUp: number };
  /** Runde 12: Powers, die dieses Match verbraucht hat (Summe, fuer "Powers used: N"). */
  powersUsed: number;
}

/** Embers fuer ein Match (Spezifikation: docs/design/powers.md). */
export function matchEmbers(roundsCleared: number, difficulty: Difficulty, won: boolean, newMedal: boolean, levelUps: number): MatchReport['embers'] {
  let rounds = 0;
  for (let r = 1; r <= Math.min(roundsCleared, MAX_ROUND); r++) rounds += embersForRound(r);
  return { rounds, win: won ? EMBERS_WIN[difficulty] : 0, medal: newMedal ? EMBERS_FIRST_MEDAL : 0, levelUp: levelUps * EMBERS_LEVEL_UP };
}

const hasKnow = (p: Profile, id: string): boolean => p.knowledge.includes(id);

export function applyMatch(p: Profile, resultIn: MatchResult): { profile: Profile; report: MatchReport } {
  const res = MatchResultSchema.parse(resultIn);
  const lv0 = levelFromXp(p.playerXp);
  if (p.seenMatches.includes(res.matchId)) {
    return {
      profile: p,
      report: { duplicate: true, xpGained: 0, xpBefore: p.playerXp, xpAfter: p.playerXp, levelBefore: lv0.level, levelAfter: lv0.level, pointsGained: 0, unlocks: [], newMedal: null, newBest: false, towerXpGained: {}, embersGained: 0, embers: { rounds: 0, win: 0, medal: 0, levelUp: 0 }, powersUsed: 0 },
    };
  }
  const xpGained = matchXp(res.roundsCleared, res.difficulty, res.won);
  const playerXp = p.playerXp + xpGained;
  const lv1 = levelFromXp(playerXp);
  const unlocks = LEVEL_UNLOCKS.filter((u) => u.level > lv0.level && u.level <= lv1.level);

  // Turm-XP und Stufen: Endstand aus dem Match (Sim fuehrt Konto und Freischaltungen). Stufen sinken nie; mit "unlock everything"
  // (alles im Match frei) bleiben die echten Stufen unangetastet.
  const towerXp = { ...p.towerXp };
  const towerTiers = { ...p.towerTiers };
  const towerXpGained: Partial<Record<TowerType, number>> = {};
  if (res.towerXp) for (const t of TOWER_TYPES) towerXp[t] = res.towerXp[t];
  if (res.towerTiers && !p.settings.unlockAll) {
    for (const t of TOWER_TYPES) towerTiers[t] = p.towerTiers[t].map((v, i) => Math.max(v, res.towerTiers![t][i])) as Tiers;
  }
  if (res.towerXpGained) for (const t of TOWER_TYPES) if (res.towerXpGained[t] > 0) towerXpGained[t] = res.towerXpGained[t];

  const medals = { ...p.medals };
  let newMedal: Difficulty | null = null;
  if (res.won) {
    const cur = medals[res.map] ?? emptyMedals();
    if (!cur[res.difficulty]) newMedal = res.difficulty;
    medals[res.map] = { ...cur, [res.difficulty]: true };
  }
  const bestMap = { ...p.best };
  const prev = bestMap[res.map]?.[res.difficulty];
  const better = !prev || res.roundsCleared > prev.round || (res.roundsCleared === prev.round && res.livesLost < prev.livesLost);
  if (better) bestMap[res.map] = { ...bestMap[res.map], [res.difficulty]: { round: res.roundsCleared, livesLost: res.livesLost } };

  // Embers und Inventar (Runde 12)
  const emb = matchEmbers(res.roundsCleared, res.difficulty, res.won, newMedal !== null, lv1.level - lv0.level);
  const embersGained = emb.rounds + emb.win + emb.medal + emb.levelUp;
  const inventory = { ...emptyInventory(), ...p.inventory };
  let powersUsed = 0;
  for (const k of POWER_KEYS) {
    const used = res.powersUsed?.[k] ?? 0;
    if (used <= 0) continue;
    powersUsed += used;
    inventory[k] = Math.max(0, inventory[k] - used);
  }

  const profile: Profile = {
    ...p,
    embers: p.embers + embersGained,
    inventory,
    playerXp,
    towerXp,
    towerTiers,
    medals,
    best: bestMap,
    seenMatches: [...p.seenMatches, res.matchId].slice(-SEEN_MATCHES_MAX),
    matchesPlayed: p.matchesPlayed + 1,
    matchesWon: p.matchesWon + (res.won ? 1 : 0),
  };
  return {
    profile,
    report: {
      duplicate: false, xpGained, xpBefore: p.playerXp, xpAfter: playerXp, levelBefore: lv0.level, levelAfter: lv1.level,
      pointsGained: lv1.level - lv0.level, unlocks, newMedal, newBest: better, towerXpGained, embersGained, embers: emb, powersUsed,
    },
  };
}

// ---------------------------------------------------------------- Turm-Stufen

export type Fail = { ok: false; code: string; message: string };
const fail = (code: string, message: string): Fail => ({ ok: false, code, message });

export const tierCost = (tier: number): number => TIER_COST[tier - 1] ?? 0;

/** Naechste freischaltbare Stufe eines Pfads (1..5) oder null, wenn voll. */
export function nextTier(p: Profile, tower: TowerType, path: 0 | 1 | 2): number | null {
  const cur = p.towerTiers[tower][path];
  return cur >= 5 ? null : cur + 1;
}

export function unlockTier(p: Profile, tower: TowerType, path: 0 | 1 | 2): { ok: true; profile: Profile; tier: number; cost: number } | Fail {
  if (!isTowerUnlocked(p, tower)) return fail('tower-locked', 'Reach a higher player level to use this tower.');
  const tier = nextTier(p, tower, path);
  if (tier === null) return fail('maxed', 'This path is fully unlocked.');
  const cost = tierCost(tier);
  if (p.towerXp[tower] < cost) return fail('not-enough-xp', `Needs ${cost} Tower XP.`);
  const tiers = [...p.towerTiers[tower]] as Tiers;
  tiers[path] = tier;
  return { ok: true, tier, cost, profile: { ...p, towerXp: { ...p.towerXp, [tower]: p.towerXp[tower] - cost }, towerTiers: { ...p.towerTiers, [tower]: tiers } } };
}

// ---------------------------------------------------------------- Store (Runde 12)

/** Power kaufen: Preis in Embers aus `sim/data/powers.json`. Codes: `unknown-power`, `bad-count`, `not-enough-embers`. */
export function buyPower(p: Profile, key: PowerKey, count = 1): { ok: true; profile: Profile; cost: number } | Fail {
  if (!(POWER_KEYS as readonly string[]).includes(key)) return fail('unknown-power', 'Unknown power.');
  if (!Number.isInteger(count) || count < 1 || count > 99) return fail('bad-count', 'Pick an amount between 1 and 99.');
  const cost = powerPrice(key) * count;
  if (p.embers < cost) return fail('not-enough-embers', `Needs ${cost} Embers.`);
  const inventory = { ...emptyInventory(), ...p.inventory };
  inventory[key] += count;
  return { ok: true, cost, profile: { ...p, embers: p.embers - cost, inventory } };
}

// ---------------------------------------------------------------- Wissensbaum

export function knowledgePoints(p: Profile): { total: number; spent: number; free: number } {
  const total = playerLevel(p) - 1;
  const spent = p.knowledge.reduce((s, id) => s + (nodeById(id)?.cost ?? 0), 0);
  return { total, spent, free: total - spent };
}
export function nodeState(p: Profile, id: string): 'bought' | 'available' | 'locked' | 'unaffordable' {
  const n = nodeById(id);
  if (!n) return 'locked';
  if (p.knowledge.includes(id)) return 'bought';
  if (n.requires.length && !n.requires.some((r) => p.knowledge.includes(r))) return 'locked';
  return knowledgePoints(p).free >= n.cost ? 'available' : 'unaffordable';
}
export function buyNode(p: Profile, id: string): { ok: true; profile: Profile } | Fail {
  const n = nodeById(id);
  if (!n) return fail('unknown-node', 'Unknown knowledge node.');
  const s = nodeState(p, id);
  if (s === 'bought') return fail('owned', 'Already learned.');
  if (s === 'locked') return fail('locked', 'Learn the node above first.');
  if (s === 'unaffordable') return fail('no-points', `Needs ${n.cost} Knowledge Point${n.cost > 1 ? 's' : ''}.`);
  return { ok: true, profile: { ...p, knowledge: [...p.knowledge, id] } };
}
export function resetKnowledge(p: Profile): Profile {
  return { ...p, knowledge: [] };
}

// ---------------------------------------------------------------- Testhilfe

/**
 * Testhilfe "unlock everything" als Profil: alle Level-Freischaltungen erreicht, alle Stufen offen, alle Wissenspunkte
 * verfuegbar (Level 15), Turm-XP reichlich. Anders als `settings.unlockAll` aendert es die Zahlen im Profil selbst.
 */
export function unlockEverything(p: Profile): Profile {
  const maxed: Tiers = [5, 5, 5];
  const xp = Math.max(p.playerXp, xpForLevel(15));
  const full = TIER_COST.reduce((s, c) => s + c, 0) * 3;
  return {
    ...p,
    playerXp: xp,
    towerTiers: { ranger: [...maxed], bombardier: [...maxed], frostcaller: [...maxed] },
    towerXp: { ranger: full, bombardier: full, frostcaller: full },
  };
}

// ---------------------------------------------------------------- Optionen fuer die Sim

export type MatchOptions = Required<Pick<GameOptions, 'unlocks' | 'towerXp'>> & { powers: Record<PowerKey, number> } & { mods: NonNullable<GameOptions['mods']> };

/**
 * `unlocks` + `towerXp` + `powers` (Inventar) + `mods` fuer `createGame`. `towerXp` ist das Konto (Sim fuehrt es im Match, `unlockTier` im Match),
 * `mods.towerXpBp` = Fast Learner. Mit "unlock everything" ist alles frei.
 */
export function matchOptions(p: Profile): MatchOptions {
  const all = p.settings.unlockAll;
  const towers: (TowerType | HeroType)[] = [...TOWER_TYPES.filter((t) => isTowerUnlocked(p, t))];
  if (isTowerUnlocked(p, 'wren')) towers.push('wren');
  const full: Tiers = [5, 5, 5];
  const maxTier = Object.fromEntries(TOWER_TYPES.map((t) => [t, all ? full : ([...p.towerTiers[t]] as Tiers)])) as Record<TowerType, Tiers>;

  const k = (id: string): boolean => hasKnow(p, id);
  const mods: MatchOptions['mods'] = {};
  if (k('head-start')) mods.startCash = 100;
  if (k('extra-lives')) mods.lives = 10;
  if (k('better-deals')) mods.sellBp = 7500;
  if (k('lantern-tax')) mods.earlyBonus = 20;
  if (k('cheaper-basics')) mods.t1DiscountBp = 1000;
  if (k('sharp-eyes')) mods.rangeBp = { ranger: 800 };
  if (k('bigger-barrels')) mods.radiusBp = 1000;
  if (k('cold-snap')) mods.slowDurBp = 2500;
  if (k('veteran-hero')) mods.heroStartLevel = 3;
  if (k('fast-learner')) mods.towerXpBp = 2000;
  return { unlocks: { towers, maxTier }, towerXp: { ...p.towerXp }, powers: { ...emptyInventory(), ...p.inventory }, mods };
}

export { DIFFICULTIES, KNOWLEDGE };
