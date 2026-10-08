/**
 * Evolutions-Material (Runde 9 / P3). Daten: `data/materials.json`. Jede Legend Stage laesst ein Material fallen; eine Evolution verlangt
 * zusaetzlich zu Crystals und Gold eine Menge EINES Materials (Menge nach Seltenheit der entwickelten Form, Art aus dem Pool dieser Seltenheit,
 * gewaehlt ueber einen stabilen Hash der Unit-ID, ausser `overrides`). Damit haengt die Evolution am Spielinhalt.
 */
import evolutionsJson from '../data/aa/evolutions.json';
import materialsJson from '../data/materials.json';
import { RARITIES, rarityOf, type Rarity } from './catalog';
import { LEGEND_STAGES } from './mode-catalog';

export interface MaterialInfo {
  id: string;
  name: string;
  text: string;
  /** Legend Stage, die es fallen laesst, und ihre Act-Stages */
  legendId: string;
  legendName: string;
}

interface Raw {
  materials: { id: string; name: string; text: string; legend: string }[];
  evolve: { amount: Record<string, number>; pools: Record<string, string[]>; overrides: Record<string, string> };
}
const RAW = materialsJson as unknown as Raw;

export const MATERIALS: readonly MaterialInfo[] = RAW.materials.map((m) => ({
  id: m.id,
  name: m.name,
  text: m.text,
  legendId: m.legend,
  legendName: LEGEND_STAGES.find((l) => l.id === m.legend)?.name ?? m.legend,
}));
export const materialInfo = (id: string): MaterialInfo | undefined => MATERIALS.find((m) => m.id === id);
export const materialName = (id: string): string => materialInfo(id)?.name ?? id;

const RECIPE_TARGET = new Map<string, string>((evolutionsJson as { recipes: { from: string; to: { id: string }[] }[] }).recipes.map((r) => [r.from, r.to[0]!.id]));

/** Stabiler Index 0..n-1 aus einer ID (kein Zufall: dieselbe Unit braucht immer dasselbe Material). */
function hashIndex(id: string, n: number): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 33) + id.charCodeAt(i)) >>> 0;
  return h % n;
}

export interface MaterialNeed {
  material: string;
  amount: number;
}

/** Material, das die Evolution dieser Unit braucht; `null` ohne Rezept. */
export function evolutionMaterial(unitId: string): MaterialNeed | null {
  const to = RECIPE_TARGET.get(unitId);
  if (!to) return null;
  const rar: Rarity | null = rarityOf(to) ?? rarityOf(unitId);
  if (!rar) return null;
  const override = RAW.evolve.overrides[unitId];
  const pool = RAW.evolve.pools[rar] ?? [];
  const material = override ?? pool[hashIndex(unitId, pool.length)];
  const amount = RAW.evolve.amount[rar] ?? 0;
  return material && amount > 0 ? { material, amount } : null;
}

export const MATERIAL_RARITIES = RARITIES;
