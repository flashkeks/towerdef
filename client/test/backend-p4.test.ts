/** P4: Sichtmodelle ueber das Backend, matchSetup, Bindung des Replays ans Profil, Export -> Reset -> Import. */
import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, type KeyValueStore } from '../src/backend/storage';
import { testEnv, unitModsFor, type Profile } from '../src/backend/meta';
import { STAGE_ID } from '../src/sim';
import { starterReplay } from './replay-fixture';

class FakeLs implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}
const key = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const mk = (ls: KeyValueStore = new FakeLs(), seed = 4) => new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(ls), new MemoryTier()]), env: testEnv(seed) });
const started = async (): Promise<LocalBackend> => {
  const be = mk();
  const g = await be.claimStarterGift(key(1));
  if (!g.ok) throw new Error(g.message);
  return be;
};

describe('Sichtmodelle ueber das Backend', () => {
  it('neues Profil: Starter offen, kein Team, keine Units', async () => {
    const be = mk();
    const pv = await be.playerView();
    if (!pv.ok) throw new Error(pv.message);
    expect(pv.player).toMatchObject({ level: 1, crystals: 0, gold: 0, starterGiftAvailable: true, ownedCount: 0, teamTarget: 0 });
    expect(pv.persistence).toBe('localstorage');
    const cv = await be.collectionView();
    expect(cv.ok && cv.units.every((u) => !u.owned)).toBe(true);
    expect(cv.ok && cv.ownedCount).toBe(0);
  });

  it('nach dem Starter: Salden, Sammlung, Team', async () => {
    const be = await started();
    const pv = await be.playerView();
    const cv = await be.collectionView();
    if (!pv.ok || !cv.ok) throw new Error('x');
    expect(pv.player).toMatchObject({ crystals: 450, starterGiftAvailable: false, teamTarget: 6 }); // Starter: 12 AA-Units, Team = die ersten sechs
    expect(pv.player.team).toHaveLength(6);
    expect(cv.ownedCount).toBe(pv.player.ownedCount);
    expect(cv.units.filter((u) => u.inTeam)).toHaveLength(6);
    expect((await be.claimStarterGift(key(2))).ok).toBe(false);
  });

  it('stageView: Hard ab Level 5 gesperrt, Fortschritt nach einem Match', async () => {
    const be = await started();
    const sv = await be.stageView(STAGE_ID);
    if (!sv.ok) throw new Error('x');
    expect(sv.difficulties.map((d) => [d.difficulty, d.unlocked, d.unlockLevel])).toEqual([['normal', true, 1], ['hard', false, 5], ['nightmare', false, 25]]);
    const m = await be.reportMatch(starterReplay({ seed: 1 }), key(3));
    if (!m.ok) throw new Error(m.message);
    const after = await be.stageView(STAGE_ID);
    expect(after.ok && after.difficulties[0]).toMatchObject({ cleared: true, clears: 1, bestWave: 20, firstClearCrystals: 80, repeatCrystals: 20 });
  });

  it('pullHistory: neueste zuerst, begrenzt', async () => {
    const be = await started();
    await be.pull('standard', 10, key(2));
    const h = await be.pullHistory(4);
    if (!h.ok) throw new Error('x');
    expect(h.history).toHaveLength(4);
    const all = await be.pullHistory(30);
    expect(all.ok && all.history).toHaveLength(10);
    expect(all.ok && all.history.slice(0, 4)).toEqual(h.history);
  });

  it('Ladefehler gehen an alle Sichtmodelle', async () => {
    const ls = new FakeLs();
    ls.setItem('dw.meta.profile.a', '{"app":"dw-meta","rev":5,"profile":{"schemaVersion":1,"kaputt":true}}');
    const be = mk(ls);
    for (const r of [await be.playerView(), await be.collectionView(), await be.stageView(STAGE_ID), await be.pullHistory(), await be.matchSetup('normal')]) {
      expect(r).toMatchObject({ ok: false, code: 'profile-corrupt' });
    }
  });
});

describe('matchSetup', () => {
  it('ohne Units: team-empty; Hard gesperrt', async () => {
    expect(await mk().matchSetup('normal')).toMatchObject({ ok: false, code: 'team-empty' });
    const be = await started();
    expect(await be.matchSetup('hard')).toMatchObject({ ok: false, code: 'difficulty-locked' });
  });

  it('liefert Team und Mods, die zum Profil passen; Level-Up aendert die Mods', async () => {
    const be = await started();
    const a = await be.matchSetup('normal');
    if (!a.ok) throw new Error(a.message);
    expect(a.team).toHaveLength(6);
    expect(a.unitMods).toHaveLength(6);
    expect(a.unitMods.every((m) => m.lvlBp === 10000)).toBe(true);
    // Gold per Sieg, dann Level-Up
    const win = await be.reportMatch(starterReplay({ seed: 1 }), key(2));
    if (!win.ok) throw new Error(win.message);
    const unit = a.team[1]!;
    const up = await be.levelUp(unit, key(3));
    if (!up.ok) throw new Error(up.message);
    const b = await be.matchSetup('normal');
    if (!b.ok) throw new Error(b.message);
    expect(b.unitMods.find((m) => m.unit === unit)!.lvlBp).toBeGreaterThan(10000);
    expect(b.unitMods).toEqual(unitModsFor(up.profile, up.profile.team));
  });

  it('Team kleiner als das Ziel: team-incomplete', async () => {
    const be = await started();
    const pv = await be.playerView();
    if (!pv.ok) throw new Error('x');
    await be.setTeam(pv.player.team.slice(0, 3), key(5));
    expect(await be.matchSetup('normal')).toMatchObject({ ok: false, code: 'team-incomplete' });
  });
});

describe('reportMatch ist ans Profil gebunden (P5-Luecke)', () => {
  it('Replay mit besseren Mods als das Profil -> unit-mods-mismatch, keine Belohnung', async () => {
    const be = await started();
    const setup = await be.matchSetup('normal');
    if (!setup.ok) throw new Error('x');
    const cheat = setup.unitMods.map((m) => ({ ...m, lvlBp: 21750 }));
    const replay = starterReplay({ seed: 1, unitMods: cheat });
    const r = await be.reportMatch(replay, key(2));
    expect(r).toMatchObject({ ok: false, code: 'unit-mods-mismatch' });
    const p = await be.loadProfile();
    expect(p.ok && p.profile.wallet).toEqual({ crystals: 450, gold: 0 });
  });

  it('Replay ohne Team oder mit fremdem Team -> Fehlercode', async () => {
    const be = await started();
    const ok = starterReplay({ seed: 1 });
    expect(await be.reportMatch({ ...ok, team: null }, key(2))).toMatchObject({ ok: false, code: 'team-required' });
    expect(await be.reportMatch({ ...ok, team: ok.team!.slice(1) }, key(3))).toMatchObject({ ok: false, code: 'team-mismatch' });
    expect(await be.reportMatch({ ...ok, team: [...ok.team!.slice(1), 'zzz'] }, key(4))).toMatchObject({ ok: false, code: 'unit-not-owned' });
  });

  it('Unit platziert, die nicht im gespeicherten Team ist -> team-invalid', async () => {
    const be = await started();
    const pv = await be.playerView();
    if (!pv.ok) throw new Error('x');
    // Team ohne Striker speichern, dann ein Replay, in dem der Bot Striker setzt
    const without = pv.player.team.filter((u) => u !== 'krillin');
    const t = await be.setTeam(without, key(2));
    if (!t.ok) throw new Error(t.message);
    const stray = starterReplay({ seed: 3, only: ['krillin'], team: without, unitMods: unitModsFor(t.profile, without) });
    expect(await be.reportMatch(stray, key(3))).toMatchObject({ ok: false, code: 'team-invalid' });
  });
});

describe('Export, Reset, Import', () => {
  it('ergibt denselben Stand (Salden, Sammlung, Pity, Verlauf, Team, Stages)', async () => {
    const be = await started();
    await be.pull('standard', 10, key(2));
    // Duplikate aus dem Zug aendern die Sterne: Replay mit den Mods, die `matchSetup` jetzt liefert
    const setup = await be.matchSetup('normal');
    if (!setup.ok) throw new Error(setup.message);
    const m = await be.reportMatch(starterReplay({ seed: 1, only: setup.team, team: setup.team, unitMods: setup.unitMods }), key(3));
    if (!m.ok) throw new Error(m.message);
    const before = await be.loadProfile();
    const exp = await be.exportSave();
    if (!before.ok || !exp.ok) throw new Error('x');
    expect(exp.filename).toMatch(/^duskwardens-save-\d{8}\.json$/);

    const reset = await be.resetProfile();
    expect(reset.ok && reset.profile.wallet).toEqual({ crystals: 0, gold: 0 });
    const blank = await be.loadProfile();
    expect(blank.ok && Object.keys(blank.profile.units)).toHaveLength(0);

    const imp = await be.importSave(exp.json);
    if (!imp.ok) throw new Error(imp.message);
    const after = (await be.loadProfile()) as { ok: true; profile: Profile };
    expect(after.profile).toEqual(before.profile);
    for (const k of ['wallet', 'units', 'pity', 'pullHistory', 'team', 'stages'] as const) expect(after.profile[k]).toEqual(before.profile[k]);
  });

  it('beschaedigte Datei: Fehlercode, Stand bleibt', async () => {
    const be = await started();
    const exp = await be.exportSave();
    if (!exp.ok) throw new Error('x');
    expect(await be.importSave('kein json')).toMatchObject({ ok: false, code: 'import-invalid-json' });
    const doc = JSON.parse(exp.json);
    doc.profile.displayName = 'Mallory';
    expect(await be.importSave(JSON.stringify(doc))).toMatchObject({ ok: false, code: 'import-bad-checksum' });
    const pv = await be.playerView();
    expect(pv.ok && pv.player.crystals).toBe(450);
  });
});
