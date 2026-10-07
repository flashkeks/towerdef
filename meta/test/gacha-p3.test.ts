import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  allBanners,
  analyze,
  balanceOf,
  bannerHash,
  bannerView,
  batchesUsed,
  canonicalJson,
  checksum,
  exportProfile,
  getBanner,
  importProfile,
  listBanners,
  newProfile,
  pull,
  randomIntFrom,
  resolveBanner,
  rollBatch,
  rollOne,
  seededRng,
  testEnv,
  withIdempotency,
  unitsOfRarity,
  type BannerRates,
  type Pity,
  type Profile,
} from '../src';

const rng = (seed: number) => ({ randomInt: randomIntFrom(seededRng(seed)) });
const rich = (crystals = 1_000_000): Profile => {
  const env = testEnv(3);
  const p = newProfile(env);
  return { ...p, ledger: [{ id: 'L000001', currency: 'crystals', delta: crystals, kind: 'grant', refType: 't', refId: 'seed', createdAt: 'x' }], wallet: { crystals, gold: 0 } };
};
const need = (id: string): BannerRates => getBanner(id)!;
const sigma = (p: number, n: number) => Math.sqrt((p * (1 - p)) / n);

describe('Banner-Dateien', () => {
  it('alle Dateien gueltig, als Startwerte markiert, mit Version; aktiv sind Standard und Starter', () => {
    const all = allBanners();
    expect(all.map((b) => b.bannerId).sort()).toEqual(['featured-example', 'standard', 'starter']);
    for (const b of all) {
      expect(b.calibrated).toBe(false);
      expect(b.note).toContain('Startwerte (Runde 7), nicht kalibriert');
      expect(b.ratesVersion).toMatch(/^2026-/);
    }
    expect(listBanners().map((b) => b.bannerId).sort()).toEqual(['standard', 'starter']);
    expect(need('featured-example').active).toBe(false);
  });
  it('Standard = rec 13: 50 / 450, 70/25/4/1, Pity 150 und 35', () => {
    const b = need('standard');
    expect([b.costPerPull, b.costTen]).toEqual([50, 450]);
    expect(b.tiers.map((t) => [t.rarity, t.baseRateBp])).toEqual([['rare', 7000], ['epic', 2500], ['legendary', 400], ['mythic', 100]]);
    expect(b.pity).toEqual({ top: { rarity: 'mythic', hardAt: 150 }, mid: { rarity: 'legendary', hardAt: 35 } });
  });
  it('inaktives Featured-Banner ist nicht ziehbar, Starter nur als 10er', () => {
    const env = testEnv();
    expect(pull(rich(), 'featured-example', 1, env)).toMatchObject({ ok: false, code: 'banner-inactive' });
    expect(pull(rich(), 'starter', 1, env)).toMatchObject({ ok: false, code: 'invalid-count' });
  });
});

describe('1 Mio. Wuerfe gegen die angezeigte Rate', () => {
  it('Standard: Gesamtquote = exakte Markov-Quote; Basisrate ohne Zwang; Pity-Obergrenzen', () => {
    const t0 = Date.now();
    const b = need('standard');
    const r = resolveBanner(b);
    const N = 1_000_000;
    const env = rng(20261007);
    const hits = [0, 0, 0, 0];
    const natural = [0, 0, 0, 0];
    let pity: Pity = { sinceTop: 0, sinceMid: 0 };
    let sinceMythic = 0;
    let sinceLeg = 0;
    let maxMythicGap = 0;
    let maxLegGap = 0;
    let forcedTop = 0;
    for (let i = 0; i < N; i++) {
      const o = rollOne(b, pity, env);
      if ('ok' in o) throw new Error(o.message);
      const idx = r.tiers.findIndex((t) => t.rarity === o.rarity);
      hits[idx]!++;
      let nat = 0;
      while (nat < r.cum.length - 1 && o.rollBp >= r.cum[nat]!) nat++;
      natural[nat]!++;
      if (o.pityForced === 'top') forcedTop++;
      sinceMythic++;
      sinceLeg++;
      if (o.rarity === 'mythic') {
        maxMythicGap = Math.max(maxMythicGap, sinceMythic);
        sinceMythic = 0;
      }
      if (o.rarity === 'mythic' || o.rarity === 'legendary') {
        maxLegGap = Math.max(maxLegGap, sinceLeg);
        sinceLeg = 0;
      }
      pity = o.pity;
    }
    const an = analyze(r);
    const view = bannerView(b, null);
    for (let i = 0; i < 4; i++) {
      const p = an.tierRate[i]!;
      expect(Math.abs(hits[i]! / N - p), `Stufe ${r.tiers[i]!.rarity}`).toBeLessThan(5 * sigma(p, N));
      // die angezeigte effektive Rate ist dieselbe Zahl (3 Nachkommastellen in %)
      expect(view.tiers[i]!.effectivePct).toBeCloseTo(p * 100, 2);
      // Basisrate: natuerlicher Wurf (ohne Pity-Zwang) trifft die Tabelle
      const base = r.tiers[i]!.baseBp / 10000;
      expect(Math.abs(natural[i]! / N - base)).toBeLessThan(5 * sigma(base, N));
    }
    // mit Pity liegt die Gesamtquote ueber der Basisrate (Mythic 1 % -> ~1,28 %)
    expect(an.tierRate[3]!).toBeGreaterThan(0.01);
    expect(1 / an.tierRate[3]!).toBeCloseTo(77.85, 0); // rec 13: E = (1 - 0,99^150) / 0,01 = 77,9
    expect(maxMythicGap).toBeLessThanOrEqual(150);
    expect(maxLegGap).toBeLessThanOrEqual(35);
    expect(forcedTop).toBeGreaterThan(0);
    expect(Date.now() - t0).toBeLessThan(20_000);
  });

  it('Starter: 100 000 Bloecke a 10 Zuege, jeder Block mindestens Epic, Raten = exakte Block-Verteilung', () => {
    const b = need('starter');
    const r = resolveBanner(b);
    const blocks = 100_000;
    const env = rng(77);
    const hits = [0, 0, 0, 0];
    let upgraded = 0;
    for (let k = 0; k < blocks; k++) {
      const out = rollBatch(b, { sinceTop: 0, sinceMid: 0 }, 10, env);
      if ('ok' in out) throw new Error(out.message);
      expect(out.outcomes.some((o) => o.rarity !== 'rare')).toBe(true);
      if (out.outcomes.some((o) => o.pityForced === 'batch')) upgraded++;
      for (const o of out.outcomes) hits[r.tiers.findIndex((t) => t.rarity === o.rarity)]!++;
    }
    const N = blocks * 10;
    const an = analyze(r);
    for (let i = 0; i < 4; i++) {
      const p = an.tierRate[i]!;
      expect(Math.abs(hits[i]! / N - p), r.tiers[i]!.rarity).toBeLessThan(5 * sigma(p, N));
    }
    expect(Math.abs(upgraded / blocks - an.upgradeChance!)).toBeLessThan(5 * sigma(an.upgradeChance!, blocks));
    // die Garantie hebt die Epic+-Quote ueber die Tabelle
    expect(an.tierRate[0]!).toBeLessThan(0.65);
  });
});

describe('Pity: Zaehler, Ziehungsverlauf, Ledger', () => {
  it('Zaehler ueberlebt Export/Import', () => {
    const env = testEnv(8);
    let p = rich();
    for (let i = 0; i < 7; i++) {
      const r = pull(p, 'standard', 10, env);
      if (!r.ok) throw new Error(r.message);
      p = r.profile;
    }
    const before = p.pity['standard']!;
    expect(before.sinceTop + before.sinceMid).toBeGreaterThan(0);
    const back = importProfile(exportProfile(p, env));
    if (!back.ok) throw new Error(back.message);
    expect(back.profile.pity).toEqual(p.pity);
    expect(bannerView(need('standard'), back.profile).pity[0]!.current).toBe(Math.min(before.sinceTop, 149));
  });
  it('Verlauf: roll, Stufe, Unit, Pity vorher/nachher, forced, ratesVersion, Hash, batchId; ein Ledger-Eintrag je Block', () => {
    const env = testEnv(4);
    const b = need('standard');
    const r = pull(rich(10_000), 'standard', 10, env);
    if (!r.ok) throw new Error(r.message);
    expect(r.profile.pullHistory).toHaveLength(10);
    for (const [i, h] of r.profile.pullHistory.entries()) {
      expect(h).toMatchObject({ bannerId: 'standard', ratesVersion: b.ratesVersion, ratesHash: bannerHash(b), batchId: 'batch-1', idx: i });
      expect(h.rollBp).toBeGreaterThanOrEqual(0);
      expect(h.rollBp).toBeLessThan(10000);
      expect(unitsOfRarity(h.rarity as 'rare')).toContain(h.unitId);
      expect(h.pityForced).toBeNull();
      if (i > 0) expect(h.pityBefore).toBe(r.profile.pullHistory[i - 1]!.pityAfter);
    }
    expect(r.profile.ledger.filter((e) => e.kind === 'gacha_spend')).toHaveLength(1);
    expect(balanceOf(r.profile, 'crystals')).toBe(10_000 - 450);
    // erzwungene Zuege sind markiert: Zaehler kurz vor der Garantie
    const near = { ...rich(10_000), pity: { standard: { sinceTop: 149, sinceMid: 0 } } };
    const f = pull(near, 'standard', 1, env);
    if (!f.ok) throw new Error(f.message);
    expect(f.profile.pullHistory[0]).toMatchObject({ rarity: 'mythic', pityBefore: 149, pityAfter: 0 });
    expect(['top', null]).toContain(f.profile.pullHistory[0]!.pityForced);
  });
  it('Duplikat -> copies + 1, kein Extra-Material; zu wenig / negativer Saldo -> Fehlercode', () => {
    const env = testEnv(6);
    let p = rich();
    for (let i = 0; i < 30; i++) {
      const r = pull(p, 'standard', 10, env);
      if (!r.ok) throw new Error(r.message);
      p = r.profile;
    }
    const copies = Object.values(p.units).reduce((s, u) => s + u.copies, 0);
    expect(copies).toBe(300);
    expect(p.ledger.filter((e) => e.currency === 'gold')).toHaveLength(0);
    expect(p.ledger.filter((e) => e.kind !== 'gacha_spend' && e.kind !== 'grant')).toHaveLength(0);
    const poor = { ...rich(449) };
    expect(pull(poor, 'standard', 10, env)).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    const neg: Profile = { ...rich(0), ledger: [{ id: 'L1', currency: 'crystals', delta: -20, kind: 'refund', refType: 'order', refId: 'x', createdAt: 'x' }], wallet: { crystals: -20, gold: 0 } };
    expect(pull(neg, 'standard', 1, env)).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    expect(neg.pullHistory).toHaveLength(0);
  });
  it('Starter: einmalig (Daten + Profil), 225 Crystals, mindestens Epic+, danach banner-limit-reached', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const env = testEnv(seed);
      const a = pull(rich(1000), 'starter', 10, env);
      if (!a.ok) throw new Error(a.message);
      expect(a.result.cost).toBe(225);
      expect(balanceOf(a.profile, 'crystals')).toBe(775);
      expect(a.result.pulls.some((x) => x.rarity !== 'rare')).toBe(true);
      expect(batchesUsed(a.profile, 'starter')).toBe(1);
      expect(pull(a.profile, 'starter', 10, env)).toMatchObject({ ok: false, code: 'banner-limit-reached' });
      if (seed === 1) expect(bannerView(need('starter'), a.profile)).toMatchObject({ status: 'limit-reached', limits: { used: 1, remaining: 0 } });
    }
    // Standard-Pity bleibt vom Starter unberuehrt
    const s = pull(rich(1000), 'starter', 10, testEnv(2));
    expect(s.ok && s.profile.pity['standard']).toBeUndefined();
  });
});

describe('Anzeige und Wurf lesen dieselben Daten', () => {
  it('manipulierte Banner-Daten aendern Anzeige UND Wurf', () => {
    const orig = need('standard');
    const manip: BannerRates = JSON.parse(JSON.stringify(orig));
    manip.tiers = [
      { rarity: 'rare', baseRateBp: 1000 },
      { rarity: 'epic', baseRateBp: 8000 },
      { rarity: 'legendary', baseRateBp: 900 },
      { rarity: 'mythic', baseRateBp: 100 },
    ];
    manip.pity = { top: { rarity: 'mythic', hardAt: 10 }, mid: { rarity: 'legendary', hardAt: 5 } };
    manip.ratesVersion = '2026-10-x';
    const v0 = bannerView(orig, null);
    const v1 = bannerView(manip, null);
    expect(v1.tiers[1]!.baseText).toBe('80%');
    expect(v1.pity[0]!.text).toBe('Pulls since last Mythic: 0 / 10');
    expect(v1.ratesHash).not.toBe(v0.ratesHash);
    expect(v1.ratesVersion).toBe('2026-10-x');
    // Wurf: Epic ~ 80 % (natuerlich), Pity-Obergrenze 10
    const env = rng(5);
    let pity: Pity = { sinceTop: 0, sinceMid: 0 };
    const n = [0, 0, 0, 0];
    let gap = 0;
    let maxGap = 0;
    for (let i = 0; i < 100_000; i++) {
      const o = rollOne(manip, pity, env);
      if ('ok' in o) throw new Error('x');
      n[['rare', 'epic', 'legendary', 'mythic'].indexOf(o.rarity)]!++;
      gap++;
      if (o.rarity === 'mythic') {
        maxGap = Math.max(maxGap, gap);
        gap = 0;
      }
      pity = o.pity;
    }
    expect(maxGap).toBeLessThanOrEqual(10);
    expect(Math.abs(n[1]! / 100_000 - v1.tiers[1]!.effectivePct / 100)).toBeLessThan(0.01);
    // pull schreibt Version und Hash der benutzten Datei in die Ziehung
    const pulled = pull(rich(), 'standard', 10, testEnv(1), manip);
    if (!pulled.ok) throw new Error(pulled.message);
    expect(pulled.result.ratesHash).toBe(v1.ratesHash);
    expect(pulled.profile.pullHistory.every((h) => h.ratesHash === v1.ratesHash && h.ratesVersion === '2026-10-x')).toBe(true);
    // beide gehen ueber dieselbe aufgeloeste Struktur
    expect(resolveBanner(manip)).toBe(resolveBanner(manip));
  });
  it('Hash der Anzeige = Hash der Datei auf der Platte', () => {
    for (const id of ['standard', 'starter', 'featured-example']) {
      const file = JSON.parse(readFileSync(new URL(`../data/banners/${id}.json`, import.meta.url), 'utf8'));
      expect(bannerView(need(id), null).ratesHash).toBe(checksum(canonicalJson(file)));
    }
  });
  it('bannerView: Tabelle, Einzelraten, Klartext, Pity-Stand, Erwartungswerte', () => {
    const b = need('standard');
    const prof = { ...rich(), pity: { standard: { sinceTop: 37, sinceMid: 12 } } };
    const v = bannerView(b, prof);
    expect(v.tiers.map((t) => t.baseText)).toEqual(['70%', '25%', '4%', '1%']);
    for (const t of v.tiers) {
      expect(t.populated).toBe(true);
      expect(t.units.reduce((s, u) => s + u.basePct, 0)).toBeCloseTo(t.basePct, 1);
      expect(t.units.reduce((s, u) => s + u.effectivePct, 0)).toBeCloseTo(t.effectivePct, 1);
    }
    expect(v.tiers[0]!.units.map((u) => u.unitId).sort()).toEqual(unitsOfRarity('rare').sort());
    expect(v.pity.map((x) => x.text)).toEqual(['Pulls since last Mythic: 37 / 150', 'Pulls since last Legendary or better: 12 / 35']);
    expect(v.rules.join(' ')).toContain('Guaranteed Mythic on pull 150');
    expect(v.rules.join(' ')).toContain('no hidden soft pity');
    expect(v.prices).toEqual({ single: 50, ten: 450 });
    expect(v.startValuesNotice).toContain('not calibrated');
    expect(v.status).toBe('ok');
    expect(v.expected.pullsPerTop).toBeCloseTo(77.85, 0);
    expect(v.expected.crystalsPerTop).toBeGreaterThan(3000);
    expect(v.expected.crystalsPerTop).toBeLessThan(4000);
    // naechster Zug: Basisrate, bis die Garantie greift; dann 100 %
    expect(v.tiers[3]!.nextPullText).toBe('1%');
    const v149 = bannerView(b, { ...prof, pity: { standard: { sinceTop: 149, sinceMid: 0 } } });
    expect(v149.tiers[3]!.nextPullText).toBe('100%');
    expect(v149.expected.pullsToNextTop).toBe(1);
    expect(v.expected.pullsToNextTop!).toBeLessThan(v.expected.pullsPerTop! + 150);
    // Starter: Block-Garantie im Klartext
    const sv = bannerView(need('starter'), null);
    expect(sv.rules.join(' ')).toContain('at least one Epic or better');
    expect(sv.rules.join(' ')).toContain('One-time offer');
    expect(sv.prices).toEqual({ single: null, ten: 225 });
    expect(sv.tiers[0]!.effectivePct).toBeLessThan(sv.tiers[0]!.basePct);
  });
});

describe('leere Seltenheit', () => {
  it('Rate wird umgelegt, Pity-Regel ohne Stufe abgeschaltet, Anzeige zeigt dasselbe', () => {
    const b: BannerRates = JSON.parse(JSON.stringify(need('standard')));
    b.tiers = b.tiers.map((t) => (t.rarity === 'mythic' ? { ...t, units: [] } : t));
    const v = bannerView(b, null);
    expect(v.tiers[3]!.populated).toBe(false);
    expect(v.tiers[2]!.baseText).toBe('5%');
    expect(v.tiers[3]!.effectivePct).toBe(0);
    expect(v.pity.map((x) => x.kind)).toEqual(['mid']);
    expect(v.notes.join(' ')).toContain('Mythic');
    const env = rng(9);
    let pity: Pity = { sinceTop: 0, sinceMid: 0 };
    let maxLegGap = 0;
    let gap = 0;
    for (let i = 0; i < 50_000; i++) {
      const o = rollOne(b, pity, env);
      if ('ok' in o) throw new Error('x');
      expect(o.rarity).not.toBe('mythic');
      gap++;
      if (o.rarity === 'legendary') {
        maxLegGap = Math.max(maxLegGap, gap);
        gap = 0;
      }
      pity = o.pity;
    }
    expect(maxLegGap).toBeLessThanOrEqual(35);
  });
  it('Banner ganz ohne Units -> Fehlercode statt Absturz', () => {
    const b: BannerRates = JSON.parse(JSON.stringify(need('standard')));
    b.tiers = b.tiers.map((t) => ({ ...t, units: [] }));
    expect(rollOne(b, { sinceTop: 0, sinceMid: 0 }, rng(1))).toMatchObject({ ok: false, code: 'banner-pool-empty' });
    expect(pull(rich(), 'standard', 1, testEnv(), b)).toMatchObject({ ok: false, code: 'banner-pool-empty' });
  });
});

describe('Idempotenz', () => {
  it('gleicher Schluessel zweimal (Doppelklick) zieht nicht doppelt; anderer Request -> Fehler', () => {
    const env = testEnv(12);
    const p0 = rich(5000);
    const run = (p: Profile, key: string, count: 1 | 10) => withIdempotency(p, { key, route: 'pull', request: { bannerId: 'standard', count } }, env, (q) => pull(q, 'standard', count, env));
    const a = run(p0, 'k-0000001-aaaa', 10);
    if (!a.ok) throw new Error(a.message);
    expect(a.replayed).toBe(false);
    const b = run(a.profile, 'k-0000001-aaaa', 10);
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(b.profile.ledger).toHaveLength(a.profile.ledger.length);
    expect(b.profile.pullHistory).toHaveLength(10);
    expect(balanceOf(b.profile, 'crystals')).toBe(5000 - 450);
    expect(b.result).toEqual(a.result);
    expect(run(a.profile, 'k-0000001-aaaa', 1)).toMatchObject({ ok: false, code: 'idempotency-key-reuse' });
  });
});

describe('Featured-Format (nicht aktiv, nur Datenformat)', () => {
  it('50 % Featured, danach garantiert; Langzeitanteil 1/(2-s) steht in der Anzeige', () => {
    const b: BannerRates = JSON.parse(JSON.stringify(need('featured-example')));
    b.active = true;
    b.tiers = b.tiers.map((t) => (t.rarity === 'mythic' ? { ...t, units: [{ unitId: 'F' }, { unitId: 'X' }, { unitId: 'Y' }] } : t));
    b.featured = { unitId: 'F', rarity: 'mythic', shareBp: 5000, guaranteeAfterMiss: true };
    const env = rng(31);
    let pity: Pity = { sinceTop: 0, sinceMid: 0 };
    let mythics = 0;
    let feat = 0;
    let lostBefore = false;
    for (let i = 0; i < 400_000; i++) {
      const o = rollOne(b, pity, env);
      if ('ok' in o) throw new Error('x');
      if (o.rarity === 'mythic') {
        mythics++;
        if (o.unitId === 'F') feat++;
        if (lostBefore) expect(o.featured).toBe('guaranteed');
        lostBefore = o.featured === 'lost';
      } else expect(o.featured).toBeNull();
      pity = o.pity;
    }
    expect(Math.abs(feat / mythics - 2 / 3)).toBeLessThan(0.02);
    const v = bannerView(b, null);
    const fu = v.tiers[3]!.units.find((u) => u.unitId === 'F')!;
    expect(fu.baseText).toBe('0.5%');
    expect(fu.effectivePct / v.tiers[3]!.effectivePct).toBeCloseTo(2 / 3, 2);
    expect(v.featured).toMatchObject({ unitId: 'F', sharePct: 50, guaranteeAfterMiss: true });
  });
});
