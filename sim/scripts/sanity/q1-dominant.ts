/**
 * P3 Frage 1: Dominante Strategie? Mono-Unit-Bots, Spam der billigsten Units, Titan+Banner usw.
 * gegen die Registry-Bots auf allen Schwierigkeiten (1 und 4 Spieler, alle Spieler spielen denselben Bot).
 * Aufruf: npx tsx scripts/sanity/q1-dominant.ts [--n 50] [--difficulty normal|hard|nightmare]
 */
import { type DifficultyId } from '../../src/index.js';
import type { BotFactory } from '../../src/bots/types.js';
import { argNum, argStr, play, rate, reg, restricted, table } from './lib.js';

const n = argNum('n', 50);
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];

const bots: [string, BotFactory][] = [
  ['greedy (Reg)', reg('greedy')],
  ['wide (Reg)', reg('wide')],
  ['upgrade (Reg)', reg('upgrade')],
  ['farm (Reg)', reg('farm')],
  ['aoe (Reg)', reg('aoe')],
  ['coop (Reg)', reg('coop')],
  ['mono striker', restricted('m-striker', ['striker'])],
  ['mono gunner', restricted('m-gunner', ['gunner'])],
  ['mono blaster', restricted('m-blaster', ['blaster'])],
  ['mono lancer', restricted('m-lancer', ['lancer'])],
  ['mono frost', restricted('m-frost', ['frost'])],
  ['mono titan', restricted('m-titan', ['titan'])],
  ['titan+banner', restricted('titan-banner', ['titan', 'banner'])],
  ['Spam billigste (Rare: striker+gunner)', restricted('rare-spam', ['striker', 'gunner'])],
  ['Top-Rarity (titan+lancer+frost)', restricted('top3', ['titan', 'lancer', 'frost'])],
];

for (const d of diffs) {
  const rows = bots.map(([name, f]) => {
    const cells: string[] = [];
    for (const p of [1, 4]) {
      const r = rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: f }));
      cells.push(`${r.pct}`, `${r.medWave}`);
    }
    return [name, ...cells];
  });
  console.log(`\n### ${d} (n=${n})\n`);
  console.log(table(['Bot', 'Sieg % 1P', 'Wave-Med 1P', 'Sieg % 4P', 'Wave-Med 4P'], rows));
}
