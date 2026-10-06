import { describe, expect, it } from 'vitest';
import { loadGameData } from '../src/data/load.js';
import { toMarkdown, summaryCsv, wavesCsv } from '../src/report/format.js';
import { runMatches, runSequential } from '../src/report/parallel.js';
import { recordMatch } from '../src/report/record.js';
import { aggregate, aggregateCell, dist, median, pctSorted } from '../src/report/stats.js';
import { lineChart } from '../src/report/svg.js';
import type { MatchSpec, RunRecord, WaveRec } from '../src/report/types.js';

const wave = (n: number, o: Partial<WaveRec> = {}): WaveRec => ({
  n, coinsStart: 0, coinsEnd: 0, incomeKill: 0, incomeWave: 0, incomeFarm: 0, spendPlace: 0, spendUpgrade: 0, sellRefund: 0,
  farmInvest: 0, farmYield: 0, kills: 0, leaks: {}, leakDmg: {}, leakCount: 0, baseLoss: 0, poolHp: 0, invested: 0, ...o,
});
const run = (o: Partial<RunRecord>): RunRecord => ({
  stage: 's', botLabel: 'b', difficulty: 'normal', players: 1, seed: 1, result: 'win', endWave: 2, lossWave: null, ticks: 2400,
  baseHpEnd: 100, waves: [wave(0), wave(1), wave(2)], ...o,
});

describe('Statistik', () => {
  it('Perzentile (nearest-rank) und Median', () => {
    const xs = [10, 1, 5, 3, 7, 9, 2, 8, 4, 6];
    expect(pctSorted([...xs].sort((a, b) => a - b), 0.1)).toBe(1);
    expect(pctSorted([...xs].sort((a, b) => a - b), 0.9)).toBe(9);
    expect(median(xs)).toBe(5.5);
    expect(median([3, 1, 2])).toBe(2);
    expect(dist([])).toEqual({ p10: 0, med: 0, p90: 0 });
  });
});

describe('Aggregation', () => {
  const runs: RunRecord[] = [
    run({ seed: 1, result: 'win', endWave: 2, waves: [wave(0), wave(1, { coinsEnd: 100, incomeKill: 50, incomeWave: 50 }), wave(2, { coinsEnd: 200, leakCount: 1, leaks: { grunt: 1 }, leakDmg: { grunt: 1 } })] }),
    run({ seed: 2, result: 'loss', endWave: 2, lossWave: 2, ticks: 4800, waves: [wave(0), wave(1, { coinsEnd: 300 }), wave(2, { coinsEnd: 50, leakCount: 2, leaks: { boss: 1, grunt: 1 }, leakDmg: { boss: 50, grunt: 1 } })] }),
    run({ seed: 3, result: 'loss', endWave: 1, lossWave: 1, ticks: 1200, waves: [wave(0), wave(1, { coinsEnd: 0, leakCount: 1, leaks: { brute: 1 }, leakDmg: { brute: 3 } })] }),
    run({ seed: 4, result: null, endWave: 2, waves: [wave(0), wave(1, { coinsEnd: 200 }), wave(2, { coinsEnd: 400 })] }),
  ];
  const c = aggregateCell(runs);

  it('Siegquote und Zähler', () => {
    expect(c.runs).toBe(4);
    expect(c.wins).toBe(1);
    expect(c.losses).toBe(2);
    expect(c.capped).toBe(1);
    expect(c.winRate).toBe(0.25);
  });
  it('Verlustrate/Hazard/Leak-Rate je Wave', () => {
    const [w1, w2] = c.waves;
    expect(w1.reached).toBe(4);
    expect(w1.lostHere).toBe(1);
    expect(w1.lossRate).toBe(0.25);
    expect(w1.hazard).toBe(0.25);
    expect(w1.leakRate).toBe(0.25);
    expect(w2.reached).toBe(3);
    expect(w2.lostHere).toBe(1);
    expect(w2.lossRate).toBe(0.25);
    expect(w2.hazard).toBeCloseTo(1 / 3);
    expect(w2.leakRate).toBeCloseTo(2 / 3);
  });
  it('Geldkurve P10/Median/P90 über erreichende Runs', () => {
    expect(c.waves[0].coins).toEqual({ p10: 0, med: 150, p90: 300 });
    expect(c.waves[1].coins.med).toBe(200);
  });
  it('Leak-Quellen nach Typ mit Anteil und Schaden', () => {
    expect(c.leakSources.map((s) => s.type)).toEqual(['grunt', 'boss', 'brute']);
    expect(c.leakSources[0]).toMatchObject({ count: 2, damage: 2 * Number(loadGameData().economy.leakDamage.grunt) });
    expect(c.leakSources[1]).toMatchObject({ count: 1, damage: Number(loadGameData().economy.leakDamage.boss) });
    expect(c.leakSources.reduce((a, s) => a + s.share, 0)).toBeCloseTo(1);
  });
  it('Endwave- und Dauer-Verteilung', () => {
    expect(c.endWave.med).toBe(2);
    expect(c.endWave.p10).toBe(1);
    expect(c.minutes.med).toBeCloseTo(median([2, 4, 1, 2]));
  });
  it('Farm-Anteil, Payback und Upgrade-Anteil', () => {
    const r = [
      run({ waves: [wave(0, { spendPlace: 300, farmInvest: 300 }), wave(1, { incomeKill: 100, incomeWave: 100, farmYield: 0 }), wave(2, { incomeKill: 100, incomeWave: 50, incomeFarm: 50, farmYield: 50, spendUpgrade: 100, farmInvest: 100 }), wave(3, { incomeFarm: 50, farmYield: 50, incomeKill: 50 })] }),
    ];
    const x = aggregateCell(r);
    expect(x.farmShareIncome).toBeCloseTo(100 / 500);
    expect(x.upgradeShare).toBeCloseTo(100 / 400);
    expect(x.farmPayback.n).toBe(1);
    expect(x.farmPayback.med).toBeCloseTo(400 / 50);
  });
  it('Pool/Münze (Median)', () => {
    const r = [
      run({ waves: [wave(0), wave(1, { poolHp: 200, invested: 400 })] }),
      run({ waves: [wave(0), wave(1, { poolHp: 300, invested: 300 })] }),
      run({ waves: [wave(0), wave(1, { poolHp: 100, invested: 0 })] }),
    ];
    expect(aggregateCell(r).waves[0].poolPerCoin).toBeCloseTo(0.75);
  });
  it('aggregate gruppiert nach Zelle', () => {
    const cells = aggregate([run({ botLabel: 'a' }), run({ botLabel: 'b' }), run({ botLabel: 'a', seed: 2 }), run({ botLabel: 'a', players: 2 })]);
    expect(cells.map((x) => `${x.bot}:${x.players}:${x.runs}`)).toEqual(['a:1:2', 'b:1:1', 'a:2:1']);
  });
  it('Markdown, CSV, SVG enthalten die Kernwerte', () => {
    const md = toMarkdown([c], { title: 'T', params: { runs: 4 } });
    expect(md).toContain('Siegquote');
    expect(md).toContain('25.0 %');
    expect(md).toContain('Verlustrate');
    expect(md).toContain('## Definitionen');
    const csv = wavesCsv([c]).trim().split('\n');
    expect(csv.length).toBe(1 + c.waves.length);
    expect(csv[0].split(',').length).toBe(csv[1].split(',').length);
    expect(summaryCsv([c]).trim().split('\n').length).toBe(2);
    const svg = lineChart('t', 'x', 'y', [{ label: 'a', color: '#000', values: [1, 2, 3] }]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
  });
});

describe('recordMatch (runMatch)', () => {
  const spec: MatchSpec = { stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, bots: ["greedy"] };
  it('deterministisch und Münzbilanz je Match konsistent', () => {
    const a = recordMatch(spec);
    const b = recordMatch(spec);
    expect(a).toEqual(b);
    const w = a.waves;
    expect(w[0].n).toBe(0);
    const income = w.reduce((s, x) => s + x.incomeKill + x.incomeWave + x.incomeFarm, 0);
    const spend = w.reduce((s, x) => s + x.spendPlace + x.spendUpgrade, 0);
    const sell = w.reduce((s, x) => s + x.sellRefund, 0);
    const last = w[w.length - 1];
    expect(1000 + income - spend + sell).toBe(last.coinsEnd);
    expect(a.waves.length).toBe(a.endWave + 1);
    expect(a.endWave).toBeGreaterThan(5);
    expect(w.find((x) => x.n === 1)?.poolHp).toBeGreaterThan(0);
    if (a.result === 'loss') expect(a.lossWave).not.toBeNull();
  });
  it('Infinite: kein Sieg, maxWaves bricht ab', () => {
    const r = recordMatch({ ...spec, stage: 'infinite', maxWaves: 22 });
    expect(r.result === 'loss' || r.result === null).toBe(true);
    expect(r.endWave).toBeLessThanOrEqual(22);
  });
  it("Parallelität ändert das Ergebnis nicht", async () => {
    const specs = [1, 2, 3, 4, 5, 6].map((seed) => ({ ...spec, seed }));
    const seq = runSequential(specs);
    const par = await runMatches(specs, 3);
    expect(par).toEqual(seq);
  }, 30000);
});
