/**
 * Runde 7 / P6: grober Check des 14er-Pools (Registry-Bots mit Fehlermodell, Profil `normal`, standard20, solo).
 *   npx tsx scripts/sanity/r7-p6.ts --bots wide,farm,aoe --difficulty normal,hard --n 40
 *     Siegquote je Bot und Stufe samt Kaufquote je Unit (Anteil der Läufe, in denen die Unit mindestens einmal gekauft wurde, und Mittel der Stückzahl)
 *   npx tsx scripts/sanity/r7-p6.ts --part loo --bots wide --difficulty hard --n 40 [--units blaster,mortar]
 *     Leave-one-out: Verbot einer Unit (botTuning.banned), Delta der Siegquote gegen die Basis.
 * Seeds seed0 .. seed0+n-1. Ausgabe als Markdown-Tabelle; `--raw` zeilenweise.
 */
import { runMatch } from '../../src/bots/index.js';
import { botTuning } from '../../src/bots/util.js';
import { loadGameData } from '../../src/data/load.js';
import type { DifficultyId } from '../../src/index.js';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
if (!process.env.BOT_PROFILE) botTuning.profile = 'normal';
const part = arg('part', 'rates');
const diffs = arg('difficulty', 'normal').split(',') as DifficultyId[];
const bots = arg('bots', 'wide,farm,aoe').split(',');
const n = Number(arg('n', '40'));
const ban = arg('ban', '').split(',').filter(Boolean);
const seed0 = Number(arg('seed0', '1'));
const data = loadGameData();
// R7_UNITS='{"mortar":{"dpsShareBp":8000}}': flache Unit-Feld-Überschreibungen je ID (Experimente ohne Dateiänderung); R7_TAG hängt eine Marke an.
if (process.env.R7_UNITS) {
  const patch = JSON.parse(process.env.R7_UNITS) as Record<string, Record<string, unknown>>;
  for (const u of data.units.units as unknown as Record<string, unknown>[]) if (patch[u.id as string]) Object.assign(u, patch[u.id as string]);
}
const ALL = data.units.units.map((u) => u.id);

interface Agg {
  win: number;
  bought: Record<string, number>;
  count: Record<string, number>;
  waves: number;
  leaks: number;
}
function run(diff: DifficultyId, bot: string, ban: string[], force: string[] = []): Agg {
  botTuning.banned = ban;
  botTuning.force = force;
  const a: Agg = { win: 0, bought: {}, count: {}, waves: 0, leaks: 0 };
  for (let s = seed0; s < seed0 + n; s++) {
    const placed = new Set<string>();
    const cnt: Record<string, number> = {};
    const r = runMatch({
      stage: 'standard20',
      difficulty: diff,
      players: 1,
      seed: s,
      bots: [bot],
      data,
      onCommand: (c) => {
        if (c.ok && c.cmd.type === 'place') {
          placed.add(c.cmd.unitId);
          cnt[c.cmd.unitId] = (cnt[c.cmd.unitId] ?? 0) + 1;
        }
      },
    });
    if (r.result === 'win') a.win++;
    a.waves += r.endWave;
    a.leaks += r.totals.leaks;
    for (const u of placed) a.bought[u] = (a.bought[u] ?? 0) + 1;
    for (const [u, c] of Object.entries(cnt)) a.count[u] = (a.count[u] ?? 0) + c;
  }
  botTuning.banned = [];
  botTuning.force = [];
  return a;
}
const pct = (x: number): number => Math.round((x / n) * 1000) / 10;

if (part === 'rates') {
  for (const d of diffs) {
    for (const b of bots) {
      const a = run(d, b, ban);
      const buy = ALL.map((u) => `${u}:${pct(a.bought[u] ?? 0).toFixed(0)}%/${((a.count[u] ?? 0) / n).toFixed(1)}`).join(' ');
      console.log(`${d.padEnd(9)} ${b.padEnd(8)} win ${pct(a.win).toFixed(1).padStart(5)}%  wave ${(a.waves / n).toFixed(1)}  leaks ${(a.leaks / n).toFixed(1)}  n=${n}\n    kauf ${buy}`);
    }
  }
} else if (part === 'force') {
  // Zwangskauf: Delta der Siegquote mit erzwungener Unit gegen Verbot (Wert einer Unit, die die Bots von sich aus selten wählen).
  const units = arg('units', ALL.join(',')).split(',');
  for (const d of diffs) {
    for (const b of bots) {
      const base = run(d, b, []);
      const cells = units.map((u) => {
        const ban = run(d, b, [u]);
        const fo = run(d, b, [], [u]);
        return `${u} ban ${pct(ban.win).toFixed(0)} / base ${pct(base.win).toFixed(0)} / force ${pct(fo.win).toFixed(0)} (force-ban ${(pct(fo.win) - pct(ban.win)).toFixed(0)}, bought ${pct(fo.bought[u] ?? 0).toFixed(0)}%)`;
      });
      console.log(`FORCE ${d} ${b} n=${n}\n    ${cells.join('\n    ')}`);
    }
  }
} else {
  const units = arg('units', ALL.join(',')).split(',');
  for (const d of diffs) {
    for (const b of bots) {
      const base = run(d, b, []);
      const cells = units.map((u) => {
        const r = run(d, b, [u]);
        const dl = pct(r.win) - pct(base.win);
        return `${u} ${pct(r.win).toFixed(0)} (${dl >= 0 ? '+' : ''}${dl.toFixed(1)})`;
      });
      console.log(`LOO ${d} ${b} n=${n} Basis ${pct(base.win).toFixed(1)}\n    ${cells.join(' | ')}`);
    }
  }
}
