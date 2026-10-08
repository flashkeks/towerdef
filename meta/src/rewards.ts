/**
 * Match-Belohnungen. Besitzer: P5. Startwerte in `data/rewards.json` (Herleitung: docs/balancing/meta.md).
 *
 * Der Weg: `rewardFromReplay` rechnet das Replay mit der Sim nach (`verify.ts`: Seed, Stufe, Befehle -> Ergebnis, Welle, Hash) und gibt NUR
 * das nachgerechnete Ergebnis an `rewardForMatch`. Angaben des Clients ausser dem Replay selbst zaehlen nicht. Hash-Abweichung oder
 * ungueltiges Replay -> keine Belohnung, Fehlercode. Idempotenz: jede Belohnung wird unter (refType 'match', refId replayId) gebucht;
 * dasselbe Replay zweimal -> `already-reported`.
 */
import type { MetaEnv } from './env';
import { bookAll, KIND, type BookingInput } from './ledger';
import { addPlayerXp, isDifficultyUnlocked } from './progression';
import { infiniteGemsUpTo, isInfiniteStage, stageLock, stageWaveCap } from './worlds';
import { MAX_TEAM, type Profile } from './profile';
import { fail, opOk, type Fail, type Op } from './result';
import { canonicalJson } from './util';
import { unitModsFor } from './unit-mods';
import { verifyReplay, type VerifiedMatch, type VerifyOptions } from './verify';
import rewardsJson from '../data/rewards.json';

export interface MatchSummary {
  stageId: string;
  difficulty: string;
  outcome: 'win' | 'loss';
  waveReached: number;
  /** eindeutige Kennung des Laufs (`VerifiedMatch.replayId`); dient der Doppelbuchungs-Sperre */
  replayHash: string;
}

export interface MatchReward {
  crystals: number;
  gold: number;
  xp: number;
  firstClear: boolean;
  levelsGained: number;
  playerLevel: number;
  /** Runde 8 / P3: Infinite-Lauf (Crystals nach AA-Gem-Tabelle, nur Zuwachs ueber der Bestwelle) */
  infinite?: boolean;
  /** Runde 8 / P3: Infinite: neue Bestwelle erreicht */
  newBest?: boolean;
  /** Rechenzeit des Nachrechnens in ms (nur bei `rewardFromReplay`) */
  verifyMs?: number;
}

type ByDifficulty = Record<string, number>;
export const REWARD_TABLE = rewardsJson as unknown as {
  maxWaves: number;
  crystals: { firstClear: ByDifficulty; repeatBp: number };
  gold: { win: ByDifficulty; perWave: ByDifficulty };
  xp: { win: ByDifficulty; perWave: ByDifficulty };
  infinite: { gems: { from: number; to: number; perWave: number }[] };
};
const FIRST_CLEAR_CRYSTALS = REWARD_TABLE.crystals.firstClear;

/** Wiederholungs-Crystals: Anteil des Erst-Clears, kaufmaennisch gerundet (Normal 25, Hard 38, Nightmare 50). */
export const repeatCrystals = (difficulty: string): number => Math.floor(((FIRST_CLEAR_CRYSTALS[difficulty] ?? 0) * REWARD_TABLE.crystals.repeatBp + 5000) / 10000);

/** Reine Rechnung ohne Profil: was ein Lauf bringt. `waveReached` wird auf 0..`cap` gekappt (Standard `maxWaves`; Acts kappen auf ihre Wellenzahl). */
export function rewardAmounts(difficulty: string, outcome: 'win' | 'loss', waveReached: number, firstClear: boolean, cap: number = REWARD_TABLE.maxWaves): { crystals: number; gold: number; xp: number } {
  const w = Math.min(cap, Math.max(0, Math.floor(waveReached)));
  const win = outcome === 'win';
  return {
    crystals: win ? (firstClear ? FIRST_CLEAR_CRYSTALS[difficulty]! : repeatCrystals(difficulty)) : 0,
    gold: (win ? REWARD_TABLE.gold.win[difficulty]! : 0) + REWARD_TABLE.gold.perWave[difficulty]! * w,
    xp: (win ? REWARD_TABLE.xp.win[difficulty]! : 0) + REWARD_TABLE.xp.perWave[difficulty]! * w,
  };
}

export function rewardForMatch(p: Profile, s: MatchSummary, env: Pick<MetaEnv, 'now'>): Op<MatchReward> {
  if (!s.replayHash) return fail('invalid-match', 'Match has no id.');
  if (!(s.difficulty in FIRST_CLEAR_CRYSTALS)) return fail('unknown-difficulty', `Unknown difficulty ${s.difficulty}.`);
  if (!s.stageId) return fail('invalid-match', 'Match has no stage.');
  if (!isDifficultyUnlocked(p, s.difficulty)) return fail('difficulty-locked', 'This difficulty is not unlocked yet.');
  // Runde 8 / P3: Acts schalten nacheinander frei; ein Replay auf einer gesperrten Stage bringt nichts (Stages ausserhalb der Welten sind offen)
  if (stageLock(p, s.stageId)) return fail('stage-locked', 'This stage is not unlocked yet.');

  const prev = p.stages[s.stageId]?.[s.difficulty];
  const win = s.outcome === 'win';
  const infinite = isInfiniteStage(s.stageId);
  const firstClear = win && !infinite && !(prev && prev.firstClearAt);
  const amounts = rewardAmounts(s.difficulty, s.outcome, s.waveReached, firstClear, infinite ? REWARD_TABLE.maxWaves : stageWaveCap(s.stageId));
  // Infinite (AA): Crystals nach Gem-Tabelle je gehaltener Welle, bezahlt wird nur der Zuwachs ueber der bisherigen Bestwelle dieser Stufe
  const held = Math.max(0, Math.floor(s.waveReached));
  const newBest = infinite && held > (prev?.bestWave ?? 0);
  const crystals = infinite ? Math.max(0, infiniteGemsUpTo(held) - infiniteGemsUpTo(prev?.bestWave ?? 0)) : amounts.crystals;
  const { gold, xp } = amounts;

  const bookings: BookingInput[] = [];
  const base = { kind: KIND.reward, refType: 'match', refId: s.replayHash };
  if (crystals > 0) bookings.push({ ...base, currency: 'crystals', delta: crystals });
  if (gold > 0) bookings.push({ ...base, currency: 'gold', delta: gold });
  const booked = bookAll(p, bookings, env);
  if (!booked.ok) return booked.code === 'duplicate-booking' ? fail('already-reported', 'This match was already counted.') : booked;

  const xpr = addPlayerXp(booked.profile, xp);
  const stage = {
    clears: (prev?.clears ?? 0) + (win ? 1 : 0),
    firstClearAt: prev?.firstClearAt ?? (win ? env.now() : null),
    bestWave: Math.max(prev?.bestWave ?? 0, Math.max(0, Math.floor(s.waveReached))),
  };
  const profile: Profile = { ...xpr.profile, stages: { ...p.stages, [s.stageId]: { ...(p.stages[s.stageId] ?? {}), [s.difficulty]: stage } } };
  return opOk(profile, { crystals, gold, xp, firstClear, levelsGained: xpr.levelsGained, playerLevel: profile.playerLevel, ...(infinite ? { infinite: true, newBest } : {}) });
}

export interface RewardOptions extends VerifyOptions {
  /**
   * P4 (Sicherheitsluecke aus P5): das Replay muss zum Profil passen. Client und Server setzen das IMMER (`LocalBackend`, spaeter M2).
   * Ohne die Option gelten nur die Pruefungen bei gewaehltem Team (Tests mit Bot-Replays ohne Team).
   */
  bindToProfile?: boolean;
}

/**
 * Bindung an das Profil (`bindToProfile`): ein Replay darf sich keine Level geben und keine Units benutzen, die der Spieler nicht hat.
 * - `team-required`: kein Team im Replay-Kopf (ohne Team laesst sich nichts pruefen)
 * - `team-mismatch`: Team im Kopf ist nicht das gespeicherte Team des Profils (als Menge; Reihenfolge ist egal)
 * - `team-invalid` / `unit-not-owned`: Duplikate, mehr als 6, nicht besessene Unit
 * - `unit-mods-mismatch`: `unitMods` im Kopf sind nicht genau `unitModsFor(profile, team)` (Level/Sterne im Profil sind massgeblich)
 * - `team-invalid` bei einer platzierten Unit ausserhalb des Teams (gilt auch ohne `bindToProfile`)
 */
function checkBoundToProfile(p: Profile, m: VerifiedMatch): Fail | null {
  if (!m.team || m.team.length === 0) return fail('team-required', 'This replay has no team, so it cannot be checked.');
  if (m.team.length > MAX_TEAM || new Set(m.team).size !== m.team.length) return fail('team-invalid', 'The team in this replay is not valid.');
  const missing = m.team.find((u) => !p.units[u]);
  if (missing) return fail('unit-not-owned', `You do not own ${missing}.`);
  const stored = [...p.team].sort().join('|');
  if (stored !== [...m.team].sort().join('|')) return fail('team-mismatch', 'The team in this replay is not your saved team.');
  const key = (mods: readonly unknown[]): string[] => mods.map((x) => canonicalJson(x)).sort();
  const want = key(unitModsFor(p, m.team));
  const have = key(m.unitMods);
  if (want.length !== have.length || want.some((x, i) => x !== have[i])) return fail('unit-mods-mismatch', 'The unit levels in this replay do not match your collection.');
  return null;
}

/**
 * Belohnung aus einem Replay. Rechnet nach (`verifyReplay`), prueft bei gewaehltem Team die Besitzverhaeltnisse und bucht dann.
 * Fehlercodes: `invalid-replay`, `replay-incomplete`, `replay-old-rules`, `replay-unsupported`, `replay-mismatch` (Hash/Ergebnis stimmt nicht),
 * `unknown-difficulty`, `difficulty-locked`, `unit-not-owned`, `team-invalid`, `already-reported`;
 * mit `opts.bindToProfile` zusaetzlich `team-required`, `team-mismatch`, `unit-mods-mismatch`.
 * Ohne `bindToProfile` und ohne Team im Replay (`team: null`) entfaellt die Besitzpruefung. Der Client setzt `bindToProfile` immer (Runde 7, P4).
 */
export function rewardFromReplay(p: Profile, replay: unknown, env: Pick<MetaEnv, 'now'>, opts: RewardOptions = {}): Op<MatchReward> {
  const v = verifyReplay(replay, opts);
  if (!v.ok) return v;
  const m = v.match;
  if (opts.bindToProfile) {
    const bound = checkBoundToProfile(p, m);
    if (bound) return bound;
  }
  if (m.team) {
    if (m.team.length > MAX_TEAM || new Set(m.team).size !== m.team.length) return fail('team-invalid', 'The team in this replay is not valid.');
    const missing = m.team.find((u) => !p.units[u]);
    if (missing) return fail('unit-not-owned', `You do not own ${missing}.`);
    const stray = m.placedUnits.find((u) => !m.team!.includes(u));
    if (stray) return fail('team-invalid', `${stray} is not in the team of this replay.`);
  }
  const r = rewardForMatch(p, { stageId: m.stageId, difficulty: m.difficulty, outcome: m.outcome, waveReached: m.wavesHeld, replayHash: m.replayId }, env);
  return r.ok ? { ...r, result: { ...r.result, verifyMs: m.ms } } : r;
}

/**
 * Nur Kopfdaten, UNVERIFIZIERT (Altbestand aus P1, nur noch fuer Tests/Anzeige). Belohnt wird ausschliesslich ueber `rewardFromReplay`.
 */
/** Kopfdaten eines Replays (strukturell, passt auf `ReplayFile` des Client-Recorders). */
export interface ReplayHead {
  stage: string;
  difficulty: string;
  seed: number;
  complete: boolean;
  result: 'win' | 'loss' | null;
  endWave: number;
  endTick: number;
  endHash: string;
}

export function matchSummaryFromReplayHead(r: ReplayHead): { ok: true; summary: MatchSummary } | Fail {
  if (!r || typeof r !== 'object') return fail('invalid-replay', 'Replay is missing.');
  if (!r.complete || r.result === null) return fail('replay-incomplete', 'The match is not finished.');
  if (!r.endHash) return fail('invalid-replay', 'Replay has no end hash.');
  return {
    ok: true,
    summary: { stageId: r.stage, difficulty: r.difficulty, outcome: r.result, waveReached: r.endWave, replayHash: `${r.seed}-${r.endTick}-${r.endHash}` },
  };
}
