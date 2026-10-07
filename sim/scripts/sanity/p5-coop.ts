/**
 * Runde 4 / P5: Koop-Matrix. Siegquote je Bot x Spielerzahl je Stufe; alle Spieler nutzen denselben Bot.
 * Aufruf: npx tsx scripts/sanity/p5-coop.ts --difficulty normal --n 40 [--players 1,2,4] [--bots upgrade,aoe]
 * Experimente ohne Dateiänderung (Env, flach über economy.coop gemerged): P5_COOP='{"hpPerExtraPlayerBp":9000,"bossHpPerExtraPlayerBp":6000}'
 * Zusätzlich P1_COOPH, P2_BOSSHP, P3_RULES (siehe lib.ts). Ausgabe: Markdown-Tabelle + "Spanne" (max-min über 1P/2P/4P je Bot, Ziel <= 10).
 */
import type { DifficultyId } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import type { StageData } from '../../src/index.js';
import { argNum, argStr, baseData, play, rate, table } from './lib.js';

if (process.env.P5_COOP) Object.assign(baseData.economy.coop, JSON.parse(process.env.P5_COOP));

// Experiment: P5_SLOTS=8 -> 8 zusätzliche Kampf-Slots je Zusatzspieler (Kopien bestehender Slots, um 0,5 Tile versetzt).
const extraPerPlayer = Number(process.env.P5_SLOTS ?? 0);
function stageFor(players: number): StageData {
  const st = structuredClone(baseData.stages['standard20']) as StageData;
  // Seit Runde 6 (freie Platzierung) gibt es keine festen Slots mehr: das Experiment ist gegenstandslos, die Karte bleibt unverändert.
  void extraPerPlayer;
  void players;
  return st;
}
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];
const n = argNum('n', 30);
const pls = argStr('players', '1,2,4').split(',').map(Number);
const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');

for (const d of diffs) {
  const rows: (string | number)[][] = [];
  for (const bn of botNames) {
    const rs = pls.map((p) => rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: BOTS[bn], ...(extraPerPlayer ? { stage: stageFor(p) as unknown as string } : {}) })).pct);
    rows.push([bn, ...rs, Math.max(...rs) - Math.min(...rs)]);
  }
  console.log(`\n### ${d} (n=${n}, Siegquote %)\n`);
  console.log(table(['Bot', ...pls.map((p) => `${p}P`), 'Spanne'], rows));
}
