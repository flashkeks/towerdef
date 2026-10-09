/** Runde 13: Longshot — Karten-Reichweite, schnelles Projektil, 15 Stufen, Fähigkeiten, Ricochet, Splitter, Markierung. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, type EnemyState, type Game, type SimEvent, type Tiers } from '../src/index';
import { buy, newGame, place, run, statsOf } from './helpers';

type Hit = Extract<SimEvent, { type: 'hit' }>;
const hits = (ev: SimEvent[]): Hit[] => ev.filter((e): e is Hit => e.type === 'hit');
const E = (g: Game, id: number): EnemyState => g.state.enemies.find((e) => e.id === id)!;
/** Longshot weit weg vom Gegner (rechts oben), fertig ausgebaut. */
function shooter(g: Game, tiers: Tiers = [0, 0, 0], x = 560, y = 40): number {
  const id = place(g, 'longshot', x, y);
  buy(g, id, tiers);
  return id;
}

describe('Reichweite und Projektil', () => {
  it('trifft Gegner auf der ganzen Karte, ohne Reichweiten-Aura', () => {
    const g = newGame();
    const id = shooter(g);
    expect(g.state.towers[0].range).toBeGreaterThanOrEqual(1_000_000);
    const far = g.sandbox.spawn('red', 20000); // Eingang links, Tower rechts oben
    const ev = run(g, 200);
    expect(ev.some((e) => e.type === 'fire' && e.tower === id)).toBe(true);
    expect(hits(ev).some((h) => h.enemy === far)).toBe(true);
  });

  it('Projektil 3.000 px/s (50 px je Tick), Treffer erst bei Ankunft, nicht im Tick des Abschusses', () => {
    const g = newGame();
    shooter(g);
    g.sandbox.spawn('green', 150000);
    let fireTick = -1;
    let speedMilli = 0;
    let hitTick = -1;
    for (let i = 0; i < 200 && hitTick < 0; i++) {
      g.step();
      for (const e of g.drainEvents()) {
        if (e.type === 'fire' && fireTick < 0) {
          fireTick = e.tick;
          const p = g.state.projectiles.find((q) => q.id === e.projectile)!;
          speedMilli = Math.round(Math.hypot(p.vx, p.vy));
          expect(p.kind).toBe('snipe');
        }
        if (e.type === 'hit' && hitTick < 0) hitTick = e.tick;
      }
    }
    expect(speedMilli).toBe(50000); // 3000 px/s / 60
    expect(fireTick).toBeGreaterThanOrEqual(0);
    expect(hitTick).toBeGreaterThan(fireTick); // Ankunft, nicht sofort
    expect(hitTick - fireTick).toBeLessThanOrEqual(14); // über die ganze Karte höchstens ~12 Ticks
  });

  it('Targeting First/Last/Strong/Close über alle Gegner; Camo erst mit Night Scope', () => {
    const g = newGame();
    const id = shooter(g, [0, 0, 0]);
    const first = g.sandbox.spawn('red', 300000);
    const last = g.sandbox.spawn('red', 50000);
    g.apply({ type: 'target', towerId: id, mode: 'last' });
    const ev = run(g, 30);
    const w = ev.find((e) => e.type === 'windup') as Extract<SimEvent, { type: 'windup' }>;
    expect(w.target).toBe(last);
    void first;
    const h = newGame();
    shooter(h);
    h.sandbox.spawn('red', 100000, true);
    expect(run(h, 120).some((e) => e.type === 'windup')).toBe(false); // getarnt, keine Erkennung
    const h2 = newGame();
    shooter(h2, [0, 1, 0]);
    h2.sandbox.spawn('red', 100000, true);
    expect(run(h2, 120).some((e) => e.type === 'windup')).toBe(true);
  });
});

describe('Pfad A: Heavy Rounds', () => {
  it('Schaden und Art je Stufe (2 / 4 magic / 7+2 / 18 / 30 / 80)', () => {
    const rows = [0, 1, 2, 3, 4, 5].map((n) => statsOf('longshot', [n, 0, 0]));
    expect(rows.map((s) => s.dmg)).toEqual([2, 4, 7, 18, 30, 80]);
    expect(rows.map((s) => s.dtype)).toEqual(['sharp', 'magic', 'magic', 'magic', 'magic', 'magic']);
    expect(rows.map((s) => s.pierce)).toEqual([1, 1, 2, 2, 2, 2]);
    expect(rows[3].bonusBrute).toBe(10);
    expect(rows[4].bonusBoss).toBe(100);
    expect(rows[5].bonusBoss).toBe(500);
    expect(rows[5].hitStunBoss).toBe(30);
  });

  it('Iron Bolt knackt Ironshell, der Basis-Bolzen prallt ab', () => {
    const a = newGame();
    shooter(a);
    a.sandbox.spawn('ironshell', 100000);
    const evA = run(a, 150);
    expect(evA.some((e) => e.type === 'blocked')).toBe(true);
    const b = newGame();
    shooter(b, [1, 0, 0]);
    const iron = b.sandbox.spawn('ironshell', 100000);
    const evB = run(b, 150);
    expect(hits(evB).some((h) => h.enemy === iron && h.dmg === 4)).toBe(true);
  });

  it('Deadeye: +10 gegen Brute, Giantslayer +100 gegen Boss; Lanternbreaker lässt den Boss taumeln (0,5 s)', () => {
    const d = newGame();
    shooter(d, [3, 0, 0]);
    const brute = d.sandbox.spawn('brute', 100000);
    expect(hits(run(d, 150)).find((h) => h.enemy === brute)!.dmg).toBe(28);
    const g = newGame();
    shooter(g, [4, 0, 0]);
    const boss = g.sandbox.spawn('leviathan', 100000);
    expect(hits(run(g, 150)).find((h) => h.enemy === boss)!.dmg).toBe(30 + 10 + 100);
    // Lanternbreaker knackt die Boss-Hülle (300/400 HP) mit einem Schuss; zum Prüfen des Taumelns bekommt der Boss mehr HP
    const hp0 = DATA.difficulties.hard.bossHp;
    DATA.difficulties.hard.bossHp = 5000;
    const l = newGame({ difficulty: 'hard' });
    DATA.difficulties.hard.bossHp = hp0;
    shooter(l, [5, 0, 0]);
    const boss2 = l.sandbox.spawn('leviathan', 100000);
    let stun = 0;
    for (let i = 0; i < 150 && !stun; i++) {
      l.step();
      const b = E(l, boss2);
      if (b && b.stunTicks > 0) stun = b.stunTicks;
    }
    expect(stun).toBeGreaterThan(25);
    expect(stun).toBeLessThanOrEqual(30);
  });
});

describe('Pfad B: Rapid Reload', () => {
  it('Intervall: 1,6 s → ×0,7 → ×0,33 → ×0,66 → fest 0,12 s mit Schaden 4', () => {
    const ivs = [0, 1, 2, 3, 4, 5].map((n) => statsOf('longshot', [0, n, 0]).interval);
    expect(ivs[0]).toBe(96000);
    expect(ivs[1]).toBe(96000); // Night Scope: nur Erkennung
    expect(ivs[2]).toBe(Math.floor(96000 * 0.7));
    expect(ivs[3]).toBe(Math.floor(ivs[2] * 0.33));
    expect(ivs[4]).toBe(Math.floor(ivs[3] * 0.66));
    expect(ivs[5]).toBe(7200);
    expect(statsOf('longshot', [0, 5, 0]).dmg).toBe(4);
    expect(statsOf('longshot', [2, 5, 0]).dmg).toBe(7); // max: Heavy Rounds bleibt
    expect(statsOf('longshot', [0, 1, 0]).camo).toBe(1);
  });

  it('Focus (Volley Squad): nur mit B4, 8 s doppeltes Tempo, Abklingzeit 60 s, alle Longshots', () => {
    // Boss mit viel HP, damit er in jeder Phase da ist (neuer Boss je Phase)
    const hp0 = DATA.difficulties.medium.bossHp;
    DATA.difficulties.medium.bossHp = 100000;
    const g2 = newGame();
    DATA.difficulties.medium.bossHp = hp0;
    const countFor = (ev: SimEvent[], t: number): number => ev.filter((e) => e.type === 'fire' && e.tower === t).length;
    const phase = (n: number): SimEvent[] => {
      // Boss kurz vor dem Tor beseitigen (Leck würde das Spiel beenden), dann einen frischen setzen
      for (const e of g2.state.enemies.slice()) if (e.progress > 1_000_000) g2.sandbox.hurt(e.id, 1e9);
      if (!g2.state.enemies.some((e) => e.type === 'leviathan')) g2.sandbox.spawn('leviathan', 40000);
      return run(g2, n);
    };
    const chunks = (total: number): SimEvent[] => {
      const all: SimEvent[] = [];
      for (let left = total; left > 0; left -= 240) all.push(...phase(Math.min(240, left)));
      return all;
    };
    const a = shooter(g2, [0, 4, 0], 560, 40);
    const b = shooter(g2, [0, 0, 0], 560, 100);
    const ab = g2.state.abilities.find((x) => x.id === 'focus')!;
    expect(ab).toMatchObject({ ready: false, cdTotal: 3600 });
    const before = chunks(480);
    chunks(3600 - 480);
    expect(g2.state.abilities.find((x) => x.id === 'focus')!.ready).toBe(true);
    expect(g2.apply({ type: 'ability', ability: 'focus' }).ok).toBe(true);
    expect(g2.state.focusLeft).toBe(480);
    const during = chunks(480);
    const after = chunks(480);
    expect(countFor(during, b) / Math.max(1, countFor(before, b))).toBeGreaterThan(1.7);
    expect(countFor(during, b)).toBeGreaterThan(countFor(after, b) * 1.7);
    expect(countFor(during, a)).toBeGreaterThan(countFor(after, a) * 1.7);
    expect(g2.apply({ type: 'ability', ability: 'focus' })).toEqual({ ok: false, reason: 'cooldown' });
  });
});

describe('Pfad C: Field Kit', () => {
  it('Shrapnel: ein Treffer wirft 3 Splitter (Schaden 1, Pierce 1, sharp)', () => {
    const g = newGame();
    shooter(g, [0, 0, 1]);
    g.sandbox.spawn('green', 100000);
    let frags = 0;
    for (let i = 0; i < 150 && !frags; i++) {
      g.step();
      frags = g.state.projectiles.filter((p) => p.kind === 'frag').length;
    }
    expect(frags).toBe(3);
    const f = g.state.projectiles.find((p) => p.kind === 'frag')!;
    expect(f).toMatchObject({ dmg: 1, pierce: 1, dtype: 'sharp', sub: 1 });
  });

  it('Ricochet: springt auf 2 weitere Gegner, je Sprung 1 Schaden weniger', () => {
    const g = newGame();
    shooter(g, [1, 0, 2]); // Iron Bolt (4) + Ricochet
    const a = g.sandbox.spawn('brute', 100000);
    const b = g.sandbox.spawn('brute', 106000);
    const c = g.sandbox.spawn('brute', 112000);
    const all = run(g, 100);
    const ri = all.findIndex((e) => e.type === 'ricochet');
    const ev = all.slice(0, ri + 1); // nur der erste Schuss
    const r = all[ri] as Extract<SimEvent, { type: 'ricochet' }>;
    expect(r).toBeDefined();
    expect(r.points).toHaveLength(3);
    const byEnemy = new Map(hits(ev).map((h) => [h.enemy, h.dmg]));
    expect(byEnemy.get(c)).toBe(4); // das Ziel (First = am weitesten vorn)
    expect(byEnemy.get(b)).toBe(3);
    expect(byEnemy.get(a)).toBe(2);
  });

  it('Supply Drop: +800 Gold, Abklingzeit 60 s, Event mit Betrag; Supply Lines +200; mehrere Longshots addieren', () => {
    const g = newGame({ mods: { startCash: 100000, supplyBonus: 200 } });
    shooter(g, [0, 0, 3], 560, 40);
    expect(g.state.abilities.find((x) => x.id === 'supplyDrop')).toMatchObject({ ready: false, cdTotal: 3600 });
    g.step(3600);
    g.drainEvents();
    const cash = g.state.cash;
    expect(g.apply({ type: 'ability', ability: 'supplyDrop' }).ok).toBe(true);
    expect(g.state.cash).toBe(cash + 1000);
    expect(g.drainEvents()).toContainEqual({ type: 'ability', tick: g.state.tick, id: 'supplyDrop', x: 560000, y: 40000, cash: 1000 });
    shooter(g, [0, 0, 3], 560, 100);
    g.step(3600);
    const c2 = g.state.cash;
    g.apply({ type: 'ability', ability: 'supplyDrop' });
    expect(g.state.cash).toBe(c2 + 2000);
  });

  it('Elite Sniper: +40 % Tempo für alle Longshots; Strong bevorzugt Brutes (vor dem Boss)', () => {
    const shots = (elite: boolean): number => {
      const g = newGame();
      shooter(g, elite ? [0, 0, 4] : [0, 0, 0], 560, 40);
      const other = shooter(g, [0, 0, 0], 560, 100);
      g.sandbox.spawn('leviathan', 60000);
      return run(g, 1200).filter((e) => e.type === 'fire' && e.tower === other).length;
    };
    const base = shots(false);
    const buffed = shots(true);
    expect(buffed / base).toBeGreaterThan(1.3);
    expect(buffed / base).toBeLessThan(1.5);
    const pick = (tiers: Tiers): number => {
      const g = newGame();
      const id = shooter(g, tiers);
      g.apply({ type: 'target', towerId: id, mode: 'strong' });
      g.sandbox.spawn('leviathan', 100000);
      const brute = g.sandbox.spawn('brute', 90000);
      const w = run(g, 30).find((e) => e.type === 'windup') as Extract<SimEvent, { type: 'windup' }>;
      return w.target === brute ? 1 : 0;
    };
    expect(pick([0, 0, 0])).toBe(0); // ohne Elite: Boss vor Brute
    expect(pick([0, 0, 4])).toBe(1);
  });

  it('Crippling Shot: Nicht-Boss −50 % Tempo für 2 s; Boss markiert (3 s, +20 % aus allen Quellen), nicht verlangsamt', () => {
    const g = newGame();
    shooter(g, [0, 0, 5]);
    const green = g.sandbox.spawn('brute', 100000); // überlebt den ersten Treffer
    let slowed: EnemyState | undefined;
    for (let i = 0; i < 150 && !slowed; i++) {
      g.step();
      const e = E(g, green);
      if (e && e.slowTicks > 0) slowed = { ...e };
    }
    expect(slowed).toMatchObject({ slowBp: 5000 });
    expect(slowed!.slowTicks).toBeLessThanOrEqual(120);
    const b = newGame({ difficulty: 'hard' });
    shooter(b, [0, 0, 5]);
    const boss = b.sandbox.spawn('leviathan', 100000);
    let st: EnemyState | undefined;
    const ev: SimEvent[] = [];
    for (let i = 0; i < 150 && !st; i++) {
      b.step();
      ev.push(...b.drainEvents());
      const e = E(b, boss);
      if (e && e.markTicks > 0) st = { ...e };
    }
    expect(st).toMatchObject({ markBp: 2000, slowTicks: 0 });
    expect(st!.markTicks).toBeLessThanOrEqual(180);
    expect(ev.some((e) => e.type === 'status' && e.kind === 'mark' && e.enemy === boss)).toBe(true);
    // Markierung wirkt aus allen Quellen
    const before = E(b, boss).hp;
    expect(b.sandbox.hurt(boss, 10, 'explosive')).toBe(true);
    expect(before - E(b, boss).hp).toBe(12);
    // und läuft ab (Turm verkauft, sonst frischt jeder Treffer sie auf)
    b.apply({ type: 'sell', towerId: b.state.towers[0].id });
    run(b, 200);
    expect(E(b, boss).markTicks).toBe(0);
    expect(E(b, boss).markBp).toBe(0);
  });
});

describe('Verknüpfungen', () => {
  it('Crosspath-Regeln und Preise wie bei den anderen Türmen', () => {
    const g = newGame();
    const id = place(g, 'longshot', 560, 40);
    buy(g, id, [3, 2, 0]);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'crosspath' }); // dritter Pfad
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 })).toEqual({ ok: false, reason: 'crosspath' }); // zweiter Pfad ≥ 3
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    expect(g.state.towers[0].spent).toBe(350 + 350 + 1200 + 3000 + 200 + 400 + 5000);
  });

  it('Turm-XP: Longshot bekommt Geld- und Pop-Anteil wie die Primary-Türme', () => {
    const g = newGame({ towerXp: { ranger: 100, bombardier: 100, frostcaller: 100, longshot: 100, market: 100 } });
    shooter(g);
    g.apply({ type: 'startRound' });
    const ev = run(g, 60 * 120, () => g.state.roundsCleared >= 1);
    const xp = ev.find((e) => e.type === 'towerXp') as Extract<SimEvent, { type: 'towerXp' }>;
    expect(xp.gains).toEqual({ longshot: xp.pot });
    expect(g.state.towerXpGained.longshot).toBe(xp.pot);
    expect(g.state.stats.pops.longshot).toBeGreaterThan(0);
  });
});
