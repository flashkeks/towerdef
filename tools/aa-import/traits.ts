/**
 * Traits (traits.json, 12) -> `meta/data/aa/traits.json`. Alles in Basispunkten (10000 = 100 %).
 *
 * - `weight`: Wurf-Gewicht (AA `rollWeight` x 100, relativ; Summe 10003 wegen gerundeter Anzeigewerte).
 * - Wirkung im Match ueber `UnitMod` (sim): `damageBp` (additiv, wie AA), `rangeBp`, `spaBp` (negativ = schneller), `damageMultBp`
 *   (Unique x4: multiplikativ, wird im Meta zu einem additiven Bp-Wert umgerechnet), `yieldBp` (nur fuer `yieldUnits`).
 * - Gestaffelte Traits (Superior, Nimble, Range) haben `tiers` (1..3); Tier 3 gilt in AA als Epic.
 * - `noop`: Teile, die der Baukasten nicht kennt (Boss-/Low-HP-Bedingungen, True-Damage-Anteil, XP): bleiben Daten, wirken nicht.
 */
export interface TraitEffect {
  damageBp?: number;
  rangeBp?: number;
  spaBp?: number;
  damageMultBp?: number;
  yieldBp?: number;
}
export interface TraitDef extends TraitEffect {
  id: string;
  name: string;
  rarity: string;
  weight: number;
  tiers?: TraitEffect[];
  yieldUnits?: string[];
  noop?: string[];
}

const bp = (x: number | undefined): number | undefined => (x === undefined || x === null ? undefined : Math.round(x * 10000));
const eff = (t: any): TraitEffect => {
  const e: TraitEffect = {};
  if (t.damage !== undefined) e.damageBp = bp(t.damage);
  if (t.range !== undefined) e.rangeBp = bp(t.range);
  if (t.spa !== undefined) e.spaBp = bp(t.spa);
  if (t.damageMultiplier !== undefined) e.damageMultBp = bp(t.damageMultiplier);
  if (t.yen !== undefined) e.yieldBp = bp(t.yen);
  return e;
};

export function buildTraits(src: any): { ref: string; tierWeights: number[]; traits: TraitDef[] } {
  const traits: TraitDef[] = (src.traits as any[]).map((t) => {
    const noop: string[] = [];
    if (t.conditional?.vsBossDamage) noop.push('Zusatzschaden gegen Bosse');
    if (t.conditional?.vsLowHpDamage) noop.push('Zusatzschaden gegen Gegner mit wenig HP');
    if (t.conditional?.trueDamageShareOfBaseDamage) noop.push('True-Damage-Anteil');
    if (t.xp) noop.push('Unit-XP (es gibt keine Unit-XP)');
    if (t.placementLimit) noop.push('Platzierlimit 1 (Typ-Limit wird nicht durchgesetzt)');
    const d: TraitDef = { id: t.id, name: t.name, rarity: t.rarity, weight: Math.round(t.rollWeight * 100), ...eff(t) };
    if (t.tiers) d.tiers = (t.tiers as any[]).map(eff);
    if (t.yenAppliesTo) d.yieldUnits = t.yenAppliesTo;
    if (noop.length) d.noop = noop;
    return d;
  });
  // Stufen-Verteilung (AA nennt keine, DESIGN): Tier 1 70 %, Tier 2 25 %, Tier 3 5 %
  return { ref: 'Runde 8 / P2, erzeugt von tools/aa-import aus traits.json (Stand RR 2026). Stufen-Verteilung ist DESIGN (AA: unbekannt).', tierWeights: [7000, 2500, 500], traits };
}
