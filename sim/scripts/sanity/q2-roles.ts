/**
 * P3 Frage 2: Nutzlose Unit-Rolle? (a) Beitrag je Unit in greedy-Läufen (Schaden je Münze, Schadensanteil,
 * Kaufquote), (b) Leave-one-out: Siegquote von greedy, wenn ein Unit-Typ verboten ist.
 * Aufruf: npx tsx scripts/sanity/q2-roles.ts --part contrib|loo [--n 80] [--difficulty normal,hard,nightmare]
 */
import { type DifficultyId } from '../../src/index.js';
import { argNum, argStr, f1, play, rate, reg, table, without } from './lib.js';

const part = argStr('part', 'contrib');
const n = argNum('n', 80);
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];
const UNITS = ['striker', 'gunner', 'blaster', 'banner', 'lancer', 'frost', 'titan', 'farm'];

if (part === 'contrib') {
  for (const [d, p] of [['normal', 1], ['hard', 1], ['nightmare', 1], ['normal', 4], ['hard', 4]] as const) {
    const dmg: Record<string, number> = {};
    const spent: Record<string, number> = {};
    const bought: Record<string, number> = {};
    for (let seed = 1; seed <= n; seed++) {
      const r = play({ difficulty: d, players: p, seed, bots: reg('greedy') });
      for (const u of UNITS) {
        dmg[u] = (dmg[u] ?? 0) + (r.dmg[u] ?? 0);
        spent[u] = (spent[u] ?? 0) + (r.spent[u] ?? 0);
        if ((r.placed[u] ?? 0) > 0) bought[u] = (bought[u] ?? 0) + 1;
      }
    }
    const totD = UNITS.reduce((a, u) => a + (dmg[u] ?? 0), 0);
    const totS = UNITS.reduce((a, u) => a + (spent[u] ?? 0), 0);
    console.log(`\n### greedy ${d} ${p}P (n=${n})\n`);
    console.log(
      table(
        ['Unit', 'gekauft in % der Läufe', 'Münzen/Lauf', 'Münzanteil %', 'Schaden/Lauf (kHP)', 'Schadensanteil %', 'Schaden je Münze'],
        UNITS.map((u) => [
          u,
          f1(((bought[u] ?? 0) / n) * 100),
          Math.round((spent[u] ?? 0) / n),
          f1(((spent[u] ?? 0) / totS) * 100),
          f1((dmg[u] ?? 0) / n / 1000),
          f1(((dmg[u] ?? 0) / totD) * 100),
          (spent[u] ?? 0) > 0 ? f1((dmg[u] ?? 0) / (spent[u] ?? 1)) : '-',
        ]),
      ),
    );
  }
} else {
  for (const d of diffs) {
    const rows: (string | number)[][] = [];
    const base: Record<number, number> = {};
    const variants: [string, ReturnType<typeof without>][] = [['(greedy, nichts verboten)', reg('greedy')], ...UNITS.filter((u) => u !== 'farm').map((u) => [`ohne ${u}`, without(u)] as [string, ReturnType<typeof without>])];
    for (const [name, f] of variants) {
      const row: (string | number)[] = [name];
      for (const p of [1, 4]) {
        const r = rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: f }));
        if (name.startsWith('(')) base[p] = r.pct;
        row.push(r.pct, name.startsWith('(') ? '-' : (r.pct - base[p] >= 0 ? '+' : '') + f1(r.pct - base[p]));
      }
      rows.push(row);
    }
    // Farm-LOO: farm-Bot (mit Farm) gegen greedy (= farm-Bot ohne Farm-Käufe)
    const row: (string | number)[] = ['Referenz: farm-Bot (mit Farm)'];
    for (const p of [1, 4]) {
      const r = rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: reg('farm') }));
      row.push(r.pct, (r.pct - base[p] >= 0 ? '+' : '') + f1(r.pct - base[p]));
    }
    rows.push(row);
    console.log(`\n### Leave-one-out greedy ${d} (n=${n})\n`);
    console.log(table(['Variante', 'Sieg % 1P', 'Δ 1P', 'Sieg % 4P', 'Δ 4P'], rows));
  }
}
