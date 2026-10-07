import { describe, expect, it } from 'vitest';
import { claimStarterGift, exportProfile, importProfile, newProfile, pull, testEnv } from '../src';

function playedProfile() {
  const env = testEnv(7);
  let p = newProfile(env);
  const s = claimStarterGift(p, env);
  if (!s.ok) throw new Error('x');
  const r = pull(s.profile, 'standard', 10, env);
  if (!r.ok) throw new Error('x');
  p = r.profile;
  return { env, p };
}

describe('Export / Import', () => {
  it('Roundtrip ergibt exakt dasselbe Profil', () => {
    const { env, p } = playedProfile();
    const json = exportProfile(p, env);
    const back = importProfile(json);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.profile).toEqual(p);
  });
  it('Pruefsumme kaputt -> Fehler', () => {
    const { env, p } = playedProfile();
    const file = JSON.parse(exportProfile(p, env));
    file.profile.playerXp += 1000;
    expect(importProfile(JSON.stringify(file))).toMatchObject({ ok: false, code: 'import-bad-checksum' });
    const file2 = JSON.parse(exportProfile(p, env));
    file2.checksum = 'fnv1a64:0000000000000000';
    expect(importProfile(JSON.stringify(file2))).toMatchObject({ ok: false, code: 'import-bad-checksum' });
  });
  it('abgeschnitten, fremdes Format, zu neues Schema', () => {
    const { env, p } = playedProfile();
    const json = exportProfile(p, env);
    expect(importProfile(json.slice(0, 200))).toMatchObject({ ok: false, code: 'import-invalid-json' });
    expect(importProfile('{"a":1}')).toMatchObject({ ok: false, code: 'import-wrong-format' });
    expect(importProfile('null')).toMatchObject({ ok: false, code: 'import-wrong-format' });
  });
  it('Schluesselreihenfolge ist egal (kanonisches JSON)', () => {
    const { env, p } = playedProfile();
    const file = JSON.parse(exportProfile(p, env));
    const reordered = { profile: file.profile, checksum: file.checksum, exportedAt: file.exportedAt, formatVersion: file.formatVersion, format: file.format };
    expect(importProfile(JSON.stringify(reordered)).ok).toBe(true);
  });
});
