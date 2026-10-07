/**
 * Welten -> Stages (Runde 8 / P3). Reine Funktionen ohne Dateizugriff (laufen in Node, Browser und im Meta-Paket).
 *
 * Eine Welt-Datei (`data/worlds/*.json`) beschreibt Karte, Farbwelt, Acts und Infinite. `expandWorld` baut daraus je Act eine fertige
 * `StageData` (`<welt>-<act>`) und die Infinite-Stage (`<welt>-infinite`): Wellen aus der gemeinsamen Vorlage (`data/wave-template.json`),
 * Boss-Welle am Act-Ende, Act-Modifier, Element-Zyklus mit Versatz, Gegner-HP-Faktor = Welt x Act.
 * `worldCatalog` liefert dieselbe Struktur als schlanke Beschreibung (ohne Karte) für Fortschritt und Weltkarte (meta, client).
 */
import { mulBp } from '../fixed.js';
import type { ActData, StageData, WaveTemplate, WorldFile } from './schema.js';

export type StageKind = 'act' | 'infinite';

/** Eine spielbare Stage in der Weltstruktur. */
export interface WorldStageInfo {
  stageId: string;
  worldId: string;
  kind: StageKind;
  /** Act-Nummer (1-basiert); Infinite: 0 */
  act: number;
  name: string;
  /** Wellenzahl (Infinite: feste Wellen vor der Erzeugung) */
  waves: number;
  bossName: string | null;
  hpBp: number;
}

export interface WorldInfo {
  id: string;
  order: number;
  name: string;
  legacyName: string | null;
  aaId: string | null;
  blurb: string;
  unlock: { afterWorld: string; afterAct: number } | null;
  theme: string;
  acts: WorldStageInfo[];
  infinite: WorldStageInfo & { unlockAct: number };
}

export const actStageId = (worldId: string, act: number): string => `${worldId}-${act}`;
export const infiniteStageId = (worldId: string): string => `${worldId}-infinite`;

type Group = StageData['waves'][number]['groups'][number];

function groupsOf(tpl: WaveTemplate, spec: readonly (readonly [string, number])[], element: number, startDelay = 0): Group[] {
  let delay = startDelay;
  return spec.map(([type, count]) => {
    const interval = tpl.intervals[type];
    if (interval === undefined) throw new Error(`Wellen-Vorlage: kein Spawn-Abstand für ${type}`);
    const g: Group = { type, count, intervalTicks: count > 1 ? interval : 0, delayTicks: delay, modifiers: [], element };
    delay += count * interval;
    return g;
  });
}

const modKind = (m: string): string => m.split(':')[0];

function actWaves(world: WorldFile, act: Pick<ActData, 'waves' | 'modifiers'>, tpl: WaveTemplate, boss: boolean): StageData['waves'] {
  const regular = boss ? act.waves - 1 : act.waves;
  if (regular > tpl.waves.length) throw new Error(`Welt ${world.id}: ${regular} reguläre Wellen, die Vorlage hat ${tpl.waves.length}`);
  const out: StageData['waves'] = [];
  for (let i = 0; i < regular; i++) {
    const element = 1 + ((i + world.elementOffset) % 5);
    const groups = groupsOf(tpl, tpl.waves[i], element);
    const n = i + 1;
    for (const m of act.modifiers) {
      if (n < m.fromWave) continue;
      for (const g of groups) {
        if (!m.types.includes(g.type) || g.modifiers.some((x) => modKind(x) === modKind(m.modifier))) continue;
        g.modifiers.push(m.modifier);
      }
    }
    out.push({ n, groups });
  }
  if (boss) {
    const n = act.waves;
    const element = 1 + ((n - 1 + world.elementOffset) % 5);
    const bossGroup: Group = { type: 'boss', count: 1, intervalTicks: 0, delayTicks: 0, modifiers: [], element };
    out.push({ n, groups: [bossGroup, ...groupsOf(tpl, tpl.boss.escorts, element, tpl.boss.escortDelayTicks)] });
  }
  return out;
}

function baseStage(world: WorldFile, id: string, name: string, hpBp: number): Omit<StageData, 'waves'> {
  return {
    ref: `Runde 8 / P3: erzeugt aus data/worlds/${world.id}.json und data/wave-template.json (worlds.ts)`,
    id,
    name,
    world: world.id,
    hpBp,
    roster: { ...world.roster },
    theme: world.theme,
    path: world.map.path,
    pathWidth: world.map.pathWidth,
    zones: world.map.zones,
    slots: [],
  };
}

/** Alle Stages einer Welt: Act 1..n und Infinite. */
export function expandWorld(world: WorldFile, tpl: WaveTemplate): StageData[] {
  const stages: StageData[] = [];
  for (const act of world.acts) {
    const s: StageData = {
      ...baseStage(world, actStageId(world.id, act.act), `${world.name} - Act ${act.act}: ${act.name}`, mulBp(world.hpBp, act.hpBp)),
      act: act.act,
      bossName: act.boss.name,
      waves: actWaves(world, act, tpl, true),
    };
    if (act.boss.kit) s.bossKits = { [String(act.waves)]: act.boss.kit };
    stages.push(s);
  }
  const inf = world.infinite;
  stages.push({
    ...baseStage(world, infiniteStageId(world.id), `${world.name} - Infinite`, mulBp(world.hpBp, inf.hpBp)),
    infinite: true,
    bossKits: {},
    waves: actWaves(world, { waves: inf.fixedWaves, modifiers: [] }, tpl, false),
  });
  return stages;
}

/** Schlanke Beschreibung der Welten (sortiert nach `order`), ohne Karte. */
export function worldCatalog(worlds: readonly WorldFile[]): WorldInfo[] {
  return [...worlds]
    .sort((a, b) => a.order - b.order)
    .map((w): WorldInfo => ({
      id: w.id,
      order: w.order,
      name: w.name,
      legacyName: w.legacyName ?? null,
      aaId: w.aaId ?? null,
      blurb: w.blurb,
      unlock: w.unlock,
      theme: w.theme.id,
      acts: w.acts.map((a) => ({ stageId: actStageId(w.id, a.act), worldId: w.id, kind: 'act', act: a.act, name: a.name, waves: a.waves, bossName: a.boss.name, hpBp: mulBp(w.hpBp, a.hpBp) })),
      infinite: {
        stageId: infiniteStageId(w.id),
        worldId: w.id,
        kind: 'infinite',
        act: 0,
        name: 'Infinite',
        waves: w.infinite.fixedWaves,
        bossName: null,
        hpBp: mulBp(w.hpBp, w.infinite.hpBp),
        unlockAct: w.infinite.unlockAct,
      },
    }));
}

/** Querprüfungen, die zod nicht kann (Reihenfolge der Acts, Freischalt-Verweise, eindeutige IDs). Wirft bei Fehlern. */
export function validateWorlds(worlds: readonly WorldFile[], tpl: WaveTemplate, kitIds: ReadonlySet<string>, enemyIds: ReadonlySet<string>): void {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const w of worlds) {
    if (ids.has(w.id)) throw new Error(`Doppelte Welt-ID ${w.id}`);
    ids.add(w.id);
    if (orders.has(w.order)) throw new Error(`Welt ${w.id}: Reihenfolge ${w.order} doppelt`);
    orders.add(w.order);
    w.acts.forEach((a, i) => {
      if (a.act !== i + 1) throw new Error(`Welt ${w.id}: Act ${a.act} an Index ${i}`);
      if (a.boss.kit && !kitIds.has(a.boss.kit)) throw new Error(`Welt ${w.id} Act ${a.act}: Boss-Kit ${a.boss.kit} unbekannt`);
      if (a.waves - 1 > tpl.waves.length) throw new Error(`Welt ${w.id} Act ${a.act}: ${a.waves} Wellen, Vorlage reicht bis ${tpl.waves.length + 1}`);
    });
    if (w.infinite.fixedWaves > tpl.waves.length) throw new Error(`Welt ${w.id}: Infinite fixedWaves ${w.infinite.fixedWaves} > Vorlage ${tpl.waves.length}`);
    if (w.infinite.unlockAct > w.acts.length) throw new Error(`Welt ${w.id}: Infinite-Freischaltung nach Act ${w.infinite.unlockAct}, es gibt ${w.acts.length}`);
    for (const t of enemyIds) if (t !== 'splitter_child' && !(t in w.roster)) throw new Error(`Welt ${w.id}: roster ohne Eintrag für ${t}`);
    const cols = w.map.zones.rows[0].length;
    w.map.zones.rows.forEach((row, j) => {
      if (row.length !== cols) throw new Error(`Welt ${w.id}: Zonenzeile ${j} hat ${row.length} Zeichen, erwartet ${cols}`);
    });
  }
  for (const w of worlds) {
    if (!w.unlock) continue;
    const dep = worlds.find((x) => x.id === w.unlock!.afterWorld);
    if (!dep) throw new Error(`Welt ${w.id}: Freischaltung nach unbekannter Welt ${w.unlock.afterWorld}`);
    if (w.unlock.afterAct > dep.acts.length) throw new Error(`Welt ${w.id}: Freischaltung nach Act ${w.unlock.afterAct}, ${dep.id} hat ${dep.acts.length}`);
    if (dep.order >= w.order) throw new Error(`Welt ${w.id}: Freischaltung nach einer späteren Welt`);
  }
}
