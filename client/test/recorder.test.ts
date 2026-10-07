import { describe, expect, it } from 'vitest';
import { GameBus } from '../src/game/events';
import { Recorder, REPLAY_FORMAT, replayFileName } from '../src/game/recorder';
import { Session } from '../src/game/session';
import { TICK_MS } from '../src/view/model';

function setup(seed = 7) {
  const bus = new GameBus();
  const rec = new Recorder(bus);
  const s = new Session('normal', seed, bus);
  bus.emitRunStart(s);
  return { bus, rec, s };
}

describe('Recorder v3: Unit-Mods im Kopf', () => {
  it('Session reicht unitMods an die Sim durch, der Recorder schreibt sie mit', () => {
    const bus = new GameBus();
    const rec = new Recorder(bus);
    const mods = [{ player: 0, unit: 'ichigo', lvlBp: 21750 }];
    const s = new Session('normal', 5, bus, mods);
    bus.emitRunStart(s);
    s.choosePlacing('ichigo');
    s.clickBoard(3000, 3000);
    expect(s.sim.state.units[0].lvlBp).toBe(21750);
    const snap = rec.snapshot()!;
    expect(snap.unitMods).toEqual(mods);
    expect(snap.unitMods).not.toBe(mods); // Kopie
  });
});

describe('Recorder (nur am GameBus)', () => {
  it('zeichnet Befehle (auch abgelehnte), Steuerung und Wellen auf', () => {
    const { rec, s } = setup();
    s.choosePlacing('ichigo');
    s.clickBoard(3000, 3000);
    s.choosePlacing('ichigo');
    s.clickBoard(3000, 3000); // Unit darunter -> waehlt nur aus, kein Befehl
    s.choosePlacing('krillin');
    s.clickBoard(5000, 3000); // Gunner braucht einen Huegel: abgelehnt
    s.setSpeed(2);
    s.togglePause();
    s.togglePause();
    s.startNextWave();
    for (let i = 0; i < 40; i++) s.advance(TICK_MS * 2);
    const snap = rec.snapshot()!;
    expect(snap.format).toBe(REPLAY_FORMAT);
    expect(snap.formatVersion).toBe(4);
    expect(snap.unitMods).toEqual([]); // Standard: neutral
    expect(snap.commands[0].cmd).toMatchObject({ type: 'place', x: 3000, y: 3000 });
    expect(snap.seed).toBe(7);
    expect(snap.difficulty).toBe('normal');
    expect(snap.complete).toBe(false);
    expect(snap.commands.map((c) => c.cmd.type)).toEqual(['place', 'place', 'skipWave']);
    expect(snap.commands.some((c) => !c.ok && c.reason)).toBe(true);
    expect(snap.controls.map((c) => c.type)).toEqual(['speed', 'pause', 'pause']);
    expect(snap.waves.length).toBeGreaterThan(0);
    expect(snap.endHash).toBe(s.sim.hash());
    expect(snap.endTick).toBe(s.sim.state.tick);
    expect(replayFileName(snap)).toMatch(/^duskwardens-normal-pause-\d{4}-\d{2}-\d{2}\.json$/);
  });
  it('Rundenende: complete, Ergebnis, Freitext; neue Runde setzt zurueck', () => {
    const { bus, rec, s } = setup(3);
    s.startNextWave();
    for (let i = 0; i < 4000 && !s.over; i++) s.advance(TICK_MS * 8);
    expect(s.over).toBe(true);
    bus.emitRunEnd(s);
    rec.setFeedback('too hard');
    const snap = rec.snapshot()!;
    expect(snap.complete).toBe(true);
    expect(snap.result).toBe('loss');
    expect(snap.feedback).toBe('too hard');
    expect(replayFileName(snap)).toMatch(/-loss-/);
    bus.emitRunStart(new Session('hard', 4, bus));
    expect(rec.snapshot()!.commands).toEqual([]);
    expect(rec.snapshot()!.difficulty).toBe('hard');
  });
});
