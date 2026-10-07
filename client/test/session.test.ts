import { describe, expect, it } from 'vitest';
import { Session } from '../src/game/session';
import { hasKey } from '../src/i18n/t';
import { TICK_MS } from '../src/view/model';
import { BossTracker } from '../src/view/telegraph';
import { createSim, loadBrowserData, STAGE_ID, type SimEvent } from '../src/sim';

describe('Session', () => {
  it('taktet die Sim mit festem Tick (20/s) und Geschwindigkeit', () => {
    const s = new Session('normal', 1);
    for (let i = 0; i < 5; i++) s.advance(TICK_MS * 2 + 0.01);
    expect(s.sim.state.tick).toBe(10);
    s.setSpeed(3);
    for (let i = 0; i < 5; i++) s.advance(TICK_MS * 2 + 0.01);
    expect(s.sim.state.tick).toBe(40);
  });
  it('Pause und Desktop-Sperre halten die Sim an', () => {
    const s = new Session('normal', 1);
    s.togglePause();
    s.advance(1000);
    expect(s.sim.state.tick).toBe(0);
    s.togglePause();
    s.blocked = true;
    s.advance(1000);
    expect(s.sim.state.tick).toBe(0);
    s.blocked = false;
    s.advance(200);
    expect(s.sim.state.tick).toBeGreaterThan(0);
  });
  it('Platzieren ueber Feld-Klick, Upgrade, Verkauf', () => {
    const s = new Session('normal', 1);
    const coins0 = s.sim.state.players[0].coins;
    s.choosePlacing('ichigo');
    s.clickBoard(3000, 3000);
    expect(s.placing).toBeNull(); // ohne Shift: Wahl verbraucht
    expect(s.sim.state.units).toHaveLength(1);
    expect(s.sim.state.players[0].coins).toBeLessThan(coins0);
    s.clickBoard(3100, 3050); // Klick auf die Unit waehlt sie
    expect(s.selectedUnit).toBe(s.sim.state.units[0].id);
    expect(s.placing).toBeNull();
    s.upgrade();
    expect(s.sim.state.units[0].level).toBe(1);
    s.sell();
    expect(s.sim.state.units).toHaveLength(0);
    expect(s.selectedUnit).toBeNull();
  });
  it('Fehler der Sim werden zu Toast-Schluesseln, die es in en.ts gibt', () => {
    const s = new Session('normal', 1);
    (s.sim.state.players[0] as { coins: number }).coins = 0;
    s.choosePlacing('ichigo');
    s.clickBoard(3000, 3000);
    expect(s.sim.state.units).toHaveLength(0);
    expect(s.toast).not.toBeNull();
    expect(hasKey(s.toast!.key)).toBe(true);
    s.choosePlacing('krillin'); // Hill-Unit auf Boden
    s.clickBoard(3000, 3000);
    expect(hasKey(s.toast!.key)).toBe(true);
  });
  it('Wellenstart und Risikokarte laufen ueber Sim-Befehle', () => {
    const s = new Session('normal', 1);
    s.chooseCard('swift');
    expect(s.sim.state.nextCard).toBe('swift');
    s.startNextWave();
    s.advance(TICK_MS * 3);
    expect(s.sim.state.wave).toBe(1);
  });
  it('Vorschau ist gecacht und folgt der Kartenwahl', () => {
    const s = new Session('normal', 1);
    const a = s.nextPreview(1);
    expect(s.nextPreview(1)).toBe(a);
    s.chooseCard('swarm');
    const b = s.nextPreview(1);
    expect(b).not.toBe(a);
    expect(b!.card).toBe('swarm');
  });
});

describe('BossTracker', () => {
  it('Telegraph, Fenster, Schild aus Events', () => {
    const tr = new BossTracker();
    const ev: SimEvent[] = [
      { type: 'bossTelegraph', tick: 100, enemyId: 5, kit: 'warden', ability: 'surge', kind: 'charge', warnTicks: 40, fireTick: 140, interruptible: true },
      { type: 'bossWard', tick: 100, enemyId: 5, state: 'up', hp: 1000 },
      { type: 'bossPhase', tick: 100, enemyId: 5, kit: 'warden', phase: 1, id: 'ward', name: 'Stoneward' },
    ];
    tr.consume(ev);
    expect(tr.telegraphs.get(5)?.fireTick).toBe(140);
    expect(tr.wards.has(5)).toBe(true);
    expect(tr.phases.get(5)?.id).toBe('ward');
    tr.consume([{ type: 'bossCast', tick: 140, enemyId: 5, kit: 'warden', ability: 'surge', kind: 'charge', interrupted: false }, { type: 'bossWindow', tick: 140, enemyId: 5, open: true, damageBp: 16000, ticks: 80, cause: 'cast' }]);
    expect(tr.telegraphs.has(5)).toBe(false);
    expect(tr.windows.get(5)?.untilTick).toBe(220);
    tr.prune(221, new Set([5]));
    expect(tr.windows.size).toBe(0);
    tr.prune(300, new Set());
    expect(tr.wards.size).toBe(0);
  });
  it('faengt einen echten Boss-Telegraph der Sim (Wave 10)', () => {
    const data = loadBrowserData();
    const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 2, data, godMode: true });
    const tr = new BossTracker();
    let seen = false;
    for (let i = 0; i < 20000 && !sim.isOver() && !seen; i++) {
      sim.step(1);
      const ev = sim.drainEvents();
      tr.consume(ev);
      if (tr.telegraphs.size > 0) seen = true;
    }
    expect(seen).toBe(true);
  });
});
