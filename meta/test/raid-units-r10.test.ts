/** Runde 10 / P0: Raid-Units aus dem Banner-Pool (Entscheidung Max, 08.10.2026; wie AA `hideFromBanner`). */
import { describe, expect, it } from 'vitest';
import { RAIDS_DATA, RAID_UNIT_IDS, RARITIES, UNIT_CATALOG, allBanners, grantUnit, migrate, newProfile, poolOfRarity, resolveBanner, testEnv, type Profile } from '../src';

describe('Raid-Units nur ueber Raid und Raid-Shop', () => {
  it('jede Garantie-Unit eines Raids ist als raidOnly markiert (11 Raids)', () => {
    const want = RAIDS_DATA.raids.flatMap((r) => (r.guarantee?.unit ? [r.guarantee.unit] : []));
    expect(want.length).toBeGreaterThan(0);
    expect([...RAID_UNIT_IDS].sort()).toEqual([...new Set(want)].sort());
    for (const id of want) expect(UNIT_CATALOG.find((u) => u.id === id)?.raidOnly, id).toBe(true);
  });

  it('kein Pool und kein Banner enthaelt eine Raid-Unit', () => {
    for (const pool of ['summonable', 'special', 'crossover', 'all'] as const)
      for (const r of RARITIES) for (const id of poolOfRarity(pool, r)) expect(RAID_UNIT_IDS.has(id), `${pool}/${r}: ${id}`).toBe(false);
    for (const b of allBanners()) {
      const rb = resolveBanner(b);
      expect(JSON.stringify(rb).match(/"unitId":"([^"]+)"/g)?.map((m) => m.slice(10, -1)).filter((id) => RAID_UNIT_IDS.has(id)) ?? [], b.bannerId).toEqual([]);
    }
  });

  it('wer eine Raid-Unit schon besitzt, behaelt sie (Neuladen/Migration)', () => {
    const id = [...RAID_UNIT_IDS][0];
    const g = grantUnit(newProfile(testEnv(3)), id, testEnv(3));
    if ('ok' in g && g.ok === false) throw new Error('grantUnit');
    const p = (g as { profile: Profile }).profile;
    expect(Object.keys(p.units)).toContain(id);
    const back = migrate(JSON.parse(JSON.stringify(p)));
    expect(back.ok, String((back as { message?: string }).message)).toBe(true);
    expect(Object.keys((back as unknown as { profile: Profile }).profile.units)).toContain(id);
  });
});
