import { beforeAll, describe, expect, it } from 'vitest';
import { createSim } from '../../sim/src/index';
import { REWARD_TABLE, addPlayerXp, balanceOf, newProfile, repeatCrystals, rewardAmounts, rewardFromReplay, testEnv, verifyReplay, xpToReach, type Profile } from '../src';
import { botReplay } from './replay-fixture';

let win: Record<string, any>;
let loss: Record<string, any>;
const env = () => testEnv(3);
const fresh = (): Profile => newProfile(env());

beforeAll(() => {
  win = botReplay({ seed: 7 });
  loss = botReplay({ seed: 3, only: ['gyutaro_evolved'] });
}, 60_000);

describe('Belohnung aus dem Replay (nachgerechnet)', () => {
  it('Fixtures sind ein Sieg und eine Niederlage', () => {
    expect(win.result).toBe('win');
    expect(loss.result).toBe('loss');
  });

  it('Sieg: Erst-Clear 80 Crystals, Gold und XP nach Tabelle, Stage-Fortschritt, Messung der Rechenzeit', () => {
    const r = rewardFromReplay(fresh(), win, env());
    if (!r.ok) throw new Error(r.message);
    expect(r.result).toMatchObject({ crystals: 80, firstClear: true });
    expect(r.result.gold).toBe(150 + 10 * 20);
    expect(r.result.xp).toBe(35 + 1 * 20);
    expect(r.profile.stages['standard20']!['normal']).toMatchObject({ clears: 1, bestWave: 20 });
    expect(balanceOf(r.profile, 'crystals')).toBe(80);
    expect(r.profile.playerXp).toBe(55);
    console.log(`Nachrechnen eines vollen Siegs: ${r.result.verifyMs} ms (Node)`);
    expect(r.result.verifyMs).toBeLessThan(20_000);
  });

  it('Niederlage gibt Gold und XP nach erreichter Welle, keine Crystals', () => {
    const r = rewardFromReplay(fresh(), loss, env());
    if (!r.ok) throw new Error(r.message);
    const v = verifyReplay(loss);
    if (!v.ok) throw new Error('x');
    expect(v.match.outcome).toBe('loss');
    expect(v.match.waveReached).toBeLessThan(20);
    expect(r.result.crystals).toBe(0);
    expect(r.result.firstClear).toBe(false);
    // Belohnt werden gehaltene Wellen (alle Gegner getötet, kein Leak), nicht gerufene.
    expect(v.match.wavesHeld).toBeLessThanOrEqual(v.match.waveReached);
    expect(r.result.gold).toBe(10 * v.match.wavesHeld);
    expect(r.result.gold).toBeGreaterThan(0);
    expect(r.result.xp).toBe(1 * v.match.wavesHeld);
    expect(r.profile.stages['standard20']!['normal']).toMatchObject({ clears: 0, firstClearAt: null, bestWave: v.match.wavesHeld });
  });

  it('Doppelmeldung: dasselbe Replay zahlt nur einmal', () => {
    const a = rewardFromReplay(fresh(), win, env());
    if (!a.ok) throw new Error(a.message);
    const b = rewardFromReplay(a.profile, win, env());
    expect(b).toMatchObject({ ok: false, code: 'already-reported' });
    expect(balanceOf(a.profile, 'crystals')).toBe(80);
    // anderes Replay desselben Spielers: Wiederholung 25 %
    const c = rewardFromReplay(a.profile, botReplay({ seed: 1 }), env());
    expect(c.ok && c.result).toMatchObject({ crystals: 20, firstClear: false });
  });

  it('manipuliertes Replay: Ergebnis, Hash, Welle, Befehle, Seed -> keine Belohnung', () => {
    const p = fresh();
    const bad = (m: (r: Record<string, any>) => void) => {
      const r = structuredClone(loss);
      m(r);
      return rewardFromReplay(p, r, env());
    };
    expect(bad((r) => (r.result = 'win'))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(bad((r) => (r.endHash = 'deadbeef'))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(bad((r) => (r.seed += 1))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(bad((r) => (r.commands = r.commands.slice(0, 3)))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(bad((r) => (r.commands[0].ok = !r.commands[0].ok))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    // endWave im Kopf ist egal: gezaehlt wird, was die Sim sieht
    const claimed = bad((r) => (r.endWave = 20));
    const honest = rewardFromReplay(p, loss, env());
    expect(claimed.ok && honest.ok && claimed.result.gold).toBe(honest.ok ? honest.result.gold : -1);
  });

  it('ungueltige und unvollstaendige Replays: Fehlercode statt Absturz', () => {
    const p = fresh();
    expect(rewardFromReplay(p, null, env())).toMatchObject({ ok: false, code: 'invalid-replay' });
    expect(rewardFromReplay(p, { format: 'x' }, env())).toMatchObject({ ok: false, code: 'invalid-replay' });
    expect(rewardFromReplay(p, { ...win, complete: false, result: null }, env())).toMatchObject({ ok: false, code: 'replay-incomplete' });
    expect(rewardFromReplay(p, { ...win, formatVersion: 1 }, env())).toMatchObject({ ok: false, code: 'replay-old-rules' });
    expect(rewardFromReplay(p, { ...win, formatVersion: 9 }, env())).toMatchObject({ ok: false, code: 'replay-unsupported' });
    expect(rewardFromReplay(p, { ...win, stage: 'gibt-es-nicht' }, env())).toMatchObject({ ok: false, code: 'invalid-replay' });
    expect(rewardFromReplay(p, { ...win, difficulty: 'easy' }, env())).toMatchObject({ ok: false, code: 'unknown-difficulty' });
    expect(rewardFromReplay(p, { ...win, players: 2 }, env())).toMatchObject({ ok: false, code: 'replay-unsupported' });
    expect(rewardFromReplay(p, { ...win, endTick: 10_000_000 }, env())).toMatchObject({ ok: false, code: 'invalid-replay' });
    expect(rewardFromReplay(p, { ...win, commands: 'x' }, env())).toMatchObject({ ok: false, code: 'invalid-replay' });
    expect(rewardFromReplay(p, { ...win, unitMods: 'x', formatVersion: 4 }, env())).toMatchObject({ ok: false, code: 'invalid-replay' });
  });

  it('v4 mit leeren unitMods wird nachgerechnet; Mods aus dem Kopf gehen in die Sim', () => {
    const v4 = { ...win, formatVersion: 4, unitMods: [] };
    expect(rewardFromReplay(fresh(), v4, env())).toMatchObject({ ok: true });
    // Mods veraendern den Lauf: derselbe Hash passt dann nicht mehr (Beweis, dass sie durchgereicht werden)
    const modded = { ...win, formatVersion: 4, unitMods: [{ player: 0, unit: 'goku_ssj3', lvlBp: 20000 }] };
    expect(verifyReplay(modded)).toMatchObject({ ok: false, code: 'replay-mismatch' });
    // Override durch den Aufrufer hat Vorrang vor dem Kopf
    expect(verifyReplay(modded, { unitMods: [] })).toMatchObject({ ok: true });
  });

  it('gesperrte Stufe: Hard ohne Spieler-Level 5 gibt nichts', () => {
    const h = botReplay({ seed: 7, difficulty: 'hard' });
    expect(rewardFromReplay(fresh(), h, env())).toMatchObject({ ok: false, code: 'difficulty-locked' });
    const lvl5 = addPlayerXp(fresh(), xpToReach(5)).profile;
    expect(rewardFromReplay(lvl5, h, env()).ok).toBe(true);
  });

  it('gewaehltes Team: nur Besessene, nur Teamlisten-Units platziert', () => {
    const placed = [...new Set(verifyReplayPlaced())];
    const team = ['ichigo', 'krillin', 'josuke', 'speedwagon', 'goku_ssj3'];
    const owned = (ids: string[]): Profile => ({ ...fresh(), units: Object.fromEntries(ids.map((u) => [u, { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: 'x' }])) });
    const withTeam = { ...win, team };
    if (placed.every((u) => team.includes(u))) expect(rewardFromReplay(owned(team), withTeam, env()).ok).toBe(true);
    expect(rewardFromReplay(owned(['ichigo']), withTeam, env())).toMatchObject({ ok: false, code: 'unit-not-owned' });
    expect(rewardFromReplay(owned(team), { ...win, team: ['ichigo'] }, env())).toMatchObject({ ok: false, code: 'team-invalid' });
    expect(rewardFromReplay(owned(team), { ...win, team: ['ichigo', 'ichigo'] }, env())).toMatchObject({ ok: false, code: 'team-invalid' });
  });
});

function verifyReplayPlaced(): string[] {
  const v = verifyReplay(win);
  return v.ok ? v.match.placedUnits : [];
}

describe('Zahlen der Tabelle', () => {
  it('Erst-Clear und Wiederholung', () => {
    expect(REWARD_TABLE.crystals.firstClear).toEqual({ normal: 80, hard: 120, nightmare: 160 });
    expect(['normal', 'hard', 'nightmare'].map(repeatCrystals)).toEqual([20, 30, 40]);
  });
  it('Sieg in Welle 15 entspricht 50/80/115 XP (AA: 50 je Act), Niederlage bekommt Wellenanteil', () => {
    expect(['normal', 'hard', 'nightmare'].map((d) => rewardAmounts(d, 'win', 15, true).xp)).toEqual([50, 80, 115]);
    expect(rewardAmounts('normal', 'loss', 10, false)).toEqual({ crystals: 0, gold: 100, xp: 10 });
    expect(rewardAmounts('normal', 'loss', 0, false)).toEqual({ crystals: 0, gold: 0, xp: 0 });
    expect(rewardAmounts('normal', 'loss', 99, false).gold).toBe(200); // gekappt auf 20 Wellen
  });
});

describe('Wellen vorrufen ohne Verteidigung (Befund P4)', () => {
  it('zahlt keine Wellen-Belohnung: gerufene Wellen zählen nicht, nur gehaltene', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 11 });
    const commands: { tick: number; player: number; cmd: unknown; ok: boolean }[] = [];
    while (!sim.isOver() && sim.state.tick < 20 * 60 * 30) {
      if (sim.state.tick % 20 === 0) {
        const cmd = { type: 'skipWave' } as const;
        commands.push({ tick: sim.state.tick, player: 0, cmd, ok: sim.apply(0, cmd).ok });
      }
      sim.step(1);
    }
    const replay = { format: 'towerdef-replay', formatVersion: 4, stage: 'standard20', difficulty: 'normal', players: 1, seed: 11, team: null, unitMods: [], complete: true, result: sim.result(), endTick: sim.state.tick, endHash: sim.hash(), commands };
    const v = verifyReplay(replay);
    if (!v.ok) throw new Error(v.message);
    expect(v.match.outcome).toBe('loss');
    expect(v.match.waveReached).toBeGreaterThan(5);
    expect(v.match.wavesHeld).toBe(0);
    const r = rewardFromReplay(newProfile(testEnv()), replay, testEnv());
    if (!r.ok) throw new Error(r.message);
    expect(r.result.gold).toBe(0);
    expect(r.result.xp).toBe(0);
  });
});
