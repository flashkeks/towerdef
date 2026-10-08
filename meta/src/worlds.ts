/**
 * Welten, Acts und Freischaltung (Runde 8 / P3). Besitzer: P3.
 *
 * Die Welt-Dateien liegen in `sim/data/worlds/*.json` (einzige Quelle, auch fuer die Sim); hier wird nur die schlanke Beschreibung
 * (`worldCatalog`) gebraucht: welche Stage gehoert zu welcher Welt/Act, wie viele Wellen, was schaltet was frei. Eine neue Welt-Datei
 * erscheint hier ohne Code.
 *
 * Regeln (Story, wie in Anime Adventures: Acts nacheinander):
 * - Act 1 einer Welt ist offen, sobald die Welt offen ist; Act n+1, sobald Act n in irgendeiner Schwierigkeit geschafft ist.
 * - Eine Welt ist offen, wenn Act `unlock.afterAct` der Vorgaengerwelt geschafft ist (Daten: `unlock`), die erste ist von Anfang an offen.
 * - Infinite einer Welt ist offen, sobald Act `infinite.unlockAct` der Welt geschafft ist.
 * - Stages ausserhalb der Weltstruktur (`standard20`, Testkarten) sind immer offen.
 * Der Fortschritt steht im Profil (`stages[stageId][difficulty]`), es gibt dafuer keine eigenen Felder.
 */
import { WorldFileSchema, worldCatalog, type WorldInfo, type WorldFile, type WorldStageInfo } from '../../sim/src/index';
import { modeById, modeStage } from './mode-catalog';
import type { Profile } from './profile';
import rewardsJson from '../data/rewards.json';

const files = import.meta.glob('../../sim/data/worlds/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

const WORLD_FILES: readonly WorldFile[] = Object.keys(files)
  .sort()
  .map((f) => WorldFileSchema.parse(files[f]));

export const WORLDS: readonly WorldInfo[] = worldCatalog(WORLD_FILES);

/** Farben einer Welt fuer Karten und Vorschau (aus `theme`, nur Darstellung). */
export interface WorldPalette {
  background: string;
  grass: string;
  path: string;
  hill: string;
}
export const WORLD_PALETTES: Readonly<Record<string, WorldPalette>> = Object.fromEntries(
  WORLD_FILES.map((w) => [w.id, { background: w.theme.background ?? '#101820', grass: w.theme.grass.color, path: w.theme.path.color, hill: w.theme.hill?.topLight ?? w.theme.grass.color }]),
);

const BY_STAGE = new Map<string, WorldStageInfo>();
for (const w of WORLDS) {
  for (const a of w.acts) BY_STAGE.set(a.stageId, a);
  BY_STAGE.set(w.infinite.stageId, w.infinite);
}

export const worldById = (id: string): WorldInfo | undefined => WORLDS.find((w) => w.id === id);
/** Beschreibung einer Stage der Weltstruktur; `null` fuer Altbestand (`standard20`) und Unbekanntes. */
export const stageInfo = (stageId: string): WorldStageInfo | null => BY_STAGE.get(stageId) ?? null;
export const isInfiniteStage = (stageId: string): boolean => BY_STAGE.get(stageId)?.kind === 'infinite';
/** Wellenzahl, auf die Belohnungen gekappt werden: die der Stage, sonst `maxWaves` aus `rewards.json`. */
export const stageWaveCap = (stageId: string): number => Math.min(BY_STAGE.get(stageId)?.waves ?? modeStage(stageId)?.waves ?? rewardsJson.maxWaves, rewardsJson.maxWaves);

/** Warum etwas gesperrt ist (die UI uebersetzt in Text; Zahlen und IDs, kein Englisch hier). */
export type LockReason =
  | { kind: 'world'; worldId: string; worldName: string; afterAct: number }
  | { kind: 'act'; act: number }
  | { kind: 'infinite'; act: number };

/** Hat der Spieler diese Stage in irgendeiner Schwierigkeit geschafft? */
export const isStageCleared = (p: Profile, stageId: string): boolean => Object.values(p.stages[stageId] ?? {}).some((d) => !!d.firstClearAt);

/** Act `act` (1-basiert) der Welt geschafft? */
export const isActCleared = (p: Profile, worldId: string, act: number): boolean => {
  const a = worldById(worldId)?.acts[act - 1];
  return !!a && isStageCleared(p, a.stageId);
};

/** `null` = Welt offen, sonst der Grund. */
export function worldLock(p: Profile, worldId: string): LockReason | null {
  const w = worldById(worldId);
  if (!w || !w.unlock) return null;
  if (isActCleared(p, w.unlock.afterWorld, w.unlock.afterAct)) return null;
  const dep = worldById(w.unlock.afterWorld);
  return { kind: 'world', worldId: w.unlock.afterWorld, worldName: dep?.name ?? w.unlock.afterWorld, afterAct: w.unlock.afterAct };
}

/**
 * `null` = Stage offen, sonst der Grund. Stages ausserhalb der Weltstruktur sind offen.
 * Legend Stages und Raids (Runde 9 / P3): offen, wenn Act `unlock.afterAct` der Host-Welt geschafft ist (Legend: 6, Raid: 3); Act n+1 nach Act n.
 */
export function stageLock(p: Profile, stageId: string): LockReason | null {
  const m = modeStage(stageId);
  if (m) {
    if (!isActCleared(p, m.unlock.afterWorld, m.unlock.afterAct)) {
      return { kind: 'world', worldId: m.unlock.afterWorld, worldName: worldById(m.unlock.afterWorld)?.name ?? m.unlock.afterWorld, afterAct: m.unlock.afterAct };
    }
    if (m.act > 1) {
      const prev = modeById(m.mode, m.modeId)?.acts[m.act - 2];
      if (prev && !isStageCleared(p, prev.stageId)) return { kind: 'act', act: m.act - 1 };
    }
    return null;
  }
  const s = BY_STAGE.get(stageId);
  if (!s) return null;
  const w = worldById(s.worldId)!;
  const wl = worldLock(p, w.id);
  if (wl) return wl;
  if (s.kind === 'infinite') return isActCleared(p, w.id, w.infinite.unlockAct) ? null : { kind: 'infinite', act: w.infinite.unlockAct };
  if (s.act > 1 && !isActCleared(p, w.id, s.act - 1)) return { kind: 'act', act: s.act - 1 };
  return null;
}

export const isStageUnlocked = (p: Profile, stageId: string): boolean => stageLock(p, stageId) === null;

/**
 * Infinite-Gems (design-brief / waves.md, RR): Welle 1-5 nichts, Welle 6 18, Welle 7-14 je 3, Welle 15-105 je 5, danach nichts (Summe 497).
 * `infiniteGemsUpTo(n)`: Summe bis einschliesslich gehaltener Welle `n`. Ausgezahlt wird nur der Zuwachs ueber der bisherigen Bestwelle.
 */
export function infiniteGemsUpTo(n: number): number {
  const waves = Math.max(0, Math.floor(n));
  let sum = 0;
  for (const t of rewardsJson.infinite.gems) {
    const hi = Math.min(waves, t.to);
    if (hi >= t.from) sum += (hi - t.from + 1) * t.perWave;
  }
  return sum;
}
