import { describe, expect, it } from 'vitest';
import { balanceOf, claimStarterGift, getBanner, newProfile, pull, pullCost, rollOne, testEnv, unitsOfRarity, PULL_HISTORY_MAX, type Profile } from '../src';

function rich(env = testEnv(11), crystals = 100000): Profile {
  const p = newProfile(env);
  return { ...p, ledger: [{ id: 'L000001', currency: 'crystals', delta: crystals, kind: 'grant', refType: 't', refId: 'seed', createdAt: 'x' }], wallet: { crystals, gold: 0 } };
}

describe('Minimal-Gacha (P3 baut darauf auf)', () => {
  it('bucht 50 / 450, fuellt Sammlung, Verlauf und Pity', () => {
    const env = testEnv(5);
    const p = rich(env, 1000);
    const one = pull(p, 'standard', 1, env);
    if (!one.ok) throw new Error(one.message);
    expect(balanceOf(one.profile, 'crystals')).toBe(950);
    expect(one.result.pulls).toHaveLength(1);
    const ten = pull(one.profile, 'standard', 10, env);
    if (!ten.ok) throw new Error(ten.message);
    expect(balanceOf(ten.profile, 'crystals')).toBe(500);
    expect(ten.profile.wallet.crystals).toBe(500);
    expect(ten.profile.pullHistory).toHaveLength(11);
    const copies = Object.values(ten.profile.units).reduce((s, u) => s + u.copies, 0);
    expect(copies).toBe(11);
    expect(ten.profile.ledger.filter((e) => e.kind === 'gacha_spend').map((e) => e.refId)).toEqual(['batch-1', 'batch-2']);
    expect(ten.profile.pity['standard']).toBeDefined();
    expect(p.pullHistory).toHaveLength(0);
  });
  it('zu wenig Crystals -> Fehler, Profil unveraendert', () => {
    const env = testEnv();
    const p = rich(env, 449);
    expect(pull(p, 'standard', 10, env)).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    expect(pull(p, 'standard', 3, env)).toMatchObject({ ok: false, code: 'invalid-count' });
    expect(pull(p, 'nope', 1, env)).toMatchObject({ ok: false, code: 'unknown-banner' });
  });
  it('Duplikat -> copies + 1, Sterne aus Kopien', () => {
    const env = testEnv(2);
    let p = rich(env, 100000);
    for (let i = 0; i < 20; i++) {
      const r = pull(p, 'standard', 10, env);
      if (!r.ok) throw new Error(r.message);
      p = r.profile;
    }
    const dupes = Object.values(p.units).filter((u) => u.copies > 1);
    expect(dupes.length).toBeGreaterThan(0);
    for (const u of Object.values(p.units)) expect(u.stars).toBeGreaterThanOrEqual(1);
  });
  it('harte Pity: Mythic spaetestens beim 150. Zug, Legendary+ spaetestens beim 35.', () => {
    const b = getBanner('standard')!;
    // Zufall, der nie ein Mythic/Legendary wuerfelt (hoechster Wert = Rare)
    const worst = { randomInt: (n: number) => (n === 10000 ? 0 : 0) };
    let pity = { sinceTop: 0, sinceMid: 0 };
    let firstMid = 0;
    for (let i = 1; i <= 150; i++) {
      const r = rollOne(b, pity, worst);
      if ('ok' in r) throw new Error('x');
      if (r.pityForced === 'mid' && !firstMid) firstMid = i;
      pity = r.pity;
      if (r.rarity === 'mythic') {
        expect(i).toBe(150);
        expect(r.pityForced).toBe('top');
        expect(pity).toEqual({ sinceTop: 0, sinceMid: 0 });
      }
    }
    expect(firstMid).toBe(35);
    expect(pity.sinceTop).toBe(0);
  });
  it('Verlauf ist auf PULL_HISTORY_MAX gekappt, Raten treffen grob (20 000 Wuerfe)', () => {
    const env = testEnv(9);
    const b = getBanner('standard')!;
    let pity = { sinceTop: 0, sinceMid: 0 };
    const n: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const r = rollOne(b, pity, env);
      if ('ok' in r) throw new Error('x');
      pity = r.pity;
      n[r.rarity] = (n[r.rarity] ?? 0) + 1;
    }
    expect(n['rare']! / 20000).toBeGreaterThan(0.66);
    expect(n['rare']! / 20000).toBeLessThan(0.72);
    expect(n['mythic']! / 20000).toBeGreaterThan(0.005);
    let p = rich(env, 10_000_000);
    for (let i = 0; i < PULL_HISTORY_MAX / 10 + 3; i++) {
      const r = pull(p, 'standard', 10, env);
      if (!r.ok) throw new Error(r.message);
      p = r.profile;
    }
    expect(p.pullHistory).toHaveLength(PULL_HISTORY_MAX);
  });
  it('Pools kommen aus units.json, Preis aus der Banner-Datei', () => {
    expect(unitsOfRarity('mythic').length).toBeGreaterThan(0);
    const b = getBanner('standard')!;
    expect(pullCost(b, 1)).toBe(50);
    expect(pullCost(b, 10)).toBe(450);
    const env = testEnv();
    const s = claimStarterGift(newProfile(env), env);
    expect(s.ok && s.result.crystals).toBe(450);
  });
});
