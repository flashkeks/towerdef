/**
 * Bot-Matrix Runde 15b: gemeinsame 120er-Liste, Endrunde je Schwierigkeit (40/60/80), danach Weiterspielen bis zum Tod.
 * Aufruf (aus sim/): MATRIX_SEEDS=1 MAPS=meadow,frostfen,quarry MATRIX_DIFFS=easy,medium,hard npx tsx scripts/matrix-r15b.ts
 * Zelle: "Sieg+N" = Endrunde geschafft, dann bis Runde N weitergespielt (Freeplay-Tod bzw. Ende), sonst "R<Tod>".
 */
import { parseStrategy, runBot, staged } from '../src/bot.js';
import type { Difficulty } from '../src/types.js';

const maps = (process.env.MAPS ?? 'meadow,frostfen,quarry').split(',');
const diffs = (process.env.MATRIX_DIFFS ?? 'easy,medium,hard').split(',') as Difficulty[];
const seeds = (process.env.MATRIX_SEEDS ?? '1').split(',').map(Number);
const only = process.env.ONLY?.split(',');
const cyc = (specs: string[], n: number): string => Array.from({ length: n }, (_, i) => specs[i % specs.length]).join(' + ');
const T4 = ['ranger 0-2-4', 'bombardier 4-2-0', 'frostcaller 2-0-4'];
const T5 = ['ranger 0-2-5', 'bombardier 5-2-0', 'frostcaller 2-0-5', 'ranger 5-2-0', 'bombardier 0-2-5', 'frostcaller 0-2-5'];
const COMBOS: [string, string][] = [
  ['2 Tuerme T3', 'ranger 3-2-0 + bombardier 3-2-0'],
  ['2 Tuerme T4', 'ranger 0-2-4 + bombardier 4-2-0'],
  ['3 Tuerme T4', cyc(T4, 3)],
  ['6 Tuerme T4', cyc(T4, 6)],
  ['10 Tuerme T4', cyc(T4, 10)],
  ['3 Tuerme T5', cyc(T5, 3)],
  ['6 Tuerme T5', cyc(T5, 6)],
  ['10 Tuerme T5', cyc(T5, 10)],
  ['12 Tuerme T5 gemischt', cyc(['ranger 0-2-5', 'bombardier 5-2-0', 'frostcaller 2-0-5', 'longshot 5-2-0', 'alchemist 5-2-0', 'thornweaver 5-2-0', 'ranger 5-2-0', 'bombardier 0-2-5', 'longshot 0-2-5', 'alchemist 0-2-5', 'thornweaver 0-5-2', 'frostcaller 0-2-5'], 12)],
];
const rows = [`Seeds ${seeds.join(',')}; Held immer dabei`, '', `| Aufstellung | Karte | ${diffs.join(' | ')} |`, `|---|---|${diffs.map(() => '---|').join('')}`];
for (const [label, text] of COMBOS) {
  if (only && !only.includes(label.split(' ')[0] + label.split(' ')[1] + (label.split(' ')[2] ?? '')) && !only.includes(label)) { /* kein Filter-Treffer */ }
  for (const map of maps) {
    const cells = diffs.map((d) => {
      // je Zelle die bessere von drei Kaufreihenfolgen (Standard-Bot, gestaffelt, gestaffelt mit spaetem Nachsetzen): ein Mensch waehlt die passende
      const rs = seeds.map((seed) => {
        const a = runBot(parseStrategy(`${text} + hero`), { difficulty: d, seed, map, freeplay: true });
        const rs3 = [0, 2].map((dl) => runBot(staged(parseStrategy(`${text} + hero`), dl), { difficulty: d, seed, map, freeplay: true }));
        return [a, ...rs3].reduce((x, y) => (y.round > x.round ? y : x));
      });
      const cell = rs.map((r) => (r.wonAt > 0 ? `Sieg+${r.round - r.wonAt}${r.result === 'won' && r.round === r.wonAt ? '' : ''}` : `R${r.round}`));
      return cell.join('/');
    });
    rows.push(`| ${label} | ${map} | ${cells.join(' | ')} |`);
    if (process.env.PROGRESS) console.log(rows[rows.length - 1]);
  }
}
console.log(rows.join('\n'));
