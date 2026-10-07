import { describe, expect, it } from 'vitest';
import { MockPaymentProvider, SHOP_CATALOG, addPlayerXp, balanceOf, buy, claimStarterGift, isDifficultyUnlocked, levelFromXp, levelUp, MAX_UNIT_LEVEL, matchSummaryFromReplayHead, newProfile, rewardForMatch, testEnv, unitModsFor, xpToReach } from '../src';

describe('Kreislauf (Platzhalter der Pakete laufen)', () => {
  it('Starter-Geschenk nur einmal', () => {
    const env = testEnv();
    const s = claimStarterGift(newProfile(env), env);
    if (!s.ok) throw new Error('x');
    expect(s.profile.flags.starterGiftClaimed).toBe(true);
    expect(Object.keys(s.profile.units).length).toBeGreaterThan(0);
    expect(claimStarterGift(s.profile, env)).toMatchObject({ ok: false, code: 'starter-already-claimed' });
  });
  it('Belohnung: Erst-Clear, Wiederholung, Niederlage, doppeltes Replay', () => {
    const env = testEnv();
    const p0 = newProfile(env);
    const sum = (h: string, outcome: 'win' | 'loss' = 'win') => ({ stageId: 'standard20', difficulty: 'normal', outcome, waveReached: 20, replayHash: h });
    const a = rewardForMatch(p0, sum('h1'), env);
    if (!a.ok) throw new Error(a.message);
    expect(a.result).toMatchObject({ crystals: 100, firstClear: true });
    expect(balanceOf(a.profile, 'crystals')).toBe(100);
    expect(a.profile.stages['standard20']!['normal']).toMatchObject({ clears: 1, bestWave: 20 });
    const b = rewardForMatch(a.profile, sum('h2'), env);
    expect(b.ok && b.result.crystals).toBe(25);
    expect(b.ok && b.result.firstClear).toBe(false);
    const c = rewardForMatch(b.ok ? b.profile : p0, sum('h3', 'loss'), env);
    expect(c.ok && c.result).toMatchObject({ crystals: 0, firstClear: false });
    expect(c.ok && c.result.gold).toBeGreaterThan(0);
    expect(rewardForMatch(a.profile, sum('h1'), env)).toMatchObject({ ok: false, code: 'already-reported' });
    expect(rewardForMatch(p0, { ...sum('h9'), difficulty: 'hard' }, env)).toMatchObject({ ok: false, code: 'difficulty-locked' });
  });
  it('Spieler-Level und Freischaltung', () => {
    const env = testEnv();
    const p = newProfile(env);
    expect(isDifficultyUnlocked(p, 'hard')).toBe(false);
    const r = addPlayerXp(p, xpToReach(5));
    expect(r.profile.playerLevel).toBe(5);
    expect(isDifficultyUnlocked(r.profile, 'hard')).toBe(true);
    expect(isDifficultyUnlocked(r.profile, 'nightmare')).toBe(false);
    expect(levelFromXp(xpToReach(25))).toBe(25);
  });
  it('Level-Up kostet Gold, bis Level 40, jede Stufe einmal', () => {
    const env = testEnv();
    const s = claimStarterGift(newProfile(env), env);
    if (!s.ok) throw new Error('x');
    const unit = Object.keys(s.profile.units)[0]!;
    expect(levelUp(s.profile, unit, env)).toMatchObject({ ok: false, code: 'not-enough-gold' });
    const rich = { ...s.profile, ledger: [...s.profile.ledger, { id: 'L9', currency: 'gold' as const, delta: 1_000_000, kind: 'grant', refType: 't', refId: 'g', createdAt: 'x' }], wallet: { ...s.profile.wallet, gold: 1_000_000 } };
    let p = rich;
    for (let i = 1; i < MAX_UNIT_LEVEL; i++) {
      const r = levelUp(p, unit, env);
      if (!r.ok) throw new Error(r.message);
      p = r.profile;
    }
    expect(p.units[unit]!.level).toBe(MAX_UNIT_LEVEL);
    expect(levelUp(p, unit, env)).toMatchObject({ ok: false, code: 'max-level' });
    expect(levelUp(p, 'nope', env)).toMatchObject({ ok: false, code: 'unit-not-owned' });
  });
  it('Mock-Kauf bucht Crystals genau einmal pro Bestellung', async () => {
    const env = testEnv();
    const p = newProfile(env);
    const r = await buy(p, SHOP_CATALOG[0]!.sku, env, new MockPaymentProvider(env));
    if (!r.ok) throw new Error(r.message);
    expect(balanceOf(r.profile, 'crystals')).toBe(SHOP_CATALOG[0]!.crystals);
    expect(r.profile.ledger[0]).toMatchObject({ kind: 'purchase', refType: 'order' });
    expect(await buy(p, 'gibts-nicht', env, new MockPaymentProvider(env))).toMatchObject({ ok: false, code: 'unknown-sku' });
  });
  it('unitModsFor ist neutral und passt zu UnitMod', () => {
    const mods = unitModsFor(newProfile(testEnv()), ['striker', 'gunner']);
    expect(mods).toEqual([
      { player: 0, unit: 'striker', lvlBp: 10000 },
      { player: 0, unit: 'gunner', lvlBp: 10000 },
    ]);
  });
  it('Replay-Kopf -> Match-Zusammenfassung', () => {
    const ok = matchSummaryFromReplayHead({ stage: 'standard20', difficulty: 'normal', seed: 1, complete: true, result: 'win', endWave: 20, endTick: 900, endHash: 'abc' });
    expect(ok.ok && ok.summary.outcome).toBe('win');
    expect(matchSummaryFromReplayHead({ stage: 's', difficulty: 'normal', seed: 1, complete: false, result: null, endWave: 3, endTick: 9, endHash: 'a' })).toMatchObject({ ok: false, code: 'replay-incomplete' });
  });
});
