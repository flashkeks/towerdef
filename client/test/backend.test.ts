import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, makeEnvelope, type KeyValueStore } from '../src/backend/storage';
import { cryptoRandomInt, cryptoUuid } from '../src/backend/random';
import { testEnv, SCHEMA_VERSION, newProfile } from '../src/backend/meta';
import type { ReplayFile } from '../src/game/recorder';

class FakeLs implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}
class BrokenLs implements KeyValueStore {
  getItem(): string | null {
    throw new Error('blocked');
  }
  setItem(): void {
    throw new Error('blocked');
  }
}

const key = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const mk = (ls: KeyValueStore = new FakeLs(), seed = 1) => new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(ls), new MemoryTier()]), env: testEnv(seed) });
const fakeReplay = (over: Partial<ReplayFile> = {}) => ({ stage: 'standard20', difficulty: 'normal', seed: 4, complete: true, result: 'win', endWave: 20, endTick: 12000, endHash: 'deadbeef', ...over }) as unknown as ReplayFile;

describe('LocalBackend', () => {
  it('legt beim ersten Start ein Profil an, danach dasselbe', async () => {
    const ls = new FakeLs();
    const a = await mk(ls).loadProfile();
    expect(a).toMatchObject({ ok: true, created: true, persistence: 'localstorage' });
    const b = await mk(ls).loadProfile();
    expect(b).toMatchObject({ ok: true, created: false });
    if (a.ok && b.ok) expect(b.profile).toEqual(a.profile);
  });

  it('Kreislauf: Starter, Zug, Level, Team, Match -> nach Neuladen alles da', async () => {
    const ls = new FakeLs();
    const be = mk(ls, 3);
    const s = await be.claimStarterGift(key(1));
    expect(s.ok && s.gift.crystals).toBe(450);
    const p = await be.pull('standard', 10, key(2));
    if (!p.ok) throw new Error(p.message);
    expect(p.pull.pulls).toHaveLength(10);
    expect(p.profile.wallet.crystals).toBe(0);
    const m = await be.reportMatch(fakeReplay(), key(3));
    if (!m.ok) throw new Error(m.message);
    expect(m.reward.crystals).toBe(100);
    const unit = Object.keys(m.profile.units)[0]!;
    const l = await be.levelUp(unit, key(4));
    expect(l.ok && l.level.level).toBe(2);
    const t = await be.setTeam([unit], key(5));
    expect(t.ok && t.team).toEqual([unit]);

    const again = await mk(ls, 99).loadProfile();
    if (!again.ok || !m.ok) throw new Error('x');
    expect(again.profile.units).toEqual((l as { profile: { units: unknown } }).profile.units);
    expect(again.profile.team).toEqual([unit]);
    expect(again.profile.pity['standard']).toEqual(p.profile.pity['standard']);
    expect(again.profile.pullHistory).toHaveLength(10);
    expect(again.profile.stages['standard20']!['normal']!.clears).toBe(1);
  });

  it('Doppelklick mit gleichem idemKey zieht nur einmal (auch gleichzeitig)', async () => {
    const be = mk();
    await be.claimStarterGift(key(1));
    const [a, b] = await Promise.all([be.pull('standard', 10, key(7)), be.pull('standard', 10, key(7))]);
    if (!a.ok || !b.ok) throw new Error('x');
    expect(a.replayed).toBe(false);
    expect(b.replayed).toBe(true);
    expect(b.pull).toEqual(a.pull);
    expect(b.profile.pullHistory).toHaveLength(10);
    const third = await be.pull('standard', 10, key(8));
    expect(third).toMatchObject({ ok: false, code: 'not-enough-crystals' });
  });

  it('Spielfehler kommen als Ergebnis, nicht als Exception', async () => {
    const be = mk();
    expect(await be.pull('standard', 1, key(1))).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    expect(await be.pull('standard', 1, 'x')).toMatchObject({ ok: false, code: 'invalid-idempotency-key' });
    expect(await be.setTeam(['striker'], key(2))).toMatchObject({ ok: false, code: 'unit-not-owned' });
    expect(await be.reportMatch(fakeReplay({ complete: false, result: null }), key(3))).toMatchObject({ ok: false, code: 'replay-incomplete' });
    expect(await be.buy('nope', key(4))).toMatchObject({ ok: false, code: 'unknown-sku' });
  });

  it('Mock-Shop und Banner-/Katalogliste', async () => {
    const be = mk();
    const cat = await be.shopCatalog();
    const banners = await be.listBanners();
    expect(cat.ok && cat.products.length).toBeGreaterThan(0);
    expect(banners.ok && banners.banners[0]!.bannerId).toBe('standard');
    const sku = cat.ok ? cat.products[0]!.sku : '';
    const r1 = await be.buy(sku, key(1));
    const r2 = await be.buy(sku, key(1));
    if (!r1.ok || !r2.ok) throw new Error('x');
    expect(r2.replayed).toBe(true);
    expect(r2.profile.wallet.crystals).toBe(r1.profile.wallet.crystals);
  });

  it('kaputte Daten: Fehlercode, Stand bleibt unangetastet, Reset sichert ihn', async () => {
    const ls = new FakeLs();
    ls.setItem('dw.meta.profile.a', '{"app":"dw-meta","rev":5,"profile":{"schemaVersion":1,"kaputt":true}}');
    const be = mk(ls);
    expect(await be.loadProfile()).toMatchObject({ ok: false, code: 'profile-corrupt' });
    expect(await be.pull('standard', 1, key(1))).toMatchObject({ ok: false, code: 'profile-corrupt' });
    expect(ls.getItem('dw.meta.profile.a')).toContain('kaputt');
    expect(ls.getItem('dw.meta.profile.b')).toBeNull();
    const r = await be.resetProfile();
    expect(r.ok).toBe(true);
    expect(ls.getItem('dw.meta.profile.backup')).toContain('kaputt');
    expect(await be.loadProfile()).toMatchObject({ ok: true });
    // und es ueberlebt Neuladen, auch gegen die alte rev 5
    expect(await mk(ls).loadProfile()).toMatchObject({ ok: true, created: false });
  });

  it('Muell im Speicher (kein Umschlag) -> profile-corrupt; zu neue Version -> profile-too-new', async () => {
    const ls = new FakeLs();
    ls.setItem('dw.meta.profile.a', 'das ist kein json');
    expect(await mk(ls).loadProfile()).toMatchObject({ ok: false, code: 'profile-corrupt' });
    const ls2 = new FakeLs();
    ls2.setItem('dw.meta.profile.a', makeEnvelope(3, { ...newProfile(testEnv()), schemaVersion: SCHEMA_VERSION + 1 }));
    expect(await mk(ls2).loadProfile()).toMatchObject({ ok: false, code: 'profile-too-new' });
  });

  it('Absturz beim Speichern: halb geschriebener Platz wird ignoriert, alter Stand bleibt', async () => {
    const ls = new FakeLs();
    const be = mk(ls);
    await be.claimStarterGift(key(1));
    const before = await be.pull('standard', 1, key(2));
    if (!before.ok) throw new Error('x');
    // naechstes Speichern schreibt auf den aelteren Platz; wir simulieren, dass es dort mitten im Schreiben abbrach
    await be.pull('standard', 1, key(3));
    const slots = ['dw.meta.profile.a', 'dw.meta.profile.b'];
    const revOf = (k: string) => JSON.parse(ls.getItem(k)!).rev as number;
    const newer = revOf(slots[0]!) > revOf(slots[1]!) ? slots[0]! : slots[1]!;
    const older = newer === slots[0] ? slots[1]! : slots[0]!;
    ls.setItem(newer, ls.getItem(newer)!.slice(0, 120)); // neuester Platz abgeschnitten
    const back = await mk(ls).loadProfile();
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.profile.pullHistory).toHaveLength(1); // Stand nach dem ersten Zug, nicht verloren
    expect(ls.getItem(older)).not.toBeNull();
  });

  it('localStorage gesperrt -> faellt auf Speicher zurueck, kein Absturz', async () => {
    const be = new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(new BrokenLs()), new MemoryTier()]), env: testEnv() });
    const l = await be.loadProfile();
    expect(l).toMatchObject({ ok: true, persistence: 'memory' });
    const s = await be.claimStarterGift(key(1));
    expect(s).toMatchObject({ ok: true, persistence: 'memory' });
  });

  it('Export -> Reset -> Import ergibt denselben Stand; kaputte Datei wird abgelehnt', async () => {
    const be = mk();
    await be.claimStarterGift(key(1));
    const p = await be.pull('standard', 10, key(2));
    const ex = await be.exportSave();
    if (!ex.ok || !p.ok) throw new Error('x');
    expect(ex.filename).toMatch(/^[a-z]+-save-\d{8}\.json$/);
    await be.resetProfile();
    const empty = await be.loadProfile();
    expect(empty.ok && Object.keys(empty.profile.units)).toHaveLength(0);
    const imp = await be.importSave(ex.json);
    if (!imp.ok) throw new Error(imp.message);
    expect(imp.profile).toEqual(p.profile);
    const tampered = JSON.parse(ex.json);
    tampered.profile.playerXp = 9999;
    expect(await be.importSave(JSON.stringify(tampered))).toMatchObject({ ok: false, code: 'import-bad-checksum' });
    expect(await be.importSave('{{')).toMatchObject({ ok: false, code: 'import-invalid-json' });
    const after = await be.loadProfile();
    expect(after.ok && after.profile).toEqual(p.profile);
  });
});

describe('Zufall und IDs', () => {
  it('cryptoRandomInt: Bereich und grobe Gleichverteilung', () => {
    const n = 7;
    const c = new Array(n).fill(0) as number[];
    for (let i = 0; i < 70000; i++) {
      const v = cryptoRandomInt(n);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(n);
      c[v]!++;
    }
    for (const x of c) expect(Math.abs(x - 10000)).toBeLessThan(600);
    expect(cryptoRandomInt(1)).toBe(0);
    expect(() => cryptoRandomInt(0)).toThrow();
  });
  it('UUID-Format', () => {
    expect(cryptoUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const noUuid = { getRandomValues: <T extends ArrayBufferView>(a: T) => (globalThis.crypto.getRandomValues(a as never) as T) };
    expect(cryptoUuid(noUuid)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
