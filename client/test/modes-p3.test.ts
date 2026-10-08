/** Runde 9 / P3 im Client: Legend Stages und Raids ueber das Backend (Replay -> Belohnung), Raid-Shop, Evolution mit Material, Texte, Weltkarten-Modell. */
import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, type KeyValueStore } from '../src/backend/storage';
import { WORLDS, exportProfile, testEnv, type Profile } from '../src/backend/meta';
import { en } from '../src/i18n/en';
import { hasKey, t } from '../src/i18n/t';
import { loadBrowserData } from '../src/sim';
import { affinityChips, modeActCardModel, modeTabModel } from '../src/ui/world-model';
import { rewardView, stageCardView } from '../src/ui/meta-model';
import { starterReplay } from './replay-fixture';

class FakeLs implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}
const key = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const mk = () => new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(new FakeLs()), new MemoryTier()]), env: testEnv(2) });
const data = loadBrowserData();

/** Backend mit Starter-Geschenk und geschafften Acts der ersten Welten; `inv` = Inventar */
async function setup(worlds = 1, inv: Profile['inventory'] = { raidMarks: 0, materials: {} }): Promise<LocalBackend> {
  const be = mk();
  const g = await be.claimStarterGift(key(900));
  if (!g.ok) throw new Error(g.message);
  const p: Profile = {
    ...g.profile,
    inventory: inv,
    stages: Object.fromEntries(WORLDS.slice(0, worlds).flatMap((w) => w.acts.map((a) => [a.stageId, { normal: { clears: 1, firstClearAt: 'x', bestWave: a.waves } }]))),
  };
  const r = await be.importSave(exportProfile(p, testEnv(3)));
  if (!r.ok) throw new Error(r.message);
  return be;
}

describe('Browser-Daten: Legend Stages und Raids', () => {
  it('alle 49 Stages der 8 Legend Stages und 11 Raids sind da, mit Modus und eigenen Wellen', () => {
    const ids = Object.keys(data.stages).filter((k) => k.startsWith('legend-') || k.startsWith('raid-'));
    expect(ids).toHaveLength(49);
    for (const id of ids) expect(data.stages[id].mode, id).toBeTruthy();
    expect(data.stages['legend-space-center-1'].affinity?.resist.physical).toBe(40);
    expect(data.stages['raid-sand-village-midnight-attack'].waves).toHaveLength(20);
  });
});

describe('Backend: Legend Stage mit echtem Replay', () => {
  it('gesperrt ohne Act 6 der Host-Welt: matchSetup und Belohnung lehnen ab (stage-locked)', async () => {
    const be = mk();
    await be.claimStarterGift(key(900));
    expect(await be.matchSetup('normal', 'legend-space-center-1')).toMatchObject({ ok: false, code: 'stage-locked' });
    const replay = starterReplay({ stage: 'legend-space-center-1', only: ['goku_ssj3'] });
    expect(await be.reportMatch(replay, key(1))).toMatchObject({ ok: false, code: 'stage-locked' });
  });

  it('Sieg bringt Material aus dem nachgerechneten Replay, einmal; Anzeige-Zeilen nennen es', async () => {
    const be = await setup();
    expect(await be.matchSetup('normal', 'legend-space-center-1')).toMatchObject({ ok: true });
    const replay = starterReplay({ stage: 'legend-space-center-1', only: ['goku_ssj3'] });
    expect(replay.result).toBe('win');
    const r = await be.reportMatch(replay, key(1));
    if (!r.ok) throw new Error(r.message);
    expect(r.reward.mode).toBe('legend');
    expect(r.reward.materials!.disc_fragment).toBeGreaterThan(0);
    expect(r.profile.inventory.materials.disc_fragment).toBe(r.reward.materials!.disc_fragment);
    const lines = rewardView(r.reward, true).lines;
    expect(lines.some((l) => l.kind === 'material' && /Disc Fragment/.test(l.text))).toBe(true);
    expect(await be.reportMatch(replay, key(2))).toMatchObject({ ok: false, code: 'already-reported' });
    // Spielerwerte sehen das Material
    const pv = await be.playerView();
    expect(pv.ok && pv.player.materials).toEqual([{ id: 'disc_fragment', name: 'Disc Fragment', count: r.reward.materials!.disc_fragment }]);
  });

  it('Stufenwahl-Modell: Material in der Stufenkarte, Resistenz-Chips', async () => {
    const be = await setup();
    const sv = await be.stageView('legend-space-center-1');
    if (!sv.ok) throw new Error(sv.message);
    const c = stageCardView(sv.difficulties[0]);
    expect(c.extraText).toMatch(/x Disc Fragment/);
    expect(sv.info!.affinity).toBeTruthy();
    const chips = affinityChips(sv.info!.affinity!);
    expect(chips.map((x) => `${x.kind}:${x.key}:${x.value}`)).toEqual(['resist:physical:40', 'weak:magic:30']);
  });
});

describe('Backend: Raid, Raid-Marken und Raid-Shop', () => {
  it('Raid-Sieg zahlt Raid-Marken, Kauf im Shop zieht sie ab (idempotent), Material landet im Inventar', async () => {
    const be = await setup(3);
    const replay = starterReplay({ stage: 'raid-sacred-planet-1', only: ['goku_ssj3'] });
    expect(replay.result).toBe('win');
    const r = await be.reportMatch(replay, key(1));
    if (!r.ok) throw new Error(r.message);
    expect(r.reward).toMatchObject({ mode: 'raid', raidMarks: 55 }); // 15 (Act 1 von 5) + 40 Erst-Clear
    expect(r.profile.inventory.raidMarks).toBe(55);
    const shop = await be.raidShop();
    if (!shop.ok) throw new Error(shop.message);
    expect(shop.shop.raidMarks).toBe(55);
    expect(shop.shop.offers.find((o) => o.id === 'gold-1')).toMatchObject({ canBuy: true, price: 15 });
    expect(shop.shop.offers.find((o) => o.id === 'mat-ninja_scroll')).toMatchObject({ canBuy: true });
    const b1 = await be.buyRaidOffer('mat-ninja_scroll', key(10));
    if (!b1.ok) throw new Error(b1.message);
    expect(b1.profile.inventory).toEqual({ raidMarks: 30, materials: { ninja_scroll: 5 } });
    const again = await be.buyRaidOffer('mat-ninja_scroll', key(10));
    expect(again).toMatchObject({ ok: true, replayed: true });
    expect(again.ok && again.profile.inventory.raidMarks).toBe(30);
    expect(await be.buyRaidOffer('crystals-1', key(11))).toMatchObject({ ok: true });
    expect(await be.buyRaidOffer('crystals-1', key(12))).toMatchObject({ ok: false, code: 'not-enough-raid-marks' });
    expect(await be.buyRaidOffer('nope', key(13))).toMatchObject({ ok: false, code: 'unknown-offer' });
  });

  it('worldView listet Legend Stages und Raids mit Sperre, Garantie und Marken', async () => {
    const be = await setup(3, { raidMarks: 12, materials: { quirk_shard: 3 } });
    const w = await be.worldView();
    if (!w.ok) throw new Error(w.message);
    expect(w.world.legend).toHaveLength(8);
    expect(w.world.raids).toHaveLength(11);
    expect(w.world.raidMarks).toBe(12);
    const sp = w.world.raids.find((r) => r.id === 'sacred-planet')!;
    expect(sp.unlocked).toBe(true);
    expect(modeTabModel(sp)).toMatchObject({ locked: false, progress: '0 / 10 clears', pct: 0 });
    expect(modeActCardModel(sp.acts[0], sp)).toMatchObject({ state: 'open', rewardText: '15 Raid Marks per win' });
    // 3 Welten geschafft: Space Center (Host Greenie) offen, Magic Hills (Host Magic Town, Welt 9) gesperrt
    expect(w.world.legend[0]).toMatchObject({ id: 'space-center', unlocked: true });
    expect(w.world.legend[7]).toMatchObject({ id: 'magic-hills-elf-invasion', unlocked: false });
    expect(modeTabModel(w.world.legend[7]).locked).toBe(true);
  });
});

describe('Backend: Evolution braucht Material', () => {
  it('ohne Material gesperrt mit Grund, mit Material verbraucht', async () => {
    const be = await setup(1, { raidMarks: 0, materials: {} });
    const c1 = await be.collectionView();
    if (!c1.ok) throw new Error(c1.message);
    const goku = c1.units.find((u) => u.unitId === 'goku_ssj3')!;
    expect(goku.evolution!.material).toMatchObject({ id: 'crystallite', amount: 15, owned: 0, legendName: 'Virtual Dungeon (Bosses)' });
    expect(goku.evolution!.ready).toBe(false);
    expect(await be.evolve('goku_ssj3', key(20))).toMatchObject({ ok: false });
    const p = (await be.loadProfile()) as { ok: true; profile: Profile };
    const rich: Profile = {
      ...p.profile,
      inventory: { raidMarks: 0, materials: { crystallite: 20 } },
      ledger: [...p.profile.ledger, { id: 'L900001', currency: 'crystals', delta: 1000, kind: 'grant', refType: 't', refId: 'c', createdAt: 'x' }, { id: 'L900002', currency: 'gold', delta: 9000, kind: 'grant', refType: 't', refId: 'g', createdAt: 'x' }],
    };
    expect((await be.importSave(exportProfile(rich, testEnv(4)))).ok).toBe(true);
    const ev = await be.evolve('goku_ssj3', key(21));
    if (!ev.ok) throw new Error(ev.message);
    expect(ev.evolution.material).toEqual({ material: 'crystallite', amount: 15 });
    expect(ev.profile.inventory.materials.crystallite).toBe(5);
  });
});

describe('Texte', () => {
  it('Material, Raid-Waehrung, Shop und Fehlercodes haben Texte', () => {
    for (const k of ['err.evolution-needs-material', 'err.not-enough-raid-marks', 'err.offer-sold-out', 'err.unknown-offer', 'raidshop.title', 'world.mode.legend', 'world.mode.raids']) expect(hasKey(k), k).toBe(true);
    expect(t('world.reward.marks', { n: 20 })).toBe('20 Raid Marks per win');
    for (const k of Object.keys(en).filter((x) => x.startsWith('affin.'))) expect(en[k as keyof typeof en].length).toBeGreaterThan(0);
  });
  it('jede Resistenz/Schwaeche in den Modus-Daten hat einen Namen', () => {
    for (const s of Object.values(data.stages)) for (const k of [...Object.keys(s.affinity?.resist ?? {}), ...Object.keys(s.affinity?.weakBp ?? {})]) expect(hasKey(`affin.${k}`), `${s.id}: ${k}`).toBe(true);
  });
});
