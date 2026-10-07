/**
 * Sichtmodell der Weltkarte (Runde 8 / P3): reine Funktionen ohne DOM. Aus den Daten des Backends (`worldView`, `stageView`) werden Texte
 * und Zustaende fuer die Karten; `world-map.ts` setzt sie nur noch in DOM um (P4 darf die Gestaltung ersetzen und diese Datei behalten).
 */
import { t } from '../i18n/t';
import type { ActView, ComingSoonView, LockReason, WorldCardView } from '../backend/meta';

export function lockText(l: LockReason): string {
  if (l.kind === 'world') return t('world.lock.world', { world: l.worldName, act: l.afterAct });
  if (l.kind === 'infinite') return t('world.lock.infinite', { act: l.act });
  return t('world.lock.act', { act: l.act });
}

export type ActState = 'locked' | 'open' | 'cleared';

export interface ActCardModel {
  stageId: string;
  state: ActState;
  title: string;
  bossText: string | null;
  wavesText: string;
  bestText: string;
  lockText: string | null;
  infinite: boolean;
}

export function actCardModel(a: ActView): ActCardModel {
  const infinite = a.kind === 'infinite';
  return {
    stageId: a.stageId,
    state: !a.unlocked ? 'locked' : a.cleared ? 'cleared' : 'open',
    title: infinite ? t('world.infinite') : t('world.act', { n: a.act, name: a.name }),
    bossText: infinite ? null : a.bossName ? t('world.boss', { name: a.bossName }) : null,
    wavesText: infinite ? t('world.infinite.waves') : t('world.waves', { n: a.waves }),
    bestText: a.bestWave > 0 ? t('world.best', { wave: a.bestWave }) : t('world.best.none'),
    lockText: a.lock ? lockText(a.lock) : null,
    infinite,
  };
}

export interface WorldTabModel {
  id: string;
  name: string;
  locked: boolean;
  lockText: string | null;
  progress: string;
}

export const worldTabModel = (w: WorldCardView): WorldTabModel => ({
  id: w.id,
  name: w.name,
  locked: !w.unlocked,
  lockText: w.lock ? lockText(w.lock) : null,
  progress: t('world.progress', { n: w.actsCleared, max: w.acts.length }),
});

export const comingSoonText = (c: ComingSoonView): string =>
  c.waves !== null && c.acts === null ? t('world.soon.raid', { waves: c.waves }) : t('world.soon.legend', { acts: c.acts ?? 0 });
