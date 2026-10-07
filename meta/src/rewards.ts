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
import { MAX_TEAM, type Profile } from './profile';
import { fail, opOk, type Fail, type Op } from './result';
import { verifyReplay, type VerifyOptions } from './verify';
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
  /** Rechenzeit des Nachrechnens in ms (nur bei `rewardFromReplay`) */
  verifyMs?: number;
}

type ByDifficulty = Record<string, number>;
export const REWARD_TABLE = rewardsJson as unknown as {
  maxWaves: number;
  crystals: { firstClear: ByDifficulty; repeatBp: number };
  gold: { win: ByDifficulty; perWave: ByDifficulty };
  xp: { win: ByDifficulty; perWave: ByDifficulty };
};
const FIRST_CLEAR_CRYSTALS = REWARD_TABLE.crystals.firstClear;

/** Wiederholungs-Crystals: Anteil des Erst-Clears, kaufmaennisch gerundet (Normal 25, Hard 38, Nightmare 50). */
export const repeatCrystals = (difficulty: string): number => Math.floor(((FIRST_CLEAR_CRYSTALS[difficulty] ?? 0) * REWARD_TABLE.crystals.repeatBp + 5000) / 10000);

/** Reine Rechnung ohne Profil: was ein Lauf bringt. `waveReached` wird auf 0..maxWaves gekappt. */
export function rewardAmounts(difficulty: string, outcome: 'win' | 'loss', waveReached: number, firstClear: boolean): { crystals: number; gold: number; xp: number } {
  const w = Math.min(REWARD_TABLE.maxWaves, Math.max(0, Math.floor(waveReached)));
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

  const prev = p.stages[s.stageId]?.[s.difficulty];
  const win = s.outcome === 'win';
  const firstClear = win && !(prev && prev.firstClearAt);
  const { crystals, gold, xp } = rewardAmounts(s.difficulty, s.outcome, s.waveReached, firstClear);

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

/**
 * Belohnung aus einem Replay. Rechnet nach (`verifyReplay`), prueft bei gewaehltem Team die Besitzverhaeltnisse und bucht dann.
 * Fehlercodes: `invalid-replay`, `replay-incomplete`, `replay-old-rules`, `replay-unsupported`, `replay-mismatch` (Hash/Ergebnis stimmt nicht),
 * `unknown-difficulty`, `difficulty-locked`, `unit-not-owned`, `team-invalid`, `already-reported`.
 * Ist im Replay kein Team angegeben (`team: null`, heutiger Client), entfaellt die Besitzpruefung (Hinweis in README).
 */
export function rewardFromReplay(p: Profile, replay: unknown, env: Pick<MetaEnv, 'now'>, opts: VerifyOptions = {}): Op<MatchReward> {
  const v = verifyReplay(replay, opts);
  if (!v.ok) return v;
  const m = v.match;
  if (m.team) {
    if (m.team.length > MAX_TEAM || new Set(m.team).size !== m.team.length) return fail('team-invalid', 'The team in this replay is not valid.');
    const missing = m.team.find((u) => !p.units[u]);
    if (missing) return fail('unit-not-owned', `You do not own ${missing}.`);
    const stray = m.placedUnits.find((u) => !m.team!.includes(u));
    if (stray) return fail('team-invalid', `${stray} is not in the team of this replay.`);
  }
  const r = rewardForMatch(p, { stageId: m.stageId, difficulty: m.difficulty, outcome: m.outcome, waveReached: m.waveReached, replayHash: m.replayId }, env);
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
