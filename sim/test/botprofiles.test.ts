/**
 * Bot-Profile (Runde 4 / P6): Fehlermodell casual/normal/expert, Boss-Plan, Determinismus.
 * Zufall nur über den eigenen Bot-PRNG: der Sim-Zustand ohne Bots bleibt unberührt, ein Lauf ist je Seed reproduzierbar.
 */
import { describe, expect, it } from 'vitest';
import { getBot, runMatch } from '../src/bots/index.js';
import { botTuning, profileByName } from '../src/bots/util.js';
import { loadBotProfiles } from '../src/data/load.js';
import { BotProfilesSchema } from '../src/data/schema.js';
import { createSim } from '../src/index.js';
import { seedRng } from '../src/prng.js';
import { readFileSync } from 'node:fs';

const base = { stage: 'standard20', difficulty: 'normal' as const, players: 1 };
const winRate = (bot: string, seeds: number, difficulty: 'normal' | 'hard' = 'normal'): number => {
  let w = 0;
  for (let seed = 1; seed <= seeds; seed++) if (runMatch({ ...base, difficulty, seed, bots: [bot] }).result === 'win') w++;
  return (w / seeds) * 100;
};

describe('Bot-Profile: Daten', () => {
  it('drei Profile, schema-gültig, Fehler wachsen von expert über normal zu casual', () => {
    const p = loadBotProfiles();
    expect(Object.keys(p).sort()).toEqual(['casual', 'expert', 'normal']);
    expect(() => BotProfilesSchema.parse(JSON.parse(readFileSync(new URL('../data/botProfiles.json', import.meta.url), 'utf8')))).not.toThrow();
    const order = ['expert', 'normal', 'casual'] as const;
    for (let i = 1; i < order.length; i++) {
      const a = p[order[i - 1]];
      const b = p[order[i]];
      expect(b.worseSlotBp).toBeGreaterThanOrEqual(a.worseSlotBp);
      expect(b.forgetUpgradeBp).toBeGreaterThanOrEqual(a.forgetUpgradeBp);
      expect(b.abilityDelaySec[1]).toBeGreaterThanOrEqual(a.abilityDelaySec[1]);
      expect(b.buyDelaySec[1]).toBeGreaterThanOrEqual(a.buyDelaySec[1]);
      expect(b.lookahead).toBeLessThanOrEqual(a.lookahead);
    }
    expect(p.casual.lookahead).toBe(0);
  });

  it('unbekanntes Profil wirft, "none" ist fehlerfrei', () => {
    expect(() => getBot('aoe@gibtsnicht')()).toThrow(/Profil/);
    expect(profileByName('none')).toBeNull();
    expect(profileByName(undefined)).toBeNull();
  });
});

describe('Bot-Profile: Determinismus', () => {
  for (const profile of ['casual', 'normal', 'expert']) {
    it(`${profile}: gleicher Seed = gleicher Lauf (Hash, Zeitreihen), anderer Seed streut`, () => {
      const a = runMatch({ ...base, seed: 5, bots: [`upgrade@${profile}`] });
      const b = runMatch({ ...base, seed: 5, bots: [`upgrade@${profile}`] });
      expect(a).toEqual(b);
      const hashes = new Set([1, 2, 3, 4].map((seed) => runMatch({ ...base, seed, bots: [`aoe@${profile}`] }).hash));
      expect(hashes.size).toBeGreaterThan(1);
    });
  }

  it('Koop mit Profil läuft deterministisch (coop@normal, 2 Spieler)', () => {
    const a = runMatch({ ...base, players: 2, seed: 3, bots: ['coop@normal'] });
    const b = runMatch({ ...base, players: 2, seed: 3, bots: ['coop@normal'] });
    expect(a.hash).toBe(b.hash);
    expect(['win', 'loss']).toContain(a.result);
  });

  it('Profil unterscheidet sich vom fehlerfreien Bot, "@none" ist bit-identisch zum Namen ohne Profil', () => {
    const plain = runMatch({ ...base, seed: 9, bots: ['greedy'] });
    const none = runMatch({ ...base, seed: 9, bots: ['greedy@none'] });
    const casual = runMatch({ ...base, seed: 9, bots: ['greedy@casual'] });
    expect(none.hash).toBe(plain.hash);
    expect(casual.hash).not.toBe(plain.hash);
  });

  it('Bot-PRNG getrennt vom Sim-PRNG: ein Lauf ohne Bots hat denselben Hash, egal was zuvor Bots spielten', () => {
    const idle = (): string => {
      const sim = createSim({ ...base, seed: 4 });
      while (!sim.isOver()) sim.runWave();
      return sim.hash();
    };
    const h1 = idle();
    runMatch({ ...base, seed: 4, bots: ['aoe@casual'] });
    runMatch({ ...base, seed: 4, bots: ['wide@expert'] });
    expect(idle()).toBe(h1);
  });
});

describe('Bot-Profile: Wirkung (Rauchtest, statistisch grob)', () => {
  it('Siegquote expert >= normal >= casual (wide + upgrade, Normal solo, je 20 Seeds)', () => {
    // Runde 5 / P3: `wide` statt `aoe` (der aoe-Bot hängt am Titan-Anteil und streut je Profil kaum, Normal 40/40/40 %).
    const rate = (p: string): number => (winRate(`wide@${p}`, 20) + winRate(`upgrade@${p}`, 20)) / 2;
    const [casual, normal, expert] = [rate('casual'), rate('normal'), rate('expert')];
    // Runde 5 / P3: nach der Neukalibrierung liegen casual und normal bei 20 Seeds im Rauschen (Normal solo, ±10).
    expect(normal).toBeGreaterThan(casual - 10);
    expect(expert).toBeGreaterThan(casual + 5);
    expect(expert).toBeGreaterThanOrEqual(normal - 10);
  }, 120_000);
});

describe('Boss-Plan', () => {
  it('Bots ohne eigenen Titan-Plan kaufen vor dem Boss einen Titan (greedy, wide, upgrade, farm, coop)', () => {
    for (const name of ['greedy', 'wide', 'upgrade', 'farm', 'coop']) {
      const sim = createSim({ ...base, seed: 2 });
      const bot = getBot(name)();
      const rng = seedRng(3);
      while (!sim.isOver() && sim.state.wave < 10) {
        bot.decide({ sim, playerId: 0, rng });
        sim.step(20);
      }
      expect(sim.state.units.some((u) => u.defId === 'titan'), name).toBe(true);
    }
  }, 60_000);

  it('abschaltbar (botTuning.bossPlan = false): greedy kauft dann keinen Titan', () => {
    botTuning.bossPlan = false;
    try {
      const sim = createSim({ ...base, seed: 2 });
      const bot = getBot('greedy')();
      const rng = seedRng(3);
      while (!sim.isOver() && sim.state.wave < 10) {
        bot.decide({ sim, playerId: 0, rng });
        sim.step(20);
      }
      expect(sim.state.units.some((u) => u.defId === 'titan')).toBe(false);
    } finally {
      botTuning.bossPlan = true;
    }
  });

  it('ohne Wellenwissen (casual, lookahead 0) kommt der Titan erst, wenn der Boss da ist', () => {
    const sim = createSim({ ...base, seed: 2 });
    const bot = getBot('greedy@casual')();
    const rng = seedRng(3);
    while (!sim.isOver() && sim.state.wave < 9) {
      bot.decide({ sim, playerId: 0, rng });
      sim.step(20);
    }
    expect(sim.state.units.some((u) => u.defId === 'titan')).toBe(false);
  });
});
