/**
 * Bot-Matrix je Karte (Runde 15): ausgewaehlte Aufstellungen x Schwierigkeit, mit/ohne Held.
 * Aufruf: MAP=frostfen npx tsx scripts/matrix-maps.ts   (MAP=quarry; MODE=no-hero; MATRIX_SEEDS=1,2,3; MATRIX_DIFFS=easy,medium,hard)
 */
import { parseStrategy, runBot } from '../src/bot.js';
import type { Difficulty, ModeId } from '../src/types.js';

const map = process.env.MAP ?? 'frostfen';
const mode = (process.env.MODE ?? 'standard') as ModeId;
const seeds = (process.env.MATRIX_SEEDS ?? '1,2,3').split(',').map(Number);
const diffs = (process.env.MATRIX_DIFFS ?? 'easy,medium,hard').split(',') as Difficulty[];
const COMBOS: [string, string][] = [
  ['Ranger + Bombardier', 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0'],
  ['Ranger + Frostcaller', 'ranger 0-0-0 + ranger 0-2-4 + frostcaller 0-0-0 + frostcaller 2-0-4'],
  ['Bombardier + Frostcaller', 'bombardier 0-0-0 + frostcaller 0-0-0 + bombardier 4-2-0 + frostcaller 2-0-4'],
  ['nur Ranger', 'ranger 0-0-0 + ranger 0-0-0 + ranger 0-2-4 + ranger 0-2-4'],
  ['nur Bombardier', 'bombardier 0-0-0 + bombardier 0-0-0 + bombardier 4-2-0 + bombardier 0-2-4'],
  ['nur Frostcaller', 'frostcaller 0-0-0 + frostcaller 0-0-0 + frostcaller 2-0-4 + frostcaller 0-2-4'],
  ['Ranger + Longshot', 'ranger 0-0-0 + ranger 0-2-4 + longshot 0-0-0 + longshot 4-2-0'],
  ['Bombardier + Thornweaver', 'bombardier 0-0-0 + bombardier 4-2-0 + thornweaver 0-0-0 + thornweaver 0-2-4'],
  ['Ranger + Alchemist', 'ranger 0-0-0 + ranger 0-2-4 + alchemist 0-0-0 + alchemist 4-0-2'],
  ['Ranger + Bombardier + Frostcaller', 'ranger 0-0-0 + bombardier 0-0-0 + frostcaller 0-0-0 + ranger 0-2-4 + bombardier 4-2-0 + frostcaller 2-0-4'],
];
const rows = [`Karte ${map}, Modus ${mode}, Seeds ${seeds.join(',')}`, '', `| Aufstellung | Held | ${diffs.join(' | ')} |`, `|---|---|${diffs.map(() => '---|').join('')}`];
for (const [label, text] of COMBOS) {
  for (const hero of [true, false]) {
    if (mode === 'no-hero' && hero) continue;
    const cells = diffs.map((d) => {
      const rs = seeds.map((seed) => runBot(parseStrategy(hero ? `${text} + hero` : text), { difficulty: d, seed, map, mode }));
      const won = rs.filter((r) => r.result === 'won').length;
      const avgR = rs.reduce((a, r) => a + r.round, 0) / rs.length;
      const avgL = rs.reduce((a, r) => a + r.lives, 0) / rs.length;
      return won === rs.length ? `${won}/${rs.length} ok (${Math.round(avgL)} L)` : `${won}/${rs.length} (R${avgR.toFixed(1)})`;
    });
    rows.push(`| ${label} | ${hero ? 'ja' : 'nein'} | ${cells.join(' | ')} |`);
  }
}
console.log(rows.join('\n'));
