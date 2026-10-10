/**
 * Runde 15: Spielmodi. Reine Daten und Hilfen; die Regeln selbst laufen in `game.ts`.
 * Spielersichtbare Texte sind Englisch.
 */
import type { HeroType, ModeId, TowerType } from './types.js';

export const MODE_IDS: readonly ModeId[] = ['standard', 'primary-only', 'specialists-only', 'no-hero', 'half-cash', 'deflation'];

export interface ModeInfo {
  id: ModeId;
  name: string;
  desc: string;
  /** Erlaubte Tuerme; fehlt = alle. */
  towers?: readonly TowerType[];
  /** false = Held gesperrt. */
  hero: boolean;
  /** Powers erlaubt. */
  powers: boolean;
}

const PRIMARY: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
const SPECIALISTS: readonly TowerType[] = ['longshot', 'market', 'thornweaver', 'alchemist'];

export const MODES: Record<ModeId, ModeInfo> = {
  standard: { id: 'standard', name: 'Standard', desc: 'The normal game.', hero: true, powers: true },
  'primary-only': { id: 'primary-only', name: 'Primary Only', desc: 'Only Ranger, Bombardier and Frostcaller (and your hero).', towers: PRIMARY, hero: true, powers: true },
  'specialists-only': { id: 'specialists-only', name: 'Specialists Only', desc: 'Only Longshot, Lantern Market, Thornweaver and Alchemist (and your hero).', towers: SPECIALISTS, hero: true, powers: true },
  'no-hero': { id: 'no-hero', name: 'No Hero', desc: 'Your hero stays home.', hero: false, powers: true },
  'half-cash': { id: 'half-cash', name: 'Half Cash', desc: 'Starting gold and all income are halved.', hero: true, powers: true },
  deflation: { id: 'deflation', name: 'Deflation', desc: 'Start late with 20,000 gold. No income at all. No powers.', hero: true, powers: false },
};

/** Deflation: Gold zum Start (ersetzt das Startgeld der Schwierigkeit, Wissensbaum-Zuschlag zaehlt nicht). */
export const DEFLATION_CASH = 20_000;
/** Deflation: die erste Runde ist `maxRound - DEFLATION_BACK` (Meadow 10, Frostfen 15, Quarry 20), gespielt wird bis zur letzten. */
export const DEFLATION_BACK = 10;

export const isModeId = (v: unknown): v is ModeId => typeof v === 'string' && (MODE_IDS as readonly string[]).includes(v);

/** Darf `type` in diesem Modus gebaut werden? */
export function modeAllows(mode: ModeId, type: TowerType | HeroType): boolean {
  const m = MODES[mode];
  if (type === 'wren') return m.hero;
  return !m.towers || m.towers.includes(type);
}

/** Erste Runde des Matches (Standard 1). */
export const firstRound = (mode: ModeId, maxRound: number): number => (mode === 'deflation' ? maxRound - DEFLATION_BACK : 1);
