/**
 * Unit-Katalog fuer die Meta-Schicht: nur ID und Seltenheit, gelesen aus `sim/data/units/*.json` (einzige Quelle, alle Dateien:
 * Beispiele, AA-Import, Crossover ...). Neue Units erscheinen hier automatisch, ohne Code.
 */
export type Rarity = 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret' | 'exclusive';
/** Aufsteigend nach Wert (Pity-Vergleiche nutzen diese Reihenfolge). */
export const RARITIES: readonly Rarity[] = ['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive'];

export interface CatalogUnit {
  id: string;
  rarity: Rarity;
}

const files = import.meta.glob('../../sim/data/units/*.json', { eager: true, import: 'default' }) as Record<string, { units?: { id: string; rarity: string }[] }>;

const seen = new Set<string>();
export const UNIT_CATALOG: readonly CatalogUnit[] = Object.keys(files)
  .sort()
  .flatMap((f) => files[f].units ?? [])
  .map((u) => {
    const rarity = u.rarity.toLowerCase();
    if (!(RARITIES as readonly string[]).includes(rarity)) throw new Error(`units/*.json: unbekannte Seltenheit ${u.rarity} bei ${u.id}`);
    if (seen.has(u.id)) throw new Error(`units/*.json: doppelte Unit-ID ${u.id}`);
    seen.add(u.id);
    return { id: u.id, rarity: rarity as Rarity };
  });

export const unitIds = (): string[] => UNIT_CATALOG.map((u) => u.id);
export const isKnownUnit = (id: string): boolean => UNIT_CATALOG.some((u) => u.id === id);
export const unitsOfRarity = (r: Rarity): string[] => UNIT_CATALOG.filter((u) => u.rarity === r).map((u) => u.id);
export const rarityOf = (id: string): Rarity | null => UNIT_CATALOG.find((u) => u.id === id)?.rarity ?? null;
