/**
 * P3 Frage 1 (Vertiefung): Warum gewinnt "titan+lancer+frost" überall? (a) Teilmengen / Kombinationen auf Nightmare 1P,
 * (b) Fähigkeiten abgeschaltet (Proxy lehnt useAbility ab), (c) Headroom: Siegquote gegen globalen HP-Faktor (Nightmare 1P)
 * für top3 gegenüber greedy.
 * Aufruf: npx tsx scripts/sanity/q1b-top3.ts [--n 40] [--part sets|headroom]
 */
import type { Sim } from '../../src/index.js';
import type { BotFactory } from '../../src/bots/types.js';
import { argNum, argStr, hpScaled, play, rate, reg, restricted, table } from './lib.js';

const n = argNum('n', 40);
const part = argStr('part', 'sets');

/** Wrapper: der Bot sieht eine Sim, die useAbility ablehnt. */
const noAbility = (f: BotFactory): BotFactory => () => {
  const b = f();
  return {
    name: `${b.name}-ohneFaehigkeit`,
    decide: (ctx) => {
      const sim = new Proxy(ctx.sim, {
        get: (t, k) =>
          k === 'apply'
            ? (p: number, c: { type: string }) => (c.type === 'useAbility' ? { ok: false, reason: 'experiment' } : t.apply(p, c as never))
            : (t as unknown as Record<string | symbol, unknown>)[k],
      }) as Sim;
      b.decide({ ...ctx, sim });
    },
  };
};

if (part === 'sets') {
  const sets: string[][] = [
    ['titan', 'lancer', 'frost'], ['titan', 'frost'], ['lancer', 'frost'], ['frost'],
    ['striker', 'frost'], ['gunner', 'frost'], ['blaster', 'frost'], ['striker', 'gunner', 'frost'], ['striker', 'gunner', 'blaster', 'frost'],
    ['titan', 'lancer'], ['titan'], ['lancer'],
  ];
  const rows: (string | number)[][] = [];
  for (const s of sets) {
    const f = restricted(s.join('+'), s);
    const a = rate(n, (seed) => play({ difficulty: 'nightmare', players: 1, seed, bots: f }));
    const b = rate(n, (seed) => play({ difficulty: 'nightmare', players: 1, seed, bots: noAbility(f) }));
    rows.push([s.join(' + '), a.pct, a.medWave, b.pct, b.medWave]);
  }
  console.log(`\n### Unit-Mengen (greedy-Policy auf erlaubte Typen), Nightmare 1P, n=${n}\n`);
  console.log(table(['Erlaubte Units', 'Sieg % (mit Fähigkeiten)', 'Wave-Med', 'Sieg % (Fähigkeiten aus)', 'Wave-Med'], rows));
} else {
  const rows: (string | number)[][] = [];
  const top3 = restricted('top3', ['titan', 'lancer', 'frost']);
  const tf = restricted('titan+frost', ['titan', 'frost']);
  for (const f of [1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2.0, 2.5]) {
    const data = hpScaled(f);
    const row: (string | number)[] = [f.toFixed(2)];
    for (const bot of [reg('greedy'), top3, tf]) {
      const r = rate(n, (seed) => play({ difficulty: 'nightmare', players: 1, seed, bots: bot, data }));
      row.push(r.pct, r.medWave);
    }
    rows.push(row);
  }
  console.log(`\n### Headroom: globaler HP-Faktor auf Nightmare (1P, n=${n})\n`);
  console.log(table(['HP-Faktor', 'greedy Sieg %', 'Wave-Med', 'titan+lancer+frost Sieg %', 'Wave-Med', 'titan+frost Sieg %', 'Wave-Med'], rows));
}
