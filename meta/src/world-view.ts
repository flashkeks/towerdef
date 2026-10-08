/**
 * Sichtmodell der Weltkarte (Runde 8 / P3): reine Funktion `Profil -> JSON`, kein DOM, keine Texte ausser Namen aus den Daten.
 * Die UI holt es ueber `Backend.worldView()` und uebersetzt Sperrgruende (`LockReason`) in `en.ts`. Besitzer: P3.
 *
 * Aufbau: Welten (je 6 Acts + Infinite), dazu Legend Stages und Raids als Daten-Geruest (noch nicht spielbar).
 */
import type { ModeInfo, ModeStageInfo } from '../../sim/src/index';
import { nameOf } from './catalog';
import { materialName } from './materials';
import { LEGEND_STAGES, modeStage, RAIDS } from './mode-catalog';
import { raidClears, raidUnitFlag } from './modes';
import type { Profile } from './profile';
import { stageInfo, stageLock, WORLD_PALETTES, WORLDS, worldById, worldLock, type LockReason, type WorldPalette } from './worlds';

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

/** Eine Stage (Act) einer Legend Stage oder eines Raids. */
export interface ModeActView {
  stageId: string;
  act: number;
  name: string;
  bossName: string;
  waves: number;
  unlocked: boolean;
  lock: LockReason | null;
  cleared: boolean;
  clearedDifficulties: string[];
  bestWave: number;
  /** Legend: Material je Sieg auf Normal (Erst-Clear / Wiederholung) */
  drop: { material: string; materialName: string; first: number; repeat: number } | null;
  /** Raid: Raid-Marken je Sieg auf Normal */
  marks: number;
}

/** Legend Stage oder Raid fuer die Weltkarte. */
export interface ModeCardView {
  kind: 'legend' | 'raid';
  id: string;
  name: string;
  legacyName: string | null;
  blurb: string;
  /** Welt, deren Karte benutzt wird (und nach deren Act `unlock.afterAct` die Stage frei wird) */
  hostWorldId: string;
  hostWorldName: string;
  palette: WorldPalette;
  unlocked: boolean;
  lock: LockReason | null;
  acts: ModeActView[];
  actsCleared: number;
  /** Legend: Material, das sie fallen laesst */
  material: { id: string; name: string } | null;
  /** Raid: garantierte Unit und Fortschritt (Siege ueber alle Acts) */
  guarantee: { unitId: string; unitName: string; clears: number; progress: number; granted: boolean } | null;
  /** Resistenzen (R) und Schwaechen (Bp) der Gegner, Stage-weit (Act 1) */
  affinity: { resist: Record<string, number>; weakBp: Record<string, number> };
}

export interface WorldView {
  playerLevel: number;
  worlds: WorldCardView[];
  /** erste offene, noch nicht geschaffte Act-Stage (Vorschlag "weiter"), sonst `null` */
  nextStageId: string | null;
  legend: ModeCardView[];
  raids: ModeCardView[];
  /** Runde 9 / P3: Kontostand der Raid-Waehrung und des Evolutions-Materials (nur > 0) */
  raidMarks: number;
  materials: { id: string; name: string; count: number }[];
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

function modeActView(p: Profile, a: ModeStageInfo): ModeActView {
  const prog = p.stages[a.stageId] ?? {};
  const lock = stageLock(p, a.stageId);
  const cleared = Object.entries(prog).filter(([, d]) => !!d.firstClearAt).map(([k]) => k);
  return {
    stageId: a.stageId,
    act: a.act,
    name: a.name,
    bossName: a.bossName,
    waves: a.waves,
    unlocked: lock === null,
    lock,
    cleared: cleared.length > 0,
    clearedDifficulties: cleared,
    bestWave: Math.max(0, ...Object.values(prog).map((d) => d.bestWave)),
    drop: a.drop ? { material: a.drop.material, materialName: materialName(a.drop.material), first: a.drop.first, repeat: a.drop.repeat } : null,
    marks: a.marks,
  };
}

function modeCard(p: Profile, m: ModeInfo): ModeCardView {
  const acts = m.acts.map((a) => modeActView(p, a));
  const lock = acts[0].lock && acts[0].lock.kind === 'world' ? acts[0].lock : null;
  const host = worldById(m.hostWorldId)!;
  return {
    kind: m.kind,
    id: m.id,
    name: m.name,
    legacyName: m.legacyName,
    blurb: m.blurb,
    hostWorldId: m.hostWorldId,
    hostWorldName: host.name,
    palette: WORLD_PALETTES[m.hostWorldId],
    unlocked: lock === null,
    lock,
    acts,
    actsCleared: acts.filter((a) => a.cleared).length,
    material: m.material ? { id: m.material, name: materialName(m.material) } : null,
    guarantee: m.guarantee
      ? { unitId: m.guarantee.unit, unitName: nameOf(m.guarantee.unit), clears: m.guarantee.clears, progress: raidClears(p, m.id), granted: !!p.flags[raidUnitFlag(m.id)] }
      : null,
    affinity: { resist: m.acts[0].affinity.resist, weakBp: m.acts[0].affinity.weakBp },
  };
}

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
    legend: LEGEND_STAGES.map((m) => modeCard(p, m)),
    raids: RAIDS.map((m) => modeCard(p, m)),
    raidMarks: p.inventory.raidMarks,
    materials: Object.entries(p.inventory.materials).filter(([, n]) => n > 0).map(([id, count]) => ({ id, name: materialName(id), count })),
  };
}

/** Beschreibung einer einzelnen Stage fuer die Stufen-Auswahl (`stageView`); `null` fuer Stages ausserhalb der Weltstruktur. */
export interface StageInfoView {
  worldId: string;
  worldName: string;
  act: number;
  /** Runde 9 / P3: `legend` / `raid` fuer Legend Stages und Raids (worldId/worldName = Host-Welt) */
  kind: 'act' | 'infinite' | 'legend' | 'raid';
  /** Legend/Raid: Name des Modus (z. B. "Spirit Invasion"), Acts des Modus, Resistenzen/Schwaechen */
  modeName?: string;
  actCount?: number;
  affinity?: { resist: Record<string, number>; weakBp: Record<string, number> };
  /** Raid: Siege bis zur garantierten Unit */
  guarantee?: { unitName: string; clears: number; progress: number };
  name: string;
  bossName: string | null;
  waves: number;
  unlocked: boolean;
  lock: LockReason | null;
}

export function stageInfoView(p: Profile, stageId: string): StageInfoView | null {
  const ms = modeStage(stageId);
  if (ms) {
    const lock = stageLock(p, stageId);
    const host = worldById(ms.hostWorldId)!;
    const raid = ms.mode === 'raid' ? RAIDS.find((r) => r.id === ms.modeId) : undefined;
    return {
      worldId: host.id, worldName: host.name, act: ms.act, kind: ms.mode, name: ms.name, bossName: ms.bossName, waves: ms.waves, unlocked: lock === null, lock,
      modeName: ms.modeName, actCount: ms.actCount, affinity: ms.affinity,
      ...(raid?.guarantee ? { guarantee: { unitName: nameOf(raid.guarantee.unit), clears: raid.guarantee.clears, progress: raidClears(p, raid.id) } } : {}),
    };
  }
  const info = stageInfo(stageId);
  if (!info) return null;
  const w = WORLDS.find((x) => x.id === info.worldId)!;
  const lock = stageLock(p, stageId);
  return { worldId: w.id, worldName: w.name, act: info.act, kind: info.kind, name: info.name, bossName: info.bossName, waves: info.waves, unlocked: lock === null, lock };
}
