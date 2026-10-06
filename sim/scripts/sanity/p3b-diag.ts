/** Runde 5 / P3b: Leak-Diagnose je Gegnertyp und Wave. --ban frost --difficulty normal --n 30 */
import type { DifficultyId } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import { botTuning } from '../../src/bots/util.js';
import { argNum, argStr, play } from './lib.js';

if (!process.env.BOT_PROFILE) botTuning.profile = 'normal';
const d = argStr('difficulty', 'normal') as DifficultyId;
const n = argNum('n', 30);
botTuning.banned = argStr('ban', '').split(',').filter(Boolean);
const leaks: Record<string, number> = {};
const endW: Record<number, number> = {};
let win = 0;
for (let s = 1; s <= n; s++) {
  const r = play({ difficulty: d, players: 1, seed: s, bots: BOTS[argStr('bot', 'wide')] });
  if (r.result === 'win') win++;
  endW[r.endWave] = (endW[r.endWave] ?? 0) + 1;
  for (const [k, v] of Object.entries(r.leaks)) leaks[k] = (leaks[k] ?? 0) + (v as number);
}
console.log(`${d} ban=${botTuning.banned} win ${win}/${n}\nendWave`, JSON.stringify(endW), '\nleaks/Lauf', JSON.stringify(Object.fromEntries(Object.entries(leaks).map(([k, v]) => [k, Math.round((v / n) * 10) / 10]))));
