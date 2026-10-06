import { describe, expect, it } from 'vitest';
import { GameBus, type CommandRecord } from '../src/game/events';
import { Session } from '../src/game/session';
import { TICK_MS } from '../src/view/model';

describe('GameBus', () => {
  it('verteilt Ereignisse an alle Abonnenten, Abmelden wirkt', () => {
    const bus = new GameBus();
    const a: number[] = [];
    const b: number[] = [];
    const offA = bus.onEvents((ev, tick) => a.push(ev.length * 1000 + tick));
    bus.onEvents((ev) => b.push(ev.length));
    bus.emitEvents([], 1); // leere Stapel werden nicht verteilt
    bus.emitEvents([{ type: 'leak', damage: 1 } as never], 7);
    offA();
    bus.emitEvents([{ type: 'leak', damage: 1 } as never], 8);
    expect(a).toEqual([1007]);
    expect(b).toEqual([1, 1]);
  });

  it('Session meldet Sim-Ereignisse, Befehle mit Tick und Steuerung am Bus', () => {
    const bus = new GameBus();
    const s = new Session('normal', 1, bus);
    const cmds: CommandRecord[] = [];
    const controls: string[] = [];
    let batches = 0;
    bus.onCommand((c) => cmds.push(c));
    bus.onControl((c) => controls.push(c.type));
    bus.onEvents(() => batches++);

    s.choosePlacing('striker');
    s.clickSlot(0);
    expect(cmds).toHaveLength(1);
    expect(cmds[0]).toMatchObject({ tick: 0, player: 0, cmd: { type: 'place', unitId: 'striker', slot: 0 } });
    expect(cmds[0].result.ok).toBe(true);

    s.startNextWave();
    for (let i = 0; i < 40; i++) s.advance(TICK_MS + 0.01);
    s.setSpeed(2);
    s.togglePause();
    expect(controls).toEqual(['speed', 'pause']);
    expect(cmds[1].cmd.type).toBe('skipWave');
    expect(batches).toBeGreaterThan(0);
  });
});
