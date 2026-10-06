/**
 * P3 Frage 6: Messerschneide. Siegquote von greedy (und wide) als Funktion eines globalen HP-Faktors f
 * (0,90 ... 1,15 in 0,025-Schritten, per Data-Override auf difficulties.*.hpBp, JSON unverändert).
 * f = 1,00 entspricht der kalibrierten Schwierigkeit. Danach: Breite des 10-90-%-Fensters und
 * Glättung durch eine zufällige Spieler-Stärke (log-gleichverteilt +-s) als Proxy für menschliche Streuung.
 * Aufruf: npx tsx scripts/sanity/q6-hp-curve.ts [--n 100] [--difficulty normal] [--bot greedy] [--players 1]
 */
import { type DifficultyId } from '../../src/index.js';
import { argNum, argStr, f1, hpScaled, play, rate, reg, table } from './lib.js';

const n = argNum('n', 100);
const d = argStr('difficulty', 'normal') as DifficultyId;
const bot = argStr('bot', 'greedy');
const p = argNum('players', 1);
const fs: number[] = [];
for (let i = 0; i <= 10; i++) fs.push(Math.round((0.9 + 0.025 * i) * 1000) / 1000);

const curve: number[] = [];
const rows: (string | number)[][] = [];
for (const f of fs) {
  const data = hpScaled(f);
  const r = rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: reg(bot), data }));
  curve.push(r.pct);
  rows.push([f.toFixed(3), r.pct, r.medWave]);
}
console.log(`\n### ${bot} ${d} ${p}P, n=${n} je Punkt\n`);
console.log(table(['HP-Faktor f', 'Sieg %', 'Wave-Median'], rows));

// Interpolation (linear in f) und Fensterbreite
const at = (f: number): number => {
  if (f <= fs[0]) return curve[0];
  if (f >= fs[fs.length - 1]) return curve[curve.length - 1];
  const i = Math.floor((f - fs[0]) / 0.025);
  const t = (f - fs[i]) / 0.025;
  return curve[i] * (1 - t) + curve[i + 1] * t;
};
const cross = (lvl: number): number | null => {
  for (let i = 0; i < fs.length - 1; i++) {
    if ((curve[i] - lvl) * (curve[i + 1] - lvl) <= 0 && curve[i] !== curve[i + 1]) return fs[i] + ((lvl - curve[i]) / (curve[i + 1] - curve[i])) * 0.025;
  }
  return null;
};
const c90 = cross(90);
const c50 = cross(50);
const c10 = cross(10);
console.log(`\nf bei 90 %: ${c90?.toFixed(3) ?? '-'}, 50 %: ${c50?.toFixed(3) ?? '-'}, 10 %: ${c10?.toFixed(3) ?? '-'}; Fenster 90->10 %: ${c90 && c10 ? ((c10 - c90) * 100).toFixed(1) + ' Prozentpunkte HP' : '-'}`);
const mix: (string | number)[][] = [];
for (const s of [0, 0.05, 0.1, 0.2]) {
  // Spielerstärke x ~ log-gleichverteilt in [1-s, 1+s]; effektiver HP-Faktor f/x
  const K = 200;
  const row: (string | number)[] = [`+-${s * 100} %`];
  for (const f of [0.95, 1.0, 1.05, 1.1]) {
    let acc = 0;
    for (let k = 0; k < K; k++) {
      const x = Math.exp(Math.log(1 - s || 1) + ((Math.log(1 + s) - Math.log(1 - s || 1)) * (k + 0.5)) / K);
      acc += at(f / x);
    }
    row.push(f1(acc / K));
  }
  mix.push(row);
}
console.log('\nSiegquote bei gestreuter Spielerstärke (Faltung der gemessenen Kurve)\n');
console.log(table(['Streuung der Spielerstärke', 'f=0,95', 'f=1,00', 'f=1,05', 'f=1,10'], mix));
