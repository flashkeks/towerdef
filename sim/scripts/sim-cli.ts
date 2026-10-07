/**
 * Rauchtest-CLI (Runde 8: keine Messreihen): ein Bot spielt eine Stage durch, Kurzbericht je Wave.
 *
 *   npx tsx scripts/sim-cli.ts --bot mono-rokuhira --stage standard20 --difficulty normal --seed 1
 */
import { runMatch } from '../src/bots/index.js';
import type { DifficultyId } from '../src/index.js';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const r = runMatch({
  stage: arg('stage', 'standard20'),
  difficulty: arg('difficulty', 'normal') as DifficultyId,
  players: Number(arg('players', '1')),
  seed: Number(arg('seed', '1')),
  bots: [arg('bot', 'auto')],
});
for (const w of r.waves) console.log(`wave ${w.wave} coins ${w.coins.join('/')} spawned ${w.spawned} kills ${w.kills} lives ${w.baseHpEnd}`);
console.log(`${r.result} wave ${r.endWave} lives ${r.baseHp} ticks ${r.ticks} hash ${r.hash} units ${r.finalUnits.map((u) => `${u.unit}:${u.level}`).join(',')}`);
