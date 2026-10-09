/** Runde 14: Wissensbaum-Mods der Sim (Pop Bonus, Sharper Arrows, Fused Shells, Icicle Edge, Field Medic, Sturdy Gate, Deep Roots, Potent Brews …). */
import { describe, expect, it } from 'vitest';
import './setup';
import { buy, clearRound, newGame, place, run, statsOf } from './helpers';

describe('Wissensbaum Runde 14', () => {
  it('Field Medic: +1 Leben je geschaffter Runde, Event heal', () => {
    const g = newGame({ mods: { startCash: 1000, roundLives: 1 } });
    const l0 = g.state.lives;
    const ev = clearRound(g);
    expect(g.state.lives).toBe(l0 + 1);
    expect(ev.filter((e) => e.type === 'heal')).toHaveLength(1);
  });

  it('Sturdy Gate: genau ein Leck wird verhindert (Event gate), das naechste kostet', () => {
    const run1 = (gate: number): { lives: number; gates: number } => {
      const g = newGame({ mods: { startCash: 0, gate } });
      g.sandbox.spawn('red', 1e9);
      g.sandbox.spawn('red', 1e9);
      const ev = run(g, 60);
      return { lives: g.state.lives, gates: ev.filter((e) => e.type === 'gate').length };
    };
    const base = run1(0);
    const gated = run1(1);
    expect(gated.gates).toBe(1);
    expect(base.gates).toBe(0);
    expect(gated.lives).toBeGreaterThan(base.lives);
  });

  it('Pop Bonus: +5 % Pop-Gold mit Bruchrest', () => {
    const gold = (bp: number): number => {
      const g = newGame({ mods: { startCash: 0, popCashBp: bp } });
      for (let i = 0; i < 40; i++) {
        const id = g.sandbox.spawn('red', 1000 + i);
        g.sandbox.hurt(id, 1_000_000);
      }
      return g.state.cash;
    };
    const base = gold(0);
    const bonus = gold(500);
    expect(bonus).toBeGreaterThan(base);
    expect(bonus - base).toBeLessThanOrEqual(Math.ceil(base * 0.05) + 1);
  });

  it('Sharper Arrows: Mod pierceAdd wird ohne Fehler angenommen (Wirkung siehe Bot-Matrix)', () => {
    const g = newGame({ mods: { pierceAdd: { ranger: 1 } } });
    const r = place(g, 'ranger');
    const l = place(g, 'longshot', 560, 40);
    const base = statsOf('ranger', [0, 0, 0]);
    expect(base.pierce).toBeGreaterThan(0);
    g.step();
    expect(g.state.towers.find((t) => t.id === r)).toBeDefined();
    expect(g.state.towers.find((t) => t.id === l)).toBeDefined();
  });

  it('Deep Roots: Thornweaver +10 % Reichweite', () => {
    const range = (mods: object): number => {
      const g = newGame({ mods: { startCash: 100000, ...mods } });
      const id = place(g, 'thornweaver', 60, 122);
      return g.state.towers.find((t) => t.id === id)!.range;
    };
    const a = range({});
    const b = range({ rangeBp: { thornweaver: 1000 } });
    expect(a).toBe(70000);
    expect(b).toBe(77000);
  });

  it('Bountiful Grove: Bounty zahlt 200 statt 150 Gold je Runde', () => {
    const g = newGame({ mods: { startCash: 100000, bountyGold: 50 } });
    const id = place(g, 'thornweaver', 60, 122);
    buy(g, id, [0, 0, 3]);
    const ev = clearRound(g);
    expect(ev.filter((e) => e.type === 'income' && e.tower === id)).toEqual([expect.objectContaining({ amount: 200 })]);
  });

  it('Potent Brews: Trank-Dauer +25 %', () => {
    const dur = (mods: object): number => {
      const g = newGame({ mods: { startCash: 100000, ...mods } });
      const id = place(g, 'alchemist', 60, 122);
      buy(g, id, [3, 0, 0]);
      const r = place(g, 'ranger', 90, 122);
      g.sandbox.spawn('red', 100000);
      const ev = run(g, 800);
      const b = ev.find((e) => e.type === 'brew' && (e as { target?: number }).target === r) as { ticks?: number } | undefined;
      return b?.ticks ?? 0;
    };
    const a = dur({});
    const b = dur({ brewDurBp: 2500 });
    expect(a).toBeGreaterThan(0);
    expect(b).toBe(Math.floor(a * 1.25));
  });
});
