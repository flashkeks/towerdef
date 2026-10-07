import { describe, expect, it } from 'vitest';
import { IDEM_MAX, claimStarterGift, newProfile, pull, testEnv, withIdempotency, trimIdem, balanceOf } from '../src';

const KEY = '11111111-1111-4111-8111-111111111111';

describe('Idempotenz', () => {
  it('gleicher Schluessel -> gleiche Antwort, nichts doppelt gebucht', () => {
    const env = testEnv(3);
    const s = claimStarterGift(newProfile(env), env);
    if (!s.ok) throw new Error('x');
    const run = (p: typeof s.profile) => withIdempotency(p, { key: KEY, route: 'pull', request: { bannerId: 'standard', count: 10 } }, env, (q) => pull(q, 'standard', 10, env));
    const a = run(s.profile);
    if (!a.ok) throw new Error(a.message);
    expect(a.replayed).toBe(false);
    const b = run(a.profile);
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    expect(b.profile).toBe(a.profile);
    expect(a.profile.ledger.filter((e) => e.kind === 'gacha_spend')).toHaveLength(1);
    expect(a.profile.pullHistory).toHaveLength(10);
    expect(balanceOf(a.profile, 'crystals')).toBe(0);
  });
  it('gleicher Schluessel, andere Anfrage -> idempotency-key-reuse', () => {
    const env = testEnv(3);
    const s = claimStarterGift(newProfile(env), env);
    if (!s.ok) throw new Error('x');
    const a = withIdempotency(s.profile, { key: KEY, route: 'pull', request: { count: 1 } }, env, (q) => pull(q, 'standard', 1, env));
    if (!a.ok) throw new Error('x');
    expect(withIdempotency(a.profile, { key: KEY, route: 'pull', request: { count: 10 } }, env, (q) => pull(q, 'standard', 10, env))).toMatchObject({ ok: false, code: 'idempotency-key-reuse' });
  });
  it('Fehlschlag wird nicht gespeichert, Retry mit demselben Schluessel moeglich', () => {
    const env = testEnv(3);
    const p = newProfile(env);
    const f = withIdempotency(p, { key: KEY, route: 'pull', request: { count: 1 } }, env, (q) => pull(q, 'standard', 1, env));
    expect(f).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    expect(Object.keys(p.idem)).toHaveLength(0);
  });
  it('ungueltiger Schluessel und Kappung', () => {
    const env = testEnv(3);
    expect(withIdempotency(newProfile(env), { key: 'x', route: 'r', request: 1 }, env, () => { throw new Error('nie'); })).toMatchObject({ ok: false, code: 'invalid-idempotency-key' });
    const idem: Record<string, { route: string; requestHash: string; response: unknown; createdAt: string }> = {};
    for (let i = 0; i < IDEM_MAX + 5; i++) idem[`k${i}`] = { route: 'r', requestHash: 'h', response: i, createdAt: `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}.${String(i).padStart(3, '0')}Z` };
    const t = trimIdem(idem);
    expect(Object.keys(t)).toHaveLength(IDEM_MAX);
    expect(t['k0']).toBeUndefined();
    expect(t[`k${IDEM_MAX + 4}`]).toBeDefined();
  });
});
