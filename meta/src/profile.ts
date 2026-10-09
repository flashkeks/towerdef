/**
 * Profil-Schema 11 (zod), neues Profil und Laden mit Reset alter Staende.
 * Reine Funktionen, kein DOM. Ganzzahlen ueberall.
 */
import { z } from 'zod';
import type { Difficulty, TowerType, Tiers } from '../../sim/src/types';
import { KNOWLEDGE, STARTER_TOWER_XP, levelFromXp, nodeById } from './data';

export const SAVE_SCHEMA = 11;
export const SEEN_MATCHES_MAX = 100;

const nat = z.number().int().min(0);
const tierNum = z.number().int().min(0).max(5);
const tiers3 = z.tuple([tierNum, tierNum, tierNum]);
const perTower = <T extends z.ZodType>(s: T) => z.object({ ranger: s, bombardier: s, frostcaller: s });
const medalSet = z.object({ easy: z.boolean(), medium: z.boolean(), hard: z.boolean() });
const best = z.object({ round: nat, livesLost: nat });
const bestSet = z.object({ easy: best.optional(), medium: best.optional(), hard: best.optional() });

export const ProfileSchema = z.object({
  schema: z.literal(SAVE_SCHEMA),
  createdAt: z.string().min(1),
  playerXp: nat,
  /** Gesammelte, noch nicht ausgegebene Turm-XP. */
  towerXp: perTower(nat),
  /** Freigeschaltete Stufe je Pfad (hoechste, der Reihe nach). */
  towerTiers: perTower(tiers3),
  knowledge: z.array(z.string()),
  medals: z.record(z.string(), medalSet),
  best: z.record(z.string(), bestSet),
  /** Match-IDs, die schon verbucht sind (juengste hinten). */
  seenMatches: z.array(z.string()).max(SEEN_MATCHES_MAX),
  matchesPlayed: nat,
  matchesWon: nat,
  showResetNotice: z.boolean(),
  settings: z.object({ volume: z.number().int().min(0).max(100), unlockAll: z.boolean() }),
});
export type Profile = z.infer<typeof ProfileSchema>;

export function newProfile(now = new Date(0).toISOString()): Profile {
  const per = <T>(v: () => T): Record<TowerType, T> => ({ ranger: v(), bombardier: v(), frostcaller: v() });
  return {
    schema: SAVE_SCHEMA,
    createdAt: now,
    playerXp: 0,
    towerXp: per(() => STARTER_TOWER_XP),
    towerTiers: per((): Tiers => [0, 0, 0]),
    knowledge: [],
    medals: {},
    best: {},
    seenMatches: [],
    matchesPlayed: 0,
    matchesWon: 0,
    showResetNotice: false,
    settings: { volume: 70, unlockAll: false },
  };
}

export const emptyMedals = (): Record<Difficulty, boolean> => ({ easy: false, medium: false, hard: false });

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
  const knowledge = spent > levelFromXp(p.playerXp).level - 1 ? [] : owned.map((n) => n.id);
  return { ...p, knowledge };
}
