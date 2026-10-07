/** Runde 8 / P2: Backend-Methoden evolve und rerollTrait (Idempotenz ueber idemKey), Portrait-Modul. */
import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, type KeyValueStore } from '../src/backend/storage';
import { testEnv } from '../src/backend/meta';
import { hasPortrait, portraitUrl } from '../src/view/portrait';

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
const mk = () => new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(new FakeLs()), new MemoryTier()]), env: testEnv(4) });

describe('Backend: Trait-Reroll und Evolution', () => {
  it('Reroll kostet Crystals, Wiederholung mit demselben Schluessel bucht nicht neu', async () => {
    const be = mk();
    await be.claimStarterGift(key(1)); // 450 Crystals
    const a = await be.rerollTrait('ichigo', key(2));
    if (!a.ok) throw new Error(a.message);
    expect(a.reroll.cost).toBe(20);
    expect(a.profile.wallet.crystals).toBe(430);
    const b = await be.rerollTrait('ichigo', key(2));
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(b.profile.wallet.crystals).toBe(430);
    expect(await be.rerollTrait('stain', key(3))).toMatchObject({ ok: false, code: 'unit-not-owned' });
  });
  it('Evolution ohne Rezept oder ohne Geld meldet Fehlercodes', async () => {
    const be = mk();
    await be.claimStarterGift(key(1));
    expect(await be.evolve('stain', key(2))).toMatchObject({ ok: false, code: 'unit-not-owned' });
    const r = await be.evolve('goku_ssj3', key(3));
    expect(r.ok).toBe(false);
  });
});

describe('portrait.ts', () => {
  it('URL nach Vorgabe, ohne Image-API (Node) kein Portrait', async () => {
    expect(portraitUrl('goku_ssj3')).toBe('/aa/units/goku_ssj3.webp');
    expect(await hasPortrait('goku_ssj3')).toBe(false);
  });
});
