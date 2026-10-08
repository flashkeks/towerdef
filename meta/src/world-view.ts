/**
 * Sichtmodell der Weltkarte (Runde 8 / P3): reine Funktion `Profil -> JSON`, kein DOM, keine Texte ausser Namen aus den Daten.
 * Die UI holt es ueber `Backend.worldView()` und uebersetzt Sperrgruende (`LockReason`) in `en.ts`. Besitzer: P3.
 *
 * Aufbau: Welten (je 6 Acts + Infinite), dazu Legend Stages und Raids als Daten-Geruest (noch nicht spielbar).
 */
import { LegendStagesSchema, RaidsSchema } from '../../sim/src/index';
import type { Profile } from './profile';
import { stageInfo, stageLock, WORLD_PALETTES, WORLDS, worldLock, type LockReason, type WorldPalette } from './worlds';
import legendJson from '../../sim/data/modes/legend-stages.json';
import raidsJson from '../../sim/data/modes/raids.json';

export interface ActView {
  stageId: string;
  /** 1..n; Infinite: 0 */
  act: number;
  kind: 'act' | 'infinite';
  name: string;
  bossName: string | null;
  waves: number;
  unlocked: boolean;
  lock: LockReason | null;
  /** in irgendeiner Schwierigkeit geschafft */
  cleared: boolean;
  /** geschaffte Schwierigkeiten (normal/hard/nightmare) */
  clearedDifficulties: string[];
  /** beste Welle ueber alle Schwierigkeiten */
  bestWave: number;
}

export interface WorldCardView {
  id: string;
  name: string;
  legacyName: string | null;
  blurb: string;
  order: number;
  unlocked: boolean;
  lock: LockReason | null;
  palette: WorldPalette;
  acts: ActView[];
  actsCleared: number;
  infinite: ActView;
}

export interface ComingSoonView {
  id: string;
  name: string;
  /** Legend Stage: Acts; Raid: Acts (falls bekannt) */
  acts: number | null;
  /** Raid: Wellen */
  waves: number | null;
  bosses: string[];
  /** Herkunftswelt (Legend Stages), AA-ID */
  world: string | null;
  playable: boolean;
}

export interface WorldView {
  playerLevel: number;
  worlds: WorldCardView[];
  /** erste offene, noch nicht geschaffte Act-Stage (Vorschlag "weiter"), sonst `null` */
  nextStageId: string | null;
  legend: ComingSoonView[];
  raids: ComingSoonView[];
}

function actView(p: Profile, stageId: string): ActView {
  const info = stageInfo(stageId)!;
  const prog = p.stages[stageId] ?? {};
  const lock = stageLock(p, stageId);
  const cleared = Object.entries(prog).filter(([, d]) => !!d.firstClearAt).map(([k]) => k);
  return {
    stageId,
    act: info.act,
    kind: info.kind,
    name: info.name,
    bossName: info.bossName,
    waves: info.waves,
    unlocked: lock === null,
    lock,
    cleared: cleared.length > 0,
    clearedDifficulties: cleared,
    bestWave: Math.max(0, ...Object.values(prog).map((d) => d.bestWave)),
  };
}

const legend = LegendStagesSchema.parse(legendJson);
const raids = RaidsSchema.parse(raidsJson);

export function worldView(p: Profile): WorldView {
  const worlds = WORLDS.map((w): WorldCardView => {
    const lock = worldLock(p, w.id);
    const acts = w.acts.map((a) => actView(p, a.stageId));
    return {
      id: w.id,
      name: w.name,
      legacyName: w.legacyName,
      blurb: w.blurb,
      order: w.order,
      unlocked: lock === null,
      lock,
      palette: WORLD_PALETTES[w.id],
      acts,
      actsCleared: acts.filter((a) => a.cleared).length,
      infinite: actView(p, w.infinite.stageId),
    };
  });
  let next: string | null = null;
  for (const w of worlds) {
    const a = w.acts.find((x) => x.unlocked && !x.cleared);
    if (w.unlocked && a) {
      next = a.stageId;
      break;
    }
  }
  return {
    playerLevel: p.playerLevel,
    worlds,
    nextStageId: next,
    legend: legend.stages.map((s) => ({ id: s.id, name: s.name, acts: s.acts, waves: null, bosses: s.bosses, world: s.world, playable: s.playable })),
    raids: raids.raids.map((r) => ({ id: r.id, name: r.name, acts: r.acts ?? null, waves: r.waves, bosses: [], world: null, playable: r.playable })),
  };
}

/** Beschreibung einer einzelnen Stage fuer die Stufen-Auswahl (`stageView`); `null` fuer Stages ausserhalb der Weltstruktur. */
export interface StageInfoView {
  worldId: string;
  worldName: string;
  act: number;
  kind: 'act' | 'infinite';
  name: string;
  bossName: string | null;
  waves: number;
  unlocked: boolean;
  lock: LockReason | null;
}

export function stageInfoView(p: Profile, stageId: string): StageInfoView | null {
  const info = stageInfo(stageId);
  if (!info) return null;
  const w = WORLDS.find((x) => x.id === info.worldId)!;
  const lock = stageLock(p, stageId);
  return { worldId: w.id, worldName: w.name, act: info.act, kind: info.kind, name: info.name, bossName: info.bossName, waves: info.waves, unlocked: lock === null, lock };
}
