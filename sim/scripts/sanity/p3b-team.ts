/** Runde 5 / P3b: Team am Laufende (Typen x Anzahl, Ø Stufe, Münzen). --ban frost --difficulty normal --n 10 */
import type { DifficultyId } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import { botTuning } from '../../src/bots/util.js';
import { argNum, argStr, play } from './lib.js';

if (!process.env.BOT_PROFILE) botTuning.profile = 'normal';
const d = argStr('difficulty', 'normal') as DifficultyId;
const n = argNum('n', 10);
botTuning.banned = argStr('ban', '').split(',').filter(Boolean);
const agg: Record<string, { c: number; lv: number }> = {};
let coins = 0;
let free = 0;
for (let s = 1; s <= n; s++) {
  const r = play({ difficulty: d, players: 1, seed: s, bots: BOTS[argStr('bot', 'wide')] });
  for (const u of r.sim.state.units) {
    const a = (agg[u.defId] ??= { c: 0, lv: 0 });
    a.c++;
    a.lv += u.level;
  }
  const st = r.sim.state as unknown as { players: { coins: number }[] };
  coins += st.players[0].coins;
}
console.log(`${d} ban=${botTuning.banned} Ø Münzen am Ende ${Math.round(coins / n)}`);
console.log(Object.entries(agg).map(([k, v]) => `${k}: ${(v.c / n).toFixed(1)} Stk Ø Stufe ${(v.lv / v.c).toFixed(1)}`).join('\n'));
