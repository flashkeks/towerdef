import { describe, expect, it } from 'vitest';
import { copiesForNextStar, damageBpOf, MAX_STARS, newProfile, starsForCopies, STAR_THRESHOLDS, testEnv, unitModsFor, unitIds, type Profile } from '../src';

const owned = (level: number, copies: number) => ({ level, xp: 0, copies, stars: starsForCopies(copies), firstObtainedAt: 'x' });

describe('Sterne aus Kopien (progression.json)', () => {
  it('Schwellen 1/2/4/8/16, Sterne 1..5, nie ueber dem Maximum', () => {
    expect(STAR_THRESHOLDS).toEqual([1, 2, 4, 8, 16]);
    expect([1, 2, 3, 4, 7, 8, 15, 16, 99].map(starsForCopies)).toEqual([1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(MAX_STARS).toBe(5);
  });
  it('naechste Schwelle', () => {
    expect(copiesForNextStar(1)).toBe(2);
    expect(copiesForNextStar(3)).toBe(8);
    expect(copiesForNextStar(5)).toBeNull();
  });
});

describe('unitModsFor', () => {
  const base = newProfile(testEnv());
  const ids = unitIds();
  const profile: Profile = { ...base, units: { [ids[0]]: owned(1, 1), [ids[1]]: owned(20, 4), [ids[2]]: owned(40, 16) } };

  it('Level 1 / Stern 1 ist neutral, Level 40 / Stern 5 = 2,175', () => {
    const m = unitModsFor(profile, [ids[0], ids[1], ids[2]]);
    expect(m.map((x) => x.lvlBp)).toEqual([10000, 10000 + 250 * 19 + 1000, 10000 + 250 * 39 + 2000]);
    expect(m[2].lvlBp).toBe(21750);
    expect(m.every((x) => x.player === 0)).toBe(true);
  });
  it('Sterne kommen aus den Kopien, nicht aus dem Cache-Feld', () => {
    const p: Profile = { ...profile, units: { [ids[0]]: { ...owned(1, 8), stars: 1 } } };
    expect(unitModsFor(p, [ids[0]])[0].lvlBp).toBe(10000 + 1500);
    expect(damageBpOf({ level: 1, copies: 8 })).toBe(11500);
  });
  it('Spieler-Index und fremde Units (neutral)', () => {
    const m = unitModsFor(profile, ['gibtsnicht'], 1);
    expect(m).toEqual([{ player: 1, unit: 'gibtsnicht', lvlBp: 10000 }]);
  });
  it('gilt fuer jede Unit des Katalogs gleich (keine Unit-Liste)', () => {
    const all: Profile = { ...base, units: Object.fromEntries(ids.map((id) => [id, owned(10, 2)])) };
    const m = unitModsFor(all, ids);
    expect(new Set(m.map((x) => x.lvlBp)).size).toBe(1);
    expect(m).toHaveLength(ids.length);
  });
  it('Level ueber 40 wird begrenzt', () => {
    expect(damageBpOf({ level: 99, copies: 1 })).toBe(damageBpOf({ level: 40, copies: 1 }));
  });
});
