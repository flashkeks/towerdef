/**
 * Laden und Validieren der JSON-Daten (sim/data) mit zod, plus Querverweis-Prüfungen.
 * Einzige Stelle mit Dateizugriff; alle anderen Module arbeiten mit `GameData`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  BossesSchema,
  CardsSchema,
  DifficultiesSchema,
  EconomySchema,
  EnemiesSchema,
  ModifiersSchema,
  StageSchema,
  UnitsSchema,
  type GameData,
  type StageData,
} from './schema.js';

const DATA_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(DATA_DIR + rel, 'utf8'));
}

/** Prüft Querverweise zwischen den Dateien; wirft bei Inkonsistenz. */
export function validateGameData(d: GameData): void {
  const enemyIds = new Set(d.enemies.archetypes.map((a) => a.id));
  for (const a of d.enemies.archetypes) {
    if (a.child && !enemyIds.has(a.child.type)) throw new Error(`Kind-Typ unbekannt: ${a.child.type}`);
    const leak = d.economy.leakDamage[a.id] as number | undefined;
    if (leak !== a.leak) throw new Error(`Leak-Wert ${a.id}: economy=${leak} enemies=${a.leak}`);
  }
  for (const id of d.economy.lives.instantLoss) if (!enemyIds.has(id)) throw new Error(`lives.instantLoss: Archetyp unbekannt: ${id}`);
  const unitIds = new Set<string>();
  for (const u of d.units.units) {
    if (unitIds.has(u.id)) throw new Error(`Doppelte Unit-ID ${u.id}`);
    unitIds.add(u.id);
    const costs = u.upgradeCosts ?? d.units.rarities[u.rarity].upgradeCosts;
    if (u.farm && u.farm.yieldByLevel.length !== costs.length + 1) throw new Error(`Farm-Ertrag ${u.id}: Länge`);
    if (u.aura && u.aura.damageBpByLevel.length !== costs.length + 1) throw new Error(`Aura ${u.id}: Länge`);
    if (u.attack?.kind === 'circle' && !u.attack.radiusMilli) throw new Error(`${u.id}: circle ohne Radius`);
    if (u.attack?.kind === 'line' && !u.attack.widthMilli) throw new Error(`${u.id}: line ohne Breite`);
    if (u.attack?.kind === 'cone' && !u.attack.coneDeg) throw new Error(`${u.id}: cone ohne Winkel`);
  }
  validateBosses(d, enemyIds);
  validateCards(d);
  for (const [sid, s] of Object.entries(d.stages)) validateStage(d, s, sid);
}

/** Boss-Kits (P4): Wave eindeutig, Phasen-Schwellen fallend, Querverweise auf Gegnertypen und Phasen-Indizes. */
function validateBosses(d: GameData, enemyIds: Set<string>): void {
  const waves = new Set<number>();
  const ids = new Set<string>();
  for (const k of d.bosses?.kits ?? []) {
    if (waves.has(k.wave)) throw new Error(`Boss-Kit ${k.id}: Wave ${k.wave} doppelt belegt`);
    if (ids.has(k.id)) throw new Error(`Boss-Kit-ID ${k.id} doppelt`);
    waves.add(k.wave);
    ids.add(k.id);
    if (k.phases[0].fromHpBp !== 10000) throw new Error(`Boss-Kit ${k.id}: Phase 0 muss bei 10000 beginnen`);
    for (let i = 1; i < k.phases.length; i++) {
      if (k.phases[i].fromHpBp >= k.phases[i - 1].fromHpBp) throw new Error(`Boss-Kit ${k.id}: Schwellen müssen fallen`);
    }
    const spawns = [
      ...k.abilities.filter((a) => a.kind === 'summon').map((a) => (a as { type: string }).type),
      ...k.phases.flatMap((p) => p.onEnter.filter((a) => a.kind === 'summon').map((a) => (a as { type: string }).type)),
    ];
    for (const t of spawns) if (!enemyIds.has(t)) throw new Error(`Boss-Kit ${k.id}: Beschwörung unbekannter Typ ${t}`);
    for (const a of k.abilities) {
      if (a.fromPhase >= k.phases.length || (a.toPhase !== undefined && (a.toPhase >= k.phases.length || a.toPhase < a.fromPhase))) {
        throw new Error(`Boss-Kit ${k.id}: Fähigkeit ${a.id} Phasenbereich ungültig`);
      }
    }
  }
}

/** Risikokarten (P4): IDs eindeutig. */
function validateCards(d: GameData): void {
  const ids = new Set<string>();
  for (const c of d.cards?.cards ?? []) {
    if (ids.has(c.id)) throw new Error(`Doppelte Risikokarte ${c.id}`);
    ids.add(c.id);
  }
}

export function validateStage(d: GameData, s: StageData, label = s.id): void {
  const enemyIds = new Set(d.enemies.archetypes.map((a) => a.id));
  s.slots.forEach((sl, i) => {
    if (sl.id !== i) throw new Error(`Stage ${label}: Slot-ID ${sl.id} an Index ${i}`);
  });
  s.waves.forEach((w, i) => {
    if (w.n !== i + 1) throw new Error(`Stage ${label}: Wave-Nummer ${w.n} an Index ${i}`);
    for (const g of w.groups) {
      if (!enemyIds.has(g.type)) throw new Error(`Stage ${label} Wave ${w.n}: Typ ${g.type}`);
      if (g.count > 1 && g.intervalTicks === 0) throw new Error(`Stage ${label} Wave ${w.n}: Intervall 0`);
      for (const m of g.modifiers) {
        if (m.startsWith('shield:') && Number(m.slice(7)) > d.modifiers.shield.maxStacks) {
          throw new Error(`Stage ${label} Wave ${w.n}: Schild über Maximum`);
        }
      }
    }
  });
}

/** Lädt und validiert alle Daten inklusive aller Stages in data/stages/. */
export function loadGameData(): GameData {
  const stages: Record<string, StageData> = {};
  for (const f of readdirSync(DATA_DIR + 'stages').sort()) {
    if (!f.endsWith('.json')) continue;
    const s = StageSchema.parse(readJson('stages/' + f));
    stages[s.id] = s;
  }
  // Infinite: gleiche Map und gleiche Waves 1-20 wie standard20, danach seeded erzeugte Waves (systems/infinite.ts).
  const base = stages['standard20'];
  if (base && !stages['infinite']) stages['infinite'] = { ...base, id: 'infinite', name: 'Infinite', infinite: true };
  const data: GameData = {
    economy: EconomySchema.parse(readJson('economy.json')),
    enemies: EnemiesSchema.parse(readJson('enemies.json')),
    modifiers: ModifiersSchema.parse(readJson('modifiers.json')),
    difficulties: DifficultiesSchema.parse(readJson('difficulties.json')),
    units: UnitsSchema.parse(readJson('units.json')),
    bosses: BossesSchema.parse(readJson('bosses.json')),
    cards: CardsSchema.parse(readJson('cards.json')),
    stages,
  };
  validateGameData(data);
  return data;
}
