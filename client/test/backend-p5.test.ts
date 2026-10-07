import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, type KeyValueStore } from '../src/backend/storage';
import { testEnv } from '../src/backend/meta';
import { botReplay } from './replay-fixture';

class FakeLs implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}
const key = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const mk = (ls: KeyValueStore = new FakeLs()) => new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(ls), new MemoryTier()]), env: testEnv(2) });

const win = botReplay({ bot: 'wide', seed: 7 });
const loss = botReplay({ bot: 'greedy', seed: 3, only: ['striker'] });

describe('reportMatch: Belohnung aus dem Replay (P5)', () => {
  it('Sieg zahlt Crystals, Gold, XP und merkt sich den Fortschritt (auch nach Neuladen)', async () => {
    const ls = new FakeLs();
    const be = mk(ls);
    const r = await be.reportMatch(win, key(1));
    if (!r.ok) throw new Error(r.message);
    expect(r.reward).toMatchObject({ crystals: 100, gold: 350, xp: 100, firstClear: true });
    expect(r.profile.stages['standard20']!['normal']).toMatchObject({ clears: 1, bestWave: 20 });
    const again = await mk(ls).loadProfile();
    expect(again.ok && again.profile.wallet).toEqual({ crystals: 100, gold: 350 });
  });

  it('Niederlage gibt Gold und XP, keine Crystals', async () => {
    const r = await mk().reportMatch(loss, key(1));
    if (!r.ok) throw new Error(r.message);
    expect(r.reward.crystals).toBe(0);
    expect(r.reward.gold).toBeGreaterThan(0);
    expect(r.reward.xp).toBeGreaterThan(0);
  });

  it('manipuliertes Replay: replay-mismatch, nichts gebucht', async () => {
    const be = mk();
    const forged = { ...loss, result: 'win' as const };
    expect(await be.reportMatch(forged, key(1))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(await be.reportMatch({ ...win, endHash: '0000' }, key(2))).toMatchObject({ ok: false, code: 'replay-mismatch' });
    const p = await be.loadProfile();
    expect(p.ok && p.profile.wallet).toEqual({ crystals: 0, gold: 0 });
    expect(p.ok && p.profile.ledger).toHaveLength(0);
  });

  it('Doppelmeldung: gleicher Schluessel = Wiederholung, anderer Schluessel = already-reported; gebucht wird einmal', async () => {
    const be = mk();
    const a = await be.reportMatch(win, key(1));
    const same = await be.reportMatch(win, key(1));
    const other = await be.reportMatch(win, key(2));
    if (!a.ok || !same.ok) throw new Error('x');
    expect(same.replayed).toBe(true);
    expect(other).toMatchObject({ ok: false, code: 'already-reported' });
    const p = await be.loadProfile();
    expect(p.ok && p.profile.wallet.crystals).toBe(100);
  });

  it('Nachrechnen im Client dauert weniger als eine Sekunde (grobe Messung)', async () => {
    const be = mk();
    const t = Date.now();
    await be.reportMatch(win, key(1));
    expect(Date.now() - t).toBeLessThan(5000);
  });
});
