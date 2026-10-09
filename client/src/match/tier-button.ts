/**
 * Zustand des grossen Stufen-Knopfs im Turm-Panel (Runde 11c) als reine Funktion, ohne DOM: je Pfad zeigt das Panel nur
 * die NAECHSTE Stufe. Reihenfolge der Faelle wie in der Sim (`upgradeBlock`): voll -> Crosspath -> nicht freigeschaltet -> Geld.
 *   maxed   alle 5 Stufen gekauft
 *   closed  Crosspath sperrt den Pfad (egal ob freigeschaltet)
 *   unlock  nicht freigeschaltet, Turm-XP reichen: Klick fragt "Freischalten?"
 *   needxp  nicht freigeschaltet, Turm-XP reichen nicht (grau, "Need N more XP")
 *   buy     freigeschaltet, Geld reicht: Klick kauft
 *   poor    freigeschaltet, Geld fehlt (Preis rot, nicht klickbar)
 * `hidden` = Name/Icon der Stufe noch verdeckt ("???"); die Sim deckt die naechste Stufe immer auf, sobald die davor
 * freigeschaltet ist, also praktisch nie. Die Funktion haelt den Fall trotzdem fest.
 */
import type { UpgradeInfo } from '../sim';

export type TierBtnKind = 'maxed' | 'closed' | 'unlock' | 'needxp' | 'buy' | 'poor';

export interface TierBtn {
  kind: TierBtnKind;
  /** Stufe, um die es geht (1..5); 0 bei `maxed`. */
  tier: number;
  hidden: boolean;
  /** Goldpreis (nur buy/poor) */
  price: number;
  /** Turm-XP-Kosten (nur unlock/needxp) */
  xpCost: number;
  /** Es fehlen so viele XP (nur needxp) */
  xpMissing: number;
  /** Klick tut etwas: kaufen (buy) oder Freischalt-Frage (unlock) */
  clickable: boolean;
}

export function tierButton(info: UpgradeInfo, towerXp: number): TierBtn {
  const base = { tier: info.next ?? 0, hidden: !info.revealed, price: 0, xpCost: 0, xpMissing: 0, clickable: false };
  if (info.next == null || info.reason === 'maxed') return { ...base, kind: 'maxed', tier: 0, hidden: false };
  if (info.reason === 'crosspath') return { ...base, kind: 'closed' };
  if (info.unlocked < info.next) {
    const can = towerXp >= info.unlockCost;
    return { ...base, kind: can ? 'unlock' : 'needxp', xpCost: info.unlockCost, xpMissing: can ? 0 : info.unlockCost - towerXp, clickable: can };
  }
  if (info.canBuy) return { ...base, kind: 'buy', price: info.price, clickable: true };
  return { ...base, kind: 'poor', price: info.price };
}
