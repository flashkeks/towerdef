import { describe, expect, it } from 'vitest';
import { DATA } from '../src/index';
import { buy, newGame, place, px, run } from './helpers';

describe('Projektile mit Flugzeit', () => {
  it('Ausholen 6 Ticks, Schaden erst nach dem Abschuss beim Auftreffen', () => {
    const g = newGame();
    const tid = place(g, 'ranger');
    const eid = g.sandbox.spawn('red', 30000);
    const ev = run(g, 120, () => g.state.enemies.length === 0);
    const windup = ev.find((e) => e.type === 'windup' && e.tower === tid)!;
    const fire = ev.find((e) => e.type === 'fire' && e.tower === tid)!;
    const hit = ev.find((e) => e.type === 'hit' && e.enemy === eid)!;
    expect(windup && fire && hit).toBeTruthy();
    expect(fire.tick - windup.tick).toBe(6);
    expect(hit.tick).toBeGreaterThan(fire.tick);
    // vor dem Treffer kein Schaden und kein Pop
    expect(ev.filter((e) => (e.type === 'hit' || e.type === 'pop') && e.tick <= fire.tick)).toHaveLength(0);
  });

  it('Der Gegner läuft im Flug weiter: Pfeil zielt voraus und trifft', () => {
    const g = newGame();
    place(g, 'ranger', 60, 122);
    g.sandbox.spawn('gold', 20000); // schnell
    const ev = run(g, 200);
    expect(ev.some((e) => e.type === 'pop' && e.etype === 'gold')).toBe(true);
  });

  it('Bombe: Explosion genau Flugzeit (27 Ticks) nach dem Abschuss', () => {
    const g = newGame();
    const tid = place(g, 'bombardier', 60, 122);
    g.sandbox.spawn('red', 30000);
    const ev = run(g, 300, () => g.state.enemies.length === 0);
    const fire = ev.find((e) => e.type === 'fire' && e.tower === tid)!;
    const boom = ev.find((e) => e.type === 'explode')!;
    expect(boom.tick - fire.tick).toBe(DATA.towers.bombardier.base.flight);
    expect(ev.filter((e) => e.type === 'hit' && e.tick < boom.tick)).toHaveLength(0);
  });

  it('Pierce: ein Pfeil trifft bis zu 2 Gegner (Basis), mit Sharp Tips 3', () => {
    for (const [tiers, expected] of [[[0, 0, 0], 2], [[1, 0, 0], 3]] as const) {
      const g = newGame();
      const tid = place(g, 'ranger', 60, 122);
      if (tiers[0]) buy(g, tid, [1, 0, 0]);
      g.apply({ type: 'target', towerId: tid, mode: 'first' });
      // 4 Gegner dicht hintereinander auf der Geraden (Abstand 3 px), Ziel = vorderster
      for (let i = 0; i < 4; i++) g.sandbox.spawn('red', 50000 - i * 3000);
      const ev = run(g, 12);
      // Alle Pfeile des ersten Schusses zusammenzählen: ein Schuss -> ein Projektil
      const hits = ev.filter((e) => e.type === 'hit');
      expect(hits.length).toBeGreaterThanOrEqual(expected);
      // Pierce begrenzt: erster Schuss trifft höchstens `expected`
      const firstFireTick = ev.find((e) => e.type === 'fire')!.tick;
      const firstHits = hits.filter((e) => e.tick <= firstFireTick + 12 && e.tick < firstFireTick + 8);
      expect(firstHits.length).toBeLessThanOrEqual(expected);
    }
  });

  it('Je Gegner höchstens ein Treffer pro Projektil', () => {
    const g = newGame();
    place(g, 'ranger');
    const e = g.sandbox.spawn('brute', 40000);
    const ev = run(g, 60);
    const perShot = new Map<number, number>();
    for (const x of ev) if (x.type === 'hit' && x.enemy === e) perShot.set(x.tick, (perShot.get(x.tick) ?? 0) + 1);
    for (const n of perShot.values()) expect(n).toBe(1);
  });

  it('Stirbt das Ziel, fliegt das Projektil geradeaus weiter', () => {
    const g = newGame();
    const tid = place(g, 'ranger');
    g.apply({ type: 'target', towerId: tid, mode: 'first' });
    const a = g.sandbox.spawn('red', 52000);
    for (let i = 0; i < 30 && g.state.projectiles.length === 0; i++) g.step();
    expect(g.state.projectiles).toHaveLength(1);
    g.sandbox.hurt(a, 1); // Ziel stirbt im Flug
    expect(g.state.enemies).toHaveLength(0);
    const p = g.state.projectiles[0];
    const x0 = p.x, y0 = p.y;
    g.step();
    expect(g.state.projectiles).toHaveLength(1);
    expect(g.state.projectiles[0].x - x0).toBe(p.vx);
    expect(g.state.projectiles[0].y - y0).toBe(p.vy);
    // verfällt nach Lebensdauer (Reichweite x 1,5 / Tempo)
    g.step(200);
    expect(g.state.projectiles).toHaveLength(0);
  });
});

describe('Schichten', () => {
  it('Green -> Blue -> Red, Kinder erben Camo, Pop-Cash +2 je Schicht (popCash)', () => {
    const g = newGame({ mods: { startCash: 0 } });
    const e = g.sandbox.spawn('green', 300000, true);
    const c0 = g.state.cash;
    g.sandbox.hurt(e, 1);
    expect(g.state.enemies).toHaveLength(1);
    const blue = g.state.enemies[0];
    expect(blue.type).toBe('blue');
    expect(blue.camo).toBe(true);
    expect(g.state.cash - c0).toBe(2);
    g.sandbox.hurt(blue.id, 1);
    expect(g.state.enemies[0].type).toBe('red');
    expect(g.state.enemies[0].camo).toBe(true);
    expect(g.state.cash - c0).toBe(4);
  });

  it('Überschuss-Schaden geht an die Kinder', () => {
    const g = newGame();
    const e = g.sandbox.spawn('gold', 300000);
    g.sandbox.hurt(e, 2); // Gold (1) + Green (1) fallen, Blue bleibt mit... 2-1=1 Überschuss -> Green pop, Überschuss 0
    expect(g.state.enemies.map((x) => x.type)).toEqual(['blue']);
    const e2 = g.sandbox.spawn('gold', 300000);
    g.sandbox.hurt(e2, 4); // gold, green, blue, red -> alle weg
    expect(g.state.enemies.filter((x) => x.id > e2)).toHaveLength(0);
  });

  it('Überschuss: Gold mit 3 Schaden lässt ein Red übrig', () => {
    const g = newGame();
    const e = g.sandbox.spawn('gold', 300000);
    g.sandbox.hurt(e, 3);
    expect(g.state.enemies.map((x) => x.type)).toEqual(['red']);
  });

  it('Kinder sind auf dem Weg versetzt (±3 px)', () => {
    const g = newGame();
    const e = g.sandbox.spawn('ironshell', 300000);
    g.sandbox.hurt(e, 1);
    const kids = g.state.enemies;
    expect(kids.map((k) => k.type)).toEqual(['gold', 'gold']);
    expect(kids[0].progress).toBe(297000);
    expect(kids[1].progress).toBe(303000);
  });

  it('Boss: Überschuss geht nicht an die Kinder, Hülle +100 Cash', () => {
    const g = newGame();
    const e = g.sandbox.spawn('leviathan', 300000);
    const c0 = g.state.cash;
    g.sandbox.hurt(e, 5000);
    const kids = g.state.enemies;
    expect(kids.map((k) => k.type)).toEqual(['brute', 'brute', 'brute', 'brute']);
    expect(kids.every((k) => k.hp === 10)).toBe(true);
    expect(g.state.cash - c0).toBe(100);
  });

  it('Brute hat 10 HP und Risse bei 70 % und 40 %', () => {
    const g = newGame();
    const e = g.sandbox.spawn('brute', 300000);
    const en = g.state.enemies[0];
    g.sandbox.hurt(e, 3);
    expect(en.hp).toBe(7);
    expect(en.damageStage).toBe(1);
    g.sandbox.hurt(e, 3);
    expect(en.damageStage).toBe(2);
  });

  it('Boss-Platten fallen bei 75/50/25 % mit bossStage-Event', () => {
    const g = newGame();
    const e = g.sandbox.spawn('leviathan', 300000);
    const en = g.state.enemies[0];
    expect(en.maxHp).toBe(300);
    g.sandbox.hurt(e, 80);
    expect(en.damageStage).toBe(1);
    g.sandbox.hurt(e, 80);
    expect(en.damageStage).toBe(2);
    g.sandbox.hurt(e, 80);
    expect(en.damageStage).toBe(3);
    const stages = g.drainEvents().filter((x) => x.type === 'bossStage');
    expect(stages).toHaveLength(3);
  });

  it('Leck kostet die aktuelle RBE', () => {
    const g = newGame({ mods: { startCash: 0, lives: 0 } });
    const l0 = g.state.lives;
    const e = g.sandbox.spawn('ironshell', 1_649_000);
    g.step(30);
    expect(g.state.lives).toBe(l0 - 9);
    expect(g.state.enemies.find((x) => x.id === e)).toBeUndefined();
    // angeschlagene Brute: 10 HP - 4 = 6 + 18 Kinder = 24
    const b = g.sandbox.spawn('brute', 1_649_000);
    g.sandbox.hurt(b, 4);
    const l1 = g.state.lives;
    g.step(30);
    expect(l1 - g.state.lives).toBe(24);
  });
});

describe('Schadensarten und Immunitäten', () => {
  it('Ironshell prallt sharp ab, Explosion trifft', () => {
    const g = newGame();
    const e = g.sandbox.spawn('ironshell', 300000);
    expect(g.sandbox.hurt(e, 5, 'sharp')).toBe(false);
    expect(g.state.enemies[0].hp).toBe(1);
    expect(g.drainEvents().some((x) => x.type === 'blocked' && x.reason === 'armor')).toBe(true);
    for (const dt of ['explosive', 'magic', 'energy', 'cold'] as const) {
      const g2 = newGame();
      const e2 = g2.sandbox.spawn('ironshell', 300000);
      expect(g2.sandbox.hurt(e2, 1, dt)).toBe(true);
    }
  });

  it('Emberling ist kälteimmun, sonst verwundbar', () => {
    const g = newGame();
    const e = g.sandbox.spawn('ember', 300000);
    expect(g.sandbox.hurt(e, 5, 'cold')).toBe(false);
    expect(g.drainEvents().some((x) => x.type === 'blocked' && x.reason === 'immune')).toBe(true);
    for (const dt of ['sharp', 'explosive', 'magic', 'energy'] as const) {
      const g2 = newGame();
      const e2 = g2.sandbox.spawn('ember', 300000);
      expect(g2.sandbox.hurt(e2, 1, dt)).toBe(true);
    }
  });

  it('Ranger-Pfeile prallen an Ironshell ab, Sky Splitter (magic) nicht', () => {
    const g = newGame();
    place(g, 'ranger');
    g.sandbox.spawn('ironshell', 30000);
    const ev = run(g, 60);
    expect(ev.some((e) => e.type === 'blocked' && e.reason === 'armor')).toBe(true);
    expect(ev.some((e) => e.type === 'pop')).toBe(false);

    const g2 = newGame();
    const t = place(g2, 'ranger');
    buy(g2, t, [5, 0, 0]);
    g2.sandbox.spawn('ironshell', 30000);
    const ev2 = run(g2, 60);
    expect(ev2.some((e) => e.type === 'pop' && e.etype === 'ironshell')).toBe(true);
  });

  it('Frostbolzen verlangsamen, Emberling nicht', () => {
    const g = newGame();
    place(g, 'frostcaller');
    const e = g.sandbox.spawn('green', 30000);
    const em = g.sandbox.spawn('ember', 20000);
    run(g, 60);
    const green = g.state.enemies.find((x) => x.id === e);
    const ember = g.state.enemies.find((x) => x.id === em)!;
    expect(green === undefined || green.slowTicks > 0 || g.state.enemies.some((x) => x.type === 'blue')).toBe(true);
    expect(ember.slowTicks).toBe(0);
  });

  it('Eingefrorene nehmen keinen sharp-Schaden', () => {
    const g = newGame();
    const e = g.sandbox.spawn('green', 300000);
    g.state.enemies[0].frozenTicks = 100;
    expect(g.sandbox.hurt(e, 1, 'sharp')).toBe(false);
    expect(g.sandbox.hurt(e, 1, 'explosive')).toBe(true);
  });

  it('Brittle Ice: verlangsamte Gegner nehmen +1 Schaden', () => {
    const g = newGame();
    const e = g.sandbox.spawn('brute', 300000);
    const en = g.state.enemies[0];
    g.sandbox.hurt(e, 1);
    expect(en.hp).toBe(9);
    en.brittleTicks = 30;
    g.sandbox.hurt(e, 1);
    expect(en.hp).toBe(7);
  });

  it('Slow wird nicht an Kinder vererbt', () => {
    const g = newGame();
    const e = g.sandbox.spawn('green', 300000);
    const en = g.state.enemies[0];
    en.slowBp = 4500;
    en.slowTicks = 100;
    g.sandbox.hurt(e, 1);
    expect(g.state.enemies[0].type).toBe('blue');
    expect(g.state.enemies[0].slowTicks).toBe(0);
  });
});

describe('Camo und Targeting', () => {
  it('Ohne Erkennung wird Camo nicht anvisiert, mit Eagle Eye schon', () => {
    const g = newGame();
    const t = place(g, 'ranger');
    g.sandbox.spawn('red', 30000, true);
    expect(run(g, 40).some((e) => e.type === 'windup')).toBe(false);
    const g2 = newGame();
    const t2 = place(g2, 'ranger');
    buy(g2, t2, [0, 0, 2]);
    expect(g2.state.towers[0].camo).toBe(true);
    g2.sandbox.spawn('red', 30000, true);
    expect(run(g2, 40).some((e) => e.type === 'windup')).toBe(true);
    expect(t).toBe(t2);
  });

  it('Explosionen treffen Camo trotz fehlender Erkennung (anvisieren mit sichtbarem Gegner)', () => {
    const g = newGame();
    place(g, 'bombardier', 60, 122);
    g.sandbox.spawn('red', 40000, false);
    g.sandbox.spawn('red', 40000, true);
    g.sandbox.spawn('red', 41000, true);
    const ev = run(g, 200);
    const pops = ev.filter((e) => e.type === 'pop').length;
    expect(pops).toBeGreaterThanOrEqual(3);
  });

  it('Targeting first / last / strong / close', () => {
    const pick = (mode: 'first' | 'last' | 'strong' | 'close'): number => {
      const g = newGame();
      const t = place(g, 'frostcaller', 60, 122);
      g.apply({ type: 'target', towerId: t, mode });
      const ids = {
        redFront: g.sandbox.spawn('red', 100000),
        blueBack: g.sandbox.spawn('blue', 25000),
        brute: g.sandbox.spawn('brute', 55000),
      };
      const ev = run(g, 3).find((e) => e.type === 'windup');
      if (!ev || ev.type !== 'windup') throw new Error('kein windup');
      return ev.target === ids.redFront ? 0 : ev.target === ids.blueBack ? 1 : ev.target === ids.brute ? 2 : -1;
    };
    expect(pick('first')).toBe(0); // der vorderste (x≈100 px, y=92) liegt noch in Reichweite 72
    expect(pick('last')).toBe(1);
    expect(pick('strong')).toBe(2);
    expect(pick('close')).toBe(2); // brute bei x≈39 px/92 ist am nächsten zu (60,122)
  });
});
