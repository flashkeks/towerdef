/**
 * Turm-XP (Runde 11b): Topf je Runde und seine Aufteilung auf die Turmtypen. Rein ganzzahlig, ohne Zustand.
 */
import { DATA } from './data.js';
import type { Difficulty, TowerType } from './types.js';

export const XP_TOWER_TYPES: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
type PerTower = Record<TowerType, number>;

/** Topf der Runde `r`: (potBase + potPerRound x r) x Schwierigkeit x (1 + towerXpBp), abgerundet. */
export function towerXpPot(r: number, difficulty: Difficulty, extraBp = 0): number {
  const X = DATA.xp;
  return Math.floor(((X.potBase + X.potPerRound * r) * DATA.difficulties[difficulty].towerXpBp * (10000 + extraBp)) / 100_000_000);
}

/**
 * Teilt `pot` auf: 50 % nach `spent` (investiertes Geld je Typ), 50 % nach `pops` (Schichten je Typ in der Runde).
 * Fehlt eine Hälfte (nichts investiert / nichts geknackt), geht der ganze Topf nach der anderen; fehlen beide, gibt es nichts.
 * Rest nach der Rundung an den Typ mit dem größten Anteil (Gleichstand: Reihenfolge ranger, bombardier, frostcaller).
 * Die Summe der Anteile ist immer genau `pot`.
 */
export function splitTowerXp(pot: number, spent: PerTower, pops: PerTower): PerTower {
  const out: PerTower = { ranger: 0, bombardier: 0, frostcaller: 0 };
  const spentTot = spent.ranger + spent.bombardier + spent.frostcaller;
  const popsTot = pops.ranger + pops.bombardier + pops.frostcaller;
  if (pot <= 0 || (spentTot === 0 && popsTot === 0)) return out;
  const num: PerTower = { ranger: 0, bombardier: 0, frostcaller: 0 };
  let den: number;
  if (spentTot > 0 && popsTot > 0) {
    den = 2 * spentTot * popsTot;
    for (const t of XP_TOWER_TYPES) num[t] = spent[t] * popsTot + pops[t] * spentTot;
  } else {
    den = spentTot > 0 ? spentTot : popsTot;
    for (const t of XP_TOWER_TYPES) num[t] = spentTot > 0 ? spent[t] : pops[t];
  }
  let given = 0;
  let best: TowerType = 'ranger';
  for (const t of XP_TOWER_TYPES) {
    out[t] = Math.floor((pot * num[t]) / den);
    given += out[t];
    if (num[t] > num[best]) best = t;
  }
  out[best] += pot - given;
  return out;
}
