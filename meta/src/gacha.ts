/**
 * Gacha (Runde 7, P3). Die Banner-Dateien `meta/data/banners/*.json` sind die EINZIGE Quelle fuer Anzeige UND Wurf:
 * `rollOne`/`pull` und `bannerView` (banner-view.ts) lesen beide ueber `resolveBanner()` dasselbe Objekt.
 *
 * Regeln (alle Werte stehen in der Datei, nichts davon ist hier verdrahtet):
 * - Stufe nach `baseRateBp` (Summe 10000), Unit nach Gewicht (`weightBp`, sonst gleichverteilt) aus dem Pool der Stufe (Runde 8: `pool` je Stufe,
 *   561 AA-Units; Seltenheiten Rare/Epic/Legendary/Mythic/Secret/Exclusive).
 * - Pity: `top` (Hoechststufe) spaetestens beim `hardAt`-ten Zug seit dem letzten Treffer, `mid` (Mittelstufe oder besser) ebenso.
 *   Vorrang top > mid > Garantie im 10er. Zaehler `sinceTop` / `sinceMid` bleiben ueber Ziehungen und Sitzungen erhalten (Profil).
 *   KEINE weiche Pity: die Rate bleibt bis zum garantierten Zug bei der angezeigten Basisrate.
 * - `batchGuarantee` (Starter): im 10er mindestens eine Stufe >= `rarity`; sonst wird der letzte Zug darauf angehoben.
 * - `featured` (nur Format, im Spiel nicht aktiv): Anteil `shareBp` der Treffer der Featured-Stufe geht an die Featured-Unit,
 *   nach einem Fehlschlag ist die naechste Featured garantiert.
 * - `limits.maxBatches`: Begrenzung je Profil (Starter: einmalig), gezaehlt in `profile.counters['batches:<bannerId>']`.
 * - Leere Seltenheit (keine Unit in `units.json`): die Rate geht an die naechstniedrigere besetzte Stufe (sonst die naechsthoehere),
 *   eine Pity-Regel ohne besetzte Stufe >= ihrer Seltenheit ist abgeschaltet. Anzeige zeigt dieselbe, umgelegte Tabelle.
 * Duplikat -> copies + 1 (Sterne daraus: `stars.ts`), kein Extra-Material.
 */
import { z } from 'zod';
import featuredExampleJson from '../data/banners/featured-example.json';
import specialJson from '../data/banners/special.json';
import crossoverJson from '../data/banners/crossover.json';
import standardJson from '../data/banners/standard.json';
import starterJson from '../data/banners/starter.json';
import { RARITIES, poolOfRarity, type PoolName, type Rarity } from './catalog';
import type { MetaEnv } from './env';
import { book, KIND } from './ledger';
import { PULL_HISTORY_MAX, nextCounter, type Pity, type Profile, type PullRecord } from './profile';
import { fail, opOk, type Fail, type Op } from './result';
import { starsForCopies } from './stars';
import { canonicalJson, checksum } from './util';

const RarityEnum = z.enum(['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive']);
const Rule = z.object({ rarity: RarityEnum, hardAt: z.number().int().min(1) });
const rank = (r: string): number => RARITIES.indexOf(r as Rarity);

export const BannerRatesSchema = z
  .object({
    bannerId: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(['standard', 'starter', 'featured']),
    /** nur aktive Banner sind im Spiel zu sehen und zu ziehen */
    active: z.boolean(),
    /** aendert sich mit jeder Aenderung der Tabelle, z. B. '2026-10-a' */
    ratesVersion: z.string().min(1),
    /** false = Startwerte, nicht kalibriert (alle Werte der Runde 7) */
    calibrated: z.boolean(),
    note: z.string().min(1),
    costPerPull: z.number().int().min(1),
    /** Preis fuer den 10er-Zug; ohne Angabe 10 x Einzelpreis */
    costTen: z.number().int().min(1).optional(),
    /** erlaubte Zugzahlen; ohne Angabe 1 und 10 */
    allowedCounts: z.array(z.union([z.literal(1), z.literal(10)])).min(1).optional(),
    /** Begrenzung je Profil, z. B. Starter = ein 10er-Zug */
    limits: z.object({ maxBatches: z.number().int().min(1) }).optional(),
    tiers: z
      .array(
        z.object({
          rarity: RarityEnum,
          /** Basispunkte, Summe aller Stufen = 10000 */
          baseRateBp: z.number().int().min(0),
          /** Verteilung in der Stufe; ohne Angabe: alle Units der Seltenheit aus sim/data/units.json, gleichverteilt */
          units: z.array(z.object({ unitId: z.string(), weightBp: z.number().int().min(1).optional() })).optional(),
          /** Pool ohne `units`-Liste (Runde 8): `summonable` (Standard, Vorgabe), `special` (begrenzt/Event/Rate-up), `crossover` (Pop-Kultur-Figuren) oder `all`. Siehe `poolOfRarity` in catalog.ts */
          pool: z.enum(['summonable', 'special', 'crossover', 'all']).optional(),
        }),
      )
      .min(1),
    pity: z.object({ top: Rule.optional(), mid: Rule.optional() }),
    /** im 10er mindestens eine Stufe >= `rarity` (nur ohne Pity-Regeln) */
    batchGuarantee: z.object({ rarity: RarityEnum, count: z.literal(10) }).optional(),
    featured: z.object({ unitId: z.string().min(1), rarity: RarityEnum, shareBp: z.number().int().min(1).max(9999), guaranteeAfterMiss: z.boolean() }).optional(),
  })
  .refine((b) => b.tiers.reduce((s, t) => s + t.baseRateBp, 0) === 10000, { message: 'tier rates must sum to 10000 bp' })
  .refine((b) => new Set(b.tiers.map((t) => t.rarity)).size === b.tiers.length, { message: 'each rarity may appear once' })
  .refine((b) => !b.batchGuarantee || (!b.pity.top && !b.pity.mid), { message: 'batchGuarantee cannot be combined with pity rules' })
  .refine((b) => !b.pity.top || !b.pity.mid || rank(b.pity.top.rarity) >= rank(b.pity.mid.rarity), { message: 'pity.top must not be lower than pity.mid' })
  .refine((b) => !b.featured || b.tiers.some((t) => t.rarity === b.featured!.rarity), { message: 'featured rarity must be a tier of the banner' });
export type BannerRates = z.infer<typeof BannerRatesSchema>;

/** Registry: eine Datei je Banner. */
const ALL_BANNERS: Record<string, BannerRates> = {};
for (const raw of [standardJson, starterJson, specialJson, crossoverJson, featuredExampleJson]) {
  const b = BannerRatesSchema.parse(raw);
  ALL_BANNERS[b.bannerId] = b;
}

/** Nur aktive Banner (das, was das Spiel zeigt). */
export const listBanners = (): BannerRates[] => Object.values(ALL_BANNERS).filter((b) => b.active);
/** Alle Banner-Dateien inkl. inaktiver (Format-Beispiele, Tests). */
export const allBanners = (): BannerRates[] => Object.values(ALL_BANNERS);
/** Banner nach ID (auch inaktive; `pull` prueft `active` selbst). */
export const getBanner = (id: string): BannerRates | null => ALL_BANNERS[id] ?? null;

/** Hash der Banner-Datei (kanonisches JSON des geparsten Inhalts). Steht in jeder Ziehung und in der Anzeige. */
export const bannerHash = (b: BannerRates): string => checksum(canonicalJson(b));

// ---------------------------------------------------------------- Aufloesung (gemeinsam fuer Wurf und Anzeige)

export interface ResolvedTier {
  rarity: Rarity;
  baseBp: number;
  /** nach Umlegen leerer Stufen; mit dieser Rate wird gewuerfelt */
  effBp: number;
  pool: { unitId: string; weight: number }[];
  total: number;
}
export interface ResolvedRule {
  /** Index der niedrigsten besetzten Stufe >= Regel-Seltenheit: erzwungene Stufe und zugleich Schwelle fuer "Treffer" */
  idx: number;
  hardAt: number;
  rarity: Rarity;
  /** Seltenheit laut Datei (kann von `rarity` abweichen, wenn die Stufe leer ist) */
  ruleRarity: Rarity;
}
export interface ResolvedBanner {
  banner: BannerRates;
  hash: string;
  tiers: ResolvedTier[];
  /** kumulierte effBp je Stufe */
  cum: number[];
  top: ResolvedRule | null;
  mid: ResolvedRule | null;
  batch: { idx: number; rarity: Rarity } | null;
  featured: { tierIdx: number; unitId: string; shareBp: number; guaranteeAfterMiss: boolean } | null;
  /** Stufen, deren Rate wegen leerem Pool umgelegt wurde */
  redirected: { from: Rarity; to: Rarity; bp: number }[];
  counts: (1 | 10)[];
}

const cache = new WeakMap<BannerRates, ResolvedBanner>();

/** Pool einer Stufe als (unitId, Gewicht). Eine ausdrueckliche Liste (auch leer) gilt; ohne Angabe der Pool der Stufe (`pool`, Vorgabe `summonable`) aus den Unit-Dateien. */
export function tierPool(b: BannerRates, rarity: Rarity): { unitId: string; weight: number }[] {
  const tier = b.tiers.find((t) => t.rarity === rarity);
  if (tier?.units) return tier.units.map((u) => ({ unitId: u.unitId, weight: u.weightBp ?? 1 }));
  return poolOfRarity((tier?.pool ?? 'summonable') as PoolName, rarity).map((unitId) => ({ unitId, weight: 1 }));
}

export function resolveBanner(b: BannerRates): ResolvedBanner {
  const hit = cache.get(b);
  if (hit) return hit;
  const sorted = [...b.tiers].sort((x, y) => rank(x.rarity) - rank(y.rarity));
  const tiers: ResolvedTier[] = sorted.map((t) => {
    const pool = tierPool(b, t.rarity);
    return { rarity: t.rarity, baseBp: t.baseRateBp, effBp: t.baseRateBp, pool, total: pool.reduce((s, u) => s + u.weight, 0) };
  });
  const redirected: ResolvedBanner['redirected'] = [];
  tiers.forEach((t, i) => {
    if (t.total > 0 || t.baseBp === 0) return;
    let j = i - 1;
    while (j >= 0 && tiers[j]!.total === 0) j--;
    if (j < 0) {
      j = i + 1;
      while (j < tiers.length && tiers[j]!.total === 0) j++;
    }
    if (j < 0 || j >= tiers.length) return; // ganz ohne Units: pull meldet banner-pool-empty
    tiers[j]!.effBp += t.baseBp;
    t.effBp = 0;
    redirected.push({ from: t.rarity, to: tiers[j]!.rarity, bp: t.baseBp });
  });
  let acc = 0;
  const cum = tiers.map((t) => (acc += t.effBp));
  const rule = (r: z.infer<typeof Rule> | undefined): ResolvedRule | null => {
    if (!r) return null;
    const idx = tiers.findIndex((t) => t.total > 0 && rank(t.rarity) >= rank(r.rarity));
    return idx < 0 ? null : { idx, hardAt: r.hardAt, rarity: tiers[idx]!.rarity, ruleRarity: r.rarity };
  };
  let batch: ResolvedBanner['batch'] = null;
  if (b.batchGuarantee) {
    const idx = tiers.findIndex((t) => t.total > 0 && rank(t.rarity) >= rank(b.batchGuarantee!.rarity));
    if (idx >= 0) batch = { idx, rarity: tiers[idx]!.rarity };
  }
  let featured: ResolvedBanner['featured'] = null;
  if (b.featured) {
    const tierIdx = tiers.findIndex((t) => t.rarity === b.featured!.rarity);
    if (tierIdx >= 0 && tiers[tierIdx]!.pool.some((u) => u.unitId === b.featured!.unitId)) {
      featured = { tierIdx, unitId: b.featured.unitId, shareBp: b.featured.shareBp, guaranteeAfterMiss: b.featured.guaranteeAfterMiss };
    }
  }
  const r: ResolvedBanner = { banner: b, hash: bannerHash(b), tiers, cum, top: rule(b.pity.top), mid: rule(b.pity.mid), batch, featured, redirected, counts: b.allowedCounts ?? [1, 10] };
  cache.set(b, r);
  return r;
}

// ---------------------------------------------------------------- Wurf

export interface BatchCtx {
  /** Position im 10er (0-basiert) und Groesse */
  index: number;
  size: number;
  /** schon eine Stufe >= Garantie im Block gefallen */
  satisfied: boolean;
}

export interface RollOutcome {
  rollBp: number;
  rarity: Rarity;
  unitId: string;
  pityForced: 'top' | 'mid' | 'batch' | null;
  /** Zaehler `sinceTop` / `sinceMid` vor dem Zug */
  pityBefore: number;
  pityMidBefore: number;
  pity: Pity;
  featured: 'won' | 'lost' | 'guaranteed' | null;
  /** Stufe erfuellt die Block-Garantie */
  meetsGuarantee: boolean;
}

/** Ein Zug ohne Profil: nur Banner + Pity-Zaehler + Zufall. Wird auch von den Mio.-Wurf-Tests genutzt. */
export function rollOne(b: BannerRates, pity: Pity, env: Pick<MetaEnv, 'randomInt'>, batch?: BatchCtx): RollOutcome | Fail {
  const r = resolveBanner(b);
  if (!r.tiers.some((t) => t.total > 0)) return fail('banner-pool-empty', 'No units available in this banner.');
  const rollBp = env.randomInt(10000);
  let nat = 0;
  while (nat < r.cum.length - 1 && rollBp >= r.cum[nat]!) nat++;
  let idx = nat;
  let pityForced: RollOutcome['pityForced'] = null;
  if (r.top && nat < r.top.idx && pity.sinceTop + 1 >= r.top.hardAt) {
    idx = r.top.idx;
    pityForced = 'top';
  } else if (r.mid && nat < r.mid.idx && pity.sinceMid + 1 >= r.mid.hardAt) {
    idx = r.mid.idx;
    pityForced = 'mid';
  }
  if (r.batch && batch && !batch.satisfied && batch.index === batch.size - 1 && idx < r.batch.idx) {
    idx = r.batch.idx;
    pityForced = 'batch';
  }
  const tier = r.tiers[idx]!;

  let unitId = tier.pool[0]!.unitId;
  let featured: RollOutcome['featured'] = null;
  let guaranteeFeatured = pity.guaranteeFeatured === true;
  const f = r.featured;
  if (f && idx === f.tierIdx) {
    const others = tier.pool.filter((u) => u.unitId !== f.unitId);
    if (guaranteeFeatured || others.length === 0) {
      unitId = f.unitId;
      featured = guaranteeFeatured ? 'guaranteed' : 'won';
      guaranteeFeatured = false;
    } else if (env.randomInt(10000) < f.shareBp) {
      unitId = f.unitId;
      featured = 'won';
      guaranteeFeatured = false;
    } else {
      const total = others.reduce((s, u) => s + u.weight, 0);
      let pick = env.randomInt(total);
      unitId = others[0]!.unitId;
      for (const u of others) {
        if (pick < u.weight) {
          unitId = u.unitId;
          break;
        }
        pick -= u.weight;
      }
      featured = 'lost';
      guaranteeFeatured = f.guaranteeAfterMiss;
    }
  } else {
    let pick = env.randomInt(tier.total);
    for (const u of tier.pool) {
      if (pick < u.weight) {
        unitId = u.unitId;
        break;
      }
      pick -= u.weight;
    }
  }
  const next: Pity = {
    sinceTop: r.top && idx < r.top.idx ? pity.sinceTop + 1 : 0,
    sinceMid: r.mid && idx < r.mid.idx ? pity.sinceMid + 1 : 0,
  };
  if (f) next.guaranteeFeatured = guaranteeFeatured;
  return {
    rollBp,
    rarity: tier.rarity,
    unitId,
    pityForced,
    pityBefore: pity.sinceTop,
    pityMidBefore: pity.sinceMid,
    pity: next,
    featured,
    meetsGuarantee: r.batch ? idx >= r.batch.idx : false,
  };
}

/** `count` Zuege nacheinander (mit Block-Garantie). Fehler eines Zugs bricht ab. */
export function rollBatch(b: BannerRates, pity: Pity, count: number, env: Pick<MetaEnv, 'randomInt'>): { outcomes: RollOutcome[]; pity: Pity } | Fail {
  const outcomes: RollOutcome[] = [];
  let cur = pity;
  let satisfied = false;
  for (let index = 0; index < count; index++) {
    const o = rollOne(b, cur, env, { index, size: count, satisfied });
    if ('ok' in o) return o;
    if (o.meetsGuarantee) satisfied = true;
    outcomes.push(o);
    cur = o.pity;
  }
  return { outcomes, pity: cur };
}

export const pullCost = (b: BannerRates, count: 1 | 10): number => (count === 10 ? (b.costTen ?? b.costPerPull * 10) : b.costPerPull);

/** Wie viele Bloecke dieser Banner im Profil schon gezogen wurden (fuer `limits`). */
export const batchesUsed = (p: Profile, bannerId: string): number => p.counters[`batches:${bannerId}`] ?? 0;

export interface PullBatchResult {
  batchId: string;
  bannerId: string;
  ratesVersion: string;
  /** Hash der Banner-Datei, mit der gewuerfelt wurde */
  ratesHash: string;
  count: number;
  cost: number;
  pulls: PullRecord[];
  pity: Pity;
}

/**
 * Ziehen: Kosten abbuchen (ein Ledger-Eintrag `gacha_spend` je Block), wuerfeln, Sammlung/Pity/Verlauf fortschreiben. Alles oder nichts.
 * `bannerOverride` nur fuer Tests (manipulierte Banner-Daten); im Betrieb kommt der Banner aus der Registry.
 */
export function pull(p: Profile, bannerId: string, count: number, env: MetaEnv, bannerOverride?: BannerRates): Op<PullBatchResult> {
  const b = bannerOverride ?? getBanner(bannerId);
  if (!b) return fail('unknown-banner', `Unknown banner ${bannerId}.`);
  if (!b.active) return fail('banner-inactive', 'This banner is not available.');
  if (count !== 1 && count !== 10) return fail('invalid-count', 'Pull count must be 1 or 10.');
  const r = resolveBanner(b);
  if (!r.counts.includes(count)) return fail('invalid-count', count === 1 ? 'This banner only offers 10-pulls.' : 'This banner does not offer 10-pulls.');
  if (b.limits && batchesUsed(p, b.bannerId) >= b.limits.maxBatches) return fail('banner-limit-reached', 'You have already used this one-time offer.');
  if (!r.tiers.some((t) => t.total > 0)) return fail('banner-pool-empty', 'No units available in this banner.');
  const cost = pullCost(b, count);
  const { profile: p1, value: batchNo } = nextCounter(p, 'pullBatches');
  const batchId = `batch-${batchNo}`;
  const paid = book(p1, { currency: 'crystals', delta: -cost, kind: KIND.gachaSpend, refType: 'gacha_pull', refId: batchId }, env);
  if (!paid.ok) return paid;

  let cur = paid.profile;
  if (b.limits) cur = { ...cur, counters: { ...cur.counters, [`batches:${b.bannerId}`]: batchesUsed(cur, b.bannerId) + 1 } };
  const rolled = rollBatch(b, cur.pity[b.bannerId] ?? { sinceTop: 0, sinceMid: 0 }, count, env);
  if ('ok' in rolled) return rolled;

  const units = { ...cur.units };
  const pulls: PullRecord[] = [];
  rolled.outcomes.forEach((o, idx) => {
    const now = env.now();
    const owned = units[o.unitId];
    if (owned) {
      const copies = owned.copies + 1;
      units[o.unitId] = { ...owned, copies, stars: starsForCopies(copies) };
    } else {
      units[o.unitId] = { level: 1, xp: 0, copies: 1, stars: starsForCopies(1), firstObtainedAt: now };
    }
    const rec: PullRecord = {
      id: `${batchId}-${idx}`,
      bannerId: b.bannerId,
      ratesVersion: b.ratesVersion,
      ratesHash: r.hash,
      batchId,
      idx,
      rollBp: o.rollBp,
      rarity: o.rarity,
      unitId: o.unitId,
      isNew: !owned,
      pityBefore: o.pityBefore,
      pityAfter: o.pity.sinceTop,
      pityMidBefore: o.pityMidBefore,
      pityMidAfter: o.pity.sinceMid,
      pityForced: o.pityForced,
      costCrystals: idx === 0 ? cost : 0,
      createdAt: now,
    };
    if (o.featured) rec.featured = o.featured;
    pulls.push(rec);
  });
  cur = {
    ...cur,
    units,
    pity: { ...cur.pity, [b.bannerId]: rolled.pity },
    pullHistory: [...cur.pullHistory, ...pulls].slice(-PULL_HISTORY_MAX),
  };
  return opOk(cur, { batchId, bannerId: b.bannerId, ratesVersion: b.ratesVersion, ratesHash: r.hash, count, cost, pulls, pity: rolled.pity });
}
