/**
 * Schadensformel (recommendations §10) als reine Funktion auf Ganzzahlen.
 *
 * Reihenfolge, nach JEDEM Faktor wird abgerundet (Math.floor):
 *   Basis(Centi) x Lvl x (1+Trait) x (1+min(Buff,Cap)) x (1+min(Verwundbar,Cap))
 *   -> [DoT-Basis hier abgegriffen] -> x Element -> x 100/(100+max(0,R-Pen)) [nicht bei True Damage]
 *   -> x Crit -> Mindestschaden.
 */
import { BP, mulBp } from './fixed.js';
import type { EconomyData } from './data/schema.js';

export interface HitInput {
  baseCenti: number;
  /** Level-/Meta-Multiplikator in bp (10000 = x1). */
  lvlBp: number;
  /** Summe Trait-Schaden in bp (additiv, 0 = kein Bonus). */
  traitBp: number;
  /** Summe Buff-Schaden in bp (additiv, wird auf Cap begrenzt). */
  buffBp: number;
  /** Verwundbar in bp (wird auf Cap begrenzt). */
  vulnBp: number;
  /** Element-Multiplikator in bp (5000 / 10000 / 15000). */
  elementBp: number;
  armor: number;
  pen: number;
  crit: boolean;
  critMultBp: number;
  trueDamage: boolean;
}

export interface HitResult {
  damageCenti: number;
  /** Wert vor Element/Rüstung/Crit: Grundlage für DoT-Anteile. */
  dotBaseCenti: number;
}

export function computeHit(i: HitInput, eco: Pick<EconomyData, 'buffCaps' | 'damage'>): HitResult {
  let v = i.baseCenti;
  v = mulBp(v, i.lvlBp);
  v = mulBp(v, BP + i.traitBp);
  v = mulBp(v, BP + Math.min(i.buffBp, eco.buffCaps.damageBp));
  v = mulBp(v, BP + Math.min(i.vulnBp, eco.buffCaps.vulnerableBp));
  // DESIGN-OFFEN: DoT-Basis = Treffer nach Lvl/Trait/Buff/Verwundbar, vor Element, Rüstung und Crit.
  const dotBaseCenti = v;
  v = mulBp(v, i.elementBp);
  if (!i.trueDamage) {
    const r = Math.max(0, i.armor - i.pen);
    v = Math.floor((v * eco.damage.armorBase) / (eco.damage.armorBase + r));
  }
  if (i.crit) v = mulBp(v, i.critMultBp);
  if (v < eco.damage.minDamageCenti) v = eco.damage.minDamageCenti;
  return { damageCenti: v, dotBaseCenti };
}

/**
 * Element-Zyklus (1..5, 0 = neutral): stark, wenn (Ziel - Angreifer) mod 5 in {1,2};
 * schwach bei {3,4}; sonst neutral.
 */
export function elementBp(attacker: number, defender: number, eco: Pick<EconomyData, 'damage'>): number {
  if (attacker === 0 || defender === 0) return BP;
  const d = (((defender - attacker) % 5) + 5) % 5;
  if (d === 1 || d === 2) return eco.damage.elementStrongBp;
  if (d === 3 || d === 4) return eco.damage.elementWeakBp;
  return BP;
}
