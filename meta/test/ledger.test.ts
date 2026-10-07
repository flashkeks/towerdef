import { describe, expect, it } from 'vitest';
import { balances, book, bookAll, newProfile, testEnv, withWalletFromLedger, findDuplicateBooking } from '../src';

const grant = (n: number, ref = 'r1') => ({ currency: 'crystals' as const, delta: n, kind: 'grant', refType: 'test', refId: ref });

describe('Ledger', () => {
  it('Saldo ist die Summe, Wallet wird mitgefuehrt, Original bleibt unveraendert', () => {
    const env = testEnv();
    const p0 = newProfile(env);
    const a = book(p0, grant(100, 'a'), env);
    if (!a.ok) throw new Error('x');
    const b = book(a.profile, { currency: 'gold', delta: 30, kind: 'grant', refType: 'test', refId: 'b' }, env);
    if (!b.ok) throw new Error('x');
    const c = book(b.profile, { currency: 'crystals', delta: -40, kind: 'gacha_spend', refType: 'test', refId: 'c' }, env);
    if (!c.ok) throw new Error('x');
    expect(balances(c.profile.ledger)).toEqual({ crystals: 60, gold: 30 });
    expect(c.profile.wallet).toEqual({ crystals: 60, gold: 30 });
    expect(p0.ledger.length).toBe(0);
    expect(c.profile.ledger.map((e) => e.id)).toEqual(['L000001', 'L000002', 'L000003']);
  });
  it('Doppelbuchung wird abgelehnt', () => {
    const env = testEnv();
    const a = book(newProfile(env), grant(100), env);
    if (!a.ok) throw new Error('x');
    const again = book(a.profile, grant(100), env);
    expect(again).toMatchObject({ ok: false, code: 'duplicate-booking' });
    // gleiche Referenz in anderer Waehrung ist erlaubt (eine Belohnung bucht Crystals und Gold)
    expect(book(a.profile, { ...grant(5), currency: 'gold' }, env).ok).toBe(true);
  });
  it('Abbuchen ueber den Saldo hinaus: not-enough-<waehrung>, ausser allowNegative', () => {
    const env = testEnv();
    const p = newProfile(env);
    expect(book(p, grant(-1), env)).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    expect(book(p, { ...grant(-1), currency: 'gold' }, env)).toMatchObject({ ok: false, code: 'not-enough-gold' });
    const neg = book(p, { ...grant(-1), kind: 'refund' }, env, { allowNegative: true });
    expect(neg.ok && neg.profile.wallet.crystals).toBe(-1);
  });
  it('Betrag 0 und Kommazahlen abgelehnt', () => {
    const env = testEnv();
    const p = newProfile(env);
    expect(book(p, grant(0), env)).toMatchObject({ ok: false, code: 'invalid-amount' });
    expect(book(p, grant(1.5), env)).toMatchObject({ ok: false, code: 'invalid-amount' });
  });
  it('bookAll ist atomar', () => {
    const env = testEnv();
    const p = newProfile(env);
    const r = bookAll(p, [grant(10, 'x'), grant(-50, 'y')], env);
    expect(r.ok).toBe(false);
    expect(p.ledger.length).toBe(0);
  });
  it('findDuplicateBooking und Wallet-Neuberechnung', () => {
    const env = testEnv();
    const a = book(newProfile(env), grant(7), env);
    if (!a.ok) throw new Error('x');
    expect(findDuplicateBooking([...a.profile.ledger, ...a.profile.ledger])).not.toBeNull();
    expect(withWalletFromLedger({ ...a.profile, wallet: { crystals: 999, gold: 0 } }).wallet.crystals).toBe(7);
  });
});
