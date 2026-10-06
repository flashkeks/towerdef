/**
 * Gemeinsame Bot-Hilfen: Bewertung (erwarteter DPS-Gewinn je Münze), Optionen, Kaufschleife,
 * Farm-Fenster (§12), Fähigkeiten, Targeting, Spenden. Nur lesende Abfragen + `sim.apply`.
 */
import type { UnitDef } from '../data/compile.js';
import { loadBotProfiles } from '../data/load.js';
import { BotProfileSchema, type BotProfile } from '../data/schema.js';
import { nextInt, nextU32, seedRng, type RngState } from '../prng.js';
import type { Sim, SlotInfo } from '../sim.js';
import type { EnemyState, UnitState } from '../state.js';
import type { BotContext } from './types.js';

/** Länge der Standard-Stage (der Kern legt die Wave-Zahl nicht im Zustand offen). */
export const TOTAL_WAVES = 20;
/** Ab dieser Wave rechnen Bots mit Flyern (Standard-Stage: erster Flyer in Wave 8). */
export const AIR_FROM_WAVE = 6;
const ABILITY_BONUS = 1.5;

export interface Memo {
  armor: number;
  airSeen: boolean;
  /** Entscheidungen in Folge, in denen auf eine teure Option gespart wurde (Runde 4 / P1). */
  saving: number;
  /** Early-Units wurden abgegeben: nicht neu kaufen (Runde 4 / P1). */
  rotated: boolean;
  /** Risikokarten (P4): Wave, bei der `lives` zuletzt notiert wurde, die Leben damals, Anzahl Waves in Folge ohne Lebensverlust. */
  cardWave: number;
  cardLives: number;
  streak: number;
  /** Fehlermodell (Runde 4 / P6): Profil (null = fehlerfreier Registry-Bot) und der eigene PRNG des Bots für alle Fehlerwürfe (lazy, aus `ctx.rng` abgeleitet). */
  profile: BotProfile | null;
  frng: RngState | null;
  /** Frühester Tick der nächsten Kaufrunde (Reaktionsverzögerung). */
  nextBuyTick: number;
  /** Je Unit-ID: Wave, in der gewürfelt wurde, und ob die Upgrades dieser Unit in dieser Wave vergessen sind. */
  forget: Map<number, { wave: number; forgot: boolean }>;
  /** Je Unit-ID: Tick, ab dem die wartende Fähigkeit zündet (verspätete Fähigkeiten). */
  abilityAt: Map<number, number>;
  /** Boss-Vorschau je Wave (Boss-Plan): Boss ja/nein und welche Antworten das Kit verlangt. */
  bossInfo: Map<number, { boss: boolean; stun: boolean; need?: boolean }>;
}
/** Profil, das `newMemo` benutzt, solange `withProfile` läuft (Bot-Fabriken haben keine Parameter). */
let building: BotProfile | null | undefined;
let profileTable: Record<string, BotProfile> | null = null;
export function profileByName(name: string | null | undefined): BotProfile | null {
  if (!name || name === 'none') return null;
  profileTable ??= loadBotProfiles();
  const p = profileTable[name];
  if (!p) throw new Error(`Unbekanntes Bot-Profil "${name}" (verfügbar: ${Object.keys(profileTable).join(', ')}, none)`);
  return p;
}
/** Nur Experimente (Sanity-Skripte, `P6_PROFILES`): Felder eines Profils überschreiben, schema-geprüft. */
export function overrideProfile(name: string, patch: Partial<BotProfile>): void {
  const cur = profileByName(name) as BotProfile;
  (profileTable as Record<string, BotProfile>)[name] = BotProfileSchema.parse({ ...cur, ...patch });
}
/** Baut einen Bot mit festem Profil (`null`/'none' = fehlerfrei), unabhängig von `botTuning.profile`. */
export function withProfile<T>(name: string | null, make: () => T): T {
  const prev = building;
  building = profileByName(name);
  try {
    return make();
  } finally {
    building = prev;
  }
}
export const newMemo = (): Memo => ({
  armor: 0,
  airSeen: false,
  saving: 0,
  rotated: false,
  cardWave: 0,
  cardLives: -1,
  streak: 0,
  profile: building !== undefined ? building : profileByName(botTuning.profile),
  frng: null,
  nextBuyTick: 0,
  forget: new Map(),
  abilityAt: new Map(),
  bossInfo: new Map(),
});

/** Eigener Fehler-PRNG des Bots, beim ersten Gebrauch aus dem Bot-PRNG abgeleitet (der Sim-PRNG bleibt unberührt). */
function frngOf(ctx: BotContext, memo: Memo): RngState {
  memo.frng ??= seedRng((nextU32(ctx.rng) ^ 0xfa17ed06) >>> 0);
  return memo.frng;
}
const chance = (ctx: BotContext, memo: Memo, bp: number): boolean => bp > 0 && nextInt(frngOf(ctx, memo), 10000) < bp;
const secs = (ctx: BotContext, memo: Memo, r: [number, number]): number => r[0] + (r[1] > r[0] ? nextInt(frngOf(ctx, memo), r[1] - r[0] + 1) : 0);

/**
 * Sparen (Runde 4 / P1, nur Policy-Option `save`): Ein Mensch spart auf eine teure, deutlich bessere Unit (Mythic/Legendary),
 * statt jede Münze sofort in billige Upgrades zu stecken. Ein Wert-je-Münze-Bot kauft Units mit hoher Platzierungskost sonst
 * nur zufällig (die Münzen erreichen nie 1000). Standard an für alle Bots (Mensch-Verhalten); `P1_NOSAVE=1` reproduziert die Runden 1-3.
 */
export const botTuning = {
  saveFactor: 1.5,
  saveMaxDecisions: 45,
  /** Mythic-Platzierungen frühestens ab dieser Wave (Mythic hat Sparfaktor 1,0 statt `saveFactor`). */
  mythicFromWave: 4,
  saveMinShare: 0.5,
  /** Nur Experimente: Sanity-Skripte setzen das per `P1_NOSAVE=1` (Verhalten der Runden 1-3). */
  disabled: false,
  /**
   * Runde 4 / P4: Boss-Fenster nutzen. An: Fähigkeiten gegen einen Boss mit Kit zünden erst im Schwachstellen-Fenster, bei
   * gebrochenem/stehendem Schild bzw. zum Unterbrechen eines Telegraphs; aus (`P4_NOWINDOW=1`): wie vor P4 (sofort auf den Boss).
   */
  windowAware: true,
  /** Pfadfortschritt (Milli-Tiles), ab dem ein Boss als Notfall gilt: Fähigkeiten feuern dann ohne Fenster (Standard-Stage: 42 Tiles lang). */
  bossPanicMilli: 31000,
  /** Risikokarten-Strategie global abschalten (`P4_NOCARDS=1`). Die Strategie läuft nur für Policies mit `cards: true`. */
  cardsDisabled: false,
  /** Runde 4 / P6: Profil für Bots ohne `@profil` im Namen (Sanity-Skripte: `BOT_PROFILE=normal`). null = fehlerfrei wie Runden 1-5. */
  profile: null as string | null,
  /** Boss-Plan (P6): Titan/Frost vor einem Boss anschaffen, gespeist aus `previewWave(n)`. Aus: `P6_NOBOSSPLAN=1`. */
  bossPlan: true,
  /** Wellenwissen von Bots ohne Profil (Waves voraus). */
  bossLookahead: 8,
  /** Der Plan greift frühestens so viele Waves vor dem Boss (sonst hortet der Bot zu früh Münzen). */
  bossPlanWaves: 3,
  /** Boss-Plan: Upgrades der Nuke-Unit zählen im Boss-Horizont so viel mehr (Nuke = Vielfaches des Treffer-Schadens der Stufe). 1 = aus. */
  bossUpgradeBoost: 1,
  /** Boss-Plan: Nuke-Unit vor dem Boss mindestens auf diese Stufe ausbauen (0 = nicht). */
  bossNukeLevel: 0,
  /** Boss-Plan: auf die Plan-Unit sparen (ab 40 % der Kosten nichts anderes kaufen). Aus: kauft sie nur, wenn die Münzen ohnehin da sind. */
  bossPlanSave: true,
  /**
   * Bedarfsprüfung (P6b): Titan/Frost nur, wenn `bossCapacityRatio` unter der Schwelle liegt. Zwischen-Boss (Lehr-Boss, Wave 10) und
   * Final-Boss (letzte Wave) getrennt, weil das Verhältnis den Final-Boss (Heilung, mehr Begleiter) unterschätzt; Werte aus
   * `scripts/sanity/p6b-boss.ts`. 0 = Prüfung aus (Plan immer, wie P6).
   */
  /** Horizont (Waves vor dem Final-Boss) für Bots mit Wellenwissen. 0 = wie die übrigen Bosse (`bossPlanWaves`). */
  bossFinalHorizon: 0,
  /** Nur Messungen (Leave-one-out): diese Unit-IDs kennt der Bot nicht, Pläne eingeschlossen (ein Proxy, der `place` ablehnt, lässt Pläne ewig sparen). */
  banned: [] as string[],
  /** Boss-Plan: ohne freien Slot die schwächste Unit auf passendem Slot verkaufen (P6b). Aus: `P6B_NOROOM=1`. */
  makeRoom: true,
  bossNeedMid: 0,
  /** Policy-eigene Pläne (`Policy.plan`, z. B. `aoe` Titan ab Wave 5) beachten. Aus: nur der Boss-Plan mit Bedarfsprüfung kauft den Titan gezielt. */
  policyPlans: true,
  bossNeedFinal: 0,
  /** Early-Units (Striker): so viele davon kauft ein Bot höchstens (ein Mensch pivotiert früh weg von der Starter-Unit). Standard: Cap der Unit. */
  earlyCap: 2,
  /** Early-Unit abgeben (P6b): frühestens ab dieser Wave (Standard `ROTATE_FROM_WAVE`) und wenn ein Typ dieser Seltenheit oder höher fehlt. */
  rotateFromWave: 8,
  rotateMinRarity: 'legendary' as 'rare' | 'epic' | 'legendary' | 'mythic',
};
const RARITY_RANK = { rare: 0, epic: 1, legendary: 2, mythic: 3 } as const;

export interface Policy {
  /** Präferenz-Multiplikator je Unit (Standard 1). */
  weight?: (def: UnitDef, kind: 'place' | 'upgrade') => number;
  canPlace?: (def: UnitDef, env: Env) => boolean;
  canUpgrade?: (u: UnitState, def: UnitDef, env: Env) => boolean;
  /** Farm-Strategie: `share` = max. Anteil der Farm-Investition an den eigenen Gesamtinvestitionen. */
  farm?: { share: number; sellLate?: boolean } | null;
  /** Obergrenze der eigenen Nicht-Farm-Investition (Support-Rolle im Koop). */
  maxNonFarmInvest?: number;
  /** Frost-Stun ab so vielen Gegnern in Range (Standard 4). */
  frostMin?: number;
  /**
   * Plan: diese Unit ab `fromWave` anschaffen, auch wenn sie je Münze nie die beste Option ist. Der Bot spart darauf (sobald
   * 40 % der Kosten da sind) und kauft sie als Erstes. Ein Mensch plant so für den Boss (Titan vor Wave 10).
   */
  plan?: { unit: string; fromWave: number };
  /** Boss-Plan (P6) für diese Policy; Standard an (`botTuning.bossPlan`). Koop-Support schaltet ihn ab. */
  bossPlan?: boolean;
  /** Auf teure, deutlich bessere Platzierungen sparen (siehe `botTuning`). Standard an, `false` schaltet ab. */
  save?: boolean;
  /** Münzen, die nicht für Kampf-Units ausgegeben werden. */
  reserve?: number;
  /** Risikokarten nehmen, wenn das Team stark ist (P4, K1; Standard aus, Bot-Name mit Suffix `+cards`). */
  cards?: boolean;
}

export interface Env {
  sim: Sim;
  playerId: number;
  rng: RngState;
  memo: Memo;
  wave: number;
  coins: number;
  defs: Map<string, UnitDef>;
  slots: SlotInfo[];
  own: UnitState[];
  team: UnitState[];
  armor: number;
  airNeed: boolean;
  airShare: number;
  /** Basiswert je Team-Unit (DPS x Abdeckung), ohne Luft-Bonus. */
  values: Map<number, number>;
}

export interface Option {
  kind: 'place' | 'upgrade';
  def: UnitDef;
  slot?: number;
  unit?: UnitState;
  cost: number;
  score: number;
}

export function makeEnv(ctx: BotContext, memo: Memo): Env {
  const { sim, playerId, rng } = ctx;
  const st = sim.state;
  const defs = new Map(sim.catalog().map((d) => [d.id, d]));
  const live = st.enemies.filter((e) => e.hp > 0);
  if (live.some((e) => e.flying)) memo.airSeen = true;
  let hp = 0;
  let ar = 0;
  for (const e of live) {
    hp += e.maxHp;
    ar += e.armor * e.maxHp;
  }
  if (hp > 0) memo.armor = Math.max(memo.armor, Math.min(40, Math.round(ar / hp)));
  const slots = sim.slots();
  const team = st.units;
  const env: Env = {
    sim,
    playerId,
    rng,
    memo,
    wave: st.wave,
    coins: st.players[playerId].coins,
    defs,
    slots,
    own: team.filter((u) => u.owner === playerId),
    team,
    armor: memo.armor,
    airNeed: st.wave >= AIR_FROM_WAVE || memo.airSeen,
    airShare: 0,
    values: new Map(),
  };
  let total = 0;
  let air = 0;
  for (const u of team) {
    const d = defs.get(u.defId) as UnitDef;
    if (!d.attack) continue;
    const s = slots[u.slot];
    const v = dpsOf(d, u.level, env.armor) * (s.coverageByRange(d.levels[u.level].rangeMilli) / 1000);
    env.values.set(u.id, v);
    total += v;
    if (d.canHitAir) air += v;
  }
  env.airShare = total > 0 ? air / total : 0;
  return env;
}

/** Erwarteter Einzelziel-DPS (HP/s) inkl. grober Multi-Target-/Effekt-Faktoren und Rüstung. */
export function dpsOf(def: UnitDef, level: number, armor: number): number {
  if (!def.attack) return 0;
  const ls = def.levels[level];
  let d = (ls.damageCenti * 20) / ls.spaTicks / 100;
  switch (def.attack.kind) {
    case 'circle':
      d *= 1.8;
      break;
    case 'line':
      d *= 1.6;
      break;
    case 'cone':
      d *= 1.4;
      break;
    default:
      break;
  }
  if (def.crit) d *= 1 + (def.crit.chanceBp / 10000) * (def.crit.multBp / 10000 - 1);
  for (const o of def.onHit) {
    if (o.kind === 'bleed') d *= 1.25;
    else if (o.kind === 'burn') d *= 1.35;
    else if (o.kind === 'slow') d *= 1.15;
  }
  return (d * 100) / (100 + Math.max(0, armor - def.penetration));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Wert (DPS-Äquivalent x Pfadabdeckung in Tiles) einer Unit auf Stufe `level` am Slot. */
export function valueAt(env: Env, def: UnitDef, level: number, slot: SlotInfo, selfId = -1): number {
  if (def.aura) {
    const bp = def.aura.damageBpByLevel[level];
    let sum = 0;
    for (const u of env.team) {
      if (u.id === selfId) continue;
      const v = env.values.get(u.id);
      if (!v) continue;
      if (dist(env.slots[u.slot], slot) <= def.aura.radiusMilli) sum += v;
    }
    return (sum * bp) / 10000;
  }
  if (!def.attack) return 0;
  const v = dpsOf(def, level, env.armor) * (slot.coverageByRange(def.levels[level].rangeMilli) / 1000);
  // Fähigkeiten (Stun, Nuke) sind Boss-/Elite-Werkzeuge und zählen mit Nutzen-Aufschlag.
  return v * airFactor(env, def) * (def.ability ? ABILITY_BONUS : 1);
}

function airFactor(env: Env, def: UnitDef): number {
  return env.airNeed && env.airShare < 0.3 && def.canHitAir && def.attack ? 1.8 : 1;
}

export function pickTop<T extends { score: number }>(rng: RngState, sorted: T[], k = 3, frac = 0.7): T {
  const best = sorted[0].score;
  const cand = sorted.slice(0, k).filter((o) => o.score >= best * frac);
  return cand[nextInt(rng, cand.length)];
}

const investedOf = (env: Env, farm: boolean): number =>
  env.own.reduce((a, u) => a + ((env.defs.get(u.defId) as UnitDef).farm ? (farm ? u.invested : 0) : farm ? 0 : u.invested), 0);

/** Gibt es einen freien Kleinslot passender Art für die Unit? (Ohne ihn wäre Sparen auf die Unit sinnlos: P6b, 4P-`wide` hortete bis zu 2500 Münzen.) */
function hasFreeSlot(env: Env, def: UnitDef): boolean {
  return env.slots.some((s) => s.free && s.size === 1 && (def.placement === 'hybrid' || def.placement === s.kind));
}

/**
 * Platz schaffen für eine geplante Unit (P6b): ist kein passender Slot frei, verkauft der Bot seine schwächste Unit auf einem
 * passenden Slot (nur Eigene, keine Nuke-/Stun-Unit, keine Farm). So macht es ein Mensch im vollen Koop-Feld; ohne das
 * flutet `wide` die 23 Slots mit Billig-Units und der Titan findet nie einen Platz.
 */
function sacrificeFor(env: Env, def: UnitDef): UnitState | null {
  let best: UnitState | null = null;
  let bestV = Infinity;
  for (const u of env.own) {
    const d = env.defs.get(u.defId) as UnitDef;
    if (d.farm || d.ability?.kind === 'nuke' || d.ability?.kind === 'stunAoe') continue;
    const slot = env.slots[u.slot];
    if (slot.size !== 1 || (def.placement !== 'hybrid' && def.placement !== slot.kind)) continue;
    const v = env.values.get(u.id) ?? 0;
    if (v < bestV) {
      best = u;
      bestV = v;
    }
  }
  return best;
}

function canPlaceBase(env: Env, def: UnitDef): boolean {
  if (botTuning.banned.includes(def.id)) return false;
  if (env.own.filter((u) => u.defId === def.id).length >= def.cap) return false;
  if (env.team.length >= 60) return false;
  if (!env.own.some((u) => u.defId === def.id) && new Set(env.own.map((u) => u.defId)).size >= 6) return false;
  return true;
}

/** Alle bezahlbaren Kampf-Optionen (Farm wird gesondert behandelt). */
export function buildOptions(env: Env, pol: Policy): Option[] {
  const out: Option[] = [];
  const budget = env.coins - (pol.reserve ?? 0);
  const nonFarm = investedOf(env, false);
  const cap = pol.maxNonFarmInvest ?? Infinity;
  const small = env.slots.filter((s) => s.free && s.size === 1);
  for (const def of env.defs.values()) {
    if (def.farm || !def.attack && !def.aura) continue;
    if (!canPlaceBase(env, def)) continue;
    const cost = def.placeCost;
    if (cost > budget || nonFarm + cost > cap) continue;
    // Mythic nicht als Eröffnung: die ersten Waves brauchen mehrere billige Körper (Runde 4 / P1).
    if (def.rarity === 'mythic' && env.wave < botTuning.mythicFromWave && !botTuning.disabled) continue;
    if (env.memo.rotated && EARLY_UNITS.includes(def.id)) continue;
    if (EARLY_UNITS.includes(def.id) && env.own.filter((u) => u.defId === def.id).length >= botTuning.earlyCap) continue;
    if (pol.canPlace && !pol.canPlace(def, env)) continue;
    const w = pol.weight ? pol.weight(def, 'place') : 1;
    if (w <= 0) continue;
    for (const s of small) {
      if (def.placement !== 'hybrid' && def.placement !== s.kind) continue;
      const v = valueAt(env, def, 0, s);
      if (v <= 0) continue;
      out.push({ kind: 'place', def, slot: s.id, cost, score: (v / cost) * w });
    }
  }
  for (const u of env.own) {
    const def = env.defs.get(u.defId) as UnitDef;
    if (def.farm || u.level >= def.maxLevel) continue;
    const cost = def.upgradeCosts[u.level];
    if (cost > budget || nonFarm + cost > cap) continue;
    if (pol.canUpgrade && !pol.canUpgrade(u, def, env)) continue;
    const w = pol.weight ? pol.weight(def, 'upgrade') : 1;
    if (w <= 0) continue;
    const s = env.slots[u.slot];
    const gain = valueAt(env, def, u.level + 1, s, u.id) - valueAt(env, def, u.level, s, u.id);
    if (gain <= 0) continue;
    out.push({ kind: 'upgrade', def, unit: u, cost, score: (gain / cost) * w });
  }
  out.sort((a, b) => b.score - a.score || a.cost - b.cost);
  return out;
}

/** Plan-Unit: 'wait' = sparen, Option-Liste = nur diese Platzierungen, null = Plan greift nicht. */
function planStep(env: Env, plan: { unit: string; fromWave: number }, opts: Option[]): Option[] | 'wait' | null {
  const def = env.defs.get(plan.unit);
  if (!def || env.wave < plan.fromWave) return null;
  if (env.own.some((u) => u.defId === def.id) || !canPlaceBase(env, def) || !hasFreeSlot(env, def)) return null;
  if (env.coins < def.placeCost) return env.coins >= def.placeCost * 0.4 ? 'wait' : null;
  const mine = opts.filter((o) => o.kind === 'place' && o.def.id === def.id);
  return mine.length > 0 ? mine : null;
}

/**
 * Boss-Plan (Runde 4 / P6, für alle Bots): Wer weiß, dass ein Boss kommt, schafft die Antworten darauf an. Gespeist aus
 * `previewWave(n).boss` und den Kit-Daten (`bossKits()`): Nuke-Unit (Titan) bricht Schilde und nutzt Fenster, Stun-Unit (Frost)
 * unterbricht Telegraphs, sobald das Kit auf der Stufe etwas Unterbrechbares hat. Wellenwissen = `lookahead` des Profils
 * (Bots ohne Profil: `botTuning.bossLookahead`); 0 = der Bot reagiert erst, wenn der Boss auf dem Feld steht. Der Plan greift
 * höchstens `botTuning.bossPlanWaves` Waves vor dem Boss (Sparen ab dann, wie ein Mensch auf den Titan spart).
 */
function bossInfoOf(env: Env, memo: Memo, w: number): { boss: boolean; stun: boolean; need?: boolean } {
  let info = memo.bossInfo.get(w);
  if (!info) {
    const pv = env.sim.previewWave(w);
    const kit = pv?.bossKit ? env.sim.bossKits()[w] : undefined;
    const active = new Set(pv?.bossKit?.abilities ?? []);
    info = { boss: !!pv?.boss, stun: !!kit?.abilities.some((a) => active.has(a.id) && a.interruptible) };
    memo.bossInfo.set(w, info);
  }
  return info;
}

/** Boss-Tempo auf der Standard-Stage in Tiles/s (Grunt 1,5 x Boss-Faktor 0,5); die Vorschau nennt kein Tempo. */
const BOSS_TILES_PER_S = 0.75;

/**
 * Bedarfsprüfung des Boss-Plans (P6b): Schaden, den das aktuelle Team (ohne Nuke-Unit) auf einen einzelnen Boss ausübt, während
 * er den Pfad entlangläuft (Summe DPS x Pfadabdeckung / Boss-Tempo, Boss-Rüstung 40, ohne AoE-Faktoren, Effekt-Anteile wie `dpsOf`)
 * im Verhältnis zur Boss-HP von Wave `w` samt Schild (+20 %). Verhältnis >= `botTuning.bossNeedRatio` = der Boss fällt auch ohne Titan.
 */
export function bossCapacityRatio(env: Env, w: number): number | null {
  const pv = env.sim.previewWave(w);
  const g = pv?.groups.find((x) => x.boss);
  if (!pv || !g) return null;
  const hp = ((g.hpCenti * g.count) / 100) * 1.2;
  let dmg = 0;
  for (const u of env.team) {
    const d = env.defs.get(u.defId) as UnitDef;
    if (!d.attack || d.ability?.kind === 'nuke') continue;
    const ls = d.levels[u.level];
    let dps = (ls.damageCenti * 20) / ls.spaTicks / 100;
    if (d.crit) dps *= 1 + (d.crit.chanceBp / 10000) * (d.crit.multBp / 10000 - 1);
    for (const o of d.onHit) {
      if (o.kind === 'bleed') dps *= 1.25;
      else if (o.kind === 'burn') dps *= 1.35;
    }
    dps = (dps * 100) / (100 + Math.max(0, 40 - d.penetration));
    // Aura-Units tragen über ihre Nachbarn bei (hier nicht gerechnet), Luft-Einheiten treffen den Boden-Boss genauso.
    dmg += (dps * env.slots[u.slot].coverageByRange(ls.rangeMilli)) / 1000 / BOSS_TILES_PER_S;
  }
  return dmg / hp;
}

/** Unit-IDs, die der Boss-Plan jetzt will (Reihenfolge = Priorität), leer ohne Boss im Horizont. */
function bossNeeds(env: Env, memo: Memo): string[] {
  const look = memo.profile ? memo.profile.lookahead : botTuning.bossLookahead;
  const horizon = Math.min(look, botTuning.bossPlanWaves);
  const st = env.sim.state;
  let stun = false;
  let found = false;
  // Der Final-Boss (letzte Wave) steht auf der Stage-Karte: wer Wellenwissen hat (Profil `lookahead` > 0), plant ihn früher ein,
  // weil ein später Titan am 6-Typ-Limit und an den Münzen scheitert (P6b). Ohne Wellenwissen bleibt es beim normalen Horizont.
  const finalH = look > 0 ? botTuning.bossFinalHorizon : 0;
  for (let w = Math.max(1, env.wave); w <= env.wave + Math.max(horizon, finalH); w++) {
    if (w > env.wave + horizon && w !== TOTAL_WAVES) continue;
    if (w === env.wave && !st.enemies.some((e) => e.hp > 0 && e.boss)) continue;
    const info = bossInfoOf(env, memo, w);
    if (!info.boss) continue;
    // Bedarfsprüfung (P6b): einmal je Boss-Wave, wenn sie in den Horizont kommt; Boss fällt auch ohne Titan -> kein Plan.
    if (info.need === undefined) {
      const ratio = botTuning.bossNeedMid > 0 ? bossCapacityRatio(env, w) : null;
      info.need = ratio === null || ratio < (w >= TOTAL_WAVES ? botTuning.bossNeedFinal : botTuning.bossNeedMid);
    }
    if (!info.need) continue;
    found = true;
    stun ||= info.stun;
  }
  if (!found) return [];
  const out = [...env.defs.values()].filter((d) => d.ability?.kind === 'nuke').map((d) => d.id);
  if (stun) out.push(...[...env.defs.values()].filter((d) => d.ability?.kind === 'stunAoe').map((d) => d.id));
  return out;
}

/** Boss-Plan-Schritt: 'wait' = sparen, Option-Liste = nur diese Platzierungen, null = nichts zu tun. */
function bossPlanStep(env: Env, memo: Memo, pol: Policy): Option[] | 'wait' | null {
  for (const id of bossNeeds(env, memo)) {
    const def = env.defs.get(id);
    if (!def || env.own.some((u) => u.defId === id) || !canPlaceBase(env, def) || (!hasFreeSlot(env, def) && !(botTuning.makeRoom && sacrificeFor(env, def)))) continue;
    const budget = env.coins - (pol.reserve ?? 0);
    if (budget < def.placeCost) return botTuning.bossPlanSave && budget >= def.placeCost * 0.4 ? 'wait' : null;
    if (botTuning.makeRoom && !hasFreeSlot(env, def)) {
      const sac = sacrificeFor(env, def);
      if (sac && env.sim.apply(env.playerId, { type: 'sell', entityId: sac.id }).ok) return 'wait';
      continue;
    }
    // Ohne die Gewichte/Beschränkungen der Policy: der Boss-Plan gilt für jeden Bot.
    const mine = buildOptions(env, { reserve: pol.reserve, maxNonFarmInvest: pol.maxNonFarmInvest }).filter((o) => o.kind === 'place' && o.def.id === id);
    if (mine.length > 0) return mine;
  }
  // Alle Antworten stehen: die Nuke-Einheit vor dem Boss auf Mindeststufe bringen (unabhängig von den Gewichten der Policy).
  if (botTuning.bossNukeLevel > 0 && bossNeeds(env, memo).length > 0) {
    for (const u of env.own) {
      const def = env.defs.get(u.defId) as UnitDef;
      if (def.ability?.kind !== 'nuke' || u.level >= Math.min(def.maxLevel, botTuning.bossNukeLevel)) continue;
      const cost = def.upgradeCosts[u.level];
      if (cost <= env.coins - (pol.reserve ?? 0)) return [{ kind: 'upgrade', def, unit: u, cost, score: 1 }];
    }
  }
  return null;
}

/**
 * Sparen: Ist die beste Option insgesamt (ohne Budget) deutlich besser je Münze als die beste bezahlbare,
 * kostet mehr als verfügbar und liegen schon `saveMinShare` davon vor (nur Platzierungen), wird gewartet (höchstens `saveMaxDecisions` Entscheidungen
 * in Folge, ~ 1,5 Waves), damit Teure-Platzierungen (Titan, Frost, Lancer) nicht strukturell verhungern.
 */
function shouldSave(env: Env, memo: Memo, pol: Policy, opts: Option[], failed: Set<string>, key: (o: Option) => string): boolean {
  const budget = env.coins - (pol.reserve ?? 0);
  const all = buildOptions({ ...env, coins: 1e9 }, { ...pol, reserve: 0 }).filter((o) => !failed.has(key(o)));
  if (all.length === 0) return false;
  const top = all.find((o) => o.kind === 'place');
  if (!top || top.cost <= budget) return false;
  if (budget < top.cost * botTuning.saveMinShare) return false;
  const best = opts.length > 0 ? opts[0].score : 0;
  const factor = top.def.rarity === 'mythic' ? 1 : botTuning.saveFactor;
  if (best * factor >= top.score) return false;
  if (memo.saving >= botTuning.saveMaxDecisions) {
    if (memo.saving >= 2 * botTuning.saveMaxDecisions) memo.saving = 0;
    memo.saving++;
    return false;
  }
  memo.saving++;
  return true;
}

/** Fehlermodell: Hat der Bot die Upgrades dieser Unit in dieser Wave vergessen? (einmal je Unit und Wave gewürfelt) */
function forgotten(ctx: BotContext, memo: Memo, u: UnitState, wave: number): boolean {
  let f = memo.forget.get(u.id);
  if (!f || f.wave !== wave) {
    f = { wave, forgot: chance(ctx, memo, (memo.profile as BotProfile).forgetUpgradeBp) };
    memo.forget.set(u.id, f);
  }
  return f.forgot;
}

/** Fehlermodell: Reaktionsverzögerung. Eine Kaufrunde ist erlaubt, wenn die Pause der letzten abgelaufen ist; danach wird die nächste Pause gewürfelt. */
export function buyGate(ctx: BotContext, memo: Memo): boolean {
  if (!memo.profile) return true;
  const tick = ctx.sim.state.tick;
  if (tick < memo.nextBuyTick) return false;
  memo.nextBuyTick = tick + 20 * secs(ctx, memo, memo.profile.buyDelaySec);
  return true;
}

/** Kauf-Schleife: wählt unter den Top-3-Optionen (seeded) und kauft, bis nichts mehr geht. */
export function spend(ctx: BotContext, memo: Memo, pol: Policy): void {
  const failed = new Set<string>();
  const key = (o: Option): string => (o.kind === 'place' ? `p${o.def.id}@${o.slot}` : `u${o.unit?.id}`);
  for (let i = 0; i < 80; i++) {
    const env = makeEnv(ctx, memo);
    let opts = buildOptions(env, pol).filter((o) => !failed.has(key(o)));
    // Fehlermodell: vergessene Upgrades (je Unit und Wave gewürfelt).
    if (memo.profile && memo.profile.forgetUpgradeBp > 0) opts = opts.filter((o) => o.kind !== 'upgrade' || !forgotten(ctx, memo, o.unit as UnitState, env.wave));
    if (botTuning.bossPlan && pol.bossPlan !== false && botTuning.bossUpgradeBoost !== 1 && bossNeeds(env, memo).length > 0) {
      for (const o of opts) if (o.kind === 'upgrade' && o.def.ability?.kind === 'nuke') o.score *= botTuning.bossUpgradeBoost;
      opts.sort((a, b) => b.score - a.score || a.cost - b.cost);
    }
    let planned: Option[] | 'wait' | null = botTuning.bossPlan && pol.bossPlan !== false ? bossPlanStep(env, memo, pol) : null;
    if (Array.isArray(planned)) planned = planned.filter((o) => !failed.has(key(o)));
    if (planned === null || (Array.isArray(planned) && planned.length === 0)) planned = pol.plan && botTuning.policyPlans ? planStep(env, pol.plan, opts) : null;
    if (planned === 'wait') return;
    if (planned) opts.splice(0, opts.length, ...planned);
    if (!planned && !botTuning.disabled && pol.save !== false && shouldSave(env, memo, pol, opts, failed, key)) return;
    if (opts.length === 0) return;
    memo.saving = 0;
    let o = pickTop(ctx.rng, opts);
    // Fehlermodell: schlechterer Slot (zufälliger anderer Slot für dieselbe Unit).
    if (memo.profile && o.kind === 'place' && chance(ctx, memo, memo.profile.worseSlotBp)) {
      // "Schlechter" = aus der schlechteren Hälfte der Slots (nach Bot-Bewertung) dieser Unit.
      const same = opts.filter((x) => x.kind === 'place' && x.def.id === o.def.id);
      const worse = same.slice(Math.ceil(same.length / 2));
      if (worse.length > 0) o = worse[nextInt(frngOf(ctx, memo), worse.length)];
    }
    const res =
      o.kind === 'place'
        ? ctx.sim.apply(ctx.playerId, { type: 'place', unitId: o.def.id, slot: o.slot as number })
        : ctx.sim.apply(ctx.playerId, { type: 'upgrade', entityId: (o.unit as UnitState).id });
    if (!res.ok) failed.add(key(o));
  }
}

/** Farm-Käufe nach §12-Fenster: Grenz-Payback <= Restwaves; nach Payback sortiert. */
export function farmStep(ctx: BotContext, memo: Memo, pol: Policy): void {
  const cfg = pol.farm;
  if (!cfg) return;
  for (let i = 0; i < 10; i++) {
    const env = makeEnv(ctx, memo);
    const farmDef = [...env.defs.values()].find((d) => d.farm);
    if (!farmDef?.farm) return;
    const rest = TOTAL_WAVES - env.wave;
    const attackers = env.own.filter((u) => (env.defs.get(u.defId) as UnitDef).attack).length;
    const farmInv = investedOf(env, true);
    const total = farmInv + investedOf(env, false);
    const ys = farmDef.farm.yieldByLevel;
    const cands: { payback: number; cost: number; place: boolean; unit?: UnitState }[] = [];
    const myFarms = env.own.filter((u) => u.defId === farmDef.id);
    if (myFarms.length < farmDef.cap) cands.push({ payback: farmDef.placeCost / ys[0], cost: farmDef.placeCost, place: true });
    for (const u of myFarms) {
      if (u.level >= farmDef.maxLevel) continue;
      const c = farmDef.upgradeCosts[u.level];
      cands.push({ payback: c / (ys[u.level + 1] - ys[u.level]), cost: c, place: false, unit: u });
    }
    const first = myFarms.length === 0 && env.wave <= 1;
    // Vor der Boss-Wave (10) keine Farm-Investition: Verteidigung geht vor.
    if (env.wave >= 9 && env.wave <= 10) return;
    const ok = cands
      .filter((c) => c.payback <= rest && c.cost <= env.coins)
      .filter((c) => first || attackers >= 2)
      .filter((c) => (first && c.place) || farmInv + c.cost <= cfg.share * (total + c.cost))
      .sort((a, b) => a.payback - b.payback || a.cost - b.cost);
    if (ok.length === 0) return;
    const c = ok[0];
    if (c.place) {
      const big = env.slots.filter((s) => s.free && s.size === 2 && s.kind === 'ground');
      if (big.length === 0) return;
      const s = big[nextInt(ctx.rng, big.length)];
      if (!ctx.sim.apply(ctx.playerId, { type: 'place', unitId: farmDef.id, slot: s.id }).ok) return;
    } else if (!ctx.sim.apply(ctx.playerId, { type: 'upgrade', entityId: (c.unit as UnitState).id }).ok) return;
  }
}

/** Verkauft Farms, deren restlicher Ertrag unter dem Verkaufswert (40 %) liegt. */
export function sellLateFarms(ctx: BotContext): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  if (st.wave < 14) return;
  const farm = sim.catalog().find((d) => d.farm);
  if (!farm?.farm) return;
  const payouts = TOTAL_WAVES - st.wave + (st.waveOpen ? 1 : 0);
  for (const u of st.units) {
    if (u.owner !== playerId || u.defId !== farm.id) continue;
    if (payouts * farm.farm.yieldByLevel[u.level] < Math.floor((u.invested * farm.sellBp) / 10000)) {
      sim.apply(playerId, { type: 'sell', entityId: u.id });
    }
  }
}

const isBig = (e: EnemyState): boolean => e.boss || e.elite;

/** Targeting: Titan immer strongest, andere Einzel-DPS strongest solange Boss/Elite lebt. */
export function manageTargeting(ctx: BotContext): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  const big = st.enemies.some((e) => e.hp > 0 && isBig(e));
  const defs = new Map(sim.catalog().map((d) => [d.id, d]));
  for (const u of st.units) {
    if (u.owner !== playerId) continue;
    const d = defs.get(u.defId) as UnitDef;
    if (!d.attack) continue;
    let want = d.defaultTargeting;
    if (d.id === 'titan') want = 'strongest';
    else if (big && d.attack.kind === 'single') want = 'strongest';
    else if (d.attack.kind === 'single') want = 'first';
    if (u.targeting !== want) sim.apply(playerId, { type: 'setTargeting', entityId: u.id, mode: want });
  }
}

/**
 * Boss-Fenster (P4): Zustand des ersten lebenden Bosses mit Kit. `window` = Schwachstellen-Fenster offen, `ward` = Schild steht,
 * `interruptible` = Telegraph läuft, der sich per Stun brechen lässt, `charging` = Sturm läuft, `panic` = Boss fast am Ziel.
 */
export function bossStatus(sim: Sim, live: EnemyState[]): { boss: EnemyState; window: boolean; ward: boolean; interruptible: boolean; charging: boolean; panic: boolean } | null {
  const boss = live.find((e) => e.bossRun !== null);
  if (!boss || !boss.bossRun) return null;
  const run = boss.bossRun;
  const kit = Object.values(sim.bossKits()).find((k) => k.id === run.kit);
  const tele = run.tele && kit ? kit.abilities[run.tele.ability] : null;
  return {
    boss,
    window: run.vulnTicks > 0,
    ward: run.ward > 0,
    interruptible: !!tele && tele.interruptible && run.tele !== null && !run.tele.interrupted,
    charging: run.hasteTicks > 0,
    panic: boss.progress >= botTuning.bossPanicMilli,
  };
}

/**
 * Fehlermodell: verspätete Fähigkeit. Wäre das Zünden sinnvoll, wartet der Bot die gewürfelte Verspätung ab (Sekunden, ab dem
 * ersten Moment, in dem es sinnvoll war). Ohne Profil zündet er sofort.
 */
function abilityGate(ctx: BotContext, memo: Memo | undefined, u: UnitState): boolean {
  if (!memo?.profile) return true;
  const tick = ctx.sim.state.tick;
  let at = memo.abilityAt.get(u.id);
  if (at === undefined) {
    at = tick + 20 * secs(ctx, memo, memo.profile.abilityDelaySec);
    memo.abilityAt.set(u.id, at);
  }
  if (tick < at) return false;
  memo.abilityAt.delete(u.id);
  return true;
}

/** Fähigkeiten: Frost-Stun bei >= N Gegnern in Radius oder Boss/Elite; Titan-Nuke auf Boss/Elite oder fetten Gegner. Gegen einen Boss mit Kit im Fenster (P4). */
export function useAbilities(ctx: BotContext, frostMin = 4, memo?: Memo): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  const defs = new Map(sim.catalog().map((d) => [d.id, d]));
  const slots = sim.slots();
  const live = st.enemies.filter((e) => e.hp > 0);
  if (live.length === 0) return;
  const bs = botTuning.windowAware ? bossStatus(sim, live) : null;
  for (const u of st.units) {
    if (u.owner !== playerId || u.abilityCd > 0) continue;
    const d = defs.get(u.defId) as UnitDef;
    const ab = d.ability;
    if (!ab) continue;
    let fire = false;
    if (ab.kind === 'stunAoe') {
      const s = slots[u.slot];
      const inR = live.filter((e) => (!e.flying || d.canHitAir) && e.stunTicks <= 0 && dist(e, s) <= ab.radiusMilli);
      if (bs) {
        // Boss mit Kit lebt: Frost wartet auf das Fenster bzw. auf einen unterbrechbaren Telegraph (Notfall: kurz vor dem Ziel, Sturm).
        const bossIn = inR.some((e) => e === bs.boss);
        fire = bossIn ? bs.window || bs.interruptible || bs.charging || bs.panic : false;
        if (!fire && inR.filter((e) => e !== bs.boss).length >= frostMin * 2) fire = true;
      } else fire = inR.length >= frostMin || inR.some(isBig);
    } else if (ab.kind === 'nuke') {
      const targets = live.filter((e) => !e.flying || d.canHitAir);
      if (targets.length === 0) continue;
      const dmg = (d.levels[u.level].damageCenti * ab.damageMulBp) / 10000;
      if (bs) {
        // Nuke ins Fenster oder auf den Schild (bricht ihn, öffnet das Fenster); sonst halten, außer Notfall oder Kill.
        fire = bs.window || bs.ward || bs.panic || bs.boss.hp <= dmg * 1.2;
      } else {
        const top = targets.reduce((a, b) => (b.maxHp > a.maxHp ? b : a));
        fire = targets.some(isBig) || top.hp >= dmg * 0.5;
      }
    }
    if (!fire) memo?.abilityAt.delete(u.id);
    else if (abilityGate(ctx, memo, u)) sim.apply(playerId, { type: 'useAbility', entityId: u.id });
  }
}

/**
 * Risikokarten (P4, K1): "nimmt Karten, wenn stark". Stärke = Waves in Folge ohne Lebensverlust und volle Leben (`streak`).
 * Ab 3 Waves ohne Verlust Tier 1, ab 6 Tier 2, ab 10 Tier 3; gewählt wird die Karte mit dem höchsten Bounty-Aufschlag im erlaubten Tier.
 * Nie auf Boss-Waves (der Befehl lehnt ab), nie bei weniger als 85 % Leben und nicht mehr für die späten Waves (ab `CARD_LAST_WAVE`):
 * eine erste Fassung (ab 2/4/6 Waves, 70 % Leben, alle Waves) ließ `aoe` auf Normal von 88 auf 45 % und auf Hard von 43 auf 5 % fallen.
 */
const CARD_LAST_WAVE = 15;
export function takeCard(ctx: BotContext, memo: Memo): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  if (st.wave !== memo.cardWave) {
    memo.streak = memo.cardLives >= 0 && st.lives >= memo.cardLives ? memo.streak + 1 : 0;
    memo.cardWave = st.wave;
    memo.cardLives = st.lives;
  }
  if (st.nextCard !== null || st.phase === 'over' || st.wave < 1 || st.lives * 100 < st.maxLives * 85 || st.wave + 1 > CARD_LAST_WAVE) return;
  const maxTier = memo.streak >= 10 ? 3 : memo.streak >= 6 ? 2 : memo.streak >= 3 ? 1 : 0;
  if (maxTier === 0) return;
  const next = sim.previewWave(st.wave + 1);
  if (!next || !next.cardAllowed) return;
  let best: { id: string; bp: number } | null = null;
  for (const c of sim.cards()) {
    if (c.tier <= maxTier && (best === null || c.bountyBp > best.bp)) best = { id: c.id, bp: c.bountyBp };
  }
  if (best) sim.apply(playerId, { type: 'chooseCard', cardId: best.id });
}

/** Spendet in 50er-Schritten an den Mitspieler aus `to` mit den wenigsten Münzen. */
export function donateSurplus(ctx: BotContext, to: number[], keep: number): void {
  const { sim, playerId } = ctx;
  const players = sim.state.players;
  const mine = players[playerId].coins;
  const amount = Math.floor((mine - keep) / 50) * 50;
  if (amount < 50 || to.length === 0) return;
  const target = to.reduce((a, b) => (players[b].coins < players[a].coins ? b : a));
  sim.apply(playerId, { type: 'donate', to: target, amount });
}

/** Eine komplette Entscheidungsrunde nach Policy (Fähigkeiten, Targeting, Farm, Kauf). */
export function playTurn(ctx: BotContext, memo: Memo, pol: Policy): void {
  useAbilities(ctx, pol.frostMin ?? 4, memo);
  if (pol.cards && !botTuning.cardsDisabled) takeCard(ctx, memo);
  manageTargeting(ctx);
  // Fehlermodell: Reaktionsverzögerung gilt für alle Käufe (Farm, Verkauf, Platzieren, Upgraden).
  if (!buyGate(ctx, memo)) return;
  if (pol.farm) {
    if (pol.farm.sellLate) sellLateFarms(ctx);
    farmStep(ctx, memo, pol);
  }
  rotateEarly(ctx, memo);
  spend(ctx, memo, pol);
}

/**
 * Early-Unit abgeben (Runde 4 / P1): Striker ist als billige Einstiegs-Unit gedacht und fällt später zurück. Ein Team hat nur
 * 6 Typ-Plätze; ist es voll und fehlt ein Legendary/Mythic-Typ, verkauft der Bot ab Wave 8 alle Striker (60 % zurück) und
 * schafft Platz und Münzen. Ohne diese Regel blockiert der Striker den Typ-Platz bis zum Ende (Leave-one-out +43 Punkte).
 */
export const EARLY_UNITS = ['striker'];
export const ROTATE_FROM_WAVE = 8;
export function rotateEarly(ctx: BotContext, memo: Memo): void {
  if (botTuning.disabled) return;
  const env = makeEnv(ctx, memo);
  if (env.wave < botTuning.rotateFromWave) return;
  if (new Set(env.own.map((u) => u.defId)).size < 6) return;
  const early = env.own.filter((u) => EARLY_UNITS.includes(u.defId));
  if (early.length === 0) return;
  const refund = early.reduce((a, u) => a + Math.floor((u.invested * (env.defs.get(u.defId) as UnitDef).sellBp) / 10000), 0);
  const missing = [...env.defs.values()].filter(
    (d) => (d.attack || d.aura) && RARITY_RANK[d.rarity] >= RARITY_RANK[botTuning.rotateMinRarity] && !EARLY_UNITS.includes(d.id) && !env.own.some((u) => u.defId === d.id) && env.own.filter((u) => u.defId === d.id).length < d.cap,
  );
  if (!missing.some((d) => env.coins + refund >= d.placeCost)) return;
  for (const u of early) ctx.sim.apply(ctx.playerId, { type: 'sell', entityId: u.id });
  memo.rotated = true;
}

/** Baut einen Bot aus einer Policy (je Spieler eigene Instanz mit eigenem Gedächtnis). */
export function policyBot(name: string, pol: Policy | (() => Policy)): { name: string; decide(ctx: BotContext): void } {
  const memo = newMemo();
  const p = typeof pol === 'function' ? pol() : pol;
  return { name, decide: (ctx) => playTurn(ctx, memo, p) };
}
