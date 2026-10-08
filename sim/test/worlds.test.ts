import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runMatch } from '../src/bots/index.js';
import { loadModes, loadWorlds } from '../src/data/load.js';
import { actStageId, expandWorld, infiniteStageId, validateWorlds, worldCatalog } from '../src/data/worlds.js';
import { StageSchema } from '../src/data/schema.js';
import { createSim } from '../src/index.js';
import { data } from './helpers.js';

const { worlds, waveTemplate } = loadWorlds();
const aaEnemies = JSON.parse(readFileSync(new URL('../../docs/anime-adventures/data/enemies.json', import.meta.url), 'utf8')) as { bosses: { mode: string; world: string; act: number; boss: string }[] };
const aaMaps = JSON.parse(readFileSync(new URL('../../docs/anime-adventures/data/maps.json', import.meta.url), 'utf8')) as { storyWorlds: { id: string; rereleaseName: string; acts: number }[] };

const mk = (stage: string) => createSim({ stage, difficulty: 'normal', players: 1, seed: 1, data });

describe('Welten (Runde 8 / P3): Daten', () => {
  it('mindestens drei Welten, je 6 Acts plus Infinite, alle als Stage geladen', () => {
    expect(worlds.length).toBeGreaterThanOrEqual(3);
    for (const w of worlds) {
      expect(w.acts).toHaveLength(6);
      for (const a of w.acts) expect(data.stages[actStageId(w.id, a.act)], `${w.id} Act ${a.act}`).toBeDefined();
      expect(data.stages[infiniteStageId(w.id)].infinite).toBe(true);
    }
  });

  it('jede Welt hat eine eigene Karte (Pfad verschieden), Raster je Welt (mindestens 17x11, Zeilen gleich lang), Pfad liegt auf p-Kacheln und es gibt keine losen p-Kacheln', () => {
    const seen = new Set<string>();
    for (const w of worlds) {
      seen.add(JSON.stringify(w.map.path));
      const rows = w.map.zones.rows;
      expect(rows.length).toBeGreaterThanOrEqual(11);
      expect(rows[0].length).toBeGreaterThanOrEqual(17);
      for (const r of rows) expect(r).toHaveLength(rows[0].length);
      for (const [x, y] of w.map.path) expect(x >= 0 && y >= 0 && x < rows[0].length && y < rows.length, `${w.id}: Wegpunkt (${x},${y}) im Raster`).toBe(true);
      const onPath = new Set<string>();
      for (let i = 1; i < w.map.path.length; i++) {
        const [x0, y0] = w.map.path[i - 1];
        const [x1, y1] = w.map.path[i];
        expect(x0 === x1 || y0 === y1, `${w.id}: Wegpunkte achsparallel`).toBe(true);
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
          for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
            onPath.add(`${x},${y}`);
            expect(rows[y][x], `${w.id} (${x},${y})`).toBe('p');
          }
        }
      }
      rows.forEach((r, y) => [...r].forEach((c, x) => c === 'p' && expect(onPath.has(`${x},${y}`), `${w.id} lose p-Kachel (${x},${y})`).toBe(true)));
    }
    expect(seen.size).toBe(worlds.length);
  });

  it('jede Karte bietet genug Platz fuer Boden- und Huegel-Units', () => {
    for (const w of worlds) {
      const sim = mk(actStageId(w.id, 1));
      const ground = sim.catalog().find((u) => u.placement === 'ground')!;
      const hill = sim.catalog().find((u) => u.placement === 'hill')!;
      expect(sim.placementGrid(ground.id).length, `${w.id} Boden`).toBeGreaterThan(120);
      expect(sim.placementGrid(hill.id).length, `${w.id} Huegel`).toBeGreaterThan(40);
    }
  });

  it('Act-Boss steht in der letzten Welle, mit Namen und Kit; Bossnamen stimmen mit enemies.json (AA) ueberein', () => {
    for (const w of worlds) {
      const aa = aaMaps.storyWorlds.find((x) => x.id === w.aaId);
      expect(aa, `${w.id} aaId`).toBeDefined();
      for (const a of w.acts) {
        const s = data.stages[actStageId(w.id, a.act)];
        expect(s.waves).toHaveLength(a.waves);
        expect(s.waves[a.waves - 1].groups[0].type).toBe('boss');
        expect(s.waves.slice(0, -1).some((x) => x.groups.some((g) => g.type === 'boss'))).toBe(false);
        expect(s.bossName).toBe(a.boss.name);
        expect(s.bossKits).toEqual({ [String(a.waves)]: a.boss.kit });
        const row = aaEnemies.bosses.find((b) => b.mode === 'story' && b.world === aa!.rereleaseName && b.act === a.act);
        expect(row, `${w.id} Act ${a.act} in enemies.json`).toBeDefined();
        const norm = (x: string): string => x.replace(/[^a-z]/gi, '').toLowerCase();
        expect(norm(row!.boss), `${w.id} Act ${a.act}`).toContain(norm(a.boss.name));
      }
    }
  });

  it('Gegner-HP steigt mit dem Act und mit der Welt; das Boss-Kit der Stage liegt auf der Boss-Welle', () => {
    const hp = (st: string): number => mk(st).previewWave(1)!.groups[0].hpCenti;
    expect(hp('greenie-3')).toBeGreaterThan(hp('greenie-1'));
    expect(hp('greenie-6')).toBeGreaterThan(hp('greenie-3'));
    expect(hp('snowy-town-1')).toBeGreaterThan(hp('greenie-1'));
    expect(mk('greenie-6').bossKits()[20]).toMatchObject({ id: 'colossus', wave: 20 });
    expect(mk('greenie-1').bossKits()[15]).toMatchObject({ id: 'charger', wave: 15 });
    expect(mk('greenie-1').previewWave(15)!.bossKit?.id).toBe('charger');
    expect(Object.keys(mk('greenie-infinite').bossKits())).toHaveLength(0);
  });

  it('Act-Modifier greifen: Walled City Act 4 ab Welle 15 Schild, Snowy Town Act 4 ab Welle 10 Regen (belegte AA-Ereignisse)', () => {
    const w15 = data.stages['walled-city-4'].waves[14].groups.filter((g) => g.type !== 'boss' && g.type !== 'elite');
    expect(w15.some((g) => g.modifiers.some((m) => m.startsWith('shield')))).toBe(true);
    expect(data.stages['walled-city-4'].waves[13].groups.every((g) => !g.modifiers.some((m) => m.startsWith('shield')))).toBe(true);
    expect(data.stages['snowy-town-4'].waves[9].groups.some((g) => g.modifiers.includes('regen'))).toBe(true);
    expect(data.stages['snowy-town-4'].waves[8].groups.every((g) => !g.modifiers.includes('regen'))).toBe(true);
  });

  it('Anzeigenamen (roster) decken alle Gegnertypen jeder Stage ab', () => {
    for (const w of worlds) for (const a of w.acts) for (const wave of data.stages[actStageId(w.id, a.act)].waves) for (const g of wave.groups) expect(w.roster[g.type], `${w.id} ${g.type}`).toBeTruthy();
  });

  it('worldCatalog: sortiert, Stage-IDs, Freischaltung zeigt auf Vorgaengerwelten', () => {
    const cat = worldCatalog(worlds);
    expect(cat.map((c) => c.order)).toEqual([...cat.map((c) => c.order)].sort((a, b) => a - b));
    expect(cat[0].unlock).toBeNull();
    for (const c of cat.slice(1)) expect(cat.some((x) => x.id === c.unlock!.afterWorld)).toBe(true);
    expect(cat[0].acts[0].stageId).toBe(`${cat[0].id}-1`);
    expect(cat[0].infinite.stageId).toBe(`${cat[0].id}-infinite`);
  });

  it('Querpruefungen schlagen an: doppelte ID, unbekanntes Kit, Freischaltung nach unbekannter Welt', () => {
    const kitIds = new Set((data.bosses?.kits ?? []).map((k) => k.id));
    const enemyIds = new Set(data.enemies.archetypes.map((a) => a.id));
    const w0 = structuredClone(worlds[0]);
    expect(() => validateWorlds([w0, structuredClone(w0)], waveTemplate, kitIds, enemyIds)).toThrow(/Doppelte Welt-ID/);
    const bad = structuredClone(worlds[0]);
    bad.acts[0].boss.kit = 'gibtsnicht';
    expect(() => validateWorlds([bad], waveTemplate, kitIds, enemyIds)).toThrow(/Boss-Kit/);
    const bad2 = structuredClone(worlds[1]);
    bad2.unlock = { afterWorld: 'nirgends', afterAct: 1 };
    expect(() => validateWorlds([worlds[0], bad2], waveTemplate, kitIds, enemyIds)).toThrow(/unbekannter Welt/);
  });

  it('Legend Stages und Raids sind als Daten-Geruest geladen (nicht spielbar)', () => {
    const m = loadModes();
    expect(m.legend.stages.length).toBeGreaterThanOrEqual(8);
    expect(m.raids.raids.length).toBeGreaterThanOrEqual(5);
    for (const s of [...m.legend.stages, ...m.raids.raids]) expect(s.playable).toBe(false);
  });
});

describe('Welten: neue Welt = nur Daten', () => {
  it('eine vierte Welt aus einer kopierten Datei (andere ID, andere Karte, andere Farben) laeuft ohne Code durch die Sim', () => {
    const w = structuredClone(worlds[0]);
    w.id = 'testwelt';
    w.order = 99;
    w.name = 'Testwelt';
    w.unlock = null;
    w.theme.id = 'testwelt';
    w.map.path = [[0, 5], [16, 5]];
    w.map.zones.rows = Array.from({ length: 11 }, (_, y) => (y === 5 ? 'p'.repeat(17) : y === 4 || y === 6 ? 'h'.repeat(17) : '.'.repeat(17)));
    const stages = expandWorld(w, waveTemplate).map((s) => StageSchema.parse(s));
    expect(stages).toHaveLength(7);
    const r = runMatch({ stage: stages[0], difficulty: 'normal', players: 1, seed: 1, bots: ['mono-goku_ssj3'] });
    expect(['win', 'loss']).toContain(r.result);
    expect(r.finalUnits.length).toBeGreaterThan(0);
  });
});

describe('Welten: Rauchtest (Bots, Determinismus)', () => {
  for (const w of worlds) {
    it(`${w.id}: Act 1 laeuft mit dem Bot auto ohne Absturz durch, deterministisch je Seed`, () => {
      const a = runMatch({ stage: actStageId(w.id, 1), difficulty: 'normal', players: 1, seed: 3, bots: ['auto'] });
      expect(['win', 'loss']).toContain(a.result);
      expect(a.finalUnits.length).toBeGreaterThan(0);
      expect(runMatch({ stage: actStageId(w.id, 1), difficulty: 'normal', players: 1, seed: 3, bots: ['auto'] }).hash).toBe(a.hash);
    });
    it(`${w.id}: eine starke Unit (Goku SSJ3) schafft Act 1 allein`, () => {
      expect(runMatch({ stage: actStageId(w.id, 1), difficulty: 'normal', players: 1, seed: 1, bots: ['mono-goku_ssj3'] }).result).toBe('win');
    });
    it(`${w.id}: Act 6 (Boss-Kit Colossus, Hard) und Infinite laufen ohne Absturz`, () => {
      const r = runMatch({ stage: actStageId(w.id, 6), difficulty: 'hard', players: 1, seed: 2, bots: ['mono-goku_ssj3'], maxTicks: 30000 });
      expect(r.ticks).toBeGreaterThan(0);
      const i = runMatch({ stage: infiniteStageId(w.id), difficulty: 'normal', players: 1, seed: 1, bots: ['mono-goku_ssj3'], maxWaves: 18, maxTicks: 60000 });
      expect(i.endWave).toBeGreaterThan(14);
    });
  }
});
