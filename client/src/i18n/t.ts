import { abilityStrings } from './abilities';
import { en, type StringKey } from './en';

/** Alle Texte: die zentrale Datei plus die Texte der Fähigkeiten (Runde 9 / P1). */
const all: Record<string, string> = { ...en, ...abilityStrings };

export type Params = Record<string, string | number>;

/** Alle Texte laufen hierueber. Unbekannte Schluessel liefern den Schluessel selbst (Tests pruefen Vollstaendigkeit). */
export function t(key: StringKey | (string & {}), params?: Params): string {
  const raw = all[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_m, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

export const hasKey = (key: string): boolean => key in all;

/** Gibt `key` zurueck, wenn vorhanden, sonst `fallback` (z. B. unbekannter Ablehnungsgrund der Sim). */
export const keyOr = (key: string, fallback: StringKey): string => (hasKey(key) ? key : fallback);
