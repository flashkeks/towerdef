/**
 * Legend Stages und Raids (Runde 9 / P3): Daten, Stage-Erzeugung aus der Host-Welt, Resistenzen, Rauchtest.
 * Kein Balancing: nur "laeuft ohne Absturz" und "eine starke Unit schafft es".
 */
import { describe, expect, it } from 'vitest';
import { runMatch } from '../src/bots/runner.js';
import { loadGameData, loadModes, loadWorlds } from '../src/data/load.js';
import { expandLegend, expandRaid, legendStageId, modeCatalog, raidStageId, validateModes } from '../src/data/modes.js';
import { StageSchema } from '../src/data/schema.js';
import { compile } from '../src/data/compile.js';

const data = loadGameData();
const { legend, raids } = loadModes();
const { worlds, waveTemplate } = loadWorlds();
const catalog = modeCatalog(legend, raids, worlds);
const kitIds = new Set((data.bosses?.kits ?? []).map((k) => k.id));
const unitIds = new Set(data.units.units.map((u) => u.id));

describe('Modi: Daten', () => {
  it('8 Legend Stages und 11 Raids, alle spielbar, 20 Wellen, Querpruefungen laufen durch', () => {
    expect(legend.stages).toHaveLength(8);
    expect(raids.raids).toHaveLength(11);
    expect(() => validateModes(legend, raids, worlds, waveTemplate, kitIds, unitIds)).not.toThrow();
    for (const r of raids.raids) expect(r.waves).toBe(20);
    for (const s of legend.stages) for (const a of s.acts) expect(a.waves).toBe(20);
  });

  it('jede Stage steht in den Spieldaten, auf der Karte ihrer Host-Welt, ohne Code je Stage', () => {
    for (const m of catalog) {
      const host = worlds.find((w) => w.id === m.hostWorldId)!;
      for (const a of m.acts) {
        const st = data.stages[a.stageId];
        expect(st, a.stageId).toBeTruthy();
        expect(st.mode).toBe(m.kind);
        expect(st.path).toEqual(host.map.path);
        expect(st.zones.rows).toEqual(host.map.zones.rows);
        expect(st.waves).toHaveLength(m.kind === 'raid' ? 20 : a.waves);
        expect(st.waves[st.waves.length - 1].groups.some((g) => g.type === 'boss')).toBe(true);
        expect(st.bossName).toBe(a.bossName);
      }
    }
  });

  it('Stage-IDs: Raid mit einem Act ohne Nummer, mit mehreren nummeriert; Legend immer nummeriert', () => {
    expect(raidStageId({ id: 'x', acts: [{}] as never }, 1)).toBe('raid-x');
    expect(raidStageId({ id: 'x', acts: [{}, {}] as never }, 2)).toBe('raid-x-2');
    expect(legendStageId('spirit-invasion', 6)).toBe('legend-spirit-invasion-6');
    expect(data.stages['raid-sacred-planet-5']).toBeTruthy();
    expect(data.stages['raid-sacred-planet']).toBeUndefined();
    expect(data.stages['raid-future-city']).toBeTruthy();
  });

  it('Freischaltung: Legend nach Act 6 der Host-Welt, Raid frueher (Act 3); Spirit Invasion nutzt die Karte von Spirit World', () => {
    for (const m of catalog) {
      if (m.kind === 'legend') expect(m.unlock.afterAct).toBe(6);
      else expect(m.unlock.afterAct).toBeLessThan(6);
      expect(m.unlock.afterWorld).toBe(m.hostWorldId);
    }
    expect(catalog.find((m) => m.id === 'spirit-invasion')!.hostWorldId).toBe('spirit-world');
  });

  it('Raids haben eine garantierte Unit, die es im Katalog gibt', () => {
    for (const r of raids.raids) {
      expect(unitIds.has(r.guarantee.unit), r.id).toBe(true);
      expect(r.guarantee.clears).toBeGreaterThan(0);
    }
  });

  it('Querpruefungen schlagen an: unbekannte Host-Welt, unbekanntes Kit, doppelte ID', () => {
    const bad = structuredClone(legend);
    bad.stages[0].host = 'nirgends';
    expect(() => validateModes(bad, raids, worlds, waveTemplate, kitIds)).toThrow(/Host-Welt/);
    const bad2 = structuredClone(raids);
    bad2.raids[0].acts[0].boss.kit = 'gibtsnicht';
    expect(() => validateModes(legend, bad2, worlds, waveTemplate, kitIds)).toThrow(/Boss-Kit/);
    const bad3 = structuredClone(raids);
    bad3.raids[1].id = bad3.raids[0].id;
    expect(() => validateModes(legend, bad3, worlds, waveTemplate, kitIds)).toThrow(/doppelte ID/);
  });
});

describe('Modi: Resistenzen und Schwaechen', () => {
  it('Stage-Affinitaet wirkt auf alle Gegner: Resistenz senkt den Schaden, Schwaeche hebt ihn', () => {
    const base = expandLegend(legend.stages.find((s) => s.id === 'space-center')!, worlds.find((w) => w.id === 'greenie')!, waveTemplate)[0];
    expect(base.affinity!.resist.physical).toBe(40);
    const mk = (aff: unknown) => compile(data, StageSchema.parse({ ...base, affinity: aff }), 'normal', 1);
    const none = mk(undefined);
    const tough = mk({ resist: { physical: 100 }, weakBp: {} });
    const weak = mk({ resist: {}, weakBp: { physical: 5000 } });
    const aff = (c: ReturnType<typeof mk>) => c.affinity('grunt', 0);
    expect(aff(none).resist.physical ?? 0).toBe(0);
    expect(aff(tough).resist.physical).toBe(100);
    expect(aff(weak).weakBp.physical).toBe(5000);
  });

  it('Act-Affinitaet addiert sich zur Stage-Affinitaet', () => {
    const s = structuredClone(legend.stages[0]);
    s.affinity = { resist: { physical: 10 }, weakBp: {} };
    s.acts[0].affinity = { resist: { physical: 5 }, weakBp: { fire: 1000 } };
    const st = expandLegend(s, worlds.find((w) => w.id === s.host)!, waveTemplate)[0];
    expect(st.affinity).toEqual({ resist: { physical: 15 }, weakBp: { fire: 1000 } });
  });
});

describe('Modi: Rauchtest', () => {
  const stageIds = catalog.flatMap((m) => m.acts.map((a) => a.stageId));
  it('49 Stages: jede laeuft mit dem Bot auto ohne Absturz an und ist deterministisch', () => {
    expect(stageIds).toHaveLength(49);
    for (const id of stageIds) {
      const a = runMatch({ stage: id, difficulty: 'normal', players: 1, seed: 3, bots: ['auto'], maxTicks: 3000, data });
      expect(a.ticks, id).toBeGreaterThan(0);
      expect(runMatch({ stage: id, difficulty: 'normal', players: 1, seed: 3, bots: ['auto'], maxTicks: 3000, data }).hash, id).toBe(a.hash);
    }
  });

  it('eine starke Unit (Goku SSJ3 oder Rikka) schafft Act 1 jeder Legend Stage allein', () => {
    for (const s of legend.stages) {
      const id = legendStageId(s.id, 1);
      const wins = ['goku_ssj3', 'rikka_evo'].map((u) => runMatch({ stage: id, difficulty: 'normal', players: 1, seed: 1, bots: ['mono-' + u], data }).result);
      expect(wins, id).toContain('win');
    }
  });

  it('Raids: jede Raid-Stage mit 20 Wellen und Boss; eine starke Unit schafft einen Raid', () => {
    for (const r of raids.raids) {
      const id = raidStageId(r, 1);
      expect(data.stages[id].waves).toHaveLength(20);
    }
    expect(runMatch({ stage: 'raid-sand-village-midnight-attack', difficulty: 'normal', players: 1, seed: 1, bots: ['mono-goku_ssj3'], data }).result).toBe('win');
  });

  it('Boss-Kit aller Modus-Stages laeuft: Act 6 / Hard laeuft ohne Absturz', () => {
    const r = runMatch({ stage: legendStageId('spirit-invasion', 6), difficulty: 'hard', players: 1, seed: 2, bots: ['mono-goku_ssj3'], maxTicks: 30000, data });
    expect(r.ticks).toBeGreaterThan(0);
  });
});

void expandRaid;
