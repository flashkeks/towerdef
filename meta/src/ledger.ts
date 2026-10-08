/**
 * Ledger: unveraenderliche Buchungen, Saldo = Summe. `profile.wallet` ist nur Cache.
 * Eindeutig ist (currency, refType, refId, kind): dieselbe Buchung kann nie zweimal landen.
 * (Gegenueber architecture 7.5 ist `currency` Teil des Schluessels, damit eine Belohnung Crystals UND Gold
 * unter derselben Referenz buchen darf.)
 */
import type { Currency, LedgerEntry, Profile } from './profile';
import { CURRENCIES } from './profile';
import type { MetaEnv } from './env';
import { fail, type Fail } from './result';

/** Bekannte Buchungsarten. `kind` ist ein freier String, neue Pakete duerfen eigene ergaenzen. */
export const KIND = {
  purchase: 'purchase',
  refund: 'refund',
  gachaSpend: 'gacha_spend',
  grant: 'grant',
  adjust: 'adjust',
  reward: 'reward',
  levelUp: 'level_up',
  starterGift: 'starter_gift',
  evolve: 'evolve',
  traitReroll: 'trait_reroll',
  migration: 'migration',
} as const;

export interface BookingInput {
  currency: Currency;
  delta: number;
  kind: string;
  refType: string;
  refId: string;
}

export type Wallet = Record<Currency, number>;

export function balances(ledger: readonly LedgerEntry[]): Wallet {
  const w: Wallet = { crystals: 0, gold: 0 };
  for (const e of ledger) w[e.currency] += e.delta;
  return w;
}

export const balanceOf = (p: Profile, c: Currency): number => balances(p.ledger)[c];

export const bookingKey = (e: Pick<LedgerEntry, 'currency' | 'refType' | 'refId' | 'kind'>): string =>
  `${e.currency}|${e.refType}|${e.refId}|${e.kind}`;

export const hasBooking = (p: Profile, e: Pick<LedgerEntry, 'currency' | 'refType' | 'refId' | 'kind'>): boolean => {
  const k = bookingKey(e);
  return p.ledger.some((x) => bookingKey(x) === k);
};

/** Erste doppelte Buchung im Ledger (fuer die Pruefung beim Laden), sonst `null`. */
export function findDuplicateBooking(ledger: readonly LedgerEntry[]): LedgerEntry | null {
  const seen = new Set<string>();
  for (const e of ledger) {
    const k = bookingKey(e);
    if (seen.has(k)) return e;
    seen.add(k);
  }
  return null;
}

/**
 * Eine Buchung anhaengen. Abgelehnt werden: Betrag 0 oder nicht ganzzahlig (`invalid-amount`), Doppelbuchung (`duplicate-booking`),
 * Saldo wuerde negativ (`not-enough-crystals` / `not-enough-gold`), ausser `allowNegative` (Erstattungen, Korrekturen).
 */
export function book(p: Profile, b: BookingInput, env: Pick<MetaEnv, 'now'>, opts: { allowNegative?: boolean } = {}): { ok: true; profile: Profile; entry: LedgerEntry } | Fail {
  if (!(CURRENCIES as readonly string[]).includes(b.currency)) return fail('invalid-currency');
  if (!Number.isInteger(b.delta) || b.delta === 0) return fail('invalid-amount', 'Amount must be a non-zero integer.');
  if (!b.kind || !b.refType || !b.refId) return fail('invalid-booking', 'kind, refType and refId are required.');
  if (hasBooking(p, b)) return fail('duplicate-booking', 'This booking already exists.');
  const bal = balanceOf(p, b.currency);
  if (bal + b.delta < 0 && !opts.allowNegative) return fail(`not-enough-${b.currency}`, `Not enough ${b.currency}.`);
  const entry: LedgerEntry = { id: `L${String(p.ledger.length + 1).padStart(6, '0')}`, ...b, createdAt: env.now() };
  const wallet = { ...p.wallet, [b.currency]: bal + b.delta };
  return { ok: true, profile: { ...p, ledger: [...p.ledger, entry], wallet }, entry };
}

/** Mehrere Buchungen atomar: schlaegt eine fehl, kommt der Fehler zurueck und das Profil bleibt unveraendert. */
export function bookAll(p: Profile, bs: readonly BookingInput[], env: Pick<MetaEnv, 'now'>, opts: { allowNegative?: boolean } = {}): { ok: true; profile: Profile; entries: LedgerEntry[] } | Fail {
  let cur = p;
  const entries: LedgerEntry[] = [];
  for (const b of bs) {
    const r = book(cur, b, env, opts);
    if (!r.ok) return r;
    cur = r.profile;
    entries.push(r.entry);
  }
  return { ok: true, profile: cur, entries };
}

/** `wallet`-Cache aus dem Ledger neu berechnen. */
export const withWalletFromLedger = (p: Profile): Profile => ({ ...p, wallet: balances(p.ledger) });
