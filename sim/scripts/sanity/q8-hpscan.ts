/**
 * Runde 4 / P1: Siegquote aller Registry-Bots (1P) gegen einen globalen HP-Faktor auf alle drei Stufen.
 * Aufruf: npx tsx scripts/sanity/q8-hpscan.ts --f 1.0,1.1,1.2 [--n 30] [--difficulty normal] [--players 1] [--bots greedy,wide]
 */
import { type DifficultyId } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import { argNum, argStr, hpScaled, play, rate, table } from './lib.js';

const n = argNum('n', 30);
const fs = argStr('f', '1.0').split(',').map(Number);
const diffs = argStr('difficulty', 'normal').split(',') as DifficultyId[];
const players = argNum('players', 1);
const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');
for (const d of diffs) {
  const rows = fs.map((f) => {
    const data = hpScaled(f);
    return [f.toFixed(3), ...botNames.map((bn) => rate(n, (seed) => play({ difficulty: d, players, seed, bots: BOTS[bn], data })).pct)];
  });
  console.log(`\n### HP-Faktor-Scan ${d} ${players}P (n=${n})\n`);
  console.log(table(['f', ...botNames], rows));
}
