/**
 * Laden und Validieren der JSON-Daten (sim/data) mit zod, plus Querverweis-Prüfungen.
 * Einzige Stelle mit Dateizugriff; alle anderen Module arbeiten mit `GameData`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ChallengesSchema,
  BossesSchema,
  CardsSchema,
  DifficultiesSchema,
  EconomySchema,
  EffectsSchema,
  EnemiesSchema,
  ModifiersSchema,
  ProgressionSchema,
  StageSchema,
  UnitFileSchema,
  WaveTemplateSchema,
  WorldFileSchema,
  LegendStagesSchema,
  RaidsSchema,
  type LegendStagesData,
  type RaidsData,
  type WorldFile,
  type WaveTemplate,
  type AttackData,
  type GameData,
  type ProgressionData,
  type StageData,
  type SummonData,
  type UnitData,
  type UnitFile,
  type UnitsData,
} from './schema.js';
import { expandWorld, validateWorlds } from './worlds.js';
import { expandModes, validateModes } from './modes.js';

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
  for (const k of ['normal', 'hard', 'nightmare'] as const) {
    const df = d.difficulties[k];
    for (const id of df.lives.instantLoss ?? []) if (!enemyIds.has(id)) throw new Error(`difficulties.${k}.lives.instantLoss: Archetyp unbekannt: ${id}`);
    for (const v of df.waveVariants) {
      for (const t of v.swap ? [v.swap.from, v.swap.to] : []) if (!enemyIds.has(t)) throw new Error(`difficulties.${k}.waveVariants.${v.id}: Typ ${t}`);
    }
    for (const f of df.waveVariants.map((x) => x.forceModifier)) {
      if (f?.startsWith('shield:') && Number(f.slice(7)) > d.modifiers.shield.maxStacks) throw new Error(`difficulties.${k}.waveVariants: Schild über Maximum`);
    }
    for (const m of df.modifiers.pool) {
      if (m.id.startsWith('shield:') && Number(m.id.slice(7)) > d.modifiers.shield.maxStacks) throw new Error(`difficulties.${k}.modifiers: Schild über Maximum`);
    }
    if (df.modifiers.densityBp > 0 && df.modifiers.pool.length === 0) throw new Error(`difficulties.${k}.modifiers: Dichte > 0 ohne Pool`);
  }
  for (const c of d.challenges?.challenges ?? []) {
    for (const u of c.restrictions.bannedUnits) if (!d.units.units.some((x) => x.id === u)) throw new Error(`challenge ${c.id}: Unit ${u} unbekannt`);
  }
  for (const id of d.economy.lives.instantLoss) if (!enemyIds.has(id)) throw new Error(`lives.instantLoss: Archetyp unbekannt: ${id}`);
  const unitIds = new Set<string>();
  for (const u of d.units.units) {
    if (unitIds.has(u.id)) throw new Error(`Doppelte Unit-ID ${u.id}`);
    unitIds.add(u.id);
    if (u.levels[0].cost === null || u.levels[0].cost === undefined || u.levels[0].cost <= 0) throw new Error(`${u.id}: Stufe 0 ohne Kosten`);
    u.levels.forEach((l, k) => {
      if (l.level !== k) throw new Error(`${u.id}: Stufe ${l.level} an Index ${k}`);
    });
  }
  validateAbilities(d);
  validateBosses(d, enemyIds);
  validateCards(d);
  validateCoop(d);
  for (const [sid, s] of Object.entries(d.stages)) validateStage(d, s, sid);
  if (d.worlds && d.waveTemplate) validateWorlds(d.worlds, d.waveTemplate, new Set((d.bosses?.kits ?? []).map((k) => k.id)), enemyIds);
  if (d.worlds && d.waveTemplate && d.modes) {
    validateModes(d.modes.legend, d.modes.raids, d.worlds, d.waveTemplate, new Set((d.bosses?.kits ?? []).map((k) => k.id)), new Set(d.units.units.map((u) => u.id)));
  }
}

/** Fähigkeiten und Beschwörungen (Runde 9 / P1): Querverweise auf Angriffe und Beschwörungen, eindeutige Fähigkeits-IDs je Unit. */
function validateAbilities(d: GameData): void {
  const attacks = d.units.attacks;
  const summons = d.units.summons ?? {};
  for (const [id, sm] of Object.entries(summons)) {
    for (const a of [sm.attack, sm.endAttack]) if (a && !(a in attacks)) throw new Error(`Beschwörung ${id}: Angriff ${a} unbekannt`);
  }
  for (const u of d.units.units) {
    const seen = new Set<string>();
    for (const a of u.abilities ?? []) {
      if (seen.has(a.id)) throw new Error(`${u.id}: Fähigkeit ${a.id} doppelt`);
      seen.add(a.id);
      if (a.attack && !(a.attack in attacks)) throw new Error(`${u.id}: Fähigkeit ${a.id}: Angriff ${a.attack} unbekannt`);
      for (const sc of a.summon ?? []) if (!(sc.id in summons)) throw new Error(`${u.id}: Fähigkeit ${a.id}: Beschwörung ${sc.id} unbekannt`);
      if (a.minLevel >= u.levels.length) throw new Error(`${u.id}: Fähigkeit ${a.id}: minLevel ${a.minLevel} über der letzten Stufe`);
      if (!a.attack && !a.selfBuff && !a.buff && !a.summon && !a.coins) throw new Error(`${u.id}: Fähigkeit ${a.id} ohne Wirkung`);
    }
    for (const l of u.levels) for (const a of l.also ?? []) if (!(a in attacks)) throw new Error(`${u.id}: Stufe ${l.level}: Zweitangriff ${a} unbekannt`);
  }
}

/** Boss-Kits (P4): Wave eindeutig, Phasen-Schwellen fallend, Querverweise auf Gegnertypen und Phasen-Indizes. */
function validateBosses(d: GameData, enemyIds: Set<string>): void {
  const waves = new Set<number>();
  const ids = new Set<string>();
  for (const k of d.bosses?.kits ?? []) {
    if (k.wave !== undefined && waves.has(k.wave)) throw new Error(`Boss-Kit ${k.id}: Wave ${k.wave} doppelt belegt`);
    if (ids.has(k.id)) throw new Error(`Boss-Kit-ID ${k.id} doppelt`);
    if (k.wave !== undefined) waves.add(k.wave);
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
      if (a.staggerBp !== undefined && !a.interruptible) throw new Error(`Boss-Kit ${k.id}: Fähigkeit ${a.id} hat staggerBp, ist aber nicht unterbrechbar`);
    }
  }
}

/** Koop-Tabellen (P5): Eintrag für 1 Spieler muss 10000 sein (Solo bleibt unberührt), Länge = maxPlayers. */
function validateCoop(d: GameData): void {
  const c = d.economy.coop;
  for (const [name, t] of [['hpTableBp', c.hpTableBp], ['bossHpTableBp', c.bossHpTableBp], ['upgradeCostTableBp', c.upgradeCostTableBp]] as const) {
    if (!t) continue;
    if (t[0] !== 10000) throw new Error(`economy.coop.${name}[0] muss 10000 sein (1 Spieler), ist ${t[0]}`);
    if (t.length !== c.maxPlayers) throw new Error(`economy.coop.${name}: ${t.length} Einträge, maxPlayers ist ${c.maxPlayers}`);
  }
  for (const k of ['normal', 'hard', 'nightmare'] as const) {
    for (const [name, t] of [['coopHpTableBp', d.difficulties[k].coopHpTableBp], ['coopBossHpTableBp', d.difficulties[k].coopBossHpTableBp]] as const) {
      if (!t) continue;
      if (t[0] !== 10000) throw new Error(`difficulties.${k}.${name}[0] muss 10000 sein (1 Spieler), ist ${t[0]}`);
      if (t.length !== c.maxPlayers) throw new Error(`difficulties.${k}.${name}: ${t.length} Einträge, maxPlayers ist ${c.maxPlayers}`);
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
  const cols = s.zones.rows[0].length;
  s.zones.rows.forEach((row, j) => {
    if (row.length !== cols) throw new Error(`Stage ${label}: Zonenzeile ${j} hat ${row.length} Zeichen, erwartet ${cols}`);
  });
  for (const [w, kitId] of Object.entries(s.bossKits ?? {})) {
    if (!d.bosses?.kits.some((k) => k.id === kitId)) throw new Error(`Stage ${label}: Boss-Kit ${kitId} unbekannt`);
    const wave = s.waves[Number(w) - 1];
    if (!wave || !wave.groups.some((g) => g.type === 'boss')) throw new Error(`Stage ${label}: Boss-Kit ${kitId} an Welle ${w}, dort steht kein Boss`);
  }
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

/**
 * Führt Unit-Dateien zusammen (Reihenfolge = Dateinamen, alphabetisch): Units aneinandergehängt, Angriffs-Katalog vereinigt.
 * Doppelte Angriffs-IDs mit abweichendem Inhalt sind ein Fehler (`null`-Einträge = unbekannter Angriff, werden übersprungen).
 */
export function mergeUnitFiles(files: readonly UnitFile[]): UnitsData {
  const units: UnitData[] = [];
  const attacks: Record<string, AttackData> = {};
  const summons: Record<string, SummonData> = {};
  for (const f of files) {
    units.push(...f.units);
    for (const [id, sm] of Object.entries(f.summons)) {
      if (id in summons && JSON.stringify(summons[id]) !== JSON.stringify(sm)) throw new Error(`Beschwörung ${id} in mehreren Unit-Dateien mit verschiedenem Inhalt`);
      summons[id] = sm;
    }
    for (const [id, a] of Object.entries(f.attacks)) {
      if (a === null) continue;
      if (id in attacks && JSON.stringify(attacks[id]) !== JSON.stringify(a)) throw new Error(`Angriff ${id} in mehreren Unit-Dateien mit verschiedenem Inhalt`);
      attacks[id] = a;
    }
  }
  return { units, attacks, summons };
}

/** Lädt alle `data/units/*.json` (AA, Crossover, Beispiele ...) und führt sie zusammen. */
export function loadUnits(): UnitsData {
  const files: UnitFile[] = [];
  for (const f of readdirSync(DATA_DIR + 'units').sort()) {
    if (f.endsWith('.json')) files.push(UnitFileSchema.parse(readJson('units/' + f)));
  }
  return mergeUnitFiles(files);
}

/** Lädt alle Welt-Dateien (`data/worlds/*.json`) und die Wellen-Vorlage. */
export function loadWorlds(): { worlds: WorldFile[]; waveTemplate: WaveTemplate } {
  const worlds: WorldFile[] = [];
  for (const f of readdirSync(DATA_DIR + 'worlds').sort()) {
    if (f.endsWith('.json')) worlds.push(WorldFileSchema.parse(readJson('worlds/' + f)));
  }
  return { worlds, waveTemplate: WaveTemplateSchema.parse(readJson('wave-template.json')) };
}

/** Legend Stages und Raids (Runde 9 / P3: spielbar; Stages entstehen in `loadGameData` aus den Welten, `modes.ts`). */
export function loadModes(): { legend: LegendStagesData; raids: RaidsData } {
  return { legend: LegendStagesSchema.parse(readJson('modes/legend-stages.json')), raids: RaidsSchema.parse(readJson('modes/raids.json')) };
}

/** Lädt und validiert alle Daten inklusive aller Stages in data/stages/ und aller Welten (jede Welt ergibt Act-Stages und Infinite). */
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
  const { worlds, waveTemplate } = loadWorlds();
  for (const w of worlds) for (const s of expandWorld(w, waveTemplate)) stages[s.id] = StageSchema.parse(s);
  const modes = loadModes();
  for (const s of expandModes(modes.legend, modes.raids, worlds, waveTemplate)) stages[s.id] = StageSchema.parse(s);
  const data: GameData = {
    economy: EconomySchema.parse(readJson('economy.json')),
    enemies: EnemiesSchema.parse(readJson('enemies.json')),
    modifiers: ModifiersSchema.parse(readJson('modifiers.json')),
    difficulties: DifficultiesSchema.parse(readJson('difficulties.json')),
    challenges: ChallengesSchema.parse(readJson('challenges.json')),
    units: loadUnits(),
    effects: EffectsSchema.parse(readJson('effects.json')),
    bosses: BossesSchema.parse(readJson('bosses.json')),
    cards: CardsSchema.parse(readJson('cards.json')),
    stages,
    worlds,
    waveTemplate,
    modes,
  };
  validateGameData(data);
  return data;
}

/** Level-/Sterne-Kurven (Runde 7 / P2, `data/progression.json`); getrennt von `GameData`, damit die Sim-Daten unverändert bleiben. */
export function loadProgression(): ProgressionData {
  return ProgressionSchema.parse(readJson('progression.json'));
}
