/**
 * zod-Schemas aller Datendateien (sim/data/*.json).
 * Jede Gruppe trägt ein `ref` (Quelle in docs/comparison/recommendations.md) und optional `_comment`.
 * Alle Zahlen sind Festkomma-Ganzzahlen (Einheiten siehe sim/README.md).
 */
import { z } from 'zod';

const ref = z.string().min(1);
const comment = z.string().optional();
const int = z.number().int();
const nat = z.number().int().nonnegative();
const pos = z.number().int().positive();

export const EconomySchema = z.object({
  ref,
  _comment: comment,
  tickRate: z.literal(20),
  /**
   * Maßstab AA -> Match (Runde 8 / P1, Begründung docs/aa-import/massstab.md). `studsPerTile`: 1 Kachel = so viele AA-Studs
   * (Reichweite, Radius, Breite). `yenPerCoin`: 1 Match-Münze = so viele AA-Yen (Kosten, Farm-Ertrag); 1 = Werte unverändert.
   * Schaden, SPA und Sekunden werden unverändert übernommen.
   */
  scale: z.object({ ref, studsPerTile: z.number().positive(), yenPerCoin: z.number().positive() }),
  startCoins: pos,
  /**
   * Leben-System (Runde 4 / P2), ersetzt Base-HP. `start` + `metaBonus` (Meta-Ausbau, M3; bis dahin 0) = Maximum.
   * `regenPerWave`: Leben, die am Ende jeder Wave zurückkommen (höchstens bis zum Maximum).
   * `instantLoss`: Archetyp-IDs, deren Leak die Runde sofort beendet (Boss; Elite = Entscheidung, s. kalibrierung.md).
   */
  lives: z.object({ ref, start: pos, metaBonus: nat, regenPerWave: nat, instantLoss: z.array(z.string()) }),
  waveTimerTicks: pos,
  prepTicks: pos,
  waveBonus: z.object({ ref, base: nat, perWave: nat }),
  bounty: z.object({ ref, gammaStartBp: pos, gammaDecayBp: pos }),
  sell: z.object({ ref, combatBp: nat, farmBp: nat }),
  leakDamage: z.object({ ref }).catchall(nat.or(z.string())),
  coop: z.object({
    ref,
    hpPerExtraPlayerBp: nat,
    /** P5: optionale Tabelle des Koop-HP-Faktors je Spielerzahl (Index 0 = 1 Spieler, muss 10000 sein); überschreibt die lineare Formel. */
    hpTableBp: z.array(pos).min(1).optional(),
    /** P5: dasselbe nur für den Archetyp boss (getrennte Boss-HP-Skalierung); fehlt sie, gilt der normale Faktor. */
    bossHpTableBp: z.array(pos).min(1).optional(),
    /** P6b: optionale Tabelle für die Upgrade-Kosten der Kampf-Units je Spielerzahl (Index 0 = 1 Spieler, muss 10000 sein). Farm unberührt. */
    upgradeCostTableBp: z.array(pos).min(1).optional(),
    donationStep: pos,
    maxPlayers: pos,
  }),
  /** Infinite-Parameter (recommendations §3); fehlt der Block, gelten die Standardwerte aus compile.ts/infinite.ts. */
  infinite: z
    .object({
      ref,
      /** Pool je Wave in Milli-Grunt-Äquivalenten (32 000 = 32 Grunts). */
      poolMilli: pos,
      /** Pool einer Boss-Wave (Boss + Elite + Grunts). */
      bossPoolMilli: pos,
      speedPerWaveBp: nat,
      speedMaxBp: pos,
      enemyCap: pos,
    })
    .optional(),
  /** Runde 6 / P1: freie Platzierung. Unit-Radius je footprint (Milli-Tiles, Schlüssel "1"/"2") und Zusatzabstand zum Pfadrand. */
  placement: z.object({ ref, unitRadiusMilli: z.object({ '1': pos, '2': pos }), pathMarginMilli: nat }),
  /** Runde 6 / P2: steigende Platzierkosten je weiterer gleicher Unit des Spielers (Bp je Exemplar, linear). Fehlt/0 = aus. Unit-Feld `placeGrowthBp` überstimmt. */
  placeCostGrowthBp: nat.optional(),
  /** Anzahl Exemplare je Typ und Spieler, die noch den Basispreis kosten (Exemplar Nr. k > free kostet Basis x (1 + Zuwachs x (k - free))). Fehlt oder < 1: wirkt wie 1 (das erste Exemplar kostet immer den Basispreis). */
  placeCostFreeCopies: nat.optional(),
  caps: z.object({ ref, teamUnits: pos, teamSlots: pos, enemies: pos }),
  cc: z.object({
    ref,
    stunTicks: pos,
    stunImmuneTicks: nat,
    slowMaxBp: nat,
    bossCcBp: pos,
  }),
  /** DoT: ein Tick je `intervalTicks`; `maxStacks`: höchstens so viele gleichzeitige Instanzen je Gegner und Art (verschiedene Units stapeln, dieselbe Unit erneuert nur). */
  dot: z.object({ ref, intervalTicks: pos, bossEliteBp: pos, maxStacks: pos.default(12) }),
  regen: z.object({ ref, perSecondBp: nat }),
  buffCaps: z.object({ ref, damageBp: nat, tempoBp: nat, rangeBp: nat, vulnerableBp: nat }),
  damage: z.object({
    ref,
    minDamageCenti: pos,
    armorBase: pos,
    critDefaultMultBp: pos,
  }),
  targeting: z.object({ ref, enemyRadiusMilli: nat, strongestShieldBp: nat }),
});
export type EconomyData = z.infer<typeof EconomySchema>;

export const EnemyArchetypeSchema = z.object({
  id: z.string(),
  ref,
  _comment: comment,
  fHpBp: pos,
  fSpeedBp: pos,
  armor: nat,
  leak: nat,
  flying: z.boolean(),
  boss: z.boolean(),
  elite: z.boolean(),
  child: z.object({ type: z.string(), count: pos }).optional(),
  /** Runde 8 / P1: Schwächen (je Element/Damage-Typ Bp Zusatzschaden, additiv: Faktor = 1 + Summe) und Resistenzen (R je Element/Damage-Typ, Faktor 100/(100+R); True ignoriert sie). */
  weakBp: z.record(z.string(), pos).default({}),
  resist: z.record(z.string(), nat).default({}),
});
export const EnemiesSchema = z.object({
  ref,
  _comment: comment,
  hpCurve: z.object({ ref, baseCenti: pos, growthBp: pos }),
  baseSpeedMilliPerSec: pos,
  /** Wave-Element 1..5 (Stage-Gruppen, wirkt ab `elementsActive`) -> AA-Element. */
  waveElements: z.array(z.string()).length(5).default(['fire', 'ice', 'lightning', 'water', 'air']),
  /** Zusätzliche Schwächen/Resistenzen eines Gegners mit diesem Element (zu denen seines Archetyps addiert). */
  elementAffinity: z
    .record(z.string(), z.object({ weakBp: z.record(z.string(), pos).default({}), resist: z.record(z.string(), nat).default({}) }))
    .default({}),
  archetypes: z.array(EnemyArchetypeSchema).min(1),
});
export type EnemyArchetype = z.infer<typeof EnemyArchetypeSchema>;
export type EnemiesData = z.infer<typeof EnemiesSchema>;

export const ModifiersSchema = z.object({
  ref,
  _comment: comment,
  shield: z.object({ ref, maxStacks: pos }),
  regen: z.object({ ref, stoppedBy: z.array(z.enum(['bleed', 'burn', 'poison', 'wither'])) }),
  armored: z.object({ ref, armorBonus: nat }),
  fast: z.object({ ref, speedBp: pos }),
});
export type ModifiersData = z.infer<typeof ModifiersSchema>;

const bp = z.number().int().min(0).max(10000);
const ModifierId = z.string().regex(/^(shield:\d+|regen|armored|fast)$/);

/** Modifier-Vergabe je Stufe (Runde 4 / P3): Anteil regulärer Gruppen (nicht Boss/Elite), die ab `fromWave` einen Modifier bekommen. */
export const DifficultyModifiersSchema = z.object({
  densityBp: bp,
  fromWave: pos,
  pool: z.array(z.object({ id: ModifierId, weight: pos })),
});
/** Wellen-Variante: pro Wave (seeded, deterministisch) mit `chanceBp` gewählt; höchstens eine je Wave. */
export const WaveVariantSchema = z.object({
  id: z.string().min(1),
  chanceBp: bp,
  fromWave: pos,
  /** Anzahl-Faktor auf alle regulären Gruppen (Basispunkte, floor, mindestens 1). */
  countBp: pos.default(10000),
  /** Spawn-Abstand-Faktor (Basispunkte, < 10000 = dichter). */
  intervalBp: pos.default(10000),
  /** Tauscht `shareBp` der Gegner des Typs `from` gegen Typ `to` (eigene Gruppe, gleicher Start). */
  swap: z.object({ from: z.string(), to: z.string(), shareBp: bp }).optional(),
  /** Setzt diesen Modifier auf alle regulären Gruppen der Wave, die noch keinen haben (ganze Wave gepanzert/geschirmt/schnell). */
  forceModifier: ModifierId.optional(),
});
export const DifficultySchema = z.object({
  ref,
  _comment: comment,
  /** Feinjustierung (Runde 4 / P3): Stufen unterscheiden sich über Regeln, nicht über diesen Faktor. */
  hpBp: pos,
  /** Runde 4 / P6: Koop-HP-Faktor je Spielerzahl für diese Stufe (Index 0 = 1 Spieler, muss 10000 sein); fehlt er, gilt `economy.coop.hpTableBp`. */
  coopHpTableBp: z.array(pos).min(1).optional(),
  /** Dasselbe nur für den Archetyp boss; fehlt es, gilt `economy.coop.bossHpTableBp` bzw. der normale Koop-Faktor. */
  coopBossHpTableBp: z.array(pos).min(1).optional(),
  speedBp: pos,
  elementsActive: z.boolean(),
  /** `wave`: alle Gruppen einer Wave teilen ein Element; `mixed`: Element je Gruppe versetzt (Gegenwehr braucht mehrere Elemente). */
  elementMode: z.enum(['wave', 'mixed']).default('wave'),
  modifiers: DifficultyModifiersSchema.default({ densityBp: 0, fromWave: 1, pool: [] }),
  waveVariants: z.array(WaveVariantSchema).default([]),
  /** Boss-Fähigkeiten-Set (0 = Basis, 1 = erweitert, 2 = voll). Schnittstelle für P4 (Boss-Kits); die Sim wertet es noch nicht aus. */
  bossAbilityTier: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
  /** Überschreibt `economy.lives` je Stufe (nur gesetzte Felder). */
  lives: z.object({ start: pos.optional(), regenPerWave: nat.optional(), instantLoss: z.array(z.string()).optional() }).default({}),
  /** Münz-Faktor auf Kill-Bounties (Basispunkte). */
  bountyBp: pos.default(10000),
  /** Belohnungsfaktor für Meta-Belohnungen (XP/Gems am Rundenende, M3); in der Sim nur Datenfeld. */
  rewardBp: pos.default(10000),
});
export const DifficultiesSchema = z.object({
  ref,
  normal: DifficultySchema,
  hard: DifficultySchema,
  nightmare: DifficultySchema,
});
export type DifficultyId = 'normal' | 'hard' | 'nightmare';
export type DifficultyDef = z.infer<typeof DifficultySchema>;
export type WaveVariant = z.infer<typeof WaveVariantSchema>;
export type DifficultiesData = z.infer<typeof DifficultiesSchema>;

const Modifier = z.string().regex(/^(shield:\d+|regen|armored|fast)$/);

export const StageSchema = z.object({
  ref,
  _comment: comment,
  id: z.string(),
  name: z.string(),
  waveTimerTicks: pos.optional(),
  /** Infinite-Modus: Waves ab Wave (waves.length+1) werden seeded erzeugt, kein Sieg (recommendations §3/§4). */
  infinite: z.boolean().optional(),
  /** Waypoints in Tiles (Tile-Mitten, dürfen .5 haben); werden zu Milli-Tiles. */
  path: z.array(z.tuple([z.number(), z.number()])).min(2),
  /** Breite des Pfadbands in Tiles (Gesamtbreite; die Hälfte links und rechts der Polylinie sperrt die Platzierung). */
  pathWidth: z.number().positive().default(1),
  /**
   * Zonen (Runde 6 / P1) als Kachelmaske im Raster des Clients: Zeile = y, Spalte = x, Kachel (x, y) ist um die Sim-Koordinate (x, y)
   * zentriert. `.` Boden, `h` Hügel, `#` blockiert, `p` Pfadkachel (nur Anzeige). Der Rasterrand ist der Kartenrand.
   */
  zones: z.object({ ref: z.string().optional(), rows: z.array(z.string().regex(/^[.hp#]+$/)).min(1) }),
  /** Altbestand (Runden 1-5): Positionen der festen Slots. Keine Platzierregel mehr; Fallback für den Client bis P3 und Konsistenztest. */
  slots: z
    .array(
      z.object({
        id: nat,
        x: z.number(),
        y: z.number(),
        kind: z.enum(['ground', 'hill']),
        size: z.union([z.literal(1), z.literal(2)]),
      }),
    )
    .default([]),
  waves: z
    .array(
      z.object({
        n: pos,
        groups: z.array(
          z.object({
            type: z.string(),
            count: pos,
            intervalTicks: nat,
            delayTicks: nat,
            modifiers: z.array(Modifier),
            /** 0 = neutral, 1..5 = Element im Zyklus (wirkt ab Hard). */
            element: z.number().int().min(0).max(5),
          }),
        ),
      }),
    )
    .min(1),
});
export type StageData = z.infer<typeof StageSchema>;

// ---------------------------------------------------------------------------------------------------------------------------------
// Unit-Format (Runde 8 / P1): AA-nah. Werte in AA-Einheiten (Yen, Schaden, Sekunden, Studs); `compile.ts` rechnet sie mit den
// Konstanten aus `economy.json` (`scale`) in Festkomma um. Unbekannte Zusatzfelder (AA-Rohdaten) werden beim Parsen verworfen.
// ---------------------------------------------------------------------------------------------------------------------------------

/** Die 8 AA-Elemente (Reihenfolge fest: Index in Affinitätstabellen). */
export const ELEMENTS = ['dark', 'fire', 'lightning', 'ice', 'air', 'light', 'water', 'rose'] as const;
export type Element = (typeof ELEMENTS)[number];
export const UNIT_RARITIES = ['Rare', 'Epic', 'Legendary', 'Mythic', 'Secret', 'Exclusive'] as const;
export type UnitRarity = (typeof UNIT_RARITIES)[number];

const optNum = z.number().nullish();
const optPos = z.number().positive().nullish();

/** DoT eines Angriffs (AA-Feld `dot`): je Treffer `hitDamage x multiplierPerTick x ticks`, ein Tick je `economy.dot.intervalTicks`. */
export const DotSchema = z.object({
  type: z.enum(['Burn', 'Bleed', 'Poison', 'Wither']),
  multiplierPerTick: z.number().nonnegative(),
  ticks: z.number().int().positive(),
  totalMultiplier: optNum,
});
export type DotData = z.infer<typeof DotSchema>;

/** Spezialeffekt eines Angriffs (AA-Feld `special`): `name` = Schlüssel im Effekt-Katalog (`effects.json`); die Felder überstimmen dessen Standardwerte. */
export const SpecialSchema = z.object({
  name: z.string().min(1),
  /** Sekunden. */
  duration: optPos,
  /** Stärke 0..1 (Slow: Anteil Tempoverlust). */
  influence: optPos,
  /** Wahrscheinlichkeit 0..1 je getroffenem Gegner (nur Effekte mit Wurf). */
  chance: optPos,
});
export type SpecialData = z.infer<typeof SpecialSchema>;

/** Angriffsform (AA-Katalog `attacks`). `aoe` fehlend/null = single. Zahlen in Studs bzw. Grad. */
export const AttackSchema = z.object({
  aoe: z.enum(['single', 'circle', 'cone', 'line', 'full']).nullish(),
  /** circle: Radius um das Ziel (Studs). */
  radius: optPos,
  /** cone: Gesamtwinkel ab der Unit (Grad), Länge = Range. */
  angle: z.number().min(1).max(180).nullish(),
  /** line: Breite (Studs), ab der Unit Richtung Ziel, Länge = Range. */
  width: optPos,
  /** Anzahl Treffer: der Schaden wird auf die Treffer geteilt, nicht vervielfacht. */
  hits: z.number().int().min(1).max(30).nullish(),
  dot: DotSchema.nullish(),
  special: z.union([SpecialSchema, z.array(SpecialSchema)]).nullish(),
});
export type AttackData = z.infer<typeof AttackSchema>;

export const UnitLevelSchema = z.object({
  /** 0 = Platzierung, 1..n = Upgrades (Reihenfolge im Array = Stufe). */
  level: z.number().int().nonnegative(),
  /** Yen dieser Stufe (Stufe 0: Platzierung, sonst Upgrade-Preis). */
  cost: optNum,
  /** Schaden je Angriff (AA-Einheiten, wird auf `hits` geteilt). Fehlend = Vorwert. */
  damage: optNum,
  /** Sekunden pro Angriff. Fehlend = Vorwert. */
  spa: optNum,
  /** Reichweite in Studs. Fehlend = Vorwert. */
  range: optNum,
  /** Angriffs-ID aus dem Katalog. Fehlend = Vorwert (wechselnde Angriffe je Stufe: einfach andere ID eintragen). */
  attack: z.string().nullish(),
  /** Farm-Units: Yen je Wave. */
  farm: optNum,
  note: z.string().nullish(),
});

/**
 * AA-Rohdaten werden ohne Umbau gelesen: `nameRR` gilt als `name`, `secondaryDamageTypes` als `elements`. Alle übrigen AA-Felder
 * (dps, cumulativeCost, extra, meta ...) kennt das Schema nicht und verwirft sie beim Parsen.
 */
const aaAlias = (v: unknown): unknown => {
  if (!v || typeof v !== 'object') return v;
  const o = { ...(v as Record<string, unknown>) };
  if (o.name === undefined && typeof o.nameRR === 'string') o.name = o.nameRR;
  if (o.elements === undefined && o.secondaryDamageTypes !== undefined) o.elements = o.secondaryDamageTypes;
  return o;
};

export const UnitSchema = z.preprocess(aaAlias, z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rarity: z.enum(UNIT_RARITIES),
  placement: z.enum(['ground', 'hill', 'hybrid']),
  /** AA: `true_damage` wird als `true` gelesen; fehlend = physical. */
  damageType: z
    .enum(['physical', 'magic', 'true', 'true_damage'])
    .nullish()
    .transform((v): 'physical' | 'magic' | 'true' => (v === 'true_damage' ? 'true' : (v ?? 'physical'))),
  /** AA `secondaryDamageTypes`: die Elemente der Unit. */
  elements: z.array(z.enum(ELEMENTS)).nullish().transform((v) => v ?? []),
  /** Crit-Chance 0..1 und Multiplikator (fehlend: `economy.damage.critDefaultMult`). */
  critChance: z.number().min(0).max(1).nullish(),
  critDamage: z.number().min(1).nullish(),
  /** Gelesen, NICHT durchgesetzt (Entscheidung Max 07.10.2026: kein Typ-Limit). */
  spawnCap: z.number().int().nullish(),
  spawnCapGlobal: z.boolean().nullish(),
  /** 1 = normal (Radius `economy.placement.unitRadiusMilli["1"]`), 2 = groß. */
  footprint: z.union([z.literal(1), z.literal(2)]).default(1),
  /** Überstimmt die Platzier-Regel (Standard: Boden trifft keine Flieger, Hügel/Hybrid schon). */
  /** Zuwachs der Platzierkosten je weiterer eigener Unit gleichen Typs (Bp), überstimmt `economy.placeCostGrowthBp`. */
  placeGrowthBp: z.number().int().nonnegative().nullish(),
  hitsAir: z.boolean().nullish(),
  unsellable: z.boolean().nullish(),
  /** Rein beschreibend (Katalog/UI), die Sim wertet es nicht aus. */
  flavor: z.string().nullish(),
  levels: z.array(UnitLevelSchema).min(1),
  evolvedFrom: z.string().nullish(),
  evolution: z.unknown().optional(),
  limited: z.boolean().nullish(),
  hideFromBanner: z.boolean().nullish(),
  rateupBannerOnly: z.boolean().nullish(),
  shinyVariant: z.boolean().nullish(),
  imageQuery: z.string().nullish(),
  source: z.string().nullish(),
  /** Importer (P2): `full` = voll modelliert, `limited` = spielbar mit Lücken (`supportNotes`), `hidden` = ohne Kampf-/Farm-Wirkung, nicht im Gacha. Die Sim wertet es nicht aus. */
  support: z.enum(['full', 'limited', 'hidden']).nullish(),
  supportNotes: z.array(z.string()).nullish(),
}));
export type UnitData = z.infer<typeof UnitSchema>;
export type UnitLevelData = z.infer<typeof UnitLevelSchema>;

/** Eine Datei in `sim/data/units/`: Units plus ihr Angriffs-Katalog. Alle Dateien werden zusammengeführt, Angriffs-IDs sind global. */
export const UnitFileSchema = z.object({
  ref: z.string().optional(),
  _comment: comment,
  units: z.array(UnitSchema).default([]),
  attacks: z.record(z.string(), AttackSchema.nullable()).default({}),
});
export type UnitFile = z.infer<typeof UnitFileSchema>;

export interface UnitsData {
  units: UnitData[];
  attacks: Record<string, AttackData>;
}

/**
 * Effekt-Katalog (`sim/data/effects.json`, Runde 8 / P1): ein Eintrag je AA-Effekt (`units.json.effects`), Parameter in Daten.
 * Sekunden/Anteile wie im AA-Datensatz; ein Angriff kann `duration`/`influence`/`chance` je Treffer überstimmen.
 * `immuneSec`: Sperre nach Ablauf auf demselben Gegner (Gruppe: stun, freeze, timestop, walkback teilen sich eine Sperre).
 */
const Sec = z.number().nonnegative();
export const EffectDefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('slow'), durationSec: Sec, influence: z.number().positive().max(1), immuneSec: Sec }),
  z.object({ kind: z.enum(['stun', 'freeze', 'timestop']), durationSec: Sec, immuneSec: Sec }),
  /** Bewusstlos: Gegner steht, keine Sperre, stapelt mit den anderen CC. */
  z.object({ kind: z.literal('unconscious'), durationSec: Sec }),
  /** Rückwärtslaufen. `chance` < 1 würfelt je Gegner über die Sim-PRNG. */
  z.object({ kind: z.literal('walkback'), durationSec: Sec, chance: z.number().positive().max(1), immuneSec: Sec }),
  z.object({ kind: z.literal('knockback'), distanceTiles: z.number().positive(), immuneSec: Sec }),
  /** Mehr erhaltener Schaden einer Schadensart (`magic`/`physical`); `durationSec` 0 = dauerhaft. Stärkster gewinnt, kein Stapeln. */
  z.object({ kind: z.literal('curse'), damageType: z.enum(['magic', 'physical']), percent: z.number().positive(), durationSec: Sec }),
  z.object({ kind: z.literal('bleedAmp'), durationSec: Sec, factor: z.number().positive() }),
  z.object({ kind: z.literal('overCrit') }),
  /** Selbst-Buff je Angriff: +stepPercent je Angriff bis maxPercent (`maxPercentAtMaxLevel` auf der letzten Stufe), solange die Unit ein Ziel hat. */
  z.object({ kind: z.literal('battlelust'), stepPercent: z.number().positive(), maxPercent: z.number().positive() }),
  z.object({ kind: z.literal('snatched'), stepPercent: z.number().positive(), maxPercent: z.number().positive(), maxPercentAtMaxLevel: z.number().positive(), durationSec: Sec }),
  /** Wächst je beendeter Wave bis `maxWaves`: Schaden und Reichweite steigen linear bis auf die Faktoren. */
  z.object({ kind: z.literal('sunshine'), maxWaves: z.number().int().positive(), damageFactor: z.number().positive(), rangeFactor: z.number().positive() }),
  /** Jeder Angriff stärkt alle Verbündeten in der Reichweite der Unit. */
  z.object({ kind: z.literal('motivate'), damagePercent: z.number().nonnegative(), rangePercent: z.number().nonnegative(), durationSec: Sec }),
  z.object({ kind: z.literal('shatter') }),
  /** Heilung (Regen) des Gegners gesperrt. */
  z.object({ kind: z.literal('wither'), durationSec: Sec }),
  /** DoT als Effekt (Hilfseintrag für Wild Card; Angriffe tragen ihren DoT im Feld `dot`). Gesamt = multiplierPerTick x ticks x Treffer-Schaden. */
  z.object({ kind: z.literal('dot'), type: z.enum(['Burn', 'Bleed', 'Poison', 'Wither']), multiplierPerTick: z.number().positive(), ticks: z.number().int().positive() }),
  /** Zufälliger Effekt aus `pool` (Katalog-Namen), gewürfelt mit der Sim-PRNG. */
  z.object({ kind: z.literal('wildcard'), pool: z.array(z.string()).min(1) }),
]);
export type EffectDef = z.infer<typeof EffectDefSchema>;
export const EffectsSchema = z.object({
  ref,
  _comment: comment,
  effects: z.record(z.string(), EffectDefSchema),
});
export type EffectsData = z.infer<typeof EffectsSchema>;

/**
 * Challenges (vorbereitetes Datenkonzept, Runde 4 / P3): eine Stufe als Basis plus Regel-Überschreibungen und Einschränkungen.
 * Die Sim wertet sie noch nicht aus; sie werden nur geladen und auf Querverweise geprüft.
 */
export const ChallengesSchema = z.object({
  ref,
  _comment: comment,
  challenges: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      extends: z.enum(['normal', 'hard', 'nightmare']),
      /** Überschreibt Felder der Basis-Stufe (z. B. lives, modifiers, waveVariants, bossAbilityTier). */
      overrides: DifficultySchema.partial().default({}),
      restrictions: z.object({ bannedUnits: z.array(z.string()).default([]), maxTeamSlots: pos.optional(), noSell: z.boolean().default(false) }).default({ bannedUnits: [], noSell: false }),
      rewardBp: pos.default(10000),
    }),
  ),
});
export type ChallengesData = z.infer<typeof ChallengesSchema>;

/**
 * Boss-Kits (Runde 4 / P4, K5). Ein Kit gehört zu einer Wave der Stage (`wave`), gilt für den Archetyp `boss` und besteht aus
 * Phasen (HP-Schwellen), Phasen-Aktionen (Schild "ward", Beschwörung, Fenster) und Fähigkeiten mit Telegraph.
 * Schnittstelle für Schwierigkeitsstufen: jede Aktion/Fähigkeit hat `minDifficulty` (Standard normal); darunter ist sie aus.
 */
const DifficultyName = z.enum(['normal', 'hard', 'nightmare']);
/** Schwachstellen-Fenster: `bp` = Schadensfaktor; `armor` (Runde 5 / P3, optional) = Rüstung des Bosses, solange das Fenster offen ist (z. B. 0 = Panzer offen). */
const Window = z.object({ ticks: pos, bp: pos, armor: nat.optional() });
const PhaseAction = z.discriminatedUnion('kind', [
  /** Schild-Phase: absorbiert `hpBp` der Max-HP; läuft nach `expireTicks` ab; bricht er, öffnet sich ein Fenster. */
  z.object({
    kind: z.literal('ward'),
    hpBp: pos,
    expireTicks: pos,
    window: Window,
    minDifficulty: DifficultyName.default('normal'),
  }),
  z.object({ kind: z.literal('summon'), type: z.string(), count: pos, minDifficulty: DifficultyName.default('normal') }),
  z.object({ kind: z.literal('window'), window: Window, minDifficulty: DifficultyName.default('normal') }),
  /** Rüstungsphase (Runde 5 / P3): setzt die Rüstung des Bosses (absolut) bis zum nächsten Phasenwechsel; Fenster mit `armor` überstimmen sie. */
  z.object({ kind: z.literal('armor'), value: nat, minDifficulty: DifficultyName.default('normal') }),
]);
const AbilityBase = {
  id: z.string(),
  name: z.string(),
  /** Aktiv ab dieser Phase (Index) bis einschließlich `toPhase` (Standard: bis zum Ende). */
  fromPhase: nat.default(0),
  toPhase: nat.optional(),
  /** Ticks nach Spawn bzw. nach Phasenbeginn bis zum ersten Einsatz. */
  firstTicks: pos,
  cooldownTicks: pos,
  /** Vorwarnzeit (Ticks) zwischen Telegraph-Ereignis und Wirkung. */
  telegraphTicks: pos,
  /** Ein erfolgreicher Stun des Bosses während des Telegraphs bricht die Fähigkeit ab. */
  interruptible: z.boolean().default(false),
  /**
   * Zerstörbare Wirkung (Runde 5 / P3, Dauerschaden-Antwort): richtet das Team während des Telegraphs mindestens `staggerBp` der Max-HP
   * (Basispunkte, inkl. Schild-Absorption und Fenster-Faktor) an Schaden an, ist die Fähigkeit unterbrochen (`bossCast.cause: "damage"`),
   * ohne dass ein Stun nötig ist. Setzt `interruptible` voraus. Eine Heilung (`mend`) schrumpft linear mit dem bisherigen Schaden.
   */
  staggerBp: pos.optional(),
  /** Fenster nach der Wirkung (bei `charge`: wenn der Sturm endet). */
  window: Window.optional(),
  /** Fenster, wenn die Fähigkeit unterbrochen wurde. */
  interruptWindow: Window.optional(),
  /** Runde 5 / P3: Wird die Fähigkeit unterbrochen (Stun oder Schaden), steht der Boss so viele Ticks still (umgeht die Stun-Sperre). */
  interruptStunTicks: pos.optional(),
  minDifficulty: DifficultyName.default('normal'),
};
const BossAbility = z.discriminatedUnion('kind', [
  z.object({ ...AbilityBase, kind: z.literal('summon'), type: z.string(), count: pos }),
  z.object({ ...AbilityBase, kind: z.literal('charge'), speedBp: pos, durationTicks: pos }),
  z.object({ ...AbilityBase, kind: z.literal('mend'), healBp: pos }),
]);
export const BossKitSchema = z.object({
  id: z.string(),
  name: z.string(),
  _comment: comment,
  /** Wave der Stage, in der der Boss mit diesem Kit erscheint. */
  wave: pos,
  phases: z
    .array(z.object({ id: z.string(), name: z.string(), fromHpBp: pos.max(10000), onEnter: z.array(PhaseAction).default([]) }))
    .min(1),
  abilities: z.array(BossAbility).default([]),
});
export const BossesSchema = z.object({ ref, _comment: comment, kits: z.array(BossKitSchema) });
export type BossKit = z.infer<typeof BossKitSchema>;
export type BossAbility = z.infer<typeof BossAbility>;
export type BossPhaseAction = z.infer<typeof PhaseAction>;
export type BossesData = z.infer<typeof BossesSchema>;

/**
 * Risikokarten (Runde 4 / P4, K1): vor einer Wave wählbar, wirken auf alle Gegner dieser Wave. Alle Faktoren in Basispunkten
 * (10000 = x1). `addModifiers` fügt Modifier hinzu (nur wo die Gruppe die Art nicht schon hat; nie auf Boss/Elite).
 */
export const RiskCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  text: z.string(),
  /** Grobe Stärke 1 (mild) bis 3 (hart), nur Bot-Strategie und UI-Sortierung. */
  tier: z.number().int().min(1).max(3),
  hpBp: pos.default(10000),
  speedBp: pos.default(10000),
  /** Anzahl je Gruppe: ceil(count * countBp / 10000). */
  countBp: pos.default(10000),
  bountyBp: pos.default(10000),
  /** Lebenskosten normaler Leaks (Boss-Sofortverlust bleibt). */
  leakBp: pos.default(10000),
  addModifiers: z.array(Modifier).default([]),
});
export const CardsSchema = z.object({ ref, _comment: comment, cards: z.array(RiskCardSchema).min(1) });
export type RiskCard = z.infer<typeof RiskCardSchema>;
export type CardsData = z.infer<typeof CardsSchema>;

export interface GameData {
  economy: EconomyData;
  enemies: EnemiesData;
  modifiers: ModifiersData;
  difficulties: DifficultiesData;
  /** Optional; nur Datenkonzept (P3). */
  challenges?: ChallengesData;
  units: UnitsData;
  /** Effekt-Katalog (`effects.json`). */
  effects: EffectsData;
  stages: Record<string, StageData>;
  /** Runde 4 / P4. Optional, damit alte Datenobjekte (Tests, Overrides) ohne Kits weiter laufen. */
  bosses?: BossesData;
  cards?: CardsData;
}
export { int };

/**
 * Bot-Profile (Runde 4 / P6): Fehlermodell der Bots. Nur Bot-Verhalten, nie Sim-Regeln; die Datei gehört nicht zu `GameData`
 * (`loadBotProfiles` in `load.ts`). Zeiten in Sekunden (Bots entscheiden einmal je Sekunde), Wahrscheinlichkeiten in Basispunkten.
 * Alle Würfe laufen über den eigenen, geseedeten PRNG des Bots (nicht den Sim-PRNG).
 */
const secRange = z.tuple([z.number().int().min(0), z.number().int().min(0)]).refine(([a, b]) => a <= b, 'min <= max');
export const BotProfileSchema = z.object({
  ref: z.string().optional(),
  /** Zusätzliche Pause (Sekunden, gleichverteilt min..max) zwischen zwei Kaufrunden (Platzieren, Upgraden, Farm, Verkaufen). [0,0] = jede Sekunde. */
  buyDelaySec: secRange,
  /** Chance je Platzierung, statt des besten einen zufälligen anderen (bezahlbaren, nützlichen) Slot für dieselbe Unit zu nehmen. */
  worsePositionBp: z.number().int().min(0).max(10000),
  /** Chance je Unit und Wave, dass der Bot Upgrades dieser Unit in dieser Wave vergisst. */
  forgetUpgradeBp: z.number().int().min(0).max(10000),
  /** Verspätung (Sekunden, gleichverteilt) zwischen "Fähigkeit wäre sinnvoll" und dem Zünden. */
  abilityDelaySec: secRange,
  /** Wellenwissen: so viele Waves (ab der laufenden) liest der Bot per `previewWave` voraus. 0 = kein Wellenwissen: er reagiert erst, wenn der Boss da ist. */
  lookahead: z.number().int().min(0).max(20),
});
export type BotProfile = z.infer<typeof BotProfileSchema>;
export const BotProfilesSchema = z.object({
  ref: z.string().optional(),
  _comment: z.string().optional(),
  profiles: z.record(z.string(), BotProfileSchema),
});

/**
 * Meta-Fortschritt je Unit (Runde 7 / P2, `data/progression.json`): Level 1-40 und Sterne 1-5 -> Schadens-Faktor.
 * Gehört nicht zu `GameData` (wie die Bot-Profile; `loadProgression` in `load.ts`, im Client/Meta als JSON-Import).
 * Wirkung nur über `UnitMod.lvlBp`: Faktor = 10000 + levelDamageBpPerLevel * (Level - 1) + starDamageBp[Sterne - 1] (additiv, rec §15).
 * Gilt für jede Unit gleich, keine Unit-Liste.
 */
export const ProgressionSchema = z
  .object({
    ref,
    _comment: comment,
    maxLevel: pos,
    /** Schadens-Zuwachs je Level über Level 1 in Basispunkten (rec §15: 250 = +2,5 %). */
    levelDamageBpPerLevel: nat,
    /** Kopien, ab denen Stern i+1 erreicht ist (streng steigend, Eintrag 0 = 1: die erste Kopie ist Stern 1). */
    starCopies: z.array(pos).min(1),
    /** Zusatzschaden je Stern in Basispunkten, Länge = starCopies, Stern 1 = 0 (neutral). */
    starDamageBp: z.array(nat).min(1),
  })
  .superRefine((p, ctx) => {
    const bad = (m: string): void => void ctx.addIssue({ code: 'custom', message: m });
    if (p.starCopies.length !== p.starDamageBp.length) bad('starCopies und starDamageBp müssen gleich lang sein');
    if (p.starCopies[0] !== 1) bad('starCopies[0] muss 1 sein');
    if (p.starDamageBp[0] !== 0) bad('starDamageBp[0] muss 0 sein (Stern 1 = neutral)');
    for (let i = 1; i < p.starCopies.length; i++) {
      if (p.starCopies[i] <= p.starCopies[i - 1]) bad('starCopies muss streng steigen');
      if (p.starDamageBp[i] < p.starDamageBp[i - 1]) bad('starDamageBp darf nicht fallen');
    }
  });
export type ProgressionData = z.infer<typeof ProgressionSchema>;
