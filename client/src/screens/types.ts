import type { Difficulty, ModeId, PowerKey, TowerType } from '../../../sim/src/types';
import type { MatchReport, Profile, ChallengeBest } from '../meta';
import type { ChallengeRules } from '../../../sim/src/index';
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

/** Runde 16 E: Woher eine Challenge kommt (Tages-Challenge: `key` = UTC-Tag; sonst der Code). */
export interface ChallengeSource { kind: 'daily' | 'custom'; key: string; title: string; from: 'hub' | 'editor' }
export interface ChallengeResultInfo {
  rules: ChallengeRules;
  source: ChallengeSource;
  code: string;
  won: boolean;
  quit: boolean;
  roundsCleared: number;
  spent: number;
  livesLost: number;
  ticks: number;
  best: ChallengeBest;
  improved: boolean;
  embersGained: number;
  duplicate: boolean;
}

export type Route =
  | { name: 'home' }
  | { name: 'setup'; map: string }
  | { name: 'knowledge' }
  | { name: 'towers'; tower?: TowerType }
  | { name: 'store' }
  | { name: 'settings' }
  | { name: 'notice' }
  | { name: 'challenges'; code?: string }
  | { name: 'challenge-edit'; rules?: ChallengeRules }
  | { name: 'challenge-result'; info: ChallengeResultInfo }
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
  /** Runde 16 E: Challenge spielen (Tages-Challenge, Code oder Test aus dem Editor). */
  playChallenge(rules: ChallengeRules, source: ChallengeSource): void;
  difficulty: Difficulty;
  /** Gewaehlte Karte und Modus (bleiben fuer "Again" erhalten) */
  map: string;
  mode: ModeId;
}

export interface View {
  el: HTMLElement;
  dispose?(): void;
}
