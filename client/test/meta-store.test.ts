import { describe, expect, it } from 'vitest';
import { openStore } from '../src/meta/store';
import { ProfileStorage, MemoryTier, makeEnvelope } from '../src/meta/storage';
import { applyMatch } from '../src/meta';

describe('meta store', () => {
  it('frischer Store: Profil ohne Reset-Hinweis, update + Export/Import', async () => {
    const s = await openStore({ memoryOnly: true });
    expect(s.profile.showResetNotice).toBe(false);
    const { profile } = applyMatch(s.profile, { matchId: 'x', map: 'meadow', difficulty: 'easy', won: true, roundsCleared: 20, livesLost: 0, pops: { ranger: 10 }, towerXp: { ranger: 100, bombardier: 100, frostcaller: 100 } });
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
  it('openStore: alter Stand (Runde 10) wird zurueckgesetzt, Hinweis einmalig, und der Reset ist sofort gespeichert', async () => {
    const tier = new MemoryTier();
    await tier.write(1, makeEnvelope(1, { schemaVersion: 3, units: { a: 1 } }));
    const s = await openStore({ tiers: [tier] });
    expect(s.profile.showResetNotice).toBe(true);
    expect(s.profile.playerXp).toBe(0);
    // zweiter Start ohne Quittung: Hinweis bleibt, bis der Spieler OK klickt
    expect((await openStore({ tiers: [tier] })).profile.showResetNotice).toBe(true);
    await s.ackResetNotice();
    const again = await openStore({ tiers: [tier] });
    expect(again.profile.showResetNotice).toBe(false);
    expect(again.profile.schema).toBe(11);
  });
  it('openStore: kaputter Umschlag -> frisch mit Hinweis; nie gespielt -> ohne Hinweis', async () => {
    const bad = new MemoryTier();
    await bad.write(1, '{kaputt');
    expect((await openStore({ tiers: [bad] })).profile.showResetNotice).toBe(true);
    expect((await openStore({ tiers: [new MemoryTier()] })).profile.showResetNotice).toBe(false);
  });
  it('Profil ueberlebt Neustart (Speichern -> Laden)', async () => {
    const tier = new MemoryTier();
    const s = await openStore({ tiers: [tier] });
    await s.update({ ...s.profile, playerXp: 1234 });
    expect((await openStore({ tiers: [tier] })).profile.playerXp).toBe(1234);
  });
});
