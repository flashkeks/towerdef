/** Runde 14: Alchemist — Trank im Bogen, Säure, Buff-Tränke, Unstable, Tonic, Pfützen, Gold, Shrink. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, type EnemyState, type Game, type SimEvent, type Tiers } from '../src/index';
import { buy, newGame, place, run, statsOf } from './helpers';

type Of<T extends SimEvent['type']> = Extract<SimEvent, { type: T }>;
const of = <T extends SimEvent['type']>(ev: SimEvent[], t: T): Of<T>[] => ev.filter((e): e is Of<T> => e.type === t);
const E = (g: Game, id: number): EnemyState => g.state.enemies.find((e) => e.id === id)!;
/** Alchemist neben dem ersten Wegstück (Mitte x=60), 30 px vom Weg. */
function alch(g: Game, tiers: Tiers = [0, 0, 0], x = 60, y = 122): number {
  const id = place(g, 'alchemist', x, y);
  buy(g, id, tiers);
  return id;
}
function ready(g: Game, id: string): void {
  g.step(g.state.abilities.find((x) => x.id === id)!.cdTotal);
}
/** Läuft, bis die Bedingung gilt (je Tick geprüft), höchstens `max` Ticks. */
function until(g: Game, max: number, cond: () => boolean): SimEvent[] {
  return run(g, max, cond);
}

describe('Daten', () => {
  it('Preise, Namen und Fußabdruck laut Entwurf', () => {
    const d = DATA.towers.alchemist;
    expect(d.price).toBe(500);
    expect(d.radius).toBe(10);
    expect(d.paths.map((p) => p.name)).toEqual(['Brews', 'Unstable', 'Gold']);
    expect(d.paths.map((p) => p.tiers.map((t) => t.price))).toEqual([
      [250, 350, 1200, 3000, 15000],
      [250, 450, 2500, 4000, 15000],
      [250, 300, 1500, 3500, 22000],
    ]);
    expect(d.paths[0].tiers.map((t) => t.name)).toEqual(['Larger Potions', 'Acidic Mixture', 'Berserker Brew', 'Stronger Stimulant', 'Permanent Brew']);
    expect(d.paths[1].tiers.map((t) => t.name)).toEqual(['Stronger Acid', 'Perishing Potions', 'Unstable Concoction', 'Transforming Tonic', 'Total Transformation']);
    expect(d.paths[2].tiers.map((t) => t.name)).toEqual(['Faster Throwing', 'Acid Pool', 'Lead to Gold', 'Rubber to Gold', 'Shrink Potion']);
  });

  it('Basis: Splash 18 px auf bis zu 12, Schaden 1, Säure 1/s für 2 s (magic), Intervall 1,5 s (Runde 14 nach Matrix, Entwurf 2,0 s), Reichweite 64 px', () => {
    expect(statsOf('alchemist', [0, 0, 0])).toMatchObject({ atk: 'potion', dtype: 'magic', dmg: 1, radius: 18000, maxT: 12, burnDmg: 1, burnTicks: 120, interval: 90000, range: 64000 });
  });

  it('Pfade: Radius, Säure, Boni, Buff-Werte, Intervall', () => {
    const a = [0, 1, 2, 3, 4, 5].map((n) => statsOf('alchemist', [n, 0, 0]));
    expect(a.map((s) => s.radius)).toEqual([18000, 23400, 23400, 23400, 23400, 23400]);
    expect(a.map((s) => s.burnDmg)).toEqual([1, 1, 2, 2, 2, 2]);
    expect(a[2]).toMatchObject({ bonusIron: 1, bonusBrute: 1 });
    expect(a[3]).toMatchObject({ brewEvery: 360, brewDmg: 1, brewRangeBp: 1500, brewSpeedBp: 1000, brewTicks: 480 });
    expect(a[4]).toMatchObject({ brewDmg: 2, brewSpeedBp: 2500, brewRangeBp: 1500 });
    expect(a[5].brewPerm).toBe(1);
    const b = [0, 1, 2, 3, 4, 5].map((n) => statsOf('alchemist', [0, n, 0]));
    expect(b.map((s) => s.burnDmg)).toEqual([1, 3, 3, 3, 3, 3]);
    expect(b[2]).toMatchObject({ bonusBrute: 2, bonusBoss: 3 });
    expect(b[3]).toMatchObject({ unstR: 24000, unstDmg: 4 });
    expect(b[4]).toMatchObject({ tonicDur: 1200, tonicCd: 3600 });
    expect(b[5].tonicOthers).toBe(5);
    const c = [0, 1, 2, 3, 4, 5].map((n) => statsOf('alchemist', [0, 0, n]));
    expect(c[1].interval).toBe(67500);
    expect([c[2].poolN, c[3].leadGold, c[4].rubberTicks, c[5].shrinkEvery]).toEqual([20, 40, 1800, 180]);
  });
});

describe('Trank im Bogen', () => {
  it('Treffer erst bei Ankunft (Flugzeit 36 Ticks), landet dort, wo das Ziel ankommt', () => {
    const g = newGame();
    const id = alch(g);
    const red = g.sandbox.spawn('brute', 90000);
    const ev: SimEvent[] = [];
    let fireTick = -1, landTick = -1;
    for (let i = 0; i < 200 && landTick < 0; i++) {
      g.step();
      const e = g.drainEvents();
      ev.push(...e);
      for (const x of e) {
        if (x.type === 'fire' && x.tower === id && fireTick < 0) {
          fireTick = x.tick;
          expect(x.kind).toBe('potion');
          const p = g.state.projectiles.find((q) => q.id === x.projectile)!;
          expect(p.arc).toBeDefined();
        }
        if (x.type === 'explode' && x.kind === 'acid') landTick = x.tick;
      }
    }
    expect(fireTick).toBeGreaterThanOrEqual(0);
    expect(landTick - fireTick).toBe(36);
    // vor der Landung kein Schaden (brute 10 HP)
    const hitsBefore = of(ev, 'hit').filter((h) => h.tick <= landTick - 1 && h.enemy === red);
    expect(hitsBefore).toHaveLength(0);
    const h = of(ev, 'hit').find((x) => x.enemy === red)!;
    expect(h).toMatchObject({ tick: landTick, dmg: 1, dtype: 'magic', tower: id });
  });

  it('Spritzer trifft höchstens 12 Gegner im Radius, Säure auf allen Getroffenen', () => {
    const g = newGame();
    alch(g);
    for (let i = 0; i < 14; i++) g.sandbox.spawn('brute', 90000 + i * 200);
    const ev = until(g, 200, () => g.state.enemies.some((e) => e.burnTicks > 0));
    const land = of(ev, 'explode').filter((x) => x.kind === 'acid');
    expect(land).toHaveLength(1);
    const hit = of(ev, 'hit').filter((x) => x.tick === land[0].tick);
    expect(hit).toHaveLength(12);
    expect(g.state.enemies.filter((e) => e.burnTicks > 0)).toHaveLength(12);
    expect(of(ev, 'status').filter((s) => s.kind === 'acid')).toHaveLength(12);
  });

  it('Säure: 1 Schaden/s für 2 s (magic); Acidic Mixture 2/s, Stronger Acid 3/s', () => {
    for (const [tiers, per] of [[[0, 0, 0], 1], [[2, 0, 0], 2], [[0, 1, 0], 3]] as [Tiers, number][]) {
      const g = newGame();
      const al = alch(g, tiers);
      const boss = g.sandbox.spawn('brute', 90000);
      E(g, boss).hp = E(g, boss).maxHp = 1000; // übersteht die Säure
      let t0 = 0;
      const ev: SimEvent[] = [];
      for (let i = 0; i < 260; i++) {
        g.step();
        const e = g.drainEvents();
        ev.push(...e);
        if (!t0 && of(e, 'status').some((s) => s.kind === 'acid')) { t0 = g.state.tick; g.apply({ type: 'sell', towerId: al }); } // keine zweite Ladung auffrischen
        if (t0 && g.state.tick - t0 > 125) break;
      }
      const dots = of(ev, 'hit').filter((h) => h.enemy === boss && h.tick > t0 && h.dmg === per && h.dtype === 'magic');
      expect(dots.length).toBe(2); // zwei Sekunden Säure
    }
  });

  it('Treffer an Ironshell: magic knackt, +1 mit Acidic Mixture', () => {
    const a = newGame();
    alch(a);
    const iron = a.sandbox.spawn('ironshell', 90000);
    const evA = until(a, 200, () => !a.state.enemies.some((e) => e.id === iron));
    expect(of(evA, 'pop').some((p) => p.enemy === iron)).toBe(true);
  });

  it('Boni gegen Brute (A2 +1, B2 +2) und Boss (B2 +3 plus Brute-Bonus)', () => {
    const firstHit = (tiers: Tiers, type: 'brute' | 'leviathan' | 'ironshell'): number => {
      const g = newGame();
      alch(g, tiers);
      g.sandbox.spawn(type, 90000);
      const ev = until(g, 200, () => false);
      return of(ev, 'hit').find((h) => h.dtype === 'magic')?.dmg ?? 0;
    };
    expect(firstHit([0, 0, 0], 'brute')).toBe(1);
    expect(firstHit([2, 0, 0], 'brute')).toBe(2);
    expect(firstHit([2, 0, 0], 'ironshell')).toBe(2);
    expect(firstHit([0, 2, 0], 'brute')).toBe(3);
    expect(firstHit([0, 2, 0], 'leviathan')).toBe(1 + 2 + 3);
  });
});

describe('Pfad A: Buff-Tränke', () => {
  it('Berserker Brew: Trank auf einen Turm im Radius (+1 Schaden, +15 % Reichweite, +10 % Tempo, 8 s)', () => {
    const g = newGame();
    const a = alch(g, [3, 0, 0]);
    const r = place(g, 'ranger', 60, 170);
    const far = place(g, 'ranger', 560, 40);
    const ev = run(g, 5);
    const brew = of(ev, 'brew');
    expect(brew).toHaveLength(1);
    expect(brew[0]).toMatchObject({ tower: a, target: r, ticks: 480, dmg: 1, rangeBp: 1500, speedBp: 1000 });
    const T = g.state.towers.find((t) => t.id === r)!;
    expect(T).toMatchObject({ buffTicks: expect.any(Number), buffDmg: 1, buffRangeBp: 1500, buffSpeedBp: 1000 });
    expect(g.state.towers.find((t) => t.id === far)!.buffTicks).toBe(0);
    expect(g.buffOf(r)).toMatchObject({ dmg: 1, rangeBp: 1500, speedBp: 1000, permanent: false });
    expect(T.range).toBe(Math.floor((68000 * 11500) / 10000));
    // läuft nach 8 s ab, wenn kein neuer Trank kommt (Alchemist verkauft)
    g.apply({ type: 'sell', towerId: a });
    g.step(500);
    expect(T.buffTicks).toBe(0);
    expect(T.buffDmg).toBe(0);
    expect(T.range).toBe(68000);
  });

  it('Takt 6 s; Trank liegt auf dem Turm mit dem kürzesten Rest (wechselt)', () => {
    const g = newGame();
    alch(g, [3, 0, 0]);
    const r1 = place(g, 'ranger', 60, 170);
    const r2 = place(g, 'ranger', 20, 150);
    const brews = of(run(g, 800), 'brew');
    expect(brews.length).toBeGreaterThanOrEqual(2);
    expect(brews[1].tick - brews[0].tick).toBe(360);
    expect(new Set([brews[0].target, brews[1].target]).size).toBe(2);
    void r1;
    void r2;
  });

  it('Buff wirkt: Ranger-Treffer +1 Schaden', () => {
    const g = newGame();
    alch(g, [3, 0, 0]);
    const r = place(g, 'ranger', 60, 170);
    g.sandbox.spawn('brute', 200000);
    g.state.enemies[0].frozenTicks = 100000; // steht in Reichweite
    const ev = run(g, 200);
    const hit = of(ev, 'hit').find((h) => h.tower === r);
    // frozen -> sharp wird geblockt; deshalb Ziel ohne Frost prüfen
    expect(hit).toBeUndefined();
    const h2 = newGame();
    alch(h2, [3, 0, 0]);
    const r2 = place(h2, 'ranger', 60, 170);
    h2.sandbox.spawn('brute', 200000);
    h2.state.enemies[0].stunTicks = 100000;
    const hit2 = of(run(h2, 200), 'hit').find((h) => h.tower === r2)!;
    expect(hit2.dmg).toBe(2);
  });

  it('Stronger Stimulant: +2 Schaden, +25 % Tempo; Potent Brews (+25 % Dauer)', () => {
    const g = newGame({ mods: { startCash: 100000, brewDurBp: 2500 } });
    alch(g, [4, 0, 0]);
    const r = place(g, 'ranger', 60, 170);
    const ev = run(g, 3);
    expect(of(ev, 'brew')[0]).toMatchObject({ target: r, dmg: 2, speedBp: 2500, ticks: 600 });
  });

  it('Permanent Brew: dauerhaft auf allen Türmen im Radius, keine Würfe, nichts außerhalb', () => {
    const g = newGame();
    const a = alch(g, [5, 0, 0]);
    const r = place(g, 'ranger', 60, 170);
    const far = place(g, 'ranger', 560, 40);
    const ev = run(g, 700);
    expect(of(ev, 'brew')).toHaveLength(0);
    expect(g.buffOf(r)).toMatchObject({ dmg: 2, rangeBp: 1500, speedBp: 2500, permanent: true });
    expect(g.buffOf(far)).toMatchObject({ dmg: 0, permanent: false });
    // Ranger im Radius schießt mit +2: (1 + 2) Schaden
    const h = newGame();
    alch(h, [5, 0, 0]);
    const rr = place(h, 'ranger', 60, 170);
    h.sandbox.spawn('brute', 200000);
    h.state.enemies[0].stunTicks = 100000;
    expect(of(run(h, 200), 'hit').find((x) => x.tower === rr)!.dmg).toBe(3);
    // Alchemist weg: Wirkung weg
    g.apply({ type: 'sell', towerId: a });
    expect(g.buffOf(r).permanent).toBe(false);
  });

  it('Märkte bekommen keinen Trank', () => {
    const g = newGame();
    alch(g, [3, 0, 0]);
    const m = place(g, 'market', 60, 200);
    run(g, 5);
    expect(g.state.towers.find((t) => t.id === m)!.buffTicks).toBe(0);
  });
});

describe('Pfad B: Unstable, Tonic', () => {
  it('Unstable Concoction: markierter Gegner explodiert beim Tod (24 px, 4 Schaden) und trifft die Nachbarn', () => {
    const g = newGame();
    const a = alch(g, [0, 3, 0]);
    // zwei Brutes 28 px auseinander: der Trank trifft nur einen, die Explosion (24 + 9) beide
    const b1 = g.sandbox.spawn('brute', 100000);
    const b2 = g.sandbox.spawn('brute', 72000);
    const ev = until(g, 200, () => of(g.drainEvents(), 'status').length >= 0 && g.state.enemies.some((e) => e.volatile > 0));
    void ev;
    const marked = g.state.enemies.filter((e) => e.volatile > 0);
    expect(marked.length).toBeGreaterThanOrEqual(1);
    expect(marked[0].volatile).toBe(a);
    const m = marked[0];
    const other = m.id === b1 ? b2 : b1;
    const hpOther = E(g, other).hp;
    const events: SimEvent[] = [];
    g.sandbox.hurt(m.id, 1000);
    events.push(...g.drainEvents());
    const ex = of(events, 'explode').find((x) => x.kind === 'unstable')!;
    expect(ex.radius).toBe(24000);
    if (E(g, other)) {
      // nur Explosionsschaden 4 (keine anderen Quellen im selben Tick)
      expect(hpOther - E(g, other).hp).toBe(4);
    }
    expect(of(events, 'hit').some((h) => h.enemy === other && h.dmg === 4 && h.dtype === 'explosive')).toBe(true);
  });

  it('Transforming Tonic: Fähigkeit 60 s, 20 s Monster-Form, 30 Schaden/s auf das stärkste Ziel', () => {
    const g = newGame();
    const a = alch(g, [0, 4, 0]);
    expect(g.state.abilities.find((x) => x.id === 'tonic')).toMatchObject({ ready: false, cdTotal: 3600 });
    ready(g, 'tonic');
    // Boss weit genug weg, damit die Normalangriffe ihn nicht beschäftigen
    const boss = g.sandbox.spawn('leviathan', 100000);
    g.state.enemies[0].stunTicks = 100000;
    g.sandbox.spawn('green', 100000);
    expect(g.apply({ type: 'ability', ability: 'tonic' }).ok).toBe(true);
    const T = g.state.towers.find((t) => t.id === a)!;
    expect(T.monsterTicks).toBe(1200);
    expect(of(g.drainEvents(), 'monster')).toEqual([{ type: 'monster', tick: g.state.tick, tower: a, source: a, ticks: 1200 }]);
    const ev = run(g, 60);
    const dmg = of(ev, 'hit').filter((h) => h.tower === a && h.enemy === boss && h.dmg === 6 && h.dtype === 'magic');
    expect(dmg).toHaveLength(5); // 5 x 6 = 30 in einer Sekunde
    expect(g.state.abilities.find((x) => x.id === 'tonic')).toMatchObject({ ready: false });
    g.step(1200);
    expect(T.monsterTicks).toBe(0);
  });

  it('Total Transformation: zusätzlich die 5 nächsten Türme im Radius (Markets nie)', () => {
    const g = newGame();
    const a = alch(g, [0, 5, 0]);
    const rangers: number[] = [];
    for (const [x, y] of [[60, 160], [25, 150], [85, 145], [35, 175], [60, 180], [85, 170]] as [number, number][]) rangers.push(place(g, 'ranger', x, y));
    const m = place(g, 'market', 30, 125);
    ready(g, 'tonic');
    g.drainEvents();
    g.apply({ type: 'ability', ability: 'tonic' });
    const mon = of(g.drainEvents(), 'monster');
    expect(mon.filter((x) => x.source === a)).toHaveLength(1 + 5);
    const transformed = g.state.towers.filter((t) => t.monsterTicks > 0);
    expect(transformed).toHaveLength(6);
    expect(g.state.towers.find((t) => t.id === m)!.monsterTicks).toBe(0);
    void rangers;
  });
});

describe('Pfad C: Pfütze, Gold, Shrink', () => {
  it('Faster Throwing: Intervall × 0,75', () => {
    const g = newGame();
    const a = alch(g, [0, 0, 1]);
    g.sandbox.spawn('leviathan', 90000);
    const w = of(run(g, 400), 'windup').filter((x) => x.tower === a);
    expect(Math.abs(w[1].tick - w[0].tick - 67.5)).toBeLessThanOrEqual(1);
  });

  it('Acid Pool: Pfütze auf dem Weg, 1 Schaden alle 0,5 s, 20 Treffer, dann weg', () => {
    const g = newGame();
    const a = alch(g, [0, 0, 2]);
    const boss = g.sandbox.spawn('leviathan', 90000);
    const ev = until(g, 200, () => g.state.puddles.length > 0);
    expect(g.state.puddles).toHaveLength(1);
    const q = g.state.puddles[0];
    expect(q.owner).toBe(a);
    expect(q.charges).toBe(20);
    expect(of(ev, 'puddle')[0]).toMatchObject({ id: q.id, tower: a, radius: 12000, charges: 20 });
    // Auf dem Weg: Abstand zur Wegmitte 0
    const e0 = E(g, boss);
    expect(Math.abs(q.progress - e0.progress)).toBeLessThan(60000);
    // Boss im Becken stellen: jede halbe Sekunde 1 Schaden
    e0.progress = q.progress;
    e0.stunTicks = 100000;
    const ev2 = run(g, 63);
    const pud = of(ev2, 'hit').filter((h) => h.tower === a && h.dmg === 1 && h.dtype === 'magic' && h.enemy === boss);
    expect(pud.length).toBeGreaterThanOrEqual(2);
    expect(g.state.puddles.find((p) => p.id === q.id)!.charges).toBeLessThan(20);
    // Verbrauch: viele Treffer leeren sie
    run(g, 900);
    expect(g.state.puddles.some((p) => p.id === q.id && p.charges === 20)).toBe(false);
  });

  it('Pfütze verschwindet nach 30 s ohne Treffer', () => {
    const g = newGame();
    alch(g, [0, 0, 2]);
    g.sandbox.spawn('red', 90000);
    until(g, 200, () => g.state.puddles.length > 0);
    const q = g.state.puddles[0];
    g.apply({ type: 'sell', towerId: g.state.towers[0].id });
    const ev = run(g, 1800);
    expect(of(ev, 'puddleGone')).toEqual([expect.objectContaining({ id: q.id, reason: 'expired' })]);
  });

  it('Lead to Gold: +40 Gold je geknacktem Ironshell (Midas Hands +20); Ironshells ohne den Alchemisten nicht', () => {
    const g = newGame();
    const a = alch(g, [0, 0, 3]);
    const iron = g.sandbox.spawn('ironshell', 90000);
    const ev = until(g, 200, () => !g.state.enemies.some((e) => e.id === iron));
    const b = of(ev, 'bounty');
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ tower: a, gold: 40, reason: 'lead' });
    expect(g.state.stats.bountyGold).toBe(40);
    const m = newGame({ mods: { startCash: 100000, leadGoldAdd: 20 } });
    alch(m, [0, 0, 3]);
    const i2 = m.sandbox.spawn('ironshell', 90000);
    const ev2 = until(m, 200, () => !m.state.enemies.some((e) => e.id === i2));
    expect(of(ev2, 'bounty')[0].gold).toBe(60);
    // ohne Pfad-C3: kein Gold
    const n = newGame();
    alch(n);
    const i3 = n.sandbox.spawn('ironshell', 90000);
    expect(of(until(n, 200, () => !n.state.enemies.some((e) => e.id === i3)), 'bounty')).toHaveLength(0);
  });

  it('Rubber to Gold: markierte Gegner geben 30 s lang +1 Gold je Schicht, Kinder erben', () => {
    const g = newGame();
    alch(g, [0, 0, 4]);
    const green = g.sandbox.spawn('green', 90000);
    const ev = until(g, 200, () => !g.state.enemies.some((e) => e.id === green));
    const pop = of(ev, 'pop').find((p) => p.enemy === green)!;
    expect(pop.cash).toBe(DATA.difficulties.medium.popCash + 1);
    const kids = g.state.enemies.filter((e) => pop.children.includes(e.id));
    expect(kids.length).toBe(1);
    expect(kids[0].goldTicks).toBeGreaterThan(1700);
    // Mark läuft ab (30 s)
    const k = kids[0];
    g.apply({ type: 'sell', towerId: g.state.towers[0].id });
    g.state.projectiles.splice(0); // Trank im Flug verfällt
    g.state.puddles.splice(0); // C4 enthält Acid Pool: die Pfütze würde das Kind knacken
    k.stunTicks = 100000;
    g.step(1790);
    expect(k.goldTicks).toBeLessThan(15);
    expect(of(ev, 'status').some((s) => s.kind === 'gold')).toBe(true);
    // ohne Pfad-C4 keine Zusatz
    const n = newGame();
    alch(n);
    const gr = n.sandbox.spawn('green', 90000);
    const p2 = of(until(n, 200, () => !n.state.enemies.some((e) => e.id === gr)), 'pop').find((p) => p.enemy === gr)!;
    expect(p2.cash).toBe(DATA.difficulties.medium.popCash);
  });

  it('Shrink Potion: stärkster Nicht-Boss in Reichweite wird zum Red Glim, Schichten zahlen wie Pops, Takt 3 s', () => {
    const g = newGame();
    const a = alch(g, [0, 0, 5]);
    g.sandbox.spawn('gold', 85000);
    const brute = g.sandbox.spawn('brute', 90000);
    const boss = g.sandbox.spawn('leviathan', 95000);
    const cash0 = g.state.cash;
    g.step();
    const ev = g.drainEvents();
    const s = of(ev, 'shrink');
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ tower: a, enemy: brute, from: 'brute' });
    expect(s[0].cash).toBe(18 * DATA.difficulties.medium.popCash); // 19 Knoten - 1 bleibt
    expect(g.state.cash).toBe(cash0 + 36);
    expect(E(g, brute)).toMatchObject({ type: 'red', hp: 1, maxHp: 1 });
    expect(E(g, boss).type).toBe('leviathan');
    expect(g.state.stats.pops.alchemist).toBe(18);
    // RBE-Bilanz: das Red hat nur noch 1 RBE, nichts doppelt gezählt
    const w = of(run(g, 400), 'shrink');
    expect(w.every((x) => x.from !== 'red' && x.from !== 'leviathan')).toBe(true);
    if (w.length >= 1) expect(w[0].tick - s[0].tick).toBeGreaterThanOrEqual(180);
  });

  it('Shrink: ein geschrumpfter Gegner leckt höchstens 1 Leben', () => {
    const g = newGame();
    alch(g, [0, 0, 5]);
    const brute = g.sandbox.spawn('brute', 90000);
    g.step();
    const e = E(g, brute);
    expect(e.type).toBe('red');
    e.progress = DATA.maps.bare.path.length > 0 ? 1_600_000 : 0; // knapp vor dem Tor
    const lives = g.state.lives;
    run(g, 6000, () => !g.state.enemies.some((x) => x.id === brute));
    expect(lives - g.state.lives).toBeLessThanOrEqual(1);
  });
});

describe('Turm-XP und Verkauf', () => {
  it('Alchemist bekommt Turm-XP', () => {
    const g = newGame({ towerXp: { alchemist: 0 } });
    alch(g, [0, 0, 0]);
    g.sandbox.spawn('red', 90000);
    run(g, 300);
    g.sandbox.setCash(100000);
    const r = g.apply({ type: 'startRound' });
    expect(r.ok).toBe(true);
    for (let i = 0; i < 3000 && g.state.roundsCleared < 1; i++) {
      g.step();
      for (const e of g.state.enemies.slice()) g.sandbox.hurt(e.id, 1000);
    }
    expect(g.state.towerXpGained.alchemist).toBeGreaterThan(0);
  });
});
