/** Team-Auswahl: 6 aus 8 Units (gdd.md §5). Reine Logik, die Sim kennt keine Teams: der Client filtert nur die Unit-Leiste. Besitzer: P6. */
import { readJson, TEAM_KEY, writeJson } from './settings';

export const TEAM_SIZE = 6;
/** Vorbelegung beim allerersten Start (Platzhalter, bis Playtests ein besseres Standardteam zeigen). */
export const DEFAULT_TEAM: readonly string[] = ['striker', 'gunner', 'blaster', 'banner', 'frost', 'titan'];

/** Entfernt Unbekannte und Doppelte; ist das Ergebnis nicht genau `TEAM_SIZE` gross, gilt das Standardteam (nur Ids, die es gibt). */
export function normalizeTeam(saved: unknown, validIds: readonly string[]): string[] {
  const ids = Array.isArray(saved) ? saved.filter((x): x is string => typeof x === 'string' && validIds.includes(x)) : [];
  const unique = [...new Set(ids)];
  if (unique.length === TEAM_SIZE) return unique;
  const fallback = DEFAULT_TEAM.filter((id) => validIds.includes(id));
  return fallback.length === TEAM_SIZE ? [...fallback] : validIds.slice(0, TEAM_SIZE);
}

/** Auswahl umschalten: abwaehlen geht immer, hinzufuegen nur bis `TEAM_SIZE`. Gibt ein neues Array zurueck. */
export function toggleUnit(team: readonly string[], id: string): string[] {
  if (team.includes(id)) return team.filter((x) => x !== id);
  return team.length >= TEAM_SIZE ? [...team] : [...team, id];
}

export const isComplete = (team: readonly string[]): boolean => team.length === TEAM_SIZE;

/** Letzte Wahl (gueltig und vollstaendig) oder Standardteam. */
export function loadTeam(validIds: readonly string[]): string[] {
  return normalizeTeam(readJson(TEAM_KEY), validIds);
}

export function saveTeam(team: readonly string[]): void {
  writeJson(TEAM_KEY, team);
}
