/**
 * Evolutionsrezepte (items.json -> evolutionRecipes.recipes, 219 Stueck) -> `meta/data/aa/evolutions.json`.
 *
 * Ein Rezept: Unit `from` wird zu `to` (eine Unit, oder mehrere mit Gewicht = Zufalls-Evolution: Elize 3 x 25 %, Chance 4 x 25 %).
 * `needs` = Units, die verbraucht werden (AA `units`, inklusive der Basis; `amount` > 1 = Kopien). AA-Items (Star Fruits, Ringe ...) und
 * Takedowns werden NICHT uebernommen (Entscheidung P2: Kosten als Gold + Crystals nach Seltenheit, `meta/data/evolution-costs.json`);
 * damit der Bezug zu AA nicht verloren geht, steht der Materialaufwand als `aa` mit im Datensatz (nur Information).
 * `blocked` = Ziel ist im Baukasten nicht spielbar (support hidden) oder unbekannt: `evolve` lehnt ab.
 */
export interface EvoTarget {
  id: string;
  weight: number;
}
export interface EvoRecipe {
  from: string;
  to: EvoTarget[];
  needs: { id: string; amount: number }[];
  text: string;
  attackPct: number | null;
  blocked?: string;
  aa: { starFruits: number; items: number; takedowns: number | null };
}

export function buildEvolutions(items: any, known: Map<string, string> | Set<string>, supportOf?: (id: string) => string | undefined): { ref: string; recipes: EvoRecipe[] } {
  const recipes: EvoRecipe[] = [];
  for (const r of items.evolutionRecipes.recipes as any[]) {
    const to: EvoTarget[] = (r.to as any[]).map((t) => ({ id: t.id as string, weight: Math.round((t.chance ?? 1 / r.to.length) * 10000) }));
    // Gewichte auf Summe 10000 bringen (Rundung)
    const sum = to.reduce((s, t) => s + t.weight, 0);
    to[0]!.weight += 10000 - sum;
    const rec: EvoRecipe = {
      from: r.from,
      to: to.length === 1 ? [{ id: to[0]!.id, weight: 10000 }] : to,
      needs: (r.units as any[]).map((u) => ({ id: u.id, amount: u.amount })),
      text: r.text ?? '',
      attackPct: r.textAttackPct ?? null,
      aa: {
        starFruits: Object.values((r.starFruits ?? {}) as Record<string, number>).reduce((s, n) => s + (n ?? 0), 0),
        items: ((r.items ?? []) as any[]).reduce((s, i) => s + (i.amount ?? 0), 0),
        takedowns: r.takedowns ?? null,
      },
    };
    const bad = [rec.from, ...rec.to.map((t) => t.id)].filter((id) => !known.has(id));
    const hidden = rec.to.map((t) => t.id).filter((id) => supportOf?.(id) === 'hidden');
    if (bad.length) rec.blocked = `unbekannte Unit ${bad.join(', ')}`;
    else if (hidden.length) rec.blocked = `Ziel nicht spielbar (${hidden.join(', ')})`;
    recipes.push(rec);
  }
  return { ref: 'Runde 8 / P2, erzeugt von tools/aa-import aus items.json (evolutionRecipes). Kosten: meta/data/evolution-costs.json.', recipes };
}
