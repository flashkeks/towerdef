/** Wohin die Meta-Bildschirme einander schicken; `screens.ts` setzt es um. Besitzer: P4. */
import type { DifficultyId } from '../sim';

export interface Nav {
  lobby(): void;
  summon(): void;
  /** optional: eine Unit gleich in der Detailansicht oeffnen */
  units(unitId?: string): void;
  team(): void;
  shop(): void;
  settings(): void;
  credits(): void;
  /** Weltkarte: Welten, Acts, Infinite (Runde 8 / P3) */
  world(): void;
  /** Stufen-Auswahl eines Acts (ohne Angabe: der naechste offene Act); Schwierigkeit waehlen und starten */
  stage(stageId?: string): void;
  /** Match starten (Team und Mods holt `main.ts` ueber `Backend.matchSetup`); ohne `stageId` die Standard-Stage */
  play(d: DifficultyId, stageId?: string): void;
}
