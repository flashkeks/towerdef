import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, type KeyValueStore } from '../src/backend/storage';
import { cryptoRandomInt } from '../src/backend/random';
import { MockPaymentProvider, testEnv, type MockOutcome } from '../src/backend/meta';

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
const mk = (ls: KeyValueStore = new FakeLs(), seed = 1, outcome: MockOutcome = 'ok') => {
  const env = testEnv(seed);
  return new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(ls), new MemoryTier()]), env, provider: new MockPaymentProvider(env, outcome) });
};

describe('Gacha ueber das Backend', () => {
  it('bannerViews: Standard + Starter, Pity-Stand aus dem Profil, nach Neuladen derselbe Zaehler', async () => {
    const ls = new FakeLs();
    const be = mk(ls, 5);
    const v0 = await be.bannerViews();
    if (!v0.ok) throw new Error(v0.message);
    expect(v0.views.map((v) => v.bannerId)).toEqual(['standard', 'starter', 'special']);
    expect(v0.views[0]!.pity[0]!.text).toBe('Pulls since last Mythic or better: 0 / 150');
    await be.claimStarterGift(key(1));
    const p = await be.pull('standard', 10, key(2));
    if (!p.ok) throw new Error(p.message);
    const pity = p.profile.pity['standard']!;
    const again = mk(ls, 77); // neue Instanz, gleicher Speicher = Neuladen
    const v1 = await again.bannerViews();
    if (!v1.ok) throw new Error(v1.message);
    expect(v1.views[0]!.pity[0]!.current).toBe(pity.sinceTop);
    expect(v1.views[0]!.pity[1]!.current).toBe(pity.sinceMid);
    expect(v1.views[0]!.ratesHash).toBe(p.pull.ratesHash);
  });

  it('Doppelklick: gleicher idemKey zieht nicht doppelt, gleicher Key mit anderem Request -> Fehler', async () => {
    const be = mk(new FakeLs(), 2);
    await be.claimStarterGift(key(1)); // 450
    const a = await be.pull('standard', 10, key(2));
    const b = await be.pull('standard', 10, key(2));
    if (!a.ok || !b.ok) throw new Error('x');
    expect(b.replayed).toBe(true);
    expect(b.profile.wallet.crystals).toBe(0);
    expect(b.profile.pullHistory).toHaveLength(10);
    expect(b.pull).toEqual(a.pull);
    expect(await be.pull('standard', 1, key(2))).toMatchObject({ ok: false, code: 'idempotency-key-reuse' });
    // parallele Doppelklicks laufen nacheinander
    await be.buy('crystals_1200', key(3));
    const [c, d] = await Promise.all([be.pull('standard', 10, key(4)), be.pull('standard', 10, key(4))]);
    if (!c.ok || !d.ok) throw new Error('x');
    expect([c.replayed, d.replayed].sort()).toEqual([false, true]);
    expect(d.profile.pullHistory).toHaveLength(20);
  });

  it('Starter-Banner einmalig, ueberlebt Neuladen; ohne Geld -> not-enough-crystals', async () => {
    const ls = new FakeLs();
    const be = mk(ls, 3);
    expect(await be.pull('starter', 10, key(1))).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    await be.claimStarterGift(key(2));
    const s = await be.pull('starter', 10, key(3));
    if (!s.ok) throw new Error(s.message);
    expect(s.pull.cost).toBe(225);
    expect(s.pull.pulls.some((x) => x.rarity !== 'rare')).toBe(true);
    const again = mk(ls, 9);
    expect(await again.pull('starter', 10, key(4))).toMatchObject({ ok: false, code: 'banner-limit-reached' });
    const v = await again.bannerViews();
    expect(v.ok && v.views.find((x) => x.bannerId === 'starter')!.status).toBe('limit-reached');
    expect(await again.pull('featured-example', 10, key(5))).toMatchObject({ ok: false, code: 'banner-inactive' });
  });
});

describe('Mock-Shop ueber das Backend', () => {
  it('drei Pakete, Kauf einmal pro Schluessel, Guthaben nach Neuladen da', async () => {
    const ls = new FakeLs();
    const be = mk(ls, 4);
    const cat = await be.shopCatalog();
    if (!cat.ok) throw new Error(cat.message);
    expect(cat.products.map((x) => x.crystals)).toEqual([500, 1200, 2600]);
    expect(cat.products.every((x) => x.price === null && x.priceNote === 'Test purchase - no real money')).toBe(true);
    const a = await be.buy('crystals_2600', key(1));
    const b = await be.buy('crystals_2600', key(1));
    if (!a.ok || !b.ok) throw new Error('x');
    expect(a.order).toMatchObject({ status: 'paid', crystals: 2600 });
    expect(b.replayed).toBe(true);
    expect(b.profile.wallet.crystals).toBe(2600);
    const again = await mk(ls, 8).loadProfile();
    expect(again.ok && again.profile.wallet.crystals).toBe(2600);
  });
  it('fail / pending / duplicate-event ueber den Schalter', async () => {
    expect(await mk(new FakeLs(), 1, 'fail').buy('crystals_500', key(1))).toMatchObject({ ok: false, code: 'payment-failed' });
    const dup = await mk(new FakeLs(), 1, 'duplicate-event').buy('crystals_500', key(1));
    expect(dup.ok && dup.profile.wallet.crystals).toBe(500);
    expect(dup.ok && dup.order.duplicateEventsIgnored).toBe(1);
    const be = mk(new FakeLs(), 1, 'pending');
    const pend = await be.buy('crystals_500', key(1));
    if (!pend.ok) throw new Error(pend.message);
    expect(pend.order.status).toBe('pending');
    expect(pend.profile.wallet.crystals).toBe(0);
    expect(await be.refreshOrder('nix', key(2))).toMatchObject({ ok: false, code: 'unknown-order' });
  });
});

describe('Zufall im Client', () => {
  it('Rejection Sampling: Werte im verzerrten Rest werden verworfen, kein Modulo-Bias', () => {
    // n = 3: limit = 4294967295; 0xFFFFFFFF liegt im Rest und muss verworfen werden
    const seq = [0xffffffff, 0xfffffffe + 1, 4294967294, 7];
    let i = 0;
    const fake = { getRandomValues: <T extends ArrayBufferView>(a: T): T => { (a as unknown as Uint32Array)[0] = seq[i++]!; return a; } };
    expect(cryptoRandomInt(3, fake)).toBe(4294967294 % 3);
    expect(i).toBe(3); // zwei Versuche verworfen (beide >= limit), der dritte zaehlt
    // gleichmaessig ueber den 10000er-Bereich (grober Chi-Quadrat-Schutz gegen offensichtliche Schieflage)
    const bins = new Array<number>(10).fill(0);
    for (let k = 0; k < 50_000; k++) bins[Math.floor(cryptoRandomInt(10000) / 1000)]!++;
    for (const b of bins) expect(Math.abs(b - 5000)).toBeLessThan(400);
  });
});
