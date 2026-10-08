import evolutionsJson from '../data/aa/evolutions.json';

/**
 * Unit-Katalog fuer die Meta-Schicht: nur ID und Seltenheit, gelesen aus `sim/data/units/*.json` (einzige Quelle, alle Dateien:
 * Beispiele, AA-Import, Crossover ...). Neue Units erscheinen hier automatisch, ohne Code.
 */
export type Rarity = 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret' | 'exclusive';
/** Aufsteigend nach Wert (Pity-Vergleiche nutzen diese Reihenfolge). */
export const RARITIES: readonly Rarity[] = ['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive'];

export interface CatalogUnit {
  id: string;
  name: string;
  rarity: Rarity;
  /** Importer: `hidden` = ohne Kampf-/Farm-Wirkung, nicht ziehbar und nicht in der Sammlung (ausser besessen). */
  hidden: boolean;
  /** Entwickelte Form laut AA (`evolvedFrom` = Vorstufe). */
  evolvedFrom: string | null;
  /** Nur ueber Evolution zu bekommen: `evolvedFrom` gesetzt UND Ziel eines Rezepts (vier AA-Units tragen `evolvedFrom`, haben aber kein Rezept: die sind ziehbar). */
  evolvedOnly: boolean;
  /** Begrenzte/Event-/Rate-up-Unit (AA `limited`, `rateupBannerOnly`, `hideFromBanner`): nur im Special-Banner. */
  special: boolean;
  /** Crossover-Figur (Runde 8 / P6, `source: "custom"`): nur im Crossover-Banner (Pool `crossover`), nicht im Standard- oder Special-Pool. */
  crossover: boolean;
}

interface RawUnit {
  id: string;
  name?: string;
  nameRR?: string;
  rarity: string;
  support?: string | null;
  evolvedFrom?: string | null;
  limited?: boolean | null;
  hideFromBanner?: boolean | null;
  rateupBannerOnly?: boolean | null;
  source?: string | null;
}
const files = import.meta.glob('../../sim/data/units/*.json', { eager: true, import: 'default' }) as Record<string, { units?: RawUnit[] }>;

const EVO_TARGETS = new Set((evolutionsJson as { recipes: { to: { id: string }[] }[] }).recipes.flatMap((r) => r.to.map((t) => t.id)));

const seen = new Set<string>();
export const UNIT_CATALOG: readonly CatalogUnit[] = Object.keys(files)
  .sort()
  .flatMap((f) => files[f].units ?? [])
  .map((u) => {
    const rarity = u.rarity.toLowerCase();
    if (!(RARITIES as readonly string[]).includes(rarity)) throw new Error(`units/*.json: unbekannte Seltenheit ${u.rarity} bei ${u.id}`);
    if (seen.has(u.id)) throw new Error(`units/*.json: doppelte Unit-ID ${u.id}`);
    seen.add(u.id);
    const crossover = u.source === 'custom';
    return {
      id: u.id,
      name: u.name ?? u.nameRR ?? u.id,
      rarity: rarity as Rarity,
      hidden: u.support === 'hidden',
      evolvedFrom: u.evolvedFrom ?? null,
      evolvedOnly: !!u.evolvedFrom && EVO_TARGETS.has(u.id),
      special: !crossover && !!(u.limited || u.rateupBannerOnly || u.hideFromBanner),
      crossover,
    };
  });

export const unitIds = (): string[] => UNIT_CATALOG.map((u) => u.id);
export const isKnownUnit = (id: string): boolean => UNIT_CATALOG.some((u) => u.id === id);
/** Alle Units einer Seltenheit (auch ausgeblendete und entwickelte). */
export const unitsOfRarity = (r: Rarity): string[] => UNIT_CATALOG.filter((u) => u.rarity === r).map((u) => u.id);

/**
 * Banner-Pools (Wurf und Anzeige lesen dieselbe Funktion):
 * `summonable` = Standard-Pool (kein Limited/Event/Rate-up, keine Evolution, nicht ausgeblendet);
 * `special` = die uebrigen nicht entwickelten, nicht ausgeblendeten Units (begrenzt, Event, Rate-up);
 * `crossover` = die Crossover-Figuren (Pop-Kultur/Memes, `source: "custom"`), nur dort;
 * `all` = alles Ziehbare (Union). Entwickelte Formen und ausgeblendete Units sind nie ziehbar.
 */
export type PoolName = 'summonable' | 'special' | 'crossover' | 'all';
const inPool = (pool: PoolName, u: CatalogUnit): boolean =>
  pool === 'all' || (pool === 'crossover' ? u.crossover : !u.crossover && (pool === 'special') === u.special);
export const poolOfRarity = (pool: PoolName, r: Rarity): string[] =>
  UNIT_CATALOG.filter((u) => u.rarity === r && !u.hidden && !u.evolvedOnly && inPool(pool, u)).map((u) => u.id);
export const nameOf = (id: string): string => UNIT_CATALOG.find((u) => u.id === id)?.name ?? id;
export const rarityOf = (id: string): Rarity | null => UNIT_CATALOG.find((u) => u.id === id)?.rarity ?? null;
