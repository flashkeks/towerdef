import { describe, expect, it } from 'vitest';
import { RiskCardSchema } from '../src/data/schema.js';
import { previewWave, type SimEvent } from '../src/index.js';
import { cardLeakCost } from '../src/systems/cards.js';
import { data, ctxFor, createSim, mutable, stage } from './helpers.js';

/** Stage ohne Verteidigung bis zum Ende laufen lassen; Spawn-Ereignisse samt Gegnerzustand je Wave sammeln. */
function collect(choose: Record<number, string> = {}, difficulty: 'normal' | 'hard' = 'normal') {
  const sim = createSim({ stage: 'standard20', difficulty, players: 1, seed: 5, godMode: true });
  const st = mutable(sim);
  const previews = new Map<number, ReturnType<typeof previewWave>>();
  const seen: { wave: number; type: string; maxHp: number; shield: number; armor: number; regen: boolean; summon: boolean; card: string | null; bounty: number; speed: number }[] = [];
  const events: SimEvent[] = [];
  let last = -1;
  while (!sim.isOver()) {
    const next = st.phase === 'prep' ? 1 : st.wave + 1;
    if (next !== last && next <= 20) {
      last = next;
      const c = choose[next];
      if (c) expect(sim.apply(0, { type: 'chooseCard', cardId: c }).ok).toBe(true);
      previews.set(next, sim.previewWave(next));
    }
    sim.step(1);
    for (const e of sim.drainEvents()) {
      events.push(e);
      if (e.type === 'spawn') {
        const en = st.enemies.find((x) => x.id === e.enemyId);
        if (en) seen.push({ wave: e.wave, type: e.enemy, maxHp: en.maxHp, shield: en.shield, armor: en.armor, regen: en.regen, summon: e.summon === true, card: en.card, bounty: en.bounty, speed: en.speedMicro });
      }
    }
  }
  return { sim, previews, seen, events };
}

describe('Risikokarten: Katalog', () => {
  it('6-10 Karten, Schema gültig, IDs eindeutig, Tier 1-3', () => {
    const cards = data.cards!.cards;
    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(cards.length).toBeLessThanOrEqual(10);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const c of cards) expect(RiskCardSchema.safeParse(c).success).toBe(true);
    expect(new Set(cards.map((c) => c.tier))).toEqual(new Set([1, 2, 3]));
    expect(createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 }).cards().map((c) => c.id)).toEqual(cards.map((c) => c.id));
  });
});

describe('Risikokarten: Befehl', () => {
  const mk = () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    return { sim, st: mutable(sim) };
  };
  it('Wahl, Rücknahme, unbekannte Karte, Boss-Wave gesperrt', () => {
    const { sim, st } = mk();
    expect(sim.apply(0, { type: 'chooseCard', cardId: 'nope' })).toEqual({ ok: false, reason: 'unknown-card' });
    expect(sim.apply(0, { type: 'chooseCard', cardId: 'swift' }).ok).toBe(true);
    expect(st.nextCard).toBe('swift');
    expect(sim.previewWave(1)?.card).toBe('swift');
    expect(sim.apply(0, { type: 'chooseCard', cardId: null }).ok).toBe(true);
    expect(st.nextCard).toBeNull();
    // Wave 9 läuft -> nächste Wave ist der Boss (10)
    st.phase = 'wave';
    st.wave = 9;
    expect(sim.apply(0, { type: 'chooseCard', cardId: 'swift' })).toEqual({ ok: false, reason: 'boss-wave' });
    expect(sim.previewWave(10)?.cardAllowed).toBe(false);
    st.wave = 20;
    expect(sim.apply(0, { type: 'chooseCard', cardId: 'swift' })).toEqual({ ok: false, reason: 'no-next-wave' });
  });
  it('die Karte wird beim Wave-Start verbraucht und gilt nur für diese Wave', () => {
    const { sim, st } = mk();
    sim.apply(0, { type: 'chooseCard', cardId: 'thick-hide' });
    sim.runWave(); // Wave 1, danach läuft Wave 2
    expect(st.nextCard).toBeNull();
    expect(st.enemies.filter((e) => e.wave === 1).every((e) => e.card === 'thick-hide')).toBe(true);
    expect(st.enemies.filter((e) => e.wave === 2).every((e) => e.card === null)).toBe(true);
  });
});

describe('Risikokarten: Wirkung', () => {
  const base = collect();
  const baseW = (n: number) => base.seen.filter((s) => s.wave === n && !s.summon);
  const withCard = (id: string, n = 3) => collect({ [n]: id }).seen.filter((s) => s.wave === n && !s.summon);
  const hpOf = (rows: { maxHp: number }[]) => rows.reduce((a, r) => a + r.maxHp, 0);
  it('thick-hide: +30 % HP, +50 % Bounty, Anzahl gleich', () => {
    const a = baseW(3);
    const b = withCard('thick-hide');
    expect(b.length).toBe(a.length);
    const c = data.cards!.cards.find((x) => x.id === 'thick-hide')!;
    b.forEach((r, i) => {
      expect(r.maxHp).toBe(Math.floor((a[i].maxHp * c.hpBp) / 10000));
      expect(r.bounty).toBe(Math.floor((a[i].bounty * c.bountyBp) / 10000));
    });
  });
  it('swift: Geschwindigkeit x1,25; swarm: +50 % Anzahl; warded: Schild 2; ironclad: Rüstung; regrowth: Regen', () => {
    const a = baseW(3);
    const sw = withCard('swift');
    sw.forEach((r, i) => expect(r.speed).toBe(Math.floor((a[i].speed * 12500) / 10000)));
    const sm = withCard('swarm');
    expect(sm.length).toBe(Math.ceil(a.length * 1.5));
    expect(withCard('warded').every((r) => r.shield === 2)).toBe(true);
    expect(withCard('ironclad').every((r, i) => r.armor === a[i].armor + data.modifiers.armored.armorBonus)).toBe(true);
    expect(withCard('regrowth').every((r) => r.regen)).toBe(true);
    expect(hpOf(sm)).toBeGreaterThan(hpOf(a));
  });
  it('Karte ändert vorhandene Modifier derselben Art nicht (Wave 13 hat shield:3)', () => {
    const a = baseW(13);
    const b = collect({ 13: 'warded' }).seen.filter((s) => s.wave === 13);
    expect(a.some((r) => r.shield === 3)).toBe(true);
    expect(b.filter((r) => r.type === 'grunt').every((r) => r.shield === 3)).toBe(true);
    expect(b.filter((r) => r.type === 'runner').every((r) => r.shield === 2)).toBe(true);
  });
  it('blood-toll: Leaks kosten doppelt (mindestens 1), Boss-Sofortverlust bleibt', () => {
    const ctx = ctxFor();
    expect(cardLeakCost(ctx, 3, 'blood-toll')).toBe(6);
    expect(cardLeakCost(ctx, 3, null)).toBe(3);
    expect(cardLeakCost(ctx, 1, 'thick-hide')).toBe(1);
    const lives = (card: string | null): number => {
      const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 5, data });
      if (card) sim.apply(0, { type: 'chooseCard', cardId: card });
      sim.step(20 * 45 + 20 * 40); // Wave 1 ohne Verteidigung bis nach den Leaks
      return mutable(sim).stats.leakDamage;
    };
    expect(lives('blood-toll')).toBe(lives(null) * 2);
  });
  it('Elite und Boss bleiben bei Anzahl/Modifiern unberührt (Wave 5: Elite + Grunts)', () => {
    const a = baseW(5);
    const b = withCard('swarm', 5);
    expect(b.filter((r) => r.type === 'elite').length).toBe(a.filter((r) => r.type === 'elite').length);
    expect(withCard('ironclad', 5).filter((r) => r.type === 'elite').every((r) => r.armor === a.find((x) => x.type === 'elite')!.armor)).toBe(true);
  });
});

describe('Wellenvorschau', () => {
  const run = collect({ 4: 'swarm', 7: 'ironclad', 12: 'gold-rush' });
  it('previewWave(n) stimmt mit den tatsächlich gespawnten Waves überein (Typen, Anzahl, Modifier, HP, Boss/Elite)', () => {
    for (let n = 1; n <= 20; n++) {
      const p = run.previews.get(n);
      expect(p, `Vorschau Wave ${n}`).not.toBeNull();
      if (!p) continue;
      const real = run.seen.filter((s) => s.wave === n && !s.summon && s.type !== 'splitter_child');
      expect(real.length).toBe(p.enemyCount);
      for (const g of p.groups) {
        const rows = real.filter((r) => r.type === g.type);
        expect(rows.length, `Wave ${n} ${g.type}`).toBe(g.count);
        expect(rows.every((r) => r.maxHp === g.hpCenti)).toBe(true);
        const sh = g.modifiers.find((m) => m.startsWith('shield:'));
        expect(rows.every((r) => r.shield === (sh ? Number(sh.slice(7)) : 0))).toBe(true);
        expect(rows.every((r) => r.regen === g.modifiers.includes('regen'))).toBe(true);
      }
      expect(p.boss).toBe(n === 10 || n === 20);
      expect(p.elite).toBe([5, 15, 19, 20].includes(n));
      expect(p.bossKit?.id ?? null).toBe(n === 10 ? 'warden' : n === 20 ? 'colossus' : null);
    }
    expect(run.previews.get(4)?.card).toBe('swarm');
    expect(run.previews.get(3)?.card).toBeNull();
  });
  it('Vorschau ohne Karte entspricht den Stage-Daten; Pool-HP inkl. Splitter-Kinder; ändert den Zustand nicht', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    const h = sim.hash();
    const p15 = sim.previewWave(15)!;
    expect(sim.hash()).toBe(h);
    expect(p15.groups.map((g) => [g.type, g.count])).toEqual(stage.waves[14].groups.map((g) => [g.type, g.count]));
    const sp = p15.groups.find((g) => g.type === 'splitter')!;
    expect(sp.childType).toBe('splitter_child');
    expect(sp.childCount).toBe(2);
    expect(sim.previewWave(0)).toBeNull();
    expect(sim.previewWave(21)).toBeNull();
    expect(previewWave(sim, 5)).toEqual(sim.previewWave(5));
    // hypothetische Karte: stärkere Pool-HP, ohne den Zustand zu berühren
    expect(sim.previewWave(5, 'gold-rush')!.poolHpCenti).toBeGreaterThan(sim.previewWave(5)!.poolHpCenti);
    expect(sim.hash()).toBe(h);
  });
  it('Determinismus: gleiche Seeds und Kartenwahl, gleicher Hash', () => {
    const a = collect({ 4: 'swarm', 7: 'ironclad' }).sim.hash();
    const b = collect({ 4: 'swarm', 7: 'ironclad' }).sim.hash();
    expect(a).toBe(b);
    expect(a).not.toBe(collect().sim.hash());
  });
});
