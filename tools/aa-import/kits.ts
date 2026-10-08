/**
 * Fähigkeiten-Kits (Runde 9 / P1): was die AA-Rohdaten nur als Marke kennen (`extra.active_attack`, `spawn_unit`, `aura_buff` ...), ohne Zahlen
 * dazu, steht hier als Datensatz im Baukasten (`sim/src/data/schema.ts`: `AbilitySchema`, `AuraSchema`, `SummonSchema`).
 *
 * **Quelle der Zahlen:** AA kennt je Fähigkeit nur Namen, Abklingzeit (`active_attack_stats`) und Dauer. Wirkung, Stärke und Reichweite sind
 * DESIGN (Annahmen, in `docs/aa-import/unsupported.md` gesammelt); die Namen und Abklingzeiten sind AA. Neue Kits: einen Eintrag in `KITS` ergänzen,
 * `npm run aa-import` laufen lassen, fertig.
 *
 * `handles`: welche Einstufungs-Gründe (`support.ts`) das Kit erledigt; `leaves`: Gründe, die bleiben (die Unit bleibt `limited`).
 */

type Json = Record<string, unknown>;

export interface Kit {
  abilities?: Json[];
  /** Aura (ein Eintrag oder je Stufe eine Liste). */
  aura?: Json | Json[];
  /** Gründe aus `support.ts`, die dieses Kit löst. */
  handles?: string[];
  /** Gründe, die trotz Kit bleiben. */
  leaves?: string[];
  /** Zweitangriffe, die ab Stufe 0 immer mitlaufen (AA `secondary_attacks`). */
  alsoAlways?: string[];
  /** Einzeiler für den Bericht: wie die Unit modelliert ist. */
  how: string;
}

/** Effekt-Zusätze für vorhandene Angriffe (id -> special, wird an den AA-Angriff gehängt). */
export const ATTACK_FX: Record<string, Json | Json[]> = {
  // Kento "Overtime": mit jeder Wave mehr Schaden (Effekt-Katalog: Overtime)
  'kento:punch': { name: 'Overtime' },
  'kento:precision_slash': { name: 'Overtime' },
  'kento:collapse': { name: 'Overtime' },
  'kento:multiple_slashes': { name: 'Overtime' },
};

/** Angriffe ohne Details in AA (`null`) und neue Angriffe der Kits. IDs der Kits beginnen mit `kit:`. */
export const KIT_ATTACKS: Record<string, Json> = {
  'kit:hit': { aoe: 'single' },
  'giselle:three': { aoe: 'circle', radius: 10, hits: 3 },
  'carrot:two': { aoe: 'circle', radius: 6 },
  'kit:dazai_null': { aoe: 'full', special: [{ name: 'Shatter' }, { name: 'Slow', duration: 8, influence: 0.5 }] },
  'kit:aizen_illusion': { aoe: 'full', special: { name: 'Confused', duration: 10 } },
  'kit:rumbling': { aoe: 'full' },
  'kit:law_shambles': { aoe: 'circle', radius: 20, special: [{ name: 'Knockback' }, { name: 'Stun', duration: 2 }] },
  'kit:gojo_domain': { aoe: 'full', special: { name: 'Stun', duration: 8 } },
  'kit:homura_stop': { aoe: 'full', special: { name: 'Timestop', duration: 4 } },
  'kit:aizen_beyond': { aoe: 'full', special: { name: 'Cursed (30%)' } },
  'kit:dio_stop': { aoe: 'full', special: { name: 'Timestop', duration: 6 } },
  'kit:julius_clock': { aoe: 'full', special: { name: 'Slow', duration: 5, influence: 0.8 } },
  'kit:founding_roar': { aoe: 'full' },
  'kit:titan_stomp': { aoe: 'circle', radius: 20 },
  'kit:rika_claw': { aoe: 'circle', radius: 10 },
  'kit:femto_sacrifice': { aoe: 'full' },
};

/** Die 11 AA-Beschwörungen (`kind: "summon"`) plus Rika (Yuta, eigene Annahme) als Wesen mit Körper. Zahlen: DESIGN, Namen/Reichweiten/Tempo aus AA. */
export const SUMMONS: Record<string, Json> = {
  taurus: { name: 'Taurus', mode: 'walk', damageMult: 1, spa: 4, range: 8, attack: 'lucy_taurus:smash', lifetime: 25, durability: 20, blocks: true, speed: 1, maxAlive: 1 },
  leo: { name: 'Leo', mode: 'stand', damageType: 'magic', elements: ['light'], damageMult: 0.8, spa: 7.5, range: 25, attack: 'lucy_leo:projectiles', lifetime: 25, blocks: false, maxAlive: 1 },
  aquarius: { name: 'Aquarius', mode: 'stand', damageType: 'magic', elements: ['water'], damageMult: 0.8, spa: 6, range: 30, attack: 'lucy_aquarius:splash', lifetime: 25, blocks: false, maxAlive: 1 },
  dark_young: { name: 'Dark Young', mode: 'walk', damageMult: 1, spa: 4, range: 8, attack: 'kit:hit', lifetime: 30, durability: 25, blocks: true, speed: 1, maxAlive: 2 },
  starrk_wolf_unit: { name: 'Spirit Wolf', mode: 'walk', damageType: 'magic', damageMult: 0, spa: 2, range: 5, lifetime: 15, durability: 3, blocks: true, speed: 3, endAttack: 'starrk_wolf_unit:explode', endDamageMult: 2.5, maxAlive: 3 },
  aot_generic: { name: 'Survey Corps Member', mode: 'walk', damage: 120, spa: 4, range: 10, attack: 'kit:hit', lifetime: 40, durability: 10, blocks: true, speed: 1.2, maxAlive: 3 },
  eren_founding_titan: { name: 'Usurper (Founding Titan)', mode: 'walk', damage: 12000, spa: 8, range: 60, attack: 'kit:founding_roar', lifetime: 40, durability: 80, blocks: true, speed: 1, maxAlive: 1 },
  attack_titan: { name: 'Attack Titan', mode: 'walk', damage: 300, spa: 6, range: 10, attack: 'titan:stomp', lifetime: 40, durability: 30, blocks: true, speed: 1, maxAlive: 3 },
  britannia_soldier: { name: 'Britannia Soldier', mode: 'stand', damageMult: 1, spa: 2, range: 20, attack: 'britannia_soldier:rifle', lifetime: 60, blocks: false, maxAlive: 3 },
  shinkiro: { name: 'Shinjira', mode: 'stand', damageType: 'magic', damageMult: 3, spa: 6, range: 40, attack: 'shinkiro:lazer', lifetime: 60, blocks: false, maxAlive: 1 },
  wall_titan_founding: { name: 'Wall Titan', mode: 'walk', damage: 4000, spa: 5, range: 25, attack: 'kit:titan_stomp', lifetime: 40, durability: 50, blocks: true, speed: 1.5, maxAlive: 10 },
  rika: { name: 'Rika', mode: 'walk', damageType: 'magic', damageMult: 1.5, spa: 6, range: 12, attack: 'kit:rika_claw', lifetime: 30, durability: 30, blocks: true, speed: 1.5, maxAlive: 1 },
};

const wind = { id: 'buff', name: 'Wind Blessing', cooldown: 60, buff: { damagePct: 20, tempoPct: 15, durationSec: 20 } };
const lucyGates = [
  { id: 'taurus', name: 'Gate of the Bull', trigger: 'auto', cooldown: 25, summon: { id: 'taurus' } },
  { id: 'leo', name: 'Gate of the Lion', trigger: 'auto', cooldown: 25, minLevel: 3, summon: { id: 'leo' } },
  { id: 'aquarius', name: 'Gate of the Water Bearer', trigger: 'auto', cooldown: 25, minLevel: 6, summon: { id: 'aquarius' } },
];
const lelouch = [
  { id: 'soldiers', name: 'Britannian Army', trigger: 'auto', cooldown: 8, summon: { id: 'britannia_soldier' } },
  { id: 'shinkiro', name: 'Shinjira', trigger: 'auto', cooldown: 30, minLevel: 5, summon: { id: 'shinkiro' } },
];
const illusion = (cooldown: number): Json => ({ id: 'illusion', name: 'Kyoka Suigetsu', cooldown, attack: 'kit:aizen_illusion', scope: 'global', damageMult: 0 });

export const KITS: Record<string, Kit> = {
  // ---- Aktive Fähigkeiten (Knopf) ----
  dazai_evolved: { how: 'Nullification (ab Stufe 6): Schilde weg und Slow auf alle Gegner', handles: ['active-ability'], abilities: [{ id: 'nullify', name: 'Nullification', cooldown: 90, minLevel: 6, attack: 'kit:dazai_null', scope: 'global', damageMult: 0 }] },
  femto_egg: { how: 'Sacrifice: Flächenschlag auf die ganze Karte', handles: ['active-ability'], abilities: [{ id: 'sacrifice', name: 'Sacrifice', cooldown: 60, minLevel: 1, attack: 'kit:femto_sacrifice', scope: 'global', damageMult: 4 }] },
  armin: { how: 'Titan Shift: sechs Flächenschläge in 10 s (die einzige Wirkung der Unit)', handles: ['active-ability'], abilities: [{ id: 'titan_shift', name: 'Titan Shift', cooldown: 60, attack: 'armin:titan_shift', damageMult: 0.5, pulses: 6, durationSec: 10 }] },
  aizen_chrys: { how: 'Illusion: alle Gegner laufen 10 s zurück (Confused)', handles: ['active-ability'], abilities: [illusion(420)] },
  aizen_hog: { how: 'Illusion: alle Gegner laufen 10 s zurück (Confused)', handles: ['active-ability'], abilities: [illusion(390)] },
  aizen_hog_evolved: { how: 'Illusion: alle Gegner laufen 10 s zurück (Confused)', handles: ['active-ability'], abilities: [illusion(360)] },
  leafa: { how: 'Wind Blessing: Schaden und Tempo für alle Verbündeten', handles: ['active-ability', 'secondary-attack'], abilities: [wind] },
  leafa_evolved: { how: 'Wind Blessing: Schaden und Tempo für alle Verbündeten', handles: ['active-ability', 'secondary-attack'], abilities: [wind] },
  eren_final: {
    how: 'The Rumbling: acht Schläge auf die ganze Karte in 28 s, ruft den Gründer-Titan und zehn Wall Titans',
    handles: ['active-ability', 'summon'],
    abilities: [
      { id: 'rumbling', name: 'The Rumbling', cooldown: 480, attack: 'kit:rumbling', scope: 'global', damage: 12000, pulses: 8, durationSec: 28, summon: [{ id: 'wall_titan_founding', count: 10 }, { id: 'eren_founding_titan' }] },
    ],
  },
  law_2_evolved: { how: 'Shambles: Rückstoß und Betäubung im Umkreis, doppelter Schaden', handles: ['active-ability'], abilities: [{ id: 'shambles', name: 'Shambles', cooldown: 75, attack: 'kit:law_shambles', damageMult: 2 }] },
  gojo_evolved: { how: 'Domain Expansion: alle Gegner in Reichweite 8 s betäubt', handles: ['active-ability'], abilities: [{ id: 'domain', name: 'Domain Expansion', cooldown: 60, attack: 'kit:gojo_domain', damageMult: 1.5 }] },
  hakari_evo: {
    how: 'Aura: +25 % Crit-Chance für Verbündete in 25 Studs; Jackpot: Schaden und Tempo für 10 s',
    handles: ['active-ability', 'aura-buff'],
    aura: { critPct: 25, radius: 25 },
    abilities: [{ id: 'jackpot', name: 'Waver with Death', cooldown: 60, selfBuff: { damagePct: 80, tempoPct: 50, durationSec: 10 } }],
  },
  erwin: {
    how: 'Dedicate your hearts!: +25 % Schaden für alle Verbündeten; ruft automatisch Survey-Corps-Soldaten',
    handles: ['active-ability', 'summon'],
    abilities: [
      { id: 'buff_units', name: 'Dedicate Your Hearts!', cooldown: 40, buff: { damagePct: 25, durationSec: 20 } },
      { id: 'soldiers', name: 'Survey Corps', trigger: 'auto', cooldown: 15, summon: { id: 'aot_generic' } },
    ],
  },
  wendy: { how: 'Troia: Schaden und Tempo für alle Verbündeten', handles: ['active-ability'], abilities: [{ id: 'buff_units', name: 'Troia', cooldown: 40, buff: { damagePct: 20, tempoPct: 15, durationSec: 20 } }] },
  homura_evolved: { how: 'Time Stop: alle Gegner 4 s eingefroren', handles: ['active-ability'], abilities: [{ id: 'timestop', name: 'Time Stop', cooldown: 42, attack: 'kit:homura_stop', scope: 'global', damageMult: 0 }] },
  aizen_transcended: { how: 'Beyond the Heavens (ab Stufe 5): Dreifacher Schlag auf alle, Gegner nehmen +30 % Magie', handles: ['active-ability'], abilities: [{ id: 'beyond', name: 'Beyond the Heavens', cooldown: 120, minLevel: 5, attack: 'kit:aizen_beyond', scope: 'global', damageMult: 3 }] },
  dio_heaven: { how: 'The Universe over Heaven: alle Gegner 6 s Timestop, Schlag x2, Selbst-Buff +100 % Schaden', handles: ['active-ability'], abilities: [{ id: 'universe', name: 'The Universe over Heaven', cooldown: 360, attack: 'kit:dio_stop', scope: 'global', damageMult: 2, selfBuff: { damagePct: 100, durationSec: 20 } }] },
  julius_evolved: { how: 'Final Clock: alle Gegner 5 s stark verlangsamt, Schlag x2', handles: ['active-ability'], abilities: [{ id: 'final_clock', name: 'Final Clock', cooldown: 90, attack: 'kit:julius_clock', scope: 'global', damageMult: 2 }] },

  // ---- Auren ----
  griffith_reincarnation: { how: 'Aura: +100 % Schaden für alle Verbündeten auf der Karte (AA: global)', handles: ['summon', 'aura-buff'], aura: { damagePct: 100 } },
  hoshino: { how: 'Aura: +5 / 7 / 10 % Schaden in 30 Studs', handles: ['aura-buff'], aura: [{ damagePct: 5, radius: 30 }, { damagePct: 7, radius: 30 }, { damagePct: 10, radius: 30 }] },
  hoshino_evolved: { how: 'Aura: +5 / 7 / 10 / 15 % Schaden in 30 Studs', handles: ['aura-buff'], leaves: ['cost-aura'], aura: [{ damagePct: 5, radius: 30 }, { damagePct: 7, radius: 30 }, { damagePct: 10, radius: 30 }, { damagePct: 15, radius: 30 }] },
  sakura: { how: 'Aura: +10 % Schaden, Radius wächst mit der Stufe', handles: ['aura-buff'], leaves: ['heal'], aura: [{ damagePct: 10, radius: 20 }, { damagePct: 10, radius: 24 }, { damagePct: 10, radius: 28 }, { damagePct: 10, radius: 32 }] },

  // ---- Beschwörer ----
  eren: { how: 'ruft alle 20 s einen Attack Titan (bis 3, laufen den Gegnern entgegen, halten sie auf)', handles: ['summon', 'partial-levels'], abilities: [{ id: 'attack_titan', name: 'Attack Titan', trigger: 'auto', cooldown: 20, summon: { id: 'attack_titan' } }] },
  lelouch: { how: 'ruft Britannia-Soldaten (bis 3) und ab Stufe 5 Shinjira', handles: ['summon'], abilities: lelouch },
  lelouch_evolved: { how: 'ruft Britannia-Soldaten (bis 3) und ab Stufe 5 Shinjira', handles: ['summon'], abilities: lelouch },
  lucy: { how: 'öffnet automatisch die Tore: Taurus (blockt), ab Stufe 3 Leo, ab Stufe 6 Aquarius', handles: ['summon'], abilities: lucyGates },
  lucy_evolved: {
    how: 'wie Lucy, dazu ab Stufe 8 Multi Summon (alle drei Geister auf Knopfdruck)',
    handles: ['summon'],
    abilities: [...lucyGates, { id: 'multi_summon', name: 'Multi Summon', cooldown: 60, minLevel: 8, summon: [{ id: 'taurus' }, { id: 'leo' }, { id: 'aquarius' }] }],
  },
  starrk_evolved: { how: 'Los Lobos (ab Stufe 8): drei Spirit Wolves rennen los und explodieren', handles: ['summon'], abilities: [{ id: 'los_lobos', name: 'Los Lobos', trigger: 'auto', cooldown: 25, minLevel: 8, summon: { id: 'starrk_wolf_unit', count: 3 } }] },
  yuta_evolved: { how: 'ruft Rika (Annahme: AA nennt nur den Spawn-Angriff `yuta:summon`)', handles: ['summon'], abilities: [{ id: 'rika', name: 'Rika', trigger: 'auto', cooldown: 40, summon: { id: 'rika' } }] },

  // ---- Zweitangriffe mit eigener Angabe ----
  akaza_unit_evolved: { how: 'Zweitangriff `akaza_unit:compass` (AA `secondary_attacks`) dauerhaft im Wechsel, dazu die Stufen-Angriffe', handles: ['secondary-attack'], alsoAlways: ['akaza_unit:compass'] },

  // ---- Reste ----
  usopp_ts: { how: 'Fallen als sofortige Flächentreffer (Obergrenze und 5-s-Lebensdauer der Fallen fehlen)', leaves: ['trap-cap'], handles: [] },
  usopp_ts_evolved: { how: 'Fallen als sofortige Flächentreffer (Obergrenze und 5-s-Lebensdauer der Fallen fehlen)', leaves: ['trap-cap'], handles: [] },
  kento_evolved: { how: 'Overtime: +50 % Schaden über 10 beendete Waves (Annahme, AA nennt nur `end_of_wave: custom`)', handles: ['end-of-wave'] },
  escanor_evolved: { how: 'Sunshine wächst je Wave (bereits Effekt des Angriffs); `end_of_wave: custom` ist genau das', handles: ['end-of-wave'] },
  speedwagon: { how: 'Farm je Wave (`end_of_wave: farm`) ist das normale Einkommen der Stufen', handles: ['end-of-wave'] },
  bulma: { how: 'Farm je Wave (`end_of_wave: farm`) ist das normale Einkommen der Stufen', handles: ['end-of-wave'] },
  giselle_evo: { how: 'Angriff `giselle:three` ohne Details in AA: Annahme Kreis 10 Studs, 3 Treffer', handles: ['attack-details-missing'] },
  carrot: { how: 'Angriff `carrot:two` ohne Details in AA: Annahme Kreis 6 Studs', handles: ['attack-details-missing'] },
  eto_evolved: { how: 'wie Eto; der Kill-Bonus (`on_kill`) fehlt', handles: ['summon'], leaves: ['on-kill'] },
};

/** Beschwörer, deren `spawn_*` in AA nur eine Animation ist (kein Wesen, keine Zahlen): sie sind voll, der Grund entfällt. */
export const COSMETIC_SPAWN = new Set([
  'femto', 'all_might', 'all_might_evolved', 'sanji', 'denji', 'denji_secret', 'denji_evolved', 'metal_knight', 'metal_knight_evolved', 'zeke',
  'kite', 'kite_evolved', 'kite_evolved_precision', 'kite_evolved_lethal', 'kite_evolved_focus', 'kite_evolved_frenzy', 'eto',
]);

/** Weitere Einheiten, die Zweitangriffe nutzen, ohne dass AA es in `extra` markiert (Stufen-Notizen "+ Scatter", "+ Kaminari"). */
export const ROTATION_EXTRA = new Set(['rokuhira', 'rokuhira_evo']);
