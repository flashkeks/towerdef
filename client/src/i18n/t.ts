import { en, type StringKey } from './en';
import { matchStrings } from './match';

/** Alle Texte aus der zentralen Datei. */
const all: Record<string, string> = { ...en, ...matchStrings };

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
