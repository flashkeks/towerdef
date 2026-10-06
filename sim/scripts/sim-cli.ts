/**
 * Simulations-CLI: Bots über viele Seeds spielen lassen, aggregieren, Markdown/CSV (+SVG) schreiben.
 *
 *   npm run sim -- --stage standard20 --bot greedy --runs 500 --difficulty normal --players 1 [--seed 1]
 *                  [--out ../docs/balancing/runs] [--matrix] [--bots greedy,farm] [--jobs 4] [--max-waves 100]
 *                  [--name <dateiname>] [--svg|--no-svg]
 *
 * Listen sind erlaubt (--difficulty normal,hard --players 1,2,4 --bot greedy,farm = jeweils eigene Zelle).
 * --bots a,b = ein Team, Spieler i nutzt Bot i mod Anzahl. --bot coop: Bot "coop" für alle Spieler.
 * --matrix = alle Bots (Object.keys(BOTS)) x normal/hard/nightmare x 1/2/4 Spieler.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join, resolve } from 'node:path';
import type { DifficultyId } from '../src/data/schema.js';
import { toMarkdown, summaryCsv, wavesCsv } from '../src/report/format.js';
import { runMatches } from '../src/report/parallel.js';
import { BOTS } from '../src/bots/index.js';
import { aggregate } from '../src/report/stats.js';
import { lineChart } from '../src/report/svg.js';
import type { CellStats, MatchSpec } from '../src/report/types.js';

interface Cli {
  stage: string;
  bots: string[][];
  runs: number;
  difficulties: DifficultyId[];
  players: number[];
  seed: number;
  out: string;
  matrix: boolean;
  jobs: number;
  maxWaves?: number;
  name?: string;
  svg?: boolean;
}

const DIFFS: DifficultyId[] = ['normal', 'hard', 'nightmare'];

function parseArgs(argv: string[]): Cli {
  const o: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`Unerwartetes Argument ${a}`);
    const key = a.slice(2);
    if (['matrix', 'svg', 'no-svg'].includes(key)) o[key] = true;
    else {
      const v = argv[++i];
      if (v === undefined) throw new Error(`--${key} braucht einen Wert`);
      o[key] = v;
    }
  }
  const list = (v: string | true | undefined, d: string): string[] => String(v === undefined || v === true ? d : v).split(',').map((x) => x.trim()).filter(Boolean);
  const diffs = list(o.difficulty, 'normal') as DifficultyId[];
  for (const d of diffs) if (!DIFFS.includes(d)) throw new Error(`Schwierigkeit ${d} unbekannt`);
  const bots: string[][] = o.bots ? [list(o.bots, '')] : list(o.bot, 'greedy').map((b) => [b]);
  const int = (k: string, d: number): number => {
    const v = o[k];
    if (v === undefined || v === true) return d;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) throw new Error(`--${k} muss eine ganze Zahl >= 0 sein`);
    return n;
  };
  return {
    stage: String(o.stage ?? 'standard20'),
    bots,
    runs: int('runs', 100),
    difficulties: diffs,
    players: list(o.players, '1').map(Number),
    seed: int('seed', 1),
    out: String(o.out ?? '../docs/balancing/runs'),
    matrix: o.matrix === true,
    jobs: int('jobs', Math.max(1, Math.min(8, availableParallelism() - 1))),
    maxWaves: o['max-waves'] !== undefined ? int('max-waves', 100) : undefined,
    name: o.name === undefined ? undefined : String(o.name),
    svg: o['no-svg'] ? false : o.svg ? true : undefined,
  };
}

function expandBots(cli: Cli): string[][] {
  const all = Object.keys(BOTS);
  const sets = cli.matrix ? all.map((n) => [n]) : cli.bots;
  for (const b of sets) for (const n of b) if (!BOTS[n]) throw new Error(`Unbekannter Bot "${n}" (verfügbar: ${all.join(', ')})`);
  return sets;
}

function chartsFor(c: CellStats, file: string): Record<string, string> {
  const waves = c.waves;
  const loss = lineChart(`Verlust-/Leak-Rate je Wave: ${c.bot} ${c.difficulty} ${c.players}P`, 'Wave', 'Anteil', [
    { label: 'Verlustrate', color: '#c0392b', values: waves.map((w) => w.lossRate) },
    { label: 'Leak-Rate', color: '#e67e22', values: waves.map((w) => w.leakRate), dashed: true },
  ], 1, 1);
  const money = lineChart(`Münzen am Wave-Ende: ${c.bot} ${c.difficulty} ${c.players}P`, 'Wave', 'Münzen', [
    { label: 'P10', color: '#7f8c8d', values: waves.map((w) => w.coins.p10), dashed: true },
    { label: 'Median', color: '#2980b9', values: waves.map((w) => w.coins.med) },
    { label: 'P90', color: '#7f8c8d', values: waves.map((w) => w.coins.p90), dashed: true },
  ]);
  return { [`${file}-loss.svg`]: loss, [`${file}-money.svg`]: money };
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const diffs = cli.matrix ? DIFFS : cli.difficulties;
  const players = cli.matrix ? [1, 2, 4] : cli.players;
  const botSets = expandBots(cli);
  const maxWaves = cli.maxWaves ?? (cli.stage === 'infinite' ? 100 : undefined);
  const specs: MatchSpec[] = [];
  for (const bots of botSets) {
    for (const difficulty of diffs) {
      for (const p of players) {
        for (let i = 0; i < cli.runs; i++) specs.push({ stage: cli.stage, difficulty, players: p, seed: cli.seed + i, bots, maxWaves });
      }
    }
  }
  const cellsN = botSets.length * diffs.length * players.length;
  console.error(`${specs.length} Runs in ${cellsN} Zellen, jobs=${cli.jobs}`);
  const t0 = performance.now();
  let last = 0;
  const records = await runMatches(specs, cli.jobs, (d) => {
    if (process.stderr.isTTY && d - last >= Math.max(1, Math.floor(specs.length / 20))) {
      last = d;
      process.stderr.write(`\r${d}/${specs.length}`);
    }
  });
  console.error(`\rfertig in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  const cells = aggregate(records);
  const name = cli.name ?? (cli.matrix ? `matrix-${cli.stage}` : `${cli.stage}-${botSets.map((b) => b.join('+')).join('_')}-${diffs.join('_')}-${players.join('_')}p`);
  const out = resolve(cli.out);
  mkdirSync(out, { recursive: true });
  const wantSvg = cli.svg ?? cells.length <= 3;
  const charts: Record<string, string[]> = {};
  if (wantSvg) {
    for (const c of cells) {
      const base = (cells.length === 1 ? name : `${name}-${c.bot}-${c.difficulty}-${c.players}p`).replace(/[^\w.+-]/g, '_');
      const files = chartsFor(c, base);
      for (const [f, svg] of Object.entries(files)) writeFileSync(join(out, f), svg);
      charts[c.key] = Object.keys(files);
    }
  }
  const md = toMarkdown(cells, {
    title: `Balancing-Lauf ${name}`,
    params: { stage: cli.stage, runs: cli.runs, seed: cli.seed, difficulty: diffs.join(','), players: players.join(','), bots: botSets.map((b) => b.join('+')).join(','), maxWaves: maxWaves ?? 'none' },
  }, charts);
  writeFileSync(join(out, `${name}.md`), md);
  writeFileSync(join(out, `${name}.csv`), wavesCsv(cells));
  writeFileSync(join(out, `${name}-summary.csv`), summaryCsv(cells));
  for (const c of cells) {
    console.log(`${c.stage} ${c.bot} ${c.difficulty} ${c.players}P: win ${(c.winRate * 100).toFixed(1)} % (${c.wins}/${c.runs}), endWave med ${c.endWave.med} [${c.endWave.p10}-${c.endWave.p90}], ${c.minutes.med.toFixed(1)} min`);
  }
  console.log(`geschrieben: ${join(out, name)}.md/.csv/-summary.csv`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
