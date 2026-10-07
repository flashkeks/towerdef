import { describe, expect, it } from 'vitest';
import { ProfileSchema, newProfile, SCHEMA_VERSION, testEnv, UNIT_CATALOG, getBanner, listBanners, isKnownUnit } from '../src';

describe('Profil-Schema', () => {
  it('neues Profil ist gueltig und leer', () => {
    const p = newProfile(testEnv());
    expect(ProfileSchema.safeParse(p).success).toBe(true);
    expect(p.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.wallet).toEqual({ crystals: 0, gold: 0 });
    expect(p.ledger).toEqual([]);
    expect(p.team).toEqual([]);
    expect(p.flags.starterGiftClaimed).toBe(false);
  });
  it('lehnt falsche Typen und ein Team ueber 6 ab', () => {
    const p = newProfile(testEnv());
    expect(ProfileSchema.safeParse({ ...p, team: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }).success).toBe(false);
    expect(ProfileSchema.safeParse({ ...p, playerXp: -1 }).success).toBe(false);
    expect(ProfileSchema.safeParse({ ...p, wallet: { crystals: 1.5, gold: 0 } }).success).toBe(false);
    expect(ProfileSchema.safeParse({ ...p, schemaVersion: 2 }).success).toBe(false);
  });
  it('Katalog kommt aus sim/data/units.json, Banner-Pools sind bekannt', () => {
    expect(UNIT_CATALOG.length).toBeGreaterThanOrEqual(8);
    for (const b of listBanners()) for (const t of b.tiers) for (const u of t.units ?? []) expect(isKnownUnit(u.unitId)).toBe(true);
    expect(getBanner('standard')?.tiers.map((t) => t.baseRateBp)).toEqual([7000, 2500, 400, 100]);
  });
});
