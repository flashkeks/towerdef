/** Store (Runde 12): Karten und Kauflogik als reine Funktionen. Kaufen selbst macht `buyPower` aus `meta/`. */
import { INSTA_TIERS, INSTA_VARIANTS, POWERS, POWER_IDS, keyOf, type InstaVariant, type PowerId, type PowerKey } from './info';

export interface StoreCard {
  id: PowerId;
  name: string;
  desc: string;
  price: number;
  /** Bestand der gewaehlten Variante (Insta-Warden) bzw. der Power */
  owned: number;
  /** Insta-Warden: Bestand je Variante, sonst undefined */
  perVariant?: Record<InstaVariant, number>;
  key: PowerKey;
  variant?: InstaVariant;
  affordable: boolean;
  /** Embers, die zum Kauf noch fehlen (0 = leistbar) */
  missing: number;
}

/** Alle Karten in fester Reihenfolge. `variant` = gewaehlte Insta-Warden-Variante. */
export function storeCards(embers: number, inventory: Partial<Record<PowerKey, number>>, variant: InstaVariant = 'ranger'): StoreCard[] {
  return POWER_IDS.map((id) => {
    const info = POWERS[id];
    const key = keyOf(id, id === 'instaWarden' ? variant : undefined);
    const own = (k: PowerKey): number => Math.max(0, Math.floor(inventory[k] ?? 0));
    const perVariant = id === 'instaWarden' ? (Object.fromEntries(INSTA_VARIANTS.map((v) => [v, own(keyOf(id, v))])) as Record<InstaVariant, number>) : undefined;
    return {
      id, name: info.name, desc: info.desc, price: info.price, owned: own(key), perVariant, key, variant: id === 'instaWarden' ? variant : undefined,
      affordable: embers >= info.price, missing: Math.max(0, info.price - embers),
    };
  });
}

/** Text unter dem Preis: fehlt Geld, wie viel. */
export const priceNote = (c: StoreCard): string => (c.affordable ? '' : `Need ${c.missing} more`);

export const variantLabel = (v: InstaVariant): string => INSTA_TIERS[v];
