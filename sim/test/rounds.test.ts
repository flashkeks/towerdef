import { describe, expect, it } from 'vitest';
import { createGame, parseStrategy, runBot } from '../src/index';
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

  it('Sieg nach Runde 20 (Bot, Medium), danach Spielende', () => {
    const r = runBot(parseStrategy('ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0 + hero'), { difficulty: 'medium', seed: 1 });
    expect(r.result).toBe('won');
    expect(r.round).toBe(20);
    expect(r.lives).toBeGreaterThan(0);
  });

  it('Leviathan R20: Leck kostet 412 Leben und beendet das Spiel', () => {
    const g = newGame({ mods: { startCash: -650, lives: 0 } });
    g.sandbox.spawn('leviathan', 1_640_000);
    g.step(600);
    expect(g.state.phase).toBe('lost');
  });
});
