/**
 * Runde 4 / P2: Leben-System kalibrieren.
 * Idee: Die Bots lesen die Leben nicht. Ein Lauf mit praktisch unendlichen Leben und ohne Sofort-Verlust liefert daher
 * alle Leaks (Typ, Rest-HP, Wave) -- die Siegquote für beliebige Regeln (Startleben, Basiskosten, Elite-Regel, Regeneration)
 * lässt sich danach ohne neue Simulation nachrechnen (`--part eval`). `--part check` fährt dagegen echte Läufe mit den
 * Daten aus sim/data (Gegenprobe der Nachrechnung).
 *
 *   --part raw   --n 40 --difficulty normal --players 1 --out datei.json   (Leaks sammeln)
 *   --part eval  --files a.json,b.json [--start 20] [--regen 0] [--elite lives|loss|none] [--base grunt=2,elite=8,...]
 *   --part check --n 40 --difficulty normal --players 1                     (echte Läufe, Daten aus sim/data)
 */
import { writeFileSync, readFileSync } from 'node:fs';
import type { DifficultyId } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import { argNum, argStr, baseData, patched, play, table } from './lib.js';

const part = argStr('part', 'eval');
const n = argNum('n', 40);
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];
const players = argStr('players', '1').split(',').map(Number);
const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');

type Leak = { type: string; wave: number; cur: number; hp: number; maxHp: number };
type Run = { win: boolean; endWave: number; leaks: Leak[] };

/** Gleiche Formel wie src/systems/move.ts (leakCost). */
const cost = (base: number, hp: number, maxHp: number): number => Math.max(1, Math.floor((base * hp + maxHp - 1) / maxHp));

if (part === 'raw') {
  const free = patched((d) => {
    d.economy.lives.start = 1_000_000;
    d.economy.lives.instantLoss = [];
  });
  const out: Record<string, Run[]> = {};
  for (const d of diffs) for (const p of players) for (const bn of botNames) {
    const runs: Run[] = [];
    for (let seed = 1; seed <= n; seed++) {
      const r = play({ difficulty: d, players: p, seed, bots: BOTS[bn], data: free });
      runs.push({ win: r.result === 'win', endWave: r.endWave, leaks: r.leakLog });
    }
    out[`${bn}|${d}|${p}`] = runs;
  }
  writeFileSync(argStr('out', 'q9-raw.json'), JSON.stringify(out));
} else if (part === 'eval') {
  const all: Record<string, Run[]> = {};
  for (const f of argStr('files', '').split(',')) Object.assign(all, JSON.parse(readFileSync(f, 'utf8')));
  const start = argNum('start', baseData.economy.lives.start);
  const regen = argNum('regen', baseData.economy.lives.regenPerWave);
  const elite = argStr('elite', 'lives');
  const base: Record<string, number> = {};
  for (const [k, v] of Object.entries(baseData.economy.leakDamage)) if (typeof v === 'number') base[k] = v;
  for (const kv of argStr('base', '').split(',').filter(Boolean)) base[kv.split('=')[0]] = Number(kv.split('=')[1]);
  const fatalTypes = new Set(['boss', ...(elite === 'loss' ? ['elite'] : [])]);
  const verbose = argStr('verbose', '0') === '1';

  const outcome = (run: Run): 'win' | 'boss' | 'lives' => {
    let lives = start;
    let wave = 0;
    // Regeneration am Ende jeder Wave: bei Leak-Zeitpunkt cur > wave wurden (cur - wave) Waves beendet.
    for (const l of run.leaks) {
      if (regen > 0 && l.cur > wave) {
        lives = Math.min(start, lives + regen * (l.cur - wave));
        wave = l.cur;
      }
      if (fatalTypes.has(l.type)) return 'boss';
      if (elite === 'none' && l.type === 'elite') continue;
      lives -= cost(base[l.type] ?? 1, l.hp, l.maxHp);
      if (lives <= 0) return 'lives';
    }
    return run.win ? 'win' : 'lives';
  };
  const rows: (string | number)[][] = [];
  const by: Record<string, string[]> = {};
  for (const [k, runs] of Object.entries(all)) {
    const o = runs.map(outcome);
    const w = o.filter((x) => x === 'win').length;
    const bs = o.filter((x) => x === 'boss').length;
    const lv = o.filter((x) => x === 'lives').length;
    const [bn, d, p] = k.split('|');
    const lost = runs.map((r) => r.leaks.reduce((a, l) => a + cost(base[l.type] ?? 1, l.hp, l.maxHp), 0)).sort((a, b) => a - b);
    const med = lost[Math.floor(lost.length / 2)];
    const leakNoBoss = runs.map((r) => r.leaks.filter((l) => l.type !== 'boss' && l.type !== 'elite').reduce((a, l) => a + cost(base[l.type] ?? 1, l.hp, l.maxHp), 0)).sort((a, b) => a - b);
    rows.push([bn, d, p, `${((w / runs.length) * 100).toFixed(1)}`, `${bs}`, `${lv}`, `${Math.round(med)}`, `${leakNoBoss[Math.floor(leakNoBoss.length * 0.9)]}`]);
    (by[`${d}|${p}`] ??= []).push(`${bn} ${((w / runs.length) * 100).toFixed(0)}`);
  }
  console.log(`Start ${start}, Regen ${regen}, Elite ${elite}, Basis ${JSON.stringify(base)}`);
  if (verbose) console.log(table(['Bot', 'Stufe', 'P', 'Sieg %', 'Boss-Tod', 'Leben-Tod', 'Median Verlust (Leben, ohne Cap)', 'P90 ohne Boss/Elite'], rows));
  for (const [k, v] of Object.entries(by)) console.log(k.padEnd(14), v.join(' | '));
} else if (part === 'check') {
  for (const d of diffs) for (const p of players) {
    const res: string[] = [];
    for (const bn of botNames) {
      let w = 0;
      for (let seed = 1; seed <= n; seed++) if (play({ difficulty: d, players: p, seed, bots: BOTS[bn] }).result === 'win') w++;
      res.push(`${bn} ${((w / n) * 100).toFixed(0)}`);
    }
    console.log(`${d}|${p}`.padEnd(14), res.join(' | '));
  }
}
