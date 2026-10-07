/**
 * Runde 6 / P2: grobe Balance auf dem Modell mit freier Platzierung.
 *   npx tsx scripts/sanity/r6-p2.ts --difficulty normal --n 40 --bots farm,wide,mono-striker,...
 * Wie r6-p1.ts, dazu Patches ohne Dateiänderung:
 *   P2_ECON='{"placeCostGrowthBp":1000}'      economy-Felder überschreiben (flach)
 *   P2_UNITS='{"farm":{"placeGrowthBp":2000}}' Unit-Felder je ID (flach); farm.yieldByLevel als Array ersetzbar via "farm":{"farm":{...}}
 *   P2_BAN=farm,frost                          Leave-one-out (botTuning.banned)
 */
import { runMatch } from '../../src/bots/index.js';
import { botTuning } from '../../src/bots/util.js';
import { loadGameData } from '../../src/data/load.js';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const diff = arg('difficulty', 'normal') as 'normal' | 'hard' | 'nightmare';
const n = Number(arg('n', '40'));
const seed0 = Number(arg('seed0', '1'));
const bots = arg('bots', 'farm,wide').split(',');
if (process.env.P2_BAN) botTuning.banned = process.env.P2_BAN.split(',');
const data = loadGameData() as any;
if (process.env.P2_ECON) Object.assign(data.economy, JSON.parse(process.env.P2_ECON));
if (process.env.P2_UNITS) {
  const patch = JSON.parse(process.env.P2_UNITS) as Record<string, Record<string, unknown>>;
  for (const u of data.units.units) if (patch[u.id]) Object.assign(u, patch[u.id]);
}
const out: string[] = [];
for (const bot of bots) {
  let wins = 0;
  let sumUnits = 0;
  let sumCoins = 0;
  for (let s = 0; s < n; s++) {
    const r = runMatch({ stage: 'standard20', difficulty: diff, players: 1, seed: seed0 + s, bots: [bot], data });
    if (r.result === 'win') wins++;
    sumUnits += r.finalUnits.length;
  }
  out.push(`${diff.padEnd(9)} ${bot.padEnd(14)} win ${((100 * wins) / n).toFixed(0).padStart(3)}%  n=${n}  units@end ${(sumUnits / n).toFixed(1)}${process.env.P2_TAG ? '  [' + process.env.P2_TAG + ']' : ''}`);
}
console.log(out.join('\n'));
