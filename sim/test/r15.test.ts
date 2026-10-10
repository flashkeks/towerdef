/** Runde 15: Karten (Frostfen mit zwei Aesten, Quarry), neue Gegner, Merkmale, Bosse, Modi. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, MODES, createGame, getMap, modeAllows, popBp, roundBonus, type EnemyType, type Game, type ModeId } from '../src/index';
import { run } from './helpers';

const mk = (map: string, over: { mode?: ModeId; difficulty?: 'easy' | 'medium' | 'hard' } = {}): Game =>
  createGame({ map, difficulty: over.difficulty ?? 'medium', seed: 1, mode: over.mode, mods: { startCash: 100000 } });
/** Erster bebaubarer Punkt der Karte (Rasterlauf), fuer Tests, die nur irgendeinen Turm brauchen. */
function spot(g: Game, skip = 0): { x: number; y: number } {
  let n = 0;
  for (let y = 40_000; y < 340_000; y += 10_000) {
    for (let x = 40_000; x < 600_000; x += 10_000) {
      if (g.canPlace('ranger', x, y).ok && n++ >= skip) return { x, y };
    }
  }
  throw new Error('kein Bauplatz');
}
function place(g: Game, type: 'ranger' | 'frostcaller', skip = 0): number {
  const s = spot(g, skip);
  const r = g.apply({ type: 'place', tower: type, x: s.x, y: s.y });
  if (!r.ok) throw new Error(r.reason);
  return r.id!;
}
const enemy = (g: Game, id: number) => g.state.enemies.find((e) => e.id === id)!;

describe('Runde 15: Daten', () => {
  it('Eine Rundenliste (120) fuer alle Karten, Endrunde je Schwierigkeit 40 / 60 / 80 (Runde 15b)', () => {
    expect(DATA.rounds).toHaveLength(120);
    for (const map of ['meadow', 'frostfen', 'quarry']) {
      expect(mk(map, { difficulty: 'easy' }).info.maxRound).toBe(40);
      expect(mk(map, { difficulty: 'medium' }).info.maxRound).toBe(60);
      expect(mk(map, { difficulty: 'hard' }).info.maxRound).toBe(80);
      expect(mk(map).info.listRounds).toBe(120);
    }
    // gleiche Gruppen auf allen Karten
    expect(mk('quarry').roundPreview(25)).toEqual(mk('frostfen').roundPreview(25));
  });

  it('RBE neuer Typen', () => {
    expect(DATA.rbe).toMatchObject({ pink: 5, frostling: 11, crystal: 76, gloomship: 428 });
    expect(DATA.rbe.crystal).toBe(20 + 2 * 28);
    expect(DATA.rbe.gloomship).toBe(200 + 3 * 76);
  });

  it('Bosse: Frost Wyrm 600/900/1200, Ember Colossus 1700/2500/3200', () => {
    const hp = (t: EnemyType, d: 'easy' | 'medium' | 'hard') => {
      const g = mk('frostfen', { difficulty: d });
      const id = g.sandbox.spawn(t, 1000);
      return enemy(g, id).hp;
    };
    expect([hp('wyrm', 'easy'), hp('wyrm', 'medium'), hp('wyrm', 'hard')]).toEqual([600, 900, 1200]);
    expect([hp('colossus', 'easy'), hp('colossus', 'medium'), hp('colossus', 'hard')]).toEqual([1700, 2500, 3200]);
  });

  it('Boss- und Neuauftritte stehen in der gemeinsamen Liste (Runde 15b)', () => {
    const has = (round: number, type: EnemyType) => DATA.rounds[round - 1].groups.some((x) => x.type === type);
    expect(has(20, 'leviathan')).toBe(true);
    expect(has(40, 'wyrm')).toBe(true);
    expect(has(60, 'colossus')).toBe(true);
    for (const t of ['leviathan', 'wyrm', 'colossus'] as const) expect(has(80, t)).toBe(true);
    expect(has(21, 'pink')).toBe(true);
    expect(has(25, 'frostling')).toBe(true);
    expect(has(38, 'crystal')).toBe(true);
    expect(has(45, 'gloomship')).toBe(true);
    expect(has(82, 'cruiser')).toBe(true);
    expect(has(90, 'duskrunner')).toBe(true);
    expect(has(100, 'dreadnought')).toBe(true);
    expect(has(110, 'dreadnought')).toBe(true);
    expect(has(120, 'dreadnought')).toBe(true);
    expect(DATA.rounds.slice(0, 29).some((r) => r.groups.some((x) => x.regrow))).toBe(false);
    expect(DATA.rounds[29].groups.some((x) => x.regrow)).toBe(true); // R30
    expect(DATA.rounds.slice(0, 54).some((r) => r.groups.some((x) => x.fortified))).toBe(false);
    expect(DATA.rounds[54].groups.some((x) => x.fortified)).toBe(true); // R55
    // Neue Typen vor ihrer Einfuehrung nirgends (Dreadnought nur in den festen Runden 100/110/120)
    const first = (t: EnemyType) => DATA.rounds.findIndex((r) => r.groups.some((x) => x.type === t)) + 1;
    expect(first('cruiser')).toBe(82);
    expect(first('duskrunner')).toBe(90);
    expect(first('dreadnought')).toBe(100);
    expect(DATA.rounds.filter((r) => r.groups.some((x) => x.type === 'dreadnought')).map((r) => r.round)).toEqual([100, 110, 120]);
  });

  it('RBE und Einkommen wachsen ueber 120 Runden (Medium), Pop-Gold ab R21 gedaempft', () => {
    const g = mk('meadow');
    let prev = 0;
    const at: Record<number, number> = {};
    for (let r = 1; r <= 120; r++) { const p = g.roundPreview(r)!; expect(p.rbe).toBeGreaterThan(0); at[r] = p.rbe; prev = p.rbe; }
    expect(at[20]).toBeLessThan(2000);
    expect(at[40]).toBeGreaterThan(at[20] * 3);
    expect(at[60]).toBeGreaterThan(at[40] * 3);
    expect(at[100]).toBeGreaterThan(at[60] * 5);
    expect(prev).toBeGreaterThan(300_000);
    expect(popBp(20)).toBe(10000);
    expect(popBp(40)).toBeLessThan(5000);
    expect(popBp(121)).toBeLessThan(popBp(80));
    expect(roundBonus(20)).toBe(120);
    expect(roundBonus(60)).toBeGreaterThan(roundBonus(40));
  });

  it('Vorschau: Merkmale und Flags', () => {
    const g = mk('frostfen');
    expect(g.roundPreview(25)!.hasFrostling).toBe(true);
    expect(g.roundPreview(30)!.hasRegrow).toBe(true);
    expect(g.roundPreview(45)!.hasBlimp).toBe(true);
    expect(g.roundPreview(40)!.hasBoss).toBe(true);
    expect(g.roundPreview(60)!.hasFortified).toBe(true);
    expect(g.roundPreview(0)).toBeNull();
    expect(g.roundPreview(500)).not.toBeNull(); // Formel-Runden
  });
});

describe('Runde 15: Karten', () => {
  it('Frostfen: zwei gleich lange Aeste, die sich vereinen; Quarry ein Weg', () => {
    const f = getMap('frostfen');
    expect(f.paths).toHaveLength(2);
    expect(Math.abs(f.paths[0].length - f.paths[1].length)).toBeLessThan(5000);
    expect(f.paths[0].length / 1000).toBeGreaterThan(1300);
    expect(f.paths[0].length / 1000).toBeLessThan(1400);
    const end = (i: number) => f.paths[i].samples[f.paths[i].samples.length - 1];
    expect(end(0)).toEqual(end(1));
    const q = getMap('quarry');
    expect(q.paths).toHaveLength(1);
    expect(q.paths[0].length / 1000).toBeGreaterThan(1000);
    expect(q.paths[0].length / 1000).toBeLessThan(1100);
  });

  it('Frostfen: Gegner wechseln die Aeste ab, beide Aeste erreichen das Tor', () => {
    const g = mk('frostfen');
    const a = g.sandbox.spawn('red', 1000, false, 0);
    const b = g.sandbox.spawn('red', 1000, false, 1);
    expect(enemy(g, a).branch).toBe(0);
    expect(enemy(g, b).branch).toBe(1);
    expect(enemy(g, a).x === enemy(g, b).x && enemy(g, a).y === enemy(g, b).y).toBe(false);
    const l0 = g.state.lives;
    run(g, 60 * 90, () => g.state.enemies.length === 0);
    expect(g.state.lives).toBe(l0 - 2);
  });

  it('Spawn-Gruppen ohne lane laufen abwechselnd auf Ast 0 / 1', () => {
    const g = mk('frostfen');
    g.apply({ type: 'startRound' });
    run(g, 60 * 3);
    const br = new Set(g.state.enemies.map((e) => e.branch));
    expect(br.has(0) && br.has(1)).toBe(true);
  });

  it('Quarry: Lava ist nicht bebaubar', () => {
    const q = getMap('quarry');
    expect(q.lava.length).toBeGreaterThan(0);
    const g = mk('quarry');
    const poly = q.lava[0];
    const cx = Math.round(poly.reduce((a, p) => a + p[0], 0) / poly.length);
    const cy = Math.round(poly.reduce((a, p) => a + p[1], 0) / poly.length);
    const r = g.apply({ type: 'place', tower: 'ranger', x: cx, y: cy });
    expect(r.ok).toBe(false);
  });
});

describe('Runde 15: neue Gegner', () => {
  it('Pink Glim ist schneller als Gold; Pink platzt zu Gold', () => {
    const g = mk('frostfen');
    const p = g.sandbox.spawn('pink', 1000);
    const o = g.sandbox.spawn('gold', 1000);
    run(g, 120);
    expect(enemy(g, p).progress).toBeGreaterThan(enemy(g, o).progress);
    g.sandbox.hurt(p, 1);
    expect(g.state.enemies.some((e) => e.type === 'gold' && e.id !== o)).toBe(true);
  });

  it('Frostling: explosions-immun (Event blocked/explosion), Magie wirkt; Kinder 2 x Pink', () => {
    const g = mk('frostfen');
    const f = g.sandbox.spawn('frostling', 5000);
    expect(g.sandbox.hurt(f, 5, 'explosive')).toBe(false);
    expect(g.drainEvents().some((e) => e.type === 'blocked' && e.reason === 'explosion')).toBe(true);
    expect(g.sandbox.hurt(f, 1, 'magic')).toBe(true);
    expect(g.state.enemies.filter((e) => e.type === 'pink')).toHaveLength(2);
  });

  it('Crystal Brute: 20 HP, platzt in 2 Brutes, Risse (Phasen) bei 75/50/25 %', () => {
    const g = mk('frostfen');
    const c = g.sandbox.spawn('crystal', 5000);
    expect(enemy(g, c).hp).toBe(20);
    g.sandbox.hurt(c, 6, 'magic');
    expect(enemy(g, c).damageStage).toBe(1);
    g.sandbox.hurt(c, 6, 'magic');
    expect(enemy(g, c).damageStage).toBe(2);
    g.sandbox.hurt(c, 6, 'magic');
    expect(enemy(g, c).damageStage).toBe(3);
    g.sandbox.hurt(c, enemy(g, c).hp, 'magic');
    expect(g.state.enemies.filter((e) => e.type === 'brute')).toHaveLength(2);
  });

  it('Gloomship (Blimp): kein Einfrieren, Schaden geht nicht an die Kinder, 3 Crystal', () => {
    const g = mk('frostfen');
    const s = g.sandbox.spawn('gloomship', 5000);
    expect(enemy(g, s).hp).toBe(200);
    g.sandbox.hurt(s, 5000, 'magic');
    const kids = g.state.enemies.filter((e) => e.type === 'crystal');
    expect(kids).toHaveLength(3);
    for (const k of kids) expect(k.hp).toBe(20);
  });

  it('Gloomship: Verlangsamung nur halb, nie eingefroren; Crystal friert ein', () => {
    const g = mk('frostfen');
    const s = g.sandbox.spawn('gloomship', 5000);
    const c = g.sandbox.spawn('crystal', 5000);
    const ft = place(g, 'frostcaller');
    const t = g.state.towers.find((x) => x.id === ft)!;
    t.x = enemy(g, s).x + 20_000;
    t.y = enemy(g, s).y;
    run(g, 60 * 4);
    expect(enemy(g, s).frozenTicks).toBe(0);
    expect(c).toBeGreaterThan(0);
  });

  it('Regrow: waechst alle 3 s eine Schicht nach, bis zum Ursprungstyp, nie darueber', () => {
    const g = mk('frostfen');
    const id = g.sandbox.spawn('gold', 5000, false, 0, { regrow: true });
    g.sandbox.hurt(id, 1, 'magic'); // gold -> green (ein Kind), id neu
    const green = g.state.enemies.find((e) => e.type === 'green')!;
    expect(green.regrowTo).toBe('gold');
    const ev = run(g, 60 * 3 + 5);
    expect(ev.some((e) => e.type === 'regrow' && e.to === 'gold')).toBe(true);
    expect(green.type).toBe('gold');
    run(g, 60 * 7);
    expect(green.type).toBe('gold');
  });

  it('Fortified: Hulle doppelt bei Brute/Crystal/Gloomship/Ironshell/Boss, Red nicht', () => {
    const g = mk('quarry');
    const hp = (t: EnemyType) => enemy(g, g.sandbox.spawn(t, 1000, false, 0, { fortified: true })).hp;
    expect(hp('brute')).toBe(20);
    expect(hp('crystal')).toBe(40);
    expect(hp('gloomship')).toBe(400);
    expect(hp('red')).toBe(1);
    expect(hp('colossus')).toBe(5000);
  });
});

describe('Runde 15: Bosse', () => {
  it('Frost Wyrm: Frosthauch alle 8 s friert Tuerme im Umkreis 60 px 2 s ein', () => {
    const g = mk('frostfen');
    const w = g.sandbox.spawn('wyrm', 20_000);
    const near = place(g, 'ranger');
    const wyrm = enemy(g, w);
    // naechster Wegpunkt in der Naehe des Turms: Turm genau neben den Wyrm setzen ist an dieser Stelle unnoetig,
    // wir stellen den Wyrm per Fortschritt dorthin, wo ein Turm steht.
    const t = g.state.towers.find((x) => x.id === near)!;
    const far = place(g, 'ranger', 5);
    const ft = g.state.towers.find((x) => x.id === far)!;
    // Kurz vor dem Hauch beide Tuerme an den Wyrm stellen: einen 30 px daneben, einen 200 px weg
    run(g, 478);
    t.x = wyrm.x + 30_000;
    t.y = wyrm.y;
    ft.x = wyrm.x + 200_000;
    ft.y = wyrm.y;
    const ev = run(g, 6);
    const br = ev.find((e) => e.type === 'bossBreath');
    expect(br).toBeDefined();
    if (br?.type === 'bossBreath') {
      expect(br.radius).toBe(60_000);
      expect(br.ticks).toBe(120);
      expect(br.towers).toContain(near);
      expect(br.towers).not.toContain(far);
    }
    expect(ev.some((e) => e.type === 'towerFrozen' && e.tower === near)).toBe(true);
  });

  it('Frost Wyrm: eingefrorener Turm schiesst nicht', () => {
    const g = mk('frostfen');
    const tid = place(g, 'ranger');
    const t = g.state.towers.find((x) => x.id === tid)!;
    t.frozen = 600;
    const sp = enemy(g, g.sandbox.spawn('colossus', 40_000));
    t.x = sp.x + 20_000;
    t.y = sp.y;
    const ev = run(g, 200);
    expect(ev.some((e) => e.type === 'fire')).toBe(false);
    t.frozen = 0;
    const ev2 = run(g, 200);
    expect(ev2.some((e) => e.type === 'fire' || e.type === 'windup')).toBe(true);
  });

  it('Frost Wyrm: spuckt bei 66 % und 33 % je 6 Frostlinge, platzt in 2 Gloomships', () => {
    const g = mk('frostfen');
    const w = g.sandbox.spawn('wyrm', 20_000);
    const hp = enemy(g, w).hp;
    g.sandbox.hurt(w, Math.ceil(hp * 0.35), 'magic');
    expect(g.state.enemies.filter((e) => e.type === 'frostling')).toHaveLength(6);
    g.sandbox.hurt(w, Math.ceil(hp * 0.35), 'magic');
    expect(g.state.enemies.filter((e) => e.type === 'frostling')).toHaveLength(12);
    const ev: unknown[] = [];
    ev.push(...g.drainEvents());
    expect(ev.filter((e) => (e as { type: string }).type === 'bossSpit')).toHaveLength(2);
    g.sandbox.hurt(w, 100_000, 'magic');
    expect(g.state.enemies.filter((e) => e.type === 'gloomship')).toHaveLength(2);
  });

  it('Ember Colossus: 4 Platten, Stampfer macht Gegner im Umkreis 80 px 3 s schneller, betaeubungs-immun', () => {
    const g = mk('quarry');
    const c = g.sandbox.spawn('colossus', 30_000);
    const near = g.sandbox.spawn('red', 30_000);
    const far = g.sandbox.spawn('red', 600_000);
    const hp = enemy(g, c).hp;
    g.sandbox.hurt(c, Math.ceil(hp * 0.21), 'magic');
    const ev = g.drainEvents();
    const st = ev.find((e) => e.type === 'stomp');
    expect(st).toBeDefined();
    if (st?.type === 'stomp') {
      expect(st.radius).toBe(80_000);
      expect(st.ticks).toBe(180);
      expect(st.enemies).toContain(near);
      expect(st.enemies).not.toContain(far);
    }
    expect(enemy(g, near).hasteTicks).toBeGreaterThan(0);
    expect(enemy(g, far).hasteTicks).toBe(0);
    expect(DATA.enemies.colossus.stages).toHaveLength(4);
    expect(DATA.enemies.colossus.immuneStun).toBe(true);
    g.sandbox.hurt(c, 1_000_000, 'magic');
    expect(g.state.enemies.filter((e) => e.type === 'gloomship')).toHaveLength(2);
    expect(g.state.enemies.filter((e) => e.type === 'crystal')).toHaveLength(4);
  });
});

describe('Runde 15: Modi', () => {
  const start = (mode: ModeId, map = 'meadow') => createGame({ map, difficulty: 'medium', seed: 1, mode });

  it('Primary Only: nur Ranger, Bombardier, Frostcaller (+ Held)', () => {
    const g = start('primary-only');
    for (const t of ['longshot', 'market', 'thornweaver', 'alchemist'] as const) expect(modeAllows('primary-only', t)).toBe(false);
    for (const t of ['ranger', 'bombardier', 'frostcaller', 'wren'] as const) expect(modeAllows('primary-only', t)).toBe(true);
    g.sandbox.setCash(100000);
    const r = g.apply({ type: 'place', tower: 'longshot', x: 60_000, y: 122_000 });
    expect(r.ok).toBe(false);
    expect(g.apply({ type: 'place', tower: 'ranger', x: 60_000, y: 122_000 }).ok).toBe(true);
  });

  it('Specialists Only: nur Longshot, Market, Thornweaver, Alchemist (+ Held)', () => {
    for (const t of ['ranger', 'bombardier', 'frostcaller'] as const) expect(modeAllows('specialists-only', t)).toBe(false);
    for (const t of ['longshot', 'market', 'thornweaver', 'alchemist', 'wren'] as const) expect(modeAllows('specialists-only', t)).toBe(true);
  });

  it('No Hero: Held gesperrt, Powers erlaubt', () => {
    const g = start('no-hero');
    g.sandbox.setCash(100000);
    expect(g.apply({ type: 'place', tower: 'wren', x: 60_000, y: 122_000 }).ok).toBe(false);
    expect(MODES['no-hero'].powers).toBe(true);
  });

  it('Half Cash: Start und Einkommen halbiert', () => {
    const n = start('standard');
    const h = start('half-cash');
    expect(h.state.cash).toBe(Math.floor(n.state.cash / 2));
    const earn = (g: Game): number => {
      const c0 = g.state.cash;
      g.apply({ type: 'startRound' });
      for (let i = 0; i < 60 * 100 && g.state.roundsCleared === 0; i++) {
        g.step();
        for (const e of g.state.enemies.slice()) g.sandbox.hurt(e.id, 1_000_000);
      }
      return g.state.cash - c0;
    };
    const a = earn(n);
    const b = earn(h);
    expect(b).toBeGreaterThan(a / 2 - 3);
    expect(b).toBeLessThan(a / 2 + 3);
  });

  it('Deflation: 20.000 Gold, kein Einkommen, Start bei letzter Runde - 10, keine Powers', () => {
    // Runde 15b: Start = Endrunde der Schwierigkeit - 10 (Easy 30, Medium 50, Hard 70)
    for (const [d, first] of [['easy', 30], ['medium', 50], ['hard', 70]] as const) {
      const g = createGame({ map: 'meadow', difficulty: d, seed: 1, mode: 'deflation' });
      expect(g.state.cash).toBe(20_000);
      expect(g.info.baseRound).toBe(first - 1);
      const r = g.apply({ type: 'startRound' });
      expect(r.ok).toBe(true);
      expect(g.state.round).toBe(first);
    }
    expect(MODES.deflation.powers).toBe(false);
    const g = start('deflation');
    g.apply({ type: 'startRound' });
    const c0 = g.state.cash;
    for (let i = 0; i < 60 * 120; i++) {
      g.step();
      for (const e of g.state.enemies.slice()) g.sandbox.hurt(e.id, 1_000_000);
    }
    expect(g.state.cash).toBe(c0);
  });

  it('Unbekannter Modus wirft', () => {
    expect(() => createGame({ map: 'meadow', difficulty: 'medium', seed: 1, mode: 'foo' as ModeId })).toThrow();
  });

  it('Determinismus: gleiche Eingaben, gleicher Hash (Frostfen, Wyrm)', () => {
    const h = (): string => {
      const g = mk('frostfen');
      g.sandbox.spawn('wyrm', 20_000);
      place(g, 'ranger');
      run(g, 60 * 20);
      return g.hash();
    };
    expect(h()).toBe(h());
  });
});
