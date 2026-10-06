/**
 * Runde 4 / P3: Abnahmezahlen für die Schwierigkeitsstufen in einem Lauf (Nachkalibrierung nach dem Merge mit P4).
 *   --part rates  Siegquote aller Registry-Bots solo je Stufe (run.md Abschnitt 3: bester Bot Normal 85-95, Hard 45-65, Nightmare 15-35)
 *   --part curve  Kennlinie des besten Bots je Stufe: Siegquote gegen globalen HP-Faktor, Fenster 90 -> 10 % (Ziel >= 25 Punkte)
 *   --part rules  Regel-Profil je Stufe (gewählte Varianten, Modifier je Wave) ohne Simulation
 * Aufruf: npx tsx scripts/sanity/p3-check.ts --part rates --difficulty hard --n 60 [--bots aoe,wide] [--players 1]
 *         npx tsx scripts/sanity/p3-check.ts --part curve --difficulty hard --bot wide --n 60 [--f 0.8,0.85,...]
 * Überschreibungen (Env): P3_RULES (Regeln je Stufe), P1_DIFF (HP je Stufe), P2_BOSSHP, siehe lib.ts.
 */
import type { DifficultyId } from '../../src/index.js';
import { compile } from '../../src/data/compile.js';
import { getWave } from '../../src/systems/infinite.js';
import { pickVariant } from '../../src/systems/rules.js';
import { BOTS } from '../../src/bots/index.js';
import { argNum, argStr, baseData, hpScaled, play, rate, table } from './lib.js';

const part = argStr('part', 'rates');
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];
const n = argNum('n', 40);
const players = argNum('players', 1);

if (part === 'rates') {
  const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');
  for (const d of diffs) {
    const res = botNames.map((bn) => rate(n, (seed) => play({ difficulty: d, players, seed, bots: BOTS[bn] })));
    const best = Math.max(...res.map((r) => r.pct));
    console.log(`\n### ${d} ${players}P (n=${n}) bester Bot ${best} %\n`);
    console.log(table(['Bot', ...botNames, 'bester'], [['Sieg %', ...res.map((r) => r.pct), best], ['Wave-Median', ...res.map((r) => r.medWave), '']]));
  }
} else if (part === 'curve') {
  const bot = argStr('bot', 'wide');
  const fs = argStr('f', '0.8,0.85,0.9,0.95,1.0,1.05,1.1,1.15,1.2,1.25,1.3').split(',').map(Number);
  for (const d of diffs) {
    const curve = fs.map((f) => rate(n, (seed) => play({ difficulty: d, players, seed, bots: BOTS[bot], data: hpScaled(f) })).pct);
    console.log(`\n### Kennlinie ${bot} ${d} ${players}P (n=${n})\n`);
    console.log(table(['f', ...fs.map(String)], [['Sieg %', ...curve]]));
    // Kreuzungen (lineare Interpolation; Kurve fällt mit f)
    const cross = (lvl: number): number | null => {
      for (let i = 0; i < fs.length - 1; i++) if (curve[i] >= lvl && curve[i + 1] <= lvl && curve[i] !== curve[i + 1]) return fs[i] + ((curve[i] - lvl) / (curve[i] - curve[i + 1])) * (fs[i + 1] - fs[i]);
      return null;
    };
    const c90 = cross(90);
    const c10 = cross(10);
    console.log(`\n90 %: f=${c90?.toFixed(3) ?? '-'}, 50 %: f=${cross(50)?.toFixed(3) ?? '-'}, 10 %: f=${c10?.toFixed(3) ?? '-'}; Fenster 90->10: ${c90 && c10 ? ((c10 - c90) * 100).toFixed(1) + ' Punkte HP' : 'nicht bestimmbar (Kurve schneidet 90 oder 10 nicht)'}`);
  }
} else if (part === 'rules') {
  const seed = argNum('seed', 1);
  for (const d of diffs) {
    const ctx = compile(baseData, baseData.stages['standard20'], d, 1, { seed });
    const rows: (string | number)[][] = [];
    for (let w = 1; w <= 20; w++) {
      const wave = getWave(ctx, w);
      rows.push([w, pickVariant(ctx, w) ?? '-', wave.groups.map((g) => `${g.count}x${g.type}${g.modifiers.length ? '(' + g.modifiers.join(',') + ')' : ''}e${g.element}`).join(' ')]);
    }
    console.log(`\n### ${d} Seed ${seed}\n`);
    console.log(table(['Wave', 'Variante', 'Gruppen'], rows));
  }
} else throw new Error(`--part ${part} unbekannt`);
