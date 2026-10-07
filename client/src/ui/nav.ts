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
  /** Stage-Auswahl (Terrassenweg mit Stufen) */
  stage(): void;
  /** Match starten (Team und Mods holt `main.ts` ueber `Backend.matchSetup`) */
  play(d: DifficultyId): void;
}
