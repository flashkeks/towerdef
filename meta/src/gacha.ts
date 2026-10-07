/**
 * Gacha. Besitzer: P3. Jetzt: funktionierende Minimalversion, damit der Kreislauf schon laeuft.
 *
 * TODO P3: Starter-Banner (einmalig, garantiert Epic+), Featured-Format, Gewichte je Unit, Ratenanzeige-Helfer
 * (Prozent aus `baseRateBp`, effektive Rate je Pity-Stufe), 1-Mio.-Wurf-Test gegen die angezeigte Rate,
 * Soft-Pity falls gewollt. Die Banner-Datei bleibt die einzige Quelle fuer Anzeige und Wurf (`meta/data/banners/*.json`).
 *
 * Regeln der Minimalversion: Rate nach `baseRateBp` (Summe 10000), Unit gleichverteilt (bzw. nach `weightBp`) aus dem Pool der Stufe,
 * harte Pity: `top` (Hoechststufe) spaetestens beim `hardAt`-ten Zug seit dem letzten Treffer, `mid` (Mittelstufe oder besser) ebenso.
 * Zaehler: `sinceTop` = Zuege seit letztem `top`, `sinceMid` = Zuege seit letztem Treffer der Mittelstufe oder besser.
 * Duplikat -> copies + 1 (Sterne daraus: `stars.ts`).
 */
import { z } from 'zod';
import standardJson from '../data/banners/standard.json';
import { RARITIES, unitsOfRarity, type Rarity } from './catalog';
import type { MetaEnv } from './env';
import { book, KIND } from './ledger';
import { PULL_HISTORY_MAX, nextCounter, type Pity, type Profile, type PullRecord } from './profile';
import { fail, opOk, type Fail, type Op } from './result';
import { starsForCopies } from './stars';

const RarityEnum = z.enum(['rare', 'epic', 'legendary', 'mythic']);

export const BannerRatesSchema = z
  .object({
    bannerId: z.string().min(1),
    name: z.string().min(1),
    /** aendert sich mit jeder Aenderung der Tabelle, z. B. '2026-10-a' */
    ratesVersion: z.string().min(1),
    note: z.string().optional(),
    costPerPull: z.number().int().min(1),
    /** Preis fuer den 10er-Zug; ohne Angabe 10 x Einzelpreis */
    costTen: z.number().int().min(1).optional(),
    tiers: z
      .array(
        z.object({
          rarity: RarityEnum,
          /** Basispunkte, Summe aller Stufen = 10000 */
          baseRateBp: z.number().int().min(0),
          /** Verteilung in der Stufe; ohne Angabe: alle Units der Seltenheit aus sim/data/units.json, gleichverteilt */
          units: z.array(z.object({ unitId: z.string(), weightBp: z.number().int().min(1).optional() })).optional(),
        }),
      )
      .min(1),
    pity: z.object({
      top: z.object({ rarity: RarityEnum, hardAt: z.number().int().min(1) }),
      mid: z.object({ rarity: RarityEnum, hardAt: z.number().int().min(1) }),
    }),
  })
  .refine((b) => b.tiers.reduce((s, t) => s + t.baseRateBp, 0) === 10000, { message: 'tier rates must sum to 10000 bp' });
export type BannerRates = z.infer<typeof BannerRatesSchema>;

/** Registry: eine Datei je Banner. TODO P3: Starter-Banner hier eintragen. */
const BANNERS: Record<string, BannerRates> = {
  standard: BannerRatesSchema.parse(standardJson),
};

export const listBanners = (): BannerRates[] => Object.values(BANNERS);
export const getBanner = (id: string): BannerRates | null => BANNERS[id] ?? null;

const rank = (r: string): number => RARITIES.indexOf(r as Rarity);

/** Pool einer Stufe als (unitId, Gewicht). */
export function tierPool(b: BannerRates, rarity: Rarity): { unitId: string; weight: number }[] {
  const tier = b.tiers.find((t) => t.rarity === rarity);
  if (tier?.units && tier.units.length) return tier.units.map((u) => ({ unitId: u.unitId, weight: u.weightBp ?? 1 }));
  return unitsOfRarity(rarity).map((unitId) => ({ unitId, weight: 1 }));
}

export interface RollOutcome {
  rollBp: number;
  rarity: Rarity;
  unitId: string;
  pityForced: 'top' | 'mid' | null;
  pityBefore: number;
  pity: Pity;
}

/** Ein Zug ohne Profil: nur Banner + Pity-Zaehler + Zufall. Wird auch vom Mio.-Wurf-Test genutzt. */
export function rollOne(b: BannerRates, pity: Pity, env: Pick<MetaEnv, 'randomInt'>): RollOutcome | Fail {
  const rollBp = env.randomInt(10000);
  let acc = 0;
  let natural: Rarity = b.tiers[b.tiers.length - 1]!.rarity;
  for (const t of b.tiers) {
    acc += t.baseRateBp;
    if (rollBp < acc) {
      natural = t.rarity;
      break;
    }
  }
  let rarity = natural;
  let pityForced: 'top' | 'mid' | null = null;
  if (rank(natural) < rank(b.pity.top.rarity) && pity.sinceTop + 1 >= b.pity.top.hardAt) {
    rarity = b.pity.top.rarity;
    pityForced = 'top';
  } else if (rank(natural) < rank(b.pity.mid.rarity) && pity.sinceMid + 1 >= b.pity.mid.hardAt) {
    rarity = b.pity.mid.rarity;
    pityForced = 'mid';
  }
  const pool = tierPool(b, rarity);
  const total = pool.reduce((s, u) => s + u.weight, 0);
  if (total === 0) return fail('banner-pool-empty', `No units available for ${rarity}.`);
  let pick = env.randomInt(total);
  let unitId = pool[0]!.unitId;
  for (const u of pool) {
    if (pick < u.weight) {
      unitId = u.unitId;
      break;
    }
    pick -= u.weight;
  }
  const hitTop = rank(rarity) >= rank(b.pity.top.rarity);
  const hitMid = rank(rarity) >= rank(b.pity.mid.rarity);
  const next: Pity = { sinceTop: hitTop ? 0 : pity.sinceTop + 1, sinceMid: hitMid ? 0 : pity.sinceMid + 1 };
  return { rollBp, rarity, unitId, pityForced, pityBefore: pity.sinceTop, pity: next };
}

export const pullCost = (b: BannerRates, count: 1 | 10): number => (count === 10 ? (b.costTen ?? b.costPerPull * 10) : b.costPerPull);

export interface PullBatchResult {
  batchId: string;
  bannerId: string;
  ratesVersion: string;
  count: number;
  cost: number;
  pulls: PullRecord[];
  pity: Pity;
}

/** Ziehen: Kosten abbuchen, wuerfeln, Sammlung/Pity/Verlauf fortschreiben. Alles oder nichts. */
export function pull(p: Profile, bannerId: string, count: number, env: MetaEnv): Op<PullBatchResult> {
  const b = getBanner(bannerId);
  if (!b) return fail('unknown-banner', `Unknown banner ${bannerId}.`);
  if (count !== 1 && count !== 10) return fail('invalid-count', 'Pull count must be 1 or 10.');
  const cost = pullCost(b, count);
  const { profile: p1, value: batchNo } = nextCounter(p, 'pullBatches');
  const batchId = `batch-${batchNo}`;
  const paid = book(p1, { currency: 'crystals', delta: -cost, kind: KIND.gachaSpend, refType: 'gacha_pull', refId: batchId }, env);
  if (!paid.ok) return paid;

  let cur = paid.profile;
  let pity: Pity = cur.pity[bannerId] ?? { sinceTop: 0, sinceMid: 0 };
  const units = { ...cur.units };
  const pulls: PullRecord[] = [];
  for (let idx = 0; idx < count; idx++) {
    const r = rollOne(b, pity, env);
    if ('ok' in r) return r;
    const now = env.now();
    const owned = units[r.unitId];
    if (owned) {
      const copies = owned.copies + 1;
      units[r.unitId] = { ...owned, copies, stars: starsForCopies(copies) };
    } else {
      units[r.unitId] = { level: 1, xp: 0, copies: 1, stars: starsForCopies(1), firstObtainedAt: now };
    }
    pulls.push({
      id: `${batchId}-${idx}`,
      bannerId,
      ratesVersion: b.ratesVersion,
      batchId,
      idx,
      rollBp: r.rollBp,
      rarity: r.rarity,
      unitId: r.unitId,
      isNew: !owned,
      pityBefore: r.pityBefore,
      pityAfter: r.pity.sinceTop,
      pityForced: r.pityForced,
      costCrystals: idx === 0 ? cost : 0,
      createdAt: now,
    });
    pity = r.pity;
  }
  cur = {
    ...cur,
    units,
    pity: { ...cur.pity, [bannerId]: pity },
    pullHistory: [...cur.pullHistory, ...pulls].slice(-PULL_HISTORY_MAX),
  };
  return opOk(cur, { batchId, bannerId, ratesVersion: b.ratesVersion, count, cost, pulls, pity });
}
