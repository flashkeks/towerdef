import { describe, expect, it } from 'vitest';
import { claimStarterGift, newProfile, setTeam, testEnv, type Profile } from '../src';

function withUnits(n: number): Profile {
  const p = newProfile(testEnv());
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].slice(0, n);
  return { ...p, units: Object.fromEntries(ids.map((id) => [id, { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: 'x' }])) };
}

describe('Team', () => {
  it('setzt besessene Units in Reihenfolge', () => {
    const r = setTeam(withUnits(8), ['c', 'a']);
    expect(r.ok && r.profile.team).toEqual(['c', 'a']);
  });
  it('lehnt fremde Units, Duplikate, leer und mehr als 6 ab', () => {
    const p = withUnits(8);
    expect(setTeam(p, ['zzz'])).toMatchObject({ ok: false, code: 'unit-not-owned' });
    expect(setTeam(p, ['a', 'a'])).toMatchObject({ ok: false, code: 'team-duplicate' });
    expect(setTeam(p, [])).toMatchObject({ ok: false, code: 'team-empty' });
    expect(setTeam(p, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toMatchObject({ ok: false, code: 'team-too-large' });
    expect(setTeam(p, ['a', 'b', 'c', 'd', 'e', 'f']).ok).toBe(true);
  });
  it('mutiert das Profil nicht', () => {
    const p = withUnits(3);
    setTeam(p, ['a']);
    expect(p.team).toEqual([]);
  });
  it('Starter-Team besteht nur aus besessenen Units', () => {
    const env = testEnv();
    const s = claimStarterGift(newProfile(env), env);
    expect(s.ok && s.profile.team.every((u) => u in s.profile.units)).toBe(true);
  });
});
