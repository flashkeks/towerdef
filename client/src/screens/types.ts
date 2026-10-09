import type { Difficulty, TowerType } from '../../../sim/src/types';
import type { MatchReport, Profile } from '../meta';
import type { MetaStore } from '../meta/store';

export type SoundId = 'click' | 'buy' | 'unlock' | 'levelup' | 'error' | 'xp';

export interface ResultInfo {
  won: boolean;
  quit: boolean;
  round: number;
  difficulty: Difficulty;
  report: MatchReport;
  /** Turm-XP vor dem Match (Anzeige der Balken). */
  towerXpBefore: Record<TowerType, number>;
  towerXpAfter: Record<TowerType, number>;
  livesLost: number;
}

export type Route =
  | { name: 'home' }
  | { name: 'knowledge' }
  | { name: 'towers'; tower?: TowerType }
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
  setVolume(v: number): void;
  play(d: Difficulty): void;
  difficulty: Difficulty;
}

export interface View {
  el: HTMLElement;
  dispose?(): void;
}
