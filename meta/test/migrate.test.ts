import { describe, expect, it } from 'vitest';
import { book, migrate, newProfile, SCHEMA_VERSION, testEnv } from '../src';

describe('Migration', () => {
  it('aktuelle Version geht unveraendert durch', () => {
    const env = testEnv();
    const r = book(newProfile(env), { currency: 'crystals', delta: 5, kind: 'grant', refType: 't', refId: '1' }, env);
    if (!r.ok) throw new Error('x');
    const m = migrate(JSON.parse(JSON.stringify(r.profile)));
    expect(m).toMatchObject({ ok: true, migratedFrom: SCHEMA_VERSION });
    if (m.ok) expect(m.profile).toEqual(r.profile);
  });
  it('v0 (alte Form mit Zaehlern) wird zu v1 mit Ledger', () => {
    const m = migrate({ id: 'abc', name: 'Old', crystals: 120, gold: 40, units: ['ichigo', 'krillin'], createdAt: '2026-01-01T00:00:00.000Z' });
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.migratedFrom).toBe(0);
    expect(m.profile.schemaVersion).toBe(1);
    expect(m.profile.wallet).toEqual({ crystals: 120, gold: 40 });
    expect(m.profile.ledger).toHaveLength(2);
    expect(Object.keys(m.profile.units)).toEqual(['ichigo', 'krillin']);
    expect(m.profile.displayName).toBe('Old');
  });
  it('kaputt, leer, zu neu -> Fehler-Objekt, keine Exception', () => {
    const base = JSON.parse(JSON.stringify(newProfile(testEnv())));
    const cases: [unknown, string][] = [
      [null, 'profile-corrupt'],
      ['text', 'profile-corrupt'],
      [[], 'profile-corrupt'],
      [{}, 'profile-corrupt'],
      [{ schemaVersion: 'x' }, 'profile-corrupt'],
      [{ schemaVersion: -1 }, 'profile-corrupt'],
      [{ schemaVersion: 0 }, 'profile-corrupt'],
      [{ schemaVersion: SCHEMA_VERSION + 1, id: 'x' }, 'profile-too-new'],
      [{ ...base, ledger: 'kaputt' }, 'profile-corrupt'],
      [{ ...base, units: { striker: { level: 0 } } }, 'profile-corrupt'],
      [{ id: '' }, 'profile-corrupt'],
    ];
    for (const [raw, code] of cases) {
      const m = migrate(raw);
      expect(m, JSON.stringify(raw)).toMatchObject({ ok: false, code });
    }
  });
  it('Ledger mit Doppelbuchung gilt als kaputt', () => {
    const env = testEnv();
    const r = book(newProfile(env), { currency: 'crystals', delta: 5, kind: 'grant', refType: 't', refId: '1' }, env);
    if (!r.ok) throw new Error('x');
    const bad = JSON.parse(JSON.stringify(r.profile));
    bad.ledger.push({ ...bad.ledger[0], id: 'L000002' });
    expect(migrate(bad)).toMatchObject({ ok: false, code: 'profile-corrupt' });
  });
  it('falsches wallet wird aus dem Ledger neu berechnet', () => {
    const env = testEnv();
    const r = book(newProfile(env), { currency: 'crystals', delta: 5, kind: 'grant', refType: 't', refId: '1' }, env);
    if (!r.ok) throw new Error('x');
    const m = migrate({ ...JSON.parse(JSON.stringify(r.profile)), wallet: { crystals: 9999, gold: 77 } });
    expect(m.ok && m.profile.wallet).toEqual({ crystals: 5, gold: 0 });
  });
});
