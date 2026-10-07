/**
 * Unit-Katalog fuer die Meta-Schicht: nur ID und Seltenheit, gelesen aus `sim/data/units.json` (einzige Quelle).
 * Neue Units (P6) erscheinen hier automatisch.
 */
import unitsJson from '../../sim/data/units.json';

export type Rarity = 'rare' | 'epic' | 'legendary' | 'mythic';
export const RARITIES: readonly Rarity[] = ['rare', 'epic', 'legendary', 'mythic'];

export interface CatalogUnit {
  id: string;
  rarity: Rarity;
}

export const UNIT_CATALOG: readonly CatalogUnit[] = (unitsJson.units as { id: string; rarity: string }[]).map((u) => {
  if (!(RARITIES as readonly string[]).includes(u.rarity)) throw new Error(`units.json: unbekannte Seltenheit ${u.rarity} bei ${u.id}`);
  return { id: u.id, rarity: u.rarity as Rarity };
});

export const unitIds = (): string[] => UNIT_CATALOG.map((u) => u.id);
export const isKnownUnit = (id: string): boolean => UNIT_CATALOG.some((u) => u.id === id);
export const unitsOfRarity = (r: Rarity): string[] => UNIT_CATALOG.filter((u) => u.rarity === r).map((u) => u.id);
export const rarityOf = (id: string): Rarity | null => UNIT_CATALOG.find((u) => u.id === id)?.rarity ?? null;
