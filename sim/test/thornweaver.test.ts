/** Runde 14: Thornweaver — Dornenfächer, Kettenblitz, Wirbelwind, Ranken, Baumwand, Zone, Grove, Avatar. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, type EnemyState, type Game, type SimEvent, type Tiers } from '../src/index';
import { buy, clearRound, newGame, place, run, statsOf } from './helpers';

type Of<T extends SimEvent['type']> = Extract<SimEvent, { type: T }>;
const of = <T extends SimEvent['type']>(ev: SimEvent[], t: T): Of<T>[] => ev.filter((e): e is Of<T> => e.type === t);
const E = (g: Game, id: number): EnemyState => g.state.enemies.find((e) => e.id === id)!;
/** Thornweaver neben dem ersten Wegstück (Mitte x=60), 30 px vom Weg, fertig ausgebaut. */
function weaver(g: Game, tiers: Tiers = [0, 0, 0], x = 60, y = 122): number {
  const id = place(g, 'thornweaver', x, y);
  buy(g, id, tiers);
  return id;
}
/** Wartet, bis die Fähigkeit bereit ist. */
function ready(g: Game, id: string): void {
  const a = g.state.abilities.find((x) => x.id === id)!;
  g.step(a.cdTotal);
}

describe('Daten', () => {
  it('Preise, Namen und Fußabdruck laut Entwurf', () => {
    const d = DATA.towers.thornweaver;
    expect(d.price).toBe(400);
    expect(d.radius).toBe(11);
    expect(d.paths.map((p) => p.name)).toEqual(['Storm', 'Wild', 'Grove']);
    expect(d.paths.map((p) => p.tiers.map((t) => t.price))).toEqual([
      [250, 1000, 2500, 6000, 26000],
      [300, 600, 2200, 6000, 24000],
      [150, 400, 1500, 3500, 10000],
    ]);
    expect(d.paths[0].tiers.map((t) => t.name)).toEqual(['Hard Thorns', 'Heart of Thunder', 'Tempest', 'Storm Mother', 'Avatar of Wrath']);
    expect(d.paths[1].tiers.map((t) => t.name)).toEqual(['Thorn Burst', 'Vine Snare', 'Wall of Trees', 'Spirit of the Forest', 'World Tree']);
    expect(d.paths[2].tiers.map((t) => t.name)).toEqual(['Druidic Reach', 'Herbal Lore', "Jungle's Bounty", 'Spring Blessing', 'Grove Guardian']);
  });

  it('Basis: 5 Dornen im Fächer, Schaden 1, Pierce 1, Intervall 1,1 s, Reichweite 70 px, 450 px/s', () => {
    const s = statsOf('thornweaver', [0, 0, 0]);
    expect(s).toMatchObject({ pk: 'thorn', dtype: 'sharp', dmg: 1, pierce: 1, interval: 66000, range: 70000, speed: 450, count: 5 });
  });

  it('Pfad A: Pierce, Blitz-Ziele/Schaden, Wirbelwind, Avatar', () => {
    const rows = [0, 1, 2, 3, 4, 5].map((n) => statsOf('thornweaver', [n, 0, 0]));
    expect(rows.map((s) => s.pierce)).toEqual([1, 2, 2, 2, 2, 2]);
    expect(rows.map((s) => s.zapN)).toEqual([0, 0, 4, 8, 15, 15]);
    expect(rows.map((s) => s.zapDmg)).toEqual([0, 0, 2, 3, 6, 6]);
    expect(rows[2].zapInterval).toBe(138); // 2,3 s
    expect(rows.map((s) => s.whirlEvery)).toEqual([0, 0, 0, 240, 240, 240]);
    expect(rows[3].whirlPx).toBe(40000);
    expect(rows[5]).toMatchObject({ avatarPer: 25, avatarMax: 10 });
  });

  it('Pfad B und C: Burst, Ranke, Wand, Zone, Gold; Reichweite, Camo, Bounty, Aura, Magic', () => {
    const b = [0, 1, 2, 3, 4, 5].map((n) => statsOf('thornweaver', [0, n, 0]));
    expect(b.map((s) => s.count)).toEqual([5, 8, 8, 8, 8, 8]);
    expect(b[2]).toMatchObject({ snareEvery: 180, snareTicks: 90 });
    expect(b[3]).toMatchObject({ wallRbe: 150, wallCd: 2700 });
    expect(b[4]).toMatchObject({ zoneBp: 10000, zoneDmg: 1 });
    expect(b[5]).toMatchObject({ zoneBp: 20000, zoneDmg: 5, roundGold: 100 });
    const c = [0, 1, 2, 3, 4, 5].map((n) => statsOf('thornweaver', [0, 0, n]));
    expect(c[1].range).toBe(80500);
    expect(c[2].camo).toBe(1);
    expect(c[3]).toMatchObject({ bountyGold: 150, roundLives: 2 });
    expect(c[4].groveSpeedBp).toBe(1500);
    expect(c[5]).toMatchObject({ dtype: 'magic', dmg: 4 });
  });
});

describe('Dornen', () => {
  it('Fächer: 5 Dornen (Art thorn), 8 rundum mit Thorn Burst', () => {
    const g = newGame();
    weaver(g);
    g.sandbox.spawn('leviathan', 100000);
    const ev = run(g, 60, () => g.state.projectiles.length > 0);
    const fire = of(ev, 'fire')[0];
    expect(fire.kind).toBe('thorn');
    const thorns = g.state.projectiles.filter((p) => p.kind === 'thorn');
    expect(thorns).toHaveLength(5);
    const h = newGame();
    weaver(h, [0, 1, 0]);
    h.sandbox.spawn('leviathan', 100000);
    run(h, 60, () => h.state.projectiles.length > 0);
    const ring = h.state.projectiles.filter((p) => p.kind === 'thorn');
    expect(ring).toHaveLength(8);
    // rundum: Richtungen nach links und rechts, alle verschieden
    expect(new Set(ring.map((p) => `${p.vx},${p.vy}`)).size).toBe(8);
    expect(ring.filter((p) => p.vx < 0).length).toBeGreaterThanOrEqual(3);
    expect(ring.filter((p) => p.vx > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('Thorn-Treffer: Schaden 1; Ironshell prallt ab, mit Grove Guardian (magic, +3) wird sie geknackt', () => {
    const a = newGame();
    weaver(a);
    const iron = a.sandbox.spawn('ironshell', 90000);
    const evA = run(a, 120);
    expect(of(evA, 'blocked').some((b) => b.enemy === iron)).toBe(true);
    const b = newGame();
    weaver(b, [0, 0, 5]);
    const iron2 = b.sandbox.spawn('ironshell', 90000);
    const evB = run(b, 120);
    expect(of(evB, 'hit').some((h) => h.enemy === iron2 && h.dmg === 4 && h.dtype === 'magic')).toBe(true);
  });
});

describe('Pfad A: Kettenblitz, Wirbelwind, Avatar', () => {
  it('Heart of Thunder: alle 2,3 s Kette auf 4 Ziele, Schaden 2 (energy)', () => {
    const g = newGame();
    const id = weaver(g, [2, 0, 0]);
    for (let i = 0; i < 8; i++) g.sandbox.spawn('leviathan', 80000 + i * 6000);
    const chains = of(run(g, 400), 'chain').filter((c) => c.tower === id);
    expect(chains.length).toBeGreaterThanOrEqual(2);
    expect(chains[0].dmg).toBe(2);
    expect(chains[0].points).toHaveLength(5); // Ursprung + 4 Ziele
    expect(chains[1].tick - chains[0].tick).toBe(138);
  });

  it('Tempest: Kette auf 8, Storm Mother auf 15 Ziele', () => {
    const run8 = (tiers: Tiers): number => {
      const g = newGame();
      const id = weaver(g, tiers);
      for (let i = 0; i < 20; i++) g.sandbox.spawn('leviathan', 70000 + i * 3000);
      const c = of(run(g, 20), 'chain').find((x) => x.tower === id);
      return c ? c.points.length - 1 : 0;
    };
    expect(run8([3, 0, 0])).toBe(8);
    expect(run8([4, 0, 0])).toBe(15);
  });

  it('Wirbelwind: trifft Nicht-Boss-Gegner, nie den Boss; Takt 4 s', () => {
    const g = newGame();
    const id = weaver(g, [3, 0, 0]);
    const boss = g.sandbox.spawn('leviathan', 105000);
    const ev: SimEvent[] = [];
    // der Blitz tötet Ironshells sofort: bei jedem Wurf ein frischer Gegner
    for (let i = 0; i < 600; i++) {
      if (!g.state.enemies.some((e) => e.type === 'ironshell')) g.sandbox.spawn('ironshell', 100000);
      g.step();
      ev.push(...g.drainEvents());
    }
    const w = of(ev, 'whirlwind').filter((x) => x.tower === id);
    expect(w.length).toBeGreaterThanOrEqual(2);
    expect(w[0].px).toBe(40000);
    expect(w[0].enemies.length).toBeGreaterThan(0);
    expect(w.every((x) => !x.enemies.includes(boss))).toBe(true);
    expect(w[1].tick - w[0].tick).toBe(240);
  });

  it('Wirbelwind setzt den Fortschritt um 40 px zurück (Boss bleibt)', () => {
    const g = newGame();
    weaver(g, [3, 0, 0]);
    const brute = g.sandbox.spawn('brute', 100000); // überlebt den ersten Blitz (10 HP)
    const boss = g.sandbox.spawn('leviathan', 105000);
    g.step();
    const w = of(g.drainEvents(), 'whirlwind');
    expect(w).toHaveLength(1);
    expect(w[0].enemies).toEqual([brute]);
    // ein Tick Marsch (< 1 px) gegen 40 px Rückstoß
    expect(E(g, brute).progress).toBeGreaterThanOrEqual(60000);
    expect(E(g, brute).progress).toBeLessThanOrEqual(61000);
    expect(E(g, boss).progress).toBeGreaterThanOrEqual(105000);
  });

  it('Avatar of Wrath: +1 Schaden je 25 Gegner, höchstens +10', () => {
    const dmgWith = (n: number): number => {
      const g = newGame();
      weaver(g, [5, 0, 0]);
      g.sandbox.spawn('leviathan', 90000);
      for (let i = 0; i < n; i++) g.sandbox.spawn('leviathan', 400000 + i * 1000);
      const h = of(run(g, 60), 'hit').find((x) => x.dtype === 'sharp');
      return h?.dmg ?? 0;
    };
    expect(dmgWith(0)).toBe(1);
    expect(dmgWith(49)).toBe(1 + 2); // 50 Gegner
    expect(dmgWith(299)).toBe(1 + 10); // 300 Gegner, gedeckelt
  });
});

describe('Pfad B: Ranke, Baumwand, Zone', () => {
  it('Vine Snare: alle 3 s hält eine Ranke einen Nicht-Boss 1,5 s fest, nie den Boss', () => {
    const g = newGame();
    const id = weaver(g, [0, 2, 0]);
    const boss = g.sandbox.spawn('leviathan', 100000);
    const ev = run(g, 200);
    expect(of(ev, 'vine')).toHaveLength(0); // Boss wird nicht festgehalten
    expect(E(g, boss).stunTicks).toBe(0);
    const b = newGame();
    const id2 = weaver(b, [0, 2, 0]);
    const brute = b.sandbox.spawn('brute', 100000);
    const evB: SimEvent[] = [];
    for (let i = 0; i < 400; i++) {
      b.step();
      evB.push(...b.drainEvents());
      const v = of(evB, 'vine');
      if (v.length === 1 && v[0].tick === b.state.tick - 1) {
        expect(E(b, brute).stunTicks).toBeGreaterThanOrEqual(89);
        expect(E(b, brute).vineTicks).toBeGreaterThanOrEqual(89);
        break;
      }
    }
    const vines = of(evB, 'vine').filter((v) => v.tower === id2);
    expect(vines.length).toBeGreaterThanOrEqual(1);
    expect(vines[0]).toMatchObject({ enemy: brute, ticks: 90 });
    expect(id).toBeGreaterThan(0);
  });

  it('Wall of Trees: Fähigkeit mit 45 s Abklingzeit, Wand am Ende der Reichweite, schluckt 150 RBE, danach weg', () => {
    const g = newGame();
    const id = weaver(g, [0, 3, 0]);
    expect(g.state.abilities.find((a) => a.id === 'wallOfTrees')).toMatchObject({ ready: false, cdTotal: 2700 });
    expect(g.apply({ type: 'ability', ability: 'wallOfTrees' })).toEqual({ ok: false, reason: 'cooldown' });
    ready(g, 'wallOfTrees');
    g.drainEvents();
    expect(g.apply({ type: 'ability', ability: 'wallOfTrees' }).ok).toBe(true);
    expect(g.state.walls).toHaveLength(1);
    const wall = g.state.walls[0];
    expect(wall.left).toBe(150);
    expect(wall.owner).toBe(id);
    const ev0 = g.drainEvents();
    expect(of(ev0, 'wall')).toHaveLength(1);
    expect(g.state.abilities.find((a) => a.id === 'wallOfTrees')!.ready).toBe(false);
    // 6 Brutes (RBE 28): die ersten fünf (140) und der sechste (Überlauf) werden geschluckt, Wand ist verbraucht
    const cash0 = g.state.cash;
    const ids: number[] = [];
    for (let i = 0; i < 7; i++) ids.push(g.sandbox.spawn('brute', wall.progress - 1500 - i * 700));
    // Gegner können nicht schneller sein als die Wand erreicht wird; Tower schießt kaum (Dornen gegen 10 HP)
    const ev = run(g, 60);
    const eaten = of(ev, 'wallEat');
    expect(eaten).toHaveLength(6);
    expect(eaten[0]).toMatchObject({ wall: wall.id, rbe: 28, left: 122, etype: 'brute' });
    expect(eaten[5].left).toBe(0);
    expect(of(ev, 'wallGone')).toEqual([expect.objectContaining({ id: wall.id, reason: 'spent' })]);
    expect(g.state.walls).toHaveLength(0);
    expect(g.state.cash).toBeGreaterThanOrEqual(cash0 + 6 * 19 * DATA.difficulties.medium.popCash);
    // sechs von sieben wurden geschluckt (Überlauf des sechsten), der Rest läuft weiter
    expect(ids.filter((i) => eaten.some((e) => e.enemy === i))).toHaveLength(6);
  });

  it('Wand: Boss läuft durch, ungenutzte Wand verschwindet nach 40 s; ohne Weg in Reichweite no-target', () => {
    const g = newGame();
    weaver(g, [0, 3, 0]);
    ready(g, 'wallOfTrees');
    g.apply({ type: 'ability', ability: 'wallOfTrees' });
    const wall = g.state.walls[0];
    g.drainEvents();
    const boss = g.sandbox.spawn('leviathan', wall.progress - 1000);
    const ev = run(g, 30);
    expect(of(ev, 'wallEat')).toHaveLength(0);
    expect(E(g, boss).progress).toBeGreaterThan(wall.progress);
    g.sandbox.hurt(boss, 100000);
    const ev2 = run(g, 2400);
    expect(of(ev2, 'wallGone').some((w) => w.reason === 'expired')).toBe(true);
    // Turm weit abseits des Wegs
    const far = newGame();
    weaver(far, [0, 3, 0], 20, 340);
    ready(far, 'wallOfTrees');
    expect(far.apply({ type: 'ability', ability: 'wallOfTrees' })).toEqual({ ok: false, reason: 'no-target' });
    expect(far.state.abilities.find((a) => a.id === 'wallOfTrees')!.ready).toBe(true);
  });

  it('Spirit of the Forest: Zone = Reichweite, 1 Schaden/s an alles darin (auch Boss)', () => {
    const g = newGame();
    const id = weaver(g, [0, 4, 0]);
    expect(g.state.towers.find((t) => t.id === id)!.zone).toBe(70000);
    const boss = g.sandbox.spawn('leviathan', 100000);
    const hp0 = E(g, boss).hp;
    const ev = run(g, 130);
    const z = of(ev, 'zone').filter((x) => x.tower === id);
    expect(z.length).toBeGreaterThanOrEqual(2);
    expect(z[0]).toMatchObject({ dmg: 1, radius: 70000 });
    expect(z[1].tick - z[0].tick).toBe(60);
    // Boss-Hülle verliert Zone-Schaden, plus ein paar Dornen
    expect(E(g, boss).hp).toBeLessThan(hp0);
  });

  it('World Tree: Zone 5/s über doppelten Radius, +100 Gold je Runde', () => {
    const g = newGame();
    const id = weaver(g, [0, 5, 0]);
    expect(g.state.towers.find((t) => t.id === id)!.zone).toBe(140000);
    g.sandbox.spawn('leviathan', 100000);
    const z = of(run(g, 70), 'zone').filter((x) => x.tower === id);
    expect(z[0]).toMatchObject({ dmg: 5, radius: 140000 });
    const c = newGame();
    const cid = weaver(c, [0, 5, 0]);
    const cash0 = c.state.cash;
    const ev = clearRound(c);
    const inc = of(ev, 'income').filter((x) => x.tower === cid);
    expect(inc).toHaveLength(1);
    expect(inc[0]).toMatchObject({ amount: 100, cash: 100, bank: 0 });
    expect(c.state.stats.groveGold).toBe(100);
    expect(c.state.cash).toBeGreaterThanOrEqual(cash0 + 100 + 101);
  });
});

describe('Pfad C: Grove', () => {
  it("Jungle's Bounty: +150 Gold und +2 Leben je Runde", () => {
    const g = newGame();
    const id = weaver(g, [0, 0, 3]);
    const lives0 = g.state.lives;
    const ev = clearRound(g);
    expect(of(ev, 'income').filter((x) => x.tower === id)).toEqual([expect.objectContaining({ amount: 150 })]);
    expect(of(ev, 'heal')).toEqual([expect.objectContaining({ tower: id, lives: 2 })]);
    expect(g.state.lives).toBe(lives0 + 2);
    expect(g.state.stats).toMatchObject({ groveGold: 150, healed: 2 });
  });

  it('Herbal Lore erkennt Camo, ohne sieht der Turm nichts', () => {
    const a = newGame();
    weaver(a);
    a.sandbox.spawn('red', 100000, true);
    expect(of(run(a, 120), 'windup')).toHaveLength(0);
    const b = newGame();
    weaver(b, [0, 0, 2]);
    b.sandbox.spawn('red', 100000, true);
    expect(of(run(b, 120), 'windup').length).toBeGreaterThan(0);
  });

  it('Spring Blessing: andere Türme im Radius +15 % Tempo, außerhalb nichts', () => {
    const g = newGame();
    weaver(g, [0, 0, 4]);
    const near = place(g, 'ranger', 60, 170);
    const far = place(g, 'ranger', 560, 40);
    g.step();
    expect(g.buffOf(near).groveSpeedBp).toBe(1500);
    expect(g.buffOf(far).groveSpeedBp).toBe(0);
    const windups = (withAura: boolean): number => {
      const h = newGame();
      if (withAura) weaver(h, [0, 0, 4]);
      const r = place(h, 'ranger', 60, 170);
      h.sandbox.spawn('leviathan', 200000).valueOf();
      h.state.enemies[0].frozenTicks = 100000; // steht im Bereich beider Türme
      return of(run(h, 900), 'windup').filter((w) => w.tower === r).length;
    };
    expect(windups(true)).toBeGreaterThan(windups(false));
  });

  it('Druidic Reach: Reichweite +15 % (80,5 px)', () => {
    const g = newGame();
    const id = weaver(g, [0, 0, 1]);
    g.step();
    expect(g.state.towers.find((t) => t.id === id)!.range).toBe(80500);
  });
});

describe('Turm-XP und Verkauf', () => {
  it('Thornweaver bekommt Turm-XP aus Geld und Pops', () => {
    const g = newGame({ towerXp: { thornweaver: 0 } });
    weaver(g, [1, 0, 0]);
    g.sandbox.spawn('red', 90000);
    const ev = run(g, 200);
    clearRound(g);
    void ev;
    expect(g.state.towerXpGained.thornweaver).toBeGreaterThan(0);
  });

  it('Verkauf zahlt 70 % der Ausgaben, Fähigkeit verschwindet', () => {
    const g = newGame();
    const id = weaver(g, [0, 3, 0]);
    const spent = g.state.towers.find((t) => t.id === id)!.spent;
    expect(spent).toBe(400 + 300 + 600 + 2200);
    const cash0 = g.state.cash;
    g.apply({ type: 'sell', towerId: id });
    expect(g.state.cash).toBe(cash0 + Math.ceil(spent * 0.7));
    expect(g.state.abilities.some((a) => a.id === 'wallOfTrees')).toBe(false);
  });
});
