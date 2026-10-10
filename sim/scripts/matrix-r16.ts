/**
 * Bot-Matrix Runde 16 (Paket T): neue Tuerme (Riverkeeper, Bellringer, Tinker) und Helden (Bram, Sela) gegen die Referenz aus 15b.
 * Aufruf (aus sim/): MATRIX_SEEDS=1 npx tsx scripts/matrix-r16.ts   (MAPS=..., MATRIX_DIFFS=..., ONLY="Label,Label", PROGRESS=1)
 * Zelle wie matrix-r15b: "Sieg+N" = Endrunde geschafft, dann N Runden Freeplay, sonst "R<Tod>"; beste von drei Kaufreihenfolgen.
 */
import { parseStrategy, runBot, staged } from '../src/bot.js';
import type { Difficulty } from '../src/types.js';

const maps = (process.env.MAPS ?? 'hollow,marsh,harbor').split(',');
const diffs = (process.env.MATRIX_DIFFS ?? 'easy,medium,hard').split(',') as Difficulty[];
const seeds = (process.env.MATRIX_SEEDS ?? '1').split(',').map(Number);
const only = process.env.ONLY?.split(',');
const COMBOS: [string, string][] = [
  ['Referenz 3 T4 + Wren', 'ranger 0-2-4 + bombardier 4-2-0 + frostcaller 2-0-4 + wren'],
  ['3 T4 + Bram', 'ranger 0-2-4 + bombardier 4-2-0 + frostcaller 2-0-4 + bram'],
  ['3 T4 + Sela', 'ranger 0-2-4 + bombardier 4-2-0 + frostcaller 2-0-4 + sela'],
  ['2 T4 + Riverkeeper A4', 'ranger 0-2-4 + bombardier 4-2-0 + riverkeeper 4-2-0 + wren'],
  ['2 T4 + Riverkeeper C4', 'ranger 0-2-4 + bombardier 4-2-0 + riverkeeper 0-2-4 + wren'],
  ['2 T4 + Tinker A4', 'ranger 0-2-4 + bombardier 4-2-0 + tinker 4-2-0 + wren'],
  ['2 T4 + Tinker B4', 'ranger 0-2-4 + bombardier 4-2-0 + tinker 0-4-2 + wren'],
  ['3 T4 + Bellringer A4', 'ranger 0-2-4 + bombardier 4-2-0 + frostcaller 2-0-4 + bellringer 4-2-0 + wren'],
  ['Referenz 6 T5', 'ranger 0-2-5 + bombardier 5-2-0 + frostcaller 2-0-5 + ranger 5-2-0 + bombardier 0-2-5 + frostcaller 0-2-5 + wren'],
  ['5 T5 + Riverkeeper A5', 'ranger 0-2-5 + bombardier 5-2-0 + frostcaller 2-0-5 + ranger 5-2-0 + bombardier 0-2-5 + riverkeeper 5-2-0 + wren'],
  ['5 T5 + Tinker A5', 'ranger 0-2-5 + bombardier 5-2-0 + frostcaller 2-0-5 + ranger 5-2-0 + bombardier 0-2-5 + tinker 5-2-0 + wren'],
  ['6 T5 + Bellringer A5', 'ranger 0-2-5 + bombardier 5-2-0 + frostcaller 2-0-5 + ranger 5-2-0 + bombardier 0-2-5 + frostcaller 0-2-5 + bellringer 5-2-0 + wren'],
];
const rows = [`Seeds ${seeds.join(',')}`, '', `| Aufstellung | Karte | ${diffs.join(' | ')} |`, `|---|---|${diffs.map(() => '---|').join('')}`];
for (const [label, text] of COMBOS) {
  if (only && !only.includes(label)) continue;
  for (const map of maps) {
    const cells = diffs.map((d) => seeds.map((seed) => {
      const st = parseStrategy(text);
      const r = [runBot(st, { difficulty: d, seed, map, freeplay: true }), ...[0, 2].map((dl) => runBot(staged(st, dl), { difficulty: d, seed, map, freeplay: true }))]
        .reduce((x, y) => (y.round > x.round ? y : x));
      return r.wonAt > 0 ? `Sieg+${r.round - r.wonAt}` : `R${r.round}`;
    }).join('/'));
    rows.push(`| ${label} | ${map} | ${cells.join(' | ')} |`);
    if (process.env.PROGRESS) console.log(rows[rows.length - 1]);
  }
}
console.log(rows.join('\n'));
