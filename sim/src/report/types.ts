/**
 * Datentypen der Report-Schicht. `RunRecord` ist das Ergebnis eines Matches (Zeitreihen je Wave),
 * `CellStats` die Aggregation über viele Runs einer Zelle (Stage x Bot x Schwierigkeit x Spielerzahl).
 * Geld ist immer Summe über das ganze Team (alle Spieler), Einheiten sind Münzen bzw. HP (nicht Centi-HP).
 */
import type { DifficultyId } from '../data/schema.js';

export interface MatchSpec {
  stage: string;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  /** Bot-Namen; Spieler i nutzt bots[i % bots.length]. */
  bots: string[];
  /** Nur Infinite: Abbruch nach dieser Wave. */
  maxWaves?: number;
  /** Sicherheitslimit (Ticks); Standard des Runners. */
  maxTicks?: number;
}

/** Zeitreihenzeile einer Wave n (n = 0: Prep-Phase, nur Ausgaben). */
export interface WaveRec {
  n: number;
  /** Münzen (Team) zu Wave-Beginn nach den Bot-Entscheidungen / am Wave-Ende bzw. Matchende. */
  coinsStart: number;
  coinsEnd: number;
  incomeKill: number;
  incomeWave: number;
  incomeFarm: number;
  spendPlace: number;
  spendUpgrade: number;
  sellRefund: number;
  farmInvest: number;
  farmYield: number;
  kills: number;
  /** Leaks der Gegner dieser Wave nach Typ (Anzahl) und Base-Schaden. */
  leaks: Record<string, number>;
  /** Base-Schaden der Leaks nach Typ. */
  leakDmg: Record<string, number>;
  leakCount: number;
  baseLoss: number;
  /** HP-Summe der Wave (inkl. Splitter-Kinder, mit Schwierigkeit/Koop) in HP. */
  poolHp: number;
  /** Netto eingesetzte Münzen (kumulativ Platzierung + Upgrade - Verkaufserlös) bis einschließlich Wave n. */
  invested: number;
}

export interface RunRecord {
  stage: string;
  botLabel: string;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  /** null = abgebrochen (maxWaves/maxTicks). */
  result: 'win' | 'loss' | null;
  /** Letzte gestartete Wave. */
  endWave: number;
  /** Wave des tödlichen Leaks (nur bei loss). */
  lossWave: number | null;
  ticks: number;
  baseHpEnd: number;
  waves: WaveRec[];
}

export interface Dist {
  p10: number;
  med: number;
  p90: number;
}

export interface WaveStats {
  n: number;
  /** Runs, die Wave n erreicht haben. */
  reached: number;
  reachedFrac: number;
  /** Runs, die in Wave n verlieren (tödlicher Leak stammt aus Wave n), Anteil an allen Runs / an den erreichenden. */
  lostHere: number;
  lossRate: number;
  hazard: number;
  /** Anteil der erreichenden Runs mit mindestens einem Leak aus Wave n. */
  leakRate: number;
  coins: Dist;
  income: Dist;
  incKill: number;
  incWave: number;
  incFarm: number;
  /** Anteil Farm am Einkommen dieser Wave (Summe über Runs). */
  farmShare: number;
  /** Median Pool-HP je netto eingesetzter Münze. */
  poolPerCoin: number;
  baseLossMean: number;
  /** Mittlere Leaks je erreichendem Run nach Typ. */
  leaksByType: Record<string, number>;
}

export interface CellStats {
  key: string;
  stage: string;
  bot: string;
  difficulty: DifficultyId;
  players: number;
  runs: number;
  wins: number;
  losses: number;
  capped: number;
  winRate: number;
  endWave: Dist;
  minutes: Dist;
  /** Farm-Einkommen / Gesamteinkommen (Summe über alle Runs und Waves). */
  farmShareIncome: number;
  /** Upgrade-Münzen / (Platzierung + Upgrade). */
  upgradeShare: number;
  /** Median-Payback der Farm in Waves (Investition / mittlerer Ertrag je Wave); n = Runs mit Farm. */
  farmPayback: { med: number; n: number };
  leakSources: { type: string; count: number; share: number; damage: number }[];
  waves: WaveStats[];
}
