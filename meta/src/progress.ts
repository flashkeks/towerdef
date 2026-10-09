/**
 * Fortschritt: Match-Ergebnis anwenden, Turm-Stufen freischalten, Wissensbaum, Optionen fuer die Sim.
 * Alle Funktionen sind rein: das uebergebene Profil bleibt unveraendert.
 */
import { z } from 'zod';
import type { Difficulty, GameOptions, HeroType, TowerType, Tiers } from '../../sim/src/types';
import {
  DIFFICULTIES, DIFFICULTY_XP_BP, FREEPLAY_BP, KNOWLEDGE, LEVEL_UNLOCKS, MAX_ROUND, TIER_COST, TOWER_TYPES, WIN_BONUS_XP,
  XP_PER_POP, XP_PER_TIER_BOUGHT, levelFromXp, nodeById, unlockLevel, xpForLevel, type LevelUnlock,
} from './data';
import { SEEN_MATCHES_MAX, emptyMedals, type Profile } from './profile';

const nat = z.number().int().min(0);
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
  /** Im Match gekaufte Stufen je Turmtyp (Anzahl Upgrade-Kaeufe). */
  tierBuys: perTowerNat,
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
}

const hasKnow = (p: Profile, id: string): boolean => p.knowledge.includes(id);

export function applyMatch(p: Profile, resultIn: MatchResult): { profile: Profile; report: MatchReport } {
  const res = MatchResultSchema.parse(resultIn);
  const lv0 = levelFromXp(p.playerXp);
  if (p.seenMatches.includes(res.matchId)) {
    return {
      profile: p,
      report: { duplicate: true, xpGained: 0, xpBefore: p.playerXp, xpAfter: p.playerXp, levelBefore: lv0.level, levelAfter: lv0.level, pointsGained: 0, unlocks: [], newMedal: null, newBest: false, towerXpGained: {} },
    };
  }
  const xpGained = matchXp(res.roundsCleared, res.difficulty, res.won);
  const playerXp = p.playerXp + xpGained;
  const lv1 = levelFromXp(playerXp);
  const unlocks = LEVEL_UNLOCKS.filter((u) => u.level > lv0.level && u.level <= lv1.level);

  const towerXp = { ...p.towerXp };
  const towerXpGained: Partial<Record<TowerType, number>> = {};
  const bonusBp = hasKnow(p, 'fast-learner') ? 12000 : 10000;
  for (const t of TOWER_TYPES) {
    const raw = (res.pops[t] ?? 0) * XP_PER_POP + (res.tierBuys[t] ?? 0) * XP_PER_TIER_BOUGHT;
    const gain = Math.floor((raw * bonusBp) / 10000);
    if (gain > 0) {
      towerXp[t] += gain;
      towerXpGained[t] = gain;
    }
  }

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

  const profile: Profile = {
    ...p,
    playerXp,
    towerXp,
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
      pointsGained: lv1.level - lv0.level, unlocks, newMedal, newBest: better, towerXpGained,
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

export type MatchOptions = Required<Pick<GameOptions, 'unlocks'>> & { mods: NonNullable<GameOptions['mods']> };

/** `unlocks` + `mods` fuer `createGame`. Mit "unlock everything" ist alles frei. */
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
  return { unlocks: { towers, maxTier }, mods };
}

export { DIFFICULTIES, KNOWLEDGE };
