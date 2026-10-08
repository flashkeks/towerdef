/**
 * Spieldaten fuer den Browser: die JSON-Dateien aus `sim/data` werden von Vite eingebunden und mit denselben
 * zod-Schemas und Querpruefungen wie in Node geprueft (`loadGameData()` selbst liest Dateien und laeuft nur in Node).
 */
import { expandWorld } from '../../../sim/src/data/worlds';
import { expandModes } from '../../../sim/src/data/modes';
import { LegendStagesSchema, RaidsSchema, WaveTemplateSchema, WorldFileSchema } from '../../../sim/src/data/schema';
import waveTemplate from '../../../sim/data/wave-template.json';
import { BossesSchema, CardsSchema, ChallengesSchema, DifficultiesSchema, EconomySchema, EffectsSchema, EnemiesSchema, ModifiersSchema, StageSchema, UnitFileSchema } from '../../../sim/src/data/schema';
import type { GameData } from '../../../sim/src/data/schema';
import { mergeUnitFiles, validateGameData } from '../../../sim/src/data/load';
import bosses from '../../../sim/data/bosses.json';
import cards from '../../../sim/data/cards.json';
import challenges from '../../../sim/data/challenges.json';
import difficulties from '../../../sim/data/difficulties.json';
import economy from '../../../sim/data/economy.json';
import enemies from '../../../sim/data/enemies.json';
import modifiers from '../../../sim/data/modifiers.json';
import effects from '../../../sim/data/effects.json';
import standard20 from '../../../sim/data/stages/standard20.json';
import legendJson from '../../../sim/data/modes/legend-stages.json';
import raidsJson from '../../../sim/data/modes/raids.json';

export const STAGE_ID = 'standard20';

/** Alle Unit-Dateien in `sim/data/units/` (Beispiele, AA-Import, Crossover ...): eine neue Datei dort genuegt, kein Code. */
const unitFiles = import.meta.glob('../../../sim/data/units/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

/** Alle Welt-Dateien in `sim/data/worlds/`: eine neue Datei dort genuegt (Karte, Farben, Acts), jede Welt ergibt Act-Stages und Infinite. */
const worldFiles = import.meta.glob('../../../sim/data/worlds/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

let cached: GameData | null = null;

export function loadBrowserData(): GameData {
  if (cached) return cached;
  const stage = StageSchema.parse(standard20);
  const tpl = WaveTemplateSchema.parse(waveTemplate);
  const worlds = Object.keys(worldFiles).sort().map((f) => WorldFileSchema.parse(worldFiles[f]));
  const stages = { [stage.id]: stage } as GameData['stages'];
  for (const w of worlds) for (const st of expandWorld(w, tpl)) stages[st.id] = StageSchema.parse(st);
  // Runde 9 / P3: Legend Stages und Raids (Karte der Host-Welt, eigene Wellen/Affinitaet)
  const modes = { legend: LegendStagesSchema.parse(legendJson), raids: RaidsSchema.parse(raidsJson) };
  for (const st of expandModes(modes.legend, modes.raids, worlds, tpl)) stages[st.id] = StageSchema.parse(st);
  const data: GameData = {
    economy: EconomySchema.parse(economy),
    enemies: EnemiesSchema.parse(enemies),
    modifiers: ModifiersSchema.parse(modifiers),
    difficulties: DifficultiesSchema.parse(difficulties),
    challenges: ChallengesSchema.parse(challenges),
    units: mergeUnitFiles(Object.keys(unitFiles).sort().map((f) => UnitFileSchema.parse(unitFiles[f]))),
    effects: EffectsSchema.parse(effects),
    bosses: BossesSchema.parse(bosses),
    cards: CardsSchema.parse(cards),
    stages,
    worlds,
    waveTemplate: tpl,
    modes,
  };
  validateGameData(data);
  cached = data;
  return data;
}
