/**
 * Runde 14 (Client): reine Anzeige-Logik fuer Thornweaver und Alchemist, ohne DOM und ohne Pixi (in Node testbar).
 * Entscheidungen faellt die Sim; hier steht nur, wie ihr Zustand gezeigt wird (Buff-Glanz, Abnutzung der Baumwand,
 * Zonen-Art, Monster-Groesse, Texte fuers Panel).
 */
import type { TowerBuff, TowerState } from '../sim';

export type GlowKind = 'brew' | 'stimulant' | 'permanent';

/** Welcher Glanz liegt auf dem Turm? Permanent Brew vor Stimulant (Tempo >= 25 % oder +2 Schaden) vor normalem Trank; kein Buff = null. */
export function glowKind(b: TowerBuff | null | undefined): GlowKind | null {
  if (!b) return null;
  if (b.permanent) return 'permanent';
  if (b.ticks <= 0 && b.dmg <= 0 && b.rangeBp <= 0 && b.speedBp <= 0) return null;
  return b.dmg >= 2 || b.speedBp >= 2500 ? 'stimulant' : 'brew';
}

/** Abnutzung der Baumwand 0..3 aus den freien RBE (Start 150): 0 = voll, 3 = fast verbraucht. */
export function wallWear(left: number, cap = 150): number {
  const f = Math.max(0, Math.min(1, left / cap));
  return f > 0.75 ? 0 : f > 0.5 ? 1 : f > 0.25 ? 2 : 3;
}

/** Ranken-Zone des Turms: Radius in px und ob es der Weltenbaum ist (B5). Keine Zone = null. */
export function zoneView(t: Pick<TowerState, 'zone' | 'tiers'>): { r: number; world: boolean } | null {
  if (!t.zone || t.zone <= 0) return null;
  return { r: Math.round(t.zone / 1000), world: t.tiers[1] >= 5 };
}

/** Monster-Form: der ausloesende Alchemist in voller Groesse, die per Total Transformation verwandelten Tuerme klein. */
export function monsterScale(type: string): number {
  return type === 'alchemist' ? 1 : 0.6;
}

const pct = (bp: number): string => `${Math.round(bp / 100)}%`;
/** Zeilen fuers Turm-Panel: was gerade auf dem Turm wirkt (Trank, Spring Blessing). Englisch, kurz. */
export function buffLines(b: TowerBuff | null | undefined): string[] {
  if (!b) return [];
  const out: string[] = [];
  const t = b.permanent ? 'permanent' : b.ticks > 0 ? `${Math.ceil(b.ticks / 60)}s` : '';
  const tag = t ? ` (${t})` : '';
  if (b.dmg > 0) out.push(`+${b.dmg} damage${tag}`);
  if (b.rangeBp > 0) out.push(`+${pct(b.rangeBp)} range${tag}`);
  if (b.speedBp > 0) out.push(`+${pct(b.speedBp)} attack speed${tag}`);
  if (b.groveSpeedBp > 0) out.push(`+${pct(b.groveSpeedBp)} speed (Grove)`);
  return out;
}

/** Restsekunden der Monster-Form als Text ("MONSTER 12s"), leer wenn keine. */
export function monsterText(ticks: number): string {
  return ticks > 0 ? `MONSTER ${Math.ceil(ticks / 60)}s` : '';
}

/** Dauer der Ranken-Fessel: Ticks -> Zeigedauer des Overlays (nie laenger als die Sim sagt). */
export const vineShown = (ticks: number): boolean => ticks > 0;
