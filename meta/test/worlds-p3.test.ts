import { beforeAll, describe, expect, it } from 'vitest';
import { WORLDS, balanceOf, infiniteGemsUpTo, newProfile, rewardForMatch, rewardFromReplay, stageInfo, stageLock, stageView, testEnv, worldView, isStageUnlocked, type Profile } from '../src';
import { botReplay } from './replay-fixture';

const env = () => testEnv(5);
const fresh = (): Profile => newProfile(env());
const summary = (stageId: string, over: Record<string, unknown> = {}) => ({ stageId, difficulty: 'normal', outcome: 'win' as const, waveReached: 15, replayHash: `${stageId}-${Math.random()}`, ...over });
/** Profil mit geschafften Acts (normal) */
const cleared = (...stages: string[]): Profile => ({
  ...fresh(),
  stages: Object.fromEntries(stages.map((s) => [s, { normal: { clears: 1, firstClearAt: 'x', bestWave: 15 } }])),
});

describe('Welten: Katalog und Freischaltung', () => {
  it('mindestens drei Welten mit je 6 Acts und Infinite, Reihenfolge nach order', () => {
    expect(WORLDS.length).toBeGreaterThanOrEqual(3);
    for (const w of WORLDS) {
      expect(w.acts).toHaveLength(6);
      expect(stageInfo(w.infinite.stageId)?.kind).toBe('infinite');
    }
    expect(WORLDS[0].unlock).toBeNull();
  });

  it('Acts schalten nacheinander frei, Welt 2 erst nach Act 3 von Welt 1, Infinite nach Act 3', () => {
    const p = fresh();
    expect(isStageUnlocked(p, 'greenie-1')).toBe(true);
    expect(stageLock(p, 'greenie-2')).toEqual({ kind: 'act', act: 1 });
    expect(stageLock(p, 'greenie-6')).toEqual({ kind: 'act', act: 5 });
    expect(stageLock(p, 'walled-city-1')).toEqual({ kind: 'world', worldId: 'greenie', worldName: 'Planet Greenie', afterAct: 3 });
    expect(stageLock(p, 'greenie-infinite')).toEqual({ kind: 'infinite', act: 3 });
    const a = cleared('greenie-1');
    expect(isStageUnlocked(a, 'greenie-2')).toBe(true);
    expect(isStageUnlocked(a, 'greenie-3')).toBe(false);
    const b = cleared('greenie-1', 'greenie-2', 'greenie-3');
    expect(isStageUnlocked(b, 'walled-city-1')).toBe(true);
    expect(isStageUnlocked(b, 'greenie-infinite')).toBe(true);
    expect(isStageUnlocked(b, 'snowy-town-1')).toBe(false);
    // geschafft in Hard zaehlt auch
    const hard: Profile = { ...fresh(), stages: { 'greenie-1': { hard: { clears: 1, firstClearAt: 'x', bestWave: 15 } } } };
    expect(isStageUnlocked(hard, 'greenie-2')).toBe(true);
  });

  it('Stages ausserhalb der Weltstruktur (standard20) sind immer offen', () => {
    expect(stageLock(fresh(), 'standard20')).toBeNull();
    expect(stageInfo('standard20')).toBeNull();
  });
});

describe('Welten: Belohnung', () => {
  it('Erst-Clear eines Acts: 80 Crystals und 50 XP (design-brief 1), Wiederholung 20 Crystals und 50 XP', () => {
    const a = rewardForMatch(fresh(), summary('greenie-1'), env());
    if (!a.ok) throw new Error(a.message);
    expect(a.result).toMatchObject({ crystals: 80, firstClear: true, xp: 50 });
    expect(a.profile.stages['greenie-1']!.normal).toMatchObject({ clears: 1, bestWave: 15 });
    const b = rewardForMatch(a.profile, summary('greenie-1'), env());
    if (!b.ok) throw new Error(b.message);
    expect(b.result).toMatchObject({ crystals: 20, firstClear: false, xp: 50 });
  });

  it('Gold und XP werden auf die Wellenzahl des Acts gekappt (15), nicht auf 20', () => {
    const r = rewardForMatch(fresh(), summary('greenie-1', { outcome: 'loss', waveReached: 99 }), env());
    if (!r.ok) throw new Error(r.message);
    expect(r.result).toMatchObject({ crystals: 0, gold: 10 * 15, xp: 15 });
  });

  it('gesperrte Stage bringt nichts (stage-locked), auch nicht mit gueltigem Match', () => {
    expect(rewardForMatch(fresh(), summary('greenie-2'), env())).toMatchObject({ ok: false, code: 'stage-locked' });
    expect(rewardForMatch(fresh(), summary('walled-city-1'), env())).toMatchObject({ ok: false, code: 'stage-locked' });
    expect(rewardForMatch(fresh(), summary('greenie-infinite', { outcome: 'loss', waveReached: 12 }), env())).toMatchObject({ ok: false, code: 'stage-locked' });
  });

  it('Infinite zahlt AA-Gems nach Welle, nur der Zuwachs ueber der Bestwelle', () => {
    expect([5, 6, 7, 14, 15, 25, 105, 200].map(infiniteGemsUpTo)).toEqual([0, 18, 21, 42, 47, 97, 497, 497]);
    const p = cleared('greenie-1', 'greenie-2', 'greenie-3');
    const a = rewardForMatch(p, summary('greenie-infinite', { outcome: 'loss', waveReached: 25 }), env());
    if (!a.ok) throw new Error(a.message);
    expect(a.result).toMatchObject({ crystals: 97, infinite: true, newBest: true, firstClear: false });
    expect(a.profile.stages['greenie-infinite']!.normal).toMatchObject({ clears: 0, firstClearAt: null, bestWave: 25 });
    const b = rewardForMatch(a.profile, summary('greenie-infinite', { outcome: 'loss', waveReached: 20 }), env());
    expect(b.ok && b.result).toMatchObject({ crystals: 0, newBest: false });
    const c = rewardForMatch(a.profile, summary('greenie-infinite', { outcome: 'loss', waveReached: 30 }), env());
    expect(c.ok && c.result.crystals).toBe(25);
  });
});

describe('Welten: Belohnung aus dem nachgerechneten Replay (Stage aus dem Replay)', () => {
  let act1: Record<string, any>;
  let act2: Record<string, any>;
  let snowy: Record<string, any>;
  let inf: Record<string, any>;
  beforeAll(() => {
    act1 = botReplay({ stage: 'greenie-1', only: ['goku_ssj3'] });
    act2 = botReplay({ stage: 'greenie-2', only: ['goku_ssj3'] });
    snowy = botReplay({ stage: 'snowy-town-1', only: ['goku_ssj3'] });
    inf = botReplay({ stage: 'greenie-infinite', only: ['goku_ssj3'], maxWaves: 22, maxTicks: 60000 });
  }, 120_000);

  it('Act 1 gewonnen: Stage und Welt kommen aus dem Replay, Erst-Clear gebucht, Act 2 schaltet frei', () => {
    expect(act1.result).toBe('win');
    const r = rewardFromReplay(fresh(), act1, env());
    if (!r.ok) throw new Error(r.message);
    expect(r.result).toMatchObject({ crystals: 80, firstClear: true, xp: 50 });
    expect(r.profile.stages['greenie-1']!.normal).toMatchObject({ clears: 1, bestWave: 15 });
    expect(balanceOf(r.profile, 'crystals')).toBe(80);
    expect(isStageUnlocked(r.profile, 'greenie-2')).toBe(true);
    expect(rewardFromReplay(r.profile, act1, env())).toMatchObject({ ok: false, code: 'already-reported' });
  });

  it('Replay einer gesperrten Stage zahlt nicht; mit geschafftem Vorgaenger schon; andere Welt, anderer Eintrag', () => {
    expect(rewardFromReplay(fresh(), act2, env())).toMatchObject({ ok: false, code: 'stage-locked' });
    const ok = rewardFromReplay(cleared('greenie-1'), act2, env());
    expect(ok.ok && ok.result.firstClear).toBe(true);
    expect(rewardFromReplay(fresh(), snowy, env())).toMatchObject({ ok: false, code: 'stage-locked' });
    const s = rewardFromReplay(cleared('greenie-1', 'greenie-2', 'greenie-3', 'walled-city-1', 'walled-city-2', 'walled-city-3'), snowy, env());
    if (!s.ok) throw new Error(s.message);
    expect(Object.keys(s.profile.stages)).toContain('snowy-town-1');
  });

  it('Stage im Kopf umgebogen -> Hash passt nicht (replay-mismatch)', () => {
    expect(rewardFromReplay(cleared('greenie-1'), { ...act1, stage: 'greenie-2' }, env())).toMatchObject({ ok: false, code: 'replay-mismatch' });
  });

  it('Infinite-Replay (Niederlage oder Abbruch nach Wellenlimit) wird nachgerechnet', () => {
    const p = cleared('greenie-1', 'greenie-2', 'greenie-3');
    if (inf.result === null) {
      expect(rewardFromReplay(p, inf, env())).toMatchObject({ ok: false, code: 'replay-incomplete' });
    } else {
      const r = rewardFromReplay(p, inf, env());
      expect(r.ok).toBe(true);
    }
  });
});

describe('Welten: Sichtmodelle', () => {
  it('worldView: frisches Profil, nur Welt 1 offen, Act 1 vorgeschlagen, Legend und Raids als Geruest', () => {
    const v = worldView(fresh());
    expect(v.worlds.map((w) => w.unlocked)).toEqual(WORLDS.map((w) => w.order === 1));
    expect(v.nextStageId).toBe('greenie-1');
    const w1 = v.worlds[0];
    expect(w1.acts.map((a) => a.unlocked)).toEqual([true, false, false, false, false, false]);
    expect(w1.acts[1].lock).toEqual({ kind: 'act', act: 1 });
    expect(w1.infinite.unlocked).toBe(false);
    expect(w1.palette.grass).toMatch(/^#/);
    expect(v.worlds[1].lock).toMatchObject({ kind: 'world', worldName: 'Planet Greenie' });
    expect(v.legend.length).toBeGreaterThanOrEqual(8);
    expect(v.raids.length).toBeGreaterThanOrEqual(5);
    expect([...v.legend, ...v.raids].every((x) => !x.playable)).toBe(true);
  });

  it('worldView: Fortschritt geht ein, naechster Act wandert weiter, Bestwelle und Schwierigkeiten', () => {
    const p: Profile = { ...fresh(), stages: { 'greenie-1': { normal: { clears: 1, firstClearAt: 'x', bestWave: 15 }, hard: { clears: 0, firstClearAt: null, bestWave: 9 } } } };
    const v = worldView(p);
    expect(v.worlds[0].acts[0]).toMatchObject({ cleared: true, clearedDifficulties: ['normal'], bestWave: 15, waves: 15 });
    expect(v.worlds[0].acts[1].unlocked).toBe(true);
    expect(v.worlds[0].actsCleared).toBe(1);
    expect(v.nextStageId).toBe('greenie-2');
  });

  it('stageView: info mit Welt, Act, Boss, Wellenzahl und Sperre; maxWaves je Stage', () => {
    const v = stageView(fresh(), 'greenie-2');
    expect(v.info).toMatchObject({ worldId: 'greenie', act: 2, bossName: 'Goldeo', waves: 15, unlocked: false, lock: { kind: 'act', act: 1 } });
    expect(v.difficulties[0]).toMatchObject({ maxWaves: 15, firstClearCrystals: 80, repeatCrystals: 20 });
    expect(stageView(fresh(), 'greenie-4').difficulties[0].maxWaves).toBe(20);
    expect(stageView(fresh(), 'standard20').info).toBeNull();
  });
});
