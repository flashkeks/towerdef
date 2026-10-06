/**
 * Runde 4 / P4: Boss-Diagnose. Je Lauf: Boss-Leak (Wave, Rest-HP), geöffnete Fenster, Fähigkeiten im Fenster, Telegraphs,
 * Unterbrechungen, Schaden im Fenster, Titan/Frost vorhanden.
 *   --n 30 --difficulty normal --bots aoe,upgrade [--players 1]
 */
import { getBot } from '../../src/bots/index.js';
import type { DifficultyId, SimEvent } from '../../src/index.js';
import { policyBot } from '../../src/bots/util.js';
import { argNum, argStr, play, table } from './lib.js';

const AOE = new Set(['blaster', 'lancer', 'frost']);
/** Experiment-Bots: aoe ohne Titan (Gegenprobe "Titan als Boss-Killer") und aoe mit Titan, aber ohne Plan (nur Wert je Münze). */
const EXTRA: Record<string, () => ReturnType<typeof policyBot>> = {
  'aoe-notitan': () => policyBot('aoe-notitan', { canPlace: (d) => d.id !== 'titan', weight: (d) => (AOE.has(d.id) ? 2.2 : d.id === 'gunner' ? 1.2 : d.id === 'banner' ? 0.8 : 0) }),
};
const bot = (name: string) => EXTRA[name] ?? getBot(name);

const n = argNum('n', 30);
const diffs = argStr('difficulty', 'normal').split(',') as DifficultyId[];
const bots = argStr('bots', 'aoe').split(',');
const players = argNum('players', 1);
const rows: (string | number)[][] = [];
for (const d of diffs) for (const bn of bots) {
  const agg = { win: 0, bossLeak10: 0, bossLeak20: 0, windows: 0, abilWin: 0, abil: 0, tele: 0, interrupted: 0, fired: 0, wardBroken: 0, wardExpired: 0, titan: 0, frost: 0, bossRestSum: 0, bossLeaks: 0 };
  for (let seed = 1; seed <= n; seed++) {
    const evs: SimEvent[] = [];
    let hooked = false;
    const r = play({
      difficulty: d, players, seed, bots: bot(bn),
      beforeTick: (sim) => {
        if (hooked) return;
        hooked = true;
        const orig = sim.drainEvents.bind(sim);
        sim.drainEvents = () => { const x = orig(); evs.push(...x); return x; };
      },
    });
    if (r.result === 'win') agg.win++;
    let open = false;
    for (const e of evs) {
      if (e.type === 'bossWindow') { if (e.open) { agg.windows++; open = true; } else open = false; }
      else if (e.type === 'ability') { agg.abil++; if (open) agg.abilWin++; }
      else if (e.type === 'bossTelegraph') agg.tele++;
      else if (e.type === 'bossCast') { if (e.interrupted) agg.interrupted++; else agg.fired++; }
      else if (e.type === 'bossWard') { if (e.state === 'broken') agg.wardBroken++; else if (e.state === 'expired') agg.wardExpired++; }
      else if (e.type === 'leak' && e.enemy === 'boss') { agg.bossLeaks++; agg.bossRestSum += e.hp / e.maxHp; if (e.wave === 10) agg.bossLeak10++; else agg.bossLeak20++; }
    }
    if (r.placed.titan) agg.titan++;
    if (r.placed.frost) agg.frost++;
  }
  const f = (x: number): string => (x / n).toFixed(2);
  rows.push([bn, d, `${Math.round((agg.win / n) * 100)}`, `${agg.bossLeak10}/${agg.bossLeak20}`, agg.bossLeaks ? Math.round((agg.bossRestSum / agg.bossLeaks) * 100) : '-', f(agg.windows), f(agg.abilWin), f(agg.abil), f(agg.tele), f(agg.interrupted), f(agg.fired), `${f(agg.wardBroken)}/${f(agg.wardExpired)}`, f(agg.titan), f(agg.frost)]);
}
console.log(table(['Bot', 'Stufe', 'Sieg%', 'Leak W10/W20', 'Rest-HP% Leak', 'Fenster/Lauf', 'Ability im Fenster', 'Ability gesamt', 'Telegraphs', 'unterbr.', 'gefeuert', 'Schild gebr./abgel.', 'Titan', 'Frost'], rows));
