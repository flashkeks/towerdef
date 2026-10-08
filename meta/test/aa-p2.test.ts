/** Runde 8 / P2: AA-Katalog im Gacha, Evolution, Traits, Migration des Runde-7-Profils. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSim } from '../../sim/src/index';
import {
  KIND,
  LEGACY_R7_UNITS,
  MATERIALS,
  RARITIES,
  SCHEMA_VERSION,
  TRAITS,
  UNIT_CATALOG,
  allRecipes,
  balanceOf,
  bannerView,
  book,
  claimStarterGift,
  collectionView,
  evolutionCoverage,
  evolutionCost,
  evolutionView,
  evolve,
  exportProfile,
  getBanner,
  importProfile,
  levelUpTotalCost,
  migrate,
  newProfile,
  nameOf,
  poolOfRarity,
  pull,
  recipeFor,
  rerollCost,
  rerollTrait,
  resolveBanner,
  rollOne,
  rollTrait,
  seededRng,
  randomIntFrom,
  testEnv,
  traitMod,
  unitModsFor,
  withIdempotency,
  type Pity,
  type Profile,
} from '../src';

const env = (seed = 1) => testEnv(seed);
const rng = (seed: number) => ({ randomInt: randomIntFrom(seededRng(seed)) });
/** Runde 9 / P3: viel Evolutions-Material von jeder Sorte (Evolutionen kosten jetzt Material). */
const withMaterials = (p: Profile): Profile => ({ ...p, inventory: { ...p.inventory, materials: Object.fromEntries(MATERIALS.map((m) => [m.id, 1000])) } });
const rich = (crystals = 1_000_000, gold = 1_000_000): Profile => {
  let p = withMaterials(newProfile(env(3)));
  const a = book(p, { currency: 'crystals', delta: crystals, kind: KIND.grant, refType: 't', refId: 'c' }, env());
  if (!a.ok) throw new Error('x');
  if (gold === 0) return a.profile;
  const b = book(a.profile, { currency: 'gold', delta: gold, kind: KIND.grant, refType: 't', refId: 'g' }, env());
  if (!b.ok) throw new Error('x');
  p = b.profile;
  return p;
};
const own = (p: Profile, id: string, o: Partial<Profile['units'][string]> = {}): Profile => ({ ...p, units: { ...p.units, [id]: { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: 'x', ...o } } });

describe('Katalog (AA)', () => {
  it('575 Units (550 AA + 25 Crossover), alle sechs Seltenheiten, Ausgeblendete nie im Pool', () => {
    expect(UNIT_CATALOG.length).toBe(575);
    for (const r of RARITIES) expect(UNIT_CATALOG.some((u) => u.rarity === r), r).toBe(true);
    const hidden = UNIT_CATALOG.filter((u) => u.hidden).map((u) => u.id);
    expect(hidden.length).toBeGreaterThan(0);
    for (const pool of ['summonable', 'special', 'crossover'] as const) for (const r of RARITIES) for (const id of poolOfRarity(pool, r)) expect(hidden).not.toContain(id);
    // Standard-Pool und Special-Pool ueberschneiden sich nicht
    for (const r of RARITIES) {
      const a = new Set(poolOfRarity('summonable', r));
      expect(poolOfRarity('special', r).some((id) => a.has(id))).toBe(false);
    }
  });
  it('jede Evolutionsform ist ueber ein Rezept erreichbar, ziehbar oder ausgeblendet', () => {
    const cov = evolutionCoverage();
    expect(cov.unknownTargets).toEqual([]);
    for (const id of cov.orphans) {
      const u = UNIT_CATALOG.find((x) => x.id === id)!;
      expect(u.hidden || [...poolOfRarity('summonable', u.rarity), ...poolOfRarity('special', u.rarity), ...poolOfRarity('crossover', u.rarity)].includes(id), id).toBe(true);
    }
    const reachable = new Set([...RARITIES.flatMap((r) => [...poolOfRarity('summonable', r), ...poolOfRarity('special', r), ...poolOfRarity('crossover', r)]), ...allRecipes().flatMap((r) => r.to.map((t) => t.id))]);
    for (const u of UNIT_CATALOG) expect(reachable.has(u.id) || u.hidden, u.id).toBe(true);
  });
});

describe('Gacha mit dem AA-Katalog', () => {
  it('10er-Zug (Standard, Special, Starter): zehn Units aus den Pools, Ledger, Sammlung', () => {
    for (const [banner, cost] of [['standard', 450], ['special', 540], ['starter', 225]] as const) {
      const e = env(5);
      const r = pull(rich(10_000), banner, 10, e);
      if (!r.ok) throw new Error(r.message);
      expect(r.result.pulls).toHaveLength(10);
      expect(balanceOf(r.profile, 'crystals')).toBe(10_000 - cost);
      expect(Object.keys(r.profile.units).length).toBeGreaterThan(3);
      for (const h of r.result.pulls) {
        const b = getBanner(banner)!;
        const tier = b.tiers.find((t) => t.rarity === h.rarity)!;
        expect(poolOfRarity(tier.pool ?? 'summonable', h.rarity as 'rare'), `${banner}: ${h.unitId}`).toContain(h.unitId);
      }
    }
  });
  it('Standard: auf 20 000 Zuegen kommen alle sechs Seltenheiten vor, Pity haelt (Mythic oder besser <= 150)', () => {
    const b = getBanner('standard')!;
    const seen = new Set<string>();
    const e = rng(99);
    let pity: Pity = { sinceTop: 0, sinceMid: 0 };
    let gap = 0;
    let maxGap = 0;
    for (let i = 0; i < 20_000; i++) {
      const o = rollOne(b, pity, e);
      if ('ok' in o) throw new Error(o.message);
      seen.add(o.rarity);
      gap++;
      if (['mythic', 'secret', 'exclusive'].includes(o.rarity)) {
        maxGap = Math.max(maxGap, gap);
        gap = 0;
      }
      pity = o.pity;
    }
    expect([...seen].sort()).toEqual([...RARITIES].sort());
    expect(maxGap).toBeLessThanOrEqual(150);
  });
  it('Special-Banner: Featured-Unit ist im Pool und wird aufgeloest; bannerView zeigt alle Seltenheiten', () => {
    const b = getBanner('special')!;
    expect(resolveBanner(b).featured).toMatchObject({ unitId: 'goku_ssj3' });
    const v = bannerView(b, null);
    expect(v.tiers.map((t) => t.rarity)).toEqual(['rare', 'epic', 'legendary', 'mythic', 'secret']);
    expect(v.tiers.every((t) => t.populated)).toBe(true);
    expect(v.featured).toMatchObject({ unitId: 'goku_ssj3', sharePct: 50 });
    const s = bannerView(getBanner('standard')!, null);
    expect(s.tiers.map((t) => t.label)).toEqual(['Rare', 'Epic', 'Legendary', 'Mythic', 'Secret', 'Exclusive']);
    expect(s.tiers.reduce((a, t) => a + t.basePct, 0)).toBeCloseTo(100, 5);
  });
});

describe('Evolution', () => {
  it('219 Rezepte, Kosten nach Seltenheit der Form, Anzeige-Daten', () => {
    expect(allRecipes()).toHaveLength(219);
    expect(evolutionCost('ainz')).toEqual({ crystals: 600, gold: 5000 });
    expect(recipeFor('ainz')!.to).toEqual([{ id: 'ainz_evolved', weight: 10000 }]);
    const v = evolutionView('ainz', rich());
    expect(v).toMatchObject({ from: 'ainz', ready: false, reason: 'You do not own this unit.' });
    expect(evolutionView('ainz', own(rich(), 'ainz'))).toMatchObject({ ready: true, reason: null, to: [{ id: 'ainz_evolved', name: nameOf('ainz_evolved'), chancePct: 100 }] });
    expect(evolutionView(UNIT_CATALOG.find((u) => !recipeFor(u.id))!.id, null)).toBeNull();
  });
  it('evolve: Unit wird ersetzt, Level/Trait/Team bleiben, zwei Buchungen, Zaehler', () => {
    let p = own(rich(), 'ainz', { level: 7, copies: 3, stars: 2, trait: { id: 'divine', tier: 1 } });
    p = { ...p, team: ['ainz'] };
    const r = evolve(p, 'ainz', env());
    if (!r.ok) throw new Error(r.message);
    expect(r.result).toMatchObject({ from: 'ainz', to: 'ainz_evolved', level: 7, copies: 3, trait: { id: 'divine', tier: 1 }, cost: { crystals: 600, gold: 5000 } });
    expect(r.profile.units['ainz']).toBeUndefined();
    expect(r.profile.units['ainz_evolved']).toMatchObject({ level: 7, copies: 3, stars: 2, trait: { id: 'divine', tier: 1 } });
    expect(r.profile.team).toEqual(['ainz_evolved']);
    expect(balanceOf(r.profile, 'crystals')).toBe(1_000_000 - 600);
    expect(balanceOf(r.profile, 'gold')).toBe(1_000_000 - 5000);
    expect(r.profile.ledger.filter((e) => e.kind === KIND.evolve).map((e) => `${e.currency}:${e.refId}`)).toEqual(['crystals:ainz:1', 'gold:ainz:1']);
    expect(r.profile.counters['evolve:ainz']).toBe(1);
  });
  it('Fehlercodes: nicht besessen, kein Rezept, zu wenig Geld (nichts gebucht), zu wenig Kopien, Vorbedingung weiterer Unit', () => {
    expect(evolve(rich(), 'ainz', env())).toMatchObject({ ok: false, code: 'unit-not-owned' });
    const plain = UNIT_CATALOG.find((u) => !recipeFor(u.id))!.id;
    expect(evolve(own(rich(), plain), plain, env())).toMatchObject({ ok: false, code: 'no-evolution' });
    const poorC = own(rich(10, 1_000_000), 'ainz');
    expect(evolve(poorC, 'ainz', env())).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    const poorG = own(rich(1_000_000, 10), 'ainz');
    const g = evolve(poorG, 'ainz', env());
    expect(g).toMatchObject({ ok: false, code: 'not-enough-gold' });
    expect(poorG.ledger).toHaveLength(2); // Original unveraendert
    expect(evolve(own(rich(), 'gon'), 'gon', env())).toMatchObject({ ok: false, code: 'evolution-needs-units' });
    const ok = evolve(own(rich(), 'gon', { copies: 10, stars: 4 }), 'gon', env());
    expect(ok).toMatchObject({ ok: true, result: { to: 'gon_adult', copies: 1 } });
    // Rengoku braucht vier Akaza
    expect(evolve(own(rich(), 'rengoku'), 'rengoku', env())).toMatchObject({ ok: false, code: 'evolution-needs-units' });
    const two = evolve(own(own(rich(), 'rengoku'), 'akaza_unit', { copies: 5, stars: 3 }), 'rengoku', env());
    if (!two.ok) throw new Error(two.message);
    expect(two.profile.units['akaza_unit']!.copies).toBe(1);
    expect(two.profile.units['rengoku']).toBeUndefined();
  });
  it('gesperrte Rezepte (Ziel nicht spielbar) lehnen ab', () => {
    const blocked = allRecipes().filter((r) => r.blocked);
    expect(blocked.length).toBeGreaterThan(0);
    const id = blocked[0]!.from;
    expect(evolve(own(rich(), id), id, env())).toMatchObject({ ok: false, code: 'evolution-unavailable' });
  });
  it('Zufalls-Evolution wuerfelt gleichverteilt unter den Zielen', () => {
    const r = allRecipes().find((x) => x.to.length > 1 && !x.blocked)!;
    const counts: Record<string, number> = {};
    const e = rng(5);
    for (let i = 0; i < 400; i++) {
      const out = evolve(own(rich(), r.from), r.from, { ...e, now: () => 't', newId: () => 'i' });
      if (!out.ok) throw new Error(out.message);
      counts[out.result.to] = (counts[out.result.to] ?? 0) + 1;
    }
    expect(Object.keys(counts).sort()).toEqual(r.to.map((t) => t.id).sort());
    for (const n of Object.values(counts)) expect(n).toBeGreaterThan(40);
  });
  it('Idempotenz: derselbe Schluessel evolviert nur einmal', () => {
    const e = env(2);
    const p = own(rich(), 'ainz');
    const run = (q: Profile) => withIdempotency(q, { key: 'evolve-key-0001', route: 'evolve', request: { unitId: 'ainz' } }, e, (x) => evolve(x, 'ainz', e));
    const a = run(p);
    if (!a.ok) throw new Error(a.message);
    const b = run(a.profile);
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(b.profile.ledger).toHaveLength(a.profile.ledger.length);
    expect(b.result).toEqual(a.result);
  });
  it('collectionView: Name, Evolution, Trait; Ausgeblendete nur wenn besessen', () => {
    const p = own(rich(), 'ainz', { trait: { id: 'superior', tier: 2 } });
    const v = collectionView(p);
    const ainz = v.units.find((u) => u.unitId === 'ainz')!;
    expect(ainz.name).toBe(nameOf('ainz'));
    expect(ainz.trait).toMatchObject({ id: 'superior', tier: 2, name: 'Superior II' });
    expect(ainz.trait!.text).toContain('+12.5% damage');
    expect(ainz.evolution).toMatchObject({ ready: true });
    expect(ainz.rerollCost).toBe(100);
    const hidden = UNIT_CATALOG.find((u) => u.hidden)!.id;
    expect(v.units.some((u) => u.unitId === hidden)).toBe(false);
    expect(collectionView(own(p, hidden)).units.some((u) => u.unitId === hidden)).toBe(true);
  });
});

describe('Traits', () => {
  it('12 Traits, Gewichte, Reroll-Kosten nach Seltenheit', () => {
    expect(TRAITS).toHaveLength(12);
    expect(TRAITS.reduce((s, t) => s + t.weight, 0)).toBe(10003);
    expect(rerollCost('ichigo')).toBe(20);
    expect(rerollCost('ainz')).toBe(100);
    expect(rerollCost('gibtsnicht')).toBeNull();
  });
  it('Reroll: Buchung, Zaehler, neue Buchung je Wurf; nicht besessen / kein Geld', () => {
    let p = own(rich(1000, 0), 'ichigo');
    const a = rerollTrait(p, 'ichigo', env(4));
    if (!a.ok) throw new Error(a.message);
    expect(a.result).toMatchObject({ unitId: 'ichigo', cost: 20, rerolls: 1, previous: null });
    expect(a.profile.units['ichigo']!.trait).toEqual(a.result.trait);
    expect(balanceOf(a.profile, 'crystals')).toBe(980);
    const b = rerollTrait(a.profile, 'ichigo', env(5));
    if (!b.ok) throw new Error(b.message);
    expect(b.result).toMatchObject({ rerolls: 2, previous: a.result.trait });
    expect(b.profile.ledger.filter((e) => e.kind === KIND.traitReroll).map((e) => e.refId)).toEqual(['ichigo:1', 'ichigo:2']);
    expect(rerollTrait(p, 'krillin', env())).toMatchObject({ ok: false, code: 'unit-not-owned' });
    p = own(rich(10, 0), 'ichigo');
    expect(rerollTrait(p, 'ichigo', env())).toMatchObject({ ok: false, code: 'not-enough-crystals' });
  });
  it('Idempotenz: derselbe Schluessel wuerfelt nur einmal', () => {
    const e = env(8);
    const p = own(rich(1000, 0), 'ichigo');
    const run = (q: Profile) => withIdempotency(q, { key: 'reroll-key-00001', route: 'reroll', request: { unitId: 'ichigo' } }, e, (x) => rerollTrait(x, 'ichigo', e));
    const a = run(p);
    if (!a.ok) throw new Error(a.message);
    const b = run(a.profile);
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(balanceOf(b.profile, 'crystals')).toBe(980);
    expect(b.result).toEqual(a.result);
  });
  it('Wurf folgt den Gewichten (100 000 Wuerfe), gestaffelte Traits bekommen Stufen 1-3', () => {
    const e = rng(2026);
    const counts: Record<string, number> = {};
    const tiers = [0, 0, 0];
    const N = 100_000;
    for (let i = 0; i < N; i++) {
      const t = rollTrait(e);
      counts[t.id] = (counts[t.id] ?? 0) + 1;
      const def = TRAITS.find((x) => x.id === t.id)!;
      if (def.tiers) tiers[t.tier - 1]!++;
      else expect(t.tier).toBe(1);
    }
    for (const t of TRAITS) {
      const p = t.weight / 10003;
      expect(Math.abs((counts[t.id] ?? 0) / N - p), t.id).toBeLessThan(5 * Math.sqrt((p * (1 - p)) / N));
    }
    const total = tiers[0]! + tiers[1]! + tiers[2]!;
    expect(tiers[0]! / total).toBeGreaterThan(0.66);
    expect(tiers[2]! / total).toBeLessThan(0.08);
  });
  it('Wirkung als Unit-Mod: Divine, Unique (x4), Superior-Stufe, Golden nur fuer Farm-Units; ohne Trait unveraendert', () => {
    expect(traitMod('ichigo', { id: 'divine', tier: 1 })).toEqual({ damageBp: 2000, rangeBp: 2000, spaBp: -1000, yieldBp: 10000 });
    expect(traitMod('ichigo', { id: 'unique', tier: 1 })).toMatchObject({ damageBp: 30000, spaBp: -1000, rangeBp: 1000 });
    expect(traitMod('ichigo', { id: 'superior', tier: 3 }).damageBp).toBe(1500);
    expect(traitMod('speedwagon', { id: 'golden', tier: 1 })).toMatchObject({ damageBp: 3000, yieldBp: 12000 });
    expect(traitMod('ichigo', { id: 'golden', tier: 1 }).yieldBp).toBe(10000);
    expect(traitMod('ichigo', undefined)).toEqual({ damageBp: 0, rangeBp: 0, spaBp: 0, yieldBp: 10000 });
    let p = own(own(rich(), 'ichigo', { trait: { id: 'divine', tier: 1 } }), 'krillin');
    p = { ...p, team: ['ichigo', 'krillin'] };
    const mods = unitModsFor(p, p.team);
    expect(mods[0]).toMatchObject({ unit: 'ichigo', traitBp: 2000, rangeBp: 2000, spaBp: -1000 });
    expect(Object.keys(mods[1]!).sort()).toEqual(['lvlBp', 'player', 'unit']);
  });
  it('die Sim nimmt die Mods an: Unit im Match traegt Reichweite und Tempo', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, unitMods: [{ player: 0, unit: 'ichigo', traitBp: 2000, rangeBp: 2000, spaBp: -1000 }] });
    const spot = sim.placementGrid('ichigo')[0]!;
    expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...spot }).ok).toBe(true);
    expect(sim.state.units[0]).toMatchObject({ traitBp: 2000, traitRangeBp: 2000, traitSpaBp: -1000 });
  });
});

describe('Migration Runde 7 -> 8 (echtes Profil, erzeugt mit dem Code der Runde 7)', () => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/profile-r7.json', import.meta.url), 'utf8'));
  it('Fixture ist ein Schema-v1-Profil mit Runde-7-Units', () => {
    expect(raw.schemaVersion).toBe(1);
    for (const id of Object.keys(raw.units)) expect(LEGACY_R7_UNITS[id], id).toBeDefined();
  });
  it('Units weg, Erstattung in Crystals (je Kopie) und Gold (Level), Team leer, Pity bleibt, Geschenk neu abholbar', () => {
    const m = migrate(JSON.parse(JSON.stringify(raw)));
    if (!m.ok) throw new Error(m.message);
    expect(m.migratedFrom).toBe(1);
    const p = m.profile;
    expect(p.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.units).toEqual({});
    expect(p.team).toEqual([]);
    const perCopy: Record<string, number> = { rare: 25, epic: 60, legendary: 150, mythic: 450 };
    let crystals = 0;
    let gold = 0;
    for (const [id, u] of Object.entries(raw.units as Record<string, { copies: number; level: number }>)) {
      crystals += u.copies * perCopy[LEGACY_R7_UNITS[id]!]!;
      gold += levelUpTotalCost(1, u.level);
    }
    expect(crystals).toBeGreaterThan(0);
    expect(p.wallet.crystals).toBe(raw.wallet.crystals + crystals);
    expect(p.wallet.gold).toBe(raw.wallet.gold + gold);
    const refunds = p.ledger.filter((e) => e.refType === 'migration');
    expect(refunds.map((e) => `${e.currency}:${e.kind}:${e.refId}`)).toEqual(['crystals:refund:v2-units', 'gold:refund:v2-units']);
    expect(p.ledger.length).toBe(raw.ledger.length + 2);
    expect(p.pity).toEqual(raw.pity);
    expect(p.counters).toEqual(raw.counters);
    expect(p.pullHistory).toHaveLength(raw.pullHistory.length);
    expect(p.stages).toEqual(raw.stages);
    expect(p.playerXp).toBe(raw.playerXp);
    expect(p.idem).toEqual({});
    expect(p.flags.starterGiftClaimed).toBe(false);
    expect(p.settings['migrationR8']).toMatchObject({ refundCrystals: crystals, refundGold: gold, removedUnits: Object.keys(raw.units).sort() });
  });
  it('danach geht alles weiter: neues Geschenk ohne zweite Crystal-Gutschrift, 10er-Zug, Export/Import, zweite Migration aendert nichts', () => {
    const m = migrate(JSON.parse(JSON.stringify(raw)));
    if (!m.ok) throw new Error(m.message);
    const before = m.profile.wallet.crystals;
    const g = claimStarterGift(m.profile, env());
    if (!g.ok) throw new Error(g.message);
    expect(g.result.crystals).toBe(0);
    expect(g.profile.wallet.crystals).toBe(before);
    expect(g.profile.team).toHaveLength(6);
    expect(g.profile.team).toContain('goku_ssj3');
    const pulled = pull(g.profile, 'standard', 10, env(3));
    expect(pulled.ok).toBe(true);
    const back = importProfile(exportProfile(g.profile, env()));
    if (!back.ok) throw new Error(back.message);
    expect(back.profile).toEqual(g.profile);
    const again = migrate(JSON.parse(JSON.stringify(g.profile)));
    expect(again).toMatchObject({ ok: true, migratedFrom: SCHEMA_VERSION });
    if (again.ok) expect(again.profile).toEqual(g.profile);
  });
  it('Profil ohne Runde-7-Geschenk (nie geholt): bekommt die 450 Crystals mit dem neuen Geschenk', () => {
    const fresh = JSON.parse(JSON.stringify(newProfile(env())));
    fresh.schemaVersion = 1;
    const m = migrate(fresh);
    if (!m.ok) throw new Error(m.message);
    const g = claimStarterGift(m.profile, env());
    if (!g.ok) throw new Error(g.message);
    expect(g.result.crystals).toBe(450);
  });
  it('unbekannte Unit-IDs im Profil werden wie Rare erstattet und entfernt, bekannte AA-Units bleiben', () => {
    const p = JSON.parse(JSON.stringify(raw));
    p.units['gibts_nicht'] = { level: 1, xp: 0, copies: 2, stars: 2, firstObtainedAt: 'x' };
    p.units['ichigo'] = { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: 'x' };
    const m = migrate(p);
    if (!m.ok) throw new Error(m.message);
    expect(Object.keys(m.profile.units)).toEqual(['ichigo']);
    expect((m.profile.settings['migrationR8'] as { removedUnits: string[] }).removedUnits).toContain('gibts_nicht');
  });
});

describe('Crossover-Banner (Runde 8 / P6)', () => {
  it('aktiv, Raten sichtbar, Pool nur Crossover-Figuren, Rick Astley ist Featured; 10er-Zug zieht nur x_-Units', () => {
    const b = getBanner('crossover')!;
    expect(b.active).toBe(true);
    expect(b.featured?.unitId).toBe('x_rick');
    for (const r of RARITIES) for (const id of poolOfRarity('summonable', r)) expect(id.startsWith('x_')).toBe(false);
    for (const t of b.tiers) for (const id of poolOfRarity('crossover', t.rarity as 'rare')) expect(id.startsWith('x_'), id).toBe(true);
    const r = pull(rich(10_000), 'crossover', 10, env(5));
    if (!r.ok) throw new Error(r.message);
    expect(r.result.pulls).toHaveLength(10);
    for (const h of r.result.pulls) expect(h.unitId.startsWith('x_'), h.unitId).toBe(true);
    expect(balanceOf(r.profile, 'crystals')).toBe(10_000 - 540);
  });
});
