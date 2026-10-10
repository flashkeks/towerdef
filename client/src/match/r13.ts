/**
 * Runde 13 (Client): reine Anzeige-Logik fuer Lantern Market und Longshot, ohne DOM und ohne Pixi (in Node testbar).
 * Entscheidungen faellt die Sim; hier steht nur, wie ihr Zustand gezeigt wird (Reichweitenring oder Aura, Projektil-Look,
 * Texte fuer Panel und Faehigkeiten, Flugzeit der Muenzen).
 */
import type { MarketInfo, ProjectileKind as SimProjectile, Tiers, TowerAura, TowerType } from '../sim';
import type { ProjectileKind } from '../pixel/sprites';
import type { HeroType } from '../sim';

/** Ab dieser Reichweite (Milli-px) gilt ein Turm als "ganze Karte" (Sim: `GLOBAL_RANGE`). */
export const GLOBAL_RANGE = 1_000_000;

export type RangeView =
  | { kind: 'ring'; r: number }
  | { kind: 'aura'; r: number }
  | { kind: 'none' };

/**
 * Was beim Platzieren/Auswaehlen als Reichweite gezeichnet wird: normale Tuerme einen Ring, der Market den Aura-Radius
 * (er schiesst nicht), der Longshot nichts (ganze Karte, ein Kreis waere sinnlos).
 */
export function rangeView(type: TowerType | HeroType, rangePx: number): RangeView {
  if (type === 'market' || type === 'bellringer') return { kind: 'aura', r: rangePx };
  if (rangePx * 1000 >= GLOBAL_RANGE) return { kind: 'none' };
  return { kind: 'ring', r: rangePx };
}

/** Aura-Radius des Markets in px; Wide Aura (Wissensbaum) macht ihn groesser. */
export function marketRadiusPx(baseMilli: number, marketRadiusBp = 0): number {
  return Math.floor((baseMilli * (10000 + marketRadiusBp)) / 10000) / 1000;
}

const PLACEHOLDER_SHOT: Partial<Record<SimProjectile, ProjectileKind>> = { hammer: 'bolt', starlight: 'starBolt' };

/** Welches Bild der Longshot-Bolzen bekommt: Basis, schwerer Eisenbolzen (A1+, magic) oder Lanternbreaker (A5); Splitter. */
export function projectileLook(kindIn: SimProjectile, owner: { type: string; tiers: readonly number[] } | undefined, sub = 0): ProjectileKind {
  // Runde 16: Hammer und Sternenlicht zeichnen vorerst wie vorhandene Geschosse (Bolzen, Sternbolzen); Harpune, Kanonenkugel, Nagel sind echt (TP)
  const kind = (PLACEHOLDER_SHOT[kindIn] ?? kindIn) as ProjectileKind;
  if (owner?.type === 'thornweaver') return kind === 'thorn' && (owner.tiers[2] ?? 0) >= 5 ? 'thornMagic' : kind;
  if (owner?.type === 'alchemist') return kind === 'potion' && (owner.tiers[2] ?? 0) >= 3 ? 'potionGold' : kind;
  if (owner?.type !== 'longshot') return kind;
  if (kind === 'frag' || sub === 1) return 'splinter';
  if (kind !== 'snipe') return kind;
  const a = owner.tiers[0] ?? 0;
  return a >= 5 ? 'snipeGold' : a >= 1 ? 'snipeHeavy' : 'snipe';
}

/** Hat ein Turm gerade irgendeine Aura-Wirkung von einem Market? */
export function hasAura(a: TowerAura): boolean {
  return a.rangeBp > 0 || a.camo || a.speedBp > 0 || a.armor || a.pierce > 0 || a.dmg > 0 || a.discountBp > 0;
}

const pct = (bp: number): string => `${Math.round(bp / 100)}%`;
/** Zeilen fuers Turm-Panel: was die Market-Aura gerade bewirkt (Englisch, kurz). */
export function auraLines(a: TowerAura): string[] {
  const out: string[] = [];
  if (a.rangeBp > 0) out.push(`+${pct(a.rangeBp)} range`);
  if (a.camo) out.push('Sees camo');
  if (a.speedBp > 0) out.push(`+${pct(a.speedBp)} attack speed`);
  if (a.armor) out.push('Cracks armor');
  if (a.pierce > 0) out.push(`+${a.pierce} pierce`);
  if (a.dmg > 0) out.push(`+${a.dmg} damage`);
  if (a.discountBp > 0) out.push(`Upgrades ${pct(a.discountBp)} cheaper`);
  return out;
}

export interface MarketLines {
  income: string;
  /** nur mit Bank */
  bank?: { balance: string; rate: string; cap: string; next: string; fill: number };
  grant?: string;
}

/** Texte fuers Market-Panel aus `Game.marketInfo`. `fill` = Fuellstand des Kontos 0..1. */
export function marketLines(m: MarketInfo): MarketLines {
  const out: MarketLines = { income: `+${m.income} per round` };
  if (m.hasBank) {
    out.bank = {
      balance: String(m.bank),
      rate: `${pct(m.bankRateBp)} interest`,
      cap: String(m.bankCap),
      next: `+${m.nextInterest}`,
      fill: m.bankCap > 0 ? Math.max(0, Math.min(1, m.bank / m.bankCap)) : 0,
    };
  }
  if (m.grantCash > 0) out.grant = `Grant: +${m.grantCash} gold`;
  return out;
}

/** Kann der Withdraw-Knopf etwas tun? */
export const canWithdraw = (m: MarketInfo | null): boolean => !!m && m.hasBank && m.bank > 0;

/** Muenzflug: wie viele Muenzen fliegen zur Geldanzeige (1 je ~50 Gold, 3..14) und wie viel Verzoegerung hat die k-te. */
export function coinCount(amount: number): number {
  return Math.max(3, Math.min(14, Math.ceil(amount / 50)));
}
export const coinDelay = (k: number): number => k * 2;

/** Position der Muenze k von n auf dem Weg von `a` nach `b` bei Fortschritt t 0..1 (Bogen nach oben, weicher Anlauf). */
export function coinPath(a: { x: number; y: number }, b: { x: number; y: number }, t: number, k: number, n: number): { x: number; y: number } {
  const e = t * t * (3 - 2 * t);
  const side = (k / Math.max(1, n - 1) - 0.5) * 18;
  const arc = Math.sin(e * Math.PI) * (16 + Math.abs(side) * 0.6);
  return { x: a.x + (b.x - a.x) * e + side * (1 - e), y: a.y + (b.y - a.y) * e - arc };
}

/** Restticks der Boss-Markierung -> Zeigen? (nur solange `markTicks` > 0) */
export const isMarked = (e: { markTicks: number }): boolean => e.markTicks > 0;

/** Anzeige-Hilfe fuer Faehigkeiten: Name, Text, Kurzinfo; Gold (Grant, Supply Drop) kommt erst mit dem Ereignis. */
export const GOLD_ABILITIES = new Set(['grant', 'supplyDrop']);

/** Restliche Abklingzeit als Text: "12s" (Ticks 60/s). */
export function cooldownText(cdLeft: number): string {
  if (cdLeft <= 0) return '';
  return `${Math.ceil(cdLeft / 60)}s`;
}

/** Stufen-Kuerzel wie "4 - 2 - 0" */
export const tiersLabel = (t: Tiers): string => t.join(' - ');
