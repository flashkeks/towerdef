/**
 * Katalog der Legend Stages und Raids (Runde 9 / P3). Reine Daten aus `sim/data/modes/*.json` (einzige Quelle, auch fuer die Sim), ohne Profil.
 * Freischaltung und Belohnungen stehen in `worlds.ts` (Sperre) und `modes.ts` (Belohnung). Eine neue Legend Stage / ein neuer Raid erscheint hier ohne Code.
 */
import { LegendStagesSchema, RaidsSchema, WorldFileSchema, modeCatalog, type ModeInfo, type ModeStageInfo } from '../../sim/src/index';
import legendJson from '../../sim/data/modes/legend-stages.json';
import raidsJson from '../../sim/data/modes/raids.json';

const worldFiles = import.meta.glob('../../sim/data/worlds/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const WORLD_FILES = Object.keys(worldFiles).sort().map((f) => WorldFileSchema.parse(worldFiles[f]));

export const LEGEND_DATA = LegendStagesSchema.parse(legendJson);
export const RAIDS_DATA = RaidsSchema.parse(raidsJson);

/** Alle spielbaren Modi (Legend Stages zuerst, dann Raids), in Dateireihenfolge. */
export const MODES: readonly ModeInfo[] = modeCatalog(LEGEND_DATA, RAIDS_DATA, WORLD_FILES).filter((m) => m.playable);
export const LEGEND_STAGES: readonly ModeInfo[] = MODES.filter((m) => m.kind === 'legend');
export const RAIDS: readonly ModeInfo[] = MODES.filter((m) => m.kind === 'raid');

const BY_STAGE = new Map<string, ModeStageInfo>();
for (const m of MODES) for (const a of m.acts) BY_STAGE.set(a.stageId, a);

export const modeById = (kind: 'legend' | 'raid', id: string): ModeInfo | undefined => MODES.find((m) => m.kind === kind && m.id === id);
/** Beschreibung einer Legend-/Raid-Stage; `null` fuer alles andere. */
export const modeStage = (stageId: string): ModeStageInfo | null => BY_STAGE.get(stageId) ?? null;
export const isModeStage = (stageId: string): boolean => BY_STAGE.has(stageId);
