import { describe, expect, it } from 'vitest';
import { openStore } from '../src/meta/store';
import { ProfileStorage, MemoryTier, makeEnvelope } from '../src/meta/storage';
import { applyMatch } from '../src/meta';

describe('meta store', () => {
  it('frischer Store: Profil ohne Reset-Hinweis, update + Export/Import', async () => {
    const s = await openStore({ memoryOnly: true });
    expect(s.profile.showResetNotice).toBe(false);
    const { profile } = applyMatch(s.profile, { matchId: 'x', map: 'meadow', difficulty: 'easy', won: true, roundsCleared: 20, livesLost: 0, pops: { ranger: 10 }, tierBuys: {} });
    await s.update(profile);
    const json = s.exportJson();
    await s.wipe();
    expect(s.profile.playerXp).toBe(0);
    expect((await s.importJson(json)).ok).toBe(true);
    expect(s.profile.playerXp).toBe(profile.playerXp);
    expect((await s.importJson('x')).ok).toBe(false);
  });
  it('alter Umschlag (Schema 3) wird beim Laden zurueckgesetzt', async () => {
    const tier = new MemoryTier();
    await tier.write(1, makeEnvelope(1, { schemaVersion: 3, units: {} }));
    const st = new ProfileStorage([tier]);
    const out = await st.load();
    expect(out.kind).toBe('ok');
  });
});
