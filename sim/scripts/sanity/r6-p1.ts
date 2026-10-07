/**
 * Runde 6 / P1: Sicherheitsnetz nach dem Umbau auf freie Platzierung.
 * Siegquote und Laufzeit je Bot solo auf einer Stufe, dazu die größte Unit-Zahl am Matchende (teamUnits-Grenze 60).
 *
 *   npx tsx scripts/sanity/r6-p1.ts --difficulty normal --n 40 [--bots greedy,farm,...] [--seed0 1]
 *   R6_NOLIMIT=1 ...   Bots ohne eigenes Typ-Limit (Frage: erreicht ein Bot teamUnits = 60?)
 */
import { runMatch } from '../../src/bots/index.js';
import { botTuning } from '../../src/bots/util.js';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const diff = arg('difficulty', 'normal') as 'normal' | 'hard' | 'nightmare';
const n = Number(arg('n', '40'));
const seed0 = Number(arg('seed0', '1'));
if (process.env.R6_NOLIMIT) botTuning.unlimited = true;
const bots = arg('bots', 'greedy,farm,aoe,upgrade,wide,coop').split(',');
for (const bot of bots) {
  const t0 = performance.now();
  let wins = 0;
  let maxUnits = 0;
  let sumUnits = 0;
  let peak = 0;
  for (let s = 0; s < n; s++) {
    const r = runMatch({ stage: 'standard20', difficulty: diff, players: 1, seed: seed0 + s, bots: [bot] });
    if (r.result === 'win') wins++;
    maxUnits = Math.max(maxUnits, r.finalUnits.length);
    sumUnits += r.finalUnits.length;
    peak = Math.max(peak, r.peakUnits);
  }
  const sec = (performance.now() - t0) / 1000;
  console.log(`${diff.padEnd(9)} ${bot.padEnd(8)} win ${((100 * wins) / n).toFixed(0).padStart(3)}%  n=${n}  ${sec.toFixed(1)}s  units@end avg ${(sumUnits / n).toFixed(1)} max ${maxUnits}  peak ${peak}`);
}
