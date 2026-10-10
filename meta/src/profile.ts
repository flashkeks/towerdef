/**
 * Profil-Schema 11 (zod), neues Profil und Laden mit Reset alter Staende.
 * Reine Funktionen, kein DOM. Ganzzahlen ueberall.
 */
import { z } from 'zod';
import type { Difficulty, HeroType, ModeId, PowerKey, TowerType, Tiers } from '../../sim/src/types';
import { HERO_IDS, HEROES, KNOWLEDGE, POWER_KEYS, STARTER_PACK, STARTER_TOWER_XP, emptyInventory, levelFromXp, nodeById } from './data';

export const SAVE_SCHEMA = 11;
export const SEEN_MATCHES_MAX = 100;

const nat = z.number().int().min(0);
const tierNum = z.number().int().min(0).max(5);
const tiers3 = z.tuple([tierNum, tierNum, tierNum]);
/** Runde 13/14: `longshot`, `market`, `thornweaver`, `alchemist` fehlen in aelteren Staenden und bekommen ihren Startwert (Migration, nichts wird zurueckgesetzt). */
const perTower = <T extends z.ZodType>(s: T, fresh: () => z.output<T>) =>
  z.object({
    ranger: s, bombardier: s, frostcaller: s, longshot: s.default(fresh as never), market: s.default(fresh as never), thornweaver: s.default(fresh as never), alchemist: s.default(fresh as never),
    // Runde 16: aeltere Staende kennen die drei neuen Tuerme nicht
    riverkeeper: s.default(fresh as never), bellringer: s.default(fresh as never), tinker: s.default(fresh as never),
  });
const heroId = z.enum(HERO_IDS as unknown as [HeroType, ...HeroType[]]);
const medalSet = z.object({ easy: z.boolean(), medium: z.boolean(), hard: z.boolean() });
const best = z.object({ round: nat, livesLost: nat });
const inventorySchema = z.object(Object.fromEntries(POWER_KEYS.map((k) => [k, nat.default(0)]))) as unknown as z.ZodType<Record<PowerKey, number>>;
const bestSet = z.object({ easy: best.optional(), medium: best.optional(), hard: best.optional() });

/** Runde 15: Zusatzmodi je Karte (Standard bleibt in `medals`/`best`). Karte -> Modus -> Medaillen. Fehlt in aelteren Staenden = leer. */
const modeMedalsSchema = z.record(z.string(), z.record(z.string(), medalSet));
const modeBestSchema = z.record(z.string(), z.record(z.string(), bestSet));

export const ProfileSchema = z.object({
  schema: z.literal(SAVE_SCHEMA),
  createdAt: z.string().min(1),
  playerXp: nat,
  /** Gesammelte, noch nicht ausgegebene Turm-XP. */
  towerXp: perTower(nat, () => STARTER_TOWER_XP),
  /** Freigeschaltete Stufe je Pfad (hoechste, der Reihe nach). */
  towerTiers: perTower(tiers3, (): Tiers => [0, 0, 0]),
  knowledge: z.array(z.string()),
  medals: z.record(z.string(), medalSet),
  best: z.record(z.string(), bestSet),
  /** Runde 15: Medaillen der Zusatzmodi (Primary Only ... Deflation) je Karte. Standard-Medaillen stehen in `medals`. */
  modeMedals: modeMedalsSchema.default({}),
  /** Runde 15: Bestleistung der Zusatzmodi je Karte. Standard in `best`. */
  modeBest: modeBestSchema.default({}),
  /**
   * Runde 15b: Bestrunde im Freeplay je Karte (hoechste geschaffte Runde ueber der Endrunde der gespielten Schwierigkeit, Standardmodus,
   * ein Wert je Karte). Fehlt in aelteren Staenden = leer (Schema bleibt 11). Alte `best`-Runden (bis 30) bleiben gueltig: sie zaehlen
   * weiter als Rundenstand der Schwierigkeit und sind damit jetzt Runden der gemeinsamen Liste.
   */
  freeplayBest: z.record(z.string(), nat).default({}),
  /** Match-IDs, die schon verbucht sind (juengste hinten). */
  seenMatches: z.array(z.string()).max(SEEN_MATCHES_MAX),
  matchesPlayed: nat,
  matchesWon: nat,
  showResetNotice: z.boolean(),
  /** Runde 12: Sonderwaehrung. Alte 11er-Staende ohne das Feld starten bei 0 und bekommen das Startpaket (`sanitize`). */
  embers: nat.default(0),
  /** Runde 12: Powers im Besitz (Verbrauchsgut). Fehlende Schluessel zaehlen als 0. */
  inventory: inventorySchema.default(() => emptyInventory()),
  /** Runde 12: Startpaket (100 Embers + 1 Gold Drop + 1 Lantern Bomb) schon vergeben. */
  starterPack: z.boolean().default(false),
  /** Runde 16: Helden, die der Spieler besitzt (Embers-Kaeufe; Wren steht immer drin, offen ist er aber erst ab Level 3, Bram ab Level 10 und Sela ab Level 15 auch ohne Kauf: `heroOwned`). Fehlt in aelteren Staenden = ['wren']. */
  heroes: z.array(heroId).default(['wren']),
  /** Runde 16: gewaehlter Held fuer das naechste Match (Vorgabe wren). */
  selectedHero: heroId.default('wren'),
  settings: z.object({ volume: z.number().int().min(0).max(100), unlockAll: z.boolean() }),
});
export type Profile = z.infer<typeof ProfileSchema>;

export function newProfile(now = new Date(0).toISOString()): Profile {
  const per = <T>(v: () => T): Record<TowerType, T> => ({
    ranger: v(), bombardier: v(), frostcaller: v(), longshot: v(), market: v(), thornweaver: v(), alchemist: v(), riverkeeper: v(), bellringer: v(), tinker: v(),
  });
  return {
    schema: SAVE_SCHEMA,
    createdAt: now,
    playerXp: 0,
    towerXp: per(() => STARTER_TOWER_XP),
    towerTiers: per((): Tiers => [0, 0, 0]),
    knowledge: [],
    medals: {},
    best: {},
    modeMedals: {},
    modeBest: {},
    freeplayBest: {},
    seenMatches: [],
    matchesPlayed: 0,
    matchesWon: 0,
    showResetNotice: false,
    embers: STARTER_PACK.embers,
    inventory: { ...emptyInventory(), ...STARTER_PACK.powers },
    starterPack: true,
    heroes: ['wren'],
    selectedHero: 'wren',
    settings: { volume: 70, unlockAll: false },
  };
}

/**
 * Besitzt der Spieler den Helden? Wren ab Level 3, Bram ab Level 10, Sela ab Level 15 - oder (Bram, Sela) mit dem Embers-Kauf in `heroes`.
 * "Alles freischalten" (`settings.unlockAll`) oeffnet alle drei.
 */
export function heroOwned(p: Pick<Profile, 'playerXp' | 'heroes' | 'settings'>, id: HeroType): boolean {
  if (p.settings.unlockAll) return true;
  const meta = HEROES.find((h) => h.id === id);
  if (!meta) return false;
  return levelFromXp(p.playerXp).level >= meta.unlockLevel || (meta.embers !== null && p.heroes.includes(id));
}

export const emptyMedals = (): Record<Difficulty, boolean> => ({ easy: false, medium: false, hard: false });
/** Anzahl der ersten Medaillen (je Karte und Schwierigkeit eine) = Wissenspunkte aus Medaillen (Runde 13). */
export const medalCount = (p: Pick<Profile, 'medals'>): number =>
  Object.values(p.medals).reduce((s, m) => s + (m.easy ? 1 : 0) + (m.medium ? 1 : 0) + (m.hard ? 1 : 0), 0);

/** Medaillen einer Karte in einem Modus (`standard` = die alten `medals`). Immer ein vollstaendiges Objekt. */
export function medalsOf(p: Pick<Profile, 'medals' | 'modeMedals'>, map: string, mode: ModeId = 'standard'): Record<Difficulty, boolean> {
  const m = mode === 'standard' ? p.medals[map] : p.modeMedals[map]?.[mode];
  return m ? { easy: !!m.easy, medium: !!m.medium, hard: !!m.hard } : emptyMedals();
}
/** Bestleistung einer Karte in einem Modus und auf einer Schwierigkeit. */
export function bestOf(p: Pick<Profile, 'best' | 'modeBest'>, map: string, difficulty: Difficulty, mode: ModeId = 'standard'): { round: number; livesLost: number } | undefined {
  return (mode === 'standard' ? p.best[map] : p.modeBest[map]?.[mode])?.[difficulty];
}
/** Alle Medaillen (Standard und Modi), z. B. fuer die Anzeige. Wissenspunkte zaehlt nur `medalCount` (Standard). */
export const allMedalCount = (p: Pick<Profile, 'medals' | 'modeMedals'>): number =>
  medalCount(p) + Object.values(p.modeMedals).reduce((s, byMode) => s + Object.values(byMode).reduce((t, m) => t + (m.easy ? 1 : 0) + (m.medium ? 1 : 0) + (m.hard ? 1 : 0), 0), 0);

export type LoadResult = { profile: Profile; reset: boolean; reason?: 'old-schema' | 'invalid' };

/**
 * Macht aus gespeicherten Rohdaten ein Profil. `null`/`undefined` = nie gespielt: frisches Profil ohne Hinweis.
 * Alles mit anderem oder fehlendem Schema (also jeder Stand bis Runde 10) und alles, was das Schema nicht besteht,
 * wird verworfen: frisches Profil mit `showResetNotice`.
 */
export function loadProfile(raw: unknown, now?: string): LoadResult {
  if (raw === null || raw === undefined) return { profile: newProfile(now), reset: false };
  const r = (raw ?? {}) as { schema?: unknown };
  if (typeof raw !== 'object' || r.schema !== SAVE_SCHEMA) {
    return { profile: { ...newProfile(now), showResetNotice: true }, reset: true, reason: 'old-schema' };
  }
  const p = ProfileSchema.safeParse(raw);
  if (!p.success) return { profile: { ...newProfile(now), showResetNotice: true }, reset: true, reason: 'invalid' };
  return { profile: sanitize(p.data), reset: false };
}

/** Wirft Unbekanntes raus und setzt den Wissensbaum zurueck, wenn er mehr kostet als Punkte da sind oder Voraussetzungen fehlen. */
export function sanitize(p: Profile): Profile {
  const ids = [...new Set(p.knowledge)].filter((id) => nodeById(id));
  const bought = new Set<string>();
  // in Baum-Reihenfolge pruefen (Voraussetzungen stehen vor den Folgeknoten)
  for (const n of KNOWLEDGE) {
    if (!ids.includes(n.id)) continue;
    if (n.requires.length && !n.requires.some((r) => bought.has(r))) continue;
    bought.add(n.id);
  }
  const owned = KNOWLEDGE.filter((n) => bought.has(n.id));
  const spent = owned.reduce((s, n) => s + n.cost, 0);
  const knowledge = spent > levelFromXp(p.playerXp).level - 1 + medalCount(p) ? [] : owned.map((n) => n.id);
  // Runde 16: Helden - Unbekanntes raus, Wren immer drin, Auswahl nur ein besessener Held
  const heroes = HERO_IDS.filter((h) => h === 'wren' || p.heroes.includes(h));
  const withHeroes = { ...p, knowledge, heroes };
  const selectedHero = heroOwned(withHeroes, p.selectedHero) ? p.selectedHero : 'wren';
  return grantStarterPack({ ...withHeroes, selectedHero });
}

/** Startpaket genau einmal (Flag `starterPack`): bestehende 11er-Profile bekommen es beim Laden, nichts wird zurueckgesetzt. */
export function grantStarterPack(p: Profile): Profile {
  if (p.starterPack) return p;
  const inventory = { ...emptyInventory(), ...p.inventory };
  for (const [k, n] of Object.entries(STARTER_PACK.powers) as [PowerKey, number][]) inventory[k] += n;
  return { ...p, embers: p.embers + STARTER_PACK.embers, inventory, starterPack: true };
}
