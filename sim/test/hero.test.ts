import { describe, expect, it } from 'vitest';
import { createGame, DATA } from '../src/index';
import { buy, newGame, place, run } from './helpers';

describe('Held Wren', () => {
  it('einmal je Match, Preis 540, Grundwerte', () => {
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1 });
    const id = place(g, 'wren');
    expect(g.state.cash).toBe(110);
    const w = g.state.towers[0];
    expect(w.heroLevel).toBe(1);
    expect(w.range).toBe(84000);
    expect(w.camo).toBe(false);
    expect(g.canPlace('wren', 200000, 170000)).toEqual({ ok: false, reason: 'hero-limit' });
    expect(g.apply({ type: 'sell', towerId: id })).toEqual({ ok: false, reason: 'hero' });
    expect(g.upgradeInfo(id)).toEqual([]);
  });

  it('XP am Rundenende 100 + 30 x Runde, Level-Up-Events, Fähigkeit ab L3 mit voller Abklingzeit', () => {
    const g = newGame();
    place(g, 'wren');
    g.apply({ type: 'startRound' });
    const ev = run(g, 6000, () => g.state.roundsCleared === 1);
    expect(ev.find((e) => e.type === 'roundEnd')).toMatchObject({ round: 1, bonus: 101 });
    expect(g.state.towers[0].heroXp).toBe(130);
    expect(g.state.towers[0].heroLevel).toBe(2);
    expect(ev.some((e) => e.type === 'heroLevel' && e.level === 2)).toBe(true);
    expect(g.state.abilities).toHaveLength(0);
    g.apply({ type: 'startRound' });
    run(g, 8000, () => g.state.roundsCleared === 2);
    expect(g.state.towers[0].heroXp).toBe(130 + 160);
    expect(g.state.towers[0].heroLevel).toBe(3);
    expect(g.state.abilities).toEqual([{ id: 'flare', ready: false, cdLeft: 2400, cdTotal: 2400 }]);
  });

  it('Level-Schwellen und Boni: heroStartLevel', () => {
    const lv = (n: number) => {
      const g = newGame({ mods: { startCash: 100000, heroStartLevel: n } });
      place(g, 'wren');
      return g;
    };
    expect(lv(2).state.towers[0].range).toBe(92400);
    expect(lv(5).state.towers[0].camo).toBe(true);
    expect(lv(3).state.abilities.map((a) => a.id)).toEqual(['flare']);
    expect(lv(10).state.abilities.map((a) => a.id)).toEqual(['flare', 'dawnbreak']);
    expect(lv(10).state.abilities.find((a) => a.id === 'dawnbreak')).toMatchObject({ cdTotal: 3600, cdLeft: 3600, ready: false });
    expect(lv(15).state.abilities.find((a) => a.id === 'flare')).toMatchObject({ cdTotal: 1800 });
    expect(lv(20).state.abilities.find((a) => a.id === 'dawnbreak')).toMatchObject({ cdTotal: 2700 });
    expect(lv(20).state.towers[0].heroXp).toBe(DATA.hero.wren.levels[19].xp);
  });

  it('Level 12: Aura macht Türme im Umkreis 10 % schneller', () => {
    const count = (level: number): number => {
      const g = newGame({ mods: { startCash: 100000, heroStartLevel: level } });
      place(g, 'ranger', 60, 122);
      place(g, 'wren', 90, 130);
      for (let i = 0; i < 40; i++) g.sandbox.spawn('red', 30000 + i * 1000);
      // Pfeile gegen Ironshell sind nicht nötig: reds sterben; wir zählen Abschüsse des Rangers
      let n = 0;
      for (let i = 0; i < 600; i++) {
        g.step();
        for (const e of g.drainEvents()) if (e.type === 'fire' && e.tower === 1) n++;
      }
      return n;
    };
    expect(count(12)).toBeGreaterThan(count(11));
  });

  it('Flare: Abklingzeit startet voll, enttarnt Camo im Radius und macht Schaden', () => {
    const g = newGame({ mods: { startCash: 100000, heroStartLevel: 3 } });
    place(g, 'wren', 60, 122);
    const e = g.sandbox.spawn('brute', 40000, true);
    g.state.enemies[0].frozenTicks = 99999; // bleibt stehen
    expect(g.apply({ type: 'ability', ability: 'flare' })).toEqual({ ok: false, reason: 'cooldown' });
    g.state.towers[0].range; // Held ist noch ohne Erkennung (L5)
    g.step(2400);
    const en = g.state.enemies.find((x) => x.id === e)!;
    // brute wurde nicht anvisiert (camo) -> unversehrt
    expect(en.hp).toBe(10);
    expect(g.state.abilities[0].ready).toBe(true);
    const r = g.apply({ type: 'ability', ability: 'flare' });
    expect(r.ok).toBe(true);
    expect(en.revealed).toBe(true);
    expect(en.hp).toBe(5);
    expect(g.state.abilities[0]).toMatchObject({ ready: false, cdLeft: 2400 });
    expect(g.apply({ type: 'ability', ability: 'flare' })).toEqual({ ok: false, reason: 'cooldown' });
  });

  it('Dawnbreak: 20 Schaden an allem, 100 am Boss', () => {
    const g = newGame({ mods: { startCash: 100000, heroStartLevel: 10 } });
    place(g, 'wren', 60, 122);
    const brute = g.sandbox.spawn('brute', 700000);
    const boss = g.sandbox.spawn('leviathan', 900000);
    const red = g.sandbox.spawn('green', 800000);
    for (const e of g.state.enemies) e.frozenTicks = 99999;
    expect(g.apply({ type: 'ability', ability: 'dawnbreak' })).toEqual({ ok: false, reason: 'cooldown' });
    g.step(3600);
    expect(g.state.abilities.find((a) => a.id === 'dawnbreak')!.ready).toBe(true);
    expect(g.apply({ type: 'ability', ability: 'dawnbreak' }).ok).toBe(true);
    expect(g.state.enemies.find((e) => e.id === brute)).toBeUndefined();
    expect(g.state.enemies.find((e) => e.id === red)).toBeUndefined();
    expect(g.state.enemies.find((e) => e.id === boss)!.hp).toBe(200); // 100 von 300
    expect(g.state.enemies.filter((e) => e.type === 'brute')).toHaveLength(0);
  });

  it('Held-Feuer: Brand ab L8', () => {
    const g = newGame({ mods: { startCash: 100000, heroStartLevel: 8 } });
    place(g, 'wren', 60, 122);
    g.sandbox.spawn('brute', 40000);
    const ev = run(g, 300);
    expect(ev.some((e) => e.type === 'status' && e.kind === 'burn')).toBe(true);
  });
});

describe('Fähigkeiten', () => {
  it('Arrow Rain: ab Ranger B4, Abklingzeit startet voll, 3x Angriffstempo für 6 s', () => {
    const shots = (rain: boolean): number => {
      const g = newGame();
      const id = place(g, 'ranger', 60, 122);
      buy(g, id, [0, 4, 0]);
      expect(g.state.abilities).toEqual([{ id: 'arrowRain', ready: false, cdLeft: 3000, cdTotal: 3000 }]);
      expect(g.apply({ type: 'ability', ability: 'arrowRain' })).toEqual({ ok: false, reason: 'cooldown' });
      g.step(3000);
      expect(g.state.abilities[0].ready).toBe(true);
      for (let i = 0; i < 200; i++) g.sandbox.spawn('red', 20000 + i * 500);
      if (rain) expect(g.apply({ type: 'ability', ability: 'arrowRain' }).ok).toBe(true);
      let n = 0;
      for (let i = 0; i < 240; i++) {
        g.step();
        for (const e of g.drainEvents()) if (e.type === 'fire') n++;
      }
      return n;
    };
    expect(shots(true)).toBeGreaterThan(shots(false) * 2.3);
  });

  it('Absolute Zero: friert alles ein (Boss 1,5 s), Emberlinge nicht', () => {
    const g = newGame();
    const id = place(g, 'frostcaller', 60, 122);
    buy(g, id, [5, 0, 0]);
    expect(g.state.abilities).toEqual([{ id: 'absoluteZero', ready: false, cdLeft: 2700, cdTotal: 2700 }]);
    g.step(2700);
    const a = g.sandbox.spawn('green', 900000);
    const b = g.sandbox.spawn('leviathan', 800000);
    const c = g.sandbox.spawn('ember', 700000);
    expect(g.apply({ type: 'ability', ability: 'absoluteZero' }).ok).toBe(true);
    const f = (i: number) => g.state.enemies.find((e) => e.id === i)!;
    expect(f(a).frozenTicks).toBe(240);
    expect(f(b).frozenTicks).toBe(90);
    expect(f(c).frozenTicks).toBe(0);
    const p0 = f(a).progress;
    g.step(10);
    expect(f(a).progress).toBe(p0);
    expect(g.apply({ type: 'ability', ability: 'absoluteZero' })).toEqual({ ok: false, reason: 'cooldown' });
  });

  it('Verkauf des einzigen Besitzers entfernt die Fähigkeit', () => {
    const g = newGame();
    const id = place(g, 'ranger');
    buy(g, id, [0, 4, 0]);
    expect(g.state.abilities).toHaveLength(1);
    g.apply({ type: 'sell', towerId: id });
    expect(g.state.abilities).toHaveLength(0);
    expect(g.apply({ type: 'ability', ability: 'arrowRain' })).toEqual({ ok: false, reason: 'no-ability' });
  });
});
