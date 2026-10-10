import type { Difficulty, ModeId, PowerKey, TowerType } from '../../../sim/src/types';
import type { MatchReport, Profile } from '../meta';
import type { MetaStore } from '../meta/store';
import type { VolumeApi } from '../audio/settings';

export type SoundId = 'click' | 'buy' | 'unlock' | 'levelup' | 'error' | 'xp' | 'storeBuy' | 'ember';
/** Menue-Stimmung (`MENU_THEMES`) je Bildschirm */
export type MenuTheme = 'dusk' | 'arcane' | 'march' | 'bazaar';

export interface ResultInfo {
  won: boolean;
  quit: boolean;
  round: number;
  difficulty: Difficulty;
  /** Runde 15: Karte und Modus des Matches (Anzeige und "Again") */
  map: string;
  mode: ModeId;
  report: MatchReport;
  /** Turm-XP vor dem Match (Anzeige der Balken). */
  towerXpBefore: Record<TowerType, number>;
  towerXpAfter: Record<TowerType, number>;
  livesLost: number;
  /** Embers vor und nach dem Match (Anzeige, Runde 12) */
  /** Erfolgreiche Power-Einsaetze dieses Matches (Anzeige "Powers used") */
  powersUsed?: Partial<Record<PowerKey, number>>;
  embersBefore: number;
  embersAfter: number;
}

export type Route =
  | { name: 'home' }
  | { name: 'setup'; map: string }
  | { name: 'knowledge' }
  | { name: 'towers'; tower?: TowerType }
  | { name: 'store' }
  | { name: 'settings' }
  | { name: 'notice' }
  | { name: 'result'; info: ResultInfo };

export interface Ctx {
  root: HTMLElement;
  store: MetaStore;
  go(r: Route): void;
  /** Profil ersetzen und speichern. */
  update(p: Profile): Promise<void>;
  sound(id: SoundId): void;
  /** Lautstaerke (Musik und Effekte getrennt), Runde 12 */
  audio: VolumeApi;
  /** Startet ein Match auf `ctx.map` im Modus `ctx.mode` (Runde 15). */
  play(d: Difficulty): void;
  difficulty: Difficulty;
  /** Gewaehlte Karte und Modus (bleiben fuer "Again" erhalten) */
  map: string;
  mode: ModeId;
}

export interface View {
  el: HTMLElement;
  dispose?(): void;
}
