import { describe, expect, it } from 'vitest';
import { LEVEL_COST_BASE, MAX_PLAYER_LEVEL, MAX_UNIT_LEVEL, MAX_TEAM, STARTER_EXTRA, addPlayerXp, balanceOf, book, claimStarterGift, isDifficultyUnlocked, levelFromXp, levelUp, levelUpCost, levelUpTotalCost, newProfile, pull, rewardFromReplay, starterUnits, testEnv, unitIds, xpToReach, KIND, type Profile } from '../src';
import { botReplay } from './replay-fixture';

const env = () => testEnv(5);
const grant = (p: Profile, currency: 'gold' | 'crystals', n: number, ref = 'g'): Profile => {
  const r = book(p, { currency, delta: n, kind: KIND.grant, refType: 'test', refId: ref }, env());
  if (!r.ok) throw new Error(r.message);
  return r.profile;
};
const starter = (): Profile => {
  const r = claimStarterGift(newProfile(env()), env());
  if (!r.ok) throw new Error(r.message);
  return r.profile;
};

describe('Leveling', () => {
  it('Kostenkurve: 40, 50, ... 420; 1 -> 20 = 2 470; 1 -> 40 = 8 970', () => {
    expect(levelUpCost(1)).toBe(LEVEL_COST_BASE);
    expect(levelUpCost(2)).toBe(50);
    expect(levelUpCost(39)).toBe(420);
    expect(levelUpTotalCost(1, 20)).toBe(2470);
    expect(levelUpTotalCost(1, 40)).toBe(8970);
    expect(levelUpTotalCost(1, 99)).toBe(8970);
  });
  it('Fehlercodes: Unit nicht besessen, zu wenig Gold, Max-Level', () => {
    const p = starter();
    expect(levelUp(p, 'stain', env())).toMatchObject({ ok: false, code: 'unit-not-owned' });
    expect(levelUp(p, 'gibtsnicht', env())).toMatchObject({ ok: false, code: 'unit-not-owned' });
    expect(levelUp(p, 'ichigo', env())).toMatchObject({ ok: false, code: 'not-enough-gold' });
    const rich = grant(p, 'gold', 100_000);
    let cur = rich;
    for (let i = 1; i < MAX_UNIT_LEVEL; i++) {
      const r = levelUp(cur, 'ichigo', env());
      if (!r.ok) throw new Error(r.message);
      expect(r.result.cost).toBe(levelUpCost(i));
      cur = r.profile;
    }
    expect(cur.units['ichigo']!.level).toBe(MAX_UNIT_LEVEL);
    expect(balanceOf(cur, 'gold')).toBe(100_000 - 8970);
    expect(levelUp(cur, 'ichigo', env())).toMatchObject({ ok: false, code: 'max-level' });
  });
  it('Aufstieg bucht genau einmal, danach fehlt das Gold', () => {
    const p = grant(starter(), 'gold', 40);
    const bad = levelUp(p, 'ichigo', env());
    expect(bad.ok).toBe(true);
    const again = bad.ok ? levelUp(bad.profile, 'ichigo', env()) : bad;
    expect(again).toMatchObject({ ok: false, code: 'not-enough-gold' });
    expect(p.units['ichigo']!.level).toBe(1);
  });
});

describe('Spieler-Level', () => {
  it('Kurve nach recommendations 15: Level 5 = 550, 10 = 1 800, 25 = 9 300, 50 = 34 300', () => {
    expect([1, 5, 10, 25, 50].map(xpToReach)).toEqual([0, 550, 1800, 9300, 34300]);
  });
  it('Level-Up durch XP, Freischaltung Hard ab 5 / Nightmare ab 25, Deckel', () => {
    const p = newProfile(env());
    const a = addPlayerXp(p, 549);
    expect(a.profile.playerLevel).toBe(4);
    const b = addPlayerXp(a.profile, 1);
    expect(b.profile.playerLevel).toBe(5);
    expect(b.levelsGained).toBe(1);
    expect(isDifficultyUnlocked(b.profile, 'hard')).toBe(true);
    expect(isDifficultyUnlocked(b.profile, 'nightmare')).toBe(false);
    expect(levelFromXp(xpToReach(25))).toBe(25);
    expect(levelFromXp(10_000_000)).toBe(MAX_PLAYER_LEVEL);
  });
  it('Belohnung aus dem Replay hebt das Level (Sieg = 100 XP)', () => {
    const win = botReplay({ seed: 7 });
    let p = addPlayerXp(newProfile(env()), xpToReach(2) - 100).profile;
    expect(p.playerLevel).toBe(1);
    const r = rewardFromReplay(p, win, env());
    if (!r.ok) throw new Error(r.message);
    expect(r.result.levelsGained).toBe(1);
    expect(r.profile.playerLevel).toBe(2);
    p = r.profile;
    expect(p.playerXp).toBe(xpToReach(2));
  });
});

describe('Starter-Geschenk', () => {
  it('einmalig: 450 Crystals, Rare+Epic+Goku, Team gesetzt; zweites Mal geht nicht', () => {
    const p = starter();
    expect(balanceOf(p, 'crystals')).toBe(450);
    const ids = starterUnits();
    expect(ids).toEqual(expect.arrayContaining(['ichigo', 'krillin', 'josuke', 'speedwagon', ...STARTER_EXTRA]));
    expect(Object.keys(p.units).sort()).toEqual([...ids].sort());
    expect(p.team.length).toBe(Math.min(MAX_TEAM, ids.length));
    expect(p.team).toContain('goku_ssj3');
    expect(p.team.every((u) => p.units[u])).toBe(true);
    expect(claimStarterGift(p, env())).toMatchObject({ ok: false, code: 'starter-already-claimed' });
    expect(balanceOf(p, 'crystals')).toBe(450);
    for (const id of ids) expect(unitIds()).toContain(id);
  });
  it('Abnahme: neues Profil kann sofort einen 10er-Zug machen', () => {
    const r = pull(starter(), 'standard', 10, env());
    expect(r.ok).toBe(true);
  });
  it('Start-Sammlung reicht fuer Normal (Rauchtest, kein Balancing): ein Bot mit der Starter-Extra-Unit siegt', () => {
    expect(starterUnits()).toEqual(expect.arrayContaining([...STARTER_EXTRA]));
    const wins = [1, 2, 3].filter((seed) => botReplay({ seed, only: [...STARTER_EXTRA] }).result === 'win').length;
    expect(wins).toBeGreaterThanOrEqual(2);
  });
});
