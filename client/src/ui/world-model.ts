/**
 * Sichtmodell der Weltkarte (Runde 8 / P3): reine Funktionen ohne DOM. Aus den Daten des Backends (`worldView`, `stageView`) werden Texte
 * und Zustaende fuer die Karten; `world-map.ts` setzt sie nur noch in DOM um (P4 darf die Gestaltung ersetzen und diese Datei behalten).
 */
import { hasKey, t } from '../i18n/t';
import type { ActView, LockReason, ModeActView, ModeCardView, WorldCardView } from '../backend/meta';

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

// ---- Legend Stages und Raids (Runde 9 / P3) ---------------------------------------------------------------------------

export type MapMode = 'worlds' | 'legend' | 'raids';

/** Titel der Act-Karte eines Modus: Legend immer "Act n - Boss", Raid mit einem Act nur der Boss. */
export function modeActCardModel(a: ModeActView, card: ModeCardView): ActCardModel & { rewardText: string } {
  const single = card.acts.length === 1;
  const rewardText = a.drop
    ? t('world.drop.amount', { n: a.drop.first, name: a.drop.materialName })
    : t('world.reward.marks', { n: a.marks });
  return {
    stageId: a.stageId,
    state: !a.unlocked ? 'locked' : a.cleared ? 'cleared' : 'open',
    title: single ? t('world.raid.single', { name: a.name }) : t('world.mode.act', { n: a.act, name: a.name }),
    bossText: single ? null : t('world.boss', { name: a.bossName }),
    wavesText: t('world.waves', { n: a.waves }),
    bestText: a.bestWave > 0 ? t('world.best', { wave: a.bestWave }) : t('world.best.none'),
    lockText: a.lock ? lockText(a.lock) : null,
    infinite: false,
    rewardText,
  };
}

export const modeTabModel = (m: ModeCardView): WorldTabModel => ({
  id: m.id,
  name: m.name,
  locked: !m.unlocked,
  lockText: m.lock ? lockText(m.lock) : null,
  progress: t('world.mode.progress', { n: m.actsCleared, max: m.acts.length }),
});

export interface AffinityChip {
  kind: 'resist' | 'weak';
  key: string;
  label: string;
  /** Resistenz: R; Schwaeche: Prozent */
  value: number;
}

/** Resistenzen und Schwaechen als Chips (Resistenz mit R-Wert, Schwaeche mit Prozent). */
export function affinityChips(a: { resist: Record<string, number>; weakBp: Record<string, number> }): AffinityChip[] {
  const name = (k: string): string => (hasKey(`affin.${k}`) ? t(`affin.${k}`) : k);
  return [
    ...Object.entries(a.resist).filter(([, v]) => v > 0).map(([k, v]): AffinityChip => ({ kind: 'resist', key: k, label: name(k), value: v })),
    ...Object.entries(a.weakBp).filter(([, v]) => v > 0).map(([k, v]): AffinityChip => ({ kind: 'weak', key: k, label: name(k), value: Math.round(v / 100) })),
  ];
}
