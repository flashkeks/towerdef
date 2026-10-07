/**
 * Idempotenz (architecture 7.4), lokal im Profil: `profile.idem[key]`.
 * Gleicher Schluessel + gleiche Anfrage -> gespeicherte Antwort, nichts wird nochmal gebucht.
 * Gleicher Schluessel + andere Anfrage -> `idempotency-key-reuse`. Fehlschlaege werden NICHT gespeichert
 * (ein Retry nach "not enough crystals" soll mit demselben Schluessel wieder moeglich sein).
 * Der Aufrufer erzeugt den Schluessel (UUID) je Nutzeraktion.
 */
import type { MetaEnv } from './env';
import { IDEM_MAX, type Profile } from './profile';
import { fail, type Fail, type Op } from './result';
import { canonicalJson, checksum } from './util';

export const requestHash = (request: unknown): string => checksum(canonicalJson(request));

export type IdemOk<T> = { ok: true; profile: Profile; result: T; replayed: boolean };

/** Aelteste Eintraege streichen, bis hoechstens `IDEM_MAX` bleiben. */
export function trimIdem(idem: Profile['idem'], max = IDEM_MAX): Profile['idem'] {
  const entries = Object.entries(idem);
  if (entries.length <= max) return idem;
  entries.sort((a, b) => (a[1].createdAt < b[1].createdAt ? -1 : a[1].createdAt > b[1].createdAt ? 1 : 0));
  return Object.fromEntries(entries.slice(entries.length - max));
}

export type IdemCheck<T> = { kind: 'fail'; fail: Fail } | { kind: 'replay'; ok: IdemOk<T> } | { kind: 'new'; hash: string };

/** Schluessel pruefen: ungueltig, Wiederholung (gespeicherte Antwort) oder neu. */
export function idemCheck<T>(p: Profile, args: { key: string; route: string; request: unknown }): IdemCheck<T> {
  const { key, route, request } = args;
  if (typeof key !== 'string' || key.length < 8 || key.length > 128) return { kind: 'fail', fail: fail('invalid-idempotency-key', 'Idempotency key must be 8-128 characters.') };
  const hash = requestHash({ route, request });
  const prev = p.idem[key];
  if (!prev) return { kind: 'new', hash };
  if (prev.requestHash !== hash) return { kind: 'fail', fail: fail('idempotency-key-reuse', 'This key was already used for a different request.') };
  return { kind: 'replay', ok: { ok: true, profile: p, result: prev.response as T, replayed: true } };
}

/** Antwort unter dem Schluessel ablegen (und die Tabelle kappen). */
export function idemRecord(p: Profile, key: string, route: string, hash: string, response: unknown, env: Pick<MetaEnv, 'now'>): Profile {
  return { ...p, idem: trimIdem({ ...p.idem, [key]: { route, requestHash: hash, response, createdAt: env.now() } }) };
}

/**
 * `fn` fuehrt die eigentliche Aktion aus. Sein `result` muss reines JSON sein (wird gespeichert und bei Wiederholung zurueckgegeben).
 * `request` ist das, was den Aufruf ausmacht (z. B. `{ bannerId, count }`), nie ein Preis oder Ergebnis.
 */
export function withIdempotency<T>(p: Profile, args: { key: string; route: string; request: unknown }, env: Pick<MetaEnv, 'now'>, fn: (p: Profile) => Op<T>): IdemOk<T> | Fail {
  const c = idemCheck<T>(p, args);
  if (c.kind === 'fail') return c.fail;
  if (c.kind === 'replay') return c.ok;
  const r = fn(p);
  if (!r.ok) return r;
  return { ok: true, profile: idemRecord(r.profile, args.key, args.route, c.hash, r.result, env), result: r.result, replayed: false };
}

/** Wie `withIdempotency`, fuer asynchrone Aktionen (Shop-Kauf ueber den Zahlungsanbieter). */
export async function withIdempotencyAsync<T>(p: Profile, args: { key: string; route: string; request: unknown }, env: Pick<MetaEnv, 'now'>, fn: (p: Profile) => Promise<Op<T>>): Promise<IdemOk<T> | Fail> {
  const c = idemCheck<T>(p, args);
  if (c.kind === 'fail') return c.fail;
  if (c.kind === 'replay') return c.ok;
  const r = await fn(p);
  if (!r.ok) return r;
  return { ok: true, profile: idemRecord(r.profile, args.key, args.route, c.hash, r.result, env), result: r.result, replayed: false };
}
