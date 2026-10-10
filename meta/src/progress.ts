/**
 * Fortschritt: Match-Ergebnis anwenden, Turm-Stufen freischalten, Wissensbaum, Optionen fuer die Sim.
 * Alle Funktionen sind rein: das uebergebene Profil bleibt unveraendert.
 */
import { z } from 'zod';
import { DATA } from '../../sim/src/data';
import type { Difficulty, GameOptions, HeroType, ModeId, PowerKey, TowerType, Tiers } from '../../sim/src/types';
import {
  BULK_BUYER_BP, DIFFICULTIES, DIFFICULTY_XP_BP, EMBERS_FIRST_MEDAL, EMBERS_LEVEL_UP, EMBERS_WIN, HERO_IDS, HEROES, POWER_KEYS, embersForRound, emptyInventory, powerPrice, FREEPLAY_BP, KNOWLEDGE, LEVEL_UNLOCKS, MAX_ROUND, TIER_COST, TOWER_TYPES, WIN_BONUS_XP,
  MAPS, MODE_IDS, MODE_META, levelFromXp, roundRewardBp, mapById, maxRoundOf, nodeById, unlockLevel, xpForLevel, type LevelUnlock, type MapMeta,
} from './data';
import { SEEN_MATCHES_MAX, bestOf, emptyMedals, heroOwned, medalCount, medalsOf, type Profile } from './profile';

const nat = z.number().int().min(0);
const tierNum = z.number().int().min(0).max(5);
const tiers3 = z.tuple([tierNum, tierNum, tierNum]);
/** Runde 13/14: `longshot`/`market`/`thornweaver`/`alchemist` duerfen in aelteren Ergebnissen fehlen (zaehlen als 0 bzw. unveraendert). */
const perTowerAll = z.object({
  ranger: nat, bombardier: nat, frostcaller: nat, longshot: nat.default(0), market: nat.default(0), thornweaver: nat.default(0), alchemist: nat.default(0),
  // Runde 16
  riverkeeper: nat.default(0), bellringer: nat.default(0), tinker: nat.default(0),
});
const perTowerNat = z.object({
  ranger: nat.optional(), bombardier: nat.optional(), frostcaller: nat.optional(), longshot: nat.optional(), market: nat.optional(), thornweaver: nat.optional(), alchemist: nat.optional(),
  riverkeeper: nat.optional(), bellringer: nat.optional(), tinker: nat.optional(), wren: nat.optional(), bram: nat.optional(), sela: nat.optional(),
});
/** Was das Match meldet (P3 liefert es). */
export const MatchResultSchema = z.object({
  matchId: z.string().min(1),
  map: z.string().min(1),
  /** Runde 15: Spielmodus (fehlt = Standard). */
  mode: z.enum(MODE_IDS as unknown as [ModeId, ...ModeId[]]).default('standard'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  won: z.boolean(),
  /** Geschaffte Runden (state.roundsCleared); Runden ueber die letzte Runde der Karte zaehlen als Freeplay. */
  roundsCleared: nat.max(9999),
  livesLost: nat.max(9999),
  /** Geknackte Schichten je Turmtyp (state.stats.pops). */
  pops: perTowerNat,
  /**
   * Turm-XP aus dem Match (Runde 11b): Endkonto, Endstufen (`state.maxTier`) und die im Match verdienten XP (`state.towerXpGained`).
   * Fehlen sie (altes Format / Match ohne XP-System), bleibt das Turm-Profil unveraendert.
   */
  towerXp: perTowerAll.optional(),
  towerTiers: z.object({
    ranger: tiers3, bombardier: tiers3, frostcaller: tiers3, longshot: tiers3.default([0, 0, 0]), market: tiers3.default([0, 0, 0]), thornweaver: tiers3.default([0, 0, 0]), alchemist: tiers3.default([0, 0, 0]),
    riverkeeper: tiers3.default([0, 0, 0]), bellringer: tiers3.default([0, 0, 0]), tinker: tiers3.default([0, 0, 0]),
  }).optional(),
  towerXpGained: perTowerAll.optional(),
  /** Runde 12: erfolgreiche Power-Einsaetze (`state.stats.powersUsed`); werden vom Inventar abgezogen. */
  powersUsed: z.record(z.string(), nat.max(9999)).optional(),
});
/** Eingabeform: Felder mit Vorgabe (Runde 13: `longshot`/`market`) duerfen fehlen. */
export type MatchResult = z.input<typeof MatchResultSchema>;

export const playerLevel = (p: Profile): number => levelFromXp(p.playerXp).level;

export function isTowerUnlocked(p: Profile, id: TowerType | HeroType): boolean {
  // Runde 16: Helden ueber `heroOwned` (Level oder Embers-Kauf)
  if ((HERO_IDS as readonly string[]).includes(id)) return heroOwned(p, id as HeroType);
  return p.settings.unlockAll || playerLevel(p) >= unlockLevel(id);
}
export function isDifficultyUnlocked(p: Profile, d: Difficulty): boolean {
  return p.settings.unlockAll || playerLevel(p) >= unlockLevel(d);
}

// ---------------------------------------------------------------- Karten und Modi (Runde 15)

const diffRank = (d: Difficulty): number => DIFFICULTIES.indexOf(d);
/** Standard-Medaille auf `map` in mindestens dieser Schwierigkeit (eine haertere Medaille genuegt). */
export function hasMedalAtLeast(p: Profile, map: string, difficulty: Difficulty): boolean {
  const m = medalsOf(p, map);
  return DIFFICULTIES.some((d) => diffRank(d) >= diffRank(difficulty) && m[d]);
}

export interface MapLock {
  unlocked: boolean;
  /** Offen, weil das Level reicht (oder die Karte von Anfang an frei ist). */
  byLevel: boolean;
  /** Offen, weil die Medaille auf der Vorgaengerkarte reicht. */
  byMedal: boolean;
  /** Englischer Hinweis fuer das Schloss, leer wenn offen. */
  text: string;
}
/** Karten-Freischaltung: Spieler-Level **oder** Medaille auf der Vorgaengerkarte. */
export function mapLock(p: Profile, mapId: string): MapLock {
  const m = mapById(mapId);
  if (!m || !m.unlock) return { unlocked: true, byLevel: true, byMedal: false, text: '' };
  const byLevel = playerLevel(p) >= m.unlock.level;
  const byMedal = hasMedalAtLeast(p, m.unlock.medal.map, m.unlock.medal.difficulty);
  const unlocked = p.settings.unlockAll || byLevel || byMedal;
  const prev = mapById(m.unlock.medal.map)?.name ?? m.unlock.medal.map;
  const d = m.unlock.medal.difficulty[0].toUpperCase() + m.unlock.medal.difficulty.slice(1);
  return { unlocked, byLevel, byMedal, text: unlocked ? '' : `Reach level ${m.unlock.level} or win ${prev} on ${d}.` };
}
export const isMapUnlocked = (p: Profile, mapId: string): boolean => mapLock(p, mapId).unlocked;
export const unlockedMaps = (p: Profile): MapMeta[] => MAPS.filter((m) => isMapUnlocked(p, m.id));

export interface ModeLock {
  unlocked: boolean;
  text: string;
}
/** Modus-Freischaltung je Karte: Standard-Medaille der geforderten Schwierigkeit (oder haerter) auf genau dieser Karte. */
export function modeLock(p: Profile, mapId: string, mode: ModeId): ModeLock {
  const need = MODE_META[mode]?.unlockMedal ?? null;
  if (need === null) return { unlocked: true, text: '' };
  if (p.settings.unlockAll || hasMedalAtLeast(p, mapId, need)) return { unlocked: true, text: '' };
  const d = need[0].toUpperCase() + need.slice(1);
  return { unlocked: false, text: `Win this map on ${d} first.` };
}
export const isModeUnlocked = (p: Profile, mapId: string, mode: ModeId): boolean => modeLock(p, mapId, mode).unlocked;

/** Belohnungsfaktoren (Basispunkte) einer Karte und eines Modus. */
export function rewardFactors(mapId: string, mode: ModeId = 'standard'): { xpBp: number; embersBp: number; modeBp: number } {
  const m = mapById(mapId);
  return { xpBp: m?.xpBp ?? 10000, embersBp: m?.embersBp ?? 10000, modeBp: MODE_META[mode]?.bonusBp ?? 0 };
}

// ---------------------------------------------------------------- Match-XP

/** Belohnungs-Zusatz je Karte und Modus; Vorgabe = Meadow, Standard (Zahlen wie vor Runde 15). */
export interface RewardCtx {
  /** Letzte Runde der Karte; Runden darueber zaehlen als Freeplay. */
  maxRound?: number;
  /** Kartenfaktor in Basispunkten (10000 = x1,0). */
  mapBp?: number;
  /** Modus-Bonus in Basispunkten (2000 = +20 %). */
  modeBp?: number;
  /** Runde 15b: Daempfung je Runde (`roundRewardBp(Endrunde)`), Vorgabe 10000 = keine (damit 80 Runden die Level-Kurve nicht sprengen). */
  roundBp?: number;
}

/** Spieler-XP eines Matches. Reihenfolge: Schwierigkeit, Scholar, Kartenfaktor, Modus-Bonus; erst am Ende gerundet. */
export function matchXp(roundsCleared: number, difficulty: Difficulty, won: boolean, extraBp = 0, ctx: RewardCtx = {}): number {
  const maxRound = ctx.maxRound ?? MAX_ROUND;
  let base = 0;
  for (let r = 1; r <= roundsCleared; r++) {
    const v = Math.floor(((20 + 10 * r) * (ctx.roundBp ?? 10000)) / 10000);
    base += r > maxRound ? Math.floor((v * FREEPLAY_BP) / 10000) : v;
  }
  if (won) base += WIN_BONUS_XP;
  const x = (base * DIFFICULTY_XP_BP[difficulty] * (10000 + extraBp)) / 100_000_000;
  return Math.round(x * ((ctx.mapBp ?? 10000) / 10000) * ((10000 + (ctx.modeBp ?? 0)) / 10000));
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
  /** Runde 15b: neue Freeplay-Bestrunde dieser Karte, und ihr Stand nach dem Match (0 = nie im Freeplay). */
  newFreeplayBest: boolean;
  freeplayBest: number;
  /** Runde 15: Karte und Modus dieses Matches und ihre Belohnungsfaktoren (Basispunkte). */
  map: string;
  mode: ModeId;
  rewardBp: { xp: number; embers: number; mode: number };
  /** Runde 15: durch dieses Match (Level-Up oder Medaille) neu geoeffnete Karten und Modi. */
  unlockedMaps: string[];
  unlockedModes: { map: string; mode: ModeId }[];
  towerXpGained: Partial<Record<TowerType, number>>;
  /** Runde 12: Embers aus diesem Match, Summe und Aufschluesselung. */
  embersGained: number;
  embers: { rounds: number; win: number; medal: number; levelUp: number; pouch: number; rush: number; /** Runde 15: Zuwachs durch Kartenfaktor und Modus-Bonus; fehlt, wenn 0. */ bonus?: number };
  /** Runde 12: Powers, die dieses Match verbraucht hat (Summe, fuer "Powers used: N"). */
  powersUsed: number;
}

/**
 * Embers fuer ein Match (Spezifikation: docs/design/powers.md, Runde 15: karten- und modusabhaengig).
 * Runden, Sieg, Medaille und Rush werden mit Kartenfaktor und Modus-Bonus multipliziert (`bonus` = Zuwachs, abgerundet);
 * Level-Ups nicht. Ember Pouch rechnet auf die Summe danach.
 */
export function matchEmbers(roundsCleared: number, difficulty: Difficulty, won: boolean, newMedal: boolean, levelUps: number, pouchBp = 0, rush = false, ctx: RewardCtx = {}): MatchReport['embers'] {
  const maxRound = ctx.maxRound ?? MAX_ROUND;
  let rounds = 0;
  for (let r = 1; r <= Math.min(roundsCleared, maxRound); r++) rounds += embersForRound(r);
  // Runde 15b: bei 40/60/80 Runden gedaempft (Summe, abgerundet), Level-Kurve und Embers-Wirtschaft bleiben im Rahmen
  rounds = Math.floor((rounds * (ctx.roundBp ?? 10000)) / 10000);
  const win = won ? EMBERS_WIN[difficulty] : 0;
  const medal = newMedal ? EMBERS_FIRST_MEDAL : 0;
  const levelUp = levelUps * EMBERS_LEVEL_UP;
  // Ember Rush (Runde 14): +1 Ember je geschaffter Runde
  const rushEmbers = rush ? Math.floor((Math.min(roundsCleared, maxRound) * (ctx.roundBp ?? 10000)) / 10000) : 0;
  const core = rounds + win + medal + rushEmbers;
  const scaled = Math.floor(((core * (ctx.mapBp ?? 10000)) / 10000) * ((10000 + (ctx.modeBp ?? 0)) / 10000) + 1e-9);
  const bonus = scaled - core;
  // Ember Pouch (Runde 13): Zuschlag auf die Summe inkl. Rush, Level-Ups und Kartenbonus, abgerundet
  return { rounds, win, medal, levelUp, pouch: Math.floor(((core + bonus + levelUp) * pouchBp) / 10000), rush: rushEmbers, ...(bonus ? { bonus } : {}) };
}

const rewardOf = (map: string, mode: ModeId): MatchReport['rewardBp'] => {
  const f = rewardFactors(map, mode);
  return { xp: f.xpBp, embers: f.embersBp, mode: f.modeBp };
};
const hasKnow = (p: Profile, id: string): boolean => p.knowledge.includes(id);
/** Scholar: +10 % Spieler-XP. Ember Pouch: +10 % Embers. Starter Kit: 1 Gold Drop gratis je Match. */
export const SCHOLAR_BP = 1000;
export const EMBER_POUCH_BP = 1000;
export const STARTER_KIT_GOLD_DROPS = 1;

export function applyMatch(p: Profile, resultIn: MatchResult): { profile: Profile; report: MatchReport } {
  const res = MatchResultSchema.parse(resultIn);
  const lv0 = levelFromXp(p.playerXp);
  if (p.seenMatches.includes(res.matchId)) {
    return {
      profile: p,
      report: { duplicate: true, xpGained: 0, xpBefore: p.playerXp, xpAfter: p.playerXp, levelBefore: lv0.level, levelAfter: lv0.level, pointsGained: 0, unlocks: [], newMedal: null, newBest: false, newFreeplayBest: false, freeplayBest: p.freeplayBest[res.map] ?? 0, towerXpGained: {}, embersGained: 0, embers: { rounds: 0, win: 0, medal: 0, levelUp: 0, pouch: 0, rush: 0 }, powersUsed: 0, map: res.map, mode: res.mode, rewardBp: rewardOf(res.map, res.mode), unlockedMaps: [], unlockedModes: [] },
    };
  }
  const endRound = maxRoundOf(res.map, res.difficulty);
  const ctx: RewardCtx = { maxRound: endRound, roundBp: roundRewardBp(endRound), mapBp: rewardFactors(res.map).xpBp, modeBp: rewardFactors(res.map, res.mode).modeBp };
  const ectx: RewardCtx = { ...ctx, mapBp: rewardFactors(res.map).embersBp };
  const xpGained = matchXp(res.roundsCleared, res.difficulty, res.won, hasKnow(p, 'scholar') ? SCHOLAR_BP : 0, ctx);
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

  // Medaillen und Bestleistung: Standard in `medals`/`best`, Zusatzmodi in `modeMedals`/`modeBest` (je Karte)
  const medals = { ...p.medals };
  const modeMedals = { ...p.modeMedals };
  const cur = medalsOf(p, res.map, res.mode);
  let newMedal: Difficulty | null = null;
  if (res.won) {
    if (!cur[res.difficulty]) newMedal = res.difficulty;
    const next = { ...cur, [res.difficulty]: true };
    if (res.mode === 'standard') medals[res.map] = next;
    else modeMedals[res.map] = { ...modeMedals[res.map], [res.mode]: next };
  }
  const bestMap = { ...p.best };
  const modeBest = { ...p.modeBest };
  const prev = bestOf(p, res.map, res.difficulty, res.mode);
  // Runde 15b: die Bestleistung der Schwierigkeit endet bei der Endrunde; was darueber geschafft wurde, ist Freeplay (eigene Bestrunde)
  const roundsBest = Math.min(res.roundsCleared, endRound);
  const better = !prev || roundsBest > prev.round || (roundsBest === prev.round && res.livesLost < prev.livesLost);
  const freeplayBest = { ...p.freeplayBest };
  let newFreeplayBest = false;
  if (res.mode === 'standard' && res.roundsCleared > endRound && res.roundsCleared > (freeplayBest[res.map] ?? 0)) {
    freeplayBest[res.map] = res.roundsCleared;
    newFreeplayBest = true;
  }
  if (better) {
    const rec = { round: roundsBest, livesLost: res.livesLost };
    if (res.mode === 'standard') bestMap[res.map] = { ...bestMap[res.map], [res.difficulty]: rec };
    else modeBest[res.map] = { ...modeBest[res.map], [res.mode]: { ...modeBest[res.map]?.[res.mode], [res.difficulty]: rec } };
  }

  // Embers und Inventar (Runde 12)
  const emb = matchEmbers(res.roundsCleared, res.difficulty, res.won, newMedal !== null, lv1.level - lv0.level, hasKnow(p, 'ember-pouch') ? EMBER_POUCH_BP : 0, hasKnow(p, 'ember-rush'), ectx);
  const embersGained = emb.rounds + emb.win + emb.medal + emb.levelUp + emb.pouch + emb.rush + (emb.bonus ?? 0);
  const inventory = { ...emptyInventory(), ...p.inventory };
  let powersUsed = 0;
  for (const k of POWER_KEYS) {
    const used = res.powersUsed?.[k] ?? 0;
    if (used <= 0) continue;
    powersUsed += used;
    // Starter Kit: das erste Gold Drop des Matches kam gratis dazu, nur der Rest geht vom Inventar ab
    const free = k === 'goldDrop' && hasKnow(p, 'starter-kit') ? STARTER_KIT_GOLD_DROPS : 0;
    inventory[k] = Math.max(0, inventory[k] - Math.max(0, used - free));
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
    modeMedals,
    modeBest,
    freeplayBest,
    seenMatches: [...p.seenMatches, res.matchId].slice(-SEEN_MATCHES_MAX),
    matchesPlayed: p.matchesPlayed + 1,
    matchesWon: p.matchesWon + (res.won ? 1 : 0),
  };
  // Neu geoeffnete Karten und Modi (Level-Up oder Medaille)
  const unlockedMapsNow = MAPS.filter((m) => !isMapUnlocked(p, m.id) && isMapUnlocked(profile, m.id)).map((m) => m.id);
  const unlockedModesNow: { map: string; mode: ModeId }[] = [];
  for (const m of MAPS) for (const mode of MODE_IDS) if (isMapUnlocked(profile, m.id) && !isModeUnlocked(p, m.id, mode) && isModeUnlocked(profile, m.id, mode)) unlockedModesNow.push({ map: m.id, mode });
  return {
    profile,
    report: {
      map: res.map, mode: res.mode, rewardBp: rewardOf(res.map, res.mode), unlockedMaps: unlockedMapsNow, unlockedModes: unlockedModesNow,
      duplicate: false, xpGained, xpBefore: p.playerXp, xpAfter: playerXp, levelBefore: lv0.level, levelAfter: lv1.level,
      pointsGained: lv1.level - lv0.level, unlocks, newMedal, newBest: better, newFreeplayBest, freeplayBest: freeplayBest[res.map] ?? 0, towerXpGained, embersGained, embers: emb, powersUsed,
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

/** Preis einer Power fuer dieses Profil (Bulk Buyer: -10 %, aufgerundet). */
export const powerCost = (p: Profile, key: PowerKey): number =>
  hasKnow(p, 'bulk-buyer') ? Math.ceil((powerPrice(key) * (10000 - BULK_BUYER_BP)) / 10000) : powerPrice(key);

/** Power kaufen: Preis in Embers aus `sim/data/powers.json`. Codes: `unknown-power`, `bad-count`, `not-enough-embers`. */
export function buyPower(p: Profile, key: PowerKey, count = 1): { ok: true; profile: Profile; cost: number } | Fail {
  if (!(POWER_KEYS as readonly string[]).includes(key)) return fail('unknown-power', 'Unknown power.');
  if (!Number.isInteger(count) || count < 1 || count > 99) return fail('bad-count', 'Pick an amount between 1 and 99.');
  const cost = powerCost(p, key) * count;
  if (p.embers < cost) return fail('not-enough-embers', `Needs ${cost} Embers.`);
  const inventory = { ...emptyInventory(), ...p.inventory };
  inventory[key] += count;
  return { ok: true, cost, profile: { ...p, embers: p.embers - cost, inventory } };
}

// ---------------------------------------------------------------- Store: Heroes (Runde 16)

export interface HeroLock {
  owned: boolean;
  /** Offen ueber das Spieler-Level. */
  byLevel: boolean;
  /** Offen ueber den Embers-Kauf (`Profile.heroes`). */
  purchased: boolean;
  unlockLevel: number;
  /** Preis in Embers; null = nicht kaeuflich (Wren). */
  embers: number | null;
  /** Im Store kaufbar jetzt (nicht besessen, kaeuflich, genug Embers). */
  canBuy: boolean;
  /** Englischer Hinweis fuer das Schloss ("Reach level 10 or buy for 1,500 Embers."), leer wenn offen. */
  text: string;
}
const fmt = (n: number): string => n.toLocaleString('en-US');
/** Freischaltung eines Helden: Level **oder** Embers (Bram 1.500, Sela 2.500; Wren nur Level 3). */
export function heroLock(p: Profile, id: HeroType): HeroLock {
  const m = HEROES.find((h) => h.id === id);
  if (!m) return { owned: false, byLevel: false, purchased: false, unlockLevel: 0, embers: null, canBuy: false, text: 'Unknown hero.' };
  const byLevel = playerLevel(p) >= m.unlockLevel;
  const purchased = m.embers !== null && p.heroes.includes(id);
  const owned = heroOwned(p, id);
  const text = owned ? '' : m.embers === null ? `Reach level ${m.unlockLevel}.` : `Reach level ${m.unlockLevel} or buy for ${fmt(m.embers)} Embers.`;
  return { owned, byLevel, purchased, unlockLevel: m.unlockLevel, embers: m.embers, canBuy: !owned && m.embers !== null && p.embers >= m.embers, text };
}

/** Held im Store kaufen (Embers). Codes: `unknown-hero`, `not-for-sale` (Wren), `owned`, `not-enough-embers`. */
export function buyHero(p: Profile, id: HeroType): { ok: true; profile: Profile; cost: number } | Fail {
  const m = HEROES.find((h) => h.id === id);
  if (!m) return fail('unknown-hero', 'Unknown hero.');
  if (m.embers === null) return fail('not-for-sale', `${m.short} cannot be bought. Reach level ${m.unlockLevel}.`);
  if (heroOwned(p, id)) return fail('owned', `${m.short} is already yours.`);
  if (p.embers < m.embers) return fail('not-enough-embers', `Needs ${fmt(m.embers)} Embers.`);
  return { ok: true, cost: m.embers, profile: { ...p, embers: p.embers - m.embers, heroes: HERO_IDS.filter((h) => h === 'wren' || h === id || p.heroes.includes(h)) } };
}

/** Held fuer die naechsten Matches waehlen. Codes: `unknown-hero`, `hero-locked`. */
export function selectHero(p: Profile, id: HeroType): { ok: true; profile: Profile } | Fail {
  if (!HEROES.some((h) => h.id === id)) return fail('unknown-hero', 'Unknown hero.');
  if (!heroOwned(p, id)) return fail('hero-locked', heroLock(p, id).text);
  return { ok: true, profile: { ...p, selectedHero: id } };
}

/** Der Held, mit dem das naechste Match startet: der gewaehlte, sonst Wren. */
export const activeHero = (p: Profile): HeroType => (heroOwned(p, p.selectedHero) ? p.selectedHero : 'wren');

export interface HeroStoreEntry {
  meta: (typeof HEROES)[number];
  lock: HeroLock;
  selected: boolean;
  /** Preis im Match in Gold. */
  matchPrice: number;
}
/** Store-Rubrik "Heroes": alle drei Helden mit Schloss, Auswahl und Preis. */
export function heroStore(p: Profile): HeroStoreEntry[] {
  return HEROES.map((meta) => ({ meta, lock: heroLock(p, meta.id), selected: activeHero(p) === meta.id, matchPrice: DATA.hero[meta.id].price }));
}

// ---------------------------------------------------------------- Wissensbaum

export function knowledgePoints(p: Profile): { total: number; spent: number; free: number } {
  // Runde 13: ein Punkt je Level-Up und einer je erster Medaille
  const total = playerLevel(p) - 1 + medalCount(p);
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
  const xp = Math.max(p.playerXp, xpForLevel(30));
  const full = TIER_COST.reduce((s, c) => s + c, 0) * 3;
  return {
    ...p,
    playerXp: xp,
    towerTiers: Object.fromEntries(TOWER_TYPES.map((t) => [t, [...maxed]])) as Record<TowerType, Tiers>,
    towerXp: Object.fromEntries(TOWER_TYPES.map((t) => [t, full])) as Record<TowerType, number>,
  };
}

// ---------------------------------------------------------------- Optionen fuer die Sim

export type MatchOptions = Required<Pick<GameOptions, 'unlocks' | 'towerXp'>> & { powers: Record<PowerKey, number> } & { mods: NonNullable<GameOptions['mods']>; mode: ModeId; /** Runde 16: gewaehlter Held. */ hero: HeroType };

/**
 * `unlocks` + `towerXp` + `powers` (Inventar) + `mods` + `mode` (Runde 15, Vorgabe `standard`) fuer `createGame`; die Karte reicht der Aufrufer selbst weiter. `towerXp` ist das Konto (Sim fuehrt es im Match, `unlockTier` im Match),
 * `mods.towerXpBp` = Fast Learner. Mit "unlock everything" ist alles frei.
 */
export function matchOptions(p: Profile, mode: ModeId = 'standard'): MatchOptions {
  const all = p.settings.unlockAll;
  const towers: (TowerType | HeroType)[] = [...TOWER_TYPES.filter((t) => isTowerUnlocked(p, t))];
  for (const h of HERO_IDS) if (heroOwned(p, h)) towers.push(h);
  const full: Tiers = [5, 5, 5];
  const maxTier = Object.fromEntries(TOWER_TYPES.map((t) => [t, all ? full : ([...p.towerTiers[t]] as Tiers)])) as Record<TowerType, Tiers>;

  const k = (id: string): boolean => hasKnow(p, id);
  const mods: MatchOptions['mods'] = {};
  mods.startCash = (k('head-start') ? 100 : 0) + (k('big-head-start') ? 200 : 0);
  if (!mods.startCash) delete mods.startCash;
  mods.lives = (k('extra-lives') ? 10 : 0) + (k('thick-walls') ? 15 : 0);
  if (!mods.lives) delete mods.lives;
  if (k('better-deals')) mods.sellBp = 7500;
  if (k('lantern-tax')) mods.earlyBonus = 20;
  if (k('cheaper-basics')) mods.t1DiscountBp = 1000;
  const rangeBp: Partial<Record<TowerType, number>> = {};
  if (k('sharp-eyes')) rangeBp.ranger = 800;
  if (k('deep-roots')) rangeBp.thornweaver = 1000; // Runde 14
  if (k('deep-water')) rangeBp.riverkeeper = 1000; // Runde 16
  if (Object.keys(rangeBp).length) mods.rangeBp = rangeBp;
  if (k('bigger-barrels')) mods.radiusBp = 1000;
  if (k('cold-snap')) mods.slowDurBp = 2500;
  if (k('veteran-hero')) mods.heroStartLevel = 3;
  if (k('legendary')) mods.heroStartLevel = 5;
  if (k('fast-learner')) mods.towerXpBp = 2000;
  // Runde 13
  if (k('veteran-primaries')) mods.t2DiscountBp = 1000;
  const tempo: Partial<Record<TowerType, number>> = {};
  if (k('quick-hands')) { tempo.ranger = 500; tempo.bombardier = 500; }
  if (k('steady-aim')) tempo.longshot = 1000;
  if (Object.keys(tempo).length) mods.tempoBp = tempo;
  if (k('deep-freeze')) mods.freezeAddTicks = 30;
  if (k('market-savvy')) mods.marketBp = 1000;
  if (k('compound-interest')) mods.bankRateBp = 500;
  if (k('supply-lines')) mods.supplyBonus = 200;
  if (k('wide-aura')) mods.marketRadiusBp = 1500;
  // Bulk Orders und Investor (Runde 14) stapeln: je -10 % auf den Kaufpreis eines Markets
  const marketPrice = (k('bulk-orders') ? 1000 : 0) + (k('investor') ? 1000 : 0);
  if (marketPrice) mods.marketPriceBp = marketPrice;
  if (k('hero-training')) mods.heroXpBp = 1500;
  if (k('spare-pocket')) mods.powerUses = 2;
  if (k('starter-kit')) mods.freePowers = { goldDrop: STARTER_KIT_GOLD_DROPS };
  // Runde 14
  if (k('pop-bonus')) mods.popCashBp = 500;
  const pierceAdd: Partial<Record<TowerType, number>> = {};
  if (k('sharper-arrows')) pierceAdd.ranger = 1;
  if (k('barbed-line')) pierceAdd.riverkeeper = 1; // Runde 16
  if (Object.keys(pierceAdd).length) mods.pierceAdd = pierceAdd;
  if (k('fused-shells')) mods.fragAdd = { bombardier: 2 };
  if (k('icicle-edge')) mods.icicleDmg = 1;
  if (k('bountiful-grove')) mods.bountyGold = 50;
  if (k('potent-brews')) mods.brewDurBp = 2500;
  if (k('midas-hands')) mods.leadGoldAdd = 20;
  if (k('field-medic')) mods.roundLives = 1;
  if (k('sturdy-gate')) mods.gate = 1;
  // Runde 16: Riverkeeper, Bellringer, Tinker
  if (k('loud-bells')) mods.auraRadiusBp = { bellringer: 1500 };
  if (k('silver-tongue')) mods.tollAdd = 25;
  if (k('spare-parts')) mods.sentryTtlBp = 2500;
  if (k('sharp-caltrops')) mods.trapChargesAdd = 2;
  return { unlocks: { towers, maxTier }, towerXp: { ...p.towerXp }, powers: { ...emptyInventory(), ...p.inventory }, mods, mode, hero: activeHero(p) };
}

export { DIFFICULTIES, KNOWLEDGE };
