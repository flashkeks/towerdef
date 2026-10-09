/**
 * Balance-Rauchtest P5 (Runde 11): jede sinnvolle 2-Turm-Kombination und jeder Einzelturm, mit und ohne Held,
 * auf allen Schwierigkeiten, mehrere Seeds. Ausgabe als Markdown-Tabelle (Sieg-Anteil, Ø Runde, Ø Leben).
 * Aufruf: npm run matrix   (Seeds: MATRIX_SEEDS=1,2,3)
 */
import { parseStrategy, runBot } from '../src/bot.js';
import type { Difficulty } from '../src/types.js';

const COMBOS: [string, string][] = [
  ['Ranger + Bombardier', 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0'],
  ['Ranger + Frostcaller', 'ranger 0-0-0 + ranger 0-2-4 + frostcaller 0-0-0 + frostcaller 2-0-4'],
  ['Bombardier + Frostcaller', 'bombardier 0-0-0 + frostcaller 0-0-0 + bombardier 4-2-0 + frostcaller 2-0-4'],
  ['nur Ranger', 'ranger 0-0-0 + ranger 0-0-0 + ranger 0-2-4 + ranger 0-2-4'],
  ['nur Bombardier', 'bombardier 0-0-0 + bombardier 0-0-0 + bombardier 4-2-0 + bombardier 0-2-4'],
  ['nur Frostcaller', 'frostcaller 0-0-0 + frostcaller 0-0-0 + frostcaller 2-0-4 + frostcaller 0-2-4'],
];
const seeds = (process.env.MATRIX_SEEDS ?? '1,2,3').split(',').map(Number);
const diffs = (process.env.MATRIX_DIFFS ?? 'easy,medium,hard').split(',') as Difficulty[];
const rows: string[] = [`| Aufstellung | Held | ${diffs.join(' | ')} |`, `|---|---|${diffs.map(() => '---|').join('')}`];
for (const [label, s] of COMBOS) {
  for (const hero of [true, false]) {
    const cells = diffs.map((d) => {
      const rs = seeds.map((seed) => runBot(parseStrategy(hero ? `${s} + hero` : s), { difficulty: d, seed }));
      const won = rs.filter((r) => r.result === 'won').length;
      const avgR = rs.reduce((a, r) => a + r.round, 0) / rs.length;
      const avgL = rs.reduce((a, r) => a + r.lives, 0) / rs.length;
      return won === rs.length ? `${won}/${rs.length} ✔ (${Math.round(avgL)} L)` : `${won}/${rs.length} (Ø R${avgR.toFixed(1)})`;
    });
    rows.push(`| ${label} | ${hero ? 'ja' : 'nein'} | ${cells.join(' | ')} |`);
  }
}
console.log(rows.join('\n'));
