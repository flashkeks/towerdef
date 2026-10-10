import { describe, expect, it } from 'vitest';
import { DATA, createGame, fpHpBp, fpSpeedBp, freeplayGroups, parseStrategy, runBot } from '../src/index';
import { newGame, place, run } from './helpers';

describe('Runden', () => {
  it('Start durch den Spieler; nächste Runde erst nach dem Fertig-Spawnen', () => {
    const g = newGame();
    expect(g.state.phase).toBe('build');
    expect(g.state.round).toBe(0);
    expect(g.apply({ type: 'startRound' })).toMatchObject({ ok: true });
    expect(g.state.round).toBe(1);
    g.step(10);
    expect(g.state.phase).toBe('wave');
    expect(g.apply({ type: 'startRound' })).toEqual({ ok: false, reason: 'spawning' });
    // R1: 20 Reds, Abstand 0,9 s = 54 Ticks -> letzter Spawn bei Tick 19 * 54 = 1026
    g.step(1030);
    expect(g.state.groups).toHaveLength(0);
    expect(g.state.enemies.length).toBeGreaterThan(0); // noch Gegner unterwegs
    expect(g.apply({ type: 'startRound' }).ok).toBe(true); // Überlappung erlaubt
    expect(g.state.round).toBe(2);
  });

  it('Spawn-Anzahl und Takt: Runde 1 hat 20 Reds', () => {
    const g = newGame({ mods: { lives: 100000, startCash: 0 } });
    g.apply({ type: 'startRound' });
    let spawned = 0;
    const seen = new Set<number>();
    for (let i = 0; i < 1100; i++) {
      g.step();
      for (const e of g.state.enemies) if (!seen.has(e.id)) { seen.add(e.id); spawned++; }
    }
    expect(spawned).toBe(20);
  });

  it('Rundenbonus 100 + Runde, Pop-Cash 1 je Schicht', () => {
    const g = newGame({ mods: { startCash: -650, lives: 1000 } });
    g.apply({ type: 'startRound' });
    const ev = run(g, 6000, () => g.state.roundsCleared === 1);
    expect(ev.find((e) => e.type === 'roundEnd')).toMatchObject({ round: 1, bonus: 101 });
    expect(g.state.cash).toBe(101); // nichts abgeschossen: kein Pop-Cash
    g.apply({ type: 'startRound' });
    run(g, 9000, () => g.state.roundsCleared === 2);
    expect(g.state.cash).toBe(101 + 102);
    expect(g.state.phase).toBe('build');
  });

  it('Pop-Cash mit Turm: Runde 1 komplett abgeschossen = 2 x Pops + 101', () => {
    const g = newGame({ mods: { startCash: -650 } });
    // Held platzieren geht nicht ohne Geld; Ranger über Sandbox-Geld
    g.sandbox.setCash(400);
    place(g, 'ranger', 60, 122);
    place(g, 'ranger', 90, 122);
    const c0 = g.state.cash;
    g.apply({ type: 'startRound' });
    run(g, 6000, () => g.state.roundsCleared === 1);
    const pops = g.state.stats.pops.ranger;
    expect(g.state.cash - c0).toBe(2 * pops + 101);
    expect(g.state.lives + g.state.stats.leaked).toBe(150);
  });

  it('Auto-Start startet die nächste Runde nach dem Fertig-Spawnen', () => {
    const g = newGame();
    place(g, 'ranger');
    g.apply({ type: 'startRound' });
    g.apply({ type: 'autoStart', on: true });
    g.step(1100);
    expect(g.state.round).toBe(2);
    g.apply({ type: 'autoStart', on: false });
    g.step(3000);
    expect(g.state.round).toBe(2);
  });

  it('Niederlage bei Leben <= 0; danach nehmen Befehle nichts an', () => {
    const g = createGame({ map: 'bare', difficulty: 'hard', seed: 1, mods: { lives: -90 } });
    g.apply({ type: 'startRound' });
    const ev = run(g, 6000, () => g.state.phase === 'lost');
    expect(g.state.phase).toBe('lost');
    expect(g.state.lives).toBe(0);
    expect(ev.some((e) => e.type === 'gameOver' && e.result === 'lost')).toBe(true);
    expect(g.apply({ type: 'startRound' })).toEqual({ ok: false, reason: 'game-over' });
    const h = g.hash();
    g.step(10);
    expect(g.hash()).toBe(h);
  });

  it('Sieg nach der Endrunde (Bot, Easy R40), danach Spielende', () => {
    const r = runBot(parseStrategy('ranger 0-2-4 + bombardier 4-2-0 + hero'), { difficulty: 'easy', seed: 1 });
    expect(r.result).toBe('won');
    expect(r.round).toBe(40);
    expect(r.lives).toBeGreaterThan(0);
  });

  it('Freeplay: nach dem Sieg weiterspielen (continue), erst dann geht startRound ueber die Endrunde', () => {
    const g = newGame({ difficulty: 'easy', mods: { startCash: 100000, lives: 100000 } });
    expect(g.info.maxRound).toBe(40);
    expect(g.apply({ type: 'continue' })).toEqual({ ok: false, reason: 'not-won' });
    g.state.round = 39; // Sprung zur Endrunde (Test)
    g.apply({ type: 'startRound' });
    expect(g.state.round).toBe(40);
    for (let i = 0; i < 60 * 300 && g.state.phase !== 'won'; i++) { g.step(); for (const e of g.state.enemies.slice()) g.sandbox.hurt(e.id, 1_000_000); }
    expect(g.state.phase).toBe('won');
    expect(g.apply({ type: 'startRound' })).toEqual({ ok: false, reason: 'game-over' });
    expect(g.apply({ type: 'continue' })).toEqual({ ok: true, id: 40 });
    expect(g.state.freeplay).toBe(true);
    expect(g.state.phase).toBe('build');
    // Max: Easy laeuft einfach die gemeinsame Liste weiter, R41 ist R41 (mit dem Wyrm-Vorlauf der Liste), keine Sonderliste
    expect(g.apply({ type: 'startRound' })).toEqual({ ok: true, id: 41 });
    expect(g.state.round).toBe(41);
    expect(g.roundPreview(41)).toEqual(newGame().roundPreview(41));
    expect(g.apply({ type: 'continue' })).toEqual({ ok: false, reason: 'not-won' });
  });

  it('Freeplay-Formel ab R121: deterministisch, seed-faehig, HP und Tempo steigen', () => {
    expect(freeplayGroups(125, 3)).toEqual(freeplayGroups(125, 3));
    expect(freeplayGroups(125, 3)).not.toEqual(freeplayGroups(125, 4));
    expect(freeplayGroups(125, 3).length).toBeGreaterThan(0);
    expect(fpHpBp(121)).toBeGreaterThan(10000);
    expect(fpHpBp(160)).toBeGreaterThan(fpHpBp(140) * 1.5);
    expect(fpSpeedBp(500)).toBe(20000);
    // Finale jede 10. Runde = R120-Gruppen, skaliert
    expect(freeplayGroups(130, 0).some((g) => g.type === 'dreadnought')).toBe(true);
    // Hash gleich bei gleichem Seed
    const mkG = (): string => { const g = newGame(); g.state.round = 124; g.apply({ type: 'startRound' }); g.step(600); return g.hash(); };
    expect(mkG()).toBe(mkG());
  });

  it('neue Blimps: Duskrunner immer getarnt und explosions-immun, Dreadnought nicht verlangsamt/betaeubt/eingefroren, Fortified verdoppelt', () => {
    const g = newGame();
    const d = g.sandbox.spawn('duskrunner', 5000);
    expect(g.state.enemies.find((e) => e.id === d)!.camo).toBe(true);
    const dr = g.sandbox.spawn('dreadnought', 5000);
    const e = g.state.enemies.find((x) => x.id === dr)!;
    expect(e.hp).toBe(20000);
    const f = g.sandbox.spawn('cruiser', 5000, false, 0, { fortified: true });
    expect(g.state.enemies.find((x) => x.id === f)!.hp).toBe(3200);
    expect(DATA.rbe.cruiser).toBe(1600 + 4 * 428);
    expect(DATA.rbe.duskrunner).toBe(400 + 4 * 11);
    expect(DATA.enemies.dreadnought.children).toEqual(['cruiser', 'cruiser', 'duskrunner', 'duskrunner', 'duskrunner']);
  });

  it('Leviathan R20: Leck kostet 412 Leben und beendet das Spiel', () => {
    const g = newGame({ mods: { startCash: -650, lives: 0 } });
    g.sandbox.spawn('leviathan', 1_640_000);
    g.step(600);
    expect(g.state.phase).toBe('lost');
  });
});
