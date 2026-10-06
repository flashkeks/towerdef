import { describe, expect, it } from 'vitest';
import { BOTS, getBot, runMatch } from '../src/bots/index.js';
import { createSim } from '../src/index.js';
import { plainData } from './helpers.js';
import { seedRng } from '../src/prng.js';

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
    // Runde 4 P1: Normal ist kalibriert (greedy gewinnt nicht mehr jeden Seed), der Gewinn gilt dem stärksten Bot (upgrade, ~95 %)
    const wins = [1, 2, 3].filter((seed) => runMatch({ ...base, players: 1, seed, bots: ['upgrade'] }).result === 'win').length;
    expect(wins).toBeGreaterThanOrEqual(1);
  });

  it('aoe: AoE-Kern plus Titan (Plan ab Wave 5), kein Striker (Runde 4 P1)', () => {
    const sim = createSim({ ...base, players: 1, seed: 7 });
    const bot = getBot('aoe')();
    const rng = seedRng(11);
    while (!sim.isOver() && sim.state.wave < 9) {
      bot.decide({ sim, playerId: 0, rng });
      sim.step(20);
    }
    const types = new Set(sim.state.units.map((u) => u.defId));
    expect(types.has('titan')).toBe(true);
    expect(types.has('striker')).toBe(false);
    expect([...types].filter((t) => ['blaster', 'lancer', 'frost'].includes(t)).length).toBeGreaterThanOrEqual(2);
  });

  it('Early-Units: ein volles Team (6 Typen) gibt Striker ab, wenn ein Legendary-Typ fehlt (Runde 4 P1)', () => {
    const sim = createSim({ ...base, players: 1, seed: 3, data: { ...plainData(), economy: { ...plainData().economy, startCoins: 6000 } } });
    // Team mit 6 Typen: striker, blaster, banner, lancer, frost, gunner
    const slots = sim.slots();
    const ground = slots.filter((x) => x.kind === 'ground' && x.size === 1).map((x) => x.id);
    const hill = slots.filter((x) => x.kind === 'hill').map((x) => x.id);
    for (const [unitId, slot] of [['striker', ground[0]], ['blaster', ground[1]], ['banner', ground[2]], ['lancer', ground[3]], ['frost', ground[4]], ['gunner', hill[0]]] as const) {
      expect(sim.apply(0, { type: 'place', unitId, slot }).ok).toBe(true);
    }
    while (sim.state.wave < 8) sim.runWave();
    // Titan (Mythic) fehlt; Münzen + Striker-Erlös reichen für ihn -> Verkaufsregel greift
    sim.state.players[0].coins = 1500;
    const bot = getBot('greedy')();
    const rng = seedRng(12);
    bot.decide({ sim, playerId: 0, rng });
    expect(sim.state.units.some((u) => u.defId === 'striker')).toBe(false);
  });
});
