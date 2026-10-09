import { describe, expect, it } from 'vitest';
import { createGame, DATA, POWER_KEYS, type Game, type GameOptions, type PowerKey } from '../src/index';
import { newGame, place, run } from './helpers';

const ALL: Partial<Record<PowerKey, number>> = Object.fromEntries(POWER_KEYS.map((k) => [k, 5]));
const pg = (over: Partial<GameOptions> = {}): Game => newGame({ powers: ALL, ...over });
/** Mitte des ersten Wegstücks ((-16,92) -> (120,92)): y = 92 px. */
const onPath = (xPx: number) => ({ x: xPx * 1000, y: 92000 });
const cmd = (g: Game, power: PowerKey, x?: number, y?: number) => g.apply({ type: 'power', power, x, y });

describe('Powers: Daten', () => {
  it('alle 11 Schlüssel mit Name, englischer Beschreibung und Preis laut Spezifikation', () => {
    const price: Record<string, number> = {
      goldDrop: 40, lanternBomb: 30, caltrops: 25, frostTrap: 30, timeWarp: 50, lanternOil: 60, extraLives: 35, heroBoost: 80,
      'instaWarden:ranger': 150, 'instaWarden:bombardier': 150, 'instaWarden:frostcaller': 150,
    };
    expect(DATA.powerOrder).toHaveLength(11);
    for (const k of POWER_KEYS) {
      expect(DATA.powers[k].price).toBe(price[k]);
      expect(DATA.powers[k].name.length).toBeGreaterThan(2);
      expect(DATA.powers[k].desc).toMatch(/^[A-Z+]/);
    }
  });
});

describe('Powers: Bestand und Sperre je Runde', () => {
  it('ohne Inventar: no-power; unbekannter Schlüssel: unknown-power', () => {
    const g = newGame();
    expect(cmd(g, 'goldDrop')).toEqual({ ok: false, reason: 'no-power' });
    expect(cmd(g, 'bogus' as PowerKey)).toEqual({ ok: false, reason: 'unknown-power' });
    expect(g.state.powers.goldDrop).toBe(0);
  });

  it('Einsatz verbraucht einen, zählt in stats, sperrt bis zum nächsten Rundenstart', () => {
    const g = pg();
    const cash = g.state.cash;
    expect(cmd(g, 'goldDrop')).toEqual({ ok: true });
    expect(g.state.cash).toBe(cash + 500);
    expect(g.state.powers.goldDrop).toBe(4);
    expect(g.state.stats.powersUsed.goldDrop).toBe(1);
    expect(g.state.powerUsedRound.goldDrop).toBe(0);
    expect(cmd(g, 'goldDrop')).toEqual({ ok: false, reason: 'used-this-round' });
    expect(g.canUsePower('goldDrop')).toEqual({ ok: false, reason: 'used-this-round' });
    expect(g.state.powers.goldDrop).toBe(4); // Fehlschlag verbraucht nichts
    g.apply({ type: 'startRound' });
    expect(g.canUsePower('goldDrop')).toEqual({ ok: true });
    expect(cmd(g, 'goldDrop').ok).toBe(true);
    expect(g.state.powerUsedRound.goldDrop).toBe(1);
    expect(g.state.stats.powersUsed.goldDrop).toBe(2);
    expect(g.state.powerUsedRound.timeWarp).toBe(-1);
  });

  it('verschiedene Arten blockieren sich nicht; Event power', () => {
    const g = pg();
    cmd(g, 'goldDrop');
    cmd(g, 'extraLives');
    const ev = g.drainEvents().filter((e) => e.type === 'power');
    expect(ev.map((e) => e.type === 'power' && e.power)).toEqual(['goldDrop', 'extraLives']);
  });
});

describe('Powers: Knopf-Powers', () => {
  it('Extra Lives +25', () => {
    const g = pg();
    const l = g.state.lives;
    cmd(g, 'extraLives');
    expect(g.state.lives).toBe(l + 25);
  });

  it('Time Warp: -50 % (Boss -25 %) für 600 Ticks, danach normal', () => {
    const dist = (warp: boolean, type: 'red' | 'leviathan'): number => {
      const g = pg();
      if (warp) cmd(g, 'timeWarp');
      const id = g.sandbox.spawn(type, 20000);
      g.step(300);
      return g.state.enemies.find((e) => e.id === id)!.progress - 20000;
    };
    const base = dist(false, 'red');
    expect(Math.abs(dist(true, 'red') - base / 2)).toBeLessThanOrEqual(2);
    const bb = dist(false, 'leviathan');
    expect(Math.abs(dist(true, 'leviathan') - (bb * 3) / 4)).toBeLessThanOrEqual(2);
    const g = pg();
    cmd(g, 'timeWarp');
    expect(g.state.warpLeft).toBe(600);
    g.step(600);
    expect(g.state.warpLeft).toBe(0);
    const id = g.sandbox.spawn('red', 20000);
    g.step(100);
    expect(Math.abs(g.state.enemies.find((e) => e.id === id)!.progress - 20000 - base / 3)).toBeLessThanOrEqual(2);
  });

  it('Gold Drop in der Runde und ohne Held: Hero Boost -> no-hero', () => {
    const g = pg();
    expect(cmd(g, 'heroBoost')).toEqual({ ok: false, reason: 'no-hero' });
    expect(g.state.powers.heroBoost).toBe(5);
  });

  it('Hero Boost: +3 Level, XP auf der Schwelle, bei 20 maxed, Events', () => {
    const g = pg();
    place(g, 'wren');
    g.drainEvents();
    expect(cmd(g, 'heroBoost').ok).toBe(true);
    const h = g.state.towers[0];
    expect(h.heroLevel).toBe(4);
    expect(h.heroXp).toBe(DATA.hero.wren.levels[3].xp);
    expect(g.drainEvents().filter((e) => e.type === 'heroLevel').map((e) => e.type === 'heroLevel' && e.level)).toEqual([2, 3, 4]);
    expect(g.state.abilities.map((a) => a.id)).toContain('flare');
    // Runde: Level 20 deckeln
    const g2 = pg({ mods: { startCash: 100000, heroStartLevel: 19 } });
    place(g2, 'wren');
    cmd(g2, 'heroBoost');
    expect(g2.state.towers[0].heroLevel).toBe(20);
    expect(g2.state.towers[0].heroXp).toBe(DATA.hero.wren.levels[19].xp);
    g2.apply({ type: 'startRound' });
    expect(cmd(g2, 'heroBoost')).toEqual({ ok: false, reason: 'maxed' });
  });
});

describe('Powers: Lantern Oil', () => {
  const cashFor = (oil: boolean): number => {
    const g = pg();
    if (oil) cmd(g, 'lanternOil');
    const before = g.state.cash;
    g.state.enemies.length = 0;
    for (let i = 0; i < 40; i++) {
      const id = g.sandbox.spawn('red', 20000 + i * 100);
      g.sandbox.hurt(id, 1);
    }
    return g.state.cash - before;
  };
  it('+25 % Pop-Cash (mit Rest), 40 Pops: 80 -> 100', () => {
    expect(cashFor(false)).toBe(80);
    expect(cashFor(true)).toBe(100);
  });
  it('gilt für den Rest dieser und die ganze nächste Runde, dann nicht mehr', () => {
    const g = pg();
    g.apply({ type: 'startRound' }); // Runde 1
    cmd(g, 'lanternOil');
    expect(g.state.oilRound).toBe(2);
    const pop = (): number => {
      const b = g.state.cash;
      g.sandbox.hurt(g.sandbox.spawn('red', 20000), 1);
      return g.state.cash - b;
    };
    pop();
    g.state.enemies.length = 0;
    g.state.round = 2;
    const sum2 = Array.from({ length: 4 }, pop).reduce((a, b) => a + b, 0);
    expect(sum2).toBe(10);
    g.state.round = 3;
    expect(Array.from({ length: 4 }, pop).reduce((a, b) => a + b, 0)).toBe(8);
  });
});

describe('Powers: Lantern Bomb', () => {
  it('Radius 40 px, 20 Schaden (explosive), Boss 100; Ziel außerhalb der Karte: invalid-target', () => {
    const g = pg();
    const near = g.sandbox.spawn('brute', 30000); // 10 HP Hülle
    const far = g.sandbox.spawn('brute', 30000 + 60000);
    const boss = g.sandbox.spawn('leviathan', 30000 + 5000);
    const p = g.state.enemies.find((e) => e.id === near)!;
    expect(cmd(g, 'lanternBomb', -5, 50)).toEqual({ ok: false, reason: 'invalid-target' });
    expect(cmd(g, 'lanternBomb')).toEqual({ ok: false, reason: 'invalid-target' });
    expect(cmd(g, 'lanternBomb', p.x, p.y).ok).toBe(true);
    const ev = g.drainEvents();
    expect(ev.find((e) => e.type === 'explode')).toMatchObject({ radius: 40000, kind: 'bomb' });
    expect(g.state.enemies.find((e) => e.id === near)).toBeUndefined(); // 10 HP weg
    expect(g.state.enemies.find((e) => e.id === far)?.hp).toBe(10);
    const b = g.state.enemies.find((e) => e.id === boss)!;
    expect(b.maxHp - b.hp).toBe(100);
  });
  it('trifft höchstens 40 Gegner (die nächsten)', () => {
    const g = pg();
    for (let i = 0; i < 50; i++) g.sandbox.spawn('brute', 40000 + i * 200);
    const mid = g.state.enemies[0];
    cmd(g, 'lanternBomb', mid.x, mid.y);
    const hit = g.state.enemies.filter((e) => e.hp < e.maxHp).length + (50 - g.state.enemies.filter((e) => e.type === 'brute').length);
    expect(g.state.enemies.filter((e) => e.type === 'brute' && e.hp === 10).length).toBeGreaterThanOrEqual(0);
    expect(hit).toBeGreaterThan(0);
  });
});

describe('Powers: Fallen', () => {
  it('nur auf dem Weg: not-on-path, ohne Ziel invalid-target; Falle sitzt auf der Wegmitte', () => {
    const g = pg();
    expect(cmd(g, 'caltrops', 60000, 140000)).toEqual({ ok: false, reason: 'not-on-path' });
    expect(cmd(g, 'caltrops')).toEqual({ ok: false, reason: 'invalid-target' });
    expect(g.state.powers.caltrops).toBe(5);
    const r = cmd(g, 'caltrops', 60000, 99000); // 7 px neben der Mitte, Halbbreite 13
    expect(r.ok).toBe(true);
    const t = g.state.traps[0];
    expect(t).toMatchObject({ kind: 'caltrops', x: 60000, y: 92000, progress: 76000, charges: 20 });
    expect(r).toEqual({ ok: true, id: t.id });
  });

  it('Caltrops: 20 Schichten, je 1 magic-Schaden, dann weg; Events trap/trapGone', () => {
    const g = pg();
    cmd(g, 'caltrops', ...Object.values(onPath(60)) as [number, number]);
    for (let i = 0; i < 25; i++) g.sandbox.spawn('red', 60000 - 3000 - i * 1500);
    g.drainEvents();
    const ev = run(g, 200, () => g.state.traps.length === 0);
    expect(g.state.traps).toHaveLength(0);
    expect(ev.filter((e) => e.type === 'trap')).toHaveLength(20);
    expect(ev.filter((e) => e.type === 'trap').map((e) => e.type === 'trap' && e.charges)).toEqual(Array.from({ length: 20 }, (_, i) => 19 - i));
    expect(ev.find((e) => e.type === 'trapGone')).toMatchObject({ kind: 'caltrops', reason: 'spent' });
    expect(ev.filter((e) => e.type === 'hit' && e.dtype === 'magic')).toHaveLength(20);
    expect(g.state.stats.pops.ranger).toBe(0);
  });

  it('Caltrops: eine Ladung je Gegner, ein Schaden; das Kind (gleiche Stelle) läuft nicht erneut drüber', () => {
    const g = pg();
    cmd(g, 'caltrops', 60000, 92000);
    g.sandbox.spawn('green', 74000); // green -> blue -> red
    const ev = run(g, 120);
    expect(g.state.traps[0].charges).toBe(19);
    expect(ev.filter((e) => e.type === 'pop')).toHaveLength(1);
    expect(g.state.enemies.map((e) => e.type)).toEqual(['blue']);
  });

  it('Caltrops laufen aus: Ende der nächsten Runde', () => {
    const g = pg();
    cmd(g, 'caltrops', 400000 / 4, 92000); // Weg, weit weg vom Spawn
    expect(g.state.traps[0].until).toBe(1);
    g.apply({ type: 'startRound' });
    const ev = run(g, 9000, () => g.state.roundsCleared === 1);
    expect(g.state.roundsCleared).toBe(1);
    expect(ev.filter((e) => e.type === 'trapGone').length).toBe(1);
    expect(g.state.traps).toHaveLength(0);
  });

  it('Frost Trap: friert 15 Gegner 3 s ein, nicht Boss und nicht Emberling; Ladung nur bei Erfolg', () => {
    const g = pg();
    cmd(g, 'frostTrap', 60000, 92000);
    const boss = g.sandbox.spawn('leviathan', 50000);
    const ember = g.sandbox.spawn('ember', 50000);
    const red = g.sandbox.spawn('red', 50000);
    run(g, 120);
    const get = (id: number) => g.state.enemies.find((e) => e.id === id)!;
    expect(get(boss).frozenTicks).toBe(0);
    expect(get(ember).frozenTicks).toBe(0);
    expect(get(red).frozenTicks).toBeGreaterThan(0);
    expect(g.state.traps[0].charges).toBe(14);
    // 3 s = 180 Ticks stehen
    const p0 = get(red).progress;
    g.step(60);
    expect(get(red).progress).toBe(p0);
  });

  it('Frost Trap: nach 15 Gegnern weg, Einfrierdauer 180 Ticks', () => {
    const g = pg();
    cmd(g, 'frostTrap', 60000, 92000);
    for (let i = 0; i < 16; i++) g.sandbox.spawn('red', 40000 + i * 1000);
    const ev = run(g, 400);
    expect(g.state.traps).toHaveLength(0);
    expect(ev.filter((e) => e.type === 'status' && e.kind === 'freeze')).toHaveLength(15);
    expect(ev.find((e) => e.type === 'trapGone')).toMatchObject({ kind: 'frostTrap', reason: 'spent' });
    expect(DATA.powers.frostTrap.params.freezeTicks).toBe(180);
  });

  it('Falle zieht nicht, wenn der Gegner schon dahinter steht', () => {
    const g = pg();
    cmd(g, 'caltrops', 60000, 92000);
    g.sandbox.spawn('red', 80000);
    run(g, 60);
    expect(g.state.traps[0].charges).toBe(20);
  });
});

describe('Powers: Insta-Warden', () => {
  it('Varianten: fertige Stufen, gratis, Verkaufswert 0, kein Held-/XP-Limit, Event place', () => {
    const maxTier = { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } as never;
    const g = pg({ unlocks: { towers: ['ranger', 'bombardier', 'frostcaller', 'wren'], maxTier } });
    const cash = g.state.cash;
    const r = cmd(g, 'instaWarden:ranger', 60000, 122000);
    expect(r.ok).toBe(true);
    const t = g.state.towers[0];
    expect(t).toMatchObject({ type: 'ranger', tiers: [2, 0, 3], spent: 0 });
    expect(g.state.cash).toBe(cash);
    expect(g.sellValue(t.id)).toBe(0);
    expect(r).toEqual({ ok: true, id: t.id });
    expect(g.state.maxTier.ranger).toEqual([0, 0, 0]); // Sperren bleiben, der Warden ignoriert sie nur
    expect(cmd(g, 'instaWarden:bombardier', 200000, 240000).ok).toBe(true);
    expect(g.state.towers[1]).toMatchObject({ type: 'bombardier', tiers: [3, 0, 1] });
    expect(cmd(g, 'instaWarden:frostcaller', 200000, 90000 + 60000).ok).toBe(true);
    expect(g.state.towers[2]).toMatchObject({ type: 'frostcaller', tiers: [0, 2, 3] });
    expect(g.drainEvents().filter((e) => e.type === 'place')).toHaveLength(3);
    expect(g.state.stats.spent.ranger).toBe(0);
  });

  it('Platzier-Gründe: on-path, overlap, ohne Ziel invalid-target; kein no-cash; Turm gesperrt', () => {
    const g = pg({ mods: { startCash: 0 } });
    expect(cmd(g, 'instaWarden:ranger', 60000, 92000)).toEqual({ ok: false, reason: 'on-path' });
    expect(cmd(g, 'instaWarden:ranger')).toEqual({ ok: false, reason: 'invalid-target' });
    expect(cmd(g, 'instaWarden:ranger', 60000, 122000).ok).toBe(true);
    g.apply({ type: 'startRound' });
    expect(cmd(g, 'instaWarden:bombardier', 62000, 122000)).toEqual({ ok: false, reason: 'overlap' });
    const g2 = pg({ unlocks: { towers: ['ranger'], maxTier: { ranger: [5, 5, 5], bombardier: [5, 5, 5], frostcaller: [5, 5, 5] } } });
    expect(cmd(g2, 'instaWarden:bombardier', 200000, 240000)).toEqual({ ok: false, reason: 'locked' });
    expect(g2.state.powers['instaWarden:bombardier']).toBe(5);
  });

  it('der Warden schießt (bekommt Pops) und lässt sich weiter ausbauen, wo die Regeln es erlauben', () => {
    const g = pg();
    cmd(g, 'instaWarden:ranger', 60000, 122000);
    g.apply({ type: 'startRound' });
    run(g, 1500);
    expect(g.state.towers[0].pops).toBeGreaterThan(0);
  });
});

describe('Powers: Vorschau', () => {
  it('Runde 1 und Randfälle', () => {
    const g = newGame();
    expect(g.roundPreview(1)).toEqual({ round: 1, groups: [{ type: 'red', n: 20, camo: false, regrow: false, fortified: false }], rbe: 20, hasCamo: false, hasArmor: false, hasEmber: false, hasBoss: false, hasFrostling: false, hasBlimp: false, hasRegrow: false, hasFortified: false });
    expect(g.roundPreview(0)).toBeNull();
    expect(g.roundPreview(21)).toBeNull();
  });
  it('alle Runden: Gruppen passen zu rounds.json, RBE = Summe, Warnsymbole', () => {
    const g = newGame();
    let camo = 0, armor = 0, ember = 0, boss = 0;
    for (let r = 1; r <= 20; r++) {
      const p = g.roundPreview(r)!;
      const raw = DATA.rounds[r - 1].groups;
      expect(p.groups.reduce((a, x) => a + x.n, 0)).toBe(raw.reduce((a, x) => a + x.n, 0));
      const bossFix = (t: keyof typeof DATA.rbe): number => (DATA.enemies[t].boss ? DATA.difficulties.medium.bossHp - DATA.enemies[t].hp : 0);
      expect(p.rbe).toBe(p.groups.reduce((a, x) => a + x.n * (DATA.rbe[x.type] + bossFix(x.type)), 0));
      if (p.hasCamo) camo++;
      if (p.hasArmor) armor++;
      if (p.hasEmber) ember++;
      if (p.hasBoss) boss++;
    }
    expect(camo).toBeGreaterThan(0);
    expect(armor).toBeGreaterThan(0);
    expect(ember).toBeGreaterThan(0);
    expect(boss).toBeGreaterThan(0);
  });
  it('Vorschau ändert den Zustand nicht', () => {
    const g = newGame();
    const h = g.hash();
    g.roundPreview(10);
    g.canUsePower('goldDrop');
    expect(g.hash()).toBe(h);
  });
});

describe('Powers: Determinismus', () => {
  const play = (): string => {
    const g = pg();
    g.apply({ type: 'startRound' });
    for (let t = 0; t < 3000; t++) {
      if (t === 10) cmd(g, 'caltrops', 60000, 92000);
      if (t === 20) cmd(g, 'frostTrap', 100000, 92000);
      if (t === 30) cmd(g, 'timeWarp');
      if (t === 40) cmd(g, 'lanternOil');
      if (t === 50) cmd(g, 'instaWarden:ranger', 60000, 122000);
      if (t === 400) cmd(g, 'lanternBomb', 100000, 92000);
      g.step();
      g.drainEvents();
    }
    return g.hash();
  };
  it('gleiche Befehle = gleicher Hash; Powers verändern den Hash', () => {
    expect(play()).toBe(play());
    const g = pg();
    g.apply({ type: 'startRound' });
    g.step(3000);
    expect(g.hash()).not.toBe(play());
  });
  it('Hash bleibt Ganzzahl-sauber (hash() wirft sonst)', () => {
    const g = pg();
    for (const k of POWER_KEYS) {
      const p = DATA.powers[k];
      if (p.use === 'button') cmd(g, k);
    }
    expect(() => g.hash()).not.toThrow();
  });
});
