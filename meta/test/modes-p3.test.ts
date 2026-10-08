/** Runde 9 / P3: Legend Stages, Raids, Material, Raid-Waehrung, Raid-Shop, Schema 3. */
import { describe, expect, it } from 'vitest';
import {
  ProfileSchema,
  RAIDS,
  LEGEND_STAGES,
  MATERIALS,
  SCHEMA_VERSION,
  UNIT_CATALOG,
  allRecipes,
  balanceOf,
  buyRaidOffer,
  evolutionMaterial,
  evolutionView,
  evolve,
  isStageUnlocked,
  materialCount,
  migrate,
  newProfile,
  playerView,
  raidClears,
  raidOffers,
  raidShopView,
  rarityOf,
  rewardForMatch,
  rewardFromReplay,
  stageLock,
  stageView,
  testEnv,
  withIdempotency,
  worldView,
  WORLDS,
  type Profile,
} from '../src';
import { botReplay } from './replay-fixture';

const env = () => testEnv(5);
const fresh = (): Profile => newProfile(env());
const summary = (stageId: string, over: Record<string, unknown> = {}) => ({ stageId, difficulty: 'normal', outcome: 'win' as const, waveReached: 20, replayHash: `${stageId}-${Math.random()}`, ...over });
const worldActs = (id: string, n = 6) => WORLDS.find((w) => w.id === id)!.acts.slice(0, n).map((a) => a.stageId);
const cleared = (...stages: string[]): Profile => ({
  ...fresh(),
  stages: Object.fromEntries(stages.map((s) => [s, { normal: { clears: 1, firstClearAt: 'x', bestWave: 20 } }])),
});
const open = (...worldIds: string[]): Profile => cleared(...worldIds.flatMap((w) => worldActs(w)));
const ok = <T>(r: { ok: boolean }): { profile: Profile; result: T } => {
  if (!r.ok) throw new Error(String((r as { message?: string }).message));
  return r as unknown as { profile: Profile; result: T };
};

describe('Schema 3: Inventar und Migration', () => {
  it('Schema-Version 3, neues Profil hat ein leeres Inventar', () => {
    expect(SCHEMA_VERSION).toBe(3);
    const p = fresh();
    expect(p.schemaVersion).toBe(3);
    expect(p.inventory).toEqual({ raidMarks: 0, materials: {} });
    expect(ProfileSchema.safeParse({ ...p, inventory: { raidMarks: -1, materials: {} } }).success).toBe(false);
    expect(ProfileSchema.safeParse({ ...p, inventory: { raidMarks: 0, materials: { x: 1.5 } } }).success).toBe(false);
  });

  it('Migration 2 -> 3: Inventar kommt dazu, alles andere bleibt (Ledger, Stages, Units, Team, Flags)', () => {
    const p = open('greenie');
    const v2: Record<string, unknown> = JSON.parse(JSON.stringify(p));
    delete v2.inventory;
    v2.schemaVersion = 2;
    v2.wallet = { crystals: 5, gold: 5 };
    v2.ledger = [{ id: 'L000001', currency: 'crystals', delta: 5, kind: 'grant', refType: 't', refId: 'a', createdAt: 'x' }];
    v2.units = { krillin: { level: 3, xp: 0, copies: 2, stars: 2, firstObtainedAt: 'x' } };
    v2.team = ['krillin'];
    const m = migrate(v2);
    if (!m.ok) throw new Error(m.message);
    expect(m.migratedFrom).toBe(2);
    expect(m.profile.schemaVersion).toBe(3);
    expect(m.profile.inventory).toEqual({ raidMarks: 0, materials: {} });
    expect(m.profile.wallet.crystals).toBe(5);
    expect(m.profile.units.krillin!.level).toBe(3);
    expect(m.profile.team).toEqual(['krillin']);
    expect(Object.keys(m.profile.stages)).toEqual(Object.keys(p.stages));
    // zweimal laden aendert nichts
    const again = migrate(JSON.parse(JSON.stringify(m.profile)));
    expect(again).toMatchObject({ ok: true, migratedFrom: 3 });
  });

  it('Migration 1 -> 3 laeuft durch beide Schritte; zu neue Version wird abgelehnt', () => {
    const v1: Record<string, unknown> = JSON.parse(JSON.stringify(fresh()));
    delete v1.inventory;
    v1.schemaVersion = 1;
    const m = migrate(v1);
    expect(m).toMatchObject({ ok: true, migratedFrom: 1 });
    expect(migrate({ ...JSON.parse(JSON.stringify(fresh())), schemaVersion: 4 })).toMatchObject({ ok: false, code: 'profile-too-new' });
  });

  it('ein kaputtes Inventar (negative Menge) wird nicht uebernommen, sondern bereinigt', () => {
    const v2: Record<string, unknown> = JSON.parse(JSON.stringify(fresh()));
    v2.schemaVersion = 2;
    v2.inventory = { raidMarks: -3, materials: { quirk_shard: -1, ok: 4 } };
    const m = migrate(v2);
    if (!m.ok) throw new Error(m.message);
    expect(m.profile.inventory).toEqual({ raidMarks: 0, materials: { ok: 4 } });
  });
});

describe('Legend Stages: Freischaltung', () => {
  it('Space Center (Host Greenie) ist erst nach Act 6 von Planet Greenie offen, Acts nacheinander', () => {
    expect(stageLock(fresh(), 'legend-space-center-1')).toEqual({ kind: 'world', worldId: 'greenie', worldName: 'Planet Greenie', afterAct: 6 });
    expect(isStageUnlocked(cleared(...worldActs('greenie', 5)), 'legend-space-center-1')).toBe(false);
    const p = open('greenie');
    expect(isStageUnlocked(p, 'legend-space-center-1')).toBe(true);
    expect(stageLock(p, 'legend-space-center-2')).toEqual({ kind: 'act', act: 1 });
    expect(isStageUnlocked({ ...p, stages: { ...p.stages, 'legend-space-center-1': { normal: { clears: 1, firstClearAt: 'x', bestWave: 20 } } } }, 'legend-space-center-2')).toBe(true);
  });

  it('jede Legend Stage ist an Act 6 ihrer Host-Welt gebunden, jeder Raid an Act 3', () => {
    for (const l of LEGEND_STAGES) {
      expect(l.unlock.afterAct).toBe(6);
      expect(stageLock(open(l.hostWorldId), l.acts[0].stageId), l.id).toBeNull();
    }
    for (const r of RAIDS) {
      expect(stageLock(fresh(), r.acts[0].stageId), r.id).not.toBeNull();
      expect(stageLock(cleared(...worldActs(r.hostWorldId, 3)), r.acts[0].stageId), r.id).toBeNull();
    }
  });

  it('gesperrte Stage zahlt nichts (stage-locked), auch Raids', () => {
    expect(rewardForMatch(fresh(), summary('legend-space-center-1'), env())).toMatchObject({ ok: false, code: 'stage-locked' });
    expect(rewardForMatch(fresh(), summary('raid-sacred-planet-1'), env())).toMatchObject({ ok: false, code: 'stage-locked' });
    const replay = botReplay({ stage: 'legend-space-center-1', only: ['goku_ssj3'] });
    expect(rewardFromReplay(fresh(), replay, env())).toMatchObject({ ok: false, code: 'stage-locked' });
  });
});

describe('Legend Stages: Belohnung und Material', () => {
  it('Erst-Clear: Crystals x1,5, Material (grosse Menge), Wiederholung kleiner; Hard x1,5 Material', () => {
    const p = open('greenie');
    const act = LEGEND_STAGES.find((l) => l.id === 'space-center')!.acts[0];
    const a = ok<{ crystals: number; materials: Record<string, number>; firstClear: boolean; mode: string }>(rewardForMatch(p, summary(act.stageId), env()));
    expect(a.result).toMatchObject({ crystals: 120, firstClear: true, mode: 'legend', materials: { disc_fragment: act.drop!.first } });
    expect(materialCount(a.profile, 'disc_fragment')).toBe(act.drop!.first);
    const b = ok<{ crystals: number; materials: Record<string, number> }>(rewardForMatch(a.profile, summary(act.stageId), env()));
    expect(b.result.materials.disc_fragment).toBe(act.drop!.repeat);
    expect(b.result.crystals).toBe(30);
    expect(materialCount(b.profile, 'disc_fragment')).toBe(act.drop!.first + act.drop!.repeat);
    const lvl = { ...p, playerLevel: 5, playerXp: 600 };
    const h = ok<{ materials: Record<string, number> }>(rewardForMatch(lvl, summary(act.stageId, { difficulty: 'hard' }), env()));
    expect(h.result.materials.disc_fragment).toBe(Math.floor((act.drop!.first * 15000 + 5000) / 10000));
  });

  it('Niederlage gibt kein Material und keine Crystals, aber Gold nach Wellen', () => {
    const p = open('greenie');
    const r = ok<{ crystals: number; gold: number; materials?: unknown }>(rewardForMatch(p, summary('legend-space-center-1', { outcome: 'loss', waveReached: 10 }), env()));
    expect(r.result.crystals).toBe(0);
    expect(r.result.gold).toBeGreaterThan(0);
    expect(r.result.materials).toBeUndefined();
    expect(r.profile.inventory.materials).toEqual({});
  });

  it('echtes Replay: Goku SSJ3 schafft Space Center Act 1, Material kommt aus dem nachgerechneten Replay, zweimal melden zaehlt einmal', () => {
    const p = open('greenie');
    const replay = botReplay({ stage: 'legend-space-center-1', only: ['goku_ssj3'] });
    expect(replay.result).toBe('win');
    const r = ok<{ materials: Record<string, number> }>(rewardFromReplay(p, replay, env()));
    expect(r.result.materials.disc_fragment).toBeGreaterThan(0);
    expect(rewardFromReplay(r.profile, replay, env())).toMatchObject({ ok: false, code: 'already-reported' });
    // umgebogener Kopf: andere Stage -> anderer Hash
    expect(rewardFromReplay(p, { ...replay, stage: 'legend-space-center-2' }, env())).toMatchObject({ ok: false });
  });
});

describe('Raids: Belohnung, Meilensteine, garantierte Unit', () => {
  const stage = 'raid-sand-village-midnight-attack';
  const base = () => cleared(...worldActs('sand-village', 3));
  const win = (p: Profile, over: Record<string, unknown> = {}) => ok<Record<string, any>>(rewardForMatch(p, summary(stage, over), env()));

  it('Erst-Clear: 20 Marken + 40 Bonus, danach 20; Hard x1,5; Crystals kleiner als Legend', () => {
    const a = win(base());
    expect(a.result).toMatchObject({ mode: 'raid', raidMarks: 60, firstClear: true, crystals: 64 });
    expect(a.profile.inventory.raidMarks).toBe(60);
    const b = win(a.profile);
    expect(b.result.raidMarks).toBe(20);
    expect(b.profile.inventory.raidMarks).toBe(80);
    const h = win({ ...base(), playerLevel: 5, playerXp: 600 }, { difficulty: 'hard' });
    expect(h.result.raidMarks).toBe(30 + 40);
  });

  it('Meilenstein bei 5 Siegen: +250 Crystals einmalig; bei 10: 100 Marken und die garantierte Unit, einmalig', () => {
    let p = base();
    const got: Record<number, Record<string, any>> = {};
    for (let i = 1; i <= 12; i++) {
      const r = win(p);
      p = r.profile;
      got[i] = r.result;
    }
    expect(got[4].milestones).toBeUndefined();
    expect(got[5].milestones).toEqual([{ clears: 5, crystals: 250, raidMarks: 0 }]);
    expect(got[10].milestones).toEqual([{ clears: 10, crystals: 0, raidMarks: 100 }]);
    expect(got[10].unit).toEqual({ id: 'naruto_pts', isNew: true });
    expect(got[11].unit).toBeUndefined();
    expect(got[12].milestones).toBeUndefined();
    expect(p.units.naruto_pts).toMatchObject({ copies: 1, level: 1 });
    expect(raidClears(p, 'sand-village-midnight-attack')).toBe(12);
    expect(p.flags['raidunit:sand-village-midnight-attack']).toBe(true);
  });

  it('besitzt man die Garantie-Unit schon, gibt es eine Kopie dazu', () => {
    let p = base();
    p = { ...p, units: { naruto_pts: { level: 4, xp: 0, copies: 1, stars: 1, firstObtainedAt: 'x' } } };
    for (let i = 0; i < 10; i++) p = win(p).profile;
    expect(p.units.naruto_pts).toMatchObject({ copies: 2, level: 4 });
  });

  it('Niederlage: keine Marken, kein Meilenstein, kein Fortschritt Richtung Garantie', () => {
    const r = ok<Record<string, any>>(rewardForMatch(base(), summary(stage, { outcome: 'loss', waveReached: 12 }), env()));
    expect(r.result.raidMarks).toBeUndefined();
    expect(r.profile.inventory.raidMarks).toBe(0);
    expect(raidClears(r.profile, 'sand-village-midnight-attack')).toBe(0);
  });

  it('Spider-Raid (Ant Kingdom Midnight) braucht 15 Siege; Mehr-Act-Raid zaehlt Siege ueber alle Acts', () => {
    expect(RAIDS.find((r) => r.id === 'ant-kingdom-midnight')!.guarantee).toEqual({ unit: 'feitan', clears: 15 });
    const sp = RAIDS.find((r) => r.id === 'sacred-planet')!;
    expect(sp.acts).toHaveLength(5);
    let p = cleared(...worldActs('greenie', 3));
    for (let i = 1; i <= 5; i++) {
      p = ok<Record<string, any>>(rewardForMatch(p, summary(`raid-sacred-planet-${i}`), env())).profile;
      expect(isStageUnlocked(p, `raid-sacred-planet-${Math.min(5, i + 1)}`)).toBe(true);
    }
    expect(raidClears(p, 'sacred-planet')).toBe(5);
    expect(p.flags['raidms:sacred-planet:5']).toBe(true);
    expect(p.wallet.crystals).toBeGreaterThanOrEqual(250);
  });

  it('echtes Replay eines Raids: Goku SSJ3 schafft Sand Village (Midnight Attack), Marken kommen aus dem Replay', () => {
    const replay = botReplay({ stage: stage, only: ['goku_ssj3'] });
    expect(replay.result).toBe('win');
    const r = ok<{ raidMarks: number }>(rewardFromReplay(base(), replay, env()));
    expect(r.result.raidMarks).toBe(60);
    expect(rewardFromReplay(r.profile, replay, env())).toMatchObject({ ok: false, code: 'already-reported' });
  });
});

describe('Evolution braucht Material', () => {
  const own = (p: Profile, id: string): Profile => ({ ...p, units: { ...p.units, [id]: { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: 'x' } } });
  const rich = (): Profile => ({ ...fresh(), ledger: [
    { id: 'L000001', currency: 'crystals', delta: 100000, kind: 'grant', refType: 't', refId: 'c', createdAt: 'x' },
    { id: 'L000002', currency: 'gold', delta: 100000, kind: 'grant', refType: 't', refId: 'g', createdAt: 'x' },
  ], wallet: { crystals: 100000, gold: 100000 } });

  it('jedes Rezept hat ein Material aus dem Pool seiner Seltenheit, stabil, Menge nach Seltenheit', () => {
    const ids = new Set(MATERIALS.map((m) => m.id));
    for (const r of allRecipes()) {
      const need = evolutionMaterial(r.from);
      expect(need, r.from).not.toBeNull();
      expect(ids.has(need!.material)).toBe(true);
      expect(evolutionMaterial(r.from)).toEqual(need);
      const rar = rarityOf(r.to[0]!.id)!;
      expect(need!.amount).toBe({ rare: 4, epic: 6, legendary: 10, mythic: 15, secret: 25, exclusive: 25 }[rar]);
    }
    expect(evolutionMaterial(UNIT_CATALOG.find((u) => !allRecipes().some((r) => r.from === u.id))!.id)).toBeNull();
  });

  it('ohne Material: evolution-needs-material, nichts gebucht; mit Material wird es verbraucht', () => {
    const from = 'ainz';
    const need = evolutionMaterial(from)!;
    const poor = own(rich(), from);
    expect(evolve(poor, from, env())).toMatchObject({ ok: false, code: 'evolution-needs-material' });
    const v0 = evolutionView(from, poor)!;
    expect(v0.ready).toBe(false);
    expect(v0.reason).toContain('Needs');
    expect(v0.material).toMatchObject({ id: need.material, amount: need.amount, owned: 0 });
    const full: Profile = { ...poor, inventory: { raidMarks: 0, materials: { [need.material]: need.amount + 3 } } };
    expect(evolutionView(from, full)).toMatchObject({ ready: true });
    const r = ok<{ material: unknown }>(evolve(full, from, env()));
    expect(r.result.material).toEqual(need);
    expect(materialCount(r.profile, need.material)).toBe(3);
    expect(balanceOf(r.profile, 'crystals')).toBe(100000 - 600);
    // genau passend: Eintrag verschwindet
    const exact = ok(evolve({ ...poor, inventory: { raidMarks: 0, materials: { [need.material]: need.amount } } }, from, env()));
    expect(exact.profile.inventory.materials[need.material]).toBeUndefined();
  });

  it('fehlendes Geld UND Material: Fehler, Profil unveraendert', () => {
    const p = { ...own(rich(), 'ainz'), inventory: { raidMarks: 0, materials: {} } } as Profile;
    const before = JSON.stringify(p);
    evolve(p, 'ainz', env());
    expect(JSON.stringify(p)).toBe(before);
  });
});

describe('Raid-Shop', () => {
  const marks = (n: number): Profile => ({ ...fresh(), inventory: { raidMarks: n, materials: {} } });

  it('Angebote: Gold, Crystals, 8 Materialien und je Raid-Unit eines; Preise > 0', () => {
    const o = raidOffers();
    expect(o.filter((x) => x.kind === 'material')).toHaveLength(MATERIALS.length);
    expect(o.filter((x) => x.kind === 'unit').map((x) => x.unitId).sort()).toEqual([...new Set(RAIDS.map((r) => r.guarantee!.unit))].sort());
    for (const x of o) expect(x.price).toBeGreaterThan(0);
    expect(new Set(o.map((x) => x.id)).size).toBe(o.length);
  });

  it('Kauf: Marken weg, Ware da; Limit und zu wenig Marken lehnen ab', () => {
    const g = ok(buyRaidOffer(marks(100), 'gold-1', env()));
    expect(g.profile.inventory.raidMarks).toBe(85);
    expect(balanceOf(g.profile, 'gold')).toBe(2000);
    const m = ok(buyRaidOffer(marks(100), 'mat-quirk_shard', env()));
    expect(materialCount(m.profile, 'quirk_shard')).toBe(5);
    expect(buyRaidOffer(marks(5), 'gold-1', env())).toMatchObject({ ok: false, code: 'not-enough-raid-marks' });
    expect(buyRaidOffer(marks(5), 'gibtsnicht', env())).toMatchObject({ ok: false, code: 'unknown-offer' });
    let p = marks(10_000);
    for (let i = 0; i < 6; i++) p = ok(buyRaidOffer(p, 'mat-disc_fragment', env())).profile;
    expect(buyRaidOffer(p, 'mat-disc_fragment', env())).toMatchObject({ ok: false, code: 'offer-sold-out' });
    expect(raidShopView(p).offers.find((x) => x.id === 'mat-disc_fragment')).toMatchObject({ soldOut: true, bought: 6, canBuy: false });
  });

  it('Unit-Angebot: einmal kaufbar, danach besessen; Preis nach Seltenheit', () => {
    const offer = raidOffers().find((x) => x.unitId === 'trunks')!;
    expect(offer.price).toBe(120);
    const r = ok<{ unitId: string; isNew: boolean }>(buyRaidOffer(marks(500), offer.id, env()));
    expect(r.result).toMatchObject({ unitId: 'trunks', isNew: true });
    expect(r.profile.units.trunks).toBeTruthy();
    expect(r.profile.inventory.raidMarks).toBe(380);
    expect(buyRaidOffer(r.profile, offer.id, env())).toMatchObject({ ok: false, code: 'offer-sold-out' });
  });

  it('Idempotenz: derselbe Schluessel kauft nur einmal', () => {
    const e = env();
    const run = (q: Profile) => withIdempotency(q, { key: 'raidshop-key-001', route: 'buyRaidOffer', request: { offerId: 'gold-1' } }, e, (x) => buyRaidOffer(x, 'gold-1', e));
    const a = run(marks(100));
    if (!a.ok) throw new Error(a.message);
    const b = run(a.profile);
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(b.profile.inventory.raidMarks).toBe(85);
  });
});

describe('Sichtmodelle', () => {
  it('worldView: 8 Legend Stages und 11 Raids mit Sperre, Material, Garantie; Inventar', () => {
    const v = worldView(fresh());
    expect(v.legend).toHaveLength(8);
    expect(v.raids).toHaveLength(11);
    expect(v.legend.every((l) => !l.unlocked && l.lock?.kind === 'world')).toBe(true);
    expect(v.legend[0].material).toMatchObject({ id: 'disc_fragment' });
    expect(v.raids.find((r) => r.id === 'sacred-planet')!.acts).toHaveLength(5);
    const open3 = worldView(cleared(...worldActs('greenie', 3)));
    expect(open3.raids.find((r) => r.id === 'sacred-planet')!.unlocked).toBe(true);
    expect(open3.raids.find((r) => r.id === 'sacred-planet')!.guarantee).toMatchObject({ clears: 10, progress: 0, granted: false });
    const inv = worldView({ ...fresh(), inventory: { raidMarks: 7, materials: { quirk_shard: 2 } } });
    expect(inv.raidMarks).toBe(7);
    expect(inv.materials).toEqual([{ id: 'quirk_shard', name: 'Quirk Shard', count: 2 }]);
  });

  it('playerView und stageView kennen Marken, Material und die Beute der Stage', () => {
    const p = { ...open('greenie'), inventory: { raidMarks: 12, materials: { disc_fragment: 3 } } } as Profile;
    expect(playerView(p)).toMatchObject({ raidMarks: 12, materials: [{ id: 'disc_fragment', count: 3 }] });
    const sv = stageView(p, 'legend-space-center-1');
    expect(sv.info).toMatchObject({ kind: 'legend', modeName: 'Space Center', worldId: 'greenie', unlocked: true, actCount: 3 });
    expect(sv.info!.affinity!.resist.physical).toBe(40);
    expect(sv.difficulties[0].materialDrop).toMatchObject({ id: 'disc_fragment' });
    expect(sv.difficulties[0].firstClearCrystals).toBe(120);
    const rv = stageView(cleared(...worldActs('sand-village', 3)), 'raid-sand-village-midnight-attack');
    expect(rv.info).toMatchObject({ kind: 'raid', guarantee: { clears: 10, progress: 0 } });
    expect(rv.difficulties[0].raidMarks).toBe(60);
    expect(rv.difficulties[0].maxWaves).toBe(20);
  });
});
