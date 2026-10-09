/**
 * Balance-Rauchtest P5 (Runde 11): jede sinnvolle 2-Turm-Kombination und jeder Einzelturm, mit und ohne Held,
 * auf allen Schwierigkeiten, mehrere Seeds. Ausgabe als Markdown-Tabelle (Sieg-Anteil, Ø Runde, Ø Leben).
 * Aufruf: npm run matrix   (Seeds: MATRIX_SEEDS=1,2,3)
 */
import { parseStrategy, runBot } from '../src/bot.js';
import type { Difficulty } from '../src/types.js';

/**
 * `script` (optional) = feste Kaufreihenfolge fuer Strategien, bei denen die Reihenfolge das Thema ist (Market frueh/spaet);
 * `{H}` darin wird mit Held zu `h`, sonst leer. Tuerme nach Index in `text` (ohne `hero`).
 */
interface Combo { label: string; text: string; script?: string }
const MARKET_TOWERS = 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0 + market 2-2-0';
const COMBOS: Combo[] = [
  { label: 'Ranger + Bombardier', text: 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0' },
  { label: 'Ranger + Frostcaller', text: 'ranger 0-0-0 + ranger 0-2-4 + frostcaller 0-0-0 + frostcaller 2-0-4' },
  { label: 'Bombardier + Frostcaller', text: 'bombardier 0-0-0 + frostcaller 0-0-0 + bombardier 4-2-0 + frostcaller 2-0-4' },
  { label: 'nur Ranger', text: 'ranger 0-0-0 + ranger 0-0-0 + ranger 0-2-4 + ranger 0-2-4' },
  { label: 'nur Bombardier', text: 'bombardier 0-0-0 + bombardier 0-0-0 + bombardier 4-2-0 + bombardier 0-2-4' },
  { label: 'nur Frostcaller', text: 'frostcaller 0-0-0 + frostcaller 0-0-0 + frostcaller 2-0-4 + frostcaller 0-2-4' },
  // Runde 13
  { label: 'Ranger + Longshot 4-2-0', text: 'ranger 0-0-0 + ranger 0-2-4 + longshot 0-0-0 + longshot 4-2-0' },
  { label: 'Ranger + Longshot 0-3-3', text: 'ranger 0-0-0 + ranger 0-2-4 + longshot 0-0-0 + longshot 0-3-3' },
  { label: 'Bombardier + Longshot 4-2-0', text: 'bombardier 0-0-0 + bombardier 4-2-0 + longshot 0-0-0 + longshot 4-2-0' },
  { label: 'nur Longshot', text: 'longshot 0-0-0 + longshot 0-0-0 + longshot 4-2-0 + longshot 0-2-4' },
  { label: 'Ranger + Bombardier, kein Market', text: 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0' },
  {
    label: 'Ranger + Bombardier + Market 2-2-0 frueh (Bau nach dem ersten Ranger)', text: MARKET_TOWERS,
    script: 'p0 p4 u4A u4B u4A u4B {H} p2 p1 p3 u1C u3A u1C u3A u1C u3A u1C u3A u1B u3B u1B u3B',
  },
  {
    label: 'Ranger + Bombardier + Market 2-2-0 spaet (nach allen Upgrades)', text: MARKET_TOWERS,
    script: 'p0 p2 p1 p3 {H} u1C u3A u1C u3A u1C u3A u1C u3A u1B u3B u1B u3B p4 u4A u4B u4A u4B',
  },
  {
    label: 'Ranger + Bombardier + Market 0-0-5 Aura frueh', text: 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0 + market 0-0-3',
    script: 'p0 p2 p1 p3 p4 u4C u4C u4C {H} u1C u3A u1C u3A u1C u3A u1C u3A u1B u3B u1B u3B',
  },
];
const seeds = (process.env.MATRIX_SEEDS ?? '1,2,3').split(',').map(Number);
const diffs = (process.env.MATRIX_DIFFS ?? 'easy,medium,hard').split(',') as Difficulty[];
const rows: string[] = [`| Aufstellung | Held | ${diffs.join(' | ')} |`, `|---|---|${diffs.map(() => '---|').join('')}`];
for (const { label, text, script } of COMBOS) {
  for (const hero of [true, false]) {
    const cells = diffs.map((d) => {
      const rs = seeds.map((seed) => {
        const strat = parseStrategy(hero ? `${text} + hero` : text);
        if (script) strat.script = script.replace('{H}', hero ? 'h' : '').trim();
        return runBot(strat, { difficulty: d, seed });
      });
      const won = rs.filter((r) => r.result === 'won').length;
      const avgR = rs.reduce((a, r) => a + r.round, 0) / rs.length;
      const avgL = rs.reduce((a, r) => a + r.lives, 0) / rs.length;
      return won === rs.length ? `${won}/${rs.length} ✔ (${Math.round(avgL)} L)` : `${won}/${rs.length} (Ø R${avgR.toFixed(1)})`;
    });
    rows.push(`| ${label} | ${hero ? 'ja' : 'nein'} | ${cells.join(' | ')} |`);
  }
}
console.log(rows.join('\n'));
