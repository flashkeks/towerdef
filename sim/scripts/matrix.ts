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
const BASE = 'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0';
const UP = 'u1C u3A u1C u3A u1C u3A u1C u3A u1B u3B u1B u3B';
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
  // Market: Reihenfolge ist das Thema. Index 0-3 = Ranger/Bombardier wie oben, 4 = Market.
  { label: 'Ranger + Bombardier + Market 1-0-0 frueh (R4, nach Grundstock + 3 Upgrades)', text: `${BASE} + market 1-0-0`, script: 'p0 p2 p1 p3 {H} u1C u3A u1C p4 u4A u3A u1C u3A u1C u3A u1B u3B u1B u3B' },
  { label: 'Ranger + Bombardier + Market 2-2-0 mitte (nach 6 Upgrades)', text: `${BASE} + market 2-2-0`, script: 'p0 p2 p1 p3 {H} u1C u3A u1C u3A u1C u3A p4 u4A u4B u4A u4B u1C u3A u1B u3B u1B u3B' },
  { label: 'Ranger + Bombardier + Market 2-2-0 spaet (nach allen Upgrades)', text: `${BASE} + market 2-2-0`, script: `p0 p2 p1 p3 {H} ${UP} p4 u4A u4B u4A u4B` },
  { label: 'Ranger + Bombardier + Market 0-4-0 Grant mitte', text: `${BASE} + market 0-4-0`, script: 'p0 p2 p1 p3 {H} u1C u3A u1C u3A u1C u3A p4 u4B u4B u4B u4B u1C u3A u1B u3B u1B u3B' },
  { label: 'Ranger + Bombardier + Market 0-0-3 Drum Hall frueh', text: `${BASE} + market 0-0-3`, script: 'p0 p2 p1 p3 {H} u1C u3A u1C u3A p4 u4C u4C u4C u1C u3A u1C u3A u1B u3B u1B u3B' },
  // Runde 14
  { label: 'Ranger + Thornweaver 4-2-0 (Storm)', text: 'ranger 0-0-0 + ranger 0-2-4 + thornweaver 0-0-0 + thornweaver 4-2-0' },
  { label: 'Ranger + Thornweaver 0-4-2 (Wild)', text: 'ranger 0-0-0 + ranger 0-2-4 + thornweaver 0-0-0 + thornweaver 0-4-2' },
  { label: 'Bombardier + Thornweaver 0-2-4 (Grove)', text: 'bombardier 0-0-0 + bombardier 4-2-0 + thornweaver 0-0-0 + thornweaver 0-2-4' },
  { label: 'nur Thornweaver', text: 'thornweaver 0-0-0 + thornweaver 0-0-0 + thornweaver 4-2-0 + thornweaver 0-4-2' },
  { label: 'Ranger + Alchemist 4-0-2 (Brews)', text: 'ranger 0-0-0 + ranger 0-2-4 + alchemist 0-0-0 + alchemist 4-0-2' },
  { label: 'Bombardier + Alchemist 0-4-2 (Tonic)', text: 'bombardier 0-0-0 + bombardier 4-2-0 + alchemist 0-0-0 + alchemist 0-4-2' },
  { label: 'Ranger + Bombardier + Alchemist 3-0-3', text: `${BASE} + alchemist 3-0-3`, script: `p0 p2 p1 p3 {H} ${UP} p4 u4A u4A u4A u4C u4C u4C` },
  { label: 'nur Alchemist', text: 'alchemist 0-0-0 + alchemist 0-0-0 + alchemist 4-2-0 + alchemist 0-4-2' },
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

// Pops je 1.000 Gold (nur Turmkosten), Medium, Einzeltuerme voll ausgebaut: Faustregel "kein Turm um mehr als 2x"
if (process.env.MATRIX_POPS !== '0') {
  const SOLO: Record<string, string> = {
    ranger: 'ranger 0-0-0 + ranger 0-0-0 + ranger 0-2-4 + ranger 0-2-4',
    bombardier: 'bombardier 0-0-0 + bombardier 0-0-0 + bombardier 4-2-0 + bombardier 0-2-4',
    frostcaller: 'frostcaller 0-0-0 + frostcaller 0-0-0 + frostcaller 2-0-4 + frostcaller 0-2-4',
    longshot: 'longshot 0-0-0 + longshot 0-0-0 + longshot 4-2-0 + longshot 0-2-4',
    thornweaver: 'thornweaver 0-0-0 + thornweaver 0-0-0 + thornweaver 4-2-0 + thornweaver 0-4-2',
    alchemist: 'alchemist 0-0-0 + alchemist 0-0-0 + alchemist 4-2-0 + alchemist 0-4-2',
  };
  const out: string[] = ['', '| Turm (4 Stueck, Medium) | Pops je 1.000 Gold | Ø Runde |', '|---|---|---|'];
  for (const [k, text] of Object.entries(SOLO)) {
    const rs = seeds.map((seed) => runBot(parseStrategy(text), { difficulty: 'medium', seed }));
    const per = rs.reduce((a, r) => a + ((r.pops[k] ?? 0) / Math.max(1, r.spent[k] ?? 1)) * 1000, 0) / rs.length;
    const avgR = rs.reduce((a, r) => a + r.round, 0) / rs.length;
    out.push(`| ${k} | ${Math.round(per)} | ${avgR.toFixed(1)} |`);
  }
  console.log(out.join('\n'));
}
