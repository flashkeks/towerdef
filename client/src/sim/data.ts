/**
 * Spieldaten fuer den Browser: die JSON-Dateien aus `sim/data` werden von Vite eingebunden und mit denselben
 * zod-Schemas und Querpruefungen wie in Node geprueft (`loadGameData()` selbst liest Dateien und laeuft nur in Node).
 */
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

export const STAGE_ID = 'standard20';

/** Alle Unit-Dateien in `sim/data/units/` (Beispiele, AA-Import, Crossover ...): eine neue Datei dort genuegt, kein Code. */
const unitFiles = import.meta.glob('../../../sim/data/units/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

let cached: GameData | null = null;

export function loadBrowserData(): GameData {
  if (cached) return cached;
  const stage = StageSchema.parse(standard20);
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
    stages: { [stage.id]: stage },
  };
  validateGameData(data);
  cached = data;
  return data;
}
