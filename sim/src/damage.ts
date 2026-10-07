/**
 * Schadensformel (recommendations §10, design-brief § 2.4) als reine Funktion auf Ganzzahlen.
 *
 * Reihenfolge, nach JEDEM Faktor wird abgerundet (Math.floor):
 *   Basis(Centi) x Lvl x (1+Trait) x (1+min(Buff,Cap)) x (1+Selbst-Buffs) x (1+min(Verwundbar,Cap))
 *   -> [DoT-Basis hier abgegriffen] -> x (1 + Σ Schwächen) -> x 100/(100+max(0,R-Pen)) [nicht bei True Damage]
 *   -> x Crit -> Mindestschaden.
 *
 * Schwäche additiv (`1 + Σ weakness%`), Resistenz `100/(100+R)`, True Damage ignoriert Resistenz (und Schilde, siehe `applyDamage`).
 * R = Rüstung des Gegners + Resistenz gegen den Damage-Typ + Resistenzen gegen die Elemente des Angriffs.
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
  /** Selbst-Buffs der Unit (Battlelust, Snatched, Sunshine) in bp, additiv untereinander, ohne Cap. */
  selfBp: number;
  /** Verwundbar (Cursed/Hexed/Dismembered) in bp (wird auf Cap begrenzt). */
  vulnBp: number;
  /** Summe der Schwächen des Gegners gegen die Elemente des Angriffs in bp (additiv). */
  weakBp: number;
  /** Gesamt-Resistenz R (Rüstung + Typ + Elemente). */
  armor: number;
  pen: number;
  crit: boolean;
  critMultBp: number;
  trueDamage: boolean;
}

export interface HitResult {
  damageCenti: number;
  /** Wert vor Schwäche/Rüstung/Crit: Grundlage für DoT-Anteile. */
  dotBaseCenti: number;
}

export function computeHit(i: HitInput, eco: Pick<EconomyData, 'buffCaps' | 'damage'>): HitResult {
  let v = i.baseCenti;
  v = mulBp(v, i.lvlBp);
  v = mulBp(v, BP + i.traitBp);
  v = mulBp(v, BP + Math.min(i.buffBp, eco.buffCaps.damageBp));
  v = mulBp(v, BP + i.selfBp);
  v = mulBp(v, BP + Math.min(i.vulnBp, eco.buffCaps.vulnerableBp));
  // DESIGN-OFFEN: DoT-Basis = Treffer nach Lvl/Trait/Buff/Verwundbar, vor Schwäche, Rüstung und Crit.
  const dotBaseCenti = v;
  v = mulBp(v, BP + i.weakBp);
  if (!i.trueDamage) {
    const r = Math.max(0, i.armor - i.pen);
    v = Math.floor((v * eco.damage.armorBase) / (eco.damage.armorBase + r));
  }
  if (i.crit) v = mulBp(v, i.critMultBp);
  if (v < eco.damage.minDamageCenti) v = eco.damage.minDamageCenti;
  return { damageCenti: v, dotBaseCenti };
}
