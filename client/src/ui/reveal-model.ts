/**
 * Beschwoeren und Pakete oeffnen, ohne DOM (Runde 10, P3). Drei Dinge:
 *
 * 1. `Prize`: ein Gewinn (Unit, Waehrung oder Material). Jede Quelle von Mehrfach-Ergebnissen (10er-Zug, Starter-Paket, Raid-Belohnung,
 *    Meilensteine, Shop) macht daraus dieselbe Liste und oeffnet sie mit demselben Bildschirm (`reveal.ts`).
 * 2. `PackState`: welche Karten schon aufgedeckt sind. Der Fehler aus Runde 9 ("man sieht nur den ersten Gewinn"): ein Klick irgendwo
 *    sprang ueber ALLE Karten bis zur Uebersicht. Hier gilt: ein Aufdecken deckt genau eine Karte auf, "alle aufdecken" den Rest, und die
 *    Uebersicht ist erst erlaubt, wenn nichts mehr verdeckt ist. Tests: `test/r10-p3-reveal.test.ts`.
 * 3. `chargePlan`: der Aufbau (Portal) mit den Farbstufen Blau -> Lila -> Gold -> Regenbogen bis zur besten Seltenheit des Zugs.
 *
 * Reihenfolge: aufsteigend nach Seltenheit, die hoechste zuletzt (Waehrungen und Material vorn, neue Units hinter Kopien gleicher Seltenheit).
 */
import { RARITIES, rarityId, type RarityId } from './kit';

export const rarityIndex = (r: string): number => RARITIES.indexOf(rarityId(r));

/** Farbton (hsl) der Lichtsaeule und der Funken je Seltenheit; `secret` laeuft durch alle Farben. */
export const REVEAL_HUE: Record<RarityId, number | 'rainbow'> = { rare: 210, epic: 275, legendary: 42, mythic: 345, secret: 'rainbow', exclusive: 160 };

// ---- Gewinne ---------------------------------------------------------------------------------------------------------

export type CurrencyKind = 'crystals' | 'gold' | 'xp' | 'marks';

export type Prize =
  | { kind: 'unit'; unitId: string; rarity: string; isNew: boolean; /** Glitzer-Variante; die Daten kennen sie noch nicht, die Anzeige kann sie schon */ shiny?: boolean }
  | { kind: 'currency'; currency: CurrencyKind; amount: number; /** Text der Quelle ("Milestone: 5 clears"), optional */ note?: string }
  | { kind: 'material'; id: string; name: string; amount: number };

/** Sortierwert: Waehrung/Material -1 (vorn), Units nach Seltenheit; Neues kommt hinter Kopien derselben Seltenheit. */
export function prizeRank(p: Prize): number {
  if (p.kind !== 'unit') return -1;
  return rarityIndex(p.rarity) * 2 + (p.isNew ? 1 : 0);
}

/** Seltenheit, die Farbe und Ton eines Gewinns bestimmt (Waehrung/Material zaehlen als `rare`, Kristalle ab 500 als `epic`). */
export function prizeRarity(p: Prize): RarityId {
  if (p.kind === 'unit') return rarityId(p.rarity);
  if (p.kind === 'currency' && p.currency === 'crystals' && p.amount >= 500) return 'epic';
  return 'rare';
}

/** Aufsteigend sortiert, hoechste Seltenheit zuletzt; bei Gleichstand bleibt die Ziehungsreihenfolge. Aendert die Eingabe nicht. */
export function orderPrizes(prizes: readonly Prize[]): Prize[] {
  return prizes.map((p, i) => ({ p, i })).sort((a, b) => prizeRank(a.p) - prizeRank(b.p) || a.i - b.i).map((x) => x.p);
}

export function bestRarity(prizes: readonly Prize[]): RarityId {
  return prizes.reduce<RarityId>((b, p) => (rarityIndex(prizeRarity(p)) > rarityIndex(b) ? prizeRarity(p) : b), 'rare');
}

/** Gross inszenieren (Rampenlicht beim Aufdecken): Units ab Legendary. */
export const isSpotlight = (p: Prize): boolean => p.kind === 'unit' && rarityIndex(p.rarity) >= rarityIndex('legendary');

/** Zuege aus der Meta-Schicht in Gewinne (Reihenfolge der Ziehung, sortiert wird in `PackState`). */
export function prizesFromPulls(pulls: readonly { unitId: string; rarity: string; isNew: boolean; shiny?: boolean }[]): Prize[] {
  return pulls.map((p): Prize => ({ kind: 'unit', unitId: p.unitId, rarity: p.rarity, isNew: p.isNew, ...(p.shiny ? { shiny: true } : {}) }));
}

// ---- Zustand des Paket-Oeffnens ------------------------------------------------------------------------------------

export interface PackSummary {
  total: number;
  /** Anzahl neuer Units */
  newUnits: number;
  /** Anzahl Units je Seltenheit (nur vorhandene) */
  byRarity: Partial<Record<RarityId, number>>;
  best: RarityId;
}

export class PackState {
  readonly items: Prize[];
  private readonly open: boolean[];

  constructor(prizes: readonly Prize[]) {
    this.items = orderPrizes(prizes);
    this.open = this.items.map(() => false);
  }

  get count(): number {
    return this.items.length;
  }
  get revealedCount(): number {
    return this.open.filter(Boolean).length;
  }
  get remaining(): number {
    return this.items.length - this.revealedCount;
  }
  get allRevealed(): boolean {
    return this.remaining === 0;
  }
  isRevealed(i: number): boolean {
    return this.open[i] === true;
  }

  /** Genau eine Karte aufdecken. `false`, wenn es sie nicht gibt oder sie schon offen ist (dann aendert sich nichts). */
  reveal(i: number): boolean {
    if (i < 0 || i >= this.items.length || this.open[i]) return false;
    this.open[i] = true;
    return true;
  }

  /** Naechste verdeckte Karte in Reihenfolge aufdecken (Leertaste); `null`, wenn alles offen ist. */
  revealNext(): number | null {
    const i = this.open.indexOf(false);
    if (i < 0) return null;
    this.open[i] = true;
    return i;
  }

  /** Alle verdeckten Karten, in Reihenfolge; liefert die Indizes, die neu aufgedeckt wurden. */
  revealAll(): number[] {
    const out: number[] = [];
    this.open.forEach((o, i) => {
      if (!o) {
        this.open[i] = true;
        out.push(i);
      }
    });
    return out;
  }

  /** Uebersicht erst, wenn nichts mehr verdeckt ist. */
  get canSummarize(): boolean {
    return this.allRevealed;
  }

  summary(): PackSummary {
    const byRarity: PackSummary['byRarity'] = {};
    let newUnits = 0;
    for (const p of this.items) {
      if (p.kind !== 'unit') continue;
      const r = rarityId(p.rarity);
      byRarity[r] = (byRarity[r] ?? 0) + 1;
      if (p.isNew) newUnits++;
    }
    return { total: this.items.length, newUnits, byRarity, best: bestRarity(this.items) };
  }
}

// ---- Aufbau (Portal) ---------------------------------------------------------------------------------------------------

export interface ChargeStage {
  /** Seltenheit, deren Farbe das Portal in dieser Stufe zeigt */
  rarity: RarityId;
  hue: number | 'rainbow';
  /** Beginn der Stufe in ms ab Start */
  atMs: number;
}

export interface ChargePlan {
  best: RarityId;
  stages: ChargeStage[];
  /** Dauer bis zum Durchbruch (Burst) */
  introMs: number;
  /** Ab wann das Bild ruckelt (ms) */
  shakeFromMs: number;
}

/** Farbstufen vorab: Blau (Rare) -> Lila (Epic) -> Gold (Legendary) -> Regenbogen (Secret); Mythic geht ueber Gold in Rot-Magenta, Exclusive bleibt Smaragd. */
const STAGES: Record<RarityId, RarityId[]> = {
  rare: ['rare'],
  epic: ['rare', 'epic'],
  legendary: ['rare', 'epic', 'legendary'],
  mythic: ['rare', 'epic', 'legendary', 'mythic'],
  secret: ['rare', 'epic', 'legendary', 'secret'],
  exclusive: ['rare', 'epic', 'exclusive'],
};
const INTRO_MS: Record<RarityId, number> = { rare: 1300, epic: 1700, legendary: 2200, mythic: 2700, secret: 3200, exclusive: 2500 };

export function chargePlan(best: string): ChargePlan {
  const b = rarityId(best);
  const list = STAGES[b];
  const introMs = INTRO_MS[b];
  const slot = introMs / (list.length + 0.5);
  return {
    best: b,
    introMs,
    stages: list.map((rarity, i) => ({ rarity, hue: REVEAL_HUE[rarity], atMs: Math.round(i * slot) })),
    shakeFromMs: Math.round(introMs * 0.55),
  };
}
