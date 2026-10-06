import { describe, expect, it } from 'vitest';
import { BOTS, getBot, runMatch } from '../src/bots/index.js';
import { createSim } from '../src/index.js';

const base = { stage: 'standard20', difficulty: 'normal' as const };

describe('Bots', () => {
  for (const name of Object.keys(BOTS)) {
    it(`${name}: spielt standard20 normal solo zu Ende und ist deterministisch`, () => {
      const a = runMatch({ ...base, players: 1, seed: 7, bots: [name] });
      const b = runMatch({ ...base, players: 1, seed: 7, bots: [name] });
      expect(['win', 'loss']).toContain(a.result);
      expect(a.endWave).toBeGreaterThan(0);
      expect(a.hash).toBe(b.hash);
      expect(a).toEqual(b);
      expect(a.waves.length).toBe(a.endWave + 1);
      const spent = a.waves.reduce((s, w) => s + w.spentPlace[0] + w.spentUpgrade[0], 0);
      expect(spent).toBeGreaterThan(0);
    });
  }

  it('unterschiedliche Seeds streuen', () => {
    const hashes = new Set([1, 2, 3, 4].map((seed) => runMatch({ ...base, players: 1, seed, bots: ['greedy'] }).hash));
    expect(hashes.size).toBeGreaterThan(1);
  });

  it('getBot: unbekannter Name wirft', () => {
    expect(() => getBot('gibtsnicht')).toThrow();
  });

  for (const players of [2, 4]) {
    it(`coop mit ${players} Spielern läuft`, () => {
      const r = runMatch({ ...base, players, seed: 3, bots: ['coop'] });
      expect(['win', 'loss']).toContain(r.result);
      expect(r.finalCoins.length).toBe(players);
      const owners = new Set(r.finalUnits.map((u) => u.owner));
      expect(owners.size).toBeGreaterThan(1);
      const donated = r.waves.reduce((s, w) => s + w.income.donate.reduce((a, b) => a + b, 0), 0);
      expect(donated).toBeGreaterThanOrEqual(0);
    });
  }

  it('Münzen-Bilanz: Start + Einkommen - Ausgaben - Spenden = Endmünzen', () => {
    const r = runMatch({ ...base, players: 2, seed: 5, bots: ['coop'] });
    for (let p = 0; p < 2; p++) {
      let coins = 1000;
      for (const w of r.waves) {
        const inc = w.income.kill[p] + w.income.wave[p] + w.income.farm[p] + w.income.donate[p] + w.income.sell[p];
        coins += inc - w.spentPlace[p] - w.spentUpgrade[p] - w.donated[p];
      }
      expect(coins).toBe(r.finalCoins[p]);
    }
  });

  it('greedy schlägt „nichts tun“ deutlich', () => {
    const idle = createSim({ ...base, players: 1, seed: 1 });
    while (!idle.isOver()) idle.runWave();
    const idleWave = idle.state.wave;
    const greedy = runMatch({ ...base, players: 1, seed: 1, bots: ['greedy'] });
    expect(idle.result()).toBe('loss');
    expect(greedy.endWave).toBeGreaterThanOrEqual(idleWave + 8);
    expect(greedy.result).toBe('win');
  });
});
