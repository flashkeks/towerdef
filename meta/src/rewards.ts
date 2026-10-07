/**
 * Match-Belohnungen. Besitzer: P5. Jetzt: feste Werte nach Stufe (Startwerte rec 13: Erst-Clear 100/150/200, Wiederholung 25 %).
 *
 * TODO P5: Belohnung aus dem REPLAY ableiten (nachrechnen, nicht Client-Angaben glauben), Werte/Kurven nach `docs/balancing/meta.md`,
 * `matchSummaryFromReplayHead` durch eine echte Ableitung ersetzen (Sim-Nachrechnung -> outcome, waveReached, replayHash).
 *
 * Idempotenz: jede Belohnung wird unter (refType 'match', refId replayHash) gebucht; dasselbe Replay zweimal -> `already-reported`.
 */
import type { MetaEnv } from './env';
import { bookAll, KIND, type BookingInput } from './ledger';
import { addPlayerXp, isDifficultyUnlocked } from './progression';
import type { Profile } from './profile';
import { fail, opOk, type Fail, type Op } from './result';

export interface MatchSummary {
  stageId: string;
  difficulty: string;
  outcome: 'win' | 'loss';
  waveReached: number;
  /** eindeutige Kennung des Laufs (Replay-Hash); dient der Doppelbuchungs-Sperre */
  replayHash: string;
}

export interface MatchReward {
  crystals: number;
  gold: number;
  xp: number;
  firstClear: boolean;
  levelsGained: number;
  playerLevel: number;
}

const FIRST_CLEAR_CRYSTALS: Record<string, number> = { normal: 100, hard: 150, nightmare: 200 };
const REPEAT_CRYSTALS: Record<string, number> = { normal: 25, hard: 38, nightmare: 50 };
const GOLD_WIN: Record<string, number> = { normal: 100, hard: 150, nightmare: 200 };
const XP_WIN: Record<string, number> = { normal: 60, hard: 90, nightmare: 120 };
const GOLD_LOSS = 30;
const XP_LOSS = 20;

export function rewardForMatch(p: Profile, s: MatchSummary, env: Pick<MetaEnv, 'now'>): Op<MatchReward> {
  if (!s.replayHash) return fail('invalid-match', 'Match has no id.');
  if (!(s.difficulty in FIRST_CLEAR_CRYSTALS)) return fail('unknown-difficulty', `Unknown difficulty ${s.difficulty}.`);
  if (!s.stageId) return fail('invalid-match', 'Match has no stage.');
  if (!isDifficultyUnlocked(p, s.difficulty)) return fail('difficulty-locked', 'This difficulty is not unlocked yet.');

  const prev = p.stages[s.stageId]?.[s.difficulty];
  const win = s.outcome === 'win';
  const firstClear = win && !(prev && prev.firstClearAt);
  const crystals = win ? (firstClear ? FIRST_CLEAR_CRYSTALS : REPEAT_CRYSTALS)[s.difficulty]! : 0;
  const gold = win ? GOLD_WIN[s.difficulty]! : GOLD_LOSS;
  const xp = win ? XP_WIN[s.difficulty]! : XP_LOSS;

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
  return opOk(profile, { crystals, gold, xp, firstClear, levelsGained: xpr.levelsGained, playerLevel: profile.playerLevel });
}

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

/** Platzhalter (P5): nimmt die Kopfdaten des Replays unbesehen. Unvollstaendige Replays zaehlen nicht. */
export function matchSummaryFromReplayHead(r: ReplayHead): { ok: true; summary: MatchSummary } | Fail {
  if (!r || typeof r !== 'object') return fail('invalid-replay', 'Replay is missing.');
  if (!r.complete || r.result === null) return fail('replay-incomplete', 'The match is not finished.');
  if (!r.endHash) return fail('invalid-replay', 'Replay has no end hash.');
  return {
    ok: true,
    summary: { stageId: r.stage, difficulty: r.difficulty, outcome: r.result, waveReached: r.endWave, replayHash: `${r.seed}-${r.endTick}-${r.endHash}` },
  };
}
