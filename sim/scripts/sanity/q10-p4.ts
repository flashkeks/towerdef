/**
 * Runde 4 / P4: Siegquoten der Registry-Bots (solo/Koop) und Boss-Auswertung.
 *   --n 40 --difficulty normal,hard --players 1 --bots aoe,wide [--cards 1]
 * Experimente per Umgebung: P2_BOSSHP (fHpBp des Archetyps boss), P4_PATCH (JSON-Patch auf bosses.kits, siehe Kopf von lib).
 * Ausgabe: Siegquote je Bot/Stufe, Median-Endwave, Anteil Verluste am Boss (Boss-Leak) vs. an Leben.
 */
import { BOTS, getBot } from '../../src/bots/index.js';
import type { DifficultyId } from '../../src/index.js';
import { argNum, argStr, play, table } from './lib.js';

const n = argNum('n', 40);
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];
const players = argStr('players', '1').split(',').map(Number);
const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');
const rows: (string | number)[][] = [];
for (const d of diffs) for (const p of players) for (const bn of botNames) {
  let win = 0;
  let bossLoss = 0;
  const waves: number[] = [];
  for (let seed = 1; seed <= n; seed++) {
    const r = play({ difficulty: d, players: p, seed, bots: getBot(bn) });
    if (r.result === 'win') win++;
    else if (Object.keys(r.leaks).some((k) => k.startsWith('boss@'))) bossLoss++;
    waves.push(r.endWave);
  }
  waves.sort((a, b) => a - b);
  rows.push([bn, d, p, `${Math.round((win / n) * 1000) / 10}`, `${Math.round((bossLoss / n) * 1000) / 10}`, waves[Math.floor(waves.length / 2)]]);
}
console.log(table(['Bot', 'Stufe', 'Spieler', 'Sieg %', 'Boss-Tod %', 'Median-Wave'], rows));
