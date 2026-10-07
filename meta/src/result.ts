/**
 * Ergebnis-Typen fuer alle Meta-Funktionen. Spielfehler sind Werte, nie Exceptions
 * (Server und Client behandeln sie gleich, `code` ist maschinenlesbar, `message` Englisch fuer die Anzeige).
 */
import type { Profile } from './profile';

export interface Fail {
  ok: false;
  code: string;
  message: string;
}

/** Erfolg einer Profil-Operation: neues Profil (das alte bleibt unveraendert) plus fachliches Ergebnis. */
export interface OpOk<T> {
  ok: true;
  profile: Profile;
  result: T;
}

export type Op<T> = OpOk<T> | Fail;

export const fail = (code: string, message: string = code): Fail => ({ ok: false, code, message });
export const opOk = <T>(profile: Profile, result: T): OpOk<T> => ({ ok: true, profile, result });
