/**
 * Legend Stages und Raids -> Stages (Runde 9 / P3). Reine Funktionen ohne Dateizugriff (Node, Browser, Meta-Paket).
 *
 * Eine Legend Stage oder ein Raid ist KEINE neue Karte: `host` verweist auf eine Welt-Datei, deren Karte, Farbwelt und Gegnernamen
 * wiederverwendet werden (`baseStage` aus `worlds.ts`). Wellen kommen aus derselben Vorlage wie die Story-Acts (20 Wellen, Boss am Ende).
 * Unterschied zur Story: Act-HP-Stufung und Modifikatoren aus der Moduls-Datei und `affinity` (Resistenzen/Schwaechen aller Gegner).
 *
 * Stage-IDs: `legend-<id>-<act>`, Raid mit einem Act `raid-<id>`, mit mehreren `raid-<id>-<act>`.
 * `modeCatalog` liefert die schlanke Beschreibung (ohne Karte) fuer Fortschritt, Weltkarte und Belohnungen (meta, client).
 */
import { mulBp } from '../fixed.js';
import type { LegendStageData, LegendStagesData, RaidData, RaidsData, StageAffinity, StageData, WaveTemplate, WorldFile } from './schema.js';
import { actWaves, baseStage } from './worlds.js';

export type ModeKind = 'legend' | 'raid';

export const legendStageId = (id: string, act: number): string => `legend-${id}-${act}`;
export const raidStageId = (r: Pick<RaidData, 'id' | 'acts'>, act: number): string => (r.acts.length > 1 ? `raid-${r.id}-${act}` : `raid-${r.id}`);

/** Beschreibung einer Stage eines Modus. */
export interface ModeStageInfo {
  stageId: string;
  mode: ModeKind;
  /** ID der Legend Stage / des Raids */
  modeId: string;
  modeName: string;
  /** 1-basiert */
  act: number;
  /** Acts des Modus insgesamt */
  actCount: number;
  name: string;
  bossName: string;
  waves: number;
  hpBp: number;
  hostWorldId: string;
  unlock: { afterWorld: string; afterAct: number };
  /** Legend: Material und Menge je Sieg (Normal); Raid: `null` */
  drop: { material: string; first: number; repeat: number } | null;
  /** Raid: Raid-Marken je Sieg (Normal); Legend: 0 */
  marks: number;
  affinity: StageAffinity;
}

export interface ModeInfo {
  kind: ModeKind;
  id: string;
  name: string;
  legacyName: string | null;
  blurb: string;
  hostWorldId: string;
  unlock: { afterWorld: string; afterAct: number };
  /** AA-Welt-ID (Legend) */
  aaWorld: string | null;
  acts: ModeStageInfo[];
  /** Legend: Material */
  material: string | null;
  /** Raid: garantierte Unit */
  guarantee: { unit: string; clears: number } | null;
  playable: boolean;
}

const mergeAff = (a: StageAffinity, b?: StageAffinity): StageAffinity => {
  const out: StageAffinity = { resist: { ...a.resist }, weakBp: { ...a.weakBp } };
  for (const [k, v] of Object.entries(b?.resist ?? {})) out.resist[k] = (out.resist[k] ?? 0) + v;
  for (const [k, v] of Object.entries(b?.weakBp ?? {})) out.weakBp[k] = (out.weakBp[k] ?? 0) + v;
  return out;
};
const hasAff = (a: StageAffinity): boolean => Object.keys(a.resist).length + Object.keys(a.weakBp).length > 0;

function findHost(worlds: readonly WorldFile[], host: string, what: string): WorldFile {
  const w = worlds.find((x) => x.id === host);
  if (!w) throw new Error(`${what}: Host-Welt ${host} unbekannt`);
  return w;
}

export function expandLegend(s: LegendStageData, host: WorldFile, tpl: WaveTemplate): StageData[] {
  return s.acts.map((a) => {
    const aff = mergeAff(s.affinity, a.affinity);
    const st: StageData = {
      ...baseStage(host, legendStageId(s.id, a.act), `${s.name} - Act ${a.act}: ${a.name}`, mulBp(mulBp(host.hpBp, s.hpBp), a.hpBp)),
      ref: `Runde 9 / P3: Legend Stage ${s.id} auf der Karte von ${host.id} (modes.ts)`,
      world: host.id,
      act: a.act,
      bossName: a.boss.name,
      mode: 'legend',
      ...(hasAff(aff) ? { affinity: aff } : {}),
      waves: actWaves(host, a, tpl, true),
    };
    if (a.boss.kit) st.bossKits = { [String(a.waves)]: a.boss.kit };
    return st;
  });
}

export function expandRaid(r: RaidData, host: WorldFile, tpl: WaveTemplate): StageData[] {
  return r.acts.map((a) => {
    const aff = mergeAff(r.affinity, a.affinity);
    const st: StageData = {
      ...baseStage(host, raidStageId(r, a.act), r.acts.length > 1 ? `${r.name} - Act ${a.act}: ${a.name}` : r.name, mulBp(mulBp(host.hpBp, r.hpBp), a.hpBp)),
      ref: `Runde 9 / P3: Raid ${r.id} auf der Karte von ${host.id} (modes.ts)`,
      world: host.id,
      act: a.act,
      bossName: a.boss.name,
      mode: 'raid',
      ...(hasAff(aff) ? { affinity: aff } : {}),
      waves: actWaves(host, { waves: r.waves, modifiers: a.modifiers }, tpl, true),
    };
    if (a.boss.kit) st.bossKits = { [String(r.waves)]: a.boss.kit };
    return st;
  });
}

/** Alle Stages beider Modi (nur spielbare). */
export function expandModes(legend: LegendStagesData, raids: RaidsData, worlds: readonly WorldFile[], tpl: WaveTemplate): StageData[] {
  const out: StageData[] = [];
  for (const s of legend.stages) if (s.playable) out.push(...expandLegend(s, findHost(worlds, s.host, `Legend Stage ${s.id}`), tpl));
  for (const r of raids.raids) if (r.playable) out.push(...expandRaid(r, findHost(worlds, r.host, `Raid ${r.id}`), tpl));
  return out;
}

/** Schlanke Beschreibung beider Modi in Dateireihenfolge (Legend zuerst). Host-Welt-HP-Faktor wird fuer `hpBp` gebraucht. */
export function modeCatalog(legend: LegendStagesData, raids: RaidsData, worlds: readonly WorldFile[]): ModeInfo[] {
  const out: ModeInfo[] = [];
  for (const s of legend.stages) {
    const host = findHost(worlds, s.host, `Legend Stage ${s.id}`);
    out.push({
      kind: 'legend', id: s.id, name: s.name, legacyName: s.legacyName ?? null, blurb: s.blurb, hostWorldId: host.id, unlock: s.unlock, aaWorld: s.world,
      material: s.material, guarantee: null, playable: s.playable,
      acts: s.acts.map((a): ModeStageInfo => ({
        stageId: legendStageId(s.id, a.act), mode: 'legend', modeId: s.id, modeName: s.name, act: a.act, actCount: s.acts.length, name: a.name, bossName: a.boss.name, waves: a.waves,
        hpBp: mulBp(mulBp(host.hpBp, s.hpBp), a.hpBp), hostWorldId: host.id, unlock: s.unlock, drop: { material: s.material, ...a.drop }, marks: 0, affinity: mergeAff(s.affinity, a.affinity),
      })),
    });
  }
  for (const r of raids.raids) {
    const host = findHost(worlds, r.host, `Raid ${r.id}`);
    out.push({
      kind: 'raid', id: r.id, name: r.name, legacyName: r.legacyName ?? null, blurb: r.blurb, hostWorldId: host.id, unlock: r.unlock, aaWorld: null,
      material: null, guarantee: r.guarantee, playable: r.playable,
      acts: r.acts.map((a): ModeStageInfo => ({
        stageId: raidStageId(r, a.act), mode: 'raid', modeId: r.id, modeName: r.name, act: a.act, actCount: r.acts.length, name: a.name, bossName: a.boss.name, waves: r.waves,
        hpBp: mulBp(mulBp(host.hpBp, r.hpBp), a.hpBp), hostWorldId: host.id, unlock: r.unlock, drop: null, marks: a.marks, affinity: mergeAff(r.affinity, a.affinity),
      })),
    });
  }
  return out;
}

/** Querpruefungen: Host-Welt vorhanden, Freischalt-Welt vorhanden und hoch genug, Boss-Kits bekannt, eindeutige IDs. Wirft bei Fehlern. */
export function validateModes(legend: LegendStagesData, raids: RaidsData, worlds: readonly WorldFile[], tpl: WaveTemplate, kitIds: ReadonlySet<string>, unitIds?: ReadonlySet<string>): void {
  const ids = new Set<string>();
  const check = (what: string, id: string, host: string, unlock: { afterWorld: string; afterAct: number }, bossKits: (string | undefined)[], waves: number[]): void => {
    if (ids.has(id)) throw new Error(`${what} ${id}: doppelte ID`);
    ids.add(id);
    findHost(worlds, host, `${what} ${id}`);
    const dep = worlds.find((w) => w.id === unlock.afterWorld);
    if (!dep) throw new Error(`${what} ${id}: Freischaltung nach unbekannter Welt ${unlock.afterWorld}`);
    if (unlock.afterAct > dep.acts.length) throw new Error(`${what} ${id}: Freischaltung nach Act ${unlock.afterAct}, ${dep.id} hat ${dep.acts.length}`);
    for (const k of bossKits) if (k && !kitIds.has(k)) throw new Error(`${what} ${id}: Boss-Kit ${k} unbekannt`);
    for (const w of waves) if (w - 1 > tpl.waves.length) throw new Error(`${what} ${id}: ${w} Wellen, Vorlage reicht bis ${tpl.waves.length + 1}`);
  };
  for (const s of legend.stages) {
    check('Legend Stage', s.id, s.host, s.unlock, s.acts.map((a) => a.boss.kit), s.acts.map((a) => a.waves));
    s.acts.forEach((a, i) => { if (a.act !== i + 1) throw new Error(`Legend Stage ${s.id}: Act ${a.act} an Index ${i}`); });
  }
  for (const r of raids.raids) {
    check('Raid', r.id, r.host, r.unlock, r.acts.map((a) => a.boss.kit), [r.waves]);
    r.acts.forEach((a, i) => { if (a.act !== i + 1) throw new Error(`Raid ${r.id}: Act ${a.act} an Index ${i}`); });
    if (unitIds && !unitIds.has(r.guarantee.unit)) throw new Error(`Raid ${r.id}: garantierte Unit ${r.guarantee.unit} unbekannt`);
  }
}
