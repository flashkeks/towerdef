/**
 * Runde 5 / P3: Bots und Boss-Antworten. Verbotene Units existieren für den Bot nicht (Leave-one-out), der Boss-Plan kennt zwei
 * Strategien (`both`: Nuke- und Stun-Unit wie P6, `oneOf`: eine Antwort genügt), die Nuke bricht zerstörbare Wirkungen, wenn kein Stun bereit ist,
 * und der Titan ist keine Pflicht mehr (Siegquote ohne Titan bleibt nahe der mit Titan).
 */
import { describe, expect, it } from 'vitest';
import { getBot, runMatch } from '../src/bots/index.js';
import { botTuning, bossStatus } from '../src/bots/util.js';
import { createSim } from '../src/index.js';
import { seedRng } from '../src/prng.js';
import { createEnemy } from '../src/systems/spawn.js';
import { compile } from '../src/data/compile.js';
import { mutable, data } from './helpers.js';

const base = { stage: 'standard20', difficulty: 'normal' as const, players: 1 };

/** Bis kurz vor die gewünschte Wave spielen; liefert die Typen im Team. */
function teamAt(bot: string, wave: number, seed = 2): string[] {
  const sim = createSim({ ...base, seed });
  const b = getBot(bot)();
  const rng = seedRng(3);
  while (!sim.isOver() && sim.state.wave < wave) {
    b.decide({ sim, playerId: 0, rng });
    sim.step(20);
  }
  return [...new Set(sim.state.units.map((u) => u.defId))].sort();
}

describe('Verbotene Units (botTuning.banned)', () => {
  it('ein verbotener Titan wird nie gekauft, auch nicht vom Boss-Plan oder dem Titan-Plan des aoe-Bots', () => {
    botTuning.banned = ['titan'];
    try {
      for (const name of ['aoe', 'wide', 'greedy']) expect(teamAt(name, 11), name).not.toContain('titan');
    } finally {
      botTuning.banned = [];
    }
  }, 60_000);
  it('ein verbotener Titan zählt auch nicht als "fehlender Typ" der Striker-Rotation (Striker bleibt, wenn sonst nichts fehlt)', () => {
    botTuning.banned = ['titan'];
    try {
      expect(teamAt('wide', 12)).toContain('striker');
    } finally {
      botTuning.banned = [];
    }
  }, 60_000);
});

describe('Boss-Plan: eine Antwort genügt (bossAnswers = oneOf)', () => {
  it('kauft die Stun-Unit (Frost), aber keinen Titan, solange ihm der Plan keinen vorgibt', () => {
    botTuning.bossAnswers = 'oneOf';
    try {
      const t = teamAt('wide', 11);
      expect(t).toContain('frost');
      expect(t).not.toContain('titan');
    } finally {
      botTuning.bossAnswers = 'both';
    }
  }, 60_000);
  it('ist die Stun-Unit verboten, kommt der Titan als zweite Antwort', () => {
    botTuning.bossAnswers = 'oneOf';
    botTuning.banned = ['frost'];
    try {
      expect(teamAt('wide', 11)).toContain('titan');
    } finally {
      botTuning.bossAnswers = 'both';
      botTuning.banned = [];
    }
  }, 60_000);
});

describe('Boss-Status: zerstörbare Wirkung', () => {
  it('bossStatus nennt den fehlenden Schaden bis zum Bruch, 0 ohne Telegraph', () => {
    const sim = createSim({ ...base, seed: 3 });
    const ctx = compile(data, data.stages['standard20'], 'normal', 1);
    const st = mutable(sim);
    const boss = createEnemy(ctx, st.nextId++, 'boss', 20, [], 0, 3000, 0);
    boss.stunTicks = 100000;
    st.enemies.push(boss);
    expect(bossStatus(sim, st.enemies)?.stagger).toBe(0);
    for (let i = 0; i < 800 && !((boss.bossRun?.tele?.need ?? 0) > 0); i++) sim.step(1); // erster Telegraph ist der Ruf (nicht zerstörbar), danach die Heilung
    const tele = boss.bossRun?.tele;
    if (!tele) throw new Error('kein Telegraph');
    const s = bossStatus(sim, st.enemies);
    expect(tele.need).toBeGreaterThan(0);
    expect(s?.stagger).toBe(tele.need);
    tele.dmg = tele.need - 5;
    expect(bossStatus(sim, st.enemies)?.stagger).toBe(5);
  });
});

describe('Kein Pflicht-Titan', () => {
  const rate = (ban: string[], n: number): number => {
    botTuning.banned = ban;
    botTuning.profile = 'normal';
    try {
      let w = 0;
      for (let seed = 1; seed <= n; seed++) if (runMatch({ ...base, seed, bots: ['wide'] }).result === 'win') w++;
      return (w / n) * 100;
    } finally {
      botTuning.banned = [];
      botTuning.profile = null;
    }
  };
  it('Normal, wide@normal, 20 Seeds: ohne Titan höchstens 40 Punkte weniger als mit (vorher −87)', () => {
    const withTitan = rate([], 20);
    const without = rate(['titan'], 20);
    expect(withTitan).toBeGreaterThanOrEqual(70);
    expect(withTitan - without).toBeLessThanOrEqual(40);
  }, 120_000);
});
