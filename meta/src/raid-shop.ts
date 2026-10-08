/**
 * Raid-Shop (Runde 9 / P3). Bezahlt wird mit Raid-Marken (`profile.inventory.raidMarks`), die nur Raids geben. Angebote: `data/raid-shop.json`
 * (Gold, Crystals, Material) plus je ein Unit-Angebot fuer jede garantierte Raid-Unit (Preis nach Seltenheit): wer Pech hat oder nicht auf die
 * Garantie warten will, kauft sie. Limits je Profil in `counters['raidshop:<id>']`. Aufrufe laufen wie alle Aktionen ueber `withIdempotency`.
 * Die Sichtmodelle enthalten Zahlen und IDs, Namen aus den Daten; Texte uebersetzt die UI.
 */
import shopJson from '../data/raid-shop.json';
import { nameOf, rarityOf, type Rarity } from './catalog';
import type { MetaEnv } from './env';
import { applyInventory, materialCount } from './inventory';
import { book, KIND } from './ledger';
import { MATERIALS, materialName } from './materials';
import { RAIDS } from './mode-catalog';
import { grantUnit } from './modes';
import type { Profile } from './profile';
import { fail, opOk, type Op } from './result';

interface RawOffer {
  id: string;
  kind: 'gold' | 'crystals' | 'material';
  material?: string;
  amount: number;
  price: number;
  limit?: number;
}
const RAW = shopJson as unknown as { offers: RawOffer[]; unitPrice: Record<string, number> };

export type RaidOfferKind = 'gold' | 'crystals' | 'material' | 'unit';

export interface RaidOffer {
  id: string;
  kind: RaidOfferKind;
  /** Menge (Gold/Crystals/Material); Unit: 1 */
  amount: number;
  price: number;
  /** `null` = unbegrenzt */
  limit: number | null;
  material?: string;
  unitId?: string;
  /** Raid, dessen Garantie diese Unit ist (Unit-Angebote) */
  raidId?: string;
  raidName?: string;
}

/** Alle Angebote in Anzeigereihenfolge: Gold, Crystals, Material, dann die Raid-Units (nach Raid-Reihenfolge, doppelte Units einmal). */
export function raidOffers(): RaidOffer[] {
  const out: RaidOffer[] = RAW.offers.map((o) => ({ id: o.id, kind: o.kind, amount: o.amount, price: o.price, limit: o.limit ?? null, ...(o.material ? { material: o.material } : {}) }));
  const seen = new Set<string>();
  for (const r of RAIDS) {
    const u = r.guarantee!.unit;
    if (seen.has(u)) continue;
    seen.add(u);
    const rar = rarityOf(u) as Rarity | null;
    out.push({ id: `unit-${u}`, kind: 'unit', amount: 1, price: RAW.unitPrice[rar ?? 'mythic'] ?? 200, limit: 1, unitId: u, raidId: r.id, raidName: r.name });
  }
  return out;
}
export const raidOffer = (id: string): RaidOffer | undefined => raidOffers().find((o) => o.id === id);
const counterKey = (id: string): string => `raidshop:${id}`;

export interface RaidOfferView extends RaidOffer {
  title: string;
  bought: number;
  soldOut: boolean;
  canBuy: boolean;
  /** Englisch, anzeigbar, sonst `null` */
  reason: string | null;
  /** Material: Besitz; Unit: besessen */
  owned: number;
}

export interface RaidShopView {
  raidMarks: number;
  offers: RaidOfferView[];
}

export function raidShopView(p: Profile): RaidShopView {
  const offers = raidOffers().map((o): RaidOfferView => {
    const bought = p.counters[counterKey(o.id)] ?? 0;
    const owned = o.kind === 'material' ? materialCount(p, o.material!) : o.kind === 'unit' ? (p.units[o.unitId!] ? 1 : 0) : 0;
    const soldOut = (o.limit !== null && bought >= o.limit) || (o.kind === 'unit' && owned > 0);
    const reason = soldOut ? (o.kind === 'unit' && owned > 0 ? 'You already own this unit.' : 'Sold out.') : p.inventory.raidMarks < o.price ? 'Not enough Raid Marks.' : null;
    const title = o.kind === 'gold' ? 'Gold' : o.kind === 'crystals' ? 'Crystals' : o.kind === 'material' ? materialName(o.material!) : nameOf(o.unitId!);
    return { ...o, title, bought, soldOut, canBuy: reason === null, reason, owned };
  });
  return { raidMarks: p.inventory.raidMarks, offers };
}

export interface RaidPurchase {
  offerId: string;
  kind: RaidOfferKind;
  price: number;
  amount: number;
  material?: string;
  unitId?: string;
  isNew?: boolean;
}

export function buyRaidOffer(p: Profile, offerId: string, env: Pick<MetaEnv, 'now'>): Op<RaidPurchase> {
  const o = raidOffer(offerId);
  if (!o) return fail('unknown-offer', 'This offer does not exist.');
  const n = (p.counters[counterKey(o.id)] ?? 0) + 1;
  if (o.limit !== null && n > o.limit) return fail('offer-sold-out', 'Sold out.');
  if (o.kind === 'unit' && p.units[o.unitId!]) return fail('offer-sold-out', 'You already own this unit.');
  const paid = applyInventory(p, { raidMarks: -o.price });
  if (!paid.ok) return paid;
  let cur: Profile = { ...paid.profile, counters: { ...paid.profile.counters, [counterKey(o.id)]: n } };
  const res: RaidPurchase = { offerId: o.id, kind: o.kind, price: o.price, amount: o.amount };
  if (o.kind === 'gold' || o.kind === 'crystals') {
    const b = book(cur, { currency: o.kind, delta: o.amount, kind: KIND.grant, refType: 'raidshop', refId: `${o.id}:${n}` }, env);
    if (!b.ok) return b;
    cur = b.profile;
  } else if (o.kind === 'material') {
    const m = applyInventory(cur, { materials: { [o.material!]: o.amount } });
    if (!m.ok) return m;
    cur = m.profile;
    res.material = o.material;
  } else {
    const g = grantUnit(cur, o.unitId!, env);
    if (!('profile' in g)) return g;
    cur = g.profile;
    res.unitId = o.unitId;
    res.isNew = g.isNew;
  }
  return opOk(cur, res);
}

export const RAID_MATERIAL_IDS: readonly string[] = MATERIALS.map((m) => m.id);
