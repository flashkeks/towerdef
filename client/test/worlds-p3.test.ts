/** Runde 8 / P3: Welten im Client (Daten, Karten-Rendering je Welt, Weltkarte ueber das Backend, Session mit Stage). */
import { describe, expect, it } from 'vitest';
import { LocalBackend } from '../src/backend/local';
import { LocalStorageTier, MemoryTier, ProfileStorage, type KeyValueStore } from '../src/backend/storage';
import { testEnv } from '../src/backend/meta';
import { Session } from '../src/game/session';
import { buildMapOps, hillRects, pathCells, tintFor } from '../src/game/map-compose';
import atlas from '../assets/atlas/atlas.json';
import { createSim, loadBrowserData } from '../src/sim';
import { RenderContext } from '../src/game/context';
import { actCardModel, lockText, worldTabModel } from '../src/ui/world-model';
import { enemyName, registerStageNames } from '../src/view/model';
import { hasKey } from '../src/i18n/t';
import { en } from '../src/i18n/en';

const data = loadBrowserData();
const worlds = data.worlds ?? [];
class Fake implements KeyValueStore {
  d = new Map<string, string>();
  getItem(k: string) { return this.d.get(k) ?? null; }
  setItem(k: string, v: string) { this.d.set(k, v); }
}
const be = () => new LocalBackend({ storage: new ProfileStorage([new LocalStorageTier(new Fake()), new MemoryTier()]), env: testEnv(4) });

describe('Welten im Browser-Datenpaket', () => {
  it('alle Welten der Dateien sind als Stages da (6 Acts + Infinite), plus die Standard-Stage', () => {
    expect(worlds.length).toBeGreaterThanOrEqual(3);
    for (const w of worlds) {
      for (let a = 1; a <= 6; a++) expect(data.stages[`${w.id}-${a}`]).toBeDefined();
      expect(data.stages[`${w.id}-infinite`]?.infinite).toBe(true);
    }
    expect(data.stages['standard20']).toBeDefined();
  });
});

describe('Karten-Rendering je Welt', () => {
  it('jede Welt zeichnet eine eigene Karte: Raster aus der Zonenmaske (mindestens 17x11), nur Atlas-Bilder, Pfadkacheln aus den Wegpunkten, eigene Farbwelt', () => {
    const tints = new Set<string>();
    const pathSigs = new Set<string>();
    for (const w of worlds) {
      const stage = data.stages[`${w.id}-1`];
      const ops = buildMapOps(stage);
      for (const op of ops) expect(atlas.frames, `${w.id} ${op.frame}`).toHaveProperty([op.frame]);
      expect(ops.filter((o) => /tiles\/(grass|path)_/.test(o.frame))).toHaveLength(stage.zones.rows.length * stage.zones.rows[0].length);
      const pathOps = ops.filter((o) => o.frame.startsWith('tiles/path_'));
      expect(pathOps).toHaveLength(pathCells(stage.path).size);
      pathSigs.add(pathOps.map((o) => `${o.x},${o.y}`).join(';'));
      expect(hillRects(stage).length).toBeGreaterThan(0);
      const g = tintFor('tiles/grass_0', stage.theme);
      const p = tintFor('tiles/path_0101', stage.theme);
      expect(g && p).toBeTruthy();
      tints.add(`${g!.color}|${p!.color}`);
      expect(tintFor('tiles/spawn', stage.theme)).toBeNull();
    }
    expect(pathSigs.size).toBe(worlds.length);
    expect(tints.size).toBe(worlds.length);
    expect(tintFor('tiles/grass_0', data.stages['standard20'].theme)).toBeNull();
  });

  it('Runde 9 / P2: das Raster ist Eigenschaft der Welt (Sim-Karte = Zonenmaske), Welten 4-10 sind groesser als 17x11, RenderContext liest es', () => {
    const big = worlds.filter((w) => w.map.zones.rows[0].length > 17 || w.map.zones.rows.length > 11);
    expect(big.length).toBeGreaterThanOrEqual(7);
    for (const w of worlds) {
      const stage = data.stages[`${w.id}-1`];
      const sim = createSim({ stage: stage.id, difficulty: 'normal', players: 1, seed: 1, data });
      expect(sim.map().cols).toBe(stage.zones.rows[0].length);
      expect(sim.map().rows).toBe(stage.zones.rows.length);
      const ctx = new RenderContext();
      expect([ctx.cols, ctx.rows]).toEqual([17, 11]);
      ctx.stage = stage;
      expect([ctx.cols, ctx.rows]).toEqual([stage.zones.rows[0].length, stage.zones.rows.length]);
    }
  });

  it('Deko folgt der Farbwelt: Blumen nur, wenn die Welt sie will; blockierte Kacheln nur mit den Bildern der Welt', () => {
    for (const w of worlds) {
      const stage = data.stages[`${w.id}-1`];
      const ops = buildMapOps(stage);
      if (!stage.theme!.flowers) expect(ops.some((o) => o.frame === 'tiles/deco_flowers'), w.id).toBe(false);
      const allowed = new Set([...stage.theme!.blocked, 'tiles/deco_flowers']);
      for (const o of ops.filter((x) => x.frame.startsWith('tiles/deco_'))) expect(allowed.has(o.frame), `${w.id} ${o.frame}`).toBe(true);
    }
  });
});

describe('Session mit Stage', () => {
  it('Session(…, stageId) spielt die Stage der Welt (Wellenzahl, Karte, Anzeigenamen)', () => {
    const s = new Session('normal', 1, undefined, [], 'snowy-town-4');
    expect(s.stageId).toBe('snowy-town-4');
    expect(s.totalWaves).toBe(20);
    expect(s.sim.map().cols).toBe(17);
    expect(enemyName('grunt')).toBe('Lesser Demon');
    expect(enemyName('boss')).toBe('Akoku');
    const d = new Session('normal', 1);
    expect(d.stageId).toBe('standard20');
    registerStageNames({});
    expect(enemyName('grunt')).toBe(en['enemy.grunt.name']);
  });
});

describe('Weltkarte ueber das Backend', () => {
  it('worldView: nur Welt 1 / Act 1 offen, Sperrgruende als Text, Modelle fuer die Karten', async () => {
    const r = await be().worldView();
    if (!r.ok) throw new Error(r.message);
    const v = r.world;
    expect(v.nextStageId).toBe('greenie-1');
    const w1 = v.worlds[0];
    expect(worldTabModel(w1)).toMatchObject({ locked: false, progress: '0 / 6 acts cleared' });
    const a1 = actCardModel(w1.acts[0]);
    expect(a1).toMatchObject({ state: 'open', title: 'Act 1 - Evil Elegance', bossText: 'Boss: Zarbo', wavesText: '15 waves', bestText: 'Not played yet' });
    const a2 = actCardModel(w1.acts[1]);
    expect(a2).toMatchObject({ state: 'locked', lockText: 'Clear act 1 first.' });
    expect(actCardModel(w1.infinite)).toMatchObject({ state: 'locked', infinite: true, title: 'Infinite', lockText: 'Clear act 3 of this world first.' });
    expect(worldTabModel(v.worlds[1]).lockText).toBe('Clear act 6 of Planet Greenie first.');
    expect(lockText({ kind: 'act', act: 4 })).toBe('Clear act 4 first.');
  });

  it('matchSetup auf gesperrter Stage: stage-locked; offene Stage geht; stageView hat info', async () => {
    const b = be();
    expect((await b.claimStarterGift('00000000-0000-4000-8000-000000000001')).ok).toBe(true);
    expect(await b.matchSetup('normal', 'greenie-2')).toMatchObject({ ok: false, code: 'stage-locked' });
    expect((await b.matchSetup('normal', 'greenie-1')).ok).toBe(true);
    const sv = await b.stageView('greenie-2');
    expect(sv.ok && sv.info).toMatchObject({ unlocked: false, act: 2, bossName: 'Goldeo' });
    expect(hasKey('err.stage-locked')).toBe(true);
  });
});
